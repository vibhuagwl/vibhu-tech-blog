/** OAuth 2.0 + JWT demo — endpoint names, ports, and numbered flow steps. */

export type EndpointRow = {
  method: string;
  path: string;
  service: string;
  port: string;
  purpose: string;
  auth?: string;
  flow?: string;
};

export type FlowStep = {
  step: number;
  actor: string;
  method: string;
  endpoint: string;
  detail: string;
};

export const SERVICES = [
  {name: 'Authorization Server', port: '9000', role: 'Login, consent, issue codes/tokens, JWKS, OIDC discovery'},
  {name: 'Resource Server', port: '8081', role: 'Protected REST APIs — re-validates JWT + scopes/roles'},
  {name: 'API Gateway', port: '8080', role: 'Edge entry — validates JWT, forwards Authorization header'},
  {name: 'Client App', port: '8082', role: 'Confidential web client — Authorization Code + OIDC'},
] as const;

export const ARCHITECTURE = `User / Browser
      │
      ▼
Client App (:8082)
  GET  /oauth2/authorization/web-client
  GET  /login/oauth2/code/web-client   ← callback
  GET  /payments  → calls RS with Bearer JWT
      │
      │ Authorization Code (+ OIDC)
      ▼
Authorization Server (:9000)
  GET  /.well-known/openid-configuration
  GET  /oauth2/authorize
  POST /oauth2/token
  GET  /oauth2/jwks
  GET  /userinfo
      │ JWT access_token (RS256, kid=key-1)
      ▼
API Gateway (:8080)  ── validates JWT via JWKS
  GET/POST/DELETE  /api/payments/**
  GET              /api/accounts/**
  GET              /api/admin/**
      │
      ▼
Resource Server (:8081)  ── re-validates JWT + @PreAuthorize`;

export const OAUTH_ENDPOINTS: EndpointRow[] = [
  {
    method: 'GET',
    path: '/.well-known/openid-configuration',
    service: 'Authorization Server',
    port: '9000',
    purpose: 'OIDC discovery — issuer, authorize_uri, token_uri, jwks_uri, scopes_supported',
    auth: 'Public',
    flow: 'All',
  },
  {
    method: 'GET',
    path: '/oauth2/authorize',
    service: 'Authorization Server',
    port: '9000',
    purpose: 'Start Authorization Code flow — response_type=code, client_id, redirect_uri, scope, state (+ PKCE)',
    auth: 'User session (login + consent)',
    flow: 'Authorization Code · PKCE',
  },
  {
    method: 'POST',
    path: '/oauth2/token',
    service: 'Authorization Server',
    port: '9000',
    purpose: 'Exchange code / refresh / client_credentials for access_token (+ refresh_token, id_token)',
    auth: 'Client auth (secret, Basic, or PKCE verifier)',
    flow: 'All grants',
  },
  {
    method: 'GET',
    path: '/oauth2/jwks',
    service: 'Authorization Server',
    port: '9000',
    purpose: 'Public RSA keys (kid) — Gateway & Resource Server validate JWT signatures',
    auth: 'Public',
    flow: 'JWT validation',
  },
  {
    method: 'GET',
    path: '/userinfo',
    service: 'Authorization Server',
    port: '9000',
    purpose: 'OIDC user claims for authenticated access_token',
    auth: 'Bearer access_token',
    flow: 'OIDC',
  },
  {
    method: 'POST',
    path: '/oauth2/revoke',
    service: 'Authorization Server',
    port: '9000',
    purpose: 'Revoke refresh or access token (RFC 7009)',
    auth: 'Client auth',
    flow: 'Logout / rotation',
  },
  {
    method: 'GET',
    path: '/login',
    service: 'Authorization Server',
    port: '9000',
    purpose: 'Form login page during authorize',
    auth: 'Public',
    flow: 'Authorization Code',
  },
];

export const CLIENT_ENDPOINTS: EndpointRow[] = [
  {
    method: 'GET',
    path: '/',
    service: 'Client App',
    port: '8082',
    purpose: 'Home — links to login and protected pages',
    auth: 'Public',
  },
  {
    method: 'GET',
    path: '/oauth2/authorization/web-client',
    service: 'Client App',
    port: '8082',
    purpose: 'Spring OAuth2 client — redirects browser to AS /oauth2/authorize',
    auth: 'Public',
    flow: 'Authorization Code',
  },
  {
    method: 'GET',
    path: '/login/oauth2/code/web-client',
    service: 'Client App',
    port: '8082',
    purpose: 'OAuth2 redirect callback — AS returns ?code=…&state=…; client exchanges for tokens',
    auth: 'Public (one-time code)',
    flow: 'Authorization Code',
  },
  {
    method: 'GET',
    path: '/payments',
    service: 'Client App',
    port: '8082',
    purpose: 'Demo UI — calls GET /api/payments on RS with stored access_token',
    auth: 'Session + OAuth2AuthorizedClient',
    flow: 'Authorization Code',
  },
  {
    method: 'GET',
    path: '/me',
    service: 'Client App',
    port: '8082',
    purpose: 'Show OIDC ID token claims (sub, email, roles)',
    auth: 'Session + OidcUser',
    flow: 'OIDC',
  },
];

