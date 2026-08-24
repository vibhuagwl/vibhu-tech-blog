/** Production design: payment sizing, pools, kafka, spring, architecture. */

export const PAYMENT_DESIGN = `Assumptions
  • 10k RPS peak ingress
  • 20 CPU cores
  • DB pool = 50
  • Payment gateway p50 = 200ms (I/O)
  • Some calls 2s; some fail
  • Kafka for async notify / audit

Thinking (I/O-bound authorize path)
  Concurrent calls ≈ RPS × latency
  10000 × 0.2s = 2000 in-flight if fully sync — TOO HIGH for one service box

Reality: horizontal scale + queueing + timeouts
  Per instance target: e.g. 500 RPS × 0.2s ≈ 100 concurrent gateway calls

Pool sketch (per instance)
  corePoolSize     = 32   // warm workers for steady authorize
  maximumPoolSize  = 64   // burst only when queue full
  queue            = ArrayBlockingQueue(500)  // ~few hundred ms buffer
  rejection        = AbortPolicy → HTTP 503
  keepAlive        = 60s
  threadFactory    = payment-worker-%d
  task timeout     = Future.get(2s) or gateway client timeout 1–2s

WHY not core=200?
  DB pool=50, gateway connections limited — extra threads only wait
  Waiting threads increase context switches and memory

Isolation
  paymentExecutor ≠ reportExecutor ≠ notifyExecutor (bulkhead)`;

export const CPU_IO = `CPU-bound (crypto, pure compute)
  Ideal threads ≈ available cores (sometimes cores+1)
  Extra threads mostly fight for CPU

I/O-bound (DB, HTTP, Kafka produce sync)
  Rough guide: cores × (1 + wait/compute)
  Example: wait 200ms, compute 10ms → factor ~21× cores
  Then CAP by downstream pools — the formula is NOT law

Mixed payment path
  Short CPU validation + long I/O charge
  Size for I/O, but measure; isolate CPU-heavy batch elsewhere

When formula fails
  • Downstream saturated (DB=20) — threads just queue on locks
  • Synchronized bottlenecks / connection pool waits
  • GC / noisy neighbors`;

export const POOL_INTERACT = `Thread pool = 200
DB pool     = 20
        │
        ▼
At most 20 DB ops truly concurrent
180 threads blocked in connection borrow
        │
        ▼
Latency ↑, CPU may look LOW, queue ↑

Also interact with:
  HTTP client max connections
  Kafka producer buffer / max.in.flight
  Tomcat/Jetty request threads
  Semaphore bulkheads

Rule: the SMALLEST pool on the path is the real concurrency limit.`;

export const DEADLOCK_NESTED = `Pool size = 2

T1 runs task that does:
  Future inner = executor.submit(work);
  inner.get();   // waits for worker

T2 does the same.

Queue holds the two inner tasks.
Both workers are blocked in get().
Nothing runs the inners → DEADLOCK / pool starvation.

Fixes
  • Larger pool (fragile)
  • Separate executor for inner work
  • Non-blocking composition (CompletableFuture)
  • Do the work inline
  • ForkJoin for pure CPU recursion (not blocking get)`;

export const SHUTDOWN_PAYMENTS = `Deploy during in-flight payment
  1. K8s SIGTERM
  2. Readiness fail — stop new traffic
  3. executor.shutdown()
  4. awaitTermination(grace)
  5. shutdownNow if needed
  6. Idempotency key on charge — retry safe
  7. DB txn boundaries short — do not hold txn across gateway call
  8. Kafka: commit offsets only after durable side-effect policy

Executor alone does not cause duplicates —
retries without idempotency do.`;

export const MONITORING = `Metrics that matter
  activeCount / poolSize
  queue.size()
  completedTaskCount / taskCount
  rejected (counter)
  task latency histogram
  wait time in queue

Dashboard story
  Active 18 / Pool 20 / Queue 850 / Rejected ↑ / Latency 320ms
  → Downstream slow; workers busy; backlog growing; about to reject

Detect
  Saturation: queue high + active≈max
  Slow dependency: active high, CPU low
  Starvation: nested get + small pool
  Reject spikes: sudden flood or downstream stall`;

