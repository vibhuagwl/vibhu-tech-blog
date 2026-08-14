import type {DecisionTree, MatrixRow} from './types';

export const DECISION_TREES: DecisionTree[] = [
  {
    id: 'resilience',
    title: 'Resilience — timeout, retry, CB, bulkhead?',
    ascii: `Need resilience on outbound call?
│
├─ Is the operation idempotent or deduped?
│  ├─ NO  → timeout + CB only (no blind retry)
│  └─ YES → add retry (capped + jitter) on transient errors only
│
├─ Can one slow dependency stall the whole service?
│  ├─ YES → bulkhead (semaphore/thread pool per dependency)
│  └─ NO  → shared pool OK at low fan-out
│
├─ Failure rate sustained > threshold?
│  ├─ YES → circuit breaker OPEN → fast-fail + fallback
│  └─ NO  → half-open probe with limited calls
│
└─ End-to-end deadline?
   └─ propagate remaining budget via header/gRPC deadline`,
  },
  {
    id: 'data-consistency',
    title: 'Data consistency — strong vs eventual?',
    ascii: `Cross-service data need?
│
├─ Must read-your-writes across services immediately?
│  ├─ YES → same user/session sticky OR synchronous read after write (rare)
│  └─ NO  → eventual consistency OK
│
├─ Single aggregate boundary?
│  ├─ YES → strong consistency inside one DB transaction
│  └─ NO  → saga + idempotency + outbox
│
├─ Read-heavy reporting?
│  └─ CQRS projection (eventual, seconds lag acceptable)
│
└─ Global ordering required?
   └─ Kafka partition key + single writer per key`,
  },
  {
    id: 'transactions',
    title: 'Distributed transactions — 2PC vs saga?',
    ascii: `Multi-service write required?
│
├─ All participants same DB cluster with XA support?
│  ├─ YES (legacy) → 2PC possible but avoid for new code
│  └─ NO  → saga
│
├─ Saga style?
│  ├─ Few steps, clear owner → orchestration (state machine + DB)
│  └─ Many teams, event-native → choreography (Kafka events)
│
├─ Failure handling?
│  ├─ compensating transactions defined for each step?
│  │  ├─ YES → proceed
│  │  └─ NO  → STOP — design compensations first
│  └─ partial success visible to user?
│     └─ use pending state + timeout + reconciliation job
│
└─ Money movement?
   └─ idempotency key + ledger + never 2PC over HTTP`,
  },
  {
    id: 'messaging',
    title: 'Messaging — sync HTTP vs async event?',
    ascii: `Service interaction?
│
├─ Caller needs answer in same request?
│  ├─ YES → sync HTTP/gRPC (with timeout + CB)
│  └─ NO  → async message
│
├─ Fire-and-forget side effect?
│  └─ Kafka command/event + outbox
│
├─ Ordering per entity required?
│  ├─ YES → partition key = businessId
│  └─ NO  → round-robin partitions OK
│
├─ At-least-once delivery?
│  └─ inbox dedupe + idempotent handler mandatory
│
└─ Failure terminal?
   └─ DLT + replay tooling + alert on lag`,
  },
  {
    id: 'caching',
    title: 'Caching — when and which pattern?',
    ascii: `Read path optimization?
│
├─ Data changes infrequently?
│  ├─ YES → cache-aside (Redis) with TTL
│  └─ NO  → skip cache or event-driven invalidation
│
├─ Hot key risk (viral SKU)?
│  ├─ YES → local L1 + Redis L2 + request coalescing
│  └─ NO  → single Redis layer OK
│
├─ Stampede on expiry?
│  └─ probabilistic early refresh OR mutex lock on miss
│
├─ Write path must update cache?
│  └─ write-through / write-behind (complex — prefer invalidate)
│
└─ Cross-service read model?
   └─ CQRS projection table (not shared cache of foreign DB)`,
  },
  {
    id: 'service-communication',
    title: 'Service communication — REST vs gRPC vs events?',
    ascii: `Choose protocol?
│
├─ Browser / public API?
│  └─ REST/JSON via API Gateway (+ OpenAPI)
│
├─ Internal high-throughput RPC?
│  └─ gRPC (+ protobuf, deadline propagation)
│
├─ Decouple teams / temporal decoupling?
│  └─ Kafka events (choreography)
│
├─ Request-response + streaming?
│  └─ gRPC streaming or WebSocket gateway route
│
├─ File / bulk export?
│  └─ object storage + signed URL (not Kafka payload)
│
└─ Query across aggregates?
   └─ BFF aggregation OR materialized read model`,
  },
  {
    id: 'security',
    title: 'Security — authN, authZ, mTLS?',
    ascii: `Security layer?
│
├─ External client?
│  ├─ OAuth2/OIDC JWT at gateway (validate + pass claims)
│  └─ rate limit + WAF + CORS at edge
│
├─ Service-to-service?
│  ├─ Zero-trust required?
│  │  ├─ YES → mTLS (mesh or SPIFFE)
│  │  └─ NO  → network policy + internal JWT
│  └─ secrets?
│     └─ Vault / K8s secrets — never in git
│
├─ Authorization?
│  └─ RBAC at gateway + fine-grained at resource owner service
│
├─ PII in messages?
│  └─ IDs only in Kafka; fetch PII at edge with audit
│
└─ Compliance (PCI)?
   └─ isolate payment service + tokenize PAN`,
  },
  {
    id: 'deployment',
    title: 'Deployment — rolling vs blue/green vs canary?',
    ascii: `Deploy strategy?
│
├─ Stateless HTTP service?
│  ├─ low risk → rolling update (maxUnavailable 0)
│  └─ high risk → canary 5% → 25% → 100% with metrics gate
│
├─ Schema migration coupled?
│  └─ expand-contract: deploy tolerant reader first
│
├─ Kafka consumer change?
│  └─ new consumer group OR dual consume + cutover
│
├─ Zero-downtime mandatory?
│  └─ blue/green + traffic switch at LB
│
└─ Feature not ready?
   └─ feature flag OFF in prod binary (not branch deploy)`,
  },
  {
    id: 'observability',
    title: 'Observability — logs vs metrics vs traces?',
    ascii: `Debug production issue?
│
├─ User-reported slow checkout?
│  └─ trace (correlationId) → find slow span → metric confirm
│
├─ Alert: error rate spike?
│  └─ RED metrics (rate, errors, duration) per route
│
├─ Business KPI wrong (orders down)?
│  └─ domain metrics (orders.created) + compare to traffic
│
├─ Kafka lag growing?
│  └─ consumer lag metric + thread dump + max.poll.interval
│
├─ Need forensic audit?
│  └─ structured logs (immutable) + retention policy
│
└─ SLO breach?
   └─ burn rate alert → trace sample 100% for window`,
  },
  {
    id: 'service-decomposition',
    title: 'Service decomposition — how to split?',
    ascii: `Split monolith?
│
├─ Identify bounded context (DDD subdomain)
│  └─ each context → candidate microservice
│
├─ Team ownership aligns?
│  ├─ NO  → wait or use modular monolith
│  └─ YES → extract with strangler fig
│
├─ Shared tables between contexts?
│  └─ split schema first (database-per-service)
│
├─ Too fine-grained (< 1 team can't own)?
│  └─ merge — avoid nano-services
│
├─ Synchronous chain > 3 hops?
│  └─ introduce events or BFF aggregation
│
└─ Data consistency across contexts?
   └─ saga — never distributed JOIN`,
  },
];

