"""Waterlogging Service: End-to-End Orchestrator for Prediction, Severity, and Priority Intelligence.

Workflow:
1. Ingests all available Kolkata and ULB locations dynamically (~167 locations).
2. Obtains current and forecast weather (Open-Meteo API / cached snapshot).
3. Executes feature preparation and baseline Random Forest inference.
4. Derives hybrid waterlogging probability, severity score, impact score, and priority score.
5. Sorts descending by priority_score so officers immediately see where to act first.
6. Persists snapshots to database and provides high-speed in-memory cached access.
"""

import uuid
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.datetime_utils import utc_now
from app.models.waterlogging import WaterloggingPrediction
from app.ml.feature_engineering import FeatureEngineering
from app.ml.predictor import WaterloggingPredictor, MODEL_VERSION
from app.ml.severity import SeverityEstimator
from app.ml.priority import PriorityCalculator
from .weather_service import WeatherService

logger = logging.getLogger(__name__)


class WaterloggingService:
    """Orchestrates end-to-end waterlogging intelligence and database persistence."""

    # In-memory cached result of the latest run for fast dashboard queries
    _latest_cache: Optional[Dict[str, Any]] = None

    @classmethod
    async def run_prediction_cycle(
        cls,
        db: Optional[AsyncSession] = None,
        force_weather_refresh: bool = False,
    ) -> Dict[str, Any]:
        """Executes one complete waterlogging prediction cycle for all Kolkata locations."""
        cycle_start = utc_now()
        batch_id = f"BATCH-{uuid.uuid4().hex[:8].upper()}"

        logger.info("Starting waterlogging prediction cycle (Batch %s)...", batch_id)

        # 1. Load all available locations dynamically
        locations_df = FeatureEngineering.load_localities()
        if locations_df.empty:
            raise RuntimeError("No locations found in localities dataset.")

        # 2. Ingest current and forecast weather
        weather_df, data_source = await WeatherService.get_weather_for_locations(
            locations_df,
            force_refresh=force_weather_refresh,
        )

        # 3. Prepare feature matrix for baseline ML model
        clean_df, feature_matrix = FeatureEngineering.prepare_model_features(
            locations_df=locations_df,
            weather_df=weather_df,
        )

        # 4. Predict baseline susceptibility using Random Forest model
        baseline_susceptibilities = WaterloggingPredictor.predict_baseline_susceptibility(feature_matrix)

        # 5. Calculate hybrid metrics for every single location
        predictions: List[Dict[str, Any]] = []

        for idx, row in clean_df.iterrows():
            loc_name = str(row.get("locality", f"Locality-{idx}"))
            lat = float(pd.to_numeric(row.get("lat"), errors="coerce") or 22.57)
            lon = float(pd.to_numeric(row.get("lon"), errors="coerce") or 88.36)
            ward = str(row.get("ward", "") or "")
            if ward.endswith(".0"):
                ward = ward[:-2]
            ulb_name = str(row.get("ulb_name", "") or "")
            district = str(row.get("district", "") or "")

            elev = float(pd.to_numeric(row.get("elevation_m"), errors="coerce") or 9.0)
            slope = float(pd.to_numeric(row.get("slope_deg"), errors="coerce") or 0.7)
            rain_24h = float(pd.to_numeric(row.get("forecast_rain_24h_mm"), errors="coerce") or 0.0)
            rain_6h = float(pd.to_numeric(row.get("forecast_rain_6h_mm"), errors="coerce") or 0.0)
            curr_rain = float(pd.to_numeric(row.get("current_rain_mm"), errors="coerce") or 0.0)
            soil_m = float(pd.to_numeric(row.get("forecast_soil_moisture_mean_24h"), errors="coerce") or 0.28)
            p95_rain = float(pd.to_numeric(row.get("hist_p95_daily_rain_mm"), errors="coerce") or 25.0)

            # Baseline ML susceptibility
            ml_susceptibility = float(baseline_susceptibilities[idx])

            # Dynamic forecast rainfall risk
            forecast_risk = FeatureEngineering.calculate_forecast_rainfall_risk(row)

            # A. Waterlogging Probability (0.0 to 1.0)
            prob = WaterloggingPredictor.compute_hybrid_probability(
                baseline_susceptibility=ml_susceptibility,
                forecast_rainfall_risk=forecast_risk,
            )

            # B. Severity Score (0.0 to 1.0)
            # Distinct from probability: evaluates physical consequence if waterlogged
            hist_count = float(feature_matrix.iloc[idx].get("hist_waterlog_count", 0.0))
            severity = SeverityEstimator.calculate_severity(
                forecast_rain_24h_mm=rain_24h,
                forecast_rain_6h_mm=rain_6h,
                elevation_m=elev,
                slope_deg=slope,
                soil_moisture=soil_m,
                hist_waterlog_count=hist_count,
                hist_p95_daily_rain_mm=p95_rain,
                current_rain_mm=curr_rain,
            )

            # C. Human/Local Impact Score (0.0 to 1.0)
            # Default neutral placeholder (0.50) unless verified municipal assets are mapped
            impact = PriorityCalculator.calculate_impact_score(loc_name)

            # D. Priority Score (0.0 to 1.0)
            priority = PriorityCalculator.calculate_priority(
                waterlogging_probability=prob,
                severity_score=severity,
                impact_score=impact,
                locality=loc_name,
            )

            # E. Risk Level (LOW / MEDIUM / HIGH)
            risk = PriorityCalculator.assign_risk_level(priority)

            pred_record = {
                "id": f"WLP-{batch_id[-6:]}-{idx:04d}",
                "batch_id": batch_id,
                "locality": loc_name,
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "ward": ward,
                "ulb_name": ulb_name,
                "district": district,
                "elevation_m": round(elev, 2),
                "slope_deg": round(slope, 3),
                "forecast_rain_24h_mm": round(rain_24h, 2),
                "waterlogging_probability": round(prob, 4),
                "severity_score": round(severity, 4),
                "impact_score": round(impact, 4),
                "priority_score": round(priority, 4),
                "risk_level": risk,
                "model_version": MODEL_VERSION,
                "prediction_timestamp": cycle_start,
            }
            predictions.append(pred_record)

        # 6. Sort strictly descending by priority_score
        predictions.sort(key=lambda x: x["priority_score"], reverse=True)

        result_payload = {
            "prediction_timestamp": cycle_start.isoformat(),
            "model_version": MODEL_VERSION,
            "data_source": data_source,
            "locations_count": len(predictions),
            "batch_id": batch_id,
            "predictions": predictions,
        }

        # Update in-memory cache
        cls._latest_cache = result_payload

        # 7. Persist snapshot to database if session provided
        if db is not None:
            try:
                db_models = [
                    WaterloggingPrediction(
                        id=p["id"],
                        batch_id=p["batch_id"],
                        prediction_timestamp=cycle_start,
                        locality=p["locality"],
                        latitude=p["latitude"],
                        longitude=p["longitude"],
                        ward=p["ward"],
                        ulb_name=p["ulb_name"],
                        district=p["district"],
                        elevation_m=p["elevation_m"],
                        slope_deg=p["slope_deg"],
                        forecast_rain_24h_mm=p["forecast_rain_24h_mm"],
                        waterlogging_probability=p["waterlogging_probability"],
                        severity_score=p["severity_score"],
                        impact_score=p["impact_score"],
                        priority_score=p["priority_score"],
                        risk_level=p["risk_level"],
                        model_version=p["model_version"],
                    )
                    for p in predictions
                ]
                db.add_all(db_models)
                await db.commit()
                logger.info("Persisted %d predictions to database (Batch %s)", len(db_models), batch_id)
            except Exception as exc:
                await db.rollback()
                logger.error("Failed to persist prediction batch to database: %s", exc)

        logger.info(
            "Prediction cycle completed. Processed %d locations (High: %d, Med: %d, Low: %d)",
            len(predictions),
            sum(1 for p in predictions if p["risk_level"] == "HIGH"),
            sum(1 for p in predictions if p["risk_level"] == "MEDIUM"),
            sum(1 for p in predictions if p["risk_level"] == "LOW"),
        )

        return result_payload

    @classmethod
    async def get_latest_predictions(
        cls,
        db: Optional[AsyncSession] = None,
        risk_level: Optional[str] = None,
        district: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Returns the latest predictions, executing a cycle if cache is empty."""
        if cls._latest_cache is None:
            await cls.run_prediction_cycle(db=db, force_weather_refresh=True)

        cached = cls._latest_cache
        if not cached:
            return {
                "prediction_timestamp": utc_now().isoformat(),
                "model_version": MODEL_VERSION,
                "data_source": "none",
                "locations_count": 0,
                "predictions": [],
            }

        filtered = cached["predictions"]

        if risk_level:
            req_risk = risk_level.strip().upper()
            filtered = [p for p in filtered if p["risk_level"] == req_risk]

        if district:
            req_dist = district.strip().lower()
            filtered = [p for p in filtered if req_dist in str(p.get("district", "")).lower()]

        if limit is not None and limit > 0:
            filtered = filtered[:limit]

        return {
            "prediction_timestamp": cached["prediction_timestamp"],
            "model_version": cached["model_version"],
            "data_source": cached["data_source"],
            "locations_count": len(filtered),
            "predictions": filtered,
        }

    @classmethod
    async def get_summary(
        cls,
        db: Optional[AsyncSession] = None,
    ) -> Dict[str, Any]:
        """Returns executive summary metrics and top priority hotspots."""
        if cls._latest_cache is None:
            await cls.run_prediction_cycle(db=db, force_weather_refresh=True)

        cached = cls._latest_cache or {}
        predictions = cached.get("predictions", [])

        distribution = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
        for p in predictions:
            lvl = p.get("risk_level", "LOW")
            if lvl in distribution:
                distribution[lvl] += 1

        top_hotspots = predictions[:5] if len(predictions) >= 5 else predictions

        return {
            "prediction_timestamp": cached.get("prediction_timestamp", utc_now().isoformat()),
            "model_version": cached.get("model_version", MODEL_VERSION),
            "data_source": cached.get("data_source", "none"),
            "total_locations": len(predictions),
            "risk_distribution": distribution,
            "top_priority_locations": top_hotspots,
        }
