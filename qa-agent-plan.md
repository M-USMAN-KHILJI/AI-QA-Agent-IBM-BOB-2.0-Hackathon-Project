# QA Agent — Implementation Plan
**IBM Bob 2.0 Hackathon | Sep 25–27, 2026**

---

## Top-Level Overview

Build a full-stack AI-powered QA agent that:
1. Accepts a `.zip` of a React + FastAPI project via a polished upload UI.
2. Boots the uploaded project inside a sandboxed Docker container built from a pre-baked base image.
3. Drives a Playwright browser agent that auto-discovers and visits every reachable route from the home page.
4. Captures screenshots + console errors + failed network requests at every step.
5. Sends that evidence to IBM Bob (vision LLM) — with GPT-4o as a local fallback — to produce plain-English bug findings with severity ratings.
6. Renders a polished report page: animated progress bar, severity donut chart, side-by-side screenshot compare, and copy-to-clipboard for each bug.
7. Cleans up all containers and uploaded secrets after every scan.

**Scope constraints (MVP only):**
- Uploaded apps must be React (Vite) frontend + FastAPI backend (or either alone).
- No database — state lives in an in-memory dict + local filesystem.
- No Celery/Redis — background jobs use FastAPI `BackgroundTasks`.
- Auto-discovers links from the home page; no hardcoded route list.
- Single concurrent scan is acceptable for the demo.

---

## Sub-Tasks

---

### Sub-Task 1 — Sandbox Base Image (Dockerfile)

**Status:** `[ ] pending`

**Intent**
Build and document the Docker base image that every scan reuses. This image must have Node.js, Python, and Playwright's Chromium pre-installed so per-scan startup only installs the *uploaded project's* own dependencies — not the entire toolchain.

**Expected Outcomes**
- `backend/docker/sandbox.Dockerfile` builds without error on the host machine.
- Running a container from the image can execute `node -v`, `python3 -V`, and `playwright install --dry-run` without downloading anything.
- `docker-compose.yml` documents how to build the image locally (for reproducibility).
- Image tagged `qa-sandbox-base:latest`.

**Todo List**
1. Create `backend/docker/sandbox.Dockerfile`.
   - Base: `node:20-slim` (includes Node + npm).
   - Install Python 3.11 + pip via apt.
   - Install Playwright system deps + Chromium via `playwright install --with-deps chromium`.
   - Set a non-root user (`sandboxuser`) for container execution.
   - EXPOSE port 3000 (React dev server) and 8000 (FastAPI dev server).
2. Create `backend/docker/docker-compose.yml` with a `sandbox-base` build target.
3. Add a `README.md` section inside `backend/docker/` with one-liner build instructions.

**Relevant Context**
- Image name referenced in `docker_manager.py` (Sub-Task 3): `qa-sandbox-base:latest`.
- Non-root user referenced in resource-limiting logic (Sub-Task 3).

---

### Sub-Task 2 — Backend Skeleton (FastAPI + config)

**Status:** `[ ] pending`

**Intent**
Scaffold the FastAPI application: project layout, config, CORS middleware, and all route stubs. This is the foundation every other backend sub-task builds on.

**Expected Outcomes**
- `uvicorn backend.app.main:app --reload` starts without errors.
- `GET /health` returns `{"status": "ok"}`.
- All route modules exist and are imported (stubs returning `501` is fine at this stage).
- CORS is configured to allow requests from `http://localhost:5173` (Vite dev server).
- `python-multipart`, `fastapi`, `uvicorn` are listed in `backend/requirements.txt`.

**Todo List**
1. Create directory tree:
   ```
   backend/app/
     main.py
     api/upload.py  scan.py  reports.py
     core/config.py  docker_manager.py
     agent/browser_agent.py  crawler.py  report_builder.py
     analysis/vision_analysis.py  code_review.py
     models/schemas.py
     storage/file_store.py
     workers/scan_worker.py
   ```
2. `core/config.py` — Pydantic `Settings` with: `UPLOAD_DIR`, `SANDBOX_RUNS_DIR`, `MAX_ZIP_BYTES` (200 MB), `CONTAINER_IMAGE`, `BOB_API_KEY`, `OPENAI_API_KEY`.
3. `main.py` — create FastAPI app, add `CORSMiddleware`, mount API routers from `api/`, add `/health` route.
4. `models/schemas.py` — define Pydantic models: `ScanRequest`, `ScanStatus`, `BugFinding`, `ScanReport`.
5. `storage/file_store.py` — thin wrapper: `save_upload(run_id, zip_bytes)`, `get_run_dir(run_id)`, `save_report(run_id, report)`, `load_report(run_id)`.
6. Create `backend/requirements.txt` with all backend deps.
7. Create `backend/.gitignore` excluding `uploads/` and `sandbox-runs/`.

