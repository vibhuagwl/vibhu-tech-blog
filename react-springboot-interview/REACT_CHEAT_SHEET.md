# React Cheat Sheet (backend → frontend interview)

Draw these. Say these. Ship these.

## Memory rules

```text
Props        = parent → child input (read-only contract)
State        = component-owned changing data
useEffect    = synchronize with external systems (not "run logic")
useMemo      = cache a computed value (when proven expensive)
useCallback  = cache function identity (when child memo needs it)
useRef       = mutable box; .current change does NOT re-render
useReducer   = complex/related state transitions
Context      = share data without prop drilling (watch re-renders)
React.memo   = skip child render if props shallow-equal
TanStack Query = server-state cache (not UI state)
Redux        = centralized client/app state when justified
```

## Render pipeline (draw in 30s)

```text
setState / props / context
        ↓
   Render (pure)
        ↓
  Reconciliation (diff)
        ↓
      Commit
        ↓
   Browser paint
        ↓
     Effects
```

## State kinds (say this first)

```text
UI state      → modal open, selected tab          → useState / URL
Server state  → payments from API                 → TanStack Query
URL state     → ?status=FAILED&page=2             → React Router searchParams
Global app    → auth session, theme               → Context / Redux (sparingly)
```

## Hooks one-liners

| Hook | Interview line |
|------|----------------|
| useState | Schedules a re-render with new state |
| functional setState | `setN(n => n+1)` — safe when update depends on previous |
| useEffect | After paint; cleanup on dep change/unmount |
| StrictMode (dev) | Mount → unmount → remount to find impure effects |
| useOptimistic | Show pending UI; rollback on failure (React 19) |
| useTransition | Mark update non-urgent; keep input snappy |
| useDeferredValue | Defer derived expensive render behind urgent input |
| ref as prop (React 19) | Prefer `ref={}` on function components; forwardRef legacy |

## React ↔ Spring (draw)

```text
Browser
  → React
  → apiClient (Bearer / cookie)
  → BFF or Spring Boot
  → Service
  → DB
```

Never: browser talks to 20 microservices directly.

## Auth (honest answer)

```text
Frontend ProtectedRoute = UX hide
Spring Security         = real authorization
HttpOnly cookie + CSRF  = preferred production session style
localStorage JWT        = XSS-stealable; OK for lab demos only
```

## Failure vocabulary

```text
401 → re-login / refresh
403 → role insufficient (show message, don't retry as same user)
429 → respect Retry-After
5xx → toast + retry with backoff + cancel in-flight
stale response → AbortController / request id / Query cache
```

## Performance triage order

1. Fix unnecessary state / lift less
2. Server pagination + filter (not 10k DOM rows)
3. Virtualize long lists
4. Debounce search
5. Code-split routes (`lazy` + `Suspense`)
6. Then memo/useMemo where profiler proves need

## Keys

```text
key={payment.id}   ✅ stable identity
key={index}        ❌ breaks on insert/reorder
```
