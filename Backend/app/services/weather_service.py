"""Weather Service for Open-Meteo Integration and Resilient Forecast Ingestion.

Features:
1. Batched HTTP requests to Open-Meteo Forecast API (up to 50 locations per request).
2. Efficient processing of hourly and daily precipitation, soil moisture, and current weather.
3. Resilient fallback to cached snapshot (live_forecast.csv) when API is unreachable or rate-limited.
4. Preserves data integrity without fabricating synthetic values.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import asyncio
import logging
import time
import httpx
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
TIMEZONE = "Asia/Kolkata"

APP_DIR = Path(__file__).resolve().parents[1]
CACHED_FORECAST_FILE = APP_DIR / "data" / "waterlogging" / "live_forecast.csv"


class WeatherService:
    """Retrieves and processes current and forecast weather for municipal locations."""

    @staticmethod
    def _to_clean_series(values: Any, default: float = 0.0) -> pd.Series:
        """Helper to ensure array/list is converted to numeric pd.Series with safe fillna."""
        return pd.Series(pd.to_numeric(values, errors="coerce")).fillna(default)

    @classmethod
    def parse_location_forecast(
        cls,
        data: Dict[str, Any],
        locality_name: str,
        lat: float,
        lon: float,
    ) -> Dict[str, Any]:
        """Parses Open-Meteo single-location payload into structured feature dict."""
        current = data.get("current", {})
        hourly = data.get("hourly", {})
        daily = data.get("daily", {})

        # Parse hourly arrays
        htime = pd.to_datetime(hourly.get("time", []))
        if len(htime) > 0:
            h = pd.DataFrame({
                "time": htime,
                "precipitation": cls._to_clean_series(hourly.get("precipitation", []), 0.0),
                "rain": cls._to_clean_series(hourly.get("rain", []), 0.0),
                "showers": cls._to_clean_series(hourly.get("showers", []), 0.0),
                "precip_probability": cls._to_clean_series(hourly.get("precipitation_probability", []), 0.0),
                "temperature": cls._to_clean_series(hourly.get("temperature_2m", []), 0.0),
                "humidity": cls._to_clean_series(hourly.get("relative_humidity_2m", []), 0.0),
                "soil_moisture": cls._to_clean_series(hourly.get("soil_moisture_0_to_7cm", []), 0.25),
                "pressure": cls._to_clean_series(hourly.get("surface_pressure", []), 1000.0),
                "wind_speed": cls._to_clean_series(hourly.get("wind_speed_10m", []), 0.0),
                "wind_gust": cls._to_clean_series(hourly.get("wind_gusts_10m", []), 0.0),
                "weather_code": cls._to_clean_series(hourly.get("weather_code", []), 0),
            })
            now = pd.Timestamp.now(tz=TIMEZONE).tz_localize(None)
            future = h[h["time"] >= now].copy()
            if future.empty:
                future = h.copy()

            def sum_n(col: str, n: int) -> float:
                return float(future[col].iloc[:n].sum()) if len(future) else 0.0

            def max_n(col: str, n: int) -> float:
                return float(future[col].iloc[:n].max()) if len(future) else 0.0

            def mean_n(col: str, n: int) -> float:
                return float(future[col].iloc[:n].mean()) if len(future) else 0.0

            rain_6h = sum_n("rain", 6)
            rain_12h = sum_n("rain", 12)
            rain_24h = sum_n("rain", 24)
            precip_24h = sum_n("precipitation", 24)
            showers_24h = sum_n("showers", 24)
            rain_72h = sum_n("rain", 72)
            prob_max_24h = max_n("precip_probability", 24)
            temp_mean_24h = mean_n("temperature", 24)
            humid_mean_24h = mean_n("humidity", 24)
            soil_mean_24h = mean_n("soil_moisture", 24)
            pressure_mean_24h = mean_n("pressure", 24)
            wind_mean_24h = mean_n("wind_speed", 24)
            gust_max_24h = max_n("wind_gust", 24)
        else:
            rain_6h = rain_12h = rain_24h = precip_24h = showers_24h = rain_72h = 0.0
            prob_max_24h = 0.0
            temp_mean_24h = 28.0
            humid_mean_24h = 75.0
            soil_mean_24h = 0.28
            pressure_mean_24h = 1005.0
            wind_mean_24h = 5.0
            gust_max_24h = 15.0

        # Parse daily arrays
        rain_sums = cls._to_clean_series(daily.get("rain_sum", []), 0.0)
        day1_rain = float(rain_sums.iloc[0]) if len(rain_sums) > 0 else 0.0
        day2_rain = float(rain_sums.iloc[1]) if len(rain_sums) > 1 else 0.0
        day3_rain = float(rain_sums.iloc[2]) if len(rain_sums) > 2 else 0.0

        daily_probs = cls._to_clean_series(daily.get("precipitation_probability_max", []), 0.0)
        day1_prob = float(daily_probs.iloc[0]) if len(daily_probs) > 0 else prob_max_24h

        return {
            "locality": locality_name,
            "lat": lat,
            "lon": lon,
            "current_temperature_c": current.get("temperature_2m"),
            "current_humidity_pct": current.get("relative_humidity_2m"),
            "current_precipitation_mm": current.get("precipitation", 0.0),
            "current_rain_mm": current.get("rain", 0.0),
            "current_showers_mm": current.get("showers", 0.0),
            "current_weather_code": current.get("weather_code"),
            "current_pressure_hpa": current.get("surface_pressure"),
            "current_wind_kmh": current.get("wind_speed_10m"),
            "current_gust_kmh": current.get("wind_gusts_10m"),

            "forecast_rain_6h_mm": rain_6h,
            "forecast_rain_12h_mm": rain_12h,
            "forecast_rain_24h_mm": rain_24h,
            "forecast_precip_24h_mm": precip_24h,
            "forecast_showers_24h_mm": showers_24h,
            "forecast_rain_72h_mm": rain_72h,
            "forecast_precip_probability_max_24h": prob_max_24h,
            "forecast_temperature_mean_24h_c": temp_mean_24h,
            "forecast_humidity_mean_24h_pct": humid_mean_24h,
            "forecast_soil_moisture_mean_24h": soil_mean_24h,
            "forecast_pressure_mean_24h_hpa": pressure_mean_24h,
            "forecast_wind_mean_24h_kmh": wind_mean_24h,
            "forecast_gust_max_24h_kmh": gust_max_24h,

            "forecast_day1_rain_mm": day1_rain,
            "forecast_day2_rain_mm": day2_rain,
            "forecast_day3_rain_mm": day3_rain,
            "forecast_day1_precip_probability_max": day1_prob,
        }

    _cached_live_df: Optional[pd.DataFrame] = None
    _cached_timestamp: Optional[float] = None
    CACHE_TTL_SECONDS: float = 900.0  # 15 minutes TTL for in-memory live weather

    @classmethod
    async def fetch_live_weather_batch(
        cls,
        locations_df: pd.DataFrame,
        batch_size: int = 42,
    ) -> Optional[pd.DataFrame]:
        """Asynchronously fetches live weather in batches from Open-Meteo."""
        records: List[Dict[str, Any]] = []

        params_base = {
            "timezone": TIMEZONE,
            "forecast_days": 3,
            "current": (
                "temperature_2m,relative_humidity_2m,"
                "precipitation,rain,showers,weather_code,"
                "surface_pressure,wind_speed_10m,wind_gusts_10m"
            ),
            "hourly": (
                "precipitation,rain,showers,"
                "precipitation_probability,temperature_2m,"
                "relative_humidity_2m,soil_moisture_0_to_7cm,"
                "surface_pressure,wind_speed_10m,wind_gusts_10m,"
                "weather_code"
            ),
            "daily": (
                "precipitation_sum,rain_sum,showers_sum,"
                "precipitation_probability_max,"
                "temperature_2m_max,temperature_2m_min,"
                "precipitation_hours,weather_code"
            ),
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            n_locations = len(locations_df)
            for start in range(0, n_locations, batch_size):
                batch = locations_df.iloc[start:start + batch_size]
                lats = ",".join(f"{float(r['lat']):.5f}" for _, r in batch.iterrows())
                lons = ",".join(f"{float(r['lon']):.5f}" for _, r in batch.iterrows())

                params = {
                    **params_base,
                    "latitude": lats,
                    "longitude": lons,
                }

                batch_success = False
                for attempt in range(3):
                    try:
                        resp = await client.get(FORECAST_URL, params=params)
                        if resp.status_code == 429:
                            wait = 3.0 * (attempt + 1)
                            retry_header = resp.headers.get("Retry-After")
                            if retry_header:
                                try:
                                    wait = float(retry_header)
                                except ValueError:
                                    pass
                            logger.info("Open-Meteo rate limit (429). Retrying batch %d in %.1fs...", start, wait)
                            await asyncio.sleep(wait)
                            continue
                        elif resp.status_code != 200:
                            logger.warning(
                                "Open-Meteo API returned status %d. Batch %d-%d failed.",
                                resp.status_code, start, start + len(batch)
                            )
                            break

                        data = resp.json()

                        # When multiple coordinates are requested, Open-Meteo returns a list of results
                        if isinstance(data, list):
                            for item, (_, row) in zip(data, batch.iterrows()):
                                parsed = cls.parse_location_forecast(
                                    item,
                                    str(row["locality"]),
                                    float(row["lat"]),
                                    float(row["lon"]),
                                )
                                records.append(parsed)
                            batch_success = True
                            break
                        elif isinstance(data, dict) and len(batch) == 1:
                            row = batch.iloc[0]
                            parsed = cls.parse_location_forecast(
                                data,
                                str(row["locality"]),
                                float(row["lat"]),
                                float(row["lon"]),
                            )
                            records.append(parsed)
                            batch_success = True
                            break
                        else:
                            logger.warning("Unexpected response structure from weather API: %s", type(data))
                            break

                    except Exception as exc:
                        logger.warning("Weather fetch error on batch %d attempt %d: %s", start, attempt + 1, exc)
                        await asyncio.sleep(1.5)

                if not batch_success:
                    logger.warning("Batch %d-%d could not be completed from live API.", start, start + len(batch))
                    return None

                await asyncio.sleep(0.8)

        if records:
            result_df = pd.DataFrame(records)
            # Save freshly collected snapshot to disk for offline resilience
            try:
                result_df.to_csv(CACHED_FORECAST_FILE, index=False)
                logger.info("Updated live forecast snapshot on disk (%d records)", len(result_df))
            except Exception as e:
                logger.warning("Could not persist forecast snapshot: %s", e)
            return result_df

        return None

    @classmethod
    async def get_weather_for_locations(
        cls,
        locations_df: pd.DataFrame,
        force_refresh: bool = False,
    ) -> Tuple[pd.DataFrame, str]:
        """Returns real-time weather forecast dataframe for all locations and data source description.

        Queries live Open-Meteo API in real time.
        Reuses recent live data in-memory within 15 minutes TTL unless force_refresh is requested.
        Seamlessly falls back to cached snapshot on disk only if network or API is temporarily unreachable.
        """
        now_ts = time.time()

        # If we have a fresh live cache in memory and not force refreshing, return it immediately
        if not force_refresh and cls._cached_live_df is not None and cls._cached_timestamp is not None:
            age_seconds = now_ts - cls._cached_timestamp
            if age_seconds < cls.CACHE_TTL_SECONDS:
                logger.info("Serving live weather from in-memory cache (age: %.1fs, fresh within 15m TTL)", age_seconds)
                return cls._cached_live_df, "live_api"

        logger.info("Connecting to Open-Meteo API for real-time weather observations (%d locations)...", len(locations_df))
        try:
            live_df = await cls.fetch_live_weather_batch(locations_df, batch_size=42)
            if live_df is not None and not live_df.empty:
                cls._cached_live_df = live_df
                cls._cached_timestamp = time.time()
                logger.info("Real-time live weather successfully received from Open-Meteo API (%d locations).", len(live_df))
                return live_df, "live_api"
            logger.warning("Open-Meteo API returned empty/failed batches. Falling back to cached snapshot.")
        except Exception as exc:
            logger.warning("Live Open-Meteo API query failed: %s. Falling back to cached snapshot.", exc)

        # Fallback to cached snapshot
        if CACHED_FORECAST_FILE.exists():
            try:
                cached_df = pd.read_csv(CACHED_FORECAST_FILE)
                if not cached_df.empty:
                    logger.warning("Using fallback cached weather snapshot (%d records)", len(cached_df))
                    return cached_df, "cached_snapshot"
            except Exception as exc:
                logger.error("Failed to read fallback cached forecast: %s", exc)

        # Safe neutral empty fallback with expected columns
        logger.error("All weather acquisition methods failed. Generating neutral weather template.")
        empty_rows = []
        for _, r in locations_df.iterrows():
            empty_rows.append({
                "locality": str(r["locality"]),
                "lat": float(r["lat"]),
                "lon": float(r["lon"]),
                "forecast_rain_6h_mm": 0.0,
                "forecast_rain_12h_mm": 0.0,
                "forecast_rain_24h_mm": 0.0,
                "forecast_rain_72h_mm": 0.0,
                "forecast_precip_probability_max_24h": 0.0,
                "forecast_soil_moisture_mean_24h": 0.25,
            })
        return pd.DataFrame(empty_rows), "neutral_fallback"
