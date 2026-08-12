# OAuth Flows

## Authorization Code (+ PKCE)
Browser authorize → login/consent → code → token endpoint → JWT → API.

PKCE: `code_challenge = BASE64URL(SHA256(code_verifier))`. Required for `spa-client`.

## Client Credentials
Service identity. Cache tokens; serialize refresh (`ServiceTokenClient`).

## Refresh
`grant_type=refresh_token`. Demo disables refresh reuse (rotation-friendly).
