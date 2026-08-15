# Spring Gateway Live Lab — Interview Simulation

Java 21 · Spring Boot 3.3 · Spring Cloud Gateway · progressive phases.

```text
Client → API Gateway :8080 → User :8081
                          ↘ Order :8082
```

## Phase 1 (implemented) — static routing

| Path | Downstream |
|------|------------|
| `GET /api/users/**` | `http://localhost:8081/users/**` (`StripPrefix=1`) |
| `GET /api/orders/**` | `http://localhost:8082/orders/**` |
| `GET /api/public/ping` | Gateway itself (no hop) |

Also included (interview-relevant, still Phase 1 sized):

- `StripPrefix=1` path transform
- `AddRequestHeader=X-Gateway`
- `CorrelationLoggingGlobalFilter` (`X-Correlation-ID` + latency log, non-blocking)

**Not yet:** Eureka, `lb://`, JWT, Redis rate limit, Resilience4j CB — add only when the interviewer asks.

---

## Run (3 terminals)

```bash
cd spring-gateway-live-lab

# Terminal 1
mvn -pl user-service spring-boot:run

# Terminal 2
mvn -pl order-service spring-boot:run

# Terminal 3
mvn -pl api-gateway spring-boot:run
```

Smoke:

```bash
chmod +x scripts/smoke-phase1.sh
./scripts/smoke-phase1.sh
```

Or:

```bash
curl -i http://localhost:8080/api/users/101
curl -i http://localhost:8080/api/orders/5001
curl -i http://localhost:8080/api/public/ping
```

Tests:

```bash
mvn -q test
```

---

## Request flow (say this in the interview)

```text
Client HTTP
  → Netty (WebFlux) receives on Gateway
  → Route Predicate matches Path=/api/users/**
  → Filter chain: GlobalFilter (correlation) → StripPrefix → AddRequestHeader
  → Handler proxies to http://localhost:8081/users/101
  → User Service MVC controller
  → Response flows back through Gateway to Client
```

**What / Why / Internals**

| Piece | What | Why | Internals |
|-------|------|-----|-----------|
| Route | id + uri + predicates + filters | Map external path to service | `RouteDefinitionRouteLocator` |
| Predicate | `Path=/api/users/**` | Match when to use this route | `PathRoutePredicateFactory` |
| `StripPrefix=1` | Drop `/api` | Service keeps `/users` contract | Rewrites request path before proxy |
| GlobalFilter | All routes | Cross-cutting (correlation, logs) | Ordered in filter chain on `ServerWebExchange` |
| WebFlux/Netty | Reactive runtime | Gateway is non-blocking | Do not block event loop |

---

## Interview phases (next commits)

1. ~~Basic Gateway + routes~~  
2. ~~StripPrefix + correlation~~  
3. Eureka + `lb://USER-SERVICE`  
4. Multi-instance load balancing demo  
5. JWT at Gateway (+ discuss service re-validation)  
6. Roles `USER` / `ADMIN`  
7. Redis rate limit  
8. Circuit breaker + timeouts + retry debate  
9. Error JSON + CORS + versioning  
10. K8s Deployment/Ingress vs Gateway  

---

## 30-second answer (after Phase 1)

> “Clients hit Spring Cloud Gateway. Predicates match `/api/users/**` and `/api/orders/**`, StripPrefix rewrites to the service path, and we proxy over HTTP. Cross-cutting concerns—correlation ID, logging—live as GlobalFilters on the Netty/WebFlux stack. Discovery, JWT, and rate limits come after this path works.”
