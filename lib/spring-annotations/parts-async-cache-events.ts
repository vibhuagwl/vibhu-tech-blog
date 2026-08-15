import type {AnnotationCard} from './types';

export const ASYNC_CACHE: AnnotationCard[] = [
  {
    id: 'enable-async',
    annotation: '@EnableAsync',
    family: 'async-cache-events',
    what:
      '@Target(TYPE) on @Configuration or @SpringBootApplication activates Spring\'s asynchronous method execution infrastructure. Registers AsyncAnnotationBeanPostProcessor (ABPP) and default TaskExecutor unless overridden. Boot 3 auto-configures SimpleAsyncTaskExecutor or thread-pool TaskExecutor when spring.task.execution.* is set.',
    why:
      'Without @EnableAsync, @Async on methods is ignored — calls run synchronously on the caller thread. Enables non-blocking offload of I/O, notifications, and long work without blocking HTTP or Kafka listener threads.',
    example: `@SpringBootApplication
@EnableAsync
public class PaymentApplication {}

@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {
  @Override
  public Executor getAsyncExecutor() {
    ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
    ex.setCorePoolSize(8);
    ex.setMaxPoolSize(32);
    ex.setQueueCapacity(500);
    ex.setThreadNamePrefix("async-pay-");
    ex.initialize();
    return ex;
  }
}`,
    processor:
      'AsyncConfigurationSelector (ImportSelector) imports AsyncConfigurationRegistrar → registers AsyncAnnotationBeanPostProcessor. ABPP implements BeanPostProcessor: postProcessAfterInitialization wraps beans with @Async methods in AsyncAnnotationAdvisor (extends AbstractPointcutAdvisor). Pointcut matches @Async on public methods. Interceptor: AnnotationAsyncExecutionInterceptor → AsyncExecutionAspectSupport.doSubmit → TaskExecutor.execute(Runnable).',
    when:
      'Any @Async usage. Always pair with explicit Executor bean for production (pool sizing, rejection policy, MDC propagation). Use AsyncConfigurer for global exception handler and executor.',
    flow: `1. @EnableAsync → AsyncAnnotationBeanPostProcessor registered
2. Bean initialization completes → ABPP.postProcessAfterInitialization
3. If bean has @Async methods → wrap with AsyncAnnotationAdvisor proxy (JDK or CGLIB)
4. Client calls proxied asyncMethod() → interceptor submits Callable/Runnable to TaskExecutor
5. Caller receives Future/CompletableFuture/void immediately (fire-and-forget)
6. Worker thread runs actual method body`,
    lifecycle:
      'ABPP registered at context refresh. Proxies created once per bean at init. TaskExecutor threads live for application lifetime. @PreDestroy on custom executors should shutdown pool gracefully.',
    proxy:
      '@EnableAsync causes @Async methods to be proxied — self-invocation (this.asyncMethod()) bypasses proxy and runs synchronously. Same proxy pitfall as @Transactional.',
    runtime:
      'Default SimpleAsyncTaskExecutor creates new thread per task (no pool) — dangerous in prod. Boot spring.task.execution.pool.* configures ThreadPoolTaskExecutor. SecurityContextHolder, MDC, TransactionSynchronizationManager are ThreadLocal — NOT copied to async thread unless TaskDecorator or DelegatingSecurityContextAsyncTaskExecutor configured.',
    failure:
      'Async methods ignored — forgot @EnableAsync or called via this. instead of injected bean. TaskRejectedException — pool saturated. Uncaught async exceptions swallowed unless AsyncUncaughtExceptionHandler set. ClassCastException if wrong return type (void vs Future).',
    debug:
      'logging.level.org.springframework.scheduling.annotation=DEBUG. Trace thread names async-pay-*. Verify proxy: AopUtils.isAopProxy(bean). Actuator thread dump for pool exhaustion.',
    production:
      'Named ThreadPoolTaskExecutor with bounded queue and CallerRunsPolicy or custom rejection. TaskDecorator copies MDC + SecurityContext. Monitor queue depth and rejection count. Never rely on default SimpleAsyncTaskExecutor under load.',
    mistakes: [
      '@Async without @EnableAsync — silent sync execution',
      'Using default unbounded thread-per-task executor',
      'Expecting @Transactional to propagate to async thread — separate transaction boundary',
      'Expecting SecurityContext on async worker without DelegatingSecurityContextAsyncTaskExecutor',
      'Returning void and assuming caller knows completion — use CompletableFuture',
    ],
    traps: [
      'Interview: @EnableAsync registers ABPP; without it @Async is a no-op',
      'Self-invocation skips async proxy — inject self or ApplicationContext.getBean',
      'ThreadLocal (MDC, SecurityContext, TX) does not flow to @Async unless decorated',
      '@Async on private/final methods — not advised (Spring AOP limitation)',
    ],
    answer15s:
      '@EnableAsync registers AsyncAnnotationBeanPostProcessor which proxies @Async methods and submits them to a TaskExecutor. Without it, @Async is ignored.',
    answer60s:
      '@EnableAsync imports async infrastructure: AsyncAnnotationBeanPostProcessor wraps beans with AsyncAnnotationAdvisor. @Async method calls go through proxy → AnnotationAsyncExecutionInterceptor → TaskExecutor. Configure pool via AsyncConfigurer or Boot spring.task.execution.*. ThreadLocal state (SecurityContext, MDC, transaction) does not propagate unless TaskDecorator. Self-invocation bypasses proxy.',
    answer3m:
      'Activation: @EnableAsync on @Configuration → AsyncConfigurationRegistrar → ABPP. Proxy: only external calls through Spring bean proxy are async; this.method() runs sync. Executor: override getAsyncExecutor(); production ThreadPoolTaskExecutor with bounds. Propagation: DelegatingSecurityContextAsyncTaskExecutor + MdcTaskDecorator for observability. Exception handling: AsyncUncaughtExceptionHandler. Return types: void (fire-forget), Future, CompletableFuture. Contrast @Scheduled (scheduler thread). Pitfalls: no @EnableAsync, pool exhaustion, lost transaction context on async thread.',
    memory: 'ENABLE_ASYNC → ABPP → proxy @Async → TaskExecutor; ThreadLocals need decorator.',
    tables: [
      {
        headers: ['ThreadLocal', 'On caller thread', 'On @Async worker', 'Fix'],
        rows: [
          ['SecurityContext', 'Present', 'Missing', 'DelegatingSecurityContextAsyncTaskExecutor'],
          ['MDC (traceId)', 'Present', 'Missing', 'TaskDecorator copying MDC map'],
          ['Transaction', 'Active', 'None', 'Complete TX before async; use @TransactionalEventListener'],
          ['Request attributes', 'Present', 'Missing', 'Pass DTO; RequestContextHolder invalid'],
        ],
      },
    ],
  },
  {
    id: 'async',
    annotation: '@Async',
    family: 'async-cache-events',
    what:
      '@Target(METHOD|TYPE) marks method (or all methods on class) for asynchronous execution on a TaskExecutor. Return types: void (fire-and-forget), Future<T>, CompletableFuture<T>, ListenableFuture (legacy). Optional value attribute names custom Executor bean: @Async("auditExecutor").',
    why:
      'Decouple caller latency from slow work — send email, call external API, write audit log without blocking request thread. Improves throughput when work is I/O bound and failure can be handled asynchronously.',
    example: `@Service
public class NotificationService {
  private final MailSender mailSender;

  @Async("notificationExecutor")
  public CompletableFuture<Void> sendReceipt(String email, Receipt receipt) {
    mailSender.send(email, receipt);
    return CompletableFuture.completedFuture(null);
  }
}

// Caller injects NotificationService (proxy) — NOT this.sendReceipt()
@Service
public class CheckoutService {
  private final NotificationService notifications;

  public void complete(Order order) {
    notifications.sendReceipt(order.getEmail(), order.toReceipt());
  }
}`,
    processor:
      'AsyncAnnotationBeanPostProcessor → AsyncAnnotationAdvisor → AnnotationAsyncExecutionInterceptor. Resolves executor: @Async("name") → getBean(name, Executor); else default from AsyncConfigurer or SimpleAsyncTaskExecutor. doSubmit wraps method invocation in Runnable submitted to executor. Exception handling via AsyncUncaughtExceptionHandler for void returns.',
    when:
      'Fire-and-forget side effects, parallel fan-out with CompletableFuture.allOf, non-critical path work. NOT for logic that must share caller transaction or SecurityContext without explicit propagation.',
    flow: `1. checkoutService.complete() calls notificationService.sendReceipt() on proxy
2. Interceptor builds AsyncTaskExecutor submission
3. Caller thread returns immediately (CompletableFuture pending)
4. Pool thread: invoke target method on target bean
5. CompletableFuture completes with result or exceptionally
6. Self-invocation: checkoutService internal this.sendReceipt() → NO interceptor → sync on caller thread`,
    lifecycle:
      'Each @Async invocation = new task on executor. No Spring bean lifecycle per task — method runs on pooled thread. CompletableFuture lifecycle independent of HTTP request if caller already returned.',
    proxy:
      'JDK proxy (interface) or CGLIB (class). Must call through injected bean. @Async on same class called via this — classic self-invocation trap (runs synchronously, no thread switch).',
    runtime:
      'Worker thread has no HTTP request, no open transaction from caller, empty SecurityContext unless decorated. MDC traceId lost — breaks distributed tracing. CompletableFuture.get() on caller can block — defeats purpose if misused.',
    failure:
      'Method runs sync — self-invocation or missing @EnableAsync. AsyncRequestTimeoutException in MVC if returning DeferredResult incorrectly. Exception in void @Async — logged by handler, caller unaware. Pool TaskRejectedException under load.',
    debug:
      'Log thread name at start of @Async method — should be pool prefix not http-nio. Breakpoint on AnnotationAsyncExecutionInterceptor.invoke. Compare sync vs async path with self-invocation test.',
    production:
      'Inject service for calls; never this.@Async. Pass primitives/DTOs not entity references (detached/lazy issues). Use CompletableFuture for composability. Propagate MDC via TaskDecorator. Size pool from metrics.',
    mistakes: [
      'this.asyncMethod() self-invocation — runs on caller thread',
      '@Async on @Transactional method expecting same transaction on worker',
      'Passing lazy Hibernate entity to @Async — LazyInitializationException',
      'void @Async with no error visibility to caller',
      '@Async on non-public method — not proxied',
    ],
    traps: [
      'Interview: self-invocation = biggest @Async bug; inject self or split bean',
      'SecurityContextHolder.getContext() null on async thread',
      'MDC.get("traceId") empty in async logs',
      '@Transactional + @Async ordering: TX commits on caller before async runs — usually desired',
    ],
    answer15s:
      '@Async runs method on TaskExecutor via AOP proxy. External calls async; self-invocation (this.) runs synchronously. ThreadLocal context does not propagate by default.',
    answer60s:
      '@Async processed by AsyncAnnotationBeanPostProcessor proxy. Calls submitted to TaskExecutor; void/Future/CompletableFuture return types. Custom executor via @Async("beanName"). Self-invocation bypasses proxy. SecurityContext, MDC, and active transaction are ThreadLocal — not on worker unless TaskDecorator/DelegatingSecurityContextAsyncTaskExecutor. Pass DTOs not lazy entities.',
    answer3m:
      'Mechanism: AsyncAnnotationAdvisor pointcut @Async → AnnotationAsyncExecutionInterceptor.doSubmit → executor.execute. Enable with @EnableAsync. Self-invocation: Spring AOP only intercepts calls through proxy — inject NotificationService or use ApplicationContext.getBean. Transaction: async method starts new TX if @Transactional on async method, separate from caller. Event pattern: publish event, @TransactionalEventListener(AFTER_COMMIT) + @Async for safe post-commit work. Production: bounded pool, MDC decorator, CompletableFuture for errors, monitor rejections. vs @Scheduled: cron-based vs on-demand.',
    memory: '@ASYNC = proxy only; this. = sync; ThreadLocals need explicit copy.',
  },
  {
    id: 'scheduled',
    annotation: '@Scheduled',
    family: 'async-cache-events',
    what:
      '@Target(METHOD) on no-arg or parameterless methods schedules periodic or delayed execution. Requires @EnableScheduling. Attributes: cron, fixedRate, fixedDelay, initialDelay (ms or ISO-8601 Duration in Boot 3). Runs on TaskScheduler thread pool (default single thread in simple setup).',
    why:
      'In-process timers for cache warming, reconciliation, heartbeat, stale data cleanup. Simpler than external cron for single-instance dev; production multi-instance needs distributed lock (ShedLock) or external scheduler.',
    example: `@Configuration
@EnableScheduling
public class SchedulerConfig {}

@Component
public class SettlementJob {
  @Scheduled(cron = "0 0 2 * * *", zone = "America/New_York")
  public void nightlySettlement() { ... }

  @Scheduled(fixedDelay = 60_000) // 60s after previous run completes
  public void pollOutbox() { ... }
}

// Production multi-instance — ShedLock (not built into Spring):
@Scheduled(cron = "0 */5 * * * *")
@SchedulerLock(name = "outboxPoller", lockAtMostFor = "4m", lockAtLeastFor = "1m")
public void pollOutboxLocked() { ... }`,
    processor:
      'ScheduledAnnotationBeanPostProcessor (SABPP) implements BeanPostProcessor + InitializingBean. Discovers @Scheduled methods, registers ScheduledTask with TaskScheduler. Cron: CronTrigger. fixedRate: periodic from start; fixedDelay: gap after completion. Zone from cron zone attribute or system default.',
    when:
      'Single-instance or ShedLock-protected jobs. fixedDelay when job duration variable (prevents overlap pile-up). fixedRate when strict wall-clock interval needed (can overlap). NOT sufficient alone for cluster-wide exactly-once scheduling.',
    flow: `1. @EnableScheduling → ScheduledAnnotationBeanPostProcessor
2. postProcessAfterInitialization scans @Scheduled methods
3. Registers task with TaskScheduler (ScheduledThreadPoolExecutor default pool size 1)
4. Trigger fires → invoke method on bean (direct call, NOT async proxy unless also @Async)
5. Multi-pod: ALL instances run same cron unless ShedLock/DB lock/external cron
6. ShedLock: acquire lock in DB/Redis → only one runner executes`,
    lifecycle:
      'Tasks registered at context refresh. Run until context shutdown. @PreDestroy cancels scheduled futures. Missed executions: cron does not catch up bursts after long GC pause (depends on scheduler).',
    proxy:
      '@Scheduled method invoked directly on bean by scheduler — not through caller proxy. @Transactional on @Scheduled works if called through transactional proxy... scheduler invokes target directly on singleton — @Transactional still applies if bean is proxied for TX. @Async + @Scheduled: schedule triggers async submit.',
    runtime:
      'Default pool size 1 — one @Scheduled can block all others. Boot spring.task.scheduling.pool.size increases threads. Scheduler is NOT distributed — every JVM runs the job. Clock skew across nodes affects cron alignment.',
    failure:
      'Overlapping fixedRate runs if method slower than interval. All pods duplicate work without distributed lock. Silent failure if exception swallowed — log and alert. Wrong cron timezone — DST surprises. Single-thread pool starvation.',
    debug:
      'logging.level.org.springframework.scheduling=DEBUG. Log entry/exit with instance id (hostname). ShedLock logs lock acquire/release. Thread dump if jobs stop — blocked on DB.',
    production:
      'ShedLock or Quartz cluster or K8s CronJob for multi-instance. Adequate scheduler pool size. fixedDelay for long jobs. Idempotent job design. Alert on consecutive failures. Document timezone explicitly.',
    mistakes: [
      'Running @Scheduled on every pod without distributed lock — duplicate processing',
      'fixedRate with slow job — overlapping executions corrupt data',
      'Pool size 1 with multiple @Scheduled — mutual blocking',
      'Assuming missed cron runs backfill all missed windows',
      'Heavy work on scheduler thread without @Async offload',
    ],
    traps: [
      'Interview: @Scheduled is per-JVM not distributed — use ShedLock/K8s CronJob',
      'fixedRate vs fixedDelay — overlap vs gap-after-complete',
      'ShedLock lockAtMostFor prevents zombie lock; lockAtLeastFor prevents rapid re-run',
      '@EnableScheduling required like @EnableAsync',
    ],
    answer15s:
      '@Scheduled runs methods on TaskScheduler at cron/fixedRate/fixedDelay. Requires @EnableScheduling. Not distributed — every instance runs unless ShedLock or external scheduler.',
    answer60s:
      'ScheduledAnnotationBeanPostProcessor registers triggers with TaskScheduler. cron uses CronTrigger with optional zone. fixedDelay waits after completion; fixedRate from start (can overlap). Default single scheduler thread can block other jobs. Multi-instance: all pods fire — add ShedLock (@SchedulerLock) or K8s CronJob. Not a replacement for Kafka-driven work at scale.',
    answer3m:
      'Pipeline: @EnableScheduling → SABPP → scan methods → ScheduledTaskRegistrar. Pool: ThreadPoolTaskScheduler, configure size. Distributed gap: Spring has no built-in leader election for @Scheduled; ShedLock uses DB/Redis lock row. lockAtMostFor releases stuck lock; lockAtLeastFor enforces minimum gap. Idempotency required. Contrast @Async (event-driven). Production: hostname in logs, metrics per job, dead-man alert. fixedRate overlap example: 10s rate, 15s job → 2 concurrent runs.',
    memory: '@SCHEDULED = per-JVM timer; cluster needs ShedLock or K8s CronJob.',
    tables: [
      {
        headers: ['Attribute', 'Behavior', 'Overlap risk', 'Use when'],
        rows: [
          ['cron', 'Wall-clock trigger', 'Yes if job > interval', 'Nightly batch, business hours'],
          ['fixedRate', 'Every N ms from start', 'High', 'Heartbeat, metrics tick'],
          ['fixedDelay', 'N ms after prior finish', 'Low', 'Pollers, variable duration jobs'],
          ['initialDelay', 'Wait before first run', '—', 'Stagger startup'],
        ],
      },
      {
        headers: ['Approach', 'Distributed?', 'Notes'],
        rows: [
          ['@Scheduled only', 'No', 'Every pod runs — duplicates'],
          ['ShedLock + @Scheduled', 'Yes (one winner)', 'DB/Redis lock; popular pattern'],
          ['K8s CronJob', 'Yes', 'Single pod per run'],
          ['Quartz cluster', 'Yes', 'Heavier infrastructure'],
        ],
      },
    ],
  },
  {
    id: 'event-listener',
    annotation: '@EventListener',
    family: 'async-cache-events',
    what:
      '@Target(METHOD) marks method as listener for ApplicationEvent (or POJO event types in Spring 4.2+). Method signature: event type parameter, optional Event or array for multiple types. SpEL condition attribute filters events. Synchronous by default on publisher thread unless @Async also present.',
    why:
      'Decouple modules — payment service publishes PaymentCompletedEvent; notification, analytics, loyalty listen without direct dependencies. Lighter than message broker for in-process domain events.',
    example: `@Service
public class PaymentService {
  private final ApplicationEventPublisher events;

  @Transactional
  public void capture(Payment p) {
    repository.save(p);
    events.publishEvent(new PaymentCapturedEvent(p.getId(), p.getAmount()));
  }
}

@Component
public class AnalyticsListener {
  @EventListener
  public void onCaptured(PaymentCapturedEvent event) {
    metrics.counter("payment.captured", "id", event.paymentId()).increment();
  }

  @EventListener(condition = "#event.amount > 10000")
  public void onLargePayment(PaymentCapturedEvent event) { ... }
}`,
    processor:
      'EventListenerMethodProcessor (BeanPostProcessor) implements SmartInitializingSingleton. Scans @EventListener methods, registers ApplicationListener adapter with ApplicationEventMulticaster. Default multicaster: SimpleApplicationEventMulticaster — sync invoke listeners on publishing thread. @Async on listener → async multicaster or @EnableAsync proxy invocation.',
    when:
      'In-process domain events, audit hooks, metrics. Use @TransactionalEventListener when listener must see committed data. @Async @EventListener for non-blocking side effects after sync publish.',
    flow: `1. publishEvent(PaymentCapturedEvent) on publisher thread
2. ApplicationEventMulticaster.multicastEvent
3. Resolves listeners matching event type (including supertypes)
4. Reflective invoke @EventListener method on each listener bean
5. Sync: blocks publisher until all listeners return
6. @Async listener: submit to executor, publisher continues
7. Uncaught listener exception can abort other listeners (sync) or log (async)`,
    lifecycle:
      'Listeners registered at singleton initialization phase. Events are ephemeral objects — GC after dispatch unless retained. No persistence — lost if JVM dies mid-dispatch.',
    proxy:
      'Listener invoked on Spring bean — if bean is transactional proxy, @Transactional on listener works. Self-invocation N/A (multicaster calls listener). @Async listener needs proxy on listener bean.',
    runtime:
      'Runs on publisher thread by default — slow listener blocks payment capture. Transaction: listener sees uncommitted data if published inside @Transactional before commit. Order: @Order on listener class/method.',
    failure:
      'Listener throws — can roll back perception if sync inside same TX (same thread). Published inside TX before commit — listener reads uncommitted/stale data. Infinite loop — listener republishes same event type.',
    debug:
      'logging.level.org.springframework.context.event=DEBUG. Log publish and listener entry. Breakpoint on EventListenerMethodProcessor. Trace @Order values.',
    production:
      'Keep listeners fast or @Async. Heavy work → Kafka after outbox. Use @TransactionalEventListener(AFTER_COMMIT) for DB-dependent listeners. Idempotent listeners. Avoid cyclic event chains.',
    mistakes: [
      'Heavy sync listener blocking publisher',
      'Publishing before commit — listener sees rolled-back data risk',
      'No error handling — one listener failure affects multicast',
      'Using events for cross-service communication — use messaging',
      'Missing @EnableAsync for async listeners',
    ],
    traps: [
      'Interview: @EventListener sync on publisher thread; TX still open if published mid-@Transactional',
      '@TransactionalEventListener needed for after-commit semantics',
      'SpEL condition #event.field evaluated against event object',
      'ApplicationEventPublisher.publishEvent vs TransactionalEventPublisher',
    ],
    answer15s:
      '@EventListener registers method with ApplicationEventMulticaster. Sync on publisher thread by default. Inside @Transactional, listeners may see uncommitted data — use @TransactionalEventListener for after-commit.',
    answer60s:
      'EventListenerMethodProcessor registers listeners at startup. publishEvent multicasts to matching methods. Default sync on calling thread — blocks publisher. condition SpEL filters. For post-commit handling use @TransactionalEventListener(phase=AFTER_COMMIT). Add @Async for offload. Order via @Order.',
    answer3m:
      'Registration: SmartInitializingSingleton → scan @EventListener → ApplicationListenerMethodAdapter. Multicaster: SimpleApplicationEventMulticaster.invokeListener sync. Transaction interaction: event published inside @Transactional runs before commit — listener querying DB may not see write or may see uncommitted. Fix: @TransactionalEventListener phases. Async: @Async on listener method. vs Kafka: in-process only, no durability. Production: outbox pattern for cross-service. Pitfalls: slow sync listeners, exception propagation, event loops.',
    memory: '@EVENT_LISTENER = sync multicast; mid-TX publish = uncommitted visibility.',
  },
  {
    id: 'transactional-event-listener',
    annotation: '@TransactionalEventListener',
    family: 'async-cache-events',
    what:
      '@Target(METHOD) specialized @EventListener tied to transaction phase. TransactionPhase: BEFORE_COMMIT, AFTER_COMMIT (default), AFTER_ROLLBACK, AFTER_COMPLETION. Falls back to AFTER_COMMIT if no transaction active (since SF 5.2). Optional fallbackExecution=true runs even without TX.',
    why:
      'Ensure listeners run only after successful DB commit — send email, call external API, invalidate cache without risk of acting on rolled-back data. AFTER_ROLLBACK for compensating notifications or audit.',
    example: `@Component
public class PaymentSideEffects {
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void sendReceipt(PaymentCapturedEvent event) {
    emailService.send(event.paymentId());
  }

  @TransactionalEventListener(phase = TransactionPhase.AFTER_ROLLBACK)
  public void onRollback(PaymentCapturedEvent event) {
    audit.warn("Payment rolled back: " + event.paymentId());
  }

  @TransactionalEventListener(phase = AFTER_COMMIT)
  @Async
  public void pushToKafka(PaymentCapturedEvent event) {
    kafkaTemplate.send("payments", event);
  }
}`,
    processor:
      'TransactionalEventListenerMethodProcessor extends EventListenerMethodProcessor. Wraps listener in TransactionalApplicationListenerMethodAdapter. Registers with TransactionalApplicationListenerSynchronization on TransactionSynchronizationManager when event published during active transaction. Phase determines callback: beforeCommit, afterCommit, afterRollback, afterCompletion.',
    when:
      'Any side effect that must reflect committed DB state. External calls, cache eviction, messaging. AFTER_COMMIT + @Async is common production pattern. BEFORE_COMMIT for last-moment validation (rare).',
    flow: `1. @Transactional method publishes event
2. TransactionalEventListenerMethodProcessor detects active TX
3. Defers listener — registers TransactionSynchronization, does NOT invoke yet
4. TX commits successfully → afterCommit callbacks → invoke AFTER_COMMIT listeners
5. TX rolls back → AFTER_ROLLBACK listeners; AFTER_COMMIT skipped
6. No TX: default AFTER_COMMIT runs immediately (or skipped without fallbackExecution)
7. @Async AFTER_COMMIT: afterCommit submits to executor`,
    lifecycle:
      'Listener deferred until TX outcome known. Synchronization bound to calling thread transaction. After commit, async listener lifecycle independent.',
    proxy:
      '@TransactionalEventListener on bean — invoked by framework adapter, not self-call. @Async applies via proxy on listener bean after commit callback.',
    runtime:
      'AFTER_COMMIT runs after DB commit — external systems safe. Still in same JVM — crash after commit before listener runs loses side effect unless idempotent retry. @Async AFTER_COMMIT: commit on request thread, side effect on pool thread.',
    failure:
      'Listener never runs — TX rolled back (expected). Listener runs on rolled-back data confusion — used plain @EventListener instead. AFTER_COMMIT failure does not roll back DB — partial consistency; need compensation.',
    debug:
      'Log TX phase transitions. TRACE org.springframework.transaction.event. Verify event published inside @Transactional boundary.',
    production:
      'AFTER_COMMIT for outbound integrations. Idempotent consumers. @Async for slow work. Outbox table + poller for guaranteed delivery instead of only events. Monitor failed AFTER_COMMIT handlers.',
    mistakes: [
      'Plain @EventListener for email after payment — may run before commit or on rollback path',
      'Expecting AFTER_COMMIT failure to undo DB write',
      'Publishing event outside @Transactional — immediate fire, may be wrong timing',
      'forgetting @EnableAsync on AFTER_COMMIT async listener',
    ],
    traps: [
      'Interview phases: BEFORE_COMMIT, AFTER_COMMIT (default), AFTER_ROLLBACK, AFTER_COMPLETION',
      'No active TX → AFTER_COMMIT runs immediately unless fallbackExecution=false',
      'AFTER_COMMIT is not durable — JVM crash loses listener',
      'Combine with outbox for exactly-once external delivery',
    ],
    answer15s:
      '@TransactionalEventListener defers handling until transaction phase — default AFTER_COMMIT so listeners see committed data. Use instead of @EventListener for post-DB side effects.',
    answer60s:
      'Wraps listener in transaction synchronization. AFTER_COMMIT invokes after successful commit; AFTER_ROLLBACK on failure. Published inside @Transactional is deferred; without TX runs per fallback rules. Pair AFTER_COMMIT with @Async for non-blocking external calls. Does not replace outbox for durability.',
    answer3m:
      'Processor: TransactionalEventListenerMethodProcessor → TransactionalApplicationListenerMethodAdapter. Phases: BEFORE_COMMIT (validation), AFTER_COMMIT (side effects), AFTER_ROLLBACK (cleanup/audit), AFTER_COMPLETION (always). Mechanism: TransactionSynchronizationManager.registerSynchronization. Contrast @EventListener: immediate on publish thread, uncommitted visibility. Production: AFTER_COMMIT + @Async + idempotency keys. Failure after commit: saga/compensation. Outbox pattern: same TX insert outbox row, @Scheduled or CDC publishes. Pitfalls: wrong annotation, no TX context, expecting transactional rollback from listener failure.',
    memory: 'TX_EVENT_LISTENER: AFTER_COMMIT = safe side effects; not durable alone.',
    tables: [
      {
        headers: ['Phase', 'When invoked', 'Typical use'],
        rows: [
          ['BEFORE_COMMIT', 'TX still open, can still rollback', 'Last-minute validation'],
          ['AFTER_COMMIT', 'After successful commit', 'Email, Kafka, cache evict'],
          ['AFTER_ROLLBACK', 'TX rolled back', 'Audit, metrics'],
          ['AFTER_COMPLETION', 'Commit or rollback', 'Cleanup resources'],
        ],
      },
    ],
  },
  {
    id: 'enable-caching',
    annotation: '@EnableCaching',
    family: 'async-cache-events',
    what:
      '@Target(TYPE) enables Spring\'s declarative caching abstraction. Registers CacheInterceptor infrastructure via CachingConfigurationSelector — imports CacheManagementConfigSelector, registers BeanFactoryCacheOperationSourceAdvisor, CacheInterceptor, and default CacheManager if none defined. Boot auto-configures Redis/Caffeine CacheManager when on classpath.',
    why:
      'Activate @Cacheable/@CachePut/@CacheEvict without XML. Central switch for method-level cache AOP. Integrates with CacheManager abstraction — swap in-memory vs Redis without changing annotations.',
    example: `@SpringBootApplication
@EnableCaching
public class ShopApplication {}

@Configuration
@EnableCaching
public class CacheConfig {
  @Bean
  public CacheManager cacheManager(RedisConnectionFactory cf) {
    return RedisCacheManager.builder(cf)
        .cacheDefaults(RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10)))
        .build();
  }
}`,
    processor:
      'CachingConfigurationSelector imports proxy/cache infrastructure. CacheInterceptor extends CacheAspectSupport — AOP alliance MethodInterceptor. CacheOperationSource reads @Cacheable/@CachePut/@CacheEvict metadata. KeyGenerator (default SimpleKeyGenerator), CacheResolver, CacheErrorHandler configurable.',
    when:
      'Any declarative caching. Required once per application (or @SpringBootApplication). Define CacheManager bean for production — do not rely on ConcurrentMapCacheManager default for multi-instance.',
    flow: `1. @EnableCaching → CacheInterceptor + advisor registered
2. Beans with cache annotations get proxied (alongside @Transactional advisor order matters)
3. Method call → CacheInterceptor.invoke
4. CacheOperationContext evaluates SpEL keys/conditions
5. @Cacheable: cache hit → return without method; miss → proceed → put
6. CacheManager.getCache("products").get/put`,
    lifecycle:
      'Cache entries live in CacheManager backend until TTL/eviction. Application restart clears local caches; Redis persists per TTL. @CacheEvict on write paths maintains consistency.',
    proxy:
      'Cache annotations applied via AOP proxy — self-invocation bypasses cache (calls method every time). Same pattern as @Transactional/@Async.',
    runtime:
      'Local cache: per-JVM inconsistency in cluster. Redis: shared but network latency. Stampede: many threads miss same key simultaneously. Penetration: cache null for not-found keys missing — thundering DB queries.',
    failure:
      'Caching not applied — no @EnableCaching or self-invocation. Wrong cache name — silent empty cache. Redis down — depends on CacheErrorHandler (default propagate). Stale data — missing @CacheEvict on update.',
    debug:
      'logging.level.org.springframework.cache=TRACE shows get/put/evict. spring.cache.type=redis in Boot. Inspect cache keys in Redis CLI.',
    production:
      'Redis with TTL for multi-instance. @Cacheable unless="#result == null" or CacheableSync for stampede. @CacheEvict on mutations. Monitor hit ratio. Do not cache mutable objects without copy.',
    mistakes: [
      '@EnableCaching missing — annotations no-op',
      'Self-invocation bypasses @Cacheable',
      'No TTL — unbounded memory',
      'Caching entities with lazy collections — serialization/mutation issues',
      'Local cache in multi-pod — inconsistent reads',
    ],
    traps: [
      'Interview: @EnableCaching activates CacheInterceptor AOP',
      'Default ConcurrentMapCacheManager only for dev/single node',
      'Advisor order: @Transactional often before @Cacheable',
      'Cache stampede and penetration are operational not annotation bugs',
    ],
    answer15s:
      '@EnableCaching registers CacheInterceptor AOP for @Cacheable/@CachePut/@CacheEvict. Requires CacheManager bean for production (Redis/Caffeine).',
    answer60s:
      '@EnableCaching imports cache AOP infrastructure. CacheInterceptor consults CacheManager on method entry/exit. Self-invocation skips cache. Multi-instance needs shared store (Redis). Watch stampede (many concurrent misses) and penetration (uncached nulls hammering DB).',
    answer3m:
      'Selector: CachingConfigurationSelector → advisor + CacheInterceptor. CacheManager abstraction. Boot auto-config: spring.cache.redis.*, caffeine spec. Proxy: external calls only. Stampede: single-flight locking (Caffeine load sync), random TTL jitter, @Cacheable sync=true (SF 6). Penetration: cache negative results with short TTL, bloom filter upstream. Eviction: @CacheEvict on update/delete. Contrast manual Cache API. Production: metrics, TTL, unless SpEL, null handling.',
    memory: 'ENABLE_CACHING → CacheInterceptor; cluster needs shared CacheManager.',
  },
  {
    id: 'cacheable',
    annotation: '@Cacheable',
    family: 'async-cache-events',
    what:
      '@Target(METHOD|TYPE) caches method return value on successful invocation. Attributes: cacheNames/value, key (SpEL), condition (pre-check), unless (post-check on result), sync (SF 6 — single thread loads). On cache hit, method body not executed.',
    why:
      'Reduce DB/load for read-heavy idempotent lookups — product catalog, exchange rates, permission trees. Transparent to callers — same method signature.',
    example: `@Service
public class ProductService {
  @Cacheable(cacheNames = "products", key = "#id", unless = "#result == null")
  public Product findById(Long id) {
    return repository.findById(id).orElse(null);
  }

  @Cacheable(cacheNames = "rates", key = "#currency", sync = true)
  public BigDecimal getFxRate(String currency) {
    return fxClient.fetchRate(currency); // only one thread loads on miss
  }
}`,
    processor:
      'CacheInterceptor → CacheAspectSupport.execute → findCachedItem. CacheOperationExpressionEvaluator evaluates SpEL for key/condition/unless. Cache.ValueWrapper get; on miss invokeJoinpoint then cache.put unless unless rejects. sync=true uses synchronized block per key (local) or Redis SETNX pattern.',
    when:
      'Expensive reads, stable-ish data, clear key. unless="#result==null" prevents caching misses (penetration mitigation). sync=true for hot keys (stampede mitigation). Short TTL for semi-fresh data.',
    flow: `1. findById(42) on proxied ProductService
2. CacheInterceptor: condition true → compute key products::42
3. cache.get(42) → miss
4. invoke repository.findById — DB query
5. unless check: result non-null → cache.put
6. Second call: cache hit → return Product, method NOT called
7. Self-invocation this.findById(42) → always DB
8. Stampede: 1000 threads miss → 1000 DB calls unless sync=true`,
    lifecycle:
      'Entry lives until TTL, @CacheEvict, or manual clear. Mutable cached object — all callers share same instance reference if not copied.',
    proxy:
      'Must call through Spring proxy. Internal calls skip cache. Composes with @Transactional — typically TX advisor runs first, then cache.',
    runtime:
      'Cache stampede: concurrent misses on expired hot key. Cache penetration: querying non-existent ids bypasses cache if null not stored. Breakdown: Redis down → all requests hit DB.',
    failure:
      'Stale reads — update without @CacheEvict. Wrong SpEL key — collisions. Caching Optional or lazy proxies — surprising serialization. ClassCastException switching cache provider serializers.',
    debug:
      'TRACE org.springframework.cache.interceptor.CacheInterceptor. Log cache hit/miss ratio. Redis MONITOR for key pattern.',
    production:
      'unless for nulls with short negative TTL. sync or distributed lock for hot keys. TTL jitter. @CacheEvict on writes. Version key on schema change. Do not cache personally identifiable data without encryption.',
    mistakes: [
      'No unless — null caching or penetration',
      'Hot key expiry without sync — stampede',
      'Stale cache after update — missing evict',
      'Caching mutable entity graphs',
      'Self-invocation — cache never used',
    ],
    traps: [
      'Interview stampede: many threads miss → DB overload; fix sync=true or locking',
      'Penetration: attacker random ids; fix cache null + bloom filter',
      'key SpEL #root.methodName, #id, #p0',
      '@Cacheable on private method — not advised',
    ],
    answer15s:
      '@Cacheable returns cached value on hit without running method. SpEL key/condition/unless. Self-invocation bypasses cache. Use unless=null and sync=true against penetration/stampede.',
    answer60s:
      'CacheInterceptor checks CacheManager before method invoke. Miss proceeds and stores result. unless SpEL skips caching nulls. sync=true (SF6) single-flights load per key. Stampede: concurrent misses on hot key; penetration: uncached absent keys. Evict on updates. Proxy required.',
    answer3m:
      'CacheAspectSupport flow: get → hit return; miss → proceed → put. SpEL: key="#id", condition="@bean.isCacheable(#id)", unless="#result==null". Stampede mitigation: sync attribute, Caffeine refreshAhead, distributed lock (Redisson), probabilistic early expiration. Penetration: cache empty results TTL 60s, validation layer, bloom filter. Breakdown: circuit breaker to DB, CacheErrorHandler fallback. @Transactional interaction: read-through inside TX still caches after method returns. Cluster: Redis JSON serialization. Pitfalls: self-invocation, stale data, mutable values.',
    memory: '@CACHEABLE: hit skips method; stampede=sync; penetration=unless null + short TTL.',
    tables: [
      {
        headers: ['Problem', 'Symptom', 'Mitigation'],
        rows: [
          ['Cache stampede', 'Spike DB load on hot key expiry', 'sync=true, distributed lock, jitter TTL'],
          ['Cache penetration', 'Random keys always miss DB', 'Cache null, bloom filter, validate input'],
          ['Cache breakdown', 'Redis down, DB overloaded', 'Circuit breaker, local fallback cache'],
          ['Stale data', 'Old product price served', '@CacheEvict on write, short TTL'],
        ],
      },
    ],
  },
  {
    id: 'cache-put',
    annotation: '@CachePut',
    family: 'async-cache-events',
    what:
      '@Target(METHOD) always executes method and puts return value into cache — never skips method on cache hit. Used on create/update to refresh cache entry. Attributes same as @Cacheable: cacheNames, key, condition, unless.',
    why:
      'After write, warm cache with fresh value without separate @Cacheable miss. Ensures next read hits updated data. Pair with @CacheEvict when whole cache region must clear.',
    example: `@Service
public class ProductService {
  @CachePut(cacheNames = "products", key = "#product.id")
  public Product update(Product product) {
    return repository.save(product);
  }

  @CachePut(cacheNames = "products", key = "#result.id", condition = "#result != null")
  public Product create(Product product) {
    return repository.save(product);
  }
}`,
    processor:
      'CacheInterceptor always invokeJoinpoint first for @CachePut operations, then cache.put evaluated key with result. Multiple cache annotations: @Caching combines @CachePut + @CacheEvict. Order: method runs, then put.',
    when:
      'Update/create paths where you want cache refreshed with return value. When eviction too coarse — put single key. condition when partial updates should not cache.',
    flow: `1. update(product) called through proxy
2. CacheInterceptor: @CachePut — always invoke method
3. repository.save executes
4. Evaluate key from #product.id
5. cache.put(key, returned Product)
6. Subsequent @Cacheable findById hits fresh value`,
    lifecycle:
      'Put overwrites existing entry. TTL resets per cache provider policy (Redis SET usually new TTL).',
    proxy:
      'Requires proxy — self-invocation skips put. Often on same class as @Cacheable — both need external calls.',
    runtime:
      'Race: concurrent @CachePut and @Cacheable — last writer wins. put without evicting related keys — stale entries for list caches.',
    failure:
      'Caching wrong object — returned entity detached/stale fields. key SpEL wrong — orphan cache entries. put without TTL on huge objects — memory pressure.',
    debug:
      'TRACE cache put operations. Compare DB state vs Redis GET after update.',
    production:
      'Use @CachePut on single-entity updates; @CacheEvict(allEntries=true) on bulk changes. Return fully populated DTO. Document key strategy consistent with @Cacheable.',
    mistakes: [
      '@CachePut on read method expecting skip-on-hit behavior — use @Cacheable',
      'Key mismatch between @Cacheable and @CachePut',
      'Forgetting to evict list/summary caches on item put',
      'Self-invocation — cache not updated',
    ],
    traps: [
      'Interview: @CachePut ALWAYS runs method; @Cacheable skips on hit',
      '@Caching evict + put on same method common pattern',
      'cacheNames must match @Cacheable',
      'put does not remove stale entries in other cache regions',
    ],
    answer15s:
      '@CachePut always executes the method and stores the result in cache. Use on updates to refresh entries; @Cacheable skips method on hit.',
    answer60s:
      '@CachePut runs method every time then cache.put with SpEL key. Use after save/update to warm cache. Align key expression with @Cacheable on read path. @Caching can combine @CachePut with @CacheEvict for related regions. Proxy required.',
    answer3m:
      'Interceptor branch: CachePutOperation always proceed → put. vs @Cacheable: get-first. Pattern: @Cacheable findById, @CachePut update, @CacheEvict delete. @Caching example: evict lists + put item. Race conditions in high write: consider write-through or evict-only. Return value must be serializable for Redis. Pitfalls: key drift, related cache not evicted, self-invocation.',
    memory: '@CACHE_PUT = always run + store; pairs with @Cacheable reads.',
  },
  {
    id: 'cache-evict',
    annotation: '@CacheEvict',
    family: 'async-cache-events',
    what:
      '@Target(METHOD) removes entries from cache on method invocation. Attributes: cacheNames, key, allEntries (clear entire cache), beforeInvocation (evict before vs after method — default false). condition SpEL gates eviction.',
    why:
      'Invalidate stale data on delete/update when @CachePut insufficient — remove deleted entities, clear list caches, bulk invalidation after admin operations.',
    example: `@Service
public class ProductService {
  @CacheEvict(cacheNames = "products", key = "#id")
  public void deleteById(Long id) {
    repository.deleteById(id);
  }

  @CacheEvict(cacheNames = {"products", "productLists"}, allEntries = true)
  public void rebuildCatalog() {
    catalogImporter.runFullImport();
  }

  @Caching(evict = {
      @CacheEvict(cacheNames = "products", key = "#product.id"),
      @CacheEvict(cacheNames = "productLists", allEntries = true)
  })
  public Product update(Product product) {
    return repository.save(product);
  }
}`,
    processor:
      'CacheInterceptor processes CacheEvictOperation. beforeInvocation=false (default): method runs then evict. beforeInvocation=true: evict first — use when method failure should still clear stale (rare). allEntries=true → cache.clear().',
    when:
      'Delete paths, bulk imports, admin refresh. allEntries for list caches when any item changes. beforeInvocation=true only when stale worse than temporarily empty.',
    flow: `1. deleteById(42) on proxy
2. repository.deleteById runs
3. cache.evict(42) — key products::42 removed
4. Next findById(42) — miss → DB → null or not found
5. allEntries: entire products cache cleared — next reads repopulate`,
    lifecycle:
      'Eviction immediate in CacheManager. Redis: DEL key or FLUSHDB pattern. Other JVM local caches not evicted unless shared Redis.',
    proxy:
      'Proxy required. Evict from @Transactional method: default evict after method — if TX rolls back, cache already evicted (usually OK for delete). beforeInvocation timing matters.',
    runtime:
      'allEntries on large Redis namespace — expensive DEL pattern. Thundering herd after full clear — stampede on repopulate.',
    failure:
      'Evict wrong key — stale entry remains. Forgot evict on update — stale @Cacheable reads. Local cache per pod — evict on one pod, others stale until TTL.',
    debug:
      'TRACE evict operations. Verify Redis key deleted. Test read after delete.',
    production:
      'Precise key evict preferred over allEntries. Shared Redis for cluster consistency. After allEntries expect load spike — rate limit or warmup. Combine with @CachePut for single-entity updates.',
    mistakes: [
      'Missing @CacheEvict on delete — ghost cache entries',
      'allEntries in hot path — performance cliff',
      'Local cache — evict not visible to other pods',
      'beforeInvocation misunderstanding',
    ],
    traps: [
      'Interview: beforeInvocation false = evict after method (default)',
      'allEntries clears entire cache name region',
      '@Caching multiple evicts + put',
      'Cluster: need shared cache for evict to be global',
    ],
    answer15s:
      '@CacheEvict removes cache entries on method execution. key for one entry, allEntries for full region. Default evicts after method succeeds.',
    answer60s:
      '@CacheEvict on delete/update paths. key SpEL targets entry; allEntries clears cache region. beforeInvocation controls timing relative to method. Use @Caching to evict item + list caches together. Shared Redis needed for multi-instance consistency.',
    answer3m:
      'CacheEvictOperation: evaluate condition → evict key or clear. beforeInvocation true: evict then method (stale read during method possible). false: method then evict. Patterns: delete evict key, bulk import allEntries, update @Caching(evict list, put item). TX rollback after evict: rare issue on failed update with after evict. Production: avoid frequent allEntries; monitor post-evict DB spike. Local ConcurrentMapCacheManager evict is JVM-local only.',
    memory: '@CACHE_EVICT = delete keys; allEntries = nuclear; cluster needs Redis.',
  },
];
