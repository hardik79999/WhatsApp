#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok is not installed or not available in PATH"
  exit 1
fi

if [ -n "${NGROK_AUTHTOKEN:-}" ]; then
  echo "Installing ngrok authtoken from NGROK_AUTHTOKEN environment variable"
  ngrok config add-authtoken "$NGROK_AUTHTOKEN"
fi

if ! grep -q "authtoken" ~/.config/ngrok/ngrok.yml 2>/dev/null && ! grep -q "authtoken" ~/.ngrok2/ngrok.yml 2>/dev/null; then
  echo "ngrok auth token is required. Set NGROK_AUTHTOKEN or run 'ngrok config add-authtoken <token>'"
  exit 1
fi

echo "Starting ngrok tunnels for frontend and backend..."
ngrok start --all --config ngrok.yml --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!
echo "ngrok PID: $NGROK_PID"

for i in {1..20}; do
  if curl -s http://127.0.0.1:4040/api/tunnels | grep -q '"tunnels"'; then
    break
  fi
  sleep 0.5
done

TUNNELS_JSON=$(curl -s http://127.0.0.1:4040/api/tunnels)
if [ -z "$TUNNELS_JSON" ]; then
  echo "Failed to query ngrok API at http://127.0.0.1:4040/api/tunnels"
  exit 1
fi

frontend_url=$(python3 - <<'PY'
import json, sys
from urllib.request import urlopen

data = json.loads(sys.stdin.read())
for t in data.get('tunnels', []):
    if t.get('name') == 'frontend':
        print(t.get('public_url', ''))
        sys.exit(0)
sys.exit(1)
PY
<<<"$TUNNELS_JSON")
backend_url=$(python3 - <<'PY'
import json, sys
from urllib.request import urlopen

data = json.loads(sys.stdin.read())
for t in data.get('tunnels', []):
    if t.get('name') == 'backend':
        print(t.get('public_url', ''))
        sys.exit(0)
sys.exit(1)
PY
<<<"$TUNNELS_JSON")

if [ -z "$frontend_url" ] || [ -z "$backend_url" ]; then
  echo "Could not determine ngrok tunnel URLs. See ngrok.log for details."
  exit 1
fi

backend_api_url="${backend_url%/}/api/v1"
backend_ws_url="${backend_api_url/#https:/wss:}"
backend_ws_url="${backend_ws_url/#http:/ws:}"

cat > frontend/.env.local <<EOF
VITE_API_URL=$backend_api_url
VITE_WS_URL=$backend_ws_url
EOF

echo "Frontend environment updated: frontend/.env.local"
echo "Frontend ngrok URL: $frontend_url"
echo "Backend ngrok URL: $backend_url"
echo "Backend API URL set to: $backend_api_url"
echo "Backend WS URL set to: $backend_ws_url"

echo "ngrok inspector: http://127.0.0.1:4040"
