import math
from collections import Counter
from datetime import datetime
from typing import List, Optional, Union
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.incident_queue import IncidentQueue
from ..models.report import Report
from ..core.datetime_utils import get_current_time, ensure_kolkata_tz


def calculate_most_frequent_water_depth(depths: List[Union[int, float]]) -> float:
    """Calculate the water depth that appears most frequently (statistical mode) for a location.

    - When 1 report is generated: returns that depth as usual.
    - When multiple reports are generated: counts which water depth comes many times.
      e.g. for depths [30, 15, 0, 30], 30 comes 2 times, 15 and 0 come 1 time -> returns 30.0 cm.
    - Ties: In case of equal highest frequency, returns the highest depth among the tied candidates.
    """
    if not depths:
        return 0.0
    if len(depths) == 1:
        val = float(depths[0]) if depths[0] is not None else 0.0
        return round(val, 1)

    normalized = [round(float(d or 0.0), 1) for d in depths]
    counts = Counter(normalized)

    max_frequency = max(counts.values())
    candidates = [depth for depth, freq in counts.items() if freq == max_frequency]

    return float(max(candidates))


def generate_incident_id(location: str) -> str:
    """Generate an incident ID in the format 'XX-NNN' (e.g. SA-754, CO-493, PA-451).
    Uses a deterministic hash of the location so the ID is stable for the same area.
    """
    if not location or not isinstance(location, str):
        return "IN-101"

    letters_only = "".join(c for c in location.strip() if c.isalpha())
    if len(letters_only) >= 2:
        prefix = letters_only[:2].upper()
    else:
        prefix = (letters_only + "XX")[:2].upper()

    h = 0
    for char in location:
        h = ((h << 5) - h) + ord(char)
        h &= 0xFFFFFFFF  # 32-bit integer

    random_num = abs(h % 900) + 100  # 100 to 999
    return f"{prefix}-{random_num}"


def compute_severity(report_count: int = 1, water_depth: float = 0.0) -> str:
    """Assigns severity / risk_level category based on report count & physical water depth (cm):
    - CRITICAL: >= 5 reports OR (>= 3 reports and >= 25 cm depth)
    - HIGH: >= 3 reports OR (>= 2 reports and >= 20 cm depth)
    - MODERATE: >= 2 reports OR >= 15 cm depth
    - LOW: >= 1 report
    - MONITORING: 0 reports
    """
    if report_count >= 5 or (report_count >= 3 and water_depth >= 25.0):
        return "CRITICAL"
    if report_count >= 3 or (report_count >= 2 and water_depth >= 20.0):
        return "HIGH"
    if report_count >= 2 or water_depth >= 15.0:
        return "MODERATE"
    if report_count >= 1:
        return "LOW"
    return "MONITORING"


def get_severity_rank(severity: str) -> int:
    sev = (severity or "").upper()
    ranks = {
        "CRITICAL": 5,
        "HIGH": 4,
        "MODERATE": 3,
        "MEDIUM": 3,
        "LOW": 2,
        "MONITORING": 1,
    }
    return ranks.get(sev, 0)


def normalize_location(location: str) -> str:
    if not location:
        return ""
    return " ".join(location.strip().lower().split())


