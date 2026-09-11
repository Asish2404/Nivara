from pathlib import Path
import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

BASE_DIR = Path(__file__).resolve().parents[3]  # Points to Backend/
DATA = BASE_DIR / "app" / "data" / "waterlogging" / "training_dataset.csv"
MODEL = BASE_DIR / "app" / "ml" / "models" / "waterlogging_model.joblib"

FEATURES = [
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

TARGET = "waterlogged"


def main():
    df = pd.read_csv(DATA)

    missing = set(FEATURES + [TARGET]) - set(df.columns)
    if missing:
        raise ValueError(f"Missing: {sorted(missing)}")

    if df[TARGET].nunique() < 2:
        raise ValueError(
            "You need both 0 and 1 labels to train the classifier."
        )

    X = df[FEATURES]
    y = df[TARGET].astype(int)

    stratify = y if y.value_counts().min() >= 2 else None

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=stratify,
    )

    pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("model", RandomForestClassifier(
            n_estimators=400,
            max_depth=10,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )),
    ])

    pipeline.fit(X_train, y_train)

    pred = pipeline.predict(X_test)
    prob = pipeline.predict_proba(X_test)[:, 1]

    print("\n=== MODEL RESULT ===")
    print("Rows:", len(df))
    print("Train:", len(X_train))
    print("Test:", len(X_test))
    print("Accuracy:", round(accuracy_score(y_test, pred), 4))

    if len(set(y_test)) == 2:
        print("ROC-AUC:", round(roc_auc_score(y_test, prob), 4))

    print("\nClassification report:")
    print(classification_report(y_test, pred, zero_division=0))

    print("Confusion matrix:")
    print(confusion_matrix(y_test, pred))

    rf = pipeline.named_steps["model"]

    importance = pd.Series(
        rf.feature_importances_,
        index=FEATURES
    ).sort_values(ascending=False)

    print("\nFeature importance:")
    print(importance)

    MODEL.parent.mkdir(parents=True, exist_ok=True)

    joblib.dump(
        {
            "model": pipeline,
            "features": FEATURES,
            "high_threshold": 0.70,
            "medium_threshold": 0.40,
        },
        MODEL,
    )

    print(f"\nSaved model: {MODEL}")


if __name__ == "__main__":
    main()
