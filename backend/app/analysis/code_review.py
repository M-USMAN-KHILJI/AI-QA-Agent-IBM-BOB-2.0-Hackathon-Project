"""
code_review.py — Lightweight static source code analysis

Public API:
  review_source(run_id, project_dir) -> list[BugFinding]
      Scans the uploaded project's source files for obvious code-quality issues:
        - console.log() calls left in production code.
        - TODO / FIXME comments.
        - Environment variables referenced in code but absent from .env / .env.example.
      Returns low-severity BugFinding objects for each hit.

All findings produced here have severity="low" and confidence="high".
"""

# TODO: implement review_source, _scan_for_console_logs, _scan_for_todos, _check_env_vars
