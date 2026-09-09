from typing import List, Optional
from fastapi import APIRouter, Depends, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from .auth import get_current_user, get_current_user_or_default
from app.schemas.report import ReportResponse, ReportCreate
from app.services.report_service import ReportService

router = APIRouter()


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
    summary="List the current user's submitted reports (newest first)",
)
async def list_my_reports(
    current_user: User = Depends(get_current_user_or_default),
    db: AsyncSession = Depends(get_db),
):
    """Returns only reports owned by the requesting user (server-side isolation)."""
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