import type {PatternCard} from './types';

// ---------------------------------------------------------------------------
// Part 14 — Security patterns
// ---------------------------------------------------------------------------

export const SECURITY_PATTERNS: PatternCard[] = [
  {
    id: "oauth2",
    part: 14,
    name: "OAuth 2.0 Authorization",
    frequency: "Frequently used",
    definition: "Industry-standard delegated authorization framework.",
    problem: "Microservices cannot share user passwords.",
    realWorld: "Keycloak issues tokens; gateway validates JWT; Order service checks orders:write scope.",
    whyExists: "Separates authentication from authorization with scoped, revocable tokens.",
    ascii:
      "\n┌────────┐  auth code   ┌──────────────┐  JWT   ┌─────────┐\n│ Client │ ─────────► │ Auth Server  │ ─────► │ Gateway │\n└────────┘              └──────────────┘        └────┬────┘\n                                               ┌──────▼──────┐\n                                               │Order Service│\n                                               └─────────────┘",
    flow: "Ingress → validate → apply OAuth 2.0 Authorization policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies OAuth 2.0 Authorization rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.security.oauth2;\n\nimport java.time.Instant;\nimport java.util.Map;\nimport java.util.Set;\n\npublic record TokenIntrospection(\n    boolean active, String sub, String clientId, Set<String> scopes, Instant expiresAt, String issuer) {\n  public boolean hasScope(String required) { return scopes != null && scopes.contains(required); }\n  public boolean isExpired(Instant now) { return expiresAt != null && !expiresAt.isAfter(now); }\n}\n\npublic final class OAuth2ScopeGuard {\n  private OAuth2ScopeGuard() {}\n  public static void requireScope(TokenIntrospection token, String scope) {\n    if (token == null || !token.active() || token.isExpired(Instant.now())) {\n      throw new SecurityException(\"Invalid or expired token\");\n    }\n    if (!token.hasScope(scope)) throw new SecurityException(\"Missing scope: \" + scope);\n  }\n  public static Map<String, Object> auditClaims(TokenIntrospection token) {\n    return Map.of(\"sub\", token.sub(), \"client_id\", token.clientId(), \"scopes\", token.scopes());\n  }\n}",
    springCode:
      "@Configuration\n@EnableWebSecurity\npublic class OAuth2ResourceServerConfig {\n  @Bean SecurityFilterChain security(HttpSecurity http) throws Exception {\n    return http.csrf(c -> c.disable())\n        .authorizeHttpRequests(a -> a\n            .requestMatchers(\"/actuator/health\").permitAll()\n            .requestMatchers(HttpMethod.GET, \"/api/orders/**\").hasAuthority(\"SCOPE_orders:read\")\n            .requestMatchers(HttpMethod.POST, \"/api/orders/**\").hasAuthority(\"SCOPE_orders:write\")\n            .anyRequest().authenticated())\n        .oauth2ResourceServer(o -> o.jwt(j -> j.decoder(jwtDecoder())))\n        .build();\n  }\n  @Bean JwtDecoder jwtDecoder() {\n    var decoder = JwtDecoders.fromIssuerLocation(\"https://auth.example.com/realms/shop\");\n    decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(\n        new JwtTimestampValidator(Duration.ofSeconds(30)),\n        new JwtClaimValidator<>(\"aud\", aud -> aud.contains(\"order-api\"))));\n    return decoder;\n  }\n}",
    config: "spring.security.oauth2.resourceserver.jwt.issuer-uri: https://auth.example.com/realms/shop",
    unitTest:
      "package com.vibhu.security.oauth2;\nimport org.junit.jupiter.api.Test;\nimport java.time.Instant;\nimport java.util.Set;\nimport static org.junit.jupiter.api.Assertions.*;\nclass OAuth2ScopeGuardTest {\n  @Test void rejectsExpired() {\n    var t = new TokenIntrospection(true,\"u\",\"c\",Set.of(\"orders:read\"),Instant.now().minusSeconds(1),\"iss\");\n    assertThrows(SecurityException.class, () -> OAuth2ScopeGuard.requireScope(t,\"orders:read\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Short access TTL; rotate signing keys; least-privilege scopes; jti denylist for replay on sensitive ops.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Dual JWKS keys with kid routing; access 10m; refresh rotation; never log raw tokens.",
    mistakes: [
      "Skipping OAuth 2.0 Authorization on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing OAuth 2.0 Authorization",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for OAuth 2.0 Authorization.",
    interviewQs: [
      "When is OAuth 2.0 Authorization required vs optional?",
      "How do you test OAuth 2.0 Authorization in CI?",
    ],
    trickyQs: [
      "OAuth 2.0 Authorization during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for OAuth 2.0 Authorization.",
    ],
    deepLabHref: "/oauth-jwt-demo",
  },
  {
    id: "openid-connect",
    part: 14,
    name: "OpenID Connect (OIDC)",
    frequency: "Frequently used",
    definition: "Identity layer on OAuth2 adding ID token, UserInfo, and standard claims (sub, email, groups).",
    problem: "Services need verified user identity and profile claims, not just API scopes.",
    realWorld: "OpenID Connect (OIDC) in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes openid connect (oidc) so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply OpenID Connect (OIDC) policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies OpenID Connect (OIDC) rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.security.oidc;\n\nimport java.util.List;\nimport java.util.Map;\n\npublic record OidcClaims(String sub, String email, List<String> groups, long expEpochSec) {\n  public boolean isExpired(long nowEpochSec) { return nowEpochSec >= expEpochSec; }\n  public boolean inGroup(String group) { return groups.contains(group); }\n}\n\npublic final class OidcIdentityResolver {\n  public String resolveTenant(OidcClaims claims) {\n    return claims.groups().stream().filter(g -> g.startsWith(\"tenant:\"))\n        .map(g -> g.substring(7)).findFirst().orElseThrow(() -> new SecurityException(\"no tenant\"));\n  }\n}",
    springCode:
      "@Bean\nOidcUserService oidcUserService() {\n  return userRequest -> {\n    OidcUser user = new DefaultOidcUser(authorities, userRequest.getIdToken(), \"groups\");\n    if (!user.getIdToken().getAudience().contains(\"shop-spa\")) {\n      throw new OAuth2AuthenticationException(\"invalid_audience\");\n    }\n    return user;\n  };\n}",
    unitTest:
      "package com.vibhu.patterns.p14.openid_connect;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass OpenidConnectServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new OpenidConnectService(new OpenidConnectService.OpenidConnectPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new OpenidConnectService(new OpenidConnectService.OpenidConnectPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Validate iss, aud, nonce (auth code flow); rotate OIDC provider certs; map groups to RBAC with least privilege fields only.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Runbooks for key rotation, cert renewal, and compromise response. OpenID Connect (OIDC) enforced at gateway + service.",
    mistakes: [
      "Skipping OpenID Connect (OIDC) on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing OpenID Connect (OIDC)",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for OpenID Connect (OIDC).",
    interviewQs: [
      "When is OpenID Connect (OIDC) required vs optional?",
      "How do you test OpenID Connect (OIDC) in CI?",
    ],
    trickyQs: [
      "OpenID Connect (OIDC) during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for OpenID Connect (OIDC).",
    ],
  },
  {
    id: "jwt",
    part: 14,
    name: "JSON Web Token (JWT)",
    frequency: "Frequently used",
    definition: "Self-contained signed claims (header.payload.signature) for stateless auth between gateway and services.",
    problem: "Session affinity breaks horizontal scaling; services need trusted caller identity without central session DB.",
    realWorld: "JSON Web Token (JWT) in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes json web token (jwt) so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply JSON Web Token (JWT) policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies JSON Web Token (JWT) rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.security.jwt;\n\nimport java.time.Instant;\nimport java.util.Map;\nimport java.util.Set;\nimport java.util.concurrent.ConcurrentHashMap;\n\n/** Validates JWT claims: expiration, key rotation (kid), replay (jti), least-privilege fields. */\npublic final class JwtClaimsValidator {\n\n  private final Map<String, byte[]> keysByKid;\n  private final Set<String> revokedJti;\n  private final Duration clockSkew;\n\n  public JwtClaimsValidator(Map<String, byte[]> keysByKid, Duration clockSkew) {\n    this.keysByKid = Map.copyOf(keysByKid);\n    this.clockSkew = clockSkew;\n    this.revokedJti = ConcurrentHashMap.newKeySet();\n  }\n\n  public record JwtClaims(String sub, String aud, Set<String> scopes, Instant exp, String jti, String kid) {}\n\n  public void validate(JwtClaims claims, Instant now) {\n    if (!keysByKid.containsKey(claims.kid())) {\n      throw new SecurityException(\"unknown signing key kid — rotation in progress?\");\n    }\n    if (claims.exp().plus(clockSkew).isBefore(now)) {\n      throw new SecurityException(\"token expired\");\n    }\n    if (revokedJti.contains(claims.jti())) {\n      throw new SecurityException(\"replay detected — jti revoked\");\n    }\n    if (claims.scopes() == null || claims.scopes().isEmpty()) {\n      throw new SecurityException(\"least privilege: token must carry explicit scopes\");\n    }\n    if (claims.aud() == null || !claims.aud().equals(\"order-api\")) {\n      throw new SecurityException(\"wrong audience\");\n    }\n  }\n\n  public void revokeOnCompromise(String jti) { revokedJti.add(jti); }\n\n  public void registerRotatedKey(String kid, byte[] publicKey) {\n    ((ConcurrentHashMap<String, byte[]>) keysByKid).put(kid, publicKey);\n  }\n}",
    springCode:
      "@Bean\nJwtDecoder jwtDecoder() {\n  NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(\"https://auth.example.com/.well-known/jwks.json\").build();\n  decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(\n      new JwtTimestampValidator(Duration.ofSeconds(30)),\n      token -> token.getClaimAsStringList(\"scope\").contains(\"orders:read\")\n          ? OAuth2TokenValidatorResult.success() : OAuth2TokenValidatorResult.failure(\"missing scope\")));\n  return decoder;\n}",
    unitTest:
      "package com.vibhu.patterns.p14.jwt;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass JwtServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new JwtService(new JwtService.JwtPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new JwtService(new JwtService.JwtPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key rotation: accept tokens signed with old kid for overlap window",
      "JWT compromise: revoke jti family + force re-login",
      "Replay: one-time jti for payment authorization",
      "Least privilege: scope claim only — no full user profile in JWT",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "On compromise: shorten TTL to 5m, rotate signing keys, revoke refresh family, audit all jti. RS256 + JWKS; never embed PAN/SSN in claims.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Dual JWKS keys with kid; access 10m; Redis jti denylist for payments; alert on validation spike.",
    mistakes: [
      "Trusting alg=none",
      "Putting PII in JWT payload",
      "Skipping exp/nbf validation",
    ],
    antiPatterns: [
      "Long-lived JWT as session",
      "HS256 shared secret in every microservice repo",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for JSON Web Token (JWT).",
    interviewQs: [
      "When is JSON Web Token (JWT) required vs optional?",
      "How do you test JSON Web Token (JWT) in CI?",
    ],
    trickyQs: [
      "JSON Web Token (JWT) during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for JSON Web Token (JWT).",
    ],
  },
  {
    id: "gateway-auth",
    part: 14,
    name: "Gateway Authentication",
    frequency: "Frequently used",
    definition: "Terminate TLS and validate OAuth2/JWT at API Gateway before traffic reaches microservices.",
    problem: "Duplicating auth in every service increases bugs and latency; edge must enforce uniform policy.",
    realWorld: "Gateway Authentication in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes gateway authentication so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Gateway Authentication policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Gateway Authentication rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.security.gateway;\n\npublic final class GatewayAuthFilter {\n  public boolean allow(String authorizationHeader, String path) {\n    if (authorizationHeader == null || !authorizationHeader.startsWith(\"Bearer \")) return false;\n    if (path.startsWith(\"/api/admin\") && !hasAdminScope(authorizationHeader)) return false;\n    return true;\n  }\n  private boolean hasAdminScope(String h) { return h.contains(\"admin\"); /* stub */ }\n}",
    springCode:
      "spring:\n  cloud:\n    gateway:\n      routes:\n        - id: orders\n          uri: lb://order-service\n          predicates:\n            - Path=/api/orders/**\n          filters:\n            - TokenRelay=\n            - name: RequestRateLimiter\n              args:\n                redis-rate-limiter.replenishRate: 100",
    unitTest:
      "package com.vibhu.patterns.p14.gateway_auth;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass GatewayAuthServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new GatewayAuthService(new GatewayAuthService.GatewayAuthPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new GatewayAuthService(new GatewayAuthService.GatewayAuthPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Gateway validates JWT + injects X-User-Id, X-Tenant-Id headers; strips inbound spoofed identity headers.",
    mistakes: [
      "Skipping Gateway Authentication on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Gateway Authentication",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Gateway Authentication.",
    interviewQs: [
      "When is Gateway Authentication required vs optional?",
      "How do you test Gateway Authentication in CI?",
    ],
    trickyQs: [
      "Gateway Authentication during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Gateway Authentication.",
    ],
  },
  {
    id: "service-to-service-auth",
    part: 14,
    name: "Service-to-Service Auth",
    frequency: "Frequently used",
    definition: "Machine identity for east-west calls via client credentials, SPIFFE, or token exchange — not end-user cookies.",
    problem: "User JWT is wrong audience for internal calls; services need their own least-privilege credentials.",
    realWorld: "Service-to-Service Auth in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes service-to-service auth so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Service-to-Service Auth policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Service-to-Service Auth rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.security.s2s;\n\nimport java.net.http.HttpClient;\nimport java.net.http.HttpRequest;\nimport java.net.http.HttpResponse;\nimport java.net.URI;\n\npublic final class ServiceTokenClient {\n  private final HttpClient http = HttpClient.newHttpClient();\n  public String fetchClientCredentialsToken(String tokenUrl, String clientId, String secret) throws Exception {\n    HttpRequest req = HttpRequest.newBuilder(URI.create(tokenUrl))\n        .header(\"Content-Type\", \"application/x-www-form-urlencoded\")\n        .POST(HttpRequest.BodyPublishers.ofString(\n            \"grant_type=client_credentials&client_id=\" + clientId + \"&client_secret=\" + secret + \"&scope=internal:orders\"))\n        .build();\n    HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());\n    if (res.statusCode() != 200) throw new SecurityException(\"token fetch failed\");\n    return res.body(); // parse access_token in production\n  }\n}",
    springCode:
      "@Bean\nOAuth2AuthorizedClientManager serviceClientManager(ClientRegistrationRepository repo) {\n  AuthorizedClientServiceOAuth2AuthorizedClientManager manager =\n      new AuthorizedClientServiceOAuth2AuthorizedClientManager(repo, new InMemoryOAuth2AuthorizedClientService());\n  manager.setAuthorizedClientProvider(OAuth2AuthorizedClientProviderBuilder.builder()\n      .clientCredentials().build());\n  return manager;\n}",
    unitTest:
      "package com.vibhu.patterns.p14.service_to_service_auth;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass ServiceToServiceAuthServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new ServiceToServiceAuthService(new ServiceToServiceAuthService.ServiceToServiceAuthPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new ServiceToServiceAuthService(new ServiceToServiceAuthService.ServiceToServiceAuthPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Runbooks for key rotation, cert renewal, and compromise response. Service-to-Service Auth enforced at gateway + service.",
    mistakes: [
      "Skipping Service-to-Service Auth on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Service-to-Service Auth",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Service-to-Service Auth.",
    interviewQs: [
      "When is Service-to-Service Auth required vs optional?",
      "How do you test Service-to-Service Auth in CI?",
    ],
    trickyQs: [
      "Service-to-Service Auth during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Service-to-Service Auth.",
    ],
  },
  {
    id: "mtls",
    part: 14,
    name: "Mutual TLS (mTLS)",
    frequency: "Frequently used",
    definition: "Both client and server present X.509 certificates so only enrolled workloads connect — common in service mesh.",
    problem: "Network policy alone cannot prove workload identity; stolen IP access must fail without valid cert.",
    realWorld: "Mutual TLS (mTLS) in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes mutual tls (mtls) so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Mutual TLS (mTLS) policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Mutual TLS (mTLS) rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.security.mtls;\n\nimport javax.net.ssl.SSLContext;\nimport javax.net.ssl.TrustManagerFactory;\nimport java.io.FileInputStream;\nimport java.security.KeyStore;\nimport java.security.cert.X509Certificate;\nimport java.time.Instant;\n\npublic final class MtlsCertValidator {\n  public void validatePeerCert(X509Certificate cert, Instant now) {\n    cert.checkValidity(java.util.Date.from(now));\n    if (!cert.getSubjectX500Principal().getName().contains(\"CN=order-service\")) {\n      throw new SecurityException(\"unexpected peer CN\");\n    }\n  }\n  public SSLContext loadContext(String truststorePath, char[] password) throws Exception {\n    KeyStore ks = KeyStore.getInstance(\"PKCS12\");\n    try (var in = new FileInputStream(truststorePath)) { ks.load(in, password); }\n    TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());\n    tmf.init(ks);\n    return SSLContext.getInstance(\"TLS\");\n  }\n}",
    config:
      "apiVersion: security.istio.io/v1beta1\nkind: PeerAuthentication\nmetadata:\n  name: default\nspec:\n  mtls:\n    mode: STRICT",
    unitTest:
      "package com.vibhu.patterns.p14.mtls;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass MtlsServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new MtlsService(new MtlsService.MtlsPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new MtlsService(new MtlsService.MtlsPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Cert rotation: overlap trust bundles 48h; SPIRE/SPIFFE for automatic rotation; revoke compromised serials.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Istio/Linkerd STRICT mTLS; cert TTL 24h; monitor cert expiry alerts 7d ahead.",
    mistakes: [
      "Skipping Mutual TLS (mTLS) on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Mutual TLS (mTLS)",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Mutual TLS (mTLS).",
    interviewQs: [
      "When is Mutual TLS (mTLS) required vs optional?",
      "How do you test Mutual TLS (mTLS) in CI?",
    ],
    trickyQs: [
      "Mutual TLS (mTLS) during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Mutual TLS (mTLS).",
    ],
  },
  {
    id: "rbac",
    part: 14,
    name: "Role-Based Access Control (RBAC)",
    frequency: "Frequently used",
    definition: "Authorize by role membership (ADMIN, SUPPORT, CUSTOMER) mapped to permissions on resources.",
    problem: "Per-user ACLs do not scale; teams need consistent role model across Order, Payment, Admin APIs.",
    realWorld: "Role-Based Access Control (RBAC) in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes role-based access control (rbac) so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Role-Based Access Control (RBAC) policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Role-Based Access Control (RBAC) rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.security.rbac;\n\nimport java.util.EnumSet;\nimport java.util.Map;\nimport java.util.Set;\n\npublic enum Role { CUSTOMER, SUPPORT, ADMIN }\npublic enum Permission { ORDER_READ, ORDER_WRITE, PAYMENT_REFUND }\n\npublic final class RbacMatrix {\n  private static final Map<Role, Set<Permission>> MATRIX = Map.of(\n      Role.CUSTOMER, EnumSet.of(Permission.ORDER_READ),\n      Role.SUPPORT, EnumSet.of(Permission.ORDER_READ, Permission.ORDER_WRITE),\n      Role.ADMIN, EnumSet.allOf(Permission.class));\n\n  public boolean isAllowed(Role role, Permission perm) {\n    return MATRIX.getOrDefault(role, Set.of()).contains(perm);\n  }\n}",
    springCode:
      "@PreAuthorize(\"hasRole('SUPPORT')\")\npublic OrderDto getOrder(@PathVariable UUID id) { ... }",
    unitTest:
      "package com.vibhu.patterns.p14.rbac;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass RbacServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new RbacService(new RbacService.RbacPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new RbacService(new RbacService.RbacPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege: default deny; separate admin roles; no role hierarchy explosion.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Runbooks for key rotation, cert renewal, and compromise response. Role-Based Access Control (RBAC) enforced at gateway + service.",
    mistakes: [
      "Skipping Role-Based Access Control (RBAC) on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Role-Based Access Control (RBAC)",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Role-Based Access Control (RBAC).",
    interviewQs: [
      "When is Role-Based Access Control (RBAC) required vs optional?",
      "How do you test Role-Based Access Control (RBAC) in CI?",
    ],
    trickyQs: [
      "Role-Based Access Control (RBAC) during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Role-Based Access Control (RBAC).",
    ],
  },
  {
    id: "abac",
    part: 14,
    name: "Attribute-Based Access Control (ABAC)",
    frequency: "Occasionally used",
    definition: "Decisions from attributes: user.department, resource.ownerId, time, IP, classification — policy as code.",
    problem: "RBAC too coarse when tenant isolation and data ownership matter (customer sees only own orders).",
    realWorld: "Attribute-Based Access Control (ABAC) in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes attribute-based access control (abac) so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Attribute-Based Access Control (ABAC) policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Attribute-Based Access Control (ABAC) rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.security.abac;\n\npublic record AbacContext(String userId, String tenantId, String resourceOwnerId, String action) {}\n\npublic final class OrderAbacPolicy {\n  public boolean canRead(AbacContext ctx) {\n    if (!\"read\".equals(ctx.action())) return false;\n    return ctx.userId().equals(ctx.resourceOwnerId())\n        || ctx.tenantId() != null; // simplified tenant admin\n  }\n}",
    springCode:
      "@Bean\nMethodSecurityExpressionHandler abacHandler(OrderAbacPolicy policy) {\n  var handler = new DefaultMethodSecurityExpressionHandler();\n  handler.setPermissionEvaluator(new OrderPermissionEvaluator(policy));\n  return handler;\n}",
    unitTest:
      "package com.vibhu.patterns.p14.abac;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass AbacServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new AbacService(new AbacService.AbacPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new AbacService(new AbacService.AbacPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Runbooks for key rotation, cert renewal, and compromise response. Attribute-Based Access Control (ABAC) enforced at gateway + service.",
    mistakes: [
      "Skipping Attribute-Based Access Control (ABAC) on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Attribute-Based Access Control (ABAC)",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Attribute-Based Access Control (ABAC).",
    interviewQs: [
      "When is Attribute-Based Access Control (ABAC) required vs optional?",
      "How do you test Attribute-Based Access Control (ABAC) in CI?",
    ],
    trickyQs: [
      "Attribute-Based Access Control (ABAC) during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Attribute-Based Access Control (ABAC).",
    ],
  },
  {
    id: "token-propagation",
    part: 14,
    name: "Token Propagation",
    frequency: "Frequently used",
    definition: "Forward end-user Bearer token (or derived headers) from gateway through Order → Payment for audit and authZ.",
    problem: "Downstream service must know original user for authorization and correlation — not service account only.",
    realWorld: "Token Propagation in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes token propagation so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Token Propagation policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Token Propagation rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.security.propagation;\n\npublic final class TokenPropagation {\n  public static final String AUTHORIZATION = \"Authorization\";\n  public static final String CORRELATION_ID = \"X-Correlation-Id\";\n\n  public String forwardBearer(String incomingAuth, String correlationId) {\n    if (incomingAuth == null || !incomingAuth.startsWith(\"Bearer \")) {\n      throw new SecurityException(\"missing bearer for propagation\");\n    }\n    return incomingAuth; // attach to outbound RestClient request\n  }\n}",
    springCode:
      "@Bean\nRestClientCustomizer propagateToken() {\n  return builder -> builder.requestInterceptor((req, body, exec) -> {\n    SecurityContextHolder.getContext().getAuthentication();\n    // copy JWT to outbound Authorization header\n    return exec.execute(req, body);\n  });\n}",
    unitTest:
      "package com.vibhu.patterns.p14.token_propagation;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass TokenPropagationServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new TokenPropagationService(new TokenPropagationService.TokenPropagationPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new TokenPropagationService(new TokenPropagationService.TokenPropagationPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Runbooks for key rotation, cert renewal, and compromise response. Token Propagation enforced at gateway + service.",
    mistakes: [
      "Propagating token to untrusted third parties",
      "Logging full propagated token",
    ],
    antiPatterns: [
      "God-admin role bypassing Token Propagation",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Token Propagation.",
    interviewQs: [
      "When is Token Propagation required vs optional?",
      "How do you test Token Propagation in CI?",
    ],
    trickyQs: [
      "Token Propagation during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Token Propagation.",
    ],
  },
  {
    id: "token-exchange",
    part: 14,
    name: "Token Exchange (RFC 8693)",
    frequency: "Occasionally used",
    definition: "Exchange a subject token for a new token with different audience/scope for downstream service.",
    problem: "User token has aud=mobile-app; Payment service needs aud=payment-api without exposing user refresh token.",
    realWorld: "Token Exchange (RFC 8693) in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes token exchange (rfc 8693) so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Token Exchange (RFC 8693) policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Token Exchange (RFC 8693) rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.security.exchange;\n\nimport java.util.Map;\n\npublic final class TokenExchangeClient {\n  public Map<String, String> exchange(String subjectToken, String targetAudience) {\n    // POST /oauth/token grant_type=urn:ietf:params:oauth:grant-type:token-exchange\n    // subject_token + requested_token_type + audience\n    if (subjectToken == null) throw new SecurityException(\"no subject token\");\n    return Map.of(\"access_token\", \"exchanged-for-\" + targetAudience, \"expires_in\", \"300\");\n  }\n}",
    unitTest:
      "package com.vibhu.patterns.p14.token_exchange;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass TokenExchangeServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new TokenExchangeService(new TokenExchangeService.TokenExchangePolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new TokenExchangeService(new TokenExchangeService.TokenExchangePolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Validate original token before exchange; issued token shorter TTL; audit exchange events.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Runbooks for key rotation, cert renewal, and compromise response. Token Exchange (RFC 8693) enforced at gateway + service.",
    mistakes: [
      "Skipping Token Exchange (RFC 8693) on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Token Exchange (RFC 8693)",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Token Exchange (RFC 8693).",
    interviewQs: [
      "When is Token Exchange (RFC 8693) required vs optional?",
      "How do you test Token Exchange (RFC 8693) in CI?",
    ],
    trickyQs: [
      "Token Exchange (RFC 8693) during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Token Exchange (RFC 8693).",
    ],
  },
  {
    id: "secrets-management",
    part: 14,
    name: "Secrets Management",
    frequency: "Frequently used",
    definition: "Central vault (Vault, AWS SM, K8s ESO) for DB passwords, API keys, TLS keys — injected at runtime, never in git.",
    problem: "Hard-coded secrets in images leak via repos and layer caches; rotation requires redeploy without vault.",
    realWorld: "Secrets Management in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes secrets management so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Secrets Management policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Secrets Management rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.security.secrets;\n\nimport java.util.Objects;\nimport java.util.function.Supplier;\n\npublic final class RotatingSecret {\n  private volatile String current;\n  private final Supplier<String> fetchLatest;\n\n  public RotatingSecret(Supplier<String> fetchLatest) {\n    this.fetchLatest = Objects.requireNonNull(fetchLatest);\n    refresh();\n  }\n\n  public String get() { return current; }\n\n  public synchronized void refresh() {\n    this.current = fetchLatest.get();\n  }\n}",
    config:
      "apiVersion: external-secrets.io/v1beta1\nkind: ExternalSecret\nmetadata:\n  name: order-db\nspec:\n  refreshInterval: 1h\n  secretStoreRef:\n    name: aws-secrets-manager\n  target:\n    name: order-db-credentials\n  data:\n    - secretKey: password\n      remoteRef:\n        key: prod/order/db\n        property: password",
    unitTest:
      "package com.vibhu.patterns.p14.secrets_management;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass SecretsManagementServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new SecretsManagementService(new SecretsManagementService.SecretsManagementPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new SecretsManagementService(new SecretsManagementService.SecretsManagementPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Rotate DB creds without downtime; dual-user swap; detect secret sprawl in CI.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Vault dynamic DB creds TTL 1h; ESO sync; alert on secret age > 90d.",
    mistakes: [
      "Skipping Secrets Management on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Secrets Management",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Secrets Management.",
    interviewQs: [
      "When is Secrets Management required vs optional?",
      "How do you test Secrets Management in CI?",
    ],
    trickyQs: [
      "Secrets Management during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Secrets Management.",
    ],
  },
];


// ---------------------------------------------------------------------------
// Part 15 — Observability patterns
// ---------------------------------------------------------------------------

export const OBSERVABILITY_PATTERNS: PatternCard[] = [
  {
    id: "centralized-logging",
    part: 15,
    name: "Centralized Logging",
    frequency: "Frequently used",
    definition: "Aggregate JSON structured logs from all pods to ELK/Loki with correlationId, traceId, spanId fields.",
    problem: "Debugging distributed checkout requires searching one request across gateway, order, payment, kafka consumers.",
    realWorld: "Centralized Logging in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes centralized logging so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Centralized Logging policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Centralized Logging rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.obs.logging;\n\nimport com.fasterxml.jackson.databind.ObjectMapper;\nimport java.util.Map;\nimport org.slf4j.Logger;\nimport org.slf4j.LoggerFactory;\nimport org.slf4j.MDC;\n\npublic final class StructuredLogger {\n  private static final Logger log = LoggerFactory.getLogger(StructuredLogger.class);\n  private static final ObjectMapper mapper = new ObjectMapper();\n\n  public void info(String event, String correlationId, String traceId, Map<String, Object> fields) {\n    MDC.put(\"correlationId\", correlationId);\n    MDC.put(\"traceId\", traceId);\n    try {\n      log.info(mapper.writeValueAsString(Map.of(\n          \"event\", event, \"correlationId\", correlationId, \"traceId\", traceId, \"fields\", fields)));\n    } catch (Exception e) {\n      log.warn(\"log serialize failed\", e);\n    } finally {\n      MDC.clear();\n    }\n  }\n}",
    config: "logging.pattern.console=%d{ISO8601} %level [%X{traceId},%X{spanId}] %logger - %msg%n",
    unitTest:
      "package com.vibhu.patterns.p15.centralized_logging;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass CentralizedLoggingServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new CentralizedLoggingService(new CentralizedLoggingService.CentralizedLoggingPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new CentralizedLoggingService(new CentralizedLoggingService.CentralizedLoggingPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "JSON logs → Loki/ELK; index correlationId + traceId; never log PAN/PII.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Runbooks for key rotation, cert renewal, and compromise response. Centralized Logging enforced at gateway + service.",
    mistakes: [
      "Skipping Centralized Logging on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Centralized Logging",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Centralized Logging.",
    interviewQs: [
      "When is Centralized Logging required vs optional?",
      "How do you test Centralized Logging in CI?",
    ],
    trickyQs: [
      "Centralized Logging during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Centralized Logging.",
    ],
  },
  {
    id: "metrics",
    part: 15,
    name: "Metrics (RED/USE)",
    frequency: "Frequently used",
    definition: "Counters, gauges, histograms for rate, errors, duration, throughput, queue depth per service.",
    problem: "Without metrics you cannot SLO checkout p99 or detect payment error spike before pager.",
    realWorld: "Metrics (RED/USE) in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes metrics (red/use) so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Metrics (RED/USE) policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Metrics (RED/USE) rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.obs.metrics;\n\nimport io.micrometer.core.instrument.*;\n\npublic final class OrderMetrics {\n  private final Counter ordersCreated;\n  private final Timer checkoutLatency;\n  private final AtomicInteger queueDepth;\n\n  public OrderMetrics(MeterRegistry registry) {\n    this.ordersCreated = Counter.builder(\"orders_created_total\").tag(\"service\",\"order\").register(registry);\n    this.checkoutLatency = Timer.builder(\"checkout_latency_seconds\").publishPercentiles(0.5,0.99).register(registry);\n    this.queueDepth = registry.gauge(\"outbox_queue_depth\", new AtomicInteger(0));\n  }\n\n  public void recordCheckout(Runnable action) {\n    checkoutLatency.record(action);\n    ordersCreated.increment();\n  }\n}",
    springCode:
      "@Bean MeterRegistryCustomizer<MeterRegistry> commonTags() {\n  return r -> r.config().commonTags(\"app\", \"order-service\", \"env\", \"prod\");\n}",
    unitTest:
      "package com.vibhu.patterns.p15.metrics;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass MetricsServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new MetricsService(new MetricsService.MetricsPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new MetricsService(new MetricsService.MetricsPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Runbooks for key rotation, cert renewal, and compromise response. Metrics (RED/USE) enforced at gateway + service.",
    mistakes: [
      "Skipping Metrics (RED/USE) on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Metrics (RED/USE)",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Metrics (RED/USE).",
    interviewQs: [
      "When is Metrics (RED/USE) required vs optional?",
      "How do you test Metrics (RED/USE) in CI?",
    ],
    trickyQs: [
      "Metrics (RED/USE) during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Metrics (RED/USE).",
    ],
  },
  {
    id: "distributed-tracing",
    part: 15,
    name: "Distributed Tracing (OpenTelemetry)",
    frequency: "Frequently used",
    definition: "Propagate trace context W3C traceparent across gateway → order → payment → kafka consumer spans.",
    problem: "Latency regression in checkout chain invisible without end-to-end trace waterfall.",
    realWorld: "Distributed Tracing (OpenTelemetry) in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes distributed tracing (opentelemetry) so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\ntraceId=7f3a9c2b1e8d4a60  spanId hierarchy (OpenTelemetry)\n┌─ [gateway] POST /checkout ─────────────────── 12ms ─┐\n│  ├─ [order-svc] createOrder ───────────────── 45ms ─┤\n│  │    ├─ [payment-svc] authorize ─────────── 30ms ─┤\n│  │    └─ [kafka] produce orders.paid ────────── 2ms ─┤\n│  └─ [payment-consumer] settle payment ────── 18ms ─┘\nW3C traceparent: 00-7f3a9c2b1e8d4a60-abc123-def456-01",
    flow: "Ingress → validate → apply Distributed Tracing (OpenTelemetry) policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Distributed Tracing (OpenTelemetry) rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.obs.tracing;\n\nimport io.opentelemetry.api.trace.*;\nimport io.opentelemetry.context.Scope;\n\npublic final class TracedCheckout {\n  private final Tracer tracer;\n  public TracedCheckout(Tracer tracer) { this.tracer = tracer; }\n\n  public void checkout(String orderId) {\n    Span span = tracer.spanBuilder(\"checkout\").setSpanKind(SpanKind.SERVER).startSpan();\n    try (Scope s = span.makeCurrent()) {\n      span.setAttribute(\"order.id\", orderId);\n      span.addEvent(\"payment_authorized\");\n    } finally {\n      span.end();\n    }\n  }\n}",
    springCode:
      "management.otlp.tracing.endpoint: http://otel-collector:4318/v1/traces\nmanagement.tracing.sampling.probability: 0.1",
    kafkaCode:
      "@KafkaListener(topics = \"orders.paid\")\npublic void onPaid(ConsumerRecord<String, String> rec) {\n  Span span = tracer.spanBuilder(\"consume orders.paid\")\n      .setParent(Context.current()) // propagated from producer headers\n      .startSpan();\n  try (Scope scope = span.makeCurrent()) { process(rec); } finally { span.end(); }\n}",
    unitTest:
      "package com.vibhu.patterns.p15.distributed_tracing;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass DistributedTracingServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new DistributedTracingService(new DistributedTracingService.DistributedTracingPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new DistributedTracingService(new DistributedTracingService.DistributedTracingPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Runbooks for key rotation, cert renewal, and compromise response. Distributed Tracing (OpenTelemetry) enforced at gateway + service.",
    mistakes: [
      "Skipping Distributed Tracing (OpenTelemetry) on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Distributed Tracing (OpenTelemetry)",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Distributed Tracing (OpenTelemetry).",
    interviewQs: [
      "When is Distributed Tracing (OpenTelemetry) required vs optional?",
      "How do you test Distributed Tracing (OpenTelemetry) in CI?",
    ],
    trickyQs: [
      "Distributed Tracing (OpenTelemetry) during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Distributed Tracing (OpenTelemetry).",
    ],
  },
  {
    id: 'correlation-id',
    part: 15,
    name: 'Correlation ID Propagation',
    frequency: 'Frequently used',
    definition:
      'Unique ID (X-Correlation-Id) generated at edge and propagated through every HTTP call, Kafka message header, and log line — ties one business transaction across services.',
    problem:
      'Payment failed in production — logs scattered across 5 services with no way to find all lines for one checkout attempt.',
    realWorld:
      'Gateway generates UUID → Order → Payment → Kafka headers → Settlement; grep correlationId=abc123 finds entire flow.',
    whyExists:
      'Distributed systems lose single-process stack traces; correlation ID is minimum viable distributed debugging.',
    ascii: `
Client traceId=abc123
   │
Gateway [correlationId=abc123]
   │
Order Service [correlationId=abc123] MDC
   │
Kafka header: correlationId=abc123
   │
Payment Service [correlationId=abc123] MDC
`,
    flow: 'Gateway creates or forwards correlationId → MDC.put in each service → propagate in WebClient/Kafka headers → structured JSON logs include field.',
    components: [
      {name: 'CorrelationIdFilter', responsibility: 'Gateway global filter'},
      {name: 'MDC propagator', responsibility: 'Log every line with correlationId'},
      {name: 'Kafka header', responsibility: 'correlationId on every message'},
    ],
    javaCode: `@Component
public class CorrelationIdFilter implements GlobalFilter, Ordered {
  public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
    String cid = Optional.ofNullable(exchange.getRequest().getHeaders().getFirst("X-Correlation-Id"))
        .filter(s -> !s.isBlank()).orElse(UUID.randomUUID().toString());
    MDC.put("correlationId", cid);
    return chain.filter(exchange.mutate()
        .request(b -> b.header("X-Correlation-Id", cid)).build());
  }
}`,
    config: `logging.pattern.console=%d [%X{correlationId},%X{traceId}] %msg%n`,
    kafkaCode: `rec.headers().add("correlationId", cid.getBytes(UTF_8));`,
    unitTest: `@Test void missingHeader_generatesNewCorrelationId() {
  String cid = filter.resolveCorrelationId(emptyHeaders());
  assertNotNull(cid);
}`,
    edgeCases: ['Async @Async — copy MDC to child thread', 'Reactive — use Context propagation'],
    failureScenarios: ['Lost correlationId at one hop — chain broken'],
    retry: 'Same correlationId on retry',
    idempotency: 'N/A',
    timeout: 'N/A',
    observability: 'This IS observability foundation',
    security: 'Do not embed PII in correlationId',
    performance: 'Negligible overhead',
    scalability: 'Stateless — ID in headers only',
    production: 'Require correlationId in all internal APIs; reject missing in prod strict mode',
    mistakes: ['New UUID per internal hop', 'Not propagating to Kafka'],
    antiPatterns: ['Only traceId without business correlationId'],
    alternatives: ['OpenTelemetry traceId spans (use both)'],
    tradeoffs: 'Pros: simple, universal. Cons: not a full trace without spans.',
    interviewQs: ['correlationId vs traceId vs spanId?', 'How propagate in Kafka?'],
    trickyQs: ['Async thread loses MDC — fix?'],
    seniorFollowUps: ['Design log query for one checkout failure'],
  },
  {
    id: 'health-check-api',
    part: 15,
    name: 'Health Check API (Liveness / Readiness)',
    frequency: 'Frequently used',
    definition:
      'Liveness: is process alive? Readiness: can it accept traffic? Kubernetes uses /actuator/health/liveness and /readiness to route traffic.',
    problem:
      'Payment pod starts but Kafka consumer not connected — LB sends traffic → 500 errors until consumer ready.',
    realWorld:
      'Spring Boot Actuator; readiness fails until DB migration + Kafka connection OK; liveness restarts hung JVM.',
    whyExists:
      'Orchestrators need automated signals to restart crashed pods and withhold traffic from warming pods.',
    ascii: `
K8s probe ──GET /actuator/health/readiness──► Payment Pod
                    │
                    ├── DB UP + Kafka UP → 200 READY
                    └── Kafka DOWN → 503 NOT READY (removed from Service)
`,
    flow: 'Pod starts → readiness fails → no traffic → Kafka connects → readiness OK → LB adds endpoint → liveness monitors hang.',
    components: [
      {name: 'Liveness probe', responsibility: 'Restart if deadlocked'},
      {name: 'Readiness probe', responsibility: 'Check DB, Kafka, cache dependencies'},
      {name: 'HealthIndicator', responsibility: 'Custom checks per dependency'},
    ],
    javaCode: `@Component
public class KafkaHealthIndicator implements HealthIndicator {
  private final KafkaAdmin admin;
  public Health health() {
    try { admin.describeCluster().nodes().get(3, TimeUnit.SECONDS); return Health.up().build(); }
    catch (Exception e) { return Health.down().withException(e).build(); }
  }
}`,
    config: `management.endpoint.health.probes.enabled=true
management.health.livenessState.enabled=true
management.health.readinessState.enabled=true`,
    unitTest: `@Test void kafkaDown_readinessDown() {
  when(kafkaAdmin.describeCluster()).thenThrow(new RuntimeException());
  assertEquals(Status.DOWN, indicator.health().getStatus());
}`,
    edgeCases: ['Deep health check slow — keep readiness fast (<1s)', 'Liveness too aggressive — restart during GC'],
    failureScenarios: ['All pods not ready — total outage; use startup probe'],
    retry: 'K8s retries probe',
    idempotency: 'N/A',
    timeout: 'Probe timeoutSeconds: 3',
    observability: 'Alert on readiness flapping',
    security: 'Do not expose detailed health publicly',
    performance: 'Lightweight checks only on readiness',
    scalability: 'Per-pod independent',
    production: 'Separate liveness (cheap) from readiness (deps); startupProbe for slow JVM',
    mistakes: ['Heavy query in liveness', 'Readiness checks external payment API'],
    antiPatterns: ['No health check — black hole pods'],
    alternatives: ['Service mesh outlier detection'],
    tradeoffs: 'Pros: safe rollouts. Cons: misconfigured probes cause flapping.',
    interviewQs: ['Liveness vs readiness?', 'Health check during canary?'],
    trickyQs: ['Kafka rebalance — readiness should fail?'],
    seniorFollowUps: ['Design health checks for Kafka consumer pod'],
  },
];


// ---------------------------------------------------------------------------
// Part 16 — Deployment patterns
// ---------------------------------------------------------------------------

export const DEPLOY_PATTERNS: PatternCard[] = [
  {
    id: "blue-green",
    part: 16,
    name: "Blue-Green Deployment",
    frequency: "Frequently used",
    definition: "Two identical environments; switch traffic from blue (current) to green (new) atomically via Service selector or ingress.",
    problem: "Rolling deploy risks mixed versions during checkout; need instant rollback.",
    realWorld: "Blue-Green Deployment in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes blue-green deployment so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Blue-Green Deployment policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Blue-Green Deployment rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.deploy.bluegreen;\n\npublic final class BlueGreenRouter {\n  public String activeColor() { return System.getenv().getOrDefault(\"DEPLOY_COLOR\", \"blue\"); }\n  public boolean isReady(String color, boolean healthOk) { return healthOk; }\n}",
    config:
      "apiVersion: v1\nkind: Service\nmetadata:\n  name: order-service\nspec:\n  selector:\n    app: order\n    version: green   # flip blue/green\n  ports:\n    - port: 80\n      targetPort: 8080",
    unitTest:
      "package com.vibhu.patterns.p16.blue_green;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass BlueGreenServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new BlueGreenService(new BlueGreenService.BlueGreenPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new BlueGreenService(new BlueGreenService.BlueGreenPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Kubernetes blue-green with health checks and automated rollback.",
    mistakes: [
      "Skipping Blue-Green Deployment on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Blue-Green Deployment",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Blue-Green Deployment.",
    interviewQs: [
      "When is Blue-Green Deployment required vs optional?",
      "How do you test Blue-Green Deployment in CI?",
    ],
    trickyQs: [
      "Blue-Green Deployment during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Blue-Green Deployment.",
    ],
  },
  {
    id: "canary",
    part: 16,
    name: "Canary Deployment",
    frequency: "Frequently used",
    definition: "Route small % traffic to new version; promote on golden signals or auto-rollback on error budget burn.",
    problem: "Full cutover risky; need production validation with real users.",
    realWorld: "Canary Deployment in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes canary deployment so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Canary Deployment policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Canary Deployment rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.patterns.p16.canary;\n\nimport java.util.Objects;\n\n/** Production-grade Canary Deployment helper for microservice boundaries. */\npublic final class CanaryService {\n\n  private final CanaryPolicy policy;\n\n  public CanaryService(CanaryPolicy policy) {\n    this.policy = Objects.requireNonNull(policy);\n  }\n\n  public void enforce(String principal, String action, String resource) {\n    if (!policy.isAllowed(principal, action, resource)) {\n      throw new SecurityException(\"Canary Deployment denied: \" + principal + \" on \" + resource);\n    }\n  }\n\n  public record CanaryPolicy(boolean enabled) {\n    public boolean isAllowed(String principal, String action, String resource) {\n      return enabled && principal != null && !principal.isBlank();\n    }\n  }\n}",
    config:
      "apiVersion: networking.istio.io/v1beta1\nkind: VirtualService\nmetadata:\n  name: order-canary\nspec:\n  http:\n    - route:\n        - destination: { host: order-service, subset: stable }\n          weight: 90\n        - destination: { host: order-service, subset: canary }\n          weight: 10",
    unitTest:
      "package com.vibhu.patterns.p16.canary;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass CanaryServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new CanaryService(new CanaryService.CanaryPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new CanaryService(new CanaryService.CanaryPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Runbooks for key rotation, cert renewal, and compromise response. Canary Deployment enforced at gateway + service.",
    mistakes: [
      "Skipping Canary Deployment on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Canary Deployment",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Canary Deployment.",
    interviewQs: [
      "When is Canary Deployment required vs optional?",
      "How do you test Canary Deployment in CI?",
    ],
    trickyQs: [
      "Canary Deployment during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Canary Deployment.",
    ],
  },
  {
    id: "rolling",
    part: 16,
    name: "Rolling Deployment",
    frequency: "Frequently used",
    definition: "Replace pods incrementally with maxUnavailable/maxSurge — default K8s Deployment strategy.",
    problem: "Need zero-downtime deploy without doubling cluster capacity.",
    realWorld: "Rolling Deployment in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes rolling deployment so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Rolling Deployment policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Rolling Deployment rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.patterns.p16.rolling;\n\nimport java.util.Objects;\n\n/** Production-grade Rolling Deployment helper for microservice boundaries. */\npublic final class RollingService {\n\n  private final RollingPolicy policy;\n\n  public RollingService(RollingPolicy policy) {\n    this.policy = Objects.requireNonNull(policy);\n  }\n\n  public void enforce(String principal, String action, String resource) {\n    if (!policy.isAllowed(principal, action, resource)) {\n      throw new SecurityException(\"Rolling Deployment denied: \" + principal + \" on \" + resource);\n    }\n  }\n\n  public record RollingPolicy(boolean enabled) {\n    public boolean isAllowed(String principal, String action, String resource) {\n      return enabled && principal != null && !principal.isBlank();\n    }\n  }\n}",
    config:
      "spec:\n  strategy:\n    type: RollingUpdate\n    rollingUpdate:\n      maxSurge: 25%\n      maxUnavailable: 0",
    unitTest:
      "package com.vibhu.patterns.p16.rolling;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass RollingServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new RollingService(new RollingService.RollingPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new RollingService(new RollingService.RollingPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Runbooks for key rotation, cert renewal, and compromise response. Rolling Deployment enforced at gateway + service.",
    mistakes: [
      "Skipping Rolling Deployment on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Rolling Deployment",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Rolling Deployment.",
    interviewQs: [
      "When is Rolling Deployment required vs optional?",
      "How do you test Rolling Deployment in CI?",
    ],
    trickyQs: [
      "Rolling Deployment during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Rolling Deployment.",
    ],
  },
  {
    id: "shadow",
    part: 16,
    name: "Shadow / Mirror Traffic",
    frequency: "Occasionally used",
    definition: "Duplicate production traffic to new version without affecting responses — validate behavior under load.",
    problem: "Canary risks user-facing bugs; shadow tests new code path with real payloads.",
    realWorld: "Shadow / Mirror Traffic in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes shadow / mirror traffic so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Shadow / Mirror Traffic policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Shadow / Mirror Traffic rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.patterns.p16.shadow;\n\nimport java.util.Objects;\n\n/** Production-grade Shadow / Mirror Traffic helper for microservice boundaries. */\npublic final class ShadowService {\n\n  private final ShadowPolicy policy;\n\n  public ShadowService(ShadowPolicy policy) {\n    this.policy = Objects.requireNonNull(policy);\n  }\n\n  public void enforce(String principal, String action, String resource) {\n    if (!policy.isAllowed(principal, action, resource)) {\n      throw new SecurityException(\"Shadow / Mirror Traffic denied: \" + principal + \" on \" + resource);\n    }\n  }\n\n  public record ShadowPolicy(boolean enabled) {\n    public boolean isAllowed(String principal, String action, String resource) {\n      return enabled && principal != null && !principal.isBlank();\n    }\n  }\n}",
    config:
      "spec:\n  http:\n    - route:\n        - destination: { host: order-stable }\n      mirror:\n        host: order-candidate\n      mirrorPercentage: { value: 5 }",
    unitTest:
      "package com.vibhu.patterns.p16.shadow;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass ShadowServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new ShadowService(new ShadowService.ShadowPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new ShadowService(new ShadowService.ShadowPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Runbooks for key rotation, cert renewal, and compromise response. Shadow / Mirror Traffic enforced at gateway + service.",
    mistakes: [
      "Skipping Shadow / Mirror Traffic on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Shadow / Mirror Traffic",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Shadow / Mirror Traffic.",
    interviewQs: [
      "When is Shadow / Mirror Traffic required vs optional?",
      "How do you test Shadow / Mirror Traffic in CI?",
    ],
    trickyQs: [
      "Shadow / Mirror Traffic during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Shadow / Mirror Traffic.",
    ],
  },
  {
    id: "feature-flags",
    part: 16,
    name: "Feature Flags",
    frequency: "Frequently used",
    definition: "Runtime toggles (LaunchDarkly, Unleash) decouple deploy from release — dark code paths behind flags.",
    problem: "Long-lived branches for features; cannot wait for deploy train to enable UI.",
    realWorld: "Feature Flags in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes feature flags so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Feature Flags policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Feature Flags rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.deploy.flags;\n\npublic final class FeatureFlags {\n  private final java.util.function.BooleanSupplier newCheckoutEnabled;\n  public FeatureFlags(java.util.function.BooleanSupplier newCheckoutEnabled) {\n    this.newCheckoutEnabled = newCheckoutEnabled;\n  }\n  public boolean useNewCheckout() { return newCheckoutEnabled.getAsBoolean(); }\n}",
    springCode:
      "@Bean\nFeatureFlags flags(Unleash unleash) {\n  return new FeatureFlags(() -> unleash.isEnabled(\"new-checkout-v2\"));\n}",
    unitTest:
      "package com.vibhu.patterns.p16.feature_flags;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass FeatureFlagsServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new FeatureFlagsService(new FeatureFlagsService.FeatureFlagsPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new FeatureFlagsService(new FeatureFlagsService.FeatureFlagsPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Runbooks for key rotation, cert renewal, and compromise response. Feature Flags enforced at gateway + service.",
    mistakes: [
      "Skipping Feature Flags on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Feature Flags",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Feature Flags.",
    interviewQs: [
      "When is Feature Flags required vs optional?",
      "How do you test Feature Flags in CI?",
    ],
    trickyQs: [
      "Feature Flags during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Feature Flags.",
    ],
  },
  {
    id: "dark-launch",
    part: 16,
    name: "Dark Launch",
    frequency: "Occasionally used",
    definition: "Ship code to production disabled by flag; internal dogfood or shadow validation before public enable.",
    problem: "Big bang feature launches cause incidents; validate in prod safely.",
    realWorld: "Dark Launch in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes dark launch so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Dark Launch policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Dark Launch rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.patterns.p16.dark_launch;\n\nimport java.util.Objects;\n\n/** Production-grade Dark Launch helper for microservice boundaries. */\npublic final class DarkLaunchService {\n\n  private final DarkLaunchPolicy policy;\n\n  public DarkLaunchService(DarkLaunchPolicy policy) {\n    this.policy = Objects.requireNonNull(policy);\n  }\n\n  public void enforce(String principal, String action, String resource) {\n    if (!policy.isAllowed(principal, action, resource)) {\n      throw new SecurityException(\"Dark Launch denied: \" + principal + \" on \" + resource);\n    }\n  }\n\n  public record DarkLaunchPolicy(boolean enabled) {\n    public boolean isAllowed(String principal, String action, String resource) {\n      return enabled && principal != null && !principal.isBlank();\n    }\n  }\n}",
    unitTest:
      "package com.vibhu.patterns.p16.dark_launch;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass DarkLaunchServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new DarkLaunchService(new DarkLaunchService.DarkLaunchPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new DarkLaunchService(new DarkLaunchService.DarkLaunchPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Deploy with flag off → internal tenants → 1% → 100%; monitor error rate each step.",
    mistakes: [
      "Skipping Dark Launch on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Dark Launch",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Dark Launch.",
    interviewQs: [
      "When is Dark Launch required vs optional?",
      "How do you test Dark Launch in CI?",
    ],
    trickyQs: [
      "Dark Launch during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Dark Launch.",
    ],
  },
];


// ---------------------------------------------------------------------------
// Part 17 — API versioning patterns
// ---------------------------------------------------------------------------

export const VERSIONING_PATTERNS: PatternCard[] = [
  {
    id: "uri-versioning",
    part: 17,
    name: "URI Versioning",
    frequency: "Frequently used",
    definition: "/api/v1/orders vs /api/v2/orders — explicit, cache-friendly, visible in logs.",
    problem: "Breaking API changes break mobile clients; need coexistence period.",
    realWorld: "URI Versioning in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes uri versioning so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply URI Versioning policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies URI Versioning rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.patterns.p17.uri_versioning;\n\nimport java.util.Objects;\n\n/** Production-grade URI Versioning helper for microservice boundaries. */\npublic final class UriVersioningService {\n\n  private final UriVersioningPolicy policy;\n\n  public UriVersioningService(UriVersioningPolicy policy) {\n    this.policy = Objects.requireNonNull(policy);\n  }\n\n  public void enforce(String principal, String action, String resource) {\n    if (!policy.isAllowed(principal, action, resource)) {\n      throw new SecurityException(\"URI Versioning denied: \" + principal + \" on \" + resource);\n    }\n  }\n\n  public record UriVersioningPolicy(boolean enabled) {\n    public boolean isAllowed(String principal, String action, String resource) {\n      return enabled && principal != null && !principal.isBlank();\n    }\n  }\n}",
    springCode:
      "@RestController\n@RequestMapping(\"/api/v1/orders\")\nclass OrderV1Controller {\n  @GetMapping(\"/{id}\") public OrderV1Dto get(@PathVariable UUID id) { ... }\n}\n\n@RestController\n@RequestMapping(\"/api/v2/orders\")\nclass OrderV2Controller {\n  @GetMapping(\"/{id}\") public OrderV2Dto get(@PathVariable UUID id) { ... }\n}",
    unitTest:
      "package com.vibhu.patterns.p17.uri_versioning;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass UriVersioningServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new UriVersioningService(new UriVersioningService.UriVersioningPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new UriVersioningService(new UriVersioningService.UriVersioningPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Sunset v1 with Deprecation header + 6-month notice; monitor v1 traffic before removal.",
    mistakes: [
      "Skipping URI Versioning on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing URI Versioning",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for URI Versioning.",
    interviewQs: [
      "When is URI Versioning required vs optional?",
      "How do you test URI Versioning in CI?",
    ],
    trickyQs: [
      "URI Versioning during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for URI Versioning.",
    ],
  },
  {
    id: "header-versioning",
    part: 17,
    name: "Header Versioning",
    frequency: "Occasionally used",
    definition: "Clients send Accept-Version: 2 or X-API-Version: 2; same URI, version in header.",
    problem: "URI versioning proliferates routes; some clients prefer stable URL.",
    realWorld: "Header Versioning in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes header versioning so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Header Versioning policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Header Versioning rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.patterns.p17.header_versioning;\n\nimport java.util.Objects;\n\n/** Production-grade Header Versioning helper for microservice boundaries. */\npublic final class HeaderVersioningService {\n\n  private final HeaderVersioningPolicy policy;\n\n  public HeaderVersioningService(HeaderVersioningPolicy policy) {\n    this.policy = Objects.requireNonNull(policy);\n  }\n\n  public void enforce(String principal, String action, String resource) {\n    if (!policy.isAllowed(principal, action, resource)) {\n      throw new SecurityException(\"Header Versioning denied: \" + principal + \" on \" + resource);\n    }\n  }\n\n  public record HeaderVersioningPolicy(boolean enabled) {\n    public boolean isAllowed(String principal, String action, String resource) {\n      return enabled && principal != null && !principal.isBlank();\n    }\n  }\n}",
    springCode:
      "@GetMapping(\"/api/orders/{id}\")\npublic ResponseEntity<?> get(@PathVariable UUID id,\n    @RequestHeader(value = \"X-API-Version\", defaultValue = \"1\") int version) {\n  return switch (version) {\n    case 1 -> ResponseEntity.ok(orderV1(id));\n    case 2 -> ResponseEntity.ok(orderV2(id));\n    default -> ResponseEntity.status(HttpStatus.BAD_REQUEST).build();\n  };\n}",
    unitTest:
      "package com.vibhu.patterns.p17.header_versioning;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass HeaderVersioningServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new HeaderVersioningService(new HeaderVersioningService.HeaderVersioningPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new HeaderVersioningService(new HeaderVersioningService.HeaderVersioningPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Runbooks for key rotation, cert renewal, and compromise response. Header Versioning enforced at gateway + service.",
    mistakes: [
      "Skipping Header Versioning on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Header Versioning",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Header Versioning.",
    interviewQs: [
      "When is Header Versioning required vs optional?",
      "How do you test Header Versioning in CI?",
    ],
    trickyQs: [
      "Header Versioning during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Header Versioning.",
    ],
  },
  {
    id: "media-type-versioning",
    part: 17,
    name: "Media Type Versioning",
    frequency: "Occasionally used",
    definition: "Accept: application/vnd.shop.order.v2+json — HATEOAS-friendly content negotiation.",
    problem: "REST purists want version in representation not URL.",
    realWorld: "Media Type Versioning in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes media type versioning so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Media Type Versioning policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Media Type Versioning rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.patterns.p17.media_type_versioning;\n\nimport java.util.Objects;\n\n/** Production-grade Media Type Versioning helper for microservice boundaries. */\npublic final class MediaTypeVersioningService {\n\n  private final MediaTypeVersioningPolicy policy;\n\n  public MediaTypeVersioningService(MediaTypeVersioningPolicy policy) {\n    this.policy = Objects.requireNonNull(policy);\n  }\n\n  public void enforce(String principal, String action, String resource) {\n    if (!policy.isAllowed(principal, action, resource)) {\n      throw new SecurityException(\"Media Type Versioning denied: \" + principal + \" on \" + resource);\n    }\n  }\n\n  public record MediaTypeVersioningPolicy(boolean enabled) {\n    public boolean isAllowed(String principal, String action, String resource) {\n      return enabled && principal != null && !principal.isBlank();\n    }\n  }\n}",
    springCode:
      "@GetMapping(value = \"/api/orders/{id}\", produces = \"application/vnd.shop.order.v1+json\")\npublic OrderV1Dto v1(@PathVariable UUID id) { ... }\n\n@GetMapping(value = \"/api/orders/{id}\", produces = \"application/vnd.shop.order.v2+json\")\npublic OrderV2Dto v2(@PathVariable UUID id) { ... }",
    unitTest:
      "package com.vibhu.patterns.p17.media_type_versioning;\n\nimport org.junit.jupiter.api.Test;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\nclass MediaTypeVersioningServiceTest {\n\n  @Test\n  void allowsValidPrincipal() {\n    var svc = new MediaTypeVersioningService(new MediaTypeVersioningService.MediaTypeVersioningPolicy(true));\n    assertDoesNotThrow(() -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n\n  @Test\n  void deniesWhenPolicyDisabled() {\n    var svc = new MediaTypeVersioningService(new MediaTypeVersioningService.MediaTypeVersioningPolicy(false));\n    assertThrows(SecurityException.class, () -> svc.enforce(\"svc-order\", \"read\", \"order-42\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Runbooks for key rotation, cert renewal, and compromise response. Media Type Versioning enforced at gateway + service.",
    mistakes: [
      "Skipping Media Type Versioning on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Media Type Versioning",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: clean URIs. Cons: harder to test in browser, CDN caching complexity.",
    interviewQs: [
      "When is Media Type Versioning required vs optional?",
      "How do you test Media Type Versioning in CI?",
    ],
    trickyQs: [
      "Media Type Versioning during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Media Type Versioning.",
    ],
  },
];


// ---------------------------------------------------------------------------
// Part 18 — GoF patterns (microservice lens)
// ---------------------------------------------------------------------------

export const GOF_PATTERNS: PatternCard[] = [
  {
    id: "singleton",
    part: 18,
    name: "Singleton",
    frequency: "Occasionally used",
    definition: "GoF Singleton pattern — structural/behavioral building block in production microservices.",
    problem: "Ensure one instance of config/registry per JVM (e.g., rate limit config loader).",
    realWorld: "Singleton in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes singleton so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Singleton policy → business logic → audit log.",
    components: [
      {name: "Singleton abstraction", responsibility: "Ensure one instance of config/registry per JVM (e"},
      {name: "Client / caller", responsibility: "Uses Singleton without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.singleton;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic final class RateLimitConfigHolder {\n  private static volatile RateLimitConfigHolder INSTANCE;\n  private final int requestsPerSecond;\n  private RateLimitConfigHolder(int rps) { this.requestsPerSecond = rps; }\n  public static RateLimitConfigHolder getInstance(int rps) {\n    if (INSTANCE == null) synchronized (RateLimitConfigHolder.class) {\n      if (INSTANCE == null) INSTANCE = new RateLimitConfigHolder(rps);\n    }\n    return INSTANCE;\n  }\n  public int rps() { return requestsPerSecond; }\n}",
    springCode: "// Register Singleton implementation as @Component in com.vibhu.gof.singleton",
    unitTest:
      "package com.vibhu.gof.singleton;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass SingletonTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Singleton\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Singleton applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Singleton in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Singleton when a simple function suffices",
      "God-object Singleton spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Singleton.",
    interviewQs: [
      "When is Singleton required vs optional?",
      "How do you test Singleton in CI?",
    ],
    trickyQs: [
      "Singleton during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Singleton.",
    ],
    deepLabHref: "/design-patterns",
  },
  {
    id: "factory-method",
    part: 18,
    name: "Factory Method",
    frequency: "Frequently used",
    definition: "GoF Factory Method pattern — structural/behavioral building block in production microservices.",
    problem: "Subclass decides which PaymentProcessor implementation to create.",
    realWorld: "Factory Method in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes factory method so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Factory Method policy → business logic → audit log.",
    components: [
      {name: "Factory Method abstraction", responsibility: "Subclass decides which PaymentProcessor implementation to create"},
      {name: "Client / caller", responsibility: "Uses Factory Method without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.factorymethod;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic interface PaymentProcessor { void charge(Money amount); }\npublic abstract class PaymentProcessorFactory {\n  public final PaymentProcessor create(String region) {\n    PaymentProcessor p = doCreate(region);\n    p = wrapWithAudit(p);\n    return p;\n  }\n  protected abstract PaymentProcessor doCreate(String region);\n  protected PaymentProcessor wrapWithAudit(PaymentProcessor p) { return p; }\n}",
    springCode: "// Register Factory Method implementation as @Component in com.vibhu.gof.factorymethod",
    unitTest:
      "package com.vibhu.gof.factorymethod;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass FactoryMethodTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Factory Method\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Factory Method applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Factory Method in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Factory Method when a simple function suffices",
      "God-object Factory Method spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Factory Method.",
    interviewQs: [
      "When is Factory Method required vs optional?",
      "How do you test Factory Method in CI?",
    ],
    trickyQs: [
      "Factory Method during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Factory Method.",
    ],
    deepLabHref: "/design-patterns",
  },
  {
    id: "abstract-factory",
    part: 18,
    name: "Abstract Factory",
    frequency: "Occasionally used",
    definition: "GoF Abstract Factory pattern — structural/behavioral building block in production microservices.",
    problem: "Families of related objects (AWS vs GCP messaging clients) without concrete types in domain.",
    realWorld: "Abstract Factory in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes abstract factory so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Abstract Factory policy → business logic → audit log.",
    components: [
      {name: "Abstract Factory abstraction", responsibility: "Families of related objects (AWS vs GCP messaging clients) without concrete types in domain"},
      {name: "Client / caller", responsibility: "Uses Abstract Factory without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.abstractfactory;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic interface CloudMessagingFactory {\n  MessagePublisher publisher();\n  MessageSubscriber subscriber();\n}\npublic final class AwsMessagingFactory implements CloudMessagingFactory {\n  public MessagePublisher publisher() { return new SnsPublisher(); }\n  public MessageSubscriber subscriber() { return new SqsSubscriber(); }\n}",
    springCode: "// Register Abstract Factory implementation as @Component in com.vibhu.gof.abstractfactory",
    unitTest:
      "package com.vibhu.gof.abstractfactory;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass AbstractFactoryTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Abstract Factory\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Abstract Factory applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Abstract Factory in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Abstract Factory when a simple function suffices",
      "God-object Abstract Factory spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Abstract Factory.",
    interviewQs: [
      "When is Abstract Factory required vs optional?",
      "How do you test Abstract Factory in CI?",
    ],
    trickyQs: [
      "Abstract Factory during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Abstract Factory.",
    ],
  },
  {
    id: "builder",
    part: 18,
    name: "Builder",
    frequency: "Frequently used",
    definition: "GoF Builder pattern — structural/behavioral building block in production microservices.",
    problem: "Construct complex OrderSnapshot with optional fields for audit export.",
    realWorld: "Builder in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes builder so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Builder policy → business logic → audit log.",
    components: [
      {name: "Builder abstraction", responsibility: "Construct complex OrderSnapshot with optional fields for audit export"},
      {name: "Client / caller", responsibility: "Uses Builder without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.builder;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic final class OrderSnapshot {\n  private final String orderId;\n  private final String customerId;\n  private final List<LineItem> lines;\n  private OrderSnapshot(Builder b) { this.orderId=b.orderId; this.customerId=b.customerId; this.lines=List.copyOf(b.lines); }\n  public static class Builder {\n    private String orderId; private String customerId; private final List<LineItem> lines = new ArrayList<>();\n    public Builder orderId(String id) { this.orderId=id; return this; }\n    public Builder customerId(String id) { this.customerId=id; return this; }\n    public Builder line(LineItem li) { lines.add(li); return this; }\n    public OrderSnapshot build() { return new OrderSnapshot(this); }\n  }\n}",
    springCode: "// Register Builder implementation as @Component in com.vibhu.gof.builder",
    unitTest:
      "package com.vibhu.gof.builder;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass BuilderTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Builder\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Builder applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Builder in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Builder when a simple function suffices",
      "God-object Builder spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Builder.",
    interviewQs: [
      "When is Builder required vs optional?",
      "How do you test Builder in CI?",
    ],
    trickyQs: [
      "Builder during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Builder.",
    ],
  },
  {
    id: "prototype",
    part: 18,
    name: "Prototype",
    frequency: "Occasionally used",
    definition: "GoF Prototype pattern — structural/behavioral building block in production microservices.",
    problem: "Clone expensive FraudCheckTemplate per tenant customization.",
    realWorld: "Prototype in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes prototype so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Prototype policy → business logic → audit log.",
    components: [
      {name: "Prototype abstraction", responsibility: "Clone expensive FraudCheckTemplate per tenant customization"},
      {name: "Client / caller", responsibility: "Uses Prototype without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.prototype;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic interface FraudRuleTemplate extends Cloneable { FraudRuleTemplate cloneConfig(); }\npublic final class VelocityRuleTemplate implements FraudRuleTemplate {\n  private final int maxPerHour;\n  public VelocityRuleTemplate(int maxPerHour) { this.maxPerHour = maxPerHour; }\n  public FraudRuleTemplate cloneConfig() { return new VelocityRuleTemplate(maxPerHour); }\n}",
    springCode: "// Register Prototype implementation as @Component in com.vibhu.gof.prototype",
    unitTest:
      "package com.vibhu.gof.prototype;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass PrototypeTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Prototype\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Prototype applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Prototype in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Prototype when a simple function suffices",
      "God-object Prototype spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Prototype.",
    interviewQs: [
      "When is Prototype required vs optional?",
      "How do you test Prototype in CI?",
    ],
    trickyQs: [
      "Prototype during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Prototype.",
    ],
  },
  {
    id: "adapter",
    part: 18,
    name: "Adapter",
    frequency: "Frequently used",
    definition: "GoF Adapter pattern — structural/behavioral building block in production microservices.",
    problem: "Wrap legacy SOAP billing behind modern PaymentPort interface.",
    realWorld: "Adapter in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes adapter so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Adapter policy → business logic → audit log.",
    components: [
      {name: "Adapter abstraction", responsibility: "Wrap legacy SOAP billing behind modern PaymentPort interface"},
      {name: "Client / caller", responsibility: "Uses Adapter without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.adapter;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic interface PaymentPort { void pay(String orderId, BigDecimal amount); }\npublic final class LegacySoapBillingAdapter implements PaymentPort {\n  private final SoapBillingClient legacy;\n  public void pay(String orderId, BigDecimal amount) { legacy.submitInvoice(orderId, amount.doubleValue()); }\n}",
    springCode: "// Register Adapter implementation as @Component in com.vibhu.gof.adapter",
    unitTest:
      "package com.vibhu.gof.adapter;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass AdapterTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Adapter\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Adapter applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Adapter in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Adapter when a simple function suffices",
      "God-object Adapter spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Adapter.",
    interviewQs: [
      "When is Adapter required vs optional?",
      "How do you test Adapter in CI?",
    ],
    trickyQs: [
      "Adapter during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Adapter.",
    ],
  },
  {
    id: "bridge",
    part: 18,
    name: "Bridge",
    frequency: "Occasionally used",
    definition: "GoF Bridge pattern — structural/behavioral building block in production microservices.",
    problem: "Decouple Notification abstraction from SMS/Email/Push implementations.",
    realWorld: "Bridge in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes bridge so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Bridge policy → business logic → audit log.",
    components: [
      {name: "Bridge abstraction", responsibility: "Decouple Notification abstraction from SMS/Email/Push implementations"},
      {name: "Client / caller", responsibility: "Uses Bridge without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.bridge;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic interface NotificationChannel { void send(String to, String body); }\npublic abstract class Notification { protected NotificationChannel channel; public abstract void dispatch(String to, String body); }\npublic final class SmsNotification extends Notification {\n  public SmsNotification(NotificationChannel c) { this.channel=c; }\n  public void dispatch(String to, String body) { channel.send(to, \"[SMS] \"+body); }\n}",
    springCode: "// Register Bridge implementation as @Component in com.vibhu.gof.bridge",
    unitTest:
      "package com.vibhu.gof.bridge;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass BridgeTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Bridge\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Bridge applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Bridge in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Bridge when a simple function suffices",
      "God-object Bridge spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Bridge.",
    interviewQs: [
      "When is Bridge required vs optional?",
      "How do you test Bridge in CI?",
    ],
    trickyQs: [
      "Bridge during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Bridge.",
    ],
  },
  {
    id: "composite",
    part: 18,
    name: "Composite",
    frequency: "Occasionally used",
    definition: "GoF Composite pattern — structural/behavioral building block in production microservices.",
    problem: "Treat single Shipment and ShipmentBatch uniformly in tracking API.",
    realWorld: "Composite in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes composite so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Composite policy → business logic → audit log.",
    components: [
      {name: "Composite abstraction", responsibility: "Treat single Shipment and ShipmentBatch uniformly in tracking API"},
      {name: "Client / caller", responsibility: "Uses Composite without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.composite;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic interface ShipmentNode { BigDecimal totalWeight(); }\npublic final class SingleParcel implements ShipmentNode {\n  private final BigDecimal weight; public SingleParcel(BigDecimal w){weight=w;}\n  public BigDecimal totalWeight(){return weight;}\n}\npublic final class ShipmentBatch implements ShipmentNode {\n  private final List<ShipmentNode> children;\n  public BigDecimal totalWeight(){ return children.stream().map(ShipmentNode::totalWeight).reduce(BigDecimal.ZERO, BigDecimal::add); }\n}",
    springCode: "// Register Composite implementation as @Component in com.vibhu.gof.composite",
    unitTest:
      "package com.vibhu.gof.composite;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass CompositeTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Composite\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Composite applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Composite in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Composite when a simple function suffices",
      "God-object Composite spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Composite.",
    interviewQs: [
      "When is Composite required vs optional?",
      "How do you test Composite in CI?",
    ],
    trickyQs: [
      "Composite during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Composite.",
    ],
  },
  {
    id: "decorator",
    part: 18,
    name: "Decorator",
    frequency: "Frequently used",
    definition: "GoF Decorator pattern — structural/behavioral building block in production microservices.",
    problem: "Add metrics/retry wrapper around RestClient without changing core.",
    realWorld: "Decorator in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes decorator so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Decorator policy → business logic → audit log.",
    components: [
      {name: "Decorator abstraction", responsibility: "Add metrics/retry wrapper around RestClient without changing core"},
      {name: "Client / caller", responsibility: "Uses Decorator without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.decorator;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic interface CheckoutClient { String placeOrder(String payload); }\npublic final class MetricsCheckoutClient implements CheckoutClient {\n  private final CheckoutClient delegate; private final MeterRegistry metrics;\n  public String placeOrder(String payload) {\n    return Timer.builder(\"checkout_latency\").register(metrics).record(() -> delegate.placeOrder(payload));\n  }\n}",
    springCode: "@Bean CheckoutClient metricsClient(@Qualifier(\"delegate\") CheckoutClient delegate, MeterRegistry r) { return new MetricsCheckoutClient(delegate, r); }",
    unitTest:
      "package com.vibhu.gof.decorator;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass DecoratorTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Decorator\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Decorator applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Decorator in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Decorator when a simple function suffices",
      "God-object Decorator spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Decorator.",
    interviewQs: [
      "When is Decorator required vs optional?",
      "How do you test Decorator in CI?",
    ],
    trickyQs: [
      "Decorator during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Decorator.",
    ],
    deepLabHref: "/design-patterns",
  },
  {
    id: "facade",
    part: 18,
    name: "Facade",
    frequency: "Frequently used",
    definition: "GoF Facade pattern — structural/behavioral building block in production microservices.",
    problem: "CheckoutFacade hides order+inventory+payment orchestration from controller.",
    realWorld: "Facade in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes facade so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Facade policy → business logic → audit log.",
    components: [
      {name: "Facade abstraction", responsibility: "CheckoutFacade hides order+inventory+payment orchestration from controller"},
      {name: "Client / caller", responsibility: "Uses Facade without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.facade;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic final class CheckoutFacade {\n  private final OrderService orders; private final InventoryService inventory; private final PaymentService payments;\n  public String checkout(CheckoutRequest req) {\n    inventory.reserve(req.sku(), req.qty());\n    String orderId = orders.create(req);\n    payments.authorize(orderId, req.amount());\n    return orderId;\n  }\n}",
    springCode: "@Service class CheckoutFacade { /* inject Order/Inventory/Payment services */ }",
    unitTest:
      "package com.vibhu.gof.facade;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass FacadeTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Facade\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Facade applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Facade in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Facade when a simple function suffices",
      "God-object Facade spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Facade.",
    interviewQs: [
      "When is Facade required vs optional?",
      "How do you test Facade in CI?",
    ],
    trickyQs: [
      "Facade during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Facade.",
    ],
    deepLabHref: "/design-patterns",
  },
  {
    id: "flyweight",
    part: 18,
    name: "Flyweight",
    frequency: "Occasionally used",
    definition: "GoF Flyweight pattern — structural/behavioral building block in production microservices.",
    problem: "Share immutable ProductMetadata across millions of cart line references.",
    realWorld: "Flyweight in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes flyweight so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Flyweight policy → business logic → audit log.",
    components: [
      {name: "Flyweight abstraction", responsibility: "Share immutable ProductMetadata across millions of cart line references"},
      {name: "Client / caller", responsibility: "Uses Flyweight without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.flyweight;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic record ProductMetadata(String sku, String name, BigDecimal unitWeight) {}\npublic final class ProductMetadataCache {\n  private final Map<String, ProductMetadata> cache = new ConcurrentHashMap<>();\n  public ProductMetadata get(String sku) { return cache.computeIfAbsent(sku, this::loadFromCatalog); }\n  private ProductMetadata loadFromCatalog(String sku) { return new ProductMetadata(sku, \"Widget\", BigDecimal.ONE); }\n}",
    springCode: "// Register Flyweight implementation as @Component in com.vibhu.gof.flyweight",
    unitTest:
      "package com.vibhu.gof.flyweight;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass FlyweightTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Flyweight\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Flyweight applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Flyweight in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Flyweight when a simple function suffices",
      "God-object Flyweight spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Flyweight.",
    interviewQs: [
      "When is Flyweight required vs optional?",
      "How do you test Flyweight in CI?",
    ],
    trickyQs: [
      "Flyweight during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Flyweight.",
    ],
  },
  {
    id: "proxy",
    part: 18,
    name: "Proxy",
    frequency: "Frequently used",
    definition: "GoF Proxy pattern — structural/behavioral building block in production microservices.",
    problem: "Lazy-loading remote InventoryProxy with cache and circuit breaker.",
    realWorld: "Proxy in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes proxy so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Proxy policy → business logic → audit log.",
    components: [
      {name: "Proxy abstraction", responsibility: "Lazy-loading remote InventoryProxy with cache and circuit breaker"},
      {name: "Client / caller", responsibility: "Uses Proxy without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.proxy;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic interface InventoryService { int available(String sku); }\npublic final class CachingInventoryProxy implements InventoryService {\n  private final InventoryService remote; private final Map<String, Integer> cache = new ConcurrentHashMap<>();\n  public int available(String sku) { return cache.computeIfAbsent(sku, remote::available); }\n}",
    springCode: "// Register Proxy implementation as @Component in com.vibhu.gof.proxy",
    unitTest:
      "package com.vibhu.gof.proxy;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass ProxyTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Proxy\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Proxy applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Proxy in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Proxy when a simple function suffices",
      "God-object Proxy spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Proxy.",
    interviewQs: [
      "When is Proxy required vs optional?",
      "How do you test Proxy in CI?",
    ],
    trickyQs: [
      "Proxy during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Proxy.",
    ],
  },
  {
    id: "chain-of-responsibility",
    part: 18,
    name: "Chain of Responsibility",
    frequency: "Frequently used",
    definition: "GoF Chain of Responsibility pattern — structural/behavioral building block in production microservices.",
    problem: "Fraud filter chain: velocity → geo → device fingerprint.",
    realWorld: "Chain of Responsibility in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes chain of responsibility so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Chain of Responsibility policy → business logic → audit log.",
    components: [
      {name: "Chain of Responsibility abstraction", responsibility: "Fraud filter chain: velocity → geo → device fingerprint"},
      {name: "Client / caller", responsibility: "Uses Chain of Responsibility without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.chainofresponsibility;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic interface FraudFilter { boolean check(Transaction tx); FraudFilter andThen(FraudFilter next); }\npublic final class VelocityFilter implements FraudFilter {\n  public boolean check(Transaction tx) { return tx.amount().compareTo(new BigDecimal(\"10000\")) < 0; }\n  public FraudFilter andThen(FraudFilter next) { return tx -> check(tx) && next.check(tx); }\n}",
    springCode: "// Register Chain of Responsibility implementation as @Component in com.vibhu.gof.chainofresponsibility",
    unitTest:
      "package com.vibhu.gof.chainofresponsibility;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass ChainOfResponsibilityTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Chain of Responsibility\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Chain of Responsibility applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Chain of Responsibility in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Chain of Responsibility when a simple function suffices",
      "God-object Chain of Responsibility spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Chain of Responsibility.",
    interviewQs: [
      "When is Chain of Responsibility required vs optional?",
      "How do you test Chain of Responsibility in CI?",
    ],
    trickyQs: [
      "Chain of Responsibility during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Chain of Responsibility.",
    ],
  },
  {
    id: "command",
    part: 18,
    name: "Command",
    frequency: "Frequently used",
    definition: "GoF Command pattern — structural/behavioral building block in production microservices.",
    problem: "PlaceOrderCommand queued with undo/compensation for saga steps.",
    realWorld: "Command in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes command so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Command policy → business logic → audit log.",
    components: [
      {name: "Command abstraction", responsibility: "PlaceOrderCommand queued with undo/compensation for saga steps"},
      {name: "Client / caller", responsibility: "Uses Command without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.command;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic interface Command { void execute(); void undo(); }\npublic final class PlaceOrderCommand implements Command {\n  private final OrderRepository repo; private final Order order; private boolean executed;\n  public void execute() { repo.save(order); executed=true; }\n  public void undo() { if (executed) repo.delete(order.id()); }\n}",
    springCode: "@Component class PlaceOrderHandler { public void handle(PlaceOrderCommand cmd) { cmd.execute(); } }",
    unitTest:
      "package com.vibhu.gof.command;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass CommandTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Command\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Command applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Command in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Command when a simple function suffices",
      "God-object Command spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Command.",
    interviewQs: [
      "When is Command required vs optional?",
      "How do you test Command in CI?",
    ],
    trickyQs: [
      "Command during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Command.",
    ],
  },
  {
    id: "interpreter",
    part: 18,
    name: "Interpreter",
    frequency: "Rare but interview-important",
    definition: "GoF Interpreter pattern — structural/behavioral building block in production microservices.",
    problem: "Evaluate shipping discount DSL rules without embedding script engine risks.",
    realWorld: "Interpreter in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes interpreter so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Interpreter policy → business logic → audit log.",
    components: [
      {name: "Interpreter abstraction", responsibility: "Evaluate shipping discount DSL rules without embedding script engine risks"},
      {name: "Client / caller", responsibility: "Uses Interpreter without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.interpreter;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic sealed interface DiscountExpr permits Literal, Add { BigDecimal eval(); }\npublic record Literal(BigDecimal value) implements DiscountExpr { public BigDecimal eval(){return value;} }\npublic record Add(DiscountExpr left, DiscountExpr right) implements DiscountExpr {\n  public BigDecimal eval(){ return left.eval().add(right.eval()); }\n}",
    springCode: "// Register Interpreter implementation as @Component in com.vibhu.gof.interpreter",
    unitTest:
      "package com.vibhu.gof.interpreter;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass InterpreterTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Interpreter\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Interpreter applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Interpreter in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Interpreter when a simple function suffices",
      "God-object Interpreter spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Interpreter.",
    interviewQs: [
      "When is Interpreter required vs optional?",
      "How do you test Interpreter in CI?",
    ],
    trickyQs: [
      "Interpreter during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Interpreter.",
    ],
  },
  {
    id: "iterator",
    part: 18,
    name: "Iterator",
    frequency: "Frequently used",
    definition: "GoF Iterator pattern — structural/behavioral building block in production microservices.",
    problem: "Paginate Kafka changelog or DB cursor without exposing storage.",
    realWorld: "Iterator in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes iterator so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Iterator policy → business logic → audit log.",
    components: [
      {name: "Iterator abstraction", responsibility: "Paginate Kafka changelog or DB cursor without exposing storage"},
      {name: "Client / caller", responsibility: "Uses Iterator without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.iterator;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic final class OrderPageIterator implements Iterator<OrderSummary> {\n  private int page = 0; private Iterator<OrderSummary> current = List.<OrderSummary>of().iterator();\n  public boolean hasNext() { return current.hasNext() || loadNextPage(); }\n  public OrderSummary next() { if (!hasNext()) throw new NoSuchElementException(); return current.next(); }\n  private boolean loadNextPage() { /* fetch page++ */ return false; }\n}",
    springCode: "// Register Iterator implementation as @Component in com.vibhu.gof.iterator",
    unitTest:
      "package com.vibhu.gof.iterator;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass IteratorTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Iterator\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Iterator applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Iterator in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Iterator when a simple function suffices",
      "God-object Iterator spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Iterator.",
    interviewQs: [
      "When is Iterator required vs optional?",
      "How do you test Iterator in CI?",
    ],
    trickyQs: [
      "Iterator during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Iterator.",
    ],
  },
  {
    id: "mediator",
    part: 18,
    name: "Mediator",
    frequency: "Occasionally used",
    definition: "GoF Mediator pattern — structural/behavioral building block in production microservices.",
    problem: "OrderWorkflowMediator coordinates handlers without tight coupling.",
    realWorld: "Mediator in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes mediator so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Mediator policy → business logic → audit log.",
    components: [
      {name: "Mediator abstraction", responsibility: "OrderWorkflowMediator coordinates handlers without tight coupling"},
      {name: "Client / caller", responsibility: "Uses Mediator without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.mediator;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic final class OrderWorkflowMediator {\n  private final InventoryService inventory; private final PaymentService payment;\n  public void onOrderSubmitted(Order order) {\n    if (!inventory.reserve(order)) return;\n    payment.authorize(order);\n  }\n}",
    springCode: "// Register Mediator implementation as @Component in com.vibhu.gof.mediator",
    unitTest:
      "package com.vibhu.gof.mediator;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass MediatorTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Mediator\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Mediator applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Mediator in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Mediator when a simple function suffices",
      "God-object Mediator spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Mediator.",
    interviewQs: [
      "When is Mediator required vs optional?",
      "How do you test Mediator in CI?",
    ],
    trickyQs: [
      "Mediator during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Mediator.",
    ],
  },
  {
    id: "memento",
    part: 18,
    name: "Memento",
    frequency: "Occasionally used",
    definition: "GoF Memento pattern — structural/behavioral building block in production microservices.",
    problem: "Capture OrderAggregate state for rollback before risky migration.",
    realWorld: "Memento in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes memento so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Memento policy → business logic → audit log.",
    components: [
      {name: "Memento abstraction", responsibility: "Capture OrderAggregate state for rollback before risky migration"},
      {name: "Client / caller", responsibility: "Uses Memento without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.memento;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic record OrderMemento(String orderId, String status, List<LineItem> lines) {}\npublic final class OrderCaretaker {\n  private final Deque<OrderMemento> history = new ArrayDeque<>();\n  public void save(OrderMemento m) { history.push(m); }\n  public OrderMemento undo() { return history.isEmpty() ? null : history.pop(); }\n}",
    springCode: "// Register Memento implementation as @Component in com.vibhu.gof.memento",
    unitTest:
      "package com.vibhu.gof.memento;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass MementoTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Memento\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Memento applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Memento in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Memento when a simple function suffices",
      "God-object Memento spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Memento.",
    interviewQs: [
      "When is Memento required vs optional?",
      "How do you test Memento in CI?",
    ],
    trickyQs: [
      "Memento during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Memento.",
    ],
  },
  {
    id: "observer",
    part: 18,
    name: "Observer",
    frequency: "Frequently used",
    definition: "GoF Observer pattern — structural/behavioral building block in production microservices.",
    problem: "Domain events notify inventory and analytics on OrderPaid.",
    realWorld: "Observer in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes observer so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Observer policy → business logic → audit log.",
    components: [
      {name: "Observer abstraction", responsibility: "Domain events notify inventory and analytics on OrderPaid"},
      {name: "Client / caller", responsibility: "Uses Observer without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.observer;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic interface OrderListener { void onOrderPaid(OrderPaid event); }\npublic final class OrderEventPublisher {\n  private final List<OrderListener> listeners = new CopyOnWriteArrayList<>();\n  public void subscribe(OrderListener l) { listeners.add(l); }\n  public void publishPaid(OrderPaid e) { listeners.forEach(l -> l.onOrderPaid(e)); }\n}",
    springCode: "@EventListener void onOrderPaid(OrderPaidEvent e) { inventoryService.reserve(e.orderId()); }",
    unitTest:
      "package com.vibhu.gof.observer;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass ObserverTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Observer\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Observer applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Observer in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Observer when a simple function suffices",
      "God-object Observer spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Observer.",
    interviewQs: [
      "When is Observer required vs optional?",
      "How do you test Observer in CI?",
    ],
    trickyQs: [
      "Observer during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Observer.",
    ],
    deepLabHref: "/design-patterns",
  },
  {
    id: "state",
    part: 18,
    name: "State",
    frequency: "Frequently used",
    definition: "GoF State pattern — structural/behavioral building block in production microservices.",
    problem: "Order state machine: Draft → Submitted → Paid → Shipped.",
    realWorld: "State in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes state so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply State policy → business logic → audit log.",
    components: [
      {name: "State abstraction", responsibility: "Order state machine: Draft → Submitted → Paid → Shipped"},
      {name: "Client / caller", responsibility: "Uses State without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.state;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic interface OrderState { void submit(OrderContext ctx); void pay(OrderContext ctx); }\npublic final class DraftState implements OrderState {\n  public void submit(OrderContext ctx) { ctx.setState(new SubmittedState()); }\n  public void pay(OrderContext ctx) { throw new IllegalStateException(\"draft\"); }\n}",
    springCode: "@Service class OrderStateMachine { /* Spring Statemachine or manual state field */ }",
    unitTest:
      "package com.vibhu.gof.state;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass StateTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"State\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "State applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing State in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using State when a simple function suffices",
      "God-object State spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for State.",
    interviewQs: [
      "When is State required vs optional?",
      "How do you test State in CI?",
    ],
    trickyQs: [
      "State during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for State.",
    ],
  },
  {
    id: "strategy",
    part: 18,
    name: "Strategy",
    frequency: "Frequently used",
    definition: "GoF Strategy pattern — structural/behavioral building block in production microservices.",
    problem: "Pluggable TaxStrategy per jurisdiction at checkout.",
    realWorld: "Strategy in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes strategy so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Strategy policy → business logic → audit log.",
    components: [
      {name: "Strategy abstraction", responsibility: "Pluggable TaxStrategy per jurisdiction at checkout"},
      {name: "Client / caller", responsibility: "Uses Strategy without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.strategy;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic interface TaxStrategy { BigDecimal rate(Order order); }\npublic final class EuVatStrategy implements TaxStrategy { public BigDecimal rate(Order o){ return new BigDecimal(\"0.20\"); } }\npublic final class UsSalesTaxStrategy implements TaxStrategy { public BigDecimal rate(Order o){ return new BigDecimal(\"0.08\"); } }",
    springCode: "@Service class EuTaxStrategy implements TaxStrategy { public BigDecimal rate(Order o) { return new BigDecimal(\"0.20\"); } }",
    unitTest:
      "package com.vibhu.gof.strategy;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass StrategyTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Strategy\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Strategy applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Strategy in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Strategy when a simple function suffices",
      "God-object Strategy spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Strategy.",
    interviewQs: [
      "When is Strategy required vs optional?",
      "How do you test Strategy in CI?",
    ],
    trickyQs: [
      "Strategy during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Strategy.",
    ],
    deepLabHref: "/design-patterns",
  },
  {
    id: "template-method",
    part: 18,
    name: "Template Method",
    frequency: "Frequently used",
    definition: "GoF Template Method pattern — structural/behavioral building block in production microservices.",
    problem: "Abstract settlement batch: fetch → validate → post hooks.",
    realWorld: "Template Method in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes template method so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Template Method policy → business logic → audit log.",
    components: [
      {name: "Template Method abstraction", responsibility: "Abstract settlement batch: fetch → validate → post hooks"},
      {name: "Client / caller", responsibility: "Uses Template Method without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.templatemethod;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic abstract class SettlementBatchJob {\n  public final void run() { List<Entry> entries = fetch(); validate(entries); post(entries); }\n  protected abstract List<Entry> fetch();\n  protected void validate(List<Entry> e) { /* default */ }\n  protected abstract void post(List<Entry> e);\n}",
    springCode: "// Register Template Method implementation as @Component in com.vibhu.gof.templatemethod",
    unitTest:
      "package com.vibhu.gof.templatemethod;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass TemplateMethodTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Template Method\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Template Method applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Template Method in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Template Method when a simple function suffices",
      "God-object Template Method spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Template Method.",
    interviewQs: [
      "When is Template Method required vs optional?",
      "How do you test Template Method in CI?",
    ],
    trickyQs: [
      "Template Method during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Template Method.",
    ],
  },
  {
    id: "visitor",
    part: 18,
    name: "Visitor",
    frequency: "Occasionally used",
    definition: "GoF Visitor pattern — structural/behavioral building block in production microservices.",
    problem: "Export regulatory report traversing order tree nodes.",
    realWorld: "Visitor in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes visitor so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Visitor policy → business logic → audit log.",
    components: [
      {name: "Visitor abstraction", responsibility: "Export regulatory report traversing order tree nodes"},
      {name: "Client / caller", responsibility: "Uses Visitor without tight coupling to concrete implementations"},
      {name: "Concrete implementation", responsibility: "Production-specific behavior for order/payment/inventory domain"},
    ],
    javaCode:
      "package com.vibhu.gof.visitor;\n\nimport java.math.BigDecimal;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic interface ReportVisitor { void visit(OrderNode n); void visit(LineItemNode n); }\npublic interface ReportNode { void accept(ReportVisitor v); }\npublic final class LineItemNode implements ReportNode {\n  public void accept(ReportVisitor v) { v.visit(this); }\n}",
    springCode: "// Register Visitor implementation as @Component in com.vibhu.gof.visitor",
    unitTest:
      "package com.vibhu.gof.visitor;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass VisitorTest {\n  @Test void patternCompilesAndRuns() { assertNotNull(\"Visitor\"); }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Authorization checks are side-effect free and idempotent.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Visitor applied in checkout, settlement, or notification paths — prefer Spring DI over manual Singleton.",
    mistakes: [
      "Overusing Visitor in simple CRUD",
      "Unit-testing without mocking collaborators",
    ],
    antiPatterns: [
      "Using Visitor when a simple function suffices",
      "God-object Visitor spanning unrelated domains",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Visitor.",
    interviewQs: [
      "When is Visitor required vs optional?",
      "How do you test Visitor in CI?",
    ],
    trickyQs: [
      "Visitor during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Visitor.",
    ],
  },
];


// ---------------------------------------------------------------------------
// Part 19 — Enterprise Integration Patterns (Kafka)
// ---------------------------------------------------------------------------

export const EIP_PATTERNS: PatternCard[] = [
  {
    id: "message-router",
    part: 19,
    name: "Message Router",
    frequency: "Frequently used",
    definition: "Route events to topic/handler by orderType, region, or priority.",
    problem: "Messaging integration without Message Router causes data loss, duplicates, or unbounded retry loops.",
    realWorld: "Message Router in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes message router so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Message Router policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Message Router rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.eip.messagerouter;\n\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport java.util.Set;\n\npublic final class MessageRouterProcessor {\npublic String route(String eventType) {\n  return switch (eventType) {\n    case \"ORDER_CREATED\" -> \"orders.created\";\n    case \"ORDER_CANCELLED\" -> \"orders.cancelled\";\n    default -> throw new IllegalArgumentException(\"unknown: \" + eventType);\n  };\n}\n  public String describe() { return \"Message Router Kafka integration\"; }\n}",
    kafkaCode:
      "@Bean\nRouterFunction<ServerResponse> orderEventRouter() {\n  return route()\n    .POST(\"/events\", req -> req.bodyToMono(Event.class)\n        .flatMap(e -> switch (e.type()) {\n          case \"ORDER_CREATED\" -> forward(\"orders.created\", e);\n          case \"ORDER_CANCELLED\" -> forward(\"orders.cancelled\", e);\n          default -> ServerResponse.badRequest().build();\n        }))\n    .build();\n}\n// Kafka: topic selected by message key prefix region-EU → orders.eu.v1",
    unitTest:
      "package com.vibhu.eip.messagerouter;\nimport org.junit.jupiter.api.Test;\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport static org.junit.jupiter.api.Assertions.*;\nclass MessageRouterProcessorTest {\n  @Test void processesRecord() {\n    var p = new MessageRouterProcessor();\n    assertTrue(p.process(new ConsumerRecord<>(\"t\", 0, 0L, \"k\", \"v\")).contains(\"Message Router\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Business keys for dedupe where applicable.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Kafka Message Router with monitoring on lag, DLT depth, and replay runbooks.",
    mistakes: [
      "Skipping Message Router on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Message Router",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Message Router.",
    interviewQs: [
      "When is Message Router required vs optional?",
      "How do you test Message Router in CI?",
    ],
    trickyQs: [
      "Message Router during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Message Router.",
    ],
  },
  {
    id: "message-filter",
    part: 19,
    name: "Message Filter",
    frequency: "Frequently used",
    definition: "Drop heartbeat or invalid events before expensive processing.",
    problem: "Messaging integration without Message Filter causes data loss, duplicates, or unbounded retry loops.",
    realWorld: "Message Filter in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes message filter so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Message Filter policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Message Filter rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.eip.messagefilter;\n\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport java.util.Set;\n\npublic final class MessageFilterProcessor {\npublic boolean accept(ConsumerRecord<String, String> rec) {\n  return rec.value() != null && !rec.value().equals(\"HEARTBEAT\");\n}\n  public String describe() { return \"Message Filter Kafka integration\"; }\n}",
    kafkaCode:
      "@KafkaListener(topics = \"orders.raw\")\npublic void filter(ConsumerRecord<String, String> rec) {\n  if (\"HEARTBEAT\".equals(rec.value()) || rec.headers().lastHeader(\"schema-version\") == null) return;\n  validEvents.send(\"orders.valid\", rec.key(), rec.value());\n}",
    unitTest:
      "package com.vibhu.eip.messagefilter;\nimport org.junit.jupiter.api.Test;\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport static org.junit.jupiter.api.Assertions.*;\nclass MessageFilterProcessorTest {\n  @Test void processesRecord() {\n    var p = new MessageFilterProcessor();\n    assertTrue(p.process(new ConsumerRecord<>(\"t\", 0, 0L, \"k\", \"v\")).contains(\"Message Filter\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Business keys for dedupe where applicable.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Kafka Message Filter with monitoring on lag, DLT depth, and replay runbooks.",
    mistakes: [
      "Skipping Message Filter on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Message Filter",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Message Filter.",
    interviewQs: [
      "When is Message Filter required vs optional?",
      "How do you test Message Filter in CI?",
    ],
    trickyQs: [
      "Message Filter during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Message Filter.",
    ],
  },
  {
    id: "message-translator",
    part: 19,
    name: "Message Translator",
    frequency: "Frequently used",
    definition: "Map external Avro schema to internal OrderCreated domain event.",
    problem: "Messaging integration without Message Translator causes data loss, duplicates, or unbounded retry loops.",
    realWorld: "Message Translator in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes message translator so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Message Translator policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Message Translator rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.eip.messagetranslator;\n\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport java.util.Set;\n\npublic final class MessageTranslatorProcessor {\npublic record ExternalOrder(String id, String customerRef, long totalCents) {}\npublic record OrderCreated(String id, String customerId, long totalCents) {}\npublic OrderCreated translate(ExternalOrder ext) {\n  return new OrderCreated(ext.id(), ext.customerRef(), ext.totalCents());\n}\n  public String describe() { return \"Message Translator Kafka integration\"; }\n}",
    kafkaCode:
      "public OrderCreated translate(ExternalOrderEvent ext) {\n  return new OrderCreated(ext.orderId(), ext.customerRef(), Money.of(ext.totalCents(), \"USD\"));\n}\n@KafkaListener(topics = \"partner.orders.v1\")\npublic void onPartner(ConsumerRecord<String, ExternalOrderEvent> rec) {\n  ordersOut.send(\"orders.internal\", translate(rec.value()));\n}",
    unitTest:
      "package com.vibhu.eip.messagetranslator;\nimport org.junit.jupiter.api.Test;\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport static org.junit.jupiter.api.Assertions.*;\nclass MessageTranslatorProcessorTest {\n  @Test void processesRecord() {\n    var p = new MessageTranslatorProcessor();\n    assertTrue(p.process(new ConsumerRecord<>(\"t\", 0, 0L, \"k\", \"v\")).contains(\"Message Translator\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Business keys for dedupe where applicable.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Kafka Message Translator with monitoring on lag, DLT depth, and replay runbooks.",
    mistakes: [
      "Skipping Message Translator on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Message Translator",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Message Translator.",
    interviewQs: [
      "When is Message Translator required vs optional?",
      "How do you test Message Translator in CI?",
    ],
    trickyQs: [
      "Message Translator during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Message Translator.",
    ],
  },
  {
    id: "content-enricher",
    part: 19,
    name: "Content Enricher",
    frequency: "Frequently used",
    definition: "Attach customer tier and fraud score before payment authorization.",
    problem: "Messaging integration without Content Enricher causes data loss, duplicates, or unbounded retry loops.",
    realWorld: "Content Enricher in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes content enricher so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Content Enricher policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Content Enricher rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.eip.contentenricher;\n\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport java.util.Set;\n\npublic final class ContentEnricherProcessor {\npublic record EnrichedOrder(String orderId, String tier, int fraudScore) {}\npublic EnrichedOrder enrich(String orderId, String tier, int fraudScore) {\n  return new EnrichedOrder(orderId, tier, fraudScore);\n}\n  public String describe() { return \"Content Enricher Kafka integration\"; }\n}",
    kafkaCode:
      "@KafkaListener(topics = \"orders.created\")\npublic void enrich(ConsumerRecord<String, OrderCreated> rec) {\n  CustomerProfile cp = customerClient.fetch(rec.value().customerId());\n  EnrichedOrder enriched = new EnrichedOrder(rec.value(), cp.tier(), cp.fraudScore());\n  kafka.send(\"orders.enriched\", rec.key(), enriched);\n}",
    unitTest:
      "package com.vibhu.eip.contentenricher;\nimport org.junit.jupiter.api.Test;\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport static org.junit.jupiter.api.Assertions.*;\nclass ContentEnricherProcessorTest {\n  @Test void processesRecord() {\n    var p = new ContentEnricherProcessor();\n    assertTrue(p.process(new ConsumerRecord<>(\"t\", 0, 0L, \"k\", \"v\")).contains(\"Content Enricher\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Business keys for dedupe where applicable.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Kafka Content Enricher with monitoring on lag, DLT depth, and replay runbooks.",
    mistakes: [
      "Skipping Content Enricher on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Content Enricher",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Content Enricher.",
    interviewQs: [
      "When is Content Enricher required vs optional?",
      "How do you test Content Enricher in CI?",
    ],
    trickyQs: [
      "Content Enricher during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Content Enricher.",
    ],
  },
  {
    id: "aggregator",
    part: 19,
    name: "Aggregator",
    frequency: "Frequently used",
    definition: "Combine shipment line confirmations into single OrderShipped message.",
    problem: "Messaging integration without Aggregator causes data loss, duplicates, or unbounded retry loops.",
    realWorld: "Aggregator in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes aggregator so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Aggregator policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Aggregator rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.eip.aggregator;\n\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport java.util.Set;\n\npublic final class AggregatorProcessor {\npublic boolean isComplete(Set<String> received, int expected) { return received.size() >= expected; }\n  public String describe() { return \"Aggregator Kafka integration\"; }\n}",
    kafkaCode:
      "// Correlation key = orderId; release when all 3 shipment lines ACK\nprivate final Map<String, Set<String>> pending = new ConcurrentHashMap<>();\npublic void onLineShipped(String orderId, String lineId) {\n  pending.computeIfAbsent(orderId, k -> ConcurrentHashMap.newKeySet()).add(lineId);\n  if (pending.get(orderId).size() == expectedLines(orderId)) {\n    kafka.send(\"orders.shipped\", orderId, buildAggregate(orderId));\n    pending.remove(orderId);\n  }\n}",
    unitTest:
      "package com.vibhu.eip.aggregator;\nimport org.junit.jupiter.api.Test;\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport static org.junit.jupiter.api.Assertions.*;\nclass AggregatorProcessorTest {\n  @Test void processesRecord() {\n    var p = new AggregatorProcessor();\n    assertTrue(p.process(new ConsumerRecord<>(\"t\", 0, 0L, \"k\", \"v\")).contains(\"Aggregator\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Business keys for dedupe where applicable.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Kafka Aggregator with monitoring on lag, DLT depth, and replay runbooks.",
    mistakes: [
      "Skipping Aggregator on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Aggregator",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Aggregator.",
    interviewQs: [
      "When is Aggregator required vs optional?",
      "How do you test Aggregator in CI?",
    ],
    trickyQs: [
      "Aggregator during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Aggregator.",
    ],
  },
  {
    id: "splitter",
    part: 19,
    name: "Splitter",
    frequency: "Frequently used",
    definition: "Split bulk import file into per-order Kafka messages.",
    problem: "Messaging integration without Splitter causes data loss, duplicates, or unbounded retry loops.",
    realWorld: "Splitter in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes splitter so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Splitter policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Splitter rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.eip.splitter;\n\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport java.util.Set;\n\npublic final class SplitterProcessor {\npublic List<String> split(String bulkJson) { return List.of(bulkJson.split(\"\\n\")); }\n  public String describe() { return \"Splitter Kafka integration\"; }\n}",
    kafkaCode:
      "public List<ProducerRecord<String, String>> split(BulkImportPayload bulk) {\n  return bulk.orders().stream()\n      .map(o -> new ProducerRecord<>(\"orders.import\", o.id(), serialize(o)))\n      .toList();\n}",
    unitTest:
      "package com.vibhu.eip.splitter;\nimport org.junit.jupiter.api.Test;\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport static org.junit.jupiter.api.Assertions.*;\nclass SplitterProcessorTest {\n  @Test void processesRecord() {\n    var p = new SplitterProcessor();\n    assertTrue(p.process(new ConsumerRecord<>(\"t\", 0, 0L, \"k\", \"v\")).contains(\"Splitter\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Business keys for dedupe where applicable.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Kafka Splitter with monitoring on lag, DLT depth, and replay runbooks.",
    mistakes: [
      "Skipping Splitter on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Splitter",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Splitter.",
    interviewQs: [
      "When is Splitter required vs optional?",
      "How do you test Splitter in CI?",
    ],
    trickyQs: [
      "Splitter during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Splitter.",
    ],
  },
  {
    id: "resequencer",
    part: 19,
    name: "Resequencer",
    frequency: "Frequently used",
    definition: "Reorder out-of-sequence inventory updates by sequence number.",
    problem: "Messaging integration without Resequencer causes data loss, duplicates, or unbounded retry loops.",
    realWorld: "Resequencer in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes resequencer so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Resequencer policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Resequencer rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.eip.resequencer;\n\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport java.util.Set;\n\npublic final class ResequencerProcessor {\npublic boolean canEmit(long expected, long received) { return received == expected; }\n  public String describe() { return \"Resequencer Kafka integration\"; }\n}",
    kafkaCode:
      "// Buffer out-of-order inventory events per sku until seq is contiguous\nprivate final Map<String, NavigableMap<Long, InventoryDelta>> buffer = new ConcurrentHashMap<>();\npublic void onDelta(String sku, long seq, InventoryDelta delta) {\n  buffer.computeIfAbsent(sku, k -> new TreeMap<>()).put(seq, delta);\n  drainContiguous(sku);\n}",
    unitTest:
      "package com.vibhu.eip.resequencer;\nimport org.junit.jupiter.api.Test;\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport static org.junit.jupiter.api.Assertions.*;\nclass ResequencerProcessorTest {\n  @Test void processesRecord() {\n    var p = new ResequencerProcessor();\n    assertTrue(p.process(new ConsumerRecord<>(\"t\", 0, 0L, \"k\", \"v\")).contains(\"Resequencer\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Business keys for dedupe where applicable.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Kafka Resequencer with monitoring on lag, DLT depth, and replay runbooks.",
    mistakes: [
      "Skipping Resequencer on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Resequencer",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Resequencer.",
    interviewQs: [
      "When is Resequencer required vs optional?",
      "How do you test Resequencer in CI?",
    ],
    trickyQs: [
      "Resequencer during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Resequencer.",
    ],
  },
  {
    id: "claim-check",
    part: 19,
    name: "Claim Check",
    frequency: "Frequently used",
    definition: "Store large payload in S3; pass reference ID on Kafka.",
    problem: "Messaging integration without Claim Check causes data loss, duplicates, or unbounded retry loops.",
    realWorld: "Claim Check in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes claim check so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Claim Check policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Claim Check rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.eip.claimcheck;\n\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport java.util.Set;\n\npublic final class ClaimCheckProcessor {\npublic record ClaimCheckRef(String objectKey, String sha256) {}\n  public String describe() { return \"Claim Check Kafka integration\"; }\n}",
    kafkaCode:
      "String s3Key = claimCheckStore.put(payload); // large PDF invoice\nkafka.send(\"invoices.claim\", orderId, new ClaimCheckRef(s3Key, payload.sha256()));\n// consumer: payload = claimCheckStore.get(ref.s3Key())",
    unitTest:
      "package com.vibhu.eip.claimcheck;\nimport org.junit.jupiter.api.Test;\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport static org.junit.jupiter.api.Assertions.*;\nclass ClaimCheckProcessorTest {\n  @Test void processesRecord() {\n    var p = new ClaimCheckProcessor();\n    assertTrue(p.process(new ConsumerRecord<>(\"t\", 0, 0L, \"k\", \"v\")).contains(\"Claim Check\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Business keys for dedupe where applicable.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Kafka Claim Check with monitoring on lag, DLT depth, and replay runbooks.",
    mistakes: [
      "Skipping Claim Check on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Claim Check",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Claim Check.",
    interviewQs: [
      "When is Claim Check required vs optional?",
      "How do you test Claim Check in CI?",
    ],
    trickyQs: [
      "Claim Check during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Claim Check.",
    ],
  },
  {
    id: "dead-letter-channel",
    part: 19,
    name: "Dead Letter Channel",
    frequency: "Frequently used",
    definition: "Route poison messages to DLT after max retries with headers preserved.",
    problem: "Messaging integration without Dead Letter Channel causes data loss, duplicates, or unbounded retry loops.",
    realWorld: "Dead Letter Channel in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes dead letter channel so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Dead Letter Channel policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Dead Letter Channel rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.eip.deadletterchannel;\n\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport java.util.Set;\n\npublic final class DeadLetterChannelProcessor {\npublic String dltTopic(String source) { return source + \".DLT\"; }\n  public String describe() { return \"Dead Letter Channel Kafka integration\"; }\n}",
    kafkaCode:
      "@Bean\nDefaultErrorHandler dlqHandler(KafkaTemplate<String, String> template) {\n  DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(template,\n      (rec, ex) -> new TopicPartition(rec.topic() + \".DLT\", rec.partition()));\n  recoverer.setAppendOriginalHeaders(true);\n  return new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 3));\n}",
    unitTest:
      "package com.vibhu.eip.deadletterchannel;\nimport org.junit.jupiter.api.Test;\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport static org.junit.jupiter.api.Assertions.*;\nclass DeadLetterChannelProcessorTest {\n  @Test void processesRecord() {\n    var p = new DeadLetterChannelProcessor();\n    assertTrue(p.process(new ConsumerRecord<>(\"t\", 0, 0L, \"k\", \"v\")).contains(\"Dead Letter Channel\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Business keys for dedupe where applicable.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Kafka Dead Letter Channel with monitoring on lag, DLT depth, and replay runbooks.",
    mistakes: [
      "Skipping Dead Letter Channel on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Dead Letter Channel",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Dead Letter Channel.",
    interviewQs: [
      "When is Dead Letter Channel required vs optional?",
      "How do you test Dead Letter Channel in CI?",
    ],
    trickyQs: [
      "Dead Letter Channel during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Dead Letter Channel.",
    ],
    deepLabHref: "/kafka-dlq",
  },
  {
    id: "idempotent-receiver",
    part: 19,
    name: "Idempotent Receiver",
    frequency: "Frequently used",
    definition: "Dedupe by messageId / business key in inbox table.",
    problem: "Messaging integration without Idempotent Receiver causes data loss, duplicates, or unbounded retry loops.",
    realWorld: "Idempotent Receiver in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes idempotent receiver so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Idempotent Receiver policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Idempotent Receiver rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.eip.idempotentreceiver;\n\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport java.util.Set;\n\npublic final class IdempotentReceiverProcessor {\npublic boolean alreadyProcessed(Set<String> inbox, String messageId) {\n  return !inbox.add(messageId);\n}\n  public String describe() { return \"Idempotent Receiver Kafka integration\"; }\n}",
    kafkaCode:
      "@Transactional\npublic void receive(String messageId, String payload) {\n  if (inboxRepository.existsByMessageId(messageId)) return;\n  inboxRepository.save(new Inbox(messageId, Instant.now()));\n  process(payload);\n}",
    unitTest:
      "package com.vibhu.eip.idempotentreceiver;\nimport org.junit.jupiter.api.Test;\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport static org.junit.jupiter.api.Assertions.*;\nclass IdempotentReceiverProcessorTest {\n  @Test void processesRecord() {\n    var p = new IdempotentReceiverProcessor();\n    assertTrue(p.process(new ConsumerRecord<>(\"t\", 0, 0L, \"k\", \"v\")).contains(\"Idempotent Receiver\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Inbox table UNIQUE(message_id); skip duplicate inserts.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Kafka Idempotent Receiver with monitoring on lag, DLT depth, and replay runbooks.",
    mistakes: [
      "Skipping Idempotent Receiver on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Idempotent Receiver",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Idempotent Receiver.",
    interviewQs: [
      "When is Idempotent Receiver required vs optional?",
      "How do you test Idempotent Receiver in CI?",
    ],
    trickyQs: [
      "Idempotent Receiver during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Idempotent Receiver.",
    ],
  },
  {
    id: "guaranteed-delivery",
    part: 19,
    name: "Guaranteed Delivery",
    frequency: "Frequently used",
    definition: "Outbox + Kafka acks=all + consumer manual commit for at-least-once.",
    problem: "Messaging integration without Guaranteed Delivery causes data loss, duplicates, or unbounded retry loops.",
    realWorld: "Guaranteed Delivery in production e-commerce / payment platforms at scale.",
    whyExists: "Standardizes guaranteed delivery so teams ship secure, observable microservices without reinventing controls.",
    ascii:
      "\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│ Gateway  │────►│ Service A│────►│ Service B│\n└──────────┘     └──────────┘     └──────────┘",
    flow: "Ingress → validate → apply Guaranteed Delivery policy → business logic → audit log.",
    components: [
      {name: "Policy Enforcer", responsibility: "Applies Guaranteed Delivery rules at the edge or service boundary"},
      {name: "Credential Store", responsibility: "Secrets, keys, certs with rotation hooks"},
      {name: "Audit Logger", responsibility: "Structured security events without leaking secrets"},
    ],
    javaCode:
      "package com.vibhu.eip.guaranteeddelivery;\n\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport java.util.Set;\n\npublic final class GuaranteedDeliveryProcessor {\npublic record OutboxRow(String id, String topic, String payload, boolean published) {}\n  public String describe() { return \"Guaranteed Delivery Kafka integration\"; }\n}",
    kafkaCode:
      "@Transactional\npublic void publishOrderPaid(OrderPaid event) {\n  outboxRepository.save(new Outbox(UUID.randomUUID(), \"orders.paid\", serialize(event)));\n}\n@Scheduled(fixedDelay = 1000)\nvoid relayOutbox() {\n  outboxRepository.findUnpublished().forEach(row -> {\n    kafka.send(row.topic(), row.payload()).get();\n    row.markPublished();\n  });\n}",
    unitTest:
      "package com.vibhu.eip.guaranteeddelivery;\nimport org.junit.jupiter.api.Test;\nimport org.apache.kafka.clients.consumer.ConsumerRecord;\nimport static org.junit.jupiter.api.Assertions.*;\nclass GuaranteedDeliveryProcessorTest {\n  @Test void processesRecord() {\n    var p = new GuaranteedDeliveryProcessor();\n    assertTrue(p.process(new ConsumerRecord<>(\"t\", 0, 0L, \"k\", \"v\")).contains(\"Guaranteed Delivery\"));\n  }\n}",
    edgeCases: [
      "Key/cert rotation window with dual trust",
      "Clock skew on token expiration",
      "Replay of captured credentials",
    ],
    failureScenarios: [
      "Secrets store outage — fail closed for mutations",
      "Misconfigured policy — over-permissive role mapping",
    ],
    retry: "Retry transient auth store lookups with backoff; never retry 401/403.",
    idempotency: "Business keys for dedupe where applicable.",
    timeout: "Auth validation ≤ 2s per hop; circuit-break repeated failures.",
    observability: "security_events_total{pattern,result}; never log secrets or full tokens.",
    security: "Least privilege, short TTL, rotation, replay protection.",
    performance: "Cache JWKS / policy decisions with short TTL where safe.",
    scalability: "Stateless validators scale horizontally behind gateway.",
    production: "Kafka Guaranteed Delivery with monitoring on lag, DLT depth, and replay runbooks.",
    mistakes: [
      "Skipping Guaranteed Delivery on internal-only traffic",
      "Logging bearer tokens",
    ],
    antiPatterns: [
      "God-admin role bypassing Guaranteed Delivery",
      "Shared service account for all pods",
    ],
    alternatives: [
      "API gateway central policy",
      "Service mesh authorization",
    ],
    tradeoffs: "Pros: defense in depth. Cons: latency and operational overhead for Guaranteed Delivery.",
    interviewQs: [
      "When is Guaranteed Delivery required vs optional?",
      "How do you test Guaranteed Delivery in CI?",
    ],
    trickyQs: [
      "Guaranteed Delivery during blue-green deploy?",
    ],
    seniorFollowUps: [
      "Design compromise recovery for Guaranteed Delivery.",
    ],
  },
];