**Relevant Context**
- `CORS` must allow the Vite origin before any route is reached — add it first in `main.py`.
- `file_store.py` is used by both the upload API (Sub-Task 3) and report builder (Sub-Task 5).

---

### Sub-Task 3 — Upload API + Zip Safety

**Status:** `[ ] pending`

**Intent**
Implement `POST /upload` — the entry point for the entire scan. Safely receive, validate, and extract the uploaded zip, then kick off the background scan job.

**Expected Outcomes**
- `POST /upload` with a valid zip returns `{"run_id": "<uuid>", "status": "queued"}` within 2 seconds.
- Zips over 200 MB compressed are rejected with HTTP 413.
- Zips that expand beyond 200 MB are aborted mid-extraction with HTTP 422 and no partial files left on disk.
- The `run_id` directory is created and the project contents extracted there.
- A background scan task is enqueued.

**Todo List**
1. Implement `api/upload.py`:
   - Accept `UploadFile` (zip) + optional `test_username` / `test_password` form fields.
   - Check `file.size` against `MAX_ZIP_BYTES` before reading.
   - Extract with `zipfile`; track cumulative uncompressed bytes; raise if exceeded.
   - Write credentials to a per-run `credentials.json` (never anywhere else).
   - Enqueue `scan_worker.run_scan(run_id)` via `BackgroundTasks`.
   - Return `run_id`.
2. Implement `api/scan.py`:
   - `GET /scan/{run_id}` — returns current `ScanStatus` from an in-memory `scan_registry` dict (keys: `run_id`, `status`, `progress_pct`, `current_step`, `error`).
3. `workers/scan_worker.py` — orchestrator that calls docker_manager → browser_agent → report_builder in sequence, updating `scan_registry` at each step.

**Relevant Context**
- `scan_registry` is a module-level dict in `scan_worker.py`, imported by `scan.py`.
- Credentials file is deleted in Sub-Task 6 (cleanup).

---

### Sub-Task 4 — Docker Manager

**Status:** `[ ] pending`

**Intent**
Implement `docker_manager.py` — the code that starts a sandboxed container for each scan, installs the uploaded project's dependencies inside it, starts its dev servers, and does an active readiness check before returning.

**Expected Outcomes**
- `start_sandbox(run_id, project_dir)` returns a `(container, host_port_react, host_port_api)` tuple.
- Container uses the pre-built `qa-sandbox-base:latest` image.
- Container runs as non-root (`sandboxuser`), with `--memory 512m --cpus 1.0`.
- Dynamic host ports (bind to `0`) — no collisions between concurrent scans.
- Readiness check polls `http://localhost:{port}` every 2 s, up to 90 s, before returning.
- `stop_sandbox(container)` always stops + removes the container, even if called after an error.

**Todo List**
1. Implement `core/docker_manager.py` using the Docker Python SDK.
2. `start_sandbox()`:
   - Mount the project dir as a volume into `/app` in the container.
   - Run a startup script inside the container: `cd /app && npm install && npm run dev &` and/or `pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 &`.
   - Bind container port 3000 → host port 0 (auto), port 8000 → host port 0 (auto).
   - Set memory + CPU limits, `network_mode="bridge"` (not host), no elevated privileges.
   - Call `_readiness_check(host_port)` — HTTP GET loop, 2 s interval, 45-retry cap.
3. `stop_sandbox(container)`:
   - `container.stop(timeout=10)` then `container.remove(force=True)`.
   - Wrap in `try/except` — log errors but never re-raise (always completes cleanup).
4. Add a periodic stale-container sweep: on `main.py` startup, remove any `qa-sandbox-base` containers older than 30 min that weren't cleaned up.

**Relevant Context**
- Called by `scan_worker.py`; the `run` must be wrapped in `try/finally` calling `stop_sandbox`.
- `host_port_react` is the URL the Playwright agent navigates to.

---

### Sub-Task 5 — Browser Agent + Crawler

**Status:** `[ ] pending`

**Intent**
Implement the Playwright browser agent that auto-discovers and visits every reachable route starting from the home page, handles optional login, captures evidence (screenshots, console errors, network failures) at each page, and saves it to disk.

