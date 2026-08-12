# Interview Bank (50+ starter set)

1. What is JWT? — signed claims, not encrypted by default.
2. OAuth vs OIDC? — access vs identity; never use id_token for APIs.
3. Why PKCE? — code interception on public clients.
4. RS256 vs HS256? — private key only on AS for microservices.
5. How RS validates? — JWKS, sig, iss/exp/aud, authorities.
6. JWT revocation? — short TTL + refresh revoke; opaque if instant kill needed.
7. Gateway-only authz? — no; zero trust at each service.
8. Client credentials? — service identity; cache tokens.
9. 401 vs 403? — unauthenticated vs insufficient privilege.
10. AS down? — existing JWT may work; new tokens fail.
11. What is JWKS / kid? — public key set and rotation marker.
12. Audience claim? — which API the token is for.
13. Scope vs role? — delegated capability vs user entitlement.
14. Refresh reuse detection? — steal signal; revoke family.
15. Clock skew? — nbf/exp tolerance.
16. Why not alg=none? — unsigned forgery.
17. Redirect URI exact match? — open redirect / code theft.
18. Consent? — user approves scopes for a client.
19. Opaque vs JWT tradeoffs? — revoke vs local validate.
20. Key compromise playbook? — rotate kid, revoke refresh, audit.

Continue with FLOWS/INTERNALS and the running demo for 30s/2m/5m answers on each.
Staff prompts: 100+ microservices OAuth, multi-region issuer, token validation under load, zero trust boundaries.
