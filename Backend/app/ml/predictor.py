"""Predictor Module for Baseline Waterlogging ML Inference and Hybrid Risk Estimation.

Integrates:
1. Cached loading of Random Forest model artifact.
2. Baseline ML susceptibility estimation via predict_proba.
3. Hybrid combination of baseline ML susceptibility and dynamic forecast rainfall risk.
4. Robust fallback handling for edge cases.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import logging
import joblib
import numpy as np
import pandas as pd

from .feature_engineering import FeatureEngineering, MODEL_FEATURES

logger = logging.getLogger(__name__)

APP_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = APP_DIR / "ml" / "models" / "waterlogging_model.joblib"
MODEL_VERSION = "waterlogging-baseline-v1"


class WaterloggingPredictor:
    """Singleton-style cached predictor for baseline waterlogging probability."""

    _cached_bundle: Optional[Dict[str, Any]] = None
    _cached_mtime: float = 0.0

    @classmethod
    def load_model(cls, force_reload: bool = False) -> Optional[Dict[str, Any]]:
        """Loads and caches the model bundle from disk, reloading if file changed."""
        if not MODEL_PATH.exists():
            logger.warning("Model file not found at %s. Predictor will use heuristic fallback.", MODEL_PATH)
            return None

        try:
            current_mtime = MODEL_PATH.stat().st_mtime
            if not force_reload and cls._cached_bundle is not None and cls._cached_mtime == current_mtime:
                return cls._cached_bundle

            bundle = joblib.load(MODEL_PATH)
            if isinstance(bundle, dict) and "model" in bundle:
                cls._cached_bundle = bundle
                cls._cached_mtime = current_mtime
                logger.info("Successfully loaded waterlogging model bundle (%s)", MODEL_VERSION)
                return cls._cached_bundle
            else:
                logger.warning("Loaded bundle has unexpected format: %s", type(bundle))
                return None
        except Exception as exc:
            logger.error("Failed to load waterlogging model from %s: %s", MODEL_PATH, exc)
            return None

    @classmethod
    def predict_baseline_susceptibility(cls, feature_matrix: pd.DataFrame) -> np.ndarray:
        """Executes model inference on the 14-feature matrix.

        Returns array of baseline probabilities in [0.0, 1.0].
        """
        bundle = cls.load_model()
        n_samples = len(feature_matrix)

        if bundle is None:
            # Fallback heuristic based on terrain elevation and slope if model artifact missing
            elevations = pd.to_numeric(feature_matrix["elevation_m"], errors="coerce").fillna(9.0).to_numpy()
            slopes = pd.to_numeric(feature_matrix["slope_deg"], errors="coerce").fillna(0.7).to_numpy()
            elev_norm = np.clip((15.0 - elevations) / 10.0, 0.0, 1.0)
            slope_norm = np.clip((2.5 - slopes) / 2.5, 0.0, 1.0)
            return 0.6 * elev_norm + 0.4 * slope_norm

        pipeline = bundle["model"]

        try:
            # Ensure features are in exact expected order
            X = feature_matrix[MODEL_FEATURES]
            if hasattr(pipeline, "predict_proba"):
                proba = pipeline.predict_proba(X)
                # If binary classifier with 2 classes [0, 1]
                if proba.shape[1] == 2:
                    return proba[:, 1]
                else:
                    return proba[:, 0]
            elif hasattr(pipeline, "predict"):
                preds = pipeline.predict(X)
                return preds.astype(float)
            else:
                return np.full(n_samples, 0.5)
        except Exception as exc:
            logger.error("Model prediction error: %s. Using terrain baseline fallback.", exc)
            elevations = pd.to_numeric(feature_matrix["elevation_m"], errors="coerce").fillna(9.0).to_numpy()
            return np.clip((15.0 - elevations) / 10.0, 0.0, 1.0)

    @classmethod
    def compute_hybrid_probability(
        cls,
        baseline_susceptibility: float,
        forecast_rainfall_risk: float,
        ml_weight: float = 0.35,
        forecast_weight: float = 0.65,
    ) -> float:
        """Combines baseline susceptibility with live forecast rainfall risk.

        Waterlogging probability represents 'How likely is waterlogging to occur?'.
        Without rainfall, probability is suppressed; with rainfall, terrain and historical
        susceptibility modulate the risk.
        """
        # If forecast risk is near zero, waterlogging is practically impossible
        if forecast_rainfall_risk < 0.05:
            combined = baseline_susceptibility * (forecast_rainfall_risk / 0.05) * 0.2
        else:
            combined = (ml_weight * baseline_susceptibility) + (forecast_weight * forecast_rainfall_risk)

        return float(np.clip(combined, 0.0, 1.0))
