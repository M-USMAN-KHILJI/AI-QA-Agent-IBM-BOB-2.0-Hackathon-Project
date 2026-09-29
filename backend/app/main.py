"""
main.py — FastAPI application entry point.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import upload, scan, reports, auth
from app.core.database import init_db
from app.core.docker_manager import _sweep_stale_containers


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize PostgreSQL database tables & cleanup stale sandboxes
    init_db()
    _sweep_stale_containers()
    yield
    # Shutdown: clean up on server close
    _sweep_stale_containers()


app = FastAPI(
    title="AI QA Agent API",
    version="1.0.0",
    description="Autonomous sandbox testing engine for React & FastAPI applications",
    lifespan=lifespan,
)

# ── CORS Middleware ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount Routers with and without /api prefix for maximum compatibility ─────
app.include_router(auth.router,    prefix="/api")
app.include_router(upload.router,  prefix="/api")
app.include_router(scan.router,    prefix="/api")
app.include_router(reports.router, prefix="/api")

app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(scan.router)
app.include_router(reports.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "AI QA Agent Backend", "version": "1.0.0"}
