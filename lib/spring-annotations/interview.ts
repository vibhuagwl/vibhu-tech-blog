import type {InterviewQ, ScenarioQ} from './types';
import {PROCESSOR_MAP} from './parts-proxy-matrix';

export const TRAP_QS: InterviewQ[] = [
  {
    "id": "trap-1",
    "topic": "self-invocation",
    "level": "advanced",
    "question": "Why does @Transactional not roll back on this.save()?",
    "answer30s": "Self-invocation bypasses Spring AOP proxy — only external calls through proxy get TransactionInterceptor.",
    "answer2m": "External caller → CGLIB proxy → TransactionInterceptor → target. this.internal() jumps directly to target with no interceptor.",
    "followUps": [
      "Extract PaymentHelper bean?",
      "AopContext.currentProxy()?"
    ],
    "trick": "It always rolls back on any exception.",
    "wrongAnswer": "Because @Transactional is broken in Spring."
  },
  {
    "id": "trap-2",
    "topic": "service-proxy",
    "level": "advanced",
    "question": "Does @Service automatically create a proxy?",
    "answer30s": "No — @Service is only a stereotype @Component. Proxy appears when @Transactional, @Async, @Cacheable, or method security is present.",
    "answer2m": "@Service registers BeanDefinition. BeanPostProcessors wrap bean only if advisors match.",
    "followUps": [
      "What creates the proxy then?"
    ],
    "trick": "@Service always wraps in CGLIB.",
    "wrongAnswer": "Every Spring bean is proxied."
  },
  {
    "id": "trap-3",
    "topic": "primary-qualifier",
    "level": "advanced",
    "question": "@Primary vs @Qualifier — which wins?",
    "answer30s": "@Qualifier on the injection point wins over @Primary. Primary is default only when no qualifier specified.",
    "answer2m": "determineAutowireCandidate: filter by qualifier first, then single @Primary among remaining.",
    "followUps": [
      "Two @Primary beans?"
    ],
    "trick": "@Primary overrides @Qualifier.",
    "wrongAnswer": "They are equivalent."
  },
  {
    "id": "trap-4",
    "topic": "constructor-autowired",
    "level": "advanced",
    "question": "Is @Autowired required on single constructor in Boot 3?",
    "answer30s": "No since Spring 4.3 — single constructor is autowired implicitly.",
    "answer2m": "AutowiredAnnotationBeanPostProcessor treats single ctor as injection point without annotation.",
    "followUps": [
      "Multiple constructors?"
    ],
    "trick": "Always required on constructor.",
    "wrongAnswer": "Lombok @RequiredArgsConstructor replaces @Autowired."
  },
  {
    "id": "trap-5",
    "topic": "configuration-cglib",
    "level": "advanced",
    "question": "Why does @Configuration use CGLIB?",
    "answer30s": "Full @Configuration is subclassed so @Bean method inter-calls return same singleton from container.",
    "answer2m": "ConfigurationClassEnhancer replaces @Bean method body with getBean call through enhanced config instance.",
    "followUps": [
      "proxyBeanMethods=false effect?"
    ],
    "trick": "@Configuration never uses CGLIB.",
    "wrongAnswer": "Each @Bean call always creates new instance."
  },
  {
    "id": "trap-6",
    "topic": "lite-config",
    "level": "advanced",
    "question": "What breaks with proxyBeanMethods=false?",
    "answer30s": "Calling another @Bean method directly from @Bean method creates new instance — not singleton.",
    "answer2m": "Lite @Configuration treats @Bean as plain factory methods on @Component.",
    "followUps": [
      "When use lite mode?"
    ],
    "trick": "Nothing breaks — same semantics.",
    "wrongAnswer": "Only affects @Import order."
  },
  {
    "id": "trap-7",
    "topic": "transactional-private",
    "level": "advanced",
    "question": "Can @Transactional work on private methods?",
    "answer30s": "No — Spring AOP cannot advise private methods (CGLIB still cannot override private).",
    "answer2m": "Pointcut matches but proxy cannot intercept private method on subclass.",
    "followUps": [
      "Package-private in Java 17?"
    ],
    "trick": "Yes via reflection anywhere.",
    "wrongAnswer": "Works if method is final."
  },
  {
    "id": "trap-8",
    "topic": "transactional-self",
    "level": "advanced",
    "question": "this.processPayment() inside @Transactional class — TX applied?",
    "answer30s": "No — self-invocation skips proxy. Same transaction only if called from external bean.",
    "answer2m": "Caller must enter through proxy for TransactionInterceptor.",
    "followUps": [
      "Fix patterns?"
    ],
    "trick": "Yes — same class always shares TX.",
    "wrongAnswer": "Only REQUIRES_NEW fails."
  },
  {
    "id": "trap-9",
    "topic": "async-self",
    "level": "advanced",
    "question": "@Async on method called internally — runs async?",
    "answer30s": "No — self-invocation bypasses AsyncExecutionInterceptor.",
    "answer2m": "Must call through injected proxy or separate bean.",
    "followUps": [
      "@Async on @EventListener?"
    ],
    "trick": "Yes always async.",
    "wrongAnswer": "Only fails on void return."
  },
  {
    "id": "trap-10",
    "topic": "cacheable-self",
    "level": "advanced",
    "question": "@Cacheable never caches — why?",
    "answer30s": "Often self-invocation or missing @EnableCaching or wrong CacheManager bean.",
    "answer2m": "CacheInterceptor only on proxy entry.",
    "followUps": [
      "sync=true stampede?"
    ],
    "trick": "Redis down.",
    "wrongAnswer": "TTL too short."
  },
  {
    "id": "trap-11",
    "topic": "enable-caching",
    "level": "advanced",
    "question": "@Cacheable without @EnableCaching?",
    "answer30s": "Silently ignored — no CacheInterceptor registered.",
    "answer2m": "Need @EnableCaching or Boot cache auto-config with starter.",
    "followUps": [
      "How detect in prod?"
    ],
    "trick": "Throws at startup.",
    "wrongAnswer": "Falls back to ConcurrentHashMap always."
  },
  {
    "id": "trap-12",
    "topic": "repository-tx",
    "level": "advanced",
    "question": "@Transactional on Spring Data repository — good practice?",
    "answer30s": "Discouraged — TX boundaries belong on service layer; repo @Transactional easy to misuse readOnly.",
    "answer2m": "SimpleJpaRepository methods may open TX per call; composition with service TX differs.",
    "followUps": [
      "@Modifying without TX?"
    ],
    "trick": "Best practice for all apps.",
    "wrongAnswer": "Repositories cannot use TX."
  },
  {
    "id": "trap-13",
    "topic": "jpa-lazy",
    "level": "advanced",
    "question": "LazyInitializationException outside TX?",
    "answer30s": "Accessing lazy association after session closed — no Open Session In View or left TX.",
    "answer2m": "Hibernate session bound to transaction; outside TX no session.",
    "followUps": [
      "OSIV tradeoff?"
    ],
    "trick": "Bug in Hibernate only.",
    "wrongAnswer": "Always fetch EAGER fix."
  },
  {
    "id": "trap-14",
    "topic": "qualifier-typo",
    "level": "advanced",
    "question": "NoSuchBeanDefinitionException with @Qualifier?",
    "answer30s": "Typo in qualifier string vs @Bean name or missing qualifier on bean definition.",
    "answer2m": "QualifierAnnotationAutowireCandidateResolver finds zero matches.",
    "followUps": [
      "@Primary fix?"
    ],
    "trick": "Spring picks random bean.",
    "wrongAnswer": "Use @Autowired by concrete class."
  },
  {
    "id": "trap-15",
    "topic": "circular-constructor",
    "level": "advanced",
    "question": "Constructor circular dependency A→B→A?",
    "answer30s": "BeanCurrentlyInCreationException unless one side is @Lazy or setter/field injection (Boot allow-circular-references).",
    "answer2m": "Constructor cycle cannot complete — object needs other fully built.",
    "followUps": [
      "@Lazy on one ctor param?"
    ],
    "trick": "Spring always fixes automatically.",
    "wrongAnswer": "Use @DependsOn."
  },
  {
    "id": "trap-16",
    "topic": "prototype-singleton",
    "level": "advanced",
    "question": "Singleton injecting @Scope prototype?",
    "answer30s": "One prototype instance injected at singleton creation — not new per use.",
    "answer2m": "Use ObjectProvider<Proto> or @Lookup or scoped proxy.",
    "followUps": [
      "Provider.getObject()?"
    ],
    "trick": "New prototype every call automatically.",
    "wrongAnswer": "@Scope fixes it alone."
  },
  {
    "id": "trap-17",
    "topic": "request-scope",
    "level": "advanced",
    "question": "@RequestScope bean in singleton without proxy?",
    "answer30s": "Singleton holds wrong/dead request instance — need scoped proxy.",
    "answer2m": "ScopedProxyFactoryBean delegates to current request scope.",
    "followUps": [
      "@RequestScope on controller?"
    ],
    "trick": "Works fine always.",
    "wrongAnswer": "Use @SessionScope instead."
  },
  {
    "id": "trap-18",
    "topic": "value-spel",
    "level": "advanced",
    "question": "@Value(\"${key}\") vs @Value(\"#{bean.method()}\")?",
    "answer30s": "${} property placeholder; #{} SpEL evaluated once at injection.",
    "answer2m": "EmbeddedValueResolver vs BeanExpressionResolver.",
    "followUps": [
      "Refresh @Value?"
    ],
    "trick": "Same thing.",
    "wrongAnswer": "SpEL re-evaluates each call."
  },
  {
    "id": "trap-19",
    "topic": "configuration-properties",
    "level": "advanced",
    "question": "@ConfigurationProperties vs @Value?",
    "answer30s": "Type-safe binding, validation, relaxed binding, lists/maps — @Value is single property injection.",
    "answer2m": "ConfigurationPropertiesBindingPostProcessor vs field @Value.",
    "followUps": [
      "@ConstructorBinding?"
    ],
    "trick": "@Value preferred for all.",
    "wrongAnswer": "Cannot bind nested objects with @ConfigurationProperties."
  },
  {
    "id": "trap-20",
    "topic": "transactional-rollback",
    "level": "advanced",
    "question": "Checked exception — does @Transactional rollback?",
    "answer30s": "Default rollback only on unchecked — checked commits unless rollbackFor specified.",
    "answer2m": "RuleBasedTransactionAttribute rollback rules.",
    "followUps": [
      "rollbackFor=Exception.class?"
    ],
    "trick": "Always rolls back.",
    "wrongAnswer": "Only JDBC rollback fails."
  },
  {
    "id": "trap-21",
    "topic": "read-only-write",
    "level": "advanced",
    "question": "@Transactional(readOnly=true) but entity modified?",
    "answer30s": "May throw, flush unexpectedly, or performance issues — readOnly hints Hibernate flush mode.",
    "answer2m": "Connection.setReadOnly(true) on some drivers.",
    "followUps": [
      "When use readOnly?"
    ],
    "trick": "Always blocks writes at DB.",
    "wrongAnswer": "Same as no @Transactional."
  },
  {
    "id": "trap-22",
    "topic": "requires-new-self",
    "level": "advanced",
    "question": "@Transactional(REQUIRES_NEW) via this.internal()?",
    "answer30s": "Never starts new TX — must be external proxy call.",
    "answer2m": "TransactionPropagation.REQUIRES_NEW in interceptor only on proxy entry.",
    "followUps": [
      "Programmatic TransactionTemplate?"
    ],
    "trick": "Works on this call.",
    "wrongAnswer": "Nested always uses savepoint."
  },
  {
    "id": "trap-23",
    "topic": "event-after-commit",
    "level": "advanced",
    "question": "@EventListener vs @TransactionalEventListener AFTER_COMMIT?",
    "answer30s": "Plain @EventListener runs in same thread/TX phase as publish — may read uncommitted data.",
    "answer2m": "TransactionalEventListener registers synchronization for afterCommit.",
    "followUps": [
      "AFTER_ROLLBACK use?"
    ],
    "trick": "Identical behavior.",
    "wrongAnswer": "Kafka must use @EventListener only."
  },
  {
    "id": "trap-24",
    "topic": "kafka-tx",
    "level": "advanced",
    "question": "Kafka send inside @Transactional before commit?",
    "answer30s": "Consumer may read before DB commit — race. Use outbox or afterCommit.",
    "answer2m": "ChainedKafkaTransactionManager for exactly-once patterns.",
    "followUps": [
      "@Transactional on listener?"
    ],
    "trick": "Always atomic with DB.",
    "wrongAnswer": "Kafka has no TX."
  },
  {
    "id": "trap-25",
    "topic": "preauthorize-self",
    "level": "advanced",
    "question": "@PreAuthorize on method called internally?",
    "answer30s": "Bypassed — same self-invocation trap as @Transactional.",
    "answer2m": "MethodSecurityInterceptor on proxy only.",
    "followUps": [
      "URL security enough?"
    ],
    "trick": "Works on private methods.",
    "wrongAnswer": "@Secured is different."
  },
  {
    "id": "trap-26",
    "topic": "security-order",
    "level": "advanced",
    "question": "Security vs @Transactional advisor order?",
    "answer30s": "Security should run before TX opens — lower @Order on security advisor.",
    "answer2m": "Wrong order: TX open before auth check.",
    "followUps": [
      "@Order values?"
    ],
    "trick": "Order does not matter.",
    "wrongAnswer": "Filter chain handles all."
  },
  {
    "id": "trap-27",
    "topic": "mockbean-primary",
    "level": "advanced",
    "question": "@MockBean @Primary conflicts in test?",
    "answer30s": "Mock replaces bean — unexpected if multiple mocks same type without @Qualifier.",
    "answer2m": "MockitoPostProcessor definition override.",
    "followUps": [
      "@SpyBean difference?"
    ],
    "trick": "Cannot mock in Spring tests.",
    "wrongAnswer": "@MockBean only works in unit tests without context."
  },
  {
    "id": "trap-28",
    "topic": "webmvctest-tx",
    "level": "advanced",
    "question": "@WebMvcTest loads @Transactional service?",
    "answer30s": "No — services are @MockBean; no real TX proxy on service.",
    "answer2m": "Slice test only loads web layer.",
    "followUps": [
      "@SpringBootTest for TX integration?"
    ],
    "trick": "Full TX in slice.",
    "wrongAnswer": "@WebMvcTest rolls back automatically."
  },
  {
    "id": "trap-29",
    "topic": "datajpatest-service",
    "level": "advanced",
    "question": "@DataJpaTest injects @Service?",
    "answer30s": "No — JPA slice excludes service beans unless @Import.",
    "answer2m": "Only repository + TestEntityManager + auto-config.",
    "followUps": [
      "@Transactional on test class?"
    ],
    "trick": "Loads full application.",
    "wrongAnswer": "Same as production TX."
  },
  {
    "id": "trap-30",
    "topic": "component-scan",
    "level": "advanced",
    "question": "@ComponentScan on wrong package?",
    "answer30s": "Beans not found — empty context or missing controllers.",
    "answer2m": "SpringBootApplication scans package of main class and below.",
    "followUps": [
      "scanBasePackages?"
    ],
    "trick": "Scans entire classpath.",
    "wrongAnswer": "@Import replaces scan."
  },
  {
    "id": "trap-31",
    "topic": "conditional-missing",
    "level": "advanced",
    "question": "@ConditionalOnMissingBean user override?",
    "answer30s": "User @Bean prevents auto-config bean — by design back off.",
    "answer2m": "OnBeanCondition checks registry at processing time.",
    "followUps": [
      "@Primary auto-config?"
    ],
    "trick": "Auto-config always wins.",
    "wrongAnswer": "Missing bean causes crash."
  },
  {
    "id": "trap-32",
    "topic": "feign-tx",
    "level": "advanced",
    "question": "@FeignClient call joins local @Transactional?",
    "answer30s": "No — HTTP is separate; local TX does not span unless distributed TX (rare).",
    "answer2m": "Feign JDK proxy is HTTP client.",
    "followUps": [
      "Saga pattern?"
    ],
    "trick": "XA joins Feign.",
    "wrongAnswer": "Feign is synchronous only."
  },
  {
    "id": "trap-33",
    "topic": "scheduling-async",
    "level": "advanced",
    "question": "@Scheduled method @Async together?",
    "answer30s": "Scheduler invokes method — @Async on scheduled method may double-wrap; understand executor.",
    "answer2m": "ScheduledAnnotationBeanPostProcessor vs AsyncAnnotationBeanPostProcessor.",
    "followUps": [
      "fixedRate vs fixedDelay?"
    ],
    "trick": "Cannot combine.",
    "wrongAnswer": "@Scheduled always async."
  },
  {
    "id": "trap-34",
    "topic": "final-class",
    "level": "advanced",
    "question": "@Transactional on final class?",
    "answer30s": "CGLIB cannot subclass final class — use interface JDK proxy or remove final.",
    "answer2m": "AutoProxyCreator fails or skips advising.",
    "followUps": [
      "Record as service?"
    ],
    "trick": "Works with CGLIB anyway.",
    "wrongAnswer": "Make class non-final optional."
  },
  {
    "id": "trap-35",
    "topic": "interface-tx",
    "level": "advanced",
    "question": "@Transactional on interface method only?",
    "answer30s": "Works — Spring reads annotation from interface for JDK proxy.",
    "answer2m": "AnnotationTransactionAttributeSource checks interface methods.",
    "followUps": [
      "@Cacheable on impl only?"
    ],
    "trick": "Must be on impl class only.",
    "wrongAnswer": "Boot never uses JDK proxies."
  },
  {
    "id": "trap-36",
    "topic": "boot-tx-enable",
    "level": "advanced",
    "question": "Is @EnableTransactionManagement required in Boot?",
    "answer30s": "Boot auto-config enables when spring-tx + DataSource on classpath.",
    "answer2m": "TransactionAutoConfiguration.",
    "followUps": [
      "Manual @EnableTransactionManagement?"
    ],
    "trick": "Always required.",
    "wrongAnswer": "Only for JTA."
  },
  {
    "id": "trap-37",
    "topic": "multiple-cache-manager",
    "level": "advanced",
    "question": "Two CacheManager beans without @Qualifier?",
    "answer30s": "NoUniqueBeanDefinitionException on @Cacheable unless @Primary on one.",
    "answer2m": "CacheInterceptor resolves CacheManager bean.",
    "followUps": [
      "@CacheConfig cacheManager?"
    ],
    "trick": "First bean wins.",
    "wrongAnswer": "Cache disabled silently."
  },
  {
    "id": "trap-38",
    "topic": "async-executor",
    "level": "advanced",
    "question": "@Async without custom executor?",
    "answer30s": "SimpleAsyncTaskExecutor — new thread per task, unbounded.",
    "answer2m": "AsyncAnnotationBeanPostProcessor default executor.",
    "followUps": [
      "ThreadPoolTaskExecutor bean name taskExecutor?"
    ],
    "trick": "Uses ForkJoinPool.commonPool().",
    "wrongAnswer": "@Async never works without bean."
  },
  {
    "id": "trap-39",
    "topic": "validation-nested",
    "level": "advanced",
    "question": "@Valid on parent but not nested list items?",
    "answer30s": "Nested elements not validated — need @Valid on collection elements.",
    "answer2m": "Cascade validation in Bean Validation.",
    "followUps": [
      "@Validated groups?"
    ],
    "trick": "Always cascades.",
    "wrongAnswer": "@NotNull on list validates elements."
  },
  {
    "id": "trap-40",
    "topic": "controller-valid",
    "level": "advanced",
    "question": "@RestController without @Validated — method params?",
    "answer30s": "Class-level method validation needs @Validated on class for @NotNull on method params.",
    "answer2m": "MethodValidationPostProcessor.",
    "followUps": [
      "@Valid on @RequestBody enough?"
    ],
    "trick": "@Valid validates everything.",
    "wrongAnswer": "Validation only in XML."
  },
  {
    "id": "trap-41",
    "topic": "responsebody-string",
    "level": "advanced",
    "question": "@RestController returns String — JSON or plain?",
    "answer30s": "String return is plain text body unless produces=application/json configured.",
    "answer2m": "StringHttpMessageConverter vs MappingJackson2HttpMessageConverter order.",
    "followUps": [
      "ResponseEntity<String>?"
    ],
    "trick": "Always JSON.",
    "wrongAnswer": "Jackson always wraps string."
  },
  {
    "id": "trap-42",
    "topic": "pathvariable-name",
    "level": "advanced",
    "question": "@PathVariable without name — fails when?",
    "answer30s": "Parameter name lost without -parameters compile flag — must use @PathVariable(\"id\").",
    "answer2m": "DefaultParameterNameDiscoverer.",
    "followUps": [
      "Kotlin data class?"
    ],
    "trick": "Always works in Boot.",
    "wrongAnswer": "Only in tests."
  },
  {
    "id": "trap-43",
    "topic": "exception-handler-order",
    "level": "advanced",
    "question": "Multiple @ControllerAdvice — which wins?",
    "answer30s": "@Order on advice class; most specific exception handler method wins within resolver.",
    "answer2m": "ExceptionHandlerExceptionResolver sorts handlers.",
    "followUps": [
      "@RestControllerAdvice?"
    ],
    "trick": "First declared wins always.",
    "wrongAnswer": "Only one advice allowed."
  },
  {
    "id": "trap-44",
    "topic": "dirties-context",
    "level": "advanced",
    "question": "@DirtiesContext overuse?",
    "answer30s": "Reloads entire context — very slow test suite.",
    "answer2m": "DirtiesContextTestExecutionListener.",
    "followUps": [
      "AFTER_CLASS vs AFTER_EACH?"
    ],
    "trick": "No performance impact.",
    "wrongAnswer": "Only dirties one bean."
  },
  {
    "id": "trap-45",
    "topic": "sql-transactional-test",
    "level": "advanced",
    "question": "@Sql + @Transactional test — data visible?",
    "answer30s": "Test TX rolls back — @Sql data rolled back unless @Commit.",
    "answer2m": "TransactionalTestExecutionListener default rollback.",
    "followUps": [
      "@Sql BEFORE_TEST_METHOD?"
    ],
    "trick": "Sql always persists.",
    "wrongAnswer": "@Sql runs after rollback."
  },
  {
    "id": "trap-46",
    "topic": "refresh-scope-stale",
    "level": "advanced",
    "question": "@RefreshScope singleton holds direct reference?",
    "answer30s": "Singleton caches old instance — must inject scoped proxy.",
    "answer2m": "Refresh recreates bean behind proxy.",
    "followUps": [
      "/actuator/refresh?"
    ],
    "trick": "Refresh updates all singletons.",
    "wrongAnswer": "Only works in tests."
  },
  {
    "id": "trap-47",
    "topic": "lookup-prototype",
    "level": "advanced",
    "question": "@Lookup for prototype in singleton?",
    "answer30s": "CGLIB overrides method to call getBean each invocation.",
    "answer2m": "AbstractMethodOverride lookup method injection.",
    "followUps": [
      "ObjectProvider vs Lookup?"
    ],
    "trick": "Creates new singleton.",
    "wrongAnswer": "@Bean method equivalent always."
  },
  {
    "id": "trap-48",
    "topic": "depends-on-order",
    "level": "advanced",
    "question": "@DependsOn guarantees @PostConstruct order?",
    "answer30s": "Only bean instantiation order — not init callback order across unrelated beans.",
    "answer2m": "DependsOn metadata on BeanDefinition.",
    "followUps": [
      "@Order on @PostConstruct?"
    ],
    "trick": "Full lifecycle order guaranteed.",
    "wrongAnswer": "Same as @Priority."
  },
  {
    "id": "trap-49",
    "topic": "resource-vs-autowired",
    "level": "advanced",
    "question": "@Resource vs @Autowired difference?",
    "answer30s": "@Resource JSR-250 name-first (by field name); @Autowired type-first with @Qualifier.",
    "answer2m": "CommonAnnotationBeanPostProcessor vs AutowiredAnnotationBeanPostProcessor.",
    "followUps": [
      "@Inject?"
    ],
    "trick": "Identical.",
    "wrongAnswer": "@Resource supports collections only."
  },
  {
    "id": "trap-50",
    "topic": "inject-required",
    "level": "advanced",
    "question": "@Inject optional dependency?",
    "answer30s": "No required=false — use Optional, ObjectProvider, or @Autowired(required=false).",
    "answer2m": "JSR-330 @Inject always required.",
    "followUps": [
      "Provider<T> from javax?"
    ],
    "trick": "@Inject has required=false.",
    "wrongAnswer": "Optional not supported."
  },
  {
    "id": "trap-51",
    "topic": "lazy-circular",
    "level": "advanced",
    "question": "@Lazy on constructor param breaks cycle?",
    "answer30s": "Injects lazy proxy — defers creation until first use, breaks constructor cycle.",
    "answer2m": "LazyAnnotationBeanPostProcessor lazy resolution.",
    "followUps": [
      "@Lazy on class?"
    ],
    "trick": "Makes bean prototype.",
    "wrongAnswer": "Cycles always fail."
  },
  {
    "id": "trap-52",
    "topic": "transactional-cache-order",
    "level": "advanced",
    "question": "@Cacheable + @Transactional same method?",
    "answer30s": "Cache may store before commit — stale on rollback; evict on failure or cache after commit pattern.",
    "answer2m": "Advisor order matters — default cache often after TX begin.",
    "followUps": [
      "unless=\"#result==null\"?"
    ],
    "trick": "Cache inside TX always safe.",
    "wrongAnswer": "Never combine."
  },
  {
    "id": "trap-53",
    "topic": "observed-self",
    "level": "advanced",
    "question": "@Observed on internal call?",
    "answer30s": "Self-invocation — no observation span.",
    "answer2m": "ObservationAspect on proxy.",
    "followUps": [
      "Micrometer tracing?"
    ],
    "trick": "Always traces.",
    "wrongAnswer": "Only works with Zipkin."
  },
  {
    "id": "trap-54",
    "topic": "native-hints",
    "level": "advanced",
    "question": "Boot 3 native image @ConfigurationProperties fails?",
    "answer30s": "Missing reflection hints — use @RegisterReflectionForBinding or AOT.",
    "answer2m": "RuntimeHintsRegistrar at build time.",
    "followUps": [
      "@ImportRuntimeHints?"
    ],
    "trick": "GraalVM not supported.",
    "wrongAnswer": "All beans need hints."
  },
  {
    "id": "trap-55",
    "topic": "http-exchange-feign",
    "level": "advanced",
    "question": "@HttpExchange vs @FeignClient?",
    "answer30s": "Boot 3 declarative HTTP via HttpServiceProxyFactory — not OpenFeign.",
    "answer2m": "WebClient-backed JDK proxy.",
    "followUps": [
      "Same as @RestController?"
    ],
    "trick": "Feign is default in Boot 3.",
    "wrongAnswer": "Cannot use with interfaces."
  },
  {
    "id": "trap-56",
    "topic": "modifying-clear",
    "level": "advanced",
    "question": "@Modifying without clearAutomatically?",
    "answer30s": "Persistence context may contain stale entities after bulk update.",
    "answer2m": "EntityManager clear after update query.",
    "followUps": [
      "@Transactional required?"
    ],
    "trick": "Auto clear always on.",
    "wrongAnswer": "Use save() instead."
  },
  {
    "id": "trap-57",
    "topic": "version-optimistic",
    "level": "advanced",
    "question": "@Version not incremented — conflict?",
    "answer30s": "OptimisticLockException when stale version at flush.",
    "answer2m": "Hibernate increments version on successful update.",
    "followUps": [
      "Pessimistic @Lock?"
    ],
    "trick": "Silent overwrite.",
    "wrongAnswer": "Only in distributed systems."
  },
  {
    "id": "trap-58",
    "topic": "kafka-listener-tx",
    "level": "advanced",
    "question": "@KafkaListener @Transactional rollback — message?",
    "answer30s": "Default: message may ack despite rollback unless manual ack + error handler.",
    "answer2m": "Kafka listener container ack mode.",
    "followUps": [
      "Exactly once?"
    ],
    "trick": "Always redelivers.",
    "wrongAnswer": "Kafka joins JPA TX automatically."
  },
  {
    "id": "trap-59",
    "topic": "spring-boot-main",
    "level": "advanced",
    "question": "@SpringBootApplication scan parent package?",
    "answer30s": "Scans only com.app and subpackages — not sibling packages.",
    "answer2m": "ComponentScan default basePackageClasses from main.",
    "followUps": [
      "scanBasePackages?"
    ],
    "trick": "Scans entire jar.",
    "wrongAnswer": "@ComponentScan on library auto included."
  }
];

