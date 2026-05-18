# API Usage Examples

Generated: `2026-05-18T05:15:25.536878+00:00`

Set these once:

```bash
export BASE_URL=http://localhost:8000
export ACCESS_TOKEN='<paste access_token>'
export CSRF_REFRESH_TOKEN='<paste csrf_refresh_token>'
```

## Authentication Quick Start

```bash
curl -X POST "$BASE_URL/api/v1/auth/send-otp" \
  -H 'Content-Type: application/json' \
  -d '{"phone":"9876543210"}'

curl -X POST "$BASE_URL/api/v1/auth/verify-otp" \
  -H 'Content-Type: application/json' \
  -c cookies.txt \
  -d '{"phone":"9876543210","otp":"123456"}'
```

## Authentication

### POST `/api/v1/auth/logout`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/auth/logout'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
  method: 'POST',
  credentials: 'include',
  headers: {

  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/auth/logout`, null, { withCredentials: true });
```

### POST `/api/v1/auth/refresh`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/auth/refresh' \
  -H 'X-CSRF-Token: ${CSRF_REFRESH_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "X-CSRF-Token": `${csrfRefreshToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, null, { withCredentials: true, headers: { 'X-CSRF-Token': csrfRefreshToken } });
```

Response example:

```json
{
  "access_token": "<token>",
  "token_type": "<token>",
  "csrf_access_token": "<token>",
  "csrf_refresh_token": "<token>",
  "is_new_user": false
}
```

### POST `/api/v1/auth/send-otp`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/auth/send-otp' \
  -H 'Content-Type: application/json' \
  -d '{"phone": "+919876543210"}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/auth/send-otp`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Content-Type": `application/json`,
  },
  body: JSON.stringify({"phone": "+919876543210"})
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/auth/send-otp`, {"phone": "+919876543210"}, { withCredentials: true });
```

Request body:

```json
{
  "phone": "+919876543210"
}
```

### POST `/api/v1/auth/verify-otp`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/auth/verify-otp' \
  -H 'Content-Type: application/json' \
  -d '{"phone": "+919876543210", "otp": "123456"}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Content-Type": `application/json`,
  },
  body: JSON.stringify({"phone": "+919876543210", "otp": "123456"})
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/auth/verify-otp`, {"phone": "+919876543210", "otp": "123456"}, { withCredentials: true });
```

Request body:

```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

Response example:

```json
{
  "access_token": "<token>",
  "token_type": "<token>",
  "csrf_access_token": "<token>",
  "csrf_refresh_token": "<token>",
  "is_new_user": false
}
```

## Calls

### GET `/api/v1/calls/history`

Curl:

```bash
curl -X GET '${BASE_URL}/api/v1/calls/history' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/calls/history`, {
  method: 'GET',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.get(`${API_BASE_URL}/api/v1/calls/history`, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Response example:

```json
[
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "call_type": "audio",
    "status": "sample_status",
    "direction": "sample_direction",
    "other_user_id": "11111111-1111-1111-1111-111111111111",
    "other_username": "Hardik",
    "other_profile_pic": "sample_other_profile_pic",
    "duration_seconds": 30,
    "created_at": "2026-05-18T00:00:00Z"
  }
]
```

### POST `/api/v1/calls/initiate`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/calls/initiate' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{"receiver_id": "11111111-1111-1111-1111-111111111111", "call_type": "audio"}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/calls/initiate`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": `application/json`,
  },
  body: JSON.stringify({"receiver_id": "11111111-1111-1111-1111-111111111111", "call_type": "audio"})
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/calls/initiate`, {"receiver_id": "11111111-1111-1111-1111-111111111111", "call_type": "audio"}, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Request body:

```json
{
  "receiver_id": "11111111-1111-1111-1111-111111111111",
  "call_type": "audio"
}
```

Response example:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "caller_id": "11111111-1111-1111-1111-111111111111",
  "receiver_id": "11111111-1111-1111-1111-111111111111",
  "call_type": "audio",
  "status": "sample_status",
  "started_at": "2026-05-18T00:00:00Z",
  "ended_at": "2026-05-18T00:00:00Z",
  "created_at": "2026-05-18T00:00:00Z"
}
```

### POST `/api/v1/calls/{call_id}/accept`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/calls/11111111-1111-1111-1111-111111111111/accept' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/calls/${call_id}/accept`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/calls/${call_id}/accept`, null, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Response example:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "caller_id": "11111111-1111-1111-1111-111111111111",
  "receiver_id": "11111111-1111-1111-1111-111111111111",
  "call_type": "audio",
  "status": "sample_status",
  "started_at": "2026-05-18T00:00:00Z",
  "ended_at": "2026-05-18T00:00:00Z",
  "created_at": "2026-05-18T00:00:00Z"
}
```

### POST `/api/v1/calls/{call_id}/end`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/calls/11111111-1111-1111-1111-111111111111/end' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/calls/${call_id}/end`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/calls/${call_id}/end`, null, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Response example:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "caller_id": "11111111-1111-1111-1111-111111111111",
  "receiver_id": "11111111-1111-1111-1111-111111111111",
  "call_type": "audio",
  "status": "sample_status",
  "started_at": "2026-05-18T00:00:00Z",
  "ended_at": "2026-05-18T00:00:00Z",
  "created_at": "2026-05-18T00:00:00Z"
}
```

