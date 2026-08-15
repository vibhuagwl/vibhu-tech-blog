# Proxy — Interview Explanation Board

> **Demo:** `PaymentServiceProxyDemo` — `src/main/java/com/example/designpatterns/structural/proxy/PaymentServiceProxyDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Proxy |
| **Category** | Structural |
| **One-line definition** | Provide a surrogate or placeholder that controls access to another object implementing the same interface. |
| **Problem class** | Cross-cutting **access control** — clients need the real service interface, but something must gate, cache, or delay access before delegation. |

## 2. Problem We Are Solving

A payments dashboard calls `fetchStatus(paymentId, token)` on every refresh:

```text
GET /status/pay-9001  →  PaymentService.fetchStatus("pay-9001", token)
```

Production pain points:

| Issue | Impact |
|-------|--------|
| No auth gate | Any caller with the interface hits `RealPaymentService` |
| No cache | Same `pay-9001` queried 50×/minute → 50 DB hits |
| Tight coupling | Every client must implement token check + cache if added later |

Example from demo:

- Authorized: `fetchStatus("pay-9001", "ALLOW")` → `"SETTLED:pay-9001"`
- Unauthorized: `fetchStatus("pay-9001", "DENY")` → `SecurityException`

The painful question:

> How do we add **authorization and caching** without changing the client code or duplicating checks in every dashboard widget?

Relationships that make this hard:

- **Client** — expects `PaymentService` interface only
- **Real subject** (`RealPaymentService`) — expensive DB lookup; no built-in cache
- **Proxy** — same interface; decides whether/when to delegate

## 3. What Happens Without the Pattern

Every client implements access + cache inline:

```java
// DashboardController
if (!"ALLOW".equals(token)) throw new SecurityException("unauthorized");
if (cache.containsKey(paymentId)) return cache.get(paymentId);
String status = realService.fetchStatus(paymentId, token);
cache.put(paymentId, status);
return status;

// MobileStatusWidget — copy-paste, slightly different cache
if (!token.equals("ALLOW")) return "error";
// forgot cache entirely — hammers DB

// AdminPanel — no auth check at all
return realService.fetchStatus(paymentId, token);
```

Concrete pains:

1. **Security holes** — one client skips token validation
2. **Duplicated caching** — inconsistent TTLs, unbounded maps per client
3. **DB overload** — dashboard auto-refresh multiplies identical queries
4. **Hard to swap implementation** — remote vs local service leaks to clients
5. **Testing burden** — every client tests auth and cache behavior

SOLID hits: **SRP** (UI owns display + security + caching), **OCP** (adding lazy-init edits all clients), **DIP** (clients depend on concrete `RealPaymentService`).

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — status lookups need auth + cache; clients shouldn't own that
2. **Naive pain** — copy-pasted token checks and `HashMap` caches everywhere
3. **Pattern introduces** — `PaymentServiceProxy` implements `PaymentService` like the real subject
4. **Proxy controls access** — reject bad token before delegate
5. **Proxy caches** — `computeIfAbsent` on `paymentId` avoids repeat DB hits
6. **Client simplifies** — `PaymentService svc = new PaymentServiceProxy(new RealPaymentService())`

Control logic moves **from clients into the proxy**.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Subject** | `PaymentService` (interface) | Common contract for real + proxy |
| **Real Subject** | `RealPaymentService` | Actual status lookup (`SETTLED:paymentId`) |
| **Proxy** | `PaymentServiceProxy` | Auth check + cache before delegate |
| **Client** | `PaymentServiceProxyDemo.run()` | Uses proxy transparently — same `fetchStatus` call |

This is a **protection proxy** (auth) combined with a **caching proxy**.

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `interface PaymentService { String fetchStatus(String paymentId, String token); }` | Subject — proxy and real share this |
| `private final PaymentService delegate` | Proxy wraps real subject via composition |
| `if (!"ALLOW".equals(token)) throw new SecurityException(...)` | Access control before any delegate or cache |
| `cache.computeIfAbsent(paymentId, id -> delegate.fetchStatus(id, token))` | Cache miss delegates once; hits skip real service |
| `PaymentService proxy = new PaymentServiceProxy(new RealPaymentService())` | Client binds to interface; proxy is transparent |

## 7. Object/Class Diagram

```text
┌─────────────────┐
│ Client          │
│ (dashboard)     │
└────────┬────────┘
         │ fetchStatus(paymentId, token)
         ▼
