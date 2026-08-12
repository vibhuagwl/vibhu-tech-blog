# Production Notes

LB → Gateway (TLS) → services. AS cluster + Postgres HA. Keys in KMS/HSM.
JWKS cached. Rate-limit token/authorize. Audit login/consent.
Log requestId/sub/client_id — never passwords, secrets, or tokens.
