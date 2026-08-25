/** TPE scenarios A/B/C, queue demos, hooks, metrics. */

export const SCENARIO_A = `core=2  max=4  queueCapacity=10  tasks=5

Task 1 → create Worker W1 (workers < core)
Task 2 → create Worker W2
Task 3 → queue (workers == core, queue accepts)
Task 4 → queue
Task 5 → queue

End state: poolSize=2, queue=3, no rejection, max unused.`;

export const SCENARIO_B = `core=2  max=4  queueCapacity=2  tasks=10

Task 1 → W1
Task 2 → W2
Task 3 → queue slot 1
Task 4 → queue slot 2  (queue FULL)
Task 5 → create W3     (queue refused, workers < max)
Task 6 → create W4
Task 7 → REJECT        (pool at max AND queue full)
Task 8..10 → REJECT (AbortPolicy → RejectedExecutionException)

Saturation capacity = max + queue = 4 + 2 = 6 in-flight.`;

export const SCENARIO_C = `core=0 or small, max=4, SynchronousQueue (capacity 0), tasks burst

Every offer fails unless a worker is waiting to take.
→ Each busy moment tends to create a new worker (up to max)
→ Then reject

This is why newCachedThreadPool (max≈Integer.MAX_VALUE + SynchronousQueue)
can explode threads under slow I/O.

With SynchronousQueue, maximumPoolSize is the real concurrency ceiling.`;

export const QUEUE_DEMOS = `// ArrayBlockingQueue — bounded FIFO
BlockingQueue<Runnable> q1 = new ArrayBlockingQueue<>(100);
// Production default for backpressure

// LinkedBlockingQueue — capacity optional
BlockingQueue<Runnable> q2 = new LinkedBlockingQueue<>(); // ≈ unbounded
BlockingQueue<Runnable> q3 = new LinkedBlockingQueue<>(100); // bounded
// newFixedThreadPool uses unbounded LinkedBlockingQueue — danger

// SynchronousQueue — handoff, no storage
BlockingQueue<Runnable> q4 = new SynchronousQueue<>();
// newCachedThreadPool; forces create-or-reject

// PriorityBlockingQueue — unbounded, Comparable/Comparator order
BlockingQueue<Runnable> q5 = new PriorityBlockingQueue<>();
// Starvation risk for low priority; growth unbounded

// DelayQueue — elements become available after delay
// Useful for delayed retries (usually via ScheduledThreadPoolExecutor)`;

export const QUEUE_TABLE_DEEP: string[][] = [
  ['Queue', 'Capacity', 'Order', 'Prod note'],
  ['ArrayBlockingQueue(n)', 'Bounded n', 'FIFO (fair opt)', 'Preferred backpressure buffer'],
  ['LinkedBlockingQueue()', '≈Unbounded', 'FIFO', 'FixedThreadPool trap'],
  ['LinkedBlockingQueue(n)', 'Bounded n', 'FIFO', 'OK alternative to Array'],
  ['SynchronousQueue', '0', 'Handoff', 'Cached pool; max matters'],
  ['PriorityBlockingQueue', 'Unbounded', 'Priority', 'Watch starvation + growth'],
  ['DelayQueue', 'Unbounded*', 'Delay', 'Prefer SES for schedules'],
];

export const HOOKS_CODE = `import java.util.concurrent.*;
import java.util.concurrent.atomic.LongAdder;

public class MetricsThreadPoolExecutor extends ThreadPoolExecutor {
  private final LongAdder completed = new LongAdder();
  private final LongAdder failed = new LongAdder();
  private final ThreadLocal<Long> startNs = new ThreadLocal<>();

  public MetricsThreadPoolExecutor(int core, int max, int queueCap, ThreadFactory tf) {
    super(core, max, 60, TimeUnit.SECONDS,
        new ArrayBlockingQueue<>(queueCap), tf, new AbortPolicy());
  }

  @Override
  protected void beforeExecute(Thread t, Runnable r) {
    startNs.set(System.nanoTime());
  }

  @Override
  protected void afterExecute(Runnable r, Throwable t) {
    try {
      long took = System.nanoTime() - startNs.get();
      if (t == null && r instanceof Future<?> f) {
        try {
          f.get();
        } catch (CancellationException ce) {
          t = ce;
        } catch (ExecutionException ee) {
          t = ee.getCause();
        } catch (InterruptedException ie) {
          Thread.currentThread().interrupt();
        }
      }
      if (t != null) failed.increment();
      else completed.increment();
      // record took to histogram / MDC cleanup here
    } finally {
      startNs.remove();
      super.afterExecute(r, t);
    }
  }

  @Override
  protected void terminated() {
    System.out.println("pool terminated completed=" + completed.sum()
        + " failed=" + failed.sum());
    super.terminated();
  }
}`;

export const METRICS_CODE = `ThreadPoolExecutor pool = /* ... */;

System.out.printf(
  "pool=%d active=%d largest=%d queued=%d tasks=%d completed=%d core=%d max=%d%n",
  pool.getPoolSize(),
  pool.getActiveCount(),
  pool.getLargestPoolSize(),
  pool.getQueue().size(),
  pool.getTaskCount(),
  pool.getCompletedTaskCount(),
  pool.getCorePoolSize(),
  pool.getMaximumPoolSize());

// Expose via Micrometer gauges / Spring Boot Actuator / JMX MBean
// Alert on: queue depth ↑, rejected ↑, active≈max, completed lag`;

export const SCHEDULED_DEEP = `schedule(task, delay, unit)
  Run once after delay

scheduleAtFixedRate(task, initialDelay, period, unit)
  Timeline aims at T0, T0+p, T0+2p, …
  If task overruns period: next start is late (no overlap on same thread)
  Does NOT stack concurrent runs on a single worker

scheduleWithFixedDelay(task, initialDelay, delay, unit)
  Task ends → wait delay → next start
  Better when duration varies (reconcile jobs)

If scheduled task throws RuntimeException:
  For ScheduledThreadPoolExecutor, a periodic task that throws
  may suppress subsequent executions (treat as fatal for that schedule).
  Always try/catch inside the task and log/metrics — do not rely on
  the scheduler to keep firing after an unchecked failure.

Cancellation: ScheduledFuture.cancel(true/false) — same cooperative rules.`;

export const SCHEDULED_TIMELINE = `fixedRate (period=5s, task≈2s)
  |--task--|....|--task--|....|--task--|
  0        2    5        7    10

fixedRate when task≈7s, period=5s (overrun)
  |--------task--------|  (next starts when prior ends on single thread)
  0                    7 → drift

fixedDelay (delay=5s, task≈2s)
  |--task--|.....|--task--|.....|
  0        2     7        9     14`;
