import type {InterviewQ} from './types';

type Level = InterviewQ['level'];

const TOPICS = [
  'API Gateway',
  'BFF',
  'Service Discovery',
  'Load Balancing',
  'Circuit Breaker',
  'Retry',
  'Timeout',
  'Bulkhead',
  'Rate Limiting',
  'Saga',
  'Outbox',
  'Inbox',
  'Idempotency',
  'CQRS',
  'Event Sourcing',
  'Kafka',
  'Caching',
  'Distributed Lock',
  'Database per Service',
  'Strangler Fig',
  'Anti-Corruption Layer',
  'Service Mesh',
  'mTLS',
  'JWT Auth',
  'Observability',
  'OpenTelemetry',
  'Deployment',
  'API Versioning',
  'Leader Election',
  'Consistent Hashing',
  'Snowflake ID',
  'Fencing Token',
  'Vector Clock',
  'DLQ',
  'Health Checks',
  'Graceful Shutdown',
  'Feature Flags',
  'Hexagonal Architecture',
  'Domain Events',
  'Schema Registry',
  'Optimistic Locking',
  'Pagination',
  'Multi-Region',
  'FinOps',
  'Testing',
  'Contract Testing',
  'Chaos Engineering',
  'Decomposition',
  'Resilience4j',
  'Spring Cloud Gateway',
] as const;

const WRONG_ANSWERS = [
  'Microservices always need a service mesh.',
  'Kafka gives exactly-once end-to-end by default.',
  'Shared database is fine if teams coordinate releases.',
  'Retry every failed HTTP call up to 10 times.',
  'Circuit breaker replaces the need for timeouts.',
  '2PC is the standard for microservice transactions.',
  'API Gateway should contain all business logic.',
  'UUID is always better than Snowflake.',
  'Events should be used for every service interaction.',
  'Distributed lock alone prevents stale writer bugs.',
  'Eureka is required for Kubernetes deployments.',
  'gRPC is always faster than REST for browsers.',
  'CQRS is mandatory for microservices.',
  'One database per table is best practice.',
  'Synchronous chains improve user experience consistency.',
  'No timeout needed if the dependency is internal.',
  'DLQ means Kafka guarantees no message loss.',
  'JWT revocation is instant without extra infrastructure.',
  'Blue/green deploy requires zero schema compatibility.',
  'Observability means logs only.',
];

function pick<T>(arr: readonly T[], idx: number): T {
  return arr[idx % arr.length];
}

function basicQuestion(topic: string, n: number): InterviewQ {
  const templates = [
    {
      q: `What is the ${topic} pattern in microservices?`,
      a30: `${topic} solves a specific distributed-systems pain — define the problem (coupling, failure, consistency) before naming the pattern.`,
      a2m: `In interviews, state: (1) problem without ${topic}, (2) what ${topic} adds, (3) one trade-off. Example: payment checkout latency or inventory oversell depending on domain.`,
      fu: [`When would you NOT use ${topic}?`, `What breaks if you skip ${topic}?`],
    },
    {
      q: `Why does ${topic} exist?`,
      a30: `Monoliths hide the problem; at scale ${topic} makes failure/latency/consistency explicit and bounded.`,
      a2m: `Connect to CAP or at-least-once reality. Mention production signal: metric, log, or outage story tied to ${topic}.`,
      fu: [`Real-world tool for ${topic}?`, `Common mistake implementing ${topic}?`],
    },
    {
      q: `Name one benefit and one cost of ${topic}.`,
      a30: `Benefit: addresses its core problem. Cost: operational or consistency complexity — never say "no downside."`,
      a2m: `Interviewers want trade-off literacy. Pair ${topic} with an alternative and say when you'd switch.`,
      fu: [`Compare ${topic} to the closest alternative`, `Team skill factor?`],
    },
    {
      q: `Is ${topic} a broker feature or application pattern?`,
      a30: `Most microservice patterns are application/infrastructure choices — the broker (Kafka) provides primitives, not the full pattern.`,
      a2m: `Clarify responsibility boundary: who configures, who owns correctness, what happens on failure. For ${topic}, name the owning tier (gateway, service, platform).`,
      fu: [`Spring Boot support for ${topic}?`, `Who operates it in prod?`],
    },
    {
      q: `Where does ${topic} sit in the request path?`,
      a30: `Draw edge → service → data/message bus. Place ${topic} on the diagram before explaining.`,
      a2m: `Walk through checkout: gateway, order, payment, Kafka. Show where ${topic} intercepts or stores state.`,
      fu: [`Sync vs async placement for ${topic}?`, `Multiple layers — anti-pattern?`],
    },
  ];
  const t = pick(templates, n);
  return {
    id: `b-${n}`,
    level: 'basic',
    topic,
    question: t.q,
    answer30s: t.a30,
    answer2m: t.a2m,
    followUps: t.fu,
    wrongAnswer: pick(WRONG_ANSWERS, n),
  };
}

