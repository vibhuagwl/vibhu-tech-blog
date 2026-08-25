# React Interview — Top Questions (senior answers)
Format: Question → 30s → Code → Diagram → Why → Mistake → Follow-up → Senior.
Runnable demos: `frontend/` + `backend/`.

## 1. What is React?
**30 SECOND ANSWER**

A UI library: components describe UI as a function of state. Framework features (router, SSR) are separate.

**CODE**

```tsx
function App(){ return <PaymentsPage/> }
```

**DIAGRAM**

```text
JSX → elements → reconcile → DOM
```

**WHY**

Declarative UI reduces manual DOM ops.

**COMMON MISTAKE**

Calling React a 'MVC framework'.

**FOLLOW-UP**

How does concurrent rendering change this?

**SENIOR-LEVEL ANSWER**

React schedules/interruptible renders; still a library — Next.js adds RSC/SSR.

## 2. Why React?
**30 SECOND ANSWER**

Component model, ecosystem, hiring market, unidirectional data flow is easy to reason about for ops UIs.

**CODE**

```tsx
const ui = render(state)
```

**DIAGRAM**

```text
state→view
```

**WHY**

Fits dashboards with frequent server data.

**COMMON MISTAKE**

SPA for everything including marketing SEO without a plan.

**FOLLOW-UP**

When would you pick Svelte/Vue?

**SENIOR-LEVEL ANSWER**

Team skill + ecosystem; React wins on hiring for many banks.

## 3. What is JSX?
**30 SECOND ANSWER**

Syntax sugar that compiles to React element creation — not HTML.

**CODE**

```tsx
const el = <h1>Hello</h1>
```

**DIAGRAM**

```text
JSX→element→DOM
```

**WHY**

Expressions in `{}`; must have one parent or Fragment.

**COMMON MISTAKE**

Thinking JSX is sent to the browser as HTML tags.

**FOLLOW-UP**

JSX vs React.createElement?

**SENIOR-LEVEL ANSWER**

Same result; JSX is ergonomics.

## 4. Props vs state?
**30 SECOND ANSWER**

Props are inputs from parent; state is owned and triggers re-render when set.

**CODE**

```tsx
function Card({payment}){ const [open,setOpen]=useState(false) }
```

**DIAGRAM**

```text
Parent→props; state local
```

**WHY**

Immutability: copy then set.

**COMMON MISTAKE**

Mutating props or state in place.

**FOLLOW-UP**

Derived state anti-pattern?

**SENIOR-LEVEL ANSWER**

Prefer compute during render; syncing state to props often bugs.

## 5. What causes a re-render?
**30 SECOND ANSWER**

State change, parent render, context change, or force (rare).

**CODE**

```tsx
setCount(c=>c+1)
```

**DIAGRAM**

```text
setState→render
```

**WHY**

Render ≠ DOM commit; bail out if same state reference/primitive.

**COMMON MISTAKE**

Assuming props change always means DOM rewrite.

**FOLLOW-UP**

How to prevent?

**SENIOR-LEVEL ANSWER**

State placement, memo, Query select.

## 6. What happens after setState?
**30 SECOND ANSWER**

Schedule update → render → reconcile → commit → paint → effects.

**CODE**

```tsx
setStatus('PROCESSING')
```

**DIAGRAM**

```text
pipeline diagram
```

**WHY**

Async; don't read state immediately after set.

**COMMON MISTAKE**

Awaiting setState.

**FOLLOW-UP**

Automatic batching?

**SENIOR-LEVEL ANSWER**

Yes in React 18+ for more contexts.

## 7. What is reconciliation?
**30 SECOND ANSWER**

Diff previous and next element trees; decide minimal DOM updates.

**CODE**

```tsx
key={p.id}
```

**DIAGRAM**

```text
old tree→new tree→DOM ops
```

**WHY**

Keys identify siblings.

**COMMON MISTAKE**

Using index keys on sortable lists.

**FOLLOW-UP**

Fiber?

**SENIOR-LEVEL ANSWER**

Units of work enabling incremental render.

## 8. What is Virtual DOM?
**30 SECOND ANSWER**

In-memory element tree React uses to compute updates — not a magic speedup.

**CODE**

```tsx
element object graph
```

**DIAGRAM**

```text
VDOM≠always faster
```

**WHY**

Direct DOM can be faster for tiny updates; React optimizes developer UX + batching.

**COMMON MISTAKE**

"VDOM always faster than DOM".

**FOLLOW-UP**

Compilers?

**SENIOR-LEVEL ANSWER**

React Compiler can memoize automatically in supporting setups.

## 9. Why are keys important?
**30 SECOND ANSWER**

Stable identity so React matches list items correctly across renders.

**CODE**

```tsx
payments.map(p=> <Row key={p.id} />)
```

**DIAGRAM**

```text
id keys
```

**WHY**

Prevents state bleed between rows.

**COMMON MISTAKE**

Math.random() keys.

**FOLLOW-UP**

Keys on Fragments?

**SENIOR-LEVEL ANSWER**

Allowed when mapping Fragments.

## 10. Why not index as key?
**30 SECOND ANSWER**

