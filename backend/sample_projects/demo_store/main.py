from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from pathlib import Path

app = FastAPI(title="Acme Tech Store Demo")

CURRENT_DIR = Path(__file__).parent

@app.get("/")
def home():
    return FileResponse(CURRENT_DIR / "index.html")

@app.get("/cart")
def cart():
    return FileResponse(CURRENT_DIR / "index.html")

@app.get("/checkout")
def checkout():
    return FileResponse(CURRENT_DIR / "index.html")

@app.post("/api/charge")
def charge_payment():
    # Deliberate 500 error for QA Agent to detect
    raise HTTPException(
        status_code=500,
        detail="Database lock timeout in payment gateway transaction table"
    )