function intermediateQuestion(topic: string, n: number): InterviewQ {
  const templates = [
    {
      q: `How would you configure ${topic} in a Spring Boot 3 payment service?`,
      a30: `Name the library (Resilience4j, Spring Kafka, Spring Cloud Gateway), key config knobs, and idempotency/timeout pairing.`,
      a2m: `Walk config → code annotation → metric → failure test. For ${topic}, mention correlationId and what happens when dependency is down.`,
      fu: [`application.yml snippet for ${topic}?`, `Integration test approach?`],
    },
    {
      q: `What metrics prove ${topic} is working in production?`,
      a30: `RED/USE metrics plus pattern-specific: CB state, retry count, outbox lag, cache hit ratio, consumer lag.`,
      a2m: `Define alert thresholds and dashboard panels. Tie ${topic} metric to user-facing SLO (checkout p99).`,
      fu: [`Alert fatigue risk with ${topic}?`, `SLO burn rate tie-in?`],
    },
    {
      q: `How does ${topic} interact with Kafka at-least-once delivery?`,
      a30: `At-least-once requires idempotent consumers; ${topic} often complements inbox/outbox or dedupe keys.`,
      a2m: `Explain duplicate delivery scenario and how ${topic} prevents double side effect. Mention offset commit ordering.`,
      fu: [`Commit before or after ${topic} side effect?`, `DLT role?`],
    },
    {
      q: `Compare ${topic} on client vs server vs mesh sidecar.`,
      a30: `Client library: fast iteration, language coupling. Server/mesh: uniform policy, ops centralization, latency tax.`,
      a2m: `For ${topic}, pick one placement for a 50-service JVM shop and justify with team structure and release cadence.`,
      fu: [`Migration path between placements?`, `Testing differences?`],
    },
    {
      q: `What failure test would you write for ${topic}?`,
      a30: `Use WireMock/Testcontainers: slow, 503, timeout, partition. Assert bounded behavior — not infinite hang.`,
      a2m: `Describe Given-When-Then: inject fault, observe CB open/retry cap/outbox depth, verify no duplicate charge.`,
      fu: [`Chaos tool for ${topic}?`, `Staging vs prod test?`],
    },
  ];
  const t = pick(templates, n);
  return {
    id: `i-${n}`,
    level: 'intermediate',
    topic,
    question: t.q,
    answer30s: t.a30,
    answer2m: t.a2m,
    followUps: t.fu,
    wrongAnswer: pick(WRONG_ANSWERS, n + 3),
  };
}

