# Contributing

Thanks for helping improve this project. This guide keeps changes predictable and easy to review.

## Development Workflow

1. Create or update your local environment files.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

2. Start the app.

```bash
./start_backend.sh
./start_frontend.sh
```

3. Make focused changes.

4. Run relevant checks.

```bash
.venv/bin/python -m py_compile scripts/generate_api_artifacts.py scripts/test_all_apis.py
cd frontend && npm run lint && npm run build
```

5. Regenerate API artifacts when backend routes, schemas, auth, or WebSocket behavior changes.

```bash
.venv/bin/python scripts/generate_api_artifacts.py
```

6. Review your diff.

```bash
git status --short
git diff --stat
```

## Commit Guidelines

Use clear, action-based commit messages:

```text
Add media upload validation
Fix refresh token rotation
Update API dashboard artifacts
```

Keep unrelated changes in separate commits.

## Pull Request Checklist

- Backend starts successfully
- Frontend starts successfully
- No real `.env` files are committed
- API docs are regenerated if routes changed
- Generated collections still parse as JSON
- README or docs are updated for user-facing changes

## Code Style

- Follow the existing FastAPI route/service/schema structure
- Keep Pydantic schemas explicit
- Use shared API clients on the frontend
- Prefer small focused components and utilities
- Avoid committing local uploads, logs, database files, or build output

## API Documentation

The generated API documentation system is part of the project. If backend API behavior changes, update:

- `API_GUIDE.md`
- `API_USAGE_EXAMPLES.md`
- `API_FLOW_DIAGRAM.md`
- `docs/index.html`
- `POSTMAN_COLLECTION.json`
- `THUNDER_CLIENT_COLLECTION.json`
- `BRUNO_COLLECTION/`

The generator handles all of these:

```bash
.venv/bin/python scripts/generate_api_artifacts.py
```
