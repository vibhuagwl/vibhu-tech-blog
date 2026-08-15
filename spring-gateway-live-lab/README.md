# Spring Gateway Live Lab — Interview Simulation

Java 21 · Spring Boot 3.3 · Spring Cloud Gateway · Eureka · progressive phases.

```text
Client → API Gateway :8080  ──lb://──►  User :8081 (user-1)
                     │              ├─ User :8083 (user-2)   ← Phase 3
                     │              ↘ Order :8082
                     └─ Eureka :8761
```

## Phase 1 — static routing (foundation)

`StripPrefix=1`, `AddRequestHeader=X-Gateway`, `CorrelationLoggingGlobalFilter`, `/api/public/ping`.

## Phase 2 — Eureka + `lb://`

| Component | Port | Role |
|-----------|------|------|
| `eureka-server` | 8761 | Registry |
| `user-service` | 8081 | Registers as `user-service` |
| `order-service` | 8082 | Registers as `order-service` |
| `api-gateway` | 8080 | `lb://user-service` / `lb://order-service` |

## Phase 3 (implemented) — multi-instance load balancing

| Piece | Detail |
|-------|--------|
| Second replica | `SERVER_PORT=8083 INSTANCE_ID=user-2` (same Eureka app name) |
| Proof | Response JSON includes `instance` + `port` |
| LB | Spring Cloud **RoundRobinLoadBalancer** (default) |
| Lab tuning | Gateway `spring.cloud.loadbalancer.cache.ttl=5s` + Eureka fetch every 3s |

**60-second demo (say this):**

1. Eureka already shows `USER-SERVICE` ×1  
2. Start replica 2 → Eureka shows ×2  
3. `curl` gateway 10× → `instance` flips `user-1` / `user-2`  
4. Kill replica 2 → after lease/cache refresh, traffic sticks to survivor (stale window = interview follow-up)

**Still open after kill:** Eureka lease (~90s) + LB cache can send to a dead instance until eviction — motivate health-check LB / shorter lease / circuit breaker (later phases).

**Not yet:** JWT, Redis rate limit, Resilience4j CB.

---

## Run

```bash
cd spring-gateway-live-lab

# Terminal 1
mvn -pl eureka-server spring-boot:run

# Terminals 2–4 (after Eureka is up)
mvn -pl user-service spring-boot:run
mvn -pl order-service spring-boot:run
mvn -pl api-gateway spring-boot:run

# Terminal 5 — Phase 3 second user replica
./scripts/start-user-2.sh
# equivalent: SERVER_PORT=8083 INSTANCE_ID=user-2 mvn -pl user-service spring-boot:run
```

Smoke:

```bash
./scripts/smoke-phase2.sh   # registry + single-hop paths
./scripts/smoke-phase3.sh   # expects ≥2 USER-SERVICE instances + RR distribution
```

Tests:

```bash
mvn -q clean test
```

> Do not add `src/test/resources/application.yml` — it shadows main config on Boot 2.4+. Tests disable Eureka via `@SpringBootTest(properties=…)`.

---

## Request flow (Phase 3)

```text
Client × N
  → Gateway
  → lb://user-service
  → RoundRobinLoadBalancer picks instance A or B from Eureka cache
  → /users/101 on :8081 or :8083
  → JSON { instance, port, … }
```

| Piece | What | Why | Internals |
|-------|------|-----|-----------|
| Same app name | Both replicas register `user-service` | One logical service id | Eureka `Application` has N `InstanceInfo` |
| Distinct instance-id | `user-service:8083:user-2` | Avoid clobbering peer | `eureka.instance.instance-id` |
| Round-robin | Alternate A/B | Fair share / demo proof | `RoundRobinLoadBalancer` |
| Cache TTL | 5s in lab | See new replica quickly | `CachingServiceInstanceListSupplier` |

---

## Interview phases

1. ~~Basic Gateway + StripPrefix + correlation~~  
2. ~~Eureka + `lb://user-service`~~  
3. ~~Multi-instance load balancing demo~~  
4. JWT at Gateway (+ discuss service re-validation)  
5. Roles `USER` / `ADMIN`  
6. Redis rate limit  
7. Circuit breaker + timeouts + retry debate  
8. Error JSON + CORS + versioning  
9. K8s Deployment/Ingress vs Gateway  

---

## 30-second answer (after Phase 3)

> “Two user replicas register under the same Eureka app id. The gateway keeps `lb://user-service`; RoundRobinLoadBalancer spreads calls across instance list. We prove it with `instance`/`port` in the JSON. If one dies, clients can still hit a stale entry until Eureka evicts — that’s why I’d add health-check LB and a circuit breaker next, then JWT at the edge.”
