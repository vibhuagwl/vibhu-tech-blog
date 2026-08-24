/** Big picture, submit internals, lifecycle. */

export const WHY_EXECUTOR = `Manually creating Thread objects does not scale in a payment platform:

• Thread creation is expensive (stack, OS scheduling)
• Unbounded new Thread() under load → thousands of stacks → OOM / context-switch thrash
• No shared queue, no backpressure, no rejection policy
• No lifecycle: who joins? who interrupts? who drains on deploy?

Executor Framework (Java 5) separates:
  "what work" (Runnable/Callable) from "who runs it" (pool workers).`;

export const MENTAL_MODEL = `Application (Payment API)
        │
        ▼
  ExecutorService.submit(task)
        │
        ▼
  ThreadPoolExecutor
        │
   ┌────┴────┐
   │ Workers │  T1  T2  T3  … (core → max)
   └────┬────┘
        │
   BlockingQueue  ← backlog / backpressure
        │
        ▼
   Task runs → Future result / exception`;

export const TYPE_MAP: [string, string][] = [
  ['Thread', 'OS/platform worker that actually runs bytecode'],
  ['Runnable', 'Unit of work, no return, cannot throw checked'],
  ['Callable<T>', 'Unit of work that returns T / throws Exception'],
  ['Future<T>', 'Handle to async result — get / cancel / isDone'],
  ['Executor', 'execute(Runnable) — fire and forget'],
  ['ExecutorService', 'Executor + submit/shutdown/invokeAll'],
  ['ScheduledExecutorService', 'Delayed / periodic tasks'],
  ['ThreadPoolExecutor', 'The real engine behind most pools'],
  ['ForkJoinPool', 'Work-stealing pool for CPU divide-and-conquer'],
  ['CompletableFuture', 'Composable async pipeline (uses an Executor)'],
  ['Executors', 'Factory helpers — convenient, often risky defaults'],
];

export const SUBMIT_INTERNALS = `executor.submit(task)  — what actually happens

1. Caller invokes ExecutorService.submit(Runnable|Callable)
2. Task wrapped as FutureTask (implements RunnableFuture)
3. execute(futureTask) is called (same path as execute())
4. ThreadPoolExecutor decision tree (core → queue → max → reject)
5. A worker thread eventually runs FutureTask.run()
6. Result / exception stored inside FutureTask
7. Callers of future.get() unblock (or see ExecutionException)

Key: submit() always returns a Future. execute() does not.
Exceptions on execute() can hit the worker's UncaughtExceptionHandler;
exceptions on submit() are captured until get().`;

export const THREAD_LIFECYCLE = `Platform Thread states (java.lang.Thread.State)

NEW ──start()──► RUNNABLE ◄──► BLOCKED (monitor)
                    │
                    ├── WAITING (wait/join/park)
                    ├── TIMED_WAITING (sleep/parkNanos)
                    └── TERMINATED

RUNNABLE means eligible to run — may be waiting for CPU.`;

export const WORKER_LIFECYCLE = `Worker thread INSIDE ThreadPoolExecutor (different story)

CREATE
  • Created when workerCount < core (on submit), or when queue full & < max
  • ThreadFactory.newThread(worker) → start()
  • Worker runs runWorker() loop

IDLE / REUSE
  • After task finishes, worker does NOT die
  • getTask() blocks on queue.take() / poll(keepAlive)
  • Picks next Runnable → run → loop

KEEP-ALIVE / REMOVE
  • If workerCount > core and idle > keepAliveTime → worker exits
  • allowCoreThreadTimeOut(true) → even core can die when idle

SHUTDOWN
  shutdown()
    • state → SHUTDOWN
    • reject NEW submits
    • finish RUNNING + drain QUEUE
  shutdownNow()
    • state → STOP
    • interrupt workers
    • return list of QUEUED tasks (not started)
    • RUNNING tasks stop only if they honor interrupt
    • NOT an instant kill — stubborn code ignores interrupt

awaitTermination(timeout) waits for TERMINATED state.`;

export const SHUTDOWN_DIAGRAM = `SIGTERM / deploy
      │
      ▼
 stopAcceptingTraffic()
      │
      ▼
 executor.shutdown()          ← no new tasks
      │
      ▼
 awaitTermination(30s)
      │
      ├── true  → clean exit
      └── false → shutdownNow() + interrupt
                    │
                    ▼
              log leftover FutureTasks
              (idempotent payments still safe)`;

export const MEMORY_HOOKS_INTRO: [string, string][] = [
  ['Why Executor', 'Separate work from workers — stop new Thread() storms'],
  ['submit()', 'Wrap as FutureTask → same execute() decision tree'],
  ['Worker after task', 'Does not die — blocks on queue for next job'],
  ['shutdown vs Now', 'Drain politely vs interrupt + return queued list'],
];
