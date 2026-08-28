import type {SecTopic} from './types';

export const TOPICS_NETWORK: SecTopic[] = [
  {
    id: 'http-internal',
    title: 'HTTP Internal Working',
    badge: 'Network',
    category: 'Network',
    what: 'Request line → headers → body over TCP; Spring MVC maps to DispatcherServlet → controller.',
    mermaid: `sequenceDiagram
  participant B as Browser
  participant T as TCP :443
  participant S as Tomcat
  participant D as DispatcherServlet
  participant C as Controller
  B->>T: GET /api/payments HTTP/1.1
  T->>S: accept socket
  S->>D: HttpServletRequest
  D->>C: @GetMapping handler
  C-->>B: 200 JSON body`,
    code: `# Raw HTTP/1.1 (what curl sends before TLS wraps it)
GET /vibhu-tech-blog/api/payments HTTP/1.1
Host: api.example.com
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Connection: keep-alive

# Spring Boot 3.4 — trace one request
logging.level.org.springframework.web=DEBUG
logging.level.org.apache.coyote.http11=DEBUG

# Controller (stateless API)
@RestController
@RequestMapping("/api/payments")
public class PaymentController {
  @GetMapping("/{id}")
  public PaymentDto get(@PathVariable UUID id, Authentication auth) {
    return paymentService.find(id, auth.getName());
  }
}

# Embedded Tomcat tuning (application.yml)
server:
  tomcat:
    threads:
      max: 200
      min-spare: 10
    max-connections: 8192
    accept-count: 100
  compression:
    enabled: true
    mime-types: application/json,application/xml,text/html
    min-response-size: 1024

# bash — verbose trace (lab: any Spring app)
curl -v http://localhost:8092/actuator/health 2>&1 | head -40`,
    verify: `curl -v http://localhost:8092/actuator/health
# Expect: HTTP/1.1 200, Content-Type: application/vnd.spring-boot.actuator.v3+json`,
    pitfalls: 'Logging full Authorization headers in access logs — PAN/JWT leak. Unbounded keep-alive exhausting threads.',
    production: 'Terminate TLS at ALB or in-app; set server.forward-headers-strategy: framework behind proxy; never log secrets.',
    interview30s: 'HTTP is method + path + headers + optional body on TCP. Spring DispatcherServlet resolves handler, filters run first — including SecurityFilterChain.',
    interview2m: 'Walk GET /api/payments: DNS → TCP → TLS handshake → HTTP request → Tomcat → SecurityFilterChain (JWT) → authorizeHttpRequests → controller → JSON. Mention HTTP/2 multiplexing on same connection and why idempotent GET retries differ from POST payments.',
    traps: '"HTTP is encrypted" — only HTTPS/TLS encrypts. Confusing 404 routing with 401 auth failures.',
  },
  {
    id: 'http-vs-https',
    title: 'HTTP vs HTTPS',
    badge: 'Transport',
    category: 'Network',
    what: 'HTTPS = HTTP over TLS — confidentiality + integrity + server authentication on port 443.',
    mermaid: `flowchart LR
  subgraph insecure [HTTP :80]
    P1[Plaintext]
  end
  subgraph secure [HTTPS :443]
    TLS[TLS record layer]
    P2[Encrypted HTTP]
  end
  Client --> insecure
  Client --> secure
  TLS --> P2`,
    code: `# application.yml — enable HTTPS (Spring Boot 3.4)
server:
  port: 8443
  ssl:
    enabled: true
    protocol: TLS
    enabled-protocols: TLSv1.3,TLSv1.2
    ciphers: TLS_AES_256_GCM_SHA384,TLS_CHACHA20_POLY1305_SHA256
    key-store: classpath:keystore/server.p12
    key-store-password: \${SSL_KEYSTORE_PASSWORD}
    key-store-type: PKCS12
    key-alias: api

# Redirect HTTP → HTTPS (additional connector or edge ALB)
@Configuration
public class HttpsRedirectConfig {
  @Bean
  ServletWebServerFactory servletContainer() {
    TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory();
    tomcat.addAdditionalTomcatConnectors(httpConnector());
    return tomcat;
  }
  private Connector httpConnector() {
    Connector c = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
    c.setScheme("http");
    c.setPort(8080);
    c.setSecure(false);
    c.setRedirectPort(8443);
    return c;
  }
}

# Security headers (complement TLS)
@Bean
SecurityFilterChain headers(HttpSecurity http) throws Exception {
  return http
      .headers(h -> h
          .contentSecurityPolicy(c -> c.policyDirectives("default-src 'self'"))
          .httpStrictTransportSecurity(hsts -> hsts
              .includeSubDomains(true)
              .maxAgeInSeconds(31536000))
          .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
      .authorizeHttpRequests(a -> a.anyRequest().permitAll())
      .csrf(CsrfConfigurer::disable)
      .build();
}`,
    verify: `# Self-signed lab cert
curl -vk https://localhost:8443/actuator/health
openssl s_client -connect localhost:8443 -tls1_3 </dev/null 2>/dev/null | openssl x509 -noout -subject -dates`,
    pitfalls: 'Mixed content — HTTPS page calling HTTP API. Self-signed cert in prod without proper trust chain.',
    production: 'ACM cert on ALB; HSTS preload; TLS 1.2+ only; disable weak ciphers; monitor cert expiry 30/60/90 days.',
    interview30s: 'HTTPS wraps HTTP in TLS — encrypts wire and proves server identity via X.509. Does not replace app auth or field encryption at rest.',
    interview2m: 'Compare ports, MITM risk, and where termination happens. Edge TLS + mTLS east-west is common in banks. Spring: server.ssl.* or reverse proxy with X-Forwarded-Proto.',
    traps: 'Assuming HTTPS means end-to-end encryption through the database — TLS terminates, plaintext in app/DB unless field encrypted.',
  },
  {
    id: 'tls',
    title: 'TLS 1.3 Handshake',
    badge: 'Crypto',
    category: 'Network',
    what: '1-RTT handshake negotiates cipher suite, authenticates server cert, derives session keys (AEAD).',
    mermaid: `sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: ClientHello + supported groups/ciphers
  S->>C: ServerHello + cert + KEY_SHARE
  C->>C: verify cert chain + hostname
  C->>S: Finished (encrypted)
  C->>S: HTTP GET (encrypted)`,
    code: `# Generate RSA server cert for lab (PKCS12)
keytool -genkeypair -alias api -keyalg RSA -keysize 2048 \\
  -validity 365 -keystore server.p12 -storetype PKCS12 \\
  -dname "CN=api.local, OU=Lab, O=Vibhu, C=US" \\
  -ext SAN=dns:api.local,dns:localhost -storepass changeit

# Spring Boot TLS server
server:
  ssl:
    enabled: true
    key-store: file:/etc/ssl/server.p12
    key-store-password: \${SSL_KEYSTORE_PASSWORD}
    key-store-type: PKCS12
    key-alias: api
    enabled-protocols: TLSv1.3,TLSv1.2

# RestClient with TLS 1.3 (Spring 6.2+ / Boot 3.4)
@Bean
RestClient secureRestClient(RestClient.Builder builder) {
  return builder
      .baseUrl("https://payment.internal:8443")
      .requestFactory(new JdkClientHttpRequestFactory(
          HttpClient.newBuilder()
              .sslParameters(tlsParams())
              .connectTimeout(Duration.ofSeconds(2))
              .build()))
      .build();
}

private SSLParameters tlsParams() {
  SSLParameters p = new SSLParameters();
  p.setProtocols(new String[]{"TLSv1.3", "TLSv1.2"});
  return p;
}

# Verify cipher negotiated
openssl s_client -connect api.local:8443 -tls1_3 2>&1 | grep "Cipher"`,
    verify: `openssl s_client -connect localhost:8443 -servername localhost </dev/null 2>&1 | egrep "Protocol|Cipher|Verify"
curl -vk --tlsv1.3 https://localhost:8443/actuator/health`,
    pitfalls: 'TLS 1.0/1.1 enabled. Wildcard cert without SAN for service hostnames. Disabling hostname verification.',
    production: 'Automate cert renewal (ACM/Let\'s Encrypt); alert 30 days before expiry; prefer TLS 1.3; perfect forward secrecy ciphers only.',
    interview30s: 'TLS 1.3: one round trip, encrypted cert verify, AEAD (AES-GCM/ChaCha20). Client verifies chain + hostname before sending secrets.',
    interview2m: 'Contrast TLS 1.2 (2-RTT, more cipher junk) vs 1.3. Explain record layer vs handshake. After termination at ALB, traffic inside VPC may still need mTLS.',
    traps: '"TLS encrypts the database" — false. TLS protects transport between two TLS endpoints only.',
  },
  {
    id: 'mtls',
    title: 'TLS vs mTLS',
    badge: 'Identity',
    category: 'Network',
    what: 'mTLS requires client certificate — both peers prove identity at transport layer.',
    mermaid: `sequenceDiagram
  participant A as Order Service
  participant B as Payment Service
  A->>B: ClientHello + client cert
  B->>A: ServerHello + server cert
  B->>B: verify client CN/SAN against allowlist
  A->>B: encrypted POST /internal/capture`,
    code: `# Server — require client cert (Spring Boot 3.4)
server:
  ssl:
    enabled: true
    client-auth: need
    key-store: classpath:certs/server.p12
    key-store-password: \${SERVER_KS_PASS}
    trust-store: classpath:certs/client-ca.p12
    trust-store-password: \${TRUSTSTORE_PASS}

# Optional: map cert DN to Spring authorities
@Configuration
@EnableWebSecurity
public class MtlsSecurityConfig {
  @Bean
  SecurityFilterChain internal(HttpSecurity http) throws Exception {
    return http.securityMatcher("/internal/**")
        .authorizeHttpRequests(a -> a
            .requestMatchers("/internal/**").authenticated())
        .x509(x -> x
            .subjectPrincipalRegex("CN=(.*?)(?:,|$)")
            .userDetailsService(cn -> User.withUsername(cn)
                .password("N/A").roles("INTERNAL").build()))
        .csrf(CsrfConfigurer::disable)
        .build();
  }
}

# Issue client cert signed by same CA
keytool -genkeypair -alias order-svc -keyalg RSA -keystore order-client.p12 \\
  -storetype PKCS12 -dname "CN=order-service" -storepass changeit
keytool -certreq -alias order-svc -keystore order-client.p12 -storepass changeit \\
  -file order.csr
# Sign CSR with your CA, import signed cert back into order-client.p12`,
    verify: `# curl with client cert
curl --cert order-client.p12:changeit --cert-type P12 \\
  --cacert ca.pem https://payment.internal:8443/internal/health

# Without cert → handshake failure / 403
curl -vk https://payment.internal:8443/internal/health`,
    pitfalls: 'Shared client cert across all services — no blast-radius isolation. Forgetting to rotate client certs before expiry.',
    production: 'SPIFFE/SPIRE or cert-manager per workload identity; short-lived certs; separate CA for internal mesh; app-level authz still required after mTLS.',
    interview30s: 'TLS = server proves identity. mTLS = both sides present certs — standard for Kafka, service mesh, B2B APIs.',
    interview2m: 'When mTLS alone is enough vs when you still need JWT: mTLS proves which service called, JWT proves which user/tenant acted. Combine for zero-trust east-west.',
    traps: 'Trusting mTLS as authorization — any compromised service with a valid cert can call everything unless RBAC/scopes apply.',
  },
  {
    id: 'spring-tls',
    title: 'Spring Boot TLS',
    badge: 'Spring',
    category: 'Network',
    what: 'Configure server.ssl.* for embedded Tomcat/Netty — keystore holds server private key + cert.',
    mermaid: `flowchart TB
  subgraph boot [Spring Boot]
    YML[server.ssl.*]
    TOM[Embedded Tomcat]
  end
  KS[(keystore.p12)]
  YML --> TOM
  KS --> TOM
  Client -->|TLS 443| TOM`,
    code: `# application-prod.yml
server:
  port: 8443
  forward-headers-strategy: framework
  ssl:
    enabled: true
    key-store: \${SSL_KEYSTORE_PATH:classpath:keystore/server.p12}
    key-store-password: \${SSL_KEYSTORE_PASSWORD}
    key-store-type: PKCS12
    key-alias: \${SSL_KEY_ALIAS:api}
    enabled-protocols: TLSv1.3,TLSv1.2
    ciphers: TLS_AES_256_GCM_SHA384,TLS_CHACHA20_POLY1305_SHA256,TLS_AES_128_GCM_SHA256

# Behind ALB — HTTP on 8080, TLS at load balancer
server:
  port: 8080
# Trust X-Forwarded-Proto for redirect/security checks
server:
  forward-headers-strategy: native

management:
  server:
    port: 8081
    ssl:
      enabled: false
  endpoints:
    web:
      exposure:
        include: health,info,prometheus

# Programmatic SSL bundle (Boot 3.1+)
spring:
  ssl:
    bundle:
      pem:
        server:
          keystore:
            certificate: classpath:certs/server.crt
            private-key: classpath:certs/server.key
server:
  ssl:
    bundle: server`,
    verify: `curl -vk https://localhost:8443/actuator/health
# ALB mode:
curl -H "X-Forwarded-Proto: https" http://localhost:8080/actuator/health`,
    pitfalls: 'Keystore password in git. Exposing actuator on same TLS port without auth. Wrong key-alias after cert renewal.',
    production: 'Mount keystore from Secrets Manager; separate management port/network; use ssl bundles for rotation without restart where possible.',
    interview30s: 'server.ssl.key-store + password + type PKCS12 enables HTTPS on embedded container. forward-headers-strategy when TLS terminates at ALB.',
    interview2m: 'Boot 3 ssl bundles vs legacy key-store. Discuss hot reload limitations and blue/green for cert rotation.',
    traps: 'Using JKS in new projects — prefer PKCS12. Mixing server.ssl with spring.ssl.bundle incorrectly.',
  },
  {
    id: 'spring-mtls',
    title: 'Spring Boot mTLS',
    badge: 'Spring',
    category: 'Network',
    what: 'client-auth: need + trust-store — Tomcat validates incoming client cert against trusted CAs.',
    mermaid: `flowchart LR
  C[Client keystore] -->|present cert| S[Spring Boot]
  TS[(trust-store CA)] --> S
  S -->|CN → Principal| SEC[SecurityContext]`,
    code: `server:
  ssl:
    enabled: true
    client-auth: need
    key-store: file:/run/secrets/server.p12
    key-store-password: \${SERVER_KS_PASS}
    trust-store: file:/run/secrets/truststore.p12
    trust-store-password: \${TRUSTSTORE_PASS}

@Configuration
@EnableWebSecurity
public class SecurityConfig {
  @Bean
  @Order(1)
  SecurityFilterChain mtls(HttpSecurity http) throws Exception {
    return http.securityMatcher("/internal/**")
        .authorizeHttpRequests(auth -> auth.anyRequest().hasRole("INTERNAL"))
        .x509(Customizer.withDefaults())
        .csrf(csrf -> csrf.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
        .build();
  }

  @Bean
  @Order(2)
  SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http.securityMatcher("/api/**")
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
        .authorizeHttpRequests(a -> a.anyRequest().authenticated())
        .csrf(csrf -> csrf.disable())
        .build();
  }
}

# RestClient outbound mTLS — see rest-client-mtls topic`,
    verify: `curl --cert client.p12:secret --cacert ca.crt \\
  https://localhost:8443/internal/ping
# Expect 200; without cert: SSL handshake error`,
    pitfalls: 'want vs need — want allows optional client cert (confusing). Single truststore for all envs mixing prod/staging CAs.',
    production: 'Cert-manager + SPIFFE IDs; automate trust bundle distribution; monitor cert expiry per service identity.',
    interview30s: 'client-auth: need forces client cert. trust-store holds CAs you accept. x509() maps cert subject to UserDetails.',
    interview2m: 'Dual SecurityFilterChain: /internal/** mTLS, /api/** JWT. Defense in depth — mTLS for service identity, JWT for user context.',
    traps: 'Disabling cert validation in RestClient "to fix dev" and shipping to prod.',
    labHref: '/encryption',
  },
  {
    id: 'keystore-truststore',
    title: 'Keystore vs Truststore',
    badge: 'PKI',
    category: 'Network',
    what: 'Keystore = private key + identity; truststore = trusted CA/peer certs only (no private keys).',
    mermaid: `flowchart TB
  KS[Keystore server.p12]
  KS --> PK[Private key NEVER share]
  KS --> LC[Leaf cert + chain]
  TS[Truststore clients.p12]
  TS --> CA[CA certs / peer certs]
  Client -->|trusts| TS
  Server -->|proves| KS`,
    code: `# Create server keystore (private key + cert)
keytool -genkeypair -alias api -keyalg RSA -keysize 2048 \\
  -keystore server-keystore.p12 -storetype PKCS12 \\
  -validity 825 -storepass \${PASS} \\
  -dname "CN=api.prod.example.com" \\
  -ext "SAN=dns:api.prod.example.com,dns:api.internal"

# Export public cert to share
keytool -exportcert -alias api -keystore server-keystore.p12 \\
  -storepass \${PASS} -rfc -file api-public.crt

# Build truststore — import CA or peer cert (NO private key)
keytool -importcert -alias corp-ca -file corp-root-ca.crt \\
  -keystore server-truststore.p12 -storetype PKCS12 \\
  -storepass \${PASS} -noprompt

# Spring mapping
server:
  ssl:
    key-store: file:/secrets/server-keystore.p12      # identity
    key-store-password: \${KEYSTORE_PASS}
    trust-store: file:/secrets/server-truststore.p12  # mTLS trust
    trust-store-password: \${TRUSTSTORE_PASS}
    client-auth: need

# List contents (interview command)
keytool -list -v -keystore server-keystore.p12 -storepass \${PASS}
keytool -list -v -keystore server-truststore.p12 -storepass \${PASS}`,
    verify: `keytool -list -keystore server-keystore.p12 -storepass changeit | grep PrivateKeyEntry
keytool -list -keystore server-truststore.p12 -storepass changeit | grep trustedCertEntry`,
    pitfalls: 'Putting private key in truststore. Using same file for both keystore and truststore in prod (works in lab, bad hygiene).',
    production: 'PKCS12 everywhere; HSM/KMS for root CA; separate trust bundles per environment; never commit .p12 to git.',
    interview30s: 'Keystore holds MY private key + cert chain. Truststore holds CAs I trust to validate peers. Spring: key-store vs trust-store properties.',
    interview2m: 'Walk payment service calling bank: our keystore for client auth, bank CA in truststore, bank validates our client cert against their truststore.',
    traps: 'Interview question "where is the private key?" — only in keystore, never truststore or git.',
    labHref: '/encryption',
  },
  {
    id: 'keytool',
    title: 'keytool Commands',
    badge: 'CLI',
    category: 'Network',
    what: 'JDK keytool manages keystores — genkeypair, import, export, list, change alias/password.',
    mermaid: `flowchart LR
  GEN[genkeypair] --> KS[(PKCS12)]
  CSR[certreq] --> CA[Sign with CA]
  CA --> IMP[importcert]
  IMP --> KS
  EXP[exportcert] --> PEM[Share public .crt]`,
    code: `# 1) Generate 2048-bit RSA key + self-signed cert (dev only)
keytool -genkeypair -alias dev-api -keyalg RSA -keysize 2048 \\
  -validity 365 -keystore dev.p12 -storetype PKCS12 \\
  -storepass changeit -keypass changeit \\
  -dname "CN=localhost" -ext SAN=dns:localhost,ip:127.0.0.1

# 2) CSR for corporate CA signing
keytool -certreq -alias dev-api -keystore dev.p12 -storepass changeit \\
  -file dev-api.csr

# 3) Import CA-signed cert + CA chain
keytool -importcert -alias corp-ca -file corp-ca.crt \\
  -keystore dev.p12 -storepass changeit -noprompt
keytool -importcert -alias dev-api -file dev-api-signed.crt \\
  -keystore dev.p12 -storepass changeit

# 4) Convert / inspect
keytool -printcert -file dev-api-signed.crt
openssl pkcs12 -in dev.p12 -nodes -passin pass:changeit | openssl x509 -noout -text

# 5) Change password / rotate alias
keytool -storepasswd -keystore dev.p12
keytool -changealias -alias dev-api -destalias api-prod-2026 -keystore dev.p12

# 6) Delete compromised entry
keytool -delete -alias dev-api -keystore dev.p12 -storepass changeit

# Docker / CI — non-interactive
export KEYSTORE_PASS=\$(aws secretsmanager get-secret-value --secret-id ssl/keystore-pass --query SecretString -o text)`,
    verify: `keytool -list -v -keystore dev.p12 -storepass changeit
openssl s_client -connect localhost:8443 </dev/null 2>&1 | openssl x509 -noout -subject`,
    pitfalls: 'Self-signed in prod. Default password changeit. Forgetting to import CA chain — partial chain SSL errors.',
    production: 'Prefer cert-manager/ACM over manual keytool in prod; keytool for break-glass and local dev; audit every keystore change.',
    interview30s: 'genkeypair creates key entry; importcert adds trusted cert; certreq exports CSR; list -v shows SAN, expiry, algorithm.',
    interview2m: 'Debug "unable to find valid certification path" — missing intermediate in truststore. Debug "bad certificate" — hostname/SAN mismatch.',
    traps: 'Using keytool -genkeypair for production CA roots on laptop — use proper PKI/HSM.',
  },
  {
    id: 'rest-client-mtls',
    title: 'RestClient mTLS',
    badge: 'Client',
    category: 'Network',
    what: 'Configure SSLContext with client key + trust CA for Spring 6 RestClient / WebClient outbound calls.',
    mermaid: `sequenceDiagram
  participant O as Order Service
  participant RC as RestClient
  participant P as Payment :8443
  O->>RC: POST /capture
  RC->>P: TLS + client cert
  P->>P: verify client + authorize
  P-->>O: 201`,
    code: `@Configuration
public class PaymentClientConfig {

  @Bean
  RestClient paymentRestClient(
      RestClient.Builder builder,
      @Value("\${payment.base-url}") String baseUrl,
      SslBundles sslBundles) {
    return builder
        .baseUrl(baseUrl)
        .requestFactory(clientHttpRequestFactory(sslBundles))
        .defaultHeader("X-Correlation-Id", () -> MDC.get("corrId"))
        .build();
  }

  private ClientHttpRequestFactory clientHttpRequestFactory(SslBundles bundles) {
    SSLBundle bundle = bundles.getBundle("payment-client");
    HttpClient httpClient = HttpClient.newBuilder()
        .sslContext(bundle.createSslContext())
        .connectTimeout(Duration.ofSeconds(2))
        .build();
    return new JdkClientHttpRequestFactory(httpClient);
  }
}

# application.yml — SSL bundle for client mTLS
spring:
  ssl:
    bundle:
      pem:
        payment-client:
          keystore:
            certificate: file:/run/secrets/order-client.crt
            private-key: file:/run/secrets/order-client.key
          truststore:
            certificate: file:/run/secrets/payment-ca.crt

payment:
  base-url: https://payment.internal:8443

@Service
public class PaymentGateway {
  private final RestClient client;
  public CaptureResult capture(CaptureRequest req) {
    return client.post()
        .uri("/internal/capture")
        .contentType(MediaType.APPLICATION_JSON)
        .body(req)
        .retrieve()
        .onStatus(HttpStatusCode::isError, (r, b) -> {
          throw new PaymentException("capture failed: " + r.getStatusCode());
        })
        .body(CaptureResult.class);
  }
}`,
    verify: `# Start payment service with mTLS on 8443
curl --cert order-client.p12:changeit --cacert payment-ca.crt \\
  -X POST https://localhost:8443/internal/capture \\
  -H "Content-Type: application/json" \\
  -d '{"paymentId":"P-1","amount":100}'`,
    pitfalls: 'Trust-all TrustManager in dev leaking to prod. No connection timeout — thread pool stall. Missing hostname verifier alignment with SAN.',
    production: 'Resilience4j timeout + CB on RestClient; rotate client certs via sidecar; never disable hostname verification.',
    interview30s: 'RestClient + JdkClientHttpRequestFactory + HttpClient SSLContext from keystore/truststore enables outbound mTLS in Boot 3.4.',
    interview2m: 'Compare RestTemplate (legacy), RestClient (sync), WebClient (reactive). ssl bundles vs manual KeyStore.load. Combine mTLS with OAuth client_credentials for user context propagation.',
    traps: 'Assuming RestClient inherits server.ssl.* — outbound needs separate client SSL config.',
    labHref: '/encryption',
  },
];
