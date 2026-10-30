"""
Database management module for AI-Based Deepfake Detection System.
Handles persistent storage of analysis history and performance records using SQLite.
Supports three classification states: Likely Authentic, Potential Deepfake, and Inconclusive.
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "deepfake_detection.db")

def get_db_connection() -> sqlite3.Connection:
    """Create and return a database connection with dict-like row access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database tables for analysis history and system metadata."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analyses (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            media_type TEXT NOT NULL,
            file_size_bytes INTEGER NOT NULL,
            duration_seconds REAL,
            resolution TEXT,
            result TEXT NOT NULL,
            confidence REAL NOT NULL,
            real_probability REAL NOT NULL,
            fake_probability REAL NOT NULL,
            reliability TEXT DEFAULT 'Medium',
            prediction_consistency TEXT DEFAULT 'Medium',
            usable_face_frames INTEGER DEFAULT 1,
            frames_analyzed INTEGER NOT NULL,
            faces_detected INTEGER NOT NULL,
            suspicious_frames_count INTEGER NOT NULL,
            processing_time_seconds REAL NOT NULL,
            decision_explanation TEXT,
            generalization_warning TEXT,
            indicators_json TEXT,
            metadata_json TEXT,
            timeline_json TEXT,
            suspicious_frames_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS model_performance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            evaluation_type TEXT NOT NULL DEFAULT 'dataset',
            model_name TEXT NOT NULL,
            dataset_name TEXT NOT NULL,
            accuracy REAL NOT NULL,
            precision REAL NOT NULL,
            recall REAL NOT NULL,
            f1_score REAL NOT NULL,
            roc_auc REAL,
            confusion_matrix_json TEXT NOT NULL,
            training_curves_json TEXT,
            input_size TEXT NOT NULL,
            number_of_classes INTEGER NOT NULL,
            training_date TEXT NOT NULL,
            epochs INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Check if migration for new columns is needed
    cursor.execute("PRAGMA table_info(analyses)")
    columns = [col["name"] for col in cursor.fetchall()]
    if "reliability" not in columns:
        cursor.execute("ALTER TABLE analyses ADD COLUMN reliability TEXT DEFAULT 'Medium'")
    if "prediction_consistency" not in columns:
        cursor.execute("ALTER TABLE analyses ADD COLUMN prediction_consistency TEXT DEFAULT 'Medium'")
    if "usable_face_frames" not in columns:
        cursor.execute("ALTER TABLE analyses ADD COLUMN usable_face_frames INTEGER DEFAULT 1")
    if "decision_explanation" not in columns:
        cursor.execute("ALTER TABLE analyses ADD COLUMN decision_explanation TEXT")
    if "generalization_warning" not in columns:
        cursor.execute("ALTER TABLE analyses ADD COLUMN generalization_warning TEXT")

    # Check if evaluation_type column exists in model_performance
    cursor.execute("PRAGMA table_info(model_performance)")
    mp_cols = [col["name"] for col in cursor.fetchall()]
    if "evaluation_type" not in mp_cols:
        cursor.execute("ALTER TABLE model_performance ADD COLUMN evaluation_type TEXT DEFAULT 'dataset'")
    if "roc_auc" not in mp_cols:
        cursor.execute("ALTER TABLE model_performance ADD COLUMN roc_auc REAL")

    conn.commit()
    conn.close()

