/** FinTech E2E example, Resilience Master diagram, and Decision Guide — hub static sections. */

export const COMMUNICATION_ASCII = `
┌─────────────────────────────────────────────────────────────────────────────┐
│              COMMUNICATION — REST vs gRPC vs KAFKA                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  Browser / Mobile ──REST/JSON──► API Gateway ──► Order Service              │
│                                                                             │
│  Order ──gRPC──► Payment        (internal, low latency, deadlines)          │
│                                                                             │
│  Order ──Outbox──► Kafka ──► Payment / Settlement / Notification          │
│                               (async, decouple, saga, scale consumers)      │
│                                                                             │
│  Choose REST: browser, CRUD, immediate response, OpenAPI                     │
│  Choose gRPC: internal high-QPS RPC, streaming, strong contracts            │
│  Choose Kafka: fire-and-forget, saga, fan-out, replay, buffering            │
└─────────────────────────────────────────────────────────────────────────────┘
`;

export const RESILIENCE_MASTER_ASCII = `
Client
  │
  ▼
API Gateway ─── Rate Limiter (100 req/s/client)
  │
  ▼
Timeout (connect 1s · read 3s · deadline header propagated)
  │
  ▼
Bulkhead (payment pool: 10 threads · inventory pool: 10)
  │
  ▼
Circuit Breaker (OPEN after 50% failures in 10s window)
  │
  ▼
Retry + Exponential Backoff + Jitter (max 3 · idempotent only)
  │
  ▼
Order Service
  │
  ├── Outbox DB (same TX as order)
  │
  ▼
Kafka ─── Retry Topic ─── DLT (poison message)
  │
  ▼
Payment Consumer (idempotent · dedupe table · manual ack)

Apply in order: Timeout first (mandatory) → Bulkhead (isolate) →
Circuit Breaker (fail fast) → Retry (transient only, idempotent) →
Rate Limit (edge) → DLQ (terminal failure)
`;

export const FINTECH_E2E = {
  title: 'FinTech Payment Platform — End-to-End',
  ascii: `
Client (mobile/web)
      │
      ▼
API Gateway ── JWT auth · rate limit · correlationId · TLS
      │
      ▼
Order Service ── POST /orders (Idempotency-Key)
      │
      ├── PostgreSQL: orders + outbox_events (single TX)
      │
      ▼
Outbox Relay / Debezium CDC
      │
      ▼
Kafka: payments-v1 (partition key = orderId)
      │
      ├──► Payment Service ──► Bank API (timeout + CB + retry)
      │         │
      │         └── PaymentCaptured / PaymentFailed event
      │
      ├──► Settlement Service (consumer group: settlement-workers)
      │
      └──► Reporting Projection (CQRS read model)

Failure → Compensating: PaymentFailed → OrderCancelled (saga)
`,
  description: `Complete payment platform flow tying together gateway security, idempotency, transactional outbox, Kafka consumer groups, saga compensation, CQRS reporting, and resilience patterns. Each failure scenario maps to a specific pattern — not accidental retries.`,
  failureScenarios: [
    {
      failure: '1. Payment timeout (bank slow)',
      pattern: 'Timeout (3s read) + Retry (2x jitter) + Circuit Breaker → order stays PENDING; saga timeout job marks EXPIRED + compensates',
    },
    {
      failure: '2. Payment service down',
      pattern: 'Circuit Breaker OPEN → fast-fail at gateway; outbox buffers events; Kafka retention preserves messages',
    },
    {
      failure: '3. Kafka unavailable',
      pattern: 'Transactional Outbox — order saved in DB; relay retries publish when broker recovers; no dual-write loss',
    },
    {
      failure: '4. Duplicate payment event',
      pattern: 'Idempotent Consumer + dedupe table (paymentId + eventType); second delivery skipped',
    },
    {
      failure: '5. Bank API unavailable',
      pattern: 'CB OPEN on bank client + Retry exhausted → PaymentFailed event → saga compensation cancels order',
    },
    {
      failure: '6. Settlement failure',
      pattern: 'Retry topic (3 attempts) → DLT; manual replay after fix; order already paid — reconciliation job',
    },
    {
      failure: '7. Consumer crash mid-processing',
      pattern: 'Manual ack after TX commit; redelivery → dedupe table prevents double settlement',
    },
    {
      failure: '8. Poison message (bad schema)',
      pattern: 'DefaultErrorHandler → DLT; no infinite retry; alert on DLT lag',
    },
    {
      failure: '9. Database failure',
      pattern: 'Health check fails readiness → K8s removes pod from LB; no partial writes without TX',
    },
  ],
  code: `@Transactional
public Order createOrder(CreateOrderRequest req, String idempotencyKey) {
  idempotency.find(req.clientId(), idempotencyKey).ifPresent(r -> { throw new DuplicateRequestException(r); });
  Order order = orders.save(Order.pending(req));
  outbox.save(OutboxEvent.orderCreated(order));
  idempotency.save(req.clientId(), idempotencyKey, order.id());
  return order;
}

// Payment consumer — resilience stack
@CircuitBreaker(name = "bank")
@Retry(name = "bank")
@Bulkhead(name = "bank")
@TimeLimiter(name = "bank")
public PaymentResult chargeBank(PaymentCommand cmd) { ... }`,
};

