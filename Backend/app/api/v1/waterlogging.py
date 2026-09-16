import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, BackgroundTasks, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.waterlogging import (
    WaterloggingPredictionListResponse,
    WaterloggingSummaryResponse,
    PredictionRefreshStatusResponse,
)
from app.services.waterlogging_service import WaterloggingService

router = APIRouter()


@router.get(
    "/predictions",
    response_model=WaterloggingPredictionListResponse,
    summary="Get latest waterlogging predictions sorted by priority (highest priority first)",
)
async def get_waterlogging_predictions(
    risk_level: Optional[str] = Query(None, description="Filter by risk tier: HIGH, MEDIUM, LOW"),
    district: Optional[str] = Query(None, description="Filter by district (e.g. Kolkata, North 24 Parganas)"),
    limit: Optional[int] = Query(None, ge=1, description="Maximum number of locations to return"),
    db: AsyncSession = Depends(get_db),
):
    """Returns predictive waterlogging intelligence for all municipal locations in the jurisdiction.

    Sorted strictly in descending order of priority score (priority_score DESC),
    allowing municipal officers to immediately identify the most critical areas.
    """
    result = await WaterloggingService.get_latest_predictions(
        db=db,
        risk_level=risk_level,
        district=district,
        limit=limit,
    )
    return result


@router.get(
    "/summary",
    response_model=WaterloggingSummaryResponse,
    summary="Get executive dashboard summary of city-wide waterlogging risk",
)
async def get_waterlogging_summary(
    db: AsyncSession = Depends(get_db),
):
    """Returns high-level aggregated risk distribution and the top 5 priority hotspots."""
    return await WaterloggingService.get_summary(db=db)


@router.get(
    "/status",
    response_model=PredictionRefreshStatusResponse,
    summary="Get prediction refresh status, active cooldown, and next schedule",
)
async def get_refresh_status():
    """Returns operational status of prediction scheduling, active cooldown, and earliest valid update time."""
    return await WaterloggingService.get_refresh_status()


@router.post(
    "/refresh",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger immediate waterlogging prediction refresh cycle with cooldown and schedule validation",
)
async def trigger_prediction_refresh(
    background_tasks: BackgroundTasks,
    force_weather_refresh: bool = Query(
        False,
        description="If True, forces an immediate live HTTP fetch from Open-Meteo API",
    ),
):
    """Manually triggers a full prediction cycle across all locations subject to validation:

    1. Stuck-guard: If auto_job_in_progress == TRUE and (NOW - auto_started_at) > 30 min -> treat as FALSE.
    2. If auto_job_in_progress == TRUE -> 409 "Auto update in progress, please try later."
    3. cooldown_ok = NOW >= last_update_ts + 2 hours
    4. no_overlap_ok = NOW + 2 hours <= next_auto_ts
    5. If NOT (cooldown_ok AND no_overlap_ok) -> 429 with JSON {"error": "cooldown_active", "next_available_at": "..."}
    6. All pass -> enqueues prediction as background job, returns 202 {"status": "accepted", "job_id": "..."}
    """
    allowed, err_msg, next_avail, status_code = await WaterloggingService.check_manual_refresh_allowed()

    if not allowed:
        if status_code == 409:
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={
                    "error": "in_progress",
                    "message": err_msg or "Update in progress, please try later.",
                    "detail": err_msg or "Update in progress, please try later.",
                },
            )
        elif status_code == 429:
            iso_next = next_avail.isoformat() if next_avail else ""
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "cooldown_active",
                    "next_available_at": iso_next,
                    "message": err_msg or f"Cooldown active. Next update available at {iso_next}",
                },
            )
        else:
            return JSONResponse(
                status_code=status_code,
                content={"error": "refresh_rejected", "message": err_msg or "Refresh request rejected."},
            )

    # All validation passed: Enqueue background job
    job_id = f"JOB-{uuid.uuid4().hex[:10].upper()}"
    background_tasks.add_task(WaterloggingService.run_background_manual_cycle, job_id)

    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={
            "status": "accepted",
            "job_id": job_id,
            "message": "Waterlogging prediction cycle accepted and running in background.",
        },
    )
