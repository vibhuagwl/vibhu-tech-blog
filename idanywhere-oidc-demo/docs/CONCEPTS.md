# Concepts — IDAnywhere, ADFS, OIDC, OAuth

## What IDAnywhere is
Enterprise SSO gateway in front of **ADFS** (Active Directory Federation Services). Apps integrate with **OIDC discovery** (`issuer-uri`) rather than owning passwords.

## Protocol stack
- **OAuth 2.0** — authorization code / client credentials → `access_token`
- **OIDC** — `openid` scope → `id_token` (identity)
- **ADFS claims** — often `upn`, `unique_name`, `groups`, resource `aud` like `api://...`

## Your app responsibilities
1. Register as OIDC client (redirect URI allow-list).
2. `oauth2Login` for browsers; never collect corp passwords.
3. Call APIs with Bearer access token.
4. Resource servers validate JWKS from the IdP and authorize from claims.

## Stand-in vs production
`idp-standin` exists only so this repo is runnable without corp network access. Same Spring Security wiring works when `issuer-uri` points at real IDAnywhere.