**Expected Outcomes**
- `run_agent(run_id, base_url, credentials)` produces a folder `sandbox-runs/{run_id}/evidence/` containing one subfolder per visited page.
- Each subfolder contains `screenshot.png`, `console_errors.json`, `network_failures.json`.
- Auto-discovered links: BFS crawl from `/`, following only same-origin `<a href>` links, capped at 20 pages per scan (MVP).
- If credentials are supplied, a login attempt is made first; if it fails or hits CAPTCHA/email-verify, it records "blocked by auth" and continues to public pages.
- Vite HMR WebSocket errors and hot-reload noise are filtered out of `console_errors.json`.
- Playwright uses `wait_for_load_state("networkidle")` before each capture, with a 10 s timeout.

**Todo List**
1. Implement `agent/browser_agent.py`:
   - Launch headless Chromium with Playwright.
   - Attempt login if credentials provided (fill username/password fields, click submit, detect success/failure by URL change or error text).
   - Detect CAPTCHA / email-verification pages; log as "auth_blocked" and bail.
   - Call `crawler.discover_links(page, base_url)` to get the route list.
   - For each route: navigate, `wait_for_load_state("networkidle")`, capture evidence, save.
2. Implement `agent/crawler.py`:
   - `discover_links(page, base_url)` — extract all `<a href>` on current page, filter same-origin, deduplicate, return list (max 20).
   - Iterates BFS: add newly discovered links from each visited page until cap.
3. Console/network capture:
   - Attach `page.on("console", ...)` listener; filter messages matching HMR/WebSocket noise patterns.
   - Attach `page.on("requestfailed", ...)` listener; record method, URL, failure text.
   - After navigation, call `page.screenshot(path=..., full_page=True)`.

**Relevant Context**
- Evidence folder structure is read by `vision_analysis.py` (Sub-Task 6) and `report_builder.py` (Sub-Task 7).
- HMR noise patterns to filter: `[vite]`, `[HMR]`, `WebSocket`, `ws://`.

---

### Sub-Task 6 — LLM Analysis (IBM Bob + GPT-4o fallback)

**Status:** `[ ] pending`

**Intent**
Implement `vision_analysis.py` — send each page's screenshot + console errors + network failures to IBM Bob (primary) or GPT-4o (fallback) and parse the response into structured `BugFinding` objects.

**Expected Outcomes**
- `analyze_page(screenshot_path, console_errors, network_failures)` returns a list of `BugFinding` objects.
- IBM Bob is tried first; if unavailable (API error / key missing), GPT-4o is used automatically.
- The prompt explicitly asks the LLM to: flag only functional/visual breakage (not design opinions), explain *why* each issue is a bug, and assign a severity (`critical`, `high`, `medium`, `low`).
- Each `BugFinding` includes: `page_url`, `severity`, `title`, `explanation`, `screenshot_path`, `confidence` (high/medium/low).
- Rate-limit errors are retried with exponential backoff (3 attempts, max 30 s wait).
- Screenshot + error context are batched into a single prompt per page (not separate calls).

**Todo List**
1. Implement `analysis/vision_analysis.py`:
   - `_call_bob(prompt, image_b64)` — IBM Bob vision API call with API key from config.
   - `_call_openai(prompt, image_b64)` — GPT-4o vision call.
   - `analyze_page()` — build prompt, try Bob, fall back to OpenAI, parse JSON response into `BugFinding` list.
2. Design the system prompt:
   - Role: "You are a QA engineer reviewing a web application."
   - Task: identify bugs that are clearly broken — crashes, blank pages, layout breakage, error states, broken buttons/forms.
   - Explicitly exclude: subjective design preferences, font choices, colour opinions.
   - Output format: JSON array of objects with keys `title`, `severity`, `explanation`, `confidence`.
3. Implement `analysis/code_review.py` (lightweight static pass):
   - Scan source files for obvious issues: `console.log` left in prod, TODO comments, missing `.env` vars referenced in code.
   - Return low-severity `BugFinding` objects for each hit.

**Relevant Context**
- IBM Bob API details need to be confirmed post-hackathon kickoff brief (key format, endpoint).
- `BugFinding` schema defined in `models/schemas.py` (Sub-Task 2).

---

### Sub-Task 7 — Report Builder

**Status:** `[ ] pending`

**Intent**
Compile all `BugFinding` objects from the vision analysis and static code review into a single structured `ScanReport`, save it to disk, and update the scan status to `complete`.

