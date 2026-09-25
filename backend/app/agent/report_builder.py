"""
report_builder.py — Compiles BugFindings into a final ScanReport

Public API:
  build_report(run_id, findings, total_pages_visited) -> ScanReport
      - Sorts findings: critical → high → medium → low.
      - Computes summary_counts per severity level.
      - Writes sandbox-runs/{run_id}/report.json via file_store.save_report().
      - Returns the ScanReport object.

ScanReport shape (see models/schemas.py):
  { run_id, created_at, total_pages_visited, findings, summary_counts }
"""

# TODO: implement build_report
