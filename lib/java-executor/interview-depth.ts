/** Depth add-ons: cancel, CF pipeline, rejection labs, states, MDC, matrices, traps. */

export const CANCEL_DEEP = `Future<?> f = executor.submit(task);

f.cancel(false)
  • If not started: may prevent execution (returns true)
  • If running: does NOT interrupt — task keeps going
  • get() → CancellationException if cancelled before completion

f.cancel(true)
  • Attempts interrupt() on the running worker thread
  • Task must check interrupted / use interruptible blocking
  • Still not a hard kill

Incorrect handling
  catch (InterruptedException e) { /* swallow */ }
  → cancels stop working; pool shutdown hangs

Correct
  catch (InterruptedException e) {
    Thread.currentThread().interrupt();
    throw e; // or exit task
  }`;

export const CANCEL_CODE = `Callable<String> task = () -> {
  for (int i = 0; i < 100; i++) {
    if (Thread.currentThread().isInterrupted()) {
      throw new InterruptedException("cancel requested");
    }
    step(i); // prefer interruptible APIs
  }
  return "ok";
};

Future<String> f = executor.submit(task);
f.cancel(true);
// Running thread receives interrupt; cooperative task exits.`;

export const CF_PIPELINE = `// Sequential (A then B then C) — latency = sum
Customer c = getCustomer(id);
Account a = getAccount(c);
List<Tx> txs = getTransactions(a);
return combine(c, a, txs);

// Parallel fan-out then combine — latency ≈ max
ExecutorService io = paymentIoExecutor; // NOT commonPool

CompletableFuture<Customer> cF =
    CompletableFuture.supplyAsync(() -> getCustomer(id), io);
CompletableFuture<Account> aF =
    cF.thenComposeAsync(c ->
        CompletableFuture.supplyAsync(() -> getAccount(c), io), io);
CompletableFuture<List<Tx>> tF =
    aF.thenComposeAsync(a ->
        CompletableFuture.supplyAsync(() -> getTransactions(a), io), io);

// Independent fan-out example:
CompletableFuture<Customer> c2 =
    CompletableFuture.supplyAsync(() -> getCustomer(id), io);
CompletableFuture<Risk> r2 =
    CompletableFuture.supplyAsync(() -> getRisk(id), io);
CompletableFuture<Limits> l2 =
    CompletableFuture.supplyAsync(() -> getLimits(id), io);

CompletableFuture<View> view =
    CompletableFuture.allOf(c2, r2, l2)
        .thenApply(v -> new View(c2.join(), r2.join(), l2.join()))
        .orTimeout(2, TimeUnit.SECONDS)
        .exceptionally(ex -> View.degraded(ex));

APIs to know
  thenApply / thenApplyAsync
  thenCompose / thenComposeAsync   // flatMap Futures
  thenCombine / thenCombineAsync
  allOf / anyOf
  exceptionally / handle / whenComplete
  orTimeout / completeOnTimeout`;

export const REJECTION_LABS = `Traffic → pool full → queue full → rejection → ?

AbortPolicy
  throw RejectedExecutionException to caller
  Payments: map to 503 — preferred loud failure

CallerRunsPolicy
  caller thread runs the task
  Backpressure; dangerous if caller is Tomcat thread

DiscardPolicy
  drop silently — NEVER for money

DiscardOldestPolicy
  drop oldest queued, try execute again
  Drops earliest customer work — usually wrong for payments

Runnable sketch
  ThreadPoolExecutor pool = new ThreadPoolExecutor(
      1, 1, 0, TimeUnit.SECONDS,
      new ArrayBlockingQueue<>(1),
      handler);
  pool.execute(slow);
  pool.execute(slow); // fills queue
  pool.execute(probe); // triggers policy`;

export const REJECTION_LAB_CODE = `static void demo(RejectedExecutionHandler handler) {
  ThreadPoolExecutor pool = new ThreadPoolExecutor(
      1, 1, 0, TimeUnit.SECONDS,
      new ArrayBlockingQueue<>(1),
      handler);
  pool.execute(() -> sleep(2_000));
  pool.execute(() -> sleep(2_000)); // queued
  try {
    pool.execute(() -> System.out.println("probe"));
    System.out.println(handler.getClass().getSimpleName() + " accepted/handled");
  } catch (RejectedExecutionException ex) {
    System.out.println("Abort threw: " + ex);
  } finally {
    pool.shutdownNow();
  }
}`;