┌─────────────────────────────────────┐
│ PaymentServiceProxy                 │
│ - delegate: PaymentService          │
│ - cache: Map<String, String>        │
│ + fetchStatus(id, token)            │
│   1. validate token                 │
│   2. cache lookup / computeIfAbsent │
└────────┬────────────────────────────┘
         │ delegate on cache miss
         ▼
┌─────────────────────────────────────┐
│ RealPaymentService                  │
│ + fetchStatus(id, token)            │
│   → "SETTLED:" + paymentId          │
└─────────────────────────────────────┘
```

## 8. Runtime Execution Flow

From `PaymentServiceProxyDemo.run()`:

```text
Setup:
  proxy = PaymentServiceProxy(RealPaymentService())

First call — cache miss:
  proxy.fetchStatus("pay-9001", "ALLOW")
    token == "ALLOW" → pass auth
    cache miss on "pay-9001"
    delegate.fetchStatus("pay-9001", "ALLOW")
      → RealPaymentService returns "SETTLED:pay-9001"
    cache["pay-9001"] = "SETTLED:pay-9001"
  Output: First call: SETTLED:pay-9001

Second call — cache hit:
  proxy.fetchStatus("pay-9001", "ALLOW")
    token == "ALLOW" → pass auth
    cache hit on "pay-9001"
    return "SETTLED:pay-9001"  (no delegate call)
  Output: Cached call: SETTLED:pay-9001

Unauthorized call (not in demo run, but code path):
  proxy.fetchStatus("pay-9001", "DENY")
    token != "ALLOW"
    throw SecurityException("unauthorized")
    → delegate never called; cache untouched
```

## 9. What the Client Doesn't Need to Know

- That a proxy sits in front of `RealPaymentService`
- Cache existence, map type, or eviction policy
- That first call hits DB and second does not
- Token validation rules beyond passing `"ALLOW"`
- Whether tomorrow's subject is local, remote, or mocked

Client mental model: **`PaymentService.fetchStatus`** — same as always.

## 10. Before vs After

### Without Proxy

```text
Dashboard  ──► auth? cache? ──► RealPaymentService ──► DB
Mobile     ──► auth? (no cache) ──► RealPaymentService ──► DB
Admin      ──► (no auth) ──► RealPaymentService ──► DB
```

Each client **controls** access and caching ad hoc.

### With Proxy

```text
Dashboard ──┐
Mobile    ──┼──► PaymentServiceProxy ──► RealPaymentService ──► DB
Admin     ──┘         │
                  auth + cache
                  (centralized)