Insert/delete/reorder reuses wrong component state.

**CODE**

```tsx
bad: key={i}
```

**DIAGRAM**

```text
reorder bug
```

**WHY**

OK only for static never-reordered lists.

**COMMON MISTAKE**

Using index "for now" on live data.

**FOLLOW-UP**

UUID on create?

**SENIOR-LEVEL ANSWER**

Yes if server id not yet known — replace later carefully.

## 11. useState vs useReducer?
**30 SECOND ANSWER**

Simple independent values vs related transitions with actions.

**CODE**

```tsx
useReducer(paymentReducer, init)
```

**DIAGRAM**

```text
actions→reducer→state
```

**WHY**

Prefer reducer when next state depends on many fields.

**COMMON MISTAKE**

Twenty useStates that drift.

**FOLLOW-UP**

Redux relationship?

**SENIOR-LEVEL ANSWER**

Simple independent values vs related transitions with actions. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 12. useEffect?
**30 SECOND ANSWER**

Synchronize with external systems after paint; declare deps; return cleanup.

**CODE**

```tsx
useEffect(()=>{const c=new AbortController(); fetch(u,{signal:c.signal}); return ()=>c.abort()},[u])
```

**DIAGRAM**

```text
render→commit→effect
```

**WHY**

Not for transforming data for render.

**COMMON MISTAKE**

Fetching without abort.

**FOLLOW-UP**

Is effect the data layer?

**SENIOR-LEVEL ANSWER**

Synchronize with external systems after paint; declare deps; return cleanup. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 13. Why does useEffect run twice in development?
**30 SECOND ANSWER**

StrictMode remounts to find missing cleanup.

**CODE**

```tsx
cleanup abort/unsubscribe
```

**DIAGRAM**

```text
dev-only double invoke
```

**WHY**

Fix cleanup, don't disable StrictMode casually.

**COMMON MISTAKE**

Guarding with global 'ran' flags.

**FOLLOW-UP**

Production?

**SENIOR-LEVEL ANSWER**

StrictMode remounts to find missing cleanup. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 14. What is StrictMode?
**30 SECOND ANSWER**

Dev-only checks: double invoke effects, warn on deprecated APIs.

**CODE**

```tsx
<StrictMode><App/></StrictMode>
```

**DIAGRAM**

```text
dev checks
```

**WHY**

Helps purity.

**COMMON MISTAKE**

Thinking it changes prod behavior.

**FOLLOW-UP**

React 19 StrictMode nuances?

**SENIOR-LEVEL ANSWER**

Dev-only checks: double invoke effects, warn on deprecated APIs. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 15. useMemo vs useCallback?
**30 SECOND ANSWER**

Memoize value vs memoize function identity.

**CODE**

```tsx
useMemo(()=>filter(p,s),[p,s]); useCallback(fn,[deps])
```

**DIAGRAM**

```text
cache value vs fn
```

**WHY**

Only when expensive or needed for memo children.

**COMMON MISTAKE**

Wrapping everything.

**FOLLOW-UP**

Compiler?

**SENIOR-LEVEL ANSWER**

Memoize value vs memoize function identity. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 16. React.memo?
**30 SECOND ANSWER**

HOC/shallow compare props to skip re-render.

**CODE**

```tsx
const Row=memo(function Row({p}){...})
```

**DIAGRAM**

```text
parent render↛child if props equal
```

**WHY**

Inline object props break it.

**COMMON MISTAKE**

memo without stable callbacks.

**FOLLOW-UP**

When worthless?

**SENIOR-LEVEL ANSWER**

HOC/shallow compare props to skip re-render. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 17. useRef?
**30 SECOND ANSWER**

Mutable box surviving renders without causing render; also DOM nodes.

**CODE**

```tsx
const r=useRef(null); r.current.focus()
```

**DIAGRAM**

```text
ref vs state
```

**WHY**

Previous value pattern.

**COMMON MISTAKE**

Using ref for values that should drive UI.

**FOLLOW-UP**

React 19 ref prop?

**SENIOR-LEVEL ANSWER**

Mutable box surviving renders without causing render; also DOM nodes. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 18. Context API?
**30 SECOND ANSWER**

Share value without prop drilling via Provider.

**CODE**

```tsx
const Auth=createContext(null)
```

**DIAGRAM**

```text
Provider→consumers
```

**WHY**

Any consumer re-renders on value change.

**COMMON MISTAKE**

Putting fast-changing lists in context.

**FOLLOW-UP**

Split contexts?

**SENIOR-LEVEL ANSWER**

Share value without prop drilling via Provider. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 19. Context vs Redux?
**30 SECOND ANSWER**

Context = DIY DI; Redux = store+actions+middleware+devtools.

**CODE**

```tsx
dispatch→reducer→store→selector
```

**DIAGRAM**

```text
choose by complexity
```

**WHY**

Both can overused.

**COMMON MISTAKE**

Redux for all server data.

**FOLLOW-UP**

Modern default?

**SENIOR-LEVEL ANSWER**

Context = DIY DI; Redux = store+actions+middleware+devtools. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 20. Redux vs Context?
**30 SECOND ANSWER**

