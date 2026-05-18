# Frontend

React/Vite frontend for the WhatsApp Clone project.

## Responsibilities

- OTP login UI
- Chat list and chat window
- Direct and group messaging
- Media upload and preview flows
- Voice recorder and audio playback
- Status creation and viewing
- Reactions, forwarding, profile panels, and contact details
- WebSocket connection for realtime updates
- Call UI and WebRTC signaling integration

## Local Setup

From the repository root:

```bash
cp frontend/.env.example frontend/.env.local
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Environment Variables

See [frontend/.env.example](.env.example).

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/api/v1/ws
```

Do not commit `.env.local`.

## Available Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## API Client

The frontend API client lives in:

```text
frontend/src/api/
```

Important files:

- `client.js`: shared Axios instance, JWT header injection, token refresh handling
- `auth.js`: OTP and token helpers
- `chats.js`: chat and group helpers
- `messages.js`: message helpers
- `media.js`: upload/delete helpers
- `contacts.js`: contact helpers
- `reactions.js`: reaction helpers

## Realtime

The WebSocket endpoint is:

```text
ws://localhost:8000/api/v1/ws
```

The backend currently authenticates WebSockets through the `access_token` cookie.

## Production Build

```bash
npm run build
```

Build output:

```text
frontend/dist/
```

The `dist/` folder is ignored by git.
