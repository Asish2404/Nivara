"""Evaluation and Metrics Generation Module.

Evaluates the trained supervisor water depth model on test set.
Computes per-class Precision, Recall, F1, and Confusion Matrix.
"""

import json
from pathlib import Path
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix

from ..config import (
    CLASS_NAMES,
    TEST_DIR,
    IMAGE_SIZE,
    BATCH_SIZE,
    KERAS_MODEL_PATH,
    METRICS_PATH,
    REPORTS_DIR,
)


def evaluate_model():
    if not KERAS_MODEL_PATH.exists():
        print(f"[ERROR] Model file not found at {KERAS_MODEL_PATH}")
        return

    test_ds = tf.keras.utils.image_dataset_from_directory(
        TEST_DIR,
        labels="inferred",
        label_mode="categorical",
        class_names=CLASS_NAMES,
        color_mode="rgb",
        batch_size=BATCH_SIZE,
        image_size=IMAGE_SIZE,
        shuffle=False,
    )

    model = tf.keras.models.load_model(str(KERAS_MODEL_PATH))
    print("\nEvaluating model on test dataset...")

    y_true = []
    y_pred = []

    for images, labels in test_ds:
        preds = model.predict(images, verbose=0)
        y_true.extend(np.argmax(labels.numpy(), axis=1))
        y_pred.extend(np.argmax(preds, axis=1))

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    report_dict = classification_report(
        y_true, y_pred, target_names=CLASS_NAMES, output_dict=True, zero_division=0
    )
    conf_mat = confusion_matrix(y_true, y_pred).tolist()

    output = {
        "classification_report": report_dict,
        "confusion_matrix": conf_mat,
        "classes": CLASS_NAMES,
    }

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    print("\nClassification Report:")
    print(classification_report(y_true, y_pred, target_names=CLASS_NAMES, zero_division=0))
    print(f"Metrics saved to {METRICS_PATH}")
    return output


if __name__ == "__main__":
    evaluate_model()
