import type {BloomTopic} from './types';

export const TOPICS_C: BloomTopic[] = [
  {
    id: 'distributed',
    title: '13. Multi-Instance & Scaling',
    badge: '100 pods',
    problem: 'Each app instance has its own RAM filter — creates diverge as writes fan out.',
    whenToUse: 'Designing local vs shared filters under load balancers.',
    whenAvoid: 'Assuming sticky sessions fix membership drift.',
    mermaid: `flowchart TD
  LB --> A1[App1 BF]
  LB --> A2[App2 BF]
  LB --> A3[App3 BF]
  A1 -.->|rebuild from DB| DB
  Write[Create user] --> DB
  Write --> Pub[event/bus]
  Pub --> A1
  Pub --> A2
  Pub --> A3`,
    code: `// Strategies:
// 1) Local BF + pub/sub add + periodic full rebuild
// 2) RedisBloom shared filter
// 3) Partitioned filters by key space`,
    failure: 'Instance A adds user; instance B still says definitely absent → false 404.',
    production: 'Lab is single-node; production must broadcast adds or use shared Bloom module + rebuild SLA.',
    interview30s:
      'Local filters are fastest but drift. Publish adds, rebuild on a schedule, or use a shared Redis Bloom. Exceeding capacity → rebuild larger filter and atomic swap.',
    followUp: 'Zero-downtime rebuild?',
    tradeoff: 'Local latency vs cross-instance consistency.',
    memoryTrick: 'Drift = false negatives across pods.',
  },
  {
    id: 'failures',
    title: '14. Failure Scenarios',
    badge: 'Ops',
    problem: 'Bloom unavailable/corrupt/stale must fail safe — never invent users, never drop money events.',
    whenToUse: 'Runbooks and interview “what if”.',
    whenAvoid: 'Failing closed into “everyone exists” without rate limits.',
    mermaid: `flowchart TD
  Down[BF down] --> Bypass[Fail open to Redis/DB + alert]
  Stale[Stale BF] --> Rebuild
  FP[False positive] --> ExtraLookup[Harmless DB hit]
  Corrupt --> Rebuild`,
    code: `// Prefer: if bloom unavailable → check Redis/DB (availability)
// Never: if bloom unavailable → return 404 for all`,
    failure: 'Returning 404 when Bloom is down — false negatives for real users.',
    production: 'Monitor blocked vs db.queries; alert on estimated FPP and filter age.',
    interview30s:
      'Unavailable Bloom: fall back to cache/DB and page. Stale: rebuild/swap. FP: extra lookup. Corrupt: rebuild from source of truth.',
    followUp: 'How do you detect staleness?',
    tradeoff: 'Fail-open DB load vs fail-closed user outage.',
    memoryTrick: 'Bloom fails open to truth stores.',
  },
  {
    id: 'observability',
    title: '15. Observability & Security',
    badge: 'Metrics',
    problem: 'Prove the filter saves DB calls; defend against hash flooding / adversarial FPs.',
    whenToUse: 'Production dashboards and threat discussions.',
    whenAvoid: 'High-cardinality labels per user id on Prometheus.',
    mermaid: `flowchart LR
  Lookups --> Blocked[definite misses]
  Lookups --> Maybe
  Maybe --> DB
  Value[value] = Blocked / Lookups`,
    code: `bloom.lookups, bloom.definite_misses, bloom.estimated_fpp,
user.db.queries, user.bloom.blocked, bloom rebuild duration/age`,
    failure: 'No metric → cannot tell if FPP exploded after capacity breach.',
    production: 'Lab registers Micrometer gauges; compare /lab/users bypass vs /users.',
    interview30s:
      'Track lookups, definite misses, DB queries avoided, estimated FPP, size, age, rebuild time. Security: don’t trust client-controlled sizing; non-crypto hashes are fine for non-adversarial keys — rate-limit abuse.',
    followUp: 'Do you need SHA-256 for Bloom?',
    tradeoff: 'Crypto hash CPU vs attacker crafting collisions.',
    memoryTrick: 'Blocked/Lookups = business value.',
  },
  {
    id: 'lab',
    title: '16. Runnable Lab',
    badge: ':8097',
    problem: 'Need curl-proof demos for interviews.',
    whenToUse: 'Local practice and CI.',
    whenAvoid: 'Claiming Guava-only knowledge without BitSet story.',
    mermaid: `flowchart LR
  Test[mvn test] --> Boot[spring-boot:run :8097]
  Boot --> API[/api/users /bloom/stats]`,
    code: `cd spring-bloom-filter-lab && mvn test && mvn spring-boot:run
curl /api/users/user-1
curl /api/users/nope   # Bloom 404
curl /api/bloom/stats`,
    failure: 'Demo without a missing-id 404.',
    production: 'H2 + in-memory cache stand-in for Redis; same control flow as prod.',
    interview30s:
      'Lab implements classic + counting BF, Spring user lookup, idempotency guard, and isolation-style tests for no false negatives.',
    followUp: 'Show statistical FPP test.',
    tradeoff: 'In-memory Redis fake vs real RedisBloom.',
    memoryTrick: '8097 + mightContain endpoint.',
  },
  {
    id: 'checklist',
    title: '17. Cheat Sheet',
    badge: 'Memorize',
    problem: 'Compress the whole topic into interview flashcards.',
    whenToUse: 'Last 5 minutes before a loop.',
    whenAvoid: 'Skipping the 2-minute spoken story.',
    mermaid: `flowchart TD
  Def[Definition] --> FP[FP yes / FN no]
  FP --> Use[Penetration / SSTable / URL]
  Use --> Not[Not SoT / Not index / Not idempotent alone]`,
    code: `m=-n ln p/(ln2)^2; k=(m/n)ln2; ~10 bits/key @1%
false→NO; true→MAYBE→verify`,
    failure: 'Forgetting delete hazard and distributed drift.',
    production: 'End answers with metrics + rebuild + fail-open-to-DB.',
    interview30s:
      'Probabilistic set, bit array, k hashes, FPs only, size from n/p, Spring in front of Redis/DB, storage engines per SSTable, never source of truth.',
    followUp: '2-minute spoken answer?',
    tradeoff: 'Breadth vs depth — pick one production story.',
    memoryTrick: 'MAYBE then verify; NO means stop.',
  },
];
