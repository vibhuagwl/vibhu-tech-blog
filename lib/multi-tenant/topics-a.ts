import type {MultiTenantTopic} from './types';

export const TOPICS_A: MultiTenantTopic[] = [
  {
    id: 'overview',
    title: '01. Business Story — SaaS Order Management',
    badge: 'Interview spine',
    problem:
      'One Order Management platform serves Walmart, Amazon, JP Morgan, and ABC Retail. Tenant A must never read, write, cache, or consume Tenant B’s data.',
    whenToUse: 'Any B2B SaaS where multiple companies share one deployment.',
    whenAvoid: 'True single-tenant on-prem where isolation is physical by default.',
    mermaid: `flowchart TD
  Client --> GW[API Gateway]
  GW --> Auth[JWT / OAuth2]
  Auth --> TR[Tenant Resolver]
  TR --> TC[Tenant Context]
  TC --> Svc[Order / Payment / Customer]
  Svc --> DL[Tenant Data Layer]
  DL --> Shared[(Shared Postgres + tenant_id + RLS)]
  DL --> Ded[(Dedicated DB enterprise)]`,
    code: `// Hard rule encoded in every repository
Optional<OrderEntity> findByIdAndTenantId(UUID id, UUID tenantId);`,
    failure: 'findById(orderId) alone → BOLA / cross-tenant read. Existence of a UUID is not authorization.',
    production: 'Name real tenants in the story. Isolation is a Sev-1 product requirement, not a DB footnote.',
    interview30s:
      'Shared SaaS order platform. JWT carries tenant. Every query, cache key, Kafka envelope, and object key is tenant-scoped. Cross-tenant access is 404/403.',
    followUp: 'Where does identification happen, and how does context travel?',
    tradeoff: 'Shared infra cost vs dedicated isolation for regulated whales.',
    memoryTrick: 'IDENTIFY → VALIDATE → CONTEXT → ISOLATE → EXECUTE → OBSERVE',
  },
  {
    id: 'architecture',
    title: '02. Recommended Architecture',
    badge: 'Production default',
    problem: 'Need one coherent recommendation: shared schema + RLS + hybrid dedicated SKU, not four equal options.',
    whenToUse: 'Series A → growth SaaS with optional enterprise tier.',
    whenAvoid: 'Day-one DB-per-tenant for ten pilot customers.',
    mermaid: `flowchart TB
  Internet --> GW[API Gateway]
  GW --> JWT[OAuth2 / JWT]
  JWT --> TR[Tenant Resolver]
  TR --> TC[Tenant Context + MDC]
  TC --> REST[REST APIs]
  TC --> K[Kafka / Outbox]
  REST --> SVC[Spring Services]
  K --> ES[Event Services]
  SVC --> TDL[Tenant Data Layer]
  ES --> TDL
  TDL --> PG[(Shared Postgres tenant_id)]
  TDL --> DED[(Dedicated DB)]
  PG --> RLS[Row-Level Security]
  TDL --> Redis[(Redis tenant keys)]`,
    code: `multitenant:
  resolver: composite   # JWT authoritative; header/subdomain must match
  isolation-default: SHARED_SCHEMA`,
    failure: 'Trusting X-Tenant-ID when JWT says otherwise → impersonation.',
    production: 'spring-multitenant-lab on :8096 encodes this shape with H2 default and infra profile for Postgres/Redis/Kafka.',
    interview30s:
      'Gateway → JWT → composite resolver → TenantContext → tenant-scoped repos + RLS → Redis/Kafka/S3 all prefixed by tenant. Enterprise flips to dedicated DB via metadata.',
    followUp: 'Why hybrid instead of pure shared or pure dedicated?',
    tradeoff: 'App complexity of hybrid routing vs cost of all-dedicated.',
    memoryTrick: 'JWT wins. tenant_id everywhere. RLS as seatbelt.',
  },
  {
    id: 'strategies',
    title: '03. Database Strategies Compared',
    badge: 'Staff question',
    problem: 'Interviewers expect shared schema vs schema-per-tenant vs DB-per-tenant vs hybrid with cost and ops honesty.',
    whenToUse: 'Architecture interviews and tenancy design reviews.',
    whenAvoid: 'Picking DB-per-tenant as security theater for a 10-user startup.',
    mermaid: `flowchart LR
  S1[Shared schema + tenant_id]
  S2[Schema per tenant]
  S3[DB per tenant]
  S4[Hybrid]
  S1 -->|SMB| S4
  S3 -->|Enterprise| S4`,
    code: `-- Shared schema (lab default)
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  ...
);
CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status);`,
    failure: 'Wrong search_path or wrong DataSource on pooled connections → silent cross-tenant queries.',
    production: 'Start shared + RLS. Graduate whales to dedicated. Schema-per-tenant when soft isolation + per-tenant dump matters.',
    interview30s:
      'Shared schema is cheapest. Schema-per-tenant improves logical dump isolation. DB-per-tenant is strongest and most expensive. Hybrid matches SaaS pricing tiers.',
    followUp: 'Connection pool math for 500 dedicated tenants?',
    tradeoff: 'Isolation strength rises with ops burden and connection count.',
    memoryTrick: 'Shared → Schema → Database → Hybrid upgrade path.',
  },
  {
    id: 'identify',
    title: '04. Tenant Identification (Strategy Pattern)',
    badge: 'Resolver',
    problem: 'Clients may send header, JWT claim, or subdomain. Spoofable signals must not override authenticated tenant.',
    whenToUse: 'Every authenticated request into a multi-tenant API.',
    whenAvoid: 'Letting anonymous traffic invent a tenant without a public allow-list.',
    mermaid: `flowchart TD
  Req[Request] --> H[HeaderTenantResolver]
  Req --> J[JwtTenantResolver]
  Req --> S[SubdomainTenantResolver]
  H --> C[CompositeTenantResolver]
  J --> C
  S --> C
  C -->|JWT wins| OK[Tenant bound]
  C -->|mismatch| R[403 tenant_mismatch]`,
    code: `// Composite: JWT authoritative
if (jwtTenant != null && headerTenant != null && !jwtTenant.equals(headerTenant)) {
  throw new TenantMismatchException();
}`,
    failure: 'Header overrides JWT → attacker sets X-Tenant-ID: victim.',
    production: 'Gateway may strip client X-Tenant-ID and inject from token. Lab keeps both to demonstrate mismatch rejection.',
    interview30s:
      'Header, JWT claim, subdomain behind TenantResolver. After auth, JWT is source of truth; other signals must match or we 403.',
    followUp: 'How do B2B API keys identify tenant?',
    tradeoff: 'Subdomain UX vs TLS/DNS complexity.',
    memoryTrick: 'Hint vs proof — JWT is proof.',
  },
  {
    id: 'context',
    title: '05. TenantContext & ThreadLocal Safety',
    badge: 'Leak class',
    problem: 'ThreadLocal is convenient on servlet threads and catastrophic if not cleared under pool reuse, @Async, Kafka, or Reactor.',
    whenToUse: 'Servlet/MVC apps with explicit finally cleanup.',
    whenAvoid: 'WebFlux — use Reactor Context instead of ThreadLocal.',
    mermaid: `flowchart TD
  F[TenantFilter] -->|set| TL[ThreadLocal]
  F --> MDC[MDC tenantId]
  F --> Ctrl[Controller/Service]
  Ctrl --> Finally[finally clear + MDC.clear]
  K[Kafka listener] -->|set from envelope| TL
  K --> Finally`,
    code: `try {
  TenantContext.setTenant(tenantId);
  TenantMdc.put(tenantId, userId, requestId);
  filterChain.doFilter(req, res);
} finally {
  TenantContext.clear();
  TenantMdc.clear();
}`,
    failure: 'Skip clear → next pooled request inherits Walmart while user is Amazon.',
    production: 'Propagate explicitly into @Async / CompletableFuture. Batch Kafka listeners set per record.',
    interview30s:
      'Set tenant in a filter, read it in services, always clear in finally. Async and Kafka must re-bind from message metadata.',
    followUp: 'Virtual threads change anything?',
    tradeoff: 'ThreadLocal simplicity vs explicit context objects for async.',
    memoryTrick: 'set without clear = next tenant inherits.',
  },
  {
    id: 'security',
    title: '06. JWT + Tenant Authorization',
    badge: 'Anti-impersonation',
    problem: 'AuthN without tenant bind still allows IDOR across companies.',
    whenToUse: 'All tenant-owned APIs.',
    whenAvoid: 'Platform SUPER_ADMIN tools — still audit and separate from tenant JWTs.',
    mermaid: `flowchart TD
  A[Authentication] --> V[Tenant Validation]
  V --> R[Role Validation]
  R --> P[Permission / Ownership]
  P --> OK[Execute]
  V -->|suspended| S403[403]
  P -->|other tenant row| N404[404]`,
    code: `{
  "sub": "user123",
  "tenant_id": "…",
  "tenant_slug": "walmart",
  "roles": ["ADMIN", "USER"]
}`,
    failure: 'Global ROLE_ADMIN without tenant scope → cross-tenant god mode.',
    production: 'Prefer 404 over 403 for cross-tenant resource ids to avoid existence leaks; use 403 for explicit mismatch/spoof.',
    interview30s:
      'JWT proves user and tenant. Roles are tenant-scoped. Repositories load by id AND tenant_id. Header cannot elevate tenant.',
    followUp: 'BOLA example with GET /orders/{id}?',
    tradeoff: '404 vs 403 for cross-tenant — privacy vs debuggability.',
    memoryTrick: 'AuthN → tenant → role → ownership.',
  },
];
