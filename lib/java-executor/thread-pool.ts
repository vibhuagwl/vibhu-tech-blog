/** ThreadPoolExecutor params, algorithm, queues, factories, rejection. */

export type ParamCard = {
  name: string;
  controls: string;
  why: string;
  tooSmall: string;
  tooLarge: string;
  production: string;
  fintech: string;
  interviewQ: string;
};

export const TPE_PARAMS: ParamCard[] = [
  {
    name: 'corePoolSize',
    controls: 'Minimum kept-alive workers (unless allowCoreThreadTimeOut)',
    why: 'Steady-state concurrency for typical load',
    tooSmall: 'Queue grows; latency spikes under normal traffic',
    tooLarge: 'Idle threads waste stack; more context switches',
    production: 'Start from measured concurrent I/O / CPU need',
    fintech: 'Payment authorize path: often ~ cores×(1+wait/service) capped by DB pool',
    interviewQ: 'When does corePoolSize create a thread vs queue the task?',
  },
  {
    name: 'maximumPoolSize',
    controls: 'Hard cap on workers — ONLY used when queue is full',
    why: 'Burst capacity after backlog fills',
    tooSmall: 'Rejects early under spike',
    tooLarge: 'Thundering herd on DB/HTTP when queue fills',
    production: 'Must respect downstream pools',
    fintech: 'Never max=500 if DB pool=50',
    interviewQ: 'Why can max be ignored forever with an unbounded queue?',
  },
  {
    name: 'keepAliveTime + unit',
    controls: 'How long excess (>core) idle workers live',
    why: 'Shrink after bursts',
    tooSmall: 'Thrash create/destroy on oscillating load',
    tooLarge: 'Hold extra threads after traffic drops',
    production: '60s is a common starting point for excess workers',
    fintech: 'End-of-day spike then quiet — reclaim memory',
    interviewQ: 'Do core threads time out by default?',
  },
  {
    name: 'workQueue',
    controls: 'Where tasks wait before a worker picks them',
    why: 'Backpressure and burst absorption',
    tooSmall: 'Hits max/reject quickly',
    tooLarge: 'Unbounded → latency + OOM under flood',
    production: 'Prefer bounded ArrayBlockingQueue / LinkedBlockingQueue(cap)',
    fintech: '10M payment submits into unbounded queue = GC death',
    interviewQ: 'Array vs Linked vs SynchronousQueue trade-offs?',
  },
  {
    name: 'threadFactory',
    controls: 'How threads are created (name, daemon, handler)',
    why: 'Ops visibility in dumps and logs',
    tooSmall: 'N/A',
    tooLarge: 'N/A',
    production: 'Always name: payment-worker-%d',
    fintech: 'Splunk filter by thread name during incident',
    interviewQ: 'Why are default pool thread names a production smell?',
  },
  {
    name: 'handler (RejectedExecutionHandler)',
    controls: 'Policy when saturated (at max + full queue)',
    why: 'Fail loudly, shed, or apply backpressure',
    tooSmall: 'N/A',
    tooLarge: 'N/A',
    production: 'AbortPolicy default; CallerRuns = caller-thread backpressure',
    fintech: 'Payments: often Abort + HTTP 503; never silent Discard',
    interviewQ: 'When is CallerRunsPolicy dangerous?',
  },
];

export const EXECUTE_TREE = `executor.execute(task) / submit → execute(FutureTask)

Task arrives
      │
      ▼
workerCount < corePoolSize ?
   YES ──► create Worker, start thread, run task
   NO
      │
      ▼
workQueue.offer(task) succeeds ?
   YES ──► task waits in queue (may still create worker if raced to 0)
   NO  (queue full / SynchronousQueue reject)
      │
      ▼
workerCount < maximumPoolSize ?
   YES ──► create extra Worker
   NO  ──► rejectedExecution(handler)

CRITICAL: max threads are created ONLY after the queue refuses the task.
Unbounded queue ⇒ offer always succeeds ⇒ maxPoolSize NEVER used.`;

export const CONCRETE_WALK = `Config: core=5, max=10, queueCapacity=100 (ArrayBlockingQueue)

Submit #1–#5   → create workers W1–W5 (below core). Pool=5, queue=0
Submit #6      → queue.offer OK. Pool=5, queue=1
Submit #50     → still queue. Pool=5, queue=45
Submit #100    → queue has 95… continue filling
Submit #105    → when queue hits 100, next offer fails
                 → create W6 (max path). Pool=6, queue=100
Submit #110    → keep creating until Pool=10, queue=100
Submit #111+   → reject (AbortPolicy → RejectedExecutionException)

Counts at saturation: 10 workers + 100 queued = 110 in-flight capacity.`;

