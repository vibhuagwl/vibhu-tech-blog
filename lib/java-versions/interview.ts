import type {InterviewQuestion, Scenario} from './types';

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'why-21-over-17',
    topic: 'Architecture',
    difficulty: 'Architect',
    question: 'Why would you choose Java 21 over Java 17 for a blocking Spring MVC payments platform?',
    answer:
      'Java 17 already gives records/sealed/encapsulation. Java 21 adds final virtual threads and pattern/record improvements that matter if the platform is I/O-bound and thread-pool bound. I would choose 21 when we can pilot VT safely, have pool telemetry, and frameworks are certified. If the estate is CPU-bound pricing engines with no thread starvation, 17 may remain sufficient until a broader LTS move.',
    keyPoints: [
      'Name the concrete capability: VT final',
      'Tie to workload (I/O wait vs CPU)',
      'Call out pool/pinning risks',
      'Certification + pilot before estate-wide',
    ],
    followUp: 'What would make you skip 21 and wait for 25?',
    productionExample: 'Tomcat request threads stuck at 400 while CPU is 25% — classic VT candidate.',
  },
  {
    id: 'direct-8-to-25',
    topic: 'Migration',
    difficulty: 'Principal',
    question: 'Would you migrate a 10-year-old Java 8 monolith directly to Java 25?',
    answer:
      'Rarely as one technical PR. I would stage: dependency/Java EE cleanup → 11 or 17 toolchain → framework/Jakarta → 17 language modernization → 21 concurrency decisions → 25 when certified. A “direct” cut is only for small, well-tested services with already-modern deps. For a monolith, intermediate LTS landings reduce blast radius and create rollback points.',
    keyPoints: ['Stage risk', 'Framework coupling', 'Rollback points', 'Exception for small services'],
    followUp: 'How many intermediate production landings would you require?',
    productionExample: 'Monolith still on javax.* + CMS flags + Java 8-only drivers.',
  },
  {
    id: 'five-hundred-services',
    topic: 'Architecture',
    difficulty: '25+ Years',
    question: 'How would you migrate 500 microservices from Java 8 to Java 21?',
    answer:
      'Platform strategy first: golden JDK image, company BOM, compatibility CI matrix, paved-road Spring Boot version, observability baselines. Pilot 5–10 diverse services. Wave by risk (stateless read → write → money movement). Automate build plugin upgrades. Ban preview flags. Track progress on a service scorecard (compiles / tests / canary / done). Budget framework upgrades separately from JDK bumps when needed.',
    keyPoints: ['Golden JDK', 'BOM', 'Waves', 'Pilots', 'Scorecards', 'Governance'],
    followUp: 'How do you handle a team that cannot leave a Java 8-only vendor SDK?',
    productionExample: '40 teams, shared Jenkins agents, mixed Boot 2/3.',
  },
  {
    id: 'roi',
    topic: 'Architecture',
    difficulty: 'Principal',
    question: 'How would you justify JDK migration ROI to management?',
    answer:
      'Frame in risk and option value: security support cadence, hiring/productivity on modern language, cloud cost via better GC/footprint/concurrency, reduced reactive rewrite pressure if VT fits, and avoided incident cost from unsupported runtimes. Provide a wave plan with capacity hours, not a feature laundry list.',
    keyPoints: ['Support risk', 'Cost', 'Productivity', 'Risk avoided', 'Plan with waves'],
    followUp: 'What leading metrics prove the program is working after 90 days?',
    productionExample: 'Insurance/regulatory pressure to leave unsupported JDK 8.',
  },
  {
    id: 'zero-downtime',
    topic: 'Migration',
    difficulty: 'Staff',
    question: 'How would you perform a zero-downtime JDK migration?',
    answer:
      'Immutable blue/green or rolling with mixed JDK versions briefly allowed. Contract tests ensure wire compatibility. Canary with error/latency/GC/RSS guards. Sticky sessions avoided or drained. Rollback is previous image, not “install old JDK on node”. Schema/API changes decoupled from JDK bump.',
    keyPoints: ['Rolling/B-G', 'Mixed versions OK briefly', 'Canary gates', 'Image rollback'],
    followUp: 'What breaks if serialization formats differ across JDK versions?',
    productionExample: 'K8s Deployment with maxUnavailable and canary ReplicaSet.',
  },
  {
    id: 'vt-vs-webflux',
    topic: 'Concurrency',
    difficulty: 'Architect',
    question: 'When would you choose virtual threads over WebFlux?',
    answer:
      'Choose VT when the team thinks in blocking style, libraries are blocking (JDBC), and the pain is thread scarcity under wait. Keep/choose WebFlux when you need native backpressure streaming, already have a reactive ecosystem, or must integrate end-to-end nonblocking with existing WebFlux skills. VT is not a reactive programming model.',
    keyPoints: ['Blocking ecosystem', 'Skills', 'Backpressure', 'Not a silver bullet'],
    followUp: 'Can VT and WebFlux coexist in one company?',
    productionExample: 'MVC + Hikari + RestClient fan-out authorization service.',
  },
  {
    id: 'vt-db-saturation',
    topic: 'Concurrency',
    difficulty: 'Staff',
    question: 'How can virtual threads cause database saturation?',
    answer:
      'VT make it cheap to create many concurrent blocking JDBC calls. If the app concurrency exceeds Hikari max and DB max_connections / CPU, waits move to the pool or the database. CPU may look healthier while DB latency explodes. Fix with bulkheads, pool sizing, admission control, and timeouts — not by “adding more virtual threads”.',
    keyPoints: ['Concurrency amplification', 'Pool limits', 'Admission control'],
    followUp: 'What metrics prove this hypothesis in production?',
    productionExample: 'After VT enablement: JVM CPU down, Oracle awaiters up.',
  },
  {
    id: 'pinning',
    topic: 'Concurrency',
    difficulty: 'Senior',
    question: 'How do you detect virtual thread pinning?',
    answer:
      'Use JFR events for virtual thread pinning / pinned durations, correlate with synchronized blocks and native calls in hot stacks. Reproduce under load. Refactor to java.util.concurrent locks where appropriate, shorten critical sections, and avoid pinning in I/O wrappers.',
    keyPoints: ['JFR', 'synchronized', 'native', 'refactor locks'],
    followUp: 'Is all synchronization forbidden with VT?',
    productionExample: 'Legacy SOAP client synchronized on a shared buffer.',
  },
  {
    id: 'jit',
    topic: 'JVM',
    difficulty: 'Senior',
    question: 'How does JIT compilation work in HotSpot?',
    answer:
      'Methods start interpreted (or with templates). Tiered compilation profiles them, C1 compiles quickly with profiling, hot methods graduate to C2 for heavy optimization (inlining, EA, vectorization opportunities). Code lives in the code cache. Deoptimization can kick methods back when assumptions fail.',
    keyPoints: ['Tiered', 'C1/C2', 'Profiling', 'Deopt', 'Code cache'],
    followUp: 'How do compact object headers or AOT profiles change warm-up?',
    productionExample: 'p99 improves 10 minutes after deploy — classic JIT warm-up.',
  },
  {
    id: 'escape-analysis',
    topic: 'JVM',
    difficulty: 'Staff',
    question: 'What is escape analysis?',
    answer:
      'A JIT analysis determining whether an object escapes a thread/method. If not, the compiler may scalar-replace fields and avoid heap allocation. It is opportunistic — never an API contract. Microbenchmarks lie when they accidentally prevent escape.',
    keyPoints: ['Non-escaping', 'Scalar replacement', 'Not guaranteed'],
    followUp: 'How would you confirm allocation actually dropped?',
    productionExample: 'Small payment money objects in a hot loop.',
  },
  {
    id: 'g1-vs-z',
    topic: 'JVM',
    difficulty: 'Architect',
    question: 'When would you choose ZGC over G1?',
    answer:
      'When pause goals are strict and heaps are large enough that G1 mixed collections threaten SLOs, and after a bake-off shows Gen ZGC meeting throughput needs. G1 remains an excellent default. Never pick Z from a blog post without allocation/live-set evidence.',
    keyPoints: ['Pause budget', 'Heap shape', 'Bake-off', 'Generational Z'],
    followUp: 'Where does Generational Shenandoah (25) enter the decision?',
    productionExample: '32–128GB heap market-data cache service.',
  },
  {
    id: 'gc-pause-5s',
    topic: 'JVM',
    difficulty: 'Staff',
    question: 'How would you troubleshoot a 5-second GC pause?',
    answer:
      'Confirm it is GC via logs/JFR (not a safepoint storm or container throttle). Identify collector, pause phase, heap occupancy, to-space/exhaustion, humongous/region issues, native leaks. Check CPU starvation and staging. Remediate with heap sizing, live-set reduction, collector change, or allocation rate fixes — in that evidence order.',
    keyPoints: ['Prove GC', 'Phase', 'Live set', 'CPU', 'Then tune'],
    followUp: 'What if GC logs are clean but the pod still stalls 5s?',
    productionExample: 'G1 evacuation failure under sudden cache refill.',
  },
  {
    id: 'scoped-25',
    topic: 'Java 25',
    difficulty: 'Architect',
    question: 'What finalized in Java 25 that changes production concurrency design?',
    answer:
      'Scoped Values (JEP 506) are final — a better request-context mechanism for VT-heavy systems than ThreadLocal. Structured Concurrency is still preview (JEP 505), so do not standardize it yet. Also call compact headers and Gen Shenandoah as capacity/GC options, not concurrency primitives.',
    keyPoints: ['Scoped Values final', 'SC still preview', 'Don’t invent finals'],
    followUp: 'How do you migrate MDC logging to scoped values?',
    productionExample: 'Tenant + correlation id across VT fan-out.',
  },
  {
    id: 'illegal-access',
    topic: 'Migration',
    difficulty: 'Senior',
    question: 'Why does illegal reflective access happen on the 11→17 path, and how do you fix it?',
    answer:
      'Libraries and agents used deep reflection into JDK internals. Warnings on 9–16 become hard failures with strong encapsulation in 17. Fix by upgrading libraries, removing hacks, or temporarily using --add-opens with an expiry ticket — never as permanent platform policy.',
    keyPoints: ['Encapsulation', 'Upgrade first', 'Temporary opens', 'CI detection'],
    followUp: 'How do you detect this in CI before production?',
    productionExample: 'Old Mockito/ByteBuddy on Boot 2 during forced 17 move.',
  },
  {
    id: 'biased-locking',
    topic: 'JVM',
    difficulty: 'Principal',
    question: 'What happened to biased locking, and why do outdated answers fail interviews?',
    answer:
      'Biased locking was disabled by default in modern JDKs and subsequently removed. Recommending -XX:+UseBiasedLocking signals stale operational knowledge. Discuss modern contention tools: JFR, better locks, reduced sharing, VT pinning awareness.',
    keyPoints: ['Disabled/removed', 'Stale flags', 'Modern toolkit'],
    followUp: 'Which other classic HotSpot flags are now traps?',
    productionExample: 'Copied JVM flags from a 2015 runbook into a 21 image.',
  },
];

