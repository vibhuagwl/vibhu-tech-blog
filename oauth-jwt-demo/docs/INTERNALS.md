# JWT Validation Internals

BearerTokenAuthenticationFilter → JwtAuthenticationProvider → JwtDecoder/JWKS
→ signature + iss/exp/aud → SCOPE_/ROLE_ mapping → @PreAuthorize → Controller.

Forging roles without the private key fails signature verification → 401.

AS down: existing JWTs may work until exp if JWKS cached; login/refresh fail.
