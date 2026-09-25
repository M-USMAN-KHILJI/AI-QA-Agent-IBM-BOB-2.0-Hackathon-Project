"""
main.py — FastAPI application entry point.

Responsibilities:
- Create the FastAPI app instance.
- Register CORSMiddleware (must come before any routes).
- Mount all API routers (upload, scan, reports).
- Expose GET /health.
- Run a stale-container cleanup sweep on startup (via lifespan).
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import upload, scan, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: remove any sandbox containers left over from a previous crash.
    # TODO: uncomment once docker_manager is implemented:
    # from app.core.docker_manager import _sweep_stale_containers
    # _sweep_stale_containers()
    yield
    # Shutdown: nothing needed for MVP.


app = FastAPI(title="QA Agent API", version="0.1.0", lifespan=lifespan)

# ── CORS — must be registered before any route is reached ───────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(upload.router,  prefix="/api")
app.include_router(scan.router,    prefix="/api")
app.include_router(reports.router, prefix="/api")


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}
