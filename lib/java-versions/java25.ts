import type {FeatureCard, VersionSection} from './types';

/**
 * Java 25 content verified against https://openjdk.org/projects/jdk/25/
 * GA: 16 September 2025. LTS from most vendors.
 */
export const JAVA_25_FINAL_FEATURES: FeatureCard[] = [
  {
    name: 'Scoped Values',
    status: 'FINAL',
    jep: 'JEP 506',
    problem: 'ThreadLocal is mutable, unbounded in lifetime, and costly with millions of virtual threads.',
    before: 'ThreadLocal / MDC for request id, tenant, principal.',
    solution: 'ScopedValue with explicit binding lifetime for immutable context.',
    production: 'Request context propagation in VT-heavy services; prefer over ThreadLocal for new code.',
    interview: 'Contrast ScopedValue with ThreadLocal for a multi-tenant payment API on virtual threads.',
    code: `static final ScopedValue<String> TENANT = ScopedValue.newInstance();

ScopedValue.where(TENANT, tenantId).run(() -> {
  paymentService.authorize(request);
});`,
  },
  {
    name: 'Key Derivation Function API',
    status: 'FINAL',
    jep: 'JEP 510',
    problem: 'KDFs were fragmented across provider-specific APIs.',
    before: 'Ad-hoc PBKDF2/HKDF via provider strings.',
    solution: 'Standard java.security KDF API.',
    production: 'Password-based keys, HKDF in token/crypto platforms.',
    interview: 'Where does KDF sit relative to the Java 21 KEM API in a crypto story?',
  },
  {
    name: 'Module Import Declarations',
    status: 'FINAL',
    jep: 'JEP 511',
    problem: 'Importing many packages from a module is noisy in scripts and compact programs.',
    before: 'Long import lists.',
    solution: 'import module … declarations.',
    production: 'More relevant to compact source / tooling; be cautious in large apps’ style guides.',
    interview: 'How do module imports interact with the module system’s encapsulation rules?',
  },
  {
    name: 'Compact Source Files and Instance Main Methods',
    status: 'FINAL',
    jep: 'JEP 512',
    problem: 'Java’s ceremony blocked simple programs and teaching/tooling entry points.',
    before: 'public class App { public static void main(String[] args) { ... } }',
    solution: 'Compact source files and instance main methods as finalized language ergonomics.',
    production: 'Handy for ops tools and samples; not a reason alone to migrate a monolith.',
    interview: 'Would you allow compact source files in a regulated payments monorepo? Why or why not?',
  },
  {
    name: 'Flexible Constructor Bodies',
    status: 'FINAL',
    jep: 'JEP 513',
    problem: 'Constructors could not freely validate/compute before super(...) in useful ways.',
    before: 'Awkward factory methods or static helpers only.',
    solution: 'More flexible statements before constructor chaining (per JEP rules).',
    production: 'Cleaner domain invariants in class hierarchies.',
    interview: 'How does this change fail-fast validation in base/derived domain types?',
  },
  {
    name: 'Ahead-of-Time Command-Line Ergonomics',
    status: 'FINAL',
    jep: 'JEP 514',
    problem: 'AOT workflow UX was hard to operationalize.',
    before: 'Complex AOT flag combinations.',
    solution: 'Improved AOT command-line ergonomics for training/production workflows.',
    production: 'Faster warm-up experiments for serverless / scale-to-zero style services.',
    interview: 'How would you prove AOT helps your p95 cold start without harming peak throughput?',
  },
  {
    name: 'Ahead-of-Time Method Profiling',
    status: 'FINAL',
    jep: 'JEP 515',
    problem: 'AOT benefits need profile knowledge from prior runs.',
    before: 'Warm-up cliffs on every new pod.',
    solution: 'AOT method profiling support in the HotSpot AOT train.',
    production: 'Container platforms with frequent reschedule.',
    interview: 'What operational pipeline collects and ships AOT profiles safely?',
  },
  {
    name: 'JFR Cooperative Sampling',
    status: 'FINAL',
    jep: 'JEP 518',
    problem: 'Safer/more reliable JFR sampling mechanics.',
    before: 'Older sampling approaches with more safepoint sensitivity.',
    solution: 'Cooperative sampling improvements in JFR.',
    production: 'Always-on profiling with better signal for CPU issues.',
    interview: 'How do you use JFR method timing (520) + cooperative sampling in an incident?',
  },
  {
    name: 'Compact Object Headers',
    status: 'FINAL',
    jep: 'JEP 519',
    problem: 'Object header overhead dominates heaps with many small objects.',
    before: 'Larger headers → more RAM / GC traffic for same graph.',
    solution: 'Compact object headers to reduce memory footprint.',
    production: 'Allocation-heavy services (caching DTOs, messaging fan-in).',
    interview: 'How would you quantify heap savings after enabling compact headers?',
  },
  {
    name: 'JFR Method Timing & Tracing',
    status: 'FINAL',
    jep: 'JEP 520',
    problem: 'Need finer method-level timing/tracing in production recordings.',
    before: 'Coarser events or heavy external agents.',
    solution: 'JFR method timing & tracing events.',
    production: 'Hot method diagnosis without attaching a heavy profiler first.',
    interview: 'Design a production JFR policy that won’t drown storage.',
  },
  {
    name: 'Generational Shenandoah',
    status: 'FINAL',
    jep: 'JEP 521',
    problem: 'Shenandoah needed generational design for many allocation patterns.',
    before: 'Non-generational Shenandoah / choose G1 or ZGC.',
    solution: 'Generational Shenandoah as a low-pause option on supporting builds.',
    production: 'Evaluate alongside Generational ZGC and G1 with your heap shape.',
    interview: 'How do you run a fair GC bake-off across G1 / GenZGC / Gen Shenandoah?',
  },
  {
    name: 'Remove the 32-bit x86 Port',
    status: 'REMOVED',
    jep: 'JEP 503',
    problem: 'Maintaining 32-bit x86 was unjustified cost.',
    before: '32-bit x86 JDK port existence.',
    solution: 'Port removed — 64-bit only for that line.',
    production: 'Confirm no embedded/legacy 32-bit x86 Java runtimes remain.',
    interview: 'What inventory checks prove you are safe after a port removal?',
  },
];

