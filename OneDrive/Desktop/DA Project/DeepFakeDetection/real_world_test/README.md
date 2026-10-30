# Real-World Media Evaluation Directory

This directory provides a structured framework for evaluating the deepfake detection pipeline on diverse, unconstrained real-world media to benchmark generalization performance and identify domain mismatch issues (such as phone camera compression or social media re-encoding).

---

## Directory Structure

```
real_world_test/
├── phone_camera/      # Place legitimate & synthetic phone camera photos / selfies (.jpg, .png)
├── webcam/            # Place low-resolution or indoor webcam captures (.jpg, .mp4)
├── compressed/        # Place recompressed media (e.g. repeated JPEG / H.264 compression)
├── social_media/      # Place media shared via messaging apps / social platforms
└── unseen_videos/     # Place unseen full-length test videos (.mp4, .mov)
```

---

## How to Run Real-World Evaluation

1. Place your own legally obtained, uncopyrighted test media into any of the category folders above.
2. Label filenames with `_real` or `_fake` if ground truth is known (e.g. `selfie_real_01.jpg` or `deepfake_face_02.mp4`), or test unlabeled media for generalization analysis.
3. Run the evaluation script:
   ```powershell
   python evaluate_real_world.py
   ```
4. The script will run the forensic analysis pipeline across all categories, calculate category-level metrics (Accuracy, Precision, Recall, F1, and Inconclusive rates), save the output to `real_world_test/real_world_metrics.json`, and update the **Model Performance** page in the web UI.
