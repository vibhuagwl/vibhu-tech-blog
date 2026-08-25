/** CompletableFuture complete guide for senior interviews. */

export const CF_INTRO = `CompletableFuture<T>
  • Implements Future<T> AND CompletionStage<T>
  • Supports dependent actions triggered by completion
  • Default async facility ≈ ForkJoinPool.commonPool()
    (unless an Executor is passed, or parallelism is 1)

Memory
  APPLY  → transform value (Function)  → new stage value
  ACCEPT → consume value (Consumer)    → Void
  RUN    → side effect (Runnable)      → Void
  COMPOSE → dependent Futures (flatMap)
  COMBINE → independent Futures (zip)
  ALL → wait for all
  ANY → first completion (not necessarily first success)`;

export const CF_CREATE = `CompletableFuture<String> done =
    CompletableFuture.completedFuture("ready");

CompletableFuture<Void> run =
    CompletableFuture.runAsync(() -> log("side-effect")); // commonPool

CompletableFuture<Integer> supply =
    CompletableFuture.supplyAsync(() -> load(), ioExecutor); // prefer explicit

CompletableFuture<String> manual = new CompletableFuture<>();
// later: manual.complete("ok") / completeExceptionally(ex) / cancel`;

export const CF_THEN_FAMILY = `String
  |
thenApply(s -> s.length())   → Integer
  |
thenAccept(n -> log(n))      → Void
  |
thenRun(() -> metrics.inc()) → Void

thenApply  — Function<T,R>  returns value
thenAccept — Consumer<T>    returns Void
thenRun    — Runnable       ignores prior value`;

export const CF_ASYNC_VS = `thenApply(fn)
  May run in the thread that *completes* the previous stage
  (or caller, depending on timing) — NOT always a pool worker

thenApplyAsync(fn)
  Uses default async facility (normally commonPool)

thenApplyAsync(fn, executor)
  Uses YOUR executor — production default for blocking work

Demo idea: print Thread.currentThread().getName() inside each stage.

Rule: blocking JDBC/HTTP continuations → *Async(..., dedicatedExecutor)
CPU-light transforms on already-I/O thread → thenApply can be OK`;

export const CF_COMPOSE_COMBINE = `// thenCompose — dependent (flatMap)
CompletableFuture<User> user =
    CompletableFuture.supplyAsync(() -> getUser(id), io);
CompletableFuture<List<Order>> orders =
    user.thenCompose(u ->
        CompletableFuture.supplyAsync(() -> getOrders(u), io));

// thenCombine — independent (zip)
CompletableFuture<User> u =
    CompletableFuture.supplyAsync(() -> getUser(id), io);
CompletableFuture<Account> a =
    CompletableFuture.supplyAsync(() -> getAccount(id), io);
CompletableFuture<View> view =
    u.thenCombine(a, (user, acct) -> new View(user, acct));

Memory: COMPOSE = dependent chain; COMBINE = independent pair.`;

export const CF_ALL_ANY = `// allOf — wait for all (Void); extract with join/get on each
CompletableFuture<Void> all = CompletableFuture.allOf(cF, aF, tF);
CompletableFuture<List<Object>> aggregated = all.thenApply(v ->
    List.of(cF.join(), aF.join(), tF.join()));

// Helper
static <T> CompletableFuture<List<T>> sequence(
    List<CompletableFuture<T>> futures) {
  CompletableFuture<Void> all =
      CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new));
  return all.thenApply(v -> futures.stream().map(CompletableFuture::join).toList());
}

// anyOf — first *completion* (success OR failure)
CompletableFuture<Object> first =
    CompletableFuture.anyOf(primary, replica1, replica2);

first completion ≠ first success
  If primary fails fast, anyOf may complete exceptionally
  even while replicas would succeed — handle carefully
  For first success, prefer invokeAny or custom success-racing`;

