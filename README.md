# AI-QA-Agent-IBM-BOB-2.0-Hackathon-Project
# QA Agent

**An AI-powered QA agent that tests your web app for you.**
Upload a project zip, and QA Agent runs it in an isolated Docker sandbox, explores the live UI with a browser agent, and returns a bug report with screenshots and plain-English explanations.

Built for the **IBM Bob 2.0 Hackathon** (lablab.ai), Sep 25-27, 2026.

---

## The Problem

Manual QA is slow. Small teams and hackathon projects often skip it entirely, so obvious UI and functional bugs (broken buttons, console errors, failing API calls, blank pages) ship to users. Clicking through every page before each release takes time that most teams don't have.

## The Solution

QA Agent automates that first-pass review:

1. **Upload** a zip of your project (React frontend and/or FastAPI backend).
2. **Describe** what the app does and what flow to test (optional), plus test login credentials if the app has auth.
3. **Sandbox**: the project is started inside a resource-limited Docker container, so untrusted code never runs directly on the host.
4. **Explore**: a Playwright-driven headless Chromium agent visits the app's routes, clicks through interactive elements, and records screenshots, console errors, and failed network requests.
5. **Analyze**: a vision-capable LLM reviews the evidence and flags real bugs, with severity, confidence, and an explanation of why each one is a bug.
6. **Report**: results are shown in a report with severity counts, expandable bug cards, and a screenshot viewer.
7. **Cleanup**: the container is removed and uploaded secrets are deleted after every scan.

## How It Works

```
Upload zip -> Extract (size-limited) -> Docker sandbox -> Playwright agent
    -> Evidence (screenshots, console errors, network failures)
    -> LLM bug analysis -> Bug report -> Cleanup
```

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS |
| Backend | FastAPI (Python) |
| Sandbox | Docker (via the Docker SDK for Python) |
| Browser agent | Playwright (Chromium) |
| Bug analysis | Vision-capable LLM API |
| Storage | Local filesystem (no database) |
| Background jobs | FastAPI `BackgroundTasks` + in-memory status registry |

## Supported Projects (MVP scope)

- React (Vite) frontend and/or FastAPI backend.
- Other stacks (Django, Express, Rails, etc.) are not supported yet and should be rejected at upload time.
- One scan at a time.

## Project Structure

```
.
├── bob_sessions/          # IBM Bob task session summary screenshots (hackathon requirement)
├── frontend/              # React app: Home, Upload, Scanning, Report pages
├── backend/
│   ├── app/
│   │   ├── main.py        # FastAPI app, CORS, routers
│   │   ├── api/           # upload, scan, reports endpoints
│   │   ├── core/          # config, docker_manager
│   │   ├── agent/         # browser agent, report builder
│   │   ├── analysis/      # vision analysis, code review
│   │   ├── models/        # Pydantic schemas
│   │   ├── storage/       # filesystem storage helpers
│   │   └── workers/       # scan orchestration
│   ├── docker/            # sandbox.Dockerfile, docker-compose.yml
│   └── requirements.txt
├── uploads/               # uploaded zips (gitignored)
└── sandbox-runs/          # per-scan working folders and evidence (gitignored)
```

## Prerequisites

- **Python 3.11+**
- **Node.js 20+**
- **Docker Desktop** (on Windows this requires WSL2 and hardware virtualization enabled)
- An API key for the vision LLM provider used for bug analysis

## Setup

### 1. Clone and configure

```bash
git clone https://github.com/M-USMAN-KHILJI/AI-QA-Agent-IBM-BOB-2.0-Hackathon-Project.git
cd AI-QA-Agent-IBM-BOB-2.0-Hackathon-Project
```

Copy the example env file and fill in your own values. **Never commit a real `.env`.**

```bash
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

### 2. Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate            # Mac/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
python -m playwright install chromium
```

### 3. Build the sandbox base image (once)

Build this ahead of time so scans don't wait on slow installs. From the repo root:

```bash
docker build -f backend/docker/sandbox.Dockerfile -t qa-sandbox-base:latest .
```

Confirm Docker is reachable:

```bash
docker ps
```

### 4. Run the backend

From the `backend` folder:

```powershell
uvicorn app.main:app --reload --reload-dir app
```

`--reload-dir app` matters: without it, uvicorn watches the scan folders too and restarts mid-scan when an upload is extracted.

Check it's alive: open `http://127.0.0.1:8000/health` (expect `{"status":"ok"}`). Interactive API docs are at `http://127.0.0.1:8000/docs`.

### 5. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/upload` | Upload a project zip, returns a `run_id` and starts a scan |
| GET | `/scan/{run_id}` | Scan status, progress, and current step |
| GET | `/reports/{run_id}` | Final bug report for a completed scan |

## Security Notes

QA Agent runs code uploaded by strangers, so safety is part of the design:

- Each scan runs in a Docker container with memory and CPU limits, a non-root user, and restricted networking.
- Uploads are limited to **50 MB compressed**, and extraction aborts past **200 MB uncompressed** (zip-bomb protection).
- Uploaded `.env` files and test credentials are deleted after the scan.
- Containers are always torn down, even when a scan fails.
- Do not commit API keys or IBM Cloud credentials. Exposed credentials in a public repo can get your IBM Cloud account suspended.

## Known Limitations

- Login walls, CAPTCHAs, and email-verification steps can block the agent. When that happens, the report says so instead of pretending the page passed.
- Apps that need environment variables that weren't provided may fail to start. The report names the missing variables where it can detect them.
- LLM findings can include false positives, so each finding carries a confidence level.
- Running Docker, the dev servers, and a browser together is memory-hungry. On an 8 GB machine, cap Docker's memory in its settings and close other apps during scans.

## How IBM Bob Was Used

This project was built with **IBM Bob 2.0** as the development environment, using Agent mode and subagents to build and iterate on the sandbox, browser agent, analysis, and UI. Task session summary screenshots from each team member are in [`bob_sessions/`](./bob_sessions).

> Add a short write-up here covering which Bob features you used (Agent mode, parallel tasks, subagents, document understanding) and what each one did for the project.

## Team

- Add team name and members here.

## Demo

- Video demo: _add link_
- Problem and solution statement: _add link or section_

## License

Add a license here if you choose one.