export const RAPID_QS: InterviewQ[] = [
  {
    "id": "rapid-1",
    "topic": "Rapid",
    "level": "beginner",
    "question": "What does @ComponentScan do?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-2",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Difference @Component vs @Bean?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-3",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@Configuration proxyBeanMethods?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-4",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "What is BeanDefinition?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-5",
    "topic": "Rapid",
    "level": "advanced",
    "question": "When is bean instantiated?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-6",
    "topic": "Rapid",
    "level": "beginner",
    "question": "What is BeanPostProcessor?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-7",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Autowired resolution order?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-8",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@Qualifier vs @Primary?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-9",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@Resource name-first?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-10",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "@Inject vs @Autowired?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-11",
    "topic": "Rapid",
    "level": "beginner",
    "question": "@Value ${} vs #{}?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-12",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@ConfigurationProperties binding?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-13",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Constructor injection default?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-14",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Field injection why avoid?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-15",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Circular dependency fix?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-16",
    "topic": "Rapid",
    "level": "beginner",
    "question": "@Lazy breaks cycle how?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-17",
    "topic": "Rapid",
    "level": "advanced",
    "question": "ObjectProvider use case?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-18",
    "topic": "Rapid",
    "level": "advanced",
    "question": "What is ApplicationContext?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-19",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "refresh() vs run()?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-20",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@SpringBootApplication meta?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-21",
    "topic": "Rapid",
    "level": "beginner",
    "question": "@EnableAutoConfiguration?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-22",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "@ConditionalOnClass?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-23",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@ConditionalOnMissingBean?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-24",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Auto-config imports file?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-25",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Stereotype differences?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-26",
    "topic": "Rapid",
    "level": "beginner",
    "question": "@Repository exception translation?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-27",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@RestController vs @Controller?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-28",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "@PostConstruct when?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-29",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@PreDestroy prototype?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-30",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@Scope singleton default?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-31",
    "topic": "Rapid",
    "level": "beginner",
    "question": "@Scope prototype trap?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-32",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Request scope proxy?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-33",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@Transactional proxy type?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-34",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Self-invocation fix?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-35",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Propagation REQUIRED?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-36",
    "topic": "Rapid",
    "level": "beginner",
    "question": "REQUIRES_NEW when?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-37",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "NESTED savepoint?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-38",
    "topic": "Rapid",
    "level": "advanced",
    "question": "readOnly true effect?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-39",
    "topic": "Rapid",
    "level": "advanced",
    "question": "rollbackFor checked?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-40",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Isolation levels?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-41",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Transaction timeout?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-42",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@EnableTransactionManagement?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-43",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "PlatformTransactionManager?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-44",
    "topic": "Rapid",
    "level": "advanced",
    "question": "JpaTransactionManager?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-45",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@Async executor bean?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-46",
    "topic": "Rapid",
    "level": "beginner",
    "question": "@Async return types?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-47",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@EnableAsync?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-48",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Self-invocation @Async?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-49",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "@Cacheable key SpEL?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-50",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@CacheEvict allEntries?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-51",
    "topic": "Rapid",
    "level": "beginner",
    "question": "@EnableCaching required?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-52",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "CacheManager bean?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-53",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Redis cache TTL?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-54",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@PreAuthorize SpEL?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-55",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "@PostAuthorize?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-56",
    "topic": "Rapid",
    "level": "beginner",
    "question": "@EnableMethodSecurity?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-57",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Filter chain vs method security?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-58",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "SecurityFilterChain bean?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-59",
    "topic": "Rapid",
    "level": "advanced",
    "question": "JWT Bearer filter?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-60",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@Valid vs @Validated?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-61",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Bean Validation groups?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-62",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@ControllerAdvice order?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-63",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@ExceptionHandler specificity?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-64",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "@InitBinder purpose?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-65",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@RequestBody converter?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-66",
    "topic": "Rapid",
    "level": "beginner",
    "question": "@PathVariable name?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-67",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "@PageableDefault?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-68",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@TransactionalEventListener phases?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-69",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@EventListener sync?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-70",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "ApplicationEventPublisher?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-71",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Outbox pattern?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-72",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@KafkaListener topics?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-73",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Consumer group id?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-74",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Ack mode manual?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-75",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@FeignClient fallback?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-76",
    "topic": "Rapid",
    "level": "beginner",
    "question": "@CircuitBreaker states?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-77",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@Retryable maxAttempts?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-78",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@Scheduled cron?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-79",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "fixedDelay vs fixedRate?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-80",
    "topic": "Rapid",
    "level": "advanced",
    "question": "TaskScheduler bean?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-81",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Spring Data repo proxy?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-82",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "@Query native?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-83",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@Modifying flush?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-84",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@Version optimistic?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-85",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "@EntityGraph fetch?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-86",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Open Session In View?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-87",
    "topic": "Rapid",
    "level": "advanced",
    "question": "N+1 fix?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-88",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "DTO vs entity API?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-89",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@Mapper MapStruct?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-90",
    "topic": "Rapid",
    "level": "advanced",
    "question": "CGLIB vs JDK proxy?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-91",
    "topic": "Rapid",
    "level": "beginner",
    "question": "proxyTargetClass default Boot?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-92",
    "topic": "Rapid",
    "level": "advanced",
    "question": "exposeProxy true?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-93",
    "topic": "Rapid",
    "level": "advanced",
    "question": "AopContext.currentProxy?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-94",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "@Aspect @Around?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-95",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@Order lower meaning?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-96",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Advisor chain order?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-97",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "@RefreshScope?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-98",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Cloud Config refresh?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-99",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@MockBean replaces?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-100",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "@SpyBean partial mock?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-101",
    "topic": "Rapid",
    "level": "beginner",
    "question": "@WebMvcTest slice?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-102",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@DataJpaTest slice?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-103",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "@SpringBootTest full?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-104",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@DynamicPropertySource?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-105",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@ServiceConnection TC?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-106",
    "topic": "Rapid",
    "level": "beginner",
    "question": "@Sql scripts?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-107",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@Commit test?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-108",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@DirtiesContext cost?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-109",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Actuator /health?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-110",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Micrometer @Observed?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-111",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Trace propagation MDC?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-112",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "ProblemDetail Boot 3?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-113",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Jakarta vs javax?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-114",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Spring 6 baseline?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-115",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Virtual threads Boot 3.2?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-116",
    "topic": "Rapid",
    "level": "beginner",
    "question": "HttpExchange client?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-117",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Native image AOT?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-118",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "@ImportRuntimeHints?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-119",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Multiple DataSource?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-120",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@Primary DataSource?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-121",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Flyway vs Liquibase?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-122",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Connection pool Hikari?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-123",
    "topic": "Rapid",
    "level": "advanced",
    "question": "spring.jpa.open-in-view?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-124",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Batch insert Hibernate?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-125",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Second level cache?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-126",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Query timeout?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-127",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Idempotency key design?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-128",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Payment TX boundaries?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-129",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Saga vs 2PC?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-130",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "DLQ Kafka?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-131",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Poison message?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-132",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Consumer concurrency?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-133",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Producer idempotence?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-134",
    "topic": "Rapid",
    "level": "advanced",
    "question": "acks=all meaning?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-135",
    "topic": "Rapid",
    "level": "advanced",
    "question": "minISR?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-136",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Transactional outbox relay?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-137",
    "topic": "Rapid",
    "level": "advanced",
    "question": "CDC Debezium?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-138",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Rate limit Resilience4j?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-139",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Bulkhead types?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-140",
    "topic": "Rapid",
    "level": "advanced",
    "question": "TimeLimiter?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-141",
    "topic": "Rapid",
    "level": "beginner",
    "question": "@Lock registry?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-142",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Distributed lock Redis?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-143",
    "topic": "Rapid",
    "level": "advanced",
    "question": "ShedLock @Scheduled?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-144",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Multi-tenant discriminator?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-145",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "@Filter Hibernate?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-146",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Schema migration zero downtime?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-147",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Blue-green deploy beans?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-148",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Feature flag @ConditionalOnProperty?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-149",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Profile prod vs dev?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-150",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@TestConfiguration import?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-151",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Testcontainers reuse?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-152",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Slice vs full integration?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-153",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Contract testing?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-154",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "ArchUnit layer rules?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-155",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Bean overriding allow?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-156",
    "topic": "Rapid",
    "level": "beginner",
    "question": "spring.main.lazy-initialization?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-157",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "FailureAnalyzer?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-158",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Condition report debug?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-159",
    "topic": "Rapid",
    "level": "advanced",
    "question": "ApplicationRunner order?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-160",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "SmartLifecycle?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-161",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Graceful shutdown?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-162",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Actuator metrics export?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-163",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Log correlation traceId?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-164",
    "topic": "Rapid",
    "level": "advanced",
    "question": "@Controller parameter object?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-165",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Record as DTO?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-166",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Sealed classes Spring?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-167",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Kotlin coroutines @Async?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-168",
    "topic": "Rapid",
    "level": "advanced",
    "question": "RSocket @MessageMapping?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-169",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "GraphQL @Controller?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-170",
    "topic": "Rapid",
    "level": "advanced",
    "question": "WebFlux @Transactional?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-171",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Blockhound reactive?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-172",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "R2DBC vs JPA?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-173",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Mongo @Document?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-174",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Elasticsearch @Document?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-175",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Cassandra @Table?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-176",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Quartz @DisallowConcurrentExecution?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-177",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Batch @StepScope?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-178",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Integration @ServiceActivator?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-179",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Camel @Consume?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-180",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Statemachine?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-181",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Camunda delegate?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-182",
    "topic": "Rapid",
    "level": "advanced",
    "question": "HATEOAS @RepositoryRestResource?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-183",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Spring Modulith?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-184",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Structured logging JSON?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-185",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Error handling ProblemDetail?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-186",
    "topic": "Rapid",
    "level": "beginner",
    "question": "CORS @CrossOrigin?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-187",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "CSRF disabled REST?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-188",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Session fixation?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-189",
    "topic": "Rapid",
    "level": "advanced",
    "question": "OAuth2 Resource Server?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-190",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Opaque token introspection?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-191",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Method security @AuthenticationPrincipal?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-192",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Tenant resolver filter?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-193",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "PII logging avoid?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-194",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Secrets @Value env?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-195",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Vault integration?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-196",
    "topic": "Rapid",
    "level": "beginner",
    "question": "K8s config map mount?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-197",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Liveness vs readiness?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-198",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Heap dump OOM bean?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-199",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Thread dump stuck?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-200",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Deadlock detection?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-201",
    "topic": "Rapid",
    "level": "beginner",
    "question": "Connection leak detection?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-202",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Metric cardinality trap?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-203",
    "topic": "Rapid",
    "level": "advanced",
    "question": "High cardinality tags?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-204",
    "topic": "Rapid",
    "level": "advanced",
    "question": "SLO error budget?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-205",
    "topic": "Rapid",
    "level": "intermediate",
    "question": "Runbook @Transactional timeout?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-206",
    "topic": "Rapid",
    "level": "beginner",
    "question": "On-call playbooks?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  },
  {
    "id": "rapid-207",
    "topic": "Rapid",
    "level": "advanced",
    "question": "Postmortem bean misconfig?",
    "answer30s": "State mechanism (which processor/proxy), default Boot 3 behavior, and one production trap.",
    "answer2m": "Expand: SCAN→REGISTER→INJECT→PROXY→EXECUTE pipeline, name the BeanPostProcessor or advisor, cite self-invocation or ordering if AOP-related.",
    "followUps": [
      "What breaks at scale?",
      "How do you debug it?"
    ]
  }
];

export const SCENARIOS: ScenarioQ[] = [
  {
    "id": "scenario-1",
    "title": "TX not rolling back",
    "symptom": "Payment fails but DB committed",
    "cause": "Self-invocation on @Transactional helper",
    "mechanism": "this.charge() bypasses TransactionInterceptor",
    "debug": "Breakpoint on proxy entry vs internal call; check stack trace for $$EnhancerBySpringCGLIB$$",
    "fix": "Move TX method to PaymentService called from controller via injected bean",
    "prevent": "Never call @Transactional methods via this",
    "interviewAnswer": "Draw external→proxy→TX vs this→no TX"
  },
  {
    "id": "scenario-2",
    "title": "@Cacheable always miss",
    "symptom": "Second identical call hits DB",
    "cause": "Self-invocation or missing @EnableCaching",
    "mechanism": "CacheInterceptor never wraps internal calls",
    "debug": "Enable cache debug logging; AOP proxy on bean",
    "fix": "Inject self or extract CachedPaymentReader bean",
    "prevent": "Integration test proving cache HIT",
    "interviewAnswer": "External call only hits cache aspect"
  },
  {
    "id": "scenario-3",
    "title": "@Async runs sync",
    "symptom": "Controller waits for email send",
    "cause": "Self-invocation or missing @EnableAsync",
    "mechanism": "AsyncExecutionInterceptor not on call path",
    "debug": "Thread name same as HTTP thread",
    "fix": "@Async on separate NotificationService; enable async",
    "prevent": "Verify thread pool metrics",
    "interviewAnswer": "Return CompletableFuture to prove async"
  },
  {
    "id": "scenario-4",
    "title": "NoUniqueBeanDefinition",
    "symptom": "Startup fails on PaymentGateway",
    "cause": "Two implementations no @Qualifier/@Primary",
    "mechanism": "resolveDependency finds 2 candidates",
    "debug": "Actuator /beans; exception lists candidates",
    "fix": "Add @Primary or @Qualifier on injection point",
    "prevent": "Document default gateway in README",
    "interviewAnswer": "@Qualifier beats @Primary"
  },
  {
    "id": "scenario-5",
    "title": "BeanCurrentlyInCreation",
    "symptom": "OrderService ↔ PaymentService cycle",
    "cause": "Constructor circular dependency",
    "mechanism": "Both need other fully constructed",
    "debug": "Graph beans; constructor injection only cycle",
    "fix": "@Lazy on one constructor param or refactor",
    "prevent": "Constructor injection + no cycles",
    "interviewAnswer": "Field injection Boot fallback masks issue"
  },
  {
    "id": "scenario-6",
    "title": "LazyInitializationException",
    "symptom": "JSON 500 on GET order",
    "cause": "Lazy association outside session/TX",
    "mechanism": "OSIV disabled; serializer touches lazy collection",
    "debug": "Stack shows HibernateProxy; open-in-view=false",
    "fix": "JOIN FETCH query or @EntityGraph DTO projection",
    "prevent": "Never expose entity graph in API",
    "interviewAnswer": "TX boundary ends before serialization"
  },
  {
    "id": "scenario-7",
    "title": "403 on secured endpoint",
    "symptom": "JWT valid but 403",
    "cause": "@PreAuthorize on service not controller; missing authority",
    "mechanism": "Method security after authentication",
    "debug": "Enable security debug; check GrantedAuthority list",
    "fix": "Align JWT scopes with hasAuthority SpEL",
    "prevent": "Test with @WithMockUser authorities",
    "interviewAnswer": "Filter auth ≠ method auth"
  },
  {
    "id": "scenario-8",
    "title": "401 not 403",
    "symptom": "No authentication",
    "cause": "Missing Bearer header or wrong issuer",
    "mechanism": "SecurityFilterChain rejects before controller",
    "debug": "Security filter logs; JwtDecoder errors",
    "fix": "Fix resource server config",
    "prevent": "Integration test with mock JWT",
    "interviewAnswer": "401 unauthenticated 403 forbidden"
  },
  {
    "id": "scenario-9",
    "title": "Validation not running",
    "symptom": "Invalid payload accepted",
    "cause": "Missing @Valid on @RequestBody",
    "mechanism": "No Bean Validation trigger",
    "debug": "Breakpoint in HandlerMethodValidator",
    "fix": "Add @Valid; nested @Valid on fields",
    "prevent": "Contract tests for 400",
    "interviewAnswer": "@Validated on class for method params"
  },
  {
    "id": "scenario-10",
    "title": "404 on actuator",
    "symptom": "Management port wrong",
    "cause": "management.server.port separate",
    "mechanism": "Endpoint on different port/context",
    "debug": "Check application.yml management.*",
    "fix": "Expose health on correct port",
    "prevent": "Document ops runbook",
    "interviewAnswer": "Web vs management split"
  },
  {
    "id": "scenario-11",
    "title": "Double @Bean instance",
    "symptom": "Two DataSource beans unexpected",
    "cause": "Lite @Configuration @Bean inter-call",
    "mechanism": "proxyBeanMethods=false plain Java call",
    "debug": "Count getBean calls; @Configuration enhance?",
    "fix": "Enable full @Configuration or single @Bean method",
    "prevent": "Avoid multiple @Bean factory chains",
    "interviewAnswer": "CGLIB config ensures singleton @Bean"
  },
  {
    "id": "scenario-12",
    "title": "Wrong cache cleared",
    "symptom": "Evicted all tenants",
    "cause": "@CacheEvict allEntries=true global cache",
    "mechanism": "Cache name shared across tenants",
    "debug": "Redis KEYS; cache name in logs",
    "fix": "Tenant prefix in cache key; targeted evict",
    "prevent": "Multi-tenant cache naming convention",
    "interviewAnswer": "Never allEntries in multi-tenant"
  },
  {
    "id": "scenario-13",
    "title": "Stale cache after refund",
    "symptom": "Refund OK UI shows paid",
    "cause": "Cache not evicted; TX rolled back after cache put",
    "mechanism": "Advisor order + no afterCommit evict",
    "debug": "Trace cache put vs TX commit",
    "fix": "@CacheEvict on refund + afterCommit",
    "prevent": "TTL + event invalidation",
    "interviewAnswer": "Cache put after commit pattern"
  },
  {
    "id": "scenario-14",
    "title": "Kafka duplicate processing",
    "symptom": "Double charge",
    "cause": "At-least-once + no idempotency",
    "mechanism": "Consumer redelivers; service not idempotent",
    "debug": "Consumer lag; offset commit log",
    "fix": "Idempotency key table; unique constraint",
    "prevent": "Idempotent consumer pattern",
    "interviewAnswer": "TX outbox + dedupe key"
  },
  {
    "id": "scenario-15",
    "title": "Message processed before DB commit",
    "symptom": "Downstream sees ghost payment",
    "cause": "Kafka publish before commit",
    "mechanism": "Race between consumer and uncommitted TX",
    "debug": "Timeline: publish vs commit",
    "fix": "Transactional outbox or afterCommit send",
    "prevent": "Never publish in TX before commit",
    "interviewAnswer": "AFTER_COMMIT event"
  },
  {
    "id": "scenario-16",
    "title": "@Scheduled runs twice",
    "symptom": "Duplicate nightly job",
    "cause": "Multiple pods no distributed lock",
    "mechanism": "Each instance schedules locally",
    "debug": "Pod count vs job logs",
    "fix": "ShedLock or leader election",
    "prevent": "Single scheduler pod or lock",
    "interviewAnswer": "@Scheduled not cluster-safe alone"
  },
  {
    "id": "scenario-17",
    "title": "Connection pool exhausted",
    "symptom": "Threads blocked",
    "cause": "Leak or pool too small",
    "mechanism": "Connections not returned; long TX",
    "debug": "Hikari metrics pending threads",
    "fix": "Fix leak; tune pool; shorten TX",
    "prevent": "try-with-resources; TX timeout",
    "interviewAnswer": "@Transactional timeout"
  },
  {
    "id": "scenario-18",
    "title": "Read-only TX write fails",
    "symptom": "Unexpected rollback",
    "cause": "readOnly=true but entity updated",
    "mechanism": "Hibernate flush mode + driver readOnly",
    "debug": "SQL log shows UPDATE",
    "fix": "Remove readOnly or separate write method",
    "prevent": "readOnly only on queries",
    "interviewAnswer": "Split read/write services"
  },
  {
    "id": "scenario-19",
    "title": "OptimisticLockException",
    "symptom": "Concurrent update payment",
    "cause": "Two threads same @Version",
    "mechanism": "Second commit loses version race",
    "debug": "Exception at flush; version column",
    "fix": "Retry with reload; UI conflict message",
    "prevent": "OCC for hot entities",
    "interviewAnswer": "@Version on aggregate root"
  },
  {
    "id": "scenario-20",
    "title": "Feign timeout cascade",
    "symptom": "Payment hangs",
    "cause": "No timeout on Feign client",
    "mechanism": "Blocks service thread",
    "debug": "Resilience4j metrics open",
    "fix": "Configure connect/read timeout + CB",
    "prevent": "Bulkhead isolate Feign",
    "interviewAnswer": "Feign outside TX critical path"
  },
  {
    "id": "scenario-21",
    "title": "Circuit breaker open",
    "symptom": "All payments fail fast",
    "cause": "Downstream ledger down",
    "mechanism": "CB threshold reached",
    "debug": "Actuator metrics resilience4j",
    "fix": "Fallback or queue; fix downstream",
    "prevent": "Alert on half-open",
    "interviewAnswer": "Fail fast vs retry storm"
  },
  {
    "id": "scenario-22",
    "title": "Wrong profile beans",
    "symptom": "Prod uses H2",
    "cause": "spring.profiles.active missing",
    "mechanism": "@Profile(\"dev\") beans active",
    "debug": "log Active profiles at startup",
    "fix": "Explicit prod profile in K8s",
    "prevent": "Fail if dev profile in prod",
    "interviewAnswer": "@Profile on @Configuration"
  },
  {
    "id": "scenario-23",
    "title": "Auto-config not applied",
    "symptom": "Missing DataSource auto-config",
    "cause": "Custom @SpringBootApplication exclude",
    "mechanism": "DataSourceAutoConfiguration excluded",
    "debug": "Condition evaluation report",
    "fix": "Remove exclude; provide manual bean",
    "prevent": "Use debug=true report",
    "interviewAnswer": "@ConditionalOnClass chain"
  },
  {
    "id": "scenario-24",
    "title": "Test passes prod fails",
    "symptom": "@MockBean hides missing bean",
    "cause": "WebMvcTest mocks service",
    "mechanism": "Real wiring never tested",
    "debug": "Run @SpringBootTest smoke",
    "fix": "Add integration test slice",
    "prevent": "CI pyramid balance",
    "interviewAnswer": "Slice ≠ production graph"
  },
  {
    "id": "scenario-25",
    "title": "@Sql data missing in test",
    "symptom": "Assert fails empty table",
    "cause": "@Transactional rollback removes @Sql data",
    "mechanism": "Test TX wraps SQL scripts",
    "debug": "Disable rollback or @Commit",
    "fix": "Use @Sql BEFORE_TEST_METHOD + non-TX",
    "prevent": "Separate test data setup",
    "interviewAnswer": "Understand test TX listener"
  },
  {
    "id": "scenario-26",
    "title": "RefreshScope stale config",
    "symptom": "Feature flag old value",
    "cause": "Singleton holds direct @RefreshScope ref",
    "mechanism": "No scoped proxy injection",
    "debug": "Refresh actuator + bean identity",
    "fix": "Inject scoped proxy; @RefreshScope on bean",
    "prevent": "Cloud refresh patterns",
    "interviewAnswer": "Never cache RefreshScope in field of singleton"
  },
  {
    "id": "scenario-27",
    "title": "Prototype in singleton stale",
    "symptom": "Counter always 1",
    "cause": "Prototype injected once into singleton",
    "mechanism": "Single prototype instance cached",
    "debug": "ObjectProvider.getObject() each time",
    "fix": "Use Provider or @Lookup",
    "prevent": "Document scope semantics",
    "interviewAnswer": "Scope mismatch classic bug"
  },
  {
    "id": "scenario-28",
    "title": "@RequestScope in @Async",
    "symptom": "Null request in async",
    "cause": "Request context not propagated",
    "mechanism": "Async thread no RequestContextHolder",
    "debug": "MDC/request attributes null",
    "fix": "Pass DTO explicitly; avoid request scope in async",
    "prevent": "Context propagation library",
    "interviewAnswer": "Web scope ≠ async thread"
  },
  {
    "id": "scenario-29",
    "title": "Jackson infinite JSON",
    "symptom": "StackOverflow in response",
    "cause": "Bidirectional entity relations",
    "mechanism": "No @JsonIgnore on back-reference",
    "debug": "Jackson cycle in logs",
    "fix": "DTO projection; @JsonManagedReference",
    "prevent": "Never return entity graph",
    "interviewAnswer": "OpenAPI schema separate"
  },
  {
    "id": "scenario-30",
    "title": "Content-Type 415",
    "symptom": "POST rejected",
    "cause": "Missing consumes or wrong body",
    "mechanism": "HttpMessageConverter mismatch",
    "debug": "Request Content-Type header",
    "fix": "Align consumes produces",
    "prevent": "Integration test Content-Type",
    "interviewAnswer": "ProblemDetail for 415"
  },
  {
    "id": "scenario-31",
    "title": "406 Not Acceptable",
    "symptom": "Client Accept header",
    "cause": "produces mismatch",
    "mechanism": "No converter for Accept type",
    "debug": "Negotiation log",
    "fix": "Fix produces or Accept",
    "prevent": "Default JSON produces",
    "interviewAnswer": "content negotiation"
  },
  {
    "id": "scenario-32",
    "title": "Actuator exposure",
    "symptom": "Sensitive env exposed",
    "cause": "management.endpoints.web.exposure.include=*",
    "mechanism": "All endpoints public",
    "debug": "Security audit",
    "fix": "Least privilege exposure",
    "prevent": "Separate management auth",
    "interviewAnswer": "Secure actuator"
  },
  {
    "id": "scenario-33",
    "title": "CSRF blocks POST",
    "symptom": "403 on form POST",
    "cause": "CSRF enabled for session app",
    "mechanism": "REST should disable CSRF",
    "debug": "Security filter log CSRF",
    "fix": "csrf.disable() for stateless API",
    "prevent": "Stateless JWT no CSRF",
    "interviewAnswer": "Session vs JWT security"
  },
  {
    "id": "scenario-34",
    "title": "CORS preflight fail",
    "symptom": "Browser blocks API",
    "cause": "@CrossOrigin missing on origin",
    "mechanism": "OPTIONS not handled",
    "debug": "Browser network tab preflight",
    "fix": "Global CORS config",
    "prevent": "Credentials + wildcard trap",
    "interviewAnswer": "CORS is browser-only"
  },
  {
    "id": "scenario-35",
    "title": "Multi-DataSource wrong",
    "symptom": "Writes go to replica",
    "cause": "Missing @Transactional qualifier routing",
    "mechanism": "AbstractRoutingDataSource key not set",
    "debug": "Log actual JDBC URL",
    "fix": "@Transactional on correct TM",
    "prevent": "Routing DataSource pattern",
    "interviewAnswer": "Read replica readOnly TX"
  },
  {
    "id": "scenario-36",
    "title": "Flyway checksum mismatch",
    "symptom": "Boot fails startup",
    "cause": "Changed migration after apply",
    "mechanism": "Flyway validation failed",
    "debug": "flyway repair or new migration",
    "fix": "Never edit applied migrations",
    "prevent": "Versioned migrations only",
    "interviewAnswer": "Baseline prod carefully"
  },
  {
    "id": "scenario-37",
    "title": "Native image fails",
    "symptom": "BeanCreationException reflection",
    "cause": "Missing RuntimeHints",
    "mechanism": "AOT cannot reflect ConfigurationProperties",
    "debug": "native-image log",
    "fix": "@RegisterReflectionForBinding",
    "prevent": "Test native in CI",
    "interviewAnswer": "Boot 3 AOT pipeline"
  },
  {
    "id": "scenario-38",
    "title": "Virtual thread pinning",
    "symptom": "Platform thread blocked",
    "cause": "synchronized in VT carrier",
    "mechanism": "Pinning monitoring JDK 21",
    "debug": "JFR pinning events",
    "fix": "ReentrantLock instead synchronized",
    "prevent": "Monitor VT workloads",
    "interviewAnswer": "Boot 3.2+ VT config"
  },
  {
    "id": "scenario-39",
    "title": "Metric cardinality explosion",
    "symptom": "OOM in Prometheus",
    "cause": "High cardinality tag userId",
    "mechanism": "Micrometer meter explosion",
    "debug": "MeterRegistry inspect",
    "fix": "Low cardinality tags only",
    "prevent": "SLO dashboards design",
    "interviewAnswer": "userId as tag forbidden"
  },
  {
    "id": "scenario-40",
    "title": "Log PII leak",
    "symptom": "GDPR incident",
    "cause": "Logging full PaymentRequest",
    "mechanism": "toString includes PAN",
    "debug": "Log scrubbing audit",
    "fix": "Structured log with tokenized ids",
    "prevent": "PCI logging policy",
    "interviewAnswer": "Never log secrets"
  },
  {
    "id": "scenario-41",
    "title": "Graceful shutdown kill",
    "symptom": "TX interrupted mid-flight",
    "cause": "K8s SIGTERM too short",
    "mechanism": "Pods killed before drain",
    "debug": "terminationGracePeriodSeconds",
    "fix": "Graceful shutdown + lifecycle",
    "prevent": "Complete in-flight TX",
    "interviewAnswer": "Spring Boot graceful"
  },
  {
    "id": "scenario-42",
    "title": "Bean override accidental",
    "symptom": "Unexpected primary bean",
    "cause": "spring.main.allow-bean-definition-overriding=true",
    "mechanism": "Last bean wins silently",
    "debug": "Bean definition logging",
    "fix": "Disable overriding; explicit @Primary",
    "prevent": "Strict context",
    "interviewAnswer": "Override only in tests"
  },
  {
    "id": "scenario-43",
    "title": "ClassLoader leak hot deploy",
    "symptom": "Metaspace OOM",
    "cause": "DevTools or repeated context",
    "mechanism": "ClassLoader not GC",
    "debug": "Metaspace graph",
    "fix": "Restart vs reload",
    "prevent": "Test context cache",
    "interviewAnswer": "@DirtiesContext cost"
  },
  {
    "id": "scenario-44",
    "title": "@Order wrong filter",
    "symptom": "Security after custom filter",
    "cause": "FilterRegistrationBean order",
    "mechanism": "Custom filter before Security",
    "debug": "Filter chain debug",
    "fix": "@Order on SecurityFilterChain",
    "prevent": "Document filter order",
    "interviewAnswer": "OncePerRequestFilter"
  },
  {
    "id": "scenario-45",
    "title": "SpEL injection",
    "symptom": "Security expression exploit",
    "cause": "User input in @PreAuthorize",
    "mechanism": "SpEL evaluates attacker string",
    "debug": "Security audit SpEL",
    "fix": "Never user input in expressions",
    "prevent": "Static SpEL only",
    "interviewAnswer": "Method security review"
  },
  {
    "id": "scenario-46",
    "title": "Trust all certs Feign",
    "symptom": "MITM risk",
    "cause": "Insecure SSL context bean",
    "mechanism": "Feign client trusts any",
    "debug": "SSL config review",
    "fix": "Proper trust store",
    "prevent": "mTLS production",
    "interviewAnswer": "Never disable verify"
  },
  {
    "id": "scenario-47",
    "title": "Hardcoded @Value secrets",
    "symptom": "Secret in git",
    "cause": "@Value default password",
    "mechanism": "Property in source",
    "debug": "Secret scanning",
    "fix": "Env vars + external secret store",
    "prevent": "No secrets in repo",
    "interviewAnswer": "Vault/K8s secrets"
  }
];

export const BEGINNER_QS: InterviewQ[] = [
  {
    "id": "beg-1",
    "topic": "Stereotype",
    "level": "beginner",
    "question": "What is @Component?",
    "answer30s": "@Component is the base stereotype — scanner registers a BeanDefinition for the class.",
    "answer2m": "@Component is the base stereotype — scanner registers a BeanDefinition for the class. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "@Service difference?"
    ]
  },
  {
    "id": "beg-2",
    "topic": "Stereotype",
    "level": "beginner",
    "question": "What is @Service?",
    "answer30s": "Semantic @Component for business layer — same scanning, no extra behavior.",
    "answer2m": "Semantic @Component for business layer — same scanning, no extra behavior. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Why not @Component?"
    ]
  },
  {
    "id": "beg-3",
    "topic": "DI",
    "level": "beginner",
    "question": "What does @Autowired do?",
    "answer30s": "Marks injection point; container resolves dependency by type at populateBean.",
    "answer2m": "Marks injection point; container resolves dependency by type at populateBean. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Required false?"
    ]
  },
  {
    "id": "beg-4",
    "topic": "Boot",
    "level": "beginner",
    "question": "What does @SpringBootApplication combine?",
    "answer30s": "@Configuration + @EnableAutoConfiguration + @ComponentScan on main class package.",
    "answer2m": "@Configuration + @EnableAutoConfiguration + @ComponentScan on main class package. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "scanBasePackages?"
    ]
  },
  {
    "id": "beg-5",
    "topic": "Web",
    "level": "beginner",
    "question": "What is @RestController?",
    "answer30s": "@Controller + @ResponseBody — return value serialized to HTTP body.",
    "answer2m": "@Controller + @ResponseBody — return value serialized to HTTP body. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "vs @Controller?"
    ]
  },
  {
    "id": "beg-6",
    "topic": "Config",
    "level": "beginner",
    "question": "What is @Bean?",
    "answer30s": "Factory method on @Configuration registering object in container.",
    "answer2m": "Factory method on @Configuration registering object in container. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Who calls method?"
    ]
  },
  {
    "id": "beg-7",
    "topic": "Lifecycle",
    "level": "beginner",
    "question": "What is @PostConstruct?",
    "answer30s": "Init callback after injection — InitDestroyAnnotationBeanPostProcessor.",
    "answer2m": "Init callback after injection — InitDestroyAnnotationBeanPostProcessor. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Order vs @Autowired?"
    ]
  },
  {
    "id": "beg-8",
    "topic": "TX",
    "level": "beginner",
    "question": "What is @Transactional?",
    "answer30s": "Declarative transaction — proxy wraps method with TransactionInterceptor.",
    "answer2m": "Declarative transaction — proxy wraps method with TransactionInterceptor. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Self-invocation?"
    ]
  },
  {
    "id": "beg-9",
    "topic": "Test",
    "level": "beginner",
    "question": "What is @SpringBootTest?",
    "answer30s": "Loads full application context integration test.",
    "answer2m": "Loads full application context integration test. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "vs @WebMvcTest?"
    ]
  },
  {
    "id": "beg-10",
    "topic": "Scope",
    "level": "beginner",
    "question": "Default bean scope?",
    "answer30s": "Singleton — one instance per container.",
    "answer2m": "Singleton — one instance per container. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Prototype?"
    ]
  },
  {
    "id": "beg-11",
    "topic": "Web",
    "level": "beginner",
    "question": "What is @RequestMapping?",
    "answer30s": "Maps HTTP path/method to handler method.",
    "answer2m": "Maps HTTP path/method to handler method. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "@GetMapping?"
    ]
  },
  {
    "id": "beg-12",
    "topic": "Validation",
    "level": "beginner",
    "question": "What is @Valid?",
    "answer30s": "Triggers Bean Validation on object — MVC before controller method.",
    "answer2m": "Triggers Bean Validation on object — MVC before controller method. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "@Validated?"
    ]
  },
  {
    "id": "beg-13",
    "topic": "Properties",
    "level": "beginner",
    "question": "What is application.yml?",
    "answer30s": "Externalized config bound to Environment — @Value and @ConfigurationProperties.",
    "answer2m": "Externalized config bound to Environment — @Value and @ConfigurationProperties. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Profiles?"
    ]
  },
  {
    "id": "beg-14",
    "topic": "Security",
    "level": "beginner",
    "question": "What is @PreAuthorize?",
    "answer30s": "Method security SpEL checked before method via proxy.",
    "answer2m": "Method security SpEL checked before method via proxy. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Enable what?"
    ]
  },
  {
    "id": "beg-15",
    "topic": "Events",
    "level": "beginner",
    "question": "What is @EventListener?",
    "answer30s": "Registers method as application event listener.",
    "answer2m": "Registers method as application event listener. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Sync default?"
    ]
  }
];

