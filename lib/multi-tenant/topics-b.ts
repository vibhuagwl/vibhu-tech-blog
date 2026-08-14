import type {MultiTenantTopic} from './types';

export const TOPICS_B: MultiTenantTopic[] = [
  {
    id: 'shared-schema',
    title: '07. Shared Schema Implementation',
    badge: 'Lab default',
    problem: 'Every tenant-owned table needs tenant_id and indexes that lead with tenant_id.',
    whenToUse: 'Default for most Spring Boot SaaS.',
    whenAvoid: 'When contracts demand physical DB isolation from day one.',
    mermaid: `erDiagram
  TENANT ||--o{ ORDERS : owns
  TENANT ||--o{ CUSTOMERS : owns
  TENANT ||--o{ PAYMENTS : owns
  ORDERS {
    uuid id
    uuid tenant_id
    uuid customer_id
    numeric amount
    string status
  }`,
    code: `@Query("select o from OrderEntity o where o.id = :id and o.tenantId = :tenantId")
Optional<OrderEntity> findByIdAndTenantId(UUID id, UUID tenantId);

Page<OrderEntity> findAllByTenantId(UUID tenantId, Pageable pageable);`,
    failure: 'Index on status alone → scans other tenants; unique email globally may be wrong product-wise.',
    production: 'Composite (tenant_id, status), (tenant_id, created_at, id) for pagination. Defense: repo + RLS.',
    interview30s:
      'One schema, tenant_id on every row, composite indexes starting with tenant_id, never findById alone.',
    followUp: 'Why must indexes include tenant_id?',
    tradeoff: 'Cheap ops vs noisy neighbor and shared blast radius.',
    memoryTrick: 'WHERE tenant_id = ? is the product.',
  },
  {
    id: 'rls',
    title: '08. PostgreSQL Row-Level Security',
    badge: 'Defense in depth',
    problem: 'App bugs ship. Database should still refuse cross-tenant rows.',
    whenToUse: 'Shared schema production Postgres.',
    whenAvoid: 'As the only control — still write correct repos.',
    mermaid: `flowchart TD
  App[App sets app.current_tenant] --> PG[Postgres]
  PG --> Pol[RLS policy tenant_id = current_setting]
  Pol -->|allow| Rows[Own rows]
  Pol -->|deny| Empty[Empty / error]`,
    code: `ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON orders
  USING (tenant_id::text = current_setting('app.current_tenant', true));
-- App: SET LOCAL app.current_tenant = '...';`,
    failure: 'Pooled connection keeps previous SET → wrong tenant fence. BypassRLS on app role undoes the control.',
    production: 'SET LOCAL in transaction; FORCE RLS; lock down migration roles. Lab documents hooks for infra profile.',
    interview30s:
      'ENABLE RLS + policy on tenant_id vs session GUC. App sets current tenant per request. Seatbelt under app bugs.',
    followUp: 'How do you reset GUC on connection return?',
    tradeoff: 'Extra session state vs stronger isolation.',
    memoryTrick: 'App + Repo + RLS = three fences.',
  },
  {
    id: 'onboarding',
    title: '09. Tenant Onboarding Saga',
    badge: 'PROVISIONING',
    problem: 'Creating tenant + DB + Flyway + admin is not one XA transaction.',
    whenToUse: 'Self-serve signup and sales-led enterprise provision.',
    whenAvoid: 'Giant @Transactional across external provisioners.',
    mermaid: `flowchart TD
  C[Create PROVISIONING] --> D[Provision storage]
  D --> M[Migrate / seed admin]
  M --> A[ACTIVE]
  D -->|fail| F[PROVISIONING_FAILED]
  F --> R[retry-provisioning]`,
    code: `POST /api/tenants
{ "name": "ABC Retail", "plan": "PREMIUM", "slug": "abc-retail" }
// status: PROVISIONING → ACTIVE | PROVISIONING_FAILED`,
    failure: 'Orphan schema on half-failure with no cleanup job; stuck PROVISIONING forever without alerts.',
    production: 'Checkpoint each step; retry migration; optional Temporal/Camunda for long dedicated DB creates.',
    interview30s:
      'Metadata first, then storage, migrate, admin, ACTIVE. Failures mark PROVISIONING_FAILED with retry — not one mega TX.',
    followUp: 'What compensating actions on dedicated DB create failure?',
    tradeoff: 'Sync onboard UX vs async 202 for slow provision.',
    memoryTrick: 'Saga statuses beat hope-based rollback.',
  },
  {
    id: 'cache',
    title: '10. Redis — Tenant-Aware Cache & Rate Limits',
    badge: 'Key design',
    problem: 'Cache without tenant prefix is a silent cross-tenant privacy bug.',
    whenToUse: 'Config, sessions, rate limits, hot entities.',
    whenAvoid: 'Caching authorization decisions without tenant in the key.',
    mermaid: `flowchart LR
  Bad[user:123] -->|leak| X[Wrong tenant]
  Good[tenant:A:user:123] --> OK[Isolated]
  RL[rate-limit:tenantA] --> Q[Plan quota]`,
    code: `String key = "tenant:" + tenantId + ":config";
// NEVER: redis.get("config");
rateLimitKey = "rate-limit:" + tenantId;`,
    failure: 'Stale config after plan change; stampede on expiry; Redis down with fail-open rate limit melting the DB.',
    production: 'TTL + explicit eviction on PUT; decide fail-open vs fail-closed for rate limits; per-tenant memory quotas.',
    interview30s:
      'Every Redis key starts with tenant id. Rate limits are per tenant (and often per user). Evict on writes; never bare keys.',
    followUp: 'Cache stampede mitigation?',
    tradeoff: 'Fail-open availability vs fail-closed safety when Redis dies.',
    memoryTrick: 'No tenant in key = shared brain damage.',
  },
  {
    id: 'kafka',
    title: '11. Kafka Envelope, Outbox, DLQ',
    badge: 'Events',
    problem: 'DB + Kafka dual-write loses events or invents tenants. Consumers need tenant on every message.',
    whenToUse: 'Order created → payment/notify asynchronously.',
    whenAvoid: 'Fire-and-forget without outbox for money/state changes.',
    mermaid: `flowchart TD
  S[OrderService] -->|same TX| DB[(orders + outbox)]
  DB --> Pub[OutboxPublisher / Debezium]
  Pub --> K[Kafka]
  K --> C[Consumer]
  C -->|set TenantContext| Biz[Business]
  C -->|fail| DLQ[Tenant-aware DLQ]
  DLQ -->|replay| K`,
    code: `{
  "eventId": "event-123",
  "tenantId": "tenant-a",
  "eventType": "ORDER_CREATED",
  "aggregateId": "order-123",
  "payload": {}
}`,
    failure: 'Partition by tenantId → hot whale. Missing tenant on consume → guess or NPE. Replay without context → wrong DB slice.',
    production: 'Default key=orderId for scale; tenantId in envelope always. DLQ stores tenant for safe replay + idempotency.',
    interview30s:
      'Outbox includes tenant_id. Envelope carries tenantId. Consumer sets context then clears. DLQ replay restores tenant. Prefer orderId keys unless tenant-wide order is required.',
    followUp: 'How do you preserve per-tenant ordering without hot partitions?',
    tradeoff: 'tenantId key (order, hot) vs orderId key (scale, aggregate order only).',
    memoryTrick: 'Envelope tenant or reject — never invent.',
  },
  {
    id: 'noisy',
    title: '12. Noisy Neighbor & Scaling',
    badge: 'SaaS reality',
    problem: 'Tenant B at 100k rps must not destroy Tenant A at 10 rps on shared CPU, DB, or Kafka.',
    whenToUse: 'Any shared multi-tenant runtime.',
    whenAvoid: 'Assuming horizontal pod autoscaling alone equals fairness.',
    mermaid: `flowchart TD
  B[Hot tenant] --> RL[Per-tenant rate limit]
  B --> Fair[Fair scheduling / quotas]
  B --> Ded[Dedicated DB / pods]
  A[Quiet tenant] --> OK[Protected SLO]`,
    code: `// Plan-driven limiter
if (!rateLimiter.tryConsume(tenantId, config.getRateLimitPerMinute())) {
  throw new TooManyRequestsException();
}`,
    failure: 'Global rate limit only — one tenant exhausts the budget for all.',
    production: 'Redis token buckets, statement timeouts, pool caps, move whales to hybrid dedicated, HPA on shared fleet + KEDA on lag.',
    interview30s:
      'Noisy neighbor is unfair shared contention. Fix with per-tenant quotas, fair queues, and dedicated infra for whales — not only more pods.',
    followUp: 'Per-tenant HPA or shared HPA?',
    tradeoff: 'Fairness controls vs complexity and false 429s.',
    memoryTrick: 'Quotas before more hardware.',
  },
];
