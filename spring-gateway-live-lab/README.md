# Spring Gateway Live Lab — Interview Simulation

Java 21 · Spring Boot 3.3 · Spring Cloud Gateway · Eureka · progressive phases.

```text
Client → API Gateway :8080  ──lb://──►  User (Eureka)
                     │              ↘ Order (Eureka)
                     └─ discovers via Eureka :8761
```

## Phase 1 — static routing (kept as foundation)

| Path | Downstream |
|------|------------|
| `GET /api/users/**` | path rewrite `StripPrefix=1` |
| `GET /api/orders/**` | same |
| `GET /api/public/ping` | Gateway itself |

Also: `AddRequestHeader=X-Gateway`, `CorrelationLoggingGlobalFilter`.

## Phase 2 (implemented) — Eureka + `lb://`

| Component | Port | Role |
|-----------|------|------|
| `eureka-server` | 8761 | Service registry |
| `user-service` | 8081 | Registers as `user-service` |
| `order-service` | 8082 | Registers as `order-service` |
| `api-gateway` | 8080 | Client of Eureka; routes `lb://user-service` / `lb://order-service` |

**What changed vs Phase 1**

| Layer | Change |
|-------|--------|
| Eureka | New module; services register + heartbeat |
| Gateway URI | `http://localhost:8081` → `lb://user-service` |
| Gateway deps | `eureka-client` + `loadbalancer` |
| Failure mode still open | Stale registry / cold start before register — need retries/timeouts later |

**Not yet:** multi-instance demo, JWT, Redis rate limit, Resilience4j CB.

---

## Run (4 terminals)

```bash
cd spring-gateway-live-lab

# Terminal 1 — registry first
mvn -pl eureka-server spring-boot:run

# Terminal 2–3 — wait until Eureka UI http://localhost:8761 is up
mvn -pl user-service spring-boot:run
mvn -pl order-service spring-boot:run

# Terminal 4 — after USER-SERVICE / ORDER-SERVICE appear in Eureka
mvn -pl api-gateway spring-boot:run
```

Optional second user instance (preview of Phase 3 load balancing):

```bash
SERVER_PORT=8083 INSTANCE_ID=user-2 mvn -pl user-service spring-boot:run
# then curl /api/users/101 a few times — watch "instance" field flip
```

Smoke:

```bash
chmod +x scripts/smoke-phase2.sh
./scripts/smoke-phase2.sh
```

Tests (Eureka disabled via `@SpringBootTest` properties — do not add `src/test/resources/application.yml` or it shadows main config in Boot 2.4+):

```bash
mvn -q test
```

---

## Request flow (Phase 2 — say this in the interview)

```text
Client HTTP
  → Gateway Netty/WebFlux
  → Path predicate /api/users/**
  → GlobalFilter (correlation) → StripPrefix → AddRequestHeader
  → LoadBalancerFilter resolves lb://user-service via Eureka registry
  → Proxy to chosen instance host:port /users/101
  → User MVC → response back through Gateway
```

**What / Why / Internals**

| Piece | What | Why | Internals |
|-------|------|-----|-----------|
| Eureka Server | Registry | Dynamic host/port | Heartbeats + lease eviction |
| Eureka Client | Register + fetch | No hardcoded peer URLs | `DiscoveryClient` cache |
| `lb://user-service` | Logical service id | Survive redeploy / scale-out | `ReactiveLoadBalancerClientFilter` |
| LoadBalancer | Pick instance | Round-robin by default | Spring Cloud LoadBalancer (not Ribbon) |

---

## Interview phases

1. ~~Basic Gateway + routes + StripPrefix + correlation~~  
2. ~~Eureka + `lb://user-service`~~  
3. Multi-instance load balancing demo (optional `SERVER_PORT=8083` above)  
4. JWT at Gateway (+ discuss service re-validation)  
5. Roles `USER` / `ADMIN`  
6. Redis rate limit  
7. Circuit breaker + timeouts + retry debate  
8. Error JSON + CORS + versioning  
9. K8s Deployment/Ingress vs Gateway  

---

## 30-second answer (after Phase 2)

> “Services register with Eureka. The gateway no longer hardcodes host:port — routes use `lb://user-service`, and Spring Cloud LoadBalancer picks a healthy instance from the registry. StripPrefix and GlobalFilters stay the same. Next I’d prove multi-instance routing, then put JWT and rate limits at the edge.”
