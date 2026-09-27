"""Inference Module for Supervisor Water-Level Verification Model.

Performs surface & depth prediction using fine-tuned MobileNetV2.
Returns prediction, confidence score, and full class probability distribution.
Applies strict confidence threshold gating (< 0.70 -> UNCERTAIN).
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional, Union
import numpy as np
from PIL import Image

# Suppress TF logs
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
import tensorflow as tf

from ..config import (
    CLASS_NAMES,
    KERAS_MODEL_PATH,
    CLASS_NAMES_PATH,
    CONFIDENCE_THRESHOLD,
    IMAGE_SIZE,
)
from ..preprocessing.preprocessing import validate_image_quality


class WaterDepthPredictor:
    """Singleton inference engine for the Supervisor Water Depth Model."""

    _instance: Optional["WaterDepthPredictor"] = None

    def __init__(self):
        self.model: Optional[tf.keras.Model] = None
        self.class_names = CLASS_NAMES
        self.confidence_threshold = CONFIDENCE_THRESHOLD
        self._load_model()

    @classmethod
    def get_instance(cls) -> "WaterDepthPredictor":
        if cls._instance is None:
            cls._instance = WaterDepthPredictor()
        return cls._instance

    def _load_model(self):
        """Loads trained Keras model and class mapping."""
        if CLASS_NAMES_PATH.exists():
            try:
                with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.class_names = data.get("classes", CLASS_NAMES)
            except Exception as e:
                print(f"[WARN] Error reading class names: {e}")

        if KERAS_MODEL_PATH.exists():
            try:
                self.model = tf.keras.models.load_model(str(KERAS_MODEL_PATH))
                print(f"[INFO] WaterDepthPredictor: Loaded model from {KERAS_MODEL_PATH}")
            except Exception as e:
                print(f"[ERROR] Could not load model from {KERAS_MODEL_PATH}: {e}")
                self.model = None
        else:
            print(f"[WARN] Keras model file not found at {KERAS_MODEL_PATH}. Model training may be required.")
            self.model = None

    def predict(
        self,
        image_input: Union[str, Path, Image.Image, bytes],
        custom_threshold: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Runs model inference on the provided image input.

        Output format:
        {
            "prediction": "knee",  # clear, ankle, between, knee, thigh, uncertain
            "confidence": 0.87,
            "raw_prediction": "knee",
            "probabilities": {
                "clear": 0.01,
                "ankle": 0.04,
                "between": 0.06,
                "knee": 0.87,
                "thigh": 0.02,
                "uncertain": 0.00
            },
            "passed_confidence_threshold": True
        }
        """
        threshold = custom_threshold if custom_threshold is not None else self.confidence_threshold

        # First validate basic image quality
        is_valid, quality_reason, metrics = validate_image_quality(image_input)
        if not is_valid:
            probs = {c: 0.0 for c in self.class_names}
            probs["uncertain"] = 1.0
            return {
                "prediction": "uncertain",
                "confidence": 0.0,
                "raw_prediction": "uncertain",
                "probabilities": probs,
                "passed_confidence_threshold": False,
                "quality_error": quality_reason,
                "quality_metrics": metrics,
            }

        # Convert to PIL Image
        img = None
        if isinstance(image_input, (str, Path)):
            img = Image.open(image_input).convert("RGB")
        elif isinstance(image_input, bytes):
            import io
            img = Image.open(io.BytesIO(image_input)).convert("RGB")
        elif isinstance(image_input, Image.Image):
            img = image_input.convert("RGB")
        else:
            raise ValueError("Unsupported image input type")

        # Resize to expected input size (224, 224)
        resized = img.resize(IMAGE_SIZE, Image.Resampling.BILINEAR)
        img_arr = np.array(resized, dtype=np.float32)
        batch = np.expand_dims(img_arr, axis=0)  # Shape (1, 224, 224, 3)

        if self.model is None:
            # Re-attempt loading in case model was trained recently
            self._load_model()

        if self.model is None:
            raise RuntimeError("Supervisor Water Depth Model is not initialized or model file is missing.")

        raw_preds = self.model.predict(batch, verbose=0)[0]  # Shape (6,)
        probs = {self.class_names[i]: round(float(raw_preds[i]), 4) for i in range(len(self.class_names))}

        best_idx = int(np.argmax(raw_preds))
        raw_prediction = self.class_names[best_idx]
        confidence = round(float(raw_preds[best_idx]), 4)

        # Rule: If confidence < threshold (0.70), prediction MUST become 'uncertain'
        if confidence < threshold:
            final_prediction = "uncertain"
            passed_threshold = False
        else:
            final_prediction = raw_prediction
            passed_threshold = True

        return {
            "prediction": final_prediction,
            "confidence": confidence,
            "raw_prediction": raw_prediction,
            "probabilities": probs,
            "passed_confidence_threshold": passed_threshold,
            "quality_metrics": metrics,
        }


def get_predictor() -> WaterDepthPredictor:
    return WaterDepthPredictor.get_instance()
