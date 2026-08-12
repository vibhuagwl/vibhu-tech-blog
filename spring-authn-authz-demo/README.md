# Spring Authentication + Authorization (NO OAuth)

Staff/Principal interview lab: classic **Spring Security 6** authentication and authorization **without** OAuth2, JWT Authorization Server, or PKCE.

Compare with [`../oauth-jwt-demo`](../oauth-jwt-demo) when you need delegated identity / access tokens across services.

## Stack

| Component | Version |
|---|---|
| Java | 21 |
| Spring Boot | **3.4.5** |
| Spring Security | 6.4.x (via Boot) |
| Persistence | JPA + Flyway + H2 (Postgres-compatible mode) |

## Modules

```text
User ──form login──► web-portal :8080
                       │  session (JSESSIONID)
                       │  URL rules + @PreAuthorize
                       ▼
                     SecurityContext (ROLE_USER / ROLE_ADMIN)

Client ──HTTP Basic──► api-service :8081
                         │  stateless
                         │  URL rules + @PreAuthorize
                         ▼
                       same role model, no OAuth endpoints
```

| Module | Port | Authentication | Authorization |
|---|---|---|---|
| `web-portal` | 8080 | Form login + session | `/payments/**` USER, `/admin/**` ADMIN, method security |
| `api-service` | 8081 | HTTP Basic (stateless) | `/api/**` authenticated, `/api/admin/**` ADMIN |

**No** `/oauth2/authorize`, `/oauth2/token`, JWKS, or client registrations.

## Quick start

```bash
cd spring-authn-authz-demo
mvn clean test
mvn -pl web-portal spring-boot:run    # http://127.0.0.1:8080
mvn -pl api-service spring-boot:run   # http://127.0.0.1:8081
```

Users: `alice` / `admin`, password `password`.

### API examples

```bash
# 401 without credentials
curl -i http://localhost:8081/api/accounts/me

# USER
curl -u alice:password http://localhost:8081/api/accounts/me

# ADMIN only
curl -u alice:password -i http://localhost:8081/api/admin/stats   # 403
curl -u admin:password http://localhost:8081/api/admin/stats       # 200
```

## Mental model

1. **Authentication** — prove identity (`UserDetailsService` + `PasswordEncoder` + form login or HTTP Basic).
2. **Authorization** — decide access (`authorizeHttpRequests`, role hierarchy, `@PreAuthorize`).
3. **SecurityContext** — holds `Authentication` for the request (session in portal; per-request in Basic API).

## When to use this vs OAuth

| Use classic Spring Security | Use OAuth 2.0 + JWT |
|---|---|
| Single app / same trust domain | Many apps, 3rd-party clients, SSO |
| Browser session enough | Mobile/SPA/service-to-service tokens |
| You own user passwords | External IdP / delegated login |

## Docs

- [docs/CONCEPTS.md](docs/CONCEPTS.md)
- [docs/FLOWS.md](docs/FLOWS.md) — sequence diagrams
- [docs/INTERVIEW.md](docs/INTERVIEW.md)
- [scripts/curl-examples.sh](scripts/curl-examples.sh)
