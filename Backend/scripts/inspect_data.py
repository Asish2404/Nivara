import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "app" / "data" / "waterlogging"

for p in [
    DATA_DIR / "localities.csv",
    DATA_DIR / "static_features.csv",
    DATA_DIR / "live_forecast.csv",
    DATA_DIR / "training_dataset.csv",
    DATA_DIR / "waterlogging_events.csv",
]:
    print("\n", p)
    if p.exists():
        df = pd.read_csv(p)
        print("shape:", df.shape)
        print("columns:", list(df.columns))
        print(df.head(3).to_string(index=False))
    else:
        print("not generated yet")
