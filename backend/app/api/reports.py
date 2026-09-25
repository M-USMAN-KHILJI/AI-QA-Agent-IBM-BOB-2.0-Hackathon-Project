"""
reports.py — GET /api/reports/{run_id}

Loads the completed ScanReport JSON from disk and returns it.
Returns 404 if the report does not exist yet.

ScanReport shape: { run_id, created_at, total_pages_visited,
                    findings: [BugFinding], summary_counts }
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/reports/{run_id}")
async def get_report(run_id: str):
    # TODO: load report via file_store.load_report(run_id); 404 if missing
    raise NotImplementedError("reports endpoint — pending implementation")
