"""
docker_manager.py — Sandbox container lifecycle management with Docker & local fallback
"""
import os
import socket
import subprocess
import sys
import threading
import time
import urllib.request
from pathlib import Path
from typing import Any, Optional, Tuple

import docker
from app.core.config import settings

_BUILDING_IMAGE = False


def _find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]


def _readiness_check(host_port: int, timeout_s: int = 15) -> bool:
    """Actively polls http://127.0.0.1:{host_port} until it responds or timeout occurs."""
    start_time = time.time()
    url = f"http://127.0.0.1:{host_port}"
    while time.time() - start_time < timeout_s:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "QA-Agent-Healthcheck"})
            with urllib.request.urlopen(req, timeout=1.5) as response:
                if response.status in (200, 301, 302, 304, 404):
                    return True
        except Exception:
            time.sleep(1.0)
    return False


def _sweep_stale_containers() -> None:
    """Removes leftover qa-sandbox containers on server startup."""
    try:
        client = docker.from_env()
        containers = client.containers.list(all=True, filters={"name": "qa-sandbox-"})
        for c in containers:
            try:
                c.stop(timeout=2)
                c.remove(force=True)
            except Exception:
                pass
    except Exception:
        pass


def _bg_build_image():
    global _BUILDING_IMAGE
    if _BUILDING_IMAGE:
        return
    _BUILDING_IMAGE = True
    try:
        client = docker.from_env()
        dockerfile_path = settings.BASE_DIR / "docker" / "sandbox.Dockerfile"
        if dockerfile_path.exists():
            print(f"Background building Docker base image {settings.CONTAINER_IMAGE}...")
            # Docker SDK expects dockerfile as path relative to build context
            client.images.build(
                path=str(settings.BASE_DIR),
                dockerfile="docker/sandbox.Dockerfile",
                tag=settings.CONTAINER_IMAGE,
                rm=True,
            )
            print(f"Successfully built {settings.CONTAINER_IMAGE}!")
    except Exception as e:
        print(f"Docker build notice: {e}")
    finally:
        _BUILDING_IMAGE = False


def find_project_entrypoints(project_dir: Path) -> dict:
    """
    Auto-detects nested frontend and backend project directories,
    ignoring node_modules, .git, venv, and build output directories.
    """
    ignored = {"node_modules", ".git", "venv", ".venv", "__pycache__", "dist", "build", ".next", ".turbo"}

    frontend_dir: Optional[Path] = None
    backend_dir: Optional[Path] = None
    backend_type: Optional[str] = None  # 'django', 'fastapi', 'python'

    # 1. Search for package.json (frontend)
    pkg_candidates = []
    for p in project_dir.rglob("package.json"):
        if not any(part in ignored for part in p.parts):
            pkg_candidates.append(p.parent)

    if pkg_candidates:
        scored = []
        for d in pkg_candidates:
            lower = str(d).lower()
            score = 0
            if any(term in lower for term in ["frontend", "client", "web", "ui", "app"]):
                score += 10
            depth = len(d.relative_to(project_dir).parts)
            scored.append((score - depth, d))
        scored.sort(key=lambda x: x[0], reverse=True)
        frontend_dir = scored[0][1]

    # 2. Search for backend (manage.py, main.py, requirements.txt)
    be_candidates = []
    for name in ["manage.py", "main.py", "app.py", "requirements.txt"]:
        for p in project_dir.rglob(name):
            if not any(part in ignored for part in p.parts):
                if frontend_dir and p.parent == frontend_dir:
                    continue
                be_candidates.append((p.parent, name))

    if be_candidates:
        scored = []
        for d, name in be_candidates:
            lower = str(d).lower()
            score = 0
            if any(term in lower for term in ["backend", "server", "api"]):
                score += 10
            if name == "manage.py":
                b_type = "django"
                score += 5
            elif name in ("main.py", "app.py"):
                b_type = "fastapi"
                score += 4
            else:
                b_type = "python"
            depth = len(d.relative_to(project_dir).parts)
            scored.append((score - depth, d, b_type))
        scored.sort(key=lambda x: x[0], reverse=True)
        backend_dir = scored[0][1]
        backend_type = scored[0][2]

    return {
        "frontend_dir": frontend_dir,
        "backend_dir": backend_dir,
        "backend_type": backend_type,
    }


