export type TocItem = {id: string; label: string};

export const EXECUTOR_TOC: TocItem[] = [
  {id: 'big-picture', label: '01. Big picture'},
  {id: 'submit-internals', label: '02. submit() internals'},
  {id: 'lifecycle', label: '03. Thread lifecycle'},
  {id: 'tpe-params', label: '04. ThreadPoolExecutor params'},
  {id: 'algorithm', label: '05. execute() algorithm'},
  {id: 'queues', label: '06. BlockingQueue'},
  {id: 'factories', label: '07. Executors factories'},
  {id: 'callable', label: '08. Runnable · Callable · Future'},
  {id: 'exceptions', label: '09. Exception handling'},
  {id: 'thread-factory', label: '10. ThreadFactory'},
  {id: 'rejection', label: '11. Rejection policies'},
  {id: 'payment-design', label: '12. Payment pool design'},
  {id: 'cpu-io', label: '13. CPU vs I/O'},
  {id: 'pools-interact', label: '14. Thread vs DB pools'},
  {id: 'deadlock', label: '15. Deadlock · starvation'},
  {id: 'nested', label: '16. Nested tasks'},
  {id: 'cf', label: '17. CompletableFuture'},
  {id: 'scheduled', label: '18. ScheduledExecutor'},
  {id: 'shutdown', label: '19. Graceful shutdown'},
  {id: 'monitoring', label: '20. Monitoring'},
  {id: 'incidents', label: '21. Production incidents'},
  {id: 'corner', label: '22. Corner cases · ThreadLocal'},
  {id: 'virtual', label: '23. Virtual threads'},
  {id: 'fjp', label: '24. ForkJoinPool'},
  {id: 'kafka', label: '25. Kafka + Executor'},
  {id: 'tx', label: '26. @Transactional + pool'},
  {id: 'async', label: '27. Spring @Async'},
  {id: 'architecture', label: '28. Full architecture'},
  {id: 'bulkhead', label: '29. Pool isolation'},
  {id: 'antipatterns', label: '30. Anti-patterns'},
  {id: 'interview', label: '31. Interview bank'},
  {id: 'memory', label: '32. Memory hooks'},
  {id: 'cheatsheet', label: '33. Cheat sheet · revision'},
];

export const MEMORY_SENTENCE =
  'Core fills first → then queue → then max threads → then reject. Size pools to downstream (DB/HTTP), never to vanity TPS. Name threads. Shut down gracefully. Isolate payment from report.';

export const VERSION_NOTE =
  'Payment-platform Executor playbook · ThreadPoolExecutor algorithm · FinTech sizing · Kafka/Spring traps · Java 21 virtual threads. Sibling: /java-concurrency · /java-locking.';

export const TWO_MIN =
  `ExecutorService is a managed worker pool — you submit tasks, not create Threads. ThreadPoolExecutor fills core workers first, then the queue, then grows to max, then rejects. In payments I size core to steady concurrent I/O (bounded by DB/HTTP pools), use a bounded queue for backpressure, Abort or CallerRuns with eyes open, name threads payment-worker-N, and always shutdown + awaitTermination on SIGTERM with idempotent work so deploys don't double-charge.`;
