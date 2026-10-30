"""
FastAPI application for AI-Based Deepfake Detection System Using Deep Learning.
Serves the clean academic web UI and provides RESTful APIs for media analysis,
persistent SQLite history, performance evaluation metrics, and reporting.
"""

import os
import io
import time
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

import database
import model_engine

app = FastAPI(
    title="AI-Based Deepfake Detection System",
    description="Academic Digital Forensics and Deep Learning Deepfake Analysis Pipeline",
    version="1.0.0"
)

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Ensure static directory structure exists
os.makedirs(os.path.join(STATIC_DIR, "css"), exist_ok=True)
os.makedirs(os.path.join(STATIC_DIR, "js"), exist_ok=True)
os.makedirs(os.path.join(STATIC_DIR, "assets", "samples"), exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def serve_index():
    """Serve the single page application shell."""
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse(
        status_code=200,
        content={"message": "AI-Based Deepfake Detection System Backend Active."}
    )

@app.get("/api/stats")
async def get_system_stats():
    """Get actual database statistics for analyses completed."""
    stats = database.get_database_stats()
    return JSONResponse(status_code=200, content=stats)

@app.post("/api/analyze")
async def analyze_media(
    file: UploadFile = File(...),
    media_type: str = Form("image")
):
    """
    Analyze uploaded media file (Image or Video) for deepfake manipulation.
    """
    # 1. Validation: Allowed formats & size check
    allowed_image = [".jpg", ".jpeg", ".png", ".webp"]
    allowed_video = [".mp4", ".mov", ".avi", ".webm", ".mkv"]
    
    filename = file.filename or "uploaded_media"
    ext = os.path.splitext(filename)[1].lower()
    
    if media_type.lower() == "image" and ext not in allowed_image:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image format. Please upload JPG, JPEG, or PNG."
        )
    elif media_type.lower() == "video" and ext not in allowed_video:
        raise HTTPException(
            status_code=400,
            detail="Unsupported video format. Please upload MP4, MOV, or AVI."
        )
    elif ext not in allowed_image + allowed_video:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload an image (JPG, PNG) or video (MP4, MOV, AVI)."
        )

    # Read file bytes (100 MB max)
    file_bytes = await file.read()
    max_size_bytes = 100 * 1024 * 1024
    if len(file_bytes) > max_size_bytes:
        raise HTTPException(
            status_code=400,
            detail="File exceeds the 100 MB limit. Please select a smaller file."
        )
    
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty or corrupted. Please try another file."
        )

    # 2. Run analysis pipeline
    try:
        analysis_result = model_engine.analyze_media_file(
            file_bytes=file_bytes,
            filename=filename,
            media_type=media_type
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing media frames. Please try a clearer image or video."
        )

    # 3. Persist record to SQLite
    try:
        database.save_analysis(analysis_result)
    except Exception as e:
        print(f"Warning: Database save failed: {e}")

    return JSONResponse(status_code=200, content=analysis_result)

@app.get("/api/history")
async def get_history(
    query: Optional[str] = Query(None),
    filter: Optional[str] = Query("all")
):
    """Retrieve historical analysis records from SQLite."""
    records = database.get_all_analyses(query=query, filter_result=filter)
    return JSONResponse(status_code=200, content=records)

@app.get("/api/history/{analysis_id}")
async def get_history_detail(analysis_id: str):
    """Retrieve full analysis detail for a single analysis."""
    record = database.get_analysis_by_id(analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found.")
    return JSONResponse(status_code=200, content=record)

@app.delete("/api/history/{analysis_id}")
async def delete_history_record(analysis_id: str):
    """Delete an analysis record from SQLite."""
    deleted = database.delete_analysis(analysis_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Record not found or already deleted.")
    return JSONResponse(status_code=200, content={"message": "Analysis deleted successfully."})

@app.get("/api/performance")
async def get_performance_metrics(eval_type: str = Query("dataset", alias="type")):
    """Retrieve model performance metrics by evaluation type ('dataset' or 'real_world')."""
    import json
    # Check if a dedicated real_world_metrics.json exists
    if eval_type == "real_world":
        json_path = os.path.join(BASE_DIR, "real_world_test", "real_world_metrics.json")
        if os.path.exists(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    rw_data = json.load(f)
                    return JSONResponse(status_code=200, content=rw_data)
            except Exception:
                pass
                
    perf = database.get_model_performance(eval_type=eval_type)
    if not perf:
        msg = "Real-world evaluation has not been completed." if eval_type == "real_world" else "Model evaluation has not been completed."
        return JSONResponse(
            status_code=200,
            content={"status": "unavailable", "message": msg}
        )
    return JSONResponse(status_code=200, content=perf)

if __name__ == "__main__":
    import uvicorn
    print("Starting AI-Based Deepfake Detection System on http://127.0.0.1:8000")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
