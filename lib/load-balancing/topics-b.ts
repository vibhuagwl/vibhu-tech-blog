import type {LbTopic} from './types';

export const TOPICS_B: LbTopic[] = [
  {
    id: 'sticky',
    title: 'Sticky Sessions / Session Affinity',
    badge: 'Affinity',
    problem: 'HttpSession on App-1; next request must return or state is lost.',
    whenToUse: 'Legacy session-in-memory apps during migration.',
    whenAvoid: 'New banking services — prefer stateless + Redis/DB session.',
    mermaid: `flowchart TD
  U[User A] --> LB --> A1[App-1]
  U2[User A again] --> LB --> A1
  CRASH[App-1 crash] --> LOST[Session lost]
  FIX[Redis Session Store] --> OK[Any app serves User A]`,
    code: `// Spring Session + Redis (preferred over stickiness)
// application.yml
spring:
  session:
    store-type: redis

// ALB can enable stickiness cookie — use as bridge only
// Architect answer: make apps stateless; sticky is a crutch.`,
    failure: 'Sticky + crash = logout storms; uneven sticky hotspots.',
    production: 'Spring Session Redis; JWT/stateless APIs for payments.',
    interview30s: 'Sticky pins a user to one instance; shared session store removes the need.',
    followUp: 'ALB stickiness cookie duration?',
    tradeoff: 'Easy legacy lift vs resilience.',
    memoryTrick: 'Sticky = always the same teller — until that teller is sick.',
  },
  {
    id: 'health',
    title: 'Health Checks · Liveness · Readiness',
    badge: 'Ops',
    problem: 'LB must stop sending traffic to dead or not-ready payment pods.',
    whenToUse: 'Always — ALB target health + K8s probes.',
    whenAvoid: 'Health that returns 200 while DB is down for traffic that needs DB.',
    mermaid: `flowchart TD
  LB --> H1[App-1 /actuator/health → 200]
  LB --> H2[App-2 → 500]
  H2 --> REM[Remove from rotation]
  LB --> H3[App-3 → 200]`,
    code: `// Spring Boot Actuator
management:
  endpoint:
    health:
      probes:
        enabled: true
  endpoints:
    web:
      exposure:
        include: health
  health:
    livenessstate:
      enabled: true
    readinessstate:
      enabled: true

// K8s / ALB:
// liveness  → restart if deadlocked
// readiness → remove from LB if not ready (warming, DB down)
// /actuator/health/liveness
// /actuator/health/readiness`,
    failure: '`/health` always UP while dependency down → 5xx to users.',
    production: 'Readiness includes critical deps; liveness stays cheap.',
    interview30s: 'Health checks cull bad targets; readiness ≠ liveness.',
    followUp: 'Should Redis failure fail readiness for a payment API?',
    tradeoff: 'Strict readiness vs availability during partial outages.',
    memoryTrick: 'Liveness = am I alive; readiness = may I take customers.',
  },
  {
    id: 'responsibilities',
    title: 'Load Balancer Responsibilities',
    badge: 'Architecture',
    problem: 'Clarify what the LB owns vs the app/API gateway.',
    whenToUse: 'Whiteboard scope for HA design.',
    whenAvoid: 'Dumping auth/rate-limit solely on ALB when you need API GW.',
    mermaid: `flowchart TB
  LB[LOAD BALANCER]
  LB --> T[Traffic distribution]
  LB --> H[Health checks]
  LB --> R[Routing]
  LB --> TLS[TLS termination]
  LB --> F[Failover]
  LB --> C[Connection mgmt]
  LB --> S[Session affinity]
  LB --> O[Observability]`,
    code: `// Mental checklist in interviews:
// 1) Algorithm + target pool
// 2) Health → deregister
// 3) Timeouts / idle / draining
// 4) TLS certs at edge
// 5) Metrics: 5xx, target health, latency
// API auth/quotas → API Gateway (usually)`,
    failure: 'Expecting ALB to be full API management platform.',
    production: 'ALB/NLB for distribution; API GW for governance; apps for business.',
    interview30s: 'LB distributes and fails over healthy targets; it is not your IdP.',
    followUp: 'Where put WAF relative to ALB?',
    tradeoff: 'Edge features vs clear separation of concerns.',
    memoryTrick: 'LB = traffic cop; Gateway = passport control.',
  },
  {
    id: 'tls',
    title: 'TLS Termination',
    badge: 'Security',
    problem: 'Where to decrypt HTTPS for Spring Boot fleets.',
    whenToUse: 'Terminate at ALB for cert centralization; re-encrypt if needed.',
    whenAvoid: 'Cleartext on hostile networks without compensating controls.',
    mermaid: `flowchart LR
  C[Client] -->|HTTPS| ALB
  ALB -->|HTTP or HTTPS| APP[Spring Boot]`,
    code: `// Spring must trust forwarded headers when TLS ends at LB
server:
  forward-headers-strategy: framework

// Or:
server.tomcat.remoteip.remote-ip-header=x-forwarded-for
server.tomcat.remoteip.protocol-header=x-forwarded-proto

// AWS: ACM cert on ALB listener 443 → target HTTP:8080
// Higher assurance: ALB → HTTPS targets (end-to-end)`,
    failure: 'Redirect HTTP→HTTPS loops if app ignores X-Forwarded-Proto.',
    production: 'ACM on ALB; private targets; optional mTLS for high trust.',
    interview30s: 'Terminate TLS at LB for ops simplicity; re-encrypt when threat model needs it.',
    followUp: 'Certificate rotation without downtime?',
    tradeoff: 'Ops ease vs end-to-end encryption.',
    memoryTrick: 'TLS at LB = unlock the envelope at the front desk.',
  },
  {
    id: 'retry',
    title: 'Retry · Timeout · Idempotency',
    badge: 'Resilience',
    problem: 'LB/client retries a POST /debit and doubles the payment.',
    whenToUse: 'Retry safe GETs; POSTs only with idempotency keys.',
    whenAvoid: 'Blind retries on non-idempotent money APIs.',
    mermaid: `flowchart TD
  C[Client] --> LB
  LB --> A1[App-1]
  A1 -->|timeout| LB
  LB -->|retry| A2[App-2]
  A2 --> ID[Idempotency-Key required for POST]`,
    code: `@PostMapping("/payments")
public Payment pay(@RequestHeader("Idempotency-Key") String key,
                   @RequestBody PayRequest req) {
  return idempotency.execute(key, () -> paymentService.charge(req));
}

// ALB: limited retry behavior — prefer app/client with budgets
// Spring: RestClient + Resilience4j Retry only on idempotent calls`,
    failure: 'Timeout too aggressive + retry → thundering herd + double charge.',
    production: 'Idempotency-Key table; short deadlines; bounded retries.',
    interview30s: 'Retries need idempotency for payments; timeouts must fit SLOs.',
    followUp: 'Where store idempotency records?',
    tradeoff: 'Availability vs exactly-once business effect.',
    memoryTrick: 'Retry without idempotency = pressing Pay twice.',
  },
  {
    id: 'failover',
    title: 'Failover & Connection Draining',
    badge: 'HA',
    problem: 'App-2 dies mid-deploy; drain without dropping in-flight debits.',
    whenToUse: 'Deployments and instance failure.',
    whenAvoid: 'Infinite drain delaying rollbacks.',
    mermaid: `flowchart TD
  LB --> A1[UP]
  LB --> A2[DOWN]
  LB --> A3[UP]
  A2 --> REM[deregister + drain]`,
    code: `// AWS target group:
// deregistration_delay.timeout_seconds = 30..300
// During drain: stop new connections; finish in-flight

// K8s: preStop sleep + readiness fail → Service endpoints remove pod
lifecycle:
  preStop:
    exec:
      command: ["sh","-c","sleep 15"]`,
    failure: 'No drain → cut TCP mid-POST; client retries carefully.',
    production: 'Fail readiness first, then drain, then terminate.',
    interview30s: 'Unhealthy targets leave rotation; draining finishes in-flight work.',
    followUp: 'Multi-AZ ALB failure modes?',
    tradeoff: 'Drain length vs deploy speed.',
    memoryTrick: 'Drain = finish serving customers before closing the counter.',
  },
];
