# Multi-Tenant SaaS Order Platform Lab

Java 21 / Spring Boot 3 shared-schema multi-tenancy with JWT tenant binding, tenant-aware cache keys, outbox events, and cross-tenant isolation tests.

## Quick start (no Docker)

```bash
cd spring-multitenant-lab
mvn test
mvn spring-boot:run   # http://127.0.0.1:8096
```

Demo tenants: `walmart`, `amazon`, `jpmorgan`, `abc-retail` — password `password`.

```bash
# Mint JWT for Walmart
TOKEN=$(curl -sS -X POST 'http://127.0.0.1:8096/api/lab/token?tenantSlug=walmart' | jq -r .accessToken)

# Create customer + order
CUST=$(curl -sS -X POST http://127.0.0.1:8096/api/customers \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Store 1","email":"s1@walmart.lab"}')
CID=$(echo $CUST | jq -r .id)

ORDER=$(curl -sS -X POST http://127.0.0.1:8096/api/orders \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"customerId\":\"$CID\",\"amount\":99.50}")
OID=$(echo $ORDER | jq -r .id)

# Amazon tries to read Walmart order → 404 (not found for current tenant)
AMZ=$(curl -sS -X POST 'http://127.0.0.1:8096/api/lab/token?tenantSlug=amazon' | jq -r .accessToken)
curl -sS -o /dev/null -w '%{http_code}\n' \
  -H "Authorization: Bearer $AMZ" http://127.0.0.1:8096/api/orders/$OID

# JWT tenant=walmart + X-Tenant-ID: amazon → 403
curl -sS -o /dev/null -w '%{http_code}\n' \
  -H "Authorization: Bearer $TOKEN" -H 'X-Tenant-ID: amazon' \
  http://127.0.0.1:8096/api/orders
```

## Recommended architecture (this lab)

**Shared PostgreSQL schema + `tenant_id` on every owned table**, JWT `tenant_id`/`tenant_slug` as source of truth, repository methods always `findByIdAndTenantId`, tenant-prefixed cache keys, outbox events carrying `tenantId`, hybrid metadata so ENTERPRISE can mark `DEDICATED_DATABASE`.

## Infra profile

```bash
docker compose up -d postgres redis kafka
mvn spring-boot:run -Dspring-boot.run.profiles=infra
```

Interview hub: `/multi-tenant`.
