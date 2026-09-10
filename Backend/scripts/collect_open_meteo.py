from pathlib import Path
import time
import requests
import numpy as np
import pandas as pd

LOCALITIES = Path("data/processed/localities.csv")
STATIC_OUT = Path("data/processed/static_features.csv")
FORECAST_OUT = Path("data/processed/live_forecast.csv")
CACHE_DIR = Path("data/processed/open_meteo_cache")
TERRAIN_CACHE = CACHE_DIR / "terrain.csv"

ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

TIMEZONE = "Asia/Kolkata"
OFFSET_DEG = 0.001
SLEEP = 2.0

session = requests.Session()


def get_json(url, params, retries=8):
    last = None

    for attempt in range(retries):
        try:
            r = session.get(url, params=params, timeout=90)

            if r.status_code == 429:
                retry_after = r.headers.get("Retry-After")
                if retry_after:
                    try:
                        wait_time = float(retry_after)
                    except ValueError:
                        wait_time = min(10 * (attempt + 1), 60)
                else:
                    wait_time = min(10 * (attempt + 1), 60)

                print(f"  429 rate limit. Waiting {wait_time:.1f}s...")
                time.sleep(wait_time)
                continue

            r.raise_for_status()
            return r.json()

        except requests.RequestException as exc:
            last = exc
            wait_time = min(5 * (attempt + 1), 60)
            print(
                f"  Request failed (attempt {attempt + 1}/{retries}): {exc}. "
                f"Retrying in {wait_time}s..."
            )
            time.sleep(wait_time)

    raise RuntimeError(f"API failed: {url}\n{last}")


def elevation_for_points(points):
    """
    Open-Meteo elevation API: up to 100 coordinate pairs/request.
    """
    result = []

    for start in range(0, len(points), 100):
        batch = points[start:start + 100]

        latitudes = ",".join(f"{p[0]:.7f}" for p in batch)
        longitudes = ",".join(f"{p[1]:.7f}" for p in batch)

        data = get_json(
            ELEVATION_URL,
            {
                "latitude": latitudes,
                "longitude": longitudes,
            },
        )

        result.extend(data["elevation"])
        time.sleep(SLEEP)

    return result


def get_slope_elevation(df):
    """
    Uses center + N/S/E/W elevation samples.
    Slope is an approximate local terrain slope in degrees.
    """
    points = []
    index_map = []

    for _, row in df.iterrows():
        lat = float(row["lat"])
        lon = float(row["lon"])

        pts = [
            (lat, lon),
            (lat + OFFSET_DEG, lon),
            (lat - OFFSET_DEG, lon),
            (lat, lon + OFFSET_DEG),
            (lat, lon - OFFSET_DEG),
        ]

        start = len(points)
        points.extend(pts)
        index_map.append((start, start + 5))

    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    # Reuse previously downloaded terrain values whenever possible.
    if TERRAIN_CACHE.exists():
        cached = pd.read_csv(TERRAIN_CACHE)
    else:
        cached = pd.DataFrame(columns=["lat", "lon", "elevation_m", "slope_deg"])

    cache_key = {(round(float(r.lat), 7), round(float(r.lon), 7)): r for r in cached.itertuples()}
    missing_points = []
    missing_indices = []
    output = [None] * len(df)

    for idx, row in df.reset_index(drop=True).iterrows():
        key = (round(float(row["lat"]), 7), round(float(row["lon"]), 7))
        if key in cache_key:
            r = cache_key[key]
            output[idx] = {"elevation_m": float(r.elevation_m), "slope_deg": float(r.slope_deg)}
        else:
            start = len(missing_points)
            lat = float(row["lat"]); lon = float(row["lon"])
            missing_points.extend([
                (lat, lon), (lat + OFFSET_DEG, lon), (lat - OFFSET_DEG, lon),
                (lat, lon + OFFSET_DEG), (lat, lon - OFFSET_DEG)
            ])
            missing_indices.append((idx, start))

    if missing_points:
        print(f"Downloading terrain for {len(missing_indices)} new localities...")
        elevations = elevation_for_points(missing_points)
        north_south_m = OFFSET_DEG * 111_000.0
        new_cache_rows = []
        for idx, start in missing_indices:
            e0, en, es, ee, ew = elevations[start:start + 5]
            dz_ns = (en - es) / (2 * north_south_m)
            dz_ew = (ee - ew) / (2 * north_south_m)
            slope_deg = np.degrees(np.arctan(np.sqrt(dz_ns**2 + dz_ew**2)))
            row = df.reset_index(drop=True).iloc[idx]
            item = {"elevation_m": float(e0), "slope_deg": float(slope_deg)}
            output[idx] = item
            new_cache_rows.append({"lat": row["lat"], "lon": row["lon"], **item})
        if new_cache_rows:
            pd.concat([cached, pd.DataFrame(new_cache_rows)], ignore_index=True).drop_duplicates(
                subset=["lat", "lon"], keep="last"
            ).to_csv(TERRAIN_CACHE, index=False)

    return pd.DataFrame(output)

    # unreachable legacy implementation below
    elevations = elevation_for_points(points)

    output = []