### POST `/api/v1/calls/{call_id}/reject`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/calls/11111111-1111-1111-1111-111111111111/reject' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/calls/${call_id}/reject`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/calls/${call_id}/reject`, null, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Response example:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "caller_id": "11111111-1111-1111-1111-111111111111",
  "receiver_id": "11111111-1111-1111-1111-111111111111",
  "call_type": "audio",
  "status": "sample_status",
  "started_at": "2026-05-18T00:00:00Z",
  "ended_at": "2026-05-18T00:00:00Z",
  "created_at": "2026-05-18T00:00:00Z"
}
```

## Chats

### GET `/api/v1/chats/`

Curl:

```bash
curl -X GET '${BASE_URL}/api/v1/chats/' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/chats/`, {
  method: 'GET',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.get(`${API_BASE_URL}/api/v1/chats/`, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Response example:

```json
[
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "is_group": false,
    "group_name": "Project User",
    "group_picture": "sample_group_picture",
    "group_description": "Project test group",
    "created_by": "11111111-1111-1111-1111-111111111111",
    "updated_at": "2026-05-18T00:00:00Z",
    "participants": [
      {
        "user_id": "11111111-1111-1111-1111-111111111111",
        "phone": "9876543210",
        "username": "Hardik",
        "profile_pic": "sample_profile_pic",
        "role": "sample_role",
        "is_online": false
      }
    ],
    "last_message": {
      "key": "value"
    },
    "unread_count": 1
  }
]
```

### POST `/api/v1/chats/`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/chats/' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{"contact_id": "11111111-1111-1111-1111-111111111111"}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/chats/`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": `application/json`,
  },
  body: JSON.stringify({"contact_id": "11111111-1111-1111-1111-111111111111"})
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/chats/`, {"contact_id": "11111111-1111-1111-1111-111111111111"}, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Request body:

```json
{
  "contact_id": "11111111-1111-1111-1111-111111111111"
}
```

Response example:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "is_group": false,
  "group_name": "Project User",
  "group_picture": "sample_group_picture",
  "group_description": "Project test group",
  "created_by": "11111111-1111-1111-1111-111111111111",
  "updated_at": "2026-05-18T00:00:00Z",
  "participants": [
    {
      "user_id": "11111111-1111-1111-1111-111111111111",
      "phone": "9876543210",
      "username": "Hardik",
      "profile_pic": "sample_profile_pic",
      "role": "sample_role",
      "is_online": false
    }
  ],
  "last_message": {
    "key": "value"
  },
  "unread_count": 1
}
```

### POST `/api/v1/chats/group`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/chats/group' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{"group_name": "Project User", "group_description": "Project test group", "group_picture": "sample_group_picture", "participant_ids": ["11111111-1111-1111-1111-111111111111"]}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/chats/group`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": `application/json`,
  },
  body: JSON.stringify({"group_name": "Project User", "group_description": "Project test group", "group_picture": "sample_group_picture", "participant_ids": ["11111111-1111-1111-1111-111111111111"]})
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/chats/group`, {"group_name": "Project User", "group_description": "Project test group", "group_picture": "sample_group_picture", "participant_ids": ["11111111-1111-1111-1111-111111111111"]}, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Request body:

```json
{
  "group_name": "Project User",
  "group_description": "Project test group",
  "group_picture": "sample_group_picture",
  "participant_ids": [
    "11111111-1111-1111-1111-111111111111"
  ]
}
```

Response example:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "is_group": false,
  "group_name": "Project User",
  "group_picture": "sample_group_picture",
  "group_description": "Project test group",
  "created_by": "11111111-1111-1111-1111-111111111111",
  "updated_at": "2026-05-18T00:00:00Z",
  "participants": [
    {
      "user_id": "11111111-1111-1111-1111-111111111111",
      "phone": "9876543210",
      "username": "Hardik",
      "profile_pic": "sample_profile_pic",
      "role": "sample_role",
      "is_online": false
    }
  ],
  "last_message": {
    "key": "value"
  },
  "unread_count": 1
}
```

### GET `/api/v1/chats/{chat_id}`

Curl:

