"""Feature Engineering Module for Waterlogging Prediction.

Centralizes:
1. MODEL_FEATURES definition strictly aligned with the trained Random Forest model.
2. Locality and static terrain/historical rainfall data loading.
3. Historical waterlogging event counting per locality from actual records.
4. Model feature matrix preparation (handling NaNs, numeric coercion, column order).
5. Dynamic forecast risk factor extraction from live/forecast weather observations.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import logging
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Base directories
APP_DIR = Path(__file__).resolve().parents[1]  # Backend/app
DATA_DIR = APP_DIR / "data" / "waterlogging"

LOCALITIES_FILE = DATA_DIR / "localities.csv"
STATIC_FEATURES_FILE = DATA_DIR / "static_features.csv"
EVENTS_FILE = DATA_DIR / "waterlogging_events.csv"
LIVE_FORECAST_FILE = DATA_DIR / "live_forecast.csv"

# EXACT 14 features expected by the trained Random Forest model in exact order
MODEL_FEATURES: List[str] = [
    "elevation_m",
    "slope_deg",
    "rain_24h_mm",
    "rain_72h_mm",
    "rain_7d_mm",
    "rain_30d_mm",
    "rainy_days_7d",
    "heavy_rain_days_7d",
    "max_rain_7d_mm",
    "precip_hours_7d",
    "hist_waterlog_count",
    "hist_rain_days_ge_5mm",
    "hist_rain_days_ge_20mm",
    "hist_max_daily_rain_mm",
]


class FeatureEngineering:
    """Manages feature extraction, data loading, and feature matrix preparation."""

    @classmethod
    def load_localities(cls) -> pd.DataFrame:
        """Loads all available Kolkata and ULB locations dynamically.

        Prefers static_features.csv if available (contains terrain & historical stats),
        falling back to localities.csv.
        """
        if STATIC_FEATURES_FILE.exists():
            df = pd.read_csv(STATIC_FEATURES_FILE)
            logger.info("Loaded %d locations from static_features.csv", len(df))
            return df
        elif LOCALITIES_FILE.exists():
            df = pd.read_csv(LOCALITIES_FILE)
            logger.info("Loaded %d locations from localities.csv", len(df))
            return df
        else:
            raise FileNotFoundError(
                f"Neither {STATIC_FEATURES_FILE} nor {LOCALITIES_FILE} exists."
            )

    @classmethod
    def load_historical_event_counts(cls) -> Dict[str, int]:
        """Derives recorded waterlogging event counts per locality strictly from actual data.

        If a locality has no recorded event, count is 0 (meaning no recorded event in dataset).
        """
        counts: Dict[str, int] = {}
        if EVENTS_FILE.exists():
            try:
                events_df = pd.read_csv(EVENTS_FILE)
                if "waterlogged" in events_df.columns and "locality" in events_df.columns:
                    waterlogged_only = events_df[events_df["waterlogged"] == 1]
                    counts = waterlogged_only["locality"].value_counts().to_dict()
            except Exception as exc:
                logger.warning("Error reading waterlogging_events.csv: %s", exc)
        return counts

    @classmethod
    def load_cached_forecast(cls) -> Optional[pd.DataFrame]:
        """Loads cached live forecast CSV if available on disk."""
        if LIVE_FORECAST_FILE.exists():
            try:
                df = pd.read_csv(LIVE_FORECAST_FILE)
                return df
            except Exception as exc:
                logger.warning("Could not read cached live forecast: %s", exc)
        return None

    @classmethod
    def prepare_model_features(
        cls,
        locations_df: pd.DataFrame,
        weather_df: Optional[pd.DataFrame] = None,
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Constructs:

        1. clean_records: Complete location metadata + joined weather columns.
        2. feature_matrix: Exact 14 MODEL_FEATURES in correct order, nulls safely imputed.
        """
        df = locations_df.copy().reset_index(drop=True)

        # Merge live weather if provided
        if weather_df is not None and not weather_df.empty:
            weather_cols = [c for c in weather_df.columns if c not in ["lat", "lon"]]
            # Match primarily on locality name, fallback on nearest coordinates if necessary
            df = df.merge(
                weather_df[weather_cols],
                on="locality",
                how="left",
                suffixes=("", "_weather"),
            )

        event_counts = cls.load_historical_event_counts()

        # Compute or map the 14 features
        feature_rows: List[Dict[str, float]] = []

        # Reference population statistics for safe fallback
        def safe_median(frame: pd.DataFrame, col: str, default: float) -> float:
            if col in frame.columns:
                s = pd.to_numeric(frame[col], errors="coerce").dropna()
                if not s.empty:
                    val = float(s.median())
                    if not np.isnan(val):
                        return val
            return default

        default_elevation = safe_median(df, "elevation_m", 9.0)
        default_slope = safe_median(df, "slope_deg", 0.7)
        default_ge5 = safe_median(df, "hist_rain_days_ge_5mm", 328.0)
        default_ge20 = safe_median(df, "hist_rain_days_ge_20mm", 100.0)
        default_max_daily = safe_median(df, "hist_max_daily_rain_mm", 77.0)

        for _, row in df.iterrows():
            loc_name = str(row.get("locality", ""))

            # 1. Elevation & Slope
            elev = pd.to_numeric(row.get("elevation_m"), errors="coerce")
            slope = pd.to_numeric(row.get("slope_deg"), errors="coerce")
            elev_val = float(elev) if pd.notna(elev) else default_elevation
            slope_val = float(slope) if pd.notna(slope) else default_slope

            # 2. Weather/Rain inputs for model feature matrix
            # Use forecast rainfall stress when present, otherwise fallback to 0.0
            rain_24 = float(pd.to_numeric(row.get("forecast_rain_24h_mm", row.get("rain_24h_mm", 0.0)), errors="coerce") or 0.0)
            rain_72 = float(pd.to_numeric(row.get("forecast_rain_72h_mm", row.get("rain_72h_mm", 0.0)), errors="coerce") or 0.0)
            rain_7d = float(pd.to_numeric(row.get("rain_7d_mm", rain_72 * 1.5), errors="coerce") or 0.0)
            rain_30d = float(pd.to_numeric(row.get("rain_30d_mm", rain_7d * 3.5), errors="coerce") or 0.0)

            rainy_days_7d = int(pd.to_numeric(row.get("rainy_days_7d", 1 if rain_7d > 5.0 else 0), errors="coerce") or 0)
            heavy_days_7d = int(pd.to_numeric(row.get("heavy_rain_days_7d", 1 if rain_24 > 20.0 else 0), errors="coerce") or 0)
            max_rain_7d = float(pd.to_numeric(row.get("max_rain_7d_mm", rain_24), errors="coerce") or 0.0)
            precip_hours_7d = float(pd.to_numeric(row.get("precip_hours_7d", 12.0 if rain_7d > 10.0 else 0.0), errors="coerce") or 0.0)

            # 3. Historical waterlogging count strictly from actual records
            hist_count = float(event_counts.get(loc_name, 0))

            # 4. Historical rainfall stats
            h_ge5 = pd.to_numeric(row.get("hist_rain_days_ge_5mm"), errors="coerce")
            h_ge20 = pd.to_numeric(row.get("hist_rain_days_ge_20mm"), errors="coerce")
            h_max_d = pd.to_numeric(row.get("hist_max_daily_rain_mm"), errors="coerce")

            feature_dict = {
                "elevation_m": elev_val,
                "slope_deg": slope_val,
                "rain_24h_mm": rain_24,
                "rain_72h_mm": rain_72,
                "rain_7d_mm": rain_7d,
                "rain_30d_mm": rain_30d,
                "rainy_days_7d": rainy_days_7d,
                "heavy_rain_days_7d": heavy_days_7d,
                "max_rain_7d_mm": max_rain_7d,
                "precip_hours_7d": precip_hours_7d,
                "hist_waterlog_count": hist_count,
                "hist_rain_days_ge_5mm": float(h_ge5) if pd.notna(h_ge5) else default_ge5,
                "hist_rain_days_ge_20mm": float(h_ge20) if pd.notna(h_ge20) else default_ge20,
                "hist_max_daily_rain_mm": float(h_max_d) if pd.notna(h_max_d) else default_max_daily,
            }
            feature_rows.append(feature_dict)

        feature_matrix = pd.DataFrame(feature_rows)[MODEL_FEATURES]
        return df, feature_matrix

    @classmethod
    def calculate_forecast_rainfall_risk(cls, row: Any) -> float:
        """Computes dynamic forecast rainfall risk score in [0.0, 1.0].

        Components:
        1. 24h forecast rain accumulation (scaled to IMD heavy rain standard of 65mm-100mm)
        2. 6h forecast rain intensity burst (scaled to 30mm)
        3. Maximum precipitation probability (0% - 100%)
        4. Soil moisture saturation (> 0.35 indicates high runoff coefficient)
        """
        rain_24h = float(pd.to_numeric(row.get("forecast_rain_24h_mm", 0.0), errors="coerce") or 0.0)
        rain_6h = float(pd.to_numeric(row.get("forecast_rain_6h_mm", 0.0), errors="coerce") or 0.0)
        precip_prob = float(pd.to_numeric(row.get("forecast_precip_probability_max_24h", 0.0), errors="coerce") or 0.0)
        soil_moisture = float(pd.to_numeric(row.get("forecast_soil_moisture_mean_24h", 0.25), errors="coerce") or 0.25)
        curr_precip = float(pd.to_numeric(row.get("current_precipitation_mm", 0.0), errors="coerce") or 0.0)

        # 1. 24-hour volume risk (0.0 at 0mm, 1.0 at >= 80mm)
        volume_risk = min(1.0, max(0.0, rain_24h / 80.0))

        # 2. 6-hour short-term intensity burst risk (0.0 at 0mm, 1.0 at >= 35mm)
        burst_risk = min(1.0, max(0.0, (rain_6h + curr_precip * 2.0) / 35.0))

        # 3. Probability factor (0.0 to 1.0)
        prob_factor = min(1.0, max(0.0, precip_prob / 100.0))

        # 4. Soil moisture saturation factor (typically 0.20 dry to 0.45 fully saturated)
        soil_factor = min(1.0, max(0.0, (soil_moisture - 0.20) / (0.45 - 0.20)))

        # Weighted combination for dynamic weather risk
        forecast_risk = (
            0.40 * volume_risk +
            0.30 * burst_risk +
            0.15 * prob_factor +
            0.15 * soil_factor
        )

        return float(np.clip(forecast_risk, 0.0, 1.0))
