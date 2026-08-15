import type {AnnotationCard} from './types';

export const KAFKA_DATA_SEC: AnnotationCard[] = [
  {
    id: 'enable-kafka',
    annotation: '@EnableKafka',
    family: 'kafka-data-sec',
    what:
      '@Target(TYPE) on @Configuration enables Kafka annotation-driven listener infrastructure. Registers KafkaListenerAnnotationBeanPostProcessor (KLABPP), @KafkaBootstrapConfiguration, KafkaListenerEndpointRegistry, and default ConcurrentKafkaListenerContainerFactory when spring-kafka on classpath. Boot auto-configures ConsumerFactory/ProducerFactory from spring.kafka.* properties.',
    why:
      'Without @EnableKafka, @KafkaListener methods are not registered — no consumer containers start. Activates endpoint discovery, container lifecycle, and @SendTo reply wiring.',
    example: `@SpringBootApplication
@EnableKafka
public class PaymentEventsApplication {}

@Configuration
@EnableKafka
public class KafkaConsumerConfig {
  @Bean
  public ConcurrentKafkaListenerContainerFactory<String, PaymentEvent> kafkaListenerContainerFactory(
      ConsumerFactory<String, PaymentEvent> consumerFactory) {
    ConcurrentKafkaListenerContainerFactory<String, PaymentEvent> factory =
        new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(consumerFactory);
    factory.setConcurrency(3);
    factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);
    return factory;
  }
}`,
    processor:
      '@EnableKafka imports KafkaListenerConfigurationSelector → KafkaBootstrapConfiguration + KafkaListenerAnnotationBeanPostProcessor. KLABPP BeanPostProcessor implements BeanFactoryAware: after bean init, scans @KafkaListener/@KafkaHandler, registers KafkaListenerEndpoint with KafkaListenerEndpointRegistry. Registry starts MessageListenerContainer on ApplicationStartedEvent / ContextRefreshedEvent.',
    when:
      'Any @KafkaListener usage. Boot apps often rely on @SpringBootApplication + spring-kafka auto-config which includes @EnableKafka via KafkaAnnotationDrivenConfiguration. Explicit @EnableKafka on custom @Configuration for advanced factory beans.',
    flow: `1. @EnableKafka → KafkaListenerAnnotationBeanPostProcessor bean registered
2. Each @Service bean post-processed — reflect @KafkaListener methods
3. Build MethodKafkaListenerEndpoint (topic, groupId, concurrency)
4. KafkaListenerEndpointRegistry.registerListenerContainer
5. ApplicationStarted → container.start() → consumer.subscribe()
6. poll loop in listener thread pool`,
    lifecycle:
      'Containers run for application lifetime until context shutdown. graceful shutdown: stop containers, commit offsets, leave group.',
    proxy:
      '@KafkaListener method invoked by messaging infrastructure on listener thread — not through caller proxy. @Transactional on listener works via transactional proxy if bean advised.',
    runtime:
      'Consumer group rebalances on scale out. Concurrency creates multiple KafkaMessageListenerContainer instances sharing group. Error handlers: DefaultErrorHandler, SeekToCurrentErrorHandler, DLQ via DeadLetterPublishingRecoverer.',
    failure:
      'Listeners not starting — missing @EnableKafka, wrong package scan. Serialization mismatch — JsonDeserializer trust packages. Container start exception — broker unreachable.',
    debug:
      'logging.level.org.springframework.kafka=DEBUG. logging.level.org.apache.kafka.clients.consumer=INFO. Actuator /kafka endpoints if enabled. Listener container id in logs.',
    production:
      'Explicit containerFactory for ack mode and error handler. Idempotent listeners. Manual ack after successful processing. Monitor consumer lag. SASL/SSL via spring.kafka.properties.',
    mistakes: [
      'Missing @EnableKafka in non-Boot plain Spring context',
      'Wrong ConsumerFactory generic types vs @KafkaListener',
      'Auto-commit with processing failure — message loss',
      'Concurrency higher than partitions — idle threads',
    ],
    traps: [
      'Interview: @EnableKafka registers KLABPP + endpoint registry',
      'Boot auto-config may already enable — explicit for custom factories',
      'Container start is async after context refresh',
      'groupId default = spring.application.name',
    ],
    answer15s:
      '@EnableKafka registers KafkaListenerAnnotationBeanPostProcessor and KafkaListenerEndpointRegistry to discover @KafkaListener and start consumer containers.',
    answer60s:
      '@EnableKafka imports Kafka listener infrastructure. KLABPP scans beans for @KafkaListener, registers endpoints with registry, containers start on application startup. Configure ConcurrentKafkaListenerContainerFactory for concurrency, ack mode, error handlers. Boot spring.kafka.* configures brokers and serde.',
    answer3m:
      'Selector imports KafkaBootstrapConfiguration. KLABPP postProcessAfterInitialization builds MethodKafkaListenerEndpoint per method. Registry manages lifecycle start/stop/pause. Factory bean customizes poll timeout, ack, batch vs record. Boot auto-configuration overlap. Production: idempotency, DLQ, manual ack, lag alerts. vs @JmsListener same pattern different transport.',
    memory: 'ENABLE_KAFKA → KLABPP → registry → container.start → poll.',
  },
  {
    id: 'kafka-listener',
    annotation: '@KafkaListener',
    family: 'kafka-data-sec',
    what:
      '@Target(METHOD|TYPE) marks method as Kafka message consumer. Attributes: topics/topicPattern, groupId, containerFactory, concurrency, id, clientIdPrefix, properties, batch (consume List<ConsumerRecord>). Method params: payload, @Header, @Payload, ConsumerRecord, Acknowledgment, Consumer. Boot 3 / spring-kafka 3.x.',
    why:
      'Declarative consumption — framework manages poll loop, deserialization, offset commit, error handling. Focus on business logic in listener method.',
    example: `@Service
public class PaymentEventConsumer {
  @KafkaListener(
      topics = "payments.captured",
      groupId = "ledger-service",
      containerFactory = "kafkaListenerContainerFactory")
  public void onCaptured(
      @Payload PaymentCapturedEvent event,
      @Header(KafkaHeaders.RECEIVED_KEY) String key,
      Acknowledgment ack) {
    ledgerService.record(event);
    ack.acknowledge(); // manual ack mode
  }

  @KafkaListener(topics = "payments.captured", groupId = "analytics")
  public void analytics(@Payload PaymentCapturedEvent event) {
    metrics.increment(event);
  }
}`,
    processor:
      'KafkaListenerAnnotationBeanPostProcessor → MethodKafkaListenerEndpoint → MessagingMessageListenerAdapter → KafkaMessageListenerContainer. Listener invoked by adapter after RecordMessagingMessageConverter extracts payload. Poll loop: KafkaConsumer.poll → invoke listener → ack/commit per AckMode.',
    when:
      'All event consumption. Separate groupId per independent consumer service. containerFactory for manual ack, batch, retry, DLQ. id for monitorable container id.',
    flow: `KafkaListenerAnnotationBeanPostProcessor → listener container → poll path:
1. KLABPP discovers @KafkaListener on onCaptured
2. Register endpoint: topic payments.captured, group ledger-service
3. KafkaListenerEndpointRegistry creates KafkaMessageListenerContainer
4. container.start() → consumer.subscribe(topics)
5. **Poll loop** (listener thread): consumer.poll(Duration)
6. Deserializer → PaymentCapturedEvent
7. MessagingMessageListenerAdapter.invokeListenerMethod
8. onCaptured(event, key, ack) executes
9. ack.acknowledge() → offset commit (MANUAL mode)
10. loop continues; rebalance on group change`,
    lifecycle:
      'One container per endpoint (× concurrency). Consumer joins group on start, leaves on stop. Partition assignment via cooperative sticky assignor (default modern).',
    proxy:
      'Adapter invokes target method on Spring bean. @Transactional listener: transaction per message if configured. Self-invocation N/A (framework calls method).',
    runtime:
      'Thread per consumer container. Long processing blocks poll — max.poll.interval.ms exceeded → rebalance. Poison pill: error handler decides retry vs DLQ.',
    failure:
      'SerializationException — bad JSON. Listener exception — error handler retry/DLQ. Rebalance storm — slow listener. Duplicate processing — at-least-once without idempotency.',
    debug:
      'Log partition, offset, key per message. DEBUG org.springframework.kafka.listener.KafkaMessageListenerContainer. Trace ack commit.',
    production:
      'Idempotent consumer (business key dedup). Manual ack after DB commit. DefaultErrorHandler + DeadLetterPublishingRecoverer. concurrency ≤ partition count. Monitor lag per group.',
    mistakes: [
      'Auto ack before DB commit — crash loses message but offset committed',
      'Same groupId for different business logic on same topic — only one gets each message per group semantics misunderstood',
      'Blocking listener exceeding max.poll.interval.ms',
      'No error handler — poison message infinite retry',
    ],
    traps: [
      'Interview: KLABPP → container → poll → adapter → @KafkaListener method',
      'Same topic different groupId = broadcast; same group = load share',
      'Acknowledgment param only with MANUAL ack mode',
      '@KafkaHandler on class-level @KafkaListener for multiple methods',
    ],
    answer15s:
      '@KafkaListener registers consumer endpoint. KLABPP creates KafkaMessageListenerContainer that polls Kafka and invokes listener method with deserialized payload.',
    answer60s:
      'KafkaListenerAnnotationBeanPostProcessor builds MethodKafkaListenerEndpoint from annotation attributes. Registry starts container: subscribe, poll loop, deserialize, invoke method. Manual ack via Acknowledgment after successful processing. groupId defines consumer group for partition assignment. Error handlers manage retries and DLQ.',
    answer3m:
      'Full path: enable → post-process bean → register endpoint → start container → poll → listener adapter → method. Parameters: @Payload, ConsumerRecord, headers, Acknowledgment. Batch @KafkaListener List<ConsumerRecord>. Transactional: kafka transaction or DB outbox preferred over naive @Transactional. Rebalance: cooperative protocol. Pitfalls: auto-commit, slow consumer, serde, idempotency. vs JMS: log-based, partition ordering per key.',
    memory: 'KAFKA_LISTENER: KLABPP → container.poll → invoke method → ack.',
    tables: [
      {
        headers: ['Step', 'Component', 'Responsibility'],
        rows: [
          ['1', 'KafkaListenerAnnotationBeanPostProcessor', 'Scan @KafkaListener, build endpoint'],
          ['2', 'KafkaListenerEndpointRegistry', 'Register & lifecycle containers'],
          ['3', 'KafkaMessageListenerContainer', 'Manage KafkaConsumer'],
          ['4', 'poll()', 'Fetch ConsumerRecords'],
          ['5', 'MessagingMessageListenerAdapter', 'Invoke @KafkaListener method'],
          ['6', 'Acknowledgment / ack mode', 'Commit offsets'],
        ],
      },
    ],
  },
  {
    id: 'spring-data-repository',
    annotation: '@Repository · Spring Data',
    family: 'kafka-data-sec',
    what:
      '@Repository (Spring stereotype) marks persistence exception translation layer — meta-@Component. Spring Data: repository interfaces extend JpaRepository/CrudRepository etc.; NO implementation class — Spring Data generates JDK dynamic proxy at runtime implementing the interface. @EnableJpaRepositories or Boot auto-config scans repository interfaces.',
    why:
      'Eliminate boilerplate DAO implementations. @Repository enables PersistenceExceptionTranslationPostProcessor → DataAccessException hierarchy. Spring Data derives queries from method names or @Query.',
    example: `public interface PaymentRepository extends JpaRepository<Payment, Long> {
  List<Payment> findByStatusAndCreatedAtAfter(PaymentStatus status, Instant after);

  @Query("select p from Payment p where p.accountId = :accountId")
  List<Payment> findForAccount(@Param("accountId") String accountId);
}

@Service
public class PaymentQueryService {
  private final PaymentRepository payments; // injected JDK proxy

  public List<Payment> recentPending() {
    return payments.findByStatusAndCreatedAtAfter(PENDING, Instant.now().minus(1, ChronoUnit.DAYS));
  }
}`,
    processor:
      'RepositoryBeanDefinitionRegistrar / JpaRepositoriesRegistrar registers FactoryBean: JpaRepositoryFactoryBean. Creates JdkDynamicProxy implementing PaymentRepository. Method call → RepositoryComposition → QueryExecutorMethodInterceptor → SimpleJpaRepository delegate or custom @Query execution. @Repository triggers PersistenceExceptionTranslationPostProcessor.',
    when:
      'Data access in Spring apps. Extend appropriate repository base (JpaRepository for JPA). Custom fragments via interface + Impl suffix pattern.',
    flow: `1. @EnableJpaRepositories scans PaymentRepository interface
2. JpaRepositoryFactoryBean registered as FactoryBean
3. Factory creates proxy implementing PaymentRepository
4. payments.findByStatus...() → proxy invoke
5. PartTreeJpaQuery parsed from method name → JPQL/SQL
6. EntityManager query execution
7. SQLException → translated to DataAccessException`,
    lifecycle:
      'Singleton proxy bean. EntityManager per transaction (@PersistenceContext).',
    proxy:
      'Spring Data repository IS a JDK dynamic proxy — every method intercepted. Not the same as @Transactional service proxy but composable when service calls repository.',
    runtime:
      'Derived query creation at startup. Lazy init first access. Custom @Modifying for updates needs @Transactional on service layer.',
    failure:
      'QueryCreationException — invalid derived method name. Non-unique result. LazyInitializationException outside TX when returning entities to web layer.',
    debug:
      'logging.level.org.springframework.data.jpa=DEBUG shows generated queries. Show SQL spring.jpa.show-sql=true dev only.',
    production:
      'Return DTOs from service layer. @Transactional readOnly=true on queries. Explicit @Query for complex SQL. Projections for read models.',
    mistakes: [
      'Confusing @Repository Spring stereotype with JPA @Entity',
      'Exposing repository directly from controller',
      'Derived query method name too long / wrong keyword',
      'Missing @Transactional on @Modifying query',
    ],
    traps: [
      'Interview: Spring Data repo = JDK proxy, no impl class',
      '@Repository is Spring — enables exception translation',
      'JpaRepository extends PagingAndSortingRepository extends CrudRepository',
      'Custom impl: PaymentRepositoryCustom + PaymentRepositoryImpl',
    ],
    answer15s:
      'Spring Data repository interfaces get JDK dynamic proxies at runtime — no manual implementation. @Repository is Spring stereotype for exception translation, not JPA.',
    answer60s:
      'JpaRepositoryFactoryBean creates proxy implementing repository interface. Method calls routed through QueryExecutorMethodInterceptor to generated or @Query queries. @Repository activates PersistenceExceptionTranslationPostProcessor. Contrast JPA @Entity/@Id which are jakarta.persistence — specification API, not Spring.',
    answer3m:
      'Registration: @EnableJpaRepositories, classpath scanning. Proxy: JdkDynamicProxy + RepositoryFactorySupport. Query types: derived, @Query JPQL/native, Specifications, projections. Transaction boundaries on service not repository (usually). Exception translation SQLException → DataAccessException. vs JDBC Template manual. Pitfalls: N+1, lazy load in controller, derived query perf.',
    memory: 'SPRING_DATA_REPO = JDK proxy; @Repository = Spring exception translation.',
    tables: [
      {
        headers: ['Annotation', 'Origin', 'Purpose'],
        rows: [
          ['@Repository', 'Spring Framework', 'Stereotype + exception translation'],
          ['JpaRepository', 'Spring Data JPA', 'CRUD + JPA extensions interface'],
          ['@Entity', 'Jakarta Persistence (JPA)', 'ORM entity mapping — NOT Spring'],
          ['@Id', 'Jakarta Persistence', 'Primary key — NOT Spring'],
        ],
      },
    ],
  },
  {
    id: 'jpa-entity',
    annotation: '@Entity · @Id (JPA — not Spring)',
    family: 'kafka-data-sec',
    what:
      'jakarta.persistence.@Entity and @Id are JPA (Jakarta Persistence) specification annotations — NOT Spring Framework. Hibernate (or EclipseLink) is the JPA provider; Spring Data JPA integrates EntityManager via LocalContainerEntityManagerFactoryBean. @Entity marks class mapped to database table; @Id marks primary key field.',
    why:
      'Interview clarity: distinguish JPA specification annotations from Spring stereotypes. Spring ORM support wraps JPA but does not define @Entity. Misattributing @Entity to Spring is a common mistake.',
    example: `@Entity
@Table(name = "payments")
public class Payment {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String accountId;

  @Enumerated(EnumType.STRING)
  private PaymentStatus status;
}

// Spring scans entities via:
// spring.jpa.packages-to-scan or @EntityScan`,
    processor:
      'JPA provider (Hibernate): MetadataSourceProcessor reads @Entity at bootstrap → SessionFactory/EntityManagerFactory metadata. Spring: LocalContainerEntityManagerFactoryBean bootstraps persistence unit. Not processed by BeanPostProcessor for annotation semantics — ORM mapping.',
    when:
      'Domain persistence with JPA. Use jakarta.persistence in Boot 3 (javax.persistence in Boot 2). Pair with Spring Data repository, not replace it.',
    flow: `1. @EntityScan or auto-config packages
2. EntityManagerFactory bootstrap scans @Entity classes
3. Hibernate builds metamodel (tables, columns, associations)
4. Spring registers EntityManagerFactory bean
5. @PersistenceContext EntityManager injected in repositories
6. Spring Data JPA uses EntityManager for queries`,
    lifecycle:
      'Entity instances: managed within persistence context (transaction). Detached after TX end. Lazy collections need open session or fetch join.',
    proxy:
      'Hibernate may lazy-proxy associations — not Spring AOP. LazyInitializationException outside session.',
    runtime:
      'DDL: spring.jpa.hibernate.ddl-auto (validate in prod). Second-level cache Hibernate optional. Not Spring @Cacheable unless service layer.',
    failure:
      'Schema validation failure. Duplicate @Id. Confusing Spring @Repository entity with JPA @Entity responsibilities.',
    debug:
      'logging.level.org.hibernate.SQL=DEBUG. Explain plan. Entity metamodel inspection.',
    production:
      'Flyway/Liquibase for schema — ddl-auto=validate. equals/hashCode on id only for entities. DTO boundary at API.',
    mistakes: [
      'Calling @Entity a Spring annotation',
      'Returning entity from REST — serialization/lazy issues',
      'Bidirectional associations without owning side discipline',
      'Using @Repository on entity class — wrong stereotype',
    ],
    traps: [
      'Interview: @Entity/@Id = JPA jakarta.persistence, provider Hibernate',
      'Spring provides EntityManagerFactory bean wiring only',
      '@EntityScan is Spring Boot — scans packages for JPA entities',
      'Contrast @Repository interface (Spring Data proxy)',
    ],
    answer15s:
      '@Entity and @Id are Jakarta Persistence (JPA) annotations, not Spring. Hibernate maps them to tables; Spring Data JPA uses EntityManager to persist entities.',
    answer60s:
      'JPA @Entity defines ORM mapping; @Id primary key. Hibernate processes at EntityManagerFactory bootstrap. Spring integrates via LocalContainerEntityManagerFactoryBean and Spring Data repositories. Do not confuse with Spring @Repository stereotype on persistence interfaces.',
    answer3m:
      'Specification vs framework: JPA API jakarta.persistence.*; Spring ORM module provides transaction integration @Transactional EntityManager. Boot: spring-boot-starter-data-jpa brings Hibernate + Spring Data. Entity lifecycle: managed/detached/removed. Spring @Transactional bounds persistence context. API layer: never expose @Entity — use DTO. Pitfalls: lazy load, N+1, confusing annotation origins in interview.',
    memory: '@ENTITY/@ID = JPA spec (jakarta.persistence); Spring wires EMF only.',
  },
  {
    id: 'repository-proxy',
    annotation: 'Spring Data repository proxy',
    family: 'kafka-data-sec',
    what:
      'Runtime mechanism: Spring Data creates JDK dynamic proxy (or class-based for some cases) implementing your repository interface. Invocations routed through RepositoryComposition, QueryExecutorMethodInterceptor, and backing SimpleJpaRepository — you never write PaymentRepositoryImpl unless custom methods.',
    why:
      'Understand interview question "how does Spring Data work without implementation?" — FactoryBean + Proxy + Method interceptors + shared implementation base.',
    example: `// You write only interface:
public interface OrderRepository extends JpaRepository<Order, UUID>, OrderRepositoryCustom {}

// Spring creates proxy bean "orderRepository" implementing both interfaces
// Custom fragment: OrderRepositoryCustom + OrderRepositoryImpl (naming convention)`,
    processor:
      'DefaultRepositoryConfiguration registers RepositoryBeanDefinition. JpaRepositoryFactory.getRepository(interface, em) → JdkDynamicAopProxy. Advisors: QueryExecutorMethodInterceptor, PersistenceExceptionTranslationAdvisor. Target: JpaRepositoryFactory.getTargetRepository → SimpleJpaRepository instance.',
    when:
      'Explaining Spring Data internals. Debugging "bean is proxy" in debugger. Custom repository fragments.',
    flow: `1. Injection point OrderRepository repo
2. Bean is JdkDynamicAopProxy
3. repo.findById(uuid) → invoke on proxy
4. QueryExecutorMethodInterceptor.invoke
5. Resolved query: findById → PartTreeJpaQuery or named query
6. Delegates to SimpleJpaRepository.findById
7. EntityManager.find(Order.class, uuid)
8. Returns Optional<Order> through proxy to caller`,
    lifecycle:
      'Proxy singleton. Underlying SimpleJpaRepository stateless w.r.t. per-call EntityManager from TransactionalEntityManagerProxy.',
    proxy:
      'Repository bean IS JDK proxy — distinct from CGLIB @Transactional service proxy. Stack: Service CGLIB proxy → calls → Repository JDK proxy → JPA.',
    runtime:
      'AopUtils.isJdkDynamicProxy(orderRepository) true. Debugger shows $Proxy123. Custom Impl bean merged into composition.',
    failure:
      'NoRepositoryBeanDefinitionException — interface not scanned. Multiple EMF — wrong @EnableJpaRepositories entityManagerFactoryRef.',
    debug:
      'Breakpoint in QueryExecutorMethodInterceptor. List repository beans in context.',
    production:
      'Understand proxy for @Transactional boundaries — repository methods join caller transaction. Avoid custom EntityManager in Impl without clear TX.',
    mistakes: [
      'Implementing interface manually AND Spring Data — bean conflict',
      'Wrong custom impl naming (must be InterfaceNameImpl)',
      'Expecting concrete class injection for repository',
    ],
    traps: [
      'Interview: JDK dynamic proxy + QueryExecutorMethodInterceptor',
      'SimpleJpaRepository is default target object',
      'Custom fragments merged via RepositoryComposition',
      'Not Hibernate proxy — Spring Data proxy wrapping JPA calls',
    ],
    answer15s:
      'Spring Data generates a JDK dynamic proxy implementing the repository interface. Method calls intercept to QueryExecutorMethodInterceptor then SimpleJpaRepository/EntityManager.',
    answer60s:
      'JpaRepositoryFactoryBean FactoryBean creates JDK proxy. Interceptors handle query methods, exception translation. Derived queries parsed at startup. Custom methods: interface fragment + Impl class auto-detected. Injected repository is always proxy, never your source code.',
    answer3m:
      'Factory pattern: RepositoryFactorySupport.getRepository. Advisors on proxy. Method lookup: named queries, @Query, PartTreeJpaQuery derivation, procedure @Procedure. Composition repository pattern for multiple interfaces. Transaction: EntityManager joins thread-bound transaction from @Transactional service. Contrast Hibernate Session proxy for lazy loading — different layer. Testing: @DataJpaTest slices real proxy against H2/Testcontainers.',
    memory: 'REPO_PROXY: JDK proxy → QueryExecutorMethodInterceptor → SimpleJpaRepository.',
    tables: [
      {
        headers: ['Layer', 'Proxy type', 'Purpose'],
        rows: [
          ['Spring Data repository', 'JDK dynamic', 'Query method dispatch'],
          ['@Transactional service', 'CGLIB/JDK', 'Transaction boundary'],
          ['Hibernate lazy association', 'Bytecode lazy', 'Deferred SQL load'],
        ],
      },
    ],
  },
  {
    id: 'pre-authorize',
    annotation: '@PreAuthorize · @EnableMethodSecurity',
    family: 'kafka-data-sec',
    what:
      '@PreAuthorize("hasRole(\'ADMIN\')") / @PostAuthorize / @Secured on methods — method-level authorization via Spring Security AOP. @EnableMethodSecurity (Boot 3 / SF 6) replaces deprecated @EnableGlobalMethodSecurity. prePostEnabled=true activates @PreAuthorize SpEL evaluation before method invoke.',
    why:
      'Enforce authorization beyond URL-level http.authorizeHttpRequests — fine-grained when user authenticated but role insufficient for specific service method. Defense in depth when controller and service both secured.',
    example: `@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class MethodSecurityConfig {}

@Service
public class AccountService {
  @PreAuthorize("hasRole('TELLER') and #accountId == authentication.principal.accountId or hasRole('ADMIN')")
  public Balance getBalance(String accountId) {
    return repository.findBalance(accountId);
  }

  @PreAuthorize("@authz.canRefund(authentication, #paymentId)")
  public void refund(String paymentId) {
    ...
  }
}`,
    processor:
      '@EnableMethodSecurity imports MethodSecurityConfiguration. MethodSecurityInterceptor (AOP Alliance MethodInterceptor) advised via AuthorizationManagerBeforeMethodInterceptor (SF 6) or legacy MethodSecurityMetadataSource. PreInvocationAuthorizationAdvice evaluates SpEL via MethodSecurityExpressionHandler. @authz bean — custom PermissionEvaluator pattern.',
    when:
      'Service-layer authorization when URL rules too coarse. SpEL references method args (#accountId). @PostAuthorize for return value checks (rare). Enable prePostEnabled explicitly.',
    flow: `1. Client calls accountService.getBalance("A1") on proxied bean
2. Security filter chain already authenticated JWT/session
3. MethodSecurityInterceptor.beforeInvocation
4. Evaluate hasRole('TELLER') and #accountId == principal.accountId
5. Granted → proceed to getBalance
6. Denied → AccessDeniedException → @ControllerAdvice 403
7. @EnableMethodSecurity registers advisor on @PreAuthorize methods`,
    lifecycle:
      'Authorization check per method invocation. SecurityContextHolder ThreadLocal holds Authentication on request thread — not on @Async without propagation.',
    proxy:
      'Method security requires Spring AOP proxy on secured bean — self-invocation bypasses @PreAuthorize (same as @Transactional). Must call through injected AccountService.',
    runtime:
      'SpEL: hasRole, hasAuthority, authentication.principal, custom @bean methods. Reactive: @EnableReactiveMethodSecurity for WebFlux.',
    failure:
      'AccessDeniedException — role/SpEL false. Security annotations ignored — missing @EnableMethodSecurity or self-invocation. Permissive default if method not secured.',
    debug:
      'TRACE org.springframework.security.access.method. Log Authentication authorities. Test with @WithMockUser.',
    production:
      'Centralize complex SpEL in @Component authz bean. Secure service layer not only controllers. Audit denied access. Do not rely solely on URL security for microservices internal calls.',
    mistakes: [
      'this.securedMethod() self-invocation — no check',
      '@EnableMethodSecurity missing',
      'SpEL typo — silent deny or parse error at startup',
      'Securing only controller — internal call bypass',
    ],
    traps: [
      'Interview: @EnableMethodSecurity + MethodSecurityInterceptor AOP',
      'Self-invocation bypasses @PreAuthorize',
      'hasRole adds ROLE_ prefix automatically',
      'SF 6 AuthorizationManager vs legacy AccessDecisionManager',
    ],
    answer15s:
      '@PreAuthorize checks SpEL before method execution. @EnableMethodSecurity activates method security AOP. Self-invocation bypasses checks — call through injected proxy.',
    answer60s:
      '@EnableMethodSecurity(prePostEnabled=true) registers advisors evaluating @PreAuthorize SpEL against SecurityContext Authentication. MethodSecurityInterceptor blocks unauthorized calls with AccessDeniedException. Custom beans in SpEL for complex rules. Requires proxied bean — internal this calls skip security.',
    answer3m:
      'Configuration: @EnableMethodSecurity imports MethodSecurityConfiguration. Interceptor chain before method invocation. SpEL root: method params, authentication, return @authz delegate. @PostAuthorize after return. @Secured simpler role list without SpEL. vs URL authorizeHttpRequests — filter level vs method level. Boot 3: @EnableMethodSecurity not GlobalMethodSecurity. Testing: @WithMockUser, @WithSecurityContext. Pitfalls: async SecurityContext, self-invocation, missing ROLE_ prefix understanding.',
    memory: '@PRE_AUTHORIZE = method AOP; needs @EnableMethodSecurity; no self-invoke.',
  },
  {
    id: 'enable-web-security',
    annotation: '@EnableWebSecurity',
    family: 'kafka-data-sec',
    what:
      '@Configuration meta-annotation enabling Spring Security web support. Imports WebSecurityConfiguration, registers SecurityFilterChain bean(s), AuthenticationManager, PasswordEncoder defaults. Boot 3: prefer @Bean SecurityFilterChain over extending WebSecurityConfigurerAdapter (removed). @EnableMethodSecurity often paired for @PreAuthorize.',
    why:
      'Activate servlet security filter chain — authentication (JWT, form, OAuth2 login) and authorization (authorizeHttpRequests). Without it, Boot auto-config still secures if spring-security on classpath — custom @EnableWebSecurity replaces defaults.',
    example: `@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

  @Bean
  public SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
    return http
        .securityMatcher("/api/**")
        .csrf(csrf -> csrf.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/public/**").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated())
        .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
        .build();
  }
}`,
    processor:
      '@EnableWebSecurity imports WebSecurityConfiguration (@Import). DelegatingFilterProxy registered in servlet container filters → FilterChainProxy → SecurityFilterChain beans ordered. Filters: SecurityContextHolderFilter, LogoutFilter, UsernamePasswordAuthenticationFilter, BearerTokenAuthenticationFilter (OAuth2 resource server), AuthorizationFilter. HttpSecurity builds chain programmatically.',
    when:
      'Custom security rules. Multiple SecurityFilterChain beans with securityMatcher. Stateless JWT APIs. Form login for MVC apps.',
    flow: `HTTP request overview:
1. Servlet container → DelegatingFilterProxy (springSecurityFilterChain)
2. FilterChainProxy selects matching SecurityFilterChain by securityMatcher
3. SecurityContextHolderFilter establishes/clears context
4. Authentication filters (JWT BearerTokenAuthenticationFilter validates token)
5. SecurityContext populated with Authentication
6. AuthorizationFilter: authorizeHttpRequests rules
7. If permitted → DispatcherServlet → @Controller
8. Optional @PreAuthorize on service layer second check
9. AccessDeniedException → 403`,
    lifecycle:
      'SecurityContextHolder ThreadLocal per request thread cleared in finally block. Stateless: no server session.',
    proxy:
      'Security filters run before any Spring MVC controller proxy. Method security is separate AOP layer on beans.',
    runtime:
      'Boot 3 jakarta.servlet. OAuth2 Resource Server JWT jwk-set-uri. CORS configured in SecurityFilterChain or WebMvcConfigurer.',
    failure:
      '403 on permitAll path — matcher order wrong. 401 missing/invalid JWT. CSRF blocking state-changing browser requests. Circular dependency security beans.',
    debug:
      'logging.level.org.springframework.security=DEBUG shows filter chain and decision. securityMatcher path matching.',
    production:
      'Least privilege authorizeHttpRequests. Separate chains for actuator vs api. Method security for fine grain. CSRF disabled only for stateless APIs. Rotate keys.',
    mistakes: [
      'anyRequest().authenticated() before permitAll matchers — wrong order',
      'Disabling security entirely in prod profile typo',
      'Only URL security — missing @PreAuthorize on sensitive service methods',
      'Storing JWT in localStorage XSS risk — document tradeoffs',
    ],
    traps: [
      'Interview: FilterChainProxy before DispatcherServlet',
      'WebSecurityConfigurerAdapter removed Boot 3 — SecurityFilterChain @Bean',
      '@EnableWebSecurity + @Bean SecurityFilterChain',
      'authorizeHttpRequests replaces antMatchers',
    ],
    answer15s:
      '@EnableWebSecurity activates Spring Security filter chain via FilterChainProxy before DispatcherServlet. Configure SecurityFilterChain @Bean with authorizeHttpRequests and authentication mechanisms.',
    answer60s:
      '@EnableWebSecurity imports WebSecurityConfiguration. SecurityFilterChain bean defines matchers, auth rules, JWT/form login, CSRF. Request passes authentication filters then AuthorizationFilter. Pair @EnableMethodSecurity for @PreAuthorize on services. Boot 3 component-based config, no WebSecurityConfigurerAdapter.',
    answer3m:
      'Filter order: SecurityContextHolder → authentication → authorization → servlet. Multiple chains with @Order and securityMatcher. OAuth2 resource server JWT flow: BearerTokenAuthenticationFilter → JwtAuthenticationProvider. vs method security layers. CORS/CSRF policy per API type. Actuator lockdown separate chain. Debug 401 vs 403. Production: defense in depth URL + method security, stateless sessions, principle of least privilege.',
    memory: '@ENABLE_WEB_SECURITY → FilterChainProxy → authN → authZ → MVC.',
    tables: [
      {
        headers: ['Layer', 'Mechanism', 'Config'],
        rows: [
          ['URL / HTTP', 'SecurityFilterChain', '@EnableWebSecurity + HttpSecurity'],
          ['Method', 'MethodSecurityInterceptor', '@EnableMethodSecurity + @PreAuthorize'],
          ['Data', 'Row-level', 'SpEL + custom PermissionEvaluator'],
        ],
      },
    ],
  },
];