**Expected Outcomes**
- `build_report(run_id, findings)` writes `sandbox-runs/{run_id}/report.json` and returns a `ScanReport`.
- Report includes: `run_id`, `created_at`, `total_pages_visited`, `findings` (sorted by severity), `summary_counts` (counts per severity level).
- `GET /reports/{run_id}` returns the full `ScanReport` JSON.
- After report is saved, `scan_registry[run_id].status` is set to `complete`.

**Todo List**
1. Implement `agent/report_builder.py`:
   - Accept list of `BugFinding` + scan metadata.
   - Sort findings: critical → high → medium → low.
   - Compute `summary_counts`.
   - Write `report.json` via `file_store.save_report()`.
2. Implement `api/reports.py`:
   - `GET /reports/{run_id}` — load report via `file_store.load_report()`, return it; 404 if not found yet.
3. Update `scan_worker.py` to call `build_report` and set status to `complete` (or `failed` on exception).

**Relevant Context**
- Frontend polls `GET /scan/{run_id}` for status, then fetches `GET /reports/{run_id}` when complete.
- Report JSON is the single source of truth for the frontend report page.

---

### Sub-Task 8 — Cleanup + Security Hardening

**Status:** `[ ] pending`

**Intent**
Ensure that after every scan — success or failure — the Docker container is stopped, credentials are deleted from disk, and no sensitive data persists.

**Expected Outcomes**
- After scan completion or failure, credentials file is deleted from disk.
- Container is always stopped and removed (confirmed by wrapping scan in `try/finally`).
- `uploads/` and `sandbox-runs/` are gitignored.
- A `DELETE /scan/{run_id}` endpoint lets the frontend (or future admin) explicitly purge a run's data.

**Todo List**
1. In `scan_worker.py` wrap the full scan lifecycle in `try/finally`:
   - `finally` block: `docker_manager.stop_sandbox(container)`, `file_store.delete_credentials(run_id)`.
2. Add `file_store.delete_credentials(run_id)` — deletes `credentials.json` from the run dir.
3. Add `file_store.delete_run(run_id)` — removes the entire run directory.
4. Implement `DELETE /scan/{run_id}` in `api/scan.py`.
5. Confirm `uploads/` and `sandbox-runs/` are in `.gitignore`.

**Relevant Context**
- `stop_sandbox` already wraps in `try/except` (Sub-Task 4) — won't raise even if container is already gone.

---

### Sub-Task 9 — Frontend Scaffold + Routing

**Status:** `[ ] pending`

**Intent**
Scaffold the React (Vite + Tailwind) frontend with all four pages, routing, and the API client wired up.

**Expected Outcomes**
- `npm run dev` starts without errors on port 5173.
- Four pages route correctly: `/` (Home), `/upload` (Upload), `/scan/:runId` (Scanning), `/report/:runId` (Report).
- `api/client.js` exports typed Axios functions: `uploadProject()`, `getScanStatus()`, `getReport()`.
- Tailwind dark theme is applied globally (dark background, developer-tool aesthetic).
- All deps are in `frontend/package.json`.

**Todo List**
1. Init Vite React project in `Frontend/`.
2. Install: `axios`, `react-router-dom`, `tailwindcss`, `postcss`, `autoprefixer`.
3. Configure Tailwind (`darkMode: "class"`, extend brand colours).
4. Create `api/client.js` with the three API functions.
5. Set up `App.jsx` with `BrowserRouter` and `<Routes>` for all four pages.
6. Create page stubs: `pages/Home.jsx`, `pages/Upload.jsx`, `pages/Scanning.jsx`, `pages/Report.jsx`.
7. Set Axios `baseURL` to `http://localhost:8000`.

**Relevant Context**
- CORS on the backend (Sub-Task 2) must be allowing `http://localhost:5173`.
- `runId` from the upload response is passed as a URL param to `/scan/:runId`.

---

### Sub-Task 10 — Upload Page + Scan Progress Page

**Status:** `[ ] pending`

**Intent**
Build the upload form (drag-and-drop zip, optional credentials, submit button) and the scanning progress page (animated progress bar, step-by-step status updates).

**Expected Outcomes**
- User can drag-and-drop or click-to-select a `.zip` file; file name is shown after selection.
- Optional login credential fields (username / password) are present and collapsible.
- Submitting calls `uploadProject()`, disables the button, and navigates to `/scan/:runId`.
- Scanning page shows: animated progress bar, current step label, elapsed time, and a pulsing indicator.
- Polls `getScanStatus()` every 2 s; navigates to `/report/:runId` when status is `complete`; shows error state if status is `failed`.

