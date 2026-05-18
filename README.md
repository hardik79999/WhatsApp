# WhatsApp Clone

A full-stack WhatsApp Clone built with FastAPI, PostgreSQL, React, Vite, and WebSockets.

## Project Overview
This project is a functional clone of WhatsApp Web, featuring real-time messaging, file sharing, voice notes, video/audio calls, typing indicators, read receipts, and user presence tracking.

## Features
- **Real-time Messaging:** WebSockets for instantaneous communication
- **Authentication:** Secure JWT-based login with OTP and token rotation
- **Media Sharing:** Send images, videos, audio (voice notes), and documents
- **Group Chats:** Create groups, manage participants, and assign admins
- **Calling:** WebRTC-based peer-to-peer video and audio calling
- **Reactions:** React to messages with emojis
- **Status Updates:** Post temporary status updates like WhatsApp Status

## Tech Stack
- **Backend:** FastAPI, Python, SQLAlchemy, PostgreSQL, Alembic
- **Frontend:** React, Vite, Tailwind CSS, Axios
- **Real-time:** WebSockets (FastAPI + React)
- **Deployment:** Docker, Docker Compose

## Quick Start
See [QUICK_START.md](QUICK_START.md) for detailed instructions on running the project locally.

## Environment Setup
1. Create `backend/.env` from `backend/.env.example`
2. Create `frontend/.env` from `frontend/.env.example`

## API Documentation
Once the backend is running, you can access the interactive API docs at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Contributing
Refer to `docs/archive/` for detailed implementation guides and historical documentation.

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

