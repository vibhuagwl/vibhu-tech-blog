# Security — React + Spring Boot (staff interview)

## Golden rule

> Anything shipped to the browser is **not** a secret.

Never put in `VITE_*` / frontend bundles: DB passwords, API secrets, private keys, LLM keys.

## Threat → control

| Threat | Frontend | Backend (truth) |
|--------|----------|-----------------|
| XSS | Avoid `dangerouslySetInnerHTML`; encode output | CSP; sanitize; HttpOnly cookies |
| CSRF | SameSite cookies; CSRF token if cookie session | Spring CSRF when cookie auth |
| CORS | — | Allowlist origins; never `*` with credentials |
| JWT theft | Prefer HttpOnly cookie over localStorage | Short TTL; rotate; revoke |
| Broken authZ | Hide buttons (UX) | Method security / roles on controllers |
| Clickjacking | — | `X-Frame-Options` / CSP frame-ancestors |
| 429 abuse | Show Retry-After | Rate limit filter / gateway |
| Dependency CVE | npm audit | Dependabot; SCA |

## Auth flow (draw)

```text
Login form
  → POST /api/v1/auth/login
  → Spring Security validates
  → JWT (lab) or Set-Cookie (prod)
  → React stores session UX
  → apiClient sends credential
  → Filter authenticates
  → Controller authorizes role
```

**Lab note:** this project uses Bearer JWT in `localStorage` (`poi_token`) for simplicity. In production interviews, say:

```text
I'd prefer HttpOnly Secure SameSite cookies + CSRF strategy,
or BFF that holds the session so the SPA never sees the refresh token.
```

## CORS (React :5173 → Spring :8080)

```text
Browser sees different origin → CORS
Preflight OPTIONS when non-simple headers (Authorization)
Access-Control-Allow-Origin must match allowlist
```

Implemented in `backend/.../config/CorsConfig.java`.

## API error contract

```json
{"code":"PAYMENT_NOT_FOUND","message":"...","traceId":"..."}
```

Frontend maps `code` → user message; log `traceId` for support.

## Rate limit UX

```text
React → Spring → 429 + Retry-After → toast / disable submit
```

## RBAC

Roles: `ADMIN`, `SUPPORT`, `READ_ONLY`. Frontend `RoleRoute` hides Admin. Backend returns **403** for reader retry — that is the real gate.