export const PRINCIPAL_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'org-300',
    topic: 'Architecture',
    difficulty: '25+ Years',
    question:
      'You have 300 Java 8 microservices, 40 teams, and a two-year modernization target. Design the Java migration strategy.',
    answer:
      'Create a platform program: golden JDK (start 17 or 21), enforced BOM, paved-road service template, CI matrix, and migration scorecard. Split workstreams: (1) dependencies/Java EE, (2) framework/Jakarta, (3) JDK LTS landings, (4) optional VT adoption. Pilot → wave → harden. Fund enablement (training, office hours). Gate prod on canary SLOs. Explicitly forbid preview features. Communicate rollback and exception process for vendor SDKs.',
    keyPoints: [
      'Golden JDK',
      'BOM',
      'Compatibility matrix',
      'Pilot services',
      'Migration waves',
      'CI/CD',
      'Canary',
      'Observability',
      'Rollback',
      'Governance',
      'Developer enablement',
    ],
    followUp: 'How do you handle funding when product teams reject “non-feature” work?',
    productionExample: 'Shared platform org + federated domain teams.',
  },
  {
    id: 'vt-replace-reactive',
    topic: 'Concurrency',
    difficulty: 'Architect',
    question: 'Can virtual threads replace reactive programming in your estate?',
    answer:
      'They can replace many reactive uses that existed only to avoid scarce platform threads for blocking I/O. They do not replace reactive for streaming backpressure, end-to-end nonblocking pipelines, or complex event flows already modeled as publishers. Architect for coexistence: VT for request/response blocking style; reactive for stream processors.',
    keyPoints: ['Replace thread-scarcity motives', 'Not backpressure', 'Coexistence'],
    followUp: 'What is your public architecture standard sentence for new services?',
    productionExample: 'API tier on VT; Kafka stream processors stay Reactor.',
  },
  {
    id: 'rollback-jdk',
    topic: 'Migration',
    difficulty: 'Principal',
    question: 'How would you roll back a JDK upgrade in production?',
    answer:
      'Rollback the artifact/image to the previous digest, not “yum downgrade” on a pet VM. Keep config compatible across the two JDKs for the canary window. Avoid irreversible serialization changes in the same release. Practice rollback in staging. Watch sticky session / warm caches. Communicate data-plane compatibility guarantees before the upgrade.',
    keyPoints: ['Image digest', 'Compat window', 'No coupled schema breaks', 'Practice'],
    followUp: 'What if the upgrade includes a required security fix you cannot roll back?',
    productionExample: 'K8s ReplicaSet rollback / blue-green switch.',
  },
];