```bash
curl -X GET '${BASE_URL}/api/v1/chats/11111111-1111-1111-1111-111111111111' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/chats/${chat_id}`, {
  method: 'GET',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.get(`${API_BASE_URL}/api/v1/chats/${chat_id}`, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Response example:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "is_group": false,
  "group_name": "Project User",
  "group_picture": "sample_group_picture",
  "group_description": "Project test group",
  "created_by": "11111111-1111-1111-1111-111111111111",
  "updated_at": "2026-05-18T00:00:00Z",
  "participants": [
    {
      "user_id": "11111111-1111-1111-1111-111111111111",
      "phone": "9876543210",
      "username": "Hardik",
      "profile_pic": "sample_profile_pic",
      "role": "sample_role",
      "is_online": false
    }
  ],
  "last_message": {
    "key": "value"
  },
  "unread_count": 1
}
```

### PUT `/api/v1/chats/{chat_id}/info`

Curl:

```bash
curl -X PUT '${BASE_URL}/api/v1/chats/11111111-1111-1111-1111-111111111111/info' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{"group_name": "Project User", "group_description": "Project test group", "group_picture": "sample_group_picture"}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/chats/${chat_id}/info`, {
  method: 'PUT',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": `application/json`,
  },
  body: JSON.stringify({"group_name": "Project User", "group_description": "Project test group", "group_picture": "sample_group_picture"})
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.put(`${API_BASE_URL}/api/v1/chats/${chat_id}/info`, {"group_name": "Project User", "group_description": "Project test group", "group_picture": "sample_group_picture"}, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Request body:

```json
{
  "group_name": "Project User",
  "group_description": "Project test group",
  "group_picture": "sample_group_picture"
}
```

Response example:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "is_group": false,
  "group_name": "Project User",
  "group_picture": "sample_group_picture",
  "group_description": "Project test group",
  "created_by": "11111111-1111-1111-1111-111111111111",
  "updated_at": "2026-05-18T00:00:00Z",
  "participants": [
    {
      "user_id": "11111111-1111-1111-1111-111111111111",
      "phone": "9876543210",
      "username": "Hardik",
      "profile_pic": "sample_profile_pic",
      "role": "sample_role",
      "is_online": false
    }
  ],
  "last_message": {
    "key": "value"
  },
  "unread_count": 1
}
```

### POST `/api/v1/chats/{chat_id}/participants`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/chats/11111111-1111-1111-1111-111111111111/participants?user_to_add=11111111-1111-1111-1111-111111111111' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/chats/${chat_id}/participants?user_to_add=11111111-1111-1111-1111-111111111111`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/chats/${chat_id}/participants?user_to_add=11111111-1111-1111-1111-111111111111`, null, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

### DELETE `/api/v1/chats/{chat_id}/participants/{user_id}`

Curl:

```bash
curl -X DELETE '${BASE_URL}/api/v1/chats/11111111-1111-1111-1111-111111111111/participants/11111111-1111-1111-1111-111111111111' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/chats/${chat_id}/participants/${user_id}`, {
  method: 'DELETE',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.delete(`${API_BASE_URL}/api/v1/chats/${chat_id}/participants/${user_id}`, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

### POST `/api/v1/chats/{chat_id}/participants/{user_id}/promote`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/chats/11111111-1111-1111-1111-111111111111/participants/11111111-1111-1111-1111-111111111111/promote' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/chats/${chat_id}/participants/${user_id}/promote`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/chats/${chat_id}/participants/${user_id}/promote`, null, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

## Contacts

### GET `/api/v1/contacts/`

Curl:

```bash
curl -X GET '${BASE_URL}/api/v1/contacts/' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/contacts/`, {
  method: 'GET',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.get(`${API_BASE_URL}/api/v1/contacts/`, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Response example:

```json
[
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "contact_id": "11111111-1111-1111-1111-111111111111",
    "phone": "9876543210",
    "saved_name": "Project User",
    "profile_pic": "sample_profile_pic",
    "bio": "Available"
  }
]
```

### POST `/api/v1/contacts/sync`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/contacts/sync' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{"contacts": [{"phone": "9876543210", "name": "Project User"}]}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/contacts/sync`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": `application/json`,
  },
  body: JSON.stringify({"contacts": [{"phone": "9876543210", "name": "Project User"}]})
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/contacts/sync`, {"contacts": [{"phone": "9876543210", "name": "Project User"}]}, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Request body:

```json
{
  "contacts": [
    {
      "phone": "9876543210",
      "name": "Project User"
    }
  ]
}
```

Response example:

```json
[
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "contact_id": "11111111-1111-1111-1111-111111111111",
    "phone": "9876543210",
    "saved_name": "Project User",
    "profile_pic": "sample_profile_pic",
    "bio": "Available"
  }
]
```

### POST `/api/v1/contacts/sync-single`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/contacts/sync-single' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{"phone": "9876543210", "name": "Project User"}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/contacts/sync-single`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": `application/json`,
  },
  body: JSON.stringify({"phone": "9876543210", "name": "Project User"})
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/contacts/sync-single`, {"phone": "9876543210", "name": "Project User"}, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Request body:

```json
{
  "phone": "9876543210",
  "name": "Project User"
}
```

Response example:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "contact_id": "11111111-1111-1111-1111-111111111111",
  "phone": "9876543210",
  "saved_name": "Project User",
  "profile_pic": "sample_profile_pic",
  "bio": "Available"
}
```

## Groups

### POST `/api/v1/groups/create`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/groups/create' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{"group_name": "Project User", "group_description": "Project test group", "group_pic_id": "11111111-1111-1111-1111-111111111111", "participant_ids": ["11111111-1111-1111-1111-111111111111"]}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/groups/create`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": `application/json`,
  },
  body: JSON.stringify({"group_name": "Project User", "group_description": "Project test group", "group_pic_id": "11111111-1111-1111-1111-111111111111", "participant_ids": ["11111111-1111-1111-1111-111111111111"]})
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/groups/create`, {"group_name": "Project User", "group_description": "Project test group", "group_pic_id": "11111111-1111-1111-1111-111111111111", "participant_ids": ["11111111-1111-1111-1111-111111111111"]}, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Request body:

```json
{
  "group_name": "Project User",
  "group_description": "Project test group",
  "group_pic_id": "11111111-1111-1111-1111-111111111111",
  "participant_ids": [
    "11111111-1111-1111-1111-111111111111"
  ]
}
```

Response example:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "is_group": false,
  "group_name": "Project User",
  "group_picture": "sample_group_picture",
  "group_description": "Project test group",
  "created_by": "11111111-1111-1111-1111-111111111111",
  "updated_at": "2026-05-18T00:00:00Z",
  "participants": [
    {
      "user_id": "11111111-1111-1111-1111-111111111111",
      "phone": "9876543210",
      "username": "Hardik",
      "profile_pic": "sample_profile_pic",
      "role": "sample_role",
      "is_online": false
    }
  ],
  "last_message": {
    "key": "value"
  },
  "unread_count": 1
}
```

### POST `/api/v1/groups/{group_id}/add-members`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/groups/11111111-1111-1111-1111-111111111111/add-members' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{"member_ids": ["11111111-1111-1111-1111-111111111111"]}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/groups/${group_id}/add-members`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": `application/json`,
  },
  body: JSON.stringify({"member_ids": ["11111111-1111-1111-1111-111111111111"]})
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/groups/${group_id}/add-members`, {"member_ids": ["11111111-1111-1111-1111-111111111111"]}, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Request body:

```json
{
  "member_ids": [
    "11111111-1111-1111-1111-111111111111"
  ]
}
```

### GET `/api/v1/groups/{group_id}/members`

Curl:

```bash
curl -X GET '${BASE_URL}/api/v1/groups/11111111-1111-1111-1111-111111111111/members' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/groups/${group_id}/members`, {
  method: 'GET',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.get(`${API_BASE_URL}/api/v1/groups/${group_id}/members`, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Response example:

```json
[
  {
    "user_id": "11111111-1111-1111-1111-111111111111",
    "phone": "9876543210",
    "username": "Hardik",
    "profile_pic": "sample_profile_pic",
    "role": "sample_role",
    "joined_at": "sample_joined_at"
  }
]
```

### DELETE `/api/v1/groups/{group_id}/remove-member/{member_id}`

Curl:

```bash
curl -X DELETE '${BASE_URL}/api/v1/groups/11111111-1111-1111-1111-111111111111/remove-member/11111111-1111-1111-1111-111111111111' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/groups/${group_id}/remove-member/${member_id}`, {
  method: 'DELETE',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.delete(`${API_BASE_URL}/api/v1/groups/${group_id}/remove-member/${member_id}`, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

## Media

### POST `/api/v1/media/upload`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/media/upload' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}' \
  -F 'file=@./sample-file.bin'
```