export const INTERMEDIATE_QS: InterviewQ[] = [
  {
    "id": "int-1",
    "topic": "DI",
    "level": "intermediate",
    "question": "Explain @Qualifier resolution",
    "answer30s": "Filters autowire candidates; beats @Primary when on injection point.",
    "answer2m": "Filters autowire candidates; beats @Primary when on injection point. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Custom qualifier annotation?"
    ]
  },
  {
    "id": "int-2",
    "topic": "DI",
    "level": "intermediate",
    "question": "Explain @Primary",
    "answer30s": "Default bean when multiple type matches and no @Qualifier.",
    "answer2m": "Default bean when multiple type matches and no @Qualifier. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Two primaries?"
    ]
  },
  {
    "id": "int-3",
    "topic": "Config",
    "level": "intermediate",
    "question": "Full vs lite @Configuration",
    "answer30s": "Full uses CGLIB so @Bean inter-calls are singletons; lite proxyBeanMethods=false does not.",
    "answer2m": "Full uses CGLIB so @Bean inter-calls are singletons; lite proxyBeanMethods=false does not. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Boot default?"
    ]
  },
  {
    "id": "int-4",
    "topic": "AOP",
    "level": "intermediate",
    "question": "CGLIB vs JDK proxy",
    "answer30s": "Boot proxyTargetClass=true prefers CGLIB on concrete classes; JDK when interface-only legacy.",
    "answer2m": "Boot proxyTargetClass=true prefers CGLIB on concrete classes; JDK when interface-only legacy. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Final class?"
    ]
  },
  {
    "id": "int-5",
    "topic": "TX",
    "level": "intermediate",
    "question": "Propagation REQUIRED behavior",
    "answer30s": "Join existing TX or create new — default propagation.",
    "answer2m": "Join existing TX or create new — default propagation. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "REQUIRES_NEW?"
    ]
  },
  {
    "id": "int-6",
    "topic": "TX",
    "level": "intermediate",
    "question": "readOnly=true purpose",
    "answer30s": "Hints connection and Hibernate flush mode for read queries.",
    "answer2m": "Hints connection and Hibernate flush mode for read queries. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Write in readOnly?"
    ]
  },
  {
    "id": "int-7",
    "topic": "Cache",
    "level": "intermediate",
    "question": "@Cacheable condition SpEL",
    "answer30s": "Skip cache lookup when condition false — method still runs.",
    "answer2m": "Skip cache lookup when condition false — method still runs. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "unless?"
    ]
  },
  {
    "id": "int-8",
    "topic": "Async",
    "level": "intermediate",
    "question": "@Async return CompletableFuture",
    "answer30s": "Caller gets future; work runs on TaskExecutor thread.",
    "answer2m": "Caller gets future; work runs on TaskExecutor thread. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Exception handling?"
    ]
  },
  {
    "id": "int-9",
    "topic": "Web",
    "level": "intermediate",
    "question": "@ControllerAdvice purpose",
    "answer30s": "Global exception handling and model binding across controllers.",
    "answer2m": "Global exception handling and model binding across controllers. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Order?"
    ]
  },
  {
    "id": "int-10",
    "topic": "Data",
    "level": "intermediate",
    "question": "Spring Data repository magic",
    "answer30s": "JDK proxy implements interface — queries from method names or @Query.",
    "answer2m": "JDK proxy implements interface — queries from method names or @Query. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Custom impl?"
    ]
  },
  {
    "id": "int-11",
    "topic": "Boot",
    "level": "intermediate",
    "question": "@ConditionalOnProperty",
    "answer30s": "Registers bean only when property matches — auto-config pattern.",
    "answer2m": "Registers bean only when property matches — auto-config pattern. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "matchIfMissing?"
    ]
  },
  {
    "id": "int-12",
    "topic": "Kafka",
    "level": "intermediate",
    "question": "@KafkaListener concurrency",
    "answer30s": "Container creates consumer threads per concurrency attribute.",
    "answer2m": "Container creates consumer threads per concurrency attribute. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Ack mode?"
    ]
  },
  {
    "id": "int-13",
    "topic": "Security",
    "level": "intermediate",
    "question": "Filter chain vs method security",
    "answer30s": "Filters authenticate/authorize HTTP; @PreAuthorize secures service methods.",
    "answer2m": "Filters authenticate/authorize HTTP; @PreAuthorize secures service methods. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Both needed?"
    ]
  },
  {
    "id": "int-14",
    "topic": "Test",
    "level": "intermediate",
    "question": "@MockBean behavior",
    "answer30s": "Replaces bean in test context with Mockito mock.",
    "answer2m": "Replaces bean in test context with Mockito mock. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "@SpyBean?"
    ]
  },
  {
    "id": "int-15",
    "topic": "Cloud",
    "level": "intermediate",
    "question": "@RefreshScope",
    "answer30s": "Cloud bean recreated on refresh — needs scoped proxy when injected into singleton.",
    "answer2m": "Cloud bean recreated on refresh — needs scoped proxy when injected into singleton. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Actuator refresh?"
    ]
  },
  {
    "id": "int-16",
    "topic": "Validation",
    "level": "intermediate",
    "question": "Groups @Validated",
    "answer30s": "Method-level validation groups on service parameters.",
    "answer2m": "Method-level validation groups on service parameters. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Mvc groups?"
    ]
  },
  {
    "id": "int-17",
    "topic": "Observability",
    "level": "intermediate",
    "question": "@Observed",
    "answer30s": "Micrometer observation on method — metrics and tracing.",
    "answer2m": "Micrometer observation on method — metrics and tracing. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Self-invocation?"
    ]
  },
  {
    "id": "int-18",
    "topic": "Resilience",
    "level": "intermediate",
    "question": "@CircuitBreaker",
    "answer30s": "Resilience4j wraps method — open/half-open/closed states.",
    "answer2m": "Resilience4j wraps method — open/half-open/closed states. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Fallback?"
    ]
  },
  {
    "id": "int-19",
    "topic": "Scheduling",
    "level": "intermediate",
    "question": "@Scheduled cron",
    "answer30s": "CronTrigger registers with TaskScheduler.",
    "answer2m": "CronTrigger registers with TaskScheduler. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Cluster safe?"
    ]
  },
  {
    "id": "int-20",
    "topic": "Properties",
    "level": "intermediate",
    "question": "Relaxed binding",
    "answer30s": "BOOT maps app.datasource.url to app.datasource.url and variants.",
    "answer2m": "BOOT maps app.datasource.url to app.datasource.url and variants. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "List binding?"
    ]
  }
];

