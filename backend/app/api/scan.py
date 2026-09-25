"""
scan.py — GET /api/scan/{run_id}  |  DELETE /api/scan/{run_id}

GET  — returns current ScanStatus from the in-memory scan_registry.
DELETE — stops the container, deletes run data, removes from registry.

ScanStatus shape: { run_id, status, progress_pct, current_step, error }
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/scan/{run_id}")
async def get_scan_status(run_id: str):
    # TODO: look up scan_registry[run_id] and return ScanStatus
    raise NotImplementedError("scan status endpoint — pending implementation")


@router.delete("/scan/{run_id}")
async def delete_scan(run_id: str):
    # TODO: stop container, delete run dir, remove from registry
    raise NotImplementedError("delete scan endpoint — pending implementation")
