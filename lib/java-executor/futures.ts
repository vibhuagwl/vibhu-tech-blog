/** Callable, Future, exceptions, ThreadFactory, CF, scheduled. */

export const RUNNABLE_VS_CALLABLE = `Runnable
  void run() — no return, cannot throw checked Exception

Callable<T>
  T call() throws Exception — return value + checked exceptions

Payment example:
  Future<PaymentResult> f = executor.submit(() -> gateway.charge(req));
  PaymentResult r = f.get(2, TimeUnit.SECONDS);`;

export const FUTURE_FLOW = `submit(callable)
      │
      ▼
FutureTask queued / running
      │
      ├── success ──► get() returns T
      ├── exception ► get() throws ExecutionException (cause = real error)
      ├── cancel(true) ► may interrupt; get() → CancellationException
      └── get(timeout) ► TimeoutException (task may still run!)

get() BLOCKS the caller thread — never call it on the same small pool
that must run the inner task (deadlock risk).`;

export const EXECUTE_VS_SUBMIT = `Same failing task:
  Runnable bad = () -> { throw new RuntimeException("Payment failed"); };

execute(bad)
  • Exception escapes Worker.run → UncaughtExceptionHandler
  • Future not returned — easy to miss in logs if no handler
  • Worker typically continues (pool replaces logic keeps going)

submit(bad)
  • Exception stored in FutureTask
  • Caller only sees it on future.get() → ExecutionException
  • If nobody calls get(), failure can be SILENT

Production rule: prefer submit + always observe Future,
or execute + UncaughtExceptionHandler + afterExecute logging.`;

export const PAYMENT_EXCEPTION_FLOW = `Payment Request
      │
      ▼
executor.submit(() -> {
    beginTx();
    try {
      debitLedger();
      callGateway();   // may throw
      commit();
      return OK;
    } catch (BusinessDecline e) {
      rollback();
      return DECLINED;   // business outcome, not crash
    } catch (TechnicalException e) {
      rollback();
      throw e;           // → Future / retry / DLQ
    }
})
      │
      ▼
Observer: metrics + log + (retry?) + (DLQ?)

Technical exception ≠ business decline.
Do not retry "insufficient funds". Do retry timeouts with idempotency key.`;

export const THREAD_FACTORY_CODE = `ThreadFactory paymentFactory = r -> {
  Thread t = new Thread(r);
  t.setName("payment-worker-" + SEQ.incrementAndGet());
  t.setDaemon(false); // JVM should wait on shutdown
  t.setUncaughtExceptionHandler((th, ex) ->
      log.error("Uncaught in {}", th.getName(), ex));
  return t;
};

Why names matter: thread dumps, Splunk, VisualVM, incident bridges.
"pool-1-thread-3" tells you nothing at 3am.`;

export const CF_NOTES = `CompletableFuture.supplyAsync(task)
  → uses ForkJoinPool.commonPool() by default
  → NEVER put blocking JDBC / HTTP on commonPool in a shared JVM

CompletableFuture.supplyAsync(task, paymentExecutor)
  → isolate to your pool (correct for payments)

thenApply  — sync map on same thread that completed stage (or async variant)
thenCompose — flatMap Futures (avoid nested CF)
thenCombine / allOf / anyOf — fan-in
exceptionally / handle / whenComplete — error paths

Risk: thenApplyAsync without executor → commonPool again.`;

export const SCHEDULED = `schedule(task, delay, unit)         — once after delay
scheduleAtFixedRate(task, init, period, unit)
  T0 --period-- T0+p --period-- T0+2p
  If task overruns period → next starts late (no overlap in single thread)

scheduleWithFixedDelay(task, init, delay, unit)
  Task ends → wait delay → next start

Payment reconcile every 5 minutes:
  Prefer fixedDelay if reconcile duration varies,
  so you do not stack overlaps on a slow day.

If task > interval: fixedRate drifts; use monitoring + alerting.`;

export const AFTER_EXECUTE = `@Override
protected void afterExecute(Runnable r, Throwable t) {
  super.afterExecute(r, t);
  if (t == null && r instanceof Future<?> f) {
    try { f.get(); }
    catch (CancellationException ce) { t = ce; }
    catch (ExecutionException ee) { t = ee.getCause(); }
    catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
  }
  if (t != null) metrics.taskFailed(t);
}`;