Fetch:

```js
const form = new FormData();
form.append('file', file);
const res = await fetch(`${API_BASE_URL}/api/v1/media/upload`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  },
  body: form
});
const data = await res.json();
```

Axios:

```js
const form = new FormData();
form.append('file', file);
const { data } = await axios.post(`${API_BASE_URL}/api/v1/media/upload`, form, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Request body:

```json
{
  "file": "<select file>"
}
```

Response example:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "media_url": "http://localhost:8000/media/images/sample.jpg",
  "file_type": "sample_file_type",
  "file_size": 1024,
  "filename": "Project User",
  "thumbnail_url": "http://localhost:8000/media/images/sample.jpg",
  "duration": 30
}
```

### POST `/api/v1/media/voice`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/media/voice' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}' \
  -F 'file=@./sample-file.bin'
```

Fetch:

```js
const form = new FormData();
form.append('file', file);
const res = await fetch(`${API_BASE_URL}/api/v1/media/voice`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  },
  body: form
});
const data = await res.json();
```

Axios:

```js
const form = new FormData();
form.append('file', file);
const { data } = await axios.post(`${API_BASE_URL}/api/v1/media/voice`, form, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Request body:

```json
{
  "file": "<select file>"
}
```

Response example:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "media_url": "http://localhost:8000/media/images/sample.jpg",
  "file_type": "sample_file_type",
  "file_size": 1024,
  "filename": "Project User",
  "thumbnail_url": "http://localhost:8000/media/images/sample.jpg",
  "duration": 30
}
```

### DELETE `/api/v1/media/{folder}/{filename}`

Curl:

```bash
curl -X DELETE '${BASE_URL}/api/v1/media/images/Project User' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/media/${folder}/${filename}`, {
  method: 'DELETE',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.delete(`${API_BASE_URL}/api/v1/media/${folder}/${filename}`, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

## Messages

### POST `/api/v1/messages/`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/messages/' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{"chat_id": "11111111-1111-1111-1111-111111111111", "content": "Hello from the API dashboard", "message_type": "text", "media_url": "http://localhost:8000/media/images/sample.jpg", "thumbnail_url": "http://localhost:8000/media/images/sample.jpg", "file_size": 1024, "duration": 30, "media_id": "11111111-1111-1111-1111-111111111111", "caption": "sample_caption", "reply_to_message_id": "11111111-1111-1111-1111-111111111111"}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/messages/`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": `application/json`,
  },
  body: JSON.stringify({"chat_id": "11111111-1111-1111-1111-111111111111", "content": "Hello from the API dashboard", "message_type": "text", "media_url": "http://localhost:8000/media/images/sample.jpg", "thumbnail_url": "http://localhost:8000/media/images/sample.jpg", "file_size": 1024, "duration": 30, "media_id": "11111111-1111-1111-1111-111111111111", "caption": "sample_caption", "reply_to_message_id": "11111111-1111-1111-1111-111111111111"})
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/messages/`, {"chat_id": "11111111-1111-1111-1111-111111111111", "content": "Hello from the API dashboard", "message_type": "text", "media_url": "http://localhost:8000/media/images/sample.jpg", "thumbnail_url": "http://localhost:8000/media/images/sample.jpg", "file_size": 1024, "duration": 30, "media_id": "11111111-1111-1111-1111-111111111111", "caption": "sample_caption", "reply_to_message_id": "11111111-1111-1111-1111-111111111111"}, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Request body:

```json
{
  "chat_id": "11111111-1111-1111-1111-111111111111",
  "content": "Hello from the API dashboard",
  "message_type": "text",
  "media_url": "http://localhost:8000/media/images/sample.jpg",
  "thumbnail_url": "http://localhost:8000/media/images/sample.jpg",
  "file_size": 1024,
  "duration": 30,
  "media_id": "11111111-1111-1111-1111-111111111111",
  "caption": "sample_caption",
  "reply_to_message_id": "11111111-1111-1111-1111-111111111111"
}
```

Response example:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "chat_id": "11111111-1111-1111-1111-111111111111",
  "sender_id": "11111111-1111-1111-1111-111111111111",
  "content": "Hello from the API dashboard",
  "message_type": "text",
  "status": "sample_status",
  "media_url": "http://localhost:8000/media/images/sample.jpg",
  "thumbnail_url": "http://localhost:8000/media/images/sample.jpg",
  "file_size": 1024,
  "duration": 30,
  "reply_to_message_id": "11111111-1111-1111-1111-111111111111",
  "replied_message": {
    "id": "11111111-1111-1111-1111-111111111111",
    "content": "Hello from the API dashboard",
    "sender_id": "11111111-1111-1111-1111-111111111111",
    "message_type": "text"
  },
  "reactions": [
    {
      "user_id": "11111111-1111-1111-1111-111111111111",
      "reaction": "👍",
      "username": "Hardik"
    }
  ],
  "is_edited": false,
  "is_deleted": false,
  "is_deleted_for_everyone": false,
  "created_at": "2026-05-18T00:00:00Z",
  "edited_at": "2026-05-18T00:00:00Z",
  "media_id": "11111111-1111-1111-1111-111111111111",
  "caption": "sample_caption"
}
```

