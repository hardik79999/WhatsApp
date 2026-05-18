# API Flow Diagram

Generated: `2026-05-18T05:15:25.536878+00:00`

## Main Backend Flow

```mermaid
flowchart TD
  A[Open app] --> B[POST /api/v1/auth/send-otp]
  B --> C[Read OTP from backend console or OTP provider]
  C --> D[POST /api/v1/auth/verify-otp]
  D --> E{is_new_user?}
  E -->|true| F[PUT /api/v1/users/me]
  E -->|false| G[GET /api/v1/users/me]
  F --> H[Sync or search contacts]
  G --> H
  H --> I[POST /api/v1/contacts/sync-single or /contacts/sync]
  H --> J[GET /api/v1/users/search]
  I --> K[POST /api/v1/chats/ or /api/v1/groups/create]
  J --> K
  K --> L[GET /api/v1/chats/]
  L --> M[GET /api/v1/messages/{chat_id}]
  M --> N[POST /api/v1/media/upload optional]
  N --> O[POST /api/v1/messages/]
  M --> O
  O --> P[WS /api/v1/ws realtime events]
  P --> Q[typing, mark_read, WebRTC signaling]
```

## Authentication Refresh Flow

```mermaid
sequenceDiagram
  participant Client
  participant API
  Client->>API: POST /auth/verify-otp
  API-->>Client: access_token + csrf tokens + HttpOnly cookies
  Client->>API: Protected API with Authorization Bearer
  API-->>Client: 401 when access token expires
  Client->>API: POST /auth/refresh with refresh cookie + X-CSRF-Token
  API-->>Client: rotated access_token + refresh cookie + csrf tokens
  Client->>API: Retry original request
```

## Realtime Flow

```mermaid
sequenceDiagram
  participant Sender
  participant API
  participant Receiver
  Sender->>API: POST /messages/
  API->>Receiver: WS new_message
  Receiver->>API: WS mark_read
  API->>Sender: WS messages_read
  Sender->>API: POST /calls/initiate
  API->>Receiver: WS incoming_call
  Receiver->>API: POST /calls/{call_id}/accept
  API->>Sender: WS call_accepted
  Sender->>Receiver: WS WebRTC offer/answer/ice relay
```
