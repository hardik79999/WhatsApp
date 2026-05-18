# Backend

FastAPI backend for the WhatsApp Clone project.

## Responsibilities

- OTP authentication and JWT token rotation
- User profile management
- Contact sync and user search
- Direct and group chat APIs
- Message send/edit/delete/star flows
- Media and voice-note uploads
- Status updates and view tracking
- Message reactions
- Call lifecycle APIs
- WebSocket events for presence, typing, read receipts, calls, and WebRTC signaling

## Local Setup

From the repository root:

```bash
cp backend/.env.example backend/.env
.venv/bin/python -m pip install -r backend/requirements.txt
./start_backend.sh
```

Backend URL:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

ReDoc:

```text
http://localhost:8000/redoc
```

## Environment Variables

See [backend/.env.example](.env.example).

Required:

- `DATABASE_URL`
- `SECRET_KEY`

Common local values:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_db
SECRET_KEY=change-me-to-a-long-random-secret-key-at-least-32-chars
ALGORITHM=HS256
BASE_URL=http://localhost:8000
MEDIA_STORAGE_PATH=./media
```

Do not commit `backend/.env`.

## API Documentation

Generated project-level API docs live at the repository root:

- `API_GUIDE.md`
- `API_USAGE_EXAMPLES.md`
- `API_FLOW_DIAGRAM.md`
- `docs/index.html`
- `POSTMAN_COLLECTION.json`
- `THUNDER_CLIENT_COLLECTION.json`
- `BRUNO_COLLECTION/`

Regenerate after route/schema changes:

```bash
.venv/bin/python scripts/generate_api_artifacts.py
```

## Testing

Safe smoke tests:

```bash
.venv/bin/python scripts/test_all_apis.py --base-url http://localhost:8000
```

Authenticated smoke tests:

```bash
.venv/bin/python scripts/test_all_apis.py \
  --base-url http://localhost:8000 \
  --access-token "$ACCESS_TOKEN"
```

Existing backend tests:

```bash
cd backend
../.venv/bin/python -m pytest app/tests
```

## Notes

- WebSocket route: `/api/v1/ws`
- Protected HTTP APIs accept `Authorization: Bearer <access_token>`
- Refresh token flow uses the refresh cookie plus `X-CSRF-Token`
- Local media files are ignored except `backend/media/.gitkeep`
