# sandbox.Dockerfile — QA Agent sandbox base image
#
# Pre-installs: Node.js 20, Python 3.11, pip, Playwright + Chromium.
# Per-scan startup only needs to install the uploaded project's own dependencies.
#
# Build:
#   docker build -f backend/docker/sandbox.Dockerfile -t qa-sandbox-base:latest .
#
# Tagged: qa-sandbox-base:latest

FROM node:20-slim

# ── System deps + Python 3.11 ─────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3.11 \
        python3.11-venv \
        python3-pip \
        curl \
        ca-certificates \
    && ln -sf /usr/bin/python3.11 /usr/bin/python3 \
    && ln -sf /usr/bin/python3.11 /usr/bin/python \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ── Playwright + Chromium ──────────────────────────────────────────────────────
RUN pip install --no-cache-dir playwright \
    && playwright install --with-deps chromium

# ── Non-root user ─────────────────────────────────────────────────────────────
RUN useradd -m -s /bin/bash sandboxuser
USER sandboxuser

WORKDIR /app

# React dev server | FastAPI dev server
EXPOSE 3000 8000
