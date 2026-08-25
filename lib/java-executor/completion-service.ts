/** invokeAll, invokeAny, ExecutorCompletionService. */

export const INVOKE_ALL = `List<Callable<String>> tasks = List.of(
    () -> callService("A"),
    () -> callService("B"),
    () -> callService("C"));

List<Future<String>> futures = executor.invokeAll(tasks);
// Blocks until ALL complete (or timeout overload cancels leftovers)

for (Future<String> f : futures) {
  try {
    System.out.println(f.get()); // may throw ExecutionException
  } catch (ExecutionException ee) {
    System.out.println("failed: " + ee.getCause());
  }
}

// Timeout form
List<Future<String>> partial =
    executor.invokeAll(tasks, 2, TimeUnit.SECONDS);
// Incomplete tasks are cancelled

Ordering: returned Futures correspond to the input collection order —
NOT completion order.`;

export const INVOKE_ANY = `// First successful result wins; others cancelled when possible
String result = executor.invokeAny(List.of(
    () -> callPrimary(),
    () -> callReplica1(),
    () -> callReplica2()));

// With timeout
String fast = executor.invokeAny(tasks, 500, TimeUnit.MILLISECONDS);

Behavior
  • Returns result of one successful Callable
  • If all fail → ExecutionException
  • Remaining tasks are cancelled (best effort)
  • Different from CompletableFuture.anyOf (first *completion*, success or fail)`;

export const INVOKE_COMPARE = `invokeAll
  Wait for every task; Futures in input order; good for fan-in aggregate

invokeAny
  First *successful* result; cancel the rest; good for primary+replicas

anyOf (CF)
  First *completion* (may be failure); does not mean first success

CompletionService
  Process results in completion order without waiting for the slowest first`;

export const COMPLETION_SERVICE = `Why not only invokeAll?
  invokeAll blocks until the slowest finishes before you can process any.
  If Task B finishes in 1s and A in 5s, you still wait for A to start handling B.

ExecutorCompletionService
  Wraps an Executor + a completion queue
  As each Future completes, it becomes available via take()/poll()

Example timings
  Task A → 5s
  Task B → 1s
  Task C → 3s

Completion order processed
  B → C → A

vs invokeAll iteration order
  A → B → C  (blocked until all done, then in input order)`;

export const COMPLETION_SERVICE_CODE = `import java.util.concurrent.*;

public class CompletionServiceDemo {
  public static void main(String[] args) throws Exception {
    ExecutorService pool = Executors.newFixedThreadPool(3, r -> {
      Thread t = new Thread(r);
      t.setName("cs-worker");
      return t;
    });
    ExecutorCompletionService<String> ecs = new ExecutorCompletionService<>(pool);

    ecs.submit(() -> { sleep(5000); return "A"; });
    ecs.submit(() -> { sleep(1000); return "B"; });
    ecs.submit(() -> { sleep(3000); return "C"; });

    for (int i = 0; i < 3; i++) {
      Future<String> done = ecs.take(); // blocks for next completed
      System.out.println("completed: " + done.get());
    }

    pool.shutdown();
    pool.awaitTermination(2, TimeUnit.SECONDS);
  }

  static void sleep(long ms) throws InterruptedException {
    Thread.sleep(ms);
  }
}

// poll() — non-blocking / timed variant
// Future<?> f = ecs.poll(100, TimeUnit.MILLISECONDS);`;

export const COMPLETION_USE_CASES = `Use CompletionService when
  • You want to stream results as they finish (search fan-out, multi-quote)
  • Slow stragglers should not block processing of early finishers
  • You will cancel remaining work after N successes (with care)

Prefer invokeAll when
  • You need the full set before combining
  • Input-order alignment matters for zip/aggregate`;