export const GATEWAY_ROUTES: EndpointRow[] = [
  {
    method: 'ANY',
    path: '/api/payments/**',
    service: 'API Gateway',
    port: '8080',
    purpose: 'Route to Resource Server — JwtDecoder validates Bearer JWT at edge',
    auth: 'Bearer JWT',
    flow: 'User API',
  },
  {
    method: 'ANY',
    path: '/api/accounts/**',
    service: 'API Gateway',
    port: '8080',
    purpose: 'Route to Resource Server account APIs',
    auth: 'Bearer JWT',
    flow: 'S2S / user',
  },
  {
    method: 'ANY',
    path: '/api/admin/**',
    service: 'API Gateway',
    port: '8080',
    purpose: 'Route to admin/report APIs',
    auth: 'Bearer JWT (ADMIN + scope)',
    flow: 'Admin',
  },
];

export const RESOURCE_ENDPOINTS: EndpointRow[] = [
  {
    method: 'GET',
    path: '/api/payments',
    service: 'Resource Server',
    port: '8081',
    purpose: 'List payments',
    auth: 'SCOPE_payment.read',
    flow: 'User (web-client)',
  },
  {
    method: 'GET',
    path: '/api/payments/{id}',
    service: 'Resource Server',
    port: '8081',
    purpose: 'Get payment by id',
    auth: 'SCOPE_payment.read',
    flow: 'User',
  },
  {
    method: 'POST',
    path: '/api/payments',
    service: 'Resource Server',
    port: '8081',
    purpose: 'Create payment',
    auth: 'SCOPE_payment.write',
    flow: 'User',
  },
  {
    method: 'DELETE',
    path: '/api/payments/{id}',
    service: 'Resource Server',
    port: '8081',
    purpose: 'Delete payment',
    auth: 'SCOPE_payment.write + ROLE_ADMIN',
    flow: 'Admin',
  },
  {
    method: 'GET',
    path: '/api/accounts/{id}',
    service: 'Resource Server',
    port: '8081',
    purpose: 'Account lookup (S2S demo)',
    auth: 'SCOPE_account.read',
    flow: 'Client Credentials (payment-service)',
  },
  {
    method: 'GET',
    path: '/api/admin/reports',
    service: 'Resource Server',
    port: '8081',
    purpose: 'Admin settlement report',
    auth: 'ROLE_ADMIN + SCOPE_report.read',
    flow: 'Admin user',
  },
];

export const TOKEN_GRANTS = [
  {
    grant: 'authorization_code',
    endpoint: 'POST /oauth2/token',
    client: 'web-client (confidential)',
    body: 'grant_type=authorization_code&code=…&redirect_uri=…',
    auth: 'client_secret (Basic or POST)',
    returns: 'access_token (JWT) + refresh_token + id_token',
  },
  {
    grant: 'authorization_code + PKCE',
    endpoint: 'POST /oauth2/token',
    client: 'spa-client (public)',
    body: 'grant_type=authorization_code&code=…&code_verifier=…',
    auth: 'PKCE (no client_secret)',
    returns: 'access_token (JWT) + refresh_token',
  },
  {
    grant: 'refresh_token',
    endpoint: 'POST /oauth2/token',
    client: 'web-client · spa-client',
    body: 'grant_type=refresh_token&refresh_token=…',
    auth: 'client auth',
    returns: 'new access_token (+ rotated refresh_token)',
  },
  {
    grant: 'client_credentials',
    endpoint: 'POST /oauth2/token',
    client: 'payment-service',
    body: 'grant_type=client_credentials&scope=account.read',
    auth: 'Basic payment-service:payment-secret',
    returns: 'access_token (JWT), no user context',
  },
] as const;