export const JAVA_25_PREVIEW_FEATURES: FeatureCard[] = [
  {
    name: 'PEM Encodings of Cryptographic Objects',
    status: 'PREVIEW',
    jep: 'JEP 470',
    problem: 'PEM encode/decode often hand-rolled.',
    before: 'BouncyCastle / custom parsers.',
    solution: 'Preview PEM encodings API — not final.',
    production: 'Do not standardize on preview crypto APIs in regulated cores.',
    interview: 'How do you governance-gate preview security APIs?',
  },
  {
    name: 'Stable Values',
    status: 'PREVIEW',
    jep: 'JEP 502',
    problem: 'Defer immutable value init with safer publication patterns.',
    before: 'Lazy holders / double-checked locking variants.',
    solution: 'Preview Stable Values.',
    production: 'Experiment only behind feature flags.',
    interview: 'Compare Stable Values to classic holder idioms for class-init costs.',
  },
  {
    name: 'Structured Concurrency',
    status: 'PREVIEW',
    jep: 'JEP 505 (fifth preview)',
    problem: 'Task lifetimes and cancellation need structure.',
    before: 'Ad-hoc futures; earlier preview APIs evolved.',
    solution: 'Still preview in 25 — API may still change.',
    production: 'Abstract now; adopt when final.',
    interview: 'Why is a fifth preview a signal for architecture standards committees?',
  },
  {
    name: 'Primitive Types in Patterns, instanceof, and switch',
    status: 'PREVIEW',
    jep: 'JEP 507 (third preview)',
    problem: 'Pattern matching gaps for primitives.',
    before: 'Manual conversions / overloaded switches.',
    solution: 'Preview primitive patterns.',
    production: 'Keep off the critical path until final.',
    interview: 'What breaks if you ship preview language syntax in a shared library?',
  },
];

export const JAVA_25_INCUBATOR_FEATURES: FeatureCard[] = [
  {
    name: 'Vector API',
    status: 'INCUBATOR',
    jep: 'JEP 508 (tenth incubator)',
    problem: 'Explicit SIMD-style programming for numeric kernels.',
    before: 'Scalar code + hope for auto-vectorization.',
    solution: 'Incubator module — unstable, export rules apply.',
    production: 'Isolate in optional modules; never leak into public APIs.',
    interview: 'Incubator vs preview — which can you put in a supported platform BOM?',
  },
];

