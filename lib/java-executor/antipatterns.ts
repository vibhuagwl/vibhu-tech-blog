/** Anti-patterns and memory hooks. */

export type Anti = {
  name: string;
  problem: string;
  why: string;
  impact: string;
  better: string;
};

export const ANTIPATTERNS: Anti[] = [
  {
    name: 'Unbounded queue',
    problem: 'newFixedThreadPool / LinkedBlockingQueue()',
    why: 'Convenience factories',
    impact: 'OOM, multi-second latency before failure',
    better: 'Bounded queue + rejection',
  },
  {
    name: 'Unlimited cached threads',
    problem: 'newCachedThreadPool under slow I/O',
    why: 'SynchronousQueue creates threads freely',
    impact: 'Native OOM / scheduler collapse',
    better: 'Capped max + bounded queue',
  },
  {
    name: 'Huge pool size',
    problem: 'threads=500 "for throughput"',
    why: 'Confusion with concurrency',
    impact: 'Wait on DB; context-switch tax',
    better: 'Size to bottleneck resource',
  },
  {
    name: 'One global executor',
    problem: 'Shared pool for pay/report/notify',
    why: 'Simple wiring',
    impact: 'Noisy neighbor; payment latency',
    better: 'Bulkhead per workload',
  },
  {
    name: 'Ignoring shutdown',
    problem: 'No shutdown on SIGTERM',
    why: 'Forgot lifecycle',
    impact: 'Killed mid-payment; unclear state',
    better: 'shutdown + awaitTermination',
  },
  {
    name: 'Ignoring rejected tasks',
    problem: 'No handler / empty catch',
    why: 'Happy-path coding',
    impact: 'Silent loss or unhandled errors',
    better: 'Abort → 503 + metrics',
  },
  {
    name: 'Swallowing exceptions',
    problem: 'submit without get; execute without handler',
    why: 'Fire-and-forget',
    impact: 'Invisible payment failures',
    better: 'Observe Future / afterExecute',
  },
  {
    name: 'Blocking CF on commonPool',
    problem: 'supplyAsync(jdbc) default',
    why: 'Defaults',
    impact: 'Starves parallelStream/CF globally',
    better: 'Pass paymentExecutor',
  },
  {
    name: 'Nested tasks same small pool',
    problem: 'submit + get on same executor',
    why: 'Naive fan-out',
    impact: 'Pool deadlock',
    better: 'Separate pool or compose async',
  },
  {
    name: 'future.get() everywhere',
    problem: 'Sync wait on async boundary',
    why: 'Easier mental model',
    impact: 'Thread tying; timeouts forgotten',
    better: 'Timeouts; async pipelines',
  },
  {
    name: 'Blind common pool',
    problem: 'ForkJoinPool.commonPool for I/O',
    why: 'parallelStream habit',
    impact: 'App-wide latency coupling',
    better: 'Dedicated executors',
  },
  {
    name: 'ThreadLocal leaks',
    problem: 'Uncleared MDC/tenant',
    why: 'Pool reuse',
    impact: 'Cross-tenant data bleed',
    better: 'finally clear / Scoped Values',
  },
  {
    name: 'No thread naming',
    problem: 'pool-2-thread-7',
    why: 'Default factory',
    impact: 'Slow incidents',
    better: 'Custom ThreadFactory',
  },
  {
    name: 'No monitoring',
    problem: 'No queue/reject metrics',
    why: 'Shipped without SRE hooks',
    impact: 'Surprise saturation',
    better: 'Micrometer binders',
  },
  {
    name: 'No timeout',
    problem: 'get() forever; no client timeout',
    why: 'Optimism',
    impact: 'Stuck workers',
    better: 'get(timeout) + client timeouts',
  },
  {
    name: 'Unbounded retries in workers',
    problem: 'while(true) retry inside task',
    why: 'Resilience without budget',
    impact: 'Amplifies load',
    better: 'Limited retry + jitter + DLQ',
  },
  {
    name: 'Ignore downstream capacity',
    problem: 'Size pool in isolation',
    why: 'Local optimization',
    impact: 'Self-DDoS of DB',
    better: 'End-to-end pool math',
  },
];

