/**
 * Staff/Principal internals layer for /spring-annotations
 * Pipeline: annotation → metadata → processor → BeanDefinition → lifecycle → proxy → runtime
 * Ownership labels: Spring Framework vs Boot vs Data vs Security vs Kafka vs third-party
 */

export type Ownership =
  | 'Spring Framework'
  | 'Spring Boot'
  | 'Spring Data'
  | 'Spring Security'
  | 'Spring Kafka'
  | 'Spring Cloud'
  | 'Jakarta / JPA'
  | 'Third-party (not Spring)';

export const PIPELINE_ASCII = `Source / bytecode
        ↓
Annotation metadata (RetentionPolicy.RUNTIME)
        ↓
Component scan / ConfigurationClassPostProcessor / ImportSelector
        ↓
BeanDefinition registered in BeanDefinitionRegistry
        ↓
BeanFactoryPostProcessor (mutate definitions)
        ↓
Bean instantiation + population
        ↓
BeanPostProcessor (DI, init, advisors, proxies)
        ↓
Singleton in DefaultListableBeanFactory
        ↓
Runtime: DispatcherServlet / interceptor / listener / scheduler`;

export const BOOT_RUN_ASCII = `SpringApplication.run(App.class, args)
        ↓
create ApplicationContext (ServletWebServerApplicationContext typically)
        ↓
prepare Environment (PropertySources, profiles)
        ↓
print banner / listeners
        ↓
load sources → register @SpringBootApplication configuration class
        ↓
refresh() → invokeBeanFactoryPostProcessors
        ↓
ConfigurationClassPostProcessor (scan, @Import, @Bean methods)
        ↓
DeferredImportSelector → AutoConfigurationImportSelector
        ↓
ConditionEvaluator (@ConditionalOn*) → filter auto-configs
        ↓
register BeanDefinitions
        ↓
register BeanPostProcessors
        ↓
finishBeanFactoryInitialization → singletons
        ↓
onRefresh → start embedded server
        ↓
finishRefresh → ContextRefreshedEvent
        ↓
ApplicationReadyEvent`;

export const TX_SEQUENCE_ASCII = `Client
  → Spring AOP proxy (JDK or CGLIB)
    → TransactionInterceptor.invoke
      → TransactionAttributeSource.getTransactionAttribute
      → PlatformTransactionManager.getTransaction / commit / rollback
      → MethodInvocation.proceed → target bean
  ← response / exception → rollback rules`;

export const HIERARCHY_ASCII = `Spring ecosystem annotations (ownership matters)
│
├── Spring Framework — Core container
│   ├── @Component @Service @Repository @Controller @RestController
│   ├── @Configuration @Bean @ComponentScan @Import @ImportResource
│   ├── @DependsOn @Lazy @Primary @Qualifier @Scope @Profile @Lookup
│   └── @PropertySource @Value
│
├── Spring Framework — DI
│   ├── @Autowired  (+ AutowiredAnnotationBeanPostProcessor)
│   ├── Jakarta @Inject @Named  (JSR-330 bridge)
│   ├── @Resource  (CommonAnnotationBeanPostProcessor)
│   └── @Fallback (Boot 3.2+ / Framework support where present)
│
├── Spring Framework — AOP / infrastructure advisors
│   ├── @Transactional  → TransactionInterceptor
│   ├── @Async          → AnnotationAsyncExecutionInterceptor
│   ├── @Cacheable/@CachePut/@CacheEvict → CacheInterceptor
│   ├── @EventListener / @TransactionalEventListener
│   ├── @Scheduled (+ @EnableScheduling)
│   └── @Aspect @Before @Around … (+ @EnableAspectJAutoProxy)
│
├── Spring Framework — Web MVC
│   ├── @RequestMapping family, @PathVariable, @RequestBody, …
│   ├── @ControllerAdvice @ExceptionHandler @InitBinder @CrossOrigin
│   └── Handled by RequestMappingHandlerMapping / Adapter — not AOP
│
├── Spring Boot
│   ├── @SpringBootApplication = @SpringBootConfiguration
│   │                           + @EnableAutoConfiguration
│   │                           + @ComponentScan
│   ├── @ConditionalOn* family
│   ├── @AutoConfigureBefore/After/Order
│   ├── @ConfigurationProperties @EnableConfigurationProperties
│   └── AutoConfiguration.imports + AutoConfigurationImportSelector
│
├── Spring Data / JPA (distinct from Framework @Repository stereotype)
│   ├── @EnableJpaRepositories @Query @Modifying @EntityGraph @Lock
│   ├── Jakarta @Entity @Table @Id … (JPA, not Spring)
│   └── Hibernate extras are NOT Spring annotations
│
├── Spring Security
│   ├── @EnableWebSecurity @EnableMethodSecurity
│   ├── @PreAuthorize @PostAuthorize @Secured @RolesAllowed
│   └── Filter chain + method security interceptors (proxies for method security)
│
├── Spring Kafka
│   ├── @EnableKafka @KafkaListener @KafkaHandler @SendTo
│   ├── @RetryableTopic @DltHandler
│   └── KafkaListenerAnnotationBeanPostProcessor → containers (not primarily AOP)
│
├── Spring Cloud (version-sensitive; prefer modern APIs)
│   ├── @FeignClient @LoadBalanced @RefreshScope
│   └── Legacy @EnableCircuitBreaker — prefer Resilience4j / modern CB APIs
│
└── Third-party (label clearly in interviews)
    ├── spring-retry @Retryable @Recover
    └── Resilience4j @CircuitBreaker @RateLimiter @Bulkhead @TimeLimiter
        → see /resilience4j — not Spring Boot annotations`;