export const JAVA_25_EXPERIMENTAL: FeatureCard[] = [
  {
    name: 'JFR CPU-Time Profiling',
    status: 'EXPERIMENTAL',
    jep: 'JEP 509',
    problem: 'Better CPU-time profiling signal in JFR.',
    before: 'Wall-clock sampling dominant.',
    solution: 'Experimental CPU-time profiling events.',
    production: 'Use in controlled diagnostics, not as a hard dependency.',
    interview: 'When is CPU-time vs wall-time the right incident metric?',
  },
];

export const JAVA_25: VersionSection = {
  id: 'java-25',
  version: 'Java 25',
  year: '2025',
  lts: true,
  overview:
    'Java 25 (GA 16 Sep 2025) is the latest LTS from most vendors. Verified finals include Scoped Values, KDF API, module imports, compact source/instance main, flexible constructors, AOT ergonomics/profiling, JFR sampling/timing improvements, compact object headers, generational Shenandoah, and removal of 32-bit x86. Structured Concurrency and Vector API are still not final.',
  whyMatters:
    'It is the new long-term baseline after 21: context propagation (scoped values), memory footprint (compact headers), GC choice expansion (gen Shenandoah), and observability/AOT. Architects must separate FINAL vs PREVIEW vs INCUBATOR in any recommendation.',
  majorFeatures: [
    ...JAVA_25_FINAL_FEATURES,
    ...JAVA_25_PREVIEW_FEATURES,
    ...JAVA_25_INCUBATOR_FEATURES,
    ...JAVA_25_EXPERIMENTAL,
  ],
  language: [
    'Module import declarations (final)',
    'Compact source files & instance main (final)',
    'Flexible constructor bodies (final)',
    'Primitive patterns (preview — not final)',
  ],
  api: [
    'Scoped Values final',
    'KDF API final',
    'PEM encodings preview',
    'Stable Values preview',
  ],
  jvm: [
    'AOT CLI ergonomics + method profiling',
    'Compact object headers',
    '32-bit x86 port removed',
  ],
  gc: ['Generational Shenandoah final', 'Continue Gen ZGC / G1 evaluations from 21 era'],
  concurrency: [
    'Scoped Values final — production-ready context alternative',
    'Structured Concurrency still preview (JEP 505)',
  ],
  security: ['KDF API final', 'PEM preview — govern carefully'],
  performance: [
    'Compact headers → heap/GC pressure reductions on small-object graphs',
    'AOT profiling → warm-up oriented gains, measure per service',
  ],
  deprecated: ['Track jdeprscan deltas 21→25 for your exact vendor JDK'],
  removed: ['32-bit x86 port (JEP 503)'],
  productionUsage: [
    'New greenfield LTS target when frameworks certify',
    'Scoped values adoption alongside VT',
    'Preview/incubator features barred by default in platform standards',
  ],
  migrationImpact: [
    'Confirm Spring/Hibernate/Kafka client matrices for 25',
    'Re-run GC bake-offs if you adopt Gen Shenandoah',
    'Do not assume 21 previews became final — verify each JEP',
  ],
  codePairs: [
    {
      title: 'Request context',
      oldLabel: 'ThreadLocal (classic)',
      newLabel: 'Java 25 ScopedValue (final)',
      old: `static final ThreadLocal<String> TENANT = new ThreadLocal<>();
try {
  TENANT.set(tenantId);
  paymentService.authorize(request);
} finally {
  TENANT.remove();
}`,
      new: `static final ScopedValue<String> TENANT = ScopedValue.newInstance();
ScopedValue.where(TENANT, tenantId).run(() ->
    paymentService.authorize(request)
);`,
      whatChanged: 'Mutable thread-local → immutable, bounded scoped binding.',
      why: 'Safer with virtual threads; clearer lifetime; harder to leak.',
      workload: 'High-concurrency request context.',
      newBottleneck: 'Libraries still on ThreadLocal/MDC need a bridging strategy.',
    },
  ],
  interviewQuestions: [
    'List JDK 25 features that are final vs still preview as of GA.',
    'Why is Structured Concurrency still not a platform standard in 25?',
    'How do compact object headers change capacity planning?',
  ],
  architectQuestions: [
    'Should your org skip 21 and jump 17→25, or land on 21 first?',
    'Design governance for preview JEPs across 40 teams.',
  ],
  commonMistakes: [
    'Presenting Structured Concurrency as final in 25',
    'Assuming String Templates finalized (they did not on the JDK 25 project page)',
    'Enabling every preview flag “for modernity”',
  ],
};
