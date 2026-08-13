import type {MultiTenantTopic} from './types';

export const TOPICS_D: MultiTenantTopic[] = [
  {
    id: 'lifecycle',
    title: '19. Tenant Lifecycle',
    badge: 'ACTIVE / SUSPENDED',
    problem: 'Suspend must block immediately; delete must respect retention and backups.',
    whenToUse: 'Billing failures, offboarding, legal hold.',
    whenAvoid: 'Hard DELETE CASCADE without legal review.',
    mermaid: `flowchart TD
  P[PROVISIONING] --> A[ACTIVE]
  A --> S[SUSPENDED]
  A --> D[DEACTIVATED]
  S --> A
  D --> X[DELETED]
  A --> X`,
    code: `if (tenant.getStatus() != TenantStatus.ACTIVE) {
  throw new TenantSuspendedException(); // 403
}`,
    failure: 'Delete clears DB but leaves Redis keys, S3 objects, and Kafka lag consuming old tenant ids.',
    production: 'Soft-delete first; purge cache; stop producers; retention job for files/DB; document backup residual data.',
    interview30s:
      'PROVISIONING→ACTIVE→SUSPENDED/DEACTIVATED→DELETED. Suspend = 403 keep data. Delete = orchestrated purge after retention.',
    followUp: 'What about Kafka messages already in flight?',
    tradeoff: 'Fast purge vs legal hold / audit.',
    memoryTrick: 'Suspend freezes; delete orchestrates.',
  },
  {
    id: 'pagination',
    title: '20. Tenant-Safe Pagination',
    badge: 'API',
    problem: 'findAll(Pageable) is a cross-tenant and performance bug.',
    whenToUse: 'List endpoints for orders, customers, audit.',
    whenAvoid: 'Deep offset pages on huge tenants.',
    mermaid: `flowchart TD
  Bad[findAll pageable] --> Leak[Other tenants]
  Good[findAllByTenantId] --> Idx[(tenant_id, created_at, id)]
  Good --> Cursor[Keyset cursor]`,
    code: `Page<OrderEntity> findAllByTenantId(UUID tenantId, Pageable pageable);
// Large tenants: WHERE tenant_id=? AND (created_at, id) < (:c, :id) ORDER BY ...`,
    failure: 'Offset page 10_000 on a shared table melts IO for everyone.',
    production: 'Opaque cursors externally; composite indexes; rate-limit heavy exporters.',
    interview30s:
      'Always page by tenant_id. Offset early; cursor/keyset when a tenant grows large.',
    followUp: 'Index for cursor pagination?',
    tradeoff: 'Offset simplicity vs cursor stability.',
    memoryTrick: 'No naked findAll.',
  },
  {
    id: 'failures-topic',
    title: '21. Failure Scenarios Playbook',
    badge: 'Ops',
    problem: 'Happy-path architecture dies in interviews without Detection → Recovery → Alert.',
    whenToUse: 'On-call runbooks and staff interviews.',
    whenAvoid: 'Failing open on tenant validation.',
    mermaid: `flowchart TD
  F[Failure] --> Det[Detection]
  Det --> Rec[Recovery]
  Rec --> Ret[Retry]
  Rec --> Fb[Fallback]
  Det --> Al[Alert]`,
    code: `// Missing TenantContext → fail closed (5xx/403), never defaultTenant="public"
// Kafka down → outbox buffers
// Redis down → DB for config; explicit rate-limit policy`,
    failure: 'Defaulting to a public tenant when context is null.',
    production: 'See hub failure matrix. Outbox absorbs Kafka blips; RLS/app still need DB.',
    interview30s:
      'For each dependency: how you detect, retry, fall back, and alert — and never invent a tenant.',
    followUp: 'Stale Redis tenant config?',
    tradeoff: 'Availability vs incorrect cross-tenant config.',
    memoryTrick: 'Fail closed on identity.',
  },
  {
    id: 'lab',
    title: '22. Runnable Lab',
    badge: ':8096',
    problem: 'Interview credibility requires something you can run and curl.',
    whenToUse: 'Local learning and CI isolation tests.',
    whenAvoid: 'Claiming Kafka EOS without proving outbox+idempotency.',
    mermaid: `flowchart LR
  H2[Default H2] --> App[Spring Boot :8096]
  Infra[infra profile] --> PG[(Postgres 5434)]
  Infra --> Redis[(6380)]
  Infra --> Kafka[(9094)]`,
    code: `cd spring-multitenant-lab
mvn test
mvn spring-boot:run
# token + cross-tenant denial in README`,
    failure: 'Demo only shows create/read for one tenant.',
    production: 'Compose for local; K8s for prod. Tests gate PRs.',
    interview30s:
      'Lab proves JWT bind, tenant-scoped repos, cache keys, outbox envelope, and isolation tests — default profile needs no Docker.',
    followUp: 'Show the Amazon-reads-Walmart curl.',
    tradeoff: 'In-memory bus for tests vs real Kafka in infra profile.',
    memoryTrick: 'mvn test is the isolation proof.',
  },
  {
    id: 'checklist',
    title: '23. Production Checklist',
    badge: 'MUST / SHOULD',
    problem: 'Ship gates for tenancy changes.',
    whenToUse: 'PR reviews and go-live.',
    whenAvoid: 'Treating every OPTIONAL as MUST (over-engineering).',
    mermaid: `flowchart TD
  Must[MUST JWT bind + repos + clear + tests + cache keys]
  Should[SHOULD RLS outbox DLQ rate limit MDC]
  Opt[OPTIONAL schema-per-tenant per-tenant HPA]`,
    code: `// MUST HAVE examples
// - JWT tenant authoritative
// - findByIdAndTenantId
// - TenantContext.clear in finally
// - cross-tenant integration tests`,
    failure: 'Shipping feature flags cached under key "config".',
    production: 'Put MUST items in PR template for tenancy-touching PRs.',
    interview30s:
      'MUST: identity bind, isolation on every store, clear context, automated cross-tenant tests. SHOULD: RLS, outbox, limits, MDC.',
    followUp: 'What is OPTIONAL early?',
    tradeoff: 'Hardening depth vs time-to-market.',
    memoryTrick: 'MUST is identity + isolation + tests.',
  },
  {
    id: 'cheat-sheet',
    title: '24. Cheat Sheet',
    badge: 'Memorize',
    problem: 'Need a 30-second redraw under pressure.',
    whenToUse: 'Closing an interview round.',
    whenAvoid: 'Reading the cheat sheet instead of a story.',
    mermaid: `flowchart TD
  I[IDENTIFY] --> V[VALIDATE]
  V --> C[CONTEXT]
  C --> Iso[ISOLATE]
  Iso --> E[EXECUTE]
  E --> O[OBSERVE]`,
    code: `JWT tenant > header
tenant_id on rows, keys, events, files, logs
clear ThreadLocal
outbox + idempotency
hybrid for whales`,
    failure: 'Jumping to Kubernetes before isolation.',
    production: 'Close with hybrid recommendation and isolation tests.',
    interview30s:
      'Identify, validate, context, isolate everywhere, execute, observe — shared schema + RLS, hybrid dedicated, never trust the client tenant alone.',
    followUp: 'Give the banking variant.',
    tradeoff: 'Shared cost vs dedicated compliance.',
    memoryTrick: 'IDENTIFY→OBSERVE ladder.',
  },
];
