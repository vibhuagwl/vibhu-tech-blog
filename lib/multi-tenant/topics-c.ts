import type {MultiTenantTopic} from './types';

export const TOPICS_C: MultiTenantTopic[] = [
  {
    id: 'threats',
    title: '13. Threat Model',
    badge: 'Attack → Prevent → Test',
    problem: 'Multi-tenancy multiplies classic API threats with cross-tenant impact.',
    whenToUse: 'Design reviews and security interview deep-dives.',
    whenAvoid: 'Threat lists without CI tests.',
    mermaid: `flowchart TD
  Spoof[Tenant ID spoof] --> JWT[JWT bind]
  BOLA[Broken object auth] --> Repo[id + tenant_id]
  Cache[Cache leakage] --> Key[tenant prefix]
  TL[ThreadLocal leak] --> Clear[finally clear]
  K[Kafka leakage] --> Env[envelope tenant]
  S3[Object key leak] --> Pref[tenant/…]`,
    code: `@Test
void jwtTenantMismatchReturns403() { … }

@Test
void tenantACannotAccessTenantBOrder() { … }`,
    failure: 'Only testing happy path creates false confidence.',
    production: 'Map each threat to an automated test: mismatch 403, cross-tenant 404, suspended 403, missing tenant rejected, Kafka without tenant → DLQ.',
    interview30s:
      'Spoofing, BOLA, cache/Kafka/file leakage, ThreadLocal, wrong DB routing, admin escalation. For each: attack, impact, prevention, test.',
    followUp: 'Walk tenant spoofing end-to-end.',
    tradeoff: '404 privacy vs 403 clarity on denials.',
    memoryTrick: 'Every threat needs a test, not a slide.',
  },
  {
    id: 'schema-per-tenant',
    title: '14. Schema-per-Tenant (Hibernate)',
    badge: 'SCHEMA mode',
    problem: 'Need stronger logical isolation than discriminator without N databases.',
    whenToUse: 'Per-tenant dump/restore and clearer SQL boundaries.',
    whenAvoid: 'Thousands of schemas without a migration orchestrator.',
    mermaid: `flowchart TD
  TC[TenantContext] --> R[CurrentTenantIdentifierResolver]
  R --> P[MultiTenantConnectionProvider]
  P --> SP[SET search_path]
  SP --> H[Hibernate]`,
    code: `// Preferred modern approach: Hibernate SCHEMA multi-tenancy
// MultiTenantConnectionProvider sets search_path from TenantContext
// Reset path before returning connection to the pool`,
    failure: 'Sticky search_path on Hikari connections → tenant A query hits tenant B schema.',
    production: 'Flyway per schema on onboard and upgrade waves. AbstractRoutingDataSource is alternative but pool-heavy.',
    interview30s:
      'Resolver + connection provider set search_path per request. Reset on release. Migrate each schema deliberately.',
    followUp: 'Discriminator vs SCHEMA vs DATABASE modes?',
    tradeoff: 'Better isolation than shared vs migration fan-out.',
    memoryTrick: 'search_path is sticky — reset it.',
  },
  {
    id: 'db-per-tenant',
    title: '15. Database-per-Tenant',
    badge: 'Enterprise SKU',
    problem: 'Strongest isolation; connection pools and migrations explode.',
    whenToUse: 'Banking/healthcare contracts, noisy whales, independent backup/restore.',
    whenAvoid: 'Default for every free-tier signup.',
    mermaid: `flowchart TD
  Reg[DataSource registry] --> A[(tenant_a_db)]
  Reg --> B[(tenant_b_db)]
  Onboard[Onboard] --> Create[CREATE DATABASE]
  Create --> Fly[Flyway]
  Fly --> Reg`,
    code: `// Pool math
// hotTenants * poolSize  <<  postgres max_connections
// Prefer small pools + lazy open + idle eviction`,
    failure: '10 connections × 500 tenants = 5,000 connections → Postgres death.',
    production: 'Lazy DataSources, cap concurrent pools, shard DB hosts, hybrid for everyone else.',
    interview30s:
      'Dedicated DB per tenant for isolation and DR independence. Pay with ops and careful pool multiplexing.',
    followUp: 'How do you migrate 10k tenant databases?',
    tradeoff: 'Security/ops win vs cost/complexity.',
    memoryTrick: 'Isolation × N ≈ connections × N.',
  },
  {
    id: 'observability',
    title: '16. Observability — MDC, Metrics, Traces',
    badge: 'tenantId everywhere',
    problem: 'You cannot debug isolation incidents without tenant on logs and traces.',
    whenToUse: 'All production multi-tenant services.',
    whenAvoid: 'Unbounded tenant_id labels on every Prometheus series at 100k tenants.',
    mermaid: `flowchart LR
  Filter --> MDC[tenantId userId traceId]
  MDC --> Logs
  Filter --> OTel[baggage tenantId]
  OTel --> HTTP
  OTel --> Kafka`,
    code: `MDC.put("tenantId", tenantId);
MDC.put("userId", userId);
MDC.put("traceId", traceId);
// metrics: prefer plan-tier labels; keep raw tenant on traces/logs`,
    failure: 'Missing MDC clear → wrong tenant on next log line. High-cardinality metrics OOMs Prometheus.',
    production: 'OpenTelemetry baggage across HTTP/Kafka; exemplar to traces for deep dives; top-N tenant dashboards from logs.',
    interview30s:
      'Every log: tenantId, userId, traceId, requestId, operation. Propagate tenant on traces. Be careful with metric cardinality.',
    followUp: 'How do you monitor one hot tenant without 100k series?',
    tradeoff: 'Rich labels vs TSDB cost.',
    memoryTrick: 'Logs love tenants; metrics fear cardinality.',
  },
  {
    id: 'multi-region',
    title: '17. Multi-Region & Data Residency',
    badge: 'GDPR',
    problem: 'EU tenants cannot casually share US Redis/Postgres with personal data.',
    whenToUse: 'Regulated SaaS and global enterprises.',
    whenAvoid: 'Global active-active for PII without a legal basis.',
    mermaid: `flowchart TD
  US[US region] --> TA[Tenant A/B]
  EU[EU region] --> TC[Tenant C/D]
  IN[India region] --> TE[Tenant E]
  Meta[tenant.region + residency] --> Route[Gateway routing]`,
    code: `tenant_id | region | data_residency | database_strategy
---------|--------|----------------|------------------
C        | eu     | EU_ONLY        | SHARED_SCHEMA`,
    failure: 'Global cache with EU PII; failover that ships data to the wrong region.',
    production: 'Pin storage and processing; sticky DNS/gateway; in-region DR first.',
    interview30s:
      'Tenant metadata stores region and residency. Route to regional stacks. Don’t replicate personal data cross-region by default.',
    followUp: 'How does delete/export honor residency?',
    tradeoff: 'Compliance vs operational simplicity of one region.',
    memoryTrick: 'Data stays where the contract says.',
  },
  {
    id: 'object-storage',
    title: '18. Object Storage Isolation',
    badge: 'S3 keys',
    problem: '/orders/123.pdf is a cross-tenant file footgun.',
    whenToUse: 'Any uploads, invoices, exports.',
    whenAvoid: 'Unsigned public URLs for tenant documents.',
    mermaid: `flowchart LR
  A[tenant-a/orders/123.pdf]
  B[tenant-b/orders/123.pdf]
  IAM[IAM prefix condition] --> A
  IAM --> B`,
    code: `String key = tenantSlug + "/orders/" + orderId + "/" + filename;
// mint short-lived signed URL only after DB ownership check`,
    failure: 'List-bucket without prefix in admin tools; long-lived public ACLs.',
    production: 'Prefix keys; IAM StringLike; optional bucket-per-tenant + KMS CMK for enterprise.',
    interview30s:
      'Object keys always include tenant. Authorize via DB then sign URL. Enterprise may get dedicated bucket and key.',
    followUp: 'How do you prevent signed URL sharing abuse?',
    tradeoff: 'One bucket prefixes vs many buckets.',
    memoryTrick: 'Path starts with tenant.',
  },
];
