"""Configuration settings for Supervisor Water-Level Verification Model.

Kolkata Water Intelligence (KWI) Project.
"""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DEFAULT_RAW_DATASET_DIR = PROJECT_ROOT / "app" / "data" / "water_depth_verification_dataset"

DATASET_DIR = BASE_DIR / "dataset"
TRAIN_DIR = DATASET_DIR / "train"
VAL_DIR = DATASET_DIR / "validation"
TEST_DIR = DATASET_DIR / "test"

MODELS_DIR = BASE_DIR / "models"
REPORTS_DIR = BASE_DIR / "reports"

KERAS_MODEL_PATH = MODELS_DIR / "supervisor_water_level.keras"
TFLITE_MODEL_PATH = MODELS_DIR / "supervisor_water_level.tflite"
CLASS_NAMES_PATH = MODELS_DIR / "class_names.json"
TRAINING_HISTORY_PATH = REPORTS_DIR / "training_history.json"
METRICS_PATH = REPORTS_DIR / "evaluation_metrics.json"
DATASET_STATS_PATH = REPORTS_DIR / "dataset_statistics.json"

CLASS_NAMES = ["clear", "ankle", "between", "knee", "thigh", "uncertain"]
CLASS_TO_IDX = {name: idx for idx, name in enumerate(CLASS_NAMES)}
IDX_TO_CLASS = {idx: name for idx, name in enumerate(CLASS_NAMES)}

NUMERICAL_LEVELS = {
    "ankle": 1,
    "between": 2,
    "knee": 3,
    "thigh": 4,
}

RAW_CLASS_MAPPING = {
    "clean": "clear",
    "clear": "clear",
    "ankle_level": "ankle",
    "ankle": "ankle",
    "btn_level": "between",
    "between": "between",
    "between_level": "between",
    "knee_level": "knee",
    "knee": "knee",
    "thigh_level": "thigh",
    "thigh": "thigh",
    "uncertain": "uncertain",
}

INPUT_SHAPE = (224, 224, 3)
IMAGE_SIZE = (224, 224)
SUPPORTED_EXTENSIONS = {".webp", ".jpg", ".jpeg", ".png"}

MIN_IMAGE_DIM = 64
BLUR_LAPLACIAN_THRESHOLD = 35.0
DARK_INTENSITY_THRESHOLD = 18.0
BRIGHT_INTENSITY_THRESHOLD = 245.0

import os
CONFIDENCE_THRESHOLD = float(os.getenv("KWI_CONFIDENCE_THRESHOLD", "0.25"))
GPS_TOLERANCE_METERS = float(os.getenv("KWI_GPS_TOLERANCE_METERS", "1000.0"))

BATCH_SIZE = 32
RANDOM_SEED = 42

STAGE1_EPOCHS = 3
STAGE1_LR = 0.001

STAGE2_EPOCHS = 3
STAGE2_LR = 1e-05
UNFREEZE_TOP_LAYERS = 30