function seniorQuestion(topic: string, n: number): InterviewQ {
  const templates = [
    {
      q: `Design how ${topic} behaves during a partial AZ outage affecting payment provider.`,
      a30: `Fail fast with CB, degrade non-critical paths, preserve idempotent capture, route to DLQ with alert — never unbounded retry.`,
      a2m: `Timeline: detect elevated 503 → CB opens → queue async settlement → reconcile ledger. ${topic} role in preventing cascade and duplicate money movement.`,
      fu: [`Customer-visible behavior?`, `Rollback / feature flag?`],
    },
    {
      q: `What are the CAP trade-offs when tightening ${topic} for inventory oversell prevention?`,
      a30: `Strong consistency costs availability/latency; choose per aggregate — inventory reservation often needs partition tolerance with compensations.`,
      a2m: `Discuss quorum vs saga vs optimistic lock. ${topic} may shift CP/AP balance — quantify with example RPS and acceptable oversell rate.`,
      fu: [`Black Friday hot SKU?`, `Read-your-writes UX?`],
    },
    {
      q: `How would you debug a production incident where ${topic} appears misconfigured?`,
      a30: `Trace correlationId → check pattern metrics → compare deploy/config change → reproduce with integration test.`,
      a2m: `Structured triage: symptom, blast radius, last change, hypothesis, verify, mitigate, postmortem action for ${topic}.`,
      fu: [`Runbook section for ${topic}?`, `Safe kill switch?`],
    },
    {
      q: `Refactor a legacy monolith step toward ${topic} without big-bang rewrite.`,
      a30: `Strangler route, expand-contract schema, dual-write window, feature flag — measure coupling reduction per increment.`,
      a2m: `90-day plan: extract one bounded context, introduce ${topic} at seam, migrate traffic %, retire old path. Risk controls each phase.`,
      fu: [`Team topology?`, `Data migration tooling?`],
    },
    {
      q: `How does ${topic} scale from 1k to 100k RPS?`,
      a30: `Identify first bottleneck: threads, DB pool, Kafka partitions, Redis hot key, CB coordination — scale that dimension.`,
      a2m: `Numbers: pool size formula, partition count, cache stampede, aggregation fan-out. ${topic}-specific ceiling and mitigation.`,
      fu: [`Cost impact at 100k?`, `Load test acceptance criteria?`],
    },
  ];
  const t = pick(templates, n);
  return {
    id: `s-${n}`,
    level: 'senior',
    topic,
    question: t.q,
    answer30s: t.a30,
    answer2m: t.a2m,
    followUps: t.fu,
    wrongAnswer: pick(WRONG_ANSWERS, n + 7),
    trick: pick(WRONG_ANSWERS, n + 11),
  };
}

function leadQuestion(topic: string, n: number): InterviewQ {
  const templates = [
    {
      q: `As principal architect, set org-wide standards for ${topic} across 80 Java teams.`,
      a30: `Golden paths: starter library, enforced ArchUnit rules, SLO templates, exception process — balance autonomy vs fragmentation.`,
      a2m: `Governance model: platform team owns ${topic} defaults, product teams override with ADR. Metrics: adoption %, incident rate, MTTR.`,
      fu: [`Chargeback for platform?`, `Sunset legacy pattern variants?`],
    },
    {
      q: `Build vs buy for ${topic} in a regulated financial institution.`,
      a30: `Evaluate compliance, vendor lock-in, TCO (license + eng + on-call), integration with existing IAM and audit.`,
      a2m: `Decision matrix scoring security, latency, operability. ${topic} recommendation with 3-year roadmap and exit strategy.`,
      fu: [`Audit evidence for ${topic}?`, `Multi-region regulatory residency?`],
    },
    {
      q: `Align ${topic} strategy with Conway's law for a post-merger integration.`,
      a30: `Map bounded contexts to team ownership first; ${topic} enforces seams — don't paint microservices before org alignment.`,
      a2m: `Integration playbook: identify duplicate capabilities, choose system of record, event contract council, phased decommission.`,
      fu: [`Political resistance?`, `Metric for merge success?`],
    },
    {
      q: `Price the operational cost of ${topic} for CFO review.`,
      a30: `Infra (compute, Kafka, Redis), observability storage, on-call toil hours, incident $ — compare to outage cost without ${topic}.`,
      a2m: `TCO model with growth scenarios. ${topic} ROI narrative: prevented retry-storm outage, reduced duplicate settlements.`,
      fu: [`Build headcount vs SaaS?`, `FinOps tags?`],
    },
    {
      q: `Define migration KPIs when replacing homegrown ${topic} with platform offering.`,
      a30: `Coverage %, error budget burn, deploy frequency, mean config drift, developer NPS — sunset date for old path.`,
      a2m: `Quarterly milestones, rollback criteria, training plan. Risk register for ${topic} cutover weekends.`,
      fu: [`Executive dashboard?`, `Vendor SLA negotiation?`],
    },
  ];
  const t = pick(templates, n);
  return {
    id: `l-${n}`,
    level: 'lead',
    topic,
    question: t.q,
    answer30s: t.a30,
    answer2m: t.a2m,
    followUps: t.fu,
    wrongAnswer: pick(WRONG_ANSWERS, n + 13),
  };
}