Same comparison flipped — Redux when many complex client updates need structure.

**CODE**

```tsx
createSlice
```

**DIAGRAM**

```text
slice→store
```

**WHY**

Boilerplate cost.

**COMMON MISTAKE**

Redux Toolkit still "too heavy" for tiny apps.

**FOLLOW-UP**

RTK Query?

**SENIOR-LEVEL ANSWER**

Same comparison flipped — Redux when many complex client updates need structure. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 21. Local state vs global state?
**30 SECOND ANSWER**

Keep state local until multiple distant consumers need it.

**CODE**

```tsx
useState in page
```

**DIAGRAM**

```text
local first
```

**WHY**

Global everything becomes coupling.

**COMMON MISTAKE**

URL as shared state?

**FOLLOW-UP**

Great for filters.

**SENIOR-LEVEL ANSWER**

Keep state local until multiple distant consumers need it. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 22. Client state vs server state?
**30 SECOND ANSWER**

Client owned by UI; server owned by API/cache with staleness.

**CODE**

```tsx
useQuery vs useState
```

**DIAGRAM**

```text
server≠UI
```

**WHY**

Duplicating server lists in Redux.

**COMMON MISTAKE**

Source of truth?

**FOLLOW-UP**

Server + cache.

**SENIOR-LEVEL ANSWER**

Client owned by UI; server owned by API/cache with staleness. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 23. Why use React Query/TanStack Query?
**30 SECOND ANSWER**

Caching, dedupe, retry, stale/revalidate, mutations, invalidation.

**CODE**

```tsx
useQuery({queryKey,queryFn})
```

**DIAGRAM**

```text
cache keys
```

**WHY**

Removes hand-rolled useEffect fetch bugs.

**COMMON MISTAKE**

Ignoring queryKey design.

**FOLLOW-UP**

vs SWR?

**SENIOR-LEVEL ANSWER**

Caching, dedupe, retry, stale/revalidate, mutations, invalidation. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 24. What is a custom hook?
**30 SECOND ANSWER**

Function starting with use that composes hooks — reusable stateful logic, not UI.

**CODE**

```tsx
function usePayments(f){...}
```

**DIAGRAM**

```text
hook≠component
```

**WHY**

Share logic across pages.

**COMMON MISTAKE**

Conditional hooks inside.

**FOLLOW-UP**

Testing?

**SENIOR-LEVEL ANSWER**

Function starting with use that composes hooks — reusable stateful logic, not UI. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 25. Rules of Hooks?
**30 SECOND ANSWER**

Top level only; same order every render; only React functions/custom hooks.

**CODE**

```tsx
if(x) useState() // forbidden
```

**DIAGRAM**

```text
order = identity
```

**WHY**

Breaks fiber hook list.

**COMMON MISTAKE**

Creative loop of hooks.

**FOLLOW-UP**

ESLint plugin?

**SENIOR-LEVEL ANSWER**

Top level only; same order every render; only React functions/custom hooks. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 26. What is stale closure?
**30 SECOND ANSWER**

Callback closed over old state/props from previous render.

**CODE**

```tsx
setTimeout(()=>console.log(count),1000)
```

**DIAGRAM**

```text
closure capture
```

**WHY**

Functional updates / refs / correct deps.

**COMMON MISTAKE**

Empty deps forever with changing values.

**FOLLOW-UP**

Demo?

**SENIOR-LEVEL ANSWER**

Callback closed over old state/props from previous render. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 27. How do you prevent unnecessary renders?
**30 SECOND ANSWER**

State placement, split context, memo carefully, selectors, avoid new object props.

**CODE**

```tsx
memo(Row)
```

**DIAGRAM**

```text
profile first
```

**WHY**

Don't guess.

**COMMON MISTAKE**

memo everywhere.

**FOLLOW-UP**

React Compiler?

**SENIOR-LEVEL ANSWER**

State placement, split context, memo carefully, selectors, avoid new object props. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 28. How do you optimize a large table?
**30 SECOND ANSWER**

Virtualize; server page/filter; stable row components.

**CODE**

```tsx
useVirtualizer
```

**DIAGRAM**

```text
10k→visible
```

**WHY**

Don't fetch 1M.

**COMMON MISTAKE**

Client-only filter on huge arrays.

**FOLLOW-UP**

Window vs pagination?

**SENIOR-LEVEL ANSWER**

Virtualize; server page/filter; stable row components. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 29. How do you implement pagination?
**30 SECOND ANSWER**

Server-side page/size; mirror in URL; Previous/Next.

**CODE**

```tsx
GET /payments?page=0&size=20
```

**DIAGRAM**

```text
server page
```

**WHY**

Client page only for tiny lists.

**COMMON MISTAKE**

Off-by-one pages.

**FOLLOW-UP**

Cursor vs offset?

**SENIOR-LEVEL ANSWER**

Server-side page/size; mirror in URL; Previous/Next. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 30. Debounce vs throttle?
**30 SECOND ANSWER**

Debounce: wait for quiet; throttle: max once per interval.

**CODE**

```tsx
debounce 300ms search
```

**DIAGRAM**

```text
type→wait→API
```

**WHY**

