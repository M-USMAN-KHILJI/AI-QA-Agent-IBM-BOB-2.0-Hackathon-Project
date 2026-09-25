"""
docker_manager.py — Sandbox container lifecycle management

Public API:
  start_sandbox(run_id, project_dir) -> (container, host_port_react, host_port_api)
      Starts a qa-sandbox-base:latest container, mounts the project dir,
      runs dependency install + dev servers, and blocks until the app is reachable.
      Resource limits: --memory 512m, --cpus 1.0, bridge network, no elevated privs.

  stop_sandbox(container) -> None
      Stops and removes the container. Never raises — safe to call in finally blocks.

Internal:
  _readiness_check(host_port, timeout_s=90) -> bool
      Polls http://localhost:{port} every 2 s until a 200 response or timeout.

  _sweep_stale_containers() -> None
      Removes any qa-sandbox-base containers older than 30 min (called at startup).
"""
import docker  # noqa: F401 — Docker Python SDK

# TODO: implement start_sandbox, stop_sandbox, _readiness_check, _sweep_stale_containers