export const MEMORY_HOOKS: [string, string][] = [
  ['TPE order', 'Core → Queue → Max → Reject'],
  ['Unbounded queue', 'Max threads never born'],
  ['Worker after task', 'Lives on — takes from queue'],
  ['shutdownNow', 'Interrupt + return queued; not instant death'],
  ['submit vs execute', 'Future captures vs uncaught'],
  ['CallerRuns', 'Backpressure on caller — can stall Tomcat'],
  ['DB vs threads', 'Smallest pool wins'],
  ['Nested get', 'Same pool can deadlock'],
  ['CF default', 'commonPool — pass your executor'],
  ['@Transactional + submit', 'Txn ThreadLocal does not travel'],
  ['@Async self call', 'No proxy → not async'],
  ['Virtual threads', 'Cheap concurrency ≠ infinite DB'],
  ['Bulkhead', 'Separate pools per blast radius'],
  ['Duplicates', 'Retries + no idempotency, not the pool'],
  ['Names', 'payment-worker-N in every dump'],
];

export const TEN_RULES = [
  'Prefer explicit ThreadPoolExecutor over Executors factories for ingress paths.',
  'Bound the queue; define rejection; never silent discard for money.',
  'Size concurrency to the tightest downstream pool.',
  'Name threads; install UncaughtExceptionHandler / afterExecute.',
  'Observe every Future or use execute with guaranteed logging.',
  'Isolate pools (payment / report / notify).',
  'Graceful shutdown with awaitTermination on deploy.',
  'Never block commonPool with JDBC/HTTP.',
  'Clear ThreadLocals; copy MDC/Security into tasks.',
  'Idempotency for every retried side effect.',
];

export const TEN_MISTAKES = [
  'Unbounded FixedThreadPool in public API',
  'Cached pool without cap',
  'maxPoolSize with unbounded queue (dead config)',
  'One mega-executor for the JVM',
  'No shutdown hook',
  'DiscardPolicy on payments',
  'submit-and-forget',
  'Nested submit+get on tiny pool',
  'supplyAsync without executor',
  'ThreadLocal tenant leak',
];

export const TEN_SENIOR_LINES = [
  'We treat the executor as a bulkhead with a bounded queue and explicit rejection mapped to 503.',
  'core fills first; max only after the queue rejects — so unbounded queues hide maxPoolSize.',
  'Pool sizing starts from DB and HTTP connection limits, not from marketing TPS.',
  'CallerRuns is backpressure, not free capacity — it can stall request threads.',
  'shutdownNow is best-effort interrupt; tasks must be interruption-aware.',
  'CompletableFuture without an executor is a latent commonPool footgun.',
  'Spring @Transactional does not propagate to worker threads.',
  'Kafka handoff to executors needs an offset/commit story, or you buy duplicates.',
  'Virtual threads do not remove connection-pool bottlenecks.',
  'Duplicates come from retry semantics; idempotency is mandatory.',
];

export const TEN_DEBUG_QS = [
  'What are activeCount, poolSize, queueDepth, rejected rate?',
  'Is CPU high or low while latency is high?',
  'What are DB pool active/wait metrics?',
  'Thread dump: BLOCKED vs WAITING vs RUNNABLE?',
  'Which executor name owns the stuck threads?',
  'Did rejection start after a deploy or dependency SLO break?',
  'Are we using Executors factory with unbounded queue?',
  'Any nested Future.get on the same pool?',
  'Is CF using commonPool for blocking work?',
  'Are retries amplifying load without jitter/idempotency?',
];

export const CHEAT_ASCII = `                 EXECUTOR FRAMEWORK
                        │
         ┌──────────────┼──────────────┐
         │              │              │
   Task submission   ThreadPool    Lifecycle
   Runnable/Callable  core/max     shutdown
   Future / CF        queue        await
         │              │              │
         └──────┬───────┴──────┬───────┘
                ▼              ▼
           Rejection      Monitoring
           Abort/Caller   queue/reject/latency`;

export const REVISION_30 = [
  '0–5m: Core→Queue→Max→Reject + concrete numbers walk',
  '5–10m: Factory risks (Fixed unbounded, Cached explosion)',
  '10–15m: execute vs submit exceptions; afterExecute',
  '15–20m: Payment sizing vs DB pool; bulkheads',
  '20–25m: Nested deadlock; CF commonPool; @Transactional trap',
  '25–30m: Shutdown diagram; 5 incident scenarios; say 2-min pitch',
];