export const SCENARIOS: Scenario[] = [
  {
    id: 's1',
    title: '20M tx/day Java 8 → 21',
    scenario:
      'A Java 8 payment service processes 20 million transactions per day. Migrate it to Java 21.',
    pillars: [
      'Assessment',
      'Dependency analysis',
      'Compatibility',
      'Code migration',
      'Testing',
      'Performance',
      'GC',
      'Security',
      'Canary',
      'Monitoring',
      'Rollback',
    ],
    answer:
      'Assess runtime flags/GC/deps and payment SLOs. Stage via 11/17 if frameworks demand it; do not combine Jakarta + VT + business features. Prove parity with contract + replay tests. Load test at 1.5× peak. Decide VT only after pool telemetry. Canary by percentage of traffic with automatic rollback on auth error rate / p99 / DB waits.',
  },
  {
    id: 's2',
    title: '2000 platform threads',
    scenario: 'A Java 17 application has 2,000 platform threads. Should you migrate it to virtual threads?',
    pillars: ['Workload characterization', 'Wait vs CPU', 'Pools', 'Risk'],
    answer:
      'Investigate why 2,000 exist. If mostly blocked on I/O, VT likely helps and shrinks carrier count. If CPU-bound workers, VT will not raise throughput. If the count is a symptom of stuck threads, fix leaks first. Pilot with limits and compare DB wait, latency, and RSS.',
  },
  {
    id: 's3',
    title: 'CPU down, DB latency up',
    scenario: 'After Java 21 + VT migration, CPU decreased but database latency increased. Why?',
    pillars: ['Concurrency amplification', 'Pool saturation', 'Admission control'],
    answer:
      'VT allowed more concurrent blocking JDBC. The bottleneck moved to Hikari/DB. CPU fell because the app waits more efficiently. Fix concurrency gates and pool sizing; confirm with pool active/pending and DB session waits.',
  },
  {
    id: 's4',
    title: 'Memory up after upgrade',
    scenario: 'After migration, memory usage increased. How do you investigate?',
    pillars: ['Heap vs RSS', 'Metaspace', 'Threads', 'Agents', 'GC'],
    answer:
      'Split heap, metaspace, direct/native, thread stacks, and agent overhead. NMT + jcmd + JFR. VT usually lowers stack RSS vs thousands of platform threads — an increase suggests heap live set, coder cache, or native leak. Compare GC logs and allocation rates across versions.',
  },
  {
    id: 's5',
    title: 'Spring Boot 2 on 8',
    scenario: '200 Spring Boot 2 services on Java 8 must reach a supported LTS in 12 months.',
    pillars: ['Framework first', 'Jakarta', 'JDK waves'],
    answer:
      'Plan Boot 3/Jakarta as the critical path; Java 17 is the natural landing. Some may stop at 11 briefly if deps force it, but do not end at 11. Automate upgrades, maintain a forbidden-deps list, and track service readiness.',
  },
  {
    id: 's6',
    title: 'Reactive rewrite vs VT',
    scenario: 'Leadership proposes rewriting MVC payments to WebFlux for scale. You know Java 21 is available.',
    pillars: ['Cost', 'Risk', 'Skills', 'Fit'],
    answer:
      'Compare rewrite cost vs VT pilot. If blocking JDBC dominates, VT is cheaper. If they need streaming backpressure end-to-end, reactive may still win. Present a 6-week VT pilot with success metrics before approving a multi-quarter rewrite.',
  },
  {
    id: 's7',
    title: 'CMS flags on 17',
    scenario: 'A team copies Java 8 CMS JVM flags into a Java 17 container and wonders why startup fails.',
    pillars: ['Removed GC', 'Flag hygiene'],
    answer:
      'CMS was removed in 14. Teach flag inventories against release notes and fail CI on unknown options. Re-establish GC goals and re-tune on G1/Z.',
  },
  {
    id: 's8',
    title: 'Preview in shared lib',
    scenario: 'A platform library enables --enable-preview for Structured Concurrency on Java 21 and publishes to the company Nexus.',
    pillars: ['Governance', 'API stability'],
    answer:
      'Reject. Preview APIs can change (and SC is still preview in 25). Platform libraries must stick to final APIs. Provide an internal facade if experimentation is needed behind a non-default module.',
  },
  {
    id: 's9',
    title: 'Kafka + TLS after upgrade',
    scenario: 'After 8→17, consumers fail TLS handshake to an old broker.',
    pillars: ['Security defaults', 'Compat testing'],
    answer:
      'Modern JDKs disable legacy protocols/ciphers. Test handshake in CI against real broker configs. Prefer upgrading brokers; temporary limited re-enablement only with security exception.',
  },
  {
    id: 's10',
    title: 'Records in JPA',
    scenario: 'A team models JPA entities as records on Java 17 and sees dirty checking / proxy pain.',
    pillars: ['ORM constraints', 'DDD boundaries'],
    answer:
      'Keep entities as classes; use records for DTOs/events. Explain proxies, mutable state, and no-arg constructor expectations. Show a hexagonal mapping layer.',
  },
  {
    id: 's11',
    title: 'Parallel stream outage',
    scenario: 'A reporting endpoint uses parallelStream and starves CompletableFuture.supplyAsync work cluster-wide.',
    pillars: ['commonPool', 'Isolation'],
    answer:
      'Both share ForkJoinPool.commonPool. Isolate with custom pools, avoid parallelStream on request threads, and protect with bulkheads.',
  },
  {
    id: 's12',
    title: '17→21 canary green, prod red',
    scenario: 'Canary looks fine at 1% but fails at 25% traffic after VT enablement.',
    pillars: ['Nonlinear saturation', 'Limits'],
    answer:
      'Downstream limits are nonlinear. 1% may not hit DB max sessions. Use shadow load and staged 1→5→25→50 with DB await metrics as hard gates.',
  },
  {
    id: 's13',
    title: 'Scoped values adoption',
    scenario: 'On Java 25, should you rewrite all MDC to Scoped Values immediately?',
    pillars: ['Incremental', 'Libraries'],
    answer:
      'No big-bang. Abstract context access, adopt Scoped Values in new code/pilots, bridge to MDC for logging libs, and migrate frameworks as they support it.',
  },
  {
    id: 's14',
    title: 'Gen Shenandoah bake-off',
    scenario: 'JDK 25 is certified. Should every service switch to Generational Shenandoah?',
    pillars: ['Evidence', 'Diversity'],
    answer:
      'No. Run bake-offs per heap shape. Keep G1 as default paved road; allow Gen Z/Gen Shenandoah where pause/throughput evidence wins.',
  },
  {
    id: 's15',
    title: 'Compact headers capacity',
    scenario: 'Finance asks if Java 25 compact headers means you can cut heap by 30% everywhere.',
    pillars: ['Measure', 'Variance'],
    answer:
      'Savings depend on object graph shape. Measure retained heap and RSS on pilots; never apply a uniform 30% cut across estates.',
  },
  {
    id: 's16',
    title: 'Vendor SDK stuck on 8',
    scenario: 'Card network SDK only supports Java 8.',
    pillars: ['Isolation', 'Risk accept'],
    answer:
      'Contain in an anti-corruption service on an older runtime if unavoidable, with aggressive network isolation and a vendor exit plan. Do not freeze the whole estate.',
  },
  {
    id: 's17',
    title: 'ThreadLocal leak with VT',
    scenario: 'After VT, memory grows; heap dumps show ThreadLocal maps exploding.',
    pillars: ['Context hygiene', 'Scoped values'],
    answer:
      'ThreadLocals on short-lived VTs are hazardous if not cleared or if libraries cache heavily. Prefer scoped values (25) / careful frameworks; ensure remove() in legacy paths; consider disabling VT for the offending path until fixed.',
  },
  {
    id: 's18',
    title: 'CPU-bound pricing',
    scenario: 'Pricing engine is CPU-bound. Manager heard virtual threads make Java faster.',
    pillars: ['Correct the myth'],
    answer:
      'Refuse the myth. Size pools to cores, improve algorithms/vectorization carefully, and use VT only on I/O edges of the system.',
  },
  {
    id: 's19',
    title: 'jdeprscan surprises',
    scenario: 'CI introduces jdeprscan and the monolith floods with warnings.',
    pillars: ['Triage', 'Burn-down'],
    answer:
      'Classify by removal risk vs cosmetic. Burn down removals before the next LTS. Do not hide the task; put it on the scorecard.',
  },
  {
    id: 's20',
    title: 'Multi-JDK in one repo',
    scenario: 'Monorepo must build some libs on 17 and apps on 21/25.',
    pillars: ['Toolchains', 'API levels'],
    answer:
      'Use toolchains, release multi-release jars only when justified, keep public libraries on the oldest supported bytecode you truly need, and document the support matrix.',
  },
  {
    id: 's21',
    title: 'Flight Recorder in K8s',
    scenario: 'How do you run JFR continuously without filling disks?',
    pillars: ['Ring buffers', 'Dump on demand', 'Privacy'],
    answer:
      'Continuous recording to ram/ring, dump on alert, ship sparingly, redact sensitive args, and automate jcmd in runbooks.',
  },
  {
    id: 's22',
    title: 'Sealed payments API',
    scenario: 'Partners want to add new payment types without coordinating your release.',
    pillars: ['sealed vs non-sealed', 'Evolution'],
    answer:
      'Use non-sealed extension points or versioned export models for partner plugins; keep core ledger variants sealed for exhaustiveness inside the bank domain.',
  },
  {
    id: 's23',
    title: 'AOT for serverless Java',
    scenario: 'A Java 25 function has painful cold starts. Do you enable AOT immediately?',
    pillars: ['Measure', 'Profiles', 'Complexity'],
    answer:
      'Profile cold start contributions (JVM vs Spring vs JIT). Try AOT ergonomics/profiling with a controlled pipeline; validate peak throughput and failure modes before estate adoption.',
  },
  {
    id: 's24',
    title: 'Mixed 17/21 during wave',
    scenario: 'Service A on 21 calls Service B on 17 — is that safe?',
    pillars: ['Wire compat'],
    answer:
      'Yes if wire contracts (JSON/Avro/HTTP) are versioned and tested. JDK version is a deployment detail, not a protocol. Avoid Java serialization across services.',
  },
  {
    id: 's25',
    title: 'Epsilon in CI',
    scenario: 'A developer enables Epsilon GC in a long-running integration test suite to “go faster”.',
    pillars: ['GC choice'],
    answer:
      'Epsilon never reclaims. Only for ultra-short jobs with bounded allocation. Revert; educate; add guardrails in the shared JVM options library.',
  },
  {
    id: 's26',
    title: 'Pattern switch exhaustiveness',
    scenario: 'Adding a new sealed subtype breaks compilation in 40 switch sites on Java 21.',
    pillars: ['Feature, not bug'],
    answer:
      'That is the point of sealed+switch. Treat breaks as a safety feature; provide migration helpers and keep permits lists deliberate.',
  },
  {
    id: 's27',
    title: 'Hiring signal',
    scenario: 'Interview candidate insists String Templates are final in Java 25.',
    pillars: ['Accuracy'],
    answer:
      'Correct them: not listed as a JDK 25 final feature; preview lineage was withdrawn from the final path earlier. Senior candidates must verify JEP status.',
  },
  {
    id: 's28',
    title: 'Security manager',
    scenario: 'Legacy app still depends on SecurityManager behaviors while moving to 21+.',
    pillars: ['Removal trajectory'],
    answer:
      'Plan removal: replace with OS/container/security policies, JAAS replacements as applicable, and library upgrades. Do not block the estate on a dead subsystem.',
  },
  {
    id: 's29',
    title: 'Observability agents break on 17',
    scenario: 'Old Java agent crashes under strong encapsulation.',
    pillars: ['Vendors', 'Support'],
    answer:
      'Upgrade to supported agent versions, or temporarily add opens with expiry. Make agent compatibility part of the JDK gate.',
  },
  {
    id: 's30',
    title: 'Direct 11→21',
    scenario: 'A small Kotlin-free Spring Boot 3 service on 11 wants to jump to 21 in one release.',
    pillars: ['When direct is OK'],
    answer:
      'Reasonable if Boot/deps already support 21, tests are strong, and the change set is JDK-only. Still run load/GC/TLS canaries. Skip 17 only when the framework matrix allows and the team accepts a larger single hop.',
  },
  {
    id: 's31',
    title: 'Connection pool sizing',
    scenario: 'How do you size HikariCP after enabling virtual threads?',
    pillars: ['Limits', 'DB capacity'],
    answer:
      'Size to database capacity and SLOs, not to VT count. VT are abundant; connections are not. Use admission control so app concurrency ≤ safe pool usage.',
  },
  {
    id: 's32',
    title: 'Interview framework live',
    scenario: 'Interviewer asks you to think aloud about migrating a bank from 8 to 25.',
    pillars: ['Answer framework'],
    answer:
      'Walk Problem → Current architecture → Constraints → Options → Trade-offs → Decision → Migration plan → Testing → Rollout → Observability → Rollback. Explicitly separate FINAL vs PREVIEW for 25.',
  },
];

