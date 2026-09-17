from typing import List, Optional
from fastapi import APIRouter, Depends, status, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.api.v1.auth import get_current_user, get_current_user_or_default
from app.schemas.report import ReportResponse, ReportCreate, IncidentQueueResponse
from app.services.report_service import ReportService
from app.services.incident_service import IncidentQueueService
from app.services.image_validation_service import ImageValidationService

router = APIRouter()



@router.post(
    "/reports/validate-drainage-image",
    summary="Fast MobileNet ML validation of drainage/waterlogging photo",
)
@router.post(
    "/validate-drainage-image",
    summary="Fast MobileNet ML validation of drainage/waterlogging photo (alias)",
)
async def validate_drainage_image(
    image: UploadFile = File(..., description="Uploaded citizen photo to inspect"),
):
    """Classify whether the uploaded image is a legitimate municipal drainage/waterlogging photo."""
    image_bytes = await image.read()
    return await ImageValidationService.validate_image(image_bytes, image.filename or "")


@router.post(
    "/reports",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a citizen waterlogging report (with original photo)",
)
async def create_report(
    *,
    current_user: User = Depends(get_current_user_or_default),
    db: AsyncSession = Depends(get_db),
    location: Optional[str] = Form(None, description="Street / locality address"),
    latitude: Optional[float] = Form(None, description="GPS latitude"),
    longitude: Optional[float] = Form(None, description="GPS longitude"),
    issueType: str = Form("Waterlogging"),
    description: str = Form(""),
    waterDepth: float = Form(0.0),
    image: Optional[UploadFile] = File(None),
):
    """Create a report owned by the logged-in user. Automatically detects municipality/corporation

    jurisdiction from GPS coordinates or geocodes manual location. The image bytes are written to disk
    and served from the /uploads static mount, so the exact original is preserved.
    """
    data = ReportCreate(
        location=location or "",
        latitude=latitude,
        longitude=longitude,
        issue_type=issueType,
        description=description,
        water_depth=waterDepth,
    )
    report = await ReportService.create_report(db, current_user, data, image)
    return ReportResponse.model_validate(report)


@router.get(
    "/reports",
    response_model=List[ReportResponse],
    summary="List submitted citizen reports (newest first)",
)
async def list_my_reports(
    all_reports: bool = Query(False, description="If True, return all municipal reports across the city"),
    current_user: User = Depends(get_current_user_or_default),
    db: AsyncSession = Depends(get_db),
):
    """Returns citizen reports. If all_reports is True (or for municipal admins), returns city-wide reports."""
    is_admin = (
        getattr(current_user, "portal", "") == "admin"
        or "admin" in (getattr(current_user, "role", "") or "").lower()
        or "officer" in (getattr(current_user, "role", "") or "").lower()
    )
    if all_reports or is_admin:
        reports = await ReportService.get_all_reports(db)
    else:
        reports = await ReportService.get_user_reports(db, current_user.id)
    return [ReportResponse.model_validate(r) for r in reports]


@router.get(
    "/reports/{report_id}",
    response_model=ReportResponse,
    summary="Get one of the current user's reports (ownership-checked)",
)
async def get_my_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns a single report only if it belongs to the requesting user (404 otherwise)."""
    report = await ReportService.get_user_report(db, current_user.id, report_id)
    return ReportResponse.model_validate(report)


@router.get(
    "/incidents",
    response_model=List[IncidentQueueResponse],
    summary="Get dynamic active incidents from incident_queue",
)
@router.get(
    "/reports/incident-queue",
    response_model=List[IncidentQueueResponse],
    summary="Get dynamic active incidents from incident_queue (alias)",
)
async def get_incident_queue(
    db: AsyncSession = Depends(get_db),
):
    """Returns all dynamic active incidents grouped by location from the incident_queue table."""
    incidents = await IncidentQueueService.get_active_incidents(db)
    return [IncidentQueueResponse.model_validate(inc) for inc in incidents]