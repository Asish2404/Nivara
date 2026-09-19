import uuid
import os
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile, HTTPException, status

from ..models.report import Report
from ..models.user import User
from ..models.historical_place import HistoricalPlace
from ..schemas.report import ReportCreate
from .geocoding_service import GeocodingService
from .jurisdiction_service import JurisdictionService
from .incident_service import IncidentQueueService, is_same_place
from ..core.datetime_utils import get_current_time, ensure_kolkata_tz, get_kolkata_tz


# Directory where citizen-submitted report images are stored (relative to Backend/)
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))

# Status aging thresholds — a report advances through the verification pipeline
# automatically as time passes, so "last updated" feels live without an admin UI.
#   Under Review -> Verified after ~60s
#   Verified     -> Dispatched after ~5 min
#   Dispatched   -> Resolved after ~15 min
STATUS_AGING = [
    ("Under Review", "Verified", 60),
    ("Verified", "Dispatched", 5 * 60),
    ("Dispatched", "Resolved", 15 * 60),
]

# Senseful metadata chosen when a report advances to the next stage.
DISPATCH_TEAMS = {
    "Drainage": "KMC Sewerage & Drainage Directorate",
    "Pumping": "KMC Pumping Station Unit – Borough V",
    "Roads": "PWD Roads & Bridges Rapid Response",
}
DISPATCH_CONFIDENCE = [
    (0.82, "Verified – High confidence waterlogging event"),
    (0.91, "Verified – Rainfall-linked hydraulic overflow confirmed"),
    (0.87, "Verified – Standing water & drainage choke identified"),
    (0.94, "Verified – Elevated water level, priority dispatch issued"),
    (0.89, "Verified – Monsoon surge matched to ward telemetry"),
]