Search=debounce; scroll=throttle.

**COMMON MISTAKE**

Debouncing button submits incorrectly.

**FOLLOW-UP**

vs useDeferredValue?

**SENIOR-LEVEL ANSWER**

Debounce: wait for quiet; throttle: max once per interval. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 31. How do you handle API errors?
**30 SECOND ANSWER**

Typed error contract; status-specific UX; traceId.

**CODE**

```tsx
apiClient maps code/message
```

**DIAGRAM**

```text
401/403/429/5xx
```

**WHY**

Reusable ErrorState.

**COMMON MISTAKE**

alert(e).

**FOLLOW-UP**

Retry policy?

**SENIOR-LEVEL ANSWER**

Typed error contract; status-specific UX; traceId. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 32. How do you handle loading states?
**30 SECOND ANSWER**

Loading/Empty/Error/Success components; skeletons for layout.

**CODE**

```tsx
<LoadingState/>
```

**DIAGRAM**

```text
explicit states
```

**WHY**

Avoid flash with isFetching vs isLoading.

**COMMON MISTAKE**

if(loading) only.

**FOLLOW-UP**

Suspense?

**SENIOR-LEVEL ANSWER**

Loading/Empty/Error/Success components; skeletons for layout. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 33. Error Boundary?
**30 SECOND ANSWER**

Class/boundary catching render errors in subtree; fallback UI.

**CODE**

```tsx
componentDidCatch
```

**DIAGRAM**

```text
render errors
```

**WHY**

Not for event handlers/async — those need try/catch.

**COMMON MISTAKE**

Expecting it to catch fetch failures.

**FOLLOW-UP**

React 19?

**SENIOR-LEVEL ANSWER**

Class/boundary catching render errors in subtree; fallback UI. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 34. Suspense?
**30 SECOND ANSWER**

Declarative loading UI for lazy and supporting data sources.

**CODE**

```tsx
<Suspense fallback={<Loading/>}>
```

**DIAGRAM**

```text
lazy boundary
```

**WHY**

Not automatic for every promise without a library.

**COMMON MISTAKE**

Wrapping arbitrary fetch.

**FOLLOW-UP**

RSC?

**SENIOR-LEVEL ANSWER**

Declarative loading UI for lazy and supporting data sources. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 35. Lazy loading?
**30 SECOND ANSWER**

Dynamically import code when needed.

**CODE**

```tsx
lazy(()=>import('./PaymentDetails'))
```

**DIAGRAM**

```text
chunk load
```

**WHY**

Route-level splits.

**COMMON MISTAKE**

Over-splitting tiny files.

**FOLLOW-UP**

Prefetch?

**SENIOR-LEVEL ANSWER**

Dynamically import code when needed. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 36. Code splitting?
**30 SECOND ANSWER**

Multiple bundles to cut initial JS.

**CODE**

```tsx
route-based lazy
```

**DIAGRAM**

```text
initial↓
```

**WHY**

Measure.

**COMMON MISTAKE**

One giant vendor forever.

**FOLLOW-UP**

HTTP/2?

**SENIOR-LEVEL ANSWER**

Multiple bundles to cut initial JS. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 37. useTransition?
**30 SECOND ANSWER**

Mark state update non-urgent so urgent input stays responsive.

**CODE**

```tsx
startTransition(()=>setFilter(v))
```

**DIAGRAM**

```text
urgent vs transition
```

**WHY**

Concurrent feature.

**COMMON MISTAKE**

Using for network fetch control.

**FOLLOW-UP**

isPending?

**SENIOR-LEVEL ANSWER**

Mark state update non-urgent so urgent input stays responsive. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 38. useDeferredValue?
**30 SECOND ANSWER**

Defer derived value behind urgent updates.

**CODE**

```tsx
const d=useDeferredValue(search)
```

**DIAGRAM**

```text
input snappy
```

**WHY**

Local expensive render.

**COMMON MISTAKE**

Confusing with debounce network.

**FOLLOW-UP**

When both?

**SENIOR-LEVEL ANSWER**

Defer derived value behind urgent updates. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 39. CSR vs SSR?
**30 SECOND ANSWER**

CSR: JS builds UI in browser. SSR: HTML from server then hydrate.

**CODE**

```tsx
see ARCHITECTURE
```

**DIAGRAM**

```text
SEO/first paint tradeoffs
```

**WHY**

Vite SPA here is CSR.

**COMMON MISTAKE**

SSR without hydration plan.

**FOLLOW-UP**

Spring SSR React?

**SENIOR-LEVEL ANSWER**

CSR: JS builds UI in browser. SSR: HTML from server then hydrate. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 40. Hydration?
**30 SECOND ANSWER**

Attach React to server HTML.

**CODE**

```tsx
SSR HTML + JS → interactive
```

**DIAGRAM**

```text
mismatch warnings
```

**WHY**

IDs/dates/random cause mismatch.

**COMMON MISTAKE**

Ignoring mismatches.

**FOLLOW-UP**

Partial hydrate?

**SENIOR-LEVEL ANSWER**

Attach React to server HTML. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 41. React Server Components?
**30 SECOND ANSWER**