export const DECISION_GUIDE = {
  title: 'Microservices Patterns Decision Guide',
  ascii: `
START: What problem are you solving?
│
├─ Splitting monolith?
│  ├─ By business area → Decompose by Capability + DB per Service
│  ├─ Legacy coexistence → Strangler Fig + ACL
│  └─ Incremental extract → Branch by Abstraction
│
├─ Client access?
│  ├─ Single entry + auth → API Gateway
│  ├─ Mobile vs web shapes → BFF
│  └─ Combine multiple services → Gateway Aggregation / API Composition
│
├─ Service communication?
│  ├─ Need answer now → REST (browser) or gRPC (internal)
│  ├─ Fire-and-forget / fan-out → Kafka + Outbox
│  └─ Multi-step workflow → Saga (choreography or orchestration)
│
├─ Data consistency across services?
│  ├─ DB + Kafka atomic write → Transactional Outbox
│  ├─ Duplicate messages → Idempotent Consumer + dedupe table
│  └─ Cross-service workflow → Saga + compensating transactions (NOT 2PC)
│
├─ Read scaling?
│  ├─ Heavy reads → CQRS + materialized view / Redis cache-aside
│  └─ Audit + time travel → Event Sourcing (+ snapshots)
│
├─ Failure handling?
│  ├─ Always → Timeout on every outbound call
│  ├─ Transient blip → Retry (idempotent) + jitter
│  ├─ Dependency sick → Circuit Breaker + fallback
│  ├─ Resource isolation → Bulkhead
│  └─ Terminal poison → DLQ + replay runbook
│
└─ Production deploy?
   ├─ Zero-downtime → Blue/Green or Rolling
   ├─ Risk reduction → Canary (95/5 → 90/10 → …)
   └─ Feature toggle → Feature Flags (deploy ≠ release)
`,
  principles: [
    'Decompose by capability — each service owns its data (Database per Service).',
    'Communicate async with Outbox for anything that crosses service boundaries.',
    'Never retry without idempotency; never call without timeout.',
    'Stack resilience: Timeout → Bulkhead → Circuit Breaker → Retry → Rate Limit.',
    'Saga compensates — it does NOT rollback remote databases.',
    'CQRS scales reads; Event Sourcing adds audit — use only when justified.',
    'Observe everything: correlationId + traceId across gateway → services → Kafka.',
  ],
};

export const GATEWAY_COMPARISON = {
  headers: ['Pattern', 'Role', 'When', 'Trade-off'],
  rows: [
    ['API Gateway', 'Single edge entry: auth, routing, rate limit, TLS', 'All external clients', 'Must stay thin; hotspot risk'],
    ['BFF', 'Client-specific API shape (mobile vs web)', 'Different client needs different aggregates', 'One deployable per client type'],
    ['API Composition', 'Combine data from multiple services in one response', 'Dashboard needing order+customer+payment', 'Latency = slowest downstream; partial failure handling'],
    ['Gateway Aggregation', 'Parallel fetch + merge at gateway', 'Reduce client round-trips', 'Gateway becomes thick; use bulkhead per downstream'],
  ],
};

export const CQRS_ES_EDA_COMPARISON = {
  headers: ['Pattern', 'What it is', 'When', 'Not the same as'],
  rows: [
    ['Event-Driven Architecture', 'Services react to events async', 'Decouple teams; fan-out side effects', 'Not necessarily ES or CQRS'],
    ['CQRS', 'Separate read and write models', 'Read-heavy; different query shapes', 'Can use without ES'],
    ['Event Sourcing', 'Store events as source of truth; state = fold(events)', 'Audit, temporal queries, dispute resolution', 'Heavier ops; often paired with CQRS'],
  ],
};