export const SENIOR_QS: InterviewQ[] = [
  {
    "id": "sen-1",
    "topic": "Internals",
    "level": "senior",
    "question": "AutowiredAnnotationBeanPostProcessor chain",
    "answer30s": "populateBean → InjectionMetadata → DependencyDescriptor → resolveDependency → determineAutowireCandidate.",
    "answer2m": "populateBean → InjectionMetadata → DependencyDescriptor → resolveDependency → determineAutowireCandidate. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Circular half-cycle?"
    ]
  },
  {
    "id": "sen-2",
    "topic": "Internals",
    "level": "senior",
    "question": "ConfigurationClassPostProcessor",
    "answer30s": "Parses @Configuration, @Import, @Bean; enhances full config with CGLIB.",
    "answer2m": "Parses @Configuration, @Import, @Bean; enhances full config with CGLIB. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "DeferredImportSelector?"
    ]
  },
  {
    "id": "sen-3",
    "topic": "AOP",
    "level": "senior",
    "question": "Advisor order @Transactional @Cacheable",
    "answer30s": "Order controls interceptor chain; security often before TX; cache after TX begin — stale risk.",
    "answer2m": "Order controls interceptor chain; security often before TX; cache after TX begin — stale risk. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "@Order value?"
    ]
  },
  {
    "id": "sen-4",
    "topic": "TX",
    "level": "senior",
    "question": "TransactionSynchronizationManager",
    "answer30s": "Binds Connection to thread per TX — propagation uses same manager.",
    "answer2m": "Binds Connection to thread per TX — propagation uses same manager. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Reactive TX?"
    ]
  },
  {
    "id": "sen-5",
    "topic": "TX",
    "level": "senior",
    "question": "rollbackFor vs noRollbackFor",
    "answer30s": "RuleBasedTransactionAttribute merges rules — checked default no rollback.",
    "answer2m": "RuleBasedTransactionAttribute merges rules — checked default no rollback. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Exception hierarchy?"
    ]
  },
  {
    "id": "sen-6",
    "topic": "Cache",
    "level": "senior",
    "question": "CacheInterceptor sync=true",
    "answer30s": "Single-flight lock per cache key inside advised method.",
    "answer2m": "Single-flight lock per cache key inside advised method. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Redis down?"
    ]
  },
  {
    "id": "sen-7",
    "topic": "Security",
    "level": "senior",
    "question": "AuthorizationManager Boot 3",
    "answer30s": "Replaces AccessDecisionManager — Before/After method interceptors.",
    "answer2m": "Replaces AccessDecisionManager — Before/After method interceptors. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "SpEL root objects?"
    ]
  },
  {
    "id": "sen-8",
    "topic": "Boot",
    "level": "senior",
    "question": "AutoConfigurationImportSelector",
    "answer30s": "Loads AutoConfiguration.imports — conditions evaluated per config class.",
    "answer2m": "Loads AutoConfiguration.imports — conditions evaluated per config class. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Debug report?"
    ]
  },
  {
    "id": "sen-9",
    "topic": "Data",
    "level": "senior",
    "question": "Open EntityManager in View",
    "answer30s": "OSIV extends session through view rendering — disabled by default Boot 2.2+.",
    "answer2m": "OSIV extends session through view rendering — disabled by default Boot 2.2+. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Lazy load JSON?"
    ]
  },
  {
    "id": "sen-10",
    "topic": "Kafka",
    "level": "senior",
    "question": "Exactly-once sketch",
    "answer30s": "Idempotent producer + transactional consumer + outbox — not magic annotation.",
    "answer2m": "Idempotent producer + transactional consumer + outbox — not magic annotation. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "ChainedKafkaTransactionManager?"
    ]
  },
  {
    "id": "sen-11",
    "topic": "Native",
    "level": "senior",
    "question": "AOT processing Boot 3",
    "answer30s": "BeanFactory initialization at build time — hints for reflection.",
    "answer2m": "BeanFactory initialization at build time — hints for reflection. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "@ImportRuntimeHints?"
    ]
  },
  {
    "id": "sen-12",
    "topic": "Web",
    "level": "senior",
    "question": "HandlerMapping resolution order",
    "answer30s": "RequestMappingHandlerMapping most specific wins — patterns and params.",
    "answer2m": "RequestMappingHandlerMapping most specific wins — patterns and params. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Trailing slash?"
    ]
  },
  {
    "id": "sen-13",
    "topic": "Reactive",
    "level": "senior",
    "question": "@Transactional on WebFlux",
    "answer30s": "R2dbcTransactionManager — blockhound if block in reactive.",
    "answer2m": "R2dbcTransactionManager — blockhound if block in reactive. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Not JPA?"
    ]
  },
  {
    "id": "sen-14",
    "topic": "Testing",
    "level": "senior",
    "question": "TestContext bootstrap",
    "answer30s": "Context cache key from config locations + profiles + imports.",
    "answer2m": "Context cache key from config locations + profiles + imports. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "@DirtiesContext?"
    ]
  },
  {
    "id": "sen-15",
    "topic": "Performance",
    "level": "senior",
    "question": "BeanPostProcessor cost",
    "answer30s": "Every bean passes all BPPs — expensive post-processors slow startup.",
    "answer2m": "Every bean passes all BPPs — expensive post-processors slow startup. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Lazy-init?"
    ]
  },
  {
    "id": "sen-16",
    "topic": "DI",
    "level": "senior",
    "question": "ObjectProvider vs Provider",
    "answer30s": "ObjectProvider Spring-specific — getIfAvailable, orderedStream.",
    "answer2m": "ObjectProvider Spring-specific — getIfAvailable, orderedStream. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Jakarta Provider?"
    ]
  },
  {
    "id": "sen-17",
    "topic": "Scope",
    "level": "senior",
    "question": "Scoped proxy TARGET_CLASS",
    "answer30s": "CGLIB proxy delegates getTarget to current scope instance.",
    "answer2m": "CGLIB proxy delegates getTarget to current scope instance. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "INTERFACES?"
    ]
  },
  {
    "id": "sen-18",
    "topic": "Events",
    "level": "senior",
    "question": "TransactionalEventListener phases",
    "answer30s": "BEFORE_COMMIT, AFTER_COMMIT, AFTER_ROLLBACK, AFTER_COMPLETION.",
    "answer2m": "BEFORE_COMMIT, AFTER_COMMIT, AFTER_ROLLBACK, AFTER_COMPLETION. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "AFTER_COMMIT no TX?"
    ]
  },
  {
    "id": "sen-19",
    "topic": "Integration",
    "level": "senior",
    "question": "Outbox pattern",
    "answer30s": "Same TX write business row + outbox row; relay publishes to Kafka.",
    "answer2m": "Same TX write business row + outbox row; relay publishes to Kafka. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Polling vs CDC?"
    ]
  },
  {
    "id": "sen-20",
    "topic": "Multi-tenant",
    "level": "senior",
    "question": "Discriminator @Filter",
    "answer30s": "Hibernate filter enabled per session — tenant id in ThreadLocal.",
    "answer2m": "Hibernate filter enabled per session — tenant id in ThreadLocal. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Forget enable?"
    ]
  },
  {
    "id": "sen-21",
    "topic": "Observability",
    "level": "senior",
    "question": "Trace propagation async",
    "answer30s": "MDC and Observation not auto across @Async — manual propagation.",
    "answer2m": "MDC and Observation not auto across @Async — manual propagation. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Micrometer context?"
    ]
  },
  {
    "id": "sen-22",
    "topic": "Resilience",
    "level": "senior",
    "question": "Bulkhead thread pool vs semaphore",
    "answer30s": "Thread pool isolates threads; semaphore limits concurrent calls same thread pool.",
    "answer2m": "Thread pool isolates threads; semaphore limits concurrent calls same thread pool. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Config?"
    ]
  },
  {
    "id": "sen-23",
    "topic": "Scheduling",
    "level": "senior",
    "question": "ShedLock with @Scheduled",
    "answer30s": "Distributed lock ensures one pod runs job.",
    "answer2m": "Distributed lock ensures one pod runs job. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "DB vs Redis lock?"
    ]
  },
  {
    "id": "sen-24",
    "topic": "Security",
    "level": "senior",
    "question": "Multiple SecurityFilterChain",
    "answer30s": "@Order on chains — matcher per chain Boot 3 style.",
    "answer2m": "@Order on chains — matcher per chain Boot 3 style. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Actuator chain?"
    ]
  },
  {
    "id": "sen-25",
    "topic": "Migration",
    "level": "senior",
    "question": "javax to jakarta",
    "answer30s": "Boot 3 / Spring 6 jakarta.* namespace — servlet, persistence, validation.",
    "answer2m": "Boot 3 / Spring 6 jakarta.* namespace — servlet, persistence, validation. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Third party libs?"
    ]
  }
];

