# Interview notes — Spring Security without OAuth

## Punchlines
1. Authentication answers “who”; authorization answers “what are they allowed to do.”
2. In a monolith (or single trust domain), Spring Security does **both** in the same app — no Authorization Server required.
3. OAuth becomes valuable when **clients you do not fully control** need tokens, or when you want SSO across many apps.

## Expect follow-ups
- Difference between `authenticated()`, `hasRole`, `hasAuthority`, `@PreAuthorize`
- Why `ROLE_` prefix exists and how `hasRole('ADMIN')` maps to `ROLE_ADMIN`
- CSRF: needed for cookie/session browser apps; usually off for pure Bearer/Basic APIs
- Session fixation, concurrent session control
- Password storage: BCrypt/Argon2, never plaintext
- Method security vs URL security — defense in depth
- Role hierarchy pitfalls (over-granting)

## Contrast with oauth-jwt-demo
| Topic | This demo | OAuth demo |
|---|---|---|
| Login | Form / Basic against local DB | Redirect to AS |
| Credential proof per API call | Session cookie or Basic | Bearer JWT |
| Cross-service identity | Shared user DB / Basic | JWT + JWKS |
| Consent / scopes | Roles only | OAuth scopes + consent |

## Talk track (90 seconds)
> We authenticate with form login into a server session. Spring Security stores an Authentication with ROLE_* authorities. URL rules block /admin for USER. PaymentService methods add @PreAuthorize so authorization is not only at the edge. For the JSON API we use HTTP Basic and STATELESS sessions — still no OAuth — because the API client can send credentials per request. When we need third-party clients or SSO, we graduate to the OAuth + JWT lab.
