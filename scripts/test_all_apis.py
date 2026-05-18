#!/usr/bin/env python3
"""
Smoke-test and playground utility for the generated FastAPI API inventory.

Default mode runs safe GET/root/auth OTP endpoints and skips mutating protected
calls. Use --include-mutating only against a disposable database.
"""
from __future__ import annotations

import argparse
import asyncio
import datetime as dt
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any

import httpx

ENDPOINTS = json.loads('[\n  {\n    "method": "POST",\n    "path": "/api/v1/auth/logout",\n    "auth": false,\n    "content_type": null,\n    "body": null,\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/auth/refresh",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {},\n    "query": {},\n    "is_refresh": true\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/auth/send-otp",\n    "auth": false,\n    "content_type": "application/json",\n    "body": {\n      "phone": "+919876543210"\n    },\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/auth/verify-otp",\n    "auth": false,\n    "content_type": "application/json",\n    "body": {\n      "phone": "+919876543210",\n      "otp": "123456"\n    },\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "GET",\n    "path": "/api/v1/calls/history",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/calls/initiate",\n    "auth": true,\n    "content_type": "application/json",\n    "body": {\n      "receiver_id": "11111111-1111-1111-1111-111111111111",\n      "call_type": "audio"\n    },\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/calls/{call_id}/accept",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {\n      "call_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/calls/{call_id}/end",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {\n      "call_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/calls/{call_id}/reject",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {\n      "call_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "GET",\n    "path": "/api/v1/chats/",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/chats/",\n    "auth": true,\n    "content_type": "application/json",\n    "body": {\n      "contact_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/chats/group",\n    "auth": true,\n    "content_type": "application/json",\n    "body": {\n      "group_name": "Project User",\n      "group_description": "Project test group",\n      "group_picture": "sample_group_picture",\n      "participant_ids": [\n        "11111111-1111-1111-1111-111111111111"\n      ]\n    },\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "GET",\n    "path": "/api/v1/chats/{chat_id}",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {\n      "chat_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "PUT",\n    "path": "/api/v1/chats/{chat_id}/info",\n    "auth": true,\n    "content_type": "application/json",\n    "body": {\n      "group_name": "Project User",\n      "group_description": "Project test group",\n      "group_picture": "sample_group_picture"\n    },\n    "path_params": {\n      "chat_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/chats/{chat_id}/participants",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {\n      "chat_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "query": {\n      "user_to_add": "11111111-1111-1111-1111-111111111111"\n    },\n    "is_refresh": false\n  },\n  {\n    "method": "DELETE",\n    "path": "/api/v1/chats/{chat_id}/participants/{user_id}",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {\n      "chat_id": "11111111-1111-1111-1111-111111111111",\n      "user_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/chats/{chat_id}/participants/{user_id}/promote",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {\n      "chat_id": "11111111-1111-1111-1111-111111111111",\n      "user_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "GET",\n    "path": "/api/v1/contacts/",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/contacts/sync",\n    "auth": true,\n    "content_type": "application/json",\n    "body": {\n      "contacts": [\n        {\n          "phone": "9876543210",\n          "name": "Project User"\n        }\n      ]\n    },\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/contacts/sync-single",\n    "auth": true,\n    "content_type": "application/json",\n    "body": {\n      "phone": "9876543210",\n      "name": "Project User"\n    },\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/groups/create",\n    "auth": true,\n    "content_type": "application/json",\n    "body": {\n      "group_name": "Project User",\n      "group_description": "Project test group",\n      "group_pic_id": "11111111-1111-1111-1111-111111111111",\n      "participant_ids": [\n        "11111111-1111-1111-1111-111111111111"\n      ]\n    },\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/groups/{group_id}/add-members",\n    "auth": true,\n    "content_type": "application/json",\n    "body": {\n      "member_ids": [\n        "11111111-1111-1111-1111-111111111111"\n      ]\n    },\n    "path_params": {\n      "group_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "GET",\n    "path": "/api/v1/groups/{group_id}/members",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {\n      "group_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "DELETE",\n    "path": "/api/v1/groups/{group_id}/remove-member/{member_id}",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {\n      "group_id": "11111111-1111-1111-1111-111111111111",\n      "member_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/media/upload",\n    "auth": true,\n    "content_type": "multipart/form-data",\n    "body": {\n      "file": "<select file>"\n    },\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/media/voice",\n    "auth": true,\n    "content_type": "multipart/form-data",\n    "body": {\n      "file": "<select file>"\n    },\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "DELETE",\n    "path": "/api/v1/media/{folder}/{filename}",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {\n      "folder": "images",\n      "filename": "Project User"\n    },\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/messages/",\n    "auth": true,\n    "content_type": "application/json",\n    "body": {\n      "chat_id": "11111111-1111-1111-1111-111111111111",\n      "content": "Hello from the API dashboard",\n      "message_type": "text",\n      "media_url": "http://localhost:8000/media/images/sample.jpg",\n      "thumbnail_url": "http://localhost:8000/media/images/sample.jpg",\n      "file_size": 1024,\n      "duration": 30,\n      "media_id": "11111111-1111-1111-1111-111111111111",\n      "caption": "sample_caption",\n      "reply_to_message_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "GET",\n    "path": "/api/v1/messages/starred/list",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "GET",\n    "path": "/api/v1/messages/{chat_id}",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {\n      "chat_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "PATCH",\n    "path": "/api/v1/messages/{message_id}",\n    "auth": true,\n    "content_type": "application/json",\n    "body": {\n      "content": "Hello from the API dashboard"\n    },\n    "path_params": {\n      "message_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "DELETE",\n    "path": "/api/v1/messages/{message_id}",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {\n      "message_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/messages/{message_id}/star",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {\n      "message_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/reactions/",\n    "auth": true,\n    "content_type": "application/json",\n    "body": {\n      "message_id": "11111111-1111-1111-1111-111111111111",\n      "reaction": "👍"\n    },\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "GET",\n    "path": "/api/v1/reactions/{message_id}",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {\n      "message_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "DELETE",\n    "path": "/api/v1/reactions/{message_id}",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {\n      "message_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "GET",\n    "path": "/api/v1/statuses/",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/statuses/",\n    "auth": true,\n    "content_type": "application/json",\n    "body": {\n      "content": "Hello from the API dashboard",\n      "media_url": "http://localhost:8000/media/images/sample.jpg",\n      "thumbnail_url": "http://localhost:8000/media/images/sample.jpg",\n      "background_color": "#1a1a2e"\n    },\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "GET",\n    "path": "/api/v1/statuses/my",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "DELETE",\n    "path": "/api/v1/statuses/{status_id}",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {\n      "status_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/statuses/{status_id}/view",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {\n      "status_id": "11111111-1111-1111-1111-111111111111"\n    },\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "GET",\n    "path": "/",\n    "auth": false,\n    "content_type": null,\n    "body": null,\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "GET",\n    "path": "/api/v1/users/me",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "PUT",\n    "path": "/api/v1/users/me",\n    "auth": true,\n    "content_type": "application/json",\n    "body": {\n      "username": "Hardik",\n      "bio": "Available",\n      "profile_pic": "sample_profile_pic"\n    },\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "POST",\n    "path": "/api/v1/users/me/photo",\n    "auth": true,\n    "content_type": "multipart/form-data",\n    "body": {\n      "file": "<select file>"\n    },\n    "path_params": {},\n    "query": {},\n    "is_refresh": false\n  },\n  {\n    "method": "GET",\n    "path": "/api/v1/users/search",\n    "auth": true,\n    "content_type": null,\n    "body": null,\n    "path_params": {},\n    "query": {\n      "q": "sample_q"\n    },\n    "is_refresh": false\n  }\n]')
WEBSOCKETS = json.loads('[\n  {\n    "path": "/api/v1/ws",\n    "module": "Websockets",\n    "authRequired": true,\n    "authNotes": "Requires the access_token cookie. The current implementation does not read Bearer headers or ?token= query params for WebSocket auth.",\n    "clientEvents": [\n      "call_end",\n      "call_rejected",\n      "mark_read",\n      "ping",\n      "typing",\n      "webrtc_answer",\n      "webrtc_ice_candidate",\n      "webrtc_offer"\n    ],\n    "serverEvents": [\n      "call_end",\n      "call_ended",\n      "call_rejected",\n      "messages_read",\n      "pong",\n      "typing",\n      "user_offline",\n      "webrtc_answer",\n      "webrtc_ice_candidate",\n      "webrtc_offer"\n    ],\n    "sampleMessages": [\n      {\n        "type": "ping"\n      },\n      {\n        "type": "typing",\n        "chat_id": "11111111-1111-1111-1111-111111111111",\n        "is_typing": true\n      },\n      {\n        "type": "mark_read",\n        "chat_id": "11111111-1111-1111-1111-111111111111",\n        "receiver_id": "22222222-2222-2222-2222-222222222222"\n      },\n      {\n        "type": "webrtc_offer",\n        "target_id": "22222222-2222-2222-2222-222222222222",\n        "call_id": "33333333-3333-3333-3333-333333333333",\n        "sdp": {\n          "type": "offer",\n          "sdp": "..."\n        }\n      }\n    ]\n  }\n]')


