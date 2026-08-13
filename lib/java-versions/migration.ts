export const MIGRATION_FLOWS = {
  '8to11': [
    'Inventory JDK + flags + GC',
    'Dependency audit (Java EE modules!)',
    'Remove / replace incompatible libs',
    'Build with JDK 11 toolchain',
    'Unit + integration tests',
    'Prod-like load + perf + GC',
    'Canary',
    'Production + rollback plan',
  ],
  '11to17': [
    'Scan illegal reflective access',
    'Upgrade ByteBuddy/Mockito/agents',
    'Jakarta / Spring Boot matrix',
    'Remove brittle --add-opens where possible',
    'Build on 17',
    'Serialization filter review',
    'Canary + monitor RSS/CPU/GC',
  ],
  '17to21': [
    'Decide VT vs not (decision tree)',
    'Audit synchronized / native pinning',
    'Resize DB & HTTP connection pools',
    'ThreadLocal / MDC strategy',
    'Enable VT in a pilot service',
    'Load test downstream saturation',
    'JFR pinning + pool metrics',
    'Wave rollout',
  ],
  '21to25': [
    'Verify framework certifications for 25',
    'Adopt Scoped Values behind abstractions',
    'Ban preview flags in prod standards',
    'Revisit GC (Gen Shenandoah option)',
    'Measure compact headers impact',
    'AOT experiments for cold-start services',
    'Canary',
  ],
};

export const FULL_MIGRATION_STEPS = [
  'Legacy Java 8',
  'Dependency analysis',
  'Java 11 (stabilize)',
  'Framework upgrade',
  'Java 17 (modernize language/encapsulation)',
  'Application modernization',
  'Java 21 (concurrency modernization)',
  'Java 25 (latest LTS capabilities)',
  'Production steady state',
];

export const CHECKLIST = [
  'Identify current JDK vendor + update version',
  'Identify JVM flags (and remove dead ones)',
  'Identify GC and pause goals',
  'Inventory dependencies (BOM / lockfile)',
  'Check framework compatibility (Spring, Hibernate)',
  'Check database drivers',
  'Check Kafka clients',
  'Check serialization libraries',
  'Check reflection / agents / APM',
  'Check deprecated APIs (jdeprscan)',
  'Check removed APIs / modules',
  'Run static analysis',
  'Upgrade build plugins (Compiler, Surefire, Gradle)',
  'Compile on target JDK',
  'Unit tests',
  'Integration tests',
  'Contract tests',
  'Performance tests',
  'Memory / RSS / NMT tests',
  'GC tests under load',
  'Security tests (TLS, deserialization)',
  'Load tests including downstream limits',
  'Canary deployment',
  'Production monitoring dashboards',
  'Rollback strategy rehearsed',
];

export type RiskLevel = 'Low' | 'Med' | 'High' | 'Critical';

export const RISK_MATRIX: {
  risk: string;
  r8_11: RiskLevel;
  r11_17: RiskLevel;
  r17_21: RiskLevel;
  r21_25: RiskLevel;
  mitigation: string;
}[] = [
  {
    risk: 'Dependency compatibility',
    r8_11: 'High',
    r11_17: 'High',
    r17_21: 'Med',
    r21_25: 'Med',
    mitigation: 'BOM upgrades, CI matrix, vendor cert letters',
  },
  {
    risk: 'Reflection / encapsulation',
    r8_11: 'Med',
    r11_17: 'Critical',
    r17_21: 'Med',
    r21_25: 'Low',
    mitigation: 'Remove illegal access; upgrade agents; temporary --add-opens with expiry',
  },
  {
    risk: 'JVM flags',
    r8_11: 'Med',
    r11_17: 'High',
    r17_21: 'Med',
    r21_25: 'Med',
    mitigation: 'Flag inventory vs release notes; fail CI on unrecognized options',
  },
  {
    risk: 'GC behavior',
    r8_11: 'Med',
    r11_17: 'Med',
    r17_21: 'Med',
    r21_25: 'Med',
    mitigation: 'Bake-off under prod-like load; watch p99 and RSS',
  },
  {
    risk: 'Performance',
    r8_11: 'Med',
    r11_17: 'Med',
    r17_21: 'High',
    r21_25: 'Med',
    mitigation: 'Golden signals + JFR; never rely on release blogs alone',
  },
  {
    risk: 'Security / TLS',
    r8_11: 'High',
    r11_17: 'Med',
    r17_21: 'Med',
    r21_25: 'Med',
    mitigation: 'TLS handshake tests to all brokers/IdPs; crypto policy checks',
  },
  {
    risk: 'Threading model',
    r8_11: 'Low',
    r11_17: 'Low',
    r17_21: 'Critical',
    r21_25: 'Med',
    mitigation: 'VT pilots; pool limits; pinning JFR; scoped value plan',
  },
  {
    risk: 'Framework (Spring etc.)',
    r8_11: 'High',
    r11_17: 'Critical',
    r17_21: 'Med',
    r21_25: 'Med',
    mitigation: 'Align Boot/EE versions; staged framework then JDK',
  },
  {
    risk: 'Serialization',
    r8_11: 'Med',
    r11_17: 'High',
    r17_21: 'Med',
    r21_25: 'Low',
    mitigation: 'Filters, schema evolution tests, prefer JSON/Avro over Java serialization',
  },
];

