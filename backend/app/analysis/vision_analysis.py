"""
vision_analysis.py — LLM-powered visual and runtime bug classification
"""
import json
import re
from typing import Any, Optional

from openai import OpenAI

from app.core.config import settings
from app.models.schemas import BugFinding


def _get_openai_client() -> Optional[OpenAI]:
    if not settings.OPENAI_API_KEY:
        return None
    try:
        return OpenAI(
            base_url=settings.OPENAI_BASE_URL,
            api_key=settings.OPENAI_API_KEY,
            timeout=90.0,
        )
    except Exception:
        return None


def analyze_evidence_batch(
    evidence_list: list[dict[str, Any]],
    project_description: Optional[str] = None,
) -> list[BugFinding]:
    """
    Batches all route evidence into a single high-efficiency prompt to the LLM.
    Fast, comprehensive, and includes cross-page context.
    """
    findings: list[BugFinding] = []
    client = _get_openai_client()

    # Pre-filter: routes with errors or key user paths
    error_routes = [
        ev for ev in evidence_list
        if ev.get("console_errors") or ev.get("network_failures") or ev.get("http_status", 200) >= 400
    ]

    # Summarize routes for the prompt
    evidence_summary = []
    for ev in evidence_list[:6]:
        evidence_summary.append({
            "route": ev.get("page_url"),
            "http_status": ev.get("http_status"),
            "console_errors": ev.get("console_errors", []),
            "network_failures": ev.get("network_failures", []),
        })

    prompt_context = f"""
Application Description / Target Flow:
{project_description or 'E-Commerce store with browsing and checkout'}

Crawl & Interaction Telemetry across routes:
{json.dumps(evidence_summary, indent=2)}

Task:
You are an expert autonomous QA Engineer. Analyze the telemetry above and identify genuine software bugs (crashes, HTTP 500s, unhandled exceptions, broken buttons/flows).
Ignore standard HMR logs.

Respond ONLY with a JSON array of findings with this exact schema:
[
  {{
    "page_url": "/route",
    "title": "Short title describing the defect",
    "severity": "critical" | "high" | "medium" | "low",
    "explanation": "Why this is a defect and what caused it",
    "confidence": "high" | "medium" | "low"
  }}
]
"""

    if client:
        try:
            completion = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a precise automated QA analysis engine that outputs JSON."},
                    {"role": "user", "content": prompt_context},
                ],
                temperature=0.2,
                max_tokens=1200,
            )
            msg = completion.choices[0].message
            # NVIDIA gpt-oss-20b puts output in reasoning_content, not content
            content = msg.content or ""
            reasoning = getattr(msg, "reasoning_content", "") or ""
            raw_text = (content if content.strip() else reasoning).strip()

            parsed_list = []
            # 1. Search for markdown code fence with JSON array
            for m in re.finditer(r"```(?:json)?\s*(\[\s*\{.*?\}\s*\])\s*```", raw_text, re.DOTALL):
                try:
                    data = json.loads(m.group(1))
                    if isinstance(data, list) and data:
                        parsed_list = data
                        break
                except Exception:
                    pass

            # 2. Search for any JSON array in the text
            if not parsed_list:
                for m in re.finditer(r"\[\s*\{.*?\}\s*\]", raw_text, re.DOTALL):
                    try:
                        data = json.loads(m.group(0))
                        if isinstance(data, list) and data:
                            parsed_list = data
                            break
                    except Exception:
                        pass

            # 3. Last fallback: individual JSON objects with page_url
            if not parsed_list:
                for obj_match in re.finditer(r"\{\s*\"page_url\":[^{}]*\}", raw_text, re.DOTALL):
                    try:
                        obj = json.loads(obj_match.group(0))
                        if "page_url" in obj:
                            parsed_list.append(obj)
                    except Exception:
                        pass

            for item in parsed_list:
                matching_ev = next((ev for ev in evidence_list if ev.get("page_url") == item.get("page_url")), None)
                findings.append(
                    BugFinding(
                        page_url=item.get("page_url", "/"),
                        severity=str(item.get("severity", "medium")).lower(),
                        title=str(item.get("title", "Detected defect")),
                        explanation=str(item.get("explanation", "Unexpected behavior detected.")),
                        confidence=str(item.get("confidence", "high")).lower(),
                        screenshot_b64=matching_ev.get("screenshot_b64") if matching_ev else None,
                    )
                )
        except Exception as e:
            print(f"Batch LLM analysis error: {e}")

    # Heuristic fallback if LLM returned nothing but errors exist
    if not findings and error_routes:
        for ev in error_routes:
            url = ev.get("page_url", "/")
            b64 = ev.get("screenshot_b64")

            for net in ev.get("network_failures", []):
                status_code = net.get("status", 500)
                findings.append(
                    BugFinding(
                        page_url=url,
                        severity="critical" if status_code >= 500 else "high",
                        title=f"Network API failure: HTTP {status_code} on {net.get('url', url)}",
                        explanation=f"A network call to {net.get('url')} failed with status {status_code} ({net.get('statusText', 'Error')}), breaking user workflow.",
                        confidence="high",
                        screenshot_b64=b64,
                    )
                )

            for err in ev.get("console_errors", []):
                findings.append(
                    BugFinding(
                        page_url=url,
                        severity="high",
                        title=f"Unhandled browser exception on {url}",
                        explanation=f"Console error captured during test: {err}",
                        confidence="high",
                        screenshot_b64=b64,
                    )
                )

    return findings


# Backward compatibility
def analyze_page(page_url: str, console_errors: list[str], network_failures: list[dict[str, Any]], screenshot_b64=None, project_description=None):
    return analyze_evidence_batch([{"page_url": page_url, "console_errors": console_errors, "network_failures": network_failures, "screenshot_b64": screenshot_b64}], project_description)
