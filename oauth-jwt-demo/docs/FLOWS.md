# OAuth Flows

## Authorization Code (+ PKCE)
Browser authorize → login/consent → code → token endpoint → JWT → API.

PKCE: `code_challenge = BASE64URL(SHA256(code_verifier))`. Required for `spa-client`.

### End-to-end (confidential web-client)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Client App :8082
    participant AS as Auth Server :9000
    participant GW as API Gateway :8080
    participant RS as Resource Server :8081

    User->>Client: Open /payments
    Client->>Client: Start OAuth2 login (web-client)
    Client->>AS: GET /oauth2/authorize (code, client_id, redirect_uri, scope, state)
    AS->>User: Login + consent pages
    User->>AS: Credentials + approve scopes
    AS->>Client: Redirect with code and state
    Client->>AS: POST /oauth2/token (authorization_code + client_secret)
    AS->>AS: Validate code, issue JWT RS256
    AS-->>Client: access_token JWT + refresh_token + id_token
    Client->>GW: GET /api/payments Authorization Bearer JWT
    GW->>GW: JwtDecoder via JWKS (iss, sig, exp)
    GW->>RS: Forward request + Authorization
    RS->>RS: Re-validate JWT + aud + scopes/roles
    RS-->>GW: 200 JSON
    GW-->>Client: 200 JSON
    Client-->>User: Render protected data
```

### PKCE (public spa-client)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant SPA as Public Client spa-client
    participant AS as Auth Server :9000

    SPA->>SPA: Generate code_verifier
    SPA->>SPA: code_challenge = BASE64URL(SHA256(verifier))
    SPA->>AS: /oauth2/authorize + code_challenge S256
    AS->>User: Login + consent
    User->>AS: Approve
    AS-->>SPA: authorization code
    SPA->>AS: POST /oauth2/token (code + code_verifier, no secret)
    AS->>AS: SHA256(verifier) equals challenge
    AS-->>SPA: access_token JWT + refresh_token
```

## Client Credentials
Service identity. Cache tokens; serialize refresh (`ServiceTokenClient`).

```mermaid
sequenceDiagram
    autonumber
    participant Svc as payment-service
    participant AS as Auth Server :9000
    participant RS as Resource Server :8081

    Svc->>AS: POST /oauth2/token Basic auth + client_credentials
    AS->>AS: Authenticate client, no user consent
    AS-->>Svc: access_token JWT
    Note over Svc: ServiceTokenClient caches token
    Svc->>RS: API call with Bearer JWT
    RS->>RS: Validate sig/iss/aud/scope
    RS-->>Svc: 200
```

## JWT validation (Gateway + Resource Server)

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant GW as API Gateway
    participant RS as Resource Server
    participant AS as Auth Server JWKS

    Client->>GW: Request + Bearer JWT
    GW->>AS: GET /oauth2/jwks (cached)
    AS-->>GW: public keys (kid)
    GW->>GW: Verify RS256 signature
    GW->>GW: Check iss, exp
    alt Invalid token
        GW-->>Client: 401 Unauthorized
    else Valid at edge
        GW->>RS: Forward + Authorization header
        RS->>AS: GET /oauth2/jwks (cached)
        AS-->>RS: public keys
        RS->>RS: Signature + iss + aud + exp
        RS->>RS: Map scope and roles, PreAuthorize
        alt Missing scope/role
            RS-->>GW: 403 Forbidden
            GW-->>Client: 403
        else Authorized
            RS-->>GW: 200
            GW-->>Client: 200
        end
    end
```

## Refresh
`grant_type=refresh_token`. Demo disables refresh reuse (rotation-friendly).

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client App
    participant AS as Auth Server :9000

    Note over Client: Access token expired (~10m TTL)
    Client->>AS: POST /oauth2/token refresh_token grant
    AS->>AS: Validate refresh, rotate if configured
    AS-->>Client: new access_token (+ new refresh_token)
```