def load_dotenv(path: Path) -> dict[str, str]:
    values = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def make_dummy_jwt(user_id: str, secret: str, algorithm: str = "HS256") -> str | None:
    try:
        from jose import jwt
    except Exception:
        return None
    now = dt.datetime.utcnow()
    return jwt.encode(
        {
            "sub": user_id,
            "type": "access",
            "csrf": "dummy-csrf",
            "jti": "dummy-jti",
            "exp": now + dt.timedelta(minutes=30),
        },
        secret,
        algorithm=algorithm,
    )


def fill_path(path: str, params: dict[str, Any]) -> str:
    def repl(match: re.Match[str]) -> str:
        name = match.group(1)
        return str(params.get(name, "11111111-1111-1111-1111-111111111111"))
    return re.sub(r"\{([^}]+)\}", repl, path)


def is_mutating(method: str, path: str) -> bool:
    if path in ("/", "/api/v1/auth/send-otp", "/api/v1/auth/verify-otp", "/api/v1/auth/refresh"):
        return False
    return method.upper() not in {"GET", "HEAD", "OPTIONS"}


def should_skip(endpoint: dict[str, Any], include_mutating: bool, include_protected: bool) -> str | None:
    if endpoint["auth"] and not include_protected:
        return "protected endpoint skipped; pass --access-token/--otp/--dummy-user-id"
    if is_mutating(endpoint["method"], endpoint["path"]) and not include_mutating:
        return "mutating endpoint skipped; pass --include-mutating"
    if endpoint["content_type"] == "multipart/form-data" and not include_mutating:
        return "upload endpoint skipped; pass --include-mutating"
    return None