def save_analysis(record: Dict[str, Any]) -> str:
    """Save an analysis record to the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO analyses (
            id, filename, media_type, file_size_bytes, duration_seconds, resolution,
            result, confidence, real_probability, fake_probability,
            reliability, prediction_consistency, usable_face_frames,
            frames_analyzed, faces_detected, suspicious_frames_count,
            processing_time_seconds, decision_explanation, generalization_warning,
            indicators_json, metadata_json, timeline_json, suspicious_frames_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        record["id"],
        record["filename"],
        record["media_type"],
        record.get("file_size_bytes", 0),
        record.get("duration_seconds"),
        record.get("resolution", "N/A"),
        record["result"],
        record["confidence"],
        record["real_probability"],
        record["fake_probability"],
        record.get("reliability", "Medium"),
        record.get("prediction_consistency", "Medium"),
        record.get("usable_face_frames", record.get("faces_detected", 1)),
        record["frames_analyzed"],
        record["faces_detected"],
        record["suspicious_frames_count"],
        record["processing_time_seconds"],
        record.get("decision_explanation", ""),
        record.get("generalization_warning", ""),
        json.dumps(record.get("indicators", {})),
        json.dumps(record.get("metadata", {})),
        json.dumps(record.get("timeline", [])),
        json.dumps(record.get("suspicious_frames", [])),
        record.get("created_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    ))
    
    conn.commit()
    conn.close()
    return record["id"]

def get_all_analyses(query: Optional[str] = None, filter_result: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve all analyses with optional search and 3-way result filtering."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    sql = "SELECT id, filename, media_type, result, confidence, reliability, created_at, frames_analyzed, processing_time_seconds FROM analyses WHERE 1=1"
    params = []
    
    if query:
        sql += " AND (filename LIKE ? OR id LIKE ?)"
        params.extend([f"%{query}%", f"%{query}%"])
        
    if filter_result and filter_result != "all":
        fl = filter_result.lower()
        if fl in ["authentic", "likely authentic"]:
            sql += " AND result = 'Likely Authentic'"
        elif fl in ["deepfake", "potential deepfake", "potential deepfake detected"]:
            sql += " AND result LIKE '%Deepfake%'"
        elif fl in ["inconclusive"]:
            sql += " AND result = 'Inconclusive'"
            
    sql += " ORDER BY created_at DESC"
    
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    results = [dict(row) for row in rows]
    conn.close()
    return results

def get_analysis_by_id(analysis_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a full analysis record by its ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
        
    data = dict(row)
    data["indicators"] = json.loads(data["indicators_json"]) if data["indicators_json"] else {}
    data["metadata"] = json.loads(data["metadata_json"]) if data["metadata_json"] else {}
    data["timeline"] = json.loads(data["timeline_json"]) if data["timeline_json"] else []
    data["suspicious_frames"] = json.loads(data["suspicious_frames_json"]) if data["suspicious_frames_json"] else []
    return data

def delete_analysis(analysis_id: str) -> bool:
    """Delete an analysis record by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM analyses WHERE id = ?", (analysis_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def get_model_performance(eval_type: str = "dataset") -> Optional[Dict[str, Any]]:
    """Retrieve model performance metrics by evaluation type ('dataset' or 'real_world')."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM model_performance WHERE evaluation_type = ? ORDER BY id DESC LIMIT 1", (eval_type,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
        
    data = dict(row)
    data["confusion_matrix"] = json.loads(data["confusion_matrix_json"]) if data.get("confusion_matrix_json") else None
    data["training_curves"] = json.loads(data["training_curves_json"]) if data.get("training_curves_json") else None
    return data

def save_performance_evaluation(record: Dict[str, Any]) -> int:
    """Save an evaluation record (dataset or real-world)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO model_performance (
            evaluation_type, model_name, dataset_name, accuracy, precision, recall,
            f1_score, roc_auc, confusion_matrix_json, training_curves_json,
            input_size, number_of_classes, training_date, epochs
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        record.get("evaluation_type", "dataset"),
        record["model_name"],
        record["dataset_name"],
        record["accuracy"],
        record["precision"],
        record["recall"],
        record["f1_score"],
        record.get("roc_auc"),
        json.dumps(record.get("confusion_matrix", {})),
        json.dumps(record.get("training_curves", {})) if record.get("training_curves") else None,
        record.get("input_size", "224 x 224 x 3"),
        record.get("number_of_classes", 2),
        record.get("training_date", datetime.now().strftime("%Y-%m-%d")),
        record.get("epochs", 10)
    ))
    row_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return row_id

def get_database_stats() -> Dict[str, Any]:
    """Retrieve actual database counts for total, authentic, deepfake, and inconclusive media."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) as total FROM analyses")
    total = cursor.fetchone()["total"]
    
    cursor.execute("SELECT COUNT(*) as real_count FROM analyses WHERE result = 'Likely Authentic'")
    real_count = cursor.fetchone()["real_count"]
    
    cursor.execute("SELECT COUNT(*) as fake_count FROM analyses WHERE result LIKE '%Deepfake%'")
    fake_count = cursor.fetchone()["fake_count"]

    cursor.execute("SELECT COUNT(*) as inconcl_count FROM analyses WHERE result = 'Inconclusive'")
    inconcl_count = cursor.fetchone()["inconcl_count"]
    
    conn.close()
    return {
        "total_analyses": total,
        "real_media": real_count,
        "potential_deepfakes": fake_count,
        "inconclusive": inconcl_count
    }

# Initialize on import
init_db()
