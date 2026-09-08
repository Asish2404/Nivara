import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile, HTTPException, status

from ..models.report import Report
from ..models.user import User
from ..schemas.report import ReportCreate

# Directory where citizen-submitted report images are stored (relative to Backend/)
UPLOAD_DIR = "uploads"

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
        import os

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
        elapsed = (now - report.submitted_at).total_seconds()
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
                report.updated_at = now

    @classmethod
    async def create_report(
        cls, db: AsyncSession, user: User, data: ReportCreate, file: Optional[UploadFile]
    ) -> Report:
        """Create a report owned by the given user, storing the original image."""
        report_id = f"KWI-{datetime.now().year}-{uuid.uuid4().hex[:5].upper()}"
        original_image = ""
        image_url = ""

        if file is not None and file.filename:
            original_image, image_url = cls.save_upload(file, report_id)

        now = datetime.utcnow()
        report = Report(
            report_id=report_id,
            user_id=user.id,
            user_name=user.full_name,
            user_email=user.email,
            original_image=original_image,
            image_url=image_url,
            location=data.location or "",
            latitude=data.latitude or 0.0,
            longitude=data.longitude or 0.0,
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

        now = datetime.utcnow()
        changed = False
        for report in reports:
            before = (report.status, report.updated_at)
            cls._apply_aging(report, now)
            if (report.status, report.updated_at) != before:
                changed = True

        if changed:
            await db.commit()

        return reports

    @classmethod
    async def get_user_report(
        cls, db: AsyncSession, user_id: str, report_id: str
    ) -> Report:
        """Return one of the user's reports, ownership-checked (404 if not owner)."""
        now = datetime.utcnow()
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
        return report