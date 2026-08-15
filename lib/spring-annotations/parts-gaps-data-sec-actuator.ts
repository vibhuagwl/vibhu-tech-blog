import type {AnnotationCard} from './types';

export const GAPS_DATA_SEC_ACT: AnnotationCard[] = [
  {
    id: 'enable-jpa-repositories-query',
    annotation: '@EnableJpaRepositories · @Query · @Modifying',
    family: 'gaps-data-sec-act',
    what:
      '@EnableJpaRepositories on @Configuration activates Spring Data JPA repository scanning — registers JDK dynamic proxy beans for interfaces extending JpaRepository/CrudRepository. Attributes: basePackages, entityManagerFactoryRef, transactionManagerRef. @Query on repository method defines JPQL or native SQL. @Modifying marks @Query as INSERT/UPDATE/DELETE requiring @Transactional and clearAutomatically/flushAutomatically.',
    why:
      'Declarative persistence without boilerplate implementations. @EnableJpaRepositories required in non-Boot plain Spring or custom EMF setups — Boot auto-configures when spring-data-jpa on classpath. @Query for complex fetches beyond derived query method names. @Modifying for bulk updates bypassing entity lifecycle.',
    example: `@Configuration
@EnableJpaRepositories(basePackages = "com.acme.payments.repo")
public class JpaConfig {}

public interface PaymentRepository extends JpaRepository<Payment, Long> {

  @Query("select p from Payment p where p.status = :status and p.createdAt > :since")
  List<Payment> findRecentByStatus(@Param("status") PaymentStatus status,
                                   @Param("since") Instant since);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("update Payment p set p.status = :newStatus where p.id = :id")
  int updateStatus(@Param("id") Long id, @Param("newStatus") PaymentStatus newStatus);
}

// Service layer — @Modifying requires @Transactional
@Transactional
public void markCaptured(Long id) {
  paymentRepository.updateStatus(id, PaymentStatus.CAPTURED);
}`,
    processor:
      '@EnableJpaRepositories → @Import(JpaRepositoriesRegistrar) registers repository BeanDefinitions. RepositoryFactorySupport creates JdkDynamicAopProxy implementing interface. Query lookup: SimpleJpaQuery for @Query JPQL, NativeJpaQuery for native=true. @Modifying queries routed to EntityManager.createQuery().executeUpdate() — not SELECT. Transaction: @Transactional on calling service — modifying query without TX throws InvalidDataAccessApiUsageException.',
    when:
      '@EnableJpaRepositories: multi-EMF apps, library modules, non-Boot. @Query: joins, projections, pagination with count query. @Modifying: bulk status updates, soft-delete flags — not single entity save().',
    flow: `Repository query execution:
1. @EnableJpaRepositories scans PaymentRepository interface
2. JpaRepositoryFactory creates proxy bean
3. Service calls findRecentByStatus(OPEN, since)
4. QueryExecutorMethodInterceptor resolves @Query JPQL
5. EntityManager creates TypedQuery → SQL via Hibernate
6. Results mapped to Payment entities

@Modifying path:
1. @Transactional service calls updateStatus
2. @Modifying @Query → executeUpdate()
3. clearAutomatically evicts persistence context
4. Return int = rows affected`,
    lifecycle:
      'Repository proxy singleton. EntityManager per @Transactional boundary (thread-bound in JPA). @Modifying clears persistence context to avoid stale entities.',
    proxy:
      'Spring Data repository = JDK dynamic proxy (QueryExecutorMethodInterceptor). Not CGLIB on domain entities. Lazy loading requires open persistence context or fetch join in @Query.',
    runtime:
      'nativeQuery=true uses database SQL dialect. @Param names bind parameters. Pageable appends limit/offset. jakarta.persistence throughout Boot 3.',
    failure:
      'Calling @Modifying without @Transactional. SELECT @Query with @Modifying — wrong. N+1 on lazy associations returned to controller. Native query column mismatch mapping exception.',
    debug:
      'spring.jpa.show-sql=true. logging.level.org.springframework.data.jpa=DEBUG. Explain analyze slow @Query in DB. Verify @EnableJpaRepositories scanned package.',
    production:
      '@Transactional on service not repository (team convention). Index columns in @Query WHERE. Avoid long JPQL — consider Specifications or custom impl. @Modifying batch jobs with chunk TX.',
    mistakes: [
      '@Modifying query without @Transactional',
      'Forgetting clearAutomatically after bulk update then stale findById',
      'Derived query method name too long instead of @Query',
      'nativeQuery returning entities without proper SqlResultSetMapping',
    ],
    traps: [
      'Interview: @EnableJpaRepositories → JpaRepositoriesRegistrar → JDK proxy',
      '@Modifying requires @Transactional and is not for SELECT',
      'Boot auto-config enables repositories — explicit @EnableJpaRepositories for custom EMF ref',
      'clearAutomatically after bulk update prevents stale cache',
    ],
    answer15s:
      '@EnableJpaRepositories scans JPA repository interfaces; @Query defines JPQL/native SQL; @Modifying marks update/delete queries needing @Transactional.',
    answer60s:
      '@EnableJpaRepositories registers Spring Data JPA factory and repository proxies. @Query on interface methods with @Param binding. @Modifying for executeUpdate with clearAutomatically. Call modifying queries within @Transactional service methods.',
    answer3m:
      'Registrar and factory beans. JPQL vs native. Pagination, projections. @Modifying semantics and persistence context clearing. Multi-EMF entityManagerFactoryRef. Boot auto-config vs explicit enable. N+1 and fetch joins. Pitfalls: no TX on modifying, lazy load outside TX. jakarta.persistence Boot 3.',
    memory: '@ENABLE_JPA_REPOS + @QUERY; @MODIFYING = bulk DML + @Transactional.',
    tables: [
      {
        headers: ['Annotation', 'Purpose', 'Critical rule'],
        rows: [
          ['@EnableJpaRepositories', 'Scan repo interfaces', 'entityManagerFactoryRef for multi-EMF'],
          ['@Query', 'JPQL/native SELECT', '@Param binding'],
          ['@Modifying', 'UPDATE/DELETE/INSERT', '@Transactional required'],
        ],
      },
    ],
  },
  {
    id: 'enable-jpa-auditing',
    annotation: '@EnableJpaAuditing',
    family: 'gaps-data-sec-act',
    what:
      '@Target(TYPE) on @Configuration enables JPA auditing — populates @CreatedDate, @LastModifiedDate, @CreatedBy, @LastModifiedBy on @Entity fields via AuditingEntityListener. Requires auditorAwareRef bean implementing AuditorAware<T> supplying current user id. Boot: @EnableJpaAuditing on config or spring.data.jpa.repositories.auditing.enabled. Works with @MappedSuperclass audit fields base class.',
    why:
      'Automatic createdAt/updatedAt/createdBy tracking without manual setter calls in every service method. Compliance and debugging — who changed record when.',
    example: `@Configuration
@EnableJpaAuditing(auditorAwareRef = "springSecurityAuditorAware")
public class AuditConfig {}

@Component
public class SpringSecurityAuditorAware implements AuditorAware<String> {
  @Override
  public Optional<String> getCurrentAuditor() {
    return Optional.ofNullable(SecurityContextHolder.getContext())
        .map(SecurityContext::getAuthentication)
        .filter(Authentication::isAuthenticated)
        .map(Authentication::getName);
  }
}

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditableEntity {
  @CreatedDate private Instant createdAt;
  @LastModifiedDate private Instant updatedAt;
  @CreatedBy private String createdBy;
  @LastModifiedBy private String modifiedBy;
}`,
    processor:
      '@EnableJpaRepositories may co-exist; @EnableJpaAuditing imports JpaAuditingRegistrar registering AuditingBeanDefinitionPostProcessor and AuditingEntityListener. IsNewAwareAuditingHandler / AuditingHandler applies field values on persist and update events. AuditorAware.getCurrentAuditor() invoked on each auditing event.',
    when:
      'All entities needing audit columns. Pair with Spring Security for user identity. System jobs without security context — AuditorAware returns Optional.empty() or "system".',
    flow: `1. entityManager.persist(new Payment())
2. Pre-persist callback via AuditingEntityListener
3. AuditingHandler reads @CreatedDate @CreatedBy metadata
4. AuditorAware.getCurrentAuditor() → "user@acme.com"
5. Sets createdAt=now, createdBy=user
6. On update: @LastModifiedDate @LastModifiedBy updated`,
    lifecycle:
      'Auditing applied at JPA lifecycle callbacks — persist and merge. Dates typically Instant or LocalDateTime with DateTimeProvider bean optional.',
    proxy:
      'Entity not proxied for auditing — direct field mutation on entity instance by listener.',
    runtime:
      'AuditorAware must be thread-bound to request — SecurityContextHolder in web apps. @Async without context propagation — auditor empty.',
    failure:
      'Forgot @EntityListeners(AuditingEntityListener.class) on entity. auditorAwareRef bean name typo — fields null. @CreatedDate null — auditing not enabled or wrong type without converter.',
    debug:
      'Log AuditorAware return value. Verify @EnableJpaAuditing imported. Inspect entity after save in test with @DataJpaTest + @Import(AuditConfig).',
    production:
      'UTC Instant for timestamps. Immutable createdBy; mutable lastModifiedBy. Document system actor for batch jobs. Index createdAt for queries.',
    mistakes: [
      'Missing AuditingEntityListener on @Entity',
      'No AuditorAware bean when using @CreatedBy',
      'Expecting audit fields updated on native SQL bypassing JPA',
      'Local server time zone inconsistency — use Instant UTC',
    ],
    traps: [
      'Interview: @EnableJpaAuditing + AuditingEntityListener + AuditorAware',
      'Boot may auto-enable with single AuditorAware bean',
      '@CreatedDate not set on merge of detached entity without proper context',
      'Native @Modifying update does not trigger @LastModifiedDate',
    ],
    answer15s:
      '@EnableJpaAuditing auto-fills @CreatedDate/@LastModifiedBy via AuditingEntityListener and AuditorAware bean.',
    answer60s:
      '@EnableJpaAuditing registers auditing infrastructure. Entities use @EntityListeners(AuditingEntityListener.class) and audit annotations. AuditorAware supplies current user from SecurityContext. Applied on JPA persist/update.',
    answer3m:
      'Registrar beans. MappedSuperclass pattern. Security integration. DateTimeProvider for testable clocks. vs manual service setters. Pitfalls: missing listener, async context, native SQL bypass. Boot 3 jakarta.persistence. @DataJpaTest enable auditing with @Import.',
    memory: '@ENABLE_JPA_AUDITING = AuditorAware + Created/LastModified fields.',
  },
  {
    id: 'retryable-topic-dlt',
    annotation: '@RetryableTopic · @DltHandler',
    family: 'gaps-data-sec-act',
    what:
      '@RetryableTopic (spring-kafka) on @KafkaListener method configures non-blocking retry topic topology — failed messages forwarded to topic-retry-0, topic-retry-1 with backoff delays, then DLT (dead-letter topic). @DltHandler marks method consuming DLT messages for logging, alerting, or manual recovery. Boot 3 / spring-kafka 3.x. Not supported on batch listeners.',
    why:
      'In-thread DefaultErrorHandler retry blocks partition and risks max.poll.interval.ms violation. @RetryableTopic publishes to retry topics — consumer thread continues polling main topic. DLT handler centralizes poison message processing.',
    example: `@RetryableTopic(
    attempts = "3",
    backoff = @Backoff(delay = 30_000, multiplier = 2.0),
    dltStrategy = DltStrategy.FAIL_ON_ERROR,
    topicSuffixingStrategy = TopicSuffixingStrategy.SUFFIX_WITH_INDEX_VALUE)
@KafkaListener(topics = "payments.captured", groupId = "ledger")
public void onCaptured(PaymentCapturedEvent event) {
  ledgerService.record(event); // may throw → retry topic chain
}

@DltHandler
public void onDlt(PaymentCapturedEvent event,
    @Header(KafkaHeaders.EXCEPTION_MESSAGE) String error) {
  alertService.poisonMessage("payments.captured", event, error);
}`,
    processor:
      'RetryableTopicAnnotationProcessor (BeanFactoryPostProcessor) post-processes @RetryableTopic endpoints — registers retry topic names, DelayedDeliveryInterceptor or retry topic consumer containers per configuration. RetryTopicConfigurationBuilder creates companion listeners. @DltHandler discovered by DltHandlerMethodFactory — separate container on -dlt suffix topic.',
    when:
      'Production Kafka consumers needing delayed retry without blocking poll. Payment/settlement pipelines. Pair with idempotent consumer. Use DefaultErrorHandler + DeadLetterPublishingRecoverer when @RetryableTopic unsuitable (batch listeners).',
    flow: `Failure path:
1. onCaptured throws RuntimeException
2. RetryableTopic infrastructure catches via error handler
3. Publish original record to payments.captured-retry-0 (delay 30s)
4. Retry consumer re-invokes listener — fail again → retry-1 (60s)
5. Exhaust attempts → payments.captured-dlt
6. @DltHandler method processes poison message
7. Main topic offset committed per retry policy config`,
    lifecycle:
      'Retry topics created at startup (auto-create if broker allows). DLT consumer container runs alongside main listener.',
    proxy:
      'Listener invoked by messaging adapter — @Transactional on listener uses proxy if bean advised. Retry/DLT are separate container invocations.',
    runtime:
      'Same message key preserves partition ordering on retry topics. attempts includes DLT or not depending on dltStrategy. Headers: EXCEPTION_MESSAGE, EXCEPTION_STACKTRACE on DLT record.',
    failure:
      'Batch @KafkaListener with @RetryableTopic — unsupported. Retry topic partition count mismatch. Infinite DLT loop if @DltHandler throws. Serialization failure before listener — ErrorHandlingDeserializer needed.',
    debug:
      'logging.level.org.springframework.kafka.retrytopic=DEBUG. Monitor *-retry-* and *-dlt topic lag. Inspect DLT headers.',
    production:
      'Idempotent processing keyed by business id. Alert on DLT lag. Replay tooling with RBAC. Document retry topic naming. Same partition count as source topic.',
    mistakes: [
      '@RetryableTopic on batch listener',
      'No idempotency — retry duplicates side effects',
      '@DltHandler throws — message stuck',
      'Assuming Kafka broker provides DLT — application pattern',
    ],
    traps: [
      'Interview: @RetryableTopic = non-blocking retry topics; not in-thread sleep',
      '@DltHandler consumes -dlt suffix topic',
      'DLT is application topic — not native Kafka feature',
      'Batch listeners use DEH + DeadLetterPublishingRecoverer instead',
    ],
    answer15s:
      '@RetryableTopic routes failed records to delayed retry topics then DLT; @DltHandler processes dead-letter topic messages.',
    answer60s:
      '@RetryableTopic on @KafkaListener configures retry topic suffixes and backoff without blocking poll loop. @DltHandler method handles final DLT topic. Requires idempotent consumer. Not for batch listeners.',
    answer3m:
      'RetryableTopicAnnotationProcessor topology. Backoff and attempts. DltStrategy options. Headers on DLT records. vs DefaultErrorHandler in-thread. vs manual retry topics. Production idempotency, monitoring, replay. spring-kafka 3 Boot 3. Poison pill handling.',
    memory: '@RETRYABLE_TOPIC → retry-N topics → DLT; @DLT_HANDLER = final handler.',
  },
  {
    id: 'pre-post-filter-auth-principal',
    annotation: '@PreFilter · @PostFilter · @AuthenticationPrincipal',
    family: 'gaps-data-sec-act',
    what:
      '@PreFilter: SpEL filter expression applied to collection/array/map argument BEFORE method execution — removes elements user not allowed to access. @PostFilter: filters return collection AFTER method — hides unauthorized elements from result. @AuthenticationPrincipal resolves SecurityContext Authentication.principal to method parameter (UserDetails, Jwt, custom @AuthenticationPrincipal annotation on custom user type). Requires @EnableMethodSecurity(prePostEnabled=true) Boot 3.',
    why:
      'Fine-grained authorization on domain collections — return only orders belonging to current tenant. @AuthenticationPrincipal type-safe access to logged-in user without SecurityContextHolder in every method.',
    example: `@Service
public class OrderQueryService {

  @PreFilter("filterObject.tenantId == authentication.principal.tenantId")
  public void bulkUpdate(List<Order> orders) {
    orders.forEach(this::applyUpdate); // only permitted orders remain
  }

  @PostFilter("filterObject.ownerId == authentication.name")
  public List<OrderDto> findAllForCurrentUser() {
    return orderRepository.findAll(); // post-filter removes others
  }
}

@GetMapping("/me")
public UserProfile me(@AuthenticationPrincipal Jwt jwt) {
  return profileService.fromJwt(jwt);
}

@GetMapping("/profile")
public UserProfile profile(@AuthenticationPrincipal(expression = "tenantId") String tenantId) {
  return profileService.forTenant(tenantId);
}`,
    processor:
      '@EnableMethodSecurity imports MethodSecurityConfiguration. PrePostAnnotationSecurityMetadataSource registers PreInvocationAuthorizationAdvice (@PreAuthorize, @PreFilter) and PostInvocationAuthorizationAdvice (@PostAuthorize, @PostFilter). MethodSecurityInterceptor wraps advised methods. Filter expressions use FilterInvocationSecurityMetadataSource evaluation via MethodSecurityExpressionHandler. @AuthenticationPrincipal: AuthenticationPrincipalArgumentResolver in Spring MVC; for @Service methods resolved as part of security expression context on web layer — on controller, ArgumentResolver injects principal directly.',
    when:
      '@PreFilter/@PostFilter when URL-level security insufficient for row-level collection filtering. @AuthenticationPrincipal on controllers for OAuth2 JWT claims. Prefer @PreAuthorize for boolean access; filters for collection trimming.',
    flow: `@PostFilter return path:
1. Controller calls orderQueryService.findAllForCurrentUser()
2. MethodSecurityInterceptor authorizes invocation
3. Target returns List<OrderDto> (all rows from repo)
4. Post-filter SpEL removes DTOs failing filterObject.ownerId == authentication.name
5. Filtered list returned to caller

@AuthenticationPrincipal on controller:
1. SecurityFilterChain established Authentication (Jwt)
2. DispatcherServlet invokes me(Jwt jwt)
3. AuthenticationPrincipalArgumentResolver extracts principal cast to Jwt`,
    lifecycle:
      'Security metadata evaluated per method invocation. @PostFilter mutates return collection in-place copy semantics — returns new filtered collection.',
    proxy:
      'Method security requires Spring proxy on @Service — self-invocation skips @PreFilter. JDK proxy if interface, else CGLIB.',
    runtime:
      'filterObject variable in SpEL refers to each collection element. authentication.principal in SpEL. OAuth2 Resource Server: Jwt principal type.',
    failure:
      'Forgot @EnableMethodSecurity — annotations ignored. Self-invocation bypasses filter. @PostFilter on non-collection return type — error. Null collection NPE in filter.',
    debug:
      'DEBUG org.springframework.security.access.method. Log expression evaluation. Verify @EnableMethodSecurity prePostEnabled. Test with @WithMockUser and custom principal.',
    production:
      'Do not rely solely on @PostFilter for security — also constrain DB query (defense in depth). @PreFilter prevents unauthorized bulk operations early. Audit denied filter removals.',
    mistakes: [
      'Self-invocation without proxy — filters skipped',
      '@PostFilter loading all rows then filtering — performance leak',
      'Wrong SpEL — filterObject vs returnObject confusion',
      '@AuthenticationPrincipal without authenticated request — null principal',
    ],
    traps: [
      'Interview: @PreFilter before method; @PostFilter after on collections',
      '@EnableMethodSecurity replaces deprecated @EnableGlobalMethodSecurity',
      '@AuthenticationPrincipal ArgumentResolver on MVC controllers',
      'Post-filter is not substitute for SQL WHERE tenant_id',
    ],
    answer15s:
      '@PreFilter/@PostFilter use SpEL to filter collection arguments or return values; @AuthenticationPrincipal injects the current security principal.',
    answer60s:
      '@PreFilter removes unauthorized elements from input collections before method runs. @PostFilter filters returned collections. Require @EnableMethodSecurity. @AuthenticationPrincipal on controller resolves Jwt/UserDetails from SecurityContext.',
    answer3m:
      'MethodSecurityInterceptor and expression handler. filterObject SpEL variable. Defense in depth vs repository query filtering. OAuth2 JWT @AuthenticationPrincipal. Self-invocation proxy trap. Boot 3 @EnableMethodSecurity. vs @PreAuthorize boolean. Performance of post-filter on large lists.',
    memory: '@PRE_FILTER in / @POST_FILTER out; @AUTHENTICATION_PRINCIPAL = current user.',
  },
  {
    id: 'endpoint-actuator',
    annotation: '@Endpoint · @WebEndpoint · @ReadOperation (Actuator)',
    family: 'gaps-data-sec-act',
    what:
      'Spring Boot Actuator custom endpoint annotations on @Component beans: @Endpoint(id="payments") exposes JMX and HTTP (if exposed). @WebEndpoint / @RestControllerEndpoint for HTTP-specific. Operation annotations: @ReadOperation (GET), @WriteOperation (POST), @DeleteOperation (DELETE), @Selector for path parameter. Boot 3 actuator on separate management port optional. Security: only expose needed endpoints in prod.',
    why:
      'Operational hooks beyond built-in /health, /metrics — custom admin tasks (clear cache, replay queue depth, feature flag snapshot) with actuator security model and discovery.',
    example: `@Component
@Endpoint(id = "paymentcache")
public class PaymentCacheEndpoint {

  private final PaymentCache cache;

  @ReadOperation
  public Map<String, Object> stats() {
    return Map.of("hits", cache.hitCount(), "size", cache.size());
  }

  @WriteOperation
  public void clear() {
    cache.clearAll();
  }
}

// HTTP: GET /actuator/paymentcache  POST /actuator/paymentcache (if exposed)
// management.endpoints.web.exposure.include=paymentcache,health`,
    processor:
      'EndpointDiscoverer scans @Endpoint beans at startup. WebEndpointDiscoverer maps to WebOperation for HTTP via EndpointMediaTypes. ActuatorHttpSecurity restricts access — role ACTUATOR or authenticated admin. InvocableHandlerMethod invokes @ReadOperation methods. @EndpointExtension allows extending existing endpoint.',
    when:
      'Custom ops endpoints preferring actuator infrastructure over ad-hoc admin REST controllers. Internal tooling via management port. @RestControllerEndpoint for full MVC control on separate path.',
    flow: `HTTP read operation:
1. GET /actuator/paymentcache (management.server.port if configured)
2. Spring Security actuator filter chain authenticates
3. WebMvcEndpointHandlerMapping routes to PaymentCacheEndpoint
4. @ReadOperation stats() invoked
5. Response JSON via HttpMessageConverter
6. Micrometer may also expose related metrics separately`,
    lifecycle:
      'Endpoint bean singleton. Operations invoked per HTTP/JMX request.',
    proxy:
      'Endpoint bean typically concrete @Component — no special proxy unless @Transactional on operation (unusual).',
    runtime:
      'management.endpoints.web.exposure.include whitelist. management.endpoint.paymentcache.enabled. Health groups separate from custom @Endpoint.',
    failure:
      'Endpoint not exposed — not in include list. 404 on wrong port (app vs management). Unauthorized — actuator security not configured for CI probe.',
    debug:
      'GET /actuator — lists exposed endpoints. DEBUG org.springframework.boot.actuate.endpoint. Verify management.server.port.',
    production:
      'Separate management port and network policy. Never expose destructive @WriteOperation publicly. Prefer metrics for read-only stats. Spring Boot 3 actuator path still /actuator default.',
    mistakes: [
      'Exposing all endpoints with include=* in production',
      'Destructive @WriteOperation without authentication',
      'Duplicating business REST API as actuator endpoint without security hardening',
      'Wrong id naming collision with built-in endpoint',
    ],
    traps: [
      'Interview: @Endpoint + @ReadOperation/@WriteOperation for custom actuator ops',
      'Exposure requires management.endpoints.web.exposure.include',
      '@RestControllerEndpoint vs @Endpoint HTTP exposure differences',
      'Actuator security separate from main SecurityFilterChain',
    ],
    answer15s:
      '@Endpoint defines custom Actuator operations; @ReadOperation/@WriteOperation map to HTTP/JMX with exposure controlled by management properties.',
    answer60s:
      '@Endpoint(id) on @Component registers custom actuator endpoint. @ReadOperation GET, @WriteOperation POST. Web exposure via management.endpoints.web.exposure.include. Secure management port and authentication in production.',
    answer3m:
      'Discoverer pipeline. Management port split. Security configuration ActuatorHttpSecurity. @Selector path variables. @EndpointExtension pattern. vs plain @RestController admin API. Built-in health/metrics comparison. Boot 3 changes minimal. Production exposure whitelist.',
    memory: '@ENDPOINT = custom actuator; expose + secure management port.',
  },
  {
    id: 'batch-refresh-scope',
    annotation: 'Spring Batch · Spring Cloud @RefreshScope (overview)',
    family: 'gaps-data-sec-act',
    what:
      'Spring Batch: @EnableBatchProcessing (Boot 3 modular config) enables JobRepository, JobLauncher, StepBuilder — jobs defined as @Bean Job with Step chunk/tasklet. Annotations: @StepScope for late-bound job parameters in @Bean step components. Spring Cloud @RefreshScope on @Component/@ConfigurationProperties bean creates scoped proxy — bean recreated on /actuator/refresh after Environment change without full restart.',
    why:
      'Batch: large-volume ETL, payment reconciliation files, end-of-day settlement — chunked processing with restart metadata in JobRepository. @RefreshScope: dynamic config in Cloud (Config Server) for feature flags and connection strings without redeploy — critical to understand proxy semantics with singletons.',
    example: `// Spring Batch (Boot 3)
@Configuration
@EnableBatchProcessing
public class SettlementBatchConfig {
  @Bean
  public Job settlementJob(JobRepository repo, Step settleStep) {
    return new JobBuilder("settlementJob", repo).start(settleStep).build();
  }

  @Bean
  @StepScope
  public ItemReader<PaymentRow> reader(@Value("#{jobParameters['file']}") String path) {
    return new FlatFileItemReaderBuilder<PaymentRow>().resource(new FileSystemResource(path)).build();
  }
}

// Spring Cloud @RefreshScope
@RefreshScope
@ConfigurationProperties(prefix = "payments.limits")
public class PaymentLimitsConfig {
  private BigDecimal maxAmount;
}`,
    processor:
      'Batch: BatchAutoConfiguration (when spring-batch on classpath) or @EnableBatchProcessing registers infrastructure. JobRepository stores execution context in DB. Chunk-oriented step: ItemReader → ItemProcessor → ItemWriter in transaction boundaries. @StepScope: ScopedProxyFactoryBean resolves bean per step execution with job parameters injected. @RefreshScope: RefreshScope registers bean in special scope; ContextRefresher.publish RefreshScopeRefreshedEvent destroys and recreates scoped beans; injection site must use scoped proxy or ObjectProvider — singleton holding direct reference stays stale.',
    when:
      'Batch: file imports, scheduled reconciliation, spring.batch.job.enabled=false in web apps to prevent auto-run on startup. @RefreshScope: Spring Cloud Config clients, dynamic toggles — avoid on stateful beans without understanding recreation cost.',
    flow: `Batch job run:
1. JobLauncher.run(settlementJob, jobParameters)
2. JobRepository creates JobExecution
3. Step chunk loop: read → process → write (commit interval)
4. Failure → restart from last committed chunk using execution context

@RefreshScope refresh:
1. POST /actuator/refresh (Spring Cloud)
2. ContextRefresher updates Environment PropertySources
3. RefreshScope.destroy bean instances
4. Next access to @RefreshScope bean creates new instance with new properties
5. Singleton with direct field ref to old config — STALE`,
    lifecycle:
      'Batch JobExecution persisted — restartable. @StepScope beans per step execution. @RefreshScope beans recreated on each refresh event.',
    proxy:
      '@RefreshScope uses scoped proxy (TARGET_CLASS CGLIB) — injection gets proxy, target recreated on refresh. @StepScope similar scoped proxy for batch beans. Batch steps @Transactional on chunk boundary.',
    runtime:
      'Boot 3 Batch: spring-batch-core without legacy @EnableBatchProcessing required in some setups — check BatchAutoConfiguration. Cloud: spring-cloud-context on classpath for RefreshScope.',
    failure:
      'Batch job runs on web app startup unintentionally. @RefreshScope singleton stale reference — config not updating. Chunk skip policy swallows errors silently. JobRepository wrong DataSource.',
    debug:
      'Batch: logging.level.org.springframework.batch=DEBUG. Query BATCH_JOB_EXECUTION tables. Refresh: log RefreshScopeRefreshedEvent; verify proxy injection.',
    production:
      'Batch: separate worker service, partition remote steps for scale. idempotent writers. @RefreshScope: inject scoped proxy only; never cache config bean in singleton field. Prefer Kubernetes ConfigMap reload with rollout for critical config.',
    mistakes: [
      'Singleton @Autowired @RefreshScope bean into field — stale after refresh',
      'Running batch jobs in request-thread web app',
      'Missing @StepScope for jobParameters injection',
      'Expecting @RefreshScope without Spring Cloud Context',
    ],
    traps: [
      'Interview: @RefreshScope = scoped proxy + recreate on /actuator/refresh',
      '@StepScope for job parameter injection in Batch',
      'Batch chunk commit interval vs skip limit',
      'Singleton holding direct @RefreshScope ref — classic Cloud bug',
    ],
    answer15s:
      'Spring Batch uses @EnableBatchProcessing and @StepScope for chunked jobs; @RefreshScope recreates Cloud config beans on refresh behind a scoped proxy.',
    answer60s:
      'Batch: Job/Step @Beans, JobRepository persistence, @StepScope for jobParameters. @RefreshScope on @ConfigurationProperties recreates bean on ContextRefresher refresh — must inject proxy not direct ref from singleton.',
    answer3m:
      'Batch architecture: reader/processor/writer, restart, partitioning. Boot 3 batch auto-config. @StepScope scoped proxy. RefreshScope lifecycle and stale singleton antipattern. vs full pod restart. Production worker separation. Cloud Config integration. Pitfalls: auto job launch, stale config refs.',
    memory: 'BATCH = Job/Step + @StepScope; @REFRESH_SCOPE = proxy + recreate on refresh.',
    tables: [
      {
        headers: ['Feature', 'Key annotation', 'Trap'],
        rows: [
          ['Spring Batch', '@EnableBatchProcessing, @StepScope', 'Job runs on startup if enabled'],
          ['Chunk step', 'ItemReader/Writer @Beans', 'Restart from last commit'],
          ['@RefreshScope', 'Cloud dynamic config', 'Singleton direct ref stale'],
          ['Refresh trigger', 'POST /actuator/refresh', 'Requires spring-cloud-context'],
        ],
      },
    ],
  },
];
