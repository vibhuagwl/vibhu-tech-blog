import {TOPICS_ADVANCED} from './topics-advanced';
import {TOPICS_APP} from './topics-app';
import {TOPICS_ARCH} from './topics-arch';
import {TOPICS_CLOUD} from './topics-cloud';
import {TOPICS_CRYPTO} from './topics-crypto';
import {TOPICS_NETWORK} from './topics-network';
import type {InterviewQ, SecTopic} from './types';

export const TOPICS: SecTopic[] = [
  ...TOPICS_NETWORK,
  ...TOPICS_CRYPTO,
  ...TOPICS_APP,
  ...TOPICS_ADVANCED,
  ...TOPICS_CLOUD,
  ...TOPICS_ARCH,
];

export const INTERVIEW_QA: InterviewQ[] = [
  {
    id: 'sec-q1',
    topic: 'Core',
    question: 'Difference between authentication and authorization?',
    answer30s: 'Authentication proves identity (401 if missing). Authorization checks permissions (403 if denied). Spring runs authn before authz in the filter chain.',
    answer2m: 'Walk POST /api/payments: Bearer JWT validated by JwtAuthenticationFilter (authn), then hasAuthority("SCOPE_payment.write") (authz). 401 = no/invalid token. 403 = valid token, wrong scope. Never return 403 for missing credentials.',
    followUps: ['HTTP status for expired JWT?', 'Where to check roles — gateway or service?'],
    traps: 'Using 403 for unauthenticated requests.',
  },
  {
    id: 'sec-q2',
    topic: 'TLS',
    question: 'TLS vs mTLS — when do you use each?',
    answer30s: 'TLS: server cert only — browsers and public APIs. mTLS: both sides present certs — service-to-service, Kafka, zero-trust internal.',
    answer2m: 'Spring: server.ssl.enabled for TLS; client-auth: need + trust-store for mTLS. mTLS proves which service connected; JWT still needed for user/tenant context. Payment service → acquirer often mTLS + signed payload.',
    followUps: ['Where is private key stored?', 'What if cert expires mid-traffic?'],
    traps: 'Treating mTLS as full authorization without app-level checks.',
  },
  {
    id: 'sec-q3',
    topic: 'JWT',
    question: 'Is JWT encrypted? What must you validate?',
    answer30s: 'Usually signed (JWS), not encrypted — payload is readable. Validate signature, exp, iss, aud, and optionally jti denylist.',
    answer2m: '8092 first-party HS256 vs oauth-jwt-demo RS256 + JWKS from :9000. Never put PAN/password in claims. Short TTL (15m), refresh rotation, audience per API. Algorithm confusion and "none" attacks are interview traps.',
    followUps: ['JWE vs JWS?', 'Where to store JWT in SPA?'],
    traps: 'Assuming Base64 payload means encrypted.',
    labHref: '/spring-jwt-demo',
  },
  {
    id: 'sec-q4',
    topic: 'OAuth',
    question: 'OAuth2 vs OIDC — explain Authorization Code + PKCE flow.',
    answer30s: 'OAuth2 delegates authorization (access token). OIDC adds ID token and userinfo. PKCE protects public clients from stolen authorization codes.',
    answer2m: 'Draw browser → client :8082 → AS :9000 authorize → code → token endpoint with code_verifier → access_token → RS :8081. client_credentials for batch without user. Never implicit flow for new SPAs.',
    followUps: ['What is on JWKS endpoint?', 'Refresh token rotation?'],
    traps: 'Resource Owner Password Credentials for mobile apps.',
    labHref: '/oauth-jwt-demo',
  },
  {
    id: 'sec-q5',
    topic: 'CSRF',
    question: 'When does Spring Security enable CSRF and when disable it?',
    answer30s: 'Enable for cookie/session browser apps — attacker forges POST with victim cookie. Disable for stateless Bearer JWT APIs — browser does not auto-send Authorization header.',
    answer2m: 'spring-csrf-demo :8090: form needs _csrf token; evil site POST → 403. SPA: CookieCsrfTokenRepository + X-XSRF-TOKEN. If you store JWT in HttpOnly cookie, re-enable CSRF. SameSite=Lax helps but is not enough alone for all cases.',
    followUps: ['CSRF vs XSS interaction?', 'Double-submit cookie pattern?'],
    traps: 'Disabling CSRF on session cookie SPA.',
    labHref: '/spring-csrf-demo',
  },
  {
    id: 'sec-q6',
    topic: 'CORS',
    question: 'What is CORS and does it replace authentication?',
    answer30s: 'Browser-enforced cross-origin policy. Server returns Access-Control-Allow-Origin for allowlisted Origins. Does not replace auth — curl bypasses CORS entirely.',
    answer2m: 'spring-cors-demo :8091: page :5500 sends Origin; preflight OPTIONS for POST with Authorization. Evil origin → 403 Invalid CORS request. allowCredentials(true) requires explicit origins, not *. Gateway and service CORS must align.',
    followUps: ['Why preflight?', 'CORS error but 500 in network tab?'],
    traps: '"CORS protects the API from hackers."',
    labHref: '/spring-cors-demo',
  },
  {
    id: 'sec-q7',
    topic: 'Crypto',
    question: 'Hash vs encrypt vs encode — how do you store passwords?',
    answer30s: 'Encode (Base64) is reversible representation. Encrypt (AES) is reversible with key. Hash (SHA-256) is one-way — passwords use adaptive bcrypt/Argon2, not AES or SHA alone.',
    answer2m: 'spring-jwt-demo :8092 BCrypt on register. spring-encryption-lab :8093 for AES-GCM field data and HMAC lookup tokens. Interview fail: "password encrypted with AES" or "hashed with Base64".',
    followUps: ['What is envelope encryption?', 'When HMAC vs signature?'],
    traps: 'MD5/SHA1(password) without salt.',
    labHref: '/encryption',
  },
  {
    id: 'sec-q8',
    topic: 'Keystore',
    question: 'Keystore vs truststore?',
    answer30s: 'Keystore: private key + your cert chain (identity). Truststore: trusted CA/peer certs only — no private keys. Spring: key-store vs trust-store.',
    answer2m: 'keytool -genkeypair → keystore. Import CA → truststore. mTLS server needs both: key-store to present, trust-store to validate client. Leaking keystore = impersonation; leaking truststore is lower risk.',
    followUps: ['keytool interview commands?', 'PKCS12 vs JKS?'],
    traps: 'Putting private key in truststore.',
  },
  {
    id: 'sec-q9',
    topic: 'AWS',
    question: 'KMS vs Secrets Manager?',
    answer30s: 'KMS: encrypt/decrypt with CMK — envelope encryption for data. Secrets Manager: store and rotate credentials (DB passwords, API keys).',
    answer2m: 'GenerateDataKey → AES locally → store encrypted DEK. Secrets Manager JSON imported via spring.config.import. KMS CloudTrail on Decrypt; Secrets rotation Lambda for RDS. Never commit either to git.',
    followUps: ['CMK rotation impact?', 'IMDSv2 and SSRF?'],
    traps: 'Sending megabytes to KMS Encrypt API.',
  },
  {
    id: 'sec-q10',
    topic: 'API',
    question: 'How do you secure a payment POST end-to-end?',
    answer30s: 'HTTPS → JWT scope check → Idempotency-Key → validate input → TLS to Kafka → encrypted sensitive fields → audit + HMAC webhook.',
    answer2m: 'Repo labs: oauth-jwt :9000/:8081 for token, kafka payments :8091/:8092 for idempotent producer/consumer, encryption :8093 for PAN envelope. Resilience4j CB on acquirer — no fake SUCCESS fallback. 429 on login via rate limit filter.',
    followUps: ['Replay attack defense?', 'PCI scope reduction?'],
    traps: 'Gateway-only auth with permitAll() in service.',
    labHref: '/oauth-jwt-demo',
  },
  {
    id: 'sec-q11',
    topic: 'Injection',
    question: 'SQL injection vs XSS — prevention in Spring?',
    answer30s: 'SQLi: parameterized queries — JPA @Param, JdbcTemplate ?, never concat. XSS: escape output (th:text), CSP, avoid th:utext with user data.',
    answer2m: 'Demos: spring-sql-injection-demo OR 1=1 vs PreparedStatement; spring-xss-demo th:text vs th:utext. JSON APIs still need escape where HTML renders. CSP blocks inline script even if one field missed escape.',
    followUps: ['SSRF prevention?', 'Stored vs reflected XSS?'],
    traps: '"JPA means no SQLi" — unsafe nativeQuery concat still vulnerable.',
    labHref: '/spring-sql-injection-demo',
  },
  {
    id: 'sec-q12',
    topic: 'Zero Trust',
    question: 'What is zero trust in a Spring microservices context?',
    answer30s: 'Verify every request regardless of network — JWT at edge, mTLS east-west, scope authz in service, least-privilege DB/Kafka ACLs, no flat trusted VPC.',
    answer2m: 'Stack oauth-jwt + mTLS + @PreAuthorize + NetworkPolicy egress allowlist + field encryption. Contrast with legacy DMZ "inside = safe". SPIFFE/cert-manager for identity. Assume breach — compartmentalize blast radius.',
    followUps: ['Service mesh vs app mTLS?', 'When VPN is not enough?'],
    traps: 'Internal REST with permitAll() because "private subnet".',
  },
  {
    id: 'sec-q13',
    topic: 'Filter Chain',
    question: 'Explain Spring Security filter chain order for JWT API.',
    answer30s: 'SecurityContextPersistence → Logout → Bearer/JWT authentication → AuthorizationFilter → ... → DispatcherServlet. Custom JWT filter before UsernamePasswordAuthenticationFilter.',
    answer2m: 'Multiple @Order SecurityFilterChain: /api/** stateless JWT, /actuator/** IP-restricted. Disable duplicate servlet filter registration. Debug with logging.level.org.springframework.security=DEBUG. csrf.disable() only when no session cookie auth.',
    followUps: ['401 entry point vs 403 handler?', 'Reactive WebFlux chain differences?'],
    traps: 'Registering JWT filter as @Component servlet filter — runs twice.',
    labHref: '/spring-jwt-demo',
  },
  {
    id: 'sec-q14',
    topic: 'RBAC',
    question: 'RBAC vs ABAC vs OAuth scopes?',
    answer30s: 'RBAC: roles (ROLE_ADMIN). Scopes: fine-grained OAuth permissions (payment:write). ABAC: attribute rules (tenant + amount + region).',
    answer2m: '@PreAuthorize combines all: hasAuthority("SCOPE_payments:write") and @transferAuthz.isOwner(). Map IdP groups → roles at login; machine clients get client_credentials scopes only. Avoid god ADMIN role.',
    followUps: ['hasRole vs hasAuthority?', 'Policy engine when?'],
    traps: 'hasRole("ROLE_ADMIN") — double ROLE_ prefix.',
  },
  {
    id: 'sec-q16',
    topic: 'OAuth AS',
    question: 'When use JWT vs opaque token + introspection?',
    answer30s: 'JWT: self-contained, fast local validation, good for high throughput. Opaque: central revocation, immediate logout, better for high-security or when token state must be server-side.',
    answer2m: 'JWT validate sig+iss+aud locally; revocation needs jti denylist or wait for exp. Opaque POST /introspect returns active=true/false — instant revoke but latency + cache tradeoff. Spring: oauth2ResourceServer().jwt() vs opaqueToken(). FinTech high-value: opaque or short JWT + introspection cache 30s.',
    followUps: ['How to cache introspection safely?', 'JWT key rotation with kid?'],
    traps: 'Opaque token without cache — AS becomes single point of failure under load.',
  },
  {
    id: 'sec-q17',
    topic: 'AuthZ',
    question: 'What is object-level authorization and why is scope alone insufficient?',
    answer30s: 'Scope says "can read payments"; object-level says "can read THIS payment". Without it, BOLA/IDOR: change ID in URL to access another user\'s payment.',
    answer2m: 'GET /payments/123 needs: authenticated + SCOPE_payment:read + payment.tenantId == jwt.tenant_id + payment.ownerId == sub. Implement via @PreAuthorize("@paymentSecurity.canRead(auth,#id)") and service-layer re-check. Gateway scope check is necessary not sufficient.',
    followUps: ['AuthorizationManager vs @PreAuthorize?', 'Multi-tenant row filter?'],
    traps: 'hasAuthority("SCOPE_payment:read") only — classic OWASP API #1 vulnerability.',
  },
  {
    id: 'sec-q18',
    topic: 'Tokens',
    question: 'Explain refresh token rotation and reuse detection.',
    answer30s: 'Each refresh returns new refresh token and invalidates old one. If old refresh presented again — token theft — revoke entire token family.',
    answer2m: 'R1 → A1 + R2 (R1 dead). Attacker steals R1, legitimate user has R2. Attacker uses R1 → REUSE DETECTED → revoke family, force re-login. Store refresh token hash, not raw. Absolute lifetime 30d + idle 7d. spring-jwt-demo opaque refresh pattern.',
    followUps: ['Concurrent refresh from two tabs?', 'Where store token family?'],
    traps: 'Non-rotating refresh valid 90 days — stolen token window too long.',
    labHref: '/spring-jwt-demo',
  },
];

export const TOPIC_BY_ID: Record<string, SecTopic> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t]),
);

export const INTERVIEW_SIXTY_SEC =
  'Security stack: HTTPS/mTLS on the wire, JWT/OAuth for identity, CSRF for cookie apps, CORS for browsers, parameterized SQL and escaped HTML for injection, KMS envelope for secrets and fields, rate limits at edge and app, zero trust on every hop — fail closed, defense in depth, never fake payment SUCCESS.';

export const INTERVIEW_FIVE_MIN =
  'Whiteboard north-south: CloudFront/WAF → ALB/ACM → API Gateway JWT+RL → Spring resource server scopes → Kafka SASL_SSL+ACL → RDS TLS+Secrets Manager. Contrast labs: JWT :8092, OAuth AS :9000/RS :8081, CSRF :8090, CORS :8091, encryption :8093. Deep dive one payment POST: Authorization Code or client_credentials, Idempotency-Key, idempotent Kafka producer, settlement consumer ACL, field encryption for PAN, audit corrId, 401/403/429 trees.';