export type WrongVsCorrect = {
  id: string;
  annotation: string;
  wrong: string;
  whyWrong: string;
  correct: string;
  whyCorrect: string;
};

export const WRONG_VS_CORRECT: WrongVsCorrect[] = [
  {
    id: 'wvc-tx',
    annotation: '@Transactional',
    wrong: `public void outer() {
  this.inner(); // same bean — proxy bypassed
}
@Transactional
public void inner() { /* DB work */ }`,
    whyWrong:
      'Self-invocation never enters TransactionInterceptor. No transaction attribute applied unless AspectJ weaving is configured.',
    correct: `// inject self or split collaborator
private final PaymentTxOps txOps;
public void outer() { txOps.inner(); }

@Service
class PaymentTxOps {
  @Transactional
  public void inner() { /* DB work */ }
}`,
    whyCorrect: 'Call crosses the Spring proxy → advisor chain → PlatformTransactionManager.',
  },
  {
    id: 'wvc-async',
    annotation: '@Async',
    wrong: `public void handle() {
  this.sendEmail(); // still sync on caller thread
}
@Async
public void sendEmail() { … }`,
    whyWrong: 'AsyncAnnotationBeanPostProcessor advice only wraps external calls through the proxy.',
    correct: `private final MailAsyncGate gate;
public void handle() { gate.sendEmail(); }

@Component
class MailAsyncGate {
  @Async("mailExecutor")
  public void sendEmail() { … }
}`,
    whyCorrect: 'AnnotationAsyncExecutionInterceptor submits to TaskExecutor; caller returns immediately.',
  },
  {
    id: 'wvc-cache',
    annotation: '@Cacheable',
    wrong: `public Price quote(String sku) {
  return this.load(sku); // cache advice skipped
}
@Cacheable("prices")
public Price load(String sku) { … }`,
    whyWrong: 'CacheInterceptor never sees the call; every invocation hits the method body.',
    correct: `return priceCache.load(sku); // other bean or self-proxy`,
    whyCorrect: 'Proxy → CacheInterceptor → CacheManager → hit/miss → target.',
  },
  {
    id: 'wvc-retry',
    annotation: '@Retryable (spring-retry)',
    wrong: `public void process() {
  this.fragile(); // no retries
}
@Retryable
public void fragile() { … }`,
    whyWrong: 'spring-retry is AOP-based; same self-invocation trap. Also not a Spring Boot annotation.',
    correct: `fragileGate.fragile(); // separate bean + @EnableRetry`,
    whyCorrect: 'RetryOperationsInterceptor wraps the proxy invocation.',
  },
  {
    id: 'wvc-sec',
    annotation: '@PreAuthorize',
    wrong: `public void adminOp() {
  this.secured(); // method security bypassed
}
@PreAuthorize("hasRole('ADMIN')")
public void secured() { … }`,
    whyWrong: 'Method security uses advisors/proxies (or AspectJ). Intra-class calls skip AuthorizationManager checks.',
    correct: `securedOps.secured(); // or AspectJ mode if required`,
    whyCorrect: 'Invocation crosses MethodSecurityInterceptor / AuthorizationManager before target.',
  },
];

export type AnnotationIncident = {
  id: string;
  title: string;
  symptom: string;
  rootCause: string;
  prove: string;
  fix: string;
  prevention: string;
};

