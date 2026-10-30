# AI-Based Deepfake Detection System Using Deep Learning

A clean, practical, and responsive web-based digital forensics and deep learning deepfake analysis system designed as a final-year B.Tech Computer Science & Engineering capstone project.

---

## 🌟 Key Capabilities & Reliability Improvements

1. **3-Tier Decision Framework**:
   - 🟢 **Likely Authentic**: High confidence of authenticity (fake probability $\le 0.35$).
   - 🔴 **Potential Deepfake**: High confidence of manipulation artifacts (fake probability $\ge 0.65$).
   - 🟡 **Inconclusive**: Uncertain feature distribution ($0.35 < p < 0.65$), insufficient usable facial frames, or low inter-frame prediction consistency.

2. **Mitigation of Camera-Photo False Positives**:
   - Calibrated frequency boundary comparison (comparing facial Laplacian variance against surrounding background context to preserve natural camera sensor noise).
   - Standardized RGB normalization and face localization heuristics to prevent normal camera depth-of-field or skin smoothness from triggering false manipulation alarms.

3. **Detection Modes**:
   - **Video Multi-Frame Analysis** (*Primary Detection Mode*): Aggregates face tracking, temporal landmark consistency, and peak frame anomalies across time.
   - **Single-Image Spatial Assessment** (*Secondary Assessment Mode*): Evaluates static spatial frequency and color channel correlations. Clear limitations are documented for single-frame evaluations.

4. **Empirical Detection Reliability Metric**:
   - Rated as **High**, **Medium**, or **Low** based on:
     - Number of usable face frames extracted.
     - Frame-level prediction consistency (standard deviation across video frames).
     - Spatial resolution and lighting clarity.

5. **Explainable AI & 4-Column Grad-CAM**:
   - Dynamic evidence list answering *"Why did the system produce this result?"* based on actual computed data.
   - 4-Column Frame Inspection Modal:
     1. Original Frame
     2. Detected Face Crop
     3. Grad-CAM Activation Heatmap
     4. Blended Overlay
   - Clear explainability disclaimer emphasizing that visual attention is interpretive rather than definitive forensic proof.

6. **Conservative Forensic Indicators**:
   - Cautious, academically sound terminology (*Detected*, *Not detected*, *Potential indicator*, *Unavailable*, *Insufficient evidence*) treating metadata and compression as supporting observations rather than definitive proof.

7. **Real-World Testing Framework (`real_world_test/`)**:
   - Folder structure supporting: `phone_camera/`, `webcam/`, `compressed/`, `social_media/`, and `unseen_videos/`.
   - Evaluation runner `evaluate_real_world.py` to benchmark out-of-distribution generalization.
   - Model Performance page distinguishes **Dataset Benchmark Evaluation** from **Real-World Generalization Evaluation**.

8. **SQLite Persistent History & PDF Export**:
   - Searchable history supporting all 3 result states (`Likely Authentic`, `Potential Deepfake`, `Inconclusive`) with reliability level tracking.
   - Comprehensive printable forensic PDF reports with formal academic styling.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure Python 3.10+ is installed.

### 2. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 3. Run the Web Application
```powershell
python app.py
```
Open your browser and navigate to:
```
http://127.0.0.1:8000
```

---

## 🧪 Real-World Evaluation Framework

To evaluate the system against unconstrained real-world media:
1. Place legally obtained test images or videos into the appropriate subfolders in `real_world_test/`:
   - `real_world_test/phone_camera/`
   - `real_world_test/webcam/`
   - `real_world_test/compressed/`
   - `real_world_test/social_media/`
   - `real_world_test/unseen_videos/`
2. Run the evaluation script:
   ```powershell
   python evaluate_real_world.py
   ```
3. View the generated metrics on the **Performance** page under the *Real-World Generalization Evaluation* tab.

---

## 📂 Project Structure

```
DeepFakeDetection/
├── app.py                     # FastAPI backend and static server
├── database.py                # SQLite database management (3-tier history & performance)
├── model_engine.py            # Deepfake analysis pipeline, 3-tier logic, artifact scoring & Grad-CAM
├── evaluate_real_world.py     # Evaluation runner for real-world test media
├── requirements.txt           # Project dependencies
├── deepfake_detection.db      # SQLite database file
├── real_world_test/           # Real-world test sample directories
│   ├── phone_camera/
│   ├── webcam/
│   ├── compressed/
│   ├── social_media/
│   ├── unseen_videos/
│   └── README.md
├── static/
│   ├── index.html             # Semantic Single Page Application
│   ├── css/
│   │   ├── main.css           # Design tokens, typography, and base layout
│   │   ├── components.css     # Buttons, cards, dropzone, table, modal, and timeline
│   │   └── pages.css          # Page layouts (Home, Detect, Result, History, Performance, About)
│   ├── js/
│   │   ├── app.js             # SPA router, mobile menu, toast notifications
│   │   ├── detect.js          # File upload, validation, preview, and staged progress
│   │   ├── result.js          # Result rendering, confidence chart, 4-col Grad-CAM modal
│   │   ├── history.js         # SQLite history fetching, search, 3-tier filter, and review
│   │   ├── performance.js     # Model evaluation metrics, tabs, confusion matrix & curves
│   │   ├── report.js          # Printable PDF forensic report generator
│   │   └── samples.js         # VIVA DEMO SAMPLE media generator
│   └── assets/
│       └── samples/           # Sample image assets
```
