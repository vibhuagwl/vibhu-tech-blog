export const MEMORY_SENTENCE =
  'JWT identifies the tenant, context carries it, every store isolates on it, clear ThreadLocal, and never trust the client header alone.';

export const SIXTY_SEC =
  'We build a multi-tenant Order SaaS. After OAuth/JWT, a composite resolver binds tenant from the token; headers must match or we 403. TenantContext + MDC ride the request. Repositories always query by id AND tenant_id, indexes lead with tenant_id, and Postgres RLS is a second fence. Redis keys, Kafka envelopes, and S3 paths include tenant. Outbox publishes tenant-aware events; consumers set and clear context. Cross-tenant access returns 404/403 and is covered by integration tests.';

export const FIVE_MIN =
  'Start from the Walmart vs Amazon story: isolation is Sev-1. Prefer shared schema for cost, with tenant_id everywhere and composite indexes. Hibernate/repo discipline beats hoping developers remember WHERE clauses; RLS catches slips. JWT is authoritative — header spoofing is a 403. ThreadLocal is fine only with finally clear, and the same rule applies to Kafka listeners. Cache keys are tenant:{id}:…. For events, outbox + envelope tenantId + DLQ replay that restores context. Noisy neighbors get per-tenant rate limits; whales graduate to dedicated DB via hybrid metadata. Scale path: indexes → partitions → replicas → shard or dedicated. Observe with tenant on logs/traces while watching metric cardinality.';

export const TWO_MINUTE_STORY =
  'Imagine an Order Management SaaS used by Walmart and Amazon. The dangerous bug is not downtime — it is Walmart reading Amazon’s orders. Requests hit the gateway, authenticate with JWT that contains tenant_id and roles, then a TenantFilter resolves the tenant. If X-Tenant-ID disagrees with the JWT, we reject with 403 because the token is proof and the header is only a hint. We set TenantContext and MDC, run the controller and service, and every repository method is findByIdAndTenantId — never findById alone — so a guessed UUID from another tenant returns 404. We index (tenant_id, …) so queries do not scan the world. Postgres RLS using app.current_tenant is defense in depth. Config is cached under tenant:{id}:config, Kafka messages carry tenantId in the envelope, outbox rows include tenant_id, and consumers set context from the message and clear in finally. Files live under tenantSlug/…. Large tenants get higher rate limits or a dedicated database. Suspended tenants fail closed. Isolation tests in CI try Amazon’s token on Walmart’s order id and expect denial. That is how I design multi-tenant Spring Boot systems.';

export const TEN_MIN =
  'Expand the five-minute answer with schema-per-tenant and DB-per-tenant tradeoffs, Hibernate MultiTenantConnectionProvider, provisioning sagas, multi-region residency, connection-pool math, partition key choice for Kafka, DLQ replay idempotency, OpenTelemetry baggage, and the failure matrix for Redis/Kafka/DB/JWT/suspended/missing context.';

export const DECISION_MATRIX: string[][] = [
  ['Cost', 'Lowest', 'Medium', 'Highest', 'Mixed'],
  ['Isolation', 'Logical (app+RLS)', 'Stronger logical', 'Strongest', 'Tiered'],
  ['Security risk', 'Highest if app bugs', 'Medium', 'Lowest blast radius', 'Depends on tier'],
  ['Migrations', 'One chain', 'Per schema', 'Per database', 'Both paths'],
  ['Backup/restore', 'All-or-nothing', 'Per schema dump', 'Per tenant', 'Per tier'],
  ['Noisy neighbor', 'Worst', 'Better', 'Best', 'Whales isolated'],
  ['Ops complexity', 'Lowest', 'Medium', 'Highest', 'Medium-high'],
  ['Best for', 'Startup SaaS', 'Soft isolation needs', 'Banking/health', 'Real SaaS pricing'],
];

export const STRATEGY_HEADERS = ['Dimension', 'Shared schema', 'Schema/tenant', 'DB/tenant', 'Hybrid'];

export const INDUSTRY_PICKS: string[][] = [
  ['Startup SaaS', 'Shared schema + RLS', 'Ship fast; add hybrid later'],
  ['Enterprise SaaS', 'Hybrid', 'Dedicated SKU for contracts'],
  ['FinTech', 'Hybrid + outbox', 'Audit + strong authz'],
  ['Banking', 'Dedicated / VPC', 'Residency + audit non-negotiable'],
  ['Healthcare', 'Dedicated + region', 'PHI isolation'],
  ['High-compliance', 'DB-per-tenant or silo', 'Cost is a feature'],
];