export const CHEAT_SHEET = `
# Microservices Patterns — One-Page Cheat Sheet

## Decompose
| Pattern | Use when |
|---------|----------|
| By business capability | Clear domain ownership |
| Strangler fig | Incremental legacy migration |
| Anti-corruption layer | Legacy model ≠ new domain |

## Edge
| Pattern | Use when |
|---------|----------|
| API Gateway | Single entry, cross-cutting concerns |
| BFF | Different client shapes (mobile vs web) |

## Resilience (always combine)
**Timeout** → **Retry** (idempotent only) → **Circuit Breaker** → **Bulkhead**
Propagate deadlines. Never retry without idempotency.

## Data
| Pattern | Guarantees |
|---------|------------|
| Database per service | Loose coupling |
| Outbox | Reliable publish after DB commit |
| Inbox | Dedupe at-least-once consume |
| Saga | Cross-service eventual consistency |
| CQRS | Scale reads, accept projection lag |

## Messaging
Partition by business key · Manual ack · DLT for poison · Idempotent handlers

## Caching
Cache-aside + TTL · Stampede lock · Invalidate on write event

## Distributed primitives
Leader election (single writer) · Fencing token (stale leader) · Snowflake ID (ordered unique)

## Anti-patterns to avoid
Shared DB · Distributed monolith · Chatty sync chain · Retry storm · Event-driven everything

## Interview opener
"Decompose by capability, own your data, communicate async with outbox/inbox, isolate failures with timeout/retry/CB/bulkhead, prove correctness with idempotency + tests."
`;

