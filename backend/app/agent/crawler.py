"""
crawler.py — BFS link discovery for the browser agent

Public API:
  discover_links(page, base_url, visited, cap=20) -> list[str]
      Extracts all same-origin <a href> links from the current page,
      filters out already-visited URLs, and returns up to `cap` new URLs.

BFS strategy (managed by browser_agent.py):
  - Start at base_url + "/"
  - After visiting each page, call discover_links to grow the queue.
  - Stop when queue is empty or total visited count reaches cap.

Filtering rules:
  - Same origin only (scheme + host must match base_url).
  - Skip mailto:, tel:, javascript:, # anchors.
  - Deduplicate by normalised URL (strip trailing slash, lowercase).
"""

# TODO: implement discover_links
