"""Image Preprocessing, Quality Validation, and Dataset Preparation Module.

Supervisor Water-Level Verification Model - Kolkata Water Intelligence (KWI).
"""

import os
import shutil
import random
import json
from pathlib import Path
from typing import Tuple, Dict, Any, List, Optional, Union
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

from ..config import (
    CLASS_NAMES,
    CLASS_TO_IDX,
    RAW_CLASS_MAPPING,
    IMAGE_SIZE,
    MIN_IMAGE_DIM,
    BLUR_LAPLACIAN_THRESHOLD,
    DARK_INTENSITY_THRESHOLD,
    BRIGHT_INTENSITY_THRESHOLD,
    SUPPORTED_EXTENSIONS,
    DEFAULT_RAW_DATASET_DIR,
    TRAIN_DIR,
    VAL_DIR,
    TEST_DIR,
    DATASET_STATS_PATH,
    RANDOM_SEED,
)


def compute_laplacian_variance(gray_array: np.ndarray) -> float:
    """Computes Laplacian variance as a blur metric using standard finite difference convolution."""
    kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)
    h, w = gray_array.shape[:2]
    padded = np.pad(gray_array.astype(np.float32), 1, mode="edge")
    conv = (
        padded[:-2, 1:-1] * kernel[0, 1] +
        padded[2:, 1:-1] * kernel[2, 1] +
        padded[1:-1, :-2] * kernel[1, 0] +
        padded[1:-1, 2:] * kernel[1, 2] +
        padded[1:-1, 1:-1] * kernel[1, 1]
    )
    return float(np.var(conv))


def validate_image_quality(
    image_input: Union[str, Path, Image.Image, bytes],
) -> Tuple[bool, Optional[str], Dict[str, Any]]:
    """Performs strict quality and depth visibility assessment on an image.

    Checks:
    - File exists and valid format
    - Image can be opened and decoded
    - Minimum image dimensions (>= 64px)
    - Image is not completely blank (all 0s or all 255s)
    - Image is not heavily blurred (Laplacian variance >= threshold)
    - Image is not extremely dark or completely blown out

    Returns:
        (is_valid, reason_if_invalid, quality_metrics)
    """
    img = None
    if isinstance(image_input, (str, Path)):
        p = Path(image_input)
        if not p.exists():
            return False, f"File does not exist: {p.name}", {}
        if p.suffix.lower() not in SUPPORTED_EXTENSIONS:
            return False, f"Unsupported image format: {p.suffix}", {}
        try:
            img = Image.open(p)
            img.verify()
            img = Image.open(p)
        except Exception as e:
            return False, f"Corrupted or invalid image file: {str(e)}", {}
    elif isinstance(image_input, bytes):
        import io
        try:
            img = Image.open(io.BytesIO(image_input))
            img.verify()
            img = Image.open(io.BytesIO(image_input))
        except Exception as e:
            return False, f"Corrupted or invalid image data: {str(e)}", {}
    elif isinstance(image_input, Image.Image):
        img = image_input
    else:
        return False, "Unsupported image input type", {}

    if img.mode != "RGB":
        img = img.convert("RGB")

    width, height = img.size
    if width < MIN_IMAGE_DIM or height < MIN_IMAGE_DIM:
        return (
            False,
            f"Image dimensions too small ({width}x{height}, minimum is {MIN_IMAGE_DIM}x{MIN_IMAGE_DIM})",
            {"width": width, "height": height},
        )

    arr = np.array(img)
    # Check for completely black or white images
    if arr.max() == arr.min():
        return False, "Image is completely uniform/blank (no visible details)", {}

    gray = np.array(img.convert("L"))
    mean_intensity = float(np.mean(gray))

    if mean_intensity < DARK_INTENSITY_THRESHOLD:
        return (
            False,
            "Image is excessively dark / underexposed to assess water depth",
            {"mean_intensity": mean_intensity},
        )

    if mean_intensity > BRIGHT_INTENSITY_THRESHOLD:
        return (
            False,
            "Image is overexposed / blown out white (cannot evaluate road surface)",
            {"mean_intensity": mean_intensity},
        )

    laplacian_var = compute_laplacian_variance(gray)
    metrics = {
        "width": width,
        "height": height,
        "mean_intensity": round(mean_intensity, 2),
        "laplacian_var": round(laplacian_var, 2),
    }

    if laplacian_var < BLUR_LAPLACIAN_THRESHOLD:
        return (
            False,
            f"Image is excessively blurred (sharpness {laplacian_var:.1f} < {BLUR_LAPLACIAN_THRESHOLD})",
            metrics,
        )

    return True, None, metrics


def preprocess_image_array(img: Image.Image) -> np.ndarray:
    """Preprocesses a PIL Image into a normalized MobileNetV2 input tensor:
    Resizes to (224, 224, 3) and scales pixels to [-1.0, 1.0].
    """
    if img.mode != "RGB":
        img = img.convert("RGB")
    resized = img.resize(IMAGE_SIZE, Image.Resampling.BILINEAR)
    arr = np.array(resized, dtype=np.float32)
    normalized = (arr / 127.5) - 1.0
    return normalized