/** Compact catalog — expand in interviews; pairs with /production-troubleshooting */
export const ANNOTATION_INCIDENTS: AnnotationIncident[] = [
  {
    id: 'inc-tx-self',
    title: '@Transactional self-invocation — no rollback',
    symptom: 'DB changes persist after RuntimeException inside nested private/public call on same bean.',
    rootCause: 'Proxy boundary not crossed; TransactionInterceptor never ran.',
    prove: 'AopUtils.isAopProxy(this)==true but debugger never enters TransactionInterceptor for inner call.',
    fix: 'Extract collaborator bean or self-inject via ObjectProvider / @Lazy self.',
    prevention: 'Architecture rule: transactional boundaries are public API methods on dedicated services.',
  },
  {
    id: 'inc-tx-checked',
    title: 'Checked exception — unexpected commit',
    symptom: 'BusinessException extends Exception; transaction commits.',
    rootCause: 'Default rollback rules: RuntimeException/Error only.',
    prove: 'TransactionAttribute.getRollbackRules(); exception type is checked.',
    fix: 'rollbackFor = BusinessException.class or make it RuntimeException.',
    prevention: 'Document rollback policy in service API; prefer unchecked domain errors.',
  },
  {
    id: 'inc-tx-private',
    title: 'private @Transactional ignored',
    symptom: 'Annotation present; no transaction.',
    rootCause: 'CGLIB cannot advise private methods; JDK proxy only advises interface methods.',
    prove: 'Method is private; no advisor matched in AbstractAdvisorAutoProxyCreator.',
    fix: 'public (or package-visible with care) method on Spring bean.',
    prevention: 'SpotBugs/ArchUnit: forbid @Transactional on private.',
  },
  {
    id: 'inc-async-self',
    title: '@Async still synchronous',
    symptom: 'Caller blocked; thread name unchanged.',
    rootCause: 'Self-invocation or missing @EnableAsync / executor bean.',
    prove: 'Thread.currentThread() same before/after; no TaskExecutor.submit.',
    fix: 'External call + configure ThreadPoolTaskExecutor with bounds.',
    prevention: 'Load-test async pools; never unbounded executors in prod.',
  },
  {
    id: 'inc-async-exhaust',
    title: '@Async thread pool exhaustion',
    symptom: 'RejectedExecutionException or latency cliffs.',
    rootCause: 'Default SimpleAsyncTaskExecutor or tiny pool + large queue of slow work.',
    prove: 'Executor metrics; activeCount == maxPoolSize; queue full.',
    fix: 'Sized pool, bounded queue, CallerRuns or abort + shed load.',
    prevention: 'Capacity planning; prefer Kafka for durable async work.',
  },
  {
    id: 'inc-cache-self',
    title: '@Cacheable miss always',
    symptom: 'Redis/Caffeine never hit for hot path.',
    rootCause: 'Self-call or key SpEL wrong or cache names mismatch.',
    prove: 'CacheInterceptor not in stack; or key evaluates to null unpredictably.',
    fix: 'Cross-bean call; fix key; verify CacheManager bean.',
    prevention: 'Integration test asserting second call hits cache.',
  },
  {
    id: 'inc-kafka-group',
    title: '@KafkaListener silent — wrong group/topic',
    symptom: 'No consumption in one env.',
    rootCause: 'group.id / topic property unresolved; container not started; auth failure.',
    prove: 'Actuator kafka / logs: subscription; admin describe consumer group lag.',
    fix: 'Fix properties; ensure KafkaListenerEndpointRegistry started.',
    prevention: 'Startup probe that fails if critical listeners missing.',
  },
  {
    id: 'inc-sched-k8s',
    title: '@Scheduled double fire in Kubernetes',
    symptom: 'Job runs N times for N pods.',
    rootCause: 'Each JVM registers its own TaskScheduler; no cluster lock.',
    prove: 'Pod logs timestamps align; no ShedLock/leader election.',
    fix: 'Distributed lock, leader election, or external scheduler (K8s CronJob).',
    prevention: 'Never assume @Scheduled is cluster-singleton.',
  },
  {
    id: 'inc-autowire-ambig',
    title: '@Autowired NoUniqueBeanDefinitionException',
    symptom: 'Context fails to start with two PaymentClient beans.',
    rootCause: 'Multiple candidates; no @Primary/@Qualifier.',
    prove: 'Exception lists bean names.',
    fix: '@Qualifier or @Primary or @Fallback (when available) or @Autowired(required=false) carefully.',
    prevention: 'One default implementation marked @Primary in each profile.',
  },
  {
    id: 'inc-circular',
    title: 'Circular dependency after constructor injection',
    symptom: 'BeanCurrentlyInCreationException.',
    rootCause: 'A→B→A constructors; Boot 2.6+ disallows circular refs by default.',
    prove: 'Dependency cycle in exception message.',
    fix: 'Break cycle (events, redesign), or @Lazy on one side as last resort.',
    prevention: 'Prefer events/ports; enable fail-fast on cycles.',
  },
  {
    id: 'inc-config-lite',
    title: '@Bean in @Component creates duplicate collaborators',
    symptom: 'Two B instances when A calls b() from @Bean method.',
    rootCause: 'Lite @Bean mode — no CGLIB interception of @Bean methods.',
    prove: 'System.identityHashCode differs; @Configuration(proxyBeanMethods=true) would unify.',
    fix: 'Use @Configuration or inject B as method parameter.',
    prevention: 'ArchUnit: @Bean methods only on @Configuration.',
  },
  {
    id: 'inc-value',
    title: '@Value not resolving',
    symptom: 'Literal ${…} or null in field.',
    rootCause: 'Property missing; wrong PropertySource order; static/@Bean factory timing.',
    prove: 'Environment.getProperty; ConditionEvaluationReport for related auto-config.',
    fix: 'Fix YAML/profile; prefer @ConfigurationProperties with validation.',
    prevention: 'Fail-fast @ConfigurationPropertiesBinding + @Validated.',
  },
  {
    id: 'inc-profile',
    title: 'Wrong @Profile beans in prod',
    symptom: 'Stub client used in production.',
    rootCause: 'spring.profiles.active wrong; default profile beans still registered.',
    prove: '/actuator/env profiles; bean names in /actuator/beans.',
    fix: 'Explicit prod profile; @Profile("!prod") on stubs.',
    prevention: 'CI asserts active profiles; disable stub configs in prod image.',
  },
  {
    id: 'inc-autoconfig-on',
    title: 'Surprise DataSource auto-config',
    symptom: 'Boot creates embedded DB unexpectedly.',
    rootCause: '@ConditionalOnClass matched H2 + missing own DataSource bean.',
    prove: 'conditions endpoint / ConditionEvaluationReport positive matches.',
    fix: 'Exclude auto-config or provide DataSource @Bean / properties.',
    prevention: 'Review autoconfig report in staging boots.',
  },
  {
    id: 'inc-autoconfig-off',
    title: 'Missing RedisTemplate',
    symptom: 'No Redis connection factory bean.',
    rootCause: 'starter missing OR @ConditionalOnProperty false OR custom exclusion.',
    prove: 'Negative matches in conditions report.',
    fix: 'Add starter; fix property; remove erroneous exclude.',
    prevention: 'Smoke test critical infrastructure beans.',
  },
  {
    id: 'inc-mvc-conflict',
    title: 'Ambiguous @RequestMapping',
    symptom: 'IllegalStateException mapping conflict at startup.',
    rootCause: 'Two handler methods same pattern+method.',
    prove: 'Startup stack from RequestMappingHandlerMapping.',
    fix: 'Disambiguate paths; use produces/consumes.',
    prevention: 'Contract tests for OpenAPI uniqueness.',
  },
  {
    id: 'inc-valid',
    title: '@Valid ignored',
    symptom: 'Invalid JSON accepted.',
    rootCause: 'Missing @Valid/@Validated; or @Validated without method validation advisor.',
    prove: 'MethodValidationPostProcessor not present; BindingResult unused.',
    fix: 'Annotate @RequestBody @Valid; enable method validation if needed.',
    prevention: 'Controller advice tests for 400 on bad payloads.',
  },
  {
    id: 'inc-security',
    title: '@PreAuthorize ignored',
    symptom: 'Unauthorized caller succeeds.',
    rootCause: 'Method security not enabled; or self-invocation; or wrong expression.',
    prove: 'No MethodSecurityInterceptor; SecurityFilterChain alone is not enough for method annotations.',
    fix: '@EnableMethodSecurity; cross-proxy calls; fix SpEL.',
    prevention: 'Security tests with @WithMockUser.',
  },
  {
    id: 'inc-repo-tx',
    title: '@Repository without exception translation',
    symptom: 'Raw PersistenceException leaks to API.',
    rootCause: 'Missing PersistenceExceptionTranslationPostProcessor / not a Spring bean stereotype path.',
    prove: 'Exception type in API; advisor not applied.',
    fix: '@Repository on Spring bean + translation infrastructure (Boot usually auto).',
    prevention: 'Map to domain exceptions at boundary.',
  },
  {
    id: 'inc-feign',
    title: '@FeignClient wrong instance',
    symptom: 'Calls hit hard-coded host; no LB.',
    rootCause: 'Missing @LoadBalanced RestTemplate confusion; or Feign without LB config; Cloud version mismatch.',
    prove: 'Wire logs show absolute URL; LoadBalancerClient not invoked.',
    fix: 'serviceId naming; spring-cloud-loadbalancer; correct Boot/Cloud BOM.',
    prevention: 'Contract tests against discovery in staging.',
  },
  {
    id: 'inc-tx-final',
    title: 'final @Transactional method skipped',
    symptom: 'No TX around final method.',
    rootCause: 'CGLIB cannot override final methods; JDK proxy only advises interface methods.',
    prove: 'Advisor match list excludes method; AopUtils finds proxy but advice not applied.',
    fix: 'Non-final public method; or AspectJ weave mode.',
    prevention: 'ArchUnit: forbid final on @Transactional methods.',
  },
  {
    id: 'inc-tx-req-new-self',
    title: 'REQUIRES_NEW does nothing on this.x()',
    symptom: 'Audit insert rolls back with outer TX.',
    rootCause: 'Self-call never suspends; stays in outer transaction.',
    prove: 'Same connection/TX sync; no suspend in AbstractPlatformTransactionManager.',
    fix: 'Call audit service bean through proxy.',
    prevention: 'REQUIRES_NEW only on separate beans.',
  },
  {
    id: 'inc-postconstruct-tx',
    title: '@PostConstruct + @Transactional',
    symptom: 'Init DB work not transactional / fails oddly.',
    rootCause: 'Lifecycle callbacks run on raw bean before advisors fully useful; self semantics differ.',
    prove: 'No TransactionInterceptor around @PostConstruct.',
    fix: 'ApplicationRunner / @EventListener(ContextRefreshedEvent) / explicit TM.',
    prevention: 'Never put business TX in @PostConstruct.',
  },
  {
    id: 'inc-lookup',
    title: '@Lookup not working',
    symptom: 'Prototype injection returns same instance.',
    rootCause: '@Lookup needs CGLIB override on Spring bean; concrete method body ignored incorrectly.',
    prove: 'Class is not enhanced; method returns hardcoded null/body.',
    fix: 'Abstract method + @Lookup or ObjectProvider.getObject().',
    prevention: 'Prefer ObjectProvider/ObjectFactory in Boot 3.',
  },
  {
    id: 'inc-scope-proxy',
    title: 'Request-scoped bean in singleton stale',
    symptom: 'Wrong tenant/user data after first request.',
    rootCause: 'Injected request bean without scoped proxy — singleton captured one instance.',
    prove: 'Target class not scoped proxy; same identity across requests.',
    fix: '@Scope(proxyMode=TARGET_CLASS) or ObjectProvider.',
    prevention: 'Review web scopes in singleton services.',
  },
  {
    id: 'inc-lazy',
    title: '@Lazy hides circular dependency forever',
    symptom: 'Startup ok; first call NPE / half-init.',
    rootCause: '@Lazy broke cycle but design still circular; failure deferred.',
    prove: 'First method call triggers creation; stack shows cycle.',
    fix: 'Redesign; events; extract third component.',
    prevention: 'Treat @Lazy as temporary; fail on cycles in CI.',
  },
  {
    id: 'inc-primary-multi',
    title: 'Two @Primary — still ambiguous',
    symptom: 'NoUniqueBeanDefinitionException with @Primary present.',
    rootCause: 'Multiple @Primary candidates in same type.',
    prove: 'Exception lists both primary beans.',
    fix: 'One @Primary; use @Qualifier elsewhere.',
    prevention: 'Lint for duplicate @Primary per type.',
  },
  {
    id: 'inc-resource-name',
    title: '@Resource by name mismatch',
    symptom: 'Wrong bean injected vs @Autowired type match.',
    rootCause: '@Resource defaults to field name match; different from @Autowired.',
    prove: 'Injected bean name ≠ expected; CommonAnnotationBeanPostProcessor path.',
    fix: 'name= attribute or rename field; prefer constructor + @Qualifier.',
    prevention: 'Avoid mixing @Resource and @Autowired casually.',
  },
  {
    id: 'inc-import-selector',
    title: '@Import selector skipped configs',
    symptom: 'Custom auto-config never registers.',
    rootCause: 'ImportSelector returns wrong class names; DeferredImport order; condition false.',
    prove: 'ConditionEvaluationReport; missing BeanDefinition.',
    fix: 'Fix selector; AutoConfiguration.imports entry; conditions.',
    prevention: 'IT asserting critical beans exist.',
  },
  {
    id: 'inc-proxy-bean-methods',
    title: 'proxyBeanMethods=false surprise',
    symptom: 'Inter-@Bean calls create new instances.',
    rootCause: 'Lite mode — no CGLIB interception of @Bean methods.',
    prove: 'identityHashCode differs; class is not enhanced config.',
    fix: 'proxyBeanMethods=true or inject collaborators as params.',
    prevention: 'Document lite vs full @Configuration in team standards.',
  },
  {
    id: 'inc-enable-tx-missing',
    title: '@Transactional ignored — no TM',
    symptom: 'Annotation present; no TX; or BeanCreationException.',
    rootCause: 'No PlatformTransactionManager / @EnableTransactionManagement path missing (rare in Boot).',
    prove: 'No TransactionInterceptor advisor; /beans missing TM.',
    fix: 'Add datasource starter or explicit TM bean.',
    prevention: 'Smoke test that service methods enlist TX.',
  },
  {
    id: 'inc-readonly-write',
    title: 'readOnly=true still writes',
    symptom: 'Unexpected flush / write in "read" service.',
    rootCause: 'readOnly is a hint; not a hard DB grant; Hibernate may still flush.',
    prove: 'SQL logs show UPDATE; Connection isReadOnly may be false on some pools.',
    fix: 'Separate command services; DB roles; avoid writes in read TX.',
    prevention: 'CQRS-ish boundaries in code review.',
  },
  {
    id: 'inc-cache-stampede',
    title: '@Cacheable stampede',
    symptom: 'TTL expiry → thundering herd to DB.',
    rootCause: 'No sync=true / no lock; many threads miss simultaneously.',
    prove: 'DB QPS spike aligned with TTL; cache miss metrics.',
    fix: 'sync=true where safe; soft TTL; request coalescing.',
    prevention: 'Load-test cache expiry; see /performance.',
  },
  {
    id: 'inc-cache-null',
    title: 'Caching nulls / penetration',
    symptom: 'Missing keys hammer DB forever.',
    rootCause: 'unless/condition not set; nulls not cached; attackers probe keys.',
    prove: 'Miss rate ~100% for absent keys.',
    fix: 'Cache empty markers; Bloom; unless SpEL.',
    prevention: 'Threat model public cache keys.',
  },
  {
    id: 'inc-async-tx',
    title: '@Async after @Transactional lost',
    symptom: 'Async method cannot see uncommitted data / no TX.',
    rootCause: 'Async runs on other thread; TX ThreadLocal not propagated; AFTER_COMMIT needed.',
    prove: 'Different thread; TransactionSynchronizationManager not active.',
    fix: '@TransactionalEventListener(AFTER_COMMIT) then @Async; or outbox.',
    prevention: 'Never start async work that needs same TX.',
  },
  {
    id: 'inc-event-phase',
    title: 'AFTER_COMMIT listener never fires',
    symptom: 'Side effect missing after save.',
    rootCause: 'No active TX when event published; or BEFORE_COMMIT expectation wrong.',
    prove: 'TransactionalEventListener skipped log; publisher outside TX.',
    fix: 'Publish inside TX service; correct phase.',
    prevention: 'Integration test for after-commit hooks.',
  },
  {
    id: 'inc-kafka-batch',
    title: 'Batch @KafkaListener ack wrong',
    symptom: 'Partial batch lost or reprocessed.',
    rootCause: 'Ack mode vs batch error handler mismatch.',
    prove: 'Container ack mode; error handler type; lag jumps.',
    fix: 'CommonErrorHandler; seek behaviors; idempotent consumer.',
    prevention: 'Document batch failure contract; see /kafka-interview.',
  },
  {
    id: 'inc-retryable-topic',
    title: '@RetryableTopic infinite DLT',
    symptom: 'Poison message loops topics.',
    rootCause: 'Non-retryable exception misclassified; DLT handler republishes.',
    prove: 'Topic hop counts; exception types in logs.',
    fix: 'include/exclude; fix DltHandler; dead-letter store.',
    prevention: 'Classify exceptions; alert on DLT depth.',
  },
  {
    id: 'inc-rest-advice-order',
    title: '@ControllerAdvice order wrong',
    symptom: 'Generic handler swallows domain exceptions.',
    rootCause: '@Order / @Priority; assignable types too broad.',
    prove: 'Which @ExceptionHandler matched in debugger.',
    fix: 'Specific handlers; Ordered.HIGHEST_PRECEDENCE carefully.',
    prevention: 'Tests for each exception → status mapping.',
  },
  {
    id: 'inc-crossorigin',
    title: '@CrossOrigin ignored',
    symptom: 'Browser CORS failures.',
    rootCause: 'Global CorsFilter / Security CORS overrides method annotation.',
    prove: 'Preflight response headers from Security config not controller.',
    fix: 'Align Security CorsConfigurationSource with API needs.',
    prevention: 'E2E preflight tests; see /spring-security.',
  },
  {
    id: 'inc-mockbean',
    title: '@MockBean leaks across tests',
    symptom: 'Flaky tests; wrong mock.',
    rootCause: 'Context cache keyed by config; @MockBean dirties/shared incorrectly.',
    prove: 'Context cache stats; @DirtiesContext usage.',
    fix: 'Narrow test slices; reset mocks; careful @MockBean scope.',
    prevention: 'Prefer @WebMvcTest + @MockitoBean patterns per Boot version.',
  },
  {
    id: 'inc-slice-jpa',
    title: '@DataJpaTest missing bean',
    symptom: 'NoSuchBeanDefinitionException for service.',
    rootCause: 'Slice only loads JPA infra — not full @SpringBootApplication scan.',
    prove: 'Limited bean definitions in test context.',
    fix: '@Import service or use @SpringBootTest for integration.',
    prevention: 'Know what each slice auto-configures.',
  },
  {
    id: 'inc-actuator-expose',
    title: 'Actuator /beans public',
    symptom: 'Internal bean graph exposed.',
    rootCause: 'management.endpoints.web.exposure.include=*',
    prove: 'Unauthenticated GET /actuator/beans.',
    fix: 'Expose minimally; secure management port.',
    prevention: 'Prod checklist for actuator exposure.',
  },
  {
    id: 'inc-conditional-on-bean',
    title: '@ConditionalOnBean race / order',
    symptom: 'Auto-config sometimes missing.',
    rootCause: 'OnBean evaluated before candidate definition registered (ordering).',
    prove: 'Intermittent ConditionEvaluationReport; DeferredImport order.',
    fix: 'AutoConfigureAfter; use OnClass + OnMissingBean carefully.',
    prevention: 'Prefer OnClass for classpath; OnBean with documented order.',
  },
  {
    id: 'inc-component-scan-filter',
    title: 'Custom @ComponentScan filter drops beans',
    symptom: 'Package scanned but beans missing.',
    rootCause: 'excludeFilters / useDefaultFilters=false mistake.',
    prove: 'DEBUG scan candidate logs empty.',
    fix: 'Fix filters; restore default stereotype filters.',
    prevention: 'Startup assertion for critical bean names.',
  },
  {
    id: 'inc-qualifer-meta',
    title: 'Custom @Qualifier meta not matching',
    symptom: 'Injection fails despite annotation.',
    rootCause: 'Qualifier value mismatch; composed annotation not meta-@Qualifier.',
    prove: 'DependencyDescriptor qualifiers empty/wrong.',
    fix: 'Meta-annotate with @Qualifier; match values.',
    prevention: 'Centralize qualifier constants.',
  },
  {
    id: 'inc-predestroy',
    title: '@PreDestroy not called',
    symptom: 'Connections leak on shutdown.',
    rootCause: 'Non-graceful kill; prototype beans; bean not singleton managed.',
    prove: 'Shutdown hooks; DisposableBean not invoked.',
    fix: 'Graceful SIGTERM; register destroy methods on singletons.',
    prevention: 'K8s preStop + graceful Boot shutdown timeout.',
  },
  {
    id: 'inc-aop-order',
    title: 'TX commits before security check',
    symptom: 'Unauthorized work persisted.',
    rootCause: 'Advisor order: TX outside security incorrectly.',
    prove: 'Interceptor chain order in AbstractAdvisorAutoProxyCreator.',
    fix: '@Order on aspects; enableMethodSecurity order docs.',
    prevention: 'Security before business TX on public APIs.',
  },
  {
    id: 'inc-aspectj-vs-proxy',
    title: 'Private method TX works in one env only',
    symptom: 'Works with load-time weave; fails in proxy mode.',
    rootCause: 'AspectJ vs Spring AOP proxy mode difference.',
    prove: 'spring.aop.proxy-target-class; weaving agent present.',
    fix: 'Standardize on proxy mode + public APIs; or document AspectJ.',
    prevention: 'Same AOP mode in all envs.',
  },
  {
    id: 'inc-jackson-responsebody',
    title: '@ResponseBody / converter failure',
    symptom: 'HttpMediaTypeNotAcceptable / empty body.',
    rootCause: 'Missing converter; produces mismatch; @RestController advice.',
    prove: 'HandlerAdapter messageConverters list.',
    fix: 'Jackson on classpath; correct produces; DTO shape.',
    prevention: 'Contract tests for content negotiation.',
  },
  {
    id: 'inc-pathvar',
    title: '@PathVariable name mismatch',
    symptom: '400 / null path var.',
    rootCause: 'Name differs from {var} without explicit name= (or -parameters flag).',
    prove: 'Binding fails in ServletInvocableHandlerMethod.',
    fix: '@PathVariable("id") or compile with -parameters.',
    prevention: 'Always name path variables explicitly.',
  },
];

