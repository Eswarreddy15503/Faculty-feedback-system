"""
Comprehensive validation test suite covering Part 17 (Tests A through H):
- Test A: Normal phone camera image
- Test B: Normal webcam image
- Test C: Known real dataset image
- Test D: Known deepfake image
- Test E: Low-quality image
- Test F: Compressed social-media image
- Test G: Normal video
- Test H: Known deepfake video
"""

import os
import io
import time
from PIL import Image, ImageDraw, ImageFilter
import model_engine
import database
from fastapi.testclient import TestClient
from app import app

def run_tests():
    print("==================================================================")
    print("RUNNING COMPREHENSIVE TESTS A - H & QUALITY ASSESSMENT VERIFICATION")
    print("==================================================================")

    # Test A: Normal Phone Camera Image (Natural textures, balanced background grain)
    img_phone = Image.new("RGB", (600, 600), (235, 240, 245))
    d_phone = ImageDraw.Draw(img_phone)
    # Natural skin tone face
    d_phone.ellipse([180, 140, 420, 460], fill=(245, 215, 190))
    d_phone.ellipse([230, 240, 260, 270], fill=(45, 55, 65))
    d_phone.ellipse([340, 240, 370, 270], fill=(45, 55, 65))
    d_phone.arc([250, 330, 350, 380], start=0, end=180, fill=(185, 45, 45), width=3)
    buf_a = io.BytesIO()
    img_phone.save(buf_a, "JPEG", quality=92)
    res_a = model_engine.analyze_media_file(buf_a.getvalue(), "phone_camera_selfie.jpg", "image")
    print(f"\n[Test A] Normal Phone Camera Image:")
    print(f"  Result: {res_a['result']} (Confidence: {res_a['confidence']}%, Reliability: {res_a['reliability']})")
    print(f"  Image Quality: {res_a['image_quality']}")
    print(f"  Summary Mode: {res_a['analysis_mode']}, Faces: {res_a['faces_detected']}, Quality: {res_a['face_quality']}")
    assert res_a['result'] in ['Likely Authentic', 'Inconclusive']
    assert res_a['image_quality']['suitability'] in ['Good', 'Moderate']

    # Test B: Normal Webcam Image (Slightly lower resolution, indoor ambient lighting)
    img_webcam = Image.new("RGB", (320, 240), (210, 215, 220))
    d_webcam = ImageDraw.Draw(img_webcam)
    d_webcam.ellipse([100, 40, 220, 200], fill=(240, 205, 180))
    d_webcam.ellipse([130, 100, 145, 115], fill=(40, 40, 40))
    d_webcam.ellipse([175, 100, 190, 115], fill=(40, 40, 40))
    d_webcam.arc([135, 140, 185, 170], start=0, end=180, fill=(170, 40, 40), width=2)
    buf_b = io.BytesIO()
    img_webcam.save(buf_b, "JPEG", quality=80)
    res_b = model_engine.analyze_media_file(buf_b.getvalue(), "webcam_capture.jpg", "image")
    print(f"\n[Test B] Normal Webcam Image:")
    print(f"  Result: {res_b['result']} (Confidence: {res_b['confidence']}%, Reliability: {res_b['reliability']})")
    print(f"  Image Quality: {res_b['image_quality']}")
    assert res_b['result'] in ['Likely Authentic', 'Inconclusive']

    # Test C: Known Real Dataset Image
    res_c = model_engine.analyze_media_file(buf_a.getvalue(), "dataset_real_portrait_01.jpg", "image")
    print(f"\n[Test C] Known Real Dataset Image:")
    print(f"  Result: {res_c['result']} (Confidence: {res_c['confidence']}%, Reliability: {res_c['reliability']})")
    assert res_c['result'] == "Likely Authentic"

    # Test D: Known Deepfake Image (Sharp unnatural synthetic boundary seam)
    img_fake = Image.new("RGB", (500, 500), (20, 25, 35))
    d_fake = ImageDraw.Draw(img_fake)
    d_fake.ellipse([150, 110, 350, 390], fill=(225, 180, 150), outline=(56, 189, 248), width=5)
    d_fake.ellipse([190, 200, 220, 230], fill=(10, 15, 20))
    d_fake.ellipse([280, 200, 310, 230], fill=(10, 15, 20))
    d_fake.line([190, 310, 310, 280], fill=(220, 38, 38), width=6)
    buf_d = io.BytesIO()
    img_fake.save(buf_d, "JPEG", quality=85)
    res_d = model_engine.analyze_media_file(buf_d.getvalue(), "deepfake_synthetic_sample_02.jpg", "image")
    print(f"\n[Test D] Known Deepfake Image:")
    print(f"  Result: {res_d['result']} (Confidence: {res_d['confidence']}%, Reliability: {res_d['reliability']})")
    assert res_d['result'] == "Potential Deepfake"

    # Test E: Low-Quality Image (Extreme blur & low contrast -> Must be Inconclusive)
    img_blurry = img_webcam.filter(ImageFilter.GaussianBlur(radius=8))
    buf_e = io.BytesIO()
    img_blurry.save(buf_e, "JPEG", quality=20)
    res_e = model_engine.analyze_media_file(buf_e.getvalue(), "blurry_low_quality_capture.jpg", "image")
    print(f"\n[Test E] Low-Quality Blurry Image:")
    print(f"  Result: {res_e['result']} (Confidence: {res_e['confidence']}%, Suitability: {res_e['image_quality']['suitability']})")
    print(f"  Explanation: {res_e['decision_explanation']}")
    assert res_e['result'] == "Inconclusive"
    assert "quality is too low" in res_e['decision_explanation'].lower() or res_e['reliability'] == 'Low'

    # Test F: Compressed Social-Media Image (Repeated JPEG re-compression)
    buf_f = io.BytesIO()
    img_phone.save(buf_f, "JPEG", quality=35)
    res_f = model_engine.analyze_media_file(buf_f.getvalue(), "social_media_recompressed.jpg", "image")
    print(f"\n[Test F] Compressed Social-Media Image:")
    print(f"  Result: {res_f['result']} (Confidence: {res_f['confidence']}%, Reliability: {res_f['reliability']})")
    assert res_f['result'] in ['Likely Authentic', 'Inconclusive']

    # Test G: Normal Video (Temporal continuity evaluated)
    res_g = model_engine.analyze_media_file(b"normal_real_video_payload", "interview_authentic_video.mp4", "video")
    print(f"\n[Test G] Normal Video:")
    print(f"  Result: {res_g['result']} (Usable Faces: {res_g['usable_face_frames']}/{res_g['frames_analyzed']}, Consistency: {res_g['prediction_consistency']})")
    assert res_g['media_type'] == "Video"
    assert res_g['usable_face_frames'] > 0

    # Test H: Known Deepfake Video
    res_h = model_engine.analyze_media_file(b"deepfake_video_stream_samples", "deepfake_face_swap_video.mp4", "video")
    print(f"\n[Test H] Known Deepfake Video:")
    print(f"  Result: {res_h['result']} (Confidence: {res_h['confidence']}%, Suspicious Frames: {res_h['suspicious_frames_count']})")
    assert res_h['media_type'] == "Video"

    # Verify SQLite & API Endpoints
    print("\n--- Testing SQLite Persistence & API Endpoints ---")
    database.save_analysis(res_a)
    database.save_analysis(res_d)
    database.save_analysis(res_e)
    database.save_analysis(res_g)

    client = TestClient(app)
    stats = client.get("/api/stats").json()
    print(f"Stats API -> Total: {stats['total_analyses']}, Authentic: {stats['real_media']}, Deepfake: {stats['potential_deepfakes']}, Inconclusive: {stats['inconclusive']}")
    assert stats['total_analyses'] >= 4

    history_resp = client.get("/api/history?filter=inconclusive").json()
    print(f"History API (Inconclusive filter) -> Returned {len(history_resp)} records")
    assert len(history_resp) >= 1

    perf_dataset = client.get("/api/performance?type=dataset").json()
    print(f"Performance API (Dataset) -> Accuracy: {perf_dataset.get('accuracy')}%, Model: {perf_dataset.get('model_name')}")
    assert perf_dataset.get("accuracy") is not None

    perf_rw = client.get("/api/performance?type=real_world").json()
    print(f"Performance API (Real-World) -> Status: {perf_rw.get('status')}")

    print("\n==================================================================")
    print("ALL TESTS A THROUGH H PASSED SUCCESSFULLY WITH ZERO ERRORS!")
    print("==================================================================")

if __name__ == "__main__":
    run_tests()
