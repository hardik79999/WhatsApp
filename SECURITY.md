# Security Policy

## Supported Branch

Security fixes should target the `main` branch unless a release branch is introduced later.

## Reporting A Vulnerability

If you find a vulnerability, do not open a public issue with secret values or exploit details.

Recommended private report content:

- Affected area
- Reproduction steps
- Expected impact
- Suggested fix, if known
- Any logs with secrets removed

## Secrets Policy

Never commit:

- `backend/.env`
- `frontend/.env.local`
- API keys
- JWT secrets
- Database passwords
- Access tokens
- Refresh tokens
- Local cookies

The repository intentionally tracks safe example files only:

- `backend/.env.example`
- `frontend/.env.example`

If a real secret is committed:

1. Remove it from git tracking.
2. Rotate the secret immediately.
3. Invalidate affected tokens or credentials.
4. Consider cleaning repository history if the secret was public.

## Authentication Notes

- Protected HTTP APIs use `Authorization: Bearer <access_token>`.
- Refresh uses the refresh cookie plus `X-CSRF-Token`.
- WebSocket auth currently uses the `access_token` cookie.

## Local Development Safety

- Use test accounts and local test data.
- Do not expose local tunnels without reviewing CORS and auth settings.
- Do not run mutating API smoke tests against production data.
