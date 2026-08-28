export type MemoryDiagram = {
  id: string;
  title: string;
  hook: string;
  mermaid: string;
  anchors?: {id: string; label: string}[];
};

/** Whiteboard-ready diagrams — one glance each for Staff/Principal interviews. */
export const MEMORY_DIAGRAMS: MemoryDiagram[] = [
  {
    id: 'lifecycle',
    title: 'Security lifecycle (memorize this first)',
    hook: 'IDENTITY → AUTHN → TOKENS → AUTHZ → ACCESS → AUDIT → INCIDENT',
    mermaid: `flowchart TB
  ID[IDENTITY<br/>OAuth2 · OIDC · mTLS · API Key]
  ID --> AUTHN[AUTHENTICATION<br/>Who are you? → 401]
  AUTHN --> TOK[TOKENS<br/>JWT · Opaque · Refresh]
  TOK --> AUTHZ[AUTHORIZATION<br/>RBAC · ABAC · Object-level → 403]
  AUTHZ --> ACCESS[RESOURCE ACCESS<br/>Payment · Order · Account]
  ACCESS --> AUDIT[AUDIT / MONITOR<br/>SIEM · Prometheus]
  AUDIT --> IR[INCIDENT RESPONSE<br/>Revoke · Rotate · Re-auth]`,
    anchors: [
      {id: 'oauth2-auth-server', label: 'OAuth AS'},
      {id: 'jwt-production', label: 'JWT validation'},
      {id: 'object-level-authz', label: 'Object authz'},
      {id: 'incident-response', label: 'Incident response'},
    ],
  },
  {
    id: 'filter-chain',
    title: 'Spring Security filter chain (north → south)',
    hook: 'DelegatingFilterProxy → FilterChainProxy → filters → controller',
    mermaid: `flowchart TD
  REQ[HTTP Request] --> DFP[DelegatingFilterProxy]
  DFP --> FCP[FilterChainProxy]
  FCP --> SFC[SecurityFilterChain]
  SFC --> SCH[SecurityContextHolderFilter]
  SCH --> CSRF[CsrfFilter]
  CSRF --> BEAR[BearerTokenAuthenticationFilter]
  BEAR --> UPA[UsernamePasswordAuthenticationFilter]
  UPA --> ANON[AnonymousAuthenticationFilter]
  ANON --> EX[ExceptionTranslationFilter]
  EX --> AUTHZ[AuthorizationFilter]
  AUTHZ --> CTRL[Controller]

  style BEAR fill:#dcfce7
  style AUTHZ fill:#e9d5ff
  style EX fill:#fee2e2`,
    anchors: [{id: 'security-internals', label: 'Internals deep dive'}, {id: 'custom-filters', label: 'Custom filters'}],
  },
  {
    id: 'authn-authz-401-403',
    title: 'Authentication vs Authorization · 401 vs 403',
    hook: 'No token / bad token = 401 · Valid token, wrong permission = 403',
    mermaid: `flowchart LR
  subgraph AUTHN["Authentication (401)"]
    A1[No Bearer token]
    A2[Expired JWT]
    A3[Bad signature]
  end
  subgraph AUTHZ["Authorization (403)"]
    B1[Missing scope]
    B2[Wrong tenant]
    B3[Not owner]
  end
  AUTHN -->|401 Unauthorized| DENY1[Reject]
  AUTHZ -->|403 Forbidden| DENY2[Reject]
  OK[Valid identity + permission] -->|200| ALLOW[Controller]`,
    anchors: [{id: 'authn-authz', label: 'Authn vs authz'}, {id: 'object-level-authz', label: 'Object-level'}],
  },
  {
    id: 'auth-manager-flow',
    title: 'Login → AuthenticationManager → Provider',
    hook: 'POST /login → Manager → Provider → UserDetailsService → PasswordEncoder',
    mermaid: `flowchart TD
  POST[POST /login] --> AM[AuthenticationManager]
  AM --> AP1[DaoAuthenticationProvider]
  AM --> AP2[OtpAuthenticationProvider]
  AM --> AP3[LdapAuthenticationProvider]
  AP1 --> UDS[UserDetailsService]
  AP1 --> PE[PasswordEncoder]
  AP2 --> OTP[OtpService]
  AM --> CTX[SecurityContextHolder]
  CTX --> JWT_OUT[Issue JWT / Session]`,
    anchors: [{id: 'auth-manager-provider', label: 'Custom providers'}],
  },
  {
    id: 'oauth-code-pkce',
    title: 'OAuth2 Authorization Code + PKCE',
    hook: 'Browser → authorize + code_challenge → code → token + code_verifier',
    mermaid: `sequenceDiagram
  participant B as Browser
  participant C as Client :8082
  participant AS as Auth Server :9000
  participant RS as Resource Server :8081
  B->>C: Click Login
  C->>AS: /oauth2/authorize + PKCE challenge
  AS->>B: Login + consent
  AS->>C: redirect ?code=
  C->>AS: POST /token + code_verifier
  AS-->>C: access_token + refresh_token
  C->>RS: Bearer access_token
  RS-->>C: 200 payment data`,
    anchors: [
      {id: 'oauth-oidc', label: 'OAuth intro'},
      {id: 'oauth2-auth-server', label: 'Auth Server'},
      {id: 'oauth2-threat-model', label: 'Threat model'},
    ],
  },
  {
    id: 'jwt-anatomy',
    title: 'JWT anatomy — what to validate',
    hook: 'Header alg/kid · Payload iss/sub/aud/exp · Signature — never trust payload alone',
    mermaid: `flowchart TB
  JWT[JWT Bearer Token]
  JWT --> H[Header<br/>alg · kid]
  JWT --> P[Payload<br/>iss · sub · aud · exp · nbf · iat · jti · tenant_id]
  JWT --> S[Signature<br/>RS256 / ES256]
  H --> V1[Algorithm allowlist]
  P --> V2[iss + aud + exp + required claims]
  S --> V3[Jwks by kid]
  V1 --> OK[SecurityContext]
  V2 --> OK
  V3 --> OK`,
    anchors: [
      {id: 'jwt', label: 'JWT basics'},
      {id: 'jwt-production', label: 'Production validators'},
      {id: 'jwt-key-rotation', label: 'Key rotation'},
    ],
  },
  {
    id: 'jwt-vs-opaque',
    title: 'JWT vs Opaque token — when to pick which',
    hook: 'JWT = fast local validate · Opaque = instant revoke via introspect',
    mermaid: `flowchart TD
  Q{Need instant revocation?}
  Q -->|No — high throughput| JWT[JWT Resource Server<br/>JwtDecoder + JWKS]
  Q -->|Yes — high security| OPA[Opaque Token<br/>POST /oauth2/introspect]
  JWT --> J1[Validate sig + iss + aud locally]
  OPA --> O1[active=true/false from AS]
  OPA --> O2[Cache 15–60s]
  JWT --> R1[Risk: wait for exp or jti denylist]
  OPA --> R2[Risk: AS latency — cache + CB]`,
    anchors: [
      {id: 'opaque-token-introspection', label: 'Introspection'},
      {id: 'token-revocation', label: 'Revocation'},
    ],
  },
  {
    id: 'refresh-rotation',
    title: 'Refresh token rotation + reuse detection',
    hook: 'R1 → A1 + R2 (R1 dead) · Reuse R1 → revoke entire family',
    mermaid: `flowchart TD
  R1[Refresh Token R1] --> AT1[Access Token A1]
  R1 --> R2[New Refresh R2]
  R1 -.->|invalidated| X1[R1 dead]
  R1X[Attacker reuses R1] --> DET[TOKEN REUSE DETECTED]
  DET --> REV[Revoke entire token family]
  REV --> REAUTH[Force re-login all devices]`,
    anchors: [{id: 'refresh-token-security', label: 'Refresh security'}],
  },
  {
    id: 'jwks-rotation',
    title: 'JWT key rotation (zero downtime)',
    hook: 'Old + New in JWKS → sign with New kid → wait TTL → remove Old',
    mermaid: `flowchart LR
  OLD[Old Key kid-2025] --> JWKS[Publish BOTH in /oauth2/jwks]
  NEW[New Key kid-2026] --> JWKS
  JWKS --> SIGN[Start signing with New]
  SIGN --> WAIT[Wait max access_token TTL]
  WAIT --> DROP[Remove Old from JWKS]`,
    anchors: [{id: 'jwt-key-rotation', label: 'Key rotation code'}],
  },
  {
    id: 'oidc-tokens',
    title: 'OIDC — ID Token vs Access Token',
    hook: 'ID token → browser identity · Access token → API only — never swap them',
    mermaid: `flowchart LR
  subgraph IDT["ID Token (OIDC)"]
    I1[aud = client_id]
    I2[nonce for replay protection]
    I3[For login session only]
  end
  subgraph AT["Access Token (OAuth2)"]
    A1[aud = payment-api]
    A2[scope = payment:read]
    A3[For Resource Server]
  end
  IDT -->|WRONG| X[Never send to /api/payments]
  AT -->|CORRECT| API[Resource Server]`,
    anchors: [{id: 'oidc-deep-dive', label: 'OIDC deep dive'}, {id: 'oauth-oidc', label: 'OAuth + OIDC'}],
  },
  {
    id: 'object-level',
    title: 'Object-level authorization (stop BOLA / IDOR)',
    hook: 'Authenticated + scope + THIS payment.tenantId + THIS payment.ownerId',
    mermaid: `flowchart TD
  GET["GET /payments/123"] --> AUTHN[Authenticated?]
  AUTHN --> SCOPE[SCOPE_payment:read?]
  SCOPE --> TEN[payment.tenantId == jwt.tenant_id?]
  TEN --> OWN[payment.ownerId == sub OR ADMIN?]
  OWN -->|all yes| OK[200 Return payment]
  AUTHN -->|no| E401[401]
  SCOPE -->|no| E403[403]
  TEN -->|no| E403
  OWN -->|no| E403`,
    anchors: [
      {id: 'object-level-authz', label: 'Object authz'},
      {id: 'method-security', label: 'Method security'},
      {id: 'multi-tenant-security', label: 'Multi-tenant'},
    ],
  },
  {
    id: 'multi-tenant',
    title: 'Multi-tenant isolation',
    hook: 'JWT tenant_id → TenantContext → every query filters tenant',
    mermaid: `flowchart TD
  JWT["JWT tenant_id=T-A"] --> RES[TenantResolver]
  RES --> CTX[TenantContext ThreadLocal]
  CTX --> SQL["SELECT * FROM payments WHERE tenant_id = ?"]
  CTX --> AUTHZ["@tenantAuth.sameTenant()"]
  TA[Tenant A token] -->|blocked| TB[Tenant B payment]
  style TB fill:#fee2e2`,
    anchors: [{id: 'multi-tenant-security', label: 'Multi-tenant arch'}],
  },
  {
    id: 'token-relay',
    title: 'Token relay vs token exchange',
    hook: 'Do NOT blind-forward user JWT — exchange for narrow service token',
    mermaid: `flowchart TD
  U[User JWT full scopes] --> GW[API Gateway]
  GW -->|BAD blind relay| SVC1[Any microservice trusts all scopes]
  GW -->|GOOD token exchange| EX[RFC 8693 Token Exchange]
  EX --> NARROW[Service-scoped token payment.capture only]
  NARROW --> PAY[Payment Service]`,
    anchors: [{id: 'token-relay-propagation', label: 'Token relay'}],
  },
  {
    id: 'mfa-step-up',
    title: 'MFA step-up for high-risk actions',
    hook: 'Normal read = JWT · Approve payment = JWT + fresh mfa_at claim',
    mermaid: `flowchart LR
  READ[GET /payments] --> S1[SCOPE_payment:read]
  APPROVE[POST /approve] --> S2[SCOPE_payment:approve]
  S2 --> MFA[mfa_at within 5 min?]
  MFA -->|yes| OK[200 Approved]
  MFA -->|no| E403[403 Step-up required]`,
    anchors: [{id: 'mfa-step-up', label: 'MFA code'}, {id: 'webauthn-passkeys', label: 'WebAuthn'}],
  },
  {
    id: 'bff-pattern',
    title: 'BFF — tokens stay server-side',
    hook: 'Browser gets HttpOnly cookie · BFF holds OAuth tokens · JS never sees access_token',
    mermaid: `flowchart LR
  B[Browser] -->|Secure HttpOnly Cookie| BFF[BFF Spring Boot]
  BFF -->|OAuth2 server-side| AS[Authorization Server]
  BFF -->|Bearer token| API[Microservices]
  B -.->|never| X[localStorage access_token]`,
    anchors: [{id: 'bff-pattern', label: 'BFF config'}, {id: 'session-management', label: 'Sessions'}],
  },
  {
    id: 'enterprise-stack',
    title: 'Enterprise FinTech security stack (5-min whiteboard)',
    hook: 'IdP → Gateway → services JWT+mTLS → Kafka TLS+ACL → audit',
    mermaid: `flowchart TB
  IDP["Identity IdP<br/>OAuth2 · OIDC · MFA"]
  IDP --> GW["API Gateway<br/>TLS · WAF · Rate Limit · JWT"]
  GW --> ORD[Order Service]
  GW --> PAY[Payment Service]
  GW --> USR[User Service]
  ORD <-->|mTLS| PAY
  ORD --> KF["Kafka<br/>TLS · SASL · ACL"]
  PAY --> KF
  ORD --> AUD[Audit SIEM]
  PAY --> AUD`,
    anchors: [
      {id: 'enterprise-architecture', label: 'Capstone'},
      {id: 'microservice-security', label: 'Microservice security'},
      {id: 'kafka-security', label: 'Kafka security'},
    ],
  },
  {
    id: 'defense-in-depth',
    title: 'Defense in depth — 7 layers on one payment POST',
    hook: 'WAF → Gateway JWT → mTLS → @PreAuthorize → object check → DB tenant filter → audit',
    mermaid: `flowchart TD
  L1[1 WAF + rate limit] --> L2[2 Gateway JWT + scope]
  L2 --> L3[3 Service mTLS + re-validate JWT]
  L3 --> L4[4 @PreAuthorize + MFA step-up]
  L4 --> L5[5 Object-level tenant + owner]
  L5 --> L6[6 DB row tenant_id filter]
  L6 --> L7[7 Audit every denial]`,
    anchors: [{id: 'security-patterns', label: 'Design patterns'}, {id: 'payment-e2e', label: 'Payment E2E'}],
  },
  {
    id: 'oauth-threats',
    title: 'OAuth2 threats → Spring fix (quick map)',
    hook: 'Code theft→PKCE · Redirect→exact URI · CSRF→state · Deputy→aud/iss',
    mermaid: `flowchart LR
  T1[Code interception] --> F1[PKCE S256]
  T2[Redirect URI attack] --> F2[Exact registered URI]
  T3[Authorize CSRF] --> F3[state parameter]
  T4[Token leakage] --> F4[BFF HttpOnly cookie]
  T5[Confused deputy] --> F5[aud + token exchange]
  T6[Mix-up attack] --> F6[Validate iss per client]`,
    anchors: [{id: 'oauth2-threat-model', label: 'Full threat model'}],
  },
  {
    id: 'session-vs-stateless',
    title: 'Stateful session vs stateless JWT',
    hook: 'Session = CSRF on + HttpOnly cookie · JWT Bearer = CSRF off + no server session',
    mermaid: `flowchart TD
  subgraph SESSION["Stateful Session"]
    S1[HttpOnly SESSION cookie]
    S2[CSRF token required]
    S3[Server-side revoke on logout]
  end
  subgraph STATELESS["Stateless JWT"]
    J1[Authorization Bearer header]
    J2[CSRF usually disabled]
    J3[Revoke via denylist or short TTL]
  end`,
    anchors: [
      {id: 'session-management', label: 'Session mgmt'},
      {id: 'csrf', label: 'CSRF'},
      {id: 'jwt', label: 'JWT'},
    ],
  },
  {
    id: 'incident-playbook',
    title: 'Incident response — 3 scenarios',
    hook: 'Compromised JWT → denylist jti · Key leak → rotate JWKS · API key → revoke + notify',
    mermaid: `flowchart TD
  subgraph JWT_INC["Compromised JWT"]
    J1[Identify jti + user] --> J2[Denylist jti]
    J2 --> J3[Revoke refresh tokens]
    J3 --> J4[Force re-auth]
  end
  subgraph KEY_INC["Compromised signing key"]
    K1[Stop signing with kid] --> K2[Publish new JWKS]
    K2 --> K3[Wait token TTL]
    K3 --> K4[Remove old key]
  end
  subgraph API_INC["Compromised API key"]
    A1[Revoke key hash] --> A2[Audit API_KEY_REVOKED]
    A2 --> A3[Notify merchant]
  end`,
    anchors: [{id: 'incident-response', label: 'Incident runbooks'}],
  },
];
