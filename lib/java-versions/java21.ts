import type {VersionSection} from './types';

export const JAVA_21: VersionSection = {
  id: 'java-21',
  version: 'Java 21',
  year: '2023',
  lts: true,
  overview:
    'Java 21 is the concurrency LTS. Virtual threads are final. Pattern matching for switch and record patterns are final. Sequenced collections land. Generational ZGC is final. Several Loom/Amber features remain preview — do not ship them as “done” in architecture reviews.',
  whyMatters:
    'It changes how you scale blocking I/O services without rewriting to reactive. Interviewers expect you to know pinning, connection pools, and when VT does nothing for CPU-bound work.',
  majorFeatures: [
    {
      name: 'Virtual Threads',
      status: 'FINAL',
      jep: 'JEP 444',
      problem: 'Platform threads are scarce; thread-per-request dies at high concurrency.',
      before: 'Fixed pools, reactive stacks, or async frameworks to multiplex I/O.',
      solution: 'Lightweight virtual threads scheduled onto carrier platform threads.',
      production: 'Servlet/Spring MVC style apps with lots of waiting on JDBC/HTTP.',
      interview: 'When do virtual threads not help — and what new bottleneck appears?',
      code: `try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
  List<Future<PaymentResult>> futures = ids.stream()
      .map(id -> executor.submit(() -> processPayment(id)))
      .toList();
  for (Future<PaymentResult> f : futures) {
    results.add(f.get());
  }
}`,
    },
    {
      name: 'Pattern Matching for switch',
      status: 'FINAL',
      jep: 'JEP 441',
      problem: 'Type switches were instanceof ladders; sealed hierarchies deserved exhaustiveness.',
      before: 'if/else chains with casts.',
      solution: 'switch on type patterns with exhaustive sealed checks.',
      production: 'Payment routing, booking state machines.',
      interview: 'How does exhaustiveness interact with sealed permits lists?',
      code: `String describe(Payment p) {
  return switch (p) {
    case CardPayment c -> "card:" + c.network();
    case BankTransfer b -> "bank:" + b.iban();
    case WalletPayment w -> "wallet:" + w.provider();
  };
}`,
    },
    {
      name: 'Record Patterns',
      status: 'FINAL',
      jep: 'JEP 440',
      problem: 'Nested record deconstruction required manual accessors.',
      before: 'case Point p -> use p.x() / p.y()',
      solution: 'case Point(int x, int y) -> ... nested patterns.',
      production: 'Nested DTOs and algebraic data in domain events.',
      interview: 'Show a nested record pattern for Order(Customer, Money).',
    },
    {
      name: 'Sequenced Collections',
      status: 'FINAL',
      jep: 'JEP 431',
      problem: 'No uniform API for encounter order across List/Deque/LinkedHashSet.',
      before: 'Ad-hoc get(0)/get(size-1) or iterator hacks.',
      solution: 'SequencedCollection / SequencedSet / SequencedMap with getFirst/getLast/reversed.',
      production: 'Ordered catalogs, LRU-ish structures, protocol headers.',
      interview: 'What does reversed() return — a view or a copy?',
    },
    {
      name: 'Generational ZGC',
      status: 'FINAL',
      jep: 'JEP 439',
      problem: 'ZGC throughput lagged on many young-object-heavy services.',
      before: 'Single-generation ZGC or G1 default.',
      solution: 'Generational ZGC improves throughput while keeping low pauses.',
      production: 'Large-heap, latency-sensitive services evaluating Z vs G1.',
      interview: 'How do you choose G1 vs Generational ZGC without quoting fake pause numbers?',
    },
    {
      name: 'Key Encapsulation Mechanism API',
      status: 'FINAL',
      jep: 'JEP 452',
      problem: 'Post-quantum / modern KEM algorithms need first-class API support.',
      before: 'Ad-hoc crypto provider usage.',
      solution: 'javax.crypto.KEM API.',
      production: 'Forward-looking TLS/crypto platforms; niche but interview-relevant for security architects.',
      interview: 'Where does KEM fit versus classical key agreement?',
    },
    {
      name: 'String Templates',
      status: 'PREVIEW',
      jep: 'JEP 430 (preview in 21)',
      problem: 'Safe interpolation without injection bugs.',
      before: 'String concatenation / formatted.',
      solution: 'Preview template expressions — not production-final in 21.',
      production: 'Do not adopt in prod without governance; later withdrawn from the platform trajectory as a final feature.',
      interview: 'Why must you treat preview language features as non-portable?',
    },
    {
      name: 'Structured Concurrency',
      status: 'PREVIEW',
      jep: 'JEP 453 (preview in 21; still preview in 25 as JEP 505)',
      problem: 'Fan-out tasks outlive parents; cancellation and error propagation are ad-hoc.',
      before: 'Manual Future lists + custom cancel logic.',
      solution: 'StructuredTaskScope family (API evolves across previews).',
      production: 'Wait for finalization; design APIs so you can adopt later.',
      interview: 'How does structured concurrency relate to virtual threads?',
    },
    {
      name: 'Scoped Values',
      status: 'PREVIEW',
      jep: 'JEP 446 (preview in 21; final later in 25 as JEP 506)',
      problem: 'ThreadLocal is mutable, unconstrained lifetime, expensive with VT.',
      before: 'ThreadLocal for request context.',
      solution: 'Immutable, bounded-lifetime scoped values (preview here).',
      production: 'Prefer staying on ThreadLocal/MDC until final — or isolate behind an abstraction.',
      interview: 'Why are scoped values a better fit for virtual threads than ThreadLocal?',
    },
    {
      name: 'Foreign Function & Memory API',
      status: 'PREVIEW',
      jep: 'JEP 442 (preview in 21; final in 22 as JEP 454)',
      problem: 'JNI is brittle for native interop.',
      before: 'JNI / JNA.',
      solution: 'FFM preview in 21 — treat as preview on this LTS line.',
      production: 'Prefer waiting for final FFM (22+) unless you control the entire JDK upgrade train.',
      interview: 'Contrast FFM with JNI for a market-data native library.',
    },
    {
      name: 'Vector API',
      status: 'INCUBATOR',
      jep: 'JEP 448 (incubator in 21; still incubator in 25)',
      problem: 'Manual HotSpot autovectorization is unreliable for some numeric kernels.',
      before: 'Scalar loops hoping for C2 vectorization.',
      solution: 'Incubator Vector API — not a supported production API contract.',
      production: 'Only in isolated modules with --add-modules and upgrade plans.',
      interview: 'Why is incubator status stricter than preview for API stability?',
    },
  ],
  language: [
    'Pattern switch final',
    'Record patterns final',
    'Unnamed patterns/variables arrive nearby (22+) — do not claim in pure 21 code samples casually',
  ],
  api: [
    'Sequenced collections',
    'Virtual thread executors / Thread.ofVirtual()',
    'KEM API',
  ],
  jvm: [
    'Virtual thread scheduler (ForkJoinPool-based carriers)',
    'Continuations under the hood (implementation detail — speak carefully in interviews)',
  ],
  gc: ['Generational ZGC final', 'G1 still excellent default for many heaps'],
  concurrency: [
    'Virtual threads final',
    'Structured concurrency preview',
    'Scoped values preview',
  ],
  security: ['KEM API', 'Continue deserialization filter discipline'],
  performance: [
    'VT improve concurrency for blocking waits — not CPU throughput',
    'Generational ZGC can improve allocation-heavy throughput vs non-gen Z',
  ],
  deprecated: ['Monitor deprecated APIs via jdeprscan per upgrade'],
  removed: ['Track removed finalizers / legacy security APIs per release notes for your exact update'],
  productionUsage: [
    'Spring Boot 3.2+ virtual thread support paths',
    'Tomcat/Jetty VT executors',
    'Keep preview flags out of prod by policy',
  ],
  migrationImpact: [
    'Audit synchronized + native calls for pinning',
    'Resize DB pools — VT can amplify connection demand',
    'Revisit ThreadLocal-heavy frameworks',
  ],
  seniorTopics: [
    {
      title: 'Platform vs virtual vs carrier',
      body: 'Platform threads are OS-scheduled. Virtual threads are scheduled by the JVM onto carrier platform threads. Blocking in Java park unmounts the virtual thread from its carrier (usually). Pinning (synchronized / native) keeps the carrier occupied.',
    },
    {
      title: 'When VT help / do not help',
      body: 'Help: high concurrency, lots of waiting (JDBC, HTTP, file, queues). Do not help: CPU-bound crypto/compression/json of large payloads — you still need ~core-count workers. VT can make downstream saturation worse by issuing more concurrent waits.',
    },
  ],
  codePairs: [
    {
      title: 'Payment orchestration concurrency',
      oldLabel: 'Java 8 fixed pool',
      newLabel: 'Java 21 virtual threads',
      old: `ExecutorService executor = Executors.newFixedThreadPool(100);
Future<Customer> c = executor.submit(() -> customerClient.get(id));
Future<Account> a = executor.submit(() -> accountClient.get(id));
Future<Fraud> f = executor.submit(() -> fraudClient.score(id));
return decide(c.get(), a.get(), f.get());`,
      new: `try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
  Future<Customer> c = executor.submit(() -> customerClient.get(id));
  Future<Account> a = executor.submit(() -> accountClient.get(id));
  Future<Fraud> f = executor.submit(() -> fraudClient.score(id));
  return decide(c.get(), a.get(), f.get());
}`,
      whatChanged: 'Scarce platform workers → abundant virtual threads for blocking fan-out.',
      why: 'Scale request concurrency without reactive rewrite.',
      workload: 'I/O-bound payment authorization.',
      newBottleneck: 'DB pool, downstream rate limits, and synchronized pinning hotspots.',
    },
  ],
  interviewQuestions: [
    'Explain pinning and how you detect it with JFR.',
    'Can virtual threads replace WebFlux in your architecture? When not?',
    'What happens to HikariCP pool sizing after adopting VT?',
  ],
  architectQuestions: [
    'Design a rollout for VT across 200 Spring MVC services without melting Oracle.',
    'Compare cost/complexity of VT adoption vs staying on WebFlux for the next 3 years.',
  ],
  commonMistakes: [
    'Using VT for CPU-bound batch and expecting speedups',
    'Shipping --enable-preview features as platform standards',
    'Unbounded VT + unbounded DB pool assumptions',
  ],
};
