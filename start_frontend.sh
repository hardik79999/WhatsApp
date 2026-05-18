#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/frontend"
printf "Starting frontend on http://0.0.0.0:5173\n"
npm run dev -- --host
