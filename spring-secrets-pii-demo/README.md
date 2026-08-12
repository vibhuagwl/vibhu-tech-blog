# Spring Secrets + PII Demo

Runnable `customer-service` showing how to load **credentials from env/K8s secrets** (never hard-coded) and protect **PII at rest, in transit, in logs, and in API responses**.

## Run locally

```bash
# 32-byte AES key (base64) — dev only; prod uses KMS/Secrets Manager → env injection
export PII_ENCRYPTION_KEY="$(openssl rand -base64 32)"
export DB_PASSWORD="local-dev-only"
export API_BASIC_USER="support"
export API_BASIC_PASSWORD="support-secret"

cd customer-service
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

```bash
# Create customer (PII encrypted in DB)
curl -u support:support-secret -H 'Content-Type: application/json' \
  -d '{"fullName":"Jane Doe","email":"jane.doe@bank.com","ssn":"123-45-6789","panLast4":"4242"}' \
  http://localhost:8085/api/customers

# Masked response (default ROLE_SUPPORT)
curl -u support:support-secret http://localhost:8085/api/customers/{id}

# Full PII — requires ROLE_PII_ADMIN
curl -u piiadmin:pii-admin-secret http://localhost:8085/api/customers/{id}?fullPii=true
```

## What this demonstrates

| Layer | Code |
|-------|------|
| Secrets from env | `SecretsConfig`, `EnvironmentSecretProvider` |
| No secrets in logs | `SecretSanitizer`, `PiiMaskingConverter` |
| PII encrypted at rest | `AesGcmAttributeConverter` on SSN/email columns |
| Masked API responses | `CustomerService.toResponse`, `PiiMasking` |
| Access audit | `PiiAccessAuditAspect` |
| Role-gated full PII | `@PreAuthorize` on controller |

Browse full source: `/spring-secrets-pii-demo` on the blog site.
