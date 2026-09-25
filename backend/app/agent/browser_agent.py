"""
browser_agent.py — Playwright-based browser automation agent

Public API:
  run_agent(run_id, base_url, credentials) -> list[PageEvidence]
      Launches headless Chromium, optionally logs in, then BFS-crawls the app
      (via crawler.py, max 20 pages). At each page captures:
        - Full-page screenshot  →  evidence/{page_slug}/screenshot.png
        - Console errors (HMR noise filtered)  →  console_errors.json
        - Failed network requests              →  network_failures.json

Credentials dict shape: { "username": str, "password": str } | None

Auth handling:
  - Attempts login if credentials provided.
  - Detects CAPTCHA / email-verify gates; logs "auth_blocked", continues to public pages.

Playwright strategy:
  - wait_for_load_state("networkidle") with 10 s timeout before each capture.
  - Retry once on timeout before marking the page as "load_timeout".
"""

# TODO: implement run_agent, _attempt_login, _capture_evidence