export const CTL_STATES = `ThreadPoolExecutor runState (packed in ctl)

RUNNING    — accept tasks, run workers
SHUTDOWN   — !accept new; drain queue; run workers
STOP       — !accept; !drain; interrupt workers (shutdownNow)
TIDYING    — terminated workers+queue; runs terminated() hook
TERMINATED — done

Operations
  submit/execute
    RUNNING: OK
    SHUTDOWN/STOP/...: reject
  shutdown()
    RUNNING → SHUTDOWN
  shutdownNow()
    → STOP, interrupt, return queued Runnables
  awaitTermination
    waits until TERMINATED or timeout

Production
  deploy: RUNNING → (stop traffic) → shutdown → await → optional shutdownNow → TERMINATED`;

export const MDC_PROPAGATION = `HTTP Request (traceId in MDC)
      ↓
API thread
      ↓
executor.submit(task)   ← worker is a DIFFERENT thread
      ↓
worker thread MDC empty unless copied
      ↓
logs lose correlation / tenant

Spring TaskDecorator
public class MdcTaskDecorator implements TaskDecorator {
  @Override
  public Runnable decorate(Runnable runnable) {
    Map<String, String> context = MDC.getCopyOfContextMap();
    return () -> {
      Map<String, String> previous = MDC.getCopyOfContextMap();
      if (context != null) MDC.setContextMap(context);
      else MDC.clear();
      try {
        runnable.run();
      } finally {
        if (previous != null) MDC.setContextMap(previous);
        else MDC.clear(); // critical — worker reuse
      }
    };
  }
}

ThreadPoolTaskExecutor exec = ...;
exec.setTaskDecorator(new MdcTaskDecorator());`;

export const EXCEPTION_MATRIX: string[][] = [
  ['API', 'Where exception goes', 'How to handle'],
  ['execute(Runnable)', 'UncaughtExceptionHandler / may vanish', 'Handler + afterExecute'],
  ['submit(Callable)', 'Stored in Future', 'Always get()/callback; afterExecute'],
  ['Future.get()', 'ExecutionException / Cancellation / Timeout / Interrupted', 'Unwrap cause; restore interrupt'],
  ['CompletableFuture', 'completeExceptionally; handle/exceptionally', 'orTimeout; never ignore'],
  ['@Async void', 'AsyncUncaughtExceptionHandler', 'Configure handler; prefer CF return'],
  ['@Async Future/CF', 'On the Future/CF', 'Observe result'],
  ['ScheduledExecutor', 'May suppress / kill schedule depending on path', 'try/catch inside task; monitor'],
];

export const EXCEPTION_TYPES = `RuntimeException — wraps into ExecutionException on get(); uncaught on execute
Error — serious; still may surface similarly; do not "handle" casually
InterruptedException — restore interrupt flag; exit
ExecutionException — get().getCause() is the real failure
CancellationException — future cancelled
RejectedExecutionException — pool saturated / shutdown
TimeoutException — get(timeout) fired; task may STILL be running`;

export const DECISION_WORKLOAD = `What kind of workload?
        |
        ├── CPU bound
        |      ↓
        |   ThreadPoolExecutor (~cores) / ForkJoinPool (recursive)
        |
        ├── I/O bound
        |      ↓
        |   ThreadPoolExecutor (bounded) / Virtual threads (many blockers)
        |   CAP by DB/HTTP pools either way
        |
        ├── Async pipeline / fan-in
        |      ↓
        |   CompletableFuture + YOUR executor
        |
        └── Recursive CPU split
               ↓
           ForkJoinPool (not for JDBC)`;

export const DECISION_INCREASE_POOL = `Should I increase pool size?
        ↓
Is CPU saturated?
  YES → maybe optimize code / scale out; more threads often hurt
  NO
        ↓
Is DB pool saturated / waiting?
  YES → fix DB or REDUCE app concurrency to match
  NO
        ↓
Is external API slow / timed out?
  YES → timeouts, CB, bulkhead — not blind thread growth
  NO
        ↓
Is queue growing with workers busy?
  YES → downstream slow OR undersized pool for true concurrency need
  NO
        ↓
Is rejection spiking with healthy deps?
  YES → short burst buffer (queue) or horizontal scale
  NO → look for locks, GC, noisy neighbor pools`;

export const BACKPRESSURE_SECTION = `Producer
   ↓
Executor.execute/submit
   ↓
Bounded Queue
   ↓
Workers (consumers)
   ↓
Downstream (DB / HTTP / Kafka)

Tools
  • Bounded queue — finite wait
  • Rejection (Abort) — fail fast to caller
  • CallerRuns — slow the producer thread
  • Rate limiting / semaphore — admission control
  • Kafka pause/resume — consumer backpressure
  • Load balancer 503 — shed at the edge

Goal: protect the core — better a controlled reject than collapse.`;