export const ARCHITECTURE_DECISION_MATRIX = [
  {
    criterion: 'Enterprise stability',
    java8: 'Unsupported risk',
    java11: 'Aging LTS',
    java17: 'Strong',
    java21: 'Strong',
    java25: 'Newest LTS — verify ecosystem',
  },
  {
    criterion: 'Framework support',
    java8: 'Legacy only',
    java11: 'Boot 2 era',
    java17: 'Boot 3 baseline',
    java21: 'Excellent',
    java25: 'Catching up — check matrix',
  },
  {
    criterion: 'Modern language',
    java8: 'Lambdas only',
    java11: 'Small ergonomics',
    java17: 'Records/sealed/PM',
    java21: 'Pattern switch + VT',
    java25: '+ scoped values / language ergonomics',
  },
  {
    criterion: 'Concurrency model',
    java8: 'Pools + CF',
    java11: 'Pools + CF + HTTP async',
    java17: 'Same + reactive',
    java21: 'Virtual threads',
    java25: 'VT + scoped values final',
  },
  {
    criterion: 'Migration complexity from 8',
    java8: '—',
    java11: 'Medium',
    java17: 'High',
    java21: 'High+',
    java25: 'Highest if direct',
  },
  {
    criterion: 'Production maturity',
    java8: 'Battle-scarred',
    java11: 'Mature',
    java17: 'Mature',
    java21: 'Mature',
    java25: 'New — pilot first',
  },
];

export const VT_DECISION_TREE = [
  {q: 'Is the workload mostly waiting on I/O?', yes: 'Continue', no: 'Keep platform pools sized to cores'},
  {q: 'Do you have hard downstream limits (DB pool, rate limits)?', yes: 'Add concurrency gates / bulkheads', no: 'Still add base limits'},
  {q: 'Heavy synchronized / native in hot path?', yes: 'Fix pinning first', no: 'Pilot VT on one service'},
  {q: 'Reactive already solving the problem with stable SLOs?', yes: 'Maybe defer VT', no: 'VT is a strong incremental bet'},
  {q: 'Can you observe pinning, pool usage, and DB wait?', yes: 'Roll out in waves', no: 'Invest in telemetry first'},
];

export const ANTI_PATTERNS = [
  'Using streams everywhere, including hot micro-paths without profiling',
  'Blind parallelStream() on shared ForkJoin commonPool',
  'Optional as fields / parameters / empty-collection replacement',
  'var until types become unreadable in public APIs',
  'Virtual threads for CPU-bound engines expecting speedups',
  'Ignoring DB connection limits after VT adoption',
  'Ignoring downstream service limits / retries amplification',
  'Ignoring GC changes across JDK upgrades',
  'Skipping dependency compatibility matrices',
  'Skipping load tests that include failure injection',
  'Preview APIs in production without governance',
  'Assuming newer Java automatically means faster Java',
];