async def authenticate(client: httpx.AsyncClient, args: argparse.Namespace) -> tuple[str | None, str | None]:
    token = args.access_token or os.getenv("ACCESS_TOKEN")
    csrf_refresh = os.getenv("CSRF_REFRESH_TOKEN")
    if token:
        return token, csrf_refresh

    env = load_dotenv(Path("backend/.env"))
    if args.dummy_user_id:
        secret = env.get("SECRET_KEY") or os.getenv("SECRET_KEY")
        algorithm = env.get("ALGORITHM") or os.getenv("ALGORITHM") or "HS256"
        if not secret:
            print("Cannot create dummy JWT: SECRET_KEY missing", file=sys.stderr)
            return None, None
        return make_dummy_jwt(args.dummy_user_id, secret, algorithm), "dummy-csrf"

    phone = args.phone or os.getenv("API_TEST_PHONE")
    otp = args.otp or os.getenv("API_TEST_OTP")
    if phone and otp:
        await client.post("/api/v1/auth/send-otp", json={"phone": phone})
        response = await client.post("/api/v1/auth/verify-otp", json={"phone": phone, "otp": otp})
        response.raise_for_status()
        payload = response.json()
        return payload.get("access_token"), payload.get("csrf_refresh_token")
    return None, None


async def run_http(args: argparse.Namespace) -> int:
    async with httpx.AsyncClient(base_url=args.base_url, timeout=args.timeout, follow_redirects=True) as client:
        token, csrf_refresh = await authenticate(client, args)
        include_protected = bool(token)
        results = []
        for endpoint in ENDPOINTS:
            skip_reason = should_skip(endpoint, args.include_mutating, include_protected)
            if skip_reason:
                results.append((endpoint, "SKIP", skip_reason, 0, ""))
                continue

            path = fill_path(endpoint["path"], endpoint["path_params"])
            headers = {}
            if endpoint["auth"] and not endpoint["is_refresh"] and token:
                headers["Authorization"] = f"Bearer {token}"
            if endpoint["is_refresh"] and csrf_refresh:
                headers["X-CSRF-Token"] = csrf_refresh
            params = endpoint["query"] or None
            files = None
            data = None
            json_body = None
            if endpoint["content_type"] == "application/json":
                json_body = endpoint["body"]
            elif endpoint["content_type"] == "multipart/form-data":
                files = {"file": ("sample.txt", b"sample file", "text/plain")}

            started = time.perf_counter()
            try:
                response = await client.request(
                    endpoint["method"],
                    path,
                    params=params,
                    headers=headers,
                    json=json_body,
                    files=files,
                    data=data,
                )
                elapsed = int((time.perf_counter() - started) * 1000)
                preview = response.text[:240].replace("\n", " ")
                status = "PASS" if response.status_code < 500 else "FAIL"
                results.append((endpoint, status, response.status_code, elapsed, preview))
            except Exception as exc:
                elapsed = int((time.perf_counter() - started) * 1000)
                results.append((endpoint, "ERROR", str(exc), elapsed, ""))

        failures = 0
        for endpoint, status, detail, elapsed, preview in results:
            label = f"{endpoint['method']} {endpoint['path']}"
            print(f"{status:5} {label:52} {detail} {elapsed}ms")
            if preview and args.verbose:
                print(f"      {preview}")
            if status in {"FAIL", "ERROR"}:
                failures += 1
        return 1 if failures else 0


