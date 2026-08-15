import type {AnnotationCard} from './types';

export const AOP_TX: AnnotationCard[] = [
  {
    id: 'aspect-aop-family',
    annotation: '@Aspect / @Before / @Around / @After',
    family: 'aop-tx',
    what:
      'Spring AOP annotation model (AspectJ-style annotations, runtime weaving via proxies — not compile-time AspectJ unless @EnableAspectJAutoProxy with aspectj autoproxy + LTW). @Aspect on a @Component class declares pointcuts (@Pointcut) and advice: @Before, @After, @AfterReturning, @AfterThrowing, @Around. @Around is most powerful — controls join point proceed(). Processed by AnnotationAwareAspectJAutoProxyCreator creating JDK dynamic proxies (interface) or CGLIB subclasses (class).',
    why:
      'Cross-cutting concerns without polluting business code: logging, metrics, authorization, retry, custom transaction boundaries. @Around wraps method execution — can measure time, catch exceptions, skip proceed().',
    example: `@Aspect
@Component
@Order(1)
public class PaymentAuditAspect {

  @Pointcut("execution(* com.acme.payments.service.*.*(..))")
  void paymentServiceMethods() {}

  @Before("paymentServiceMethods()")
  void logEntry(JoinPoint jp) {
    log.info("enter {}.{}", jp.getSignature().getDeclaringTypeName(), jp.getSignature().getName());
  }

  @Around("@annotation(com.acme.audit.Audited)")
  public Object audit(ProceedingJoinPoint pjp) throws Throwable {
    long start = System.nanoTime();
    try {
      return pjp.proceed();
    } finally {
      metrics.record(pjp.getSignature().getName(), System.nanoTime() - start);
    }
  }
}`,
    processor:
      '@EnableAspectJAutoProxy (or Boot auto-config AopAutoConfiguration) registers AnnotationAwareAspectJAutoProxyCreator BeanPostProcessor. At postProcessAfterInitialization: if bean matches pointcut from any @Aspect, wrap with proxy. AspectJAnnotationAdvisor reads @Aspect bean methods, builds AspectJExpressionPointcut from strings. @Order on aspect controls advisor precedence vs @Transactional advisor.',
    when:
      'Logging, metrics, security checks, custom retry — NOT when @Transactional suffices. Prefer @ControllerAdvice for MVC exception handling over @AfterThrowing on controllers.',
    flow: `AOP proxy invocation:
Client → injected Proxy
  → ReflectiveMethodInvocation chain
  → Advisor 1 (@Around aspect) — may call proceed()
  → Advisor 2 (TransactionInterceptor)
  → Target.method()  // only if all advisors proceed

Self-invocation: this.internal() from same class → NO proxy → aspects skipped`,
    lifecycle:
      '@Aspect beans are singletons created during refresh like any @Component. Advisors attached when advised beans initialized (postProcessAfterInitialization).',
    proxy:
      'JDK proxy if bean implements interface(s) and proxyTargetClass=false. CGLIB subclass if no interface or proxyTargetClass=true (Boot default true since 2.x). Final classes/methods cannot be advised with CGLIB method interception.',
    runtime:
      'Pointcut expressions use AspectJ weaver subset — execution, within, @annotation, args, bean. compile-time weaving not default.',
    failure:
      'Pointcut matches nothing — silent no-op. Aspect not a bean — not applied. Wrong @Order — transaction commits before audit aspect expects. Performance: excessive @Around on hot path.',
    debug:
      'DEBUG org.springframework.aop — proxy creation logs. logging.level.org.springframework.aop.aspectj=TRACE for pointcut matching. spring.aop.proxy-target-class=true property.',
    production:
      'Narrow pointcuts — package scoped not bean(). @Order documented relative to @Transactional (often higher order number = lower precedence — verify Ordered semantics). Avoid @Around unless needed — prefer @Before/@AfterReturning.',
    mistakes: [
      'Self-invocation expecting aspect to run',
      '@Aspect class not @Component — not registered',
      'Pointcut too broad — advising @Repository toString',
      'Blocking @Around on reactive/WebFlux chain',
    ],
    traps: [
      'Interview: Spring AOP = proxy at runtime, not AspectJ compile weaving by default',
      '@EnableAspectJAutoProxy exposeProxy=true for AopContext.currentProxy()',
      'Only public methods advised on beans — package-private only with CGLIB and accessible',
      '@Transactional is AOP too — TransactionInterceptor advisor',
    ],
    answer15s:
      '@Aspect declares @Before/@Around advice applied via runtime JDK/CGLIB proxies by AnnotationAwareAspectJAutoProxyCreator. Self-invocation bypasses the proxy.',
    answer60s:
      'Enable with @EnableAspectJAutoProxy or Boot auto-config. @Aspect @Component beans define pointcuts and advice methods. @Around wraps ProceedingJoinPoint.proceed(). Proxies created in postProcessAfterInitialization when pointcut matches. Order via @Order on aspect. Self-invocation on this skips advice — need injected self or AopContext.currentProxy().',
    answer3m:
      'Stack: Advisor = Pointcut + Advice. TransactionInterceptor is one advisor. Multiple advisors form chain — @Order lower value higher precedence (Ordered.HIGHEST_PRECEDENCE). JDK vs CGLIB selection. Limitations: only Spring-managed bean public methods; no private/final advice on target; no advising caller. @Pointcut reuse. Contrast AspectJ LTW for private advice — rare. Production: Micrometer @Timed often replaces custom @Around. Security @PreAuthorize uses MethodSecurityInterceptor — another advisor. Boot 3: no change to model; jakarta only affects advised method signatures using servlet types.',
    memory: 'AOP = proxy + advisor chain; @Around controls proceed(); self-call skips proxy.',
  },
  {
    id: 'enable-transaction-management',
    annotation: '@EnableTransactionManagement',
    family: 'aop-tx',
    what:
      '@Import(TransactionManagementConfigurationSelector) enables declarative transaction management for @Transactional. Registers InfrastructureAdvisorAutoProxyCreator (or extends existing auto-proxy) and TransactionInterceptor advisor backed by PlatformTransactionManager bean. Mode: PROXY (default Spring AOP) or ASPECTJ (AspectJ weaving required). order attribute controls TransactionInterceptor advisor precedence.',
    why:
      'Explicit activation in plain Spring Framework apps. Boot enables automatically via TransactionAutoConfiguration when spring-jdbc or spring-orm on classpath. proxyTargetClass and order tune CGLIB vs JDK and advisor stacking with custom @Aspect.',
    example: `@Configuration
@EnableTransactionManagement(proxyTargetClass = true, order = Ordered.LOWEST_PRECEDENCE - 10)
public class TxConfig {

  @Bean
  public PlatformTransactionManager transactionManager(DataSource dataSource) {
    return new DataSourceTransactionManager(dataSource);
  }
}

// Boot 3 — usually no explicit @EnableTransactionManagement needed`,
    processor:
      'TransactionManagementConfigurationSelector imports AutoProxyRegistrar + ProxyTransactionManagementConfiguration (PROXY mode). Creates BeanFactoryTransactionAttributeSourceAdvisor pointing at TransactionInterceptor. TransactionInterceptor extends TransactionAspectSupport — invokes PlatformTransactionManager.getTransaction / commit / rollback around method. TransactionAttributeSource reads @Transactional metadata (AnnotationTransactionAttributeSource).',
    when:
      'Non-Boot Spring apps with @Transactional. Tuning advisor order when custom @Aspect must run inside or outside transaction. ASPECTJ mode only with load-time weaving setup.',
    flow: `@EnableTransactionManagement bootstrap:
1. @Import selector chooses PROXY vs ASPECTJ config
2. Register TransactionInterceptor bean + transactionAttributeSource
3. AdvisorAutoProxyCreator wraps matching beans
4. @Transactional method call → TransactionInterceptor.invoke
5. createTransactionIfNecessary → method → commitTransactionAfterReturning / completeTransactionAfterThrowing`,
    lifecycle:
      'Infrastructure registered during context refresh before business beans. TransactionInterceptor singleton; per-call TransactionStatus on thread (ThreadLocal TransactionSynchronizationManager).',
    proxy:
      'proxyTargetClass=true → CGLIB on concrete @Service classes. false → JDK proxy if service implements interface. exposeProxy=true enables AopContext.currentProxy() for self-invocation tx workaround.',
    runtime:
      'Requires PlatformTransactionManager bean — DataSourceTransactionManager, JpaTransactionManager, JtaTransactionManager. Reactive: @Transactional not for WebFlux — use transactional operator.',
    failure:
      'No PlatformTransactionManager bean — IllegalStateException at @Transactional call. ASPECTJ mode without weaving — no effect. Wrong order — custom aspect outside transaction unexpectedly.',
    debug:
      'DEBUG org.springframework.transaction — begin/commit/rollback logs. TRACE TransactionInterceptor. Verify @EnableTransactionManagement present in non-Boot app.',
    production:
      'Rely on Boot TransactionAutoConfiguration. Explicit order only when aspect ordering bugs proven. One PlatformTransactionManager primary for mixed JPA+JDBC same DataSource.',
    mistakes: [
      'Duplicate @EnableTransactionManagement in library and app',
      'Missing PlatformTransactionManager with @Transactional',
      'Expecting @EnableTransactionManagement to create DataSource — only tx infra',
      'ASPECTJ mode without AspectJ dependencies',
    ],
    traps: [
      'Boot auto-enables when jdbc on classpath — interview: still same TransactionInterceptor',
      'mode=ASPECTJ for private @Transactional — needs weaving',
      'order attribute on @EnableTransactionManagement not @Transactional',
      'Reactive stacks use different transaction API',
    ],
    answer15s:
      '@EnableTransactionManagement registers TransactionInterceptor AOP advisor for @Transactional. Boot enables it automatically via TransactionAutoConfiguration when JDBC/JPA is present.',
    answer60s:
      'Imports ProxyTransactionManagementConfiguration registering TransactionInterceptor and advisor auto-proxy. Reads @Transactional attributes via AnnotationTransactionAttributeSource. Requires PlatformTransactionManager. proxyTargetClass chooses CGLIB. Boot 3: implicit with spring-boot-starter-data-jpa/jdbc.',
    answer3m:
      'Selector PROXY vs ASPECTJ. TransactionInterceptor.invoke → TransactionAspectSupport.createTransactionIfNecessary → joinpoint.proceed → commit or rollback based on rollback rules. Integration with @EnableAspectJAutoProxy — single auto-proxy creator can advise both custom aspects and transactions. order: lower Ordered value = higher precedence advisor. Production: rarely annotate @EnableTransactionManagement in Boot apps. Multi-tx-manager: @Transactional(transactionManager="chained"). Pitfall: JpaTransactionManager vs DataSourceTransactionManager for mixed — align with EntityManager factory DataSource.',
    memory: 'ENABLE TX MGMT → TransactionInterceptor advisor + PlatformTransactionManager required.',
  },
  {
    id: 'transactional',
    annotation: '@Transactional',
    family: 'aop-tx',
    what:
      '@Target(TYPE|METHOD) declarative transaction boundaries. Attributes: propagation, isolation, timeout, readOnly, rollbackFor/noRollbackFor (Class[] — checked exceptions NOT rolled back by default), transactionManager qualifier. Spring Framework 6 / Boot 3 uses TransactionInterceptor AOP proxy on public methods of Spring beans. Metadata on class applies to all public methods unless overridden on method.',
    why:
      'Atomic business operations: transfer money, order + inventory decrement. Removes boilerplate try/commit/rollback. Integrates with JPA flush timing, JDBC Connection holder, Kafka transacted producer only when chained correctly (usually separate concern).',
    example: `@Service
public class TransferService {
  private final AccountRepository accounts;
  private final AuditLogRepository audit;

  @Transactional(rollbackFor = Exception.class, timeout = 30)
  public void transfer(UUID from, UUID to, BigDecimal amount) {
    accounts.debit(from, amount);
    accounts.credit(to, amount);
    audit.save(new TransferAudit(from, to, amount));
    // RuntimeException → rollback; checked Exception → commit unless rollbackFor
  }
}`,
    processor:
      'AnnotationTransactionAttributeSource parses @Transactional at runtime (or startup cache). TransactionInterceptor.invoke → TransactionAspectSupport: getTransactionAttribute → PlatformTransactionManager.getTransaction(definition) → target method → commitTransactionAfterReturning or completeTransactionAfterThrowing. Connection bound to thread via TransactionSynchronizationManager ResourceHolder. JpaTransactionManager flushes EntityManager on commit.',
    when:
      'Service layer transactional boundaries — not controllers (too coarse, HTTP already committed). readOnly=true for query services (Hibernate optimization, routing hint). propagation REQUIRES_NEW for audit log isolation.',
    flow: `TransactionInterceptor deep path:
┌──────────────────────────────────────────────────────────────┐
│ 1. Client calls injected TransferService proxy               │
│ 2. TransactionInterceptor.invoke(methodInvocation)         │
│ 3. resolve @Transactional → TransactionAttribute             │
│ 4. tm.getTransaction(definition with propagation/isolation)  │
│ 5. bind Connection/EntityManager to TransactionSynchronizationManager │
│ 6. methodInvocation.proceed() → actual transfer()            │
│ 7a. success + no rollback rule → commitTransactionAfterReturning │
│ 7b. RuntimeException / rollbackFor → completeTransactionAfterThrowing │
│ 8. unbind resources, fire TransactionSynchronization callbacks │
└──────────────────────────────────────────────────────────────┘`,
    lifecycle:
      'Transaction per method invocation on proxy — bound to calling thread. Nested calls use propagation rules with physical or logical transactions. TransactionSynchronization afterCommit callbacks for post-commit side effects.',
    proxy:
      'MUST call through Spring proxy — internal this.transfer() self-invocation SKIPS TransactionInterceptor. Solutions: inject self @Lazy, AopContext.currentProxy(), or split to another @Service bean. private/final methods not advised — tx silent no-op.',
    runtime:
      'Thread-bound TransactionSynchronizationManager.isActualTransactionActive(). readOnly may route to replica with AbstractRoutingDataSource. timeout enforced by underlying resource.',
    failure:
      'UnexpectedRollbackException — inner tx marked rollback-only, outer commits attempted. HeuristicCompletionException — global tx partial commit. No rollback on checked Exception default — data inconsistency. Lost connection if @Async crosses threads — tx thread-local lost.',
    debug:
      'DEBUG org.springframework.transaction.interceptor — begin/commit/rollback. logging.level.org.springframework.orm.jpa=DEBUG for flush. -Dspring.jpa.show-sql=true with tx boundaries. TransactionSynchronizationManager.isSynchronizationActive().',
    production:
      'Service-layer @Transactional only. rollbackFor=Exception.class when checked exceptions mean failure. Avoid long transactions — Kafka publish after commit via TransactionSynchronization.afterCommit. Never @Transactional on private methods expecting effect.',
    mistakes: [
      'Self-invocation — @Transactional not applied',
      'private @Transactional method — not proxied',
      'Checked exception swallowed — commits when business failed',
      '@Transactional on controller or repository only — wrong layer',
      'Long tx holding DB lock while calling external HTTP',
    ],
    traps: [
      'Default rollback: RuntimeException + Error only — NOT checked Exception',
      'final class @Service — CGLIB may fail or no subclass methods advised',
      '@Transactional on interface method — JDK proxy OK if injected as interface',
      'Kafka @Transactional producer different from DB @Transactional unless chained tx',
      '@Async + @Transactional — runs on other thread without caller tx unless REQUIRES_NEW propagation in async method',
    ],
    answer15s:
      '@Transactional wraps public Spring bean methods in TransactionInterceptor proxy. Default rolls back on RuntimeException only. Self-invocation and private methods bypass the proxy.',
    answer60s:
      'TransactionInterceptor reads propagation/isolation/rollback rules, starts PlatformTransactionManager transaction, binds JDBC/JPA resources to thread, proceeds method, commits or rolls back. Checked exceptions commit by default — use rollbackFor. Self-invocation skips proxy — inject separate bean or AopContext.currentProxy(). private/final not advised.',
    answer3m:
      'Deep: TransactionAspectSupport.handleTransactionException maps persistence exceptions to rollback. Nested: propagation REQUIRED joins existing; REQUIRES_NEW suspends outer. rollback-only flag set by inner RuntimeException prevents outer commit. readOnly: Hibernate setDefaultReadOnly, PostgreSQL default transaction read only hint. Isolation levels delegated to DB. JpaTransactionManager.doCommit flushes before commit. Kafka trap: kafka transaction != DB unless using chained transaction manager — prefer outbox or afterCommit publish. @Async: new thread — caller TransactionSynchronization not propagated; put @Transactional on async method for its own tx. Testing: @Transactional on test class rolls back after each test (@DataJpaTest slice). Production: keep txs short; outbox pattern for events; explicit rollbackFor for business checked exceptions.',
    memory: 'TRANSACTIONAL = proxy only; RuntimeException rollback; self-call = no tx.',
    tables: [
      {
        headers: ['Rule', 'Default', 'Production fix'],
        rows: [
          ['Rollback trigger', 'RuntimeException, Error', 'rollbackFor = Exception.class'],
          ['Self-invocation', 'No transaction', 'Split bean or inject self'],
          ['private method', 'Not advised', 'Move to public service method'],
          ['Checked exception', 'Commits', 'rollbackFor or rethrow as unchecked'],
          ['@Async caller tx', 'Not propagated', '@Transactional on async method'],
        ],
      },
    ],
  },
  {
    id: 'propagation-modes',
    annotation: '@Transactional propagation',
    family: 'aop-tx',
    what:
      'Propagation enum defines how @Transactional method participates in existing transaction. Seven modes: REQUIRED (default), SUPPORTS, MANDATORY, REQUIRES_NEW, NOT_SUPPORTED, NEVER, NESTED. Implemented by AbstractPlatformTransactionManager.getTransaction reading TransactionDefinition.getPropagationBehavior(). Physical transaction vs logical transaction (savepoint for NESTED).',
    why:
      'REQUIRED joins outer unit of work. REQUIRES_NEW isolates audit/failure logging when outer rolls back. NOT_SUPPORTED suspends tx for non-transactional bulk read. MANDATORY enforces caller must open tx. Interview and production bugs center on REQUIRES_NEW and nested rollback-only.',
    example: `@Service
public class OrderService {
  @Transactional
  public void placeOrder(Order o) {
    orders.save(o);
    auditService.logAttempt(o); // REQUIRES_NEW — survives if outer rolls back after
  }
}

@Service
public class AuditService {
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void logAttempt(Order o) {
    auditRepo.save(new AuditEntry(o.getId(), "ATTEMPT"));
  }
}`,
    processor:
      'AbstractPlatformTransactionManager: REQUIRED → join existing or create new. REQUIRES_NEW → suspend outer TransactionSynchronizationManager resources, open new physical tx, resume outer after. NESTED → JDBC savepoint if supported else fallback create. SUPPORTS → join if exists else non-transactional. NOT_SUPPORTED → suspend if exists. NEVER → throw IllegalTransactionStateException if tx exists. MANDATORY → throw if no tx.',
    when:
      'REQUIRED default 95% cases. REQUIRES_NEW: independent audit, idempotency record, sending failure marker. NOT_SUPPORTED: legacy API call inside service that cannot run in tx. NESTED: rare partial rollback with savepoints.',
    flow: `Propagation timeline ASCII — REQUIRED (default):
Caller                    Outer @Transactional          Inner @Transactional(REQUIRED)
  |                              |                              |
  |--- placeOrder() ----------->| begin TX #1                  |
  |                              |--- save() ----------------->| join TX #1 (same)
  |                              |<-- ok -----------------------|
  |                              | commit TX #1                 |
  |<-- done ---------------------|                              |

REQUIRES_NEW:
Caller                    Outer                        Inner(REQUIRES_NEW)
  |                              |                              |
  |--- placeOrder() ----------->| begin TX #1                  |
  |                              |--- audit() ---------------->| suspend TX #1
  |                              |                              | begin TX #2
  |                              |                              | commit TX #2
  |                              |<-- resume TX #1 -------------|
  |                              | rollback TX #1 (outer fail)  |
  |                              |   (audit TX #2 still committed)|`,
    lifecycle:
      'REQUIRES_NEW: outer suspended, not destroyed — resume after inner completes. Rollback-only flag on inner REQUIRED poisons outer commit. NESTED rollback to savepoint may allow outer commit.',
    proxy:
      'Each @Transactional boundary still requires proxy entry — inner call from same class without proxy ignores propagation attributes.',
    runtime:
      'JpaTransactionManager REQUIRES_NEW gets new EntityManager/session. Kafka consumer thread: no existing tx unless listener @Transactional.',
    failure:
      'UnexpectedRollbackException: inner REQUIRED marked rollback-only, outer commit fails. REQUIRES_NEW connection pool exhaustion — two connections per call. NEVER with existing tx — IllegalTransactionStateException.',
    debug:
      'Log propagation behavior at DEBUG transaction. Count active connections during REQUIRES_NEW. Test outer rollback inner REQUIRES_NEW survives.',
    production:
      'Document REQUIRES_NEW audit paths. Avoid deep nesting. NOT_SUPPORTED for reporting queries hitting read replica without tx snapshot needs.',
    mistakes: [
      'REQUIRES_NEW for every call — connection churn',
      'Expecting REQUIRED inner rollback to leave outer committing',
      'NEVER on method called from @Transactional service',
      'NESTED on non-savepoint DataSource',
    ],
    traps: [
      'Interview: REQUIRES_NEW suspends outer, new physical tx',
      'rollback-only on shared REQUIRED tx blocks outer commit',
      'NESTED != REQUIRES_NEW — savepoint vs new connection',
      'SUPPORTS non-tx when no outer — no EntityManager flush scope',
    ],
    answer15s:
      'REQUIRED joins or creates; REQUIRES_NEW suspends outer and opens a new transaction; default rollback applies only to RuntimeException unless rollbackFor is set.',
    answer60s:
      'Propagation controls transaction joining. REQUIRED default joins existing or starts new. REQUIRES_NEW suspends outer transaction, commits independently — audit logs survive outer rollback. NOT_SUPPORTED suspends tx for method duration. MANDATORY requires existing tx; NEVER forbids it. Self-invocation ignores propagation — needs proxy boundary.',
    answer3m:
      'Walk REQUIRES_NEW suspend/resume via TransactionSynchronizationManager. REQUIRED nested calls share single physical tx — one rollback rolls all. NESTED JDBC savepoint partial rollback. SUPPORTS read-only join optional. Kafka listener: REQUIRED joins Kafka consumer tx only if chained TM configured — usually separate DB tx in listener. @Async REQUIRES_NEW on async method creates tx on worker thread. Production patterns: REQUIRES_NEW audit; afterCommit for messaging; avoid NESTED without savepoint support. Test matrix: outer rollback + inner REQUIRES_NEW commit.',
    memory: 'PROPAGATION: REQUIRED=join; REQUIRES_NEW=suspend+new; checked rollback rules separate.',
    tables: [
      {
        headers: ['Propagation', 'Existing TX?', 'Behavior', 'Typical use'],
        rows: [
          ['REQUIRED (default)', 'Yes', 'Join existing TX', 'Normal service methods'],
          ['REQUIRED', 'No', 'Create new TX', 'Entry point'],
          ['REQUIRES_NEW', 'Yes', 'Suspend outer; new physical TX', 'Audit log, idempotency record'],
          ['REQUIRES_NEW', 'No', 'Create new TX', 'Same as REQUIRED'],
          ['NESTED', 'Yes', 'Savepoint nested TX', 'Partial rollback (JDBC)'],
          ['NESTED', 'No', 'Create new TX', 'Like REQUIRED'],
          ['SUPPORTS', 'Yes', 'Join, non-transactional if none', 'Read helpers'],
          ['SUPPORTS', 'No', 'Run non-transactional', 'Queries outside tx'],
          ['MANDATORY', 'Yes', 'Join; fail if none', 'Domain must run in tx'],
          ['MANDATORY', 'No', 'IllegalTransactionStateException', 'Enforce caller tx'],
          ['NOT_SUPPORTED', 'Yes', 'Suspend tx; run without', 'External API / bulk read'],
          ['NOT_SUPPORTED', 'No', 'Run without tx', 'Non-transactional'],
          ['NEVER', 'Yes', 'IllegalTransactionStateException', 'Forbid tx context'],
          ['NEVER', 'No', 'Run without tx', 'Explicit non-tx'],
        ],
      },
    ],
  },
  {
    id: 'transactional-kafka-async-traps',
    annotation: '@Transactional + @Async + Kafka traps',
    family: 'aop-tx',
    what:
      'Composite failure modes when mixing declarative transactions with asynchronous execution and Kafka consumers/producers. Thread-local TransactionSynchronizationManager does not propagate to @Async threads. Kafka Spring @KafkaListener is not transactional with DB unless using chainedTransactionManager (deprecated pattern) or transactional Kafka + separate coordination. afterCommit hooks required for at-least-once publish without dual-write bugs.',
    why:
      'Production incidents: "transaction rolled back but message sent", "async method sees no session", "consumer processed twice on rebalance mid-tx". Senior interview scenarios requiring outbox or inbox patterns.',
    example: `@Service
public class OrderService {
  private final KafkaTemplate<String, OrderEvent> kafka;
  private final OrderRepository orders;

  @Transactional
  public void placeOrder(Order order) {
    orders.save(order);
    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
      @Override
      public void afterCommit() {
        kafka.send("orders", order.getId().toString(), new OrderPlacedEvent(order.getId()));
      }
    });
  }
}

@Service
public class AsyncProcessor {
  @Async
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void processAsync(UUID orderId) {
    // NEW tx on async thread — NOT caller's tx
  }
}`,
    processor:
      '@Async: AsyncAnnotationBeanPostProcessor wraps bean; invocation runs on TaskExecutor thread — no inherited transaction. Kafka: KafkaMessageListenerContainer invokes listener; @Transactional on listener starts DB tx per message if PlatformTransactionManager present — independent from Kafka offset commit (auto-commit or MANUAL ack after method). kafka-transactional-id producer coordinates with consume-transform-produce exactly-once only within Kafka, not cross-DB.',
    when:
      'Any event publish after DB write. Async post-processing needing own tx. Kafka consumer updating DB — idempotent consumer + manual ack after tx commit.',
    flow: `Dual-write trap timeline:
WRONG — kafka.send inside @Transactional before commit:
  begin TX → save order → kafka.send (visible!) → rollback TX
  → consumers saw event for non-existent order

RIGHT — afterCommit:
  begin TX → save order → register afterCommit → commit TX → send event

@Async trap:
  Main thread TX active → @Async method starts → NO tx on async thread
  unless @Transactional(REQUIRES_NEW) on async method`,
    lifecycle:
      'TransactionSynchronization afterCommit runs after successful commit on calling thread. @Async method lifecycle independent. Kafka consumer tx should be shorter than max.poll.interval.',
    proxy:
      '@Async and @Transactional both need proxy — order: typically async outer wraps transactional inner when called from client; calling async from within @Transactional method starts async without caller tx.',
    runtime:
      'ChainedTransactionManager (legacy) coordinated Kafka + DB — fragile, removed guidance. Prefer transactional outbox table in same DB tx, Debezium/poller publishes.',
    failure:
      'Message published, DB rolled back. Stale EntityManager in @Async thread. Kafka rebalance during long @Transactional listener — duplicate processing. Read-your-writes failure publishing before commit.',
    debug:
      'Log thread name in tx methods — async pool thread lacks synchronization. Consumer lag + DB lock wait correlation. Verify ack mode RECORD vs BATCH.',
    production:
      'Outbox pattern for Kafka + DB. Idempotent consumers (unique key). @Transactional listener with short tx; ack after success. @Async with own REQUIRES_NEW tx. Never kafka.send before commit.',
    mistakes: [
      'kafka.send inside @Transactional before commit',
      'Assuming @Async inherits caller transaction',
      'Long @Transactional @KafkaListener processing',
      'Using @Transactional on producer only expecting consumer atomicity with DB',
    ],
    traps: [
      'Interview: thread-local tx + @Async = broken inheritance',
      'Kafka EOS != DB transaction',
      'afterCommit vs @TransactionalEventListener(phase = AFTER_COMMIT)',
      'Self-invocation + async + tx triple trap',
    ],
    answer15s:
      'Do not kafka.send inside a transaction before commit — use afterCommit or outbox. @Async runs on another thread without the caller transaction; add @Transactional(REQUIRES_NEW) on the async method if needed.',
    answer60s:
      'Transactions are thread-local. @Async breaks transaction propagation unless the async method declares its own @Transactional. Kafka producer send inside an open DB transaction can publish before rollback — use TransactionSynchronization.afterCommit or outbox. Kafka listener @Transactional manages DB only; offset commit is separate unless using specialized chaining.',
    answer3m:
      'Patterns: (1) Outbox table + same @Transactional save + relay; (2) afterCommit / @TransactionalEventListener AFTER_COMMIT for fire-and-forget; (3) Idempotent consumer with business key dedup; (4) REQUIRES_NEW on @Async worker tx. Kafka traps: max.poll.interval exceeded by long tx; rebalance duplicate; transactional.id producer not covering DB. ChainedTransactionManager historical — avoid. Testing: assert no message on rollback integration test with EmbeddedKafka + @Transactional test rollback. Reactive: use transactionalOperator not @Transactional.',
    memory: 'TX+KAFKA: afterCommit or outbox; @Async = new thread, new tx.',
  },
];
