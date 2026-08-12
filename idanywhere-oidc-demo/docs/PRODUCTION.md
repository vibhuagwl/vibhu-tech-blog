# Production checklist (real IDAnywhere)

1. Register confidential client; store secret in Vault/Secrets Manager.
2. Allow-list exact redirect URIs (`https://app…/login/oauth2/code/idanywhere`).
3. Confirm issuer from `/.well-known/openid-configuration` — do not guess paths.
4. Set resource audience (`api://…`) and validate `aud` on APIs.
5. Map AD security groups → app roles; never trust a client-supplied role header.
6. Use HTTPS; rotate client secrets; short AT TTL + refresh if issued.
7. Log `sub`/`upn`/request id — never log tokens or secrets.
8. Plan IdP outage: cached JWKS lets existing JWTs work until `exp`; new logins fail.