def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance between two coordinates in kilometers."""
    if lat1 == 0.0 or lon1 == 0.0 or lat2 == 0.0 or lon2 == 0.0:
        return 999.0
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def format_subdivision(location: str, ward: str = "", ulb_name: str = "") -> str:
    primary_name = location.split(",")[0].strip().upper() if location else "LOCALITY"
    if ward and str(ward).strip():
        return f"{primary_name} // {str(ward).strip().upper()}"
    if ulb_name and ulb_name.strip():
        return f"{primary_name} // {ulb_name.strip().upper()}"
    return f"{primary_name} // LOCAL MUNICIPALITY"


def is_same_place(
    loc1: str,
    loc2: str,
    lat1: float = 0.0,
    lon1: float = 0.0,
    lat2: float = 0.0,
    lon2: float = 0.0,
) -> bool:
    norm1 = normalize_location(loc1)
    norm2 = normalize_location(loc2)
    if not norm1 or not norm2:
        return False

    # 1. Exact normalized match
    if norm1 == norm2:
        return True

    # 2. Split comma-separated tokens
    parts1 = [p.strip() for p in norm1.split(",") if p.strip()]
    parts2 = [p.strip() for p in norm2.split(",") if p.strip()]

    p1_primary = parts1[0] if parts1 else ""
    p2_primary = parts2[0] if parts2 else ""

    # If primary landmark/area names match (e.g. "salt lake", "college more", "park street")
    if p1_primary and p2_primary and p1_primary == p2_primary:
        # Avoid merging different sectors/wards (e.g., Sector V vs Sector III)
        if len(parts1) > 1 and len(parts2) > 1:
            sec1 = parts1[1]
            sec2 = parts2[1]
            if "sector" in sec1 and "sector" in sec2 and sec1 != sec2:
                return False
        return True

    # 3. Clean containment only if primary landmark names agree
    if (norm1 in norm2 or norm2 in norm1) and p1_primary == p2_primary:
        return True

    return False


class IncidentQueueService:

    @classmethod
    async def record_report(cls, db: AsyncSession, report: Report) -> IncidentQueue:
        """Stores report details in incident_queue table:
        1. If the place or area is same for more than one report -> report_count is incremented by 1 in the existing row.
        2. If place/area is not in table -> stored in a new row with details.
        """
        loc_str = (report.location or "").strip()
        lat = float(report.latitude or 0.0)
        lon = float(report.longitude or 0.0)
        depth = float(report.water_depth or 0.0)

        # Query all active / ongoing incidents to find match
        result = await db.execute(
            select(IncidentQueue).where(
                or_(
                    IncidentQueue.status == "ACTIVE",
                    IncidentQueue.status == "Needs Intervention",
                    IncidentQueue.status == "Under Review",
                )
            )
        )
        active_incidents = list(result.scalars().all())

        matched_incident: Optional[IncidentQueue] = None

        for inc in active_incidents:
            if is_same_place(
                inc.location,
                loc_str,
                inc.latitude,
                inc.longitude,
                lat,
                lon,
            ):
                matched_incident = inc
                break

        now = get_current_time()

        if matched_incident is not None:
            # Case 1: Same place or area -> query all reports for this location to compute mode depth & count
            reports_res = await db.execute(select(Report))
            all_reports = list(reports_res.scalars().all())

            location_reports = [
                r for r in all_reports
                if is_same_place(
                    r.location,
                    matched_incident.location,
                    r.latitude,
                    r.longitude,
                    matched_incident.latitude,
                    matched_incident.longitude,
                )
            ]

            # Ensure current report is included if not yet present
            already_in = False
            for r in location_reports:
                if (report.id and r.id == report.id) or (report.report_id and r.report_id == report.report_id):
                    already_in = True
                    break
            if not already_in:
                location_reports.append(report)

            depths = [float(r.water_depth or 0.0) for r in location_reports]
            matched_incident.water_depth = calculate_most_frequent_water_depth(depths)
            matched_incident.report_count = len(location_reports)
            
            computed_risk = compute_severity(
                matched_incident.report_count, matched_incident.water_depth
            )
            matched_incident.risk_level = computed_risk

            matched_incident.latest_report_id = report.report_id
            if report.description:
                matched_incident.latest_description = report.description
            if report.image_url:
                matched_incident.latest_image_url = report.image_url
            if report.ward and not matched_incident.ward:
                matched_incident.ward = str(report.ward)
            if report.assigned_ulb_id and not matched_incident.assigned_ulb_id:
                matched_incident.assigned_ulb_id = str(report.assigned_ulb_id)
            if report.assigned_ulb_name and not matched_incident.assigned_ulb_name:
                matched_incident.assigned_ulb_name = report.assigned_ulb_name
            if report.jurisdiction_type and not matched_incident.jurisdiction_type:
                matched_incident.jurisdiction_type = report.jurisdiction_type
            
            matched_incident.updated_at = now
            matched_incident.last_reported_at = now
            target_incident = matched_incident
        else:
            # Case 2: New place/area -> create new row in incident_queue
            inc_id = generate_incident_id(loc_str)
            
            # Ensure incident_id uniqueness if needed
            existing_with_id = await db.execute(
                select(IncidentQueue).where(IncidentQueue.incident_id == inc_id)
            )
            if existing_with_id.scalars().first():
                inc_id = f"{inc_id}-{int(now.timestamp()) % 1000}"

            subdiv = format_subdivision(
                loc_str, report.ward or "", report.assigned_ulb_name or ""
            )

            # Query all reports for this location to accurately determine depth and count
            reports_res = await db.execute(select(Report))
            all_reports = list(reports_res.scalars().all())
            location_reports = [
                r for r in all_reports
                if is_same_place(
                    r.location,
                    loc_str,
                    r.latitude,
                    r.longitude,
                    lat,
                    lon,
                )
            ]
            already_in = False
            for r in location_reports:
                if (report.id and r.id == report.id) or (report.report_id and r.report_id == report.report_id):
                    already_in = True
                    break
            if not already_in:
                location_reports.append(report)

            depths = [float(r.water_depth or 0.0) for r in location_reports]
            calc_depth = calculate_most_frequent_water_depth(depths)
            calc_count = max(len(location_reports), 1)
            computed_risk = compute_severity(calc_count, calc_depth)

            target_incident = IncidentQueue(
                incident_id=inc_id,
                location=loc_str,
                latitude=lat,
                longitude=lon,
                ward=str(report.ward or ""),
                assigned_ulb_id=str(report.assigned_ulb_id or ""),
                assigned_ulb_name=report.assigned_ulb_name or "",
                jurisdiction_type=report.jurisdiction_type or "",
                subdivision=subdiv,
                issue_type=report.issue_type or "Waterlogging",
                water_depth=calc_depth,
                report_count=calc_count,
                risk_level=computed_risk,
                status="Needs Intervention",
                latest_description=report.description or "",
                latest_image_url=report.image_url or "",
                latest_report_id=report.report_id,
                created_at=now,
                updated_at=now,
                last_reported_at=now,
            )
            db.add(target_incident)

        await db.commit()
        await db.refresh(target_incident)
        return target_incident

    @classmethod
    async def get_active_incidents(cls, db: AsyncSession) -> List[IncidentQueue]:
        """Fetch all active incidents ordered by risk level, report count, water depth, and first submitted."""
        result = await db.execute(
            select(IncidentQueue).where(
                or_(
                    IncidentQueue.status == "ACTIVE",
                    IncidentQueue.status == "Needs Intervention",
                    IncidentQueue.status == "Under Review",
                )
            )
        )
        incidents = list(result.scalars().all())

        # Sort dynamically according to priority rules:
        # Rule 1: If report_count is same then check for water_depth, else whose report_count is more priorities first.
        # Rule 2: If water_depth is same then check, for which location report generated first priorities first, else whose water_depth is more priorities first.
        def sort_key(inc: IncidentQueue):
            created_dt = inc.created_at or inc.updated_at
            if isinstance(created_dt, datetime):
                created_ts = created_dt.timestamp()
            elif isinstance(created_dt, str):
                try:
                    created_ts = datetime.fromisoformat(created_dt.replace("Z", "+00:00")).timestamp()
                except Exception:
                    created_ts = float("inf")
            else:
                created_ts = float("inf")

            # Sorted with reverse=True:
            # 1. Report Count (descending: larger comes first)
            # 2. Water Depth (descending: larger comes first)
            # 3. Location report generated first (earliest timestamp comes first: smaller timestamp -> larger -created_ts)
            return (
                inc.report_count or 1,
                inc.water_depth or 0.0,
                -created_ts if created_ts != float("inf") else float("-inf"),
            )

        incidents.sort(key=sort_key, reverse=True)

        for inc in incidents:
            inc.created_at = ensure_kolkata_tz(inc.created_at)
            inc.updated_at = ensure_kolkata_tz(inc.updated_at)
            inc.last_reported_at = ensure_kolkata_tz(inc.last_reported_at)

        return incidents

    @classmethod
    async def recalculate_all_incidents(cls, db: AsyncSession) -> int:
        """Recalculate report count, most frequent water depth, and severity for all active incidents."""
        inc_res = await db.execute(select(IncidentQueue))
        incidents = list(inc_res.scalars().all())
        if not incidents:
            return 0

        reports_res = await db.execute(select(Report))
        all_reports = list(reports_res.scalars().all())

        updated_count = 0
        for inc in incidents:
            loc_reports = [
                r for r in all_reports
                if is_same_place(
                    r.location,
                    inc.location,
                    r.latitude,
                    r.longitude,
                    inc.latitude,
                    inc.longitude,
                )
            ]
            if loc_reports:
                depths = [float(r.water_depth or 0.0) for r in loc_reports]
                inc.water_depth = calculate_most_frequent_water_depth(depths)
                inc.report_count = len(loc_reports)
                inc.risk_level = compute_severity(inc.report_count, inc.water_depth)
                updated_count += 1

        await db.commit()
        return updated_count

    @classmethod
    async def sync_from_existing_reports(cls, db: AsyncSession, force_resync: bool = False) -> int:
        """Syncs all existing rows from `reports` table into `incident_queue` table."""
        if not force_resync:
            count_res = await db.execute(select(IncidentQueue))
            if count_res.scalars().first() is not None:
                # Ensure existing incident depths and counts match most frequent calculation
                await cls.recalculate_all_incidents(db)
                return 0  # Already populated

        reports_res = await db.execute(
            select(Report).order_by(Report.submitted_at.asc())
        )
        all_reports = list(reports_res.scalars().all())
        synced_count = 0

        for rep in all_reports:
            await cls.record_report(db, rep)
            synced_count += 1

        return synced_count