export const STAFF_QS: InterviewQ[] = [
  {
    "id": "staff-1",
    "topic": "Architecture",
    "level": "staff",
    "question": "Design payment TX boundaries",
    "answer30s": "Controller thin; service @Transactional; repo participates; events afterCommit; idempotency at edge.",
    "answer2m": "Controller thin; service @Transactional; repo participates; events afterCommit; idempotency at edge. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Saga when?"
    ]
  },
  {
    "id": "staff-2",
    "topic": "Architecture",
    "level": "staff",
    "question": "When AspectJ vs Spring AOP",
    "answer30s": "Spring AOP proxy for method interception; AspectJ CTW/LTW for self-invocation and finer pointcuts.",
    "answer2m": "Spring AOP proxy for method interception; AspectJ CTW/LTW for self-invocation and finer pointcuts. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Load-time weaving cost?"
    ]
  },
  {
    "id": "staff-3",
    "topic": "Internals",
    "level": "staff",
    "question": "AbstractAutowireCapableBeanFactory createBean",
    "answer30s": "createBean → instantiate → populateBean → initializeBean → BPP before/after init.",
    "answer2m": "createBean → instantiate → populateBean → initializeBean → BPP before/after init. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Early singleton exposure?"
    ]
  },
  {
    "id": "staff-4",
    "topic": "Internals",
    "level": "staff",
    "question": "AnnotationAwareAspectJAutoProxyCreator",
    "answer30s": "wrapIfNecessary → advisors → JDK or CGLIB per proxy config.",
    "answer2m": "wrapIfNecessary → advisors → JDK or CGLIB per proxy config. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "exposeProxy?"
    ]
  },
  {
    "id": "staff-5",
    "topic": "TX",
    "level": "staff",
    "question": "JTA vs local TX",
    "answer30s": "JtaTransactionManager coordinates XA; local DataSourceTransactionManager single resource.",
    "answer2m": "JtaTransactionManager coordinates XA; local DataSourceTransactionManager single resource. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Chained TM?"
    ]
  },
  {
    "id": "staff-6",
    "topic": "TX",
    "level": "staff",
    "question": "NESTED propagation JDBC",
    "answer30s": "Savepoint nested TX — rollback nested only; driver must support.",
    "answer2m": "Savepoint nested TX — rollback nested only; driver must support. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "JPA nested?"
    ]
  },
  {
    "id": "staff-7",
    "topic": "Boot",
    "level": "staff",
    "question": "SpringFactoriesLoader → imports",
    "answer30s": "Boot 3 uses META-INF/spring/*.imports replacing spring.factories for auto-config.",
    "answer2m": "Boot 3 uses META-INF/spring/*.imports replacing spring.factories for auto-config. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Custom starter?"
    ]
  },
  {
    "id": "staff-8",
    "topic": "Data",
    "level": "staff",
    "question": "Hibernate flush modes",
    "answer30s": "AUTO/COMMIT/MANUAL affect readOnly and bulk update visibility.",
    "answer2m": "AUTO/COMMIT/MANUAL affect readOnly and bulk update visibility. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "@Modifying clear?"
    ]
  },
  {
    "id": "staff-9",
    "topic": "Kafka",
    "level": "staff",
    "question": "Listener ack mode BATCH vs RECORD",
    "answer30s": "Impacts duplicate handling and TX alignment.",
    "answer2m": "Impacts duplicate handling and TX alignment. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Manual immediate?"
    ]
  },
  {
    "id": "staff-10",
    "topic": "Security",
    "level": "staff",
    "question": "OAuth2 resource server flow",
    "answer30s": "BearerTokenAuthenticationFilter → JwtAuthenticationProvider → SecurityContext.",
    "answer2m": "BearerTokenAuthenticationFilter → JwtAuthenticationProvider → SecurityContext. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Opaque token?"
    ]
  },
  {
    "id": "staff-11",
    "topic": "Cloud",
    "level": "staff",
    "question": "Bootstrap context legacy",
    "answer30s": "Spring Cloud 2020+ config in main context — no child bootstrap by default.",
    "answer2m": "Spring Cloud 2020+ config in main context — no child bootstrap by default. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Config data API?"
    ]
  },
  {
    "id": "staff-12",
    "topic": "Native",
    "level": "staff",
    "question": "GraalVM reachability",
    "answer30s": "Register reflection, resources, proxies for Spring hints — missing = runtime fail.",
    "answer2m": "Register reflection, resources, proxies for Spring hints — missing = runtime fail. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Agent tracing?"
    ]
  },
  {
    "id": "staff-13",
    "topic": "Performance",
    "level": "staff",
    "question": "Startup bottleneck analysis",
    "answer30s": "SpringApplicationRunListeners; bean definition count; condition evaluation.",
    "answer2m": "SpringApplicationRunListeners; bean definition count; condition evaluation. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "AOT native compare?"
    ]
  },
  {
    "id": "staff-14",
    "topic": "Reliability",
    "level": "staff",
    "question": "Idempotency key storage",
    "answer30s": "Unique DB constraint on key; cache fast path; TTL for cleanup.",
    "answer2m": "Unique DB constraint on key; cache fast path; TTL for cleanup. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Redis vs DB?"
    ]
  },
  {
    "id": "staff-15",
    "topic": "Reliability",
    "level": "staff",
    "question": "Poison pill Kafka",
    "answer30s": "DLQ + skip + alert; do not infinite retry business validation errors.",
    "answer2m": "DLQ + skip + alert; do not infinite retry business validation errors. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Retry topic?"
    ]
  },
  {
    "id": "staff-16",
    "topic": "Observability",
    "level": "staff",
    "question": "SLO error budget wiring",
    "answer30s": "Metrics from @Observed + traces + logs correlated by traceId.",
    "answer2m": "Metrics from @Observed + traces + logs correlated by traceId. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Cardinality guard?"
    ]
  },
  {
    "id": "staff-17",
    "topic": "Multi-region",
    "level": "staff",
    "question": "Active-active Spring beans",
    "answer30s": "No global singleton — regional contexts; CDC invalidation.",
    "answer2m": "No global singleton — regional contexts; CDC invalidation. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "CRDT?"
    ]
  },
  {
    "id": "staff-18",
    "topic": "Staff",
    "level": "staff",
    "question": "Review @Transactional on controller",
    "answer30s": "Reject — TX belongs service; MVC layer wrong boundary; testing harder.",
    "answer2m": "Reject — TX belongs service; MVC layer wrong boundary; testing harder. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "Exception handler TX?"
    ]
  },
  {
    "id": "staff-19",
    "topic": "Staff",
    "level": "staff",
    "question": "BeanFactoryPostProcessor vs BPP",
    "answer30s": "BFPP modifies definitions before instantiation; BPP wraps instances.",
    "answer2m": "BFPP modifies definitions before instantiation; BPP wraps instances. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "BeanDefinitionRegistryPostProcessor?"
    ]
  },
  {
    "id": "staff-20",
    "topic": "Staff",
    "level": "staff",
    "question": "Custom Condition pitfalls",
    "answer30s": "Must be fast; no bean access unless @ConditionalOnBean order guaranteed.",
    "answer2m": "Must be fast; no bean access unless @ConditionalOnBean order guaranteed. Deep dive: name processors, proxy boundaries, Boot 3 defaults, production failure modes, and debugging steps (condition report, DEBUG AOP, /actuator/beans).",
    "followUps": [
      "@Order on config?"
    ]
  }
];

