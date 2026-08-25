# Payment Ops Dashboard (React 19 + Vite)

Interview-oriented SPA for a senior Java/Spring engineer preparing for React questions. Talks to the Spring Boot Payment Ops API under `/api`.

## Stack

- React 19 + TypeScript + Vite
- react-router-dom v7
- TanStack Query v5 (server state)
- Redux Toolkit (auth + small payment UI slice)
- TanStack Virtual (10k-row lab)
- react-hook-form (create payment)

## Prerequisites

1. Node 20+
2. Spring Boot backend on `http://localhost:8080` exposing `/api/**`

## Run

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Vite proxies `/api` → `http://localhost:8080` (see `vite.config.ts`). Optionally set `VITE_API_URL` in `.env` (see `.env.example`) if you are not using the proxy.

## Demo logins

| User    | Password    | Role      |
|---------|-------------|-----------|
| admin   | admin123    | ADMIN     |
| support | support123  | SUPPORT   |
| reader  | reader123   | READ_ONLY |

JWT is stored in `localStorage` under `poi_token` **for the lab only**. Production should prefer HttpOnly cookies from Spring Security.

## Scripts

| Script           | Purpose                |
|------------------|------------------------|
| `npm run dev`    | Dev server :5173       |
| `npm run build`  | Typecheck + production |
| `npm test`       | Vitest (RTL)           |
| `npm run preview`| Preview production build |

## Routes

- `/login`
- `/dashboard` — metrics
- `/payments` — search (debounced), status filter, sort, pagination, URL query state
- `/payments/:id` — detail + transactions + optimistic retry
- `/transactions`
- `/admin` — ADMIN only (frontend RoleRoute; Spring must enforce)
- `/labs/virtualized` — 10k virtual rows
- `/labs/concepts` — React interview demos

Frontend `ProtectedRoute` / `RoleRoute` are **UX only**. Real authorization is Spring Security.

## Against the backend

1. Start Spring Boot on port 8080.
2. `npm run dev` in this folder.
3. Sign in with a demo user; calls go to `/api/...` via the proxy.