export const CF_EXCEPTIONS = `| API            | On success              | On failure                         | Changes result? |
| -------------- | ----------------------- | ---------------------------------- | --------------- |
| exceptionally  | passes through          | Function<Throwable,T> recovery     | Yes (fallback)  |
| handle         | BiFunction(T, Throwable)| always called                      | Yes             |
| whenComplete   | BiConsumer(T, Throwable)| always called                      | No (observes)   |

exceptionally — recover value on failure only
handle — map both success and failure to a new value
whenComplete — log/metrics; does not replace outcome

Corner cases
  • Exception in supplyAsync → stage completes exceptionally
  • Exception in thenApply → downstream exceptional
  • exceptionally swallows and returns fallback → later stages see success
  • whenComplete throwing can cause exceptional completion
  • join() wraps in CompletionException (unchecked)
  • get() wraps in ExecutionException (checked) + InterruptedException
  • cancel(true) on CF — completes exceptionally as CancellationException;
    does not interrupt an arbitrary running supplier unless your code checks`;

export const CF_JOIN_GET = `future.get()
  Checked ExecutionException / InterruptedException / TimeoutException
  Typical at API boundaries where you must declare throws

future.join()
  Unchecked CompletionException
  Convenient inside streams / thenApply lambdas
  Still wraps the real cause — unwrap with getCause()

Interview: CF pipelines prefer join() to avoid checked-exception noise
inside lambdas; at service edges prefer get(timeout) for clarity.`;

export const CF_TIMEOUT = `payment
  .orTimeout(2, TimeUnit.SECONDS)           // fail with TimeoutException
  .exceptionally(ex -> PaymentResult.fail())

payment
  .completeOnTimeout(PaymentResult.fallback(), 2, TimeUnit.SECONDS)
  // complete successfully with default — does not fail the stage

CompletableFuture.delayedExecutor(2, TimeUnit.SECONDS, scheduler)
  // Executor that delays submission — useful for deferred complete`;

export const CF_DEADLOCK = `Pool size = 2

Bad
  worker runs: futureB.join()
  futureB needs another task on SAME pool
  both workers blocked in join → starvation / hang

Also bad
  supplyAsync(blockingJdbc) // commonPool
  + parallelStream elsewhere → JVM-wide latency coupling

Fix
  Non-blocking composition (thenCompose/thenCombine)
  Separate executors for stages that must block
  Never join() inside a worker waiting for the same limited pool`;

export const CF_AGGREGATOR = `import java.util.concurrent.*;

public class CustomerAggregator {
  private final ExecutorService io =
      new ThreadPoolExecutor(16, 32, 60, TimeUnit.SECONDS,
          new ArrayBlockingQueue<>(500),
          r -> new Thread(r, "cust-io"),
          new ThreadPoolExecutor.AbortPolicy());

  public CustomerView get(String id) {
    CompletableFuture<Customer> c =
        CompletableFuture.supplyAsync(() -> customerClient.get(id), io)
            .orTimeout(300, TimeUnit.MILLISECONDS)
            .exceptionally(ex -> Customer.unknown(id));

    CompletableFuture<Account> a =
        CompletableFuture.supplyAsync(() -> accountClient.get(id), io)
            .orTimeout(300, TimeUnit.MILLISECONDS)
            .exceptionally(ex -> Account.empty(id));

    CompletableFuture<List<Tx>> t =
        CompletableFuture.supplyAsync(() -> txClient.list(id), io)
            .orTimeout(500, TimeUnit.MILLISECONDS)
            .exceptionally(ex -> List.of());

    CompletableFuture<Rewards> r =
        CompletableFuture.supplyAsync(() -> rewardsClient.get(id), io)
            .orTimeout(300, TimeUnit.MILLISECONDS)
            .exceptionally(ex -> Rewards.none());

    return CompletableFuture.allOf(c, a, t, r)
        .thenApply(v -> new CustomerView(c.join(), a.join(), t.join(), r.join()))
        .orTimeout(800, TimeUnit.MILLISECONDS)
        .exceptionally(ex -> CustomerView.degraded(id, ex))
        .join();
  }

  public void shutdown() throws InterruptedException {
    io.shutdown();
    io.awaitTermination(10, TimeUnit.SECONDS);
  }
}

// Propagate correlation ID: capture MDC map before supplyAsync,
// set inside supplier try/finally (or TaskDecorator on the executor).`;

export const CF_MEMORY_BOXES = [
  ['APPLY / ACCEPT / RUN', 'transform / consume / side-effect'],
  ['COMPOSE / COMBINE', 'dependent flatMap / independent zip'],
  ['ALL / ANY', 'wait all / first completion'],
  ['exceptionally / handle / whenComplete', 'recover / map both / observe'],
  ['orTimeout / completeOnTimeout', 'fail vs default'],
];