/** Mermaid: annotation → BeanDefinition → proxy → runtime */
export const PIPELINE_MERMAID = `flowchart TD
  A[Source class + annotations] --> B[ASM MetadataReader / AnnotationMetadata]
  B --> C{Discovery path}
  C -->|@ComponentScan| D[ClassPathBeanDefinitionScanner]
  C -->|@Configuration @Bean| E[ConfigurationClassPostProcessor]
  C -->|@Import / DeferredImportSelector| F[AutoConfigurationImportSelector]
  D --> G[BeanDefinitionRegistry]
  E --> G
  F --> G
  G --> H[BeanFactoryPostProcessor]
  H --> I[Instantiate + populate]
  I --> J[BeanPostProcessor chain]
  J --> K{Advisor match?}
  K -->|yes| L[AOP proxy JDK/CGLIB]
  K -->|no| M[Raw singleton]
  L --> N[DefaultListableBeanFactory cache]
  M --> N
  N --> O[Runtime invocation / MVC / listeners]`;

export const BOOT_MERMAID = `flowchart TD
  R[SpringApplication.run] --> E[Environment + profiles]
  E --> C[Create ApplicationContext]
  C --> RF[refresh]
  RF --> CCP[ConfigurationClassPostProcessor]
  CCP --> SCAN[Component scan]
  CCP --> DEF[DeferredImportSelector]
  DEF --> ACS[AutoConfigurationImportSelector]
  ACS --> IMP[AutoConfiguration.imports]
  IMP --> COND[ConditionEvaluator]
  COND -->|match| REG[Register auto-config @Bean defs]
  COND -->|no| SKIP[Skip configuration]
  REG --> BPP[BeanPostProcessors]
  BPP --> SING[Singletons + proxies]
  SING --> WEB[WebServer start]
  WEB --> READY[ApplicationReadyEvent]`;

