"""
scan.py — GET /scan/{run_id} | DELETE /scan/{run_id}
"""
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import ScanStatus
from app.storage.file_store import delete_run, load_report
from app.workers.scan_worker import scan_registry

router = APIRouter(tags=["Scan Progress"])


@router.get("/scan/{run_id}", response_model=ScanStatus)
async def get_scan_status(run_id: str):
    """Returns the current progress and step for an active or finished scan."""
    if run_id in scan_registry:
        return scan_registry[run_id]

    # Check if report already exists on disk
    report = load_report(run_id)
    if report:
        return ScanStatus(
            run_id=run_id,
            status="complete",
            progress_pct=100,
            current_step="Scan complete! QA report available.",
        )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Scan with ID '{run_id}' not found.",
    )


@router.delete("/scan/{run_id}")
async def delete_scan_session(run_id: str):
    """Purges scan data, logs, and artifacts from disk."""
    if run_id in scan_registry:
        del scan_registry[run_id]

    delete_run(run_id)
    return {"status": "ok", "deleted_run_id": run_id}
