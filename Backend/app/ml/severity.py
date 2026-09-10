"""Severity Estimation Module for Waterlogging Intelligence.

Calculates 'severity_score' in [0.0, 1.0].
Distinction:
- Probability: 'How likely is waterlogging to occur?'
- Severity: 'How serious could the waterlogging situation be if conditions lead to waterlogging?'

Factors evaluated:
1. Forecast rainfall accumulation (24h) and peak intensity (6h).
2. Terrain vulnerability (lower elevation + flat slope create stagnant pooling).
3. Soil moisture saturation (saturated ground eliminates infiltration).
4. Historical rainfall exposure and historical waterlogging tendency.
"""

from typing import Dict, Any, Optional
import numpy as np
import pandas as pd


# Configurable weights for severity components
WEIGHT_RAIN_SEVERITY = 0.40
WEIGHT_TERRAIN_VULNERABILITY = 0.30
WEIGHT_SOIL_SATURATION = 0.15
WEIGHT_HISTORICAL_TENDENCY = 0.15

# Normalization constants (based on Kolkata/Bengal municipal hydrological limits)
MAX_RAIN_24H_MM = 100.0   # Severe rainfall threshold
MAX_BURST_6H_MM = 50.0    # Heavy short-duration burst threshold
MIN_ELEVATION_M = 3.0     # Low basin elevation in Kolkata
MAX_ELEVATION_M = 15.0    # High ground elevation in Kolkata
MAX_SLOPE_DEG = 2.5       # Terrain slope upper benchmark
SATURATED_SOIL_MOISTURE = 0.42  # Volumetric soil moisture saturation point
DRY_SOIL_MOISTURE = 0.18        # Dry soil moisture


class SeverityEstimator:
    """Computes transparent waterlogging severity score."""

    @classmethod
    def calculate_terrain_vulnerability(
        cls,
        elevation_m: float,
        slope_deg: float,
    ) -> float:
        """Computes terrain vulnerability in [0.0, 1.0].

        Lower elevation and lower slope = higher vulnerability to deep/prolonged inundation.
        """
        # Low elevation score: 3m -> 1.0, 15m -> 0.0
        elev_clamped = np.clip(elevation_m, MIN_ELEVATION_M, MAX_ELEVATION_M)
        elev_score = (MAX_ELEVATION_M - elev_clamped) / (MAX_ELEVATION_M - MIN_ELEVATION_M)

        # Low slope score: 0.0 deg -> 1.0, >= 2.5 deg -> 0.0
        slope_clamped = np.clip(slope_deg, 0.0, MAX_SLOPE_DEG)
        slope_score = (MAX_SLOPE_DEG - slope_clamped) / MAX_SLOPE_DEG

        # Combined terrain vulnerability: 60% elevation, 40% slope
        return float(np.clip(0.60 * elev_score + 0.40 * slope_score, 0.0, 1.0))

    @classmethod
    def calculate_rainfall_severity(
        cls,
        forecast_rain_24h_mm: float,
        forecast_rain_6h_mm: float,
        current_rain_mm: float = 0.0,
    ) -> float:
        """Computes rainfall-induced volume and burst severity in [0.0, 1.0]."""
        rain_24 = max(0.0, float(forecast_rain_24h_mm))
        rain_6 = max(0.0, float(forecast_rain_6h_mm) + float(current_rain_mm) * 1.5)

        vol_score = min(1.0, rain_24 / MAX_RAIN_24H_MM)
        burst_score = min(1.0, rain_6 / MAX_BURST_6H_MM)

        return float(np.clip(0.55 * vol_score + 0.45 * burst_score, 0.0, 1.0))

    @classmethod
    def calculate_soil_severity(
        cls,
        soil_moisture: float,
    ) -> float:
        """Computes saturation severity in [0.0, 1.0].

        When soil is saturated (> 0.35), infiltration rate is zero, accelerating surface water depth.
        """
        clamped = np.clip(soil_moisture, DRY_SOIL_MOISTURE, SATURATED_SOIL_MOISTURE)
        return float((clamped - DRY_SOIL_MOISTURE) / (SATURATED_SOIL_MOISTURE - DRY_SOIL_MOISTURE))

    @classmethod
    def calculate_historical_severity(
        cls,
        hist_waterlog_count: float,
        hist_p95_daily_rain_mm: float = 25.0,
    ) -> float:
        """Computes historical vulnerability from recorded event history."""
        # 0 events -> 0.0, 3+ recorded events -> 1.0
        event_score = min(1.0, max(0.0, hist_waterlog_count / 3.0))
        p95_score = min(1.0, max(0.0, hist_p95_daily_rain_mm / 40.0))

        return float(np.clip(0.60 * event_score + 0.40 * p95_score, 0.0, 1.0))

    @classmethod
    def calculate_severity(
        cls,
        forecast_rain_24h_mm: float,
        forecast_rain_6h_mm: float,
        elevation_m: float,
        slope_deg: float,
        soil_moisture: float = 0.28,
        hist_waterlog_count: float = 0.0,
        hist_p95_daily_rain_mm: float = 25.0,
        current_rain_mm: float = 0.0,
    ) -> float:
        """Main entry point: returns normalized waterlogging severity estimate in [0.0, 1.0]."""
        rain_sev = cls.calculate_rainfall_severity(
            forecast_rain_24h_mm=forecast_rain_24h_mm,
            forecast_rain_6h_mm=forecast_rain_6h_mm,
            current_rain_mm=current_rain_mm,
        )
        terrain_vuln = cls.calculate_terrain_vulnerability(
            elevation_m=elevation_m,
            slope_deg=slope_deg,
        )
        soil_sev = cls.calculate_soil_severity(soil_moisture)
        hist_sev = cls.calculate_historical_severity(
            hist_waterlog_count=hist_waterlog_count,
            hist_p95_daily_rain_mm=hist_p95_daily_rain_mm,
        )

        raw_severity = (
            WEIGHT_RAIN_SEVERITY * rain_sev +
            WEIGHT_TERRAIN_VULNERABILITY * terrain_vuln +
            WEIGHT_SOIL_SATURATION * soil_sev +
            WEIGHT_HISTORICAL_TENDENCY * hist_sev
        )

        return float(np.clip(raw_severity, 0.0, 1.0))