Components render on server; no client bundle for them — framework feature (e.g. Next.js).

**CODE**

```tsx
Server vs Client components
```

**DIAGRAM**

```text
not in Vite SPA by default
```

**WHY**

Don't claim Spring Boot gives RSC.

**COMMON MISTAKE**

"RSC = SSR".

**FOLLOW-UP**

When useful?

**SENIOR-LEVEL ANSWER**

Components render on server; no client bundle for them — framework feature (e.g. Next.js). In production I'd measure, enforce on the server, and document the failure mode for payments.

## 42. How does React communicate with Spring Boot?
**30 SECOND ANSWER**

HTTPS JSON via apiClient; auth headers/cookies; OpenAPI contracts.

**CODE**

```tsx
paymentApi.getPayments()
```

**DIAGRAM**

```text
React→API→Service→DB
```

**WHY**

DTO contracts.

**COMMON MISTAKE**

Calling JPA entities.

**FOLLOW-UP**

GraphQL?

**SENIOR-LEVEL ANSWER**

HTTPS JSON via apiClient; auth headers/cookies; OpenAPI contracts. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 43. How do you handle authentication?
**30 SECOND ANSWER**

Login endpoint issues session/JWT; client sends credential; server validates every request.

**CODE**

```tsx
POST /auth/login
```

**DIAGRAM**

```text
login→token→API
```

**WHY**

Refresh strategy.

**COMMON MISTAKE**

Only hiding UI.

**FOLLOW-UP**

OAuth?

**SENIOR-LEVEL ANSWER**

Login endpoint issues session/JWT; client sends credential; server validates every request. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 44. JWT vs cookie?
**30 SECOND ANSWER**

JWT often in Authorization header; cookie auto-sent; cookie needs CSRF story.

**CODE**

```tsx
Bearer vs Set-Cookie
```

**DIAGRAM**

```text
tradeoffs
```

**WHY**

Pick threat model.

**COMMON MISTAKE**

JWT in localStorage as default prod.

**FOLLOW-UP**

Opaque session?

**SENIOR-LEVEL ANSWER**

JWT often in Authorization header; cookie auto-sent; cookie needs CSRF story. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 45. Where should tokens be stored?
**30 SECOND ANSWER**

Prefer HttpOnly Secure cookie or BFF memory; localStorage XSS-vulnerable.

**CODE**

```tsx
lab: localStorage; prod: cookie/BFF
```

**DIAGRAM**

```text
XSS risk
```

**WHY**

Never localStorage for long-lived refresh if XSS possible.

**COMMON MISTAKE**

memory-only token?

**FOLLOW-UP**

Lost on refresh — UX tradeoff.

**SENIOR-LEVEL ANSWER**

Prefer HttpOnly Secure cookie or BFF memory; localStorage XSS-vulnerable. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 46. What is CORS?
**30 SECOND ANSWER**

Browser gate on cross-origin reads; server allowlists.

**CODE**

```tsx
Origin + ACAO
```

**DIAGRAM**

```text
preflight OPTIONS
```

**WHY**

Server config.

**COMMON MISTAKE**

CORS as authZ.

**FOLLOW-UP**

Same-site BFF?

**SENIOR-LEVEL ANSWER**

Browser gate on cross-origin reads; server allowlists. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 47. What is CSRF?
**30 SECOND ANSWER**

Browser attaches cookies to cross-site requests — attacker triggers action.

**CODE**

```tsx
SameSite + CSRF token
```

**DIAGRAM**

```text
cookie sessions
```

**WHY**

JWT in header less CSRF (not cookie).

**COMMON MISTAKE**

Ignoring CSRF with cookies.

**FOLLOW-UP**

Spring Security CSRF?

**SENIOR-LEVEL ANSWER**

Browser attaches cookies to cross-site requests — attacker triggers action. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 48. What is XSS?
**30 SECOND ANSWER**

Attacker script runs as user — steals tokens/DOM.

**CODE**

```tsx
encode output; CSP
```

**DIAGRAM**

```text
stored/reflected/DOM
```

**WHY**

dangerouslySetInnerHTML risk.

**COMMON MISTAKE**

Trusting innerHTML from API.

**FOLLOW-UP**

HttpOnly helps?

**SENIOR-LEVEL ANSWER**

Attacker script runs as user — steals tokens/DOM. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 49. How do you protect APIs?
**30 SECOND ANSWER**

AuthN + AuthZ every request; validate input; rate limit; TLS.

**CODE**

```tsx
SecurityFilterChain
```

**DIAGRAM**

```text
gateway→service
```

**WHY**

Defense in depth.

**COMMON MISTAKE**

Network trust alone.

**FOLLOW-UP**

mTLS?

**SENIOR-LEVEL ANSWER**

AuthN + AuthZ every request; validate input; rate limit; TLS. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 50. How do you implement RBAC?
**30 SECOND ANSWER**

Roles on user; enforce on server; mirror in UI.

**CODE**

```tsx
ADMIN/SUPPORT/READ_ONLY
```

**DIAGRAM**

```text
UI hide + 403
```

**WHY**

Permissions > roles at scale.

**COMMON MISTAKE**

Only frontend checks.