export const TX_MERMAID = `sequenceDiagram
  participant Client
  participant Proxy
  participant TI as TransactionInterceptor
  participant TAS as TransactionAttributeSource
  participant TM as PlatformTransactionManager
  participant Target
  participant DB
  Client->>Proxy: transfer()
  Proxy->>TI: invoke
  TI->>TAS: getTransactionAttribute
  TI->>TM: getTransaction
  TM->>DB: begin
  TI->>Target: proceed
  Target->>DB: SQL
  alt success
    TI->>TM: commit
  else rollback rule matches
    TI->>TM: rollback
  end
  Proxy-->>Client: result / exception`;

export const AUTOWIRE_MERMAID = `flowchart TD
  A[Bean creation] --> B[AutowiredAnnotationBeanPostProcessor]
  B --> C[InjectionMetadata]
  C --> D[DependencyDescriptor]
  D --> E[BeanFactory.resolveDependency]
  E --> F[Candidate beans by type]
  F --> G{@Qualifier / @Primary / @Fallback}
  G --> H[Inject constructor/field/setter]
  H --> I[Continue lifecycle]`;

export const KAFKA_MERMAID = `flowchart TD
  A[Context refresh] --> B[KafkaListenerAnnotationBeanPostProcessor]
  B --> C[MethodKafkaListenerEndpoint]
  C --> D[KafkaListenerContainerFactory]
  D --> E[MessageListenerContainer]
  E --> F[Consumer thread poll]
  F --> G[Listener method]
  G --> H{Ack / error handler / retry topics}`;