export const AUTH_CODE_SEQUENCE: FlowStep[] = [
  {step: 1, actor: 'User', method: 'GET', endpoint: 'http://localhost:8082/payments', detail: 'Open protected page in Client App'},
  {step: 2, actor: 'Client App', method: 'GET', endpoint: '/oauth2/authorization/web-client', detail: 'Spring OAuth2 client starts login (redirect to AS)'},
  {step: 3, actor: 'Browser → AS', method: 'GET', endpoint: '/oauth2/authorize?response_type=code&client_id=web-client&redirect_uri=…&scope=…&state=…', detail: 'Authorization request to :9000'},
  {step: 4, actor: 'AS', method: 'GET', endpoint: '/login', detail: 'User enters credentials (alice/password or admin/password)'},
  {step: 5, actor: 'AS', method: 'GET', endpoint: '/oauth2/authorize (consent)', detail: 'User approves scopes (payment.read, payment.write, …)'},
  {step: 6, actor: 'AS → Client', method: '302', endpoint: '/login/oauth2/code/web-client?code=…&state=…', detail: 'Redirect with authorization code'},
  {step: 7, actor: 'Client → AS', method: 'POST', endpoint: '/oauth2/token', detail: 'grant_type=authorization_code + code + client_secret'},
  {step: 8, actor: 'AS', method: '—', endpoint: 'Issue JWT', detail: 'RS256 access_token (~10m) + refresh_token + id_token'},
  {step: 9, actor: 'Client → GW', method: 'GET', endpoint: 'http://localhost:8080/api/payments', detail: 'Authorization: Bearer <JWT>'},
  {step: 10, actor: 'Gateway', method: 'GET', endpoint: '/oauth2/jwks', detail: 'Fetch/cache public key; verify iss, exp, signature'},
  {step: 11, actor: 'Gateway → RS', method: 'GET', endpoint: '/api/payments', detail: 'Forward Authorization header (zero-trust)'},
  {step: 12, actor: 'Resource Server', method: 'GET', endpoint: '/oauth2/jwks', detail: 'Re-validate JWT; map scope → SCOPE_payment.read'},
  {step: 13, actor: 'Resource Server', method: '—', endpoint: '/api/payments', detail: '@PreAuthorize passes → 200 JSON'},
];

export const PKCE_SEQUENCE: FlowStep[] = [
  {step: 1, actor: 'SPA', method: '—', endpoint: 'code_verifier', detail: 'Generate random verifier; code_challenge = BASE64URL(SHA256(verifier))'},
  {step: 2, actor: 'SPA → AS', method: 'GET', endpoint: '/oauth2/authorize', detail: 'client_id=spa-client + code_challenge + code_challenge_method=S256'},
  {step: 3, actor: 'AS', method: 'GET', endpoint: '/login + consent', detail: 'User login and approve scopes'},
  {step: 4, actor: 'AS → SPA', method: '302', endpoint: 'redirect_uri?code=…', detail: 'Authorization code (no secret on public client)'},
  {step: 5, actor: 'SPA → AS', method: 'POST', endpoint: '/oauth2/token', detail: 'grant_type=authorization_code + code + code_verifier (no client_secret)'},
  {step: 6, actor: 'AS', method: '—', endpoint: 'Validate PKCE', detail: 'SHA256(verifier) == stored challenge → issue JWT'},
];

export const CLIENT_CREDENTIALS_SEQUENCE: FlowStep[] = [
  {step: 1, actor: 'payment-service', method: 'POST', endpoint: '/oauth2/token', detail: 'Basic auth + grant_type=client_credentials&scope=account.read'},
  {step: 2, actor: 'AS', method: '—', endpoint: 'Authenticate client', detail: 'No user consent — machine identity only'},
  {step: 3, actor: 'AS → Svc', method: '200', endpoint: 'access_token (JWT)', detail: 'Scoped for account.read; typical S2S token'},
  {step: 4, actor: 'payment-service', method: 'GET', endpoint: '/api/accounts/A-100', detail: 'Direct to RS :8081 or via GW :8080 with Bearer JWT'},
  {step: 5, actor: 'Resource Server', method: '—', endpoint: 'Validate + authorize', detail: 'SCOPE_account.read → 200 account JSON'},
];

export const REFRESH_SEQUENCE: FlowStep[] = [
  {step: 1, actor: 'Client', method: '—', endpoint: 'Access token expired', detail: '~10 minute TTL on access_token'},
  {step: 2, actor: 'Client → AS', method: 'POST', endpoint: '/oauth2/token', detail: 'grant_type=refresh_token&refresh_token=…'},
  {step: 3, actor: 'AS', method: '—', endpoint: 'Validate refresh', detail: 'Rotation-friendly — reuse detection in demo config'},
  {step: 4, actor: 'AS → Client', method: '200', endpoint: 'new access_token', detail: 'New JWT + optionally new refresh_token'},
];

export const JWT_VALIDATION_SEQUENCE: FlowStep[] = [
  {step: 1, actor: 'Client', method: 'GET/POST', endpoint: '/api/…', detail: 'Request with Authorization: Bearer <JWT>'},
  {step: 2, actor: 'Gateway', method: 'GET', endpoint: '/oauth2/jwks', detail: 'Cached JWKS lookup by kid=key-1'},
  {step: 3, actor: 'Gateway', method: '—', endpoint: 'JwtDecoder', detail: 'Verify RS256 signature, iss, exp (aud optional at edge)'},
  {step: 4, actor: 'Gateway', method: '—', endpoint: '401 if invalid', detail: 'Reject before forwarding'},
  {step: 5, actor: 'Gateway → RS', method: 'forward', endpoint: '/api/…', detail: 'Pass Authorization header unchanged'},
  {step: 6, actor: 'Resource Server', method: 'GET', endpoint: '/oauth2/jwks', detail: 'Re-validate (zero-trust — do not trust gateway alone)'},
  {step: 7, actor: 'Resource Server', method: '—', endpoint: '@PreAuthorize', detail: 'Check SCOPE_* and ROLE_* → 403 or 200'},
];
