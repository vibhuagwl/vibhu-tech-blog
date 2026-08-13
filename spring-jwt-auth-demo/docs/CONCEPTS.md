# JWT concepts (short)

| Term | This lab |
|---|---|
| **Authentication** | Email + password via `AuthenticationManager` |
| **Authorization** | `ROLE_*` in JWT + `@PreAuthorize` |
| **Access token** | Short-lived JWT (HS256), header `Authorization: Bearer` |
| **Refresh token** | Opaque, hashed in DB, rotated, revocable |
| **Not this lab** | OAuth2 Authorization Server, OIDC, SAML |

## Why CSRF is disabled

Bearer tokens are not attached automatically by the browser on cross-site form posts.
Cookie + JWT would need CSRF (and `SameSite`).

## JWT storage

| Place | XSS | CSRF | This lab |
|---|---|---|---|
| localStorage | stolen by XSS | no CSRF | SPA only with tight CSP |
| sessionStorage | same | no CSRF | slightly better (tab scoped) |
| HttpOnly cookie | XSS cannot read | CSRF yes | enable CSRF |
| Memory + Authorization header | best XSS posture | no CSRF | **recommended for this API** |

## HS256 vs RS256

Monolith signing and verifying with one secret → HS256 is enough.
Many services verifying tokens they did not sign → RS256/ES256 + JWKS (public key only on resource servers).
