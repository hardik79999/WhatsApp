# API Guide

Generated: `2026-05-18T05:15:25.536878+00:00`

Project: **WhatsApp Clone API** `1.0.0`

Base URL: `http://localhost:8000`

## Inventory

- HTTP endpoints: **46**
- WebSocket endpoints: **1**
- Modules: **11**
- Diagnostics: **20**

## Authentication

- OTP request: `POST /api/v1/auth/send-otp`
- Login/register: `POST /api/v1/auth/verify-otp`
- Refresh: `POST /api/v1/auth/refresh`
- Logout: `POST /api/v1/auth/logout`
- Protected HTTP APIs: `Authorization: Bearer <access_token>`
- Cookie mode: `access_token cookie + X-CSRF-Token matching csrf_access_token`
- Refresh mode: `refresh_token cookie + X-CSRF-Token matching csrf_refresh_token`
- WebSocket: `WS /api/v1/ws reads access_token from cookies only.`

## How To Use APIs

1. Send OTP to a valid 10-digit Indian mobile number.
2. Verify OTP. This logs in an existing user or registers a new user.
3. Store access_token, csrf_access_token, and csrf_refresh_token from the response. Browser clients also receive HttpOnly cookies.
4. Call protected APIs with Authorization: Bearer <access_token>. Cookie mode also needs X-CSRF-Token.
5. Sync/search contacts, create a direct chat or group, upload media if needed, send messages, then use WebSocket for typing/read/call signaling.
6. When access expires, call refresh with the refresh cookie and csrf_refresh_token, then update stored tokens.

## Module Map

### Authentication
| Method | Path | Auth | Request | Response | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/v1/auth/logout` | no | - | 200 | `backend/app/api/routes/auth.py:144` |
| `POST` | `/api/v1/auth/refresh` | yes | - | TokenResponse | `backend/app/api/routes/auth.py:75` |
| `POST` | `/api/v1/auth/send-otp` | no | SendOTPRequest | 200 | `backend/app/api/routes/auth.py:25` |
| `POST` | `/api/v1/auth/verify-otp` | no | VerifyOTPRequest | TokenResponse | `backend/app/api/routes/auth.py:34` |

### Calls
| Method | Path | Auth | Request | Response | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/v1/calls/history` | yes | - | Response Get Call History Api V1 Calls History Get | `backend/app/api/routes/calls.py:167` |
| `POST` | `/api/v1/calls/initiate` | yes | CallInitiate | CallResponse | `backend/app/api/routes/calls.py:20` |
| `POST` | `/api/v1/calls/{call_id}/accept` | yes | - | CallResponse | `backend/app/api/routes/calls.py:63` |
| `POST` | `/api/v1/calls/{call_id}/end` | yes | - | CallResponse | `backend/app/api/routes/calls.py:126` |
| `POST` | `/api/v1/calls/{call_id}/reject` | yes | - | CallResponse | `backend/app/api/routes/calls.py:97` |

### Chats
| Method | Path | Auth | Request | Response | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/v1/chats/` | yes | - | Response Get My Chats Api V1 Chats  Get | `backend/app/api/routes/chats.py:193` |
| `POST` | `/api/v1/chats/` | yes | ChatCreate | ChatResponse | `backend/app/api/routes/chats.py:86` |
| `POST` | `/api/v1/chats/group` | yes | GroupChatCreate | ChatResponse | `backend/app/api/routes/chats.py:126` |
| `GET` | `/api/v1/chats/{chat_id}` | yes | - | ChatResponse | `backend/app/api/routes/chats.py:209` |
| `PUT` | `/api/v1/chats/{chat_id}/info` | yes | GroupUpdate | ChatResponse | `backend/app/api/routes/chats.py:272` |
| `POST` | `/api/v1/chats/{chat_id}/participants` | yes | - | 200 | `backend/app/api/routes/chats.py:230` |
| `DELETE` | `/api/v1/chats/{chat_id}/participants/{user_id}` | yes | - | 200 | `backend/app/api/routes/chats.py:304` |
| `POST` | `/api/v1/chats/{chat_id}/participants/{user_id}/promote` | yes | - | 200 | `backend/app/api/routes/chats.py:342` |

### Contacts
| Method | Path | Auth | Request | Response | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/v1/contacts/` | yes | - | Response Get My Contacts Api V1 Contacts  Get | `backend/app/api/routes/contacts.py:134` |
| `POST` | `/api/v1/contacts/sync` | yes | SyncContactsRequest | Response Sync Contacts Api V1 Contacts Sync Post | `backend/app/api/routes/contacts.py:13` |
| `POST` | `/api/v1/contacts/sync-single` | yes | SyncSingleContactRequest | ContactResponse | `backend/app/api/routes/contacts.py:74` |