function scenarioQuestion(topic: string, n: number): InterviewQ {
  const scenarios = [
    {
      q: `Scenario: Checkout p99 jumped 3s after enabling ${topic}. Walk through diagnosis.`,
      a30: `Check deploy diff, trace waterfall, thread dumps, ${topic} metrics — hypothesis: misconfigured wait/lock/retry.`,
      a2m: `Step-by-step war room: confirm SLO breach → isolate gateway vs service → compare canary → rollback or tune ${topic} → postmortem.`,
      fu: [`What graph first?`, `Customer comms?`],
    },
    {
      q: `Scenario: Duplicate charges reported after Kafka consumer redeploy involving ${topic}. Root cause?`,
      a30: `At-least-once redelivery + missing idempotency/inbox; or offset committed before side effect.`,
      a2m: `Forensic: compare charge timestamps with consumer offset commits. Fix: inbox UNIQUE, store idempotency before ack. ${topic} role in safe replay.`,
      fu: [`Customer refund process?`, `Prevent recurrence?`],
    },
    {
      q: `Scenario: Black Friday — inventory shows 0 but orders still completing. How does ${topic} factor?`,
      a30: `Eventual consistency lag, cache staleness, or saga compensation failure — trace reservation path.`,
      a2m: `Draw inventory saga. Check ${topic} config (cache TTL, optimistic conflicts, outbox lag). Mitigate: disable oversell path, force primary read.`,
      fu: [`Business decision: cancel orders?`, `Hot key mitigation?`],
    },
    {
      q: `Scenario: New team shipped service ignoring ${topic} standards — prod incident Friday 5pm.`,
      a30: `Stabilize: CB/flag/limit traffic → fix forward → mandate golden path review → not blame, fix system.`,
      a2m: `Incident commander flow. Short-term patch vs platform guardrail (policy-as-code blocking deploy without ${topic}).`,
      fu: [`Architectural review gate?`, `Training gap?`],
    },
    {
      q: `Scenario: Merger requires combining two checkout flows using different ${topic} approaches.`,
      a30: `Choose system of record, strangler route by customer segment, unify event contracts, deprecate weaker pattern with timeline.`,
      a2m: `Workshop output: target reference architecture, compatibility matrix, dual-run period, data reconciliation jobs.`,
      fu: [`Executive timeline?`, `Customer migration comms?`],
    },
  ];
  const t = pick(scenarios, n);
  return {
    id: `sc-${n}`,
    level: 'scenario',
    topic,
    question: t.q,
    answer30s: t.a30,
    answer2m: t.a2m,
    followUps: t.fu,
    wrongAnswer: pick(WRONG_ANSWERS, n + 17),
  };
}

function generateLevel(count: number, level: Level, factory: (topic: string, n: number) => InterviewQ): InterviewQ[] {
  const out: InterviewQ[] = [];
  for (let i = 0; i < count; i++) {
    out.push(factory(pick(TOPICS, i * 7 + i), i));
  }
  return out;
}