def generate_uncertain_samples(
    source_images: List[Path], output_dir: Path, target_count: int
) -> int:
    """Synthesizes high-quality 'uncertain' training samples to train the model to recognize unverifiable scenes.

    Generates:
    - Heavily blurred versions of real flood scenes (unusable depth reference)
    - Severely underexposed / dark nighttime scenes
    - Uniform color / occlusion / sensor noise patterns
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    generated = 0
    if not source_images or target_count <= 0:
        return 0

    random.seed(RANDOM_SEED)
    while generated < target_count:
        src = random.choice(source_images)
        try:
            with Image.open(src) as img:
                img = img.convert("RGB")
                choice = random.randint(1, 4)
                save_path = output_dir / f"uncertain_synth_{generated:05d}.jpg"

                if choice == 1:
                    # Heavy blur
                    radius = random.choice([9.0, 14.0, 18.0])
                    blurred = img.filter(ImageFilter.GaussianBlur(radius=radius))
                    blurred.save(save_path, "JPEG", quality=80)
                elif choice == 2:
                    # Extreme underexposure
                    enhancer = ImageEnhance.Brightness(img)
                    darkened = enhancer.enhance(0.08)
                    darkened.save(save_path, "JPEG", quality=80)
                elif choice == 3:
                    # Extreme blur + motion blur imitation
                    m_blur = img.filter(ImageFilter.BoxBlur(12))
                    m_blur.save(save_path, "JPEG", quality=80)
                else:
                    # High noise / sensor occlusion
                    arr = np.array(img, dtype=np.float32)
                    noise = np.random.normal(0, 45, arr.shape)
                    noisy = np.clip(arr + noise, 0, 255).astype(np.uint8)
                    Image.fromarray(noisy).save(save_path, "JPEG", quality=80)

                generated += 1
        except Exception:
            continue

    return generated


def prepare_dataset_splits(
    raw_dir: Optional[Union[str, Path]] = None,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    max_samples_per_class: Optional[int] = None,
) -> Dict[str, Any]:
    """Discovers images from raw directory, maps folders to target classes,
    synthesizes uncertain samples, and creates stratified train/validation/test folders.
    """
    raw_path = Path(raw_dir or DEFAULT_RAW_DATASET_DIR)
    if not raw_path.exists():
        raise FileNotFoundError(f"Raw dataset path does not exist: {raw_path}")

    print("\n=======================================================")
    print(f"DISCOVERING & VALIDATING IMAGES FROM: {raw_path}")
    print("=======================================================")

    class_files: Dict[str, List[Path]] = {cls: [] for cls in CLASS_NAMES}
    corrupted_files: List[str] = []
    all_valid_sources: List[Path] = []

    for entry in raw_path.iterdir():
        if entry.is_dir():
            target_class = RAW_CLASS_MAPPING.get(entry.name.lower())
            if not target_class:
                continue
            for file in entry.glob("*.*"):
                if file.suffix.lower() in SUPPORTED_EXTENSIONS:
                    try:
                        with Image.open(file) as img:
                            img.verify()
                        class_files[target_class].append(file)
                        all_valid_sources.append(file)
                    except Exception as err:
                        corrupted_files.append(f"{file.name} ({err})")

    for cls in CLASS_NAMES:
        print(f"Class '{cls}': {len(class_files[cls])} raw valid images found")

    # Generate synthetic uncertain samples if uncertain class has few or no samples
    uncertain_target = min(400, max(200, int(len(all_valid_sources) * 0.15)))
    if len(class_files["uncertain"]) < uncertain_target:
        needed = uncertain_target - len(class_files["uncertain"])
        uncertain_temp_dir = raw_path / "_temp_uncertain"
        print(f"[INFO] Synthesizing {needed} 'uncertain' samples from real flood images...")
        generate_uncertain_samples(all_valid_sources, uncertain_temp_dir, needed)
        for f in uncertain_temp_dir.glob("*.jpg"):
            class_files["uncertain"].append(f)

    # Ensure target split folders exist
    for split_dir in [TRAIN_DIR, VAL_DIR, TEST_DIR]:
        for cls in CLASS_NAMES:
            (split_dir / cls).mkdir(parents=True, exist_ok=True)

    split_stats = {"train": {}, "validation": {}, "test": {}}
    random.seed(RANDOM_SEED)

    for cls in CLASS_NAMES:
        files = list(class_files[cls])
        random.shuffle(files)
        if max_samples_per_class:
            files = files[:max_samples_per_class]

        total = len(files)
        n_train = int(total * train_ratio)
        n_val = int(total * val_ratio)

        train_files = files[:n_train]
        val_files = files[n_train : n_train + n_val]
        test_files = files[n_train + n_val :]

        for f in train_files:
            shutil.copy2(f, TRAIN_DIR / cls / f.name)
        for f in val_files:
            shutil.copy2(f, VAL_DIR / cls / f.name)
        for f in test_files:
            shutil.copy2(f, TEST_DIR / cls / f.name)

        split_stats["train"][cls] = len(train_files)
        split_stats["validation"][cls] = len(val_files)
        split_stats["test"][cls] = len(test_files)

    # Clean up temp uncertain directory if created
    uncertain_temp = raw_path / "_temp_uncertain"
    if uncertain_temp.exists():
        try:
            shutil.rmtree(uncertain_temp)
        except Exception:
            pass

    DATASET_STATS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(DATASET_STATS_PATH, "w", encoding="utf-8") as out:
        json.dump(split_stats, out, indent=2)

    print("\nDataset preparation finished successfully!")
    print(f"Train samples:      {sum(split_stats['train'].values())}")
    print(f"Validation samples: {sum(split_stats['validation'].values())}")
    print(f"Test samples:       {sum(split_stats['test'].values())}")
    print(f"Stats written to:   {DATASET_STATS_PATH}")

    return split_stats


if __name__ == "__main__":
    prepare_dataset_splits()
