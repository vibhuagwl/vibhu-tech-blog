# Mock Interview — 5 Rounds (Staff / Principal)

Use with the running Payment Ops lab. Prefer drawing + pointing at code.

---

## Round 1 — React fundamentals

**Q1. What is React?**  
Expected: UI library for composing components; declarative UI = f(state). Not a full framework.  
Follow-up: SPA vs framework (Next.js)?  
Senior: React = rendering + reconciliation. Routing/data/SSR come from ecosystem or frameworks.

**Q2. Props vs state?**  
Expected: props in, state owned. Don't mutate props.  
Follow-up: lifting state?  
Senior: lift only as far as shared consumers need; URL for shareable filters.

**Q3. What happens after setState?**  
Expected: schedule update → render → reconcile → commit → paint → effects.  
Follow-up: batching?  
Senior: React 18+ batches in event handlers and many async contexts; functional updates when depending on previous.

**Q4. Why keys?**  
Expected: identity for reconciliation. Index keys break on reorder.  
Follow-up: missing key warning?  
Senior: keys should be stable among siblings; not globally unique forever.

**Q5. Controlled vs uncontrolled input?**  
Expected: value+onChange vs defaultValue+ref.  
Senior: forms that validate/disable → controlled or RHF; file input often uncontrolled.

---

## Round 2 — Hooks + rendering

**Q1. Rules of Hooks — why order matters?**  
Expected: React stores hooks in call order per component fiber. Conditionals break mapping.  
Senior: custom hooks are just functions that call hooks — same rules.

**Q2. useEffect twice in dev?**  
Expected: StrictMode remount to surface missing cleanup.  
Senior: production once; design effects idempotent with cleanup (AbortController).

**Q3. Stale closure?**  
Expected: effect/timeout captured old `count`.  
Fix: deps, functional update, refs for latest without rerender.  
Point at: `/labs/concepts`.

**Q4. useMemo vs useCallback?**  
Expected: value vs function identity.  
Senior: premature memo is noise; justify with memoized children or expensive calc.

**Q5. Context vs Redux?**  
Expected: Context for low-churn; Redux for complex client transitions + tooling; Query for server.  
Senior: don't put payment lists in Redux by default.

---

## Round 3 — Performance

**Q1. Optimize a 10k payment table.**  
Expected: virtualize viewport; don't mount 10k nodes.  
Senior: for 1M rows, server pagination + indexes first; virtualization is presentation.

**Q2. Search box lag.**  
Expected: debounce network; useTransition/deferred for local filter.  
Senior: distinguish network cost vs render cost.

**Q3. How do you know what to optimize?**  
Expected: React Profiler, slow API waterfall, Lighthouse.  
Senior: fix waterfalls and overfetching before micro-memo.

**Q4. Code splitting?**  
Expected: lazy routes + Suspense.  
Senior: split on route/feature boundaries; measure chunk sizes.

**Q5. Why not memo everything?**  
Expected: shallow compare cost; props instability (inline objects) defeats memo.

---

## Round 4 — React + Spring Boot

**Q1. End-to-end auth.**  
Expected: login → JWT/cookie → Authorization → Spring Security → roles.  
Senior: frontend guard ≠ authorization; demonstrate reader 403 on retry.

**Q2. CORS?**  
Expected: browser enforces; preflight for Authorization; allowlist.  
Senior: credentials + `*` is invalid; BFF same-origin avoids CORS.

**Q3. Optimistic retry on payments.**  
Expected: UI flips immediately; rollback on error; idempotency key on backend.  
Senior: money movement — optimistic only for safe UX states; backend is source of truth + SSE confirm.

**Q4. Stale response race.**  
Expected: AbortController / request id / Query.  
Point at concepts lab + apiClient.

**Q5. Error contract.**  
Expected: `{code,message,traceId}`; map to UI; correlate logs.

---

## Round 5 — Senior architecture

**Q1. Design enterprise React payment dashboard.**  
Cover: routing, Query for server state, thin global auth, BFF, observability, testing pyramid, feature flags, progressive rollout.

**Q2. React talks to 20 microservices?**  
Expected: BFF/API gateway aggregates; browser one origin.  
Draw mermaid from ARCHITECTURE.md.

**Q3. 1M transactions.**  
Expected: server filter/page/sort; DB indexes; virtualize page; never download million rows.

**Q4. Real-time status.**  
Expected: Kafka → service → SSE/WebSocket → React cache update.  
SSE for one-way status.

**Q5. Backend is slow — frontend?**  
Expected: skeletons, cache, pagination, debounce, cancel, timeout, degrade gracefully — don't hide SLOs forever.