export const FAILURE_CASES: string[][] = [
  ['Tenant DB unavailable', 'Health/errors', 'Fail requests 503', 'Backoff', 'Read replica if any', 'Page on-call'],
  ['Redis unavailable', 'Client errors', 'DB for config', 'Reconnect', 'Fail-closed rate limit*', 'Redis down alert'],
  ['Kafka unavailable', 'Publish errors', 'Outbox retains', 'Publisher retry', 'Lag UI', 'Bus down alert'],
  ['JWT expired', '401 from filter', 'Re-auth', 'No', 'Refresh if allowed', 'Auth spike'],
  ['Tenant suspended', 'Status check', '403', 'No', 'Billing portal', 'Suspend metric'],
  ['Provisioning fails', 'Status FAILED', 'Retry step', 'Yes bounded', 'Manual ops', 'Provision alert'],
  ['Migration fails', 'Flyway error', 'Mark unhealthy', 'Retry version', 'Block tenant', 'Migration alert'],
  ['Kafka consume fails', 'Listener error', 'Retry/DLQ', 'Bounded', 'DLQ UI', 'DLQ depth'],
  ['Consumer crash', 'Pod restart', 'Redeliver', 'Yes', 'Idempotent handler', 'Crash loops'],
  ['Stale cache config', 'Version/TTL', 'Evict on write', 'N/A', 'DB truth', 'Config mismatch'],
  ['Wrong tenant ID', 'Resolver', '403 mismatch', 'No', 'N/A', 'Security metric'],
  ['Missing context', 'Null check', 'Fail closed', 'No', 'N/A', 'Error budget'],
  ['ThreadLocal not cleared', 'Wrong tenant logs/data', 'finally clear', 'N/A', 'N/A', 'Isolation test'],
];

export const CHECKLIST: {item: string; level: 'MUST HAVE' | 'SHOULD HAVE' | 'OPTIONAL'}[] = [
  {item: 'JWT tenant claim authoritative; header cannot override', level: 'MUST HAVE'},
  {item: 'TenantFilter validates ACTIVE and sets/clears TenantContext', level: 'MUST HAVE'},
  {item: 'Repositories use id + tenant_id (no naked findById)', level: 'MUST HAVE'},
  {item: 'Indexes lead with tenant_id', level: 'MUST HAVE'},
  {item: 'Cache/Kafka/S3/log keys include tenant', level: 'MUST HAVE'},
  {item: 'Cross-tenant isolation tests in CI', level: 'MUST HAVE'},
  {item: 'PostgreSQL RLS on shared schema', level: 'SHOULD HAVE'},
  {item: 'Outbox + tenant-aware DLQ replay', level: 'SHOULD HAVE'},
  {item: 'Per-tenant rate limits', level: 'SHOULD HAVE'},
  {item: 'MDC + distributed tracing with tenant', level: 'SHOULD HAVE'},
  {item: 'Provisioning saga with FAILED retry', level: 'SHOULD HAVE'},
  {item: 'Soft-delete lifecycle + retention', level: 'SHOULD HAVE'},
  {item: 'Schema-per-tenant or DB-per-tenant for all', level: 'OPTIONAL'},
  {item: 'Per-tenant Kubernetes Deployment', level: 'OPTIONAL'},
  {item: 'Dedicated Kafka topic per tenant', level: 'OPTIONAL'},
];

export const CHEAT: [string, string][] = [
  ['Ladder', 'IDENTIFY→VALIDATE→CONTEXT→ISOLATE→EXECUTE→OBSERVE'],
  ['Auth', 'JWT tenant > header/subdomain'],
  ['DB default', 'Shared schema + tenant_id + RLS'],
  ['Repo', 'findByIdAndTenantId'],
  ['Cache', 'tenant:{id}:…'],
  ['Kafka', 'envelope.tenantId + clear context'],
  ['Partition', 'orderId default; tenantId if total order'],
  ['Outbox', 'same TX as business write'],
  ['Hybrid', 'SMB shared / enterprise dedicated'],
  ['Test', 'A token + B id = deny'],
];

export const CLOSING =
  'Production multi-tenancy is not a column — it is identity, isolation on every data plane, and tests that prove Tenant A never becomes Tenant B.';

export const COST_MODEL = [
  ['100 tenants dedicated stacks', '100× DB + pools + ops', 'Highest'],
  ['100 tenants shared schema', '1× DB amortized', 'Lowest'],
  ['Hybrid 95 shared + 5 dedicated', 'Near shared + 5 silos', 'Balanced'],
  ['When not to optimize cost', 'Banking / PHI / contract silo', 'Charge for isolation'],
];

export const PRODUCTION_NOTES_RLS =
  'Application security + repository security + database RLS is defense in depth. Any single layer can fail; three rarely fail together.';
