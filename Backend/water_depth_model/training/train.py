"""Two-Stage Transfer Learning Training Module for Supervisor Water-Level Verification.

MobileNetV2 backbone (ImageNet pre-trained) with custom classification head.
6 Classes: clear, ankle, between, knee, thigh, uncertain.
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Tuple
import numpy as np

# Suppress verbose TF logs
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
import tensorflow as tf
from tensorflow.keras import layers, models, optimizers, callbacks
from sklearn.utils.class_weight import compute_class_weight

from ..config import (
    CLASS_NAMES,
    CLASS_TO_IDX,
    INPUT_SHAPE,
    IMAGE_SIZE,
    BATCH_SIZE,
    RANDOM_SEED,
    TRAIN_DIR,
    VAL_DIR,
    TEST_DIR,
    MODELS_DIR,
    REPORTS_DIR,
    KERAS_MODEL_PATH,
    TFLITE_MODEL_PATH,
    CLASS_NAMES_PATH,
    TRAINING_HISTORY_PATH,
    METRICS_PATH,
    STAGE1_EPOCHS,
    STAGE1_LR,
    STAGE2_EPOCHS,
    STAGE2_LR,
    UNFREEZE_TOP_LAYERS,
)
from ..preprocessing.preprocessing import prepare_dataset_splits


def build_data_pipelines() -> Tuple[tf.data.Dataset, tf.data.Dataset, tf.data.Dataset, Dict[int, float]]:
    """Builds tf.data pipelines for Train, Validation, and Test sets with data augmentation applied ONLY on training data."""
    # Ensure dataset splits exist
    train_count = sum(len(list((TRAIN_DIR / c).glob("*.*"))) for c in CLASS_NAMES if (TRAIN_DIR / c).exists())
    if train_count < 10:
        print("[INFO] Dataset splits not found or empty. Preparing splits from raw dataset...")
        prepare_dataset_splits()

    train_ds = tf.keras.utils.image_dataset_from_directory(
        TRAIN_DIR,
        labels="inferred",
        label_mode="categorical",
        class_names=CLASS_NAMES,
        color_mode="rgb",
        batch_size=BATCH_SIZE,
        image_size=IMAGE_SIZE,
        shuffle=True,
        seed=RANDOM_SEED,
    )

    val_ds = tf.keras.utils.image_dataset_from_directory(
        VAL_DIR,
        labels="inferred",
        label_mode="categorical",
        class_names=CLASS_NAMES,
        color_mode="rgb",
        batch_size=BATCH_SIZE,
        image_size=IMAGE_SIZE,
        shuffle=False,
    )

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

    # Compute class weights to handle imbalance between classes
    class_counts = {}
    total_samples = 0
    all_labels = []
    for cls in CLASS_NAMES:
        cls_dir = TRAIN_DIR / cls
        count = len(list(cls_dir.glob("*.*")))
        class_counts[cls] = count
        total_samples += count
        all_labels.extend([CLASS_TO_IDX[cls]] * count)

    unique_classes = np.unique(all_labels)
    weights = compute_class_weight("balanced", classes=unique_classes, y=np.array(all_labels))
    class_weights_dict = {int(cls_idx): float(w) for cls_idx, w in zip(unique_classes, weights)}
    print(f"[INFO] Computed Class Weights: {class_weights_dict}")

    # Data augmentation pipeline (active only on training)
    data_augmentation = tf.keras.Sequential(
        [
            layers.RandomFlip("horizontal"),
            layers.RandomRotation(0.08),
            layers.RandomZoom(0.08),
            layers.RandomContrast(0.1),
        ],
        name="data_augmentation",
    )

    AUTOTUNE = tf.data.AUTOTUNE

    def preprocess_train(x, y):
        x = data_augmentation(x, training=True)
        return x, y

    def preprocess_eval(x, y):
        return x, y

    train_ds = train_ds.map(preprocess_train, num_parallel_calls=AUTOTUNE).prefetch(AUTOTUNE)
    val_ds = val_ds.map(preprocess_eval, num_parallel_calls=AUTOTUNE).prefetch(AUTOTUNE)
    test_ds = test_ds.map(preprocess_eval, num_parallel_calls=AUTOTUNE).prefetch(AUTOTUNE)

    return train_ds, val_ds, test_ds, class_weights_dict


def build_model() -> tf.keras.Model:
    """Builds MobileNetV2 transfer learning model with custom classification head for 6 classes.

    Architecture:
    Input Image (224x224x3)
        ↓
    tf.keras.applications.mobilenet_v2.preprocess_input
        ↓
    MobileNetV2(include_top=False, weights="imagenet")
        ↓
    GlobalAveragePooling2D
        ↓
    Dense(128, activation="relu")
        ↓
    Dropout(0.3)
        ↓
    Dense(6, activation="softmax")
    """
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=INPUT_SHAPE,
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False

    inputs = tf.keras.Input(shape=INPUT_SHAPE, name="input_image")
    # Preprocess inputs from [0, 255] to [-1, 1] as required by MobileNetV2
    x = tf.keras.applications.mobilenet_v2.preprocess_input(inputs)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D(name="global_avg_pool")(x)
    x = layers.Dense(128, activation="relu", name="dense_128")(x)
    x = layers.Dropout(0.3, name="dropout")(x)
    outputs = layers.Dense(len(CLASS_NAMES), activation="softmax", name="classification")(x)

    model = tf.keras.Model(inputs=inputs, outputs=outputs, name="supervisor_water_level_mobilenetv2")
    return model


def train_model() -> tf.keras.Model:
    """Executes the two-stage transfer learning training strategy:

    Stage 1: Frozen backbone, train classification head (lr=1e-3).
    Stage 2: Unfreeze top layers of MobileNetV2, fine-tune (lr=1e-5).
    """
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    # Save class names mapping
    with open(CLASS_NAMES_PATH, "w", encoding="utf-8") as f:
        json.dump(
            {
                "classes": CLASS_NAMES,
                "class_to_idx": CLASS_TO_IDX,
                "idx_to_class": {str(k): v for k, v in enumerate(CLASS_NAMES)},
            },
            f,
            indent=2,
        )

    train_ds, val_ds, test_ds, class_weights = build_data_pipelines()
    model = build_model()
    model.summary()

    metric_list = [
        "accuracy",
        tf.keras.metrics.Precision(name="precision"),
        tf.keras.metrics.Recall(name="recall"),
    ]

    # =========================================================================
    # STAGE 1: Train classification head with frozen backbone
    # =========================================================================
    print("\n=======================================================")
    print("STAGE 1: Training Custom Classification Head (Backbone Frozen)")
    print("=======================================================")

    model.compile(
        optimizer=optimizers.Adam(learning_rate=STAGE1_LR),
        loss="categorical_crossentropy",
        metrics=metric_list,
    )

    stage1_callbacks = [
        callbacks.EarlyStopping(monitor="val_loss", patience=3, restore_best_weights=True, verbose=1),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-6, verbose=1),
    ]

    history_stage1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=STAGE1_EPOCHS,
        class_weight=class_weights,
        callbacks=stage1_callbacks,
        verbose=1,
    )

    # =========================================================================
    # STAGE 2: Fine-Tuning Top Layers of MobileNetV2
    # =========================================================================
    print("\n=======================================================")
    print(f"STAGE 2: Fine-Tuning Top {UNFREEZE_TOP_LAYERS} Layers of MobileNetV2")
    print("=======================================================")

    # Get the MobileNetV2 sub-layer
    base_model = None
    for layer in model.layers:
        if "mobilenetv2" in layer.name.lower():
            base_model = layer
            break

    if base_model:
        base_model.trainable = True
        # Freeze all layers before the top UNFREEZE_TOP_LAYERS
        for layer in base_model.layers[:-UNFREEZE_TOP_LAYERS]:
            layer.trainable = False
        print(f"[INFO] Unfroze top {UNFREEZE_TOP_LAYERS} layers of backbone.")

    model.compile(
        optimizer=optimizers.Adam(learning_rate=STAGE2_LR),
        loss="categorical_crossentropy",
        metrics=metric_list,
    )

    stage2_callbacks = [
        callbacks.EarlyStopping(monitor="val_loss", patience=4, restore_best_weights=True, verbose=1),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.2, patience=2, min_lr=1e-7, verbose=1),
    ]

    history_stage2 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=STAGE2_EPOCHS,
        class_weight=class_weights,
        callbacks=stage2_callbacks,
        verbose=1,
    )

    # Save final Keras model
    print(f"\n[INFO] Saving trained model to {KERAS_MODEL_PATH}...")
    model.save(str(KERAS_MODEL_PATH))

    # Evaluate on held-out test dataset
    print("\n=======================================================")
    print("EVALUATING MODEL ON HELD-OUT TEST DATASET")
    print("=======================================================")
    eval_results = model.evaluate(test_ds, verbose=1, return_dict=True)
    print(f"[EVALUATION METRICS]: {eval_results}")

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump({k: float(v) for k, v in eval_results.items()}, f, indent=2)

    # Save training history
    combined_history = {}
    for k in history_stage1.history.keys():
        h1 = [float(v) for v in history_stage1.history[k]]
        h2 = [float(v) for v in history_stage2.history.get(k, [])]
        combined_history[k] = h1 + h2

    with open(TRAINING_HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(combined_history, f, indent=2)

    # Export TFLite model for ultra-fast edge deployment
    try:
        converter = tf.lite.TFLiteConverter.from_keras_model(model)
        tflite_model = converter.convert()
        with open(TFLITE_MODEL_PATH, "wb") as f:
            f.write(tflite_model)
        print(f"[INFO] TFLite model exported to {TFLITE_MODEL_PATH}")
    except Exception as tflite_err:
        print(f"[WARN] TFLite conversion skipped: {tflite_err}")

    print("\n>>> Model training and evaluation successfully completed!")
    return model


if __name__ == "__main__":
    train_model()
