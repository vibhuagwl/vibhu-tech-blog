# Threat Model

| Attack | Mitigation |
|---|---|
| Auth code interception | PKCE, HTTPS, short code TTL |
| CSRF | Spring CSRF on AS cookie session; OAuth state |
| Token theft | Short AT TTL, refresh rotation, no token logs |
| alg=none / confusion | Trust RS256 via JWKS only |
| Redirect URI attack | Exact match registration |
| Secret leak | Secrets Manager; never Git |

JWT logout ≠ session logout. Prefer short TTL + refresh revocation over naive blacklists.