export const INCIDENTS: {title: string; clue: string; answer: string}[] = [
  {
    title: 'Scenario 1 — CPU 30%, threads 500, queue 100k, latency 10s',
    clue: 'Low CPU + huge queue',
    answer:
      'I/O wait or lock/pool contention. Threads not CPU-bound. Check DB pool waits, gateway timeouts, thread dump for BLOCKED/WAITING. Shrink pool; bound queue; fix downstream.',
  },
  {
    title: 'Scenario 2 — CPU 95%, pool 20, queue 0',
    clue: 'Hot CPU, empty queue',
    answer:
      'CPU-bound work; pool saturated by compute. Scale horizontally, optimize algorithm, or move to ForkJoin/vectorized work. Raising threads may worsen context switches.',
  },
  {
    title: 'Scenario 3 — DB=50, executor=300',
    clue: 'Mismatch',
    answer:
      'Most workers block borrowing connections. Tail latency explodes. Align executor concurrency with DB pool (+ some slack for non-DB work).',
  },
  {
    title: 'Scenario 4 — RejectedExecutionException spike',
    clue: 'Saturation',
    answer:
      'Check queue depth, activeCount, downstream SLOs, deploy/restart storms, retry amplifiers. Mitigate: shed load, scale, fix slow calls, tune reject→503.',
  },
  {
    title: 'Scenario 5 — Duplicate payments',
    clue: 'Not the pool inventing work',
    answer:
      'Client retries + timeout + at-least-once Kafka + missing idempotency key. Executor reuses threads; it does not replay tasks unless you resubmit. Fix idempotent charge + dedupe store.',
  },
];

export const THREADLOCAL_TRAP = `Request A on payment-worker-1
  ThreadLocal MDC / tenant = customerA
  Task ends — ThreadLocal NOT cleared
Request B reuses payment-worker-1
  Still sees customerA → data leak / wrong tenant

Fix: try/finally clear ThreadLocal; prefer Scoped Values (Java 21+);
propagate context explicitly into task closures.`;

export const VIRTUAL_THREADS = `Platform threads: scarce OS threads, map 1:1 to carriers
Virtual threads (Java 21): cheap, many; unmount on blocking I/O

Executors.newVirtualThreadPerTaskExecutor()
  Great for high-concurrency blocking I/O fan-out
  Does NOT remove DB pool limits — 100k VT still share 50 connections
  CPU-bound: little win; pinning / synchronized can hold carrier

Migrate payments carefully:
  Measure; keep bulkheads; watch JDBC drivers & ThreadLocal.`;

export const FJP = `ForkJoinPool — work-stealing for CPU divide-and-conquer
  Fork tasks, join results; idle workers steal from others
  commonPool used by parallelStream & default CF

Do NOT:
  Block on JDBC inside FJP tasks
  Use as general request thread pool for payments

ThreadPoolExecutor — better for mixed I/O request handling.`;

export const KAFKA_EXECUTOR = `Topic partitions → consumer threads (ordering per partition)
        │
        ▼
If you hand off to ExecutorService:
  • Offset commit timing vs async completion — easy duplicates/loss
  • Rebalance while tasks still running
  • Partition order broken if many workers per partition
  • Backpressure: consumer poll vs unbounded handoff queue

Safer patterns
  • Concurrency ≈ partitions for ordered processing
  • Or pause/resume consumer based on queue depth
  • Commit after task success (sync) or careful async commit
  • DLQ for poison messages
  • Idempotent business handling always`;

export const TX_ASYNC = `@Transactional
public void process() {
  executor.submit(() -> repo.save(...)); // DANGER
}

Spring txn is ThreadLocal-bound to the caller thread.
Worker thread has NO transaction / EntityManager.
save may auto-commit separately or fail oddly.

Also broken: SecurityContext, MDC unless copied.

Fix: do DB work on the transactional thread;
or open a new transaction inside the worker (@Transactional on a Spring bean called from worker).`;

export const ASYNC_SPRING = `@Async on process()
  → Spring proxy intercepts
  → submits to TaskExecutor (default SimpleAsyncTaskExecutor unless configured!)
  → self-invocation (this.process()) BYPASSES proxy — not async

Configure ThreadPoolTaskExecutor with names, bounds, rejection.
Return CompletableFuture for composition.
Exceptions: AsyncUncaughtExceptionHandler for void methods.

Prefer explicit Executor bean injection for clarity in payment code.`;

export const FULL_ARCH = `                 API Gateway
                      │
                      ▼
               Payment Service
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
  paymentExecutor  notifyExec   reportExec
         │            │            │
         ▼            ▼            ▼
    PostgreSQL      Kafka        Analytics
    (pool 50)     (async)         DB
         │
         ▼
  Payment Gateway (HTTP pool)
         │
         ▼
    Redis idempotency keys

Policies
  • Idempotency-Key header → Redis/DB unique
  • Timeout + circuit breaker on gateway
  • Retry with jitter, max attempts, only technical errors
  • DLQ topic for exhausted retries
  • Micrometer: pool metrics + RED
  • Graceful shutdown drain`;

export const BULKHEAD = `                 Application
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
  Payment Pool   Report Pool   Notify Pool
        │            │            │
        ▼            ▼            ▼
       DB         Warehouse      Email

If reports enqueue 100k tasks on a SHARED pool,
payment authorize latency dies.

Separate executors = bulkhead: blast radius contained.`;