export const MVC_MERMAID = `flowchart TD
  R[HTTP request] --> S[Servlet container]
  S --> D[DispatcherServlet]
  D --> HM[RequestMappingHandlerMapping]
  HM --> HMethod[HandlerMethod]
  D --> HA[RequestMappingHandlerAdapter]
  HA --> ARG[Argument resolvers @PathVariable @RequestBody…]
  ARG --> CTRL[Controller method]
  CTRL --> MC[HttpMessageConverter]
  MC --> RESP[HTTP response]`;

export const PROXY_DETECT_CODE = `import org.springframework.aop.support.AopUtils;
import org.springframework.aop.framework.AopContext;

boolean proxy = AopUtils.isAopProxy(bean);
boolean jdk = AopUtils.isJdkDynamicProxy(bean);
boolean cglib = AopUtils.isCglibProxy(bean);
Class<?> targetClass = AopUtils.getTargetClass(bean);

// Only if @EnableAspectJAutoProxy(exposeProxy = true)
// Object p = AopContext.currentProxy();`;

export const CHEAT_DI = `SCAN stereotype
  → BeanDefinition
  → BeanFactory
  → AutowiredAnnotationBeanPostProcessor
  → resolveDependency (@Primary / @Qualifier)
  → inject`;

export const CHEAT_TX = `@Transactional metadata
  → advisor match → proxy
  → TransactionInterceptor
  → TransactionAttributeSource
  → PlatformTransactionManager
  → DB begin/commit/rollback`;

