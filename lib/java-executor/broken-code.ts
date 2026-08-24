/** Broken-code interview drills: bad → what goes wrong → fix. */

export type BrokenExample = {
  id: string;
  title: string;
  bad: string;
  ask: string;
  runtime: string;
  fix: string;
  why: string;
  hook: string;
};

export const BROKEN_EXAMPLES: BrokenExample[] = [
  {
    id: 'be1',
    title: 'Flooding FixedThreadPool (unbounded queue)',
    bad: `ExecutorService executor = Executors.newFixedThreadPool(10);
for (int i = 0; i < 10_000_000; i++) {
  executor.submit(() -> processPayment());
}`,
    ask: 'What happens under this submit storm?',
    runtime: `FixedThreadPool
     ↓
unbounded LinkedBlockingQueue
     ↓
millions of FutureTask objects
     ↓
heap pressure → long GC → latency
     ↓
OOM / container kill
     ↓
in-flight payments unclear`,
    fix: `ThreadPoolExecutor executor = new ThreadPoolExecutor(
    10, 20, 60, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(1000),
    namedFactory("payment-worker-"),
    new ThreadPoolExecutor.AbortPolicy());

for (int i = 0; i < n; i++) {
  try {
    executor.execute(() -> processPayment());
  } catch (RejectedExecutionException ex) {
    metrics.rejected();
    respond503(); // backpressure to client
  }
}`,
    why: 'Bounded queue + Abort turns overload into a controlled 503 instead of silent memory death.',
    hook: 'FixedThreadPool = fixed workers + unbounded queue bomb.',
  },
  {
    id: 'be2',
    title: 'Nested submit + get on the same small pool',
    bad: `ExecutorService executor = Executors.newFixedThreadPool(2);
executor.submit(() -> {
  Future<?> future = executor.submit(() -> process());
  future.get(); // waits for a worker that may never free
});`,
    ask: 'Why can this hang forever?',
    runtime: `Pool=2 workers both run outer tasks
Outer tasks each submit inner + get()
Inners sit in queue — no free worker
Workers blocked in get() → pool starvation / deadlock-like hang`,
    fix: `// Prefer: do work inline, OR use a second executor for fan-out,
// OR compose with CompletableFuture without blocking the pool worker.
CompletableFuture
  .supplyAsync(() -> process(), workerPool)
  .thenAccept(this::persist);`,
    why: 'Never block a pool worker waiting for another task on the same saturated pool.',
    hook: 'Same-pool submit+get = self-deadlock risk.',
  },
  {
    id: 'be3',
    title: 'CachedThreadPool under uncontrolled traffic',
    bad: `ExecutorService executor = Executors.newCachedThreadPool();
// every HTTP request:
executor.submit(() -> callSlowGateway(req));`,
    ask: 'What explodes?',
    runtime: `SynchronousQueue (no storage)
     ↓
busy? create another thread (max ≈ Integer.MAX_VALUE)
     ↓
slow gateway → thousands of platform threads
     ↓
native memory / scheduling collapse`,
    fix: `new ThreadPoolExecutor(
  16, 64, 60, TimeUnit.SECONDS,
  new ArrayBlockingQueue<>(500),
  namedFactory("gw-"),
  new ThreadPoolExecutor.AbortPolicy());`,
    why: 'Cap concurrency to what the gateway and heap can survive.',
    hook: 'Cached = thread-per-busy-task until the machine dies.',
  },
  {
    id: 'be4',
    title: 'CallerRunsPolicy on HTTP request threads',
    bad: `new ThreadPoolExecutor(..., new ThreadPoolExecutor.CallerRunsPolicy());
// Tomcat thread calls executor.execute(paymentTask) when saturated`,
    ask: 'Where does the work run?',
    runtime: `Pool + queue full
     ↓
CallerRuns → Tomcat/Netty thread runs payment
     ↓
request thread blocked on DB/gateway
     ↓
accept queue backs up → site-wide latency`,
    fix: `// Prefer AbortPolicy → map RejectedExecutionException to 503
// If CallerRuns: isolate so caller is NOT the public request thread
// (e.g. an admission thread), and measure request-thread time.`,
    why: 'CallerRuns is backpressure, not free capacity — it can stall the edge.',
    hook: 'CallerRuns pushes work into whoever submitted.',
  },
  {
    id: 'be5',
    title: 'future.get() without timeout',
    bad: `Future<PaymentResult> f = executor.submit(() -> charge(req));
PaymentResult r = f.get(); // may block forever`,
    ask: 'What if the gateway never returns?',
    runtime: `Caller thread waits indefinitely
     ↓
request thread / worker stuck
     ↓
pool / Tomcat exhaustion
     ↓
cascading timeouts elsewhere`,
    fix: `try {
  return f.get(2, TimeUnit.SECONDS);
} catch (TimeoutException te) {
  f.cancel(true); // best-effort interrupt
  metrics.timeout();
  throw new PaymentTimeoutException(te);
}`,
    why: 'Timeouts bound blast radius; cancel(true) only helps if the task honors interrupt.',
    hook: 'get() without timeout = unbounded wait.',
  },
  {
    id: 'be6',
    title: 'shutdown() without understanding the queue',
    bad: `executor.shutdown();
// process exits immediately`,
    ask: 'What about queued and running tasks?',
    runtime: `shutdown() rejects NEW submits
Running + queued tasks may still be in flight
Process exit / kill → mid-payment cut
Unclear ledger / gateway state`,
    fix: `executor.shutdown();
if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
  List<Runnable> leftover = executor.shutdownNow();
  log.warn("Interrupted {} queued tasks", leftover.size());
}`,
    why: 'Drain with a budget; then interrupt; rely on idempotency for retries.',
    hook: 'shutdown ≠ wait — always awaitTermination.',
  },
  {
    id: 'be7',
    title: 'shutdownNow() mid payment',
    bad: `// on SIGTERM
executor.shutdownNow();`,
    ask: 'Do payments stop instantly?',
    runtime: `Workers interrupted
Tasks that ignore interrupt keep running
Queued tasks returned — never started
Partial debit without gateway confirm possible if code is careless`,
    fix: `// Prefer: readiness fail → shutdown() → await → shutdownNow as last resort
// Inside tasks: check Thread.interrupted(); short DB tx; idempotent charge`,
    why: 'shutdownNow is best-effort interrupt, not a kill -9 for business logic.',
    hook: 'shutdownNow asks nicely via interrupt — code must listen.',
  },
  {
    id: 'be8',
    title: 'One shared executor for everything',
    bad: `@Bean
ExecutorService appExecutor() {
  return Executors.newFixedThreadPool(50); // payment+report+email+kafka
}`,
    ask: 'What is the noisy-neighbor failure?',
    runtime: `Report job submits 100k tasks
     ↓
Shared queue fills
     ↓
Payment authorize waits / rejects
     ↓
Customer checkout breaks while batch runs`,
    fix: `@Bean("paymentExecutor") ThreadPoolTaskExecutor payment...
@Bean("reportExecutor") ThreadPoolTaskExecutor report...
@Bean("notifyExecutor") ThreadPoolTaskExecutor notify...`,
    why: 'Bulkheads contain blast radius — separate pools per SLO class.',
    hook: 'Shared pool = shared outage.',
  },
  {
    id: 'be9',
    title: 'Huge pool because CPU is low',
    bad: `// CPU=25%, latency high → "add threads"
executor.setMaximumPoolSize(500);
executor.setCorePoolSize(500);`,
    ask: 'Why can this make things worse?',
    runtime: `Low CPU often means WAITING on DB/HTTP
More threads → more waiters on same 20 connections
Context switches ↑, memory ↑, latency may worsen`,
    fix: `// Diagnose: thread dump + DB pool wait + queue depth
// Fix downstream or reduce concurrency to match DB/HTTP pools`,
    why: 'Low CPU is a clue of I/O wait, not a license for 500 threads.',
    hook: 'Low CPU + high latency ≠ need more threads.',
  },
  {
    id: 'be10',
    title: 'CompletableFuture without an executor',
    bad: `CompletableFuture.supplyAsync(() -> jdbc.findCustomer(id))
  .thenCombine(
    CompletableFuture.supplyAsync(() -> http.fetchScore(id)),
    this::merge);`,
    ask: 'Which pool runs this?',
    runtime: `ForkJoinPool.commonPool()
     ↓
Blocking JDBC/HTTP occupies common workers
     ↓
parallelStream / other CF stages starve JVM-wide`,
    fix: `CompletableFuture.supplyAsync(() -> jdbc.findCustomer(id), ioExecutor)
  .thenCombine(
    CompletableFuture.supplyAsync(() -> http.fetchScore(id), ioExecutor),
    this::merge);`,
    why: 'Always pass a dedicated executor for blocking work.',
    hook: 'supplyAsync() default = commonPool footgun.',
  },
  {
    id: 'be11',
    title: 'DiscardPolicy on payments',
    bad: `new ThreadPoolExecutor(..., new ThreadPoolExecutor.DiscardPolicy());`,
    ask: 'What happens to the customer intent?',
    runtime: `Saturation → task silently dropped
No exception to caller
Payment never attempted — looks like success path skipped
Compliance / money risk`,
    fix: `AbortPolicy + RejectedExecutionException → HTTP 503 + metrics
Never silent discard for money movement`,
    why: 'Money paths need loud failure, not quiet loss.',
    hook: 'Discard on payments = lost money intents.',
  },
  {
    id: 'be12',
    title: '@Transactional + submit to executor',
    bad: `@Transactional
public void pay(PaymentRequest req) {
  executor.submit(() -> ledger.debit(req)); // worker thread
}`,
    ask: 'Is the debit in the same transaction?',
    runtime: `Spring txn is ThreadLocal on the caller
Worker has no EntityManager/txn
debit may auto-commit separately or fail oddly
Rollback on caller does not undo worker work`,
    fix: `// Do DB work on the transactional thread, OR
@Transactional
public void debitInWorker(PaymentRequest req) { ledger.debit(req); }

executor.submit(() -> debitService.debitInWorker(req));`,
    why: 'Transaction and SecurityContext do not ride along unless you design for it.',
    hook: 'Txn ThreadLocal stops at the submit boundary.',
  },
  {
    id: 'be13',
    title: 'Ignoring interrupt after cancel(true)',
    bad: `public void call() {
  while (true) {
    gateway.charge(); // ignores interrupt
  }
}`,
    ask: 'Does future.cancel(true) stop this?',
    runtime: `cancel(true) → thread.interrupt()
Task never checks interrupted flag / blocked in uninterruptible I/O
Task keeps running → cancel is a no-op for business`,
    fix: `public PaymentResult call() throws Exception {
  while (!Thread.currentThread().isInterrupted()) {
    if (done) return result;
    step(); // use interruptible APIs where possible
  }
  throw new InterruptedException("cancelled");
}`,
    why: 'Interruption is cooperative — your code must participate.',
    hook: 'cancel(true) only works if the task listens.',
  },
  {
    id: 'be14',
    title: 'Unbounded retries inside worker tasks',
    bad: `executor.submit(() -> {
  while (true) {
    try { gateway.charge(req); return; }
    catch (Exception e) { /* retry forever */ }
  }
});`,
    ask: 'What happens when the gateway is down?',
    runtime: `Workers stuck in retry storms
Queue backs up
Retries amplify load
Outage lasts longer`,
    fix: `// Limited attempts + jitter + give up to DLQ / customer retry
RetryPolicy.ofMaxAttempts(3).withBackoff(50, 500, ChronoUnit.MILLIS);`,
    why: 'Retries need budgets; otherwise workers become amplifiers.',
    hook: 'Unbounded retry inside pool = self-DDoS.',
  },
  {
    id: 'be15',
    title: 'maxPoolSize with unbounded queue (dead config)',
    bad: `new ThreadPoolExecutor(
  8, 64, 60, TimeUnit.SECONDS,
  new LinkedBlockingQueue<>() // unbounded
);`,
    ask: 'When do threads 9–64 get created?',
    runtime: `offer() always succeeds
     ↓
max path NEVER taken
     ↓
pool stays at 8 forever while queue grows without bound
     ↓
"We set max=64" — false safety`,
    fix: `new ArrayBlockingQueue<>(200) // or LinkedBlockingQueue(200)
// Now when queue is full, workers grow toward max, then reject`,
    why: 'Remember: core → queue → max. Unbounded queue skips max.',
    hook: 'Unbounded queue makes maximumPoolSize a lie.',
  },
];
