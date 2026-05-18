# Quick Start

This guide gets the WhatsApp Clone running locally from a clean terminal.

## Prerequisites

- Python 3.11+ with the project virtual environment available at `.venv/`
- Node.js and npm
- PostgreSQL or the SQLite/dev database already configured in `backend/.env`
- Git

## 1. Clone And Enter The Project

```bash
git clone https://github.com/hardik79999/WhatsApp.git
cd WhatsApp
```

If you are already in the project:

```bash
cd /home/hardik/Technotery/FastApi/Project/WhatsApp
```

## 2. Create Environment Files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Update `backend/.env` with your database URL and secret key.

Minimum backend values:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_db
SECRET_KEY=change-me-to-a-long-random-secret-key-at-least-32-chars
ALGORITHM=HS256
BASE_URL=http://localhost:8000
```

## 3. Install Dependencies

Backend:

```bash
.venv/bin/python -m pip install -r backend/requirements.txt
```

Frontend:

```bash
cd frontend
npm install
cd ..
```

## 4. Start Backend

```bash
./start_backend.sh
```

Expected backend URL:

```text
http://localhost:8000
```

Quick check:

```bash
curl http://localhost:8000/
```

Expected response:

```json
{"message":"Welcome to WhatsApp Clone API!"}
```

## 5. Start Frontend

Open a second terminal:

```bash
./start_frontend.sh
```

Open:

```text
http://localhost:5173
```

## 6. Start API Dashboard

Open a third terminal:

```bash
python3 -m http.server 4173 --directory docs
```

Open:

```text
http://localhost:4173/index.html
```

If port `4173` is busy:

```bash
python3 -m http.server 4174 --directory docs
```

Then open:

```text
http://localhost:4174/index.html
```

## 7. Login Flow

1. Open the API dashboard.
2. Search for `send-otp`.
3. Run `POST /api/v1/auth/send-otp`.
4. Read the mock OTP printed in the backend terminal.
5. Search for `verify-otp`.
6. Run `POST /api/v1/auth/verify-otp` with the OTP.
7. Copy `access_token`.
8. Paste it into the dashboard Access Token field.
9. Test protected APIs.

Example verify response:

```json
{
  "access_token": "...",
  "token_type": "bearer",
  "csrf_access_token": "...",
  "csrf_refresh_token": "...",
  "is_new_user": true
}
```

## 8. Run Safe API Smoke Tests

```bash
.venv/bin/python scripts/test_all_apis.py --base-url http://localhost:8000
```

Expected:

- `GET /` passes
- `POST /api/v1/auth/send-otp` passes
- Protected APIs are skipped unless you provide a token

Authenticated mode:

```bash
.venv/bin/python scripts/test_all_apis.py \
  --base-url http://localhost:8000 \
  --access-token "$ACCESS_TOKEN"
```

## 9. Import API Collections

Postman:

```text
POSTMAN_COLLECTION.json
```

Thunder Client:

```text
THUNDER_CLIENT_COLLECTION.json
```

Bruno:

```text
BRUNO_COLLECTION/
```

## 10. Common Problems

Backend not running:

```bash
./start_backend.sh
```

Frontend not running:

```bash
./start_frontend.sh
```

Dashboard not opening:

```bash
python3 -m http.server 4173 --directory docs
```

401 Unauthorized:

- Login again
- Copy the full `access_token`
- Use `Authorization: Bearer <access_token>`

WebSocket disconnects:

- Login from the same browser/host
- Use `localhost` consistently
- Confirm the backend is running