### GET `/api/v1/messages/starred/list`

Curl:

```bash
curl -X GET '${BASE_URL}/api/v1/messages/starred/list' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/messages/starred/list`, {
  method: 'GET',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.get(`${API_BASE_URL}/api/v1/messages/starred/list`, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Response example:

```json
[
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "chat_id": "11111111-1111-1111-1111-111111111111",
    "sender_id": "11111111-1111-1111-1111-111111111111",
    "content": "Hello from the API dashboard",
    "message_type": "text",
    "status": "sample_status",
    "media_url": "http://localhost:8000/media/images/sample.jpg",
    "thumbnail_url": "http://localhost:8000/media/images/sample.jpg",
    "file_size": 1024,
    "duration": 30,
    "reply_to_message_id": "11111111-1111-1111-1111-111111111111",
    "replied_message": {
      "id": "11111111-1111-1111-1111-111111111111",
      "content": "Hello from the API dashboard",
      "sender_id": "11111111-1111-1111-1111-111111111111",
      "message_type": "text"
    },
    "reactions": [
      {
        "user_id": "11111111-1111-1111-1111-111111111111",
        "reaction": "👍",
        "username": "Hardik"
      }
    ],
    "is_edited": false,
    "is_deleted": false,
    "is_deleted_for_everyone": false,
    "created_at": "2026-05-18T00:00:00Z",
    "edited_at": "2026-05-18T00:00:00Z",
    "media_id": "11111111-1111-1111-1111-111111111111",
    "caption": "sample_caption"
  }
]
```

### GET `/api/v1/messages/{chat_id}`

Curl:

```bash
curl -X GET '${BASE_URL}/api/v1/messages/11111111-1111-1111-1111-111111111111' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/messages/${chat_id}`, {
  method: 'GET',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.get(`${API_BASE_URL}/api/v1/messages/${chat_id}`, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Response example:

```json
{
  "messages": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "chat_id": "11111111-1111-1111-1111-111111111111",
      "sender_id": "11111111-1111-1111-1111-111111111111",
      "content": "Hello from the API dashboard",
      "message_type": "text",
      "status": "sample_status",
      "media_url": "http://localhost:8000/media/images/sample.jpg",
      "thumbnail_url": "http://localhost:8000/media/images/sample.jpg",
      "file_size": 1024,
      "duration": 30,
      "reply_to_message_id": "11111111-1111-1111-1111-111111111111",
      "replied_message": {
        "id": "11111111-1111-1111-1111-111111111111",
        "content": "Hello from the API dashboard",
        "sender_id": "11111111-1111-1111-1111-111111111111",
        "message_type": "text"
      },
      "reactions": [
        {
          "user_id": "11111111-1111-1111-1111-111111111111",
          "reaction": "👍",
          "username": "Hardik"
        }
      ],
      "is_edited": false,
      "is_deleted": false,
      "is_deleted_for_everyone": false,
      "created_at": "2026-05-18T00:00:00Z",
      "edited_at": "2026-05-18T00:00:00Z",
      "media_id": "11111111-1111-1111-1111-111111111111",
      "caption": "sample_caption"
    }
  ],
  "total": 1,
  "page": 1,
  "has_more": false
}
```

### PATCH `/api/v1/messages/{message_id}`

Curl:

```bash
curl -X PATCH '${BASE_URL}/api/v1/messages/11111111-1111-1111-1111-111111111111' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{"content": "Hello from the API dashboard"}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/messages/${message_id}`, {
  method: 'PATCH',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": `application/json`,
  },
  body: JSON.stringify({"content": "Hello from the API dashboard"})
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.patch(`${API_BASE_URL}/api/v1/messages/${message_id}`, {"content": "Hello from the API dashboard"}, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Request body:

```json
{
  "content": "Hello from the API dashboard"
}
```

Response example:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "chat_id": "11111111-1111-1111-1111-111111111111",
  "sender_id": "11111111-1111-1111-1111-111111111111",
  "content": "Hello from the API dashboard",
  "message_type": "text",
  "status": "sample_status",
  "media_url": "http://localhost:8000/media/images/sample.jpg",
  "thumbnail_url": "http://localhost:8000/media/images/sample.jpg",
  "file_size": 1024,
  "duration": 30,
  "reply_to_message_id": "11111111-1111-1111-1111-111111111111",
  "replied_message": {
    "id": "11111111-1111-1111-1111-111111111111",
    "content": "Hello from the API dashboard",
    "sender_id": "11111111-1111-1111-1111-111111111111",
    "message_type": "text"
  },
  "reactions": [
    {
      "user_id": "11111111-1111-1111-1111-111111111111",
      "reaction": "👍",
      "username": "Hardik"
    }
  ],
  "is_edited": false,
  "is_deleted": false,
  "is_deleted_for_everyone": false,
  "created_at": "2026-05-18T00:00:00Z",
  "edited_at": "2026-05-18T00:00:00Z",
  "media_id": "11111111-1111-1111-1111-111111111111",
  "caption": "sample_caption"
}
```

### DELETE `/api/v1/messages/{message_id}`

Curl:

```bash
curl -X DELETE '${BASE_URL}/api/v1/messages/11111111-1111-1111-1111-111111111111' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/messages/${message_id}`, {
  method: 'DELETE',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.delete(`${API_BASE_URL}/api/v1/messages/${message_id}`, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

### POST `/api/v1/messages/{message_id}/star`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/messages/11111111-1111-1111-1111-111111111111/star' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/messages/${message_id}/star`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/messages/${message_id}/star`, null, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

## Reactions

### POST `/api/v1/reactions/`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/reactions/' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{"message_id": "11111111-1111-1111-1111-111111111111", "reaction": "👍"}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/reactions/`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": `application/json`,
  },
  body: JSON.stringify({"message_id": "11111111-1111-1111-1111-111111111111", "reaction": "👍"})
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/reactions/`, {"message_id": "11111111-1111-1111-1111-111111111111", "reaction": "👍"}, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Request body:

```json
{
  "message_id": "11111111-1111-1111-1111-111111111111",
  "reaction": "👍"
}
```

Response example:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "message_id": "11111111-1111-1111-1111-111111111111",
  "user_id": "11111111-1111-1111-1111-111111111111",
  "reaction": "👍",
  "username": "Hardik"
}
```

### GET `/api/v1/reactions/{message_id}`

Curl:

```bash
curl -X GET '${BASE_URL}/api/v1/reactions/11111111-1111-1111-1111-111111111111' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/reactions/${message_id}`, {
  method: 'GET',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.get(`${API_BASE_URL}/api/v1/reactions/${message_id}`, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Response example:

```json
[
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "message_id": "11111111-1111-1111-1111-111111111111",
    "user_id": "11111111-1111-1111-1111-111111111111",
    "reaction": "👍",
    "username": "Hardik"
  }
]
```

### DELETE `/api/v1/reactions/{message_id}`

Curl:

```bash
curl -X DELETE '${BASE_URL}/api/v1/reactions/11111111-1111-1111-1111-111111111111' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/reactions/${message_id}`, {
  method: 'DELETE',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.delete(`${API_BASE_URL}/api/v1/reactions/${message_id}`, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

## Statuses

### GET `/api/v1/statuses/`

Curl:

```bash
curl -X GET '${BASE_URL}/api/v1/statuses/' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/statuses/`, {
  method: 'GET',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.get(`${API_BASE_URL}/api/v1/statuses/`, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Response example:

```json
[
  {
    "user_id": "11111111-1111-1111-1111-111111111111",
    "username": "Hardik",
    "profile_pic": "sample_profile_pic",
    "has_unviewed": false,
    "statuses": [
      {
        "id": "11111111-1111-1111-1111-111111111111",
        "user_id": "11111111-1111-1111-1111-111111111111",
        "username": "Hardik",
        "profile_pic": "sample_profile_pic",
        "content": "Hello from the API dashboard",
        "media_url": "http://localhost:8000/media/images/sample.jpg",
        "thumbnail_url": "http://localhost:8000/media/images/sample.jpg",
        "background_color": "#1a1a2e",
        "expires_at": "2026-05-18T00:00:00Z",
        "created_at": "2026-05-18T00:00:00Z",
        "view_count": 1,
        "is_viewed": false,
        "viewers": [
          {
            "viewer_id": "11111111-1111-1111-1111-111111111111",
            "username": "Hardik",
            "profile_pic": "sample_profile_pic",
            "viewed_at": "2026-05-18T00:00:00Z"
          }
        ]
      }
    ]
  }
]
```

### POST `/api/v1/statuses/`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/statuses/' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{"content": "Hello from the API dashboard", "media_url": "http://localhost:8000/media/images/sample.jpg", "thumbnail_url": "http://localhost:8000/media/images/sample.jpg", "background_color": "#1a1a2e"}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/statuses/`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": `application/json`,
  },
  body: JSON.stringify({"content": "Hello from the API dashboard", "media_url": "http://localhost:8000/media/images/sample.jpg", "thumbnail_url": "http://localhost:8000/media/images/sample.jpg", "background_color": "#1a1a2e"})
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/statuses/`, {"content": "Hello from the API dashboard", "media_url": "http://localhost:8000/media/images/sample.jpg", "thumbnail_url": "http://localhost:8000/media/images/sample.jpg", "background_color": "#1a1a2e"}, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Request body:

```json
{
  "content": "Hello from the API dashboard",
  "media_url": "http://localhost:8000/media/images/sample.jpg",
  "thumbnail_url": "http://localhost:8000/media/images/sample.jpg",
  "background_color": "#1a1a2e"
}
```

Response example:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "user_id": "11111111-1111-1111-1111-111111111111",
  "username": "Hardik",
  "profile_pic": "sample_profile_pic",
  "content": "Hello from the API dashboard",
  "media_url": "http://localhost:8000/media/images/sample.jpg",
  "thumbnail_url": "http://localhost:8000/media/images/sample.jpg",
  "background_color": "#1a1a2e",
  "expires_at": "2026-05-18T00:00:00Z",
  "created_at": "2026-05-18T00:00:00Z",
  "view_count": 1,
  "is_viewed": false,
  "viewers": [
    {
      "viewer_id": "11111111-1111-1111-1111-111111111111",
      "username": "Hardik",
      "profile_pic": "sample_profile_pic",
      "viewed_at": "2026-05-18T00:00:00Z"
    }
  ]
}
```

### GET `/api/v1/statuses/my`

Curl:

```bash
curl -X GET '${BASE_URL}/api/v1/statuses/my' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/statuses/my`, {
  method: 'GET',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.get(`${API_BASE_URL}/api/v1/statuses/my`, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Response example:

```json
[
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "user_id": "11111111-1111-1111-1111-111111111111",
    "username": "Hardik",
    "profile_pic": "sample_profile_pic",
    "content": "Hello from the API dashboard",
    "media_url": "http://localhost:8000/media/images/sample.jpg",
    "thumbnail_url": "http://localhost:8000/media/images/sample.jpg",
    "background_color": "#1a1a2e",
    "expires_at": "2026-05-18T00:00:00Z",
    "created_at": "2026-05-18T00:00:00Z",
    "view_count": 1,
    "is_viewed": false,
    "viewers": [
      {
        "viewer_id": "11111111-1111-1111-1111-111111111111",
        "username": "Hardik",
        "profile_pic": "sample_profile_pic",
        "viewed_at": "2026-05-18T00:00:00Z"
      }
    ]
  }
]
```

### DELETE `/api/v1/statuses/{status_id}`

Curl:

```bash
curl -X DELETE '${BASE_URL}/api/v1/statuses/11111111-1111-1111-1111-111111111111' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/statuses/${status_id}`, {
  method: 'DELETE',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.delete(`${API_BASE_URL}/api/v1/statuses/${status_id}`, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

### POST `/api/v1/statuses/{status_id}/view`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/statuses/11111111-1111-1111-1111-111111111111/view' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/statuses/${status_id}/view`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.post(`${API_BASE_URL}/api/v1/statuses/${status_id}/view`, null, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

## System

### GET `/`

Curl:

```bash
curl -X GET '${BASE_URL}/'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/`, {
  method: 'GET',
  credentials: 'include',
  headers: {

  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.get(`${API_BASE_URL}/`, { withCredentials: true });
```

## Users

### GET `/api/v1/users/me`

Curl:

```bash
curl -X GET '${BASE_URL}/api/v1/users/me' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
  method: 'GET',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.get(`${API_BASE_URL}/api/v1/users/me`, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Response example:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "phone": "9876543210",
  "username": "Hardik",
  "bio": "Available",
  "profile_pic": "sample_profile_pic",
  "is_online": false,
  "last_seen": "2026-05-18T00:00:00Z"
}
```

### PUT `/api/v1/users/me`

Curl:

```bash
curl -X PUT '${BASE_URL}/api/v1/users/me' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{"username": "Hardik", "bio": "Available", "profile_pic": "sample_profile_pic"}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
  method: 'PUT',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": `application/json`,
  },
  body: JSON.stringify({"username": "Hardik", "bio": "Available", "profile_pic": "sample_profile_pic"})
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.put(`${API_BASE_URL}/api/v1/users/me`, {"username": "Hardik", "bio": "Available", "profile_pic": "sample_profile_pic"}, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Request body:

```json
{
  "username": "Hardik",
  "bio": "Available",
  "profile_pic": "sample_profile_pic"
}
```

Response example:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "phone": "9876543210",
  "username": "Hardik",
  "bio": "Available",
  "profile_pic": "sample_profile_pic",
  "is_online": false,
  "last_seen": "2026-05-18T00:00:00Z"
}
```

### POST `/api/v1/users/me/photo`

Curl:

```bash
curl -X POST '${BASE_URL}/api/v1/users/me/photo' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}' \
  -F 'file=@./sample-file.bin'
```

Fetch:

```js
const form = new FormData();
form.append('file', file);
const res = await fetch(`${API_BASE_URL}/api/v1/users/me/photo`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  },
  body: form
});
const data = await res.json();
```

Axios:

```js
const form = new FormData();
form.append('file', file);
const { data } = await axios.post(`${API_BASE_URL}/api/v1/users/me/photo`, form, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Request body:

```json
{
  "file": "<select file>"
}
```

Response example:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "phone": "9876543210",
  "username": "Hardik",
  "bio": "Available",
  "profile_pic": "sample_profile_pic",
  "is_online": false,
  "last_seen": "2026-05-18T00:00:00Z"
}
```

### GET `/api/v1/users/search`

Curl:

```bash
curl -X GET '${BASE_URL}/api/v1/users/search?q=sample_q' \
  -H 'Authorization: Bearer ${ACCESS_TOKEN}'
```

Fetch:

```js
const res = await fetch(`${API_BASE_URL}/api/v1/users/search?q=sample_q`, {
  method: 'GET',
  credentials: 'include',
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  }
});
const data = await res.json();
```

Axios:

```js
const { data } = await axios.get(`${API_BASE_URL}/api/v1/users/search?q=sample_q`, { withCredentials: true, headers: { Authorization: `Bearer ${accessToken}` } });
```

Response example:

```json
[
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "phone": "9876543210",
    "username": "Hardik",
    "bio": "Available",
    "profile_pic": "sample_profile_pic",
    "is_online": false,
    "last_seen": "2026-05-18T00:00:00Z"
  }
]
```

## WebSocket Examples

### `/api/v1/ws`

Browser clients authenticate with the `access_token` cookie.

```js
const ws = new WebSocket('ws://localhost:8000/api/v1/ws');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
ws.onopen = () => ws.send(JSON.stringify({ type: 'ping' }));
```

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