/** Hand-crafted high-value questions (unique, not templated). */
const SEED_BASIC: InterviewQ[] = [
  {
    id: 'b-seed-1',
    level: 'basic',
    topic: 'Microservices fundamentals',
    question: 'What is a microservice?',
    answer30s:
      'Independently deployable service owning a bounded context and its data — communicates via APIs/events, not shared DB.',
    answer2m:
      'Emphasize team autonomy, replaceability, and failure isolation. Not "small REST app" — size follows business capability. Contrast with modular monolith when teams are small.',
    followUps: ['When is monolith better?', 'How small is too small?'],
    wrongAnswer: 'One database table per microservice is the rule.',
  },
  {
    id: 'b-seed-2',
    level: 'basic',
    topic: 'Database per Service',
    question: 'Why database per service?',
    answer30s: 'Prevents hidden coupling — each team evolves schema and scale independently.',
    answer2m:
      'Shared DB creates distributed monolith: coordinated releases, FK across contexts, one outage affects all. Trade-off: cross-service queries need API, events, or CQRS.',
    followUps: ['Reporting without JOIN?', 'Split existing shared DB how?'],
    wrongAnswer: 'Microservices can share PostgreSQL schema if namespaces differ.',
  },
  {
    id: 'b-seed-3',
    level: 'basic',
    topic: 'API Gateway',
    question: 'What does an API Gateway do?',
    answer30s: 'Single entry: routing, auth, rate limit, TLS, correlation ID — keeps backends free of edge concerns.',
    answer2m:
      'Gateway should stay thin — no business rules. BFF handles client-specific aggregation. Compare Spring Cloud Gateway vs Kong vs AWS API Gateway.',
    followUps: ['Gateway vs load balancer?', 'Can gateway run saga?'],
    wrongAnswer: 'Put all business validation in the gateway to save services.',
  },
];

const SEED_SENIOR: InterviewQ[] = [
  {
    id: 's-seed-1',
    level: 'senior',
    topic: 'Saga',
    question: 'Choreography vs orchestration saga — when which?',
    answer30s:
      'Choreography: few teams, event-native, simple flow. Orchestration: complex branching, visibility, timeout management central.',
    answer2m:
      'Choreography hard to debug global state; orchestration risks hotspot coordinator. Payment flows often orchestrate; notifications choreograph. Both need idempotent compensations.',
    followUps: ['Where store orchestrator state?', 'Saga timeout owner?'],
    wrongAnswer: 'Choreography is always more scalable therefore always better.',
    trick: 'Orchestration violates microservice autonomy — always avoid.',
  },
  {
    id: 's-seed-2',
    level: 'senior',
    topic: 'Outbox',
    question: 'Explain outbox pattern and why not dual-write.',
    answer30s: 'Insert business row + outbox row same TX; relay publishes — avoids DB committed but Kafka message lost race.',
    answer2m:
      'Dual-write without outbox: crash between steps → inconsistency. Relay: Debezium CDC or polling with SKIP LOCKED. Monitor outbox lag SLO.',
    followUps: ['Polling vs Debezium?', 'Outbox cleanup?'],
    wrongAnswer: 'Kafka transactions eliminate need for outbox with external DB.',
  },
];

const GENERATED_BASIC = generateLevel(97, 'basic', basicQuestion);
const GENERATED_INTERMEDIATE = generateLevel(100, 'intermediate', intermediateQuestion);
const GENERATED_SENIOR = generateLevel(98, 'senior', seniorQuestion);
const GENERATED_LEAD = generateLevel(100, 'lead', leadQuestion);
const GENERATED_SCENARIO = generateLevel(100, 'scenario', scenarioQuestion);

export const BASIC: InterviewQ[] = [...SEED_BASIC, ...GENERATED_BASIC];
export const INTERMEDIATE: InterviewQ[] = GENERATED_INTERMEDIATE;
export const SENIOR_QS: InterviewQ[] = [...SEED_SENIOR, ...GENERATED_SENIOR];
export const LEAD: InterviewQ[] = GENERATED_LEAD;
export const SCENARIO: InterviewQ[] = GENERATED_SCENARIO;

export const SENIOR = SENIOR_QS;
export const ARCHITECT = LEAD;
export const RAPID = BASIC.slice(0, 40);
export const ALL: InterviewQ[] = [...BASIC, ...INTERMEDIATE, ...SENIOR_QS, ...LEAD, ...SCENARIO];
