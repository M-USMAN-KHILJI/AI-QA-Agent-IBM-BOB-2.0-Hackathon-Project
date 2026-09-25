"""
vision_analysis.py — LLM-based visual bug detection

Public API:
  analyze_page(page_url, screenshot_path, console_errors, network_failures) -> list[BugFinding]
      Sends screenshot (base64) + error context to IBM Bob (primary) or GPT-4o (fallback).
      Parses the LLM JSON response into BugFinding objects.

LLM selection:
  - Tries _call_bob() first (requires BOB_API_KEY in config).
  - Falls back to _call_openai() if Bob is unavailable or raises an error.
  - Rate-limit errors are retried with exponential backoff (3 attempts, max 30 s).

Prompt strategy:
  - Role: QA engineer reviewing a web application.
  - Flag only: crashes, blank pages, layout breakage, error states, broken buttons/forms.
  - Exclude: design preferences, colour/font opinions.
  - Output: JSON array of { title, severity, explanation, confidence }.

BugFinding severity values: "critical" | "high" | "medium" | "low"
BugFinding confidence values: "high" | "medium" | "low"
"""

# TODO: implement analyze_page, _call_bob, _call_openai, _build_prompt, _parse_response