export const CHEAT_ASYNC = `@Async
  → AsyncAnnotationBeanPostProcessor
  → proxy + AnnotationAsyncExecutionInterceptor
  → TaskExecutor
  → thread pool
  → method`;

export const CHEAT_CACHE = `@Cacheable
  → CacheInterceptor (proxy)
  → CacheManager
  → cache hit/miss
  → target method on miss`;

export const CHEAT_KAFKA = `@KafkaListener
  → KafkaListenerAnnotationBeanPostProcessor
  → endpoint
  → container factory
  → consumer poll
  → listener method`;

export const CHEAT_REST = `@RequestMapping
  → RequestMappingHandlerMapping (startup)
  → DispatcherServlet
  → HandlerMethod
  → RequestMappingHandlerAdapter
  → controller`;

export const DECISION_GUIDE_ROWS: { choice: string; useWhen: string; avoidWhen: string }[] = [
  {
    choice: '@Component vs @Service vs @Repository',
    useWhen:
      '@Service for domain application services; @Repository when you want persistence exception translation semantics; @Component for generic infrastructure.',
    avoidWhen: 'Do not pick stereotypes for "documentation only" if teams ignore exception-translation differences.',
  },
  {
    choice: '@Controller vs @RestController',
    useWhen: '@RestController = @Controller + @ResponseBody for JSON APIs.',
    avoidWhen: 'Server-rendered views need @Controller + view names, not RestController.',
  },
  {
    choice: 'Constructor injection vs @Autowired fields',
    useWhen: 'Constructor injection for required deps — immutable, testable, Boot-friendly.',
    avoidWhen: 'Field injection hides dependencies and complicates tests; avoid in new code.',
  },
  {
    choice: '@Value vs @ConfigurationProperties',
    useWhen: '@ConfigurationProperties for structured, validated, IDE-friendly config models.',
    avoidWhen: '@Value for large nested configs — fragile SpEL and weak validation.',
  },
  {
    choice: '@Primary vs @Qualifier',
    useWhen: '@Primary for one default among many; @Qualifier for explicit selection.',
    avoidWhen: 'Multiple @Primary — still ambiguous; prefer qualifiers for clarity.',
  },
  {
    choice: '@Async vs Kafka',
    useWhen: '@Async for short in-process fan-out with bounded pools.',
    avoidWhen: 'Cross-service durability, replay, backpressure — use Kafka (see /kafka-interview).',
  },
  {
    choice: '@Scheduled vs K8s CronJob / external scheduler',
    useWhen: '@Scheduled for single-instance or locked cluster jobs.',
    avoidWhen: 'Multi-replica without lock — jobs duplicate.',
  },
  {
    choice: '@EventListener vs Kafka',
    useWhen: 'In-process, same JVM, after-commit hooks via @TransactionalEventListener.',
    avoidWhen: 'Cross-service integration — Kafka/outbox.',
  },
  {
    choice: '@Transactional vs Saga',
    useWhen: 'Single DB / single resource TM boundary.',
    avoidWhen: 'Multi-service atomicity — saga/outbox; @Transactional is not distributed XA by default.',
  },
  {
    choice: 'spring-retry @Retryable vs @RetryableTopic',
    useWhen: '@RetryableTopic for Kafka-native delayed topics + DLT (Spring Kafka).',
    avoidWhen: 'Confusing them — different stacks; Resilience4j for HTTP CB (see /resilience4j).',
  },
  {
    choice: '@Cacheable vs explicit Redis',
    useWhen: '@Cacheable for read-through with clear keys and TTL policy.',
    avoidWhen: 'Complex multi-key invalidation — explicit Redis + domain events often clearer.',
  },
];

