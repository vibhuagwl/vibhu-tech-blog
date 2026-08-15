import type {AnnotationCard} from './types';

export const ECOSYSTEM: AnnotationCard[] = [
  {
    id: 'refresh-scope',
    annotation: '@RefreshScope',
    family: 'ecosystem-cloud',
    what:
      '@Target(TYPE|METHOD) Spring Cloud Context annotation marking a bean as refreshable. Registers the bean in the RefreshScope (a custom Scope implementation) with a scoped proxy (default TARGET_CLASS CGLIB). On /actuator/refresh, ContextRefresher.publish RefreshScopeRefreshedEvent, RefreshScope.destroy() clears cached instances; next access creates a new bean with updated Environment properties. Commonly paired with @ConfigurationProperties for dynamic config from Config Server or Kubernetes ConfigMap reload.',
    why:
      'Microservices need runtime config updates without full JVM restart — feature flags, connection strings, rate limits. @RefreshScope recreates only annotated beans behind a proxy so singletons injecting the proxy see updated values on next method call. Critical interview trap: singleton holding direct reference to refresh bean stays stale forever.',
    example: `@RefreshScope
@ConfigurationProperties(prefix = "payments.limits")
public class PaymentLimits {
  private BigDecimal maxAmount;
  // getters/setters
}

@Service
public class PaymentValidator {
  private final PaymentLimits limits; // MUST be injected proxy

  public PaymentValidator(PaymentLimits limits) {
    this.limits = limits;
  }

  public void validate(BigDecimal amount) {
    if (amount.compareTo(limits.getMaxAmount()) > 0) {
      throw new LimitExceededException();
    }
  }
}

// Trigger: POST /actuator/refresh (or Spring Cloud Bus broadcast)`,
    processor:
      'RefreshScope implements Scope — registered via @EnableRefreshScope or auto-config (spring-cloud-context). ScopedProxyFactoryBean creates CGLIB scoped proxy at bean registration. ContextRefresher (actuator endpoint or Cloud Bus listener) calls RefreshScope.refreshAll() / destroy bean names. ConfigurationPropertiesRebinder may rebind @ConfigurationProperties beans. NOT a BeanPostProcessor — scope + proxy factory pattern.',
    when:
      'Spring Cloud Config clients, dynamic toggles, connection pool sizes that can change without redeploy. Avoid on heavy stateful beans (large caches) unless recreation cost is acceptable. Prefer Kubernetes rolling restart for security-critical secrets.',
    flow: `@RefreshScope lifecycle:
1. BeanDefinition registered with scope name "refresh"
2. ScopedProxyFactoryBean creates CGLIB proxy injected into dependents
3. First access → target instance created with current Environment
4. POST /actuator/refresh → ContextRefresher.refresh()
5. RefreshScopeRefreshedEvent published
6. RefreshScope.destroy() removes cached target instances
7. Next proxy.get() → new target with updated @ConfigurationProperties binding`,
    lifecycle:
      'Target instance lives between refresh events. Destroyed synchronously on refresh. Proxy singleton in ApplicationContext is stable — only target recreated.',
    proxy:
      'Yes — CGLIB scoped proxy required. Singleton @Autowired field receives proxy. Direct field assignment to non-proxied instance = stale config bug.',
    runtime:
      'Requires spring-cloud-context on classpath. Boot 2.4+ uses spring.config.import instead of bootstrap.yml for config trees. Refresh is explicit event — not automatic on every property change unless Config Server push + Bus.',
    failure:
      'Singleton caches @RefreshScope bean in field — config never updates. Missing scoped proxy when injected into non-singleton incorrectly. Refresh recreates bean mid-request causing inconsistent reads. @RefreshScope on @Bean method without proxy mode.',
    debug:
      'Log RefreshScopeRefreshedEvent. DEBUG org.springframework.cloud.context.scope. Verify injected type is proxy ($$EnhancerBySpringCGLIB$$). Actuator /refresh response lists refreshed keys. Check ConfigurationPropertiesRebinder logs.',
    production:
      'Inject scoped proxy only; never store in static fields. Document which beans are refresh-safe (stateless config holders yes; connection pools maybe). Pair with Spring Cloud Bus for cluster-wide refresh. For secrets prefer external secret rotation + pod restart.',
    mistakes: [
      'Singleton @Autowired direct ref to @RefreshScope bean — stale after refresh',
      'Expecting @Value fields on non-refresh bean to update',
      'Putting @RefreshScope on high-cost initialization bean',
      'Forgetting @EnableRefreshScope / spring-cloud-context dependency',
    ],
    traps: [
      'Interview: @RefreshScope = scoped proxy + destroy/recreate on refresh',
      'Proxy injection vs direct reference — classic Cloud production bug',
      'RefreshScope is NOT @RequestScope — tied to refresh event not HTTP request',
      'Works with @ConfigurationProperties rebinding',
    ],
    answer15s:
      '@RefreshScope puts a bean in a special Cloud scope behind a CGLIB proxy; /actuator/refresh destroys and recreates the target so new config binds — inject the proxy, never cache the target in a singleton field.',
    answer60s:
      'RefreshScope registers a scoped proxy. ContextRefresher triggers destroy of cached instances on refresh event. Next access builds new bean with updated Environment — typical for @ConfigurationProperties feature flags. Singleton holding direct reference stays stale. Requires spring-cloud-context. Contrast full context restart vs targeted refresh.',
    answer3m:
      'Deep: Scope implementation in spring-cloud-context. ScopedProxyFactoryBean at registration. ContextRefresher coordinates Environment change publication and RefreshScope.destroy. ConfigurationPropertiesRebinder. Bus broadcast. Pitfalls: stale singleton refs, mid-flight inconsistency, recreation cost. vs Kubernetes ConfigMap reload. vs @ConfigurationProperties without refresh — static after startup. Production: stateless config beans only; secrets via vault. Debug proxy class name. Pair with @ConditionalOnProperty for feature flags.',
    memory: '@REFRESH_SCOPE = scoped CGLIB proxy; refresh destroys target; inject proxy not direct ref.',
    tables: [
      {
        headers: ['Pattern', 'Updates on refresh?', 'Trap'],
        rows: [
          ['@RefreshScope @ConfigurationProperties', 'Yes — new target', 'Singleton direct ref stale'],
          ['@Value on regular bean', 'No', 'Needs restart or @RefreshScope'],
          ['Kubernetes rollout', 'Yes — new pod', 'Slower than /refresh'],
        ],
      },
    ],
  },
  {
    id: 'feign-client',
    annotation: '@FeignClient',
    family: 'ecosystem-cloud',
    what:
      '@Target(TYPE) on interface declares a declarative HTTP client. @EnableFeignClients on @Configuration triggers FeignClientsRegistrar scanning interfaces. Feign builds JDK dynamic proxy implementing the interface — each method maps to HTTP request via SpringMvcContract or default Contract. Attributes: name/value (service id), url (absolute bypass discovery), path, configuration, fallback/fallbackFactory. Spring Cloud OpenFeign integrates LoadBalancer for service name resolution.',
    why:
      'Avoid boilerplate RestTemplate/WebClient code for inter-service calls. Centralize URL construction, headers, error decoding. LoadBalancer resolves logical service name to instance. Fallback for resilience. Interview: Feign proxy is NOT Spring AOP — separate invocation handler; does NOT join local @Transactional.',
    example: `@EnableFeignClients(basePackages = "com.acme.payments.client")
@SpringBootApplication
public class PaymentsApplication {}

@FeignClient(name = "ledger-service", path = "/api/v1")
public interface LedgerClient {
  @GetMapping("/accounts/{id}")
  AccountDto getAccount(@PathVariable String id);

  @PostMapping("/entries")
  void postEntry(@RequestBody LedgerEntry entry);
}

@Service
public class CaptureService {
  private final LedgerClient ledger;

  @Transactional
  public void capture(Payment p) {
    paymentRepo.save(p);
    ledger.postEntry(toEntry(p)); // HTTP — separate boundary
  }
}`,
    processor:
      'FeignClientsRegistrar (ImportBeanDefinitionRegistrar) registers FeignClientFactoryBean per @FeignClient interface. FactoryBean creates Feign.Builder proxy at bean creation. Spring Cloud LoadBalancerFeignClient wraps HTTP client for name resolution. Contract maps annotations to RequestTemplate. Encoder/Decoder from Spring message converters. NOT processed by AnnotationAwareAspectJAutoProxyCreator.',
    when:
      'Sync HTTP calls between microservices with service discovery. Prefer @HttpExchange (Spring 6) for new greenfield without Cloud. Use url= for fixed external APIs. fallbackFactory for circuit-open responses.',
    flow: `Feign call pipeline:
1. Inject LedgerClient (JDK proxy)
2. ledger.postEntry(entry) invoked
3. Feign invocation handler builds RequestTemplate from @PostMapping metadata
4. LoadBalancer chooses ledger-service instance
5. HTTP client executes POST
6. Decoder maps response / throws FeignException
7. Local @Transactional already committed or not — independent TX`,
    lifecycle:
      'Feign client bean singleton for application lifetime. Proxy created once at context refresh. Configuration beans (@Configuration in FeignClient.configuration) per client.',
    proxy:
      'JDK dynamic proxy (Feign) — not CGLIB Spring AOP. Resilience4j @CircuitBreaker can wrap call if configured on method or via custom invocation handler.',
    runtime:
      'Timeouts via feign.client.config.*. Retry via Retryer bean or Resilience4j. OAuth2 interceptors via RequestInterceptor @Bean. Micrometer metrics when enabled.',
    failure:
      '404 vs decode error — wrong path mapping. LoadBalancer no instances — No servers available. Serialization mismatch JSON. @FeignClient not scanned — missing @EnableFeignClients. Blocking Feign in WebFlux event loop thread.',
    debug:
      'DEBUG feign.Logger FULL for request/response. logging.level.com.acme.client=DEBUG. Verify service registration. Stack shows feign.ReflectiveFeign not Spring AOP proxy.',
    production:
      'Set connect/read timeouts. Idempotent retries only on GET. Circuit breaker + bulkhead. Propagate trace headers via RequestInterceptor. Do not assume TX propagation across HTTP.',
    mistakes: [
      'Expecting @Transactional to roll back remote Feign call',
      'Missing @EnableFeignClients scan package',
      'Using Feign in reactive chain without bounded elastic scheduler',
      'Duplicate @FeignClient name without contextId',
    ],
    traps: [
      'Interview: Feign = JDK proxy, NOT Spring TX AOP proxy',
      'name resolves via LoadBalancer when url omitted',
      'SpringMvcContract shares annotation semantics with @RestController',
      '@HttpExchange is Spring-native alternative Boot 3.2+',
    ],
    answer15s:
      '@FeignClient declares an HTTP client interface; FeignClientsRegistrar registers a JDK Feign proxy — not Spring AOP — resolved via LoadBalancer by service name.',
    answer60s:
      '@EnableFeignClients triggers FeignClientsRegistrar. Each interface becomes FeignClientFactoryBean producing JDK proxy. Methods map to HTTP via Contract. LoadBalancer picks instance for name=. Independent of local @Transactional. Configure timeouts, RequestInterceptor, fallbackFactory. Cloud OpenFeign starter required.',
    answer3m:
      'Registrar scans @FeignClient. FactoryBean builds Feign with Encoder/Decoder/Contract/Client. LoadBalancerFeignClient vs url=. FallbackFactory vs Fallback. Contrast RestTemplate @LoadBalanced blocking. Contrast WebClient reactive. Resilience4j integration. OAuth2 propagation. Pitfalls: TX boundary, reactive blocking, decode errors. vs @HttpExchange HttpServiceProxyFactory native Spring 6. Production observability headers.',
    memory: '@FEIGN_CLIENT = JDK Feign proxy; NOT Spring AOP; HTTP ≠ local TX.',
  },
  {
    id: 'load-balanced',
    annotation: '@LoadBalanced',
    family: 'ecosystem-cloud',
    what:
      '@Qualifier-style annotation on @Bean RestTemplate, RestTemplateBuilder, WebClient.Builder, or ReactiveLoadBalancerExchangeFilterFunction. Marks client beans for Spring Cloud LoadBalancer interceptor — replaces deprecated Netflix Ribbon. LoadBalancerClient chooses service instance from registry (Eureka, Consul, Kubernetes discovery) for URLs using logical host name (http://payment-service/...).',
    why:
      'Client-side load balancing across microservice instances without hardcoding IPs. Pairs with service discovery registration (@EnableDiscoveryClient). Interview trap: blocking @LoadBalanced RestTemplate in WebFlux reactive app blocks event loop.',
    example: `@Configuration
public class ClientConfig {
  @Bean
  @LoadBalanced
  public RestTemplate restTemplate() {
    return new RestTemplate();
  }

  @Bean
  @LoadBalanced
  public WebClient.Builder loadBalancedWebClientBuilder() {
    return WebClient.builder();
  }
}

@Service
public class OrderService {
  private final RestTemplate rest;

  public OrderDto fetchOrder(String id) {
    // payment-service resolved by LoadBalancer
    return rest.getForObject(
        "http://payment-service/api/orders/" + id,
        OrderDto.class);
  }
}`,
    processor:
      'LoadBalancerAutoConfiguration registers LoadBalancerInterceptor (RestTemplate) or ReactorLoadBalancerExchangeFilterFunction (WebClient) when @LoadBalanced bean detected. LoadBalancerClientFactory provides per-service ReactorLoadBalancer. BlockingRestTemplateClientHttpRequestInterceptor wraps requests. NOT annotation processor — marker on @Bean method for custom LoadBalancerAnnotationBeanPostProcessor / Boot auto-config.',
    when:
      'Blocking inter-service HTTP with service discovery. Prefer WebClient @LoadBalanced for reactive stacks. For Feign, LoadBalancer integrated inside Feign Client automatically.',
    flow: `RestTemplate @LoadBalanced call:
1. rest.getForObject("http://order-service/api/...")
2. LoadBalancerInterceptor intercepts URI with logical host order-service
3. LoadBalancerClient.choose(order-service) → ServiceInstance host:port
4. Reconstruct physical URI http://10.0.1.5:8080/api/...
5. Execute HTTP request`,
    lifecycle:
      'LoadBalancer bean singleton. Service instance list updated on heartbeat from discovery client. Cached instance selection per request (RoundRobin default).',
    proxy:
      'No proxy on RestTemplate itself — interceptor modifies outgoing URI. Distinct from Feign JDK proxy.',
    runtime:
      'Spring Cloud LoadBalancer replaces Ribbon. Kubernetes discovery often uses spring-cloud-kubernetes. Without discovery, configure simple DiscoveryClient with static list.',
    failure:
      'No servers available for service — empty registry or wrong service name. Blocking RestTemplate on reactive thread. Missing @LoadBalanced — connects to literal host "payment-service" DNS failure.',
    debug:
      'DEBUG org.springframework.cloud.loadbalancer. Verify DiscoveryClient instances. Test with fixed url bypass to isolate LB vs service bug.',
    production:
      'Prefer WebClient with timeouts in reactive services. Retry idempotent GET with Resilience4j. Health check instance filtering. Migrate from Ribbon properties to spring.cloud.loadbalancer.*.',
    mistakes: [
      'Forgetting @LoadBalanced on RestTemplate bean',
      'Blocking RestTemplate in @RestController WebFlux',
      'Assuming Feign needs separate @LoadBalanced',
      'Using IP literal in URI when LB expected',
    ],
    traps: [
      'Interview: @LoadBalanced = client-side LB interceptor on RestTemplate/WebClient',
      'Ribbon removed — Spring Cloud LoadBalancer only',
      'Logical hostname in URI is service id not DNS name',
      'Feign has built-in LB — no @LoadBalanced on Feign interface',
    ],
    answer15s:
      '@LoadBalanced marks a RestTemplate or WebClient.Builder bean so Spring Cloud LoadBalancer rewrites logical service hostnames to discovered instance IPs.',
    answer60s:
      'LoadBalancerAutoConfiguration adds interceptor to @LoadBalanced RestTemplate. URI host payment-service resolved via LoadBalancerClient.choose. Replaces Ribbon. WebClient uses exchange filter. Do not use blocking client on reactive threads. Feign integrates LB internally.',
    answer3m:
      'Marker annotation for client beans. LoadBalancerInterceptor vs ReactorLoadBalancerExchangeFilterFunction. ServiceInstanceListSupplier from discovery. RoundRobinLoadBalancer default. K8s vs Eureka. Contrast hardcoded URL, API Gateway server-side LB. Pitfalls: blocking in WebFlux, empty registry. Production retries and timeouts. vs @FeignClient name resolution same LB stack.',
    memory: '@LOAD_BALANCED = LB interceptor on RestTemplate/WebClient; logical host → instance.',
  },
  {
    id: 'enable-batch-step-scope',
    annotation: '@EnableBatchProcessing · @StepScope',
    family: 'ecosystem-batch',
    what:
      '@EnableBatchProcessing on @Configuration enables Spring Batch infrastructure: JobRepository, JobLauncher, JobBuilderFactory/StepBuilderFactory (older) or Job/Step @Bean builders (Boot 3). @StepScope on @Bean step components (ItemReader, ItemProcessor, ItemWriter, tasklet) creates scoped proxy — bean instantiated per StepExecution with late-bound job parameters injected via SpEL @Value("#{jobParameters[fileName]}").',
    why:
      'Batch jobs process large volumes with restart metadata in JobRepository. @StepScope allows singleton Job @Bean to reference step components that need per-run job parameters without prototype pollution. Chunk-oriented steps run in transaction boundaries per chunk.',
    example: `@Configuration
@EnableBatchProcessing
public class ReconciliationBatchConfig {

  @Bean
  public Job reconciliationJob(JobRepository repo, PlatformTransactionManager tx) {
    return new JobBuilder("reconciliationJob", repo)
        .start(importStep(repo, tx))
        .build();
  }

  @Bean
  public Step importStep(JobRepository repo, PlatformTransactionManager tx) {
    return new StepBuilder("importStep", repo)
        .<PaymentRow, PaymentRow>chunk(100, tx)
        .reader(reader(null))
        .processor(processor())
        .writer(writer())
        .build();
  }

  @Bean
  @StepScope
  public FlatFileItemReader<PaymentRow> reader(
      @Value("#{jobParameters['inputFile']}") String inputFile) {
    return new FlatFileItemReaderBuilder<PaymentRow>()
        .name("paymentReader")
        .resource(new FileSystemResource(inputFile))
        .delimited()
        .names("id", "amount")
        .targetType(PaymentRow.class)
        .build();
  }
}`,
    processor:
      '@EnableBatchProcessing imports BatchConfigurationSelector → Batch infrastructure @Configuration. JobRepository persists JobExecution/StepExecution to DB. @StepScope: org.springframework.batch.core.scope.StepScope registered; ScopedProxyFactoryBean creates proxy; bean created on first access per step execution with job parameters in scope context. Chunk step: TransactionInterceptor per chunk boundary.',
    when:
      'File imports, ETL, end-of-day reconciliation, payment settlement batches. spring.batch.job.enabled=false in web apps to prevent accidental job launch on startup.',
    flow: `Job launch with @StepScope:
1. JobLauncher.run(job, jobParameters)
2. StepExecution created — StepScope context populated with jobParameters
3. @StepScope reader proxy accessed — target FlatFileItemReader created with inputFile param
4. Chunk loop: read → process → write in TX
5. Step completes — StepScope cleared
6. Job restart reads EXECUTION_CONTEXT from JobRepository`,
    lifecycle:
      '@StepScope bean: one logical instance per StepExecution. Job metadata persisted across JVM restarts. @EnableBatchProcessing infra beans application-scoped singletons.',
    proxy:
      '@StepScope uses scoped proxy (TARGET_CLASS CGLIB) — Job @Bean references reader bean name; proxy resolves correct step-scoped target per execution.',
    runtime:
      'Boot 3: BatchAutoConfiguration may provide infra without explicit @EnableBatchProcessing when spring-batch on classpath. Partitioning for remote steps. Skip/limit policies on chunk.',
    failure:
      'Job runs on web app startup — spring.batch.job.enabled default. JobRepository wrong DataSource. @StepScope without job parameter — SpEL null. Chunk skip swallows errors.',
    debug:
      'logging.level.org.springframework.batch=DEBUG. Query BATCH_JOB_EXECUTION, BATCH_STEP_EXECUTION tables. Verify jobParameters passed to JobLauncher.run.',
    production:
      'Separate batch worker service. Idempotent writers. Partition for scale. Disable auto-start in API services. Monitor step failure exit codes.',
    mistakes: [
      'Missing @StepScope on reader using jobParameters',
      'Running batch job unintentionally on web startup',
      'Non-transactional writer in chunk step',
      'Prototype scope instead of @StepScope for step beans',
    ],
    traps: [
      'Interview: @StepScope = per StepExecution scoped proxy with jobParameters',
      '@EnableBatchProcessing registers JobRepository + JobLauncher',
      'Boot 3 Job/Step built with JobBuilder/StepBuilder not deprecated factories',
      'Chunk TX per chunk not per file line',
    ],
    answer15s:
      '@EnableBatchProcessing wires Batch infrastructure; @StepScope creates per-step scoped proxies so ItemReaders bind jobParameters at runtime.',
    answer60s:
      'BatchConfigurationSelector imports JobRepository, JobLauncher. Jobs as @Bean with Steps chunk-oriented. @StepScope on reader/writer beans — scoped proxy, SpEL jobParameters injection. Restart from JobRepository. Boot 3 builder API. Disable auto job in web apps.',
    answer3m:
      'Infrastructure beans. Job/Step model. Chunk transaction boundaries. @StepScope vs prototype. Partitioning. Skip/retry policies. JobRepository schema. vs Kafka streaming primary pattern. Production worker separation. Pitfalls: startup launch, missing params. Debug BATCH_* tables.',
    memory: '@ENABLE_BATCH + @StepScope = JobRepository infra + per-step jobParameter proxy.',
  },
  {
    id: 'service-activator',
    annotation: '@ServiceActivator · Spring Integration (overview)',
    family: 'ecosystem-integration',
    what:
      'Spring Integration EIP annotations on @Bean methods: @ServiceActivator connects a MessageChannel input to a method handler; @InboundChannelAdapter, @OutboundChannelAdapter, @Transformer, @Filter, @Router, @Splitter, @Aggregator compose messaging pipelines. @EnableIntegration registers Integration infrastructure — MessageChannel beans, MessageHandler endpoints, channel interceptors. Message<?> payload flows through declared channels (direct, queue, publishSubscribe).',
    why:
      'Enterprise integration patterns — file polling, JMS, FTP, email, splitting batch messages, routing by header — without bespoke threading glue. @ServiceActivator is the workhorse: method signature accepts Message<T>, payload type, or @Header/@Payload parameters.',
    example: `@Configuration
@EnableIntegration
public class PaymentFileIntegration {

  @Bean
  public MessageChannel paymentFileChannel() {
    return new DirectChannel();
  }

  @ServiceActivator(inputChannel = "paymentFileChannel")
  public void processPaymentFile(Message<File> message) {
    File file = message.getPayload();
    batchImportService.importFrom(file);
  }

  @Bean
  @InboundChannelAdapter(channel = "paymentFileChannel", poller = @Poller(fixedDelay = "5000"))
  public MessageSource<File> filePoller() {
    FileReadingMessageSource source = new FileReadingMessageSource();
    source.setDirectory(new File("/incoming/payments"));
    return source;
  }
}`,
    processor:
      '@EnableIntegration → IntegrationRegistrar registers endpoint parsers. ServiceActivatorAnnotationPostProcessor scans @ServiceActivator, registers MethodInvokingMessageProcessor on IntegrationConsumerEndpoint. Channels as BeanFactory beans. Pollers use TaskScheduler. NOT Spring AOP — messaging endpoint invocation on listener thread.',
    when:
      'File-driven imports, legacy JMS bridges, multi-protocol routing, enterprise EIP pipelines. For Kafka-primary apps prefer @KafkaListener; Integration when channel abstraction spans transports.',
    flow: `Integration message flow:
1. InboundChannelAdapter polls file → Message<File> to paymentFileChannel
2. DirectChannel dispatches to subscribed @ServiceActivator endpoint
3. MethodInvokingMessageProcessor reflects processPaymentFile
4. Headers preserved (file name, timestamp)
5. Optional @Transformer downstream on another channel`,
    lifecycle:
      'Endpoints start on context refresh (SmartLifecycle). Pollers scheduled until context shutdown. Channels singleton; messages transient.',
    proxy:
      'No AOP proxy on @ServiceActivator method — invoked by messaging endpoint directly. @Transactional on handler works if bean is proxied separately.',
    runtime:
      'Error channels default for uncaught exceptions. RetryAdvice on poller. Distributed flows via JMS/AMQP channels between JVMs.',
    failure:
      'Wrong inputChannel name — silent no handler. Poller thread exhaustion. Missing @EnableIntegration. Transformer type mismatch.',
    debug:
      'DEBUG org.springframework.integration. WireTap channel for message logging. Actuator integration graph when enabled.',
    production:
      'Idempotent handlers. Dead letter channel. Backpressure on queue channels. Monitor poller lag.',
    mistakes: [
      'Typo in inputChannel string vs @Bean channel name',
      'Heavy processing on poller thread without executor',
      'Mixing Integration and @KafkaListener without clear boundaries',
      'No error channel — lost failed messages',
    ],
    traps: [
      'Interview: @ServiceActivator = MessageHandler endpoint on a channel',
      '@EnableIntegration required for annotation endpoints',
      'DirectChannel synchronous — same thread as caller',
      'Different from @EventListener ApplicationEvent',
    ],
    answer15s:
      '@ServiceActivator wires a method as a MessageHandler on an input MessageChannel; @EnableIntegration registers the Integration endpoint infrastructure.',
    answer60s:
      'Spring Integration EIP model. @ServiceActivator inputChannel matches @Bean MessageChannel. Poller-driven adapters produce Messages. MethodInvokingMessageProcessor invokes handler. Contrast ApplicationEvent @EventListener. Used for file/JMS bridges; Kafka apps often use @KafkaListener instead.',
    answer3m:
      'EnableIntegration registrar. Channel types direct/queue/publishSubscribe. Adapter/poller pattern. Transformer/router/splitter annotations overview. Error channel. vs Kafka listener containers. Production idempotency. Not every EIP annotation deep-dived in this hub — inventory + this overview for interview breadth.',
    memory: '@SERVICE_ACTIVATOR = channel → method handler; @EnableIntegration wires EIP pipeline.',
  },
  {
    id: 'enable-redis-http-session',
    annotation: '@EnableRedisHttpSession',
    family: 'ecosystem-session',
    what:
      '@Target(TYPE) on @Configuration enables Spring Session with Redis backend. Replaces default servlet container HTTP session with SessionRepository backed by Redis — session id cookie maps to Redis hash. Attributes: maxInactiveIntervalInSeconds, redisNamespace, flushMode (ON_SAVE vs IMMEDIATE). Works with Spring Security — SecurityContext stored in distributed session for horizontal scale-out of stateful web apps.',
    why:
      'Sticky sessions break when scaling pods; Redis session shares SecurityContext and cart state across instances. Interview: understand session id cookie, Redis key layout, and serialization of session attributes.',
    example: `@Configuration
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 1800)
public class SessionConfig {}

// application.yml
// spring.session.redis.namespace: payments:session

@RestController
public class CartController {
  @GetMapping("/cart/count")
  public int count(HttpSession session) {
    Cart cart = (Cart) session.getAttribute("cart");
    return cart == null ? 0 : cart.size();
  }
}`,
    processor:
      '@EnableRedisHttpSession imports RedisHttpSessionConfiguration — registers SessionRepository Filter (SessionRepositoryFilter) early in servlet filter chain before Spring Security. RedisIndexedSessionRepository persists MapSession to Redis. Spring Session replaces HttpSession implementation via wrapper. Auto-config when spring-session-data-redis on classpath may reduce need for explicit annotation.',
    when:
      'Stateful web apps behind load balancer without sticky sessions. BFF with server-side session. Prefer JWT stateless APIs for pure REST microservices — session for browser apps.',
    flow: `Request with distributed session:
1. SessionRepositoryFilter resolves session id from cookie SESSION
2. Redis GET session key → MapSession attributes
3. Controller uses HttpSession — delegated to MapSession
4. SecurityContextRepository loads auth into session
5. Response ON_SAVE writes dirty attributes back to Redis`,
    lifecycle:
      'Session TTL from maxInactiveInterval. Redis key expires. Session destroyed on logout or timeout.',
    proxy:
      'No bean proxy — servlet Filter replaces HttpSession implementation per request.',
    runtime:
      'Requires Redis connection. Serialization: JDK default or JSON with custom RedisSerializer. Spring Boot spring.session.store-type=redis.',
    failure:
      'Session lost on deploy — serialization change breaks attributes. Cookie domain/path mismatch. Redis down — all users logged out. Large session objects — Redis memory pressure.',
    debug:
      'Inspect Redis keys spring:session:*. logging.level.org.springframework.session=DEBUG. Verify cookie in browser devtools.',
    production:
      'JSON serialization for version tolerance. Namespace per environment. Monitor Redis memory. Consider stateless JWT for APIs; session for browser SSO flows.',
    mistakes: [
      'Storing non-serializable objects in session',
      'Mixing sticky LB with Spring Session unnecessarily',
      'Huge session attributes — performance',
      'Forgetting spring-session-data-redis dependency',
    ],
    traps: [
      'Interview: Filter replaces HttpSession with Redis-backed MapSession',
      'SecurityContext stored in session for cluster auth',
      '@EnableJdbcHttpSession alternative for RDBMS',
      'Stateless JWT microservices may not need this',
    ],
    answer15s:
      '@EnableRedisHttpSession configures Redis-backed HTTP sessions via SessionRepositoryFilter so multiple app instances share session and SecurityContext.',
    answer60s:
      'Spring Session Redis configuration. Filter wraps request with MapSession loaded from Redis by cookie id. Enables horizontal scale without sticky sessions. maxInactiveInterval and namespace configure TTL and key prefix. Boot auto-config overlap.',
    answer3m:
      'SessionRepositoryFilter ordering vs Security. RedisIndexedSessionRepository structure. Serialization strategies. vs JWT stateless. vs @EnableJdbcHttpSession. Production Redis HA. Pitfalls: attribute serialization, cookie settings. When NOT to use — pure API gateways.',
    memory: '@ENABLE_REDIS_HTTP_SESSION = Redis MapSession via Filter; cluster-safe HttpSession.',
  },
  {
    id: 'business-service-stereotype',
    annotation: '@BusinessService (custom composed stereotype)',
    family: 'ecosystem-custom',
    what:
      'Custom composed annotation pattern: team-defined stereotype stacking @Service (or @Component) with domain semantics, @Transactional defaults, and @AliasFor forwarding to meta-annotations. Example @BusinessService aliases transaction readOnly and rollback rules to @Transactional while marking layer convention for architecture tests (ArchUnit) and consistent pointcuts.',
    why:
      'Encode architectural rules in types — "all @BusinessService in com.acme.domain package are transactional services." @AliasFor propagates attributes to @Transactional and @Service so tooling and Spring metadata see merged annotations. Demonstrates meta-annotation design for interviews.',
    example: `@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Service
@Transactional(readOnly = true)
public @interface BusinessService {
  @AliasFor(annotation = Service.class)
  String value() default "";

  @AliasFor(annotation = Transactional.class, attribute = "readOnly")
  boolean readOnly() default true;

  @AliasFor(annotation = Transactional.class, attribute = "rollbackFor")
  Class<? extends Throwable>[] rollbackFor() default {BusinessException.class};
}

@BusinessService(readOnly = false, rollbackFor = {BusinessException.class, IOException.class})
public class PaymentCaptureService {
  public void capture(Payment p) { /* writes */ }
}`,
    processor:
      'ClassPathBeanDefinitionScanner treats @BusinessService as @Service (meta-annotated @Component). ConfigurationClassPostProcessor registers bean. @Transactional attributes synthesized from @AliasFor merge on class — SpringAnnotationTransactionAttributeSource reads merged @Transactional metadata. ArchUnit can rule: classes annotated @BusinessService must reside in ..service.. package.',
    when:
      'Internal frameworks, multi-module conventions, reducing repeated @Service+@Transactional boilerplate. Document in team ADR — do not over-compose opaque stacks.',
    flow: `Composed stereotype registration:
1. @BusinessService on PaymentCaptureService
2. Scanner sees @Service meta → registers bean definition
3. TransactionAttributeSource merges @Transactional from meta-annotation
4. readOnly=false override on class wins over default true on @interface
5. JDK/CGLIB proxy gets TransactionInterceptor advisor`,
    lifecycle:
      'Same as @Service singleton bean. Annotation metadata consumed at scan and TX advisor creation.',
    proxy:
      '@Transactional on composed annotation → proxy with TransactionInterceptor — same as explicit @Transactional on class.',
    runtime:
      'Annotation present at runtime via reflection. MergedAnnotations.get(BusinessService.class) for framework code.',
    failure:
      'Missing @AliasFor — override on @BusinessService does not reach @Transactional. Meta-annotation not retained RUNTIME. Pointcut @within(BusinessService) misses if retention wrong.',
    debug:
      'AnnotationUtils.getAnnotationAttributes(PaymentCaptureService.class, Transactional.class). ArchUnit test enforcement.',
    production:
      'Keep composed annotations few and documented. IDE support via annotation processor optional. Do not hide security annotations inside opaque composites.',
    mistakes: [
      '@AliasFor pointing to wrong annotation class',
      'Expecting class-level readOnly=false without @AliasFor on attribute',
      'Composing too many concerns into one stereotype',
      'SOURCE retention — scanner ignores annotation',
    ],
    traps: [
      'Interview: composed stereotype = meta-annotations + @AliasFor forwarding',
      'Scanner honors meta-@Service',
      'Transactional attributes merged like @GetMapping → @RequestMapping',
      'ArchUnit enforces layer conventions',
    ],
    answer15s:
      'Custom @BusinessService stacks @Service and @Transactional with @AliasFor so class-level attributes forward to meta-annotations — scanner and TX advisor see merged metadata.',
    answer60s:
      'Composed annotation pattern. Meta-@Service enables component scan. @AliasFor on readOnly/rollbackFor forwards to @Transactional. Override at use site. MergedAnnotations resolution. ArchUnit package rules. Contrast plain @Service.',
    answer3m:
      'Design composed annotations. @AliasFor annotation= attribute= pairs. Scanner meta-annotation support. TransactionAttributeSource synthesis. Retention RUNTIME. Pitfalls: missing aliases. vs @Inherited. Production: limit stereotypes, document. Security annotations stay explicit.',
    memory: 'COMPOSED_STEREOTYPE = meta-@Service + @AliasFor → merged @Transactional.',
  },
  {
    id: 'merged-annotations',
    annotation: 'Meta-annotations · MergedAnnotations',
    family: 'ecosystem-meta',
    what:
      'Spring Framework annotation composition model: meta-annotations (annotations on annotations), @AliasFor attribute forwarding, and MergedAnnotations API (Spring 5.2+) for reading synthesized attribute maps across hierarchy. AnnotationUtils.synthesizeAnnotation merges @GetMapping attributes into @RequestMapping. MergedAnnotations.from(element).get(RequestMapping.class) walks meta-annotation tree. Replaces older AnnotationUtils.getAnnotation deep search patterns.',
    why:
      'Framework and custom composed annotations require predictable attribute merge for conditions, MVC mappings, and @Transactional defaults. Interview staff question: how @GetMapping("/x") populates RequestMapping.path — answer is MergedAnnotations + @AliasFor, not Java language feature.',
    example: `// Framework internal usage pattern
MergedAnnotations merged = MergedAnnotations.from(handlerMethod.getMethod());
MergedAnnotation<RequestMapping> mapping = merged.get(RequestMapping.class);
String[] paths = mapping.getStringArray("path");

// Custom composed
@GetMapping("/payments/{id}")
public Payment get(@PathVariable String id) { }

// Synthesis equivalent:
// RequestMapping.method = [GET], path = ["/payments/{id}"]`,
    processor:
      'MergedAnnotations searches AnnotationMetadata on BeanDefinitions (ConfigurationClassParser), HandlerMethod, Condition context. AnnotationUtils.synthesizeAnnotation builds merged Annotation instance. Used by: RequestMappingHandlerMapping, ConditionEvaluator, TransactionAttributeSource, @BootstrapWith merge. No runtime bean — reflection metadata infrastructure.',
    when:
      'Writing custom @Configuration annotations, debugging why @ConditionalOnProperty name= not binding, understanding MVC mapping resolution, reading composed security annotations.',
    flow: `MergedAnnotations resolution:
1. Start from annotated element (method/class)
2. Collect direct annotations
3. Walk meta-annotation hierarchy on each
4. Apply @AliasFor equivalence classes
5. Build MergedAnnotation with nearest declaration wins for overrides
6. Consumer reads unified attribute map`,
    lifecycle:
      'Evaluated at startup (mapping registration, condition parsing) and on metadata reads. Cached on AnnotatedElement in some code paths.',
    proxy:
      'N/A — metadata only.',
    runtime:
      'MergedAnnotations present in Spring Framework 5.2+. Spring 6 uses throughout codebase. Prefer MergedAnnotations over deprecated AnnotationUtils.getAnnotation for new code.',
    failure:
      'Assuming Java annotation inheritance — annotations NOT inherited subclass to subclass unless @Inherited on annotation type. Wrong @AliasFor annotation= target. Duplicate conflicting attributes without alias.',
    debug:
      'DEBUG org.springframework.core.annotation. Unit test AnnotationUtils.getAnnotationAttributes. Breakpoint RequestMappingHandlerMapping.detectHandlerMethods.',
    production:
      'When publishing composed annotations document @AliasFor pairs. Test attribute forwarding. Use MergedAnnotations in custom starters.',
    mistakes: [
      'Expecting subclass to inherit method annotations without redeclaration',
      'Missing @AliasFor on composed annotation value/path',
      'Using AnnotationUtils.getAnnotation without synthesis for composed types',
      'Conflicting attribute values on annotation and meta-annotation',
    ],
    traps: [
      'Interview: MergedAnnotations + @AliasFor powers composed annotations',
      '@GetMapping path comes from merged @RequestMapping metadata',
      'Annotations not inherited by default in Java',
      'synthesizeAnnotation for test assertions',
    ],
    answer15s:
      'MergedAnnotations merges meta-annotation attributes using @AliasFor — how @GetMapping forwards path to @RequestMapping for handler mapping.',
    answer60s:
      'Spring 5.2+ MergedAnnotations API walks annotation hierarchy on classes/methods. @AliasFor declares attribute equivalence. RequestMappingHandlerMapping, conditions, TX metadata use merged views. Not Java inheritance — explicit meta-annotation stack.',
    answer3m:
      'Annotation composition model. MergedAnnotation.get patterns. Nearest wins override semantics. @AliasFor mutual aliases. Contrast @Inherited rare usage. ConfigurationClassParser AnnotationMetadata. Custom starter design. Debug synthesis. Staff: MergedAnnotations.SearchStrategy, presence vs direct.',
    memory: 'MERGED_ANNOTATIONS = meta-stack merge + @AliasFor; @GetMapping → @RequestMapping.',
  },
  {
    id: 'test-context-manager',
    annotation: 'TestContextManager pipeline',
    family: 'ecosystem-test',
    what:
      'Spring TestContext Framework bootstrap — not a single annotation but the machinery behind @SpringBootTest, @WebMvcTest, @DataJpaTest: TestContextManager loads ApplicationContext via BootstrapWith (SpringBootTestContextBootstrapper), caches contexts by MergedContextConfiguration key, applies ContextCustomizer (MockitoPostProcessor / BeanOverride), runs TestExecutionListener chain (@BeforeAll context prep, @DirtiesContext eviction, @Transactional test rollback).',
    why:
      'Interview: explain why @WebMvcTest is fast (sliced context) vs @SpringBootTest (full), why @MockBean registers before refresh, why @DirtiesContext slows suite — all TestContextManager responsibilities.',
    example: `@WebMvcTest(PaymentController.class)
class PaymentControllerTest {
  @Autowired MockMvc mockMvc;
  @MockitoBean PaymentService paymentService;

  @Test
  void capture() throws Exception {
  mockMvc.perform(post("/api/payments").contentType(APPLICATION_JSON).content("{}"))
      .andExpect(status().isOk());
  }
}

// Bootstrap chain:
// @WebMvcTest → @BootstrapWith(SpringBootTestContextBootstrapper.class)
// → @ImportAutoConfiguration + exclude filters → sliced context`,
    processor:
      'TestContextManager per test class. SpringBootTestContextBootstrapper builds MergedContextConfiguration from class-level annotations. ContextLoader (SpringBootContextLoader) refreshes GenericApplicationContext. TestExecutionListeners: ServletTestExecutionListener, DependencyInjectionTestExecutionListener, DirtiesContextTestExecutionListener, TransactionalTestExecutionListener. @MockitoBean BeanOverrideProcessor registers overrides before context refresh (Boot 3.4+).',
    when:
      'Understanding test slice boundaries, debugging context load failures, optimizing suite speed, migrating @MockBean to @MockitoBean.',
    flow: `Test class execution:
1. TestContextManager created for PaymentControllerTest
2. Bootstrapper merges @WebMvcTest annotations → slice config
3. Context cache lookup by configuration key
4. If miss: BeanOverride scan → refresh sliced context
5. DependencyInjectionTestExecutionListener injects MockMvc, mocks
6. @Test runs; TransactionalTestExecutionListener rollback if @Transactional
7. @DirtiesContext marks context dirty → cache evict`,
    lifecycle:
      'Context cached across test classes sharing same MergedContextConfiguration. @DirtiesContext forces rebuild — expensive. JVM suite level.',
    proxy:
      '@MockitoBean replaces bean in context — subject under test gets mock injected. Controllers may still be full objects; collaborators mocked.',
    runtime:
      'spring-test module. Boot TestContextCustomizerFactory adds auto-config exclusions per slice. @DynamicPropertySource invoked during context prep.',
    failure:
      'Context failed to load — missing bean in slice. @MockBean wrong type ambiguous. @SpringBootTest loads entire app — slow/flaky. @Import conflicts with slice.',
    debug:
      'DEBUG org.springframework.test.context. Log Context cache stats. --debug on failed @SpringBootTest. Verify @ContextConfiguration classes.',
    production:
      'Test infrastructure only. Prefer narrowest slice. Reuse cached context. Limit @DirtiesContext. Parallel test modules separate contexts.',
    mistakes: [
      '@WebMvcTest expecting full DataSource bean',
      '@MockBean on every test class forcing unique context',
      '@DirtiesContext on base class — kills cache',
      'Mixing JUnit 4 @RunWith and JUnit 5 @ExtendWith incorrectly',
    ],
    traps: [
      'Interview: TestContextManager orchestrates context + listeners',
      'Slice annotations reduce @ImportAutoConfiguration scope',
      '@MockitoBean registers via BeanOverride before refresh',
      'Context cache key includes merged annotations config',
    ],
    answer15s:
      'TestContextManager bootstraps the test ApplicationContext from slice annotations like @WebMvcTest, caches it, and runs TestExecutionListeners for injection, transactions, and @DirtiesContext.',
    answer60s:
      'SpringBootTestContextBootstrapper builds MergedContextConfiguration. ContextLoader refreshes slice or full context. Listeners inject @Autowired and @MockitoBean. Context cached — @DirtiesContext evicts. Contrast @WebMvcTest vs @SpringBootTest scope.',
    answer3m:
      'BootstrapWith chain. MergedContextConfiguration cache key. ContextCustomizer factories. BeanOverride vs MockitoPostProcessor. TransactionalTestExecutionListener rollback. @DynamicPropertySource timing. Optimize suite: shared context, narrow slices. Pitfalls: unnecessary @DirtiesContext. Boot 3.4 @MockitoBean migration.',
    memory: 'TEST_CONTEXT_MANAGER = bootstrap + cache + listeners; slices shrink context.',
    tables: [
      {
        headers: ['Annotation', 'Context scope', 'Typical mock'],
        rows: [
          ['@WebMvcTest', 'Web layer only', '@MockitoBean service'],
          ['@DataJpaTest', 'JPA + repos', 'Embedded DB'],
          ['@SpringBootTest', 'Full application', 'Optional @MockitoBean'],
        ],
      },
    ],
  },
];

export const ECOSYSTEM_COUNTS = {
  cards: ECOSYSTEM.length,
  families: [...new Set(ECOSYSTEM.map((c) => c.family))].length,
  withTables: ECOSYSTEM.filter((c) => c.tables && c.tables.length > 0).length,
} as const;
