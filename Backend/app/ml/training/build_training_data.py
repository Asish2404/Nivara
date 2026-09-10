from pathlib import Path
import time
import requests
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parents[3]  # Points to Backend/
DATA_DIR = BASE_DIR / "app" / "data" / "waterlogging"
LOCALITIES = DATA_DIR / "static_features.csv"
EVENTS = DATA_DIR / "waterlogging_events.csv"
OUT = DATA_DIR / "training_dataset.csv"
RAIN_CACHE = DATA_DIR / "open_meteo_cache" / "training_rain"
STATIC_FEATURE_START = pd.Timestamp("2024-01-01")

ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
TIMEZONE = "Asia/Kolkata"

session = requests.Session()


def get_json(url, params):
    for attempt in range(8):
        try:
            r = session.get(url, params=params, timeout=90)
            if r.status_code == 429:
                retry_after = r.headers.get("Retry-After")
                if retry_after:
                    try:
                        wait = float(retry_after)
                    except ValueError:
                        wait = min(10 * (attempt + 1), 60)
                else:
                    wait = min(10 * (attempt + 1), 60)
                print(f"  429 rate limit. Waiting {wait:.1f}s...")
                time.sleep(wait)
                continue
            r.raise_for_status()
            return r.json()
        except requests.RequestException:
            if attempt == 7:
                raise
            wait = min(5 * (attempt + 1), 60)
            print(f"  Request failed. Waiting {wait:.1f}s...")
            time.sleep(wait)

    raise RuntimeError(f"API failed after retries: {url}")


def get_daily_rain(lat, lon, start_date, end_date):
    RAIN_CACHE.mkdir(parents=True, exist_ok=True)
    key = f"{lat:.5f}_{lon:.5f}_{start_date}_{end_date}".replace("-", "").replace(".", "p")
    cache_file = RAIN_CACHE / f"{key}.csv"
    if cache_file.exists():
        return pd.read_csv(cache_file, parse_dates=["date"])

    data = get_json(
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

    daily = data["daily"]

    result = pd.DataFrame({
        "date": pd.to_datetime(daily["time"]),
        "rain_mm": pd.Series(pd.to_numeric(daily["rain_sum"], errors="coerce")).fillna(0),
        "precip_mm": pd.Series(pd.to_numeric(daily["precipitation_sum"], errors="coerce")).fillna(0),
        "precip_hours": pd.Series(pd.to_numeric(daily["precipitation_hours"], errors="coerce")).fillna(0),
    })
    result.to_csv(cache_file, index=False)
    return result


def antecedent_features(daily, event_date):
    event_date = pd.Timestamp(event_date).normalize()

    # IMPORTANT: only data before the event is used.
    before = daily[daily["date"] < event_date].copy()

    last1 = before.tail(1)
    last3 = before.tail(3)
    last7 = before.tail(7)
    last30 = before.tail(30)

    def total(frame, col):
        return float(frame[col].sum()) if len(frame) else 0.0

    return {
        "rain_24h_mm": total(last1, "rain_mm"),
        "rain_72h_mm": total(last3, "rain_mm"),
        "rain_7d_mm": total(last7, "rain_mm"),
        "rain_30d_mm": total(last30, "rain_mm"),
        "rainy_days_7d": int(
            (last7["rain_mm"] >= 5).sum()
        ) if len(last7) else 0,
        "heavy_rain_days_7d": int(
            (last7["rain_mm"] >= 20).sum()
        ) if len(last7) else 0,
        "max_rain_7d_mm": float(
            last7["rain_mm"].max()
        ) if len(last7) else 0.0,
        "precip_hours_7d": total(last7, "precip_hours"),
    }


def main():
    if not LOCALITIES.exists():
        raise FileNotFoundError(
            "Run collect_open_meteo.py first."
        )

    if not EVENTS.exists():
        raise FileNotFoundError(
            "Create data/processed/waterlogging_events.csv first."
        )

    loc = pd.read_csv(LOCALITIES)
    events = pd.read_csv(EVENTS)

    events["date"] = pd.to_datetime(events["date"]).dt.normalize()
    events["waterlogged"] = pd.to_numeric(
        events["waterlogged"],
        errors="coerce"
    )

    if not {"locality", "date", "waterlogged"}.issubset(events.columns):
        raise ValueError(
            "waterlogging_events.csv needs locality,date,waterlogged"
        )

    if not events["waterlogged"].isin([0, 1]).all():
        raise ValueError("waterlogged must be 0 or 1.")

    loc = loc.set_index("locality")

    rows = []

    for i, event in events.iterrows():
        name = str(event["locality"])
        date = event["date"]

        if name not in loc.index:
            print(f"Skipping unknown locality: {name}")
            continue

        info = loc.loc[name]

        # Pull enough data to calculate antecedent rainfall.
        start = (date - pd.Timedelta(days=35)).date().isoformat()
        end = (date - pd.Timedelta(days=1)).date().isoformat()

        daily = get_daily_rain(
            float(info["lat"]),
            float(info["lon"]),
            start,
            end,
        )

        rain_features = antecedent_features(daily, date)

        # Historical waterlogging count strictly before this event.
        previous = events[
            (events["locality"] == name) &
            (events["date"] < date) &
            (events["waterlogged"] == 1)
        ]

        rows.append({
            "locality": name,
            "date": date.date().isoformat(),
            "waterlogged": int(event["waterlogged"]),

            "elevation_m": info["elevation_m"],
            "slope_deg": info["slope_deg"],

            **rain_features,

            "hist_waterlog_count": len(previous),

            # The static historical rainfall summary starts in 2024.
            # Do not use it for older event labels (e.g. 2021 controls),
            # otherwise the model would see future information.
            "hist_rain_days_ge_5mm": (
                info["hist_rain_days_ge_5mm"] if date >= STATIC_FEATURE_START else np.nan
            ),
            "hist_rain_days_ge_20mm": (
                info["hist_rain_days_ge_20mm"] if date >= STATIC_FEATURE_START else np.nan
            ),
            "hist_max_daily_rain_mm": (
                info["hist_max_daily_rain_mm"] if date >= STATIC_FEATURE_START else np.nan
            ),
        })

        print(f"[{i+1}/{len(events)}] {name} {date.date()}")
        time.sleep(0.2)

    training = pd.DataFrame(rows)

    if training.empty:
        raise RuntimeError("No training rows generated.")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    training.to_csv(OUT, index=False)

    print(f"\nSaved {len(training)} rows to {OUT}")
    print(training.head().to_string(index=False))


if __name__ == "__main__":
    main()
