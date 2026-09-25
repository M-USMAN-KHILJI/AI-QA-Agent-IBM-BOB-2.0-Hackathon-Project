"""
scan_worker.py — Background scan orchestrator

Public API:
  run_scan(run_id) -> None
      Called by FastAPI BackgroundTasks after a successful upload.
      Orchestrates the full scan pipeline:
        1. Update status → "running"
        2. docker_manager.start_sandbox()          (progress 10%)
        3. browser_agent.run_agent()               (progress 50%)
        4. vision_analysis.analyze_page() × N      (progress 80%)
        5. code_review.review_source()             (progress 90%)
        6. report_builder.build_report()           (progress 100%)
        7. Update status → "complete"

      Wrapped in try/finally:
        finally: docker_manager.stop_sandbox(), file_store.delete_credentials()
      On exception: status → "failed", error message stored.

scan_registry: dict[str, ScanStatus]
    Module-level dict imported by api/scan.py to serve status poll requests.
"""

scan_registry: dict = {}

# TODO: implement run_scan