def parse_daily_response(response):
    """
    Handles the single-location response used below.
    """
    daily = response["daily"]

    rain = pd.to_numeric(
        pd.Series(daily.get("rain_sum", [])),
        errors="coerce",
    ).fillna(0)

    precip = pd.to_numeric(
        pd.Series(daily.get("precipitation_sum", [])),
        errors="coerce",
    ).fillna(0)

    hours = pd.to_numeric(
        pd.Series(daily.get("precipitation_hours", [])),
        errors="coerce",
    ).fillna(0)

    dates = pd.to_datetime(daily["time"])

    return pd.DataFrame({
        "date": dates,
        "rain_sum_mm": rain,
        "precipitation_sum_mm": precip,
        "precipitation_hours": hours,
    })


def historical_summary(lat, lon, start_date="2024-01-01", end_date=None):
    if end_date is None:
        end_date = pd.Timestamp.now(tz=TIMEZONE).date().isoformat()

    response = get_json(
        ARCHIVE_URL,
        {
            "latitude": lat,
            "longitude": lon,
            "start_date": start_date,
            "end_date": end_date,
            "daily": "precipitation_sum,rain_sum,precipitation_hours",
            "timezone": TIMEZONE,
        },
    )

    daily = parse_daily_response(response)

    if daily.empty:
        return {
            "hist_rain_days_ge_5mm": 0,
            "hist_rain_days_ge_20mm": 0,
            "hist_max_daily_rain_mm": 0,
            "hist_p95_daily_rain_mm": 0,
            "hist_total_rain_mm": 0,
            "hist_avg_daily_rain_mm": 0,
            "hist_avg_precip_hours": 0,
        }

    return {
        "hist_rain_days_ge_5mm": int(
            (daily["rain_sum_mm"] >= 5).sum()
        ),
        "hist_rain_days_ge_20mm": int(
            (daily["rain_sum_mm"] >= 20).sum()
        ),
        "hist_max_daily_rain_mm": float(
            daily["rain_sum_mm"].max()
        ),
        "hist_p95_daily_rain_mm": float(
            daily["rain_sum_mm"].quantile(0.95)
        ),
        "hist_total_rain_mm": float(
            daily["rain_sum_mm"].sum()
        ),
        "hist_avg_daily_rain_mm": float(
            daily["rain_sum_mm"].mean()
        ),
        "hist_avg_precip_hours": float(
            daily["precipitation_hours"].mean()
        ),
    }


def current_and_forecast(lat, lon):
    """
    Gets a broad set of Open-Meteo current/hourly/daily values.
    """
    response = get_json(
        FORECAST_URL,
        {
            "latitude": lat,
            "longitude": lon,
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
        },
    )

    current = response["current"]
    hourly = response["hourly"]
    daily = response["daily"]

    htime = pd.to_datetime(hourly["time"])
    h = pd.DataFrame({
        "time": htime,
        "precipitation": pd.Series(pd.to_numeric(
            hourly["precipitation"], errors="coerce"
        )).fillna(0),
        "rain": pd.Series(pd.to_numeric(
            hourly["rain"], errors="coerce"
        )).fillna(0),
        "showers": pd.Series(pd.to_numeric(
            hourly["showers"], errors="coerce"
        )).fillna(0),
        "precip_probability": pd.Series(pd.to_numeric(
            hourly["precipitation_probability"], errors="coerce"
        )).fillna(0),
        "temperature": pd.Series(pd.to_numeric(
            hourly["temperature_2m"], errors="coerce"
        )),
        "humidity": pd.Series(pd.to_numeric(
            hourly["relative_humidity_2m"], errors="coerce"
        )),
        "soil_moisture": pd.Series(pd.to_numeric(
            hourly["soil_moisture_0_to_7cm"], errors="coerce"
        )),
        "pressure": pd.Series(pd.to_numeric(
            hourly["surface_pressure"], errors="coerce"
        )),
        "wind_speed": pd.Series(pd.to_numeric(
            hourly["wind_speed_10m"], errors="coerce"
        )),
        "wind_gust": pd.Series(pd.to_numeric(
            hourly["wind_gusts_10m"], errors="coerce"
        )),
        "weather_code": pd.Series(pd.to_numeric(
            hourly["weather_code"], errors="coerce"
        )),
    })

    now = pd.Timestamp.now(tz=TIMEZONE).tz_localize(None)
    future = h[h["time"] >= now].copy()

    if future.empty:
        future = h.copy()

    def sum_n(col, n):
        return float(future[col].iloc[:n].sum())

    def max_n(col, n):
        return float(future[col].iloc[:n].max())

    def mean_n(col, n):
        return float(future[col].iloc[:n].mean())

    d = pd.DataFrame(daily)

    # First 3 forecast days.
    rain_3d = pd.to_numeric(d["rain_sum"], errors="coerce").fillna(0)

    result = {
        "current_temperature_c": current.get("temperature_2m"),
        "current_humidity_pct": current.get("relative_humidity_2m"),
        "current_precipitation_mm": current.get("precipitation"),
        "current_rain_mm": current.get("rain"),
        "current_showers_mm": current.get("showers"),
        "current_weather_code": current.get("weather_code"),
        "current_pressure_hpa": current.get("surface_pressure"),
        "current_wind_kmh": current.get("wind_speed_10m"),
        "current_gust_kmh": current.get("wind_gusts_10m"),

        "forecast_rain_6h_mm": sum_n("rain", 6),
        "forecast_rain_12h_mm": sum_n("rain", 12),
        "forecast_rain_24h_mm": sum_n("rain", 24),
        "forecast_precip_24h_mm": sum_n("precipitation", 24),
        "forecast_showers_24h_mm": sum_n("showers", 24),
        "forecast_rain_72h_mm": sum_n("rain", 72),

        "forecast_precip_probability_max_24h": max_n(
            "precip_probability", 24
        ),
        "forecast_temperature_mean_24h_c": mean_n(
            "temperature", 24
        ),
        "forecast_humidity_mean_24h_pct": mean_n(
            "humidity", 24
        ),
        "forecast_soil_moisture_mean_24h": mean_n(
            "soil_moisture", 24
        ),
        "forecast_pressure_mean_24h_hpa": mean_n(
            "pressure", 24
        ),
        "forecast_wind_mean_24h_kmh": mean_n(
            "wind_speed", 24
        ),
        "forecast_gust_max_24h_kmh": max_n(
            "wind_gust", 24
        ),

        "forecast_day1_rain_mm": float(rain_3d.iloc[0]),
        "forecast_day2_rain_mm": float(rain_3d.iloc[1]),
        "forecast_day3_rain_mm": float(rain_3d.iloc[2]),
        "forecast_day1_precip_probability_max": float(
            pd.to_numeric(
                d["precipitation_probability_max"],
                errors="coerce"
            ).fillna(0).iloc[0]
        ),
    }

    return result