**FOLLOW-UP**

ABAC?

**SENIOR-LEVEL ANSWER**

Roles on user; enforce on server; mirror in UI. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 51. How do you handle 401?
**30 SECOND ANSWER**

Clear session; redirect login; optionally refresh once.

**CODE**

```tsx
apiClient 401 handler
```

**DIAGRAM**

```text
re-auth
```

**WHY**

Avoid loops.

**COMMON MISTAKE**

Infinite refresh.

**FOLLOW-UP**

Distinguish expired vs invalid.

**SENIOR-LEVEL ANSWER**

Clear session; redirect login; optionally refresh once. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 52. How do you handle 403?
**30 SECOND ANSWER**

Show forbidden; don't retry same creds; audit.

**CODE**

```tsx
RoleRoute + toast
```

**DIAGRAM**

```text
authZ fail
```

**WHY**

Different from 401.

**COMMON MISTAKE**

Treating as 401.

**FOLLOW-UP**

Partial UI?

**SENIOR-LEVEL ANSWER**

Show forbidden; don't retry same creds; audit. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 53. How do you handle 429?
**30 SECOND ANSWER**

Read Retry-After; backoff; disable submit; surface message.

**CODE**

```tsx
RateLimitFilter
```

**DIAGRAM**

```text
Retry-After
```

**WHY**

Client respect.

**COMMON MISTAKE**

Hammering retry.

**FOLLOW-UP**

Gateway vs app limit?

**SENIOR-LEVEL ANSWER**

Read Retry-After; backoff; disable submit; surface message. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 54. How do you implement optimistic updates?
**30 SECOND ANSWER**

Update UI before server confirms; rollback on error.

**CODE**

```tsx
useOptimistic / Query onMutate
```

**DIAGRAM**

```text
click→UI→API
```

**WHY**

Payments need idempotency.

**COMMON MISTAKE**

Optimistic money without rollback.

**FOLLOW-UP**

SSE confirm?

**SENIOR-LEVEL ANSWER**

Update UI before server confirms; rollback on error. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 55. How do you handle duplicate payment requests?
**30 SECOND ANSWER**

Idempotency-Key; dedupe server-side; disable double submit.

**CODE**

```tsx
Idempotency-Key header
```

**DIAGRAM**

```text
exactly-once UX
```

**WHY**

Backend dedupe table.

**COMMON MISTAKE**

Only disabling button.

**FOLLOW-UP**

At-least-once?

**SENIOR-LEVEL ANSWER**

Idempotency-Key; dedupe server-side; disable double submit. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 56. How do you handle stale API responses?
**30 SECOND ANSWER**

AbortController; ignore outdated request ids; Query cancels.

**CODE**

```tsx
abort on dep change
```

**DIAGRAM**

```text
A then B race
```

**WHY**

Demo in concepts lab.

**COMMON MISTAKE**

Last-write-wins bugs.

**FOLLOW-UP**

Query keys?

**SENIOR-LEVEL ANSWER**

AbortController; ignore outdated request ids; Query cancels. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 57. How do you implement real-time updates?
**30 SECOND ANSWER**

SSE/WebSocket/push; update Query cache.

**CODE**

```tsx
usePaymentEvents
```

**DIAGRAM**

```text
Kafka→SSE→React
```

**WHY**

Fallback poll.

**COMMON MISTAKE**

Poll every 100ms.

**FOLLOW-UP**

Fanout scale?

**SENIOR-LEVEL ANSWER**

SSE/WebSocket/push; update Query cache. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 58. SSE vs WebSocket?
**30 SECOND ANSWER**

SSE: server→client HTTP; WS: bidirectional.

**CODE**

```tsx
EventSource
```

**DIAGRAM**

```text
status feeds→SSE
```

**WHY**

WS for chat/games.

**COMMON MISTAKE**

SSE with broken proxies.

**FOLLOW-UP**

Auth on SSE?

**SENIOR-LEVEL ANSWER**

SSE: server→client HTTP; WS: bidirectional. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 59. How do you scale a React application?
**30 SECOND ANSWER**

Code split; CDN; BFF; cache; performance budgets; design system; monorepo optional.

**CODE**

```tsx
lazy routes
```

**DIAGRAM**

```text
edge CDN
```

**WHY**

Org scale ≠ Redux.

**COMMON MISTAKE**

Microfrontends first.

**FOLLOW-UP**

Edge SSR?

**SENIOR-LEVEL ANSWER**

Code split; CDN; BFF; cache; performance budgets; design system; monorepo optional. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 60. How do you structure a large React application?
**30 SECOND ANSWER**

By feature folders; shared ui/utils; thin pages; hooks/services.

**CODE**

```tsx
features/payments/*
```

**DIAGRAM**

```text
feature-first
```

**WHY**

Avoid dump components/.

**COMMON MISTAKE**

Deep inheritance.

**FOLLOW-UP**

Module boundaries?

**SENIOR-LEVEL ANSWER**

By feature folders; shared ui/utils; thin pages; hooks/services. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 61. How do you manage shared components?
**30 SECOND ANSWER**

Design system package; document props; a11y; visual tests.

**CODE**