export const MICROMETER_SNIPPET = `// Spring Boot: ThreadPoolTaskExecutor + Micrometer binder
@Bean
ThreadPoolTaskExecutor paymentExecutor(MeterRegistry registry) {
  ThreadPoolTaskExecutor e = new ThreadPoolTaskExecutor();
  e.setCorePoolSize(32);
  e.setMaxPoolSize(64);
  e.setQueueCapacity(500);
  e.setThreadNamePrefix("payment-");
  e.initialize();
  // Boot 2.7+/3.x often auto-instruments TaskExecutor beans;
  // also gauge manually:
  Gauge.builder("payment.executor.queue", e, ex -> ex.getThreadPoolExecutor().getQueue().size())
      .register(registry);
  return e;
}

Watch
  active threads, pool size, queue size
  completed tasks, rejected count
  task execution time, queue wait time`;

export const DEBUG_SCENARIO_WALK = `Symptom
  API latency ↑ suddenly
  CPU = 30%
  Threads = 500
  Queue = 10,000
  DB connections = 20

Diagnosis walk
  1. Low CPU → not compute-bound; threads waiting
  2. Queue 10k → tasks wait for workers OR workers wait downstream
  3. DB=20 → likely workers blocked borrowing / querying
  4. Thread dump: WAITING on Hikari / socketRead
  5. Fix: align executor concurrency with DB pool, add timeouts,
     shed load (reject), scale DB or reduce RPS — do NOT jump to 1000 threads`;

export const INTERVIEW_TRAPS: {trap: string; truth: string}[] = [
  {trap: 'maximumPoolSize is used as soon as load rises', truth: 'Only after the queue refuses a task'},
  {trap: 'Unbounded queue is fine with a high max', truth: 'Max may never be reached; queue grows forever'},
  {trap: 'More threads always increase throughput', truth: 'Past the bottleneck, they add waits and switches'},
  {trap: 'Virtual threads create more DB capacity', truth: 'Still capped by the connection pool'},
  {trap: 'submit() throws task exceptions to the caller immediately', truth: 'Stored until Future.get()'},
  {trap: 'shutdown() kills running tasks', truth: 'Stops new tasks; drains running+queued'},
  {trap: 'shutdownNow() guarantees stop', truth: 'Interrupts; tasks may ignore'},
  {trap: 'cancel(true) always stops the task', truth: 'Needs cooperative interruption'},
  {trap: 'CompletableFuture always uses your Spring bean pool', truth: 'Default supplyAsync → commonPool'},
  {trap: 'CallerRunsPolicy adds capacity', truth: 'Runs on caller — can stall request threads'},
  {trap: 'ThreadLocal is request-scoped automatically', truth: 'Worker reuse leaks unless cleared'},
  {trap: 'Queue size is only a capacity number', truth: 'It is a latency and backpressure decision'},
  {trap: 'newFixedThreadPool is production-safe by default', truth: 'Unbounded queue is the hidden risk'},
  {trap: 'Nested Future.get on same pool is OK if max is large', truth: 'Still fragile; redesign'},
  {trap: '@Async always runs async', truth: 'Self-invocation skips the proxy'},
  {trap: '@Transactional applies to executor workers automatically', truth: 'ThreadLocal txn stays on caller'},
  {trap: 'DiscardPolicy is OK if we monitor later', truth: 'Silent loss — never for money'},
  {trap: 'CPU cores × 2 is universal', truth: 'Assumptions fail when I/O/DB dominate'},
  {trap: 'Kafka + big executor always fixes lag', truth: 'Offset/order/commit issues can worsen correctness'},
  {trap: 'Pool reuse means tasks can share local variables safely', truth: 'Do not stash request state on the worker'},
];

export const ANSWERS_60S: {concept: string; s30: string; s60: string; senior: string}[] = [
  {
    concept: 'ThreadPoolExecutor',
    s30: 'Managed pool: workers pull from a queue; you submit tasks instead of creating threads.',
    s60: 'On execute/submit it tries core workers, then the queue, then max workers, then the rejection handler. That order is why an unbounded queue can hide maxPoolSize.',
    senior:
      'In payments I use an explicit TPE with a bounded queue, Abort→503, named threads, and size concurrency to DB/HTTP pools — not to marketing RPS.',
  },
  {
    concept: 'Rejection',
    s30: 'What happens when the pool is at max and the queue is full.',
    s60: 'Abort throws; CallerRuns runs on caller; Discard drops; DiscardOldest drops the oldest queued. Money paths prefer Abort and loud failure.',
    senior: 'Rejection is a backpressure signal. I map it to 503 and alert on reject rate — I never Discard charges.',
  },
  {
    concept: 'Future',
    s30: 'Handle to an async result: get, cancel, isDone.',
    s60: 'submit wraps work in FutureTask; failures surface as ExecutionException on get. Always use timed get in request paths.',
    senior: 'I treat an unobserved Future as a production bug — silent payment failures.',
  },
  {
    concept: 'CompletableFuture',
    s30: 'Composable async stages with fan-in/out and error handlers.',
    s60: 'Default async stages use commonPool — pass your executor for blocking I/O. Prefer thenCompose over nested CF.',
    senior: 'CF is for pipelines; the executor choice is the production decision.',
  },
  {
    concept: 'Virtual threads',
    s30: 'Cheap JVM threads for lots of blocking concurrency (Java 21).',
    s60: 'Great for high fan-out I/O; do not help CPU-bound work much; still limited by DB pools; watch pinning.',
    senior: 'VT change the threading model, not downstream capacity — I keep bulkheads and pool limits.',
  },
  {
    concept: 'Shutdown',
    s30: 'shutdown drains; shutdownNow interrupts and returns queued tasks.',
    s60: 'Deploy: stop traffic, shutdown, awaitTermination, then shutdownNow if needed. Tasks must honor interrupt.',
    senior: 'Graceful drain plus idempotent charges — that is how we avoid double-pay on deploy retries.',
  },
];

