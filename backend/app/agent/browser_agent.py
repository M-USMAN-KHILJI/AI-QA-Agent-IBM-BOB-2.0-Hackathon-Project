"""
browser_agent.py — Playwright browser automation agent
"""
import base64
import time
from typing import Any, Optional
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

from app.agent.crawler import discover_links
from app.storage.file_store import get_evidence_dir


def _is_hmr_noise(text: str) -> bool:
    lowered = text.lower()
    return any(p in lowered for p in ["[vite]", "[hmr]", "websocket", "ws://", "hot reload"])


def run_agent(
    run_id: str,
    base_url: str,
    credentials: Optional[dict[str, str]] = None,
    description: Optional[str] = None,
    max_pages: int = 10,
) -> list[dict[str, Any]]:
    """
    Drives Playwright to explore reachable routes, tests interactive buttons,
    and captures screenshots, console errors, and network failures.
    """
    evidence_list: list[dict[str, Any]] = []
    visited: set[str] = set()
    queue: list[str] = [base_url]

    # Pre-add common web routes
    for common_path in ["/login", "/dashboard", "/cart", "/checkout", "/pricing", "/products"]:
        queue.append(f"{base_url.rstrip('/')}{common_path}")

    evidence_base = get_evidence_dir(run_id)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Wire console & network collectors
        console_errors: list[str] = []
        network_failures: list[dict[str, Any]] = []

        def on_console(msg):
            if msg.type in ("error", "warning"):
                text = msg.text
                if not _is_hmr_noise(text):
                    console_errors.append(f"[{msg.type.upper()}] {text}")

        def on_response(response):
            if response.status >= 400 and not _is_hmr_noise(response.url):
                try:
                    network_failures.append({
                        "method": response.request.method,
                        "url": response.url,
                        "status": response.status,
                        "statusText": response.status_text,
                    })
                except Exception:
                    pass

        page.on("console", on_console)
        page.on("response", on_response)
        page.on("dialog", lambda dialog: dialog.accept())

        # 1. Handle login attempt if credentials supplied
        if credentials and credentials.get("username") and credentials.get("password"):
            try:
                login_url = f"{base_url.rstrip('/')}/login"
                page.goto(login_url, timeout=10000, wait_until="domcontentloaded")
                # Look for input fields
                user_input = page.query_selector("input[type='text'], input[type='email'], input[name*='user']")
                pass_input = page.query_selector("input[type='password']")
                submit_btn = page.query_selector("button[type='submit'], input[type='submit'], button:has-text('Log')")

                if user_input and pass_input:
                    user_input.fill(credentials["username"])
                    pass_input.fill(credentials["password"])
                    if submit_btn:
                        submit_btn.click()
                        page.wait_for_timeout(2000)
            except Exception:
                pass

        # 2. Explore routes in queue
        while queue and len(visited) < max_pages:
            current_url = queue.pop(0)
            clean_url = current_url.rstrip("/") or "/"
            if clean_url in visited:
                continue

            visited.add(clean_url)
            console_errors.clear()
            network_failures.clear()

            parsed_path = urlparse(clean_url).path or "/"
            page_slug = parsed_path.strip("/").replace("/", "_") or "home"
            page_evidence_dir = evidence_base / page_slug
            page_evidence_dir.mkdir(parents=True, exist_ok=True)

            try:
                response = page.goto(clean_url, timeout=12000, wait_until="domcontentloaded")
                page.wait_for_timeout(1000)

                # Exercise interactive elements (click primary buttons, open drawers)
                buttons = page.query_selector_all("button:visible, a.btn:visible")
                for btn in buttons[:3]:  # click up to 3 buttons
                    try:
                        text = btn.inner_text().strip()
                        if text and not any(skip in text.lower() for skip in ["delete", "logout", "sign out"]):
                            btn.click(timeout=1000)
                            page.wait_for_timeout(500)
                    except Exception:
                        pass

                # Discover new links
                new_links = discover_links(page, base_url, visited, cap=max_pages)
                for nl in new_links:
                    if nl not in visited and nl not in queue:
                        queue.append(nl)

                # Capture full-page screenshot
                screenshot_bytes = page.screenshot(full_page=True, timeout=8000)
                screenshot_b64 = base64.b64encode(screenshot_bytes).decode("utf-8")

                # Save screenshot to disk
                (page_evidence_dir / "screenshot.png").write_bytes(screenshot_bytes)

                evidence_list.append({
                    "page_url": parsed_path,
                    "full_url": clean_url,
                    "screenshot_b64": screenshot_b64,
                    "console_errors": list(console_errors),
                    "network_failures": list(network_failures),
                    "http_status": response.status if response else 200,
                })

            except Exception as e:
                # Still record failed route attempt
                evidence_list.append({
                    "page_url": parsed_path,
                    "full_url": clean_url,
                    "screenshot_b64": None,
                    "console_errors": [f"Navigation error: {str(e)}"],
                    "network_failures": [{"url": clean_url, "status": 500, "statusText": "Page failed to load"}],
                    "http_status": 500,
                })

        browser.close()

    return evidence_list
