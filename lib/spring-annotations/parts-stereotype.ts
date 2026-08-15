import type {AnnotationCard} from './types';

export const STEREOTYPE: AnnotationCard[] = [
  {
    id: 'component',
    annotation: '@Component',
    family: 'stereotype',
    what:
      'Generic stereotype marking a class as a Spring-managed component. Meta-annotated with @Indexed (for classpath indexing in Boot) and carries no domain semantics beyond “register me as a bean.” Equivalent to declaring a @Bean method that returns new YourClass() but discovered automatically via classpath scanning.',
    why:
      'Provides a single, framework-neutral marker so ClassPathBeanDefinitionScanner can find candidates without XML or manual @Bean registration. Specialized stereotypes (@Service, @Repository, @Controller) are themselves meta-annotated with @Component, so they inherit the same registration pipeline while adding role-specific post-processors or tooling hints.',
    example: `@Component
public class EmailValidator {
  public boolean isValid(String email) {
    return email != null && email.contains("@");
  }
}

// Boot 3 — picked up when @SpringBootApplication scans com.example
@SpringBootApplication
public class App {
  public static void main(String[] args) {
    SpringApplication.run(App.class, args);
  }
}`,
    processor:
      'ClassPathBeanDefinitionScanner (or AnnotatedBeanDefinitionReader for @Configuration classes) detects @Component via AnnotationTypeFilter. MetadataReader / SimpleMetadataReaderFactory reads class bytecode with ASM — the class is NOT loaded. Scanned classes become AnnotatedGenericBeanDefinition entries in the BeanDefinitionRegistry. Default bean name from AnnotationBeanNameGenerator (short class name decapitalized). CommonAnnotationBeanPostProcessor and AutowiredAnnotationBeanPostProcessor handle @PostConstruct / @Autowired on the instance later.',
    when:
      'Use for utility beans, helpers, adapters, and infrastructure that do not fit @Service, @Repository, or @Controller. Prefer a specialized stereotype when the role is clear — it documents intent and may trigger extra framework behavior (@Repository → exception translation).',
    flow: `1. Context refresh → ConfigurationClassPostProcessor parses @Configuration / @ComponentScan
2. ComponentScanAnnotationParser registers scan for base packages
3. ClassPathBeanDefinitionScanner.doScan(package) iterates classpath Resource[] entries
4. For each .class resource: MetadataReader.getAnnotationMetadata() checks @Component (including meta-annotations)
5. Matching classes → AnnotatedBeanDefinition registered with scope singleton (default), lazy false
6. BeanFactoryPostProcessors run (e.g. PropertySourcesPlaceholderConfigurer)
7. Instantiation: constructor injection → populateBean (@Autowired fields) → initializeBean (@PostConstruct)
8. Bean ready in DefaultListableBeanFactory singleton cache`,
    lifecycle:
      'Registered at bean-definition time during context refresh (before any bean instantiation). Instantiated when first requested or during pre-instantiation of singletons. Same lifecycle as any singleton bean: constructor → dependency injection → BeanPostProcessor before/after init → @PostConstruct → InitializingBean → custom init-method.',
    proxy:
      'No proxy by default. @Component alone does not enable AOP, @Transactional, or @Async. Those require separate annotations + enabling configuration (@EnableAspectJAutoProxy, @EnableTransactionManagement, @EnableAsync) and an advisor matching the bean. CGLIB/JDK proxy is applied only if another feature wraps the bean.',
    runtime:
      'At runtime the container holds a plain singleton instance (unless scoped). getBean(EmailValidator.class) returns the same instance. No special runtime wrapper unless AOP or @Scope(proxyMode=TARGET_CLASS) is applied.',
    failure:
      'No qualifying bean of type X — class not scanned (wrong package, missing @ComponentScan). BeanDefinitionOverrideException — duplicate bean names. NoSuchBeanDefinitionException — typo in @Qualifier or wrong profile. Circular dependency — constructor cycle between @Component beans.',
    debug:
      'logging.level.org.springframework.context.annotation=DEBUG shows component-scan candidates. Actuator /beans or context.getBeanDefinitionNames(). ConditionalOn... reports why auto-config skipped. -Dspring.debug=true for verbose condition evaluation (Boot). Verify scan base: @SpringBootApplication scanBasePackages or explicit @ComponentScan.',
    production:
      'Keep components stateless where possible; inject dependencies via constructor. Use @Profile for environment-specific beans. Avoid component-scanning entire com.* — narrow base packages for faster startup and fewer accidental beans. In Boot 3, spring-context-indexer (optional) speeds scan via META-INF/spring.components.',
    mistakes: [
      'Forgetting @ComponentScan when not using @SpringBootApplication defaults',
      'Putting @Component on interfaces or abstract classes expecting instantiation',
      'Using field @Autowired instead of constructor injection in production code',
      'Assuming @Component implies @Transactional or thread safety',
      'Scanning test classes into production context via overly broad base package',
    ],
    traps: [
      'Two @Component classes with the same default bean name in one package (inner classes, rename collision)',
      '@Component on a class outside scanned packages — silent absence until injection fails',
      'Meta-annotation custom @MyComponent without @Component meta — scanner will not see it unless custom filter',
      'Mixing XML <context:component-scan> and @ComponentScan with different base packages',
    ],
    answer15s:
      '@Component marks a class for classpath scanning. ClassPathBeanDefinitionScanner uses MetadataReader (ASM, no class load) to register a BeanDefinition; the container instantiates it as a singleton and injects dependencies.',
    answer60s:
      '@Component is the root stereotype. During context refresh, ComponentScanAnnotationParser drives ClassPathBeanDefinitionScanner, which reads annotation metadata via MetadataReader without loading classes. Matching types become AnnotatedGenericBeanDefinition entries with default singleton scope. @Service, @Repository, and @Controller are meta-annotated @Component with extra semantics. No proxy or transaction behavior is implied — only registration and DI.',
    answer3m:
      'Walk the pipeline: @SpringBootApplication brings @ComponentScan on the main class package. ConfigurationClassPostProcessor registers scanner filters for @Component (including composed stereotypes). For each classpath .class file, SimpleMetadataReaderFactory produces a MetadataReader; AnnotationTypeFilter matches @Component on the type or meta-annotations. Bean name defaults to decapitalized simple name unless @Component("customName"). At instantiation, AutowiredAnnotationBeanPostProcessor resolves constructor/field/method dependencies. Contrast with @Bean: @Component is class-path discovery; @Bean is factory-method registration on @Configuration. Production: narrow scan, constructor injection, no assumption of AOP. Debug with DEBUG logging on org.springframework.context.annotation and verify bean definition count at startup.',
    memory: 'COMPONENT = scan → register definition → inject → plain instance (no magic proxy).',
  },
  {
    id: 'service',
    annotation: '@Service',
    family: 'stereotype',
    what:
      '@Target(TYPE) stereotype meta-annotated with @Component. Semantically indicates the class belongs to the service layer (business logic). In Spring Framework 6 there is NO additional BeanPostProcessor or auto-proxy registered solely because of @Service — behavior is identical to @Component at the framework level.',
    why:
      'Expresses architectural intent in code and to developers reviewing the codebase. Enables layer-based tooling (ArchUnit rules, package conventions) and clearer stack traces than a generic @Component. Does NOT enable transactions, caching, or validation by itself.',
    example: `@Service
public class OrderService {
  private final OrderRepository orders;
  private final PaymentClient payments;

  public OrderService(OrderRepository orders, PaymentClient payments) {
    this.orders = orders;
    this.payments = payments;
  }

  @Transactional // explicit — NOT implied by @Service
  public Order placeOrder(PlaceOrderCommand cmd) {
    return orders.save(cmd.toEntity());
  }
}`,
    processor:
      'Same as @Component: ClassPathBeanDefinitionScanner + MetadataReader. No ServiceAnnotationBeanPostProcessor exists in core Spring. Transactional behavior comes only from @Transactional + InfrastructureAdvisorAutoProxyCreator / TransactionInterceptor when @EnableTransactionManagement is present.',
    when:
      'Mark stateless or transactional business-logic classes in the service layer. Pair with @Transactional on methods that need TX — never assume @Service turns it on.',
    flow: `1. Scanner registers @Service class as @Component-equivalent BeanDefinition
2. (Optional) @EnableTransactionManagement registers TransactionAttributeSource advisors
3. Bean instantiated — still plain object until AOP proxy created for @Transactional methods
4. External call to placeOrder() → proxy → TransactionInterceptor → target method
5. Internal this.placeOrder() → NO proxy (self-invocation trap)`,
    lifecycle:
      'Identical to @Component singleton lifecycle. Transaction boundaries exist only around proxied method entry/exit when @Transactional is present and proxy is applied.',
    proxy:
      '@Service does NOT create a proxy. @Transactional on public methods (via Spring AOP) may wrap the bean in a JDK or CGLIB proxy if the class is advised. Self-invocation bypasses the proxy unless using AspectJ compile-time weaving or injecting self.',
    runtime:
      'Runtime object is a service bean in the container with the same identity as @Component. Transaction synchronization binds to the current thread only when @Transactional proxy intercepts the call.',
    failure:
      'Transaction not rolling back — @Transactional on private method or self-invocation. No bean — service not scanned. UnexpectedRollbackException — checked exception rollback rules. NonUniqueBeanDefinitionException — multiple @Service implementations of one interface without @Primary/@Qualifier.',
    debug:
      'Confirm @EnableTransactionManagement (Boot: spring-boot-starter-jdbc or -data-jpa auto-enables). logging.level.org.springframework.transaction=TRACE for TX boundaries. Check if bean is proxied: AopUtils.isAopProxy(orderService).',
    production:
      'Constructor-inject repositories and clients. Put @Transactional on service facade methods with explicit rollbackFor. Keep services free of web annotations (@RequestParam). Use interface + impl only when multiple implementations or testing seams require it — not mandatory for @Service.',
    mistakes: [
      'Believing @Service enables @Transactional automatically',
      'Calling @Transactional methods via this. inside the same class',
      'Putting HTTP or JPA entity mapping concerns in @Service classes',
      'Using @Service on DTOs or configuration classes',
      'Omitting rollbackFor on checked business exceptions',
    ],
    traps: [
      'Interview answer “@Service enables transactions” — FALSE in Spring Framework',
      '@Transactional on class + non-public method — silently not advised',
      'Multiple @Service beans implementing PaymentGateway — injection ambiguity',
      '@Service in module not on component-scan classpath (library JAR without spring.components index)',
    ],
    answer15s:
      '@Service is a @Component stereotype for the business layer. It does not enable transactions or proxies — only documents intent; behavior equals @Component unless you add @Transactional and TX config.',
    answer60s:
      '@Service is meta-annotated @Component, discovered by ClassPathBeanDefinitionScanner the same way. Spring Framework 6 registers no special processor for @Service. Transactions require @Transactional plus @EnableTransactionManagement (Boot starters add this). AOP proxy wraps the bean only when transactional or other aspects apply. Use @Service for clarity and architecture tests, not for implicit TX.',
    answer3m:
      'Contrast @Service vs @Component: identical BeanDefinition registration via scanning. The service layer stereotype helps humans and ArchUnit, not the container. Deep TX: @EnableTransactionManagement imports TransactionManagementConfigurationSelector; PlatformTransactionManager bean required; TransactionInterceptor advisor matches @Transactional methods. Proxy: JDK if interface, else CGLIB subclass. Self-invocation skips proxy — inject self or split class. Boot 3: spring-boot-starter-data-jpa brings Hibernate + TX manager. Failure modes: private @Transactional, wrong propagation, read-only on write path. Production: constructor injection, explicit rollbackFor, keep controllers thin.',
    memory: 'SERVICE = @Component + layer label. TX needs @Transactional, not @Service.',
  },
  {
    id: 'repository',
    annotation: '@Repository',
    family: 'stereotype',
    what:
      'Stereotype meta-annotated with @Component marking the persistence layer. Spring automatically registers PersistenceExceptionTranslationPostProcessor when any bean carries @Repository (or when using @EnableAspectJAutoProxy / data access setup). Translates vendor-specific persistence exceptions into Spring DataAccessException hierarchy.',
    why:
      'Keeps service code free of catch (SQLException) / catch (HibernateException) blocks. Enables consistent @Transactional rollback on DataAccessException. Signals intent: this bean talks to databases, JPA, JDBC, or similar stores.',
    example: `@Repository
public class JdbcOrderRepository implements OrderRepository {
  private final JdbcTemplate jdbc;

  public JdbcOrderRepository(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public Order findById(UUID id) {
    return jdbc.queryForObject("SELECT ...", rowMapper, id);
  }
}

// Spring Data — interface only
public interface OrderRepository extends JpaRepository<Order, UUID> {}`,
    processor:
      'ClassPathBeanDefinitionScanner registers the bean. RepositoryAnnotationBeanPostProcessor is NOT used — instead PersistenceExceptionTranslationPostProcessor (BeanFactoryPostProcessor) is auto-registered when the context detects @Repository beans. It wraps beans implementing PersistenceExceptionTranslator or advises repository calls to map exceptions. Spring Data JPA generates JDK proxy implementations for interface @Repository at runtime via JpaRepositoryFactory.',
    when:
      'DAO implementations, JdbcTemplate gateways, and Spring Data repository interfaces. Use for any persistence adapter where you want SQLException → UncategorizedDataAccessException translation.',
    flow: `1. Scanner registers @Repository bean definition
2. Context detects @Repository → registers PersistenceExceptionTranslationPostProcessor
3. Bean instantiated (your class or Spring Data generated proxy)
4. Service calls repository.findById()
5. JDBC throws DuplicateKeyException vendor wrapper
6. PersistenceExceptionTranslationPostProcessor / translator → DuplicateKeyException (Spring)
7. @Transactional service layer rolls back on DataAccessException`,
    lifecycle:
      'Same as @Component. Spring Data repo interfaces: factory bean creates proxy at runtime after EntityManagerFactory is ready. Exception translation applies on thrown persistence exceptions from template or ORM APIs.',
    proxy:
      'Custom @Repository class: no proxy unless @Transactional or other AOP. Spring Data JPA repository interface: JDK dynamic proxy implementing the interface, delegating to SimpleJpaRepository. Exception translation may use AOP advisor RepositoryAnnotationBeanPostProcessor in some stacks — in Framework 6 the post-processor registers exception translation advisor for @Repository beans.',
    runtime:
      'At runtime, calls through the repository bean may be wrapped by exception-translation AOP. Spring Data proxies delegate to EntityManager per call. Thread-bound Session (OSIV) in web apps extends session life — configure spring.jpa.open-in-view=false in Boot 3 for APIs.',
    failure:
      'NonUniqueResultException — query returned multiple rows. IncorrectResultSizeDataAccessException. LazyInitializationException — access outside session/transaction. BeanCreationException — missing DataSource or EMF. Translation not applied — exception not going through Spring data access API.',
    debug:
      'logging.level.org.springframework.jdbc=DEBUG for SQL. spring.jpa.show-sql=true (dev only). Verify @Repository detected: PersistenceExceptionTranslationPostProcessor bean present. For Data: enable repository query logging via logging.level.org.hibernate.SQL=DEBUG.',
    production:
      'Prefer Spring Data where possible; custom @Repository for complex SQL. Disable open-in-view for REST. Use @Transactional(readOnly=true) on read services. Index-aware queries; avoid N+1 with fetch joins or @EntityGraph.',
    mistakes: [
      'Swallowing DataAccessException without rethrow or mapping',
      'Using @Repository on a class that does not touch persistence APIs',
      'Expecting exception translation on manually caught SQLException',
      'Leaving spring.jpa.open-in-view=true causing lazy-load in JSON serialization',
      'Confusing @Repository with @Entity — entity is not a Spring bean by default',
    ],
    traps: [
      'Spring Data interface without @Repository still works if extends Repository — but explicit @Repository triggers translation registration consistently',
      'Exception translation does not apply to exceptions thrown before reaching persistence layer',
      'Multiple EntityManagerFactory — wrong @Qualifier on custom @Repository',
      'Interview: @Repository does not replace @Transactional for write operations',
    ],
    answer15s:
      '@Repository is a @Component stereotype for persistence. Spring registers PersistenceExceptionTranslationPostProcessor to map vendor DB exceptions to DataAccessException. Spring Data repos are runtime-generated proxies.',
    answer60s:
      '@Repository marks DAOs. Scanner registers like @Component. Key difference: context auto-registers PersistenceExceptionTranslationPostProcessor so SQLException/HibernateException become Spring unchecked DataAccessException subclasses — cleaner @Transactional rollback. Spring Data JPA repository interfaces get JDK proxies from JpaRepositoryFactory, not classpath-scanned classes. Does not open transactions by itself.',
    answer3m:
      'Pipeline: ClassPathBeanDefinitionScanner + MetadataReader finds @Repository. BeanDefinition registered. During refresh, PersistenceExceptionTranslationPostProcessor added to translate exceptions on repository boundaries. Custom JDBC @Repository: plain singleton, translation on thrown persistence exceptions. Spring Data: enable @EnableJpaRepositories, factory creates proxy implementing interface, delegates to SimpleJpaRepository with shared EntityManager proxy. Contrast @Component: only @Repository triggers exception translation registration. Production: open-in-view false, readOnly TX for queries, do not catch DataAccessException in controller. Debug SQL and verify translator bean in context.',
    memory: 'REPOSITORY = @Component + PersistenceExceptionTranslationPostProcessor.',
  },
  {
    id: 'controller',
    annotation: '@Controller',
    family: 'stereotype',
    what:
      'Stereotype meta-annotated with @Component for Spring MVC presentation layer. Marks a class as a web controller whose methods can be mapped with @RequestMapping and composed annotations (@GetMapping, etc.). Return values are resolved by HandlerMethodReturnValueHandler — default for String is view name (ViewResolver), not raw response body.',
    why:
      'Separates web mapping from business logic. Integrates with DispatcherServlet front controller, HandlerMapping, HandlerAdapter, and view resolution for server-side rendering. Use @RestController when every handler should write directly to the HTTP response body.',
    example: `@Controller
@RequestMapping("/orders")
public class OrderPageController {
  private final OrderService orders;

  public OrderPageController(OrderService orders) {
    this.orders = orders;
  }

  @GetMapping("/{id}")
  public String show(@PathVariable UUID id, Model model) {
    model.addAttribute("order", orders.findById(id));
    return "order-detail"; // view name → Thymeleaf
  }
}`,
    processor:
      'ClassPathBeanDefinitionScanner registers bean. RequestMappingHandlerMapping (implements HandlerMapping) detects @Controller and @RequestMapping on type/method at startup — builds RequestMappingInfo → HandlerMethod map. DispatcherServlet receives HTTP request, resolves handler, RequestMappingHandlerAdapter invokes method with argument resolvers (@PathVariable, @RequestBody). Return value → ViewNameMethodReturnValueHandler or other handlers. Not a BeanPostProcessor on @Controller itself — MVC infrastructure reads annotations at mapping init.',
    when:
      'Server-side MVC with templates (Thymeleaf, JSP). APIs returning JSON should use @RestController (@ResponseBody semantics). Mixing: @Controller + @ResponseBody on individual methods for hybrid apps.',
    flow: `DispatcherServlet path:
1. HTTP → DispatcherServlet.doDispatch()
2. HandlerMapping chain → RequestMappingHandlerMapping matches @GetMapping("/orders/{id}")
3. HandlerAdapter → RequestMappingHandlerAdapter invokes OrderPageController.show()
4. Argument resolvers bind @PathVariable, Model
5. Return "order-detail" → ViewResolver → ThymeleafView render
6. Exception → @ControllerAdvice @ExceptionHandler if configured`,
    lifecycle:
      'Singleton controller bean created during context refresh, before DispatcherServlet accepts traffic. Handler mappings built once at startup (unless request-mapping refresh in dev). One controller instance serves all requests — keep thread-safe (stateless).',
    proxy:
      'Controllers are typically NOT proxied unless @Transactional or @Cacheable on handler methods (discouraged). Security @PreAuthorize may create CGLIB proxy if @EnableMethodSecurity. Prefer delegating to @Service for TX.',
    runtime:
      'DispatcherServlet (Boot: auto-registered on port 8080) delegates to singleton controller methods on Tomcat/Jetty worker threads. Model attributes request-scoped; controller fields must not hold request state.',
    failure:
      '404 — no HandlerMapping match (wrong path, missing @RequestMapping). 406 — no HttpMessageConverter for return type. Ambiguous mapping — two methods same path/method. Whitelabel error — unhandled exception. Circular view path — return string matches URL.',
    debug:
      'logging.level.org.springframework.web.servlet.mvc.method.annotation=DEBUG for mapping registration. Boot actuator mappings endpoint. Enable spring.mvc.log-request-details in dev. DispatcherServlet TRACE shows handler resolution.',
    production:
      'Thin controllers: validate input, call service, map response. No business logic. Use @Valid + @ControllerAdvice for errors. For JSON APIs prefer @RestController. CSRF for form POST; stateless APIs use security filter chain.',
    mistakes: [
      'Using @Controller for JSON API without @ResponseBody on methods',
      'Putting @Transactional on controller methods',
      'Storing request-specific state in controller fields',
      'Returning entity graphs with lazy associations (LazyInitializationException)',
      'Duplicate @RequestMapping paths across beans',
    ],
    traps: [
      '@Controller return String is view name, not response body — classic interview trap',
      'Missing @PathVariable name when parameter name not retained (compile -parameters)',
      '@Controller in wrong package — not scanned',
      'Two DispatcherServlets with overlapping url-pattern',
    ],
    answer15s:
      '@Controller is a @Component stereotype for MVC. RequestMappingHandlerMapping registers handler methods; DispatcherServlet dispatches requests. String return = view name unless @ResponseBody.',
    answer60s:
      '@Controller marks web handlers scanned like @Component. At startup RequestMappingHandlerMapping indexes @RequestMapping methods. DispatcherServlet: HandlerMapping finds HandlerMethod, HandlerAdapter invokes it with resolved arguments. Unlike @RestController, return values go to view resolution by default. Keep controllers thin; use @RestController for REST JSON.',
    answer3m:
      'Full MVC path: Tomcat → DispatcherServlet → HandlerMapping (RequestMappingHandlerMapping) → HandlerExecutionChain (interceptors) → RequestMappingHandlerAdapter → controller method. @Controller detected via stereotype on class. Return ValueHandler: ViewNameMethodReturnValueHandler for String view names. Contrast @RestController = @Controller + @ResponseBody on class level. Processors: not a dedicated @Controller BPP — MVC config classes enable WebMvcConfigurationSupport mapping. Production: constructor inject services, @Valid DTOs, @ControllerAdvice exceptions. Debug mappings at INFO/DEBUG. Failure: ambiguous mapping, missing converter, self-invocation N/A here.',
    memory: 'CONTROLLER = MVC handler; String → view. REST needs @ResponseBody or @RestController.',
  },
  {
    id: 'rest-controller',
    annotation: '@RestController',
    family: 'stereotype',
    what:
      '@Controller + @ResponseBody at the type level (meta-annotations). Every handler method return value is written directly to the HTTP response body via HttpMessageConverter (Jackson for JSON in Boot 3), not resolved as a view name.',
    why:
      'Eliminates per-method @ResponseBody for REST APIs. Signals API-first controllers. Works with @RequestBody / @ResponseStatus / ResponseEntity for full HTTP semantics.',
    example: `@RestController
@RequestMapping("/api/orders")
public class OrderApiController {
  private final OrderService orders;

  public OrderApiController(OrderService orders) {
    this.orders = orders;
  }

  @GetMapping("/{id}")
  public OrderDto get(@PathVariable UUID id) {
    return OrderDto.from(orders.findById(id));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public OrderDto create(@Valid @RequestBody CreateOrderRequest req) {
    return OrderDto.from(orders.placeOrder(req.toCommand()));
  }
}`,
    processor:
      'Same registration as @Controller via scanner. RequestMappingHandlerMapping treats class as @Controller. RequestResponseBodyMethodProcessor handles @ResponseBody semantics (applied implicitly to all methods). MappingJackson2HttpMessageConverter (Boot 3: Jackson 2.15+) serializes return value to application/json.',
    when:
      'REST/JSON (or XML) APIs, microservice HTTP endpoints, SPA backends. Do not use for server-rendered HTML pages — use @Controller + view name.',
    flow: `1. DispatcherServlet receives GET /api/orders/{id}
2. RequestMappingHandlerMapping → OrderApiController.get
3. RequestMappingHandlerAdapter invokes method; PathVariableMethodArgumentResolver binds id
4. Service returns domain object → mapped to OrderDto
5. RequestResponseBodyMethodProcessor selects MappingJackson2HttpMessageConverter
6. Jackson writes JSON to response body; Content-Type: application/json`,
    lifecycle:
      'Singleton controller, mappings at startup. MessageConverters registered in WebMvcConfigurer or Boot auto-config. Boot 3 uses jakarta.servlet and Jackson 3 compatibility via spring-boot-starter-web.',
    proxy:
      'Same as @Controller — no proxy unless security aspects applied. @PreAuthorize on handler methods may proxy the bean.',
    runtime:
      'Each request thread enters controller method directly on singleton instance. Serialization happens on response commit. StreamingResponseBody for large payloads.',
    failure:
      'HttpMediaTypeNotAcceptableException — Accept header mismatch. HttpMessageNotReadableException — malformed JSON. 500 on LazyInitializationException serializing JPA entity — return DTOs. 415 Unsupported Media Type — missing Content-Type on POST.',
    debug:
      'logging.level.org.springframework.web.servlet.mvc.method.annotation.RequestResponseBodyMethodProcessor=DEBUG. Wiretap with spring.mvc.log-request-details. Use /actuator/mappings. Test with MockMvc.',
    production:
      'Always return DTOs, never entities. Global @ControllerAdvice for ProblemDetail (RFC 7807) errors — Boot 3 supports ProblemDetail natively. Version APIs (/api/v1). Validate with @Valid. Document with springdoc-openapi.',
    mistakes: [
      'Returning JPA entities with lazy collections to JSON',
      'Using @RestController for Thymeleaf pages',
      'Forgetting @Valid on @RequestBody',
      'Exposing stack traces in JSON error responses',
      'Missing produces/consumes on non-JSON endpoints',
    ],
    traps: [
      '@RestController String return is JSON string body, NOT view name — opposite of @Controller',
      'Interview: @RestController = @Controller + @ResponseBody (equivalence)',
      'void return = empty body 200 — surprises clients expecting JSON',
      'Optional wrapper serialized oddly without Jackson modules',
    ],
    answer15s:
      '@RestController is @Controller plus @ResponseBody on the class. Handler return values serialize directly to the HTTP body via HttpMessageConverter (Jackson), not view names.',
    answer60s:
      '@RestController meta-annotates @Controller and @ResponseBody. Scanner and RequestMappingHandlerMapping treat it as a web controller. DispatcherServlet invokes methods; RequestResponseBodyMethodProcessor writes JSON/XML to the response. Use for REST APIs; use plain @Controller when returning view names. Boot 3: Jackson on classpath via starter-web.',
    answer3m:
      'Equivalence: @RestController = @Controller + @ResponseBody — all methods implicitly @ResponseBody. Pipeline: DispatcherServlet → HandlerMapping → RequestMappingHandlerAdapter → argument resolvers (@RequestBody → RequestResponseBodyMethodProcessor read, @PathVariable) → return value → same processor write with MappingJackson2HttpMessageConverter. Contrast @Controller: String → ViewResolver. Production DTOs, @Valid, ProblemDetail errors, no OSIV lazy traps. @ControllerAdvice handles exceptions globally. Security: resource server validates JWT before reaching @RestController. Memory: REST = body out, not view.',
    memory: 'REST_CONTROLLER = @Controller + @ResponseBody → JSON via MessageConverter.',
  },
  {
    id: 'component-scan',
    annotation: '@ComponentScan',
    family: 'stereotype',
    what:
      'Declares base packages (and filters) for ClassPathBeanDefinitionScanner. Can sit on @Configuration class or @SpringBootApplication. Attributes: basePackages, basePackageClasses, includeFilters, excludeFilters, nameGenerator, scopeResolver, useDefaultFilters (default true includes @Component stereotypes).',
    why:
      'Without scanning, every bean would need XML or @Bean methods. @ComponentScan wires automatic discovery of @Component, @Service, @Repository, @Controller, @Configuration, and custom meta-annotated stereotypes in the specified packages.',
    example: `@Configuration
@ComponentScan(
    basePackages = "com.example.app",
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.example\\.app\\.legacy\\..*"
    )
)
public class AppConfig {}

@SpringBootApplication // = @Configuration + @EnableAutoConfiguration + @ComponentScan on main class package
public class Application {
  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }
}`,
    processor:
      'ComponentScanAnnotationParser (invoked by ConfigurationClassPostProcessor) parses @ComponentScan on @Configuration classes. Creates ClassPathBeanDefinitionScanner with AnnotationTypeFilter for @Component (default). Uses ResourcePatternResolver → PathMatchingResourcePatternResolver to find **/*.class under package. MetadataReaderFactory (CachingMetadataReaderFactory) avoids loading classes. AnnotatedBeanDefinitionReader is alternate path for explicitly registered classes.',
    when:
      'Always in annotation-config apps. Narrow basePackages in large monorepos. Use basePackageClasses for refactor-safe roots. excludeFilters for legacy or test doubles.',
    flow: `1. ConfigurationClassPostProcessor processes @Configuration bean definitions
2. ComponentScanAnnotationParser.parse(Element, AnnotationAttributes)
3. new ClassPathBeanDefinitionScanner(registry, useDefaultFilters).scan(basePackages)
4. For each candidate class resource:
   a. MetadataReader.getClassMetadata().getClassName()
   b. isCandidateComponent(metadata) — concrete class, not @Configuration nested edge cases
   c. registerBeanDefinition(decoratedName, AnnotatedGenericBeanDefinition)
5. Scanned @Configuration classes recursively processed (may trigger more scans)
6. BeanFactoryPostProcessors continue refresh`,
    lifecycle:
      'Runs once per @ComponentScan declaration during context refresh phase configurationClassEnhancement — before singleton instantiation. Re-scan on context refresh in dynamic scenarios is rare; tests use @DirtiesContext.',
    proxy:
      '@ComponentScan itself is not proxied — it is configuration metadata only. Scanned @Configuration classes with proxyBeanMethods=true get CGLIB-enhanced @Configuration class proxy for @Bean singleton semantics.',
    runtime:
      'No runtime presence — scan results are BeanDefinitions in the registry. Runtime impact: which beans exist. spring.context.index (META-INF/spring.components) reduces classpath I/O at startup in Boot.',
    failure:
      'No beans found — wrong base package (typo, module not on classpath). Too many beans — scan too broad. BeanDefinitionOverrideException — duplicate names from overlapping scans. Slow startup — scanning large classpath without index.',
    debug:
      'DEBUG org.springframework.context.annotation.ClassPathBeanDefinitionScanner logs identified candidates. logging.level.org.springframework.boot.autoconfigure=DEBUG for component scan overlap with auto-config. Print scanBasePackages from @SpringBootApplication.',
    production:
      'Scan only your application root package — avoid org.springframework or com. entire tree. Multi-module: @SpringBootApplication on each deployable with precise scanBasePackages. Use spring-context-indexer at compile time. excludeFilters for @Configuration classes that should not be beans.',
    mistakes: [
      'Placing @ComponentScan on a class that is not itself a @Configuration (ignored unless imported)',
      'Expecting @ComponentScan on @Service class to work — only on @Configuration',
      'Scanning com root — pulls accidental @Component beans from libraries',
      'Duplicate overlapping scans in parent and child contexts',
      'Forgetting scanBasePackages when main class not in root package of code',
    ],
    traps: [
      '@SpringBootApplication only scans package of main class and below — beans in sibling package invisible',
      'useDefaultFilters=false without includeFilters → scans nothing',
      'FilterType.ANNOTATION on custom stereotype requires meta-@Component',
      'Interview: MetadataReader reads bytecode with ASM — does not load class into JVM',
    ],
    answer15s:
      '@ComponentScan tells ClassPathBeanDefinitionScanner which packages to scan. MetadataReader reads class files without loading them; matching @Component stereotypes become BeanDefinitions.',
    answer60s:
      '@ComponentScan on @Configuration triggers ComponentScanAnnotationParser. ClassPathBeanDefinitionScanner uses ResourcePatternResolver and MetadataReaderFactory (ASM bytecode) to find classes annotated with @Component or meta-annotated stereotypes. Filters refine candidates. @SpringBootApplication includes implicit scan of the main class package. Production: narrow packages, use spring.components index.',
    answer3m:
      'Deep dive: ConfigurationClassPostProcessor → ComponentScanAnnotationParser → ClassPathBeanDefinitionScanner.scan. MetadataReader (SimpleMetadataReaderFactory + ASM ClassReader) inspects AnnotationMetadata without Class.forName. Default filters: AnnotationTypeFilter(@Component). Custom includeFilters for @MyStereotype. Bean naming via AnnotationBeanNameGenerator. Contrast AnnotatedBeanDefinitionReader.register for manual add. Boot @SpringBootApplication composite. Performance: CachingMetadataReaderFactory, spring-context-indexer. Failures: wrong package, overly broad scan, override conflicts. Multi-context: parent/child scan boundaries. This is the entry point for all stereotype beans.',
    memory: 'COMPONENT_SCAN → ClassPathBeanDefinitionScanner + MetadataReader (ASM, no classload).',
    tables: [
      {
        headers: ['Piece', 'Role', 'Interview note'],
        rows: [
          ['ClassPathBeanDefinitionScanner', 'Iterates classpath .class resources under base packages', 'Core of @ComponentScan'],
          ['MetadataReader', 'ASM reads annotations without loading class', 'Fast startup; no static init side effects'],
          ['ComponentScanAnnotationParser', 'Parses @ComponentScan on @Configuration', 'Invoked by ConfigurationClassPostProcessor'],
          ['AnnotationTypeFilter', 'Default filter for @Component', 'Custom stereotypes need meta-@Component or custom filter'],
          ['PersistenceExceptionTranslationPostProcessor', 'Auto-registered when @Repository present', 'Not part of scan itself — follow-on'],
          ['RequestMappingHandlerMapping', 'Indexes @Controller/@RestController', 'Separate MVC init after beans exist'],
        ],
      },
    ],
  },
];
