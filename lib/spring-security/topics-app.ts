import type {SecTopic} from './types';

export const TOPICS_APP: SecTopic[] = [
  {
    id: 'authn-authz',
    title: 'Authentication vs Authorization',
    badge: 'Core',
    category: 'Application',
    what: 'Authn = identity (401). Authz = permission (403). Spring runs authn before authz in filter chain.',
    mermaid: `flowchart TD
  REQ[HTTP Request] --> FIL[SecurityFilterChain]
  FIL --> AUTHN[AuthenticationFilter]
  AUTHN -->|401 no Principal| DENY1[401]
  AUTHN -->|Principal set| AUTHZ[AuthorizationManager]
  AUTHZ -->|403 denied| DENY2[403]
  AUTHZ -->|allowed| CTRL[Controller]`,
    code: `@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
  @Bean
  SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/health").permitAll()
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .requestMatchers("/api/**").authenticated())
        .oauth2ResourceServer(o -> o
            .jwt(j -> j.decoder(jwtDecoder()))
            .authenticationEntryPoint(new BearerTokenAuthenticationEntryPoint())
            .accessDeniedHandler(new BearerTokenAccessDeniedHandler()))
        .build();
  }
}

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
  @GetMapping("/{id}")
  @PreAuthorize("hasAuthority('SCOPE_payments:read')")
  public Payment get(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
    return service.find(id, jwt.getClaim("tenant"));
  }
}

# spring-auth-demo :8080 form+session · :8081 Basic API
# spring-jwt-demo :8092 Bearer JWT`,
    verify: `# 401 — no token
curl -s -o /dev/null -w "%{http_code}" http://localhost:8092/api/users/me
# 403 — USER hits admin
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer <user-jwt>" \\
  http://localhost:8092/api/admin/users`,
    pitfalls: 'Returning 403 for missing token (should be 401). Checking roles in controller instead of central config.',
    production: 'Consistent ProblemDetail JSON; audit authz denials; never trust X-User-Id header without signature.',
    interview30s: 'Authentication proves identity → 401 if missing. Authorization checks roles/scopes → 403 if denied. Filter chain order matters.',
    interview2m: 'Walk login → JWT → GET /api/users/me. Contrast session cookie auth (spring-auth-demo) vs Bearer (8092) vs OAuth (9000/8081).',
    traps: 'Using permitAll() on /api/** "temporarily" in prod.',
    labHref: '/spring-auth-demo',
  },
  {
    id: 'jwt',
    title: 'JWT Resource Server',
    badge: 'Token',
    category: 'Application',
    what: 'Stateless Bearer JWT — verify signature, exp, iss, aud; map scopes to authorities.',
    mermaid: `sequenceDiagram
  participant C as Client
  participant API as Resource Server :8092
  C->>API: Authorization: Bearer JWT
  API->>API: verify HS256/RS256 + exp
  API->>API: SecurityContext + scopes
  API-->>C: 200 / 401 / 403`,
    code: `# spring-jwt-auth-demo :8092
@Configuration
@EnableMethodSecurity
public class SecurityConfig {
  @Bean
  SecurityFilterChain chain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) {
    return http.csrf(csrf -> csrf.disable())
        .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
        .authorizeHttpRequests(a -> a
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .requestMatchers("/api/**").authenticated())
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
  }
}

# OAuth resource server variant (oauth-jwt-demo :8081)
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:9000

@Bean
JwtDecoder jwtDecoder() {
  NimbusJwtDecoder decoder = JwtDecoders.fromIssuerLocation(issuer);
  OAuth2TokenValidator<Jwt> aud = new JwtClaimValidator<>("aud", aud -> aud.contains("payment-api"));
  decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
      new JwtTimestampValidator(Duration.ofSeconds(30)), aud));
  return decoder;
}`,
    verify: `TOKEN=$(curl -s -X POST http://localhost:8092/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"alice@lab.com","password":"password"}' | jq -r .accessToken)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8092/api/users/me`,
    pitfalls: 'HS256 shared secret across 20 microservices. No aud/iss validation. Storing JWT in localStorage with XSS risk.',
    production: 'RS256 + JWKS; 15m access + rotated refresh; short clock skew; denylist on logout/compromise.',
    interview30s: 'JWT is signed claims — readable. Verify sig + exp + iss + aud. CSRF off for pure Bearer; on if cookie-stored.',
    interview2m: 'First-party JWT (8092 app is IdP) vs OAuth JWKS (9000 issues, 8081 validates). Refresh rotation and denylist pattern.',
    traps: '"JWT is encrypted" — usually false; only signed.',
    labHref: '/spring-jwt-demo',
  },
  {
    id: 'oauth-oidc',
    title: 'OAuth2 + OIDC + PKCE',
    badge: 'OAuth',
    category: 'Application',
    what: 'Authorization Code + PKCE for SPAs; AS :9000 issues tokens; RS validates JWT via issuer-uri.',
    mermaid: `sequenceDiagram
  participant B as Browser
  participant C as Client :8082
  participant AS as Auth Server :9000
  participant RS as Resource Server :8081
  B->>C: click Login
  C->>AS: /oauth2/authorize + PKCE challenge
  AS->>B: login + consent
  AS->>C: redirect ?code=
  C->>AS: POST /oauth2/token + code_verifier
  AS-->>C: access_token + id_token
  C->>RS: Bearer access_token`,
    code: `# authorization-server :9000 application.yml
server:
  port: 9000
app:
  issuer: http://localhost:9000

# resource-server :8081
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:9000

# client-app :8082 — OAuth2 login
spring:
  security:
    oauth2:
      client:
        registration:
          web-client:
            client-id: web-client
            client-secret: web-secret
            scope: openid,profile,payment.read
            authorization-grant-type: authorization_code
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
        provider:
          web-client:
            issuer-uri: http://localhost:9000

# Machine client_credentials
curl -s -X POST http://localhost:9000/oauth2/token \\
  -u "payment-service:payment-secret" \\
  -d "grant_type=client_credentials&scope=payment.write" | jq`,
    verify: `curl -s http://localhost:9000/.well-known/openid-configuration | jq .issuer
curl -s http://localhost:9000/oauth2/jwks | jq '.keys | length'
curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/payments`,
    pitfalls: 'Implicit flow for SPAs. No PKCE. Validating JWT without aud. Long-lived access tokens.',
    production: 'Authorization Code + PKCE; refresh rotation; per-API audience; rotate signing keys with kid.',
    interview30s: 'OAuth2 = authorization (access token). OIDC adds ID token + /userinfo. PKCE protects public clients from code interception.',
    interview2m: 'Draw four ports: 9000 AS, 8082 client, 8080 gateway optional, 8081 RS. client_credentials for batch jobs.',
    traps: 'Resource Owner Password Credentials in new systems — deprecated.',
    labHref: '/oauth-jwt-demo',
  },
  {
    id: 'saml',
    title: 'SAML 2.0 SSO',
    badge: 'Enterprise',
    category: 'Application',
    what: 'XML assertions via IdP-initiated or SP-initiated redirect/POST — common in AD FS enterprises.',
    mermaid: `sequenceDiagram
  participant U as User Browser
  participant SP as Spring SP
  participant IdP as Corporate IdP
  U->>SP: GET /saml2/authenticate/okta
  SP->>IdP: AuthnRequest redirect
  IdP->>U: login + MFA
  IdP->>SP: POST SAMLResponse
  SP->>SP: validate signature + map groups
  SP-->>U: session / JWT`,
    code: `# Spring Security 6 SAML2 Service Provider
spring:
  security:
    saml2:
      relyingparty:
        registration:
          corp-idp:
            entity-id: https://api.example.com/saml/metadata
            acs:
              location: "{baseUrl}/login/saml2/sso/corp-idp"
            assertingparty:
              metadata-uri: https://idp.corp.example/metadata

@Configuration
@EnableWebSecurity
public class SamlSecurityConfig {
  @Bean
  SecurityFilterChain saml(HttpSecurity http) throws Exception {
    return http
        .authorizeHttpRequests(a -> a
            .requestMatchers("/actuator/health").permitAll()
            .anyRequest().authenticated())
        .saml2Login(Customizer.withDefaults())
        .saml2Logout(Customizer.withDefaults())
        .build();
  }

  @Bean
  GrantedAuthoritiesMapper groupsToRoles() {
    return (authorities) -> authorities.stream()
        .map(a -> {
          if (a instanceof Saml2AuthenticatedPrincipal p) {
            return p.getAttribute("groups").stream()
                .map(g -> new SimpleGrantedAuthority("ROLE_" + g))
                .toList();
          }
          return List.of(a);
        })
        .flatMap(Collection::stream)
        .collect(Collectors.toSet());
  }
}`,
    verify: `# Metadata endpoint
curl -s http://localhost:8080/saml2/service-provider-metadata/corp-idp
# Browser: /saml2/authenticate/corp-idp → IdP login → POST back`,
    pitfalls: 'Clock skew on NotOnOrAfter. Not validating assertion signature. XML external entity attacks in legacy parsers.',
    production: 'Prefer OIDC for greenfield; SAML for legacy IdP; map groups→roles explicitly; short session + step-up MFA for wires.',
    interview30s: 'SAML = XML assertion from IdP. Spring saml2Login handles AuthnRequest/Response. OIDC is JSON/JWT — simpler for SPAs.',
    interview2m: 'When bank says AD FS SAML but mobile needs OIDC — use broker (Keycloak/Okta) translating SAML↔OIDC.',
    traps: 'Storing SAML assertion indefinitely — treat as short-lived proof, issue app session/JWT.',
    labHref: '/idanywhere-demo',
  },
  {
    id: 'rbac-abac',
    title: 'RBAC / ABAC / Scopes',
    badge: 'AuthZ',
    category: 'Application',
    what: 'RBAC = roles; ABAC = attribute policies; OAuth scopes = fine-grained API permissions.',
    mermaid: `flowchart TB
  JWT[JWT claims] --> RBAC[hasRole ADMIN]
  JWT --> SCOPE[hasAuthority SCOPE_payments:write]
  JWT --> ABAC[PermissionEvaluator tenant+amount]`,
    code: `@Configuration
@EnableMethodSecurity
public class MethodSecurityConfig {}

@RestController
public class TransferController {
  @PostMapping("/api/transfers")
  @PreAuthorize("hasAuthority('SCOPE_transfers:write')")
  public Transfer create(@RequestBody TransferRequest req, Authentication auth) {
    return transfers.create(req, auth);
  }

  @DeleteMapping("/api/transfers/{id}")
  @PreAuthorize("hasRole('ADMIN') or @transferAuthz.isOwner(#id, authentication)")
  public void cancel(@PathVariable UUID id) { transfers.cancel(id); }
}

@Component("transferAuthz")
public class TransferAuthorization {
  public boolean isOwner(UUID id, Authentication auth) {
    return repo.findOwner(id).equals(auth.getName());
  }
}

// ABAC-style custom evaluator
@Bean
MethodSecurityExpressionHandler methodSecurityExpressionHandler() {
  DefaultMethodSecurityExpressionHandler h = new DefaultMethodSecurityExpressionHandler();
  h.setPermissionEvaluator(new TenantAmountPermissionEvaluator());
  return h;
}`,
    verify: `# USER token — 403 on admin
curl -H "Authorization: Bearer $USER_TOKEN" http://localhost:8081/api/admin/reports
# client_credentials with payment.write — 201
curl -H "Authorization: Bearer $M2M_TOKEN" -X POST http://localhost:8081/api/payments -d '...'`,
    pitfalls: 'ROLE_ prefix confusion — hasRole("ADMIN") expects ROLE_ADMIN authority. God-role ADMIN bypassing all checks.',
    production: 'Scope per API surface; ABAC for tenant isolation; central policy engine for complex rules; audit denials.',
    interview30s: 'RBAC: roles. Scopes: OAuth fine-grained. ABAC: attributes like tenant+region+amount. @PreAuthorize for method-level.',
    interview2m: 'Map IdP groups → roles at login. Machine clients get client_credentials scopes only — no USER role.',
    traps: 'hasRole("ROLE_ADMIN") double prefix — use hasRole("ADMIN").',
  },
  {
    id: 'filter-chain',
    title: 'Spring Security Filter Chain',
    badge: 'Internals',
    category: 'Application',
    what: 'Ordered filters: security context, logout, auth, anonymous, session, exception, authorization, CSRF.',
    mermaid: `flowchart TD
  F1[SecurityContextPersistenceFilter]
  F2[LogoutFilter]
  F3[BearerTokenAuthenticationFilter]
  F4[AuthorizationFilter]
  F5[CsrfFilter]
  F6[DispatcherServlet]
  F1 --> F2 --> F3 --> F4 --> F5 --> F6`,
    code: `@Configuration
@EnableWebSecurity
public class FilterChainConfig {
  @Bean
  @Order(1)
  SecurityFilterChain api(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
    return http.securityMatcher("/api/**")
        .csrf(CsrfConfigurer::disable)
        .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
        .authorizeHttpRequests(a -> a.anyRequest().authenticated())
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
  }

  @Bean
  @Order(2)
  SecurityFilterChain actuator(HttpSecurity http) throws Exception {
    return http.securityMatcher("/actuator/**")
        .authorizeHttpRequests(a -> a.requestMatchers("/actuator/health").permitAll()
            .anyRequest().hasIpAddress("10.0.0.0/8"))
        .httpBasic(Customizer.withDefaults())
        .build();
  }
}

// Custom filter — MUST register only in SecurityFilterChain (not @Component servlet filter)
public class JwtAuthenticationFilter extends OncePerRequestFilter {
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) {
    String header = req.getHeader(HttpHeaders.AUTHORIZATION);
    if (header != null && header.startsWith("Bearer ")) {
      // validate + SecurityContextHolder.getContext().setAuthentication(...)
    }
    chain.doFilter(req, res);
  }
}`,
    verify: `curl -v http://localhost:8092/api/users/me 2>&1 | grep "< HTTP"
# Enable debug: logging.level.org.springframework.security=DEBUG`,
    pitfalls: 'Filter registered twice (servlet + security chain). Wrong @Order — actuator exposed. Blocking filter on reactive chain.',
    production: 'Multiple SecurityFilterChain with securityMatcher; disable default servlet filter registration; test filter order.',
    interview30s: 'SecurityFilterChain is ordered filters before DispatcherServlet. JWT filter before UsernamePasswordAuthenticationFilter. @Order for multiple chains.',
    interview2m: 'Debug 401: which filter rejected? Enable security DEBUG. Contrast servlet Filter vs OncePerRequestFilter in chain.',
    traps: 'csrf.disable() on session cookie app — CSRF wide open.',
    labHref: '/spring-jwt-demo',
  },
  {
    id: 'csrf',
    title: 'CSRF Protection',
    badge: 'Browser',
    category: 'Application',
    what: 'Forged cross-site POST using victim session cookie — mitigated by synchronizer token or SameSite.',
    mermaid: `sequenceDiagram
  participant V as Victim Browser
  participant E as evil.com
  participant A as App :8090
  V->>A: login session cookie set
  E->>V: auto-submit POST /transfer
  V->>A: POST without CSRF token
  A-->>V: 403 Invalid CSRF token`,
    code: `# spring-csrf-demo :8090
@Bean
@Order(2)
SecurityFilterChain browserSecurity(HttpSecurity http) throws Exception {
  return http
      .authorizeHttpRequests(a -> a
          .requestMatchers("/login").permitAll()
          .anyRequest().authenticated())
      .formLogin(f -> f.loginPage("/login"))
      .csrf(Customizer.withDefaults()) // session token in form \${_csrf.token}
      .build();
}

@Bean
@Order(1)
SecurityFilterChain spaSecurity(HttpSecurity http) throws Exception {
  CookieCsrfTokenRepository repo = CookieCsrfTokenRepository.withHttpOnlyFalse();
  return http.securityMatcher("/spa/**")
      .csrf(c -> c.csrfTokenRepository(repo))
      .httpBasic(Customizer.withDefaults())
      .build();
}

# Thymeleaf form
<form method="post" action="/transfer">
  <input type="hidden" th:name="\${_csrf.parameterName}" th:value="\${_csrf.token}"/>
</form>

# JWT API — CSRF disabled (no cookie auth)
http.csrf(csrf -> csrf.disable());`,
    verify: `# Login then transfer without token → 403
curl -c cookies.txt -b cookies.txt -X POST http://localhost:8090/transfer \\
  -d "amount=100&to=attacker" -w "\\n%{http_code}\\n"`,
    pitfalls: 'CSRF disabled on session cookie SPA. DoubleSubmit cookie without secure flags. GET requests that mutate state.',
    production: 'SameSite=Lax/Strict on session cookies; CSRF on all cookie-auth mutating endpoints; JWT Bearer APIs skip CSRF.',
    interview30s: 'CSRF = browser auto-sends cookies. Fix: CSRF token or SameSite. Stateless Bearer JWT APIs usually disable CSRF.',
    interview2m: 'CookieCsrfTokenRepository for SPA reads XSRF-TOKEN cookie, sends X-XSRF-TOKEN header. Evil site cannot read cookie on another origin.',
    traps: 'Enabling CSRF on pure mobile API breaking clients — only needed for cookie session browser apps.',
    labHref: '/spring-csrf-demo',
  },
  {
    id: 'cors',
    title: 'CORS Security',
    badge: 'Browser',
    category: 'Application',
    what: 'Browser-enforced cross-origin policy — server allowlists Origin via Access-Control-Allow-Origin.',
    mermaid: `sequenceDiagram
  participant P as Page :5500
  participant B as Browser
  participant A as API :8091
  P->>B: fetch API with Origin
  B->>A: OPTIONS preflight
  A-->>B: ACAO + ACAM + ACAC
  B->>A: GET/POST with credentials
  A-->>B: response if Origin allowed`,
    code: `# spring-cors-demo :8091
@Bean
CorsConfigurationSource corsConfigurationSource() {
  CorsConfiguration config = new CorsConfiguration();
  config.setAllowedOrigins(List.of("http://localhost:5500"));
  config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
  config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
  config.setAllowCredentials(true);
  config.setMaxAge(3600L);
  UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
  source.registerCorsConfiguration("/api/**", config);
  return source;
}

@Bean
SecurityFilterChain chain(HttpSecurity http) throws Exception {
  return http.cors(Customizer.withDefaults())
      .csrf(csrf -> csrf.disable())
      .authorizeHttpRequests(a -> a
          .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
          .requestMatchers("/api/public/**").permitAll()
          .requestMatchers("/api/**").authenticated())
      .httpBasic(Customizer.withDefaults())
      .build();
}`,
    verify: `# Allowed origin
curl -H "Origin: http://localhost:5500" -u alice:password \\
  http://localhost:8091/api/public/ping -v 2>&1 | grep -i access-control
# Evil origin → 403 Invalid CORS request
curl -H "Origin: http://evil.example" -u alice:password \\
  http://localhost:8091/api/public/ping -w "\\n%{http_code}\\n"`,
    pitfalls: 'Access-Control-Allow-Origin: * with credentials. Reflecting any Origin. CORS confused with auth — server still needs auth.',
    production: 'Explicit origin allowlist per env; never * with credentials; test preflight in CI; CORS at gateway + service.',
    interview30s: 'CORS is browser-only. Server returns ACAO for allowed Origins. Preflight OPTIONS for non-simple requests. Not a substitute for auth.',
    interview2m: 'Network tab shows CORS error but backend might be 500 — check response status. Spring CorsFilter vs Gateway global CORS.',
    traps: '"CORS blocks hackers" — curl/Postman ignore CORS; still need authZ.',
    labHref: '/spring-cors-demo',
  },
  {
    id: 'xss',
    title: 'XSS Defense',
    badge: 'Input',
    category: 'Application',
    what: 'Inject script into HTML — escape output, CSP, avoid th:utext with user data.',
    mermaid: `flowchart LR
  IN[User input] --> STORE[(DB)]
  STORE --> OUT[Template render]
  OUT -->|th:text escape| SAFE[Safe HTML]
  OUT -->|th:utext raw| BAD[XSS]`,
    code: `<!-- WRONG — reflected/stored XSS -->
<div th:utext="\${comment.body}"></div>

<!-- RIGHT — default escape -->
<div th:text="\${comment.body}"></div>

@Configuration
public class SecurityHeadersConfig {
  @Bean
  SecurityFilterChain headers(HttpSecurity http) throws Exception {
    return http
        .headers(h -> h
            .contentSecurityPolicy(c -> c.policyDirectives(
                "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'"))
            .xssProtection(x -> x.headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK)))
        .authorizeHttpRequests(a -> a.anyRequest().permitAll())
        .csrf(csrf -> csrf.disable())
        .build();
  }
}

@RestController
public class CommentController {
  public CommentDto create(@Valid @RequestBody CommentRequest req) {
    // Persist sanitized; JSON APIs still need escape on any HTML rendering layer
    String safe = HtmlUtils.htmlEscape(req.body());
    return service.save(req.withBody(safe));
  }
}`,
    verify: `# spring-xss-demo — submit script tag, verify escaped in response/page
curl -s -X POST http://localhost:8095/api/comments \\
  -H "Content-Type: application/json" \\
  -d '{"body":"<script>alert(1)</script>"}'`,
    pitfalls: 'JWT in localStorage + XSS = token theft. innerHTML in React with user HTML. CSP unsafe-inline.',
    production: 'CSP strict; HttpOnly cookies; sanitize only at output context; use DOMPurify for rich text if needed.',
    interview30s: 'XSS = run attacker JS in victim browser. Fix: escape output, CSP, HttpOnly cookies. th:text not th:utext for user data.',
    interview2m: 'Stored vs reflected vs DOM XSS. Why CSP blocks inline script even if one escape missed.',
    traps: 'Only sanitizing input once — context matters (HTML vs JS vs URL).',
    labHref: '/spring-xss-demo',
  },
  {
    id: 'sqli',
    title: 'SQL Injection',
    badge: 'Input',
    category: 'Application',
    what: 'Untrusted input concatenated into SQL — use PreparedStatement, JPA named params, Criteria API.',
    mermaid: `flowchart LR
  BAD["' OR 1=1 --"] --> CONCAT[String concat SQL]
  CONCAT --> DB[(Full table leak)]
  GOOD[Parameter] --> PREP[PreparedStatement]
  PREP --> DB2[(Single row)]`,
    code: `// VULNERABLE — never do this
@Query(value = "SELECT * FROM users WHERE email = '" + email + "'", nativeQuery = true)
List<User> findBad(String email);

// SAFE — JPA named parameter
@Query("SELECT u FROM User u WHERE u.email = :email")
Optional<User> findSafe(@Param("email") String email);

// SAFE — JdbcTemplate
public User find(String email) {
  return jdbc.queryForObject(
      "SELECT id, email FROM users WHERE email = ?",
      userRowMapper(),
      email);
}

// SAFE — Spring Data derived query (parameterized internally)
Optional<User> findByEmail(String email);

// Validation layer — reject obvious probes early
@Pattern(regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$")
String email;`,
    verify: `# spring-sql-injection-demo
curl "http://localhost:8096/api/users/lookup?email=' OR '1'='1"
# Bad endpoint leaks; safe endpoint returns 404/400`,
    pitfalls: 'Native queries with string concat. ORDER BY column from user input without allowlist. Second-order SQLi in stored data.',
    production: 'Parameterized queries only; least-privilege DB user; WAF as belt; sqlmap in CI for critical endpoints.',
    interview30s: 'SQLi = concat user input into SQL. Fix: bind parameters. JPA @Param, JdbcTemplate ?, never string append.',
    interview2m: 'JPA is safe until nativeQuery concat. LDAP/NoSQL injection same principle — never interpolate.',
    traps: '"We use JPA so we are safe" — unsafe native queries still exist.',
    labHref: '/spring-sql-injection-demo',
  },
  {
    id: 'ssrf',
    title: 'SSRF Defense',
    badge: 'Server',
    category: 'Application',
    what: 'Attacker makes server fetch internal URLs — block metadata IPs, validate URL allowlist, no raw user URLs.',
    mermaid: `flowchart LR
  ATK[Attacker] --> API[POST /webhook/preview?url=]
  API --> META[169.254.169.254 metadata]
  API --> INT[http://payment.internal/admin]`,
    code: `@Service
public class WebhookPreviewService {
  private static final Set<String> ALLOWED_HOSTS = Set.of("hooks.slack.com", "api.partner.com");

  public String fetchPreview(String userUrl) throws Exception {
    URI uri = URI.create(userUrl).normalize();
    validate(uri);
    HttpClient client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(2))
        .followRedirects(HttpClient.Redirect.NEVER)
        .build();
    HttpRequest req = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(3)).GET().build();
    HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
    if (resp.statusCode() >= 400) throw new BadRequestException("upstream error");
    return resp.body().substring(0, Math.min(500, resp.body().length()));
  }

  private void validate(URI uri) {
    if (!List.of("https").contains(uri.getScheme())) throw new SecurityException("https only");
    if (uri.getHost() == null || !ALLOWED_HOSTS.contains(uri.getHost().toLowerCase()))
      throw new SecurityException("host not allowed");
    InetAddress addr = InetAddress.getByName(uri.getHost());
    if (addr.isAnyLocalAddress() || addr.isLoopbackAddress() || addr.isLinkLocalAddress()
        || addr.isSiteLocalAddress())
      throw new SecurityException("private IP blocked");
  }
}`,
    verify: `curl -X POST http://localhost:8080/api/preview \\
  -H "Content-Type: application/json" \\
  -d '{"url":"http://169.254.169.254/latest/meta-data/"}' -w "\\n%{http_code}\\n"`,
    pitfalls: 'DNS rebinding bypassing IP check. Allowing http:// redirects to internal. PDF/image processors fetching URLs.',
    production: 'Separate network for egress; IMDSv2 on AWS; allowlist partners; no generic "fetch URL" features.',
    interview30s: 'SSRF = server requests attacker-chosen URL. Block private IPs, metadata, redirects; allowlist hosts.',
    interview2m: 'Contrast with XSS (browser) and SQLi (database). Cloud metadata credential theft is classic SSRF impact.',
    traps: 'Checking IP once before redirect — followRedirects NEVER or re-validate each hop.',
  },
  {
    id: 'replay',
    title: 'Replay Attacks',
    badge: 'Protocol',
    category: 'Application',
    what: 'Reuse captured valid request — defend with nonce, timestamp window, idempotency keys.',
    mermaid: `sequenceDiagram
  participant A as Attacker
  participant API as Payment API
  Note over API: Legit POST /pay idempotency-key=K1
  A->>API: Replay same POST + K1
  API-->>A: same 201 cached response (no double charge)`,
    code: `@RestController
@RequestMapping("/api/payments")
public class PaymentController {
  @PostMapping
  public ResponseEntity<Payment> pay(
      @RequestHeader("Idempotency-Key") String key,
      @Valid @RequestBody PaymentRequest req) {
    return idempotency.execute(key, req, () -> service.capture(req));
  }
}

@Service
public class IdempotencyService {
  private final StringRedisTemplate redis;

  public <T> ResponseEntity<T> execute(String key, Object body, Supplier<T> action) {
    String hash = sha256(key + canonicalJson(body));
    String cacheKey = "idem:" + hash;
    String cached = redis.opsForValue().get(cacheKey);
    if (cached != null) return deserialize(cached);
    T result = action.get();
    redis.opsForValue().set(cacheKey, serialize(result), Duration.ofHours(24));
    return ResponseEntity.status(HttpStatus.CREATED).body(result);
  }
}

// JWT replay — short exp + jti denylist on logout
@Bean
OAuth2TokenValidator<Jwt> jwtValidator() {
  return new DelegatingOAuth2TokenValidator<>(
      new JwtTimestampValidator(Duration.ofSeconds(30)),
      new JwtClaimValidator<>("jti", jti -> !denylist.contains(jti)));
}`,
    verify: `KEY=$(uuidgen)
curl -X POST http://localhost:8091/api/payments \\
  -H "Idempotency-Key: $KEY" -H "Content-Type: application/json" -d '{...}'
curl -X POST http://localhost:8091/api/payments \\
  -H "Idempotency-Key: $KEY" -H "Content-Type: application/json" -d '{...}'
# Same response body, single capture`,
    pitfalls: 'Idempotency key optional on money POST. Clock skew rejecting all JWTs. Nonce stored only in memory.',
    production: 'Require Idempotency-Key on POST /payments; Redis cluster for idempotency; jti denylist; HMAC timestamp on webhooks.',
    interview30s: 'Replay = resend valid request. Fix: idempotency key, nonce, short JWT TTL, jti blocklist.',
    interview2m: 'Difference replay vs duplicate delivery (Kafka at-least-once) — same idempotency pattern.',
    traps: 'Idempotency on GET — unnecessary; focus on mutating endpoints.',
  },
  {
    id: 'mitm',
    title: 'MITM Defense',
    badge: 'Network',
    category: 'Application',
    what: 'Intercept/modify traffic — TLS + cert validation + HSTS + cert pinning for high-risk clients.',
    mermaid: `sequenceDiagram
  participant C as Client
  participant M as Attacker proxy
  participant S as Server
  C->>M: CONNECT (no TLS verify disabled!)
  M->>S: real TLS
  M->>C: forged cert
  Note over C,M: Attacker reads plaintext`,
    code: `# NEVER in production
// HttpClient trust-all — interview anti-pattern only
TrustManager[] trustAll = new TrustManager[]{ new X509TrustManager() {
  public void checkClientTrusted(X509Certificate[] c, String s) {}
  public void checkServerTrusted(X509Certificate[] c, String s) {}
  public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
}};

# RIGHT — default JVM trust store + hostname verification
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(5))
    .build();

# HSTS — force HTTPS after first visit
.headers(h -> h.httpStrictTransportSecurity(hsts -> hsts
    .maxAgeInSeconds(31536000)
    .includeSubDomains(true)
    .preload(true)))

# Certificate pinning (mobile/high-security)
// OkHttp CertificatePinner pin api.example.com sha256/AAAA...`,
    verify: `openssl s_client -connect api.example.com:443 -verify_return_error </dev/null
curl -I https://api.example.com 2>&1 | grep -i strict-transport`,
    pitfalls: 'Corporate SSL inspection breaks pinning without documented exception. disableSslVerification in RestTemplate.',
    production: 'TLS everywhere; monitor cert transparency; mTLS internal; no custom trust-all; HSTS preload.',
    interview30s: 'MITM = sit between client and server. Defense: TLS, validate cert chain + hostname, HSTS, mTLS internal.',
    interview2m: 'Public Wi-Fi scenario. Why pinning helps mobile apps but complicates cert rotation.',
    traps: '"We use HTTPS" but app disables cert validation — still MITM-vulnerable.',
    labHref: '/encryption',
  },
  {
    id: 'security-headers',
    title: 'Security Headers',
    badge: 'Headers',
    category: 'Application',
    what: 'HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy — reduce browser attack surface.',
    mermaid: `flowchart TB
  R[Response headers]
  R --> HSTS[Strict-Transport-Security]
  R --> CSP[Content-Security-Policy]
  R --> XFO[X-Frame-Options DENY]
  R --> XCTO[X-Content-Type-Options nosniff]`,
    code: `@Bean
SecurityFilterChain securityHeaders(HttpSecurity http) throws Exception {
  return http
      .headers(headers -> headers
          .httpStrictTransportSecurity(hsts -> hsts
              .includeSubDomains(true)
              .maxAgeInSeconds(31536000)
              .preload(true))
          .contentSecurityPolicy(csp -> csp.policyDirectives(
              "default-src 'self'; " +
              "script-src 'self'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "frame-ancestors 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self'"))
          .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
          .contentTypeOptions(Customizer.withDefaults())
          .referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
          .permissionsPolicy(p -> p.policy("geolocation=(), microphone=(), camera=()")))
      .authorizeHttpRequests(a -> a.anyRequest().authenticated())
      .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
      .csrf(csrf -> csrf.disable())
      .build();
}

# Verify headers
curl -sI https://api.example.com | egrep -i "strict-transport|content-security|x-frame|x-content-type"`,
    verify: `curl -sI http://localhost:8092/actuator/health | grep -i x-content-type
# securityheaders.com scan in prod`,
    pitfalls: 'CSP unsafe-inline negating XSS protection. HSTS on HTTP-only dev host. X-Frame-Options missing on admin UI.',
    production: 'Tune CSP report-uri/report-to; align with frontend asset hashes; gateway + app both emit headers consistently.',
    interview30s: 'HSTS forces HTTPS. CSP restricts script sources. X-Frame-Options stops clickjacking. nosniff stops MIME sniff.',
    interview2m: 'Which headers gateway vs app owns. CSP nonce pattern for inline scripts in modern SPAs.',
    traps: 'Duplicate conflicting CSP from gateway and service.',
  },
];
