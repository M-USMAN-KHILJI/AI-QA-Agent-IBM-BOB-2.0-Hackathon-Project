"""
code_review.py — Lightweight static source code analysis pass
"""
import os
import re
from pathlib import Path
from app.models.schemas import BugFinding


def review_source(run_id: str, project_dir: Path) -> list[BugFinding]:
    """
    Scans project source files for leftover console logs and missing env configs.
    """
    findings: list[BugFinding] = []
    if not project_dir.exists():
        return findings

    # Look for .env files (including in subdirectories)
    env_keys: set[str] = set()
    for env_file in project_dir.rglob(".env*"):
        if env_file.is_file() and not any(part in ["node_modules", ".git", "venv", ".venv"] for part in env_file.parts):
            for line in env_file.read_text(encoding="utf-8", errors="ignore").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    env_keys.add(line.split("=", 1)[0].strip())

    for root, dirs, files in os.walk(project_dir):
        # Ignore node_modules, .git, venv
        dirs[:] = [d for d in dirs if d not in ["node_modules", ".git", "venv", ".venv", "dist", "build"]]

        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in [".js", ".jsx", ".ts", ".tsx", ".py"]:
                file_path = Path(root) / file
                try:
                    content = file_path.read_text(encoding="utf-8", errors="ignore")
                    rel_path = file_path.relative_to(project_dir).as_posix()

                    # 1. Leftover console.log statements
                    if ext in [".js", ".jsx", ".ts", ".tsx"]:
                        matches = list(re.finditer(r"console\.log\((.*?)\)", content))
                        if len(matches) > 3:
                            findings.append(
                                BugFinding(
                                    page_url=f"/{rel_path}",
                                    severity="low",
                                    title=f"Excessive console.log statements detected ({len(matches)} occurrences)",
                                    explanation=f"Found {len(matches)} console.log statements in {rel_path}. Sensitive tokens or clutter may leak into client developer tools.",
                                    confidence="high",
                                )
                            )

                    # 2. Missing referenced environment variables
                    if ext in [".js", ".jsx", ".ts", ".tsx"]:
                        env_refs = re.findall(r"import\.meta\.env\.(VITE_[A-Z0-9_]+)", content)
                        for ref in set(env_refs):
                            if ref not in env_keys:
                                findings.append(
                                    BugFinding(
                                        page_url=f"/{rel_path}",
                                        severity="medium",
                                        title=f"Unconfigured environment variable: {ref}",
                                        explanation=f"File {rel_path} references {ref}, but it is missing from both .env and .env.example.",
                                        confidence="high",
                                    )
                                )
                except Exception:
                    pass

    return findings
