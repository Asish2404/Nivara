import os
import sys
import time
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import torchvision
import torchvision.transforms as transforms
import torchvision.models as models
from torchvision.datasets import ImageFolder

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BACKEND_DIR, "models")
os.makedirs(MODEL_DIR, exist_ok=True)
SAVE_PATH = os.path.join(MODEL_DIR, "mobilenet_v3_drainage.pth")

# Preferred dataset paths in the repository
DATASET_PATHS = [
    os.path.join(BACKEND_DIR, "app", "data", "Flood dataset"),
    os.path.join(BACKEND_DIR, "data", "dataset"),
]


def find_dataset():
    for p in DATASET_PATHS:
        # Check flood_train_ or train
        if os.path.exists(os.path.join(p, "flood_train_")):
            return os.path.join(p, "flood_train_"), os.path.join(p, "flood_test_")
        if os.path.exists(os.path.join(p, "train")):
            return os.path.join(p, "train"), os.path.join(p, "val")
    return None, None


def train(epochs: int = 5, batch_size: int = 32, lr: float = 1e-3):
    train_dir, val_dir = find_dataset()
    if not train_dir or not os.path.exists(train_dir):
        print(f"[Error] Dataset directory not found in {DATASET_PATHS}")
        sys.exit(1)

    print(f"Loading training data from: {train_dir}")
    if val_dir and os.path.exists(val_dir):
        print(f"Loading validation data from: {val_dir}")

    # Standard MobileNetV3 transforms
    train_tf = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    val_tf = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    train_ds = ImageFolder(train_dir, transform=train_tf)
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=0)

    val_loader = None
    if val_dir and os.path.exists(val_dir):
        val_ds = ImageFolder(val_dir, transform=val_tf)
        val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=0)
        print(f"Validation dataset size: {len(val_ds)} samples")

    # Map dataset directory names to canonical classes ["drainage", "not_drainage"]
    raw_classes = train_ds.classes
    canonical_classes = []
    for c in raw_classes:
        c_lower = c.lower()
        if "non" in c_lower or "not" in c_lower:
            canonical_classes.append("not_drainage")
        elif "flood" in c_lower or "drain" in c_lower:
            canonical_classes.append("drainage")
        else:
            canonical_classes.append(c)

    print(f"Raw dataset classes: {raw_classes} -> Canonical: {canonical_classes}")
    print(f"Total training samples: {len(train_ds)}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training device: {device}")

    # Load MobileNetV3-Small backbone
    weights = models.MobileNet_V3_Small_Weights.DEFAULT
    model = models.mobilenet_v3_small(weights=weights)

    # Freeze convolutional feature extractor for fast fine-tuning
    for param in model.features.parameters():
        param.requires_grad = False

    # Replace classifier head with binary classification layer
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, len(canonical_classes))
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.classifier.parameters(), lr=lr)

    start_time = time.time()
    for epoch in range(epochs):
        model.train()
        total_loss = 0.0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)

        train_acc = correct / total
        train_loss = total_loss / total

        val_acc_str = ""
        if val_loader:
            model.eval()
            val_correct = 0
            val_total = 0
            with torch.no_grad():
                for v_img, v_lbl in val_loader:
                    v_img, v_lbl = v_img.to(device), v_lbl.to(device)
                    v_out = model(v_img)
                    _, v_pred = torch.max(v_out, 1)
                    val_correct += (v_pred == v_lbl).sum().item()
                    val_total += v_lbl.size(0)
            val_acc = val_correct / val_total
            val_acc_str = f" | Val Acc: {val_acc:.1%}"

        print(f"Epoch [{epoch+1}/{epochs}] Loss: {train_loss:.4f} | Train Acc: {train_acc:.1%}{val_acc_str}")

    elapsed = time.time() - start_time
    print(f"Training completed in {elapsed:.1f}s")

    # Save fine-tuned checkpoint
    model.eval()
    torch.save({
        "model_state_dict": model.state_dict(),
        "classes": canonical_classes,
        "raw_classes": raw_classes,
        "architecture": "mobilenet_v3_small",
        "num_classes": len(canonical_classes),
        "trained_samples": len(train_ds),
        "timestamp": time.time(),
        "description": "Fine-tuned MobileNetV3-Small on KWI Municipal Flood & Drainage Dataset",
    }, SAVE_PATH)

    print(f"[Success] Fine-tuned model saved to: {SAVE_PATH} ({os.path.getsize(SAVE_PATH) / 1024 / 1024:.2f} MB)")


if __name__ == "__main__":
    train(epochs=5, batch_size=32, lr=1e-3)
