import type {CommSection} from './types';

/** Deep dive — Spring HTTP clients: RestClient, WebClient, OpenFeign, RestTemplate. */
export const CLIENTS: CommSection[] = [
  {
    id: 'restclient-deep',
    title: 'RestClient — Boot 3 synchronous client',
    what:
      'Spring Framework 6 RestClient is the official replacement for RestTemplate. Fluent API: RestClient.create() or builder with baseUrl, default headers, and status handlers. Under the hood uses ClientHttpRequestFactory backed by JDK HttpClient or Apache HttpClient 5 with connection pooling.',
    why:
      'Imperative, readable sync calls that fit Spring MVC request threads. First-class in Boot 3 docs. Integrates with HttpMessageConverter (Jackson), Observation API, and virtual threads on Java 21.',
    when:
      'Default outbound HTTP client in Boot 3 MVC services. Replacing RestTemplate. Simple request/response without reactive stack. Virtual-thread apps where blocking is cheap but timeouts still mandatory.',
    how:
      `@Configuration
public class PaymentClientConfig {
  @Bean
  RestClient paymentRestClient(RestClient.Builder builder) {
    return builder
        .baseUrl("http://payment-service")
        .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
        .requestInterceptor((req, body, exec) -> {
          req.getHeaders().set("traceparent", TraceContext.current());
          return exec.execute(req, body);
        })
        .build();
  }
}

// Usage
PaymentResponse resp = paymentRestClient.post()
    .uri("/api/v1/payments")
    .contentType(MediaType.APPLICATION_JSON)
    .body(dto)
    .retrieve()
    .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> { throw new PaymentRejectedException(); })
    .body(PaymentResponse.class);`,
    flow: `sequenceDiagram
  participant S as OrderService
  participant RC as RestClient
  participant F as ClientHttpRequestFactory
  participant Pool as HttpClient 5 pool
  participant P as Payment pod
  S->>RC: post().uri().body().retrieve()
  RC->>F: createRequest
  F->>Pool: acquire connection (reuse TCP/TLS)
  Pool->>P: HTTP POST
  P-->>Pool: 201 + JSON
  Pool-->>RC: response stream
  RC-->>S: PaymentResponse via Jackson`,
    failure:
      'Missing read timeout → threads blocked until OS TCP timeout. Shared pool across all downstreams — one slow API starves others. Not handling 4xx/5xx with onStatus → generic RestClientException. Connection leak if response body not consumed on errors.',
    tradeoff:
      'Pros: modern API, MVC-native, same stack as server. Cons: blocking — without virtual threads, thread pool is the scalability ceiling.',
    security:
      'Configure SSL bundle (Boot 3.1+) for mTLS. OAuth2RestClientCustomizer or interceptor for token. Sanitize logged URLs — no secrets in query params.',
    observability:
      'RestClient.Builder.observationRegistry() for Micrometer traces. Custom interceptor logs duration + status. Tag metrics by downstream name.',
    trap:
      'Creating new RestClient per request — destroys connection pool benefits. Staff: “How does RestClient differ from RestTemplate?” → same role, new API, HttpClient 5 default.',
    interviewAnswer:
      'RestClient is Boot 3’s sync HTTP client. I configure one bean per downstream with HttpClient 5 connection pool (max total, per-route), connect timeout 500ms, read timeout 2s, trace interceptor, and Resilience4j circuit breaker wrapping the call. On Java 21 with virtual threads blocking is cheap but timeouts still prevent cascade.',
    remember: [
      'One RestClient bean per downstream service',
      'HttpClient 5 pool: maxTotal + maxPerRoute',
      'onStatus for 4xx/5xx mapping',
      'Virtual threads ≠ skip timeouts',
    ],
    oneLiner: 'RestClient — pooled sync HTTP; one bean per downstream with timeouts.',
    tables: [
      {
        headers: ['Config', 'Recommended value', 'Why'],
        rows: [
          ['connectTimeout', '500ms–1s', 'Fail fast on dead host'],
          ['readTimeout', '2–5s p99 based', 'Prevent thread hoarding'],
          ['maxConnTotal', '200 (tune)', 'Pool ceiling'],
          ['maxConnPerRoute', '50', 'Per downstream limit'],
          ['keepAlive', '30s', 'Reuse TCP/TLS'],
        ],
      },
      {
        headers: ['Method', 'API', 'Notes'],
        rows: [
          ['GET', '.get().uri().retrieve().body(T)', 'Idempotent, cacheable'],
          ['POST', '.post().body(dto).retrieve()', 'Add idempotency header'],
          ['PUT', '.put().body(dto).retrieve()', 'Idempotent replace'],
          ['DELETE', '.delete().uri().retrieve()', 'Idempotent'],
          ['Exchange', '.method(HttpMethod.PATCH)...', 'Full control'],
        ],
      },
    ],
  },
  {
    id: 'webclient-deep',
    title: 'WebClient — reactive non-blocking client',
    what:
      'Spring WebFlux WebClient built on Reactor Netty (default) or Jetty reactive client. Returns reactive types Mono<T>/Flux<T>. Event-loop threads handle I/O; business logic composes via operators (flatMap, zip, timeout, retry).',
    why:
      'Thousands of concurrent outbound calls without proportional thread growth. Native streaming and backpressure. Parallel aggregation of multiple backends in one user request.',
    when:
      'WebFlux / reactive stack end-to-end. BFF fan-out to 5+ services in parallel. Streaming downloads/uploads. Gateway filters calling backends.',
    how:
      `@Bean
WebClient paymentWebClient(WebClient.Builder builder) {
  ConnectionProvider provider = ConnectionProvider.builder("payment-pool")
      .maxConnections(100)
      .pendingAcquireMaxCount(500)
      .maxIdleTime(Duration.ofSeconds(30))
      .build();
  HttpClient httpClient = HttpClient.create(provider)
      .responseTimeout(Duration.ofSeconds(2))
      .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 1000);
  return builder
      .clientConnector(new ReactorClientHttpConnector(httpClient))
      .baseUrl("http://payment-service")
      .filter(ExchangeFilterFunction.ofRequestProcessor(req ->
          Mono.just(ClientRequest.from(req).header("traceparent", trace()).build())))
      .build();
}

// Parallel fan-out
Mono.zip(
    orderClient.get().uri("/{id}", id).retrieve().bodyToMono(Order.class),
    userClient.get().uri("/{id}", userId).retrieve().bodyToMono(User.class)
).map(tuple -> aggregate(tuple.getT1(), tuple.getT2()));`,
    flow: `flowchart TD
  subgraph netty [Reactor Netty]
    EL[Event loop threads ~ CPU cores]
    EL --> CH1[Channel 1]
    EL --> CH2[Channel 2]
    EL --> CHN[Channel N]
  end
  WC[WebClient] --> EL
  CH1 --> Mono[Mono pipeline flatMap/zip]
  Mono --> App[Return to WebFlux controller]`,
    failure:
      '.block() on servlet thread — antipattern. block() inside reactive chain on event loop — freezes all channels on that loop. JDBC or blocking RestClient inside flatMap without publishOn(boundedElastic) — BlockHound violation. pendingAcquireMaxCount exceeded → acquire timeout errors.',
    tradeoff:
      'Pros: throughput, composition, streaming. Cons: steep learning curve, harder stack traces, must not mix blocking code.',
    security:
      'ExchangeFilterFunction for OAuth token. secure() on HttpClient for TLS. disableRedirect() if tokens in URL risk.',
    observability:
      'tap(Micrometer.metrics(observationRegistry)). Reactor Netty metrics: reactor.netty.connection.provider. Log with doOnNext sparingly in prod.',
    trap:
      'WebClient in @RestController MVC with .block() — interviewer expects “use RestClient.” Staff: explain event loop vs thread-per-request.',
    interviewAnswer:
      'WebClient runs on Reactor Netty event loops — non-blocking I/O with Mono/Flux composition. I configure ConnectionProvider limits, responseTimeout, and parallel zip for fan-out. In servlet MVC I use RestClient; WebClient only in WebFlux where the stack is reactive end-to-end.',
    remember: [
      'ConnectionProvider maxConnections + pendingAcquire',
      'responseTimeout on HttpClient',
      'zip() for parallel calls',
      'Never block event loop',
    ],
    oneLiner: 'WebClient — event-loop HTTP; configure pool, never block.',
    tables: [
      {
        headers: ['Operator', 'Use', 'Trap'],
        rows: [
          ['flatMap', 'Chain dependent calls', 'Sequential not parallel'],
          ['zip / zipWith', 'Parallel independent calls', 'One failure fails all'],
          ['timeout', 'Per-call deadline', 'Must set on each chain'],
          ['retryWhen', 'Transient failures', 'Only idempotent'],
          ['onErrorResume', 'Fallback', 'Hide real errors if careless'],
        ],
      },
      {
        headers: ['Pool setting', 'Purpose'],
        rows: [
          ['maxConnections', 'Cap open sockets'],
          ['pendingAcquireMaxCount', 'Queue limit when pool full'],
          ['maxIdleTime', 'Close idle connections'],
          ['responseTimeout', 'Read timeout equivalent'],
          ['CONNECT_TIMEOUT_MILLIS', 'TCP connect fail-fast'],
        ],
      },
    ],
  },
  {
    id: 'openfeign-deep',
    title: 'OpenFeign — declarative HTTP proxy',
    what:
      'Spring Cloud OpenFeign generates JDK dynamic proxy at runtime from @FeignClient interface. Maps method annotations (@GetMapping, @PostMapping) to HTTP requests. Pipeline: MethodHandler → SynchronousMethodHandler → Client (LoadBalancerFeignClient → Apache HttpClient).',
    why:
      'Eliminates boilerplate URL construction. Interface mirrors REST API — easy WireMock tests. Native Spring Cloud LoadBalancer and circuit breaker integration.',
    when:
      'Spring Cloud microservices with multiple REST integrations. Teams prefer interface-driven design. Existing Feign ecosystem (fallbacks, request interceptors).',
    how:
      `@FeignClient(name = "payment-service", path = "/api/v1",
    configuration = PaymentFeignConfig.class,
    fallbackFactory = PaymentClientFallbackFactory.class)
public interface PaymentClient {
  @PostMapping("/payments")
  PaymentResponse create(@RequestBody CreatePaymentRequest req);

  @GetMapping("/payments/{id}")
  PaymentResponse get(@PathVariable String id);
}

// PaymentFeignConfig.java
@Configuration
public class PaymentFeignConfig {
  @Bean
  RequestInterceptor traceInterceptor() {
    return template -> template.header("traceparent", TraceContext.current());
  }
  @Bean
  Logger.Level feignLoggerLevel() { return Logger.Level.BASIC; }
}

// application.yml
// feign.client.config.payment-service.connectTimeout: 500
// feign.client.config.payment-service.readTimeout: 2000`,
    flow: `flowchart TD
  Call[paymentClient.create req] --> Proxy[JDK Proxy]
  Proxy --> MH[Feign MethodHandler]
  MH --> RT[Build RequestTemplate]
  RT --> RI[RequestInterceptors auth/trace]
  RI --> Enc[Encoder Jackson]
  Enc --> Client[LoadBalancerFeignClient]
  Client --> LB[Spring Cloud LoadBalancer]
  LB --> HTTP[Apache HttpClient 5]
  HTTP --> Dec[Decoder]
  Dec --> Resp[PaymentResponse]`,
    failure:
      'Interface out of sync with server — runtime 404. No fallback → exception propagates. Default Logger FULL logs bodies with PII. Too many @FeignClient beans without per-client config — all share defaults.',
    tradeoff:
      'Pros: concise, LB built-in, testable interface. Cons: proxy indirection, harder step-debug than RestClient, HTTP/1.1 default.',
    security:
      'OAuth2AccessTokenInterceptor or custom RequestInterceptor. Never log Authorization header. Feign + @PreAuthorize does not apply — server-side only.',
    observability:
      'Micrometer capability on Feign. spring.cloud.openfeign.micrometer.enabled=true. Custom Capability for baggage.',
    trap:
      'Feign fallback that silently returns null — masks outages; log and metric fallback invocations. Staff: Feign vs RestClient — Feign for declarative + LB; RestClient for explicit control.',
    interviewAnswer:
      'OpenFeign turns an interface into a LoadBalancer-aware HTTP proxy. I configure per-client connect/read timeouts, RequestInterceptor for trace + OAuth, ErrorDecoder for 4xx mapping, and FallbackFactory for circuit-open degradation. Contract tests with WireMock catch interface drift.',
    remember: [
      'JDK proxy at startup',
      'Per-client yaml timeout config',
      'FallbackFactory not silent swallow',
      'Contract tests with WireMock',
    ],
    oneLiner: 'OpenFeign — interface proxy with LB; per-client timeouts + fallbacks.',
    tables: [
      {
        headers: ['Component', 'Role'],
        rows: [
          ['@FeignClient', 'Declares target service name + path'],
          ['RequestInterceptor', 'Auth, trace, custom headers'],
          ['Encoder/Decoder', 'Jackson JSON serialization'],
          ['ErrorDecoder', 'Map HTTP status to exceptions'],
          ['FallbackFactory', 'Circuit open / error path'],
          ['LoadBalancerFeignClient', 'Resolve service → instance IP'],
        ],
      },
      {
        headers: ['Feign', 'RestClient', 'Pick Feign when'],
        rows: [
          ['API', 'Interface', 'Fluent builder', 'Many similar REST clients'],
          ['LB', 'Built-in', 'Manual/@LoadBalanced', 'Spring Cloud stack'],
          ['Boilerplate', 'Minimal', 'More per call', 'Interface-first teams'],
          ['Debug', 'Harder', 'Easier', '—'],
        ],
      },
    ],
  },
  {
    id: 'resttemplate-legacy',
    title: 'RestTemplate (legacy — migrate to RestClient)',
    what:
      'Spring’s original synchronous HTTP client (since Spring 3). Template methods: getForObject, postForEntity, exchange. Uses ClientHttpRequestFactory (SimpleClientHttpRequestFactory, HttpComponentsClientHttpRequestFactory). Still present in Boot 3 but deprecated path — RestClient is the successor.',
    why:
      'Massive existing codebase usage. Third-party libs still document RestTemplate examples. Understanding it matters for brownfield maintenance and migration interviews.',
    when:
      'Legacy code maintenance only. New code → RestClient. Migration sprint: wrap RestTemplate calls behind repository interface, swap implementation to RestClient.',
    how:
      `@Bean
@Deprecated
RestTemplate restTemplate() {
  HttpComponentsClientHttpRequestFactory factory =
      new HttpComponentsClientHttpRequestFactory();
  factory.setConnectTimeout(500);
  factory.setConnectionRequestTimeout(500);
  factory.setReadTimeout(2000);
  PoolingHttpClientConnectionManager cm = new PoolingHttpClientConnectionManager();
  cm.setMaxTotal(200);
  cm.setDefaultMaxPerRoute(50);
  CloseableHttpClient httpClient = HttpClients.custom().setConnectionManager(cm).build();
  factory.setHttpClient(httpClient);
  RestTemplate rt = new RestTemplate(factory);
  rt.getInterceptors().add(traceInterceptor);
  return rt;
}`,
    flow: `sequenceDiagram
  participant S as Service
  participant RT as RestTemplate
  participant F as HttpComponentsClientHttpRequestFactory
  participant P as PoolingHttpClientConnectionManager
  participant D as Downstream
  S->>RT: exchange(url, POST, entity, Class)
  RT->>F: createRequest
  F->>P: lease connection from pool
  P->>D: HTTP
  D-->>S: ResponseEntity`,
    failure:
      'RestTemplate is not thread-safe for modification after init but safe to share if configured once. Default SimpleClientHttpRequestFactory creates new connection per request — no pooling. URI template injection vulnerabilities if user input in path. Deprecated patterns copied from Stack Overflow without timeouts.',
    tradeoff:
      'Pros: familiar, vast examples online. Cons: deprecated trajectory, less fluent than RestClient, easy to misconfigure pooling.',
    security:
      'Same as RestClient — use interceptors for auth. validate URIs. Upgrade off SimpleClientHttpRequestFactory in prod.',
    observability:
      'ClientHttpRequestInterceptor for trace. RestTemplateCustomizer in Boot. Migrate to RestClient Observation API.',
    trap:
      'Interview trap: “Which HTTP client in Boot 3?” — RestClient, not RestTemplate. Another: new RestTemplate() per call with no pool.',
    interviewAnswer:
      'RestTemplate is legacy; Boot 3 recommends RestClient with the same HttpClient 5 pooling underneath. In brownfield I migrate behind an interface: PaymentGateway port with RestTemplate adapter, then swap to RestClient without changing business code. Never start new code with RestTemplate.',
    remember: [
      'Legacy — migrate to RestClient',
      'Must configure pooling factory',
      'Share single bean instance',
      'URI template injection risk',
    ],
    oneLiner: 'RestTemplate — legacy; migrate to RestClient with same pool config.',
    tables: [
      {
        headers: ['Aspect', 'RestTemplate', 'RestClient'],
        rows: [
          ['Boot 3 status', 'Legacy/maintain', 'Recommended'],
          ['API style', 'getForObject/postForEntity', 'Fluent get/post/retrieve'],
          ['Error handling', 'Manual status check', 'onStatus() handlers'],
          ['Observation', 'Interceptor', 'Native ObservationRegistry'],
          ['Underlying client', 'Apache/JDK factory', 'HttpClient 5 default'],
        ],
      },
      {
        headers: ['When to pick', 'Client', 'Reason'],
        rows: [
          ['New Boot 3 MVC service', 'RestClient', 'Official default, fluent'],
          ['WebFlux reactive app', 'WebClient', 'Non-blocking'],
          ['Spring Cloud LB + interface', 'OpenFeign', 'Declarative + LB'],
          ['Legacy maintenance', 'RestTemplate', 'Migrate when touching'],
          ['High-perf internal RPC', 'gRPC stub', 'Binary HTTP/2'],
        ],
      },
      {
        headers: ['Connection pooling', 'Without pool', 'With pool'],
        rows: [
          ['TCP per request', 'New handshake each', 'Reused connections'],
          ['TLS cost', 'Every call', 'Amortized'],
          ['Latency', 'Higher p99', 'Lower p99'],
          ['Factory', 'SimpleClientHttpRequestFactory', 'HttpComponentsClientHttpRequestFactory / HttpClient 5'],
        ],
      },
    ],
  },
];
