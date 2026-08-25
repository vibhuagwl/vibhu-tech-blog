/** 50+ senior interview Q&A + comparison tables. */

export type SeniorQ = {q: string; a: string};

export const SENIOR_50: SeniorQ[] = [
  {q: 'execute() vs submit()?', a: 'execute fire-and-forget; exceptions → uncaught handler. submit returns Future; exceptions stored until get().'},
  {q: 'shutdown() vs shutdownNow()?', a: 'shutdown rejects new, drains running+queued. shutdownNow interrupts, returns queued Runnables; running stops only if cooperative.'},
  {q: 'corePoolSize vs maximumPoolSize?', a: 'Core kept (unless allowCoreThreadTimeOut). Max used only after queue refuses a task.'},
  {q: 'Why can maximumPoolSize appear ineffective?', a: 'Unbounded/never-full queue → offer always succeeds → max path never taken.'},
  {q: 'How does a bounded queue change thread creation?', a: 'When full, next tasks create workers up to max, then reject.'},
  {q: 'Why can LinkedBlockingQueue cause problems?', a: 'Default constructor is effectively unbounded → queue bomb with FixedThreadPool.'},
  {q: 'SynchronousQueue use case?', a: 'Zero-capacity handoff; cached pools; forces create-or-reject; max is the ceiling.'},
  {q: 'CallerRunsPolicy use case?', a: 'Backpressure on caller thread; dangerous if caller is Tomcat/Netty request thread.'},
  {q: 'Future vs CompletableFuture?', a: 'Future is a result handle. CF adds CompletionStage composition, timeouts, combine/allOf, explicit executors.'},
  {q: 'thenApply vs thenApplyAsync?', a: 'thenApply may run on completing thread; Async uses commonPool or provided Executor.'},
  {q: 'thenCompose vs thenCombine?', a: 'Compose = dependent flatMap. Combine = independent zip of two stages.'},
  {q: 'allOf vs anyOf?', a: 'allOf waits for all. anyOf first completion (success or failure) — not first success.'},
  {q: 'join vs get?', a: 'join → unchecked CompletionException. get → checked ExecutionException/Interrupted/Timeout.'},
  {q: 'What executor does CF use by default?', a: 'Default async facility ≈ ForkJoinPool.commonPool() (unless parallelism 1).'},
  {q: 'How does CF propagate exceptions?', a: 'Exceptional completion flows downstream until exceptionally/handle recovers or caller join/get unwraps.'},
  {q: 'handle vs exceptionally?', a: 'exceptionally only on failure→fallback. handle always BiFunction(result,error)→new result.'},
  {q: 'whenComplete?', a: 'Observer BiConsumer; does not replace outcome (unless it throws).'},
  {q: 'How do you implement timeout?', a: 'orTimeout (fail) or completeOnTimeout (default). Also Future.get(timeout).'},
  {q: 'How do you cancel a task?', a: 'Future.cancel(mayInterrupt). Cooperative — interrupt only if mayInterrupt and task listens.'},
  {q: 'Can cancel(true) kill a thread?', a: 'No. It interrupts; uninterruptible/ignoring code keeps running.'},
  {q: 'How do you size a thread pool?', a: 'Start from workload (CPU≈cores; I/O≈cores×(1+wait/service)) then CAP by DB/HTTP pools; measure.'},
  {q: 'How do you prevent queue explosion?', a: 'Bounded queue + rejection; never FixedThreadPool unbounded on ingress.'},
  {q: 'How do you implement backpressure?', a: 'Bound queue, Abort/CallerRuns, rate limits, LB 503, Kafka pause.'},
  {q: 'How do you prevent executor starvation?', a: 'No nested get on same pool; separate pools; non-blocking CF composition.'},
  {q: 'How do you monitor ThreadPoolExecutor?', a: 'active/pool/queue/largest/task/completed/rejected; Micrometer/Actuator/JMX.'},
  {q: 'How does work stealing work?', a: 'Idle FJP workers steal tasks from other workers’ deques — good for uneven CPU forks.'},
  {q: 'ForkJoinPool vs ThreadPoolExecutor?', a: 'FJP for CPU divide-and-conquer; TPE for general/mixed I/O request handling.'},
  {q: 'fixedRate vs fixedDelay?', a: 'Rate aims at cadence; Delay waits after completion. Overruns delay the next on single thread.'},
  {q: 'What if scheduled task throws?', a: 'Treat as fatal for that periodic schedule unless you catch inside — always try/catch+log.'},
  {q: 'Why separate executor for blocking I/O?', a: 'Avoid starving CPU/commonPool; isolate blast radius; match DB/HTTP limits.'},
  {q: 'How can CF cause deadlock-like hangs?', a: 'join/get inside workers waiting for same limited pool / commonPool blocking.'},
  {q: 'How do you propagate MDC?', a: 'Capture context map at submit; set in worker try/finally; TaskDecorator; clear on exit.'},
  {q: 'How do you handle rejected tasks?', a: 'Abort→503+metrics for money; never silent Discard; careful CallerRuns.'},
  {q: 'Graceful application shutdown?', a: 'Fail readiness → shutdown → awaitTermination → shutdownNow leftovers → idempotent retries.'},
  {q: 'Queued tasks during shutdown?', a: 'shutdown drains them; shutdownNow returns them unstarted.'},
  {q: 'Guarantee task ordering?', a: 'Single-thread executor / per-key serial queues / Kafka partitions — not a multi-worker pool.'},
  {q: 'Priority execution?', a: 'PriorityBlockingQueue or separate VIP pool; watch unbounded growth/starvation.'},
  {q: 'Process whichever finishes first?', a: 'CompletionService.take/poll or CF anyOf (mind success vs completion).'},
  {q: 'invokeAll vs CompletionService?', a: 'invokeAll waits all, input order. CS streams completion order.'},
  {q: 'invokeAny vs anyOf?', a: 'invokeAny first success. anyOf first completion.'},
  {q: 'Isolate external API calls?', a: 'Dedicated executor/semaphore/bulkhead + timeouts + CB per dependency.'},
  {q: 'Prevent one downstream exhausting threads?', a: 'Bulkheads + timeouts; don’t share one mega-pool.'},
  {q: 'Bulkhead isolation?', a: 'Separate pools/queues per workload class (payment/report/notify).'},
  {q: 'Queue full — what happens?', a: 'Create up to max if possible else RejectedExecutionHandler.'},
  {q: 'Why can newCachedThreadPool create too many threads?', a: 'SynchronousQueue + huge max → thread per concurrent task under slow I/O.'},
  {q: 'Queue vs create decision?', a: 'CORE first, then QUEUE, then MAX, then REJECT.'},
  {q: 'Idle core threads?', a: 'Stay alive by default; allowCoreThreadTimeOut(true) lets them die after keepAlive.'},
  {q: 'allowCoreThreadTimeOut()?', a: 'Applies keepAlive to core workers too — reclaim when idle.'},
  {q: 'prestartCoreThread(s)?', a: 'Warm-create core workers before first submit to cut cold-start latency.'},
  {q: 'Debug production thread-pool problem?', a: 'Metrics (queue/active/reject) + thread dump + dependency pools + factory/queue code review.'},
  {q: 'Executor vs ExecutorService?', a: 'Executor only execute. ExecutorService adds submit/invoke*/shutdown lifecycle.'},
  {q: 'AbstractExecutorService role?', a: 'Default submit wraps FutureTask; shared invokeAll/invokeAny scaffolding.'},
  {q: 'FutureTask role?', a: 'RunnableFuture used by submit; holds outcome for get().'},
  {q: 'CompletionStage?', a: 'Interface of dependent actions; CompletableFuture implements it.'},
  {q: 'unconfigurableExecutorService?', a: 'Wrapper preventing cast-and-reconfigure of a shared pool.'},
  {q: 'newWorkStealingPool?', a: 'Factory for a ForkJoinPool sized to parallelism — CPU work, not JDBC.'},
];

