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
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import async_session
from app.core.datetime_utils import get_current_time, get_kolkata_tz, ensure_kolkata_tz, utc_now
from app.models.waterlogging import WaterloggingPrediction
from app.ml.feature_engineering import FeatureEngineering
from app.ml.predictor import WaterloggingPredictor, MODEL_VERSION
from app.ml.severity import SeverityEstimator
from app.ml.priority import PriorityCalculator
from .weather_service import WeatherService

logger = logging.getLogger(__name__)


class WaterloggingService:
    """Orchestrates end-to-end waterlogging intelligence and persistence."""

    # In-memory cached result of the latest run for fast dashboard queries
    _latest_cache: Optional[Dict[str, Any]] = None

    # In-memory scheduling and cooldown state (no separate municipality table required)
    _scheduler_state: Dict[str, Any] = {
        "auto_job_in_progress": False,
        "auto_started_at": None,
        "manual_job_in_progress": False,
        "manual_started_at": None,
        "last_update_ts": None,
    }

    @classmethod
    async def run_prediction_cycle(
        cls,
        db: Optional[AsyncSession] = None,
        force_weather_refresh: bool = False,
    ) -> Dict[str, Any]:
        """Executes one complete waterlogging prediction cycle for all Kolkata locations."""
        cycle_start = get_current_time()
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
                "status": "ACTIVE",
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
            "last_update_ts": cycle_start.isoformat(),
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
                        status=p.get("status", "ACTIVE"),
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

        # Update in-memory scheduling last_update_ts
        cls._scheduler_state["last_update_ts"] = cycle_start

        logger.info(
            "Prediction cycle completed. Processed %d locations (High: %d, Med: %d, Low: %d)",
            len(predictions),
            sum(1 for p in predictions if p["risk_level"] == "HIGH"),
            sum(1 for p in predictions if p["risk_level"] == "MEDIUM"),
            sum(1 for p in predictions if p["risk_level"] == "LOW"),
        )

        return result_payload

    @classmethod
    async def load_latest_from_db(cls, db: AsyncSession) -> bool:
        """Loads the most recent prediction batch from the database into in-memory cache.

        Returns True if a batch was successfully loaded, or False if no predictions exist.
        """
        try:
            stmt = (
                select(WaterloggingPrediction.batch_id)
                .order_by(desc(WaterloggingPrediction.prediction_timestamp))
                .limit(1)
            )
            res = await db.execute(stmt)
            latest_batch_id = res.scalar_one_or_none()
            if not latest_batch_id:
                return False

            pred_stmt = (
                select(WaterloggingPrediction)
                .where(WaterloggingPrediction.batch_id == latest_batch_id)
                .order_by(desc(WaterloggingPrediction.priority_score))
            )
            rows = (await db.execute(pred_stmt)).scalars().all()
            if not rows:
                return False

            first_row = rows[0]
            predictions = [
                {
                    "id": r.id,
                    "batch_id": r.batch_id,
                    "locality": r.locality,
                    "latitude": r.latitude,
                    "longitude": r.longitude,
                    "ward": r.ward or "",
                    "ulb_name": r.ulb_name or "",
                    "district": r.district or "",
                    "elevation_m": r.elevation_m,
                    "slope_deg": r.slope_deg,
                    "forecast_rain_24h_mm": r.forecast_rain_24h_mm,
                    "waterlogging_probability": r.waterlogging_probability,
                    "severity_score": r.severity_score,
                    "impact_score": r.impact_score,
                    "priority_score": r.priority_score,
                    "risk_level": r.risk_level,
                    "status": getattr(r, "status", None) or "ACTIVE",
                    "model_version": r.model_version,
                    "prediction_timestamp": r.prediction_timestamp,
                }
                for r in rows
            ]

            first_ts = ensure_kolkata_tz(first_row.prediction_timestamp) if first_row.prediction_timestamp else get_current_time()
            iso_ts = first_ts.isoformat()

            cls._latest_cache = {
                "prediction_timestamp": iso_ts,
                "model_version": first_row.model_version or MODEL_VERSION,
                "data_source": "database_snapshot",
                "locations_count": len(predictions),
                "batch_id": latest_batch_id,
                "last_update_ts": iso_ts,
                "predictions": predictions,
            }
            cls._scheduler_state["last_update_ts"] = first_ts
            logger.info("Loaded latest prediction batch %s (%d records) from database into cache (last_update_ts: %s)", latest_batch_id, len(predictions), iso_ts)
            return True
        except Exception as exc:
            logger.error("Failed to load latest predictions from database: %s", exc)
            return False

    @classmethod
    def calculate_next_auto_ts(cls, now: Optional[datetime] = None) -> datetime:
        """Returns the next calendar-anchored auto update timestamp (02:00, 10:00, 18:00 local IST)."""
        tz = get_kolkata_tz()
        if now is None:
            local_now = datetime.now(tz)
        else:
            local_now = ensure_kolkata_tz(now)

        today = local_now.date()
        candidates = [
            datetime(today.year, today.month, today.day, 2, 0, 0, tzinfo=tz),
            datetime(today.year, today.month, today.day, 10, 0, 0, tzinfo=tz),
            datetime(today.year, today.month, today.day, 18, 0, 0, tzinfo=tz),
            datetime(today.year, today.month, today.day, 2, 0, 0, tzinfo=tz) + timedelta(days=1),
        ]
        for c in candidates:
            if c > local_now:
                return c
        return candidates[-1]

    @classmethod
    async def check_manual_refresh_allowed(
        cls,
    ) -> Tuple[bool, Optional[str], Optional[datetime], int]:
        """Validates if manual prediction refresh is permitted per exact business logic without DB schema changes:
        1. Stuck-guards:
           - auto_job_in_progress > 30 min -> reset to FALSE
           - manual_job_in_progress > 15 min -> reset to FALSE
        2. Concurrency check:
           - auto_job_in_progress == TRUE -> 409 Conflict
           - manual_job_in_progress == TRUE -> 409 Conflict
        3. Exact 2-hour cooldown from last run:
           - If NOW < last_update_ts + 2 hours -> 429 Too Many Requests with next_available_at
        4. Imminent cron collision protection:
           - If scheduled auto update is imminent (within 15 min of next_auto_ts) -> 429 Too Many Requests
        5. All pass -> mark manual job started and return 202 Accepted.

        Returns: (is_allowed, error_code_or_message, next_available_at, http_status_code)
        """
        tz = get_kolkata_tz()
        now = datetime.now(tz)

        # 1. Stuck-guards
        if cls._scheduler_state.get("auto_job_in_progress") and cls._scheduler_state.get("auto_started_at"):
            started_tz = ensure_kolkata_tz(cls._scheduler_state["auto_started_at"])
            if (now - started_tz) > timedelta(minutes=30):
                logger.warning("Stuck auto-job detected (>30 min). Resetting auto_job_in_progress to FALSE.")
                cls._scheduler_state["auto_job_in_progress"] = False
                cls._scheduler_state["auto_started_at"] = None

        if cls._scheduler_state.get("manual_job_in_progress") and cls._scheduler_state.get("manual_started_at"):
            man_started_tz = ensure_kolkata_tz(cls._scheduler_state["manual_started_at"])
            if (now - man_started_tz) > timedelta(minutes=15):
                logger.warning("Stuck manual-job detected (>15 min). Resetting manual_job_in_progress to FALSE.")
                cls._scheduler_state["manual_job_in_progress"] = False
                cls._scheduler_state["manual_started_at"] = None

        # 2. Concurrency checks
        if cls._scheduler_state.get("auto_job_in_progress"):
            return False, "Auto update in progress, please try later.", None, 409

        if cls._scheduler_state.get("manual_job_in_progress"):
            return False, "Prediction update already in progress, please wait.", None, 409

        # Ensure last_update_ts is populated from database snapshot if server recently started
        if cls._scheduler_state.get("last_update_ts") is None:
            try:
                async with async_session() as db:
                    await cls.load_latest_from_db(db)
            except Exception as e:
                logger.debug("Automatic cache warmup notice: %s", e)

        next_auto_ts = cls.calculate_next_auto_ts(now)
        last_update_local = ensure_kolkata_tz(cls._scheduler_state["last_update_ts"]) if cls._scheduler_state.get("last_update_ts") else None

        # 3. 2-Hour Cooldown from last run
        if last_update_local:
            cooldown_end = last_update_local + timedelta(hours=2)
            if now < cooldown_end:
                # If cooldown expiration falls directly inside an auto-cron execution window, buffer past it
                if next_auto_ts <= cooldown_end <= (next_auto_ts + timedelta(minutes=15)):
                    next_avail = next_auto_ts + timedelta(minutes=15)
                else:
                    next_avail = cooldown_end
                return False, "cooldown_active", next_avail, 429

        # 4. Imminent cron collision protection (buffer within 15 minutes of next scheduled cron)
        if now < next_auto_ts and (next_auto_ts - now) <= timedelta(minutes=15):
            next_avail = next_auto_ts + timedelta(minutes=15)
            return False, "cron_imminent", next_avail, 429

        # 5. All pass -> mark manual job in progress and return 202 Accepted
        cls._scheduler_state["manual_job_in_progress"] = True
        cls._scheduler_state["manual_started_at"] = get_current_time()
        return True, None, None, 202

    @classmethod
    async def run_auto_prediction_cycle(cls) -> None:
        """Calendar-Anchored automated prediction cron worker:
        1. Set auto_job_in_progress = TRUE, auto_started_at = NOW().
        2. Ingest weather + historical data.
        3. Compute severity_score + priority per location.
        4. Update locations table.
        5. On success: set last_update_ts = NOW(), update cached results.
        6. On failure: log error, leave last_update_ts UNCHANGED.
        7. In finally: set auto_job_in_progress = FALSE, auto_started_at = NULL.
        """
        cls._scheduler_state["auto_job_in_progress"] = True
        cls._scheduler_state["auto_started_at"] = get_current_time()
        logger.info("Calendar-anchored auto prediction cycle started.")

        try:
            async with async_session() as db:
                await cls.run_prediction_cycle(db=db, force_weather_refresh=True)
            logger.info("Auto prediction cycle completed successfully.")
        except Exception as exc:
            logger.error("Auto prediction cycle failed: %s (last_update_ts unchanged)", exc)
        finally:
            cls._scheduler_state["auto_job_in_progress"] = False
            cls._scheduler_state["auto_started_at"] = None

    @classmethod
    async def run_background_manual_cycle(cls, job_id: str) -> None:
        """Shared worker executed asynchronously for manual prediction refresh."""
        logger.info("Starting background manual prediction job %s...", job_id)
        try:
            async with async_session() as db:
                await cls.run_prediction_cycle(db=db, force_weather_refresh=True)
                logger.info("Background manual prediction job %s finished successfully.", job_id)
        except Exception as exc:
            logger.error("Background manual prediction job %s encountered error: %s", job_id, exc)
        finally:
            cls._scheduler_state["manual_job_in_progress"] = False
            cls._scheduler_state["manual_started_at"] = None

    @classmethod
    async def get_refresh_status(cls) -> Dict[str, Any]:
        """Provides status of prediction update system and cooldown timer without database schema changes."""
        tz = get_kolkata_tz()
        now = datetime.now(tz)

        # Stuck guards
        if cls._scheduler_state.get("auto_job_in_progress") and cls._scheduler_state.get("auto_started_at"):
            started_tz = ensure_kolkata_tz(cls._scheduler_state["auto_started_at"])
            if (now - started_tz) > timedelta(minutes=30):
                cls._scheduler_state["auto_job_in_progress"] = False
                cls._scheduler_state["auto_started_at"] = None

        if cls._scheduler_state.get("manual_job_in_progress") and cls._scheduler_state.get("manual_started_at"):
            man_started_tz = ensure_kolkata_tz(cls._scheduler_state["manual_started_at"])
            if (now - man_started_tz) > timedelta(minutes=15):
                cls._scheduler_state["manual_job_in_progress"] = False
                cls._scheduler_state["manual_started_at"] = None

        # Ensure last_update_ts is populated from database snapshot if server recently started
        if cls._scheduler_state.get("last_update_ts") is None:
            try:
                async with async_session() as db:
                    await cls.load_latest_from_db(db)
            except Exception as e:
                logger.debug("Automatic cache warmup notice: %s", e)

        is_in_progress = bool(
            cls._scheduler_state.get("auto_job_in_progress")
            or cls._scheduler_state.get("manual_job_in_progress")
        )

        next_auto_ts = cls.calculate_next_auto_ts(now)
        last_update_local = ensure_kolkata_tz(cls._scheduler_state["last_update_ts"]) if cls._scheduler_state.get("last_update_ts") else None

        cooldown_active = False
        next_available_at = None
        status_message = "Refresh available"

        if is_in_progress:
            status_message = "Prediction update currently in progress"
        elif last_update_local:
            cooldown_end = last_update_local + timedelta(hours=2)
            if now < cooldown_end:
                cooldown_active = True
                if next_auto_ts <= cooldown_end <= (next_auto_ts + timedelta(minutes=15)):
                    next_available_at = next_auto_ts + timedelta(minutes=15)
                else:
                    next_available_at = cooldown_end
                status_message = "Cooldown active"

        if not cooldown_active and not is_in_progress:
            if now < next_auto_ts and (next_auto_ts - now) <= timedelta(minutes=15):
                cooldown_active = True
                next_available_at = next_auto_ts + timedelta(minutes=15)
                status_message = "Scheduled auto update is imminent"

        return {
            "last_update_ts": last_update_local.isoformat() if last_update_local else None,
            "next_auto_ts": next_auto_ts.isoformat(),
            "auto_job_in_progress": is_in_progress,
            "cooldown_active": cooldown_active,
            "next_available_at": next_available_at.isoformat() if next_available_at else None,
            "message": status_message,
        }

    @classmethod
    async def get_latest_predictions(
        cls,
        db: Optional[AsyncSession] = None,
        risk_level: Optional[str] = None,
        district: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Returns the latest predictions. If cache is empty, loads from database snapshot;
        only generates a fresh cycle if the database has no prediction records.
        """
        if cls._latest_cache is None:
            loaded = False
            if db is not None:
                loaded = await cls.load_latest_from_db(db)
            if not loaded:
                await cls.run_prediction_cycle(db=db, force_weather_refresh=False)

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
        """Returns executive summary metrics and top priority hotspots.
        Loads from database snapshot if in-memory cache is empty.
        """
        if cls._latest_cache is None:
            loaded = False
            if db is not None:
                loaded = await cls.load_latest_from_db(db)
            if not loaded:
                await cls.run_prediction_cycle(db=db, force_weather_refresh=False)

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
