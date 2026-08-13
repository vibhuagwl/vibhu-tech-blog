import type {VersionSection} from './types';

export const JAVA_8: VersionSection = {
  id: 'java-8',
  version: 'Java 8',
  year: '2014',
  lts: true,
  overview:
    'Java 8 is the inflection point from “classic OO Java” to modern Java. For architects interviewing in 2025+, it is still the mental baseline for millions of production services — and the migration tax every later LTS must pay.',
  whyMatters:
    'It introduced a functional surface (lambdas/streams), a real async composition model (CompletableFuture), and java.time. Most “why can’t we jump to 21?” answers start with libraries and idioms born here.',
  majorFeatures: [
    {
      name: 'Lambda Expressions',
      problem: 'Anonymous classes for callbacks and Comparators were verbose and opaque.',
      before: 'new Comparator<Txn>() { public int compare(...) { ... } }',
      solution: '(a, b) -> a.amount().compareTo(b.amount()) with SAM conversion.',
      production: 'Sorting, filtering, and callback registration in payment pipelines.',
      interview: 'What is a functional interface, and what does “effectively final” mean for captures?',
      codeBefore: `Collections.sort(txns, new Comparator<Transaction>() {
  public int compare(Transaction a, Transaction b) {
    return a.getAmount().compareTo(b.getAmount());
  }
});`,
      code: `txns.sort(Comparator.comparing(Transaction::getAmount));`,
    },
    {
      name: 'Stream API',
      problem: 'External iteration mixed business logic with loop control.',
      before: 'for-loops with mutable accumulators and early continues.',
      solution: 'Declarative pipelines: filter → map → collect with lazy evaluation.',
      production: 'Batch reconciliation, fraud feature extraction, report aggregation.',
      interview: 'When does a stream pipeline execute? Intermediate vs terminal?',
      codeBefore: `List<Transaction> ok = new ArrayList<>();
for (Transaction t : transactions) {
  if (t.isSuccessful()) ok.add(t);
}`,
      code: `List<Transaction> ok = transactions.stream()
    .filter(Transaction::isSuccessful)
    .collect(Collectors.toList());`,
    },
    {
      name: 'Optional',
      problem: 'Null return values leaked into call sites as NPEs.',
      before: 'return null; callers forget checks.',
      solution: 'Optional.of/empty/ofNullable with map/flatMap/orElseThrow.',
      production: 'Lookup APIs (customer by id) — not fields, not collections elements.',
      interview: 'Why is Optional as a field / method parameter usually an anti-pattern?',
    },
    {
      name: 'CompletableFuture',
      problem: 'Future alone could not compose dependent async calls cleanly.',
      before: 'Blocking Future.get() chains or custom callback hell.',
      solution: 'thenApply / thenCompose / thenCombine / allOf / exceptionally.',
      production: 'Fan-out to customer + fraud + FX rate services before authorizing payment.',
      interview: 'thenApply vs thenCompose — when does nesting Futures appear?',
      code: `CompletableFuture<Customer> customer = fetchCustomer(id);
CompletableFuture<Risk> risk = fetchRisk(id);
CompletableFuture<Decision> decision =
    customer.thenCombine(risk, this::decide);`,
    },
    {
      name: 'java.time',
      problem: 'Date/Calendar were mutable, timezone-hostile, and not thread-safe.',
      before: 'SimpleDateFormat (not thread-safe) + Calendar mutation.',
      solution: 'Instant, ZonedDateTime, Duration, Clock injection for tests.',
      production: 'Settlement windows, cutoffs, and SLA clocks with injectable Clock.',
      interview: 'Why inject Clock instead of Instant.now() in domain services?',
    },
    {
      name: 'Default / static interface methods',
      problem: 'Evolving interfaces broke all implementors.',
      before: 'Abstract base classes as the only evolution path.',
      solution: 'default methods for compatible evolution; static helpers on the interface.',
      production: 'Library SPI evolution without forcing customer recompiles immediately.',
      interview: 'How do default methods interact with multiple inheritance of behavior?',
    },
  ],
  language: [
    'Lambdas + method references',
    'Functional interfaces (@FunctionalInterface)',
    'Type annotations / repeating annotations',
  ],
  api: [
    'Stream / Collectors / Spliterator',
    'Optional',
    'CompletableFuture',
    'java.time',
    'Base64',
    'ConcurrentHashMap compute/merge',
  ],
  jvm: [
    'Metaspace replaces PermGen (Java 8)',
    'InvokerDynamic / LambdaMetafactory linkage',
    'Continued HotSpot C1/C2 tiered compilation',
  ],
  gc: [
    'Parallel GC still common default on server configs of the era',
    'CMS still widely used (later removed)',
    'G1 available and improving toward becoming default later',
  ],
  concurrency: [
    'ForkJoinPool.commonPool() powers parallel streams',
    'CompletableFuture default async uses commonPool',
    'StampedLock added',
  ],
  security: [
    'TLS stack of the era; later LTS required cipher/protocol upgrades',
    'Unlimited crypto policy historically a separate install (later bundled)',
  ],
  performance: [
    'Streams can be slower than tight loops for tiny collections — measure',
    'Parallel streams help CPU-bound, splittable, large workloads only',
    'Lambda linkage cost amortized after warm-up',
  ],
  deprecated: ['Some legacy Date APIs discouraged in favor of java.time'],
  removed: ['Nothing dramatic vs Java 7 language; removals accelerate after 9/11'],
  productionUsage: [
    'Still common in long-lived monoliths and vendor-locked platforms',
    'Often the “works in prod” JDK while CI already on 11/17',
    'Technical debt compounds: no records, no VT, older TLS defaults',
  ],
  migrationImpact: [
    'Leaving 8 is mandatory for support/security posture at most enterprises',
    'Biggest risks are dependencies compiled for 8 and reflective libraries',
    'Do not rewrite to streams/Optional as part of the JDK bump — separate concerns',
  ],
  seniorTopics: [
    {
      title: 'Stream lazy evaluation & pipelines',
      body: 'Intermediate ops build a pipeline; nothing runs until a terminal op. Short-circuiting (findFirst, anyMatch) can skip work. Side-effects in intermediate ops are a production smell — they break parallelism assumptions and reorderings.',
    },
    {
      title: 'Spliterator & parallel streams',
      body: 'Parallelism quality depends on Spliterator characteristics (SIZED, SUBSIZED, CONCURRENT). LinkedList-style structures split poorly. Parallel streams share ForkJoinPool.commonPool() — saturating it stalls unrelated CompletableFuture async work.',
    },
    {
      title: 'CompletableFuture execution model',
      body: 'thenApply runs on the completing thread unless *Async. Default executor is commonPool (not ideal for blocking I/O). Prefer custom Executor for outbound HTTP/JDBC. Exceptionally / handle for recovery; whenComplete for observability side-effects.',
    },
    {
      title: 'Optional anti-patterns',
      body: 'Do not use Optional for fields, parameters, or empty collections. Prefer empty List/Map. orElse(getDefault()) eagerly evaluates — use orElseGet. Optional.get() without isPresent is just a louder NPE.',
    },
    {
      title: 'Lambda capture & effectively final',
      body: 'Captured locals must be final or effectively final so the runtime can safely snapshot values. Mutating an array slot to “cheat” is a review red flag. Capturing large objects can extend lifetimes unexpectedly.',
    },
  ],
  codePairs: [
    {
      title: 'Filter successful payments',
      oldLabel: 'Pre-Java 8',
      newLabel: 'Java 8',
      old: `List<Transaction> successful = new ArrayList<>();
for (Transaction t : transactions) {
  if (t.isSuccessful()) {
    successful.add(t);
  }
}`,
      new: `List<Transaction> successful = transactions.stream()
    .filter(Transaction::isSuccessful)
    .collect(Collectors.toList());`,
      whatChanged: 'External iteration → declarative pipeline.',
      why: 'Intent reads clearly; composition and testing of predicates improve.',
      workload: 'In-memory transformation of moderate collections.',
      newBottleneck: 'Allocation of stream pipeline objects on hot micro-paths — profile before “stream everything”.',
    },
  ],
  interviewQuestions: [
    'Explain intermediate vs terminal stream operations with a payment filtering example.',
    'How does ForkJoinPool.commonPool interact with parallel streams and CompletableFuture?',
    'Design an async fan-out/fan-in for fraud + balance checks using CompletableFuture.',
    'When would you refuse to use parallelStream in a latency-critical API?',
  ],
  architectQuestions: [
    'Your platform standardizes on Java 8 in 2016. What governance would you have put in place then to make a 2024 LTS jump cheaper?',
    'How do you prevent “stream culture” from regressing p99 on a hot trading path?',
  ],
  commonMistakes: [
    'Parallel streams on shared mutable state',
    'Optional wrapping every null',
    'Blocking inside thenApply on the commonPool',
    'Ignoring that Collectors.toList() was unmodifiable only from Java 16+',
  ],
};
