# spring-jwt-auth-demo

First-party JWT authentication for Spring Boot 3.4 / Security 6 / Java 21.

This is **not** OAuth2 or OIDC. The app issues its own access JWTs after email+password login.
Compare with `oauth-jwt-demo` (Authorization Server) and `idanywhere-oidc-demo` (corporate IdP).

```text
Client → POST /api/auth/login → AuthenticationManager → UserDetailsService → DB
                              → JwtService (HS256 access) + RefreshTokenService (opaque, hashed)
Client → Authorization: Bearer <access> → JwtAuthenticationFilter → SecurityContext → API
```

## Run

```bash
cd spring-jwt-auth-demo
mvn test
mvn spring-boot:run
# http://127.0.0.1:8092
```

Seed users (password `StrongPassword123!`):

- `user@example.com` — ROLE_USER
- `admin@example.com` — ROLE_USER + ROLE_ADMIN

HMAC secret: env `JWT_SECRET` (32+ bytes). Local `application.yml` has a **dev-only** default.

## Endpoints

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/refresh` | public (refresh body) |
| POST | `/api/auth/logout` | public (refresh body; optional Bearer) |
| GET | `/api/users/me` | ROLE_USER or ROLE_ADMIN |
| GET | `/api/admin/users` | ROLE_ADMIN |
| GET | `/actuator/health` | public |

See `scripts/curl-examples.sh`.

## Tokens

| Token | Type | TTL | Storage |
|---|---|---|---|
| Access | JWT HS256 | 15m | Client `Authorization` header |
| Refresh | Opaque 256-bit | 7d | DB as SHA-256 hash; rotated on use |

Logout revokes the refresh token and denylists the access `jti` until expiry.
A stolen access JWT without logout remains valid until `exp` — keep access TTL short.

## Production

- Set `JWT_SECRET` from AWS Secrets Manager / SSM (see `application-prod.yml`, profile `aws-secrets`).
- HTTPS at the load balancer. Restrict `security.cors.allowed-origins`.
- CSRF off because this API uses Bearer headers, not cookies.
- Prefer RS256/JWKS when many services must verify tokens they did not sign.
