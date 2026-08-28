import type {MemoryDiagram} from './memory-diagram-types';

/** Extended diagrams — network, crypto, threats, cloud, ops (merged into MEMORY_DIAGRAMS). */
export const MEMORY_DIAGRAMS_EXTENDED: MemoryDiagram[] = [
  // ── Network & TLS ──
  {
    id: 'http-to-tls-ladder',
    group: 'Network & TLS',
    title: 'HTTP → HTTPS → TLS → mTLS ladder',
    hook: 'Plaintext → server cert → mutual certs → Spring filter chain → JWT',
    mermaid: `flowchart TD
  H[HTTP :8080 plaintext] --> HS[HTTPS server.ssl.enabled :8443]
  HS --> MT[mTLS client-auth: need]
  MT --> SS[Spring Security FilterChain]
  SS --> ID[JWT / OAuth2 / OIDC]
  style H fill:#fee2e2
  style MT fill:#dcfce7`,
    anchors: [{id: 'http-vs-https', label: 'HTTP vs HTTPS'}, {id: 'mtls', label: 'mTLS'}, {id: 'stack-ladder', label: 'Stack ladder'}],
  },
  {
    id: 'tls-handshake',
    group: 'Network & TLS',
    title: 'TLS 1.3 handshake (simplified)',
    hook: 'ClientHello → ServerHello + cert → key exchange → encrypted app data',
    mermaid: `sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: ClientHello + supported ciphers
  S->>C: ServerHello + certificate + key share
  C->>C: verify cert chain + hostname SAN
  C->>S: Finished (encrypted)
  Note over C,S: Application data — HTTPS`,
    anchors: [{id: 'tls', label: 'TLS deep dive'}, {id: 'certificates', label: 'X.509 certs'}],
  },
  {
    id: 'tls-vs-mtls',
    group: 'Network & TLS',
    title: 'TLS vs mTLS — who presents a cert?',
    hook: 'TLS = server cert only · mTLS = both sides prove identity',
    mermaid: `flowchart LR
  subgraph TLS["TLS (browser → API)"]
    C1[Client] -->|verifies server cert| S1[Server]
  end
  subgraph MTLS["mTLS (service → service)"]
    C2[Order Svc] <-->|both present certs| S2[Payment Svc]
  end
  TLS --> PUB[Public APIs · browsers]
  MTLS --> INT[Internal · Kafka · zero trust]`,
    anchors: [{id: 'mtls', label: 'TLS vs mTLS'}, {id: 'spring-mtls', label: 'Spring mTLS'}],
  },
  {
    id: 'keystore-truststore',
    group: 'Network & TLS',
    title: 'Keystore vs Truststore',
    hook: 'Keystore = MY private key + cert · Truststore = trusted CAs/peers — no private keys',
    mermaid: `flowchart TB
  KS[Keystore key-store]
  KS --> PK[Private key + cert chain]
  TS[Truststore trust-store]
  TS --> CA[Trusted CA / peer certs only]
  PK --> PRESENT[Present identity mTLS server]
  CA --> VERIFY[Verify remote cert]`,
    anchors: [{id: 'keystore-truststore', label: 'Keystore topic'}, {id: 'keytool', label: 'keytool'}],
  },
  {
    id: 'spring-mtls-rest',
    group: 'Network & TLS',
    title: 'Spring Boot mTLS + RestClient',
    hook: 'server.ssl.client-auth: need + trust-store validates caller cert',
    mermaid: `flowchart LR
  ORD[Order Service] -->|client cert| PAY[Payment :8443]
  PAY -->|verify trust-store| OK[200 /api/captures]
  PAY -->|no cert| FAIL[TLS handshake fail]`,
    anchors: [{id: 'spring-mtls', label: 'Spring mTLS'}, {id: 'rest-client-mtls', label: 'RestClient mTLS'}],
  },
  // ── Cryptography ──
  {
    id: 'hash-encrypt-encode',
    group: 'Cryptography',
    title: 'Hash vs Encrypt vs Encode',
    hook: 'Encode = reversible display · Encrypt = reversible with key · Hash = one-way passwords',
    mermaid: `flowchart TD
  ENC[Base64 Encode] --> REV1[Reversible — not security]
  AES[AES-GCM Encrypt] --> REV2[Reversible — needs key]
  HASH[Argon2id / bcrypt] --> ONE[One-way — passwords ONLY]
  style ONE fill:#dcfce7
  style REV1 fill:#fee2e2`,
    anchors: [{id: 'hash-encoding', label: 'Hash vs encrypt'}, {id: 'password-security', label: 'Password hashing'}],
  },
  {
    id: 'hybrid-envelope',
    group: 'Cryptography',
    title: 'Hybrid / envelope encryption',
    hook: 'RSA wraps AES key · AES encrypts bulk data · KMS wraps DEK',
    mermaid: `flowchart LR
  DATA[Large PAN / payload] --> AES[AES-256-GCM encrypt]
  KEY[AES data key] --> RSA[RSA-OAEP wrap key]
  RSA --> STORE[Store ciphertext + wrapped key]
  KMS[AWS KMS] --> ENV[Envelope: CMK wraps DEK]`,
    anchors: [{id: 'hybrid', label: 'Hybrid crypto'}, {id: 'aws-kms', label: 'AWS KMS'}],
  },
  {
    id: 'digital-signature',
    group: 'Cryptography',
    title: 'Digital signature vs HMAC',
    hook: 'Signature = asymmetric proof · HMAC = shared secret integrity',
    mermaid: `flowchart LR
  subgraph SIG["Digital Signature RSA/EC"]
    PRIV[Private key sign] --> VER[Public key verify]
  end
  subgraph HMAC["HMAC-SHA256"]
    SEC[Shared secret] --> MAC[Webhook / API integrity]
  end
  SIG --> JWT[JWT RS256 · SAML]
  HMAC --> WH[Payment webhook callback]`,
    anchors: [{id: 'digital-signature', label: 'Signatures'}, {id: 'jwt-anatomy', label: 'JWT sig'}],
  },
  {
    id: 'x509-chain',
    group: 'Cryptography',
    title: 'X.509 certificate chain',
    hook: 'Leaf → intermediate → root CA in truststore · SAN must match hostname',
    mermaid: `flowchart BT
  ROOT[Root CA in truststore]
  INT[Intermediate CA]
  LEAF[Leaf cert api.example.com SAN]
  ROOT --> INT --> LEAF
  LEAF --> TLS[TLS handshake OK]`,
    anchors: [{id: 'certificates', label: 'Certificates'}],
  },
  // ── OAuth & Tokens (extra) ──
  {
    id: 'oauth-as-endpoints',
    group: 'OAuth & Tokens',
    title: 'Authorization Server endpoints map',
    hook: '/authorize · /token · /introspect · /revoke · /jwks · /userinfo · /device_authorization',
    mermaid: `flowchart TB
  AS[Authorization Server :9000]
  AS --> A1["/oauth2/authorize"]
  AS --> A2["/oauth2/token"]
  AS --> A3["/oauth2/introspect"]
  AS --> A4["/oauth2/revoke"]
  AS --> A5["/oauth2/jwks"]
  AS --> A6["/userinfo OIDC"]
  AS --> A7["/oauth2/device_authorization"]
  AS --> A8["/.well-known/openid-configuration"]`,
    anchors: [{id: 'oauth2-auth-server', label: 'Auth Server config'}],
  },
  {
    id: 'client-credentials',
    group: 'OAuth & Tokens',
    title: 'Client Credentials (M2M)',
    hook: 'Service → POST /token grant_type=client_credentials → scoped access_token → API',
    mermaid: `sequenceDiagram
  participant S as Order Service
  participant AS as Auth Server
  participant P as Payment API
  S->>AS: POST /oauth2/token client_credentials
  AS-->>S: access_token scope=payment.write
  S->>P: Bearer access_token
  P-->>S: 201 capture created`,
    anchors: [{id: 'oauth2-client', label: 'OAuth2 Client'}],
  },
  {
    id: 'opaque-introspect',
    group: 'OAuth & Tokens',
    title: 'Opaque token introspection flow',
    hook: 'RS → POST /introspect → active + scope + sub → cache 30s',
    mermaid: `sequenceDiagram
  participant C as Client
  participant RS as Resource Server
  participant AS as Auth Server
  C->>RS: Bearer opaque_token
  RS->>AS: POST /oauth2/introspect
  AS-->>RS: active=true scope=payment.read
  RS-->>C: 200 payment data`,
    anchors: [{id: 'opaque-token-introspection', label: 'Introspection code'}],
  },
  {
    id: 'token-revoke-logout',
    group: 'OAuth & Tokens',
    title: 'Logout + token revocation chain',
    hook: 'Logout → revoke refresh → invalidate session → introspect active=false',
    mermaid: `flowchart TD
  LOG[User Logout] --> REV["POST /oauth2/revoke refresh"]
  REV --> SESS[Invalidate HttpSession]
  SESS --> CTX[SecurityContextHolder.clear]
  CTX --> AT[Access token denylist / wait exp]`,
    anchors: [{id: 'token-revocation', label: 'Revocation'}],
  },
  {
    id: 'custom-filter-order',
    group: 'OAuth & Tokens',
    title: 'Custom filter ordering',
    hook: 'Correlation → Tenant → API Key → JWT → AuthorizationFilter',
    mermaid: `flowchart LR
  F1[CorrelationIdFilter] --> F2[TenantContextFilter]
  F2 --> F3[ApiKeyAuthenticationFilter]
  F3 --> F4[BearerTokenAuthenticationFilter]
  F4 --> F5[AuthorizationFilter]
  F3 -.->|addFilterBefore JWT| NOTE[Wrong order = bypass]`,
    anchors: [{id: 'custom-filters', label: 'Custom filters'}],
  },
  {
    id: 'saml-sso',
    group: 'OAuth & Tokens',
    title: 'SAML 2.0 SSO (enterprise)',
    hook: 'SP → AuthnRequest → IdP login + MFA → SAMLResponse POST → map groups → session',
    mermaid: `sequenceDiagram
  participant U as User
  participant SP as Spring SP
  participant IdP as Corporate IdP
  U->>SP: GET /saml2/authenticate/adfs
  SP->>IdP: AuthnRequest redirect
  IdP->>U: login + MFA
  IdP->>SP: POST SAMLResponse XML signed
  SP->>SP: validate signature map groups`,
    anchors: [{id: 'saml', label: 'SAML topic'}],
  },
  // ── Identity & Sessions (extra) ──
  {
    id: 'webauthn-flow',
    group: 'Identity & Sessions',
    title: 'WebAuthn / Passkeys flow',
    hook: 'Server challenge → authenticator signs with private key → verify with stored public key',
    mermaid: `sequenceDiagram
  participant B as Browser
  participant S as Spring Server
  participant A as Authenticator
  B->>S: POST /webauthn/authenticate/options
  S-->>B: challenge + allowCredentials
  B->>A: sign challenge
  A-->>B: assertion + signature
  B->>S: POST /webauthn/authenticate/verify
  S->>S: verify with stored public key`,
    anchors: [{id: 'webauthn-passkeys', label: 'WebAuthn config'}],
  },
  {
    id: 'api-key-lifecycle',
    group: 'Identity & Sessions',
    title: 'API key lifecycle',
    hook: 'Generate → show once → SHA-256 hash → store → validate → rotate → revoke → audit',
    mermaid: `flowchart LR
  GEN[Generate sk_live_] --> SHOW[Show once to merchant]
  SHOW --> HASH[SHA-256 hash]
  HASH --> DB[(api_keys table)]
  REQ[X-API-Key header] --> VAL[Hash compare]
  VAL --> AUTH[Authentication]
  REV[Revoke] --> AUD[API_KEY_REVOKED audit]`,
    anchors: [{id: 'api-key-security', label: 'API key code'}],
  },
  {
    id: 'password-lockout',
    group: 'Identity & Sessions',
    title: 'Password hardening + lockout',
    hook: 'Rate limit → 5 failures → lock 30m → uniform error message → HIBP check',
    mermaid: `flowchart TD
  LOGIN[Login attempt] --> RL[Rate limit IP]
  RL --> MATCH{Password matches?}
  MATCH -->|no| INC[Increment failures]
  INC --> LOCK{>= 5 failures?}
  LOCK -->|yes| LCK[Account locked 423]
  MATCH -->|yes| OK[JWT / session]
  INC --> ENUM[Same error message always]`,
    anchors: [{id: 'password-hardening', label: 'Password hardening'}, {id: 'password-security', label: 'Hashing'}],
  },
  {
    id: 'session-fixation',
    group: 'Identity & Sessions',
    title: 'Session fixation + secure cookies',
    hook: 'changeSessionId on login · HttpOnly · Secure · SameSite · Redis cluster sessions',
    mermaid: `flowchart TD
  PRE[Pre-auth session ID] --> AUTH[Successful login]
  AUTH --> NEW[sessionFixation changeSessionId]
  NEW --> COOKIE[HttpOnly Secure SameSite=Lax cookie]
  COOKIE --> REDIS[Spring Session Redis cluster]`,
    anchors: [{id: 'session-management', label: 'Session mgmt'}],
  },
  // ── Authorization (extra) ──
  {
    id: 'rbac-abac-opa',
    group: 'Authorization',
    title: 'RBAC · ABAC · ReBAC · OPA — pick the right model',
    hook: 'Roles for admin · Scopes for API · Attributes for tenant+amount · OPA when rules explode',
    mermaid: `flowchart TB
  RBAC[RBAC User→Role→Permission] --> ADMIN[Admin portals]
  SCOPE[OAuth Scopes SCOPE_payment:write] --> API[REST APIs]
  ABAC[ABAC tenant+amount+region] --> FIN[FinTech rules SpEL]
  REBAC[ReBAC user MANAGES merchant] --> ORG[Org hierarchy]
  OPA[OPA Rego policy engine] --> COMPLEX[100+ rules central]`,
    anchors: [{id: 'policy-authz', label: 'Policy authz'}, {id: 'rbac-abac', label: 'RBAC / ABAC'}],
  },
  {
    id: 'method-security-tree',
    group: 'Authorization',
    title: 'Method security annotations',
    hook: '@PreAuthorize before · @PostAuthorize after return · @PostFilter collection · custom @bean',
    mermaid: `flowchart TD
  CALL[Controller calls service] --> PRE[@PreAuthorize hasAuthority scope]
  PRE --> METHOD[Method executes]
  METHOD --> POST[@PostAuthorize returnObject.tenantId]
  METHOD --> FILTER[@PostFilter filter collection by owner]
  PRE --> BEAN["@paymentSecurity.canApprove auth #id"]`,
    anchors: [{id: 'method-security', label: 'Method security'}],
  },
  // ── App Threats & Headers ──
  {
    id: 'csrf-attack',
    group: 'App Threats & Headers',
    title: 'CSRF attack + Spring fix',
    hook: 'Evil site POST with victim cookie → blocked without synchronizer token / SameSite',
    mermaid: `sequenceDiagram
  participant V as Victim Browser
  participant E as evil.com
  participant A as App :8090
  V->>A: login session cookie
  E->>V: auto-submit POST /transfer
  V->>A: POST with cookie no CSRF token
  A-->>V: 403 Forbidden`,
    anchors: [{id: 'csrf', label: 'CSRF config'}],
  },
  {
    id: 'cors-preflight',
    group: 'App Threats & Headers',
    title: 'CORS preflight flow',
    hook: 'Browser sends OPTIONS Origin → server Allow-Origin allowlist → then real POST',
    mermaid: `sequenceDiagram
  participant P as Page :5500
  participant A as API :8091
  P->>A: OPTIONS Origin: http://localhost:5500
  A-->>P: Access-Control-Allow-Origin allowlisted
  P->>A: POST with Authorization header
  A-->>P: 200 JSON`,
    anchors: [{id: 'cors', label: 'CORS config'}],
  },
  {
    id: 'cors-vs-csrf',
    group: 'App Threats & Headers',
    title: 'CORS vs CSRF — different problems',
    hook: 'CORS = browser read policy cross-origin · CSRF = forged write with victim cookie',
    mermaid: `flowchart TB
  CORS[CORS] --> Q1[Can JS read response from other origin?]
  CSRF[CSRF] --> Q2[Can evil site trigger authenticated POST?]
  Q1 --> FIX1[Allow-Origin allowlist]
  Q2 --> FIX2[CSRF token / SameSite cookie]
  NOTE[curl bypasses CORS entirely]`,
    anchors: [{id: 'cors', label: 'CORS'}, {id: 'csrf', label: 'CSRF'}],
  },
  {
    id: 'xss-defense',
    group: 'App Threats & Headers',
    title: 'XSS defense layers',
    hook: 'Escape output th:text · CSP blocks inline script · HttpOnly cookie · never th:utext user data',
    mermaid: `flowchart TD
  IN[Untrusted user input] --> ESC[Escape on output HtmlUtils]
  ESC --> CSP[Content-Security-Policy header]
  CSP --> COOK[HttpOnly cookie — JS cannot steal session]
  BAD[th:utext user HTML] --> XSS[XSS executed]
  style XSS fill:#fee2e2`,
    anchors: [{id: 'xss', label: 'XSS topic'}],
  },
  {
    id: 'sqli-defense',
    group: 'App Threats & Headers',
    title: 'SQL injection prevention',
    hook: 'NEVER concat SQL · JPA @Param · JdbcTemplate ? placeholders',
    mermaid: `flowchart LR
  BAD["WHERE id = '" + input + "'"] --> INJ[OR 1=1 injection]
  GOOD[JdbcTemplate WHERE id = ?] --> SAFE[Parameterized safe]
  style INJ fill:#fee2e2
  style SAFE fill:#dcfce7`,
    anchors: [{id: 'sqli', label: 'SQLi topic'}],
  },
  {
    id: 'ssrf-defense',
    group: 'App Threats & Headers',
    title: 'SSRF prevention',
    hook: 'Block metadata IP · allowlist outbound hosts · no user-controlled URLs to internal services',
    mermaid: `flowchart TD
  REQ[User supplies URL] --> VAL{Allowlisted host?}
  VAL -->|169.254.169.254| BLOCK[Block IMDS SSRF]
  VAL -->|internal VPC| BLOCK2[Block private IP ranges]
  VAL -->|ok| FETCH[RestClient fetch]`,
    anchors: [{id: 'ssrf', label: 'SSRF topic'}],
  },
  {
    id: 'replay-idempotency',
    group: 'App Threats & Headers',
    title: 'Replay attack + idempotency',
    hook: 'Idempotency-Key on POST · jti denylist · HMAC webhook timestamp · short JWT TTL',
    mermaid: `flowchart LR
  POST[POST /payments] --> KEY[Idempotency-Key header]
  KEY --> DEDUP[Server dedupe store]
  WH[Webhook callback] --> HMAC[HMAC + timestamp window]
  JWT[JWT jti] --> DENY[Denylist on reuse]`,
    anchors: [{id: 'replay', label: 'Replay attacks'}],
  },
  {
    id: 'mitm-tls',
    group: 'App Threats & Headers',
    title: 'MITM attack + TLS fix',
    hook: 'Attacker intercepts plaintext HTTP · TLS encrypts + cert pin/truststore validates server',
    mermaid: `flowchart LR
  subgraph BAD["No TLS"]
    C1[Client] --> M[Attacker] --> S1[Server]
  end
  subgraph GOOD["HTTPS TLS 1.3"]
    C2[Client] <-->|encrypted + cert verify| S2[Server]
  end`,
    anchors: [{id: 'mitm', label: 'MITM'}, {id: 'tls', label: 'TLS'}],
  },
  {
    id: 'security-headers-map',
    group: 'App Threats & Headers',
    title: 'Security headers map',
    hook: 'CSP · HSTS · X-Content-Type-Options · Referrer-Policy · frame-ancestors anti-clickjacking',
    mermaid: `flowchart TB
  H[Security HeadersFilter]
  H --> CSP[Content-Security-Policy script-src self]
  H --> HSTS[Strict-Transport-Security max-age]
  H --> XCTO[X-Content-Type-Options nosniff]
  H --> RP[Referrer-Policy strict-origin]
  H --> FA[frame-ancestors none clickjacking]`,
    anchors: [{id: 'security-headers', label: 'Headers config'}],
  },
  // ── Cloud · API · Data ──
  {
    id: 'api-security-layers',
    group: 'Cloud · API · Data',
    title: 'API security layers (north-south)',
    hook: 'CDN → WAF → Gateway JWT+RL → Service authz → field encryption → audit',
    mermaid: `flowchart TD
  C[Client] --> CDN[CDN]
  CDN --> WAF[WAF]
  WAF --> GW[API Gateway JWT validate]
  GW --> RL[Rate limit 429]
  RL --> SVC[Spring Service @PreAuthorize]
  SVC --> ENC[Field encryption PAN]
  SVC --> AUD[Audit log corrId]`,
    anchors: [{id: 'api-security', label: 'API security'}],
  },
  {
    id: 'rate-limit-ddos',
    group: 'Cloud · API · Data',
    title: 'Rate limiting vs DDoS layers',
    hook: 'Edge volumetric CDN/Shield · App 429 Retry-After · login throttle · pool protection',
    mermaid: `flowchart TD
  FLOOD[Traffic flood] --> L1[CDN absorb volumetric]
  L1 --> L2[WAF rate rules]
  L2 --> L3[Gateway distributed RL]
  L3 --> L4[App Resilience4j 429]
  L4 --> L5[Protect DB connection pool]`,
    anchors: [{id: 'rate-limit-ddos', label: 'Rate limit / DDoS'}],
  },
  {
    id: 'kafka-security-flow',
    group: 'Cloud · API · Data',
    title: 'Kafka TLS + SASL + ACL',
    hook: 'Producer mTLS/SCRAM → broker ACL WRITE → Consumer ACL READ per group',
    mermaid: `flowchart LR
  P[Producer order-service] -->|SASL_SSL SCRAM| B[Kafka Broker]
  B -->|ACL WRITE payments| T[payments topic]
  T -->|ACL READ group=settlement| C[Consumer settlement]
  B --> MT[mTLS optional broker auth]`,
    anchors: [{id: 'kafka-security', label: 'Kafka security deep dive'}],
  },
  {
    id: 'aws-kms-envelope',
    group: 'Cloud · API · Data',
    title: 'AWS KMS envelope encryption',
    hook: 'KMS GenerateDataKey → AES encrypt locally → store encrypted DEK with ciphertext',
    mermaid: `flowchart LR
  APP[Spring App] --> KMS[KMS GenerateDataKey]
  KMS --> DEK[Plaintext DEK in memory only]
  DEK --> AES[AES-GCM encrypt PAN]
  AES --> STORE[(DB ciphertext + encrypted DEK)]
  KMS --> AUDIT[CloudTrail Decrypt audit]`,
    anchors: [{id: 'aws-kms', label: 'AWS KMS'}],
  },
  {
    id: 'aws-secrets-rotation',
    group: 'Cloud · API · Data',
    title: 'AWS Secrets Manager rotation',
    hook: 'Secret JSON in SM → spring.config.import → Lambda rotates RDS password → apps refresh',
    mermaid: `flowchart LR
  SM[Secrets Manager] --> SB[Spring Boot config import]
  SM --> LAMBDA[Rotation Lambda]
  LAMBDA --> RDS[(RDS new password)]
  RDS --> SM`,
    anchors: [{id: 'aws-secrets', label: 'Secrets Manager'}, {id: 'aws-acm', label: 'ACM / ALB'}],
  },
  {
    id: 'db-tls',
    group: 'Cloud · API · Data',
    title: 'Database TLS connection',
    hook: 'JDBC sslmode=verify-full · truststore with RDS CA · never plaintext DB in prod',
    mermaid: `flowchart LR
  SB[Spring Boot] -->|TLS 5432| RDS[(PostgreSQL RDS)]
  SB --> TS[Truststore RDS CA cert]
  TS --> VERIFY[verify-full hostname]`,
    anchors: [{id: 'db-security', label: 'Database TLS'}],
  },
  {
    id: 'payment-e2e-flow',
    group: 'Cloud · API · Data',
    title: 'Secure payment POST end-to-end',
    hook: 'OAuth JWT → Idempotency-Key → Kafka SASL_SSL → encrypted PAN → settlement ACL → HMAC webhook',
    mermaid: `sequenceDiagram
  participant U as User
  participant GW as Gateway
  participant PAY as Payment
  participant K as Kafka
  participant SET as Settlement
  U->>GW: POST /payments Bearer + Idempotency-Key
  GW->>PAY: JWT scope payment.write
  PAY->>K: PaymentEvent TLS SASL
  K->>SET: consume ACL READ
  SET-->>U: status webhook HMAC signed`,
    anchors: [{id: 'payment-e2e', label: 'Payment E2E'}],
  },
  {
    id: 'zero-trust',
    group: 'Cloud · API · Data',
    title: 'Zero Trust — never trust the network',
    hook: 'Verify every hop: JWT + mTLS + scope + tenant + least-privilege ACL + assume breach',
    mermaid: `flowchart TD
  Z[Zero Trust Principles]
  Z --> V1[Verify explicitly every request]
  Z --> V2[Least privilege scopes ACLs]
  Z --> V3[Assume breach compartmentalize]
  V1 --> JWT[JWT at gateway AND service]
  V1 --> MTLS[mTLS east-west]
  V2 --> ACL[Kafka DB network policy]`,
    anchors: [{id: 'zero-trust', label: 'Zero Trust topic'}],
  },
  // ── Operations & Testing (extra) ──
  {
    id: 'security-observability',
    group: 'Operations & Testing',
    title: 'Security observability pipeline',
    hook: '401/403 rates · auth failures · cert expiry · never log Bearer/password/API key',
    mermaid: `flowchart LR
  APP[Spring Boot] --> LOG[Structured SECURITY_AUDIT logs]
  APP --> MET[Micrometer security_auth_failure]
  LOG --> SIEM[SIEM / CloudWatch]
  MET --> PROM[Prometheus alerts]
  BAN[Never log JWT password API key]`,
    anchors: [{id: 'observability', label: 'Observability'}],
  },
  {
    id: 'actuator-ports',
    group: 'Operations & Testing',
    title: 'Actuator — separate management port',
    hook: ':8080 app API · :9090 management · health public · env/beans DISABLED',
    mermaid: `flowchart LR
  PUB[:8080 Public] --> API[/api/payments]
  MGT[:9090 Management] --> HEALTH[/actuator/health OK]
  MGT --> ENV[/actuator/env DENY]
  MGT --> BEANS[/actuator/beans DENY]
  MGT --> PROM[/actuator/prometheus IP restrict]`,
    anchors: [{id: 'actuator-security', label: 'Actuator config'}],
  },
  {
    id: 'security-context-async',
    group: 'Operations & Testing',
    title: 'SecurityContext in @Async',
    hook: 'ThreadLocal lost in async — DelegatingSecurityContextExecutor wraps thread pool',
    mermaid: `flowchart TD
  HTTP[HTTP thread SecurityContext] --> POOL[ThreadPoolTaskExecutor]
  POOL --> DELEG[DelegatingSecurityContextExecutor]
  DELEG --> WORK[Worker thread inherits Authentication]
  BAD[Plain executor] --> NULL[auth = null in async]`,
    anchors: [{id: 'security-context-propagation', label: 'Context propagation'}],
  },
  {
    id: 'webflux-vs-mvc',
    group: 'Operations & Testing',
    title: 'WebFlux vs MVC security',
    hook: 'SecurityFilterChain+ThreadLocal vs SecurityWebFilterChain+ReactiveContext',
    mermaid: `flowchart LR
  subgraph MVC["Spring MVC"]
    F1[SecurityFilterChain]
    F2[SecurityContextHolder ThreadLocal]
  end
  subgraph FLUX["WebFlux"]
    W1[SecurityWebFilterChain]
    W2[ReactiveSecurityContextHolder]
  end`,
    anchors: [{id: 'webflux-security', label: 'WebFlux security'}],
  },
  {
    id: 'security-testing-matrix',
    group: 'Operations & Testing',
    title: 'Security testing matrix',
    hook: '401 no token · 403 wrong scope · jwt() wrong aud · csrf() missing · @WithMockUser',
    mermaid: `flowchart TD
  T1[No token → 401] --> M1[MockMvc get /api]
  T2[Wrong scope → 403] --> M2[@WithMockUser no scope]
  T3[Bad aud → 401] --> M3[jwt aud wrong-api]
  T4[CSRF missing → 403] --> M4[post without csrf]
  T5[OIDC] --> M5[oidcLogin idToken]`,
    anchors: [{id: 'security-testing', label: 'Security testing'}],
  },
  {
    id: 'integration-test-stack',
    group: 'Operations & Testing',
    title: 'Security integration test stack',
    hook: '@SpringBootTest + WireMock JWKS + Testcontainers Redis + real JwtDecoder',
    mermaid: `flowchart LR
  TEST[@SpringBootTest] --> WM[WireMock AS + JWKS]
  TEST --> TC[Testcontainers Redis]
  TEST --> DEC[Real NimbusJwtDecoder]
  TEST --> WTC[WebTestClient Bearer JWT]`,
    anchors: [{id: 'security-integration-testing', label: 'Integration tests'}],
  },
  {
    id: 'audit-events-flow',
    group: 'Operations & Testing',
    title: 'Security audit event flow',
    hook: 'LOGIN · TOKEN_REVOKED · MFA_FAILURE · ROLE_CHANGED → immutable WORM store',
    mermaid: `flowchart LR
  EV[Security Events] --> PUB[SecurityAuditPublisher]
  PUB --> LOG[SECURITY_AUDIT logger]
  PUB --> KAFKA[audit topic]
  KAFKA --> WORM[Immutable S3 / SIEM]`,
    anchors: [{id: 'security-audit', label: 'Audit events'}],
  },
  {
    id: 'common-mistakes-map',
    group: 'Operations & Testing',
    title: 'Common Spring Security mistakes',
    hook: '❌ permitAll internal · ❌ no aud · ❌ CSRF off cookie app · ❌ Actuator * · ❌ JWT localStorage',
    mermaid: `flowchart TD
  M1[permitAll /api internal] --> F1[Authenticate every service]
  M2[JWT no aud check] --> F2[JwtClaimValidator aud]
  M3[CSRF off cookie SPA] --> F3[CookieCsrfTokenRepository]
  M4[Actuator include star] --> F4[Separate port deny env]
  M5[JWT in localStorage] --> F5[BFF HttpOnly cookie]`,
    anchors: [{id: 'common-mistakes', label: 'Mistakes checklist'}],
  },
  {
    id: 'production-checklist-visual',
    group: 'Operations & Testing',
    title: 'Production security checklist (visual)',
    hook: 'Authn · Authz · Transport · Secrets · App · Ops — six gates before release',
    mermaid: `flowchart TD
  G1[Authentication OAuth MFA JWT aud iss] --> G2[Authorization RBAC object tenant]
  G2 --> G3[Transport TLS mTLS cert rotation]
  G3 --> G4[Secrets KMS Vault no git]
  G4 --> G5[App CSRF CORS headers RL]
  G5 --> G6[Ops audit monitor incident tests]
  G6 --> SHIP[Release approved]`,
    anchors: [{id: 'production-checklist', label: 'Full checklist'}],
  },
];