export const RELATED_HUBS = [
  { href: '/spring-security', title: 'Spring Security', blurb: 'Filter chain, method security, CSRF/CORS — ownership: Spring Security.' },
  { href: '/kafka-interview', title: 'Kafka interview', blurb: '@KafkaListener internals, consumer groups, DLQ — Spring Kafka.' },
  { href: '/resilience4j', title: 'Resilience4j', blurb: '@CircuitBreaker / rate limit — third-party, not Boot annotations.' },
  { href: '/performance', title: 'Performance', blurb: 'Thread pools, cache stampedes, JVM — when annotation defaults hurt latency.' },
  { href: '/production-troubleshooting', title: 'Production troubleshooting', blurb: 'Incident playbooks when annotation proxies misbehave in prod.' },
  { href: '/distributed-locking', title: 'Distributed locking', blurb: 'Make @Scheduled / leader work safe across pods.' },
] as const;

export const PRINCIPAL_EXPECTATION = `@Transactional is metadata. Spring's transaction infrastructure typically wraps the bean with an AOP advisor.
When a call crosses that proxy, TransactionInterceptor reads TransactionAttributeSource, then
PlatformTransactionManager begins/commits/rolls back. The transaction is bound to the proxy invocation,
which is why self-invocation, private/final methods, and wrong proxy type are interview landmines —
not "Spring forgot the annotation."`;
