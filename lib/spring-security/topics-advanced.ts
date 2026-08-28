import type {SecTopic} from './types';

export const TOPICS_ADVANCED: SecTopic[] = [
  {
    id: 'security-internals',
    title: 'Spring Security Internal Architecture',
    badge: 'Internals',
    category: 'Advanced',
    what: 'Complete request flow: DelegatingFilterProxy → FilterChainProxy → SecurityFilterChain → filters → SecurityContext → controller.',
    mermaid: `flowchart TD
  REQ[HTTP Request] --> SC[Servlet Container]
  SC --> DFP[DelegatingFilterProxy]
  DFP --> FCP[FilterChainProxy]
  FCP --> SFC[SecurityFilterChain]
  SFC --> SCH[SecurityContextHolderFilter]
  SCH --> CSRF[CsrfFilter]
  CSRF --> BEAR[BearerTokenAuthenticationFilter]
  BEAR --> UPA[UsernamePasswordAuthenticationFilter]
  UPA --> ANON[AnonymousAuthenticationFilter]
  ANON --> EX[ExceptionTranslationFilter]
  EX --> AUTHZ[AuthorizationFilter]
  AUTHZ --> CTRL[Controller]`,
    code: `// DelegatingFilterProxy — servlet filter delegating to Spring bean "springSecurityFilterChain"
// FilterChainProxy — picks SecurityFilterChain by requestMatcher
// SecurityContextHolder — ThreadLocal (Servlet) or ReactiveSecurityContextHolder (WebFlux)

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityInternalsConfig {
  @Bean
  SecurityFilterChain api(HttpSecurity http, AuthenticationManager authManager) throws Exception {
    return http
        .securityMatcher("/api/**")
        .csrf(csrf -> csrf.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/public/**").permitAll()
            .anyRequest().authenticated())
        .oauth2ResourceServer(o -> o
            .jwt(Customizer.withDefaults())
            .authenticationEntryPoint((req, res, ex) -> {
              res.setStatus(401); // unauthenticated — no/invalid token
            })
            .accessDeniedHandler((req, res, ex) -> {
              res.setStatus(403); // authenticated but forbidden
            }))
        .build();
  }
}

// Core types
// Authentication — who (Principal, credentials, GrantedAuthority[])
// SecurityContext — holds Authentication
// AuthenticationManager — orchestrates AuthenticationProvider(s)
// AuthorizationManager — decides access (replaces AccessDecisionManager)
// UserDetailsService — load user by username
// PasswordEncoder — verify password hash`,
    verify: `# 401 — no Bearer token
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/payments
# 403 — valid token, missing scope
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $READ_TOKEN" \\
  -X POST http://localhost:8081/api/payments
# Debug filter order
logging.level.org.springframework.security=DEBUG`,
    pitfalls: 'Confusing 401 (authn failed) with 403 (authz denied). SecurityContext not cleared between requests in custom filters.',
    production: 'Centralize entry point / access denied handlers; structured ProblemDetail; never log Authorization header.',
    interview30s: 'Authn = identity (401). Authz = permission (403). FilterChainProxy runs ordered filters; SecurityContextHolder stores Authentication per thread.',
    interview2m: 'Walk DelegatingFilterProxy → BearerTokenAuthenticationFilter sets JwtAuthenticationToken → AuthorizationFilter checks AuthorizationManager. Contrast Principal vs Authentication vs UserDetails.',
    traps: 'Returning 403 when token is missing — must be 401.',
    labHref: '/oauth-jwt-demo',
  },
  {
    id: 'auth-manager-provider',
    title: 'AuthenticationManager & Custom AuthenticationProvider',
    badge: 'Authn',
    category: 'Advanced',
    what: 'AuthenticationManager delegates to one or more AuthenticationProvider — database, LDAP, OTP, API key.',
    mermaid: `flowchart TD
  POST["POST /login"] --> AM[AuthenticationManager]
  AM --> AP1[DaoAuthenticationProvider]
  AM --> AP2[OtpAuthenticationProvider]
  AM --> AP3[LdapAuthenticationProvider]
  AP1 --> UDS[UserDetailsService]
  AP1 --> PE[PasswordEncoder]
  AP2 --> OTP[OtpService]
  AM --> AUTH[Authentication in SecurityContext]`,
    code: `@Configuration
public class MultiProviderAuthConfig {
  @Bean
  AuthenticationManager authenticationManager(
      UserDetailsService users, PasswordEncoder encoder, OtpService otp) {
    ProviderManager manager = new ProviderManager(
        daoProvider(users, encoder),
        new OtpAuthenticationProvider(otp));
    manager.setEraseCredentialsAfterAuthentication(true);
    return manager;
  }

  private DaoAuthenticationProvider daoProvider(UserDetailsService users, PasswordEncoder encoder) {
    DaoAuthenticationProvider p = new DaoAuthenticationProvider();
    p.setUserDetailsService(users);
    p.setPasswordEncoder(encoder);
    p.setHideUserNotFoundExceptions(true); // prevent user enumeration timing
    return p;
  }
}

// Custom OTP provider for step-up / MFA
public class OtpAuthenticationProvider implements AuthenticationProvider {
  private final OtpService otpService;

  @Override
  public Authentication authenticate(Authentication auth) {
    OtpAuthenticationToken token = (OtpAuthenticationToken) auth;
    if (!otpService.verify(token.getName(), token.getOtp())) {
      throw new BadCredentialsException("Invalid OTP");
    }
    UserDetails user = User.withUsername(token.getName())
        .password("N/A").roles("USER").build();
    return new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
  }

  @Override
  public boolean supports(Class<?> authentication) {
    return OtpAuthenticationToken.class.isAssignableFrom(authentication);
  }
}

@RestController
public class LoginController {
  @PostMapping("/api/auth/login")
  public TokenResponse login(@RequestBody LoginRequest req, AuthenticationManager am) {
    Authentication auth = am.authenticate(
        new UsernamePasswordAuthenticationToken(req.email(), req.password()));
    SecurityContextHolder.getContext().setAuthentication(auth);
    return tokenService.issue(auth);
  }
}`,
    verify: `curl -s -X POST http://localhost:8092/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"alice@lab.com","password":"password"}' | jq .accessToken`,
    pitfalls: 'User enumeration via different error messages. Not erasing credentials after auth. Provider order matters — first match wins.',
    production: 'Rate-limit login; lockout after N failures; MFA provider chained after password; audit all auth attempts.',
    interview30s: 'AuthenticationManager → ProviderManager → AuthenticationProvider(s). DaoAuthenticationProvider uses UserDetailsService + PasswordEncoder.',
    interview2m: 'Multiple providers: LDAP + DB + OTP. Custom provider implements supports() + authenticate(). Hide user-not-found to prevent enumeration.',
    traps: 'Throwing "user not found" vs "bad password" with different messages.',
    labHref: '/spring-auth-demo',
  },
  {
    id: 'custom-filters',
    title: 'Custom Security Filters & Filter Ordering',
    badge: 'Filters',
    category: 'Advanced',
    what: 'OncePerRequestFilter for API keys, tenant extraction, correlation IDs — register with addFilterBefore/After/At.',
    mermaid: `flowchart LR
  REQ[Request] --> CORR[CorrelationIdFilter]
  CORR --> TEN[TenantExtractionFilter]
  TEN --> API[ApiKeyAuthenticationFilter]
  API --> JWT[BearerTokenAuthenticationFilter]
  JWT --> AUTHZ[AuthorizationFilter]`,
    code: `@Configuration
@EnableWebSecurity
public class CustomFilterConfig {
  @Bean
  SecurityFilterChain api(HttpSecurity http,
      CorrelationIdFilter corrFilter,
      TenantContextFilter tenantFilter,
      ApiKeyAuthenticationFilter apiKeyFilter) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
        .addFilterBefore(corrFilter, SecurityContextHolderFilter.class)
        .addFilterAfter(tenantFilter, SecurityContextHolderFilter.class)
        .addFilterBefore(apiKeyFilter, BearerTokenAuthenticationFilter.class)
        .authorizeHttpRequests(a -> a
            .requestMatchers("/api/internal/**").hasAuthority("SCOPE_internal")
            .anyRequest().authenticated())
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
        .build();
  }
}

public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {
  private final ApiKeyValidator validator;

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    if (SecurityContextHolder.getContext().getAuthentication() == null) {
      String key = req.getHeader("X-API-Key");
      if (key != null && validator.isValid(key)) {
        Authentication auth = new PreAuthenticatedAuthenticationToken(
            validator.clientId(key), "N/A",
            validator.authorities(key));
        auth.setAuthenticated(true);
        SecurityContextHolder.getContext().setAuthentication(auth);
      }
    }
    chain.doFilter(req, res);
  }
}

public class TenantContextFilter extends OncePerRequestFilter {
  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    try {
      Authentication auth = SecurityContextHolder.getContext().getAuthentication();
      if (auth instanceof JwtAuthenticationToken jwt) {
        TenantContext.set(jwt.getToken().getClaimAsString("tenant_id"));
      }
      chain.doFilter(req, res);
    } finally {
      TenantContext.clear();
    }
  }
}`,
    verify: `# API key auth
curl -H "X-API-Key: sk_live_..." http://localhost:8081/api/merchants
# Wrong order symptom — tenant null in @PreAuthorize
logging.level.org.springframework.security.web.FilterChainProxy=DEBUG`,
    pitfalls: 'Registering filter as @Component servlet filter AND in chain — runs twice. Placing auth filter AFTER AuthorizationFilter — always 401/403.',
    production: 'Document filter order diagram; integration test each filter; tenant filter must run after JWT auth, before controller.',
    interview30s: 'addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class). Wrong order = security bypass or always denied.',
    interview2m: 'API key filter before BearerTokenAuthenticationFilter. Tenant extraction after SecurityContextHolderFilter. Correlation ID first for logging.',
    traps: 'Custom filter after AuthorizationFilter — authorization already evaluated with anonymous user.',
  },
  {
    id: 'jwt-production',
    title: 'JWT Production Validation (Claims, Validators, Converters)',
    badge: 'JWT',
    category: 'Advanced',
    what: 'Validate iss, aud, exp, nbf, iat, signature, alg, required claims — JwtDecoder + OAuth2TokenValidator + converters.',
    mermaid: `flowchart TB
  JWT[JWT Bearer] --> DEC[JwtDecoder Nimbus]
  DEC --> TS[JwtTimestampValidator]
  DEC --> ISS[IssuerValidator]
  DEC --> AUD[AudienceValidator]
  DEC --> SIG[Signature RS256/EC]
  DEC --> CUST[Custom claim validator]
  CUST --> CTX[SecurityContext + authorities]`,
    code: `@Bean
JwtDecoder jwtDecoder(
    @Value("\${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuer) {
  NimbusJwtDecoder decoder = JwtDecoders.fromIssuerLocation(issuer);

  OAuth2TokenValidator<Jwt> withIssuer = JwtValidators.createDefaultWithIssuer(issuer);
  OAuth2TokenValidator<Jwt> audience = new JwtClaimValidator<List<String>>(
      "aud", aud -> aud != null && aud.contains("payment-api"));
  OAuth2TokenValidator<Jwt> requiredClaims = jwt -> {
    if (jwt.getClaimAsString("tenant_id") == null) {
      return OAuth2TokenValidatorResult.failure("missing tenant_id");
    }
    return OAuth2TokenValidatorResult.success();
  };

  decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
      withIssuer,
      new JwtTimestampValidator(Duration.ofSeconds(30)), // clock skew
      audience,
      requiredClaims));
  return decoder;
}

@Bean
JwtAuthenticationConverter jwtAuthenticationConverter() {
  JwtGrantedAuthoritiesConverter scopes = new JwtGrantedAuthoritiesConverter();
  scopes.setAuthorityPrefix("SCOPE_");
  scopes.setAuthoritiesClaimName("scope");

  JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
  converter.setJwtGrantedAuthoritiesConverter(jwt -> {
    Collection<GrantedAuthority> authorities = scopes.convert(jwt);
    String role = jwt.getClaimAsString("role");
    if (role != null) {
      authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
    }
    return authorities;
  });
  return converter;
}

// application.yml — never accept "none" algorithm; Nimbus rejects by default
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.example.com
          audiences: payment-api`,
    verify: `curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/payments
# Tamper payload — signature fail → 401
# Wrong aud claim → 401`,
    pitfalls: 'No aud validation — token for service A accepted by service B. Accepting alg=none. Trusting roles claim without issuer binding.',
    production: 'Per-API audience; required claims list; short TTL; algorithm allowlist RS256/ES256 only; monitor validation failures.',
    interview30s: 'Validate signature + exp + iss + aud + required claims. JwtDecoder + DelegatingOAuth2TokenValidator. Map scope → SCOPE_ authority.',
    interview2m: 'JWT structure: header alg/kid, payload iss/sub/aud/exp/jti. Custom validator for tenant_id. JwtAuthenticationConverter merges scopes + roles.',
    traps: 'Using ID token as API access token — wrong aud and purpose.',
    labHref: '/oauth-jwt-demo',
  },
  {
    id: 'jwt-key-rotation',
    title: 'JWT Key Rotation & JWKS',
    badge: 'JWT',
    category: 'Advanced',
    what: 'Zero-downtime rotation: publish old + new keys in JWKS, sign with new kid, retire old after token TTL.',
    mermaid: `flowchart TD
  PRIV[Private Key kid=key-2026] --> AS[Authorization Server]
  AS --> JWT[JWT signed kid=key-2026]
  AS --> JWKS["/oauth2/jwks"]
  JWKS --> RS[Resource Server cache]
  RS --> VAL[Validate signature by kid]`,
    code: `// Authorization Server — Spring Authorization Server
@Bean
JWKSource<SecurityContext> jwkSource() {
  RSAKey currentKey = generateRsaKey("key-2026-03");
  RSAKey previousKey = loadRetiredKey("key-2025-12"); // overlap window
  JWKSet jwkSet = new JWKSet(List.of(currentKey, previousKey));
  return (jwkSelector, context) -> jwkSelector.select(jwkSet);
}

@Bean
JwtEncoder jwtEncoder(JWKSource<SecurityContext> jwkSource) {
  return new NimbusJwtEncoder(jwkSource);
}

// Resource server — auto-refreshes JWKS from issuer-uri (cache ~5min default)
// Emergency rotation playbook:
// 1) Generate new key pair, add to JWKS with new kid
// 2) Start signing with new kid
// 3) Wait max(access_token_ttl) — e.g. 15 minutes
// 4) Remove old public key from JWKS
// 5) If private key compromised — also revoke refresh tokens + denylist jti

@Configuration
public class JwksCacheConfig {
  @Bean
  JwtDecoder jwtDecoder(@Value("\$\{issuer-uri\}") String issuer) {
    NimbusJwtDecoder decoder = NimbusJwtDecoder.withIssuerLocation(issuer).build();
    // Force refresh on signature failure during rotation window
    return decoder;
  }
}`,
    verify: `curl -s https://auth.example.com/oauth2/jwks | jq '.keys[].kid'
# Verify token header kid matches active signing key
echo $TOKEN | cut -d. -f1 | base64 -d 2>/dev/null | jq .kid`,
    pitfalls: 'Removing old key before all tokens expire — mass 401. No kid in header — cannot pick correct key. Shared HS256 secret — cannot rotate per service.',
    production: 'Automate rotation every 90d; overlap >= max token TTL; monitor JWKS fetch errors; runbook for compromised key.',
    interview30s: 'Publish both keys in JWKS during overlap. Sign with new kid. Resource server picks key by kid header. Remove old after TTL.',
    interview2m: 'RSA vs EC keys. Cache behavior on RS. Compromised private key: emergency rotation + token revocation + force re-auth.',
    traps: 'Single symmetric secret across 20 microservices — rotation nightmare.',
    labHref: '/oauth-jwt-demo',
  },
  {
    id: 'opaque-token-introspection',
    title: 'Opaque Tokens & Token Introspection',
    badge: 'OAuth',
    category: 'Advanced',
    what: 'Opaque reference tokens validated via POST /oauth2/introspect — immediate revocation, central token state.',
    mermaid: `sequenceDiagram
  participant RS as Resource Server
  participant AS as Authorization Server
  RS->>AS: POST /oauth2/introspect token=...
  AS-->>RS: active=true scope=payment.read sub=U-1
  RS->>RS: build Authentication`,
    code: `// Resource server — opaque token introspection
spring:
  security:
    oauth2:
      resourceserver:
        opaquetoken:
          introspection-uri: https://auth.example.com/oauth2/introspect
          client-id: payment-api-introspect
          client-secret: \${INTROSPECTION_CLIENT_SECRET}

@Configuration
public class OpaqueTokenConfig {
  @Bean
  SecurityFilterChain chain(HttpSecurity http) throws Exception {
    return http
        .oauth2ResourceServer(o -> o.opaqueToken(Customizer.withDefaults()))
        .authorizeHttpRequests(a -> a.anyRequest().authenticated())
        .build();
  }

  // Custom introspector with caching
  @Bean
  OpaqueTokenIntrospector introspector(
      OAuth2IntrospectionClient client,
      @Value("\${security.introspection.cache-ttl:30s}") Duration cacheTtl) {
    NimbusOpaqueTokenIntrospector delegate = new NimbusOpaqueTokenIntrospector(
        "https://auth.example.com/oauth2/introspect", "client", "\${SECRET}");
    return token -> {
      // Caffeine cache: key=token hash, value=OAuth2AuthenticatedPrincipal
      return delegate.introspect(token);
    };
  }
}`,
    verify: `curl -H "Authorization: Bearer $OPAQUE_TOKEN" http://localhost:8081/api/payments
# Revoke token — next request → 401 (unlike JWT until exp)`,
    pitfalls: 'Introspection on every request without cache — AS becomes bottleneck. Caching too long — delayed revocation visibility.',
    production: 'Cache 15–60s with token hash as key; circuit breaker on AS; fallback deny (fail closed); use for high-security or immediate revoke needs.',
    interview30s: 'JWT = self-contained, validate locally. Opaque = reference token, introspect to AS for active + claims. Better revocation, worse latency.',
    interview2m: 'When to choose opaque: PCI, immediate logout, short-lived sessions with central denylist. Cache + TTL tradeoff. Custom OpaqueTokenIntrospector.',
    traps: 'Caching introspection result for longer than acceptable revocation SLA.',
    labHref: '/oauth-jwt-demo',
  },
  {
    id: 'token-revocation',
    title: 'Token Revocation (/revoke)',
    badge: 'OAuth',
    category: 'Advanced',
    what: 'RFC 7009 token revocation — access + refresh tokens; logout, device logout, compromised credentials.',
    mermaid: `flowchart TD
  USER[User Logout] --> REV["POST /oauth2/revoke"]
  REV --> RT[Revoke Refresh Token]
  RT --> AT[Invalidate Access Token]
  AT --> SESS[Clear Server Session]
  SESS --> DENY[Introspection active=false]`,
    code: `// Authorization Server — Spring Authorization Server enables /oauth2/revoke
@Configuration
public class RevocationConfig {
  @Bean
  OAuth2AuthorizationService authorizationService() {
    return new InMemoryOAuth2AuthorizationService(); // prod: JDBC/Redis
  }
}

@RestController
@RequestMapping("/api/auth")
public class LogoutController {
  private final OAuth2AuthorizedClientService clientService;
  private final TokenRevocationClient revocationClient;

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(
      @RegisteredOAuth2AuthorizedClient("web-client") OAuth2AuthorizedClient client,
      HttpServletRequest request) {
    String accessToken = client.getAccessToken().getTokenValue();
    String refreshToken = client.getRefreshToken().getTokenValue();
    revocationClient.revoke(accessToken, "access_token");
    revocationClient.revoke(refreshToken, "refresh_token");
    HttpSession session = request.getSession(false);
    if (session != null) session.invalidate();
    SecurityContextHolder.clearContext();
    return ResponseEntity.noContent().build();
  }
}

// Revocation client
public void revoke(String token, String hint) {
  restClient.post()
      .uri("https://auth.example.com/oauth2/revoke")
      .headers(h -> h.setBasicAuth(clientId, clientSecret))
      .body("token=" + token + "&token_type_hint=" + hint)
      .retrieve()
      .toBodilessEntity();
}`,
    verify: `curl -X POST https://auth.example.com/oauth2/revoke \\
  -u "client:secret" -d "token=$REFRESH_TOKEN&token_type_hint=refresh_token"
# Subsequent API call → 401`,
    pitfalls: 'Revoking only access token while refresh can mint new ones. Not invalidating server-side session cookie on logout.',
    production: 'Global logout revokes all device refresh tokens; audit TOKEN_REVOKED; pair with introspection or jti denylist for JWT access tokens.',
    interview30s: 'Revoke refresh token on logout. Access JWT may live until exp unless introspection/denylist. Global logout = revoke token family.',
    interview2m: 'Device logout vs global logout. Compromised credentials flow: revoke all tokens, force password reset, invalidate sessions.',
    traps: 'Logout that only clears browser cookie but leaves refresh token valid.',
  },
  {
    id: 'refresh-token-security',
    title: 'Refresh Token Rotation & Reuse Detection',
    badge: 'OAuth',
    category: 'Advanced',
    what: 'Rotate refresh token on each use; detect reuse → revoke entire token family (theft indicator).',
    mermaid: `flowchart TD
  R1[Refresh Token R1] --> AT1[Access Token A1]
  R1 --> R2[New Refresh R2 — R1 invalidated]
  R1X[R1 reused — attack] --> DET[TOKEN REUSE DETECTED]
  DET --> REV[Revoke entire token family]`,
    code: `@Service
public class RefreshTokenService {
  private final RefreshTokenRepository repo;

  @Transactional
  public TokenPair refresh(String presentedToken) {
    RefreshToken stored = repo.findByTokenHash(hash(presentedToken))
        .orElseThrow(() -> new InvalidTokenException("unknown"));

    if (stored.isRevoked()) {
      // REUSE DETECTED — attacker replayed old refresh token
      repo.revokeFamily(stored.getFamilyId());
      audit.warn("refresh_reuse family={} user={}", stored.getFamilyId(), stored.getUserId());
      throw new TokenReuseException("Refresh token reuse — family revoked");
    }

    if (stored.getExpiresAt().isBefore(Instant.now())) {
      throw new InvalidTokenException("expired");
    }

    stored.setRevoked(true);
    repo.save(stored);

    RefreshToken next = RefreshToken.newFamilyMember(stored);
    repo.save(next);

    String access = jwtService.issueAccess(stored.getUserId(), Duration.ofMinutes(15));
    return new TokenPair(access, next.getRawToken());
  }
}

// Token family — all refresh tokens from same login share familyId
// Absolute lifetime: 30 days max regardless of rotation
// Idle lifetime: 7 days without refresh → expire`,
    verify: `# Use refresh token twice with same value — second call should 401 + family revoked
curl -X POST http://localhost:8092/api/auth/refresh \\
  -H "Content-Type: application/json" -d '{"refreshToken":"..."}'`,
    pitfalls: 'Non-rotating refresh tokens — stolen token valid for 30 days. Not detecting reuse — silent theft. Storing raw refresh token in DB.',
    production: 'Hash refresh tokens at rest; rotation + reuse detection; absolute + idle TTL; bind to device fingerprint optionally.',
    interview30s: 'Each refresh invalidates previous refresh token. Reuse of old refresh = breach → revoke family. Absolute + idle lifetime.',
    interview2m: 'Contrast with non-rotating refresh. spring-jwt-demo opaque refresh pattern. How to handle concurrent refresh from two tabs.',
    traps: 'Long-lived non-rotating refresh token in localStorage.',
    labHref: '/spring-jwt-demo',
  },
  {
    id: 'oauth2-auth-server',
    title: 'OAuth 2.1 Authorization Server (Complete)',
    badge: 'OAuth',
    category: 'Advanced',
    what: 'Spring Authorization Server: authorize, token, introspect, revoke, jwks, userinfo, device flow, token exchange.',
    mermaid: `flowchart TB
  B[Browser / Client] --> AS[Authorization Server]
  AS --> AUTH["/oauth2/authorize"]
  AS --> TOK["/oauth2/token"]
  AS --> INT["/oauth2/introspect"]
  AS --> REV["/oauth2/revoke"]
  AS --> JWK["/oauth2/jwks"]
  AS --> UI["/userinfo"]
  AS --> DEV["/oauth2/device_authorization"]`,
    code: `@Configuration
@EnableWebSecurity
public class AuthorizationServerConfig {
  @Bean
  @Order(1)
  SecurityFilterChain authorizationServer(HttpSecurity http) throws Exception {
    OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);
    http.getConfigurer(OAuth2AuthorizationServerConfigurer.class)
        .oidc(Customizer.withDefaults()); // /userinfo
    return http.build();
  }

  @Bean
  RegisteredClientRepository clients() {
    RegisteredClient web = RegisteredClient.withId(UUID.randomUUID().toString())
        .clientId("web-client")
        .clientSecret("{noop}web-secret")
        .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
        .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
        .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
        .redirectUri("http://localhost:8082/login/oauth2/code/web-client")
        .scope(OidcScopes.OPENID)
        .scope("payment.read")
        .clientSettings(ClientSettings.builder().requireProofKey(true).build()) // PKCE required
        .tokenSettings(TokenSettings.builder()
            .accessTokenTimeToLive(Duration.ofMinutes(15))
            .refreshTokenTimeToLive(Duration.ofDays(7))
            .reuseRefreshTokens(false) // rotation
            .build())
        .build();

    RegisteredClient m2m = RegisteredClient.withId(UUID.randomUUID().toString())
        .clientId("payment-service")
        .clientSecret("{noop}\${PAYMENT_SERVICE_SECRET}")
        .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
        .scope("payment.write")
        .build();

    return new InMemoryRegisteredClientRepository(web, m2m);
  }
}

# Device flow — CLI / smart TV
curl -X POST http://localhost:9000/oauth2/device_authorization \\
  -u "device-client:secret" -d "scope=payment.read"
# Token exchange — RFC 8693 (delegate user token → service token)
# Dynamic Client Registration — OIDC DCR for partner onboarding`,
    verify: `curl -s http://localhost:9000/.well-known/openid-configuration | jq 'keys'
curl -s http://localhost:9000/oauth2/jwks | jq '.keys | length'`,
    pitfalls: 'Implicit flow enabled. No PKCE for public clients. Same client_secret for all M2M services.',
    production: 'Separate clients per service; PKCE mandatory; short access TTL; refresh rotation; introspect + revoke endpoints; HSM for signing keys.',
    interview30s: 'Spring Authorization Server: Authorization Code + PKCE, client_credentials, refresh, device, token exchange, introspect, revoke, JWKS, OIDC userinfo.',
    interview2m: 'Configure RegisteredClient with grant types, scopes, PKCE, token TTL. OIDC adds ID token + userinfo. Never enable implicit flow.',
    traps: 'One shared M2M client for all microservices — no blast radius isolation.',
    labHref: '/oauth-jwt-demo',
  },
  {
    id: 'oauth2-client',
    title: 'OAuth2 Client (oauth2Login & Client Credentials)',
    badge: 'OAuth',
    category: 'Advanced',
    what: 'OAuth2AuthorizedClient, ClientRegistration, service-to-service client_credentials, token propagation.',
    mermaid: `sequenceDiagram
  participant SVC as Order Service
  participant AS as Auth Server
  participant PAY as Payment Service
  SVC->>AS: client_credentials grant
  AS-->>SVC: access_token
  SVC->>PAY: Bearer access_token`,
    code: `spring:
  security:
    oauth2:
      client:
        registration:
          payment-api:
            client-id: order-service
            client-secret: \${ORDER_SERVICE_SECRET}
            authorization-grant-type: client_credentials
            scope: payment.write
        provider:
          payment-api:
            token-uri: https://auth.example.com/oauth2/token

@Configuration
public class OAuth2ClientConfig {
  @Bean
  OAuth2AuthorizedClientManager authorizedClientManager(
      ClientRegistrationRepository registrations,
      OAuth2AuthorizedClientService clientService) {
    AuthorizedClientServiceOAuth2AuthorizedClientManager manager =
        new AuthorizedClientServiceOAuth2AuthorizedClientManager(registrations, clientService);
    manager.setAuthorizedClientProvider(
        OAuth2AuthorizedClientProviderBuilder.builder().clientCredentials().build());
    return manager;
  }
}

@Service
public class PaymentGatewayClient {
  private final WebClient webClient;
  private final OAuth2AuthorizedClientManager clientManager;

  public PaymentResult capture(CaptureRequest req) {
    OAuth2AuthorizeRequest authReq = OAuth2AuthorizeRequest
        .withClientRegistrationId("payment-api")
        .principal("order-service")
        .build();
    OAuth2AuthorizedClient client = clientManager.authorize(authReq);
    String token = client.getAccessToken().getTokenValue();

    return webClient.post().uri("/api/captures")
        .headers(h -> h.setBearerAuth(token))
        .bodyValue(req)
        .retrieve()
        .bodyToMono(PaymentResult.class)
        .block();
  }
}

// User login — oauth2Login()
http.oauth2Login(o -> o.defaultSuccessUrl("/dashboard"));`,
    verify: `curl -X POST http://localhost:9000/oauth2/token \\
  -u "order-service:\${SECRET}" \\
  -d "grant_type=client_credentials&scope=payment.write" | jq .access_token`,
    pitfalls: 'Caching M2M token forever — ignore exp. Using user refresh token for service calls. client_secret in source code.',
    production: 'OAuth2AuthorizedClientManager handles token refresh; store tokens in OAuth2AuthorizedClientService (Redis in prod); least-scope per client.',
    interview30s: 'client_credentials for M2M. OAuth2AuthorizedClientManager + WebClient for outbound calls. oauth2Login for user-facing apps.',
    interview2m: 'Contrast OAuth2AuthorizedClientService vs Repository (servlet vs reactive). Token caching and expiry handling.',
    traps: 'Service uses user password grant instead of client_credentials.',
    labHref: '/oauth-jwt-demo',
  },
  {
    id: 'token-relay-propagation',
    title: 'Token Relay & Propagation',
    badge: 'OAuth',
    category: 'Advanced',
    what: 'Forward user JWT through gateway vs token exchange for service-specific tokens — avoid blind JWT forwarding.',
    mermaid: `flowchart LR
  U[User JWT] --> GW[API Gateway]
  GW --> ORD[Order Service]
  ORD --> EX[Token Exchange]
  EX --> PAY[Payment Service scoped token]`,
    code: `@Configuration
public class TokenRelayConfig {
  @Bean
  WebClient webClient(OAuth2AuthorizedClientManager manager) {
    ServletOAuth2AuthorizedClientExchangeFilterFunction oauth2 =
        new ServletOAuth2AuthorizedClientExchangeFilterFunction(manager);
    oauth2.setDefaultClientRegistrationId("payment-api");
    return WebClient.builder().apply(oauth2.oauth2Configuration()).build();
  }
}

// DANGEROUS — blind forward user JWT to every downstream service
// User JWT may have payment.write + admin — payment service trusts all scopes

// SAFER — token exchange (RFC 8693) at gateway or calling service
@Service
public class TokenExchangeClient {
  public String exchangeForPaymentScope(String userAccessToken) {
    return restClient.post()
        .uri("https://auth.example.com/oauth2/token")
        .body("grant_type=urn:ietf:params:oauth:grant-type:token-exchange" +
              "&subject_token=" + userAccessToken +
              "&subject_token_type=urn:ietf:params:oauth:token-type:access_token" +
              "&requested_token_type=urn:ietf:params:oauth:token-type:access_token" +
              "&scope=payment.capture")
        .retrieve()
        .body(TokenResponse.class)
        .accessToken();
  }
}

// Gateway pattern: validate user JWT once, attach internal service identity + corrId`,
    verify: `# Order service calls payment with exchanged token — narrower scope
curl -H "Authorization: Bearer $EXCHANGED_TOKEN" http://payment:8080/api/captures`,
    pitfalls: 'Forwarding full-scope user JWT to 10 microservices — any compromise = full access. No audience restriction per service.',
    production: 'Token exchange for downstream; or client_credentials with service identity + user context in signed internal header (mTLS protected).',
    interview30s: 'Do not blindly relay user JWT. Use token exchange for narrower scope, or M2M token + propagate user ID in signed internal claim.',
    interview2m: 'Gateway validates JWT, order service uses client_credentials or exchanged token for payment. Confused deputy if payment trusts any JWT.',
    traps: 'Microservice accepts any valid JWT from corporate IdP regardless of aud.',
  },
  {
    id: 'oauth2-threat-model',
    title: 'OAuth2 Threat Model & Mitigations',
    badge: 'Threats',
    category: 'Advanced',
    what: 'Authorization code interception, redirect URI attacks, CSRF, token leakage, confused deputy — attack → Spring protection → mitigation.',
    mermaid: `flowchart TD
  A1[Code interception] --> M1[PKCE]
  A2[Redirect URI attack] --> M2[Exact URI registration]
  A3[CSRF on authorize] --> M3[state parameter]
  A4[Token leakage] --> M4[HttpOnly cookie / BFF]
  A5[Confused deputy] --> M5[aud + token exchange]`,
    code: `// PKCE — public clients (SPA, mobile)
RegisteredClient client = RegisteredClient.withId("spa")
    .clientSettings(ClientSettings.builder().requireProofKey(true).build())
    .build();

// Redirect URI — exact match only, no wildcards in prod
.redirectUri("https://app.example.com/callback") // NOT https://app.example.com/*

// state — CSRF protection on authorization endpoint
// nonce — OIDC ID token binding

// Mix-up attack prevention — validate iss on token response
OAuth2TokenValidator<Jwt> issuer = JwtValidators.createDefaultWithIssuer(expectedIssuer);

// Audience confusion — payment-api rejects tokens with aud=order-api
OAuth2TokenValidator<Jwt> aud = new JwtClaimValidator<>("aud",
    a -> a.contains("payment-api"));

// Threat checklist (interview table):
// | Attack                  | Spring protection              | Production mitigation        |
// | Authorization code theft  | PKCE (S256)                    | Short code TTL               |
// | Redirect URI open       | strict RegisteredClient URIs   | no open redirects            |
// | state missing           | OAuth2AuthorizationRequest     | reject if state mismatch     |
// | Token in URL fragment   | Authorization Code flow        | never implicit flow          |
// | Refresh token leakage   | HttpOnly cookie via BFF        | rotation + reuse detection   |
// | Client impersonation    | client_secret / mTLS           | per-service credentials      |`,
    verify: `# PKCE required — request without code_challenge → 400
curl "http://localhost:9000/oauth2/authorize?client_id=spa&response_type=code&redirect_uri=..."
# Wrong redirect_uri → error`,
    pitfalls: 'Wildcard redirect URIs. No state validation. Accepting tokens from wrong issuer (mix-up).',
    production: 'OAuth 2.1 defaults: PKCE, no implicit, exact redirect URIs, refresh rotation, strict aud/iss validation.',
    interview30s: 'PKCE stops code interception. state stops CSRF on authorize. aud/iss stop confused deputy and mix-up. Never implicit flow.',
    interview2m: 'Walk through authorization code interception attack and PKCE fix. Redirect URI attack with open redirect. Token substitution via weak aud check.',
    traps: 'Validating JWT signature but not aud — token meant for another API works here.',
  },
  {
    id: 'oidc-deep-dive',
    title: 'OIDC Security (ID Token vs Access Token)',
    badge: 'OIDC',
    category: 'Advanced',
    what: 'ID token for identity (browser session); access token for API — never use ID token as API Bearer.',
    mermaid: `sequenceDiagram
  participant B as Browser
  participant C as Client
  participant AS as OIDC Provider
  B->>C: login
  C->>AS: authorize + nonce
  AS-->>C: code
  C->>AS: token
  AS-->>C: id_token + access_token
  C->>API: access_token only`,
    code: `// OIDC discovery
// GET /.well-known/openid-configuration → issuer, jwks_uri, userinfo_endpoint

// ID Token claims — identity only
// iss, sub, aud (client_id), exp, iat, nonce, at_hash

@Bean
SecurityFilterChain oidcLogin(HttpSecurity http) throws Exception {
  return http
      .oauth2Login(o -> o
          .userInfoEndpoint(u -> u.oidcUserService(oidcUserService()))
          .successHandler((req, res, auth) -> {
            OidcUser user = (OidcUser) auth.getPrincipal();
            // ID token validated by Spring — use for session identity
            String tenant = user.getClaim("tenant_id");
          }))
      .build();
}

// Resource server — validate ACCESS token, not ID token
spring.security.oauth2.resourceserver.jwt.issuer-uri: https://auth.example.com

// WRONG — using id_token against API
// curl -H "Authorization: Bearer $ID_TOKEN" /api/payments  ← aud mismatch, wrong token type

// Logout — RP-initiated logout
// redirect to https://auth.example.com/connect/logout?id_token_hint=...&post_logout_redirect_uri=...`,
    verify: `curl -s http://localhost:9000/.well-known/openid-configuration | jq '{issuer,userinfo_endpoint,jwks_uri}'
curl -s http://localhost:9000/userinfo -H "Authorization: Bearer $ACCESS_TOKEN" | jq`,
    pitfalls: 'Sending ID token to resource server — wrong aud (client_id not API). Ignoring nonce — ID token replay.',
    production: 'Validate nonce on ID token; access token for all API calls; OIDC logout clears AS session; rotate signing keys via JWKS.',
    interview30s: 'ID token = who user is (OIDC, for client). Access token = what they can do (OAuth2, for API). Different aud, different validation.',
    interview2m: 'at_hash binds ID token to access token. Discovery document. Why SPA must not store access token in localStorage — use BFF.',
    traps: 'Resource server configured to accept ID token — common SPA mistake.',
    labHref: '/idanywhere-demo',
  },
  {
    id: 'mfa-step-up',
    title: 'MFA & Step-Up Authentication',
    badge: 'MFA',
    category: 'Advanced',
    what: 'TOTP, WebAuthn, step-up for high-risk actions — PAYMENT_READ vs PAYMENT_APPROVE.',
    mermaid: `flowchart TD
  API[Normal API JWT] --> READ[PAYMENT_READ scope]
  HIGH[High-risk action] --> STEP[Step-up MFA]
  STEP --> TOTP[TOTP / WebAuthn verify]
  TOTP --> APPROVE[PAYMENT_APPROVE scope granted]`,
    code: `@RestController
@RequestMapping("/api/payments")
public class PaymentApprovalController {
  @GetMapping("/{id}")
  @PreAuthorize("hasAuthority('SCOPE_payment:read')")
  public Payment get(@PathVariable UUID id) { return service.get(id); }

  @PostMapping("/{id}/approve")
  @PreAuthorize("hasAuthority('SCOPE_payment:approve') and @mfaVerifier.recentlyVerified(authentication)")
  public Payment approve(@PathVariable UUID id, Authentication auth) {
    return service.approve(id, auth);
  }
}

@Component("mfaVerifier")
public class MfaVerificationChecker {
  public boolean recentlyVerified(Authentication auth) {
    if (auth instanceof JwtAuthenticationToken jwt) {
      Instant mfaAt = jwt.getToken().getClaimAsInstant("mfa_at");
      return mfaAt != null && mfaAt.isAfter(Instant.now().minus(Duration.ofMinutes(5)));
    }
    return false;
  }
}

@RestController
public class MfaController {
  @PostMapping("/api/mfa/totp/verify")
  public MfaResponse verifyTotp(@RequestBody TotpRequest req, Authentication auth) {
    if (!totpService.verify(auth.getName(), req.code())) {
      throw new BadCredentialsException("Invalid TOTP");
    }
    return tokenService.reissueWithMfaClaim(auth, Instant.now()); // new JWT with mfa_at
  }
}

// TOTP — Google Authenticator compatible (RFC 6238)
// SMS/email OTP — weaker, use only as fallback
// Recovery codes — single-use hashed storage`,
    verify: `# Approve without mfa_at claim → 403
curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/payments/123/approve
# After TOTP verify — new token with mfa_at → 200`,
    pitfalls: 'SMS OTP as only factor — SIM swap. MFA bypass via API that skips step-up check. Recovery codes stored plaintext.',
    production: 'WebAuthn preferred; TOTP backup; step-up window 5 min; audit MFA_SUCCESS/MFA_FAILURE; rate-limit OTP attempts.',
    interview30s: 'Step-up: high-risk action requires fresh MFA claim in token. TOTP/WebAuthn for production; SMS weak. Recovery codes hashed.',
    interview2m: 'Design PAYMENT_APPROVE with mfa_at claim. Custom @PreAuthorize SpEL. Reissue JWT after MFA — do not trust client header.',
    traps: 'Checking MFA in UI only — API still accepts without mfa_at.',
  },
  {
    id: 'webauthn-passkeys',
    title: 'WebAuthn & Passkeys',
    badge: 'MFA',
    category: 'Advanced',
    what: 'Phishing-resistant authentication — private key in authenticator, public key on server.',
    mermaid: `sequenceDiagram
  participant B as Browser
  participant S as Spring Server
  participant A as Authenticator
  B->>S: POST /webauthn/register/options
  S-->>B: PublicKeyCredentialCreationOptions
  B->>A: create credential
  A-->>B: attestation + public key
  B->>S: POST /webauthn/register/verify
  S->>S: store public key + credentialId`,
    code: `// spring-security-webauthn (Spring Security 6.4+)
@Configuration
@EnableWebSecurity
public class WebAuthnConfig {
  @Bean
  SecurityFilterChain filterChain(HttpSecurity http, RelyingPartyOperations rp) throws Exception {
    return http
        .webAuthn(c -> c
            .rpId("app.example.com")
            .allowedOrigins("https://app.example.com"))
        .authorizeHttpRequests(a -> a
            .requestMatchers("/webauthn/**").permitAll()
            .anyRequest().authenticated())
        .build();
  }

  @Bean
  PublicKeyCredentialUserEntityRepository userEntities() {
    return new JdbcPublicKeyCredentialUserEntityRepository(dataSource);
  }

  @Bean
  UserCredentialRepository credentials() {
    return new JdbcUserCredentialRepository(dataSource);
  }
}

// Conceptual flow:
// Registration: server challenge → authenticator creates key pair → store public key
// Authentication: server challenge → authenticator signs with private key → verify signature
// Private key NEVER leaves authenticator (TPM, YubiKey, passkey sync)
// Passkeys = WebAuthn + synced credential (Apple/Google password manager)`,
    verify: `# WebAuthn requires HTTPS + valid rpId
# Test with virtual authenticator in Chrome DevTools`,
    pitfalls: 'Wrong rpId — registration fails or security weakened. Not allowing multiple credentials per user. No fallback auth method.',
    production: 'WebAuthn primary for staff portals; passkeys for consumer; always offer recovery path; audit credential add/remove.',
    interview30s: 'WebAuthn: asymmetric crypto, private key in authenticator, public key on server. Phishing-resistant — bound to origin.',
    interview2m: 'Contrast TOTP (shared secret) vs WebAuthn (public key). Passkeys sync across devices. Spring Security webAuthn() config.',
    traps: 'Treating WebAuthn as second factor only without understanding it can replace password entirely.',
  },
  {
    id: 'object-level-authz',
    title: 'Object-Level Authorization',
    badge: 'AuthZ',
    category: 'Advanced',
    what: 'Beyond SCOPE_payment:read — verify user owns THIS payment and tenant matches.',
    mermaid: `flowchart TD
  GET["GET /payments/123"] --> AUTHN[Authenticated]
  AUTHN --> SCOPE[SCOPE_payment:read]
  SCOPE --> TENANT[payment.tenantId == user.tenantId]
  TENANT --> OWNER[payment.ownerId == user.sub OR hasRole ADMIN]`,
    code: `@Service
public class PaymentService {
  private final PaymentRepository repo;

  public Payment get(UUID id, Jwt jwt) {
    Payment p = repo.findById(id).orElseThrow(PaymentNotFoundException::new);
    String userTenant = jwt.getClaimAsString("tenant_id");
    String userId = jwt.getSubject();
    if (!p.getTenantId().equals(userTenant)) {
      throw new AccessDeniedException("Cross-tenant access denied");
    }
    if (!p.getOwnerId().equals(userId) && !hasAdminScope(jwt)) {
      throw new AccessDeniedException("Not payment owner");
    }
    return p;
  }
}

// AuthorizationManager — Spring Security 6 style
@Bean
AuthorizationManager<RequestAuthorizationContext> paymentAuthorization() {
  return (authentication, context) -> {
    UUID paymentId = extractId(context.getRequest());
    Payment p = repo.findById(paymentId).orElse(null);
    if (p == null) return new AuthorizationDecision(false);
    Jwt jwt = ((JwtAuthenticationToken) authentication.get()).getToken();
    boolean allowed = p.getTenantId().equals(jwt.getClaimAsString("tenant_id"));
    return new AuthorizationDecision(allowed);
  };
}

// Controller — defense in depth
@GetMapping("/{id}")
@PreAuthorize("@paymentSecurity.canRead(authentication, #id)")
public Payment get(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
  return paymentService.get(id, jwt); // service re-checks
}`,
    verify: `# Tenant A token accessing Tenant B payment → 403
curl -H "Authorization: Bearer $TENANT_A_TOKEN" http://localhost:8081/api/payments/tenant-b-payment-id`,
    pitfalls: 'Only URL-level authz — BOLA/IDOR vulnerability. Trusting client-provided tenant header. Check only in controller, not service.',
    production: 'Every query filters by tenant_id from JWT; service-layer checks; audit cross-tenant attempts; integration tests for IDOR.',
    interview30s: 'Object-level: can this user access THIS resource? Check tenant + owner + scope. AuthorizationManager or @PreAuthorize SpEL bean.',
    interview2m: 'BOLA is OWASP API #1. GET /payments/{id} must verify ownership. Never use user-supplied tenantId in query without matching JWT.',
    traps: 'hasAuthority("SCOPE_payment:read") without checking payment belongs to user.',
  },
  {
    id: 'method-security',
    title: 'Method Security Deep Dive',
    badge: 'AuthZ',
    category: 'Advanced',
    what: '@EnableMethodSecurity — @PreAuthorize, @PostAuthorize, @PreFilter, @PostFilter, @Secured, @RolesAllowed.',
    mermaid: `flowchart TD
  CTRL[Controller method] --> PROXY[AOP Security Proxy]
  PROXY --> PRE[@PreAuthorize — before invoke]
  PRE --> METHOD[Service method]
  METHOD --> POST[@PostAuthorize — after invoke]
  METHOD --> FILTER[@PostFilter — filter return collection]`,
    code: `@Configuration
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true, jsr250Enabled = true)
public class MethodSecurityConfig {}

@Service
public class PaymentService {
  @PreAuthorize("hasAuthority('SCOPE_payment:write')")
  @PostAuthorize("returnObject.tenantId == authentication.token.claims['tenant_id']")
  public Payment create(CreatePaymentRequest req) { ... }

  @PostFilter("filterObject.ownerId == authentication.name or hasRole('ADMIN')")
  public List<Payment> listForMerchant() { ... }

  @PreAuthorize("@paymentSecurity.canApprove(authentication, #paymentId)")
  public void approve(UUID paymentId) { ... }

  @Secured("ROLE_SETTLEMENT_OPS") // legacy — prefer @PreAuthorize
  public void runSettlement() { ... }

  @RolesAllowed({"ADMIN", "MERCHANT"}) // JSR-250
  public Report export() { ... }
}

@Component("paymentSecurity")
public class PaymentSecurityExpressions {
  public boolean canApprove(Authentication auth, UUID paymentId) {
    Payment p = repo.findById(paymentId).orElseThrow();
    return p.getStatus() == PENDING
        && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("SCOPE_payment:approve"));
  }
}`,
    verify: `# Method security enforced even if HttpSecurity permitAll — defense in depth test
# Remove @PreAuthorize temporarily — should fail security review / test`,
    pitfalls: 'Method security on public controller with no authentication — PreAuthorize always fails or bypassed. Self-invocation skips AOP proxy.',
    production: 'Enable method security on all service beans; combine URL + method layers; test with @WithMockUser and jwt(); avoid self-invocation.',
    interview30s: '@PreAuthorize before method. @PostAuthorize checks return value. @PostFilter filters collections. Custom beans via @beanName.method().',
    interview2m: 'Defense in depth: gateway scope + service @PreAuthorize + object-level check. Self-invocation trap — call via injected self or separate bean.',
    traps: 'Only HttpSecurity authorizeHttpRequests — internal package-private methods callable without authz.',
  },
  {
    id: 'multi-tenant-security',
    title: 'Multi-Tenant Security Architecture',
    badge: 'AuthZ',
    category: 'Advanced',
    what: 'Tenant isolation from JWT tenant_id — TenantContext, resolver, authorization, row-level security.',
    mermaid: `flowchart TD
  JWT["JWT tenant_id=T-A"] --> RES[TenantResolver]
  RES --> CTX[TenantContext ThreadLocal]
  CTX --> REPO[Repository WHERE tenant_id = ?]
  CTX --> AUTHZ[TenantAuthorization check]`,
    code: `public final class TenantContext {
  private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();
  public static void set(String tenantId) { CURRENT.set(tenantId); }
  public static String get() { return CURRENT.get(); }
  public static void clear() { CURRENT.remove(); }
}

@Component
public class JwtTenantResolver implements TenantResolver {
  public String resolve(Authentication auth) {
    if (auth instanceof JwtAuthenticationToken jwt) {
      return jwt.getToken().getClaimAsString("tenant_id");
    }
    throw new AccessDeniedException("Missing tenant");
  }
}

@Repository
public class PaymentRepository {
  public List<Payment> findAllForCurrentTenant() {
    return jdbc.query(
        "SELECT * FROM payments WHERE tenant_id = ?",
        mapper, TenantContext.get()); // NEVER omit tenant filter
  }
}

@Component("tenantAuth")
public class TenantAuthorization {
  public boolean sameTenant(Authentication auth, String resourceTenantId) {
    String jwtTenant = ((JwtAuthenticationToken) auth).getToken().getClaimAsString("tenant_id");
    return jwtTenant.equals(resourceTenantId);
  }
}

// Hibernate filter (optional)
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "tenantId", type = String.class))
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")`,
    verify: `# Cross-tenant IDOR test — must 403
curl -H "Authorization: Bearer $TENANT_A" http://localhost:8081/api/payments/$TENANT_B_PAYMENT_ID`,
    pitfalls: 'Optional tenant_id filter — SQL returns all tenants. Cache key without tenant prefix. Kafka consumer without tenant header validation.',
    production: 'Mandatory tenant in every query; schema-per-tenant for high isolation; cache keys prefixed; audit cross-tenant denials.',
    interview30s: 'Extract tenant_id from JWT, set TenantContext, filter every DB query. @PreAuthorize tenant check on object access.',
    interview2m: 'Schema-per-tenant vs row-level. Kafka topic per tenant or message header. Prevent Tenant A reading Tenant B payment.',
    traps: 'accepting ?tenantId query param from client instead of JWT claim.',
  },
  {
    id: 'policy-authz',
    title: 'Policy-Based Authorization (RBAC / ABAC / ReBAC / OPA)',
    badge: 'AuthZ',
    category: 'Advanced',
    what: 'Compare RBAC, ABAC, ReBAC, PBAC — optional Open Policy Agent integration for complex FinTech rules.',
    mermaid: `flowchart TB
  subgraph RBAC
    U1[User] --> R[Role] --> P[Permission]
  end
  subgraph ABAC
    U2[User + Resource + Action + Context] --> POL[Policy Engine]
  end
  subgraph OPA
    REQ[HTTP Request] --> OPA[OPA sidecar]
    OPA --> ALLOW[allow/deny]
  end`,
    code: `// RBAC — Spring Security roles
@PreAuthorize("hasRole('MERCHANT_ADMIN')")

// ABAC — attribute expressions
@PreAuthorize("hasAuthority('SCOPE_transfer:write') and #req.amount <= authentication.token.claims['transfer_limit']")

// ReBAC — relationship-based (user MANAGES merchant M → access M's payments)
@PreAuthorize("@relationshipService.canManage(authentication.name, #merchantId)")

// OPA — external policy engine (optional)
@Component
public class OpaAuthorizationManager implements AuthorizationManager<RequestAuthorizationContext> {
  private final WebClient opaClient;

  public AuthorizationDecision check(Supplier<Authentication> auth, RequestAuthorizationContext ctx) {
    OpaInput input = OpaInput.from(auth.get(), ctx.getRequest());
    Boolean allow = opaClient.post().uri("/v1/data/payment/authz/allow")
        .bodyValue(input).retrieve().bodyToMono(OpaResult.class)
        .map(r -> r.result()).block();
    return new AuthorizationDecision(Boolean.TRUE.equals(allow));
  }
}

// When to use what:
// RBAC — admin portals, coarse roles
// Scopes — OAuth API permissions
// ABAC — tenant + amount + region rules in @PreAuthorize
// ReBAC — org hierarchy, merchant relationships
// OPA — 100+ rules, audit-friendly Rego, multi-service consistency`,
    verify: `# OPA local: curl -X POST localhost:8181/v1/data/payment/authz/allow -d '{"input":{...}}'`,
    pitfalls: 'God ADMIN role instead of scoped policies. OPA without caching — latency on every request. Duplicated authz logic across services.',
    production: 'RBAC + scopes default; ABAC for tenant/amount; OPA when rules exceed SpEL maintainability; central policy version control.',
    interview30s: 'RBAC=roles. ABAC=attributes. ReBAC=relationships. OPA=external Rego policies. Combine scopes + ABAC SpEL for most FinTech.',
    interview2m: 'When OPA vs @PreAuthorize. Policy Decision Point (OPA) vs Policy Enforcement Point (Spring service). Least privilege merchant roles.',
    traps: 'hasRole("ADMIN") bypassing all object-level checks.',
  },
  {
    id: 'api-key-security',
    title: 'API Key Security',
    badge: 'Authn',
    category: 'Advanced',
    what: 'Generate, hash, store, validate, rotate, revoke API keys — never store raw keys.',
    mermaid: `flowchart LR
  GEN[Generate sk_live_...] --> HASH[SHA-256 hash]
  HASH --> DB[(api_keys table)]
  REQ[Request X-API-Key] --> VAL[Hash + compare]
  VAL --> AUTH[Authentication]`,
    code: `@Service
public class ApiKeyService {
  private static final SecureRandom RNG = new SecureRandom();

  public ApiKeyIssueResult create(String clientId, Set<String> scopes) {
    String raw = "sk_live_" + randomBase64Url(32);
    String hash = sha256(raw);
    ApiKeyEntity entity = new ApiKeyEntity(clientId, hash, scopes, Instant.now().plus(Duration.ofDays(365)));
    repo.save(entity);
    return new ApiKeyIssueResult(raw); // show ONCE to merchant — never log
  }

  public Optional<ApiKeyPrincipal> validate(String rawKey) {
    return repo.findByHash(sha256(rawKey))
        .filter(k -> !k.isRevoked())
        .filter(k -> k.getExpiresAt().isAfter(Instant.now()))
        .map(k -> new ApiKeyPrincipal(k.getClientId(), k.getScopes()));
  }

  private String sha256(String input) {
    return HexFormat.of().formatHex(
        MessageDigest.getInstance("SHA-256").digest(input.getBytes(UTF_8)));
  }
}

// API key vs JWT vs OAuth2:
// API key — simple M2M merchant integration, long-lived, narrow scope, manual rotation
// JWT — user/session context, short TTL, rich claims
// OAuth2 — delegated access, refresh, standard flows, preferred for user-facing`,
    verify: `# Create key — store returned value
curl -X POST http://localhost:8081/api/admin/api-keys -H "Authorization: Bearer $ADMIN" \\
  -d '{"clientId":"merchant-42","scopes":["payment:read"]}'
curl -H "X-API-Key: sk_live_..." http://localhost:8081/api/merchants/42/payments`,
    pitfalls: 'Storing raw API key in DB. Logging key on creation. Same key for all merchants. No expiry or rotation.',
    production: 'Hash at rest; show once on create; prefix sk_live/sk_test; audit API_KEY_CREATED/REVOKED; rate-limit per key.',
    interview30s: 'Hash API keys SHA-256 before storage. Show raw key once. Rotate on schedule. API keys for simple M2M; OAuth for user flows.',
    interview2m: 'Merchant webhook vs user OAuth. Revoke compromised key immediately. Compare HMAC webhook signatures vs API key auth.',
    traps: 'SELECT * FROM api_keys and compare plaintext.',
  },
  {
    id: 'password-hardening',
    title: 'Password Hardening (Lockout, Reset, Breach Detection)',
    badge: 'Credentials',
    category: 'Advanced',
    what: 'Extends password hashing — account lockout, credential stuffing defense, secure reset tokens, HIBP.',
    mermaid: `flowchart TD
  LOGIN[Login attempt] --> RL[Rate limiter]
  RL --> LOCK{Account locked?}
  LOCK -->|yes| DENY[423 Locked]
  LOCK -->|no| VERIFY[PasswordEncoder.matches]
  VERIFY -->|fail| INC[Increment failures]
  INC --> LOCKOUT[Lock after 5 failures]`,
    code: `@Service
public class LoginSecurityService {
  private final PasswordEncoder encoder;
  private final UserRepository users;
  private final LoginAttemptRepository attempts;

  public Authentication login(String email, String password, String clientIp) {
    rateLimiter.check(clientIp); // 10/min per IP

    User user = users.findByEmail(email)
        .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

    if (user.isLockedUntil(Instant.now())) {
      audit.warn("login_locked user={} ip={}", email, clientIp);
      throw new LockedException("Account locked");
    }

    if (!encoder.matches(password, user.getPasswordHash())) {
      attempts.recordFailure(email);
      if (attempts.failures(email) >= 5) {
        user.lockUntil(Instant.now().plus(Duration.ofMinutes(30)));
        users.save(user);
      }
      throw new BadCredentialsException("Invalid credentials");
    }

    if (breachChecker.isPwned(password)) {
      throw new PasswordCompromisedException("Password found in breach database");
    }

    attempts.reset(email);
    return authenticate(user);
  }
}

// Password reset — single-use token, hashed, 15 min TTL
public void initiateReset(String email) {
  String raw = randomToken();
  resetRepo.save(new ResetToken(sha256(raw), email, Instant.now().plus(Duration.ofMinutes(15))));
  mailer.sendResetLink(email, raw); // never log raw token
}`,
    verify: `# 6th failed login → 423 Locked
for i in {1..6}; do curl -X POST .../login -d '{"email":"x","password":"wrong"}'; done`,
    pitfalls: 'Different error for unknown email vs bad password — enumeration. Reset token in URL logged by proxy. No rate limit on reset endpoint.',
    production: 'Uniform error messages; Argon2id; HIBP k-anonymity API; CAPTCHA after 3 failures; notify user on lockout.',
    interview30s: 'Rate-limit login; lockout after N failures; hash reset tokens; breach detection. Same error message for bad user vs bad password.',
    interview2m: 'Credential stuffing defense layers. Password reset flow security. Upgrade hash on successful login when algorithm ages.',
    traps: 'Password reset link with eternal validity.',
  },
  {
    id: 'session-management',
    title: 'Session Management Security',
    badge: 'Session',
    category: 'Advanced',
    what: 'Session fixation, timeout, concurrent sessions, logout, distributed sessions — stateful vs stateless.',
    mermaid: `flowchart LR
  LOGIN[Login success] --> NEW[New session ID]
  NEW --> STORE[Spring Session Redis]
  STORE --> COOKIE[HttpOnly Secure SameSite cookie]
  LOGOUT[Logout] --> INVALID[Invalidate session]`,
    code: `spring:
  session:
    store-type: redis
    timeout: 30m
  servlet:
    session:
      cookie:
        http-only: true
        secure: true
        same-site: lax

@Configuration
public class SessionSecurityConfig {
  @Bean
  SecurityFilterChain session(HttpSecurity http) throws Exception {
    return http
        .sessionManagement(s -> s
            .sessionCreationPolicy(IF_REQUIRED)
            .sessionFixation().changeSessionId() // prevent fixation
            .maximumSessions(2) // concurrent session control
            .maxSessionsPreventsLogin(false) // kick oldest
            .expiredSessionStrategy(event -> event.getResponse().sendError(401)))
        .logout(l -> l
            .logoutUrl("/logout")
            .invalidateHttpSession(true)
            .deleteCookies("SESSION")
            .clearAuthentication(true))
        .build();
  }
}

// Stateful (session cookie) vs Stateless (JWT Bearer)
// Session: CSRF required, HttpOnly cookie, server-side revoke
// JWT: no CSRF if Authorization header, client stores token, revoke harder`,
    verify: `curl -c cookies.txt -X POST http://localhost:8080/login -d 'username=a&password=p'
curl -b cookies.txt http://localhost:8080/api/account
curl -X POST -b cookies.txt http://localhost:8080/logout`,
    pitfalls: 'Session ID in URL. No sessionFixation protection. Session cookie without Secure on HTTPS-only app. Infinite session timeout.',
    production: 'Redis Spring Session for cluster; 30m idle timeout; regenerate session ID on login; concurrent session limits for banking.',
    interview30s: 'Session fixation: change session ID on auth. HttpOnly+Secure+SameSite cookie. Spring Session Redis for distributed logout.',
    interview2m: 'When session vs JWT. Concurrent session control. Logout must invalidate server session AND clear cookie.',
    traps: 'Disabling CSRF on session-based SPA.',
    labHref: '/spring-auth-demo',
  },
  {
    id: 'bff-pattern',
    title: 'Backend-for-Frontend (BFF) Security',
    badge: 'Arch',
    category: 'Advanced',
    what: 'Browser talks to BFF via HttpOnly cookie; BFF holds OAuth tokens — tokens never in JavaScript.',
    mermaid: `flowchart LR
  B[Browser] -->|Secure HttpOnly Cookie| BFF[BFF Spring Boot]
  BFF -->|OAuth2 tokens server-side| API[Microservices]
  BFF --> AS[Authorization Server]`,
    code: `@Configuration
public class BffSecurityConfig {
  @Bean
  SecurityFilterChain bff(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf
            .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler()))
        .oauth2Login(o -> o.defaultSuccessUrl("/"))
        .oauth2Client(Customizer.withDefaults())
        .authorizeHttpRequests(a -> a
            .requestMatchers("/api/**").authenticated()
            .anyRequest().permitAll())
        .build();
  }
}

@RestController
@RequestMapping("/api")
public class BffPaymentController {
  private final OAuth2AuthorizedClientManager clientManager;
  private final WebClient paymentApi;

  @GetMapping("/payments")
  public List<Payment> list(@RegisteredOAuth2AuthorizedClient("payment-api") OAuth2AuthorizedClient client) {
    // Access token stays server-side — browser never sees it
    return paymentApi.get()
        .uri("/payments")
        .headers(h -> h.setBearerAuth(client.getAccessToken().getTokenValue()))
        .retrieve()
        .bodyToFlux(Payment.class)
        .collectList()
        .block();
  }
}`,
    verify: `# Browser DevTools — no access_token in localStorage/sessionStorage
# Session cookie HttpOnly flag set
curl -I http://localhost:8082/api/payments -b "SESSION=..."`,
    pitfalls: 'SPA with access token in localStorage — XSS steals token. BFF without CSRF — cookie sent cross-site.',
    production: 'One BFF per frontend (web/mobile); token refresh server-side; SameSite=Lax minimum; CSP on BFF.',
    interview30s: 'BFF stores OAuth tokens server-side; browser gets session cookie only. Safer than JWT in localStorage for SPAs.',
    interview2m: 'Contrast pure SPA + PKCE vs BFF pattern. CSRF on BFF required. Token relay from BFF to services.',
    traps: 'BFF that passes access token to frontend JavaScript "for convenience".',
  },
  {
    id: 'actuator-security',
    title: 'Spring Boot Actuator Security',
    badge: 'Ops',
    category: 'Advanced',
    what: 'Separate management port; restrict /actuator/env, /beans; expose health publicly only if needed.',
    mermaid: `flowchart LR
  PUB[Public :8080] --> APP[Application APIs]
  MGT[Management :9090] --> ACT["/actuator/*"]
  ACT --> IP[IP allowlist / mTLS]`,
    code: `management:
  server:
    port: 9090
    ssl:
      enabled: true
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
  endpoint:
    health:
      show-details: when_authorized
    env:
      enabled: false # never expose in prod

@Configuration
public class ActuatorSecurityConfig {
  @Bean
  @Order(Ordered.HIGHEST_PRECEDENCE)
  SecurityFilterChain actuator(HttpSecurity http) throws Exception {
    return http
        .securityMatcher(EndpointRequest.toAnyEndpoint())
        .authorizeHttpRequests(a -> a
            .requestMatchers(EndpointRequest.to("health", "info")).permitAll()
            .requestMatchers(EndpointRequest.to("prometheus")).hasIpAddress("10.0.0.0/8")
            .anyRequest().denyAll())
        .httpBasic(Customizer.withDefaults())
        .build();
  }
}`,
    verify: `curl http://localhost:9090/actuator/health
curl -s -o /dev/null -w "%{http_code}" http://localhost:9090/actuator/env
# Should be 401 or 404 — not 200 with secrets`,
    pitfalls: 'management.endpoints.web.exposure.include=* on public internet. /actuator/env leaking datasource passwords.',
    production: 'Separate port + network policy; disable env/beans/heapdump; authenticate prometheus scraper; never expose on 8080.',
    interview30s: 'Actuator on separate management port. Expose only health/info publicly. env/beans disabled. IP restrict or mTLS for metrics.',
    interview2m: 'K8s liveness uses /actuator/health on management port. What happens if env endpoint exposed — credential leak incident.',
    traps: 'include: "*" in production application.yml committed to git.',
  },
  {
    id: 'security-context-propagation',
    title: 'SecurityContext Propagation (Async / @Async / WebFlux)',
    badge: 'Internals',
    category: 'Advanced',
    what: 'SecurityContextHolder ThreadLocal lost in async — DelegatingSecurityContextExecutor, reactive context.',
    mermaid: `flowchart TD
  REQ[HTTP Thread] --> SCH[SecurityContextHolder]
  SCH --> ASYNC[@Async executor]
  ASYNC --> DELEG[DelegatingSecurityContextExecutor]
  DELEG --> WORK[Worker thread inherits context]`,
    code: `@Configuration
@EnableAsync
public class AsyncSecurityConfig implements AsyncConfigurer {
  @Override
  public Executor getAsyncExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(4);
    executor.initialize();
    return new DelegatingSecurityContextExecutor(executor);
  }
}

@Service
public class SettlementService {
  @Async
  public CompletableFuture<Void> processAsync(UUID paymentId) {
    // SecurityContext available here
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    audit.info("async settlement by={}", auth.getName());
    return CompletableFuture.completedFuture(null);
  }
}

// Manual propagation
Runnable task = new DelegatingSecurityContextRunnable(() -> { /* work */ });

// WebFlux — reactive context, not ThreadLocal
return paymentRepo.findById(id)
    .flatMap(p -> Mono.deferContextual(ctx -> {
      Jwt jwt = ctx.get(Jwt.class);
      return validateTenant(jwt, p);
    }))
    .contextWrite(ReactiveSecurityContextHolder.withAuthentication(auth));`,
    verify: `# Async method without delegating executor — auth null in logs
logging.level.com.example.SettlementService=DEBUG`,
    pitfalls: '@Async without DelegatingSecurityContextExecutor — auth null in worker. Assuming ThreadLocal works in WebFlux.',
    production: 'Wrap all custom executors; test async authz; WebFlux uses ReactiveSecurityContextHolder throughout chain.',
    interview30s: 'ThreadLocal SecurityContext lost in @Async — use DelegatingSecurityContextExecutor. WebFlux uses reactive context propagation.',
    interview2m: 'Custom thread pool for payment processing must delegate security context. CompletableFuture.supplyAsync with explicit context handoff.',
    traps: 'Background job runs with anonymous Authentication because context not propagated.',
  },
  {
    id: 'webflux-security',
    title: 'Spring WebFlux Security',
    badge: 'Reactive',
    category: 'Advanced',
    what: 'SecurityWebFilterChain, ReactiveAuthenticationManager, ReactiveSecurityContextHolder — compare with MVC.',
    mermaid: `flowchart TD
  REQ[Netty Request] --> SWF[SecurityWebFilterChain]
  SWF --> AUTH[AuthenticationWebFilter]
  AUTH --> AUTHZ[AuthorizationWebFilter]
  AUTHZ --> HANDLER[RouterFunction / Controller]`,
    code: `@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class WebFluxSecurityConfig {
  @Bean
  SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
    return http
        .csrf(ServerHttpSecurity.CsrfSpec::disable)
        .authorizeExchange(ex -> ex
            .pathMatchers("/actuator/health").permitAll()
            .pathMatchers("/api/payments/**").hasAuthority("SCOPE_payment:read")
            .anyExchange().authenticated())
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
        .build();
  }
}

@RestController
public class ReactivePaymentController {
  @GetMapping("/api/payments/{id}")
  @PreAuthorize("hasAuthority('SCOPE_payment:read')")
  public Mono<Payment> get(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
    return paymentService.findById(id, jwt.getClaimAsString("tenant_id"));
  }
}

// MVC vs WebFlux security:
// SecurityFilterChain vs SecurityWebFilterChain
// OncePerRequestFilter vs WebFilter
// SecurityContextHolder vs ReactiveSecurityContextHolder
// @EnableMethodSecurity vs @EnableReactiveMethodSecurity`,
    verify: `curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/payments/123
# WebTestClient for reactive integration tests`,
    pitfalls: 'Blocking call in reactive chain — blocks event loop. Mixing servlet filters with WebFlux app.',
    production: 'Non-blocking JwtDecoder; reactive Redis for session; test with WebTestClient + jwt(); avoid block() in filters.',
    interview30s: 'WebFlux uses SecurityWebFilterChain + reactive context. No ThreadLocal — context in Reactor Context. @EnableReactiveMethodSecurity.',
    interview2m: 'When to pick WebFlux for gateway vs MVC for business services. Security context propagation in flatMap chains.',
    traps: 'Calling jdbcTemplate.block() inside WebFilter.',
  },
  {
    id: 'microservice-security',
    title: 'Microservice Security Architecture',
    badge: 'Arch',
    category: 'Advanced',
    what: 'Identity provider → gateway → services with JWT, mTLS east-west, client_credentials, zero trust.',
    mermaid: `flowchart TB
  IDP[Identity Provider OAuth2/OIDC] --> GW[API Gateway TLS WAF RL]
  GW --> ORD[Order Service]
  GW --> PAY[Payment Service]
  GW --> USR[User Service]
  ORD <-->|mTLS| PAY
  ORD --> KF[Kafka TLS SASL ACL]`,
    code: `# Service identity stack per microservice:

# 1) North-south — user JWT validated at gateway + service (defense in depth)
spring.security.oauth2.resourceserver.jwt.issuer-uri: \${IDP_ISSUER}

# 2) East-west — mTLS between order ↔ payment
server.ssl.client-auth: need

# 3) M2M — order calls payment with client_credentials (not user JWT)
spring.security.oauth2.client.registration.payment-api.authorization-grant-type: client_credentials

# 4) Authorization — scope + tenant + object-level
@PreAuthorize("hasAuthority('SCOPE_payment:write') and @tenantAuth.sameTenant(authentication, #req.tenantId)")

# 5) Kafka — SASL_SSL + ACL per service account
spring.kafka.properties.sasl.jaas.config: ... username="order-service" ...

# 6) Workload identity — SPIFFE/SPIRE or K8s service account tokens
# Zero trust: no permitAll() because "internal network"`,
    verify: `# End-to-end smoke: user token → gateway → order → payment (M2M) → Kafka event
curl -H "Authorization: Bearer $USER_TOKEN" https://api.example.com/orders \\
  -H "Idempotency-Key: $(uuidgen)" -d '{...}'`,
    pitfalls: 'Gateway-only auth — service permitAll(). Shared service account for all pods. User JWT forwarded to all 10 services.',
    production: 'Validate JWT in every service; mTLS mesh; per-service OAuth client; network policies; workload identity.',
    interview30s: 'Gateway + service both validate JWT. mTLS east-west. client_credentials for service calls. Kafka ACLs per producer/consumer.',
    interview2m: 'Draw full FinTech stack. Token exchange at gateway. Zero trust vs DMZ. SPIFFE for service identity.',
    traps: '"Internal microservice does not need auth."',
  },
  {
    id: 'security-testing',
    title: 'Security Testing (spring-security-test)',
    badge: 'Testing',
    category: 'Advanced',
    what: '@WithMockUser, jwt(), oidcLogin(), oauth2Login(), opaqueToken() — test 401/403/CSRF/scopes.',
    mermaid: `flowchart LR
  TEST[@WebMvcTest / @SpringBootTest] --> MOCK[@WithMockUser / jwt()]
  MOCK --> MCK[MockMvc perform]
  MCK --> ASSERT[401 / 403 / 200]`,
    code: `@WebMvcTest(PaymentController.class)
@Import(SecurityConfig.class)
class PaymentControllerSecurityTest {
  @Autowired MockMvc mvc;

  @Test
  void noToken_returns401() throws Exception {
    mvc.perform(get("/api/payments/123")).andExpect(status().isUnauthorized());
  }

  @Test
  @WithMockUser(authorities = "SCOPE_payment:read")
  void withScope_returns200() throws Exception {
    mvc.perform(get("/api/payments/123")).andExpect(status().isOk());
  }

  @Test
  void jwt_withWrongAudience_returns401() throws Exception {
    mvc.perform(get("/api/payments/123")
        .with(jwt().jwt(j -> j.claim("aud", List.of("wrong-api")))))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @WithMockUser(roles = "USER")
  void missingScope_returns403() throws Exception {
    mvc.perform(post("/api/payments").contentType(APPLICATION_JSON).content("{}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void csrf_missingOnSessionApp_returns403() throws Exception {
    mvc.perform(post("/transfer").with(csrf())).andExpect(status().is3xxRedirection());
    mvc.perform(post("/transfer")).andExpect(status().isForbidden());
  }

  @Test
  void oidcLogin() throws Exception {
    mvc.perform(get("/api/me").with(oidcLogin().idToken(t -> t.claim("sub", "user-1"))))
        .andExpect(status().isOk());
  }
}

// Dependencies: spring-security-test`,
    verify: `mvn test -Dtest=PaymentControllerSecurityTest
./gradlew test --tests PaymentControllerSecurityTest`,
    pitfalls: '@WebMvcTest without importing SecurityConfig — security not applied. Only testing 200 happy path.',
    production: 'Security test matrix: 401 unauthenticated, 403 wrong scope, CSRF on session routes, JWT claim validation; CI gate on every PR.',
    interview30s: 'spring-security-test: jwt(), @WithMockUser, requestPostProcessors for MockMvc. Test 401 and 403 explicitly.',
    interview2m: 'Contrast @WithMockUser vs jwt() for OAuth resource server. Test method security with @WithMockUser lacking scope.',
    traps: 'Disabling security in tests with @AutoConfigureMockMvc(addFilters = false) permanently.',
  },
  {
    id: 'security-integration-testing',
    title: 'Security Integration Testing',
    badge: 'Testing',
    category: 'Advanced',
    what: 'Spring Boot Test + MockMvc/WebTestClient + Testcontainers + WireMock for real AS/JWKS/Redis.',
    mermaid: `flowchart LR
  TEST[@SpringBootTest] --> TC[Testcontainers Redis/Postgres]
  TEST --> WM[WireMock Authorization Server]
  WM --> JWKS[Real JWKS endpoint]
  TEST --> MCK[MockMvc + real JwtDecoder]`,
    code: `@SpringBootTest(webEnvironment = RANDOM_PORT)
@Testcontainers
class PaymentSecurityIntegrationTest {
  @Container
  static GenericContainer<?> redis = new GenericContainer<>("redis:7").withExposedPorts(6379);

  @RegisterExtension
  static WireMockExtension authServer = WireMockExtension.newInstance()
      .options(wireMockConfig().dynamicPort())
      .build();

  @DynamicPropertySource
  static void props(DynamicPropertyRegistry r) {
    r.add("spring.security.oauth2.resourceserver.jwt.issuer-uri",
        () -> "http://localhost:" + authServer.getPort());
    r.add("spring.data.redis.host", redis::getHost);
  }

  @BeforeEach
  void stubJwks() {
    authServer.stubFor(get("/.well-known/openid-configuration")
        .willReturn(okJson(openidConfig(authServer.baseUrl()))));
    authServer.stubFor(get("/oauth2/jwks")
        .willReturn(okJson(jwks(RSA_KEY))));
  }

  @Autowired WebTestClient client;

  @Test
  void validJwt_accessesProtectedEndpoint() {
    String token = signJwt(RSA_KEY, Map.of("sub", "u1", "scope", "payment:read", "aud", "payment-api"));
    client.get().uri("/api/payments")
        .headers(h -> h.setBearerAuth(token))
        .exchange()
        .expectStatus().isOk();
  }
}`,
    verify: `mvn verify -Pintegration-tests
# Testcontainers requires Docker`,
    pitfalls: 'Mocking JwtDecoder in integration tests — misses real validation bugs. Hardcoded RSA keys committed without rotation test.',
    production: 'WireMock AS in CI; Testcontainers Redis for session; contract test JWKS rotation; fail build on security test skip.',
    interview30s: 'Integration: real JwtDecoder against WireMock JWKS. Testcontainers for Redis/Postgres. Do not mock security in integration tests.',
    interview2m: 'Test full login → token → API flow. Test key rotation with two keys in JWKS. Redis session integration for logout.',
    traps: 'Only unit tests with @WithMockUser — never tests real JWT signature validation.',
  },
  {
    id: 'security-audit',
    title: 'Security Audit Events',
    badge: 'Ops',
    category: 'Advanced',
    what: 'Immutable audit trail: LOGIN_SUCCESS, TOKEN_REVOKED, MFA_FAILURE, ROLE_CHANGED, API_KEY_CREATED.',
    mermaid: `flowchart LR
  APP[Spring Application] --> AUD[SecurityAuditListener]
  AUD --> LOG[Immutable audit log]
  LOG --> SIEM[S3 / SIEM WORM storage]`,
    code: `public enum SecurityAuditEvent {
  LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT,
  TOKEN_ISSUED, TOKEN_REVOKED,
  MFA_SUCCESS, MFA_FAILURE,
  PASSWORD_CHANGED, ROLE_CHANGED, PERMISSION_CHANGED,
  API_KEY_CREATED, API_KEY_REVOKED,
  ACCESS_DENIED, CROSS_TENANT_ATTEMPT
}

@Component
public class SecurityAuditPublisher {
  private static final Logger audit = LoggerFactory.getLogger("SECURITY_AUDIT");

  public void publish(SecurityAuditEvent type, AuditContext ctx) {
    audit.info("event={} user={} tenant={} ip={} corr={} resource={} outcome={}",
        type, ctx.userId(), ctx.tenantId(), ctx.clientIp(),
        ctx.correlationId(), ctx.resource(), ctx.outcome());
    // Also append to WORM storage / Kafka audit topic
  }
}

@EventListener
public void onSuccess(AuthenticationSuccessEvent e) {
  publish(LOGIN_SUCCESS, AuditContext.from(e.getAuthentication()));
}

@EventListener
public void onFailure(AbstractAuthenticationFailureEvent e) {
  publish(LOGIN_FAILURE, AuditContext.from(e));
}

// Never log: JWT, password, API key, refresh token, Authorization header`,
    verify: `grep SECURITY_AUDIT application.log | jq -R 'split(" ")'
# Verify no Bearer tokens in audit lines`,
    pitfalls: 'Mutable audit table — attacker covers tracks. Logging PII + token in same event. No correlation ID.',
    production: 'Append-only audit store; separate stream from app logs; retention 7 years for finance; alert on ROLE_CHANGED.',
    interview30s: 'Audit: LOGIN, TOKEN_REVOKED, MFA, ROLE_CHANGED, API_KEY_CREATED. Immutable storage. Never log secrets.',
    interview2m: 'Design audit schema for PCI. Cross-tenant attempt logging. Correlation ID from gateway through audit.',
    traps: 'audit.info("login user={} token={}", user, jwt) — token in logs.',
  },
  {
    id: 'incident-response',
    title: 'Security Incident Response',
    badge: 'Ops',
    category: 'Advanced',
    what: 'Playbooks: compromised JWT, signing key, API key — identify, revoke, rotate, force re-auth.',
    mermaid: `flowchart TD
  COMP[Compromised JWT] --> ID[Identify user/jti]
  ID --> REV[Revoke token/session]
  REV --> ROT[Rotate credentials]
  ROT --> REAUTH[Force re-authentication]`,
    code: `// Incident: compromised JWT
@Service
public class TokenIncidentService {
  public void handleCompromisedToken(String jti, String userId) {
    denylist.add(jti, Duration.ofHours(24)); // until exp
    refreshTokenRepo.revokeAllForUser(userId);
    sessionRepo.invalidateAll(userId);
    audit.publish(TOKEN_REVOKED, incident(userId, jti));
    notificationService.alertUser(userId, "Suspicious activity — re-login required");
  }
}

// Incident: compromised signing private key
// 1) Stop signing with compromised kid immediately
// 2) Generate new RSA key pair, publish new JWK with new kid
// 3) Remove compromised public key from JWKS after max token TTL
// 4) Force global token refresh / re-login
// 5) Post-mortem: how was key exfiltrated (git leak, HSM misconfig)

// Incident: compromised API key
public void revokeApiKey(String keyId, String merchantId) {
  apiKeyRepo.revoke(keyId);
  audit.publish(API_KEY_REVOKED, merchant(merchantId));
  webhookService.notifyMerchant(merchantId, "API key revoked — issue new key");
}`,
    verify: `# Tabletop exercise: inject jti into denylist — verify 401 on next request
curl -H "Authorization: Bearer $COMPROMISED" http://localhost:8081/api/payments`,
    pitfalls: 'No denylist mechanism — wait for JWT exp during incident. No runbook — ad hoc panic. Not notifying affected users.',
    production: 'Runbooks in Confluence; jti denylist in Redis; annual tabletop; automated key rotation; break-glass accounts monitored.',
    interview30s: 'Compromised JWT: denylist jti, revoke refresh, invalidate sessions. Compromised key: rotate JWKS, wait TTL, force re-auth.',
    interview2m: 'Walk 3am page: merchant reports API key leak. Steps in order. Contrast JWT incident (wait for exp) vs opaque (instant revoke).',
    traps: 'Rotating signing key without overlap window — all users logged out incorrectly during planned rotation conflated with incident.',
  },
  {
    id: 'security-patterns',
    title: 'Security Design Patterns',
    badge: 'Arch',
    category: 'Advanced',
    what: 'Gateway, BFF, zero trust, defense in depth, least privilege, fail secure, token exchange, PDP/PEP.',
    mermaid: `flowchart TB
  PEP[Policy Enforcement Point — Spring Service] --> PDP[Policy Decision Point — OPA/AuthZ]
  GW[API Gateway PEP] --> SVC[Microservice PEP]
  SVC --> DATA[(Data — least privilege DB user)]`,
    code: `// Defense in Depth — payment approval
// Layer 1: WAF (SQLi, rate limit)
// Layer 2: Gateway JWT validation + scope
// Layer 3: Service mTLS + JWT re-validation
// Layer 4: @PreAuthorize scope + MFA
// Layer 5: Object-level tenant + owner check
// Layer 6: DB row-level tenant filter
// Layer 7: Audit every denial

// Fail Secure — default deny
authorizeHttpRequests(a -> a.anyRequest().authenticated()) // not permitAll fallback

// Least Privilege — DB user per service
// payment-svc DB user: SELECT,INSERT on payments — no DELETE on users

// Secure by Default — CSRF on for session apps, security headers always on
headers(h -> h.contentSecurityPolicy(c -> c.policyDirectives("default-src 'self'")))

// Credential Rotation — automated JWKS, ACM cert renewal, Secrets Manager rotation`,
    verify: `# Architecture review checklist — each layer has test proving bypass fails
mvn test -Dtest='*Security*'`,
    pitfalls: 'Single layer only (gateway auth). Fail open on IdP outage. God service account.',
    production: 'Document PEP/PDP boundaries; quarterly access review; automated rotation; pattern library for new services.',
    interview30s: 'Defense in depth: edge + service + method + object + data. Fail secure default deny. Least privilege per service account.',
    interview2m: 'Compare BFF vs API gateway vs service mesh for token handling. Policy Enforcement vs Decision Point with OPA.',
    traps: 'Defense in depth slide but service has permitAll().',
  },
  {
    id: 'common-mistakes',
    title: 'Common Spring Security Mistakes',
    badge: 'Checklist',
    category: 'Advanced',
    what: 'Anti-patterns with corrections — disable CSRF blindly, trust JWT without iss/aud, wildcard CORS, expose Actuator.',
    mermaid: `flowchart TD
  BAD[❌ Anti-pattern] --> FIX[✅ Correct implementation]
  BAD2[permitAll /api/**] --> FIX2[authenticated + scope]
  BAD3[HS256 shared secret] --> FIX3[RS256 + JWKS per AS]`,
    code: `// ❌ Disable CSRF blindly on session cookie SPA
// ✅ CookieCsrfTokenRepository + X-XSRF-TOKEN header

// ❌ Trust JWT without issuer/audience validation
// ✅ JwtValidators.createDefaultWithIssuer + aud claim check

// ❌ Accept any JWT algorithm / alg=none
// ✅ NimbusJwtDecoder — allow RS256/ES256 only

// ❌ Store secrets in Git
// ✅ \${CLIENT_SECRET} from Secrets Manager / env

// ❌ Forward user JWT to every microservice
// ✅ Token exchange or client_credentials + user context header (mTLS)

// ❌ Ignore object-level authorization
// ✅ @PreAuthorize + service tenant/owner check

// ❌ Expose Actuator publicly (include: "*")
// ✅ Separate management port, deny env/beans

// ❌ Wildcard CORS allowCredentials + "*"
// ✅ Explicit origin list

// ❌ Use same API key / service account everywhere
// ✅ Per-merchant API key, per-service OAuth client`,
    verify: `# Static review grep anti-patterns:
rg "csrf\\.disable|permitAll\\(\\)|CorsConfiguration.*\\*|include: \\*" src/`,
    pitfalls: 'Copy-paste SecurityConfig from stateless JWT tutorial into session app.',
    production: 'PR checklist runs rg for anti-patterns; security review on every auth change; dependabot for Spring Security CVEs.',
    interview30s: 'Top mistakes: no aud/iss, CSRF off on cookie app, permitAll internal APIs, JWT in localStorage, Actuator exposed.',
    interview2m: 'For each mistake explain breach scenario and fix. CSRF on cookie SPA. Object-level auth for BOLA.',
    traps: 'Interview candidate says "we disabled CSRF because JWT" but uses HttpOnly cookie session.',
  },
  {
    id: 'production-checklist',
    title: 'Production Security Checklist',
    badge: 'Checklist',
    category: 'Advanced',
    what: 'Staff-level release gate — authentication, authorization, transport, secrets, application, operations.',
    mermaid: `flowchart TB
  AUTH[Authentication ✓] --> AUTHZ[Authorization ✓]
  AUTHZ --> TRANS[Transport ✓]
  TRANS --> SEC[Secrets ✓]
  SEC --> APP[Application ✓]
  APP --> OPS[Operations ✓]`,
    code: `# Production Security Checklist — FinTech Spring Boot

## Authentication
[ ] OAuth2/OIDC with Authorization Code + PKCE
[ ] MFA for admin and high-risk payment actions
[ ] JWT validation: signature + exp + iss + aud
[ ] Refresh token rotation + reuse detection
[ ] API key hashing at rest

## Authorization
[ ] RBAC + OAuth scopes
[ ] Object-level authorization (tenant + owner)
[ ] Tenant isolation in every query
[ ] Method security @EnableMethodSecurity enabled
[ ] Least privilege service accounts

## Transport
[ ] TLS 1.2+ everywhere
[ ] mTLS service-to-service
[ ] Certificate rotation automated (ACM/cert-manager)

## Secrets
[ ] Vault / KMS / Secrets Manager
[ ] No secrets in Git (.env in .gitignore)
[ ] Signing keys in HSM or KMS

## Application
[ ] CSRF correct for session apps; disabled only for pure Bearer APIs
[ ] CORS explicit origins (no wildcard with credentials)
[ ] Security headers (CSP, HSTS, X-Content-Type-Options)
[ ] Input validation + parameterized SQL
[ ] Rate limiting on auth endpoints

## Operations
[ ] Security audit events to immutable store
[ ] Monitoring: 401/403/429 rates, auth failures, cert expiry
[ ] Incident runbooks (JWT, key, API key compromise)
[ ] spring-security-test in CI
[ ] Actuator locked down`,
    verify: `# Run checklist before prod release — sign-off in change ticket
# Automate where possible: OWASP dependency-check, Trivy, Checkov`,
    pitfalls: 'Checklist on wiki never executed. Manual prod deploy skipping security review.',
    production: 'Automate checklist items in CI/CD gates; quarterly re-certification; owner per checkbox.',
    interview30s: 'Production gate: iss/aud JWT, object-level authz, mTLS, secrets manager, audit, actuator locked, security tests in CI.',
    interview2m: 'Walk interviewer through checklist for new payment microservice. Which items block release vs warn.',
    traps: 'All boxes checked on slide but integration tests mock security away.',
  },
  {
    id: 'enterprise-architecture',
    title: 'Enterprise Security Architecture (Interview Capstone)',
    badge: 'Capstone',
    category: 'Advanced',
    what: 'Complete FinTech architecture — IdP, gateway, microservices, mTLS, Kafka, audit — Staff interview whiteboard.',
    mermaid: `flowchart TB
  IDP["Identity / IdP OAuth2 OIDC MFA"]
  IDP --> GW["API Gateway TLS WAF Rate Limit Auth"]
  GW --> ORD[Order Service]
  GW --> PAY[Payment Service]
  GW --> USR[User Service]
  ORD <-->|mTLS| PAY
  ORD --> KF["Kafka TLS mTLS ACL"]
  PAY --> KF
  ORD --> AUD[Audit SIEM]
  PAY --> AUD`,
    code: `# Enterprise FinTech Security — component responsibilities

# Identity / IdP (:9000 oauth-jwt-demo pattern)
# - Authorization Code + PKCE, client_credentials, refresh rotation
# - JWKS rotation, introspect/revoke for opaque tokens
# - MFA/WebAuthn for staff; OIDC for customer apps

# API Gateway (:8080)
# - TLS termination, WAF, rate limit, JWT validation
# - Token exchange to downstream-scoped tokens
# - Correlation ID injection

# Microservices (:8081 order, :8082 payment, :8083 user)
# - Re-validate JWT (defense in depth)
# - mTLS east-west (server.ssl.client-auth: need)
# - @PreAuthorize + object-level tenant checks
# - OAuth2 client_credentials for service calls

# Kafka
# - SASL_SSL + SCRAM or mTLS
# - ACL: order-producer WRITE payments-topic; settlement-consumer READ
# - No PII in topic keys; encrypt sensitive fields

# Data
# - RDS TLS + Secrets Manager credentials
# - Row-level tenant_id filter
# - KMS envelope encryption for PAN tokens

# Operations
# - Prometheus: security_auth_failure_total
# - Immutable audit → SIEM
# - Incident runbooks; zero trust network policies

# Security lifecycle:
# IDENTITY → AUTHENTICATION → TOKENS → AUTHORIZATION → ACCESS → AUDIT → INCIDENT RESPONSE`,
    verify: `# Whiteboard exercise: draw from memory in 5 minutes
# Validate against repo labs: oauth-jwt-demo, spring-jwt-demo, kafka-production`,
    pitfalls: 'Architecture diagram without object-level authz or mTLS — incomplete for Staff level.',
    production: 'Reference architecture doc per environment; new services must map to diagram components; annual red team.',
    interview30s: 'Capstone: IdP → Gateway → services (JWT+mTLS) → Kafka (TLS+ACL) → audit. Defense in depth every layer.',
    interview2m: '5-minute whiteboard: payment POST flow through entire stack. Where MFA, idempotency, encryption, audit attach.',
    traps: 'Single box "Spring Security" without filter chain, method security, or object-level detail.',
    labHref: '/oauth-jwt-demo',
  },
];
