"""
scan_worker.py — Background scan orchestrator
"""
import traceback
from pathlib import Path
from typing import Optional

from app.agent.browser_agent import run_agent
from app.agent.report_builder import build_report
from app.analysis.code_review import review_source
from app.analysis.vision_analysis import analyze_evidence_batch
from app.core.docker_manager import start_sandbox, stop_sandbox
from app.models.schemas import BugFinding, ScanStatus
from app.storage.file_store import (
    delete_credentials,
    get_project_dir,
    load_credentials,
)

# Global in-memory dictionary for status polling
scan_registry: dict[str, ScanStatus] = {}


def run_scan(run_id: str, description: Optional[str] = None) -> None:
    """
    Executes the autonomous QA pipeline inside a background worker thread.
    Guaranteed cleanup via try/finally block.
    """
    project_dir = get_project_dir(run_id)
    credentials = load_credentials(run_id)
    sandbox_handle = None

    try:
        # Step 1: Initialize status
        scan_registry[run_id] = ScanStatus(
            run_id=run_id,
            status="running",
            progress_pct=10,
            current_step="Initializing sandbox environment and safety checks...",
        )

        # Step 2: Boot Sandbox & Run Dev Servers
        scan_registry[run_id] = ScanStatus(
            run_id=run_id,
            status="running",
            progress_pct=25,
            current_step="Booting container, installing dependencies, and testing readiness...",
        )
        sandbox_handle, base_url, host_port = start_sandbox(run_id, project_dir)

        # Step 3: Launch Playwright Agent
        scan_registry[run_id] = ScanStatus(
            run_id=run_id,
            status="running",
            progress_pct=50,
            current_step=f"Playwright agent crawling routes at {base_url} and testing interactions...",
        )
        evidence_list = run_agent(
            run_id=run_id,
            base_url=base_url,
            credentials=credentials,
            description=description,
            max_pages=8,
        )

        # Step 4: Vision & Runtime Bug Analysis
        scan_registry[run_id] = ScanStatus(
            run_id=run_id,
            status="running",
            progress_pct=75,
            current_step="Sending visual evidence & logs to AI vision model for bug classification...",
        )
        all_findings: list[BugFinding] = analyze_evidence_batch(
            evidence_list=evidence_list,
            project_description=description,
        )

        # Step 5: Static Code Review Pass
        scan_registry[run_id] = ScanStatus(
            run_id=run_id,
            status="running",
            progress_pct=90,
            current_step="Running static code review for unhandled configs and logs...",
        )
        static_findings = review_source(run_id, project_dir)
        all_findings.extend(static_findings)

        # Step 6: Compile Structured Report
        scan_registry[run_id] = ScanStatus(
            run_id=run_id,
            status="running",
            progress_pct=95,
            current_step="Compiling structured bug report and metrics...",
        )
        build_report(
            run_id=run_id,
            findings=all_findings,
            total_pages_visited=len(evidence_list) if evidence_list else 1,
        )

        # Step 7: Completed
        scan_registry[run_id] = ScanStatus(
            run_id=run_id,
            status="complete",
            progress_pct=100,
            current_step="Scan complete! QA report generated.",
        )

    except Exception as e:
        err_msg = f"{type(e).__name__}: {str(e)}"
        print(f"Scan {run_id} failed: {err_msg}")
        traceback.print_exc()
        scan_registry[run_id] = ScanStatus(
            run_id=run_id,
            status="failed",
            progress_pct=100,
            current_step="Scan failed.",
            error=err_msg,
        )

    finally:
        # Step 8: Absolute cleanup (containers stopped + credentials deleted)
        if sandbox_handle:
            stop_sandbox(sandbox_handle)
        delete_credentials(run_id)