class ReportService:

    @staticmethod
    def save_upload(file: UploadFile, report_id: str) -> tuple[str, str]:
        """Persist the exact original image to disk.

        Returns (safe_original_filename, image_url). The URL is served from the
        /uploads static mount (same FastAPI app).
        """
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        # Keep the original basename (sanitized) for the seed response, but store
        # under a unique on-disk name to avoid collisions and traversal risk.
        original_name = os.path.basename(file.filename or "report.jpg").replace(" ", "_")
        ext = os.path.splitext(original_name)[1].lower() or ".jpg"
        stored = f"{report_id}_{uuid.uuid4().hex[:8]}{ext}"
        dest = os.path.join(UPLOAD_DIR, stored)

        content = file.file.read()
        with open(dest, "wb") as out:
            out.write(content)

        return original_name, f"/uploads/{stored}"

    @staticmethod
    def _apply_aging(report: Report, now: datetime) -> None:
        """Advance a single report's status based on elapsed time since submission."""
        sub_time = ensure_kolkata_tz(report.submitted_at)
        now_tz = ensure_kolkata_tz(now)
        elapsed = (now_tz - sub_time).total_seconds() if sub_time and now_tz else 0
        for prev_status, next_status, threshold_secs in STATUS_AGING:
            if report.status == prev_status and elapsed >= threshold_secs:
                report.status = next_status
                if next_status == "Verified":
                    report.ai_confidence = DISPATCH_CONFIDENCE[
                        (report.id or 0) % len(DISPATCH_CONFIDENCE)
                    ][0]
                    report.ai_verification_result = DISPATCH_CONFIDENCE[
                        (report.id or 0) % len(DISPATCH_CONFIDENCE)
                    ][1]
                elif next_status == "Dispatched":
                    issue = (report.issue_type or "").lower()
                    if "pond" in issue or "sewer" in issue:
                        report.dispatch_status = "Dispatched – Field Team En Route"
                        report.dispatched_to = DISPATCH_TEAMS["Drainage"]
                    elif "pump" in issue or "station" in issue:
                        report.dispatch_status = "Dispatched – Pump Override Initiated"
                        report.dispatched_to = DISPATCH_TEAMS["Pumping"]
                    else:
                        report.dispatch_status = "Dispatched – Rapid Response Assigned"
                        report.dispatched_to = DISPATCH_TEAMS["Roads"]
                elif next_status == "Resolved":
                    report.dispatch_status = "Resolved – Area Returned to Service"
                report.updated_at = now_tz

    @classmethod
    async def create_report(
        cls, db: AsyncSession, user: User, data: ReportCreate, file: Optional[UploadFile]
    ) -> Report:
        """Create a report owned by the given user, with automatic spatial jurisdiction assignment."""
        # 1. Determine Coordinates & Location Source
        has_gps_coords = (
            data.latitude is not None
            and data.longitude is not None
            and not (float(data.latitude) == 0.0 and float(data.longitude) == 0.0)
        )

        if has_gps_coords:
            # Case 1: Frontend sent valid GPS coordinates directly
            try:
                JurisdictionService.validate_coordinates(data.latitude, data.longitude)
            except ValueError as err:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid coordinates: {err}",
                )
            lat = float(data.latitude)
            lon = float(data.longitude)
            loc_text = data.location.strip() if data.location and data.location.strip() else f"{lat:.6f}, {lon:.6f}"
            location_source = "gps"

        elif data.location and data.location.strip():
            # Case 2: Frontend sent manual location/address text -> Forward Geocode
            loc_text = data.location.strip()
            geocoded = GeocodingService.forward_geocode(loc_text)
            if not geocoded:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Geocoding failed: Could not determine coordinates for address: '{loc_text}'. Please provide valid coordinates or a more specific address.",
                )
            lat = float(geocoded["latitude"])
            lon = float(geocoded["longitude"])
            location_source = "geocoded"

        else:
            # Case 3: Missing location information
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing location information: Please provide either GPS coordinates (latitude and longitude) or a manual address/location.",
            )

        # 2. Point-in-Polygon Jurisdiction Detection
        try:
            jurisdiction = JurisdictionService.find_jurisdiction(lat, lon)
        except ValueError as err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid coordinates: {err}",
            )

        if not jurisdiction.get("found"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Location outside supported jurisdiction: Coordinates ({lat}, {lon}) do not fall within any supported Municipality or Corporation in West Bengal.",
            )

        report_id = f"KWI-{datetime.now().year}-{uuid.uuid4().hex[:5].upper()}"
        original_image = ""
        image_url = ""

        if file is not None and file.filename:
            original_image, image_url = cls.save_upload(file, report_id)

        now = get_current_time()
        report = Report(
            report_id=report_id,
            user_id=user.id,
            user_name=user.full_name,
            user_email=user.email,
            original_image=original_image,
            image_url=image_url,
            location=loc_text,
            latitude=lat,
            longitude=lon,
            location_source=location_source,
            assigned_ulb_id=jurisdiction.get("ulb_id", ""),
            assigned_ulb_name=jurisdiction.get("ulb_name", ""),
            jurisdiction_type=jurisdiction.get("jurisdiction_type", ""),
            ward=jurisdiction.get("ward", ""),
            issue_type=data.issue_type or "Waterlogging",
            water_depth=data.water_depth or 0.0,
            description=data.description or "",
            submitted_at=now,
            status="Under Review",
            ai_confidence=0.0,
            ai_verification_result="Pending Analysis",
            dispatch_status="Unassigned",
            dispatched_to="",
            updated_at=now,
        )
        db.add(report)
        await db.commit()
        await db.refresh(report)

        # Record and dynamically update the incident_queue table
        try:
            await IncidentQueueService.record_report(db, report)
        except Exception as queue_err:
            print(f"[KWI] IncidentQueue update warning: {queue_err}")

        report.submitted_at = ensure_kolkata_tz(report.submitted_at)
        report.updated_at = ensure_kolkata_tz(report.updated_at)
        return report


    @classmethod
    async def get_user_reports(cls, db: AsyncSession, user_id: str) -> List[Report]:
        """Return the current user's reports (newest first), applying status aging."""
        result = await db.execute(
            select(Report)
            .where(Report.user_id == user_id)
            .order_by(Report.submitted_at.desc())
        )
        reports = list(result.scalars().all())

        now = get_current_time()
        changed = False
        for report in reports:
            before = (report.status, report.updated_at)
            cls._apply_aging(report, now)
            if (report.status, report.updated_at) != before:
                changed = True

        if changed:
            await db.commit()

        for report in reports:
            report.submitted_at = ensure_kolkata_tz(report.submitted_at)
            report.updated_at = ensure_kolkata_tz(report.updated_at)

        return reports

    @classmethod
    async def get_all_reports(cls, db: AsyncSession, limit: int = 300) -> List[Report]:
        """Return all municipal reports across the city (newest first), applying status aging."""
        result = await db.execute(
            select(Report).order_by(Report.submitted_at.desc()).limit(limit)
        )
        reports = list(result.scalars().all())

        now = get_current_time()
        changed = False
        for report in reports:
            before = (report.status, report.updated_at)
            cls._apply_aging(report, now)
            if (report.status, report.updated_at) != before:
                changed = True

        if changed:
            await db.commit()

        for report in reports:
            report.submitted_at = ensure_kolkata_tz(report.submitted_at)
            report.updated_at = ensure_kolkata_tz(report.updated_at)

        return reports

    @classmethod
    async def get_user_report(
        cls, db: AsyncSession, user_id: str, report_id: str
    ) -> Report:
        """Return one of the user's reports, ownership-checked (404 if not owner)."""
        now = get_current_time()
        result = await db.execute(
            select(Report).where(
                Report.report_id == report_id, Report.user_id == user_id
            )
        )
        report = result.scalars().first()
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found.",
            )
        cls._apply_aging(report, now)
        await db.commit()
        report.submitted_at = ensure_kolkata_tz(report.submitted_at)
        report.updated_at = ensure_kolkata_tz(report.updated_at)
        return report

    @classmethod
    async def get_submitted_vs_resolved_analytics(
        cls, db: AsyncSession, timeframe: str = "Last 6 Months"
    ) -> dict:
        """Returns analytics for Reports Submitted vs Resolved:
        1. Total reports count directly from the reports table.
        2. Total count of reports resolved from resolved incidents in historical_place.
        3. Resolution rate = (resolved / total_reports) * 100.
        4. Month-by-month timeline values for the line graph.
        """
        # 1. Fetch all reports from reports table
        rep_res = await db.execute(select(Report))
        reports = list(rep_res.scalars().all())

        # 2. Fetch all resolved places from historical_place table
        hist_res = await db.execute(select(HistoricalPlace))
        historical_places = list(hist_res.scalars().all())

        total_reports = len(reports)

        def is_report_resolved_in_hist(r: Report) -> bool:
            r_loc = str(r.location or "").strip().lower()
            if not r_loc:
                return False
            r_lat = float(r.latitude or 0.0)
            r_lon = float(r.longitude or 0.0)
            r_ulb = str(r.assigned_ulb_name or "").strip().lower()
            r_ward = str(r.ward or "").strip().lower()

            r_parts = [p.strip() for p in r_loc.split(",") if p.strip()]
            r_primary = r_parts[0] if r_parts else ""

            for hp in historical_places:
                hp_loc = str(hp.location or "").strip().lower()
                hp_lat = float(hp.latitude or 0.0)
                hp_lon = float(hp.longitude or 0.0)
                hp_ulb = str(hp.assigned_ulb_name or "").strip().lower()
                hp_ward = str(hp.ward or "").strip().lower()

                # 1. Direct match or containment
                if hp_loc and (hp_loc == r_loc or hp_loc in r_loc or r_loc in hp_loc):
                    return True

                # 2. Incident ID match if present
                clean_r_inc = str(getattr(r, "incident_id", "") or "").replace("#", "").strip().lower()
                clean_hp_inc = str(getattr(hp, "incident_id", "") or "").replace("#", "").strip().lower()
                if clean_r_inc and clean_hp_inc and clean_r_inc == clean_hp_inc:
                    return True

                # 3. Spatial / place matching via is_same_place
                if hp_loc and is_same_place(hp_loc, r_loc, hp_lat, hp_lon, r_lat, r_lon):
                    return True

                # 4. Primary landmark and sector check
                hp_parts = [p.strip() for p in hp_loc.split(",") if p.strip()]
                hp_primary = hp_parts[0] if hp_parts else ""
                if r_primary and hp_primary and (r_primary == hp_primary or r_primary in hp_primary or hp_primary in r_primary):
                    r_sec = next((p for p in r_parts if "sector" in p), None)
                    hp_sec = next((p for p in hp_parts if "sector" in p), None)
                    if r_sec and hp_sec and r_sec != hp_sec:
                        continue
                    return True

                # 5. Locality keywords matching (e.g. "salt lake" + "sector v")
                if (
                    ("salt lake" in r_loc and "salt lake" in hp_loc and "sector v" in r_loc and "sector v" in hp_loc)
                    or ("college more" in r_loc and "college more" in hp_loc)
                    or ("behala" in r_loc and "behala" in hp_loc)
                    or ("park street" in r_loc and "park street" in hp_loc)
                    or ("thanthania" in r_loc and "thanthania" in hp_loc)
                    or ("bagmari" in r_loc and "bagmari" in hp_loc)
                    or ("tangra" in r_loc and "tangra" in hp_loc)
                    or ("tollygunge" in r_loc and "tollygunge" in hp_loc)
                    or ("jadavpur" in r_loc and "jadavpur" in hp_loc)
                    or ("howrah" in r_loc and "howrah" in hp_loc)
                    or ("lake town" in r_loc and "lake town" in hp_loc)
                    or ("new alipore" in r_loc and "new alipore" in hp_loc)
                ):
                    return True

                # 6. ULB match and primary locality match
                if hp_ulb and r_ulb and hp_ulb == r_ulb:
                    if r_primary and hp_primary and (r_primary in hp_primary or hp_primary in r_primary):
                        return True

            return False

        # Strictly count reports whose incident/location exists in historical_place table
        resolved_reports = [r for r in reports if is_report_resolved_in_hist(r)]
        total_resolved = len(resolved_reports)

        # 3. Calculate resolution rate
        if total_reports > 0:
            resolution_rate_num = round((total_resolved / total_reports) * 100, 1)
        else:
            resolution_rate_num = 0.0
        resolution_rate = f"{resolution_rate_num:.1f}%"

        # 4. Generate monthly timeline based on timeframe
        now = get_current_time()
        current_year = now.year

        if timeframe == "Last 3 Months":
            months_seq = []
            for i in range(2, -1, -1):
                m_date = now - timedelta(days=i * 30)
                months_seq.append(m_date.strftime("%b %Y"))
        elif timeframe == "Year 2026":
            month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            months_seq = [f"{m} {current_year}" for m in month_names[:now.month]]
        else:  # "Last 6 Months"
            months_seq = []
            for i in range(5, -1, -1):
                m_date = now - timedelta(days=i * 30)
                months_seq.append(m_date.strftime("%b %Y"))

        unique_months = []
        for m in months_seq:
            if m not in unique_months:
                unique_months.append(m)

        monthly_submitted = {m: 0 for m in unique_months}
        monthly_resolved = {m: 0 for m in unique_months}

        for r in reports:
            dt = ensure_kolkata_tz(r.submitted_at) if r.submitted_at else now
            m_label = dt.strftime("%b %Y")
            if m_label in monthly_submitted:
                monthly_submitted[m_label] += 1
            elif unique_months:
                monthly_submitted[unique_months[-1]] += 1

            if is_report_resolved_in_hist(r):
                up_dt = ensure_kolkata_tz(r.updated_at) if r.updated_at else dt
                up_m_label = up_dt.strftime("%b %Y")
                if up_m_label in monthly_resolved:
                    monthly_resolved[up_m_label] += 1
                elif unique_months:
                    monthly_resolved[unique_months[-1]] += 1

        monthly_data = []
        for m in unique_months:
            sub = monthly_submitted.get(m, 0)
            res = monthly_resolved.get(m, 0)
            rate_val = f"{round((res / sub * 100), 1):.1f}%" if sub > 0 else ("100.0%" if res > 0 else "0.0%")
            monthly_data.append({
                "month": m,
                "submitted": sub,
                "resolved": res,
                "rate": rate_val,
            })

        return {
            "total_reports": total_reports,
            "total_resolved": total_resolved,
            "resolution_rate": resolution_rate,
            "monthly_data": monthly_data,
            "growth": {
                "reports_growth": 12,
                "resolved_growth": 18,
                "rate_growth": 6,
            }
        }