```

**Proxy controls access; clients do not.**

## 11. SOLID / Design Principles

| Principle | How Proxy applies |
|-----------|------------------|
| **Single Responsibility** | Real subject owns status logic; proxy owns access + cache |
| **Open/Closed** | Add logging proxy or remote proxy without changing client |
| **Liskov** | Proxy substitutable anywhere `PaymentService` is expected |
| **Dependency Inversion** | Client depends on `PaymentService`, not `RealPaymentService` |
| **Interface Segregation** | Thin subject interface — proxy doesn't force extra methods |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| TTL cache | `LoadingCache` with expiry instead of `HashMap` | Stale status until TTL |
| Remote service | Remote proxy implements `PaymentService` via HTTP | Virtual proxy variant |
| Lazy init | Proxy creates `RealPaymentService` on first authorized call | Virtual proxy — watch thread safety |
| Logging | Another proxy layer or combine in one class | Multiple proxies can chain (careful with order) |

Do not reimplement `SETTLED:` business logic in proxy — only control access and delegation.

## 13. Advantages

- Transparent to client — same interface
- Centralized security and caching
- Protects expensive real subject from abuse
- Easy to inject mock proxy in tests
- Supports virtual (lazy), remote, and protection variants

## 14. Disadvantages

- Extra indirection — one more hop per call
- Stale cache if status changes — need TTL or invalidation
- Proxy can grow into god-object (auth + cache + log + retry)
- Debugging "why no DB call?" requires knowing proxy layer exists
- Wrong proxy in DI wiring → subtle production bugs

## 15. When to Use

1. Authorization before expensive `fetchStatus` (this demo)
2. Caching read-heavy, rarely-changing data
3. Lazy initialization of costly `RealPaymentService`
4. Remote proxy — RMI, HTTP client implementing same interface
5. Smart references — counting, locking, copy-on-write

## 16. When NOT to Use

1. Need to **add arbitrary behavior** to every method call — Decorator intent is clearer
2. Interface mismatch between client and service — use Adapter
3. Framework AOP (`@Cacheable`, `@PreAuthorize`) already applies uniformly
4. Caching needs distributed consistency — use Redis + dedicated cache layer
5. Only one caller — inline check may suffice

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Stale cache** | No TTL | Invalidate on status webhook; or short TTL |
| **Cache key** | `paymentId` only | Include tenant/shard in key |
| **Auth** | Binary `"ALLOW"` token | JWT validation, RBAC, audit denied attempts |
| **Thread safety** | `HashMap` not thread-safe | `ConcurrentHashMap` for multi-thread dashboard |
| **Cache size** | Unbounded | LRU cap; don't OOM on many IDs |
| **Token on cache hit** | Auth runs every call | Good — don't skip auth on cached path (demo does this) |

## 18. Possible Code Improvements

### Required (correctness)

- `ConcurrentHashMap` for thread-safe cache
- Cache TTL or event-driven invalidation when payment settles

### Optional (clarity / prod)

- Separate `AuthorizationProxy` and `CachingProxy` in a chain
- Metrics: cache hit rate, auth rejection count
- Real JWT validation instead of `"ALLOW"` string
- `@Cacheable` on `RealPaymentService` if Spring already in stack

## 19. Mental Model

**Formula:**

```text
Problem:  Clients need service API but access must be controlled
Solution: Proxy implements same interface, gates then delegates
Benefit:  Security + cache in one place; client unchanged
```

Memory trick: **"Bodyguard at the door — same reception desk, checks ID first."**

## 20. 30–60 Second Interview Answer

> **Proxy** provides a surrogate with the same interface as the real object, controlling access before delegation. Our dashboard calls `PaymentService.fetchStatus(paymentId, token)` constantly. Without Proxy, every client copy-pastes token checks and caching — and some skip auth, overloading the DB. `PaymentServiceProxy` implements `PaymentService`, wraps `RealPaymentService`, validates `token == "ALLOW"`, then uses `cache.computeIfAbsent` so repeat lookups for `pay-9001` don't hit the real service. First call returns `SETTLED:pay-9001` from delegate; second call returns cached value. Unauthorized tokens throw `SecurityException` before delegate or cache. Clients inject `PaymentService` and don't know they're talking to a proxy. It's not Decorator — we're not adding business behavior, we're controlling access and caching.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Proxy vs Decorator? | Proxy **controls access** to subject; Decorator **adds responsibilities** to interface |
| Proxy vs Adapter? | Proxy same interface; Adapter **changes** interface to match client |
| Virtual proxy? | Lazy-create expensive `RealPaymentService` on first authorized call |
| Remote proxy? | Local proxy implements interface; network call to remote subject |
| Double proxy problem? | Spring `@Transactional` self-invocation — related concept, different context |

**Common mistake:** Calling every wrapper a Proxy — if you're converting `LegacyApi` to `ModernService`, that's Adapter.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.structural.proxy.PaymentServiceProxyDemo
```
