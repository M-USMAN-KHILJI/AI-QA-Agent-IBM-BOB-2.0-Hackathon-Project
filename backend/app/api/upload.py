"""
upload.py — POST /api/upload

Accepts a .zip file + optional test credentials.
Validates file size, safely extracts the zip (zip-bomb guard),
stores credentials, and enqueues a background scan job.

Returns: { run_id: str, status: "queued" }
"""
from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

router = APIRouter()


@router.post("/upload")
async def upload_project(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    test_username: str = Form(default=None),
    test_password: str = Form(default=None),
):
    # TODO: implement zip validation, extraction, credential storage, enqueue scan
    raise NotImplementedError("upload endpoint — pending implementation")
