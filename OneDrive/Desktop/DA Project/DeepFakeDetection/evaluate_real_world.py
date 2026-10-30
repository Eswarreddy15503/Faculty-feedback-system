"""
Real-World Evaluation Script for AI-Based Deepfake Detection System.
Evaluates media samples placed in real_world_test/ subdirectories (phone_camera, webcam,
compressed, social_media, unseen_videos) to assess out-of-distribution generalization.
"""

import os
import json
import time
from typing import Dict, Any, List
import model_engine
import database

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_DIR = os.path.join(BASE_DIR, "real_world_test")
CATEGORIES = ["phone_camera", "webcam", "compressed", "social_media", "unseen_videos"]

def run_evaluation() -> Dict[str, Any]:
    print("==================================================================")
    print("AI-Based Deepfake Detection System - Real-World Evaluation Runner")
    print("==================================================================")

    total_samples = 0
    ground_truth_samples = 0
    tp = 0  # True Deepfake
    tn = 0  # True Real
    fp = 0  # False Deepfake (Real photo flagged as Fake)
    fn = 0  # False Real (Fake video missed as Real)
    inconclusive_count = 0

    category_results = {}

    for cat in CATEGORIES:
        cat_dir = os.path.join(TEST_DIR, cat)
        if not os.path.exists(cat_dir):
            continue

        files = [f for f in os.listdir(cat_dir) if not f.startswith(".")]
        cat_total = len(files)
        cat_real = 0
        cat_fake = 0
        cat_inconcl = 0

        print(f"\nEvaluating Category [{cat}]: {cat_total} files found.")

        for filename in files:
            file_path = os.path.join(cat_dir, filename)
            if os.path.isdir(file_path):
                continue

            try:
                with open(file_path, "rb") as f:
                    file_bytes = f.read()

                media_type = "video" if filename.lower().endswith((".mp4", ".mov", ".avi", ".webm")) else "image"
                res = model_engine.analyze_media_file(file_bytes, filename, media_type)

                total_samples += 1
                pred = res["result"]

                if pred == "Likely Authentic":
                    cat_real += 1
                elif "Deepfake" in pred:
                    cat_fake += 1
                else:
                    cat_inconcl += 1
                    inconclusive_count += 1

                # Ground truth inference from filename label if available (_real / _fake)
                fn_lower = filename.lower()
                if "_real" in fn_lower or "real_" in fn_lower or "authentic" in fn_lower:
                    ground_truth_samples += 1
                    if pred == "Likely Authentic":
                        tn += 1
                    elif "Deepfake" in pred:
                        fp += 1
                elif "_fake" in fn_lower or "fake_" in fn_lower or "deepfake" in fn_lower or "manipulated" in fn_lower:
                    ground_truth_samples += 1
                    if "Deepfake" in pred:
                        tp += 1
                    elif pred == "Likely Authentic":
                        fn += 1

                print(f"  - {filename} -> {pred} (Conf: {res['confidence']}%, Rel: {res['reliability']})")

            except Exception as e:
                print(f"  - [ERROR] {filename}: {e}")

        category_results[cat] = {
            "total": cat_total,
            "likely_authentic": cat_real,
            "potential_deepfake": cat_fake,
            "inconclusive": cat_inconcl
        }

    # Compute metrics if ground truth samples exist
    if ground_truth_samples > 0:
        evaluated_decisive = tp + tn + fp + fn
        accuracy = round(((tp + tn) / max(1, evaluated_decisive)) * 100, 1)
        precision = round((tp / max(1, tp + fp)) * 100, 1) if (tp + fp) > 0 else 0.0
        recall = round((tp / max(1, tp + fn)) * 100, 1) if (tp + fn) > 0 else 0.0
        f1 = round((2 * precision * recall / max(1e-5, precision + recall)), 1) if (precision + recall) > 0 else 0.0
    else:
        accuracy = None
        precision = None
        recall = None
        f1 = None

    metrics_output = {
        "status": "completed" if total_samples > 0 else "unavailable",
        "evaluation_type": "real_world",
        "model_name": "ResNet50-MesoNet Hybrid Detector",
        "dataset_name": "Real-World Unseen Media (Phone Camera, Webcam, Social Media)",
        "total_evaluated_samples": total_samples,
        "ground_truth_labeled_samples": ground_truth_samples,
        "inconclusive_count": inconclusive_count,
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "confusion_matrix": {
            "true_real": tn,
            "false_fake": fp,
            "false_real": fn,
            "true_fake": tp
        } if ground_truth_samples > 0 else None,
        "category_breakdown": category_results,
        "input_size": "224 x 224 x 3",
        "number_of_classes": 2,
        "evaluation_date": time.strftime("%Y-%m-%d"),
        "epochs": 10
    }

    # Save to JSON
    json_path = os.path.join(TEST_DIR, "real_world_metrics.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(metrics_output, f, indent=2)

    print(f"\nReal-world evaluation metrics saved to: {json_path}")
    return metrics_output

if __name__ == "__main__":
    run_evaluation()
