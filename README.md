# WhatsApp Clone

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square)](https://vitejs.dev/)
[![API Docs](https://img.shields.io/badge/API-dashboard-ready-111827?style=flat-square)](docs/index.html)

A full-stack WhatsApp-style messaging application built with FastAPI, React, WebSockets, JWT authentication, media uploads, statuses, reactions, groups, and WebRTC call signaling.

## Highlights

- Real-time one-to-one and group chat over WebSockets
- OTP login with JWT access tokens, refresh rotation, cookies, and CSRF support
- Media uploads for images, videos, documents, audio, profile photos, and voice notes
- Group management with participants, admins, and group profile updates
- Message edit, delete, star, reply preview, reactions, read receipts, and typing indicators
- Status updates with expiry and viewer tracking
- Audio/video call lifecycle APIs with WebRTC signaling events
- Professional generated API workspace with Postman, Thunder Client, Bruno, curl, fetch, and axios examples

## Tech Stack

| Layer | Tools |
| --- | --- |
| Backend | FastAPI, SQLAlchemy, Alembic, Pydantic, Uvicorn |
| Frontend | React, Vite, Tailwind CSS, Axios |
| Realtime | FastAPI WebSockets, browser WebSocket client |
| Auth | OTP flow, JWT Bearer tokens, HttpOnly cookies, CSRF tokens |
| Storage | Local media filesystem in development |
| Tooling | Docker, Docker Compose, Postman, Thunder Client, Bruno |

## Repository Structure

```text
.
|-- backend/                  FastAPI app, models, schemas, routes, services
|-- frontend/                 React/Vite client
|-- docs/                     Static generated API dashboard and archived docs
|-- BRUNO_COLLECTION/         Bruno API collection
|-- scripts/                  API artifact generator and smoke-test runner
|-- alembic/                  Database migrations
|-- API_GUIDE.md              Generated API index and diagnostics
|-- API_USAGE_EXAMPLES.md     curl, fetch, and axios examples
|-- API_FLOW_DIAGRAM.md       Mermaid API flow diagrams
|-- POSTMAN_COLLECTION.json   Postman import
|-- THUNDER_CLIENT_COLLECTION.json
|-- docker-compose.yml
|-- start_backend.sh
|-- start_frontend.sh
`-- start_ngrok.sh
```

## Quick Start

1. Create local environment files.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

2. Start the backend.

```bash
./start_backend.sh
```

Backend URL:

```text
http://localhost:8000
```

3. Start the frontend in another terminal.

```bash
./start_frontend.sh
```

Frontend URL:

```text
http://localhost:5173
```

4. Start the generated API dashboard in another terminal.

```bash
python3 -m http.server 4173 --directory docs
```

API dashboard URL:

```text
http://localhost:4173/index.html
```

For a slower, beginner-friendly setup path, read [QUICK_START.md](QUICK_START.md).

## API Workspace

This repo includes a generated API system for the full FastAPI backend:

- Visual dashboard: [docs/index.html](docs/index.html)
- API guide: [API_GUIDE.md](API_GUIDE.md)
- Usage examples: [API_USAGE_EXAMPLES.md](API_USAGE_EXAMPLES.md)
- Flow diagrams: [API_FLOW_DIAGRAM.md](API_FLOW_DIAGRAM.md)
- Postman collection: [POSTMAN_COLLECTION.json](POSTMAN_COLLECTION.json)
- Thunder Client collection: [THUNDER_CLIENT_COLLECTION.json](THUNDER_CLIENT_COLLECTION.json)
- Bruno collection: [BRUNO_COLLECTION](BRUNO_COLLECTION)
- Smoke-test runner: [scripts/test_all_apis.py](scripts/test_all_apis.py)

Current generated inventory:

- 46 HTTP API operations
- 1 WebSocket route: `/api/v1/ws`
- 11 grouped modules: Authentication, Users, Contacts, Chats, Groups, Messages, Media, Reactions, Statuses, Calls, System

## Authentication Flow

1. Send OTP: `POST /api/v1/auth/send-otp`
2. Read the mock OTP from the backend terminal
3. Verify OTP: `POST /api/v1/auth/verify-otp`
4. Copy `access_token`
5. Call protected APIs with:

```text
Authorization: Bearer <access_token>
```

Refresh uses the refresh cookie plus:

```text
X-CSRF-Token: <csrf_refresh_token>
```

WebSocket authentication currently uses the `access_token` cookie.

## Testing

Run safe API smoke tests:

```bash
.venv/bin/python scripts/test_all_apis.py --base-url http://localhost:8000
```

Run authenticated smoke tests:

```bash
.venv/bin/python scripts/test_all_apis.py \
  --base-url http://localhost:8000 \
  --access-token "$ACCESS_TOKEN"
```

Run frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

## Docker

Run the stack with Docker Compose:

```bash
docker compose up --build
```

Services:

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- PostgreSQL: `localhost:5432`

## Development Notes

- Never commit `backend/.env` or other real environment files.
- Use `.env.example` files for safe defaults and onboarding.
- Keep generated API artifacts in sync after backend route changes:

```bash
.venv/bin/python scripts/generate_api_artifacts.py
```

- Import API collections into Postman, Thunder Client, or Bruno for manual QA.
- See [CONTRIBUTING.md](CONTRIBUTING.md) before opening pull requests.

## Security

If a real secret was ever committed, remove it from future commits and rotate the secret immediately. Read [SECURITY.md](SECURITY.md) for the project policy.

## Status

Latest milestone: generated API testing/dashboard system added on May 18, 2026. See [CHANGELOG.md](CHANGELOG.md) for progress history.

## License

No license has been selected yet. Add a license before distributing or accepting external contributions.