```tsx
PaymentRow in components/
```

**DIAGRAM**

```text
reuse
```

**WHY**

Don't premature abstract.

**COMMON MISTAKE**

God Button props.

**FOLLOW-UP**

Versioning?

**SENIOR-LEVEL ANSWER**

Design system package; document props; a11y; visual tests. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 62. How do you manage API contracts?
**30 SECOND ANSWER**

OpenAPI/DTO versioning; consumer tests; additive changes.

**CODE**

```tsx
PaymentResponse record
```

**DIAGRAM**

```text
contract first
```

**WHY**

Frontend owns types from OpenAPI.

**COMMON MISTAKE**

Hand-sync forever.

**FOLLOW-UP**

Breaking change?

**SENIOR-LEVEL ANSWER**

OpenAPI/DTO versioning; consumer tests; additive changes. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 63. How do you test React?
**30 SECOND ANSWER**

RTL user flows; Vitest unit; MSW HTTP; Playwright e2e sparingly.

**CODE**

```tsx
render + userEvent
```

**DIAGRAM**

```text
behavior>impl
```

**WHY**

This lab: Vitest+RTL.

**COMMON MISTAKE**

Enzyme shallow everything.

**FOLLOW-UP**

Pyramid?

**SENIOR-LEVEL ANSWER**

RTL user flows; Vitest unit; MSW HTTP; Playwright e2e sparingly. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 64. Unit test vs integration test?
**30 SECOND ANSWER**

Unit: isolated function/component; integration: several units + MSW.

**CODE**

```tsx
PaymentRow test vs page+MSW
```

**DIAGRAM**

```text
scope
```

**WHY**

Both.

**COMMON MISTAKE**

Only e2e.

**FOLLOW-UP**

Flaky e2e?

**SENIOR-LEVEL ANSWER**

Unit: isolated function/component; integration: several units + MSW. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 65. React Testing Library philosophy?
**30 SECOND ANSWER**

Test what users see/do; avoid internals.

**CODE**

```tsx
getByRole
```

**DIAGRAM**

```text
a11y queries
```

**WHY**

Resilient tests.

**COMMON MISTAKE**

Testing state variables.

**FOLLOW-UP**

Snapshots?

**SENIOR-LEVEL ANSWER**

Test what users see/do; avoid internals. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 66. What should not be mocked?
**30 SECOND ANSWER**

Prefer not mocking large React internals; mock network boundary.

**CODE**

```tsx
MSW
```

**DIAGRAM**

```text
boundary mocks
```

**WHY**

Overmock hides bugs.

**COMMON MISTAKE**

Mocking everything.

**FOLLOW-UP**

Real router?

**SENIOR-LEVEL ANSWER**

Prefer not mocking large React internals; mock network boundary. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 67. How do you implement frontend observability?
**30 SECOND ANSWER**

traceId, route, latency, errors, actions — no PII.

**CODE**

```tsx
X-Trace-Id
```

**DIAGRAM**

```text
correlate BE
```

**WHY**

RUM + logs.

**COMMON MISTAKE**

console.log secrets.

**FOLLOW-UP**

OpenTelemetry?

**SENIOR-LEVEL ANSWER**

traceId, route, latency, errors, actions — no PII. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 68. How do you debug performance?
**30 SECOND ANSWER**

Profiler, network waterfall, why-did-you-render sparingly, flamecharts.

**CODE**

```tsx
React Profiler
```

**DIAGRAM**

```text
measure
```

**WHY**

Fix biggest win.

**COMMON MISTAKE**

Blind memo.

**FOLLOW-UP**

INP/LCP?

**SENIOR-LEVEL ANSWER**

Profiler, network waterfall, why-did-you-render sparingly, flamecharts. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 69. How do you handle feature flags?
**30 SECOND ANSWER**

Flag service; short-circuit UI; server must enforce too.

**CODE**

```tsx
if(flag) <Admin/>
```

**DIAGRAM**

```text
progressive
```

**WHY**

Flags in backend for authZ features.

**COMMON MISTAKE**

Frontend-only kill switch for payments.

**FOLLOW-UP**

Cleanup old flags?

**SENIOR-LEVEL ANSWER**

Flag service; short-circuit UI; server must enforce too. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 70. How do you perform gradual rollout?
**30 SECOND ANSWER**

% cohorts; monitor errors/latency; rollback.

**CODE**

```tsx
canary deploy
```

**DIAGRAM**

```text
observe
```

**WHY**

FE + BE compatible.

**COMMON MISTAKE**

Big bang Friday.

**FOLLOW-UP**

Schema migrate?

**SENIOR-LEVEL ANSWER**

% cohorts; monitor errors/latency; rollback. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 71. How do you handle backward-compatible APIs?
**30 SECOND ANSWER**

Additive JSON fields; tolerate unknowns; version path when breaking.

**CODE**

```tsx
v1/v2
```

**DIAGRAM**

```text
compat
```

**WHY**

Consumer-driven contracts.

**COMMON MISTAKE**

Rename fields casually.

**FOLLOW-UP**

Mobile clients?

**SENIOR-LEVEL ANSWER**

