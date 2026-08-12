# Concepts — OAuth 2.0, OIDC, JWT

## Roles
Resource Owner (user), Client (app), Authorization Server, Resource Server.

## Authentication vs Authorization
Authentication = who are you? Authorization = what may you do?

## OAuth 2.0 vs OpenID Connect
OAuth = API access delegation. OIDC = identity layer (`openid` → ID Token).
Never use an ID Token as an API Bearer token.

## JWT
`header.payload.signature`. Claims: iss, sub, aud, exp, iat, nbf, jti, scope + custom roles.
RS256 preferred for microservices (AS holds private key; RSes use JWKS).