### Groups
| Method | Path | Auth | Request | Response | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/v1/groups/create` | yes | GroupCreateRequest | ChatResponse | `backend/app/api/routes/groups.py:101` |
| `POST` | `/api/v1/groups/{group_id}/add-members` | yes | MemberIdsRequest | 200 | `backend/app/api/routes/groups.py:156` |
| `GET` | `/api/v1/groups/{group_id}/members` | yes | - | Response List Members Api V1 Groups  Group Id  Members Get | `backend/app/api/routes/groups.py:289` |
| `DELETE` | `/api/v1/groups/{group_id}/remove-member/{member_id}` | yes | - | 200 | `backend/app/api/routes/groups.py:219` |

### Media
| Method | Path | Auth | Request | Response | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/v1/media/upload` | yes | Body_upload_media_api_v1_media_upload_post | MediaUploadResponse | `backend/app/api/routes/media.py:73` |
| `POST` | `/api/v1/media/voice` | yes | Body_upload_voice_note_api_v1_media_voice_post | MediaUploadResponse | `backend/app/api/routes/media.py:153` |
| `DELETE` | `/api/v1/media/{folder}/{filename}` | yes | - | 204 | `backend/app/api/routes/media.py:211` |

### Messages
| Method | Path | Auth | Request | Response | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/v1/messages/` | yes | MessageCreate | MessageResponse | `backend/app/api/routes/messages.py:44` |
| `GET` | `/api/v1/messages/starred/list` | yes | - | Response Get Starred Messages Api V1 Messages Starred List Get | `backend/app/api/routes/messages.py:316` |
| `GET` | `/api/v1/messages/{chat_id}` | yes | - | MessagePageResponse | `backend/app/api/routes/messages.py:147` |
| `PATCH` | `/api/v1/messages/{message_id}` | yes | MessageEdit | MessageResponse | `backend/app/api/routes/messages.py:193` |
| `DELETE` | `/api/v1/messages/{message_id}` | yes | - | 200 | `backend/app/api/routes/messages.py:235` |
| `POST` | `/api/v1/messages/{message_id}/star` | yes | - | 200 | `backend/app/api/routes/messages.py:287` |

### Reactions
| Method | Path | Auth | Request | Response | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/v1/reactions/` | yes | ReactionCreate | ReactionResponse | `backend/app/api/routes/reactions.py:31` |
| `GET` | `/api/v1/reactions/{message_id}` | yes | - | Response Get Message Reactions Api V1 Reactions  Message Id  Get | `backend/app/api/routes/reactions.py:158` |
| `DELETE` | `/api/v1/reactions/{message_id}` | yes | - | 200 | `backend/app/api/routes/reactions.py:105` |

### Statuses
| Method | Path | Auth | Request | Response | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/v1/statuses/` | yes | - | Response Get Contact Statuses Api V1 Statuses  Get | `backend/app/api/routes/statuses.py:123` |
| `POST` | `/api/v1/statuses/` | yes | StatusCreate | StatusResponse | `backend/app/api/routes/statuses.py:67` |
| `GET` | `/api/v1/statuses/my` | yes | - | Response Get My Statuses Api V1 Statuses My Get | `backend/app/api/routes/statuses.py:102` |
| `DELETE` | `/api/v1/statuses/{status_id}` | yes | - | 200 | `backend/app/api/routes/statuses.py:216` |
| `POST` | `/api/v1/statuses/{status_id}/view` | yes | - | 200 | `backend/app/api/routes/statuses.py:181` |

### System
| Method | Path | Auth | Request | Response | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/` | no | - | 200 | `backend/app/main.py:104` |

