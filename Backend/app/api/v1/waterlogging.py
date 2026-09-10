"""FastAPI Router for Waterlogging Prediction, Severity Estimation, and Priority Intelligence."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.waterlogging import (
    WaterloggingPredictionListResponse,
    WaterloggingSummaryResponse,
    PredictionRefreshResponse,
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


@router.post(
    "/refresh",
    response_model=PredictionRefreshResponse,
    status_code=status.HTTP_200_OK,
    summary="Trigger immediate waterlogging prediction refresh cycle",
)
async def trigger_prediction_refresh(
    force_weather_refresh: bool = Query(
        True,
        description="If True, forces an immediate live HTTP fetch from Open-Meteo API",
    ),
    db: AsyncSession = Depends(get_db),
):
    """Manually triggers a full prediction cycle across all locations:

    1. Ingests weather forecast.
    2. Computes baseline ML susceptibility + dynamic rainfall risk.
    3. Derives probability, severity, impact, priority, and risk level.
    4. Persists a new snapshot in the municipal database.
    """
    cycle_result = await WaterloggingService.run_prediction_cycle(
        db=db,
        force_weather_refresh=force_weather_refresh,
    )

    return PredictionRefreshResponse(
        status="SUCCESS",
        message="Waterlogging prediction cycle executed successfully.",
        batch_id=cycle_result["batch_id"],
        locations_processed=cycle_result["locations_count"],
        data_source=cycle_result["data_source"],
        prediction_timestamp=cycle_result["prediction_timestamp"],
    )