**Todo List**
1. Build `components/UploadForm.jsx`:
   - Drag-and-drop zone with visual feedback (border highlight on dragover).
   - File type validation (only `.zip` accepted).
   - Collapsible credentials section.
   - Submit handler: calls API, shows loading state, handles errors.
2. Build `pages/Upload.jsx` — renders `UploadForm`.
3. Build `components/ScanProgress.jsx`:
   - Animated horizontal progress bar (value from `progress_pct`).
   - Current step text (from `current_step`).
   - Elapsed timer (client-side).
4. Build `pages/Scanning.jsx` — polls every 2 s, passes data to `ScanProgress`, handles routing on complete/failed.

**Relevant Context**
- `ScanStatus` shape: `{ run_id, status, progress_pct, current_step, error }` — mirrors `models/schemas.py`.

---

### Sub-Task 11 — Report Page (Full Polish)

**Status:** `[ ] pending`

**Intent**
Build the fully polished report page: severity donut chart, expandable bug cards, side-by-side screenshot compare, and copy-to-clipboard for each bug.

**Expected Outcomes**
- Report page fetches `getReport(runId)` and renders:
  - A donut chart showing count per severity level (critical/high/medium/low) using inline SVG or a lightweight charting lib.
  - A summary line: "X bugs found across Y pages".
  - Sorted bug cards, each showing: severity badge, title, explanation, confidence indicator, and a screenshot thumbnail.
  - Clicking a thumbnail opens a side-by-side modal: full-size screenshot on the left, bug explanation text on the right.
  - Each bug card has a "Copy" button that copies the title + explanation to clipboard.
- Empty state if no bugs found: "No issues detected. 🎉"

**Todo List**
1. Build `components/BugReport.jsx`:
   - Renders the severity summary header and the list of bug cards.
   - Each bug card: severity colour-coded badge, title, explanation text, confidence pip, thumbnail.
   - Copy button using `navigator.clipboard.writeText()`.
2. Build `components/ScreenshotViewer.jsx`:
   - Modal overlay, side-by-side layout (screenshot left, text right).
   - Close on backdrop click or ESC key.
3. Build severity donut chart as a standalone `components/DonutChart.jsx` using inline SVG (no extra charting dependency needed).
4. Build `pages/Report.jsx` — fetches report, passes data to `BugReport` + `DonutChart`, handles loading/error states.

**Relevant Context**
- Screenshot paths in the report JSON are relative to `sandbox-runs/{run_id}/evidence/` — backend must serve these as static files, or base64-encode them in the report JSON. Decide: base64 in JSON is simpler for MVP.

---

### Sub-Task 12 — Integration, End-to-End Smoke Test + Demo Recording

**Status:** `[ ] pending`

**Intent**
Wire everything together, run a full end-to-end scan on a known test project, fix any integration issues, and record a demo video as a fallback for live judging.

**Expected Outcomes**
- A full scan completes without errors: upload zip → container starts → Playwright crawls → LLM returns findings → report displayed in UI.
- At least one real bug is found and shown in the report (use a deliberately broken test app).
- Demo video recorded and saved.

**Todo List**
1. Create `tests/test_app/` — a minimal React + FastAPI app with 2-3 deliberate bugs (broken button, console error, 500 API call).
2. Run a full local scan end-to-end; fix any integration gaps.
3. Verify container cleanup after scan completes.
4. Verify credentials deletion.
5. Record a screen capture of the full flow for use as a demo fallback.
6. Write a short `README.md` at the repo root: setup steps, how to build the base image, how to run locally.

**Relevant Context**
- Pre-build base image (`docker build -f backend/docker/sandbox.Dockerfile -t qa-sandbox-base:latest .`) must be done before demo.
- IBM Bob API key must be set in `.env` before this sub-task runs.

---

## Open Decisions (Require Kickoff Brief)

| Decision | Impact |
|---|---|
| IBM Bob vision API endpoint + key format | Needed before Sub-Task 6 can be fully implemented |
| Screenshot delivery to frontend | Decided as base64-in-JSON for MVP (Sub-Task 11 note) — confirm this is acceptable |
| Single-concurrent-scan limit | Acceptable for hackathon demo; no queue/worker pool needed |
