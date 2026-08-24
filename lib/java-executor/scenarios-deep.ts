/** Extra production scenarios with complete Java sketches. */

export const PAYMENT_COMPLETE_CODE = `import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public final class PaymentExecutorFactory {
  private PaymentExecutorFactory() {}

  public static ThreadPoolExecutor create() {
    AtomicInteger seq = new AtomicInteger();
    ThreadFactory tf = r -> {
      Thread t = new Thread(r, "payment-worker-" + seq.incrementAndGet());
      t.setDaemon(false);
      t.setUncaughtExceptionHandler((th, ex) ->
          System.err.println(th.getName() + " " + ex));
      return t;
    };
    return new ThreadPoolExecutor(
        32,                          // core — steady authorize concurrency
        64,                          // max — only after queue full
        60, TimeUnit.SECONDS,
        new ArrayBlockingQueue<>(500),
        tf,
        new ThreadPoolExecutor.AbortPolicy());
  }
}

// Call site (API thread)
public PaymentResponse authorize(PaymentRequest req) {
  try {
    Future<PaymentResult> f = paymentExecutor.submit(() -> {
      idempotency.guard(req.key());
      return gateway.charge(req); // client timeout 1–2s
    });
    PaymentResult r = f.get(2, TimeUnit.SECONDS);
    return PaymentResponse.ok(r);
  } catch (RejectedExecutionException ex) {
    return PaymentResponse.unavailable(); // 503 backpressure
  } catch (TimeoutException ex) {
    return PaymentResponse.timeout();
  } catch (ExecutionException ex) {
    return PaymentResponse.failed(ex.getCause());
  } catch (InterruptedException ex) {
    Thread.currentThread().interrupt();
    return PaymentResponse.cancelled();
  }
}`;

export const PAYMENT_SLOW_PATHS = `If DB becomes slow
  workers block borrowing connections
  queue fills → reject → 503
  do NOT raise max past DB pool

If payment gateway becomes slow
  same pattern — bound with client timeouts
  circuit breaker opens → fail fast
  retries with jitter + idempotency key only

Prevent thread exhaustion
  max capped by downstream
  timeouts on Future + HTTP client
  bulkhead separate from reports

Prevent queue explosion
  ArrayBlockingQueue(500) not unbounded
  AbortPolicy, not Discard

Backpressure
  reject → 503 → client slows / LB sheds
  optional rate limit at gateway`;

export const EXTERNAL_API_SCENARIO = `Order Service
     ↓
orderExecutor (bulkhead)
     ↓
┌────┼────┐
▼    ▼    ▼
Inv  Pay  Notify   ← each with timeout + CB + own semaphore

When Payment API is slow:
  payment semaphore / pool saturates first
  inventory + notify keep working
  order API returns partial failure / degrade — not total hang`;

export const EXTERNAL_API_CODE = `public final class OrderOrchestrator {
  private final ExecutorService orderPool;
  private final InventoryClient inventory;
  private final PaymentClient payment;
  private final NotifyClient notify;

  public OrderResult place(OrderRequest req) throws Exception {
    CompletableFuture<Stock> stock =
        CompletableFuture.supplyAsync(() -> inventory.reserve(req), orderPool)
            .orTimeout(300, TimeUnit.MILLISECONDS);
    CompletableFuture<Pay> pay =
        CompletableFuture.supplyAsync(() -> payment.charge(req), orderPool)
            .orTimeout(2, TimeUnit.SECONDS);
    CompletableFuture<Void> mail =
        CompletableFuture.runAsync(() -> notify.email(req), orderPool)
            .orTimeout(1, TimeUnit.SECONDS)
            .exceptionally(ex -> null); // best-effort

    return stock.thenCombine(pay, OrderResult::new)
        .thenCombine(mail, (o, ignored) -> o)
        .join();
  }
}`;

