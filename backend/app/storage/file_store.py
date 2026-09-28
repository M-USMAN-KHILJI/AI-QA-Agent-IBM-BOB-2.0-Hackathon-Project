"""
file_store.py — Filesystem abstraction for per-run evidence, uploads, and reports
"""
import io
import json
import os
import shutil
import zipfile
from pathlib import Path
from typing import Any, Optional

from app.core.config import settings


def get_base_dir() -> Path:
    return settings.BASE_DIR


def get_uploads_dir() -> Path:
    p = get_base_dir() / settings.UPLOAD_DIR
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_runs_dir() -> Path:
    p = get_base_dir() / settings.SANDBOX_RUNS_DIR
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_run_dir(run_id: str) -> Path:
    p = get_runs_dir() / run_id
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_evidence_dir(run_id: str) -> Path:
    p = get_run_dir(run_id) / "evidence"
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_project_dir(run_id: str) -> Path:
    p = get_run_dir(run_id) / "project"
    p.mkdir(parents=True, exist_ok=True)
    return p


def save_upload(run_id: str, zip_bytes: bytes) -> Path:
    dest = get_uploads_dir() / f"{run_id}.zip"
    dest.write_bytes(zip_bytes)
    return dest


def extract_zip_safely(zip_bytes: bytes, target_dir: Path) -> Path:
    """
    Extracts zip file with Zip-Slip protection and uncompressed size cap (200MB).
    Raises ValueError if extraction limits or security checks fail.
    """
    target_dir.mkdir(parents=True, exist_ok=True)
    resolved_target = target_dir.resolve()
    cumulative_bytes = 0

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        for member in zf.infolist():
            # Check cumulative size
            cumulative_bytes += member.file_size
            if cumulative_bytes > settings.MAX_UNCOMPRESSED_BYTES:
                raise ValueError(
                    f"Uncompressed archive exceeds {settings.MAX_UNCOMPRESSED_BYTES // (1024 * 1024)}MB limit."
                )

            # Zip Slip check (prevent path traversal)
            member_path = (target_dir / member.filename).resolve()
            if not str(member_path).startswith(str(resolved_target)):
                raise ValueError(f"Malicious zip entry detected: {member.filename}")

        # Safe extraction
        zf.extractall(target_dir)

    return target_dir


def save_report(run_id: str, report_dict: dict[str, Any]) -> Path:
    run_dir = get_run_dir(run_id)
    report_file = run_dir / "report.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(report_dict, f, indent=2, default=str)
    return report_file


def load_report(run_id: str) -> Optional[dict[str, Any]]:
    report_file = get_run_dir(run_id) / "report.json"
    if not report_file.exists():
        return None
    with open(report_file, "r", encoding="utf-8") as f:
        return json.load(f)


def list_all_reports() -> list[dict[str, Any]]:
    """Discovers all saved report.json files across all run directories."""
    runs_dir = get_runs_dir()
    reports = []
    if runs_dir.exists():
        for run_folder in runs_dir.iterdir():
            if run_folder.is_dir():
                rep = load_report(run_folder.name)
                if rep:
                    reports.append({
                        "id": rep.get("run_id", run_folder.name),
                        "run_id": rep.get("run_id", run_folder.name),
                        "projectName": rep.get("project_name", "web-application"),
                        "framework": "React 19 + FastAPI",
                        "pagesVisited": rep.get("total_pages_visited", 1),
                        "duration": "48s",
                        "timestamp": rep.get("created_at", "Just now"),
                        "status": "complete",
                        "bugs": rep.get("summary_counts", {"critical": 0, "high": 0, "medium": 0, "low": 0}),
                    })
    return sorted(reports, key=lambda x: str(x.get("timestamp")), reverse=True)


def save_credentials(run_id: str, credentials: dict[str, Any]) -> Path:
    run_dir = get_run_dir(run_id)
    creds_file = run_dir / "credentials.json"
    with open(creds_file, "w", encoding="utf-8") as f:
        json.dump(credentials, f, indent=2)
    return creds_file


def load_credentials(run_id: str) -> Optional[dict[str, Any]]:
    creds_file = get_run_dir(run_id) / "credentials.json"
    if not creds_file.exists():
        return None
    try:
        with open(creds_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def delete_credentials(run_id: str) -> None:
    creds_file = get_run_dir(run_id) / "credentials.json"
    if creds_file.exists():
        try:
            creds_file.unlink()
        except Exception:
            pass


def delete_run(run_id: str) -> None:
    run_dir = get_runs_dir() / run_id
    if run_dir.exists():
        shutil.rmtree(run_dir, ignore_errors=True)
    zip_file = get_uploads_dir() / f"{run_id}.zip"
    if zip_file.exists():
        try:
            zip_file.unlink()
        except Exception:
            pass