def start_sandbox(run_id: str, project_dir: Path) -> Tuple[Any, str, int]:
    """
    Starts an isolated sandbox container or local subprocess mounting `project_dir`.
    Auto-detects nested frontend and backend entry points.
    Returns: (sandbox_handle, base_url, host_port)
    """
    layout = find_project_entrypoints(project_dir)
    frontend_dir = layout["frontend_dir"]
    backend_dir = layout["backend_dir"]
    backend_type = layout["backend_type"]

    docker_available = False
    client = None

    try:
        client = docker.from_env()
        client.ping()
        docker_available = True
    except Exception:
        docker_available = False

    # Check if Docker image is already built
    if docker_available and client:
        try:
            images = [t for img in client.images.list() for t in (img.tags or [])]
            if settings.CONTAINER_IMAGE in images:
                host_port = _find_free_port()
                docker_cmd_parts = []

                if backend_dir:
                    rel_be = backend_dir.relative_to(project_dir).as_posix()
                    be_cd = f"cd /app/{rel_be}" if rel_be != "." else "cd /app"
                    be_install = "pip install -r requirements.txt && " if (backend_dir / "requirements.txt").exists() else ""
                    if backend_type == "django" or (backend_dir / "manage.py").exists():
                        be_run = "python3 manage.py runserver 0.0.0.0:8000"
                    else:
                        be_run = "uvicorn main:app --host 0.0.0.0 --port 8000"
                    
                    if frontend_dir:
                        docker_cmd_parts.append(f"({be_cd} && {be_install}{be_run} &)")
                    else:
                        docker_cmd_parts.append(f"{be_cd} && {be_install}{be_run}")

                if frontend_dir:
                    rel_fe = frontend_dir.relative_to(project_dir).as_posix()
                    fe_cd = f"cd /app/{rel_fe}" if rel_fe != "." else "cd /app"
                    docker_cmd_parts.append(f"{fe_cd} && npm install && npm run dev -- --host 0.0.0.0 --port 3000")
                elif not backend_dir:
                    docker_cmd_parts.append("python3 -m http.server 3000")

                full_docker_cmd = "bash -c '" + " ; ".join(docker_cmd_parts) + "'"

                container = client.containers.run(
                    image=settings.CONTAINER_IMAGE,
                    detach=True,
                    name=f"qa-sandbox-{run_id}",
                    ports={"3000/tcp": host_port, "8000/tcp": host_port},
                    volumes={str(project_dir.resolve()): {"bind": "/app", "mode": "rw"}},
                    mem_limit="512m",
                    nano_cpus=1000000000,
                    network_mode="bridge",
                    command=full_docker_cmd,
                )
                _readiness_check(host_port, timeout_s=30)
                base_url = f"http://localhost:{host_port}"
                return ({"type": "docker", "container": container}, base_url, host_port)
            else:
                # Trigger background build so future runs have the cached image
                threading.Thread(target=_bg_build_image, daemon=True).start()
        except Exception as e:
            print(f"Docker container run fallback: {e}")

    # High-Reliability Local Sandbox Mode (Spins up isolated runner on dynamic port)
    host_port = _find_free_port()
    base_url = f"http://127.0.0.1:{host_port}"
    processes: list[subprocess.Popen] = []

    # 1. Start Backend if present alongside frontend
    if backend_dir and frontend_dir:
        backend_port = _find_free_port()
        try:
            if backend_type == "django" or (backend_dir / "manage.py").exists():
                be_proc = subprocess.Popen(
                    [sys.executable, "manage.py", "runserver", f"127.0.0.1:{backend_port}", "--noreload"],
                    cwd=str(backend_dir),
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
                processes.append(be_proc)
            elif (backend_dir / "main.py").exists():
                be_proc = subprocess.Popen(
                    [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(backend_port)],
                    cwd=str(backend_dir),
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
                processes.append(be_proc)
        except Exception as e:
            print(f"Notice: local backend launch fallback: {e}")

    # 2. Start Frontend if detected
    if frontend_dir:
        if not (frontend_dir / "node_modules").exists():
            print(f"Auto-installing npm dependencies in {frontend_dir}...")
            try:
                npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
                subprocess.run(
                    [npm_cmd, "install", "--prefer-offline", "--no-audit", "--no-fund"],
                    cwd=str(frontend_dir),
                    timeout=90,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            except Exception as e:
                print(f"Notice: local npm install error: {e}")

        script_name = "dev"
        try:
            import json
            pkg_data = json.loads((frontend_dir / "package.json").read_text(encoding="utf-8", errors="ignore"))
            scripts = pkg_data.get("scripts", {})
            if "dev" in scripts:
                script_name = "dev"
            elif "start" in scripts:
                script_name = "start"
            elif "serve" in scripts:
                script_name = "serve"
        except Exception:
            pass

        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        fe_env = {**os.environ, "PORT": str(host_port), "HOST": "127.0.0.1"}
        fe_proc = subprocess.Popen(
            [npm_cmd, "run", script_name, "--", "--port", str(host_port), "--host", "127.0.0.1"],
            cwd=str(frontend_dir),
            env=fe_env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        processes.append(fe_proc)

    # 3. Only backend exists (no frontend)
    elif backend_dir:
        if backend_type == "django" or (backend_dir / "manage.py").exists():
            be_proc = subprocess.Popen(
                [sys.executable, "manage.py", "runserver", f"127.0.0.1:{host_port}", "--noreload"],
                cwd=str(backend_dir),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            processes.append(be_proc)
        elif (backend_dir / "main.py").exists():
            be_proc = subprocess.Popen(
                [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(host_port)],
                cwd=str(backend_dir),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            processes.append(be_proc)
        else:
            static_proc = subprocess.Popen(
                [sys.executable, "-m", "http.server", str(host_port), "--bind", "127.0.0.1"],
                cwd=str(backend_dir),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            processes.append(static_proc)

    # 4. Fallback to static server in root
    else:
        static_proc = subprocess.Popen(
            [sys.executable, "-m", "http.server", str(host_port), "--bind", "127.0.0.1"],
            cwd=str(project_dir),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        processes.append(static_proc)

    _readiness_check(host_port, timeout_s=25)
    return ({"type": "process", "processes": processes}, base_url, host_port)


def stop_sandbox(sandbox_handle: Any) -> None:
    """Stops and removes the sandbox container or subprocesses."""
    if not sandbox_handle:
        return

    try:
        if isinstance(sandbox_handle, dict):
            if sandbox_handle.get("type") == "docker":
                container = sandbox_handle.get("container")
                if container:
                    try:
                        container.stop(timeout=3)
                        container.remove(force=True)
                    except Exception:
                        pass
            elif sandbox_handle.get("type") == "process":
                procs = list(sandbox_handle.get("processes") or [])
                if "process" in sandbox_handle and sandbox_handle["process"]:
                    procs.append(sandbox_handle["process"])
                for proc in procs:
                    if proc and proc.poll() is None:
                        proc.terminate()
                        try:
                            proc.wait(timeout=2)
                        except Exception:
                            proc.kill()
    except Exception:
        pass