def main():
    if not LOCALITIES.exists():
        raise FileNotFoundError("Run prepare_localities.py first.")

    df = pd.read_csv(LOCALITIES)
    df = df.reset_index(drop=True)

    # Terrain is cached, so a failed later API request does not repeat elevation calls.
    terrain = get_slope_elevation(df)
    df = pd.concat([df, terrain], axis=1)

    STATIC_OUT.parent.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    # Resume from already completed rows.
    if STATIC_OUT.exists():
        static_df = pd.read_csv(STATIC_OUT)
    else:
        static_df = pd.DataFrame()
    if FORECAST_OUT.exists():
        live_df = pd.read_csv(FORECAST_OUT)
    else:
        live_df = pd.DataFrame()

    done_static = set(static_df["locality"].astype(str)) if not static_df.empty and "locality" in static_df else set()
    done_live = set(live_df["locality"].astype(str)) if not live_df.empty and "locality" in live_df else set()

    for i, row in df.iterrows():
        locality = str(row["locality"])
        print(f"\n[{i+1}/{len(df)}] {locality} ({row['lat']:.5f}, {row['lon']:.5f})")

        static_cache = CACHE_DIR / f"{i:04d}_static.csv"
        live_cache = CACHE_DIR / f"{i:04d}_live.csv"

        if locality in done_static and locality in done_live:
            print("  Already completed — skipping API calls.")
            continue

        # Per-locality cache gives resume support even if the process is interrupted
        # before the combined CSVs are written.
        if static_cache.exists():
            hist = pd.read_csv(static_cache).iloc[0].to_dict()
        else:
            hist = historical_summary(float(row["lat"]), float(row["lon"]), start_date="2024-01-01")
            pd.DataFrame([hist]).to_csv(static_cache, index=False)
            time.sleep(SLEEP)

        if live_cache.exists():
            live = pd.read_csv(live_cache).iloc[0].to_dict()
        else:
            live = current_and_forecast(float(row["lat"]), float(row["lon"]))
            pd.DataFrame([live]).to_csv(live_cache, index=False)
            time.sleep(SLEEP)

        static_row = {**row.to_dict(), **hist}
        live_row = {"locality": locality, "lat": row["lat"], "lon": row["lon"], **live}

        # Write after EVERY locality so an interruption never loses completed work.
        static_df = pd.concat([static_df[static_df["locality"].astype(str) != locality] if not static_df.empty else static_df, pd.DataFrame([static_row])], ignore_index=True)
        live_df = pd.concat([live_df[live_df["locality"].astype(str) != locality] if not live_df.empty else live_df, pd.DataFrame([live_row])], ignore_index=True)
        static_df.to_csv(STATIC_OUT, index=False)
        live_df.to_csv(FORECAST_OUT, index=False)
        done_static.add(locality); done_live.add(locality)
        print("  Saved.")

    print("\nDONE")
    print("Static:", STATIC_OUT, static_df.shape)
    print("Forecast:", FORECAST_OUT, live_df.shape)
    print("Cache:", CACHE_DIR)


if __name__ == "__main__":
    main()
