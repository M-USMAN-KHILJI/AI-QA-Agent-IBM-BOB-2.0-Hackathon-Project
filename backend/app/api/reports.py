"""
reports.py — GET /reports/{run_id}
"""
from fastapi import APIRouter, HTTPException, status
from app.storage.file_store import load_report, list_all_reports

router = APIRouter(tags=["Reports"])


@router.get("/reports")
@router.get("/scans")
async def list_reports():
    """Lists all completed scan reports for display in the recent scans dashboard."""
    return list_all_reports()


@router.get("/reports/{run_id}")
@router.get("/report/{run_id}")
async def get_report(run_id: str):
    """Loads and returns the compiled QA report for a finished scan."""
    report = load_report(run_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report for scan ID '{run_id}' not found or still processing.",
        )
    return report
