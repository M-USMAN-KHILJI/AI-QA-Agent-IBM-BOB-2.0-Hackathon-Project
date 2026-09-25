"""
schemas.py — Pydantic data models shared across the entire backend

Models:
  UploadResponse    JSON body returned by POST /api/upload.
  ScanStatus        In-memory scan state polled by the frontend every 2 s.
  BugFinding        A single bug identified by vision analysis or static review.
  ScanReport        Final compiled report written to disk as report.json.

Note: the upload endpoint accepts multipart/form-data (UploadFile + Form fields),
NOT a JSON body — so there is no ScanRequest Pydantic model for the input side.
"""
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel


# ── Upload response ───────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    run_id: str
    status: Literal["queued"] = "queued"


# ── Progress ──────────────────────────────────────────────────────────────────

class ScanStatus(BaseModel):
    run_id: str
    status: Literal["queued", "running", "complete", "failed"]
    progress_pct: int = 0           # 0–100
    current_step: str = ""          # Human-readable step label
    error: Optional[str] = None


# ── Findings ──────────────────────────────────────────────────────────────────

class BugFinding(BaseModel):
    page_url: str
    severity: Literal["critical", "high", "medium", "low"]
    title: str
    explanation: str
    screenshot_b64: Optional[str] = None   # base64-encoded PNG for MVP
    confidence: Literal["high", "medium", "low"]


# ── Report ────────────────────────────────────────────────────────────────────

class ScanReport(BaseModel):
    run_id: str
    created_at: datetime
    total_pages_visited: int
    findings: list[BugFinding]
    summary_counts: dict[str, int]   # e.g. {"critical": 1, "high": 2, ...}