async def run_websocket(args: argparse.Namespace) -> int:
    if not WEBSOCKETS:
        print("No WebSocket routes found")
        return 0
    try:
        import websockets
    except Exception:
        print("Install websockets to test WebSocket routes", file=sys.stderr)
        return 1

    async with httpx.AsyncClient(base_url=args.base_url, timeout=args.timeout) as client:
        token, _ = await authenticate(client, args)
    if not token:
        print("WebSocket test needs auth cookie/token. Pass --otp or --access-token.", file=sys.stderr)
        return 1
    host = args.base_url.replace("https://", "").replace("http://", "").rstrip("/")
    scheme = "wss" if args.base_url.startswith("https") else "ws"
    url = f"{scheme}://{host}{WEBSOCKETS[0]['path']}"
    headers = {"Cookie": f"access_token={token}"}
    async with websockets.connect(url, extra_headers=headers) as ws:
        await ws.send(json.dumps({"type": "ping"}))
        message = await asyncio.wait_for(ws.recv(), timeout=args.timeout)
        print(message)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=os.getenv("API_BASE_URL", "http://localhost:8000"))
    parser.add_argument("--access-token", default=None)
    parser.add_argument("--phone", default=None)
    parser.add_argument("--otp", default=None)
    parser.add_argument("--dummy-user-id", default=None, help="Create a signed dummy access JWT for an existing user id using backend/.env SECRET_KEY.")
    parser.add_argument("--include-mutating", action="store_true", help="Run POST/PUT/PATCH/DELETE/upload endpoints. Use only on disposable data.")
    parser.add_argument("--websocket", action="store_true", help="Run the WebSocket ping test instead of HTTP smoke tests.")
    parser.add_argument("--timeout", type=float, default=10.0)
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()
    if args.websocket:
        return asyncio.run(run_websocket(args))
    return asyncio.run(run_http(args))


if __name__ == "__main__":
    raise SystemExit(main())
