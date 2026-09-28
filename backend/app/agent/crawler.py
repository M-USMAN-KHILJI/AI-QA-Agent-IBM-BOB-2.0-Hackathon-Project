"""
crawler.py — Link discovery for the browser agent
"""
from urllib.parse import urljoin, urlparse


def discover_links(page, base_url: str, visited: set[str], cap: int = 15) -> list[str]:
    """
    Extracts same-origin <a href> links from current page DOM,
    filters duplicates, and returns newly discovered URLs up to cap.
    """
    discovered: list[str] = []
    base_parsed = urlparse(base_url)

    try:
        hrefs = page.eval_on_selector_all(
            "a[href]",
            "elements => elements.map(el => el.getAttribute('href'))",
        )
    except Exception:
        hrefs = []

    for raw_href in hrefs:
        if not raw_href:
            continue

        raw_href = raw_href.strip()
        if raw_href.startswith(("#", "mailto:", "tel:", "javascript:")):
            continue

        full_url = urljoin(base_url, raw_href)
        parsed = urlparse(full_url)

        # Ensure same origin
        if parsed.netloc != base_parsed.netloc:
            continue

        # Normalise path
        clean_path = parsed.path.rstrip("/")
        if not clean_path:
            clean_path = "/"

        normalized_url = f"{parsed.scheme}://{parsed.netloc}{clean_path}"

        if normalized_url not in visited and normalized_url not in discovered:
            discovered.append(normalized_url)
            if len(visited) + len(discovered) >= cap:
                break

    return discovered
