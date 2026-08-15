import type {CapSection} from './types';

export const SECTIONS_DESIGN: CapSection[] = [
  {
    id: 'design-examples',
    title: 'System Design Examples (CAP in Practice)',
    what:
      'Real products rarely pick one CAP label for the entire stack. Banking, social, e-commerce, ride-sharing, and ticket booking each mix CP-leaning and AP-leaning subsystems — often within the same user journey.',
    why:
      'Interviewers use domain examples to test whether you reason per invariant, not per logo. Staff answers name which operation needs linearizability and which can degrade to eventual consistency.',
    how:
      'For each domain: list critical writes, acceptable staleness, partition behavior, and hybrid split. Use tables to compare subsystems. Emphasize that one product = multiple CAP postures.',
    example: `BANKING — CP-leaning core, AP edges
  ┌─────────────────┬──────────────┬─────────────────────────────┐
  │ Subsystem       │ CAP posture  │ Partition behavior          │
  ├─────────────────┼──────────────┼─────────────────────────────┤
  │ Account balance │ CP           │ Reject debit if no quorum   │
  │ Wire transfer   │ CP           │ Block until leader reachable│
  │ Stmt / history  │ AP-ok        │ Stale PDF ok for 24h        │
  │ Fraud alerts    │ AP + async   │ Delayed alert acceptable    │
  └─────────────────┴──────────────┴─────────────────────────────┘

SOCIAL — AP for engagement, selective CP
  Likes / view counts  → AP (eventual; off-by-one ok)
  Feed ranking cache   → AP (stale 30–120s ok)
  Direct messages      → CP-leaning (read-your-writes)
  Block / ban list     → CP (safety invariant)

E-COMMERCE — four different CAP choices in one checkout
  Catalog / search     → AP (stale price display; reconcile at cart)
  Shopping cart        → session-local AP (merge on login)
  Inventory reserve    → CP (oversell = business loss)
  Payment capture      → CP (idempotency + ledger quorum)

  Checkout flow ASCII:
    Browse (AP) → Add cart (AP) → Reserve stock (CP) → Charge (CP) → Email (AP)

RIDE SHARING — geo AP, dispatch CP-leaning
  Driver GPS ping      → AP (last-known location fine)
  Surge pricing view   → AP (approximate multiplier)
  Trip assignment      → CP-leaning (one driver per trip)
  Fare settlement      → CP (ledger, no double charge)

TICKET BOOKING — classic inventory CP trap
  Seat map display     → AP (may show "available" briefly stale)
  Seat hold / lock     → CP (two buyers, one seat = lawsuit)
  Waitlist             → AP merge with conflict resolution
  Payment              → CP (strong idempotency key)

HYBRID WITHIN ONE PRODUCT (interview gold)
  "Our system is AP" is wrong for every example above.
  Correct: "Feed is AP; payment is CP; we route reads by SLA tier."`,
    failure:
      'Stamping entire banking as CP and serving statements from async replica without disclosure. E-commerce: strong catalog consistency but weak inventory → oversell during partition. Ride-share: AP GPS + CP assignment without fencing → double assignment.',
    tradeoff:
      'Hybrid complexity buys business-fit guarantees. More subsystems = more integration points where CAP bites (cart reserved but payment partition blocks).',
    tech:
      'Banking: Oracle/Postgres sync rep + Kafka for events. Social: Cassandra/Dynamo for counters, Redis cache. E-commerce: Postgres inventory, ES catalog, Redis cart. Rides: Redis geo + Postgres trips. Tickets: Postgres row locks + Redis hold TTL.',
    trap:
      'Saying "Netflix/Uber is AP" without naming the operation. Inventory and payments are never "eventually fine."',
    interviewAnswer:
      'I never label a whole product CP or AP. Banking: balance and transfer are CP; statements can be eventual. E-commerce: catalog AP, inventory and payment CP — four models in one checkout. Social: likes AP, DMs stronger. I map each invariant to consistency level and state partition behavior explicitly.',
    remember: [
      'One product, multiple CAP postures per subsystem',
      'Inventory + payment almost always CP-leaning',
      'Feeds, search, analytics tolerate AP',
      'Hybrid is the norm, not the exception',
      'Name partition behavior per operation',
    ],
    oneLiner:
      'Real systems are hybrid — banking, e-commerce, and social each mix CP cores with AP edges in the same product.',
    tables: [
      {
        headers: ['Domain', 'CP-leaning', 'AP-acceptable', 'Hybrid note'],
        rows: [
          ['Banking', 'Balance, transfer, auth', 'Statements, marketing', 'Core ledger CP; edges eventual'],
          ['Social', 'Blocks, account state', 'Likes, feed, counts', 'Engagement AP; safety CP'],
          ['E-commerce', 'Inventory, payment', 'Catalog, search, cart', 'Four models in one checkout'],
          ['Ride share', 'Trip assign, fare', 'GPS, surge display', 'Location AP; assignment CP'],
          ['Ticketing', 'Seat lock, payment', 'Map display, waitlist', 'Display stale; lock must be CP'],
        ],
      },
    ],
  },
  {
    id: 'formal',
    title: 'Formal Intuition (Without Full Proof)',
    what:
      'Gilbert and Lynch (2002) proved: in an asynchronous network, no distributed read/write register can be both available and linearizable under partition. Intuition: you cannot return immediately AND guarantee a single global value when nodes cannot communicate.',
    why:
      'Staff interviews probe whether you understand why the trade-off is fundamental — not a vendor limitation. The proof sketch explains why retries, caches, and "smart routing" cannot cheat physics.',
    how:
      'Assume async network (no bound on message delay). Client writes on side A; partition before replication. If B must respond without talking to A: return stale (violates C) or block/error (violates A). No third option for a single register.',
    example: `ASYNC NETWORK ASSUMPTION
  Messages may be delayed arbitrarily — you cannot distinguish
  "slow" from "lost" without waiting forever (FLP intuition).

PROOF SKETCH (Gilbert & Lynch style)
  Setup: two nodes A and B replicate register v; initial v=0.
  Client C1 writes v=1 on A (succeeds locally).
  Partition: A | B — no messages cross.
  Client C2 reads v on B.

  Case 1 — B returns v=1:
    B could not have seen C1's write (no messages).
    → B guessed or had prior knowledge → not a valid response
      under linearizability without communication.

  Case 2 — B returns v=0:
    Linearizability violated: C1 got success for write 1,
    C2 reads 0 after C1's write completed.

  Case 3 — B blocks / errors:
    Availability violated: non-failing B refused a read.

  ∴ No algorithm satisfies both C and A during partition.

LINEARIZABILITY IN THE PROOF
  "Consistent" in CAP = linearizable (atomic) consistency.
  Total order of ops; each op appears instantaneous between
  invoke and response.

WHAT THE PROOF DOES NOT SAY
  • Systems cannot be both C and A when healthy (they can).
  • You must pick CP or AP at install time forever.
  • Single-node systems are in scope (they are not distributed).`,
    failure:
      'Hand-waving "we use consensus so we avoid CAP." Consensus requires quorum — minority partition loses A or C. Claiming sync RPC "fixes" partition when the link is cut.',
    tradeoff:
      'The proof forces honesty: during partition, something gives — freshness, liveness, or scope (single-node illusion). Engineering chooses which client-visible symptom is acceptable.',
    tech:
      'Formal models: register, read/write operations, failure detectors. Real systems approximate with timeouts (suspected partition) — converts async to partial sync at the cost of false positives.',
    trap:
      'Quoting CAP without async assumption. Saying "we are CA" for a multi-AZ deployment — P is not optional.',
    interviewAnswer:
      'Gilbert and Lynch showed that in an asynchronous network, during a partition you cannot have both linearizability and availability. If B cannot talk to A and must respond, it either returns stale data (not C) or refuses (not A). I do not recite the full proof, but I use this to justify why payment must block or error rather than guess during a split.',
    remember: [
      'Async network = unbounded delay',
      'Proof uses read/write register + partition',
      'Three cases: stale, wrong order, or unavailable',
      'CAP C in proof = linearizability',
      'Healthy operation is outside the impossibility',
    ],
    oneLiner:
      'Under partition in an async network, immediate response and a single global value cannot coexist — that is the CAP impossibility intuition.',
  },
  {
    id: 'linearizability',
    title: 'CAP C vs Linearizability vs Serializability',
    what:
      'CAP Consistency means linearizability (single-copy, real-time order). Interviewers saying "strong consistency" usually mean linearizable reads or serializable transactions — but the terms are not interchangeable.',
    why:
      'Conflating CAP C, linearizability, sequential consistency, and serializability is the #1 senior interview trap. Each model permits different anomalies; picking the wrong one ships subtle bugs.',
    how:
      'Linearizability: total order respecting real-time (if op1 finishes before op2 starts, op1 before op2 in order). Sequential consistency: total order but not necessarily real-time. Serializability: transaction order equivalent to some serial execution — does not require real-time across clients.',
    example: `MODEL LADDER (strongest → weaker)

  Linearizability (CAP C)
    │  single global order + real-time constraint
    ▼
  Sequential consistency
    │  single global order; no real-time guarantee
    ▼
  Causal consistency
    │  preserve cause-effect; concurrent ops may diverge
    ▼
  Eventual consistency
    │  converge if writes stop
    ▼
  Session / read-your-writes (often added on top)

INTERVIEWER: "STRONG CONSISTENCY" USUALLY MEANS
  • Distributed store: linearizable read/write (ZooKeeper, etcd)
  • SQL database: SERIALIZABLE isolation (or RR + fencing)
  • NOT: "we use PostgreSQL" while reading async replica
  • NOT: readConcern majority alone without write concern pairing

LINEARIZABLE vs SERIALIZABLE EXAMPLE
  T1: x=1 (finishes)     T2: read x (starts after T1 done)

  Linearizable: T2 must see x=1 (real-time).
  Serializable: some equivalent serial order exists;
    T2 could read old x if schedule reorders — unless
    also linearizable across transactions.

CAP C SCOPE
  CAP applies to register/object ops across replicas.
  Serializability is transaction-centric (ACID).
  Spanner/Cockroach aim for both; Cassandra QUORUM is neither
  automatically linearizable nor serializable without extra layer.`,
    failure:
      'Claiming SERIALIZABLE on Postgres read replica. Assuming MongoDB "majority" reads are linearizable without write concern and primary read routing. Using "strong" for "we retry until success."',
    tradeoff:
      'Linearizability costs latency (quorum, leader) and availability on minority partition. Serializability costs contention (locks, OCC aborts). Weaker models scale reads but need merge/conflict logic.',
    tech:
      'Linearizable: etcd, ZooKeeper, Consul (with caveats), Redis WAIT, DynamoDB strong read, Cockroach/Spanner. Serializable: Postgres SERIALIZABLE, Oracle SI. Sequential: rare explicitly; some CPU memory models.',
    trap:
      '"R+W>N means linearizable" — overlap ≠ real-time total order. "Serializable = strong consistency in CAP" — different dimensions.',
    interviewAnswer:
      'CAP C is linearizability: one total order respecting real-time. Serializability is about transactions appearing in some serial order — weaker on real-time. When interviewers say strong consistency they usually mean linearizable reads or serializable isolation — I ask which. Read from async replica breaks linearizability even if the primary is SERIALIZABLE.',
    remember: [
      'CAP C = linearizability (distributed)',
      'Strong consistency in interviews ≈ linearizable or serializable',
      'Serializability ⊄ linearizability (different axes)',
      'Real-time order is the linearizability extra',
      'Always ask: which reads hit which replica?',
    ],
    oneLiner:
      'CAP C is linearizability; "strong consistency" in interviews usually means that or serializability — not the same thing.',
    tables: [
      {
        headers: ['Model', 'Guarantee', 'CAP relation', 'Typical use'],
        rows: [
          ['Linearizability', 'Real-time total order', 'CAP C', 'Coordination, locks, metadata'],
          ['Sequential consistency', 'Total order, no real-time', 'Weaker than CAP C', 'Rare explicit choice'],
          ['Serializability', 'Txn equivalent to serial run', 'ACID, not CAP C', 'SQL financial invariants'],
          ['Causal', 'Cause-effect preserved', 'Weaker than C', 'Social graphs, comments'],
          ['Eventual', 'Converge when idle', 'AP during partition', 'Counters, feeds'],
        ],
      },
    ],
  },
  {
    id: 'sla',
    title: 'CAP Availability vs SLA Uptime vs Latency',
    what:
      'CAP Availability is a liveness property: every non-failing node must eventually respond successfully to every request — even if stale. SLA uptime (99.9%, 99.99%, 99.999%) measures aggregate service health over time. Latency SLA caps response time. Fault tolerance is surviving component failures without violating invariants.',
    why:
      'Candidates conflate "five nines" with CAP-A and promise both. Interviewers want orthogonal axes: you can be CAP-unavailable on minority partition while meeting annual uptime, or CAP-available with terrible p99 latency.',
    how:
      'Separate questions: (1) Must every replica answer during partition? CAP A. (2) What % of time is service up? SLA. (3) How fast? Latency SLA. (4) How many failures tolerated? Fault tolerance / quorum math.',
    example: `THREE DIFFERENT AXES

  CAP Availability          SLA Uptime              Latency SLA
  ─────────────────          ──────────              ───────────
  "Node must respond"        "% time not down"       "p99 < 200ms"
  Per-partition liveness     Monthly/yearly metric     Performance contract
  Allows stale 200 OK        Allows planned maint      Slow can still be CAP-A

NINES TABLE
  99.9%   (~8.7 h/yr downtime)   — many internal tools
  99.99%  (~52 min/yr)           — production SaaS
  99.999% (~5 min/yr)            — payments, telco tier

  Five nines ≠ CAP-A during partition.
  You can miss latency SLA while CAP-available (5s timeout still 200).

FAULT TOLERANCE vs CAP
  Fault tolerance: survive f node crashes with quorum (N=2f+1).
  CAP: behavior when nodes alive but cannot talk.

  Example: N=3 quorum system loses 1 node → still operates (fault tolerant).
  Same system split 1|2 → minority CAP-unavailable (CP), majority continues.

LATENCY SLA TRAP
  CP system blocks on quorum → p99 spikes during slow replica.
  AP system responds fast with stale data → meets latency, violates freshness.

SPRING / OPS MAPPING
  Resilience4j circuit breaker OPEN → CAP-unavailable for that path (fail fast).
  K8s liveness vs readiness: readiness drain ≠ CAP (pod still alive).
  SLO error budget: different from CAP partition policy.`,
    failure:
      'Promising 99.999% and CAP-A on both sides of a partition without merge logic. Using long timeouts to claim availability while clients see failures. SLA excludes partition behavior from error budget.',
    tradeoff:
      'Strict CAP-C often hurts latency SLA and minority availability. Strict CAP-A hurts correctness SLAs (stale reads). Product picks which SLA breach is worse: wrong balance vs "try again later."',
    tech:
      'SLI/SLO: Prometheus + error budgets. CAP: etcd minority 503, Cassandra ONE always 200. Latency: gRPC deadlines, Hystrix/Resilience4j timeouts.',
    trap:
      '"We have 99.99% uptime so we are highly available in CAP." Uptime aggregates; CAP is per-request during partition.',
    interviewAnswer:
      'CAP availability means every non-failing node returns a non-error response — possibly stale. SLA uptime is a time percentage and can include maintenance windows. Latency SLA is a performance contract. Fault tolerance is how many failures quorum survives. They are orthogonal: a CP system can meet five-nines by failing fast on minority partition while a CAP-A system can miss latency SLOs serving stale cache.',
    remember: [
      'CAP A ≠ 99.99% uptime',
      'Latency SLA ≠ CAP availability',
      'Fault tolerance = crash tolerance, not partition policy',
      'Slow response can still be CAP-available',
      'SLO error budget ≠ partition behavior',
    ],
    oneLiner:
      'CAP availability, SLA uptime, latency SLA, and fault tolerance are four different axes — do not collapse them.',
    tables: [
      {
        headers: ['Concept', 'Measures', 'Partition example'],
        rows: [
          ['CAP A', 'Every live node responds', 'Stale 200 from isolated replica'],
          ['SLA uptime', '% time service up', 'Region down counts against nines'],
          ['Latency SLA', 'p50/p99 response time', 'Quorum wait spikes p99'],
          ['Fault tolerance', 'Survive f failures', '1 crash OK; 1|2 split is different problem'],
        ],
      },
    ],
  },
  {
    id: 'matrix',
    title: 'CAP Decision Matrix',
    what:
      'A tendency matrix mapping workload types to CP-leaning vs AP-leaning posture. These are heuristics, not laws — config, scale, and business context override any cell.',
    why:
      'Interviewers want structured reasoning: "financial → CP" with caveats beats generic "it depends." The matrix is a starting point for per-operation drill-down.',
    how:
      'For each row: name invariant, acceptable staleness, partition behavior, and exception. Always add "depends on config" for tunable stores.',
    example:
      'Use the table below as interview scaffolding — never as final architecture. Payment and inventory default CP; feed and search default AP; service discovery depends on registry design (CP etcd vs AP gossip).',
    failure:
      'Applying matrix blindly: CP everywhere kills checkout during blip; AP everywhere loses money. Ignoring hybrid within row (analytics eventual inside CP bank).',
    tradeoff:
      'Matrix simplifies; real design needs operation-level matrix and PACELC for latency when healthy.',
    tech:
      'Map rows to concrete stores: financial→Postgres sync; feed→Cassandra; search→ES; locks→etcd.',
    trap:
      'Treating matrix as absolute. Saying "search is AP" while requiring strong read-after-write for admin index.',
    interviewAnswer:
      'I use a tendency matrix: financial and leader election CP; social feed AP; inventory stronger than catalog; analytics eventual; payment strong; search eventual; service discovery depends. These are starting points — I always qualify with replication config and which operation in the workflow.',
    remember: [
      'Tendencies, not absolutes',
      'Inventory ≠ catalog CAP posture',
      'Discovery: CP (etcd) vs AP (gossip) depends',
      'Payment strong; analytics eventual',
      'Qualify every cell with config',
    ],
    oneLiner:
      'Financial and payments lean CP; feeds and search lean AP — tendencies to qualify, not rules to apply blindly.',
    tables: [
      {
        headers: ['Workload', 'Tendency', 'Partition bias', 'Caveat'],
        rows: [
          ['Financial ledger', 'CP-oriented', 'Reject minority writes', 'Async DR changes posture'],
          ['Social feed', 'AP', 'Serve stale; merge later', 'DMs may need stronger'],
          ['Inventory / seats', 'CP-leaning', 'Block oversell', 'Display can be AP'],
          ['Product catalog', 'AP', 'Stale price until cart', 'Reconcile at checkout'],
          ['Analytics / BI', 'Eventual', 'Lag hours acceptable', 'Not for billing source'],
          ['Payment capture', 'Strong / CP', 'Idempotent retry only', 'Not the same as auth hold'],
          ['Search index', 'Eventual', 'NRT seconds lag', 'Admin may need strong'],
          ['Leader election', 'CP', 'Minority cannot elect', 'etcd/ZK quorum'],
          ['Service discovery', 'Depends', 'CP: consistent registry', 'AP: gossip (stale routes)'],
          ['Session cache', 'AP', 'Sticky or stale ok', 'Security-sensitive → CP'],
          ['Notifications', 'AP', 'At-least-once delivery', 'Dedup on consumer'],
        ],
      },
    ],
  },
  {
    id: 'patterns',
    title: 'Architecture Patterns and CAP',
    what:
      'Common distributed patterns each imply CAP trade-offs: CP architectures (quorum, consensus), AP architectures (gossip, local quorum ONE), hybrids, CQRS, event sourcing, outbox, CDC, read replicas, multi-leader, and leaderless replication.',
    why:
      'Staff design rounds expect pattern names tied to partition behavior — not buzzwords. "We use CQRS" without saying read model staleness fails the bar.',
    how:
      'For each pattern: write path CAP, read path CAP, partition symptom, recovery mechanism.',
    example: `PATTERN → CAP IMPLICATIONS

CP ARCHITECTURE
  Single leader + sync/quorum writes.
  Partition: minority unavailable (503).
  Examples: etcd config, sync Postgres primary.

AP ARCHITECTURE
  Local reads/writes, async replication, conflict resolution.
  Partition: both sides serve; divergence possible.
  Examples: Cassandra LOCAL_ONE, Dynamo eventual.

HYBRID
  CP core (ledger) + AP edges (feed, search).
  Partition: core blocks; edges degrade gracefully.

CQRS
  Write model CP-leaning; read model AP (projections lag).
  Partition: writes may halt; reads still serve stale projections.

EVENT SOURCING
  Append-only log CP if quorum ack; projections AP.
  Replay heals divergence after partition.

OUTBOX PATTERN
  Local txn writes business row + outbox row (CP locally).
  Relay async to bus — AP across services until delivered.

CDC (Debezium etc.)
  AP propagation delay from binlog to consumers.
  Ordering per partition; not global linearizable.

READ REPLICAS
  Leader write CP; replica read AP unless sync/quorum read.
  Classic CAP split on same database product.

MULTI-LEADER
  AP by default; concurrent writes → conflicts.
  CP variant needs CRDT or conflict-free merge rules.

LEADERLESS (Dynamo-style)
  Tunable: QUORUM CP-leaning; ONE AP.
  Sloppy quorum + hinted handoff = AP with repair debt.`,
    failure:
      'CQRS without projection lag monitoring. Outbox relay down → silent AP gap. Multi-leader without conflict resolution → lost updates. CDC consumers assume exactly-once without idempotency.',
    tradeoff:
      'Each pattern trades complexity for a CAP dimension. Async patterns improve A and latency; sync/quorum improves C at partition cost.',
    tech:
      'Outbox: Postgres + Debezium/Kafka Connect. CQRS: Kafka + ES read models. CDC: Maxwell, Debezium. Consensus CP: Raft in Cockroach, etcd.',
    trap:
      'Event sourcing ≠ automatic consistency. Kafka is not CP or AP alone — depends on acks and consumer design.',
    interviewAnswer:
      'I map patterns to CAP: CP arch uses quorum/consensus and rejects minority partition. AP uses local ops and merge. Hybrid splits core vs edge. CQRS and event sourcing make writes CP-leaning and reads AP via projections. Outbox gives local CP plus async cross-service AP. Read replicas are AP on read path unless routed to leader. Multi-leader and leaderless are tunable — QUORUM vs ONE.',
    remember: [
      'CQRS: write CP-ish, read AP projections',
      'Outbox: local CP, cross-service eventual',
      'Read replica read = AP unless sync',
      'Multi-leader needs conflict strategy',
      'Leaderless tunable per quorum',
    ],
    oneLiner:
      'Every architecture pattern picks a CAP posture — CQRS, outbox, and read replicas split C on write from A on read.',
    tables: [
      {
        headers: ['Pattern', 'Write CAP', 'Read CAP', 'Partition note'],
        rows: [
          ['CP arch (consensus)', 'CP', 'CP (quorum read)', 'Minority unavailable'],
          ['AP arch (gossip)', 'AP', 'AP', 'Divergence + merge'],
          ['Hybrid', 'CP core', 'AP edge', 'Split behavior by path'],
          ['CQRS', 'CP-leaning', 'AP projections', 'Stale read models'],
          ['Event sourcing', 'CP log if quorum', 'AP projections', 'Replay on heal'],
          ['Outbox', 'Local CP', 'N/A (async fan-out)', 'Relay lag = AP gap'],
          ['CDC', 'Source CP', 'AP downstream', 'Replication lag'],
          ['Read replicas', 'CP on primary', 'AP on replica', 'Route critical reads to leader'],
          ['Multi-leader', 'AP (conflicts)', 'AP', 'CRDT / LWW required'],
          ['Leaderless', 'Tunable', 'Tunable', 'CL/QUORUM decides'],
        ],
      },
    ],
  },
  {
    id: 'hybrid',
    title: 'Hybrid Systems in Practice',
    what:
      'Production systems deliberately combine CP and AP subsystems: strong consistency where invariants demand it; eventual consistency where staleness is cheap. Payment balance strong; history, notifications, analytics, and search eventual — in one platform.',
    why:
      'Pure CP or AP products are rare. Interviewers test whether you can articulate the integration seams — where stale reads must never influence strong writes.',
    how:
      'Draw boundary: strong write path → idempotency → async fan-out to AP consumers. Never use eventual read to decide strong write without version check. Use saga for cross-boundary workflows.',
    example: `SINGLE PLATFORM — MULTIPLE CAP ZONES

  ┌──────────────────────────────────────────────────────────┐
  │                    USER CHECKOUT                         │
  └──────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Payment │   │ Inventory│   │ Search   │   │ Analytics│
    │ CP      │   │ CP       │   │ AP       │   │ AP       │
    │ ledger  │   │ reserve  │   │ ES NRT   │   │ warehouse│
    └─────────┘   └──────────┘   └──────────┘   └──────────┘
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                              │
                    Kafka / CDC (async AP boundary)
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │ History  │        │ Notify   │        │ Dashboard│
    │ AP ok    │        │ AP ok    │        │ AP ok    │
    │ seconds  │        │ at-least │        │ minutes  │
    └──────────┘        └──────────┘        └──────────┘

RULES AT THE SEAM
  1. Strong path never reads search index for balance.
  2. Notifications lag does not block payment commit.
  3. Analytics duplicate event ok; ledger duplicate not ok.
  4. Version / epoch on strong row for optimistic checks.

PARTITION BEHAVIOR
  Payment CP: minority region rejects charge (503).
  Search AP: minority still returns results (stale).
  User sees "payment failed" but browse still works — correct hybrid.`,
    failure:
      'Analytics pipeline used as source of truth for billing. Notification retry double-charges without idempotency. Search-index price used at payment time.',
    tradeoff:
      'Hybrid ops complexity: lag monitoring, idempotency everywhere, clear data lineage. Worth it for business-fit SLAs.',
    tech:
      'Strong: Postgres SERIALIZABLE + sync standby. AP: Kafka consumers, ES, Snowflake. Seam: outbox, idempotency keys (Stripe-style), sagas.',
    trap:
      '"We are a hybrid CAP system" without naming which paths are which. Hybrid without idempotency at async boundaries.',
    interviewAnswer:
      'Real platforms are hybrid: payment balance and inventory CP with quorum or leader; order history, notifications, analytics, and search AP with bounded staleness. I enforce seams — strong writes never depend on eventual reads; async fan-out via outbox/Kafka with idempotency. During partition, core rejects and edges degrade.',
    remember: [
      'Balance CP; history/notifications AP',
      'Never pay from search index',
      'Outbox at CP→AP boundary',
      'Idempotency on every async consumer',
      'Partition: core blocks, edges serve stale',
    ],
    oneLiner:
      'Hybrid means CP for payment and inventory, AP for history, notifications, analytics, and search — with hard seams between them.',
  },
  {
    id: 'framework',
    title: '10-Step CAP Interview Framework',
    what:
      'A structured answer framework for system design interviews: walk from business correctness through availability, partition assumptions, consistency model, replication, quorum/leader, failure modes, recovery, trade-offs, and business fit.',
    why:
      'Senior candidates narrate decisions; juniors list technologies. This framework keeps CAP reasoning explicit and interviewers oriented.',
    how:
      'Use all ten steps even if brief. Skip none — step 10 (business fit) is where Staff answers land.',
    example: `10-STEP CAP INTERVIEW FRAMEWORK

 1. BUSINESS CORRECTNESS
    What invariant must never break? (no double charge, no oversell)
    → drives CP vs AP per operation

 2. AVAILABILITY REQUIREMENTS
    CAP A vs SLA: must minority partition serve stale or error?
    User-facing continuity vs correctness

 3. PARTITION ASSUMPTION
    Multi-AZ? Multi-region? P is mandatory.
    Name realistic partition shapes (1|2, region isolation)

 4. CONSISTENCY MODEL
    Linearizable? Serializable? Eventual? Per operation.
    Define "strong" explicitly for interviewer

 5. REPLICATION TOPOLOGY
    Leader/follower, multi-leader, leaderless, quorum N
    Sync vs async; cross-region links

 6. QUORUM / LEADER
    W, R, N or Raft majority; who accepts writes during split?
    Fencing old leader?

 7. FAILURE MODES
    Crash vs partition vs slow replica vs clock skew
    Split brain, duplicate delivery, lost ack

 8. RECOVERY
    Merge strategy: LWW, CRDT, manual reconcile
    Backfill, replay log, anti-entropy

 9. TRADE-OFFS (CAP + PACELC)
    Latency vs C when healthy; C vs A when partitioned
    Operational cost, complexity budget

10. BUSINESS FIT
    Tie back: "For ticket inventory we choose CP because..."
    Name what you consciously sacrifice

SAMPLE 60s NARRATION
 "Payments need linearizable balance (step 1). We accept minority
  region unavailable during partition (2–3). Postgres sync rep,
  leader reads for balance (4–5). Majority quorum for commit (6).
  Split-brain prevented by fencing (7). Async CDC to search (8).
  PACELC: higher write latency for C (9). Oversell risk outweighs
  stale feed cost (10)."`,
    failure:
      'Jumping to Kafka/Redis at step 1. Ignoring partition (step 3). No recovery story (step 8). Framework recited without domain tie-in (step 10).',
    tradeoff:
      'Framework takes time — practice compression for 45-minute rounds. Depth on steps 1, 4, 6, 10 beats shallow coverage of all.',
    tech:
      'Anchor each step to inspectable choices: step 6 → etcd vs Cassandra CL; step 8 → Debezium replay.',
    trap:
      'Treating framework as checklist of buzzwords without numbers (N, W, R, RPO, RTO).',
    interviewAnswer:
      'I use ten steps: business correctness, availability needs, partition assumption, consistency model, replication topology, quorum/leader, failure modes, recovery, trade-offs including PACELC, and business fit. This keeps CAP explicit and ends on why the product accepts the chosen sacrifice.',
    remember: [
      'Start with business invariant',
      'P is mandatory in distributed',
      'Name consistency per operation',
      'Quorum/leader before tech logos',
      'End on business fit',
    ],
    oneLiner:
      'Ten steps: correctness → availability → partition → model → replication → quorum → failure → recovery → trade-offs → business fit.',
  },
  {
    id: 'diagrams',
    title: 'Architecture Diagrams (ASCII)',
    what:
      'Reference ASCII diagrams for CP, AP, leader/follower, quorum, partition, split brain, multi-region, active-active/passive, Saga, and consensus — for whiteboard and interview narration.',
    why:
      'Visual structure accelerates interviewer alignment. These diagrams pair with verbal CAP labeling during design rounds.',
    how:
      'Draw partition as dashed line. Label which side accepts traffic. Mark quorum circles. Narrate C vs A choice per diagram.',
    example: `CP ARCHITECTURE (quorum / consensus)
  Clients ──► Leader ──► Follower1
                │    ╲
                │     ╲──► Follower2
                ▼
         [need majority ack]
  Partition (minority side):
    Clients ──X──► Isolated follower  → 503 / unavailable

AP ARCHITECTURE (local serve)
  Clients ──► Node A ◄··async··► Node B ◄── Clients
              writes local          writes local
  Partition: both sides accept writes → divergence

LEADER / FOLLOWER
       ┌─────────┐
       │ Leader  │◄── all writes
       └────┬────┘
            │ replicate
       ┌────┴────┐
       ▼         ▼
   Follower1  Follower2
   (reads?)   (reads?)

QUORUM (N=3, W=2, R=2)
     [A]────[B]────[C]
      └─ write quorum (any 2)
      └─ read quorum (any 2)
  R+W>N → overlapping node has latest write

NETWORK PARTITION
     Site 1  │  Site 2
    [A][B]  ║  [C][D]
            ║
     messages blocked

SPLIT BRAIN (bad — dual leader)
     [Leader1]···partition···[Leader2]
     both accept writes → fork
  Fix: fencing, epoch, STONITH, quorum-only writes

MULTI-REGION
  US-EAST ◄──WAN──► EU-WEST
     │                  │
   users              users
  CP: one region primary for writes
  AP: both regions accept (global tables)

ACTIVE-ACTIVE vs ACTIVE-PASSIVE
  Active-Active: both take traffic (conflict risk AP)
  Active-Passive: standby on failover (CP-leaning RTO)

SAGA (choreography)
  Order ──► Payment ──► Inventory ──► Notify
     │         │            │
     └── compensating tx on failure (eventual overall)

CONSENSUS (Raft sketch)
  Leader proposes entry → followers ack → commit on majority
  Election on heartbeat loss → one leader per term`,
    failure:
      'Drawing single diagram without labeling CAP choice. Omitting partition line. Saga without compensation arrows.',
    tradeoff:
      'Diagrams simplify — always verbalize async vs sync edges and read routing.',
    tech:
      'Map diagrams to: Raft (consensus), Dynamo (quorum), Saga (microservices), split brain (Redis Sentinel without fencing).',
    trap:
      'Pretty diagram, no partition scenario. Leader/follower drawn without marking read-from-follower as AP.',
    interviewAnswer:
      'I whiteboard CP as leader+quorum with minority 503, AP as both sides serving with async replication, and always draw the partition line. I add quorum circles for N/W/R, split brain as dual leader, multi-region with WAN, and Saga with compensation. Consensus diagram shows majority commit before ack.',
    remember: [
      'Always draw partition line',
      'Label minority behavior (503 vs stale)',
      'Quorum overlap ≠ linearizability',
      'Split brain = dual leader danger',
      'Saga needs compensation path',
    ],
    oneLiner:
      'Whiteboard CP with quorum minority reject, AP with both sides serving, and always show the partition line.',
  },
  {
    id: 'tech-map',
    title: 'Technology Mapping Table',
    what:
      'Per-technology CAP-relevant mapping: typical consistency, replication model, partition behavior, use case, trade-off, and caveats — without permanent CP/AP labels.',
    why:
      'Interviewers name a tech and expect nuanced posture: "Cassandra" is not AP until you state consistency level and failure shape.',
    how:
      'For each row cite tunable knobs. Partition behavior always qualified: minority vs majority, config-dependent.',
    example:
      'Use the table as interview reference. Never say "Postgres is CP" without sync rep and read routing. Never say "Kafka is AP" without discussing acks and ISR.',
    failure:
      'Oversimplified matrix memorized without caveats. Choosing tech from label not workload. Ignoring Consul session semantics vs KV eventual mode.',
    tradeoff:
      'Richer truth table beats triangle meme. Operational maturity (runbooks, Jepsen) matters as much as logo.',
    tech:
      'PostgreSQL, MySQL, Oracle, Cassandra, MongoDB, DynamoDB, Redis, Kafka, ZooKeeper, etcd, Consul, CockroachDB, Spanner, Elasticsearch — see table.',
    trap:
      'Permanent CP/AP stamp. Ignoring per-operation tunables. Forgetting Kafka/K8s/etcd are coordination CP while consumers may be AP.',
    interviewAnswer:
      'I map each technology with consistency model, replication, partition behavior, use case, trade-off, and caveat — never a permanent CP/AP label. Postgres is CP-leaning with sync rep on minority partition; Cassandra depends on CL; Kafka partition leader is CP within ISR but end-to-end is design-dependent.',
    remember: [
      'Config determines posture',
      'State partition shape every time',
      'Coordination stores ≠ data plane',
      'Kafka/EK hybrid semantics',
      'Caveat column beats label',
    ],
    oneLiner:
      'Every technology is tunable — map consistency, replication, and partition behavior with caveats, not CP/AP stickers.',
    tables: [
      {
        headers: [
          'Technology',
          'Typical consistency',
          'Replication',
          'Partition behavior',
          'Use case',
          'Trade-off',
          'Caveat',
        ],
        rows: [
          [
            'PostgreSQL',
            'Linearizable on single primary; serializable txn optional',
            'Streaming physical/logical replica; sync or async standby',
            'Sync rep: minority cannot commit (CP-leaning). Async: promoted standby may gap (RPO>0). Split-brain without fencing.',
            'OLTP ledger, inventory, relational core',
            'Mature SQL; sync adds latency',
            'Read replica ≠ CAP-C unless routed or sync. Patroni failover needs quorum.',
          ],
          [
            'MySQL',
            'Primary serializable/RR; replicas async by default',
            'Binlog async replica; Group Replication / InnoDB Cluster semi-sync',
            'GR: needs majority for writes — minority unavailable. Classic async: dual-primary risk.',
            'Web OLTP, read-scale-out',
            'GR gives CP-leaning; async gives performance',
            'Read from replica is AP. GTID failover gaps without sync.',
          ],
          [
            'Oracle',
            'Strong per-instance; RAC cluster coordination',
            'Data Guard sync/async; RAC shared nothing',
            'Sync Data Guard: isolated primary blocks commit. RAC: voting disk prevents split brain.',
            'Enterprise ledger, ERP',
            'Data Guard RPO tunable',
            'RAC ≠ automatic cross-shard linearizability. Active Data Guard reads lag.',
          ],
          [
            'Cassandra',
            'Tunable per CL: ONE → eventual; QUORUM → stronger overlap',
            'Leaderless RF replicas; gossip membership',
            'QUORUM/ALL: minority partition rejects (CP-leaning for op). ONE/LOCAL_ONE: accepts stale (AP).',
            'High-write time-series, feeds, wide-column',
            'Linear scale-out; tunable per query',
            'LWT not full serializable SQL. Repair/anti-entropy for convergence.',
          ],
          [
            'MongoDB',
            'Replica set primary ordering; tunable read/write concern',
            'Primary-secondary oplog; optional sharded cluster',
            'w:majority + readConcern majority: CP-leaning. readPreference secondary: AP stale.',
            'Document OLTP, flexible schema',
            'Transactions multi-doc but latency cost',
            'Sharded cluster: per-shard primary. Secondary read ≠ strong.',
          ],
          [
            'DynamoDB',
            'Per-item; eventual default; strongly consistent read option',
            'Multi-AZ replication within region; global tables async cross-region',
            'Strong read needs current leader partition. Global tables: AP across regions with conflict handling.',
            'Serverless key-value, session, cart',
            'Predictable scale; per-item not relational',
            'Strong read 2x cost; not cross-item txn (except TransactWrite limits).',
          ],
          [
            'Redis',
            'Single-threaded primary per shard; optional WAIT',
            'Async replication; Sentinel or Cluster failover',
            'Async: master partition → split brain risk. Cluster: minority slots unavailable without majority.',
            'Cache, session, rate limit, pub/sub',
            'Extreme latency; not durable by default',
            'WAIT not full consensus. RDB/AOF durability ≠ replication consistency.',
          ],
          [
            'Kafka',
            'Ordered log per partition; not a database',
            'Partition leader + ISR replicas; acks=all',
            'Leader in ISR required for acks=all (CP-leaning produce). acks=1 AP with loss risk. Consumer offset AP.',
            'Event bus, log aggregation, stream processing',
            'Throughput; retention not query engine',
            'End-to-end exactly-once needs idempotent producer + txn consumer. Not global linearizable store.',
          ],
          [
            'ZooKeeper',
            'Linearizable writes; sequential consistency reads (sync)',
            'Zab; majority quorum',
            'Minority partition: no leader, writes fail (CP). Designed unavailable on minority.',
            'Coordination, old Kafka controller, locks',
            'Low throughput; strong ordering',
            'Not a data plane. Session ephemeral nodes lost on partition.',
          ],
          [
            'etcd',
            'Linearizable reads (quorum) and writes via Raft',
            'Raft log replicated majority',
            'Minority partition cannot commit or linearizable read (CP).',
            'K8s API, service config, leader election',
            'Watch API; small key space',
            'Large values hurt. Revision-based optimistic concurrency.',
          ],
          [
            'Consul',
            'Raft for catalog; eventual for some DNS modes',
            'Server raft + LAN gossip',
            'Server minority unavailable for consistent writes. Gossip AP for some health states.',
            'Service mesh registry, KV, health',
            'Multi-datacenter WAN federation complexity',
            'Consistency mode per endpoint: consistent vs stale reads.',
          ],
          [
            'CockroachDB',
            'Serializable default; external consistency via HLC',
            'Raft per range; multi-region survival goals',
            'SURVIVE ZONE/REGION: minority zone cannot write (CP-leaning).',
            'Geo-distributed SQL',
            'Spanner-like without TrueTime hardware',
            'Follower reads configurable staleness. Latency cross-region.',
          ],
          [
            'Spanner',
            'External consistency (strongest practical global SQL)',
            'Paxos per tablet; TrueTime bounds uncertainty',
            'Quorum loss blocks writes. Minority DC unavailable for strong ops.',
            'Global financial, ads, large relational',
            'TrueTime enables global strong consistency',
            'Cost and latency; not magic — partition still forces trade-off.',
          ],
          [
            'Elasticsearch',
            'Near-real-time search; not linearizable DB',
            'Primary/replica shards per index',
            'Write ack after primary+replicas (tunable). Split cluster → divergent indices. Search stale until refresh.',
            'Full-text search, logs, analytics',
            'Excellent search; eventual indexing',
            'Split-brain without minimum_master_nodes / voting. CCU not ACID bank.',
          ],
        ],
      },
    ],
  },
];