### Users
| Method | Path | Auth | Request | Response | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/v1/users/me` | yes | - | UserResponse | `backend/app/api/routes/users.py:16` |
| `PUT` | `/api/v1/users/me` | yes | UserUpdate | UserResponse | `backend/app/api/routes/users.py:41` |
| `POST` | `/api/v1/users/me/photo` | yes | Body_upload_profile_picture_api_v1_users_me_photo_post | UserResponse | `backend/app/api/routes/users.py:57` |
| `GET` | `/api/v1/users/search` | yes | - | Response Search Users Api V1 Users Search Get | `backend/app/api/routes/users.py:20` |

## WebSocket Routes

### `/api/v1/ws`

Requires the access_token cookie. The current implementation does not read Bearer headers or ?token= query params for WebSocket auth.

Client events: `call_end, call_rejected, mark_read, ping, typing, webrtc_answer, webrtc_ice_candidate, webrtc_offer`

Server events: `call_end, call_ended, call_rejected, messages_read, pong, typing, user_offline, webrtc_answer, webrtc_ice_candidate, webrtc_offer`

## Diagnostics And Suggested Fixes

- **MEDIUM - Validation/API shape** at `POST /api/v1/chats/{chat_id}/participants`: user_to_add is accepted as a query parameter on a mutating endpoint. Suggestion: Move it into a request body such as {"user_id": "..."} or retire this in favor of /groups/{group_id}/add-members.
- **MEDIUM - Duplicate workflow** at `POST /api/v1/chats/group and POST /api/v1/groups/create`: Two endpoints create group chats with slightly different payloads. Suggestion: Pick one canonical group creation API and keep the other as a compatibility wrapper or deprecate it.
- **MEDIUM - WebSocket auth limitation** at `WS /api/v1/ws`: WebSocket auth only reads the access_token cookie. Suggestion: If mobile/non-browser clients need WS support, also accept a short-lived token in a query param or subprotocol.
- **LOW - Missing response model** at `POST /api/v1/auth/send-otp`: The route returns a dict or empty response without an explicit response_model. Suggestion: Add a small Pydantic response schema so docs and clients get a stable contract.
- **LOW - Missing response model** at `POST /api/v1/auth/logout`: The route returns a dict or empty response without an explicit response_model. Suggestion: Add a small Pydantic response schema so docs and clients get a stable contract.
- **LOW - Missing response model** at `POST /api/v1/chats/{chat_id}/participants`: The route returns a dict or empty response without an explicit response_model. Suggestion: Add a small Pydantic response schema so docs and clients get a stable contract.
- **LOW - Missing response model** at `DELETE /api/v1/chats/{chat_id}/participants/{user_id}`: The route returns a dict or empty response without an explicit response_model. Suggestion: Add a small Pydantic response schema so docs and clients get a stable contract.
- **LOW - Missing response model** at `POST /api/v1/chats/{chat_id}/participants/{user_id}/promote`: The route returns a dict or empty response without an explicit response_model. Suggestion: Add a small Pydantic response schema so docs and clients get a stable contract.
- **LOW - Missing response model** at `POST /api/v1/groups/{group_id}/add-members`: The route returns a dict or empty response without an explicit response_model. Suggestion: Add a small Pydantic response schema so docs and clients get a stable contract.
- **LOW - Missing response model** at `DELETE /api/v1/groups/{group_id}/remove-member/{member_id}`: The route returns a dict or empty response without an explicit response_model. Suggestion: Add a small Pydantic response schema so docs and clients get a stable contract.
- **LOW - Missing response model** at `DELETE /api/v1/messages/{message_id}`: The route returns a dict or empty response without an explicit response_model. Suggestion: Add a small Pydantic response schema so docs and clients get a stable contract.
- **LOW - Missing response model** at `POST /api/v1/messages/{message_id}/star`: The route returns a dict or empty response without an explicit response_model. Suggestion: Add a small Pydantic response schema so docs and clients get a stable contract.
- **LOW - Missing response model** at `DELETE /api/v1/media/{folder}/{filename}`: The route returns a dict or empty response without an explicit response_model. Suggestion: Add a small Pydantic response schema so docs and clients get a stable contract.
- **LOW - Missing response model** at `DELETE /api/v1/reactions/{message_id}`: The route returns a dict or empty response without an explicit response_model. Suggestion: Add a small Pydantic response schema so docs and clients get a stable contract.
- **LOW - Missing response model** at `POST /api/v1/statuses/{status_id}/view`: The route returns a dict or empty response without an explicit response_model. Suggestion: Add a small Pydantic response schema so docs and clients get a stable contract.
- **LOW - Missing response model** at `DELETE /api/v1/statuses/{status_id}`: The route returns a dict or empty response without an explicit response_model. Suggestion: Add a small Pydantic response schema so docs and clients get a stable contract.
- **INFO - Possibly unused by frontend** at `GET /api/v1/calls/history`: No direct frontend call was found by static string scan. Suggestion: Keep it if used externally/Postman-only; otherwise consider wiring it into the UI, documenting it as admin/internal, or removing it.
- **INFO - Possibly unused by frontend** at `POST /api/v1/chats/{chat_id}/participants`: No direct frontend call was found by static string scan. Suggestion: Keep it if used externally/Postman-only; otherwise consider wiring it into the UI, documenting it as admin/internal, or removing it.
- **INFO - Possibly unused by frontend** at `GET /api/v1/groups/{group_id}/members`: No direct frontend call was found by static string scan. Suggestion: Keep it if used externally/Postman-only; otherwise consider wiring it into the UI, documenting it as admin/internal, or removing it.
- **INFO - Possibly unused by frontend** at `GET /api/v1/messages/starred/list`: No direct frontend call was found by static string scan. Suggestion: Keep it if used externally/Postman-only; otherwise consider wiring it into the UI, documenting it as admin/internal, or removing it.

## Generated Assets

- `docs/index.html`: visual dashboard and playground
- `POSTMAN_COLLECTION.json`: Postman v2.1 collection
- `THUNDER_CLIENT_COLLECTION.json`: Thunder Client collection
- `BRUNO_COLLECTION/`: Bruno request files
- `API_USAGE_EXAMPLES.md`: curl, fetch, and axios examples
- `API_FLOW_DIAGRAM.md`: Mermaid flow diagrams
- `scripts/test_all_apis.py`: smoke/playground test runner