export const ONE_LINERS: {ask: string; answer: string}[] = [
  {ask: 'Why Java 8?', answer: 'Functional programming surface and modern collection/async APIs (lambdas, streams, CF, java.time).'},
  {ask: 'Why Java 11?', answer: 'First widely adopted post-8 LTS: HTTP Client, ops tooling (JFR), and Java EE modules removed from the JDK.'},
  {ask: 'Why Java 17?', answer: 'Mature LTS with records, sealed classes, pattern matching, text blocks, and strong encapsulation.'},
  {ask: 'Why Java 21?', answer: 'Modern LTS with virtual threads final plus pattern/record switch improvements for concurrency and domain modeling.'},
  {ask: 'Why Java 25?', answer: 'New LTS baseline with verified finals like Scoped Values, compact object headers, AOT/JFR improvements, and Gen Shenandoah — previews still gated.'},
  {ask: 'Do virtual threads speed up CPU-bound code?', answer: 'No — they improve scalability when tasks wait; CPU-bound work still needs ~core-count parallelism.'},
  {ask: 'Is Structured Concurrency production-final in 25?', answer: 'No — JEP 505 is still a preview in JDK 25.'},
  {ask: 'Are Scoped Values final in 25?', answer: 'Yes — JEP 506 finalized Scoped Values in JDK 25.'},
];

export const CHEAT_SHEET = {
  'Java 8': ['Lambda', 'Stream', 'Optional', 'CompletableFuture', 'java.time'],
  'Java 11': ['HTTP Client', 'String/Files APIs', 'Collection factories', 'JFR', 'LTS'],
  'Java 17': ['Records', 'Sealed Classes', 'Pattern instanceof', 'Text Blocks', 'Strong encapsulation', 'LTS'],
  'Java 21': ['Virtual Threads FINAL', 'Record Patterns', 'Pattern switch', 'Sequenced Collections', 'Gen ZGC', 'LTS'],
  'Java 25': [
    'Scoped Values FINAL',
    'KDF API',
    'Compact Object Headers',
    'Gen Shenandoah',
    'AOT ergonomics/profiling',
    'SC still PREVIEW',
    'Vector still INCUBATOR',
    'LTS',
  ],
};

export const ANSWER_FRAMEWORK = [
  'Problem',
  'Current Architecture',
  'Constraints',
  'Options',
  'Trade-offs',
  'Decision',
  'Migration Plan',
  'Testing',
  'Rollout',
  'Observability',
  'Rollback',
];
