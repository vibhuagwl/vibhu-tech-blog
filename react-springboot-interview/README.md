# React + Spring Boot Interview Lab — Payment Operations Dashboard

Practical **ReactJS interview weapon** for senior Java/Spring backend engineers.
~90% runnable code, ~10% diagrams. Not a beginner course.

```text
Browser React (:5173)
  → apiClient (JWT, 401/403/429)
  → Spring Boot REST (:8080) /api/v1
  → PaymentService / TransactionService
  → H2 (default) or PostgreSQL
  → SSE status events
```

## Quick start (no Docker)

```bash
# Terminal 1 — API (H2 in-memory)
cd backend && mvn spring-boot:run

# Terminal 2 — UI
cd frontend && npm install && npm run dev
```

Open http://localhost:5173

| User | Password | Role |
|------|----------|------|
| admin | admin123 | ADMIN |
| support | support123 | SUPPORT |
| reader | reader123 | READ_ONLY |

## PostgreSQL (optional)

```bash
docker compose up -d
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

## What to demo in an interview

1. Login → JWT in `Authorization` header (lab uses localStorage; production prefers HttpOnly cookies)
2. Dashboard metrics
3. Payments: search debounce, filter, sort, URL state, server pagination
4. Payment detail → retry FAILED → optimistic UI → SSE `PROCESSING→SUCCESS`
5. `/labs/virtualized` — 10k rows with windowing
6. `/labs/concepts` — stale closure, AbortController, useTransition, memo

## Docs (interview)

| File | Purpose |
|------|---------|
| [REACT_CHEAT_SHEET.md](./REACT_CHEAT_SHEET.md) | 60-second memory rules |
| [REACT_INTERVIEW.md](./REACT_INTERVIEW.md) | Top 75 Qs with senior answers |
| [INTERVIEW_150.md](./INTERVIEW_150.md) | 150+ structured questions |
| [MOCK_INTERVIEW.md](./MOCK_INTERVIEW.md) | 5 rounds |
| [REACT_PERFORMANCE.md](./REACT_PERFORMANCE.md) | Problem → solution |
| [SECURITY.md](./SECURITY.md) | XSS/CSRF/CORS/JWT/secrets |
| [REACT_PATTERNS.md](./REACT_PATTERNS.md) | Practical patterns |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | React ↔ Spring / BFF |

## Misconceptions we correct

- Virtual DOM does **not** make React "always faster"
- `useMemo` / `useCallback` are **not** default optimisations
- Redux is **not** required for large apps
- Frontend route guards are **UX only** — Spring Security authorises
- `localStorage` JWT is fine for labs, risky for production auth
- Server Components need a framework (e.g. Next.js) — not plain Vite + Spring Boot

## Tests

```bash
cd backend && mvn test
cd frontend && npm test && npm run build
```