Additive JSON fields; tolerate unknowns; version path when breaking. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 72. Microfrontend architecture?
**30 SECOND ANSWER**

Independent deployable FE slices; module federation / iframes / imports.

**CODE**

```tsx
host + remotes
```

**DIAGRAM**

```text
org scale
```

**WHY**

Shared deps hard.

**COMMON MISTAKE**

Default for small teams.

**FOLLOW-UP**

When?

**SENIOR-LEVEL ANSWER**

Independent deployable FE slices; module federation / iframes / imports. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 73. When should you NOT use microfrontends?
**30 SECOND ANSWER**

Small team, tight coupling, no platform investment — complexity tax.

**CODE**

```tsx
modular monolith SPA
```

**DIAGRAM**

```text
cost>benefit
```

**WHY**

Ops overhead.

**COMMON MISTAKE**

Resume-driven MFEs.

**FOLLOW-UP**

Alternatives?

**SENIOR-LEVEL ANSWER**

Small team, tight coupling, no platform investment — complexity tax. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 74. How would you design a React payment dashboard?
**30 SECOND ANSWER**

Feature modules; Query; BFF; RBAC; SSE; virtualized tables; audit trails; strong empty/error.

**CODE**

```tsx
this repo
```

**DIAGRAM**

```text
draw architecture
```

**WHY**

Idempotent retries.

**COMMON MISTAKE**

One Redux for all.

**FOLLOW-UP**

Compliance?

**SENIOR-LEVEL ANSWER**

Feature modules; Query; BFF; RBAC; SSE; virtualized tables; audit trails; strong empty/error. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 75. How would you design React for 10 million users?
**30 SECOND ANSWER**

CDN edge; code split; BFF cache; horizontal API; pagination; perf budgets; feature flags; multi-region.

**CODE**

```tsx
edge+BFF
```

**DIAGRAM**

```text
scale tiers
```

**WHY**

FE can't fix bad data model.

**COMMON MISTAKE**

Giant bundle.

**FOLLOW-UP**

Offline?

**SENIOR-LEVEL ANSWER**

CDN edge; code split; BFF cache; horizontal API; pagination; perf budgets; feature flags; multi-region. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 76. ref as a prop in React 19?
**30 SECOND ANSWER**

Function components can take `ref` like any prop; forwardRef mostly legacy.

**CODE**

```tsx
function Input({ref}){...}
```

**DIAGRAM**

```text
React 19
```

**WHY**

Cleanup functions on refs supported.

**COMMON MISTAKE**

Teaching only forwardRef.

**FOLLOW-UP**

TypeScript?

**SENIOR-LEVEL ANSWER**

Function components can take `ref` like any prop; forwardRef mostly legacy. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 77. useOptimistic?
**30 SECOND ANSWER**

React 19 hook for optimistic UI while async action runs.

**CODE**

```tsx
const [opt,setOpt]=useOptimistic(data)
```

**DIAGRAM**

```text
pending UI
```

**WHY**

Pairs with Actions.

**COMMON MISTAKE**

Skipping rollback.

**FOLLOW-UP**

vs Query optimistic?

**SENIOR-LEVEL ANSWER**

React 19 hook for optimistic UI while async action runs. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 78. What is an Error Boundary not catching?
**30 SECOND ANSWER**

Event handlers, async, SSR some cases, itself errors.

**CODE**

```tsx
try/catch in handlers
```

**DIAGRAM**

```text
limits
```

**WHY**

Boundaries for render.

**COMMON MISTAKE**

Relying alone.

**FOLLOW-UP**

logging?

**SENIOR-LEVEL ANSWER**

Event handlers, async, SSR some cases, itself errors. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 79. URL state why?
**30 SECOND ANSWER**

Shareable/bookmarkable filters; back button; refresh-safe.

**CODE**

```tsx
?status=FAILED&page=2
```

**DIAGRAM**

```text
URL as store
```

**WHY**

Payments page pattern.

**COMMON MISTAKE**

Only Redux filters.

**FOLLOW-UP**

Security?

**SENIOR-LEVEL ANSWER**

Shareable/bookmarkable filters; back button; refresh-safe. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 80. BFF pattern?
**30 SECOND ANSWER**

Backend-for-frontend aggregates/shapes APIs for one client.

**CODE**

```tsx
React→BFF→services
```

**DIAGRAM**

```text
one origin
```

**WHY**

Mobile BFF may differ.

**COMMON MISTAKE**

God BFF forever.

**FOLLOW-UP**

GraphQL BFF?

**SENIOR-LEVEL ANSWER**

Backend-for-frontend aggregates/shapes APIs for one client. In production I'd measure, enforce on the server, and document the failure mode for payments.

## 81. Idempotency for retries?
**30 SECOND ANSWER**

Same key → same side effect; store response.

**CODE**

```tsx
Idempotency-Key
```

**DIAGRAM**

```text
payment safe retry
```

**WHY**

Required for money POST.

**COMMON MISTAKE**

Retry without key.

**FOLLOW-UP**

TTL of keys?

**SENIOR-LEVEL ANSWER**

Same key → same side effect; store response. In production I'd measure, enforce on the server, and document the failure mode for payments.