export const QUEUE_TABLE: [string, string, string][] = [
  ['ArrayBlockingQueue(n)', 'Bounded, array-backed, fair optional', 'Default choice for backpressure'],
  ['LinkedBlockingQueue(n)', 'Bounded if capacity set; else Integer.MAX_VALUE', 'newFixedThreadPool uses UNBOUNDED — danger'],
  ['SynchronousQueue', 'No capacity — handoff only', 'newCachedThreadPool; forces create or reject'],
  ['PriorityBlockingQueue', 'Priority order, unbounded', 'Job priority; watch growth'],
  ['DelayQueue', 'Delay until trigger time', 'Delayed retries / schedules'],
];

export const UNBOUNDED_DANGER = `10M payment requests
        │
        ▼
Executors.newFixedThreadPool(8)   // LinkedBlockingQueue unbounded
        │
        ▼
Queue grows without bound
        │
        ▼
Heap pressure → long GC → p99 latency
        │
        ▼
OOM / container kill
        │
        ▼
In-flight payments unclear → duplicates on retry

Fix: explicit ThreadPoolExecutor + bounded queue + rejection → 503.`;

export const FACTORIES: {
  name: string;
  impl: string;
  queue: string;
  threads: string;
  risk: string;
  whenOk: string;
  whenNot: string;
}[] = [
  {
    name: 'newFixedThreadPool(n)',
    impl: 'TPE core=max=n',
    queue: 'LinkedBlockingQueue UNBOUNDED',
    threads: 'Exactly n workers',
    risk: 'Silent queue bomb under flood',
    whenOk: 'Trusted bounded producers, short tasks',
    whenNot: 'Public APIs / payment ingress',
  },
  {
    name: 'newCachedThreadPool()',
    impl: 'core=0 max=Integer.MAX_VALUE',
    queue: 'SynchronousQueue',
    threads: 'Creates thread per task if busy',
    risk: 'Thread explosion under slow I/O',
    whenOk: 'Short bursty fan-out with hard upstream limit',
    whenNot: 'Untrusted load, DB-bound work',
  },
  {
    name: 'newSingleThreadExecutor()',
    impl: 'core=max=1',
    queue: 'Unbounded LinkedBlockingQueue',
    threads: 'One worker, sequential',
    risk: 'Same unbounded queue; single point of latency',
    whenOk: 'Ordered side-effects (audit writer)',
    whenNot: 'High TPS main path',
  },
  {
    name: 'newScheduledThreadPool(n)',
    impl: 'ScheduledThreadPoolExecutor',
    queue: 'DelayedWorkQueue',
    threads: 'n for delayed/periodic',
    risk: 'Long tasks delay subsequent schedules',
    whenOk: 'Reconcile every 5 min, heartbeats',
    whenNot: 'Heavy batch inside the schedule thread',
  },
];

export const REJECTION_POLICIES: {
  name: string;
  behavior: string;
  payments: string;
  trading: string;
  reports: string;
  notify: string;
  audit: string;
  batch: string;
}[] = [
  {
    name: 'AbortPolicy (default)',
    behavior: 'Throw RejectedExecutionException to caller',
    payments: 'Good — map to 503 + retry-after',
    trading: 'Good — fail fast, client retries',
    reports: 'OK if UI shows busy',
    notify: 'OK with upstream retry',
    audit: 'Risky if drop = compliance gap',
    batch: 'OK — fail job, operator restarts',
  },
  {
    name: 'CallerRunsPolicy',
    behavior: 'Caller thread runs the task (backpressure)',
    payments: 'Use carefully — slows Tomcat threads',
    trading: 'Dangerous on latency-critical path',
    reports: 'Often fine',
    notify: 'OK',
    audit: 'OK for mild load',
    batch: 'OK',
  },
  {
    name: 'DiscardPolicy',
    behavior: 'Silently drop task',
    payments: 'NEVER — lost money intents',
    trading: 'NEVER',
    reports: 'Maybe for best-effort metrics',
    notify: 'Maybe with metrics',
    audit: 'NEVER',
    batch: 'Usually never',
  },
  {
    name: 'DiscardOldestPolicy',
    behavior: 'Drop oldest queued, retry execute',
    payments: 'Dangerous — drops earliest payments',
    trading: 'Usually wrong',
    reports: 'Maybe stale reports',
    notify: 'Maybe (drop old push)',
    audit: 'NEVER',
    batch: 'Rarely',
  },
];

export const CALLER_RUNS_TRAP = `CallerRunsPolicy under saturation:
  API tomcat-thread runs payment task itself
        │
        ▼
  That tomcat-thread blocked on DB 200ms
        │
        ▼
  Accept queue backs up → cascading latency

It is backpressure, not free capacity. Measure.`;
