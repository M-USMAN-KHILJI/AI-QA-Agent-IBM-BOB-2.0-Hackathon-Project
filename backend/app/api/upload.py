"""
upload.py — POST /upload endpoint
"""
import shutil
import uuid
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile, status

from app.core.config import settings
from app.models.schemas import UploadResponse
from app.storage.file_store import (
    extract_zip_safely,
    get_project_dir,
    save_credentials,
    save_upload,
)
from app.workers.scan_worker import run_scan, scan_registry
from app.models.schemas import ScanStatus

router = APIRouter(tags=["Upload"])


@router.post("/upload", response_model=UploadResponse)
async def upload_project(
    background_tasks: BackgroundTasks,
    file: Optional[UploadFile] = File(default=None),
    description: Optional[str] = Form(default=None),
    test_username: Optional[str] = Form(default=None),
    test_password: Optional[str] = Form(default=None),
    is_sample: Optional[str] = Form(default=None),
):
    run_id = f"scan-{uuid.uuid4().hex[:8]}"
    project_dir = get_project_dir(run_id)

    # 1. Handle Sample Project request
    if (is_sample and is_sample.lower() == "true") or not file:
        sample_src = settings.BASE_DIR / "sample_projects" / "demo_store"
        if sample_src.exists():
            shutil.copytree(sample_src, project_dir, dirs_exist_ok=True)
        else:
            # Create a simple test project on the fly if sample folder not present
            project_dir.mkdir(parents=True, exist_ok=True)
            index_html = project_dir / "index.html"
            index_html.write_text(
                "<!DOCTYPE html><html><head><title>Demo Store</title></head><body><h1>Demo Store</h1><button id='buy' onclick='fetch(\"/api/charge\", {method:\"POST\"})'>Checkout</button><script>console.log('App ready');</script></body></html>"
            )

    # 2. Handle User Uploaded Zip
    else:
        # Check filename
        if not file.filename.lower().endswith(".zip"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file format. Only .zip archives are supported.",
            )

        # Read zip bytes
        zip_bytes = await file.read()

        # Enforce 50 MB compressed limit
        if len(zip_bytes) > settings.MAX_ZIP_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Uploaded file exceeds {settings.MAX_ZIP_BYTES // (1024 * 1024)}MB compressed limit.",
            )

        # Save raw zip
        save_upload(run_id, zip_bytes)

        # Safe extraction with 200MB limit & Zip-Slip protection
        try:
            extract_zip_safely(zip_bytes, project_dir)
        except ValueError as err:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(err),
            )

    # 3. Store optional credentials
    if test_username and test_password:
        save_credentials(run_id, {"username": test_username, "password": test_password})

    # 4. Enqueue scan
    scan_registry[run_id] = ScanStatus(
        run_id=run_id,
        status="queued",
        progress_pct=5,
        current_step="Scan queued for execution...",
    )
    background_tasks.add_task(run_scan, run_id, description)

    return UploadResponse(run_id=run_id, status="queued")
