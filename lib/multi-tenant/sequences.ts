export type CodeSequence = {
  id: string;
  title: string;
  endpoint: string;
  classes: string[];
  why: string;
  mermaid: string;
};

export const CODE_SEQUENCES: CodeSequence[] = [
  {
    id: 'request',
    title: 'Request lifecycle',
    endpoint: 'GET /api/orders/{id}',
    classes: ['JwtAuthenticationFilter', 'TenantFilter', 'OrderService', 'OrderRepository'],
    why: 'JWT authenticates the user. TenantFilter binds TenantContext from JWT (header must match). Repository always filters by tenant_id.',
    mermaid: `sequenceDiagram
  autonumber
  participant C as Client
  participant J as JwtFilter
  participant T as TenantFilter
  participant S as OrderService
  participant DB as PostgreSQL
  C->>J: Authorization Bearer + optional X-Tenant-ID
  J->>J: parse tenant_slug claim
  J->>T: SecurityContext principal
  T->>T: JWT tenant authoritative
  T->>S: TenantContext set
  S->>DB: findByIdAndTenantId
  DB-->>S: row or empty
  T->>T: finally clear ThreadLocal`,
  },
  {
    id: 'cross',
    title: 'Cross-tenant blocked',
    endpoint: 'Amazon token → Walmart order id',
    classes: ['OrderRepository', 'TenantExceptions'],
    why: 'Existence of an order UUID is not authorization. findById alone is a BOLA bug.',
    mermaid: `sequenceDiagram
  participant A as Amazon JWT
  participant API as GET /orders/walmart-id
  participant DB as orders
  A->>API: Bearer amazon
  API->>DB: WHERE id=? AND tenant_id=amazon
  DB-->>API: empty
  API-->>A: 404 not_found`,
  },
  {
    id: 'mismatch',
    title: 'Header spoof',
    endpoint: 'JWT walmart + X-Tenant-ID amazon',
    classes: ['CompositeTenantResolver'],
    why: 'Never trust the client header when JWT already carries tenant.',
    mermaid: `sequenceDiagram
  participant C as Attacker
  participant R as CompositeResolver
  C->>R: JWT tenant=walmart
  C->>R: X-Tenant-ID=amazon
  R-->>C: 403 tenant_mismatch`,
  },
  {
    id: 'outbox',
    title: 'Outbox + Kafka',
    endpoint: 'POST /api/orders',
    classes: ['OrderService', 'OutboxPublisher', 'TenantOrderConsumer'],
    why: 'Order row + outbox row in one SQL TX. Publisher emits envelope with tenantId. Consumer sets TenantContext from the message, then clears.',
    mermaid: `sequenceDiagram
  participant S as OrderService
  participant DB as DB
  participant O as OutboxPublisher
  participant B as EventBus/Kafka
  participant K as Consumer
  S->>DB: INSERT order + outbox (same TX)
  O->>B: publish key=orderId payload+tenantId
  B->>K: extract tenantId
  K->>K: TenantContext.set
  K->>K: process
  K->>K: clear`,
  },
  {
    id: 'onboard',
    title: 'Tenant provisioning',
    endpoint: 'POST /api/tenants',
    classes: ['TenantProvisioningService'],
    why: 'Saga states: PROVISIONING → ACTIVE or PROVISIONING_FAILED with retry.',
    mermaid: `flowchart TD
  C[Create tenant row PROVISIONING] --> D[Provision DB/schema]
  D --> M[Config + admin user]
  M --> A[ACTIVE]
  D -->|fail| F[PROVISIONING_FAILED]
  F --> R[retry-provisioning]`,
  },
];
