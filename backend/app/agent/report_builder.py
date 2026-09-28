"""
report_builder.py — Compiles BugFindings into a final structured ScanReport
"""
from datetime import datetime
from app.models.schemas import BugFinding, ScanReport
from app.storage.file_store import save_report


SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}


def build_report(run_id: str, findings: list[BugFinding], total_pages_visited: int) -> ScanReport:
    """
    Sorts findings by severity, calculates summary statistics,
    writes report.json to disk, and returns the ScanReport model.
    """
    # Sort findings critical -> high -> medium -> low
    sorted_findings = sorted(
        findings,
        key=lambda f: SEVERITY_ORDER.get(f.severity.lower(), 4)
    )

    summary_counts = {
      "critical": 0,
      "high": 0,
      "medium": 0,
      "low": 0,
    }

    for f in sorted_findings:
        sev = f.severity.lower()
        if sev in summary_counts:
            summary_counts[sev] += 1
        else:
            summary_counts[sev] = 1

    report = ScanReport(
        run_id=run_id,
        created_at=datetime.utcnow(),
        total_pages_visited=total_pages_visited,
        findings=sorted_findings,
        summary_counts=summary_counts,
    )

    # Persist to disk
    save_report(run_id, report.model_dump())
    return report
