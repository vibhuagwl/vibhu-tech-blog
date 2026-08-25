/** 15 coding interview problems with full solutions. */

export type CodingProblem = {
  id: string;
  title: string;
  statement: string;
  naive: string;
  solution: string;
  code: string;
  why: string;
  complexity: string;
  production: string;
  followUps: string[];
};

export const CODING_PROBLEMS: CodingProblem[] = [
  {
    id: 'p1',
    title: 'Collect results from 10 concurrent tasks',
    statement: 'Run 10 Callables concurrently and return List of results in input order.',
    naive: 'new Thread per task + join — no bounds, hard lifecycle.',
    solution: 'invokeAll on a bounded pool; get each Future in order.',
    code: `List<Callable<Integer>> tasks = IntStream.range(0, 10)
    .mapToObj(i -> (Callable<Integer>) () -> i * i)
    .toList();
ExecutorService pool = Executors.newFixedThreadPool(4);
try {
  List<Future<Integer>> fs = pool.invokeAll(tasks);
  List<Integer> out = new ArrayList<>();
  for (Future<Integer> f : fs) out.add(f.get(1, TimeUnit.SECONDS));
  return out;
} finally {
  pool.shutdown();
}`,
    why: 'invokeAll preserves input order of Futures and centralizes waiting.',
    complexity: 'Time ~ max task latency with parallelism 4; space O(n) Futures',
    production: 'Bound pool; timeouts on get; handle ExecutionException per task.',
    followUps: ['Completion order instead?', 'Partial failure policy?'],
  },
  {
    id: 'p2',
    title: 'First successful response of 3 services',
    statement: 'Call primary + 2 replicas; return first success; cancel others.',
    naive: 'anyOf — may surface first failure.',
    solution: 'invokeAny on ExecutorService.',
    code: `String body = executor.invokeAny(List.of(
    () -> http.get(primary),
    () -> http.get(replica1),
    () -> http.get(replica2)), 500, TimeUnit.MILLISECONDS);`,
    why: 'invokeAny means first successful Callable, not first completion.',
    complexity: 'Latency ≈ fastest success; work wasted on losers',
    production: 'Idempotent GETs; budget cancellations; distinct timeouts.',
    followUps: ['How is this different from anyOf?', 'POST safety?'],
  },
  {
    id: 'p3',
    title: 'Aggregate 3 services concurrently',
    statement: 'Fan-out customer/account/tx; build DTO.',
    naive: 'Sequential calls — latency sum.',
    solution: 'allOf + join with dedicated executor.',
    code: `var c = CompletableFuture.supplyAsync(customer::get, io);
var a = CompletableFuture.supplyAsync(account::get, io);
var t = CompletableFuture.supplyAsync(tx::list, io);
return CompletableFuture.allOf(c, a, t)
    .thenApply(v -> new Dto(c.join(), a.join(), t.join()))
    .orTimeout(1, TimeUnit.SECONDS)
    .join();`,
    why: 'Independent calls overlap; timeout bounds the aggregate.',
    complexity: 'Latency ≈ max of three + combine',
    production: 'Per-call exceptionally fallbacks; MDC copy.',
    followUps: ['Partial degrade design?', 'Bulkhead per client?'],
  },
  {
    id: 'p4',
    title: 'Timeout + fallback',
    statement: 'Payment call must answer in 2s or return fallback.',
    naive: 'get() forever.',
    solution: 'completeOnTimeout or orTimeout+exceptionally.',
    code: `return CompletableFuture
    .supplyAsync(() -> gateway.charge(req), paymentExecutor)
    .completeOnTimeout(PaymentResult.fallback(), 2, TimeUnit.SECONDS)
    .join();`,
    why: 'completeOnTimeout succeeds with default; orTimeout fails the stage.',
    complexity: 'O(1) stages',
    production: 'Still cancel/abandon slow call; idempotency on retry.',
    followUps: ['When prefer orTimeout?', 'How to cancel the slow charge?'],
  },
  {
    id: 'p5',
    title: 'Retry with CompletableFuture',
    statement: 'Retry technical failures up to 3 times with backoff.',
    naive: 'while(true) inside worker — can pin the pool.',
    solution: 'Recursive exceptionally + delayedExecutor; limited attempts.',
    code: `CompletableFuture<T> attempt(Supplier<T> op, Executor exec, int left) {
  return CompletableFuture.supplyAsync(op::get, exec)
      .exceptionallyCompose(ex -> {
        if (left <= 1 || !isRetryable(ex))
          return CompletableFuture.failedFuture(ex);
        Executor delay = CompletableFuture.delayedExecutor(50L * (4 - left),
            TimeUnit.MILLISECONDS, exec);
        return attempt(op, delay, left - 1);
      });
}`,
    why: 'Keeps retries async; attempt budget prevents storms.',
    complexity: 'Up to N attempts; backoff delays',
    production: 'Jitter; only technical errors; idempotency key.',
    followUps: ['Where does Resilience4j fit?', 'Retry + CB interaction?'],
  },
  {
    id: 'p6',
    title: 'Bounded executor with backpressure',
    statement: 'Ingress must not OOM under flood.',
    naive: 'newFixedThreadPool — unbounded queue.',
    solution: 'Explicit TPE + ArrayBlockingQueue + Abort→503.',
    code: `ThreadPoolExecutor pool = new ThreadPoolExecutor(
    16, 32, 60, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(500),
    r -> new Thread(r, "api-worker"),
    new ThreadPoolExecutor.AbortPolicy());
try {
  pool.execute(task);
} catch (RejectedExecutionException ex) {
  respond503();
}`,
    why: 'CORE→QUEUE→MAX→REJECT turns overload into controlled shed.',
    complexity: 'Capacity = max + queue',
    production: 'Metrics on reject; align with DB pool.',
    followUps: ['CallerRuns trade-offs?', 'Queue size as latency knob?'],
  },
  {
    id: 'p7',
    title: 'Custom RejectedExecutionHandler',
    statement: 'Log + metric + optional caller path.',
    naive: 'Empty catch of RejectedExecutionException.',
    solution: 'Custom handler with observability.',
    code: `RejectedExecutionHandler handler = (r, ex) -> {
  metrics.increment("executor.rejected");
  log.warn("rejected {}", r);
  throw new RejectedExecutionException("saturated");
};`,
    why: 'Centralizes saturation policy next to the pool.',
    complexity: 'O(1)',
    production: 'Never Discard for money; map to API errors.',
    followUps: ['DiscardOldest ever OK?', 'Combine with rate limit?'],
  },
  {
    id: 'p8',
    title: 'Named ThreadFactory',
    statement: 'Threads must be searchable in dumps.',
    naive: 'Default pool-N-thread-M names.',
    solution: 'Atomic counter + UncaughtExceptionHandler.',
    code: `AtomicInteger seq = new AtomicInteger();
ThreadFactory tf = r -> {
  Thread t = new Thread(r, "payment-worker-" + seq.incrementAndGet());
  t.setUncaughtExceptionHandler((th, ex) -> log.error(th.getName(), ex));
  return t;
};`,
    why: 'Ops speed during incidents depends on names.',
    complexity: 'O(1)',
    production: 'Non-daemon for request pools; clear MDC in afterExecute.',
    followUps: ['Daemon threads on shutdown?', 'Priority settings?'],
  },
  {
    id: 'p9',
    title: 'Graceful shutdown',
    statement: 'Drain in-flight payments on deploy.',
    naive: 'shutdownNow immediately.',
    solution: 'shutdown → await → shutdownNow leftover.',
    code: `pool.shutdown();
if (!pool.awaitTermination(30, TimeUnit.SECONDS)) {
  List<Runnable> left = pool.shutdownNow();
  log.warn("dropped queued={}", left.size());
}`,
    why: 'Gives running work a chance; interrupt is last resort.',
    complexity: 'Wall-clock = grace budget',
    production: 'Fail readiness first; idempotent charges.',
    followUps: ['What does shutdownNow return?', 'Interrupt cooperation?'],
  },
  {
    id: 'p10',
    title: 'Process as completed (CompletionService)',
    statement: 'Handle results in finish order.',
    naive: 'invokeAll then iterate — waits for slowest first.',
    solution: 'ExecutorCompletionService.take() loop.',
    code: `ExecutorCompletionService<String> ecs = new ExecutorCompletionService<>(pool);
tasks.forEach(ecs::submit);
for (int i = 0; i < tasks.size(); i++) {
  System.out.println(ecs.take().get());
}`,
    why: 'Completion queue delivers early finishers immediately.',
    complexity: 'Same work; better time-to-first-result handling',
    production: 'Cancel stragglers after enough successes if allowed.',
    followUps: ['poll vs take?', 'Ordering guarantees?'],
  },
  {
    id: 'p11',
    title: 'Priority task execution',
    statement: 'VIP jobs before batch.',
    naive: 'Separate ad-hoc threads.',
    solution: 'PriorityBlockingQueue + Comparable tasks (note unbounded).',
    code: `record Job(int priority, Runnable action) implements Runnable, Comparable<Job> {
  public void run() { action.run(); }
  public int compareTo(Job o) { return Integer.compare(o.priority, priority); }
}
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    2, 2, 0, TimeUnit.SECONDS, new PriorityBlockingQueue<>());
pool.execute(new Job(10, this::vip));
pool.execute(new Job(1, this::batch));`,
    why: 'Queue order becomes priority order; watch unbounded growth.',
    complexity: 'log n offer/poll',
    production: 'Prefer bounded + two pools (bulkhead) over unbounded priority.',
    followUps: ['Starvation of low priority?', 'Fairness needs?'],
  },
  {
    id: 'p12',
    title: 'Custom TPE with metrics hooks',
    statement: 'Record task latency and failures.',
    naive: 'Only count submit calls.',
    solution: 'Subclass beforeExecute/afterExecute; unwrap Future errors.',
    code: `// See MetricsThreadPoolExecutor in hooks section
@Override protected void afterExecute(Runnable r, Throwable t) { /* unwrap Future */ }`,
    why: 'afterExecute sees execute() throwables; submit needs Future.get unwrap.',
    complexity: 'O(1) per task',
    production: 'Histograms + reject counters + queue gauge.',
    followUps: ['Why Future caveat?', 'terminated() use?'],
  },
  {
    id: 'p13',
    title: 'Prevent pool starvation',
    statement: 'Avoid nested submit+get on same small pool.',
    naive: 'executor.submit(() -> other.get()).',
    solution: 'Compose async or use a second pool / run inline.',
    code: `// BAD
pool.submit(() -> pool.submit(work).get());
// GOOD
CompletableFuture.supplyAsync(work, pool).thenAccept(this::save);`,
    why: 'Workers blocked waiting for the same pool cannot run dependents.',
    complexity: 'N/A — correctness',
    production: 'Code review rule: no blocking get on same pool.',
    followUps: ['Show deadlock with pool=2', 'VT change anything?'],
  },
  {
    id: 'p14',
    title: 'Concurrent batch processing',
    statement: 'Process 1M rows without queueing 1M tasks.',
    naive: 'submit per row.',
    solution: 'Page reads; submit page Callables; checkpoint.',
    code: `for (List<Row> page : reader.pages(5000)) {
  futures.add(batchPool.submit(() -> processPage(page)));
  if (futures.size() >= 32) {
    for (Future<?> f : futures) f.get();
    futures.clear();
    checkpoint();
  }
}`,
    why: 'Bounds in-flight pages and memory.',
    complexity: 'Throughput ≈ pages × workers',
    production: 'Partial failure per row; graceful drain on shutdown.',
    followUps: ['CallerRuns as producer backpressure?', 'Exactly-once?'],
  },
  {
    id: 'p15',
    title: 'Concurrent API aggregator',
    statement: 'Design GET /customer/{id} fan-out with timeouts and fallbacks.',
    naive: 'Sequential RestTemplate calls.',
    solution: 'CF allOf + dedicated io executor + per-leg exceptionally.',
    code: `// See CustomerAggregator in CompletableFuture section`,
    why: 'Overlaps independent I/O; degrades instead of failing hard.',
    complexity: 'Latency ≈ max leg + combine',
    production: 'Bulkheads per dependency; correlation ID; Abort on saturation.',
    followUps: ['How to load-test?', 'Circuit breaker placement?'],
  },
];
