import type {VersionSection} from './types';

export const JAVA_11: VersionSection = {
  id: 'java-11',
  version: 'Java 11',
  year: '2018',
  lts: true,
  overview:
    'Java 11 is the first post-module-system LTS most enterprises actually adopted. It is the practical bridge off Java 8: HTTP Client final, string/files ergonomics, Flight Recorder open-sourced, and Java EE/CORBA modules removed from the JDK.',
  whyMatters:
    'If you still have services on 8, 11 is often the lowest-risk first hop: toolchain and Spring Boot generations align, while language surface stays familiar.',
  majorFeatures: [
    {
      name: 'HTTP Client (standard)',
      status: 'FINAL',
      jep: 'JEP 321',
      problem: 'HttpURLConnection was awkward; Apache HttpClient was a heavy dependency.',
      before: 'Third-party clients or URL.openConnection boilerplate.',
      solution: 'java.net.http.HttpClient with sync/async and BodyHandlers.',
      production: 'Service-to-service calls, webhooks, token introspection.',
      interview: 'How do you configure timeouts, redirects, and executors on HttpClient?',
      code: `HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(2))
    .executor(Executors.newFixedThreadPool(32))
    .build();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/payment"))
    .timeout(Duration.ofSeconds(3))
    .GET()
    .build();

HttpResponse<String> response =
    client.send(request, HttpResponse.BodyHandlers.ofString());`,
    },
    {
      name: 'String / Files / Collection factories',
      problem: 'Common micro-ops needed Guava/Commons or verbose boilerplate.',
      before: 'Apache Commons StringUtils; Guava ImmutableList.',
      solution: 'isBlank, lines, strip, repeat; Files.readString/writeString; List.of / Set.of / Map.of.',
      production: 'Config parsing, small immutable catalogs, test fixtures.',
      interview: 'Why can List.of not contain null, and why is that good in APIs?',
    },
    {
      name: 'Nest-based access control',
      jep: 'JEP 181',
      problem: 'Nested classes required bridge accessors, confusing reflection/tools.',
      before: 'javac synthetic bridges for private member access.',
      solution: 'Nest mates allow JVM-level private access among nested types.',
      production: 'Cleaner reflective frameworks and better encapsulation stories.',
      interview: 'What is a nest host, and how does it change reflective setAccessible needs?',
    },
    {
      name: 'Epsilon GC + ZGC (experimental era)',
      problem: 'Need for no-op GC in short-lived jobs; ultra-low pause GC research.',
      before: 'Only traditional collectors for all workloads.',
      solution: 'Epsilon for ephemeral jobs; ZGC begins its production journey (usable later).',
      production: 'Epsilon for serverless-style batch; ZGC evaluation for large heaps.',
      interview: 'When is Epsilon GC a correct production choice — and when is it catastrophic?',
    },
    {
      name: 'Java Flight Recorder (OpenJDK)',
      problem: 'Production profiling needed low-overhead continuous telemetry.',
      before: 'Commercial JFR or heavy sampling profilers only.',
      solution: 'JFR + Mission Control available in OpenJDK builds.',
      production: 'Continuous recording with dump-on-demand for latency incidents.',
      interview: 'How would you use JFR to prove a GC or lock contention theory?',
    },
  ],
  language: [
    'Local-variable syntax for lambda parameters (var in lambdas)',
    'No records/sealed yet — keep examples Java 11-legal',
  ],
  api: [
    'java.net.http',
    'String.isBlank/lines/strip/repeat',
    'Files.readString/writeString',
    'Collection factory methods',
    'Optional.isEmpty (11)',
    'Predicate.not',
  ],
  jvm: [
    'Dynamic class-file constants (JEP 309)',
    'More modular JDK; stronger pressure to stop relying on internal APIs',
  ],
  gc: [
    'Epsilon GC (JEP 318)',
    'ZGC experimental improvements toward production readiness',
    'G1 improvements continue',
  ],
  concurrency: [
    'Still platform-thread world; reactive frameworks fill high-concurrency niche',
    'HttpClient async integrates with CompletableFuture',
  ],
  security: [
    'TLS 1.3 support path matures across 11 updates',
    'Root certificate updates via CPU/PSU cadence matter operationally',
  ],
  performance: [
    'HttpClient + proper executor beats naive URL connections under load',
    'JFR overhead low enough for always-on in many shops',
  ],
  deprecated: [
    'Nashorn deprecated for removal (later removed)',
    'Continued warnings on illegal reflective access',
  ],
  removed: [
    'Java EE and CORBA modules removed from JDK (JEP 320) — use Jakarta EE libs explicitly',
    'Pack200 tools removed in later versions; plan early',
  ],
  productionUsage: [
    'Common “minimum supported” LTS in enterprises that left 8 but not yet 17',
    'Spring Boot 2.x era often paired with 11',
  ],
  migrationImpact: [
    'Must replace JAXB/JAX-WS/Activation if you relied on JDK-bundled Java EE APIs',
    'javax.* → explicit dependencies',
    'Docker base images and CI agents need JDK 11 toolchains',
  ],
  codePairs: [
    {
      title: 'HTTP call',
      oldLabel: 'Java 8 style',
      newLabel: 'Java 11 HttpClient',
      old: `URL url = new URL("https://api.example.com/payment");
HttpURLConnection conn = (HttpURLConnection) url.openConnection();
conn.setRequestMethod("GET");
try (InputStream in = conn.getInputStream()) {
  return new String(in.readAllBytes(), StandardCharsets.UTF_8); // readAllBytes is 9+
}`,
      new: `HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/payment"))
    .GET()
    .build();
return HttpClient.newHttpClient()
    .send(request, HttpResponse.BodyHandlers.ofString())
    .body();`,
      whatChanged: 'First-class HTTP client with timeouts and async.',
      why: 'Fewer dependencies; clearer cancellation/timeout semantics.',
      workload: 'Outbound I/O heavy microservices.',
      newBottleneck: 'Default executor / connection behavior — tune for your fan-out.',
    },
  ],
  interviewQuestions: [
    'What broke when Java EE modules left the JDK, and how do you fix a Spring Boot 2 app?',
    'Compare HttpClient to WebClient/RestTemplate for an internal payment API.',
    'How do you operationalize JFR in Kubernetes?',
  ],
  architectQuestions: [
    'Design a two-year plan to exit Java 8 with Java 11 as a forced intermediate LTS.',
    'How do you handle a vendor library that still ships only Java 8 bytecode but uses JDK-internal APIs?',
  ],
  commonMistakes: [
    'Assuming javax.xml.bind still exists on the classpath',
    'Ignoring illegal reflective access warnings until 17 encapsulation breaks you',
    'Treating ZGC experimental status as production-ready in early 11',
  ],
};
