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
