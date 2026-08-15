# Spring Gateway Live Lab — Interview Simulation

Java 21 · Spring Boot 3.3 · Spring Cloud Gateway · local Eureka **or** real AWS (ECS + ALB + Cloud Map).

```text
LOCAL (Phases 1–3)                         AWS (profile=aws) — no Eureka
Client → Gateway → lb:// → User/Order      Internet → ALB → Gateway → Cloud Map DNS → User/Order
              ↘ Eureka                              (ECS Fargate)
```

## AWS deployment (production-ready path — no Eureka)

| Piece | Implementation |
|-------|----------------|
| Edge | Public ALB + optional HTTPS + **WAF rate limit** |
| App FT | Timeouts, GET retry, **Resilience4j CircuitBreaker**, fallbacks |
| East-west | **Internal ALB** path-routes `/users*` / `/orders*` |
| Scale | ECS autoscaling (CPU + ALB RPS), min 2 / max 6 |
| Ops | CloudWatch alarms, deployment circuit breaker |
| IaC | `aws/terraform/` |

```bash
docker compose -f docker-compose.aws.yml up --build   # local stand-in
# real account: see aws/README.md
```

**Account deploy:** [`aws/README.md`](aws/README.md).

---

## Local learning path (Eureka)

### Phase 1 — static routing

`StripPrefix=1`, `AddRequestHeader=X-Gateway`, `CorrelationLoggingGlobalFilter`, `/api/public/ping`.

### Phase 2 — Eureka + `lb://`

| Component | Port | Role |
|-----------|------|------|
| `eureka-server` | 8761 | Registry |
| `user-service` | 8081 | Registers as `user-service` |
| `order-service` | 8082 | Registers as `order-service` |
| `api-gateway` | 8080 | `lb://user-service` / `lb://order-service` |

### Phase 3 — multi-instance LB

Second replica: `./scripts/start-user-2.sh` (`:8083`, `INSTANCE_ID=user-2`).  
Proof: JSON `instance` + `port` via RoundRobinLoadBalancer.  
Smoke: `./scripts/smoke-phase3.sh`.

### Run local Eureka stack

```bash
cd spring-gateway-live-lab
mvn -pl eureka-server spring-boot:run
mvn -pl user-service spring-boot:run
mvn -pl order-service spring-boot:run
mvn -pl api-gateway spring-boot:run
./scripts/start-user-2.sh   # optional Phase 3
```

```bash
mvn -q clean test
./scripts/smoke-phase2.sh
./scripts/smoke-phase3.sh
```

> Do not add `src/test/resources/application.yml` — it shadows main config on Boot 2.4+.

---

## Interview phases

1. ~~Basic Gateway + StripPrefix + correlation~~  
2. ~~Eureka + `lb://`~~ (local learning)  
3. ~~Multi-instance LB~~ (local)  
4. ~~AWS production: internal ALB, CB/timeouts, WAF, autoscaling~~  
5. JWT at Gateway  
6. Roles / Redis rate limit / CB / K8s  

---

## 30-second answers

**Local:** Eureka + `lb://` + RoundRobin across replicas.

**AWS:**  

> “No Eureka. Public ALB terminates client traffic to Spring Cloud Gateway. Downstream URIs are env vars pointing at Cloud Map or an internal ALB. Scaling is ECS desiredCount; health is ALB target-group checks.”
