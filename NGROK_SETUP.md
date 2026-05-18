# Ngrok Setup for Frontend + Backend

This project runs a React/Vite frontend and a FastAPI backend.

## Prerequisites

- `ngrok` installed and available in `PATH`
- A verified ngrok account with an auth token
- Backend dependencies installed in `backend` environment
- Frontend dependencies installed in `frontend`

## Files added

- `ngrok.yml` — persistent tunnel configuration
- `start_backend.sh` — starts the backend via Uvicorn
- `start_frontend.sh` — starts Vite with `--host`
- `start_ngrok.sh` — starts both ngrok tunnels and updates frontend env
- `frontend/.env.local` — runtime frontend env for `VITE_API_URL` and `VITE_WS_URL`

## Run the app locally

1. Start the backend:

```bash
cd /home/hardik/Technotery/FastApi/Project/WhatsApp
./start_backend.sh
```

2. In another terminal, start the frontend:

```bash
cd /home/hardik/Technotery/FastApi/Project/WhatsApp
./start_frontend.sh
```

3. Use ngrok to expose both services:

```bash
cd /home/hardik/Technotery/FastApi/Project/WhatsApp
NGROK_AUTHTOKEN=<your_ngrok_authtoken> ./start_ngrok.sh
```

If the token is already installed in your ngrok config, you can omit `NGROK_AUTHTOKEN`.

## What this does

- `start_backend.sh` launches the backend on `http://0.0.0.0:8000`
- `start_frontend.sh` launches the frontend on `http://0.0.0.0:5173`
- `start_ngrok.sh` starts two tunnels:
  - `frontend` -> local port `5173`
  - `backend` -> local port `8000`
- It writes the public backend URLs into `frontend/.env.local`

## After ngrok starts

- Open the local inspector UI: `http://127.0.0.1:4040`
- The script will print the public frontend and backend URLs once tunnels are live
- `frontend/.env.local` will be updated to use the ngrok backend URL for API and WebSocket access

## Notes

- The backend CORS configuration already permits `localhost` and ngrok origins
- Vite is configured to run with `host: true`, so public ngrok access works
- If you want a single command wrapper later, add `start_all.sh` based on these scripts

<!-- API_TESTING_PROGRESS_START -->
## Latest Progress - API Testing And Usage System

Updated on: May 18, 2026

A complete FastAPI API testing and usage system has been generated for this project.

What is now available:
- Visual API dashboard: `docs/index.html`
- Main beginner API guide: `API_GUIDE.md`
- API usage examples: `API_USAGE_EXAMPLES.md`
- API flow diagrams: `API_FLOW_DIAGRAM.md`
- Postman collection: `POSTMAN_COLLECTION.json`
- Thunder Client collection: `THUNDER_CLIENT_COLLECTION.json`
- Bruno collection folder: `BRUNO_COLLECTION/`
- Automated API smoke-test runner: `scripts/test_all_apis.py`
- Regeneration utility: `scripts/generate_api_artifacts.py`

Current API inventory:
- 46 HTTP API operations detected
- 1 WebSocket route detected: `/api/v1/ws`
- 11 API modules grouped in the dashboard
- JWT Bearer authentication and cookie/CSRF refresh flow documented
- Upload, media, chat, message, call, status, reaction, user, contact, group, and auth APIs documented

Start here:
1. Start backend: `./start_backend.sh`
2. Serve API dashboard: `python3 -m http.server 4173 --directory docs`
3. Open dashboard: `http://localhost:4173/index.html`
4. Send OTP using `/api/v1/auth/send-otp`
5. Read OTP from backend terminal
6. Verify OTP using `/api/v1/auth/verify-otp`
7. Copy `access_token` into the dashboard or collection variables
8. Test protected APIs with `Authorization: Bearer <access_token>`

Useful test command:
```bash
.venv/bin/python scripts/test_all_apis.py --base-url http://localhost:8000
```

Notes:
- The generated dashboard is a static React/Tailwind page served from `docs/index.html`.
- Protected HTTP APIs use `Authorization: Bearer <access_token>`.
- Refresh uses the refresh cookie plus `X-CSRF-Token`.
- WebSocket auth currently reads the `access_token` cookie.
- Use `API_GUIDE.md` and `API_USAGE_EXAMPLES.md` when you need exact request and response examples.
<!-- API_TESTING_PROGRESS_END -->