export const KAFKA_SPRING_CODE = `@KafkaListener(topics = "payments.authorized", concurrency = "6")
public void onMessage(ConsumerRecord<String, PaymentEvent> record,
                      Acknowledgment ack) {
  // BAD: fire-and-forget to unbounded executor then ack immediately
  // executor.submit(() -> handle(record)); ack.acknowledge();

  // SAFER sync (ordering ≈ concurrency ≤ partitions):
  try {
    handle(record);          // idempotent
    ack.acknowledge();
  } catch (RetryableException ex) {
    throw ex;                // seek/retry / DefaultErrorHandler → DLQ
  }
}

// If async handoff is required:
// 1) pause consumer when workerQueue.size() > threshold
// 2) resume when drained
// 3) ack only after durable side effect
// 4) never break per-key order unless business allows`;

export const KAFKA_FLOW = `Kafka partitions
      ↓
Consumer thread(s)   ← poll + commit ownership
      ↓
Executor workers     ← optional handoff
      ↓
Business processing (idempotent)
      ↓
Offset commit policy

Risks of naive handoff
  • commit before work done → loss on crash
  • commit after success but rebalance mid-flight → duplicates
  • many workers per partition → reorder events
  • unbounded handoff queue → lag + OOM while consumer "looks fine"`;

export const BATCH_SCENARIO = `1_000_000 records
      ↓
read in pages (e.g. 5_000)
      ↓
submit page tasks to batchExecutor
      ↓
await page completion with timeout
      ↓
checkpoint progress
      ↓
on failure: retry page / DLQ bad rows / continue

Pool sketch
  core ≈ CPU cores for CPU-bound transform
  or smaller + bounded queue for I/O-bound enrich
  memory: do NOT load 1M rows into queue as 1M tasks
  graceful shutdown: stop reading, drain page, checkpoint`;

export const BATCH_CODE = `ThreadPoolExecutor batch = new ThreadPoolExecutor(
    Runtime.getRuntime().availableProcessors(),
    Runtime.getRuntime().availableProcessors(),
    30, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(64),
    namedFactory("batch-"),
    new ThreadPoolExecutor.CallerRunsPolicy()); // backpressure on producer loop

for (List<Row> page : reader.pages(5000)) {
  Future<?> f = batch.submit(() -> processPage(page));
  // optionally track futures per window; handle partial failure per row
}`;

export const REPORT_BULKHEAD_CODE = `@Configuration
public class ExecutorConfig {
  @Bean(name = "customerApiExecutor")
  ThreadPoolTaskExecutor customerApiExecutor() {
    return build(16, 32, 200, "customer-api-");
  }

  @Bean(name = "reportExecutor")
  ThreadPoolTaskExecutor reportExecutor() {
    return build(2, 4, 50, "report-"); // small — protects customer path
  }

  private ThreadPoolTaskExecutor build(int core, int max, int queue, String prefix) {
    ThreadPoolTaskExecutor e = new ThreadPoolTaskExecutor();
    e.setCorePoolSize(core);
    e.setMaxPoolSize(max);
    e.setQueueCapacity(queue);
    e.setThreadNamePrefix(prefix);
    e.setRejectedExecutionHandler(new ThreadPoolExecutor.AbortPolicy());
    e.initialize();
    return e;
  }
}

@Service
public class ReportService {
  @Async("reportExecutor")
  public CompletableFuture<Report> generate(ReportRequest req) {
    return CompletableFuture.completedFuture(engine.run(req));
  }
}`;

export const QUEUE_SIZE_EXPERIMENT = `Same core=5 max=10, vary queue:

queue = 10
  Tasks 1–5 → workers
  6–15 → queue
  16–20 → grow to max
  21+ → reject
  Low buffering — fast reject under spike (good for fail-fast APIs)

queue = 100
  Tasks 1–5 → workers
  6–105 → queue
  106–110 → max
  111+ → reject
  Absorbs short bursts; adds wait latency when workers busy

queue = unbounded (LinkedBlockingQueue)
  Tasks 1–5 → workers
  6…∞ → queue forever
  max NEVER used
  Latency → GC → OOM

Interview line: queue capacity is a latency/backpressure knob, not "just storage".`;
