/** Hierarchy, factories gap-fill, Executor vs ExecutorService. */

export const HIERARCHY = `Executor
   |
   +-- ExecutorService
          |
          +-- AbstractExecutorService
          |       |
          |       +-- ThreadPoolExecutor
          |       |       |
          |       |       +-- ScheduledThreadPoolExecutor
          |       |
          |       +-- (custom subclasses via hooks)
          |
          +-- ForkJoinPool
          |
          +-- Executors.* wrappers (unconfigurable*, etc.)

Related types (not Executor subtypes)
  Future / FutureTask / RunnableFuture
  CompletableFuture  (Future + CompletionStage)
  ExecutorCompletionService  (CompletionService over an Executor)
  Executors  (static factory — not an Executor itself)`;

export const ABSTRACTION_ROLES: [string, string, string][] = [
  ['Executor', 'execute(Runnable)', 'Fire-and-forget run — no Future, no shutdown API'],
  ['ExecutorService', 'submit / invokeAll / invokeAny / shutdown', 'Lifecycle + Future results'],
  ['ScheduledExecutorService', 'schedule / fixedRate / fixedDelay', 'Delayed and periodic work'],
  ['AbstractExecutorService', 'default submit → FutureTask', 'Shared submit/invoke* scaffolding'],
  ['ThreadPoolExecutor', 'core/queue/max/reject', 'Production workhorse pool'],
  ['ScheduledThreadPoolExecutor', 'DelayedWorkQueue', 'Timers / reconcile / heartbeats'],
  ['ForkJoinPool', 'work-stealing', 'CPU divide-and-conquer; commonPool'],
  ['Executors', 'factories', 'Convenient — often risky defaults'],
  ['Future', 'get / cancel / isDone', 'Async result handle'],
  ['FutureTask', 'RunnableFuture', 'What submit() typically wraps'],
  ['CompletableFuture', 'Future + CompletionStage', 'Composable async pipelines'],
  ['CompletionStage', 'thenApply / thenCompose / …', 'Stage graph API (CF implements it)'],
  ['ExecutorCompletionService', 'submit + take/poll', 'Process tasks as they finish'],
];

export const WHY_EXECUTOR = `Why Executor instead of new Thread() for every job?

1. Cost — creating OS/platform threads is expensive (stack, scheduling)
2. Control — shared queue, bounds, rejection = backpressure
3. Lifecycle — shutdown / awaitTermination vs leaked threads
4. Observability — named pools, metrics, dumps
5. Separation — "what work" (Runnable/Callable) vs "who runs it" (workers)

Executor = the minimal abstraction: run this Runnable somehow.
ExecutorService = production control plane around that idea.`;

export const EXECUTE_VS_SUBMIT_CODE = `import java.util.concurrent.*;

public class ExecuteVsSubmitDemo {
  public static void main(String[] args) throws Exception {
    ExecutorService es = Executors.newFixedThreadPool(2, r -> {
      Thread t = new Thread(r, "demo-worker");
      t.setUncaughtExceptionHandler((th, ex) ->
          System.out.println("UNCAUGHT on " + th.getName() + ": " + ex));
      return t;
    });

    Runnable boom = () -> { throw new RuntimeException("payment failed"); };

    // execute — exception hits UncaughtExceptionHandler (no Future)
    es.execute(boom);
    Thread.sleep(100);

    // submit — exception stored until get()
    Future<?> f = es.submit(boom);
    try {
      f.get();
    } catch (ExecutionException ee) {
      System.out.println("via Future.get: " + ee.getCause());
    }

    // submit Callable — return value
    Future<Integer> ok = es.submit(() -> 42);
    System.out.println("result=" + ok.get());

    es.shutdown();
    es.awaitTermination(2, TimeUnit.SECONDS);
  }
}`;

export const FACTORY_EXTRA: {
  name: string;
  impl: string;
  queue: string;
  threads: string;
  idle: string;
  fail: string;
  use: string;
  danger: string;
  prod: string;
  interview: string;
  code: string;
}[] = [
  {
    name: 'newWorkStealingPool([parallelism])',
    impl: 'ForkJoinPool with target parallelism (default = available processors)',
    queue: 'Per-worker work-stealing queues (FJP)',
    threads: '≈ parallelism (managed by FJP)',
    idle: 'Idle workers steal from others',
    fail: 'Blocking I/O inside tasks can stall the pool',
    use: 'CPU-bound recursive / fork-join style work',
    danger: 'JDBC/HTTP inside — starves stealers',
    prod: 'Prefer explicit ForkJoinPool or TPE for I/O request paths',
    interview: 'How does work stealing differ from a shared BlockingQueue?',
    code: `ExecutorService ws = Executors.newWorkStealingPool();
// or Executors.newWorkStealingPool(8);`,
  },
  {
    name: 'unconfigurableExecutorService(es)',
    impl: 'Delegating wrapper that forbids reconfiguration casts',
    queue: 'Same as delegate',
    threads: 'Same as delegate',
    idle: 'Same as delegate',
    fail: 'Does not change rejection/queue semantics',
    use: 'Hand a pool to plugins without letting them cast+retune',
    danger: 'False sense of safety if delegate itself is unbounded',
    prod: 'Useful for shared platform executors exposed to libraries',
    interview: 'What attack does unconfigurable* prevent?',
    code: `ExecutorService raw = new ThreadPoolExecutor(4, 8, 60, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(100));
ExecutorService safe = Executors.unconfigurableExecutorService(raw);`,
  },
  {
    name: 'unconfigurableScheduledExecutorService(ses)',
    impl: 'Same idea for ScheduledExecutorService',
    queue: 'Delegate DelayedWorkQueue',
    threads: 'Same as delegate',
    idle: 'Same as delegate',
    fail: 'Same as delegate',
    use: 'Expose schedulers without allowing cast to mutate',
    danger: 'Still inherits long-task / exception pitfalls of SES',
    prod: 'Platform heartbeat/reconcile schedulers',
    interview: 'Why wrap before publishing a bean to other modules?',
    code: `ScheduledExecutorService raw = Executors.newScheduledThreadPool(2);
ScheduledExecutorService safe =
    Executors.unconfigurableScheduledExecutorService(raw);`,
  },
  {
    name: 'newSingleThreadScheduledExecutor()',
    impl: 'ScheduledThreadPoolExecutor core=1 (effectively single threaded)',
    queue: 'DelayedWorkQueue',
    threads: 'One worker for delayed/periodic tasks',
    idle: 'Kept for schedules',
    fail: 'One slow periodic task delays others on same executor',
    use: 'Ordered delayed side-effects (single timeline)',
    danger: 'Heavy work inside the only schedule thread',
    prod: 'Offload heavy work to another pool from the scheduled tick',
    interview: 'fixedRate vs fixedDelay on a single-thread scheduler?',
    code: `ScheduledExecutorService s = Executors.newSingleThreadScheduledExecutor(
    r -> new Thread(r, "schedule-1"));`,
  },
];

export const ALLOW_CORE_TIMEOUT = `allowCoreThreadTimeOut(true)
  • By default core workers stay alive even when idle
  • When true, core workers also die after keepAliveTime idle
  • Useful for mostly-idle pools that should release memory

prestartCoreThread() / prestartAllCoreThreads()
  • Create core workers before the first submit
  • Avoids first-request latency of thread creation
  • Common for payment hot paths after deploy warmup`;
