# OAuth 2.0 + JWT Demo (Spring Boot 3.4 / Security 6)

Production-oriented multi-module demo for **Staff/Principal Spring Security interviews**.

## Version selection

| Component | Version | Why |
|---|---|---|
| Java | 21 | LTS; required by Spring Boot 3.4 |
| Spring Boot | **3.4.5** | Manages Spring Security 6.4.x + Authorization Server via BOM |
| Spring Authorization Server | via `spring-boot-starter-oauth2-authorization-server` | Boot-aligned; do not pin a conflicting SAS version manually |
| Spring Cloud | **2024.0.1** | Compatible with Boot 3.4 for Gateway |
| PostgreSQL / H2 | 16 / 2.x | Docker uses Postgres; local/tests use H2 in PostgreSQL mode |

Avoid `WebSecurityConfigurerAdapter` (removed). Use `SecurityFilterChain`.

## Architecture

```text
User → Client App (:8082)
         │ Authorization Code (+ OIDC)
         ▼
Authorization Server (:9000)
  /oauth2/authorize  /oauth2/token  /oauth2/jwks  /.well-known/openid-configuration
         │ JWT (RS256, kid=key-1)
         ▼
API Gateway (:8080) ── validates JWT at edge
         │ forwards Authorization header
         ▼
Resource Server (:8081) ── re-validates JWT + scopes/roles (zero-trust)
```

### Why each module exists

- **authorization-server** — authenticates users, issues codes/tokens, exposes JWKS
- **resource-server** — protects APIs; signature/issuer/audience/scope/role checks
- **api-gateway** — single entry; authenticates at edge but does **not** replace service authz
- **client-app** — confidential web client demonstrating code flow + calling APIs with access token

## Quick start (local)

```bash
cd oauth-jwt-demo
mvn clean test
mvn -pl authorization-server spring-boot:run   # :9000
mvn -pl resource-server spring-boot:run        # :8081
mvn -pl api-gateway spring-boot:run            # :8080
mvn -pl client-app spring-boot:run             # :8082
```

Open http://127.0.0.1:8082 → Login → users `alice` / `admin`, password `password`.

### Client credentials (service-to-service)

```bash
curl -s -u payment-service:payment-secret \
  -X POST http://localhost:9000/oauth2/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=client_credentials&scope=account.read'
```

## Seeded OAuth clients

| client_id | type | grants | notes |
|---|---|---|---|
| `web-client` / `web-secret` | confidential | code + refresh | consent required |
| `spa-client` | public | code + refresh | **PKCE required** |
| `payment-service` / `payment-secret` | confidential | client_credentials | S2S |

## JWT claims (access token)

- `aud`: `payment-api`, `account-api`, `report-api`
- `roles`: from `ROLE_*` authorities
- standard `iss`, `sub`, `exp`, `iat`, `jti`, `scope`

Resource server validates **signature (JWKS)**, **issuer**, **audience**, then `@PreAuthorize` on scopes/roles.

## Key management

Demo uses an **ephemeral RSA key** at process start (`kid=key-1`). Restart invalidates old tokens.

Production: private key in KMS/HSM/Vault; publish JWKS; rotate with overlapping kids; never commit private keys.

## Docs

- [docs/CONCEPTS.md](docs/CONCEPTS.md)
- [docs/FLOWS.md](docs/FLOWS.md)
- [docs/INTERNALS.md](docs/INTERNALS.md)
- [docs/THREAT-MODEL.md](docs/THREAT-MODEL.md)
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- [docs/INTERVIEW.md](docs/INTERVIEW.md)
- [docs/PRODUCTION.md](docs/PRODUCTION.md)
- [postman/oauth-jwt-demo.postman_collection.json](postman/oauth-jwt-demo.postman_collection.json)
- [scripts/curl-examples.sh](scripts/curl-examples.sh)

## Design decisions

| Decision | Why | Alternative | When alternative wins |
|---|---|---|---|
| JWT access tokens | Local validation; AS outage tolerant for existing tokens | Opaque + introspection | Need instant revoke |
| RS256 asymmetric | Private key only on AS | HS256 shared secret | Single service |
| Gateway + RS validation | Zero trust | Gateway-only authz | Strong mTLS mesh |
| Short AT (~10m) + refresh rotation | Limit theft window | Long-lived AT | Avoid for APIs |

## Tests

```bash
mvn test
```
