export type TocItem = {id: string; label: string};

export const EXECUTOR_TOC: TocItem[] = [
  {id: 'big-picture', label: '01. Big picture'},
  {id: 'submit-internals', label: '02. submit() internals'},
  {id: 'lifecycle', label: '03. Thread lifecycle'},
  {id: 'tpe-params', label: '04. ThreadPoolExecutor params'},
  {id: 'algorithm', label: '05. execute() algorithm'},
  {id: 'queue-experiment', label: '05b. Queue size experiment'},
  {id: 'queues', label: '06. BlockingQueue'},
  {id: 'factories', label: '07. Executors factories'},
  {id: 'callable', label: '08. Runnable · Callable · Future'},
  {id: 'exceptions', label: '09. Exception handling'},
  {id: 'exception-matrix', label: '09b. Exception matrix'},
  {id: 'thread-factory', label: '10. ThreadFactory'},
  {id: 'rejection', label: '11. Rejection policies'},
  {id: 'rejection-labs', label: '11b. Rejection labs'},
  {id: 'payment-design', label: '12. Payment pool design'},
  {id: 'payment-code', label: '12b. Payment complete code'},
  {id: 'cpu-io', label: '13. CPU vs I/O'},
  {id: 'pools-interact', label: '14. Thread vs DB pools'},
  {id: 'deadlock', label: '15. Deadlock · starvation'},
  {id: 'nested', label: '16. Nested tasks'},
  {id: 'cancel', label: '16b. Future cancellation'},
  {id: 'cf', label: '17. CompletableFuture'},
  {id: 'cf-pipeline', label: '17b. CF customer pipeline'},
  {id: 'scheduled', label: '18. ScheduledExecutor'},
  {id: 'ctl-states', label: '18b. TPE run states'},
  {id: 'shutdown', label: '19. Graceful shutdown'},
  {id: 'monitoring', label: '20. Monitoring'},
  {id: 'debug-walk', label: '20b. Debug walkthrough'},
  {id: 'incidents', label: '21. Production incidents'},
  {id: 'corner', label: '22. Corner cases · ThreadLocal'},
  {id: 'mdc', label: '22b. MDC / context propagation'},
  {id: 'virtual', label: '23. Virtual threads'},
  {id: 'fjp', label: '24. ForkJoinPool'},
  {id: 'kafka', label: '25. Kafka + Executor'},
  {id: 'external-api', label: '25b. External API bulkhead'},
  {id: 'batch', label: '25c. Batch processing'},
  {id: 'tx', label: '26. @Transactional + pool'},
  {id: 'async', label: '27. Spring @Async'},
  {id: 'report-pool', label: '27b. Report isolation'},
  {id: 'architecture', label: '28. Full architecture'},
  {id: 'bulkhead', label: '29. Pool isolation'},
  {id: 'backpressure', label: '29b. Backpressure'},
  {id: 'decision-trees', label: '29c. Decision trees'},
  {id: 'broken-code', label: '30. Broken-code drills (15)'},
  {id: 'antipatterns', label: '31. Anti-patterns'},
  {id: 'traps', label: '32. Interviewer traps'},
  {id: 'answers-60s', label: '33. 60-second answers'},
  {id: 'interview', label: '34. Interview bank'},
  {id: 'memory', label: '35. Memory hooks'},
  {id: 'cheatsheet', label: '36. Cheat sheet · revision'},
];

export const MEMORY_SENTENCE =
  'Core fills first → then queue → then max threads → then reject. Size pools to downstream (DB/HTTP), never to vanity TPS. Name threads. Shut down gracefully. Isolate payment from report.';

export const VERSION_NOTE =
  'Payment-platform Executor playbook · ThreadPoolExecutor algorithm · broken-code drills · FinTech sizing · Kafka/Spring traps · Java 21 virtual threads. Sibling: /java-concurrency · /java-locking.';

export const TWO_MIN =
  `ExecutorService is a managed worker pool — you submit tasks, not create Threads. ThreadPoolExecutor fills core workers first, then the queue, then grows to max, then rejects. In payments I size core to steady concurrent I/O (bounded by DB/HTTP pools), use a bounded queue for backpressure, Abort or CallerRuns with eyes open, name threads payment-worker-N, and always shutdown + awaitTermination on SIGTERM with idempotent work so deploys don't double-charge.`;