export const PATTERN_MATRIX: MatrixRow[] = [
  {pattern: 'Database per service', problem: 'Shared schema couples teams', solution: 'Private DB per bounded context', tradeoff: 'No cross-service JOIN; use API or events', interviewQ: 'How do you query across services without shared DB?'},
  {pattern: 'API Gateway', problem: 'Clients know too many backends', solution: 'Single entry + routing + auth', tradeoff: 'Hotspot; must stay thin', interviewQ: 'What belongs in gateway vs BFF vs service?'},
  {pattern: 'BFF', problem: 'Mobile and web need different aggregates', solution: 'Per-client backend facade', tradeoff: 'More deployables to maintain', interviewQ: 'One BFF or BFF per client type?'},
  {pattern: 'Service discovery', problem: 'Hard-coded host:port lists', solution: 'Registry + health + client fetch', tradeoff: 'Cache staleness vs registry load', interviewQ: 'Client-side vs server-side discovery?'},
  {pattern: 'Client-side LB', problem: 'Pick instance per call', solution: 'Ribbon-style selector on cached list', tradeoff: 'Library coupling in every client', interviewQ: 'How handle registry refresh thundering herd?'},
  {pattern: 'Round-robin LB', problem: 'Distribute load evenly', solution: 'Rotate instances', tradeoff: 'Ignores load/latency', interviewQ: 'When does round-robin fail?'},
  {pattern: 'Least connections', problem: 'Long-lived requests skew RR', solution: 'Route to fewest active conn', tradeoff: 'State tracking overhead', interviewQ: 'Compare least-conn vs weighted RR?'},
  {pattern: 'Consistent hashing', problem: 'Sticky sharding on topology change', solution: 'Hash ring + virtual nodes', tradeoff: 'Hot keys remain hot', interviewQ: 'Why virtual nodes on the ring?'},
  {pattern: 'Timeout', problem: 'Threads block forever', solution: 'Connect + read + overall deadline', tradeoff: 'False timeouts under load', interviewQ: 'How propagate deadline downstream?'},
  {pattern: 'Retry', problem: 'Transient network blips', solution: 'Capped exponential backoff + jitter', tradeoff: 'Amplifies load during outage', interviewQ: 'When must you NOT retry?'},
  {pattern: 'Circuit breaker', problem: 'Cascading failure', solution: 'Fail fast when error rate high', tradeoff: 'Half-open stampede; per-instance state', interviewQ: 'CB open — what does caller see?'},
  {pattern: 'Bulkhead', problem: 'One slow dep exhausts pool', solution: 'Isolate pools per dependency', tradeoff: 'Lower total utilization', interviewQ: 'Bulkhead vs thread pool size?'},
  {pattern: 'Rate limiter', problem: 'Abuse or noisy neighbor', solution: 'Token bucket at gateway', tradeoff: 'Distributed state in Redis', interviewQ: 'Per-user vs per-IP vs per-API-key?'},
  {pattern: 'Saga choreography', problem: 'Multi-DB ACID impossible', solution: 'Events + compensations', tradeoff: 'Hard to visualize global state', interviewQ: 'Choreography vs orchestration?'},
  {pattern: 'Saga orchestration', problem: 'Complex flow needs coordinator', solution: 'Orchestrator state machine', tradeoff: 'Orchestrator SPOF / hotspot', interviewQ: 'Where store saga state?'},
  {pattern: '2PC', problem: 'Atomic cross-DB (legacy)', solution: 'Prepare + commit coordinator', tradeoff: 'Blocking, availability hit', interviewQ: 'Why avoid 2PC in microservices?'},
  {pattern: 'Outbox', problem: 'Dual write DB + Kafka race', solution: 'Same TX insert outbox row', tradeoff: 'Relay lag; table growth', interviewQ: 'Polling vs Debezium relay?'},
  {pattern: 'Inbox', problem: 'Duplicate Kafka delivery', solution: 'processed_events UNIQUE dedupe', tradeoff: 'Table size; cleanup job', interviewQ: 'Inbox vs idempotency key only?'},
  {pattern: 'Idempotency key', problem: 'Duplicate POST charges twice', solution: 'Client key + UNIQUE constraint', tradeoff: 'Key retention TTL policy', interviewQ: 'Where store idempotency — gateway or service?'},
  {pattern: 'Transactional outbox + inbox', problem: 'End-to-end exactly-once illusion', solution: 'Both patterns + business keys', tradeoff: 'Operational complexity', interviewQ: 'Still at-least-once — prove effectively-once?'},
  {pattern: 'CQRS', problem: 'Read/write contention', solution: 'Separate models + projection', tradeoff: 'Eventual read lag', interviewQ: 'When CQRS is overkill?'},
  {pattern: 'Event sourcing', problem: 'Audit + temporal queries', solution: 'Store events as source of truth', tradeoff: 'Replay time; schema evolution', interviewQ: 'Snapshot strategy?'},
  {pattern: 'Cache-aside', problem: 'Hot read path hits DB', solution: 'App loads Redis on miss', tradeoff: 'Stale reads until TTL', interviewQ: 'Cache stampede mitigation?'},
  {pattern: 'Write-through cache', problem: 'Cache and DB diverge', solution: 'Update cache on write', tradeoff: 'Write latency', interviewQ: 'When prefer invalidate over write-through?'},
  {pattern: 'Distributed lock', problem: 'Two workers same resource', solution: 'Redis/etcd lease lock', tradeoff: 'Clock skew; not fencing alone', interviewQ: 'Redlock debate — your stance?'},
  {pattern: 'Fencing token', problem: 'Stale lock holder writes', solution: 'Monotonic token checked by store', tradeoff: 'Store must validate token', interviewQ: 'Lock without fencing — failure scenario?'},
  {pattern: 'Leader election', problem: 'Multiple schedulers run job', solution: 'Single leader via consensus', tradeoff: 'Failover delay', interviewQ: 'K8s leader election vs app-level?'},
  {pattern: 'Snowflake ID', problem: 'Globally unique ordered IDs', solution: 'Timestamp + machine + sequence', tradeoff: 'Clock sync dependency', interviewQ: 'Snowflake vs UUID v7?'},
  {pattern: 'Lamport clock', problem: 'Order events without sync clocks', solution: 'Logical counter per node', tradeoff: 'Does not detect concurrent events', interviewQ: 'Lamport vs wall clock?'},
  {pattern: 'Vector clock', problem: 'Detect concurrent writes', solution: 'Per-node vector in metadata', tradeoff: 'Vector size grows with replicas', interviewQ: 'When use vector clock in practice?'},
  {pattern: 'Sidecar mesh', problem: 'Cross-cutting in every service', solution: 'Envoy sidecar proxy', tradeoff: 'Latency + CPU tax', interviewQ: 'Mesh vs library Resilience4j?'},
  {pattern: 'Strangler fig', problem: 'Big-bang rewrite risk', solution: 'Route traffic incrementally', tradeoff: 'Long dual-maintenance', interviewQ: 'How route % traffic safely?'},
  {pattern: 'Anti-corruption layer', problem: 'Legacy model leaks in', solution: 'Translation layer at boundary', tradeoff: 'Mapping maintenance', interviewQ: 'ACL vs shared DTO?'},
  {pattern: 'DLQ / DLT', problem: 'Poison message blocks partition', solution: 'Terminal topic + replay tooling', tradeoff: 'Ops burden; ordering on replay', interviewQ: 'Commit offset before or after DLT?'},
  {pattern: 'Retry topic', problem: 'In-thread retry blocks poll', solution: '@RetryableTopic delayed forward', tradeoff: 'Topic proliferation', interviewQ: 'Retry topic vs blocking DEH?'},
  {pattern: 'JWT at gateway', problem: 'Auth every microservice', solution: 'Validate once; pass claims', tradeoff: 'Token revocation lag', interviewQ: 'Short-lived token + refresh flow?'},
  {pattern: 'mTLS', problem: 'Spoofed internal calls', solution: 'Mutual cert between services', tradeoff: 'Cert rotation complexity', interviewQ: 'mTLS vs network policy enough?'},
  {pattern: 'Blue/green deploy', problem: 'Rollback must be instant', solution: 'Two envs; switch LB', tradeoff: '2× infra during cutover', interviewQ: 'Blue/green with Kafka consumers?'},
  {pattern: 'Canary deploy', problem: 'Blast radius of bad release', solution: 'Gradual traffic shift + metrics', tradeoff: 'Routing complexity', interviewQ: 'Canary rollback criteria?'},
  {pattern: 'Expand-contract migration', problem: 'Schema change breaks old code', solution: 'Additive schema first', tradeoff: 'Multi-phase deploys', interviewQ: 'Rename column safely?'},
  {pattern: 'Distributed monolith', problem: 'Microservices deploy together', solution: 'Split DB + async boundaries', tradeoff: 'Migration pain', interviewQ: 'Signals you have distributed monolith?'},
  {pattern: 'God service', problem: 'One service owns everything', solution: 'Extract by subdomain', tradeoff: 'Temporary dual-write', interviewQ: 'When merge services back?'},
  {pattern: 'Chatty services', problem: '10 HTTP hops per request', solution: 'BFF aggregate or events', tradeoff: 'Larger payloads in BFF', interviewQ: 'Measure chatty — what metric?'},
  {pattern: 'Event-driven everything', problem: 'Simple CRUD over-engineered', solution: 'Sync HTTP for query/command in BC', tradeoff: 'Mixed paradigms', interviewQ: 'When NOT to use Kafka?'},
  {pattern: 'Health check API', problem: 'LB routes to dead instance', solution: '/health liveness + readiness', tradeoff: 'Deep checks slow probe', interviewQ: 'Liveness vs readiness difference?'},
  {pattern: 'Correlation ID', problem: 'Cannot trace cross-service', solution: 'Propagate X-Correlation-Id + MDC', tradeoff: 'Must instrument all hops', interviewQ: 'correlationId vs traceId?'},
  {pattern: 'OpenTelemetry', problem: 'Vendor-locked tracing', solution: 'OTLP export standard', tradeoff: 'Collector ops', interviewQ: 'Sampling strategy at 100k RPS?'},
  {pattern: 'Saga timeout', problem: 'Stuck saga never completes', solution: 'Scheduler marks expired + compensate', tradeoff: 'False timeout on slow dep', interviewQ: 'Who owns saga timeout — orchestrator or each step?'},
  {pattern: 'Optimistic locking', problem: 'Lost update on concurrent write', solution: '@Version column', tradeoff: 'Retry UX on conflict', interviewQ: 'Optimistic vs pessimistic in inventory?'},
  {pattern: 'Pagination API', problem: 'Large list OOM', solution: 'Cursor/keyset pagination', tradeoff: 'No random page jump', interviewQ: 'Offset vs cursor at 10M rows?'},
  {pattern: 'API versioning', problem: 'Breaking change kills clients', solution: 'URL or header version + deprecation', tradeoff: 'Multiple code paths', interviewQ: 'Version in URL vs Accept header?'},
  {pattern: 'Backend for frontend aggregation', problem: 'Client orchestrates 5 calls', solution: 'Single BFF round-trip', tradeoff: 'BFF becomes thick', interviewQ: 'GraphQL vs BFF?'},
  {pattern: 'Gossip protocol', problem: 'Cluster membership at scale', solution: 'Peer state exchange', tradeoff: 'Eventual membership view', interviewQ: 'Gossip vs centralized registry?'},
  {pattern: 'Quorum read/write', problem: 'Consistency under partition', solution: 'R+W > N', tradeoff: 'Latency on WAN', interviewQ: 'Quorum vs leader-based?'},
  {pattern: 'Heartbeat', problem: 'Detect dead instance', solution: 'Periodic renew to registry', tradeoff: 'False positive on GC pause', interviewQ: 'Heartbeat interval vs TTL?'},
  {pattern: 'Failure detector', problem: 'Suspect before confirm dead', solution: 'Phi accrual or timeout-based', tradeoff: 'Tuning sensitivity', interviewQ: 'Suspect vs dead state machine?'},
  {pattern: 'Lease primitive', problem: 'Temporary ownership of resource', solution: 'Time-bounded grant + renew', tradeoff: 'Renewal traffic', interviewQ: 'Lease vs lock?'},
  {pattern: 'Distributed scheduler', problem: 'Cron on every pod duplicates', solution: 'Leader-elected single runner', tradeoff: 'Missed run on failover gap', interviewQ: 'K8s CronJob vs app scheduler?'},
  {pattern: 'Read replica routing', problem: 'Primary overloaded by reads', solution: 'Route SELECT to replica', tradeoff: 'Replication lag stale read', interviewQ: 'When force read primary?'},
  {pattern: 'Connection pool per service', problem: 'DB connection explosion', solution: 'PgBouncer + right-sized pool', tradeoff: 'Prepared statement limits', interviewQ: 'Pool size formula?'},
  {pattern: 'Graceful shutdown', problem: 'In-flight requests killed on deploy', solution: 'preStop hook + drain', tradeoff: 'Longer roll time', interviewQ: 'Kafka consumer graceful leave?'},
  {pattern: 'Poison message handling', problem: 'Infinite retry loop', solution: 'Classifier + DLT', tradeoff: 'Manual replay ops', interviewQ: 'Deserialization error — retry?'},
  {pattern: 'Synchronous chain', problem: 'Latency sums; failure multiplies', solution: 'Async events or parallel fan-out', tradeoff: 'Consistency complexity', interviewQ: 'Draw sync chain for checkout — refactor?'},
  {pattern: 'Nano-services', problem: 'Ops cost > benefit', solution: 'Merge by team ownership', tradeoff: 'Larger deployable', interviewQ: 'Lines of code threshold — wrong question why?'},
  {pattern: 'Shared DB antipattern', problem: 'Hidden coupling', solution: 'Schema split + events', tradeoff: 'Migration project', interviewQ: 'FK across services — fix?'},
  {pattern: 'Missing timeout', problem: 'Thread exhaustion', solution: 'Every outbound call bounded', tradeoff: 'Tuning per dependency', interviewQ: 'Default timeout if unknown SLA?'},
  {pattern: 'Retry storm', problem: 'Outage worsened by retries', solution: 'Jitter + CB + max attempts', tradeoff: 'Slower recovery for transient', interviewQ: 'Retry budget pattern?'},
  {pattern: 'Missing idempotency', problem: 'Duplicate side effects', solution: 'Idempotency-Key + UNIQUE', tradeoff: 'Storage + TTL', interviewQ: 'GET retry safe — POST?'},
  {pattern: 'Hexagonal architecture', problem: 'Domain tied to framework', solution: 'Ports and adapters', tradeoff: 'More interfaces', interviewQ: 'Where put Kafka listener — adapter?'},
  {pattern: 'Domain event', problem: 'Integrate without tight coupling', solution: 'Past-tense facts on bus', tradeoff: 'Schema governance', interviewQ: 'Command vs event on Kafka?'},
  {pattern: 'Transactional messaging', problem: 'Consume + produce atomicity', solution: 'Kafka transactions (narrow use)', tradeoff: 'Throughput hit', interviewQ: 'When txn consumer worth it?'},
  {pattern: 'Schema registry', problem: 'Breaking serde in prod', solution: 'Avro/Protobuf + compatibility', tradeoff: 'Registry SPOF', interviewQ: 'BACKWARD vs FULL compatibility?'},
  {pattern: 'Multi-region active-active', problem: 'DR + low latency globally', solution: 'Region-local writes + replication', tradeoff: 'Conflict resolution', interviewQ: 'Kafka mirroring vs dual publish?'},
  {pattern: 'Feature flag', problem: 'Deploy ≠ release', solution: 'Toggle in runtime config', tradeoff: 'Flag debt', interviewQ: 'Kill switch for payment provider?'},
  {pattern: 'Bulkhead + RL combo', problem: 'Retry storm through one dep', solution: 'Isolate + cap attempts', tradeoff: 'Config matrix explosion', interviewQ: 'Resilience4j config hierarchy?'},
  {pattern: 'Saga compensation idempotency', problem: 'Double compensate', solution: 'Compensation also idempotent', tradeoff: 'State machine complexity', interviewQ: 'PaymentRefund twice — safe?'},
  {pattern: 'Eventual consistency UX', problem: 'User sees stale state', solution: 'Pending UI + poll/WebSocket', tradeoff: 'More client logic', interviewQ: 'Show "processing" how long?'},
  {pattern: 'Zero-trust network', problem: 'Flat VPC trust', solution: 'Identity per workload + policy', tradeoff: 'Operational overhead', interviewQ: 'Service mesh required for zero-trust?'},
];
