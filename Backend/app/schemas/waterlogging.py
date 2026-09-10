"""Pydantic Schemas for Waterlogging Prediction and Priority Intelligence."""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class LocalityPredictionResponse(BaseModel):
    id: Optional[str] = None
    locality: str
    latitude: float
    longitude: float
    ward: Optional[str] = ""
    ulb_name: Optional[str] = ""
    district: Optional[str] = ""
    elevation_m: Optional[float] = None
    slope_deg: Optional[float] = None
    forecast_rain_24h_mm: Optional[float] = 0.0

    waterlogging_probability: float = Field(..., ge=0.0, le=1.0)
    severity_score: float = Field(..., ge=0.0, le=1.0)
    impact_score: float = Field(..., ge=0.0, le=1.0)
    priority_score: float = Field(..., ge=0.0, le=1.0)
    risk_level: str  # LOW, MEDIUM, HIGH

    model_version: str = "waterlogging-baseline-v1"
    prediction_timestamp: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class WaterloggingPredictionListResponse(BaseModel):
    prediction_timestamp: str
    model_version: str
    data_source: str
    locations_count: int
    predictions: List[LocalityPredictionResponse]

    model_config = ConfigDict(protected_namespaces=())


class WaterloggingSummaryResponse(BaseModel):
    prediction_timestamp: str
    model_version: str
    data_source: str
    total_locations: int
    risk_distribution: Dict[str, int]
    top_priority_locations: List[LocalityPredictionResponse]

    model_config = ConfigDict(protected_namespaces=())


class PredictionRefreshResponse(BaseModel):
    status: str
    message: str
    batch_id: str
    locations_processed: int
    data_source: str
    prediction_timestamp: str