export const SPOKEN = {
  sixtySec:
    'Spring annotations are not magic. Startup scans and registers BeanDefinitions, injects dependencies, then wraps advised beans in proxies. At runtime, @Transactional @Async @Cacheable run only when the call enters that proxy. this.method skips the proxy — that is why transactions and cache “mysteriously” fail. Boot 3 loads auto-config from imports files filtered by @ConditionalOn*.',
  twoMin:
    'I open with SCAN → REGISTER → INJECT → PROXY → EXECUTE. @Component stereotypes become recipes; objects appear later. @Autowired is AutowiredAnnotationBeanPostProcessor after construct. @Transactional is TransactionInterceptor on a CGLIB or JDK proxy — external callers get TX; self-invocation does not. @Configuration with proxyBeanMethods true makes inter-@Bean calls return the singleton. @Async is a new thread — no TX propagation. Boot auto-config backs off with @ConditionalOnMissingBean. I debug with proxy class in the stack and --debug condition report — not by memorizing every annotation name.',
  staff:
    'Staff answer names the processor and the failure domain. Self-invocation, advisor order (security → TX → cache → async), rollback rules, and lite vs full @Configuration. Payment path: controller → service proxy → TX → repo → after-commit event → @Async listener on its own proxy. I refuse annotation bingo — I design boundaries so proxies are hit on purpose.',
  autowired: {
    s15: '@Autowired marks injection points processed by AutowiredAnnotationBeanPostProcessor during populateBean. Prefer constructor injection in Boot 3.',
    s60: '@Autowired runs after the raw bean exists. Qualifier beats Primary. Single constructor needs no annotation. You usually inject the proxy of an advised bean.',
    s3m: 'Walk createBean → populateBean → resolveDependency. Cover Qualifier, Primary, ObjectProvider, circular deps, and the trap that @Autowired does not create proxies.',
  },
  transactional: {
    s15: '@Transactional = TransactionInterceptor on a proxy. External calls get TX; this. bypasses it.',
    s60: 'Rollback defaults to unchecked exceptions. REQUIRES_NEW needs a proxy call. Pair after-commit listeners with domain events.',
    s3m: 'Advisor order, self-invocation fixes, readOnly, and why TX on controllers is wrong.',
  },
  configuration: {
    s15: '@Configuration is parsed by ConfigurationClassPostProcessor; full mode CGLIB-shares @Bean singletons.',
    s60: 'proxyBeanMethods=false means inter-@Bean calls can create duplicates. Use for tests when you understand the cost.',
    s3m: '@Import, conditions, Boot DeferredImportSelector — still say proxy first in interviews.',
  },
  bootAutoConfig: {
    s15: '@SpringBootApplication = scan + AutoConfiguration.imports filtered by @ConditionalOn*.',
    s60: 'User @Bean + OnMissingBean backs off defaults. Debug with --debug condition report.',
    s3m: 'Starters satisfy OnClass; exclude carefully; never fight auto-config blindly.',
  },
  proxy: {
    s15: 'JDK or CGLIB proxies carry advisors. Only external calls run them.',
    s60: 'Boot defaults CGLIB. Final/private methods are not advised. Stack trace should show $$ proxy.',
    s3m: 'Order advisors; AspectJ only if self-invocation must work without redesign.',
  },
} as const;

