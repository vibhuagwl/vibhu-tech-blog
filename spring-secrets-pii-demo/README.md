# Spring Boot PII Microservices Demo

Three-service layout for **real-world PII handling** — agents never touch the PII vault directly.

```
Support agent → support-api :8086 (mask/authorize)
                    ↓ RestClient + service creds
              customer-service :8085 (encrypt at rest, internal API)
                    ↓ audit event
              audit-service :8087 (compliance trail)
```

| Service | Port | Role |
|---------|------|------|
| **customer-service** | 8085 | PII vault — AES-GCM encrypted columns, `/internal/*` only |
| **support-api** | 8086 | Edge BFF — agents call here; masks PII; ships audit |
| **audit-service** | 8087 | Stores who accessed which customer PII and when |
| **pii-common** | jar | Shared DTOs, masking, audit event contract |

## Quick start (all 3 services)

```bash
bash scripts/run-all.sh
# In another terminal:
bash scripts/curl-microservices.sh
```

## Manual start

```bash
export PII_ENCRYPTION_KEY="$(openssl rand -base64 32)"
export DB_PASSWORD="local-dev-only"
export SERVICE_CLIENT_PASSWORD="service-secret"
export API_BASIC_PASSWORD="support-secret"
export PII_ADMIN_PASSWORD="pii-admin-secret"
export COMPLIANCE_PASSWORD="compliance-secret"

mvn install -DskipTests
mvn -pl audit-service spring-boot:run &
mvn -pl customer-service spring-boot:run &
mvn -pl support-api spring-boot:run &
```

## Real-time flow (bank support desk)

1. Agent `support` POSTs customer → **support-api** → **customer-service** encrypts SSN/email in DB → masked JSON back
2. Agent GET customer → support-api fetches full record internally → **masks** email/ssn → returns `j***@bank.com`
3. Agent tries `?fullPii=true` → **403** (no ROLE_PII_ADMIN)
4. Admin `piiadmin` GET `?fullPii=true` → full SSN/email → **audit-service** records actor + IP
5. Compliance `compliance` GET audit history for that customer

## Tests

```bash
mvn test
```

Browse source on the blog: `/spring-secrets-pii-demo`

Guide: `/realtime-issues/spring-secrets-pii-handling`
