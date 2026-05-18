#!/usr/bin/env python3
from __future__ import annotations

import ast
import datetime as dt
import html
import inspect
import json
import os
import re
import shutil
import sys
import textwrap
import uuid
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"

sys.path.insert(0, str(BACKEND_DIR))

from fastapi.routing import APIRoute, APIWebSocketRoute  # noqa: E402
from app.main import app  # noqa: E402


BASE_URL = "http://localhost:8000"
API_PREFIX = "/api/v1"
GENERATED_AT = dt.datetime.now(dt.timezone.utc).isoformat()


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2, ensure_ascii=False) + "\n")


def slugify(value: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return value or "item"


def method_sort(method: str) -> int:
    order = {"GET": 0, "POST": 1, "PUT": 2, "PATCH": 3, "DELETE": 4}
    return order.get(method.upper(), 99)


def resolve_ref(schema: dict[str, Any], components: dict[str, Any]) -> dict[str, Any]:
    ref = schema.get("$ref")
    if not ref:
        return schema
    name = ref.rsplit("/", 1)[-1]
    return components.get("schemas", {}).get(name, schema)


def schema_name(schema: dict[str, Any]) -> str | None:
    ref = schema.get("$ref")
    if ref:
        return ref.rsplit("/", 1)[-1]
    if schema.get("title"):
        return str(schema["title"])
    return None


def sample_string(name: str, schema: dict[str, Any]) -> str:
    lname = name.lower()
    fmt = schema.get("format")
    if "phone" in lname:
        return "9876543210"
    if "otp" in lname:
        return "123456"
    if "email" in lname:
        return "user@example.com"
    if "uuid" in lname or fmt == "uuid" or lname.endswith("_id") or lname == "id":
        return "11111111-1111-1111-1111-111111111111"
    if fmt == "date-time":
        return "2026-05-18T00:00:00Z"
    if fmt == "date":
        return "2026-05-18"
    if "url" in lname or fmt == "uri":
        return f"{BASE_URL}/media/images/sample.jpg"
    if "message_type" in lname:
        return "text"
    if "call_type" in lname:
        return "audio"
    if "reaction" in lname:
        return "👍"
    if "username" in lname:
        return "Hardik"
    if "name" in lname:
        return "Project User"
    if "bio" in lname:
        return "Available"
    if "content" in lname:
        return "Hello from the API dashboard"
    if "description" in lname:
        return "Project test group"
    if "color" in lname:
        return "#1a1a2e"
    if "folder" in lname:
        return "images"
    if "filename" in lname:
        return "sample.jpg"
    if "token" in lname:
        return "<token>"
    return f"sample_{name or 'value'}"


def sample_from_schema(
    schema: dict[str, Any] | None,
    components: dict[str, Any],
    name: str = "value",
    seen: set[str] | None = None,
) -> Any:
    if not schema:
        return None
    seen = seen or set()
    schema = resolve_ref(schema, components)
    sname = schema_name(schema)
    if sname:
        if sname in seen:
            return {}
        seen.add(sname)
    if "example" in schema:
        return schema["example"]
    if "examples" in schema and isinstance(schema["examples"], list) and schema["examples"]:
        return schema["examples"][0]
    if "enum" in schema and schema["enum"]:
        return schema["enum"][0]
    for key in ("allOf", "oneOf", "anyOf"):
        variants = schema.get(key)
        if variants:
            non_null = [
                variant
                for variant in variants
                if variant.get("type") != "null" and not variant.get("nullable")
            ]
            return sample_from_schema(non_null[0] if non_null else variants[0], components, name, seen)

    stype = schema.get("type")
    if not stype and schema.get("properties"):
        stype = "object"
    if isinstance(stype, list):
        stype = next((item for item in stype if item != "null"), stype[0])

    if stype == "object":
        result: dict[str, Any] = {}
        props = schema.get("properties", {})
        for prop_name, prop_schema in props.items():
            result[prop_name] = sample_from_schema(prop_schema, components, prop_name, set(seen))
        if not result and schema.get("additionalProperties"):
            result["key"] = "value"
        return result
    if stype == "array":
        return [sample_from_schema(schema.get("items", {"type": "string"}), components, name, set(seen))]
    if stype == "integer":
        lname = name.lower()
        if "limit" in lname:
            return 30
        if "page" in lname:
            return 1
        if "size" in lname:
            return 1024
        if "duration" in lname:
            return 30
        return 1
    if stype == "number":
        return 1.0
    if stype == "boolean":
        return False
    if stype == "string" or not stype:
        return sample_string(name, schema)
    return None


def schema_to_label(schema: dict[str, Any] | None) -> str:
    if not schema:
        return "-"
    if "$ref" in schema:
        return schema["$ref"].rsplit("/", 1)[-1]
    if "allOf" in schema:
        return " | ".join(schema_to_label(part) for part in schema["allOf"])
    if "anyOf" in schema:
        return " | ".join(schema_to_label(part) for part in schema["anyOf"])
    if "oneOf" in schema:
        return " | ".join(schema_to_label(part) for part in schema["oneOf"])
    stype = schema.get("type")
    if stype == "array":
        return f"array<{schema_to_label(schema.get('items'))}>"
    if schema.get("format"):
        return f"{stype or 'string'}:{schema['format']}"
    return str(stype or schema.get("title") or "object")


def uses_dependency(dependant: Any, target_name: str) -> bool:
    call = getattr(dependant, "call", None)
    if getattr(call, "__name__", None) == target_name:
        return True
    for dependency in getattr(dependant, "dependencies", []) or []:
        if uses_dependency(dependency, target_name):
            return True
    return False


def static_source_for_function(function_name: str) -> dict[str, Any]:
    routes_dir = BACKEND_DIR / "app" / "api" / "routes"
    if not routes_dir.exists():
        return {"file": None, "line": None}
    pattern = re.compile(rf"^\s*(?:async\s+def|def)\s+{re.escape(function_name)}\s*\(")
    for path in sorted(routes_dir.glob("*.py")):
        lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
        for index, line in enumerate(lines, start=1):
            if pattern.search(line):
                return {
                    "file": str(path.resolve().relative_to(ROOT)),
                    "line": index,
                }
    return {"file": None, "line": None}


def source_for_endpoint(route: APIRoute) -> dict[str, Any]:
    try:
        file_path = inspect.getsourcefile(route.endpoint)
        lines, start = inspect.getsourcelines(route.endpoint)
    except Exception:
        return static_source_for_function(route.name)
    if not file_path:
        return static_source_for_function(route.name)
    resolved = Path(file_path).resolve()
    fallback = static_source_for_function(route.name)
    if ".venv" in resolved.parts and fallback["file"]:
        return fallback
    return {
        "file": str(resolved.relative_to(ROOT)),
        "line": start,
    }


def read_frontend_text() -> str:
    if not FRONTEND_DIR.exists():
        return ""
    parts: list[str] = []
    for path in FRONTEND_DIR.rglob("*"):
        if path.is_file() and path.suffix in {".js", ".jsx", ".ts", ".tsx", ".html"}:
            try:
                parts.append(path.read_text(encoding="utf-8", errors="ignore"))
            except OSError:
                pass
    return "\n".join(parts)


def source_regex_for_path(path: str) -> str:
    parts = re.split(r"(\{[^}]+\})", path)
    output = []
    for part in parts:
        if not part:
            continue
        if part.startswith("{") and part.endswith("}"):
            output.append(r"(?:\$\{[^}]+\}|[^/`'\"]+)")
        else:
            output.append(re.escape(part))
    return "".join(output) + r"(?:[?`'\"),\s]|$)"


def frontend_uses_path(path: str, frontend_text: str) -> bool:
    if not frontend_text or not path.startswith(API_PREFIX):
        return False
    rel = path.removeprefix(API_PREFIX)
    candidates = {rel, rel.rstrip("/"), path, path.rstrip("/")}
    if rel.endswith("/"):
        candidates.add(rel[:-1])
    if path.endswith("/"):
        candidates.add(path[:-1])
    for candidate in candidates:
        if candidate and "{" not in candidate and candidate in frontend_text:
            return True
    return bool(
        re.search(source_regex_for_path(rel), frontend_text)
        or re.search(source_regex_for_path(path), frontend_text)
    )


def request_details(operation: dict[str, Any], components: dict[str, Any]) -> dict[str, Any]:
    body = operation.get("requestBody") or {}
    content = body.get("content") or {}
    if not content:
        return {
            "contentType": None,
            "required": False,
            "schema": None,
            "schemaName": None,
            "sample": None,
            "isMultipart": False,
        }
    preferred = (
        "application/json"
        if "application/json" in content
        else "multipart/form-data"
        if "multipart/form-data" in content
        else next(iter(content.keys()))
    )
    schema = content.get(preferred, {}).get("schema", {})
    sample = sample_from_schema(schema, components, "body")
    if preferred == "multipart/form-data" and isinstance(sample, dict):
        for key, value in list(sample.items()):
            prop = resolve_ref(schema, components).get("properties", {}).get(key, {})
            if prop.get("format") == "binary":
                sample[key] = "<select file>"
            elif value is None:
                sample[key] = sample_string(key, prop)
    return {
        "contentType": preferred,
        "required": bool(body.get("required")),
        "schema": schema,
        "schemaName": schema_name(schema),
        "sample": sample,
        "isMultipart": preferred == "multipart/form-data",
    }


def response_details(operation: dict[str, Any], components: dict[str, Any]) -> dict[str, Any]:
    responses = operation.get("responses") or {}
    preferred_code = next((code for code in ("200", "201", "202", "204") if code in responses), None)
    preferred_code = preferred_code or next(iter(responses.keys()), "200")
    content = responses.get(preferred_code, {}).get("content") or {}
    preferred = (
        "application/json"
        if "application/json" in content
        else next(iter(content.keys()), None)
    )
    schema = content.get(preferred, {}).get("schema") if preferred else None
    return {
        "status": preferred_code,
        "contentType": preferred,
        "schema": schema,
        "schemaName": schema_name(schema or {}),
        "sample": sample_from_schema(schema, components, "response") if schema else None,
    }


def param_details(operation: dict[str, Any], components: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    path_params: list[dict[str, Any]] = []
    query_params: list[dict[str, Any]] = []
    header_params: list[dict[str, Any]] = []
    for param in operation.get("parameters", []) or []:
        schema = param.get("schema", {})
        item = {
            "name": param.get("name"),
            "in": param.get("in"),
            "required": bool(param.get("required")),
            "description": param.get("description"),
            "schema": schema,
            "type": schema_to_label(schema),
            "sample": sample_from_schema(schema, components, param.get("name", "param")),
        }
        if item["in"] == "path":
            path_params.append(item)
        elif item["in"] == "query":
            query_params.append(item)
        elif item["in"] == "header":
            header_params.append(item)
    return path_params, query_params, header_params


def build_route_lookup() -> dict[tuple[str, str], APIRoute]:
    lookup: dict[tuple[str, str], APIRoute] = {}
    for route in app.routes:
        if isinstance(route, APIRoute):
            for method in route.methods or []:
                lookup[(method.upper(), route.path)] = route
    return lookup


def substitute_path(path: str, params: list[dict[str, Any]], style: str = "sample") -> str:
    result = path
    for param in params:
        name = param["name"]
        if style == "collection":
            value = f"{{{{{name}}}}}"
        elif style == "js":
            value = f"${{{name}}}"
        else:
            value = str(param.get("sample") or sample_string(name, param.get("schema", {})))
        result = result.replace("{" + name + "}", value)
    return result


def build_url(path: str, path_params: list[dict[str, Any]], query_params: list[dict[str, Any]], style: str = "sample") -> str:
    url = substitute_path(path, path_params, style)
    required_query = [param for param in query_params if param.get("required")]
    if required_query:
        query = "&".join(
            f"{param['name']}={{{{{param['name']}}}}}" if style == "collection" else f"{param['name']}={param.get('sample')}"
            for param in required_query
        )
        url = f"{url}?{query}"
    return url


def endpoint_id(method: str, path: str) -> str:
    return slugify(f"{method}-{path}")


def json_block(payload: Any) -> str:
    if payload is None:
        return ""
    return json.dumps(payload, indent=2, ensure_ascii=False)


def curl_example(endpoint: dict[str, Any]) -> str:
    method = endpoint["method"]
    url = "${BASE_URL}" + build_url(endpoint["path"], endpoint["pathParams"], endpoint["queryParams"])
    lines = [f"curl -X {method} '{url}'"]
    if endpoint["path"].endswith("/auth/refresh"):
        lines.append("  -H 'X-CSRF-Token: ${CSRF_REFRESH_TOKEN}'")
    elif endpoint["authRequired"]:
        lines.append("  -H 'Authorization: Bearer ${ACCESS_TOKEN}'")
    if endpoint["request"]["contentType"] == "application/json":
        lines.append("  -H 'Content-Type: application/json'")
        sample = json.dumps(endpoint["request"]["sample"], ensure_ascii=False)
        lines.append(f"  -d '{sample}'")
    elif endpoint["request"]["contentType"] == "multipart/form-data":
        sample = endpoint["request"]["sample"] or {"file": "<select file>"}
        for key, value in sample.items():
            if value == "<select file>":
                lines.append(f"  -F '{key}=@./sample-file.bin'")
            else:
                lines.append(f"  -F '{key}={value}'")
    return " \\\n".join(lines)


def fetch_example(endpoint: dict[str, Any]) -> str:
    method = endpoint["method"]
    path = build_url(endpoint["path"], endpoint["pathParams"], endpoint["queryParams"], "js")
    headers: dict[str, str] = {}
    if endpoint["path"].endswith("/auth/refresh"):
        headers["X-CSRF-Token"] = "${csrfRefreshToken}"
    elif endpoint["authRequired"]:
        headers["Authorization"] = "Bearer ${accessToken}"
    if endpoint["request"]["contentType"] == "application/json":
        headers["Content-Type"] = "application/json"
    body_line = ""
    prelude = ""
    if endpoint["request"]["contentType"] == "application/json":
        body_line = f",\n  body: JSON.stringify({json.dumps(endpoint['request']['sample'], ensure_ascii=False)})"
    elif endpoint["request"]["contentType"] == "multipart/form-data":
        prelude = "const form = new FormData();\nform.append('file', file);\n"
        body_line = ",\n  body: form"
    header_lines = "{\n" + "\n".join(f"    {json.dumps(k)}: `{v}`," for k, v in headers.items()) + "\n  }"
    return (
        f"{prelude}const res = await fetch(`${{API_BASE_URL}}{path}`, {{\n"
        f"  method: '{method}',\n"
        f"  credentials: 'include',\n"
        f"  headers: {header_lines}{body_line}\n"
        f"}});\n"
        f"const data = await res.json();"
    )


def axios_example(endpoint: dict[str, Any]) -> str:
    method = endpoint["method"].lower()
    path = build_url(endpoint["path"], endpoint["pathParams"], endpoint["queryParams"], "js")
    config_parts = ["withCredentials: true"]
    if endpoint["path"].endswith("/auth/refresh"):
        config_parts.append("headers: { 'X-CSRF-Token': csrfRefreshToken }")
    elif endpoint["authRequired"]:
        config_parts.append("headers: { Authorization: `Bearer ${accessToken}` }")
    config = "{ " + ", ".join(config_parts) + " }"
    if endpoint["request"]["contentType"] == "application/json":
        return (
            f"const {{ data }} = await axios.{method}(`${{API_BASE_URL}}{path}`, "
            f"{json.dumps(endpoint['request']['sample'], ensure_ascii=False)}, {config});"
        )
    if endpoint["request"]["contentType"] == "multipart/form-data":
        return (
            "const form = new FormData();\n"
            "form.append('file', file);\n"
            f"const {{ data }} = await axios.{method}(`${{API_BASE_URL}}{path}`, form, {config});"
        )
    if method in {"get", "delete"}:
        return f"const {{ data }} = await axios.{method}(`${{API_BASE_URL}}{path}`, {config});"
    return f"const {{ data }} = await axios.{method}(`${{API_BASE_URL}}{path}`, null, {config});"


def discover_websockets() -> list[dict[str, Any]]:
    routes: list[dict[str, Any]] = []
    source_path = BACKEND_DIR / "app" / "api" / "routes" / "websocket.py"
    source = source_path.read_text(encoding="utf-8", errors="ignore") if source_path.exists() else ""
    client_events = sorted(set(re.findall(r'event_type\s*==\s*"([^"]+)"', source)))
    server_events = sorted(set(re.findall(r'"type":\s*"([^"]+)"', source)))
    for route in app.routes:
        if isinstance(route, APIWebSocketRoute):
            routes.append(
                {
                    "path": route.path,
                    "module": "Websockets",
                    "authRequired": True,
                    "authNotes": "Requires the access_token cookie. The current implementation does not read Bearer headers or ?token= query params for WebSocket auth.",
                    "clientEvents": client_events,
                    "serverEvents": server_events,
                    "sampleMessages": [
                        {"type": "ping"},
                        {
                            "type": "typing",
                            "chat_id": "11111111-1111-1111-1111-111111111111",
                            "is_typing": True,
                        },
                        {
                            "type": "mark_read",
                            "chat_id": "11111111-1111-1111-1111-111111111111",
                            "receiver_id": "22222222-2222-2222-2222-222222222222",
                        },
                        {
                            "type": "webrtc_offer",
                            "target_id": "22222222-2222-2222-2222-222222222222",
                            "call_id": "33333333-3333-3333-3333-333333333333",
                            "sdp": {"type": "offer", "sdp": "..."},
                        },
                    ],
                }
            )
    return routes


def collect_endpoints() -> tuple[list[dict[str, Any]], dict[str, Any], list[dict[str, Any]]]:
    spec = app.openapi()
    components = spec.get("components", {})
    route_lookup = build_route_lookup()
    frontend_text = read_frontend_text()
    endpoints: list[dict[str, Any]] = []

    for path, path_item in spec.get("paths", {}).items():
        for method, operation in path_item.items():
            if method.lower() not in {"get", "post", "put", "patch", "delete", "options", "head"}:
                continue
            method_upper = method.upper()
            route = route_lookup.get((method_upper, path))
            path_params, query_params, header_params = param_details(operation, components)
            request = request_details(operation, components)
            response = response_details(operation, components)
            tags = operation.get("tags") or ["System"]
            tag = tags[0]
            auth_required = bool(route and uses_dependency(route.dependant, "get_current_user"))
            if path.endswith("/auth/refresh"):
                auth_required = True
            headers = []
            if auth_required and not path.endswith("/auth/refresh"):
                headers.append(
                    {
                        "name": "Authorization",
                        "required": True,
                        "value": "Bearer {{access_token}}",
                        "notes": "Bearer token is enough for normal protected HTTP endpoints.",
                    }
                )
            if path.endswith("/auth/refresh"):
                headers.append(
                    {
                        "name": "X-CSRF-Token",
                        "required": True,
                        "value": "{{csrf_refresh_token}}",
                        "notes": "Refresh requires the refresh_token HttpOnly cookie plus refresh CSRF token.",
                    }
                )
            endpoint = {
                "id": endpoint_id(method_upper, path),
                "module": tag,
                "method": method_upper,
                "path": path,
                "summary": operation.get("summary") or (route.name.replace("_", " ").title() if route else path),
                "description": (operation.get("description") or "").strip(),
                "operationId": operation.get("operationId"),
                "authRequired": auth_required,
                "headers": headers,
                "pathParams": path_params,
                "queryParams": query_params,
                "headerParams": header_params,
                "request": request,
                "response": response,
                "source": source_for_endpoint(route) if route else {"file": None, "line": None},
                "curl": "",
                "fetch": "",
                "axios": "",
                "frontendUsed": frontend_uses_path(path, frontend_text),
            }
            endpoint["curl"] = curl_example(endpoint)
            endpoint["fetch"] = fetch_example(endpoint)
            endpoint["axios"] = axios_example(endpoint)
            endpoints.append(endpoint)

    endpoints.sort(key=lambda e: (e["module"], e["path"], method_sort(e["method"])))
    return endpoints, spec, discover_websockets()


def path_conflict(a: str, b: str) -> bool:
    a_parts = [p for p in a.strip("/").split("/") if p]
    b_parts = [p for p in b.strip("/").split("/") if p]
    if len(a_parts) != len(b_parts):
        return False
    has_dynamic = False
    for left, right in zip(a_parts, b_parts):
        left_dyn = left.startswith("{") and left.endswith("}")
        right_dyn = right.startswith("{") and right.endswith("}")
        if left == right:
            continue
        if left_dyn or right_dyn:
            has_dynamic = True
            continue
        return False
    return has_dynamic


def analyze_routes(endpoints: list[dict[str, Any]]) -> list[dict[str, Any]]:
    diagnostics: list[dict[str, Any]] = []
    key_counts = Counter((ep["method"], ep["path"]) for ep in endpoints)
    for (method, path), count in key_counts.items():
        if count > 1:
            diagnostics.append(
                {
                    "severity": "high",
                    "category": "Duplicate endpoint",
                    "location": f"{method} {path}",
                    "message": f"{count} handlers expose the same method and path.",
                    "suggestion": "Keep a single handler or split the route path/method.",
                }
            )

    by_method = defaultdict(list)
    route_order = []
    for route in app.routes:
        if isinstance(route, APIRoute):
            for method in route.methods or []:
                if method in {"GET", "POST", "PUT", "PATCH", "DELETE"}:
                    route_order.append((method, route.path))
    for index, item in enumerate(route_order):
        by_method[item[0]].append((index, item[1]))
    for method, routes in by_method.items():
        for i, (left_index, left_path) in enumerate(routes):
            for right_index, right_path in routes[i + 1 :]:
                if path_conflict(left_path, right_path):
                    left_has_dynamic = "{" in left_path
                    if left_has_dynamic and left_index < right_index:
                        diagnostics.append(
                            {
                                "severity": "medium",
                                "category": "Route shadowing risk",
                                "location": f"{method} {left_path} before {right_path}",
                                "message": "A dynamic route is registered before a path with the same shape.",
                                "suggestion": "Register literal routes before dynamic routes if both can match the same segment count.",
                            }
                        )

    for route in app.routes:
        if not isinstance(route, APIRoute):
            continue
        methods = ", ".join(sorted((route.methods or []) - {"HEAD", "OPTIONS"}))
        location = f"{methods} {route.path}"
        if route.path.startswith(API_PREFIX) and route.response_model is None:
            diagnostics.append(
                {
                    "severity": "low",
                    "category": "Missing response model",
                    "location": location,
                    "message": "The route returns a dict or empty response without an explicit response_model.",
                    "suggestion": "Add a small Pydantic response schema so docs and clients get a stable contract.",
                }
            )

    users_route = BACKEND_DIR / "app" / "api" / "routes" / "users.py"
    if users_route.exists():
        text = users_route.read_text(encoding="utf-8", errors="ignore")
        if "os." in text and not re.search(r"^\s*import\s+os\b|^\s*from\s+os\s+import\b", text, re.M):
            diagnostics.append(
                {
                    "severity": "high",
                    "category": "Broken route",
                    "location": "backend/app/api/routes/users.py: upload_profile_picture",
                    "message": "The function calls os.makedirs but the module does not import os.",
                    "suggestion": "Add import os near the top of backend/app/api/routes/users.py.",
                }
            )

    chat_participant = next((ep for ep in endpoints if ep["path"] == "/api/v1/chats/{chat_id}/participants" and ep["method"] == "POST"), None)
    if chat_participant:
        diagnostics.append(
            {
                "severity": "medium",
                "category": "Validation/API shape",
                "location": "POST /api/v1/chats/{chat_id}/participants",
                "message": "user_to_add is accepted as a query parameter on a mutating endpoint.",
                "suggestion": "Move it into a request body such as {\"user_id\": \"...\"} or retire this in favor of /groups/{group_id}/add-members.",
            }
        )

    if any(ep["path"] == "/api/v1/chats/group" for ep in endpoints) and any(ep["path"] == "/api/v1/groups/create" for ep in endpoints):
        diagnostics.append(
            {
                "severity": "medium",
                "category": "Duplicate workflow",
                "location": "POST /api/v1/chats/group and POST /api/v1/groups/create",
                "message": "Two endpoints create group chats with slightly different payloads.",
                "suggestion": "Pick one canonical group creation API and keep the other as a compatibility wrapper or deprecate it.",
            }
        )

    if any(ws["path"] == "/api/v1/ws" for ws in discover_websockets()):
        diagnostics.append(
            {
                "severity": "medium",
                "category": "WebSocket auth limitation",
                "location": "WS /api/v1/ws",
                "message": "WebSocket auth only reads the access_token cookie.",
                "suggestion": "If mobile/non-browser clients need WS support, also accept a short-lived token in a query param or subprotocol.",
            }
        )

    unused = [
        f"{ep['method']} {ep['path']}"
        for ep in endpoints
        if ep["path"].startswith(API_PREFIX)
        and not ep["frontendUsed"]
        and not ep["path"].startswith("/api/v1/auth")
    ]
    for item in unused[:14]:
        diagnostics.append(
            {
                "severity": "info",
                "category": "Possibly unused by frontend",
                "location": item,
                "message": "No direct frontend call was found by static string scan.",
                "suggestion": "Keep it if used externally/Postman-only; otherwise consider wiring it into the UI, documenting it as admin/internal, or removing it.",
            }
        )

    return diagnostics


def auth_flow() -> dict[str, Any]:
    return {
        "type": "OTP login with JWT Bearer plus HttpOnly cookies",
        "sendOtp": "POST /api/v1/auth/send-otp",
        "loginOrRegister": "POST /api/v1/auth/verify-otp",
        "refresh": "POST /api/v1/auth/refresh",
        "logout": "POST /api/v1/auth/logout",
        "bearerUsage": "Authorization: Bearer <access_token>",
        "cookieUsage": "access_token cookie + X-CSRF-Token matching csrf_access_token",
        "refreshUsage": "refresh_token cookie + X-CSRF-Token matching csrf_refresh_token",
        "registerBehavior": "verify-otp creates a user when the phone number is not already registered and returns is_new_user=true.",
        "webSocketAuth": "WS /api/v1/ws reads access_token from cookies only.",
    }


def build_api_data(endpoints: list[dict[str, Any]], spec: dict[str, Any], websockets: list[dict[str, Any]], diagnostics: list[dict[str, Any]]) -> dict[str, Any]:
    modules = sorted({ep["module"] for ep in endpoints})
    return {
        "generatedAt": GENERATED_AT,
        "title": spec.get("info", {}).get("title", "FastAPI API"),
        "description": spec.get("info", {}).get("description", ""),
        "version": spec.get("info", {}).get("version", ""),
        "baseUrl": BASE_URL,
        "apiPrefix": API_PREFIX,
        "modules": modules,
        "counts": {
            "httpEndpoints": len(endpoints),
            "webSocketEndpoints": len(websockets),
            "modules": len(modules),
            "diagnostics": len(diagnostics),
        },
        "auth": auth_flow(),
        "endpoints": endpoints,
        "websockets": websockets,
        "diagnostics": diagnostics,
        "workflow": [
            "Send OTP to a valid 10-digit Indian mobile number.",
            "Verify OTP. This logs in an existing user or registers a new user.",
            "Store access_token, csrf_access_token, and csrf_refresh_token from the response. Browser clients also receive HttpOnly cookies.",
            "Call protected APIs with Authorization: Bearer <access_token>. Cookie mode also needs X-CSRF-Token.",
            "Sync/search contacts, create a direct chat or group, upload media if needed, send messages, then use WebSocket for typing/read/call signaling.",
            "When access expires, call refresh with the refresh cookie and csrf_refresh_token, then update stored tokens.",
        ],
    }


def markdown_table(rows: list[list[str]]) -> str:
    if not rows:
        return ""
    header = rows[0]
    divider = ["---"] * len(header)
    lines = ["| " + " | ".join(header) + " |", "| " + " | ".join(divider) + " |"]
    for row in rows[1:]:
        clean = [str(cell).replace("\n", "<br>") for cell in row]
        lines.append("| " + " | ".join(clean) + " |")
    return "\n".join(lines)


def render_api_guide(data: dict[str, Any]) -> str:
    lines = [
        "# API Guide",
        "",
        f"Generated: `{data['generatedAt']}`",
        "",
        f"Project: **{data['title']}** `{data['version']}`",
        "",
        f"Base URL: `{data['baseUrl']}`",
        "",
        "## Inventory",
        "",
        f"- HTTP endpoints: **{data['counts']['httpEndpoints']}**",
        f"- WebSocket endpoints: **{data['counts']['webSocketEndpoints']}**",
        f"- Modules: **{data['counts']['modules']}**",
        f"- Diagnostics: **{data['counts']['diagnostics']}**",
        "",
        "## Authentication",
        "",
        f"- OTP request: `{data['auth']['sendOtp']}`",
        f"- Login/register: `{data['auth']['loginOrRegister']}`",
        f"- Refresh: `{data['auth']['refresh']}`",
        f"- Logout: `{data['auth']['logout']}`",
        f"- Protected HTTP APIs: `{data['auth']['bearerUsage']}`",
        f"- Cookie mode: `{data['auth']['cookieUsage']}`",
        f"- Refresh mode: `{data['auth']['refreshUsage']}`",
        f"- WebSocket: `{data['auth']['webSocketAuth']}`",
        "",
        "## How To Use APIs",
        "",
    ]
    for idx, step in enumerate(data["workflow"], start=1):
        lines.append(f"{idx}. {step}")
    lines.extend(
        [
            "",
            "## Module Map",
            "",
        ]
    )
    for module in data["modules"]:
        module_eps = [ep for ep in data["endpoints"] if ep["module"] == module]
        lines.append(f"### {module}")
        rows = [["Method", "Path", "Auth", "Request", "Response", "Source"]]
        for ep in module_eps:
            request_label = ep["request"]["schemaName"] or ep["request"]["contentType"] or "-"
            response_label = ep["response"]["schemaName"] or ep["response"]["status"]
            source = "-"
            if ep["source"]["file"]:
                source = f"`{ep['source']['file']}:{ep['source']['line']}`"
            rows.append(
                [
                    f"`{ep['method']}`",
                    f"`{ep['path']}`",
                    "yes" if ep["authRequired"] else "no",
                    request_label,
                    response_label,
                    source,
                ]
            )
        lines.append(markdown_table(rows))
        lines.append("")
    if data["websockets"]:
        lines.extend(["## WebSocket Routes", ""])
        for ws in data["websockets"]:
            lines.append(f"### `{ws['path']}`")
            lines.append("")
            lines.append(ws["authNotes"])
            lines.append("")
            lines.append(f"Client events: `{', '.join(ws['clientEvents'])}`")
            lines.append("")
            lines.append(f"Server events: `{', '.join(ws['serverEvents'])}`")
            lines.append("")
    lines.extend(["## Diagnostics And Suggested Fixes", ""])
    severity_order = {"high": 0, "medium": 1, "low": 2, "info": 3}
    for item in sorted(data["diagnostics"], key=lambda d: severity_order.get(d["severity"], 9)):
        lines.append(f"- **{item['severity'].upper()} - {item['category']}** at `{item['location']}`: {item['message']} Suggestion: {item['suggestion']}")
    lines.extend(
        [
            "",
            "## Generated Assets",
            "",
            "- `docs/index.html`: visual dashboard and playground",
            "- `POSTMAN_COLLECTION.json`: Postman v2.1 collection",
            "- `THUNDER_CLIENT_COLLECTION.json`: Thunder Client collection",
            "- `BRUNO_COLLECTION/`: Bruno request files",
            "- `API_USAGE_EXAMPLES.md`: curl, fetch, and axios examples",
            "- `API_FLOW_DIAGRAM.md`: Mermaid flow diagrams",
            "- `scripts/test_all_apis.py`: smoke/playground test runner",
            "",
        ]
    )
    return "\n".join(lines)


def render_flow_diagram(data: dict[str, Any]) -> str:
    return textwrap.dedent(
        f"""
        # API Flow Diagram

        Generated: `{data['generatedAt']}`

        ## Main Backend Flow

        ```mermaid
        flowchart TD
          A[Open app] --> B[POST /api/v1/auth/send-otp]
          B --> C[Read OTP from backend console or OTP provider]
          C --> D[POST /api/v1/auth/verify-otp]
          D --> E{{is_new_user?}}
          E -->|true| F[PUT /api/v1/users/me]
          E -->|false| G[GET /api/v1/users/me]
          F --> H[Sync or search contacts]
          G --> H
          H --> I[POST /api/v1/contacts/sync-single or /contacts/sync]
          H --> J[GET /api/v1/users/search]
          I --> K[POST /api/v1/chats/ or /api/v1/groups/create]
          J --> K
          K --> L[GET /api/v1/chats/]
          L --> M[GET /api/v1/messages/{{chat_id}}]
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
          Receiver->>API: POST /calls/{{call_id}}/accept
          API->>Sender: WS call_accepted
          Sender->>Receiver: WS WebRTC offer/answer/ice relay
        ```
        """
    ).strip() + "\n"


def render_usage_examples(data: dict[str, Any]) -> str:
    lines = [
        "# API Usage Examples",
        "",
        f"Generated: `{data['generatedAt']}`",
        "",
        "Set these once:",
        "",
        "```bash",
        "export BASE_URL=http://localhost:8000",
        "export ACCESS_TOKEN='<paste access_token>'",
        "export CSRF_REFRESH_TOKEN='<paste csrf_refresh_token>'",
        "```",
        "",
        "## Authentication Quick Start",
        "",
        "```bash",
        "curl -X POST \"$BASE_URL/api/v1/auth/send-otp\" \\",
        "  -H 'Content-Type: application/json' \\",
        "  -d '{\"phone\":\"9876543210\"}'",
        "",
        "curl -X POST \"$BASE_URL/api/v1/auth/verify-otp\" \\",
        "  -H 'Content-Type: application/json' \\",
        "  -c cookies.txt \\",
        "  -d '{\"phone\":\"9876543210\",\"otp\":\"123456\"}'",
        "```",
        "",
    ]
    for module in data["modules"]:
        lines.append(f"## {module}")
        lines.append("")
        for ep in [item for item in data["endpoints"] if item["module"] == module]:
            lines.append(f"### {ep['method']} `{ep['path']}`")
            lines.append("")
            lines.append("Curl:")
            lines.append("")
            lines.append("```bash")
            lines.append(ep["curl"])
            lines.append("```")
            lines.append("")
            lines.append("Fetch:")
            lines.append("")
            lines.append("```js")
            lines.append(ep["fetch"])
            lines.append("```")
            lines.append("")
            lines.append("Axios:")
            lines.append("")
            lines.append("```js")
            lines.append(ep["axios"])
            lines.append("```")
            lines.append("")
            if ep["request"]["sample"] is not None:
                lines.append("Request body:")
                lines.append("")
                lines.append("```json")
                lines.append(json_block(ep["request"]["sample"]))
                lines.append("```")
                lines.append("")
            if ep["response"]["sample"] is not None:
                lines.append("Response example:")
                lines.append("")
                lines.append("```json")
                lines.append(json_block(ep["response"]["sample"]))
                lines.append("```")
                lines.append("")
    if data["websockets"]:
        lines.append("## WebSocket Examples")
        lines.append("")
        for ws in data["websockets"]:
            lines.append(f"### `{ws['path']}`")
            lines.append("")
            lines.append("Browser clients authenticate with the `access_token` cookie.")
            lines.append("")
            lines.append("```js")
            lines.append(
                "const ws = new WebSocket('ws://localhost:8000/api/v1/ws');\n"
                "ws.onmessage = (event) => console.log(JSON.parse(event.data));\n"
                "ws.onopen = () => ws.send(JSON.stringify({ type: 'ping' }));"
            )
            lines.append("```")
            lines.append("")
    return "\n".join(lines)


def postman_body(endpoint: dict[str, Any]) -> dict[str, Any]:
    request = endpoint["request"]
    if request["contentType"] == "application/json":
        return {"mode": "raw", "raw": json.dumps(request["sample"], indent=2, ensure_ascii=False), "options": {"raw": {"language": "json"}}}
    if request["contentType"] == "multipart/form-data":
        sample = request["sample"] or {"file": "<select file>"}
        return {
            "mode": "formdata",
            "formdata": [
                {
                    "key": key,
                    "type": "file" if value == "<select file>" else "text",
                    "src": "" if value == "<select file>" else None,
                    "value": None if value == "<select file>" else str(value),
                }
                for key, value in sample.items()
            ],
        }
    return {}


def render_postman_collection(data: dict[str, Any]) -> dict[str, Any]:
    folders = []
    for module in data["modules"]:
        items = []
        for ep in [item for item in data["endpoints"] if item["module"] == module]:
            headers = []
            if ep["authRequired"] and not ep["path"].endswith("/auth/refresh"):
                headers.append({"key": "Authorization", "value": "Bearer {{access_token}}", "type": "text"})
            if ep["path"].endswith("/auth/refresh"):
                headers.append({"key": "X-CSRF-Token", "value": "{{csrf_refresh_token}}", "type": "text"})
            if ep["request"]["contentType"] == "application/json":
                headers.append({"key": "Content-Type", "value": "application/json", "type": "text"})
            url_path = build_url(ep["path"], ep["pathParams"], [], "collection").lstrip("/").split("/")
            query = [
                {"key": param["name"], "value": f"{{{{{param['name']}}}}}", "disabled": False}
                for param in ep["queryParams"]
            ]
            request: dict[str, Any] = {
                "method": ep["method"],
                "header": headers,
                "url": {
                    "raw": "{{baseUrl}}" + build_url(ep["path"], ep["pathParams"], ep["queryParams"], "collection"),
                    "host": ["{{baseUrl}}"],
                    "path": url_path,
                    "query": query,
                },
                "description": ep["summary"],
            }
            body = postman_body(ep)
            if body:
                request["body"] = body
            item: dict[str, Any] = {"name": f"{ep['method']} {ep['path']}", "request": request}
            if ep["path"].endswith("/auth/verify-otp") or ep["path"].endswith("/auth/refresh"):
                item["event"] = [
                    {
                        "listen": "test",
                        "script": {
                            "type": "text/javascript",
                            "exec": [
                                "const json = pm.response.json();",
                                "if (json.access_token) pm.collectionVariables.set('access_token', json.access_token);",
                                "if (json.csrf_access_token) pm.collectionVariables.set('csrf_access_token', json.csrf_access_token);",
                                "if (json.csrf_refresh_token) pm.collectionVariables.set('csrf_refresh_token', json.csrf_refresh_token);",
                            ],
                        },
                    }
                ]
            items.append(item)
        folders.append({"name": module, "item": items})
    return {
        "info": {
            "_postman_id": str(uuid.uuid4()),
            "name": data["title"],
            "description": "Generated FastAPI collection with auth helpers, examples, and grouped modules.",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        },
        "variable": [
            {"key": "baseUrl", "value": BASE_URL},
            {"key": "access_token", "value": ""},
            {"key": "csrf_access_token", "value": ""},
            {"key": "csrf_refresh_token", "value": ""},
            {"key": "chat_id", "value": "11111111-1111-1111-1111-111111111111"},
            {"key": "user_id", "value": "22222222-2222-2222-2222-222222222222"},
            {"key": "message_id", "value": "33333333-3333-3333-3333-333333333333"},
            {"key": "status_id", "value": "44444444-4444-4444-4444-444444444444"},
            {"key": "call_id", "value": "55555555-5555-5555-5555-555555555555"},
        ],
        "item": folders,
    }


def render_thunder_collection(data: dict[str, Any]) -> dict[str, Any]:
    collection_id = str(uuid.uuid4())
    folders = []
    folder_ids: dict[str, str] = {}
    for module in data["modules"]:
        fid = str(uuid.uuid4())
        folder_ids[module] = fid
        folders.append({"_id": fid, "name": module, "containerId": "", "created": GENERATED_AT, "sortNum": len(folders) + 1})
    requests = []
    for ep in data["endpoints"]:
        headers = []
        if ep["authRequired"] and not ep["path"].endswith("/auth/refresh"):
            headers.append({"name": "Authorization", "value": "Bearer {{access_token}}"})
        if ep["path"].endswith("/auth/refresh"):
            headers.append({"name": "X-CSRF-Token", "value": "{{csrf_refresh_token}}"})
        if ep["request"]["contentType"] == "application/json":
            headers.append({"name": "Content-Type", "value": "application/json"})
        body: dict[str, Any] = {"type": "none", "raw": "", "form": []}
        if ep["request"]["contentType"] == "application/json":
            body = {"type": "json", "raw": json.dumps(ep["request"]["sample"], indent=2, ensure_ascii=False), "form": []}
        elif ep["request"]["contentType"] == "multipart/form-data":
            body = {
                "type": "formdata",
                "raw": "",
                "form": [
                    {"name": key, "value": "" if value == "<select file>" else str(value), "isFile": value == "<select file>"}
                    for key, value in (ep["request"]["sample"] or {"file": "<select file>"}).items()
                ],
            }
        requests.append(
            {
                "_id": str(uuid.uuid4()),
                "colId": collection_id,
                "containerId": folder_ids[ep["module"]],
                "name": f"{ep['method']} {ep['path']}",
                "url": "{{baseUrl}}" + build_url(ep["path"], ep["pathParams"], ep["queryParams"], "collection"),
                "method": ep["method"],
                "sortNum": len(requests) + 1,
                "created": GENERATED_AT,
                "modified": GENERATED_AT,
                "headers": headers,
                "params": [
                    {"name": param["name"], "value": f"{{{{{param['name']}}}}}", "isPath": False}
                    for param in ep["queryParams"]
                ],
                "body": body,
                "tests": [],
            }
        )
    return {
        "client": "Thunder Client",
        "collectionName": data["title"],
        "dateExported": GENERATED_AT,
        "version": "1.2",
        "folders": folders,
        "requests": requests,
        "settings": {"headers": [], "tests": []},
        "variables": [
            {"name": "baseUrl", "value": BASE_URL},
            {"name": "access_token", "value": ""},
            {"name": "csrf_refresh_token", "value": ""},
        ],
    }


def bru_value(value: Any, indent: int = 2) -> str:
    text = json.dumps(value, indent=2, ensure_ascii=False)
    return textwrap.indent(text, " " * indent)


def render_bru_request(ep: dict[str, Any], sequence: int) -> str:
    body = [
        "meta {",
        f"  name: {ep['method']} {ep['path']}",
        "  type: http",
        f"  seq: {sequence}",
        "}",
        "",
        f"{ep['method'].lower()} {{",
        f"  url: {{{{baseUrl}}}}{build_url(ep['path'], ep['pathParams'], ep['queryParams'], 'collection')}",
        "  body: " + ("json" if ep["request"]["contentType"] == "application/json" else "multipartForm" if ep["request"]["contentType"] == "multipart/form-data" else "none"),
        "  auth: none",
        "}",
        "",
        "headers {",
    ]
    if ep["authRequired"] and not ep["path"].endswith("/auth/refresh"):
        body.append("  Authorization: Bearer {{access_token}}")
    if ep["path"].endswith("/auth/refresh"):
        body.append("  X-CSRF-Token: {{csrf_refresh_token}}")
    if ep["request"]["contentType"] == "application/json":
        body.append("  Content-Type: application/json")
    body.append("}")
    if ep["request"]["contentType"] == "application/json":
        body.extend(["", "body:json {", bru_value(ep["request"]["sample"]), "}"])
    elif ep["request"]["contentType"] == "multipart/form-data":
        body.extend(["", "body:multipart-form {"])
        for key, value in (ep["request"]["sample"] or {"file": "<select file>"}).items():
            if value == "<select file>":
                body.append(f"  {key}: @file(./sample-file.bin)")
            else:
                body.append(f"  {key}: {value}")
        body.append("}")
    return "\n".join(body) + "\n"


def write_bruno_collection(data: dict[str, Any]) -> None:
    base = ROOT / "BRUNO_COLLECTION"
    if base.exists():
        shutil.rmtree(base)
    base.mkdir(parents=True, exist_ok=True)
    write_text(
        base / "bruno.json",
        json.dumps(
            {
                "version": "1",
                "name": data["title"],
                "type": "collection",
                "ignore": ["node_modules", ".git"],
            },
            indent=2,
        )
        + "\n",
    )
    write_text(
        base / "collection.bru",
        textwrap.dedent(
            f"""
            meta {{
              name: {data['title']}
              type: collection
              version: 1
            }}

            vars {{
              baseUrl: {BASE_URL}
              access_token:
              csrf_refresh_token:
            }}
            """
        ).strip()
        + "\n",
    )
    env_dir = base / "environments"
    env_dir.mkdir(exist_ok=True)
    write_text(
        env_dir / "Local.bru",
        textwrap.dedent(
            f"""
            vars {{
              baseUrl: {BASE_URL}
              access_token:
              csrf_access_token:
              csrf_refresh_token:
            }}
            """
        ).strip()
        + "\n",
    )
    for module in data["modules"]:
        folder = base / slugify(module)
        folder.mkdir(parents=True, exist_ok=True)
        write_text(
            folder / "folder.bru",
            textwrap.dedent(
                f"""
                meta {{
                  name: {module}
                  type: folder
                }}
                """
            ).strip()
            + "\n",
        )
        for idx, ep in enumerate([item for item in data["endpoints"] if item["module"] == module], start=1):
            file_name = f"{idx:02d}-{slugify(ep['method'] + '-' + ep['path'])}.bru"
            write_text(folder / file_name, render_bru_request(ep, idx))


def render_index_html(data: dict[str, Any]) -> str:
    payload = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    template = r"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>__TITLE__ API Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at 20% 0%, rgba(20, 184, 166, 0.18), transparent 28rem),
        radial-gradient(circle at 90% 10%, rgba(59, 130, 246, 0.16), transparent 30rem),
        linear-gradient(135deg, #070b12 0%, #0d111c 44%, #0a0f16 100%);
      color: #e5eefb;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0;
    }
    * { box-sizing: border-box; }
    .glass { background: rgba(10, 16, 28, 0.76); border: 1px solid rgba(148, 163, 184, 0.18); box-shadow: 0 18px 80px rgba(0, 0, 0, 0.3); backdrop-filter: blur(18px); }
    .soft { background: rgba(15, 23, 42, 0.72); border: 1px solid rgba(148, 163, 184, 0.16); }
    .method-get { background: rgba(34, 197, 94, .16); color: #86efac; border-color: rgba(34, 197, 94, .35); }
    .method-post { background: rgba(59, 130, 246, .16); color: #93c5fd; border-color: rgba(59, 130, 246, .35); }
    .method-put { background: rgba(234, 179, 8, .16); color: #fde68a; border-color: rgba(234, 179, 8, .35); }
    .method-patch { background: rgba(168, 85, 247, .16); color: #d8b4fe; border-color: rgba(168, 85, 247, .35); }
    .method-delete { background: rgba(248, 113, 113, .16); color: #fca5a5; border-color: rgba(248, 113, 113, .35); }
    pre { white-space: pre-wrap; word-break: break-word; }
    button, input, textarea, select { font: inherit; }
    .scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
    .scrollbar::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.45); border-radius: 999px; }
    .scrollbar::-webkit-scrollbar-track { background: transparent; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    window.API_DATA = __API_DATA__;
  </script>
  <script type="text/babel">
    const { useEffect, useMemo, useRef, useState } = React;
    const DATA = window.API_DATA;
    const methodClass = {
      GET: "method-get",
      POST: "method-post",
      PUT: "method-put",
      PATCH: "method-patch",
      DELETE: "method-delete"
    };

    function cx(...parts) { return parts.filter(Boolean).join(" "); }
    function pretty(value) {
      if (value === null || value === undefined || value === "") return "";
      if (typeof value === "string") return value;
      return JSON.stringify(value, null, 2);
    }
    function copy(text) { navigator.clipboard?.writeText(text); }
    function fillPath(ep) {
      return ep.path.replace(/\{([^}]+)\}/g, (_, name) => {
        const param = ep.pathParams.find((item) => item.name === name);
        return encodeURIComponent(param?.sample || `{{${name}}}`);
      });
    }
    function requiredQuery(ep) {
      const q = new URLSearchParams();
      ep.queryParams.filter((param) => param.required).forEach((param) => q.set(param.name, param.sample ?? ""));
      return q.toString();
    }
    function endpointUrl(baseUrl, ep) {
      const url = `${baseUrl.replace(/\/$/, "")}${fillPath(ep)}`;
      const query = requiredQuery(ep);
      return query ? `${url}?${query}` : url;
    }

    function MethodBadge({ method }) {
      return <span className={cx("inline-flex min-w-16 justify-center rounded-md border px-2 py-1 text-xs font-semibold", methodClass[method])}>{method}</span>;
    }

    function Stat({ label, value }) {
      return <div className="soft rounded-lg p-4"><div className="text-2xl font-semibold text-white">{value}</div><div className="mt-1 text-xs uppercase tracking-wide text-slate-400">{label}</div></div>;
    }

    function Sidebar({ modules, activeModule, setActiveModule, query, setQuery, endpoints, setActiveId }) {
      return <aside className="glass sticky top-4 h-[calc(100vh-2rem)] overflow-hidden rounded-xl">
        <div className="border-b border-slate-700/60 p-5">
          <div className="text-sm text-teal-300">FastAPI Explorer</div>
          <h1 className="mt-1 text-xl font-semibold text-white">{DATA.title}</h1>
          <p className="mt-2 text-sm text-slate-400">Generated from live FastAPI route metadata.</p>
          <input
            className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none ring-teal-400/30 focus:ring-2"
            placeholder="Search endpoints..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <nav className="scrollbar h-[calc(100%-10.5rem)] overflow-auto p-3">
          {["All", ...modules].map((module) => {
            const count = module === "All" ? endpoints.length : endpoints.filter((ep) => ep.module === module).length;
            return <button
              key={module}
              onClick={() => setActiveModule(module)}
              className={cx("mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition", activeModule === module ? "bg-teal-400/15 text-teal-200" : "text-slate-300 hover:bg-slate-800/70")}
            >
              <span>{module}</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{count}</span>
            </button>;
          })}
        </nav>
      </aside>;
    }

    function EndpointList({ endpoints, activeId, setActiveId }) {
      return <div className="space-y-2">
        {endpoints.map((ep) => <button
          key={ep.id}
          onClick={() => setActiveId(ep.id)}
          className={cx("soft w-full rounded-lg p-3 text-left transition hover:border-teal-400/40", activeId === ep.id && "border-teal-400/60 bg-teal-400/10")}
        >
          <div className="flex flex-wrap items-center gap-3">
            <MethodBadge method={ep.method} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-mono text-sm text-slate-100">{ep.path}</div>
              <div className="mt-1 truncate text-xs text-slate-400">{ep.summary}</div>
            </div>
            {ep.authRequired && <span className="rounded-md bg-amber-400/10 px-2 py-1 text-xs text-amber-200">JWT</span>}
          </div>
        </button>)}
      </div>;
    }

    function ParamTable({ title, params }) {
      if (!params.length) return null;
      return <section className="mt-5">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-700/70">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
              <tr><th className="p-2">Name</th><th className="p-2">Type</th><th className="p-2">Required</th><th className="p-2">Sample</th></tr>
            </thead>
            <tbody>
              {params.map((param) => <tr key={param.name} className="border-t border-slate-800">
                <td className="p-2 font-mono text-slate-100">{param.name}</td>
                <td className="p-2 text-slate-300">{param.type}</td>
                <td className="p-2 text-slate-300">{param.required ? "yes" : "no"}</td>
                <td className="p-2 font-mono text-xs text-slate-400">{String(param.sample ?? "")}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>;
    }

    function CodePanel({ title, value }) {
      return <div className="soft rounded-lg">
        <div className="flex items-center justify-between border-b border-slate-700/60 px-3 py-2">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button onClick={() => copy(value)} className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700">Copy</button>
        </div>
        <pre className="scrollbar max-h-72 overflow-auto p-3 text-xs leading-5 text-slate-300">{value || "No body"}</pre>
      </div>;
    }

    function Playground({ ep, baseUrl, token, csrf, setToken, setCsrf }) {
      const [body, setBody] = useState(pretty(ep.request.sample));
      const [response, setResponse] = useState(null);
      const [loading, setLoading] = useState(false);
      const fileRef = useRef(null);

      useEffect(() => {
        setBody(pretty(ep.request.sample));
        setResponse(null);
      }, [ep.id]);

      async function run() {
        setLoading(true);
        setResponse(null);
        const headers = {};
        let payload;
        if (ep.authRequired && token && !ep.path.endsWith("/auth/refresh")) headers.Authorization = `Bearer ${token}`;
        if (ep.path.endsWith("/auth/refresh") && csrf) headers["X-CSRF-Token"] = csrf;
        if (ep.request.contentType === "application/json") {
          headers["Content-Type"] = "application/json";
          payload = body || "{}";
        } else if (ep.request.contentType === "multipart/form-data") {
          const form = new FormData();
          const selected = fileRef.current?.files?.[0];
          Object.entries(ep.request.sample || { file: "<select file>" }).forEach(([key, value]) => {
            if (value === "<select file>") {
              form.append(key, selected || new Blob(["sample file"], { type: "text/plain" }), selected?.name || "sample.txt");
            } else {
              form.append(key, value);
            }
          });
          payload = form;
        }
        const started = performance.now();
        try {
          const res = await fetch(endpointUrl(baseUrl, ep), {
            method: ep.method,
            headers,
            body: ["GET", "HEAD"].includes(ep.method) ? undefined : payload,
            credentials: "include"
          });
          const text = await res.text();
          let parsed = text;
          try { parsed = JSON.parse(text); } catch (_) {}
          const elapsed = Math.round(performance.now() - started);
          setResponse({ status: res.status, ok: res.ok, elapsed, body: parsed, headers: Object.fromEntries(res.headers.entries()) });
          if (parsed?.access_token) setToken(parsed.access_token);
          if (parsed?.csrf_refresh_token) setCsrf(parsed.csrf_refresh_token);
        } catch (error) {
          setResponse({ error: error.message });
        } finally {
          setLoading(false);
        }
      }

      return <section className="mt-6 soft rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Interactive Playground</h2>
            <p className="mt-1 text-sm text-slate-400">Runs against <span className="font-mono text-slate-200">{endpointUrl(baseUrl, ep)}</span></p>
          </div>
          <button onClick={run} disabled={loading} className="rounded-lg bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-300 disabled:opacity-60">{loading ? "Testing..." : "Test API"}</button>
        </div>
        {ep.request.contentType === "multipart/form-data" && <input ref={fileRef} type="file" className="mt-4 block w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" />}
        {ep.request.contentType === "application/json" && <textarea className="mt-4 h-56 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-100 outline-none focus:ring-2 focus:ring-teal-400/40" value={body} onChange={(event) => setBody(event.target.value)} />}
        {response && <div className="mt-4">
          <CodePanel title={response.error ? "Error" : `Response ${response.status} in ${response.elapsed}ms`} value={pretty(response.body || response.error)} />
        </div>}
      </section>;
    }

    function EndpointDetail({ ep, baseUrl, token, setToken, csrf, setCsrf }) {
      return <main className="space-y-5">
        <section className="glass rounded-xl p-5">
          <div className="flex flex-wrap items-center gap-3">
            <MethodBadge method={ep.method} />
            <h2 className="break-all font-mono text-lg font-semibold text-white">{ep.path}</h2>
            <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">{ep.module}</span>
            {ep.authRequired && <span className="rounded-md bg-amber-400/10 px-2 py-1 text-xs text-amber-200">JWT required</span>}
          </div>
          <p className="mt-3 text-sm text-slate-300">{ep.summary}</p>
          {ep.description && <p className="mt-2 text-sm text-slate-400">{ep.description}</p>}
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="soft rounded-lg p-3"><div className="text-xs text-slate-400">Source</div><div className="mt-1 font-mono text-xs text-slate-200">{ep.source.file ? `${ep.source.file}:${ep.source.line}` : "-"}</div></div>
            <div className="soft rounded-lg p-3"><div className="text-xs text-slate-400">Request</div><div className="mt-1 text-sm text-slate-200">{ep.request.schemaName || ep.request.contentType || "none"}</div></div>
            <div className="soft rounded-lg p-3"><div className="text-xs text-slate-400">Response</div><div className="mt-1 text-sm text-slate-200">{ep.response.status} {ep.response.schemaName || ""}</div></div>
          </div>
          <ParamTable title="Path Parameters" params={ep.pathParams} />
          <ParamTable title="Query Parameters" params={ep.queryParams} />
          {ep.headers.length > 0 && <ParamTable title="Required Headers" params={ep.headers.map((h) => ({ name: h.name, type: "string", required: h.required, sample: h.value }))} />}
        </section>
        <div className="grid gap-4 xl:grid-cols-3">
          <CodePanel title="cURL" value={ep.curl} />
          <CodePanel title="Fetch" value={ep.fetch} />
          <CodePanel title="Axios" value={ep.axios} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <CodePanel title="Request Example" value={pretty(ep.request.sample)} />
          <CodePanel title="Response Example" value={pretty(ep.response.sample)} />
        </div>
        <Playground ep={ep} baseUrl={baseUrl} token={token} csrf={csrf} setToken={setToken} setCsrf={setCsrf} />
      </main>;
    }

    function AuthPanel({ baseUrl, setBaseUrl, token, setToken, csrf, setCsrf }) {
      return <section className="glass rounded-xl p-4">
        <div className="grid gap-3 lg:grid-cols-3">
          <label className="block text-sm text-slate-300">Base URL
            <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white outline-none focus:ring-2 focus:ring-teal-400/30" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
          </label>
          <label className="block text-sm text-slate-300">Access Token
            <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white outline-none focus:ring-2 focus:ring-teal-400/30" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste JWT or run verify-otp" />
          </label>
          <label className="block text-sm text-slate-300">Refresh CSRF
            <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white outline-none focus:ring-2 focus:ring-teal-400/30" value={csrf} onChange={(event) => setCsrf(event.target.value)} placeholder="csrf_refresh_token" />
          </label>
        </div>
      </section>;
    }

    function HowToUse() {
      return <section className="glass rounded-xl p-5">
        <h2 className="text-xl font-semibold text-white">How To Use APIs</h2>
        <ol className="mt-4 grid gap-3 lg:grid-cols-2">
          {DATA.workflow.map((step, index) => <li key={step} className="soft rounded-lg p-4">
            <div className="text-xs font-semibold uppercase text-teal-300">Step {index + 1}</div>
            <div className="mt-2 text-sm text-slate-200">{step}</div>
          </li>)}
        </ol>
      </section>;
    }

    function Diagnostics() {
      const colors = { high: "text-red-300 bg-red-400/10", medium: "text-amber-200 bg-amber-400/10", low: "text-blue-200 bg-blue-400/10", info: "text-slate-300 bg-slate-700/70" };
      return <section className="glass rounded-xl p-5">
        <h2 className="text-xl font-semibold text-white">Diagnostics</h2>
        <div className="mt-4 space-y-3">
          {DATA.diagnostics.map((item, index) => <div key={index} className="soft rounded-lg p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cx("rounded-md px-2 py-1 text-xs font-semibold uppercase", colors[item.severity])}>{item.severity}</span>
              <span className="text-sm font-semibold text-white">{item.category}</span>
              <span className="font-mono text-xs text-slate-400">{item.location}</span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{item.message}</p>
            <p className="mt-2 text-sm text-teal-200">{item.suggestion}</p>
          </div>)}
        </div>
      </section>;
    }

    function WebSocketTester({ baseUrl }) {
      const [connected, setConnected] = useState(false);
      const [message, setMessage] = useState(JSON.stringify(DATA.websockets[0]?.sampleMessages?.[0] || { type: "ping" }, null, 2));
      const [log, setLog] = useState([]);
      const wsRef = useRef(null);
      if (!DATA.websockets.length) return null;
      const wsPath = DATA.websockets[0].path;
      const wsUrl = `${baseUrl.startsWith("https") ? "wss" : "ws"}://${baseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}${wsPath}`;
      function append(item) { setLog((prev) => [{ time: new Date().toLocaleTimeString(), ...item }, ...prev].slice(0, 50)); }
      function connect() {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onopen = () => { setConnected(true); append({ direction: "open", text: wsUrl }); };
        ws.onmessage = (event) => append({ direction: "in", text: event.data });
        ws.onerror = () => append({ direction: "error", text: "WebSocket error. Check access_token cookie and backend server." });
        ws.onclose = (event) => { setConnected(false); append({ direction: "close", text: `code ${event.code}` }); };
      }
      function send() {
        wsRef.current?.send(message);
        append({ direction: "out", text: message });
      }
      return <section className="glass rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">WebSocket Tester</h2>
            <p className="mt-1 font-mono text-xs text-slate-400">{wsUrl}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={connect} disabled={connected} className="rounded-lg bg-teal-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">Connect</button>
            <button onClick={() => wsRef.current?.close()} className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200">Close</button>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <textarea className="h-40 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-100 outline-none focus:ring-2 focus:ring-teal-400/30" value={message} onChange={(event) => setMessage(event.target.value)} />
            <button onClick={send} disabled={!connected} className="mt-2 rounded-lg bg-blue-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">Send Event</button>
          </div>
          <div className="scrollbar h-52 overflow-auto rounded-lg border border-slate-700 bg-slate-950 p-3">
            {log.map((item, index) => <div key={index} className="mb-2 border-b border-slate-800 pb-2 text-xs">
              <span className="text-slate-500">{item.time}</span> <span className="text-teal-300">{item.direction}</span>
              <pre className="mt-1 text-slate-300">{item.text}</pre>
            </div>)}
          </div>
        </div>
      </section>;
    }

    function App() {
      const [query, setQuery] = useState("");
      const [activeModule, setActiveModule] = useState("All");
      const [activeId, setActiveId] = useState(DATA.endpoints[0]?.id);
      const [baseUrl, setBaseUrl] = useState(localStorage.getItem("api_dashboard_base_url") || DATA.baseUrl);
      const [token, setTokenState] = useState(localStorage.getItem("api_dashboard_access_token") || "");
      const [csrf, setCsrfState] = useState(localStorage.getItem("api_dashboard_csrf_refresh_token") || "");

      function setToken(value) { setTokenState(value); localStorage.setItem("api_dashboard_access_token", value || ""); }
      function setCsrf(value) { setCsrfState(value); localStorage.setItem("api_dashboard_csrf_refresh_token", value || ""); }
      useEffect(() => localStorage.setItem("api_dashboard_base_url", baseUrl), [baseUrl]);

      const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return DATA.endpoints.filter((ep) => {
          const moduleMatch = activeModule === "All" || ep.module === activeModule;
          const queryMatch = !q || [ep.method, ep.path, ep.summary, ep.module].join(" ").toLowerCase().includes(q);
          return moduleMatch && queryMatch;
        });
      }, [query, activeModule]);
      useEffect(() => {
        if (filtered.length && !filtered.some((ep) => ep.id === activeId)) setActiveId(filtered[0].id);
      }, [filtered, activeId]);
      const active = DATA.endpoints.find((ep) => ep.id === activeId) || filtered[0] || DATA.endpoints[0];

      return <div className="mx-auto grid max-w-[1800px] gap-4 p-4 lg:grid-cols-[320px_1fr]">
        <Sidebar modules={DATA.modules} activeModule={activeModule} setActiveModule={setActiveModule} query={query} setQuery={setQuery} endpoints={DATA.endpoints} setActiveId={setActiveId} />
        <div className="min-w-0 space-y-4">
          <header className="glass rounded-xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-sm text-teal-300">API workspace</div>
                <h1 className="mt-1 text-3xl font-semibold text-white">{DATA.title}</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-400">{DATA.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="HTTP" value={DATA.counts.httpEndpoints} />
                <Stat label="WS" value={DATA.counts.webSocketEndpoints} />
                <Stat label="Modules" value={DATA.counts.modules} />
              </div>
            </div>
          </header>
          <AuthPanel baseUrl={baseUrl} setBaseUrl={setBaseUrl} token={token} setToken={setToken} csrf={csrf} setCsrf={setCsrf} />
          <div className="grid gap-4 xl:grid-cols-[minmax(340px,420px)_1fr]">
            <section className="glass rounded-xl p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold uppercase text-slate-300">Endpoints</h2>
                <span className="text-xs text-slate-500">{filtered.length} shown</span>
              </div>
              <div className="scrollbar max-h-[820px] overflow-auto pr-1">
                <EndpointList endpoints={filtered} activeId={active?.id} setActiveId={setActiveId} />
              </div>
            </section>
            {active && <EndpointDetail ep={active} baseUrl={baseUrl} token={token} setToken={setToken} csrf={csrf} setCsrf={setCsrf} />}
          </div>
          <HowToUse />
          <WebSocketTester baseUrl={baseUrl} />
          <Diagnostics />
        </div>
      </div>;
    }

    ReactDOM.createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>
"""
    return template.replace("__API_DATA__", payload).replace("__TITLE__", html.escape(data["title"]))


def render_test_runner(data: dict[str, Any]) -> str:
    compact = json.dumps(
        [
            {
                "method": ep["method"],
                "path": ep["path"],
                "auth": ep["authRequired"],
                "content_type": ep["request"]["contentType"],
                "body": ep["request"]["sample"],
                "path_params": {param["name"]: param["sample"] for param in ep["pathParams"]},
                "query": {param["name"]: param["sample"] for param in ep["queryParams"] if param["required"]},
                "is_refresh": ep["path"].endswith("/auth/refresh"),
            }
            for ep in data["endpoints"]
        ],
        indent=2,
        ensure_ascii=False,
    )
    websockets = json.dumps(data["websockets"], indent=2, ensure_ascii=False)
    return f'''#!/usr/bin/env python3
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

ENDPOINTS = json.loads({compact!r})
WEBSOCKETS = json.loads({websockets!r})


def load_dotenv(path: Path) -> dict[str, str]:
    values = {{}}
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
        {{
            "sub": user_id,
            "type": "access",
            "csrf": "dummy-csrf",
            "jti": "dummy-jti",
            "exp": now + dt.timedelta(minutes=30),
        }},
        secret,
        algorithm=algorithm,
    )


def fill_path(path: str, params: dict[str, Any]) -> str:
    def repl(match: re.Match[str]) -> str:
        name = match.group(1)
        return str(params.get(name, "11111111-1111-1111-1111-111111111111"))
    return re.sub(r"\\{{([^}}]+)\\}}", repl, path)


def is_mutating(method: str, path: str) -> bool:
    if path in ("/", "/api/v1/auth/send-otp", "/api/v1/auth/verify-otp", "/api/v1/auth/refresh"):
        return False
    return method.upper() not in {{"GET", "HEAD", "OPTIONS"}}


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
        await client.post("/api/v1/auth/send-otp", json={{"phone": phone}})
        response = await client.post("/api/v1/auth/verify-otp", json={{"phone": phone, "otp": otp}})
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
            headers = {{}}
            if endpoint["auth"] and not endpoint["is_refresh"] and token:
                headers["Authorization"] = f"Bearer {{token}}"
            if endpoint["is_refresh"] and csrf_refresh:
                headers["X-CSRF-Token"] = csrf_refresh
            params = endpoint["query"] or None
            files = None
            data = None
            json_body = None
            if endpoint["content_type"] == "application/json":
                json_body = endpoint["body"]
            elif endpoint["content_type"] == "multipart/form-data":
                files = {{"file": ("sample.txt", b"sample file", "text/plain")}}

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
                preview = response.text[:240].replace("\\n", " ")
                status = "PASS" if response.status_code < 500 else "FAIL"
                results.append((endpoint, status, response.status_code, elapsed, preview))
            except Exception as exc:
                elapsed = int((time.perf_counter() - started) * 1000)
                results.append((endpoint, "ERROR", str(exc), elapsed, ""))

        failures = 0
        for endpoint, status, detail, elapsed, preview in results:
            label = f"{{endpoint['method']}} {{endpoint['path']}}"
            print(f"{{status:5}} {{label:52}} {{detail}} {{elapsed}}ms")
            if preview and args.verbose:
                print(f"      {{preview}}")
            if status in {{"FAIL", "ERROR"}}:
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
    url = f"{{scheme}}://{{host}}{{WEBSOCKETS[0]['path']}}"
    headers = {{"Cookie": f"access_token={{token}}"}}
    async with websockets.connect(url, extra_headers=headers) as ws:
        await ws.send(json.dumps({{"type": "ping"}}))
        message = await asyncio.wait_for(ws.recv(), timeout=args.timeout)
        print(message)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=os.getenv("API_BASE_URL", "{BASE_URL}"))
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
'''


def main() -> None:
    endpoints, spec, websockets = collect_endpoints()
    diagnostics = analyze_routes(endpoints)
    data = build_api_data(endpoints, spec, websockets, diagnostics)

    write_text(ROOT / "API_GUIDE.md", render_api_guide(data))
    write_json(ROOT / "POSTMAN_COLLECTION.json", render_postman_collection(data))
    write_json(ROOT / "THUNDER_CLIENT_COLLECTION.json", render_thunder_collection(data))
    write_text(ROOT / "API_FLOW_DIAGRAM.md", render_flow_diagram(data))
    write_text(ROOT / "API_USAGE_EXAMPLES.md", render_usage_examples(data))
    write_text(ROOT / "docs" / "index.html", render_index_html(data))
    write_text(ROOT / "scripts" / "test_all_apis.py", render_test_runner(data))
    write_bruno_collection(data)
    print(
        json.dumps(
            {
                "http_endpoints": data["counts"]["httpEndpoints"],
                "websocket_endpoints": data["counts"]["webSocketEndpoints"],
                "diagnostics": data["counts"]["diagnostics"],
                "files": [
                    "API_GUIDE.md",
                    "POSTMAN_COLLECTION.json",
                    "THUNDER_CLIENT_COLLECTION.json",
                    "API_FLOW_DIAGRAM.md",
                    "API_USAGE_EXAMPLES.md",
                    "docs/index.html",
                    "scripts/test_all_apis.py",
                    "BRUNO_COLLECTION/",
                ],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
