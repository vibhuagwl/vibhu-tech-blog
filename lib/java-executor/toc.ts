export type TocItem = {id: string; label: string};

export const EXECUTOR_TOC: TocItem[] = [
  {id: 'big-picture', label: '01. Overview'},
  {id: 'hierarchy', label: '02. Hierarchy'},
  {id: 'execute-submit', label: '03. execute vs submit'},
  {id: 'factories', label: '04. Executors factories'},
  {id: 'factory-extra', label: '04b. Work-stealing · unconfigurable'},
  {id: 'tpe-params', label: '05. ThreadPoolExecutor params'},
  {id: 'algorithm', label: '06. CORE→QUEUE→MAX→REJECT'},
  {id: 'scenarios-abc', label: '07. Scenarios A/B/C'},
  {id: 'queues', label: '08. Queue types'},
  {id: 'rejection', label: '09. RejectedExecutionHandler'},
  {id: 'rejection-labs', label: '09b. Rejection labs'},
  {id: 'thread-factory', label: '10. ThreadFactory'},
  {id: 'lifecycle', label: '11. Lifecycle & shutdown'},
  {id: 'ctl-states', label: '11b. Run states'},
  {id: 'hooks', label: '12. before/afterExecute hooks'},
  {id: 'monitoring', label: '13. Metrics & monitoring'},
  {id: 'callable', label: '14. Future complete guide'},
  {id: 'cancel', label: '14b. Cancellation'},
  {id: 'invoke-all-any', label: '15. invokeAll · invokeAny'},
  {id: 'completion-service', label: '16. ExecutorCompletionService'},
  {id: 'scheduled', label: '17. ScheduledExecutorService'},
  {id: 'fjp', label: '18. ForkJoinPool'},
  {id: 'cf', label: '19. CompletableFuture'},
  {id: 'cf-pipeline', label: '20. CF composition'},
  {id: 'cf-exceptions', label: '21. CF exceptions · join/get'},
  {id: 'cf-timeout', label: '22. CF timeout · deadlock'},
  {id: 'cf-aggregator', label: '23. CF aggregator design'},
  {id: 'payment-design', label: '24. Pool sizing · payment'},
  {id: 'cpu-io', label: '24b. CPU vs I/O'},
  {id: 'pools-interact', label: '24c. DB/HTTP interaction'},
  {id: 'backpressure', label: '25. Backpressure'},
  {id: 'bulkhead', label: '26. Bulkhead'},
  {id: 'virtual', label: '27. Virtual threads'},
  {id: 'kafka', label: '28. Kafka · Spring · MDC'},
  {id: 'architecture', label: '29. Full architecture'},
  {id: 'broken-code', label: '30. Broken-code drills'},
  {id: 'antipatterns', label: '31. Production mistakes'},
  {id: 'coding-problems', label: '32. Coding problems (15)'},
  {id: 'senior-50', label: '33. Senior Q&A (50+)'},
  {id: 'interview', label: '34. Scenario interview bank'},
  {id: 'tables', label: '35. Comparison tables'},
  {id: 'traps', label: '36. Interviewer traps'},
  {id: 'answers-60s', label: '37. 60-second answers'},
  {id: 'cheatsheet', label: '38. Cheat sheet'},
];

export const MEMORY_SENTENCE =
  'CORE → QUEUE → MAX → REJECT. Size to downstream (DB/HTTP). COMPOSE=dependent · COMBINE=independent. ALL=wait all · ANY=first completion. Abort for money. Isolate pools.';

export const VERSION_NOTE =
  'Complete Executor + CompletableFuture interview reference (Java 17+) · CompletionService · invokeAll/Any · CF deep dive · 15 coding problems · 50+ Q&A. Sibling: /java-concurrency · /java-locking · /java-reentrant-lock.';

export const TWO_MIN =
  `ExecutorService is a managed worker pool — you submit tasks, not create Threads. ThreadPoolExecutor fills core workers first, then the queue, then grows to max, then rejects. In payments I size core to steady concurrent I/O (bounded by DB/HTTP pools), use a bounded queue for backpressure, Abort→503, name threads payment-worker-N, and shutdown + awaitTermination on SIGTERM with idempotent work. For fan-out I use CompletableFuture with an explicit executor — never blocking JDBC on commonPool — compose with thenCompose/thenCombine, bound with orTimeout, and isolate payment from report pools.`;
