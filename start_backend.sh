#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/backend"
if [ -x "../.venv/bin/python" ]; then
  PYTHON="../.venv/bin/python"
else
  PYTHON="python3"
fi
printf "Starting backend on http://0.0.0.0:8000\n"
exec "$PYTHON" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
