import type {AnnotationCard} from './types';

export const LIFECYCLE: AnnotationCard[] = [
  {
    id: 'post-construct',
    annotation: '@PostConstruct',
    family: 'lifecycle',
    what:
      'jakarta.annotation.PostConstruct on a zero-arg method — invoked once after dependency injection completes and before the bean is considered fully initialized. Single lifecycle callback standardized in Jakarta EE; Spring processes it via CommonAnnotationBeanPostProcessor (same BPP as @PreDestroy and @Resource). Not a Spring-specific annotation but first-class in the container.',
    why:
      'Initialization logic that requires injected dependencies: open connections, validate config, register listeners. Prefer over implementing InitializingBean afterPropertiesSet when staying annotation-driven and Jakarta-compatible.',
    example: `@Service
public class RateLimitService {
  private final RedisTemplate<String, String> redis;

  public RateLimitService(RedisTemplate<String, String> redis) {
    this.redis = redis;
  }

  @PostConstruct
  void warmCache() {
  redis.opsForValue().set("limits:version", "1");
  }
}`,
    processor:
      'CommonAnnotationBeanPostProcessor implements DestructionAwareBeanPostProcessor. After populateBean (injection), postProcessBeforeInitialization discovers @PostConstruct via LifecycleMetadata (cached reflection). Invokes method via reflection — must be public or accessible. Order within BPP chain: after AutowiredAnnotationBeanPostProcessor injection, typically before other init callbacks unless @Order on BPP.',
    when:
      'One-time setup after injection. Alternative: @Bean initMethod, InitializingBean, or constructor for required deps only. Avoid heavy work blocking startup.',
    flow: `Singleton bean creation order (simplified):
1. instantiateBean (constructor)
2. populateBean (@Autowired / @Value injection)
3. BeanPostProcessor.postProcessBeforeInitialization
   → CommonAnnotationBeanPostProcessor invokes @PostConstruct
4. InitializingBean.afterPropertiesSet (if implemented)
5. Custom init-method from @Bean
6. BeanPostProcessor.postProcessAfterInitialization (AOP proxy wrapping)
7. Bean ready for use`,
    lifecycle:
      'Runs exactly once per bean instance. Prototype: every getBean creates new instance → @PostConstruct each time. Request scope: per HTTP request instance.',
    proxy:
      '@PostConstruct runs on target object BEFORE postProcessAfterInitialization wraps AOP proxy in typical setup — method on class directly, not on proxy subclass. If @PostConstruct on @Configuration class, runs on enhanced CGLIB config proxy.',
    runtime:
      'Reflection invoke; exceptions wrapped in BeanCreationException. Cannot be static or have parameters.',
    failure:
      'BeanCreationException if @PostConstruct throws. Method with parameters — ignored or validation error. Private method on JDK 9+ may fail without --add-opens (Spring generally invokes setAccessible).',
    debug:
      'TRACE org.springframework.context.annotation.CommonAnnotationBeanPostProcessor. Breakpoint on @PostConstruct method. Compare order with @EventListener ApplicationReadyEvent for after-full-context work.',
    production:
      'Keep @PostConstruct fast — defer heavy work to @Async or ApplicationRunner. Do not depend on other beans\' @PostConstruct order unless @DependsOn. Use ApplicationReadyEvent for cross-bean readiness.',
    mistakes: [
      'Heavy I/O in @PostConstruct slowing startup',
      'Assuming other singleton @PostConstruct already ran without @DependsOn',
      'Using @PostConstruct for logic that belongs in constructor with required deps',
      'Calling @Transactional method from @PostConstruct — proxy may not be ready / no tx',
    ],
    traps: [
      'Interview order: injection → @PostConstruct → InitializingBean → init-method → AOP proxy',
      '@PostConstruct on @Bean returned object NOT on factory — init on the product instance',
      'javax.annotation.PostConstruct in Boot 2 → jakarta.annotation.PostConstruct in Boot 3',
      'Self-invocation in @PostConstruct bypasses AOP — same as normal method',
    ],
    answer15s:
      '@PostConstruct runs once after dependency injection, before the bean is fully initialized. Processed by CommonAnnotationBeanPostProcessor after populateBean.',
    answer60s:
      'jakarta.annotation.PostConstruct marks a no-arg init method. CommonAnnotationBeanPostProcessor invokes it in postProcessBeforeInitialization after @Autowired injection. Order: constructor → injection → @PostConstruct → InitializingBean → init-method → AOP proxy wrap. Prototype beans run it per instance.',
    answer3m:
      'Pipeline position critical for interviews: populateBean completes → BPP before init → @PostConstruct → afterPropertiesSet → custom init → BPP after init creates proxy. Contrast @EventListener ContextRefreshedEvent (all beans) vs ApplicationReadyEvent (app accepting traffic). @DependsOn only guarantees bean creation order, not @PostConstruct order across dependents — use explicit startup listeners for ordering. Boot 3 jakarta.annotation package. Failures: exception aborts bean creation. Production: idempotent fast init; defer Kafka consumer subscribe to SmartLifecycle or ApplicationRunner.',
    memory: 'POST CONSTRUCT = after inject, before proxy; CommonAnnotationBeanPostProcessor.',
  },
  {
    id: 'pre-destroy',
    annotation: '@PreDestroy',
    family: 'lifecycle',
    what:
      'jakarta.annotation.PreDestroy on a zero-arg method — invoked when the container disposes the singleton bean on context shutdown (or prototype when removed from scope cache). Processed by CommonAnnotationBeanPostProcessor as DestructionAwareBeanPostProcessor. Graceful cleanup hook.',
    why:
      'Release resources: close sockets, flush buffers, deregister metrics. Prefer over DisposableBean.destroy for Jakarta alignment. Complements JVM shutdown hooks for orderly Spring context close.',
    example: `@Component
public class MetricsReporter implements AutoCloseable {
  private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

  @PreDestroy
  void shutdown() {
    scheduler.shutdown();
    try {
      if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
        scheduler.shutdownNow();
      }
    } catch (InterruptedException e) {
      scheduler.shutdownNow();
      Thread.currentThread().interrupt();
    }
  }
}`,
    processor:
      'ConfigurableApplicationContext.close → destroySingletons → DisposableBeanAdapter invokes @PreDestroy methods registered by CommonAnnotationBeanPostProcessor.requireDestroyBean. Order: @PreDestroy → DisposableBean.destroy → custom destroy-method from @Bean. Reverse dependency order not guaranteed without depends-on metadata on destroy side.',
    when:
      'Cleanup for non-GC resources. Prototype beans: only if scope manages destruction (custom scope). Request/session scopes destroy when scope ends.',
    flow: `Context shutdown:
1. ContextClosedEvent published
2. LifecycleProcessor.stop() — SmartLifecycle beans stop first
3. destroySingletons() for each disposable singleton
4. @PreDestroy method invoked via reflection
5. DisposableBean.destroy if implemented
6. @Bean destroyMethod (inferred close() in Boot)`,
    lifecycle:
      'Singleton: once on context close. Prototype: container does NOT call @PreDestroy unless custom ScopedBeanDestructionCallback. Request scope: end of request.',
    proxy:
      '@PreDestroy discovered on target class metadata — invoked on actual bean instance behind proxy, typically the proxy itself if method exists on target and BPP registered destroy on exposed object.',
    runtime:
      'Shutdown hook or SIGTERM → Spring Boot graceful shutdown (server stop then context close). @PreDestroy timeout part of spring.lifecycle.timeout-per-shutdown-phase.',
    failure:
      'Exception in @PreDestroy logged, other beans still destroyed. Blocked shutdown if await forever. Double-close if also implementing AutoCloseable called manually.',
    debug:
      'DEBUG org.springframework.beans.factory.support.DisposableBeanAdapter. logging.lifecycle shutdown phases. kubernetes preStop + server.shutdown=graceful.',
    production:
      'Idempotent destroy methods. Bounded wait on thread pools. Do not start new work in @PreDestroy. Kafka consumers: stop in SmartLifecycle before @PreDestroy.',
    mistakes: [
      'Expecting @PreDestroy on prototype singleton-injected helper',
      'Long blocking @PreDestroy exceeding K8s terminationGracePeriodSeconds',
      'Relying on destroy order between unrelated beans',
      'Missing @PreDestroy when only close() exists — Boot may infer destroyMethod',
    ],
    traps: [
      'Interview: destroy order roughly reverse creation but not strict without depends-on',
      'SmartLifecycle.stop before singleton @PreDestroy in Boot 2.3+ graceful shutdown',
      'jakarta.annotation.PreDestroy Boot 3',
      '@Bean destroyMethod="shutdown" duplicates @PreDestroy risk',
    ],
    answer15s:
      '@PreDestroy runs on context shutdown for cleanup after the bean is no longer needed. CommonAnnotationBeanPostProcessor registers destroy callbacks.',
    answer60s:
      'jakarta.annotation.PreDestroy marks a no-arg destroy method invoked when the ApplicationContext closes. Order: @PreDestroy, then DisposableBean.destroy, then custom destroy-method. Boot graceful shutdown stops web server then destroys beans. Prototype scope: container does not destroy unless scoped.',
    answer3m:
      'Shutdown pipeline: SIGTERM → SpringApplication hook → stop accept new work → SmartLifecycle.stop → destroySingletons → @PreDestroy per disposable bean. Contrast JVM shutdown hook without context.close — leaks. Request/session @PreDestroy when scope expires. Production K8s: terminationGracePeriodSeconds must exceed server shutdown + @PreDestroy total. Pitfall: Hikari close inferred by Boot destroyMethod AND @PreDestroy. Testing: @DirtiesContext triggers destroy between tests.',
    memory: 'PRE DESTROY = context close cleanup; after SmartLifecycle.stop.',
  },
  {
    id: 'lazy',
    annotation: '@Lazy',
    family: 'lifecycle',
    what:
      '@Target(TYPE|METHOD|CONSTRUCTOR|PARAMETER|FIELD) delays bean initialization until first explicit access (getBean or injection resolving lazy dependency). On @Component class: entire bean lazy. On injection point: injects lazy-resolution proxy (by default) that fetches real bean on first method call. Interacts with BeanDefinition lazyInit flag.',
    why:
      'Faster startup when expensive beans unused in many profiles. Break some circular dependencies via lazy injection proxy. Optional dependencies without required=false.',
    example: `@Service
@Lazy
public class ExpensiveGraphService {
  // not created until first injected or getBean
}

@Service
public class ReportService {
  private final ExpensiveGraphService graph;

  public ReportService(@Lazy ExpensiveGraphService graph) {
    this.graph = graph; // lazy proxy until first graph.method()
  }
}`,
    processor:
      'DefaultListableBeanFactory preInstantiateSingletons skips lazyInit=true definitions unless eager dependency forces creation. @Lazy on injection: ContextAnnotationAutowireCandidateResolver or @Lazy resolution injects LazyInitializationProxyFactory (CGLIB or JDK) targeting getBean(name). @Lazy on @Bean delays factory method until first getBean.',
    when:
      'Expensive rarely-used services. @Lazy on one side of circular dependency (setter/field). Avoid @Lazy on everything — masks design issues.',
    flow: `Lazy singleton first access:
1. Context refresh — lazy bean NOT in preInstantiateSingletons
2. ReportService created — needs ExpensiveGraphService
3. @Lazy injection → proxy implementing interface or subclass
4. First graph.compute() → proxy intercepts → getBean("expensiveGraphService")
5. Real bean created, cached, delegated`,
    lifecycle:
      'Lazy bean created on first use, then singleton lifecycle. @Lazy prototype still new per getBean after creation triggered.',
    proxy:
      '@Lazy injection IS a proxy — separate from @Transactional proxy. Double proxy possible: lazy proxy wrapping transactional proxy. @Lazy(false) on injection point overrides type-level @Lazy.',
    runtime:
      'LazyInitializationException if circular dependency cannot be broken. @Lazy @Configuration may delay nested @Bean registration visibility.',
    failure:
      'BeanCurrentlyInCreationException if lazy cannot break cycle. NullPointer if assuming bean exists at startup (health check). Unexpected stack trace through $Proxy lazy interceptor.',
    debug:
      'Check BeanDefinition.isLazyInit(). TRACE DefaultListableBeanFactory preInstantiateSingletons skip logs. breakpoint on first getBean for lazy name.',
    production:
      'Sparingly on truly expensive beans. Never @Lazy on critical path security beans without explicit warmup. Document lazy beans for observability — metrics miss until first use.',
    mistakes: [
      '@Lazy on entire application — hides startup failures',
      'Expecting @PostConstruct at startup on @Lazy class',
      '@Lazy on constructor param of only bean using service — still works but surprising',
      'Circular dependency both sides eager constructors — @Lazy on one field needed',
    ],
    traps: [
      'Interview: @Lazy injection = proxy until first call',
      '@Lazy(false) on @Autowired overrides class-level @Lazy',
      'Boot spring.main.lazy-initialization=true makes ALL beans lazy — dangerous',
      'Actuator health may not trigger lazy beans',
    ],
    answer15s:
      '@Lazy defers bean creation until first use. On injection points Spring injects a proxy that resolves the real bean on first method invocation.',
    answer60s:
      '@Lazy sets lazyInit on BeanDefinition or creates lazy-injection proxy at injection site. preInstantiateSingletons skips lazy singletons unless depended on eagerly. Breaks some circular dependencies. @Lazy on @Bean delays factory invocation. Contrast eager default singleton creation at refresh end.',
    answer3m:
      'Mechanisms: definition-level lazyInit flag vs injection-point proxy (LazyAnnotationInjectionMetadata). Proxy factory chooses JDK/CGLIB like AOP. Interaction with @DependsOn: depends-on forces eager creation of dependency first. Boot lazy-initialization global flag. Production: expensive ML model loader @Lazy OK; DataSource never lazy. Pitfall: @Transactional @Lazy order — transaction proxy on real bean after resolution. Testing: @Lazy bean may not exist until test calls method — use @Autowired + method call in @BeforeEach.',
    memory: 'LAZY = create on first use; injection proxy defers getBean.',
  },
  {
    id: 'depends-on',
    annotation: '@DependsOn',
    family: 'lifecycle',
    what:
      '@Target(TYPE|METHOD) declares explicit bean creation (and destruction) ordering dependencies by bean name. "depends-on" string array on BeanDefinition. Ensures named beans fully initialized before dependent bean instantiation begins — does NOT inject them, only orders factory.',
    why:
      'Static utility beans without injection relationship but required early: schemaInitializer before jpaEntityManager. Legacy integration loading config before consumers. Rare in modern constructor-injection design.',
    example: `@Bean
public DataSource dataSource() { ... }

@Bean
@DependsOn("dataSource")
public Flyway flyway(DataSource dataSource) {
  return Flyway.configure().dataSource(dataSource).load();
}

@Component
@DependsOn({"cacheWarmer", "featureFlags"})
public class ApiGatewayRouter { ... }`,
    processor:
      'AbstractBeanFactory.registerDependentBean(dependsOnName, beanName) builds dependency graph. getBean(dependent) recursively instantiates depends-on beans first if not already created. destroy: dependent destroyed before depends-on (reverse). Works with singleton; prototype depends-on semantics limited.',
    when:
      'Ordering without injection link. Flyway/Liquibase before Hibernate. @DependsOn on @Configuration class for parse order (rare). Prefer constructor injection ordering when dependency is actually used.',
    flow: `getBean("apiGatewayRouter"):
1. sees depends-on cacheWarmer, featureFlags
2. getBean("cacheWarmer") — full creation pipeline
3. getBean("featureFlags")
4. now instantiate apiGatewayRouter`,
    lifecycle:
      'Affects creation start order only — not @PostConstruct ordering across beans unless creation completion implied. Destroy: router destroyed before cacheWarmer.',
    proxy:
      'N/A — ordering metadata only.',
    runtime:
      'Bean names must match exactly — @Bean name or default camelCase. @DependsOn on missing bean → NoSuchBeanDefinitionException at creation.',
    failure:
      'Typo in bean name string. Circular @DependsOn between A and B — BeanCurrentlyInCreationException. Depends-on without injection — hidden coupling.',
    debug:
      'BeanDefinition.getDependsOn() in debugger. Graph: spring-context-support dependency graph dump (custom). Log bean creation order DEBUG spring.beans.factory.',
    production:
      'Use sparingly — document why injection insufficient. Prefer Flyway auto-config ordering in Boot. Explicit @Bean method parameter injection for Flyway(DataSource).',
    mistakes: [
      'Using @DependsOn instead of constructor injection',
      'Expecting @DependsOn to guarantee @PostConstruct order of peers',
      'Wrong string name vs @Qualifier bean name',
      'Circular depends-on chains',
    ],
    traps: [
      'Interview: @DependsOn orders creation, does not inject',
      '@DependsOn on @Configuration ensures config class instantiated before dependent',
      'Destroy order reverse of creation for depends-on edges',
      'Does not replace @AutoConfigureAfter for auto-config',
    ],
    answer15s:
      '@DependsOn("beanName") forces named beans to be created before this bean. It orders factory initialization; it does not inject dependencies.',
    answer60s:
      '@DependsOn registers factory-level dependencies by name. When creating the dependent bean, Spring fully initializes depends-on beans first. Used for Flyway before JPA, cache warmers, or static init ordering. Destruction reverses the order. Prefer constructor injection when the dependency is actually needed.',
    answer3m:
      'Implementation: registerDependentBean in DefaultSingletonBeanRegistry. vs injection-driven order: constructor param forces creation anyway. @PostConstruct ordering NOT guaranteed by @DependsOn alone — only bean instantiation start. Multi @DependsOn: all before dependent. Prototype: depends-on singleton still once. Production: Boot FlywayAutoConfiguration orders via auto-config not @DependsOn in app code. Pitfall: @DependsOn("dataSource") but bean named customDataSource. Testing: @DirtiesContext after tests mutating shared depends-on beans.',
    memory: 'DEPENDS ON = factory creation order by name; no injection.',
  },
  {
    id: 'scope',
    annotation: '@Scope',
    family: 'lifecycle',
    what:
      '@Target(TYPE|METHOD) sets bean scope on BeanDefinition: singleton (default), prototype, request, session, application (ServletContext), websocket, or custom Scope implementation. Spring Framework 6 / Boot 3 web scopes require spring-web and active request context. Value alias: @Scope("singleton") or configurableBeanFactory.SCOPE_SINGLETON.',
    why:
      'Singleton for stateless services. Prototype for per-use objects (builders, command objects). Request/session for web user state — one bean instance per HTTP request or session with automatic cleanup.',
    example: `@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
public class CheckoutCommand {
  private final List<LineItem> items = new ArrayList<>();
}

@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class RequestUserContext {
  private String userId;
  // injected into singleton — requires scoped proxy
}`,
    processor:
      'Scope metadata on BeanDefinition at scan/@Bean registration. Singleton: DefaultSingletonBeanRegistry single cache. Prototype: createBean every getBean. Request/session: ContextLoaderListener + RequestContextListener register RequestContextHolder; ScopedBeanFactory creates scoped instance in scope cache, destroys at scope end. proxyMode TARGET_CLASS/INTERFACES for scoped proxy into singletons.',
    when:
      'Default singleton unless mutable per-request state. Prototype for new object each injection (rare). Request scope for HTTP request metadata in web apps only.',
    flow: `Scope resolution at getBean:
singleton → return cached from singletonObjects
prototype → always createBean()
request   → RequestContextHolder.currentRequestAttributes()
            → scope.get(name, objectFactory) per request id`,
    lifecycle:
      'Singleton: create at refresh (unless @Lazy), destroy on close. Prototype: init/destroy per instance — container does not track prototype destroy. Request: create on first access in request, destroy end of request. Session: lives until session invalidate or timeout.',
    proxy:
      'ScopedProxyMode.TARGET_CLASS (CGLIB) or INTERFACES (JDK) creates scoped proxy injected into singleton — delegate resolves current request/session bean on each method call. proxyMode DEFAULT → no proxy (only safe injecting into shorter-lived scope).',
    runtime:
      'IllegalStateException: No thread-bound request if request-scoped bean accessed outside web request (e.g. @Async, @Scheduled). Session scope needs HTTP session.',
    failure:
      'ScopeNotActiveException / IllegalStateException outside request. Memory leak: session scope holding large graphs. Prototype into singleton without proxy — stale single prototype instance.',
    debug:
      'RequestContextHolder.getRequestAttributes() null check. @RequestScope is composed @Scope("request"). Actuator request tracing for scope boundaries.',
    production:
      'Avoid session scope for large state — prefer stateless JWT + DB. Request scope for audit MDC user id. Never request scope in Kafka listener without fake request attributes.',
    mistakes: [
      'Request-scoped bean injected into singleton without scoped proxy',
      'Storing request-scoped bean in static field',
      'Using prototype scope expecting container @PreDestroy',
      '@Async method accessing request-scoped bean — wrong thread, no context',
    ],
    traps: [
      'Interview: singleton default; prototype = new every getBean/injection',
      '@RequestScope / @SessionScope meta-annotations',
      'ScopedProxyMode.INTERFACES requires interface injection',
      'Boot 3 jakarta.servlet still uses same web scope names',
    ],
    answer15s:
      '@Scope defines bean lifecycle: singleton (one per context), prototype (new each time), request/session (per HTTP request or session). Web scopes need scoped proxy when injected into singletons.',
    answer60s:
      'Singleton default — one shared instance. Prototype creates new bean per getBean/injection; Spring does not destroy prototypes. Request/session scopes tie lifecycle to web request/session via RequestContextHolder. proxyMode TARGET_CLASS creates CGLIB scoped proxy for singleton injection. Accessing request scope outside HTTP thread fails.',
    answer3m:
      'Registry: scope attribute on BeanDefinition, Scope implementation resolves objectFactory.getObject(). Web scopes registered by WebApplicationContext. Custom scope: register Scope bean + @Scope("custom"). Destroy callbacks at scope end for request/session. Contrast ApplicationScope (ServletContext). Production: prefer singleton + explicit request params over session scope. Performance: scoped proxy overhead negligible vs DB. Pitfall: @Transactional prototype — new transaction proxy per instance. Testing: MockHttpServletRequest + RequestContextHolder.setRequestAttributes for request scope.',
    memory: 'SCOPE: singleton=1, prototype=new each time, request/session=web + proxy.',
    tables: [
      {
        headers: ['Scope', 'Instances', 'Container destroys?', 'Typical use'],
        rows: [
          ['singleton', 'One per context', 'Yes on shutdown', 'Stateless @Service'],
          ['prototype', 'Per getBean/injection', 'No', 'Command objects, builders'],
          ['request', 'Per HTTP request', 'End of request', 'RequestUserContext'],
          ['session', 'Per HTTP session', 'Session end', 'Shopping cart (prefer DB)'],
        ],
      },
    ],
  },
  {
    id: 'prototype-singleton-trap',
    annotation: 'Prototype into singleton',
    family: 'lifecycle',
    what:
      'Anti-pattern and interview topic: injecting a prototype-scoped (or non-singleton) bean into a singleton stores ONE prototype instance for the singleton lifetime — defeating prototype semantics. Spring does not re-inject on each use. Solutions: ObjectProvider<T>, Provider<T>, @Lookup method injection, ApplicationContext.getBean(), or scoped proxy with method-level resolution.',
    why:
      'Singleton services are default; developers mark helper as prototype expecting fresh state per operation but inject once into singleton OrderService — shared mutable prototype state causes cross-request bugs in web apps.',
    example: `// PROBLEM
@Service // singleton
public class OrderService {
  @Autowired
  private CheckoutCommand command; // ONE prototype pinned forever
}

// FIX 1 — ObjectProvider (Boot 3 / Spring 4.3+)
@Service
public class OrderService {
  private final ObjectProvider<CheckoutCommand> commandProvider;

  public OrderService(ObjectProvider<CheckoutCommand> commandProvider) {
    this.commandProvider = commandProvider;
  }

  public void checkout() {
    CheckoutCommand cmd = commandProvider.getObject(); // fresh prototype
    cmd.execute();
  }
}

// FIX 2 — @Lookup
@Service
public abstract class OrderService {
  public void checkout() {
    createCommand().execute();
  }

  @Lookup
  protected abstract CheckoutCommand createCommand();
}`,
    processor:
      'Singleton creation: resolve prototype dependency once at populateBean → single prototype instance stored in singleton field. ObjectProvider: DependencyDescriptor recognizes ObjectProvider type → inject provider proxy → getObject() calls beanFactory.getBean(CheckoutCommand.class) each time. @Lookup: AutowiredAnnotationBeanPostProcessor or @LookupAnnotationSupport replaces abstract method with CGLIB subclass getBean call.',
    when:
      'Every prototype or request-scoped dependency used from singleton. ObjectProvider preferred modern style. @Lookup for legacy/template method pattern. getBean() only when provider APIs unavailable.',
    flow: `Timeline — broken vs fixed:

BROKEN (singleton + @Autowired prototype):
T0: create OrderService singleton
T1: populateBean → create ONE CheckoutCommand prototype → field set
T2: request A checkout → mutates command state
T3: request B checkout → sees request A stale state

FIXED (ObjectProvider):
T0: create OrderService singleton with provider
T1: request A → getObject() → prototype instance #1
T2: request B → getObject() → prototype instance #2`,
    lifecycle:
      'ObjectProvider.getObject() triggers full prototype creation pipeline each call. @Lookup same per invocation. Scoped proxy: one proxy in singleton, target resolved per scope per method call.',
    proxy:
      '@Lookup generates CGLIB subclass of OrderService (if not already proxied for tx). ObjectProvider is not AOP proxy — factory accessor. Request scope uses scoped proxy distinct from lookup pattern.',
    runtime:
      'ObjectProvider.getIfAvailable(), getIfUnique() for optional prototypes. Stream<ObjectProvider> for ordered streams in Spring 5.1+.',
    failure:
      'Shared mutable prototype state corruption. @Lookup on final class fails — needs concrete subclass. getBean() in loop without prototype scope — still singleton.',
    debug:
      'IdentityHashMap: command instance same across calls in broken case. ObjectProvider.getObject() returns new identity each time. @Scope("prototype") on BeanDefinition verify.',
    production:
      'ObjectProvider<T> constructor injection. Avoid getBean() service locator except framework code. For request scope from singleton: scoped proxy TARGET_CLASS, not ObjectProvider unless per-call new request object needed.',
    mistakes: [
      '@Autowired prototype into singleton expecting new instance per request',
      'Storing ObjectProvider.getObject() result in instance field',
      '@Lookup on private method — not supported',
      'Using prototype for stateless objects — unnecessary overhead',
    ],
    traps: [
      'Interview classic: prototype into singleton shares one instance',
      'Provider<T> (JSR-330) works like ObjectProvider',
      'Request-scoped into singleton needs proxy OR provider per request',
      '@Bean @Scope(prototype) method on @Configuration — still one call per config proxy invocation unless ObjectProvider',
    ],
    answer15s:
      'Injecting a prototype into a singleton pins one prototype instance. Use ObjectProvider.getObject(), @Lookup, or scoped proxy for fresh instances per use.',
    answer60s:
      'Singleton beans are created once; @Autowired prototype dependencies are resolved once at creation. Use ObjectProvider<T> and call getObject() per operation for new prototypes. @Lookup abstract method delegates to getBean each call. Request/session scope into singleton requires ScopedProxyMode.TARGET_CLASS or provider pattern.',
    answer3m:
      'Root cause: populateBean runs once for singleton. Solutions ranked: (1) ObjectProvider/Provider injection — idiomatic Spring 6; (2) @Lookup method injection — CGLIB subclass; (3) ApplicationContextAware getBean — service locator smell; (4) scoped proxy for request/session — method interception resolves current scope. @Bean prototype on @Configuration: inter-call through config proxy returns same singleton @Bean product unless prototype scope on @Bean definition — then each getBean(CheckoutCommand) new but field injection still once. Production web: never @Autowired request-scoped into singleton without proxy. Testing: assert System.identityHashCode differs across getObject() calls.',
    memory: 'PROTOTYPE → SINGLETON: use ObjectProvider.getObject() or @Lookup.',
    tables: [
      {
        headers: ['Solution', 'Mechanism', 'Best for'],
        rows: [
          ['ObjectProvider<T>', 'getObject() → getBean each call', 'Prototype from singleton (preferred)'],
          ['@Lookup', 'CGLIB method → getBean', 'Template method pattern'],
          ['Scoped proxy', 'Proxy delegates per request/session', 'Web scoped beans in singleton'],
          ['getBean()', 'Manual lookup', 'Framework code only'],
        ],
      },
    ],
  },
  {
    id: 'lifecycle-ordering',
    annotation: 'Lifecycle ordering (accurate)',
    family: 'lifecycle',
    what:
      'Reference card for precise Spring bean lifecycle sequence in Framework 6: BeanDefinition registration → instantiate → populateBean (injection) → BeanPostProcessor.postProcessBeforeInitialization (@PostConstruct, InitializingBean) → postProcessAfterInitialization (AOP proxy) → bean in use → destroy (@PreDestroy, DisposableBean). SmartLifecycle and ApplicationRunner run at context level after singleton pre-instantiation.',
    why:
      'Interview trap questions mix injection, init, and proxy order. Accurate ordering explains why @Transactional fails in @PostConstruct, why @Async needs proxy after init, and when ApplicationReadyEvent is safe for cross-bean assumptions.',
    example: `// Safe post-startup work
@Component
public class IndexWarmup implements ApplicationRunner {
  @Override
  public void run(ApplicationArguments args) {
    // all non-lazy singletons exist; context refreshed
  }
}`,
    processor:
      'AbstractAutowireCapableBeanFactory.createBean orchestrates steps. BeanPostProcessor ordered chain via Ordered interface / @Order. AnnotationAwareAspectJAutoProxyCreator typically postProcessAfterInitialization. CommonAnnotationBeanPostProcessor before init for @PostConstruct. ApplicationListener<ContextRefreshedEvent> after all singletons; ApplicationReadyEvent after runners.',
    when:
      'Designing startup hooks, debugging init failures, choosing between @PostConstruct, InitializingBean, ApplicationRunner, @EventListener.',
    flow: `ACCURATE singleton lifecycle:
═══════════════════════════════════════════════════
1. Register BeanDefinition (scan / @Bean / auto-config)
2. instantiateBean — constructor (+ constructor autowire)
3. populateBean — @Autowired / @Value / @Resource
4. postProcessBeforeInitialization
     ├─ @PostConstruct (CommonAnnotationBeanPostProcessor)
     └─ InitializingBean.afterPropertiesSet
5. custom init-method (@Bean initMethod)
6. postProcessAfterInitialization
     └─ AOP proxy wrap (@Transactional, @Async, @Cacheable)
7. Bean exposed to dependents / singleton cache
═══════════════════════════════════════════════════
Context refresh tail:
8. finishBeanFactoryInitialization — preInstantiateSingletons
9. ContextRefreshedEvent
10. ApplicationRunner / CommandLineRunner
11. ApplicationReadyEvent (Boot — server listening)

Shutdown (reverse-ish):
SmartLifecycle.stop → @PreDestroy → DisposableBean → destroy-method`,
    lifecycle:
      'Steps 2-7 per bean; step 8 creates all non-lazy singletons in dependency order (not @PostConstruct order across graph). Step 10+ safe for "everything ready" assumptions.',
    proxy:
      'AOP proxy applied at step 6 — calls from other beans through injection get proxy. Self-invocation within same class at step 7+ still bypasses proxy.',
    runtime:
      'BeanPostProcessor registration order matters when multiple BPPs compete. @Order on BPP not on bean init methods.',
    failure:
      'NullPointer accessing not-yet-created bean in @PostConstruct without @DependsOn. Transaction not active in @PostConstruct. Assuming ApplicationRunner order across beans without @Order on Runner.',
    debug:
      'LoggingListener BeanCreationException shows which phase failed. BeanPostProcessorChecker logs unexpected BPP on @Configuration. breakpoint createBean chain.',
    production:
      'ApplicationRunner for startup tasks needing full context. @PostConstruct for bean-local init only. SmartLifecycle for start/stop with phase control (Kafka consumers).',
    mistakes: [
      'Business logic in @PostConstruct depending on other beans\' @PostConstruct completion',
      '@Transactional in @PostConstruct',
      'Confusing ContextRefreshedEvent with ApplicationReadyEvent',
      'Assuming @DependsOn orders @PostConstruct across peers',
    ],
    traps: [
      'Interview: proxy AFTER @PostConstruct — internal calls no tx',
      'Lazy beans may initialize after ApplicationReadyEvent until first use',
      'BeanFactoryPostProcessor runs before ANY bean instance — not on this chart',
      'Prototype not in preInstantiateSingletons',
    ],
    answer15s:
      'Order: constructor → injection → @PostConstruct → InitializingBean → init-method → AOP proxy. ApplicationReadyEvent fires after all runners when the app is ready.',
    answer60s:
      'Per bean: instantiate, populateBean, postProcessBeforeInitialization (@PostConstruct, afterPropertiesSet), init-method, postProcessAfterInitialization (AOP). Context: preInstantiateSingletons all non-lazy singletons, ContextRefreshedEvent, ApplicationRunner, ApplicationReadyEvent. Shutdown: SmartLifecycle.stop then @PreDestroy.',
    answer3m:
      'Contrast three startup hooks: @PostConstruct (single bean, before proxy), ContextRefreshedEvent (all beans created, context usable), ApplicationReadyEvent (Boot server up, traffic ready). @DependsOn affects step 2 ordering start only. Circular deps: constructor fails; setter/field + @Lazy may succeed. BPP order: AutowiredAnnotationBeanPostProcessor before AnnotationAwareAspectJAutoProxyCreator. Production Kafka: ConsumerAwareListenerContainer SmartLifecycle start phase MAX_VALUE default stop before DB pool @PreDestroy. Accurate destroy: context close → lifecycle stop → disposable beans @PreDestroy reverse registration loosely.',
    memory: 'LIFECYCLE: inject → @PostConstruct → init → PROXY → use → @PreDestroy.',
    tables: [
      {
        headers: ['Hook', 'When', 'Use for'],
        rows: [
          ['@PostConstruct', 'After inject, before proxy', 'Bean-local init'],
          ['ApplicationRunner', 'After singletons, Boot', 'Cross-bean startup tasks'],
          ['ApplicationReadyEvent', 'After server ready', 'Accept traffic assumptions'],
          ['SmartLifecycle', 'start/stop phases', 'Kafka, connection pools'],
          ['@PreDestroy', 'Context shutdown', 'Resource cleanup'],
        ],
      },
    ],
  },
];
