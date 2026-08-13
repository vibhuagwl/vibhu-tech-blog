import type {GwTopic} from './types';

export const TOPICS_C: GwTopic[] = [
  {
    id: 'observe',
    title: 'Observability · Status Codes · Troubleshoot',
    badge: 'Troubleshoot',
    problem: 'Is 504 the gateway or the database?',
    whenToUse: 'Every production API incident touching the edge.',
    whenAvoid: 'Blaming the gateway because it returned the status.',
    mermaid: `flowchart TD
  P[API Problem] --> R{GW received?}
  R -->|NO| DNS[DNS/WAF/TLS]
  R -->|YES| S{Status}
  S --> S4xx[Auth CORS Rate Route]
  S --> S5xx[Backend LB Service]
  S --> S2xx[Slow? Trace]`,
    code: `{"gateway":"api-gateway-1","route":"/payments","method":"POST",
 "status":504,"latencyMs":5234,"traceId":"abc123","backend":"payment-service"}

Dashboard: RPS · p50/p95/p99 · 4xx/5xx · 429 · 502/503/504 ·
  backend latency · GW latency · CPU/mem · conn · auth fails · RL rejects

| Code | Area | First check |
| 401 | Auth | Token/authorizer |
| 403 | AuthZ/WAF | Policy |
| 404 | Routing | Route/stage |
| 429 | Throttle | Quotas/spike/bots |
| 502 | Integration | Target connect |
| 503 | Availability | Healthy targets |
| 504 | Timeout | Downstream latency |

Gateway often REPORTS failure — prove with traces (GW span vs DB span).`,
    failure: 'Raising GW timeout to hide DB slowness.',
    production: 'Deploy markers on graphs; alarms on 429 and 5xx ratios.',
    interview30s: 'Use status tree + traces; 504 usually downstream; 429 is policy working.',
    followUp: 'CORS symptom vs real 500?',
    tradeoff: 'Log volume vs forensic detail.',
    memoryTrick: 'Gateway speaks · traces prove.',
  },
  {
    id: 'banking',
    title: 'Banking Payment Flow Through Gateway',
    badge: 'Example',
    problem: 'Walk POST /payments from browser to PostgreSQL on a whiteboard.',
    whenToUse: 'Architect interviews and production runbooks.',
    whenAvoid: 'Caching payment GET/POST aggressively at gateway.',
    mermaid: `flowchart TD
  U[Customer] --> FE[Angular/Mobile] --> CF[CloudFront] --> WAF --> GW
  GW --> JWT & RL & IDEM
  GW --> ALB --> PAY[Payment Service]
  PAY --> ACC[Account] & REDIS & KAFKA & PG[(PostgreSQL)]`,
    code: `POST /payments
1 TLS  2 AuthN  3 AuthZ  4 Rate limit
5 Idempotency-Key check  6 Route  7 LB
8 Process  9 DB TX  10 Kafka event  11 Response

Scenario 504: GW p99↑ ALB time↑ service p99↑ DB latency↑ DB CPU↑
  → root often DB; gateway is messenger

Scenario 429: quota / spike / bots / retry storm → fix quota + client backoff
Scenario 503: no healthy targets → probes/SG/deploy/discovery
Scenario bad deploy: canary metrics worse → shift 100% stable / rollback`,
    failure: 'Duplicate charge without idempotency when edge retries.',
    production: 'End-to-end budget sheet; payment routes never cached as success.',
    interview30s: 'Edge policies then ALB then payment; money path needs idempotency + truthful status.',
    followUp: 'Where does idempotency store live?',
    tradeoff: 'Edge aggregation vs direct service calls for internal admins.',
    memoryTrick: 'Same 11 steps every time on the board.',
  },
  {
    id: 'scenarios',
    title: 'Production Failure Playbook Cards',
    badge: 'Incidents',
    problem: 'Rapid recall for gateway-related outages.',
    whenToUse: 'War room and interview scenarios.',
    whenAvoid: 'Restarting gateway before checking downstream traces.',
    mermaid: `flowchart LR
  F[Failure] --> D[Detect] --> M[Metrics/Logs] --> RC[Root] --> MIT[Mitigate] --> REC[Recover]`,
    code: `1 Instance crash → LB removes → others serve → ASG/HPA
2 Cluster fail → DNS/failover region if designed
3 Bad config → 404/loop → rollback GitOps config
4 Backend fail → 502/503/504 → fix service not only GW
5 LB fail → multi-LB/DNS
6 DNS/TLS → dig / openssl · rotate cert
7 IdP fail → fail closed + JWKS cache policy
8 Redis RL store fail → fail-open vs closed decision (document!)
9 Discovery fail → stale endpoints → 502
10 Spike → RL + shed + scale backend
11 Retry storm → disable GW retries
12 Mem/CPU/conn exhaust → scale + find leak
13 Deploy regression → canary off / rollback
14 AZ fail → multi-AZ
15 Region fail → Route53 + dual GW (DR plan)

Security checklist: TLS AuthZ WAF RL validation CORS headers audit secrets least-priv
Attacks: DDoS credential stuffing injection oversized payload replay API abuse`,
    failure: 'Fail-open rate limiter during Redis outage without recording risk.',
    production: 'Write explicit fail-open/closed policy per dependency.',
    interview30s: 'Card per failure: detect → evidence → mitigate → recover → prevent.',
    followUp: 'Should RL fail open?',
    tradeoff: 'Availability vs abuse during store outage.',
    memoryTrick: 'Fifteen gateway nightmares — one recovery pattern.',
  },
];