export const TOP20_TRAPS = INTERVIEW_TRAPS.slice(0, 20).map((t) => t.trap);

export const TOP20_PROD = [
  'Payment authorize pool vs DB pool mismatch',
  'FixedThreadPool OOM under Black Friday flood',
  'Cached pool thread explosion on slow gateway',
  'CallerRuns stalling Tomcat during saturation',
  'Report job starving checkout on shared executor',
  'Nested submit+get hang in reconciliation',
  'CF commonPool blocked by JDBC',
  'Kafka async handoff committing early',
  'Duplicate charge after timeout without idempotency',
  'shutdownNow mid-flight without interrupt checks',
  'ThreadLocal tenant leak across workers',
  'Reject spikes after dependency SLO break',
  'maxPoolSize never reached (unbounded queue)',
  'Virtual threads × 20 DB connections illusion',
  'Scheduled reconcile overlapping itself',
  '@Async self-invocation still sync',
  '@Transactional submit to worker',
  'DiscardPolicy losing payment intents',
  'Queue=10k, CPU=30% incident',
  'Retry storm inside workers amplifying outage',
];

export const TOP20_CODE = [
  'Implement TPE with Abort and named threads',
  'Walk core=5 max=10 queue=100 for tasks 1..111',
  'Show execute vs submit exception paths',
  'Write afterExecute that unwraps Future failures',
  'Implement cancel(true)-aware Callable',
  'CF fan-out with allOf + orTimeout + custom executor',
  'Demonstrate nested pool deadlock',
  'TaskDecorator copying MDC',
  'Spring ThreadPoolTaskExecutor bean for payments',
  'Map RejectedExecutionException to 503',
  'Graceful shutdown with awaitTermination',
  'Rejection policy demo (1 worker, queue=1)',
  'Idempotent charge wrapper around submit',
  'Bulkhead: two executors, prove isolation',
  'Fix supplyAsync(jdbc) default pool bug',
  'Bounded queue vs unbounded experiment',
  'Scheduled fixedDelay reconcile',
  'Kafka listener with sync ack vs unsafe async',
  'VirtualThreadPerTaskExecutor + DB pool cap demo',
  'Micrometer gauges for queue/reject',
];

export const TOP10_DESIGN = [
  'Design executor strategy for 20k RPS with DB=100 connections',
  'Isolate payment from reporting in one JVM',
  'Backpressure story from mobile client to DB',
  'Kafka consumer + workers without losing order/commits',
  'Deploy/drain strategy for in-flight payments',
  'When VT vs platform TPE for a bank API',
  'Multi-tenant noisy-neighbor controls via pools',
  'Platform standards: ban Executors factories on ingress',
  'Timeout/retry/CB/executor rejection feedback loop',
  'Observability: which 5 executor metrics are mandatory',
];

export const FIVE_MIN_REVISION: [string, string][] = [
  ['Thread', 'Runs bytecode; expensive if created per request'],
  ['Executor', 'execute(Runnable) — run task somehow'],
  ['ExecutorService', 'submit + shutdown lifecycle'],
  ['ThreadPoolExecutor', 'core → queue → max → reject engine'],
  ['Queue', 'Backpressure buffer — prefer bounded'],
  ['Worker', 'Reused thread looping getTask/run'],
  ['Future', 'Async handle; observe or you go blind'],
  ['CompletableFuture', 'Pipeline; pass your executor'],
  ['ScheduledExecutor', 'Delay/periodic — watch overruns'],
  ['ForkJoinPool', 'CPU work-stealing — not JDBC'],
  ['Virtual Threads', 'Cheap blockers — not extra DB'],
  ['Rejection', 'Saturation policy — Abort for money'],
  ['Backpressure', 'Slow producers before collapse'],
  ['Shutdown', 'Drain then interrupt with budget'],
  ['Monitoring', 'active/queue/reject/latency'],
  ['Bulkhead', 'Separate pools per blast radius'],
];
