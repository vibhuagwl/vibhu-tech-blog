'use client';

import Mermaid from '@/components/mermaid';

const AUTH_CODE_E2E = `sequenceDiagram
    autonumber
    actor User
    participant Client as Client App :8082
    participant AS as Auth Server :9000
    participant GW as API Gateway :8080
    participant RS as Resource Server :8081

    User->>Client: Open /payments
    Client->>Client: Start OAuth2 login (web-client)
    Client->>AS: GET /oauth2/authorize<br/>(response_type=code, client_id, redirect_uri, scope, state)
    AS->>User: Login + consent pages
    User->>AS: Credentials + approve scopes
    AS->>Client: Redirect with ?code=...&state=...
    Client->>AS: POST /oauth2/token<br/>(grant_type=authorization_code, code, client_secret)
    AS->>AS: Validate code, issue JWT (RS256, kid=key-1)
    AS-->>Client: access_token (JWT) + refresh_token + id_token
    Client->>GW: GET /api/payments<br/>Authorization: Bearer JWT
    GW->>GW: JwtDecoder via JWKS (iss, sig, exp)
    GW->>RS: Forward request + Authorization
    RS->>RS: Re-validate JWT + aud + scopes/roles
    RS-->>GW: 200 JSON
    GW-->>Client: 200 JSON
    Client-->>User: Render protected data`;

const PKCE = `sequenceDiagram
    autonumber
    actor User
    participant SPA as Public Client (spa-client)
    participant AS as Auth Server :9000

    SPA->>SPA: Generate code_verifier
    SPA->>SPA: code_challenge = BASE64URL(SHA256(verifier))
    SPA->>AS: /oauth2/authorize<br/>+ code_challenge + S256
    AS->>User: Login + consent
    User->>AS: Approve
    AS-->>SPA: authorization code
    SPA->>AS: POST /oauth2/token<br/>code + code_verifier (no client_secret)
    AS->>AS: SHA256(verifier) == challenge
    AS-->>SPA: access_token JWT + refresh_token`;

const CLIENT_CREDENTIALS = `sequenceDiagram
    autonumber
    participant Svc as payment-service
    participant AS as Auth Server :9000
    participant RS as Resource Server :8081

    Svc->>AS: POST /oauth2/token<br/>Basic auth + grant_type=client_credentials&scope=account.read
    AS->>AS: Authenticate client, no user consent
    AS-->>Svc: access_token JWT (no refresh in typical S2S)
    Note over Svc: ServiceTokenClient caches token<br/>and serializes refresh
    Svc->>RS: API call with Bearer JWT
    RS->>RS: Validate sig/iss/aud/scope
    RS-->>Svc: 200`;

const JWT_VALIDATION = `sequenceDiagram
    autonumber
    participant Client
    participant GW as API Gateway
    participant RS as Resource Server
    participant AS as Auth Server JWKS

    Client->>GW: Request + Bearer JWT
    GW->>AS: GET /oauth2/jwks (cached)
    AS-->>GW: public keys (kid)
    GW->>GW: Verify RS256 signature
    GW->>GW: Check iss, exp (and optionally aud)
    alt Invalid token
        GW-->>Client: 401 Unauthorized
    else Valid at edge
        GW->>RS: Forward + Authorization header
        RS->>AS: GET /oauth2/jwks (cached)
        AS-->>RS: public keys
        RS->>RS: Signature + iss + aud + exp
        RS->>RS: Map scope → SCOPE_*, roles → ROLE_*
        RS->>RS: @PreAuthorize method security
        alt Missing scope/role
            RS-->>GW: 403 Forbidden
            GW-->>Client: 403
        else Authorized
            RS-->>GW: 200
            GW-->>Client: 200
        end
    end`;

const REFRESH = `sequenceDiagram
    autonumber
    participant Client as Client App
    participant AS as Auth Server :9000

    Note over Client: Access token expired (~10m TTL)
    Client->>AS: POST /oauth2/token<br/>grant_type=refresh_token + refresh_token
    AS->>AS: Validate refresh, rotate if configured
    AS-->>Client: new access_token (+ new refresh_token)
    Note over Client,AS: Demo favors rotation-friendly refresh<br/>(reuse detection / one-time use)`;

const diagrams = [
  {
    id: 'auth-code',
    title: 'Authorization Code → JWT → Gateway → Resource Server',
    blurb: 'End-to-end confidential client (web-client) path used by the demo UI.',
    chart: AUTH_CODE_E2E,
  },
  {
    id: 'pkce',
    title: 'Authorization Code + PKCE (public / spa-client)',
    blurb: 'Proof Key for Code Exchange — required for spa-client; no client secret.',
    chart: PKCE,
  },
  {
    id: 'client-credentials',
    title: 'Client Credentials (service-to-service)',
    blurb: 'payment-service obtains a JWT and calls APIs without a user session.',
    chart: CLIENT_CREDENTIALS,
  },
  {
    id: 'jwt-validation',
    title: 'JWT validation at Gateway and Resource Server',
    blurb: 'Zero-trust: edge authn plus re-validation and method security on the RS.',
    chart: JWT_VALIDATION,
  },
  {
    id: 'refresh',
    title: 'Refresh token',
    blurb: 'Short-lived access tokens (~10m) with refresh grant when the AT expires.',
    chart: REFRESH,
  },
] as const;

export default function OAuthSequenceDiagrams() {
  return (
    <section className="mt-10 max-w-5xl" aria-labelledby="oauth-flows-heading">
      <h2 id="oauth-flows-heading" className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
        Sequence diagrams — OAuth & JWT end-to-end
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        How tokens move through Authorization Server (:9000), Gateway (:8080), and Resource Server (:8081)
        in this demo.
      </p>

      <div className="mt-6 space-y-10">
        {diagrams.map((d) => (
          <div key={d.id} id={d.id}>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{d.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{d.blurb}</p>
            <Mermaid chart={d.chart} />
          </div>
        ))}
      </div>
    </section>
  );
}

export {AUTH_CODE_E2E, PKCE, CLIENT_CREDENTIALS, JWT_VALIDATION, REFRESH};
