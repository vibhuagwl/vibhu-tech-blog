export type Mistake = {bad: string; good: string; why: string};

export const PRODUCTION_MISTAKES: Mistake[] = [
  {
    bad: 'Trust X-Tenant-ID alone',
    good: 'JWT tenant authoritative; mismatch → 403',
    why: 'Header spoofing is trivial impersonation',
  },
  {
    bad: 'orderRepository.findById(id)',
    good: 'findByIdAndTenantId(id, tenantId)',
    why: 'BOLA / cross-tenant read by UUID guess',
  },
  {
    bad: 'Cache key user:123',
    good: 'tenant:{tenantId}:user:123',
    why: 'Silent cache leakage across companies',
  },
  {
    bad: 'Kafka payload without tenantId',
    good: 'Envelope requires tenantId or reject/DLQ',
    why: 'Consumer cannot safely touch tenant data',
  },
  {
    bad: 'Set TenantContext, forget clear()',
    good: 'try/finally clear + MDC.clear',
    why: 'Thread pool reuses previous tenant',
  },
  {
    bad: 'findAll(Pageable)',
    good: 'findAllByTenantId(tenantId, pageable)',
    why: 'Cross-tenant lists and huge scans',
  },
  {
    bad: 'Global rate limit only',
    good: 'Per-tenant (and per-user) limits',
    why: 'Noisy neighbor exhausts everyone',
  },
  {
    bad: 'S3 key /orders/123.pdf',
    good: 'tenant-a/orders/123.pdf',
    why: 'Object storage IDOR',
  },
  {
    bad: 'One giant TX for onboard + CREATE DATABASE',
    good: 'Provisioning saga with statuses',
    why: 'External resources do not roll back with SQL',
  },
  {
    bad: 'Metric label tenant_id for every HTTP call at 100k tenants',
    good: 'Tier labels + traces/logs for tenant',
    why: 'Prometheus cardinality explosion',
  },
  {
    bad: 'Admin role is global',
    good: 'Roles scoped to tenant; platform admin separate',
    why: 'Privilege escalation across tenants',
  },
  {
    bad: 'Replay DLQ without restoring tenant',
    good: 'Replay sets TenantContext from stored tenantId',
    why: 'Writes land in the wrong slice',
  },
];
