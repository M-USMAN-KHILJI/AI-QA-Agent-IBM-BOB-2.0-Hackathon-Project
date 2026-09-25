"""
file_store.py — Filesystem abstraction for per-run data

All paths are rooted at settings.SANDBOX_RUNS_DIR / run_id.

Public API:
  get_run_dir(run_id)              -> Path   Returns (and creates) the run directory.
  save_upload(run_id, zip_bytes)   -> Path   Writes the raw zip to uploads/{run_id}.zip.
  save_report(run_id, report)      -> None   Writes report.json to the run directory.
  load_report(run_id)              -> dict   Reads report.json; raises FileNotFoundError if absent.
  delete_credentials(run_id)       -> None   Deletes credentials.json from the run directory.
  delete_run(run_id)               -> None   Removes the entire run directory (shutil.rmtree).
"""
from pathlib import Path

# TODO: implement all public functions above