export const CHEAT_ROWS = PROCESSOR_MAP;

export const COVERAGE_CHECKLIST: string[] = [
  "01 BeanDefinition vs bean instance",
  "02 BeanFactory vs ApplicationContext",
  "03 SCAN REGISTER INJECT PROXY EXECUTE pipeline",
  "04 @Component stereotype scanning",
  "05 @Service @Repository @Controller @RestController",
  "06 @ComponentScan basePackages",
  "07 @Configuration full vs lite CGLIB",
  "08 @Bean factory methods",
  "09 @Import ImportSelector Registrar",
  "10 @PropertySource Environment",
  "11 @Profile conditions",
  "12 @Conditional custom conditions",
  "13 @SpringBootApplication meta",
  "14 @EnableAutoConfiguration imports",
  "15 @ConditionalOnClass OnBean OnProperty",
  "16 AutoConfiguration.imports Boot 3",
  "17 @Autowired injection points",
  "18 @Qualifier disambiguation",
  "19 @Primary default candidate",
  "20 @Resource name-first",
  "21 @Inject JSR-330",
  "22 @Value placeholders and SpEL",
  "23 @ConfigurationProperties binding",
  "24 @ConstructorBinding immutable props",
  "25 Constructor vs field injection",
  "26 Circular dependency strategies",
  "27 @Lazy injection proxy",
  "28 @Scope singleton prototype request",
  "29 Scoped proxy TARGET_CLASS",
  "30 ObjectProvider Optional",
  "31 @PostConstruct @PreDestroy",
  "32 @DependsOn ordering",
  "33 BeanPostProcessor phases",
  "34 @Transactional proxy semantics",
  "35 Propagation isolation rollbackFor",
  "36 Self-invocation TX trap",
  "37 @EnableTransactionManagement",
  "38 PlatformTransactionManager JPA",
  "39 @TransactionalEventListener phases",
  "40 @EventListener sync async",
  "41 @Async TaskExecutor",
  "42 @EnableAsync",
  "43 @Cacheable @CacheEvict @CachePut",
  "44 @EnableCaching CacheManager",
  "45 Cache advisor ordering vs TX",
  "46 @PreAuthorize @PostAuthorize",
  "47 @EnableMethodSecurity",
  "48 SecurityFilterChain vs method security",
  "49 @Valid @Validated validation",
  "50 @ControllerAdvice @ExceptionHandler",
  "51 MVC mapping @GetMapping",
  "52 @RequestBody @ResponseBody",
  "53 Spring Data repository proxies",
  "54 @Query @Modifying JPA",
  "55 @Version optimistic locking",
  "56 @KafkaListener containers",
  "57 @EnableKafka",
  "58 Kafka TX outbox afterCommit",
  "59 @FeignClient HTTP proxy",
  "60 @CircuitBreaker @Retryable resilience",
  "61 @Scheduled TaskScheduler",
  "62 @Observed Micrometer tracing",
  "63 CGLIB vs JDK proxy choice",
  "64 @Order advisor chain",
  "65 @RefreshScope cloud",
  "66 @MockBean @SpyBean tests",
  "67 @WebMvcTest @DataJpaTest slices",
  "68 @DynamicPropertySource Testcontainers",
  "69 Native AOT RuntimeHints",
  "70 Payment HTTP→security→TX→cache→kafka trace",
  "71 Proxy matrix + who-processes Q&A"
];

