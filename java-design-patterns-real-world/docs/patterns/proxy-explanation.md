# Proxy — Interview Explanation Board

> **Demo:** `PaymentServiceProxyDemo` — `src/main/java/com/example/designpatterns/structural/proxy/PaymentServiceProxyDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Proxy |
| **Category** | Structural |
| **One-line definition** | Provide a surrogate or placeholder that controls access to another object implementing the same interface. |
| **Problem class** | Need auth, caching, or lazy access in front of a real service without changing clients or core logic. |

## 2. Problem We Are Solving

Dashboard polls `fetchStatus(paymentId)` on every refresh. Without a gate:

- Every lookup hits `RealPaymentService` / payment DB
- Unauthorized callers reach real service with no token check
- Caching logic copy-pasted in every client

## 3. What Happens Without the Pattern

Direct `RealPaymentService` calls — no auth, no cache, DB overload, security gap.

Or duplicated `if (token) cache.get...` in each controller.

## 4. How the Pattern Solves It

1. **Subject** — `PaymentService` interface
2. **Real subject** — `RealPaymentService`
3. **Proxy** — `PaymentServiceProxy` implements same interface
4. **Controls access** — token must be `"ALLOW"`
5. **Caches** — `computeIfAbsent` on `paymentId` before delegate

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **Subject** | `PaymentService` | `fetchStatus(paymentId, token)` |
| **Real subject** | `RealPaymentService` | Actual DB/logic |
| **Proxy** | `PaymentServiceProxy` | Auth + cache + delegate |
| **Client** | `PaymentServiceProxyDemo.run()` | Uses proxy transparently |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `if (!"ALLOW".equals(token)) throw SecurityException` | Access control before delegate |
| `cache.computeIfAbsent(paymentId, id -> delegate.fetchStatus(...))` | Cache on successful auth path |
| `PaymentService proxy = new PaymentServiceProxy(new RealPaymentService())` | Transparent substitution |
| Second `fetchStatus("pay-9001", "ALLOW")` | Hits cache, not delegate |

## 7. Object/Class Diagram

```text
Client ──► PaymentService
              ▲           ▲
              │           │
    PaymentServiceProxy   RealPaymentService
    - delegate            (real subject)
    - cache
```

## 8. Runtime Execution Flow

```text
proxy = new PaymentServiceProxy(new RealPaymentService())

first = proxy.fetchStatus("pay-9001", "ALLOW")
  → token OK
  → cache miss → delegate → "SETTLED:pay-9001"

second = proxy.fetchStatus("pay-9001", "ALLOW")
  → token OK
  → cache hit → "SETTLED:pay-9001" (no delegate call)
```

Unauthorized token throws before cache or delegate.

## 9. What the Client Doesn't Need to Know

- Whether response came from cache or DB
- That proxy wraps real service
- Cache map structure

## 10. Before vs After

**Before:** Client → real service (no gate, no cache).

**After:** Client → proxy → (auth, cache) → real service.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **SRP** | Proxy controls access; real subject owns status logic |
| **DIP** | Client depends on `PaymentService` interface |
| **Open/Closed** | Add logging proxy without changing real subject |

## 12. Extensibility

- Virtual proxy: lazy-create expensive real subject
- Remote proxy: RMI/HTTP wrapper same interface
- Protection proxy: role-based tokens

## 13. Advantages

- Transparent access control and caching
- Real subject unchanged
- Same interface — client substitution easy

## 14. Disadvantages

- Extra indirection and latency on first call
- Stale cache if status changes
- vs Decorator: proxy **controls** access; decorator **adds** behavior

## 15. When to Use

1. Auth gate before payment status API
2. Cache expensive lookups
3. Lazy initialization of heavy service

## 16. When NOT to Use

1. Add behavior freely without access control — Decorator
2. Interface mismatch — Adapter

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Cache TTL | Status changes — evict or time-bound cache |
| Security | Token check on every call even if cached |
| Lazy init | Synchronize double-checked creation |
| Distributed cache | Cluster-wide proxy cache consistency |

## 18. Possible Code Improvements

**Required:** Cache TTL; invalidate on status update event.

**Optional:** Spring `@Cacheable` on real service with security filter.

## 19. Mental Model

**"Bouncer + memo pad."** Check ID at door; remember answer for repeat questions.

## 20. 30–60 Second Interview Answer

> Proxy provides a stand-in with the same interface that controls access to a real object. Dashboard status lookups hit the DB every refresh and skip auth. `PaymentServiceProxy` implements `PaymentService`, checks token equals ALLOW, then uses `computeIfAbsent` cache before delegating to `RealPaymentService`. Second call for same paymentId returns cached SETTLED without re-fetch. Clients use proxy transparently. Differs from Decorator — proxy controls access; decorator adds behavior.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| Proxy vs Decorator? | Proxy: access/lifecycle; Decorator: extra behavior |
| Virtual proxy? | Lazy-create expensive real subject on first use |
| Spring @Transactional? | Transactional proxy around beans |

**Common mistake:** Calling any wrapper a proxy — must control access/lifecycle, not just log.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.structural.proxy.PaymentServiceProxyDemo
```
