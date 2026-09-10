"""SQLAlchemy ORM Model for Waterlogging Prediction Snapshots."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Index
from app.core.database import Base
from app.core.datetime_utils import utc_now


def generate_prediction_id() -> str:
    return f"WLP-{uuid.uuid4().hex[:12].upper()}"


class WaterloggingPrediction(Base):
    __tablename__ = "waterlogging_predictions"

    id = Column(String(64), primary_key=True, default=generate_prediction_id)
    batch_id = Column(String(64), nullable=False, index=True)
    prediction_timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)

    locality = Column(String(128), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    ward = Column(String(32), default="", nullable=True)
    ulb_name = Column(String(128), default="", nullable=True)
    district = Column(String(64), default="", nullable=True)

    elevation_m = Column(Float, nullable=True)
    slope_deg = Column(Float, nullable=True)
    forecast_rain_24h_mm = Column(Float, nullable=True)

    waterlogging_probability = Column(Float, nullable=False)
    severity_score = Column(Float, nullable=False)
    impact_score = Column(Float, nullable=False)
    priority_score = Column(Float, nullable=False, index=True)
    risk_level = Column(String(16), nullable=False, index=True)  # LOW, MEDIUM, HIGH

    model_version = Column(String(64), default="waterlogging-baseline-v1", nullable=False)

    __table_args__ = (
        Index("idx_batch_priority", "batch_id", "priority_score"),
        Index("idx_locality_timestamp", "locality", "prediction_timestamp"),
    )