export const MEMORY_RULES: {title: string; rule: string}[] = [
  {
    "title": "SCAN before COOK",
    "rule": "Component scan registers BeanDefinitions — objects are created later at refresh"
  },
  {
    "title": "QUALIFIER beats PRIMARY",
    "rule": "Explicit @Qualifier on injection point wins over @Primary default"
  },
  {
    "title": "EXTERNAL uses PROXY",
    "rule": "Only calls through injected proxy get @Transactional @Cacheable @Async @PreAuthorize"
  },
  {
    "title": "THIS skips PROXY",
    "rule": "Self-invocation this.method() bypasses all Spring AOP advisors"
  },
  {
    "title": "FULL CONFIG CGLIB",
    "rule": "@Configuration proxyBeanMethods=true — @Bean inter-calls share singletons"
  },
  {
    "title": "LITE CONFIG trap",
    "rule": "proxyBeanMethods=false — @Bean method calls may create new instances"
  },
  {
    "title": "ENABLE gates AOP",
    "rule": "@EnableCaching @EnableAsync @EnableMethodSecurity required or annotations noop"
  },
  {
    "title": "TX rollback UNCHECKED",
    "rule": "Checked exceptions commit by default — use rollbackFor explicitly"
  },
  {
    "title": "AFTER COMMIT events",
    "rule": "Publish side effects with @TransactionalEventListener(AFTER_COMMIT) or outbox"
  },
  {
    "title": "READ ONLY hint",
    "rule": "@Transactional(readOnly=true) — do not write; Hibernate flush mode changes"
  },
  {
    "title": "REQUEST needs PROXY",
    "rule": "@RequestScope in singleton requires scoped proxy injection"
  },
  {
    "title": "BOOT imports CONDITIONS",
    "rule": "Auto-config loads from imports file — each class guarded by @ConditionalOn*"
  },
  {
    "title": "ADVISOR ORDER matters",
    "rule": "Security before TX; cache vs TX affects stale data — set @Order consciously"
  },
  {
    "title": "VALID on BODY",
    "rule": "@Valid on @RequestBody triggers validation — without it constraints ignored"
  },
  {
    "title": "REPO not TX boundary",
    "rule": "Put @Transactional on service layer — not controller or ideally not repository"
  }
];

const _unique = new Map<string, InterviewQ>();
for (const q of [...TRAP_QS, ...RAPID_QS, ...BEGINNER_QS, ...INTERMEDIATE_QS, ...SENIOR_QS, ...STAFF_QS]) {
  _unique.set(q.id, q);
}

export const SENIOR: InterviewQ[] = [...SENIOR_QS, ...STAFF_QS, ...TRAP_QS.filter((q) => q.level === 'advanced' || q.level === 'senior')];
export const ARCHITECT: InterviewQ[] = [...STAFF_QS, ...SENIOR_QS, ...TRAP_QS];
export const RAPID: InterviewQ[] = RAPID_QS;
export const ALL: InterviewQ[] = [..._unique.values()];

export const INTERVIEW_EXPORT_COUNTS = {
  TRAP_QS: TRAP_QS.length,
  RAPID_QS: RAPID_QS.length,
  SCENARIOS: SCENARIOS.length,
  BEGINNER_QS: BEGINNER_QS.length,
  INTERMEDIATE_QS: INTERMEDIATE_QS.length,
  SENIOR_QS: SENIOR_QS.length,
  STAFF_QS: STAFF_QS.length,
  uniqueInterviewQ: _unique.size,
  SENIOR_alias: SENIOR.length,
  ARCHITECT_alias: ARCHITECT.length,
  RAPID_alias: RAPID.length,
  ALL_alias: ALL.length,
  CHEAT_ROWS: PROCESSOR_MAP.length,
  COVERAGE_CHECKLIST: 71,
  MEMORY_RULES: 15,
} as const;