export const COMPARISON_TABLES: {title: string; headers: string[]; rows: string[][]}[] = [
  {
    title: 'Executor vs ExecutorService',
    headers: ['Aspect', 'Executor', 'ExecutorService'],
    rows: [
      ['API', 'execute', 'submit/invoke*/shutdown'],
      ['Future', 'No', 'Yes'],
      ['Lifecycle', 'None', 'shutdown/await'],
    ],
  },
  {
    title: 'execute vs submit',
    headers: ['Aspect', 'execute', 'submit'],
    rows: [
      ['Return', 'void', 'Future'],
      ['Exceptions', 'Uncaught handler', 'Stored until get'],
      ['Callable', 'N/A (Runnable)', 'Yes'],
    ],
  },
  {
    title: 'Runnable vs Callable',
    headers: ['Aspect', 'Runnable', 'Callable'],
    rows: [
      ['Return', 'void', 'V'],
      ['Checked ex', 'Cannot throw', 'throws Exception'],
    ],
  },
  {
    title: 'Future vs CompletableFuture',
    headers: ['Aspect', 'Future', 'CompletableFuture'],
    rows: [
      ['Composition', 'Manual', 'then*/allOf/anyOf'],
      ['Timeout API', 'get(timeout)', 'orTimeout/completeOnTimeout'],
      ['Default pool', 'N/A', 'commonPool for *Async'],
    ],
  },
  {
    title: 'ThreadPoolExecutor vs ForkJoinPool',
    headers: ['Aspect', 'TPE', 'FJP'],
    rows: [
      ['Best for', 'Mixed/I/O services', 'CPU fork/join'],
      ['Queue', 'Shared BlockingQueue', 'Per-worker steals'],
      ['Blocking I/O', 'OK if sized', 'Risky'],
    ],
  },
  {
    title: 'invokeAll vs CompletionService',
    headers: ['Aspect', 'invokeAll', 'CompletionService'],
    rows: [
      ['Wait', 'All done', 'Per completion'],
      ['Order', 'Input order', 'Finish order'],
    ],
  },
  {
    title: 'invokeAny vs anyOf',
    headers: ['Aspect', 'invokeAny', 'anyOf'],
    rows: [
      ['Winner', 'First success', 'First completion'],
      ['Failures', 'Ignored if another succeeds', 'May win'],
    ],
  },
  {
    title: 'thenApply vs thenCompose',
    headers: ['Aspect', 'thenApply', 'thenCompose'],
    rows: [
      ['Function returns', 'value', 'CompletionStage'],
      ['Use', 'Map', 'Dependent async call'],
    ],
  },
  {
    title: 'thenApply vs thenApplyAsync',
    headers: ['Aspect', 'thenApply', 'thenApplyAsync'],
    rows: [
      ['Thread', 'Often completing thread', 'Async facility / Executor'],
      ['Blocking work', 'Risky', 'Pass dedicated Executor'],
    ],
  },
  {
    title: 'thenCombine vs thenCompose',
    headers: ['Aspect', 'thenCombine', 'thenCompose'],
    rows: [
      ['Dependency', 'Independent pair', 'Dependent chain'],
      ['Shape', 'zip', 'flatMap'],
    ],
  },
  {
    title: 'exceptionally vs handle vs whenComplete',
    headers: ['API', 'When', 'Changes result?'],
    rows: [
      ['exceptionally', 'Failure only', 'Yes (fallback)'],
      ['handle', 'Always', 'Yes'],
      ['whenComplete', 'Always', 'No (observe)'],
    ],
  },
  {
    title: 'shutdown vs shutdownNow',
    headers: ['Aspect', 'shutdown', 'shutdownNow'],
    rows: [
      ['New tasks', 'Reject', 'Reject'],
      ['Queued', 'Drain/run', 'Return list'],
      ['Running', 'Finish', 'Interrupt'],
    ],
  },
  {
    title: 'fixedRate vs fixedDelay',
    headers: ['Aspect', 'fixedRate', 'fixedDelay'],
    rows: [
      ['Cadence', 'Aim period from start', 'Delay after end'],
      ['Variable duration', 'Can drift on overrun', 'Naturally spaces'],
    ],
  },
  {
    title: 'FixedThreadPool vs CachedThreadPool',
    headers: ['Aspect', 'Fixed', 'Cached'],
    rows: [
      ['Queue', 'Unbounded Linked', 'SynchronousQueue'],
      ['Threads', 'Fixed n', 'Grow without practical bound'],
      ['Risk', 'OOM queue', 'Thread explosion'],
    ],
  },
  {
    title: 'Bounded vs unbounded queue',
    headers: ['Aspect', 'Bounded', 'Unbounded'],
    rows: [
      ['Backpressure', 'Yes (then max/reject)', 'No — grows'],
      ['maxPoolSize', 'Reachable', 'Often never used'],
    ],
  },
  {
    title: 'CPU pool vs IO pool',
    headers: ['Aspect', 'CPU pool', 'IO pool'],
    rows: [
      ['Size', '~cores', 'Higher, capped by deps'],
      ['Work', 'Compute', 'DB/HTTP'],
      ['Mixing', 'Starves each other', 'Isolate'],
    ],
  },
];

export const MOST_ASKED = [
  'CORE → QUEUE → MAX → REJECT — say it and walk numbers',
  'Why max unused with FixedThreadPool?',
  'execute vs submit exception visibility',
  'CallerRuns as backpressure vs Tomcat stall',
  'thenCompose vs thenCombine',
  'anyOf vs invokeAny (completion vs success)',
  'commonPool + blocking I/O',
  'cancel(true) is cooperative',
  'Size to DB pool, not vanity TPS',
  'CompletionService when finish-order matters',
];

export const CHEAT_SHEET_EXTRA = `CORE → QUEUE → MAX → REJECT

APPLY / ACCEPT / RUN
COMPOSE (dependent) / COMBINE (independent)
ALL (wait all) / ANY (first completion)
exceptionally / handle / whenComplete
orTimeout (fail) / completeOnTimeout (default)

invokeAll = all, input order
CompletionService = completion order
invokeAny = first success
anyOf = first completion

Shutdown: stop traffic → shutdown → await → shutdownNow
Money: Abort + idempotency — never Discard`;
