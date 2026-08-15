import type {SectionBlock} from './types';

export const E2E_TRACE_ASCII = `┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  END-TO-END: Payment event bus (one region, one cluster — DR is another cluster + MM2)       │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

  [1] Application          [2] API / Gateway         [3] Producer pool
  ┌──────────────┐         ┌──────────────┐          ┌──────────────────────┐
  │ Mobile / Web │──HTTP──►│ Payment API  │──send()─►│ Idempotent producer  │
  │ POS / Batch  │         │ validate +   │          │ acks=all, key=acctId │
  └──────────────┘         │ rate limit   │          │ linger + batching    │
                           └──────────────┘          └──────────┬───────────┘
                                                                │
  [4] DNS / LB / mTLS                                           │ Produce API
  ┌─────────────────────────────────────────────────────────────┼──────────────────────────┐
  │ bootstrap.servers → broker listeners (PLAINTEXT / SSL / SASL_SSL)                        │
  │ metadata: partition leaders, ISR, broker.rack (AZ)                                       │
  └─────────────────────────────────────────────────────────────┼──────────────────────────┘
                                                                ▼
  [5] KAFKA CLUSTER (RF=3, minISR=2, rack-aware across 3 AZs) — deep internals: /kafka-cluster
  ┌──────────────────────────────────────────────────────────────────────────────────────────┐
  │  KRaft controllers (3) — metadata, leader election, ISR (NOT on every record hot path)   │
  │                                                                                          │
  │  Topic: payments.events   Partition P7 (example)                                         │
  │  ┌─────────────┐    replica fetch    ┌─────────────┐    replica fetch    ┌─────────────┐ │
  │  │ Broker-1    │◄───────────────────│ Broker-2    │◄───────────────────│ Broker-3    │ │
  │  │ AZ-a        │                    │ AZ-b LEADER   │                    │ AZ-c        │ │
  │  │ P7 follower │───────────────────►│ P7 leader     │───────────────────►│ P7 follower │ │
  │  │ LEO/HW sync │                    │ append + HW   │                    │ LEO/HW sync │ │
  │  └─────────────┘                    └──────┬──────┘                    └─────────────┘ │
  │                                          │ ack when ISR ≥ minISR                      │
  └──────────────────────────────────────────┼──────────────────────────────────────────────┘
                                             │
  [6] Consumer group (≤ partitions)         │ Fetch API
  ┌──────────────────────────────────────────┼──────────────────────────────────────────────┐
  │  settlement-svc (12 members, 24 partitions)                                              │
  │  ┌─────────────┐   poll batch   ┌─────────────┐   UPSERT   ┌─────────────────────┐   │
  │  │ Consumer C3 │──deserialize──►│ Handler     │───────────►│ [7] PostgreSQL      │   │
  │  │ assigned P7 │   + validate   │ idempotent  │  UNIQUE    │ ledger(payment_id)  │   │
  │  └─────────────┘                │ by paymentId│            │ + audit row         │   │
  │        ▲                        └──────┬──────┘            └─────────────────────┘   │
  │        │ commit offset               │ poison / retry                              │
  │        │ to __consumer_offsets       ▼                                               │
  │        │                       ┌─────────────┐   replay   /kafka-dlq                 │
  │        └───────────────────────│ DLQ topic   │◄──────────────────────────────────  │
  │                                └─────────────┘                                       │
  └──────────────────────────────────────────────────────────────────────────────────────┘

  Client deep dives: /kafka-producer · /kafka-consumer · failure recovery: /kafka-dlq
  Numbers (RF=3, minISR=2, 24 partitions) = starting points — always say workload-dependent.`;

export const E2E_TRACE_FAILURES: {step: string; ifFails: string; temp: string; permanent: string}[] = [
  {
    step: '1. Application / client',
    ifFails: 'No events reach Kafka; user-facing payment errors; no lag signal on cluster.',
    temp: 'Queue at API edge, degrade non-critical flows, circuit-break downstream produce calls.',
    permanent: 'Client retry with idempotency keys, SLO dashboards on API success rate, load test peak keys.',
  },
  {
    step: '2. API / Gateway',
    ifFails: 'Validation rejects or timeouts before produce; partial writes if dual-write without outbox.',
    temp: 'Raise gateway timeout, shed non-payment traffic, fail closed on auth.',
    permanent: 'Transactional outbox in same DB TX as business row; schema validation at edge; rate limits per tenant.',
  },
  {
    step: '3. Producer client',
    ifFails: 'BufferExhaustedException, NOT_ENOUGH_REPLICAS, timeout — no broker append; duplicates if retries without idempotence.',
    temp: 'Throttle ingress at API, raise request.timeout.ms short-term, pause non-critical producers.',
    permanent: 'Idempotent producer + acks=all; fix ISR/minISR root cause; circuit breaker; tune linger/batch — see /kafka-producer.',
  },
  {
    step: '4. DNS / LB / listeners',
    ifFails: 'Metadata stale, connection storms, TLS handshake failures, clients hit wrong AZ broker.',
    temp: 'Fail DNS to healthy AZ listeners, widen connection pool, disable bad broker in LB.',
    permanent: 'Separate internal/external listeners, advertised.listeners match client routes, cert rotation runbook, connection limits per broker.',
  },
  {
    step: '5. Partition leader (Produce)',
    ifFails: 'NOT_LEADER, REQUEST_TIMED_OUT — produce fails for that partition slice.',
    temp: 'Client metadata refresh; fail over app instances; reduce produce rate.',
    permanent: 'Leader rebalance after broker recovery; rack-aware placement; hot-partition key redesign.',
  },
  {
    step: '6. ISR replication (follower fetch)',
    ifFails: 'ISR shrinks; acks=all fails when |ISR| < min.insync.replicas; URP grows.',
    temp: 'Throttle reassignment; restart lagging follower if disk healthy; never enable unclean election on money paths.',
    permanent: 'Disk IOPS class, num.replica.fetchers, network capacity = ingress × (RF−1); minISR=2 with RF=3 typical starting point.',
  },
  {
    step: '7. Consumer fetch',
    ifFails: 'Lag grows; session timeout → rebalance; FETCH session errors.',
    temp: 'Scale consumers to partition ceiling; raise max.poll.interval if GC-bound.',
    permanent: 'Right-size partitions; cooperative assignor + group.instance.id; fix broker fetch latency — see /kafka-consumer.',
  },
  {
    step: '8. Consumer handler / deserialize',
    ifFails: 'Poison message stalls one partition; deserialization errors loop.',
    temp: 'Route to DLQ manually (dangerous); pause partition consumer.',
    permanent: 'ErrorHandlingDeserializer + DLT, schema compat in Registry, classifier for permanent vs transient — /kafka-dlq.',
  },
  {
    step: '9. Downstream DB',
    ifFails: 'Handler slow → max.poll.interval exceeded → rebalance storm; pool exhausted → lag.',
    temp: 'Scale DB read replicas for read path only; widen pool (masks root cause).',
    permanent: 'Idempotent UPSERT by business key, batch writes, async side effects, DB capacity model tied to peak lag SLO.',
  },
  {
    step: '10. Offset commit (__consumer_offsets)',
    ifFails: 'CommitFailedException → redelivery or stuck offset; duplicates if processed but not committed.',
    temp: 'Retry commit after rebalance settles; reduce poll batch size.',
    permanent: 'Commit after idempotent side effect; static membership; monitor commit latency; never commit-before-process on money paths.',
  },
];

export const SECTIONS_STAFF_GAPS: SectionBlock[] = [
  {
    id: 'networking',
    part: 34,
    title: 'Networking — listeners, DNS, cross-AZ, limits',
    lead: 'Clients connect to advertised addresses, not bind sockets. Misconfigured listeners cause the most expensive “Kafka is down” false alarms.',
    ascii: `BROKER JVM
┌─────────────────────────────────────────────────────────────┐
│ listeners=INTERNAL://0.0.0.0:9092,EXTERNAL://0.0.0.0:9093   │
│ listener.security.protocol.map=INTERNAL:PLAINTEXT,            │
│   EXTERNAL:SASL_SSL                                         │
│ advertised.listeners=INTERNAL://broker1.int:9092,             │
│   EXTERNAL://kafka.prod.example.com:9093                    │
│ inter.broker.listener.name=INTERNAL                           │
└─────────────────────────────────────────────────────────────┘
        ▲                                    ▲
   inter-broker                    client (app tier, MM2, Connect)
   replica fetch                   via DNS/LB → EXTERNAL listener`,
    body: `**CONCEPT** — \`listeners\` bind sockets on the broker; \`advertised.listeners\` are the addresses returned in metadata so clients open connections to reachable endpoints. \`inter.broker.listener.name\` isolates replication traffic from client traffic. Internal listeners (VPC/private DNS) vs external (public LB, mTLS edge) are separate security and capacity domains.

**WHY** — Wrong advertised host → clients connect to unroutable IPs (common in Docker/K8s). Cross-AZ replication multiplies bandwidth by (RF−1). TLS adds CPU and RTT. Connection limits (\`max.connections\`, \`max.connections.per.ip\`) prevent noisy-neighbor SYN floods.

**EXAMPLE** — 3-AZ cluster: INTERNAL on \`broker-N.internal:9092\` for replica fetchers and in-VPC apps; EXTERNAL on \`*.kafka.company.com:9093\` behind NLB with SASL_SSL. Producers in AZ-a prefer leaders in AZ-a when rack-aware (reduces cross-AZ produce RTT — workload-dependent win).

| Listener type | Who connects | Typical security |
|---------------|--------------|------------------|
| INTERNAL | Brokers, Connect, in-VPC apps | PLAINTEXT or mTLS in zero-trust VPC |
| EXTERNAL | Off-VPC, partner integrations | SASL_SSL + ACL |
| REPLICATION (alias) | Same as INTERNAL | Must match inter.broker.listener.name |

**FAILURE** — Metadata returns stale leader after broker replace if advertised.listeners still point at old hostname. Network saturation on one broker NIC → replica lag → ISR shrink. TLS renegotiation storms after cert rotation without session resumption.

**MONITOR** — NetworkProcessorAvgIdlePercent, connection-count per listener, bytes in/out per AZ, inter-broker replication bytes, TLS handshake error rate, DNS TTL vs broker replacement cadence.

**TEMP** — Shift client bootstrap to healthy AZ brokers; throttle reassignment; increase \`socket.send.buffer.bytes\` only after confirming NIC headroom.

**PERM** — Infrastructure-as-code for listener maps; separate SG/NACL for inter-broker; capacity plan NIC = client ingress + replication × RF + consumer fan-out; automate cert rotation with dual-trust window.

**INTERVIEW** — Draw listeners vs advertised.listeners. State cross-AZ cost is durability tax, not optional for RF=3 multi-AZ. Cross-link cluster topology: /kafka-cluster.`,
    remember: [
      'Clients use advertised.listeners from metadata — not the bind address.',
      'inter.broker.listener.name must match a defined listener for replication.',
      'Cross-AZ replication ≈ (RF−1) × produce bytes — budget in network capacity.',
      'Connection limits protect brokers; tune per tenant with quotas (Part 46).',
      'TLS overhead is real — measure p99 produce with and without SSL on representative hardware.',
    ],
    oneLiner: 'Bind with listeners; route clients with advertised.listeners; isolate inter-broker traffic and size NIC for RF replication.',
    trap: 'Setting advertised.listeners to 0.0.0.0 or pod IP — clients outside the pod network cannot connect after first metadata refresh.',
    tables: [
      {
        headers: ['Symptom', 'Likely cause', 'Check'],
        rows: [
          ['Connection refused after broker replace', 'advertised.listeners stale', 'Metadata host vs DNS/LB'],
          ['URP + high inter-broker bytes', 'NIC saturation / wrong AZ routing', 'NetworkProcessor idle, AZ traffic matrix'],
          ['SSL handshake spike', 'Cert rotation / cipher mismatch', 'Broker logs, cert expiry calendar'],
          ['Single IP connection storm', 'Missing per-IP limit', 'connection-count metrics'],
        ],
      },
    ],
  },
  {
    id: 'request-path',
    part: 35,
    title: 'Request path — Produce, Fetch, replication, HW/LEO',
    lead: 'Every record traverses distinct APIs on the leader; followers pull via replica fetcher threads. HW and LEO are different pointers — conflating them fails staff loops.',
    ascii: `PRODUCE (client → leader)                REPLICA FETCH (follower → leader)
  Client ──Produce──► Leader append          Follower ──Fetch──► Leader
       ◄──response──  (offset assigned)           ◄──records──  (catch up LEO)
       acks=all waits ISR + HW advance

LEO = last offset on a replica (end of log)
HW  = highest offset replicated to ALL ISR members (visible to consumers with read_committed rules)
     Leader:  |---- committed/HW ----|---- uncommitted tail ----| LEO
     Follower: |---- replicated -----|  (may lag behind leader LEO)`,
    body: `**CONCEPT** — **Produce**: client sends batch to partition leader; leader validates, appends to local log, updates leader LEO; response per acks setting. **Fetch (consumer)**: client reads from leader up to HW (for standard consumers) or high watermark per isolation level. **Replica fetcher**: follower broker threads continuously fetch from leader to replicate; follower LEO advances; when all ISR replicas have caught up to an offset, leader may advance HW.

**WHY** — HW defines what consumers can read (durability visibility); LEO is physical end of log on each replica. **Leader epoch** prevents truncated logs after unclean scenarios from being written inconsistently; brokers track epoch per partition. **Log truncation** occurs when leader diverges and follower must truncate to leader epoch start offset.

**EXAMPLE** — RF=3, minISR=2, acks=all: leader at offset 1000, follower-A at 1000, follower-B at 998. HW may stay at 997 until B catches up. Consumer fetch returns up to HW. If B falls out of ISR, HW may advance with remaining ISR only — understand minISR implications.

| Pointer | Scope | Meaning |
|---------|-------|---------|
| LEO | Per replica | Next append offset on that replica |
| HW | Per partition (leader view) | Max offset safe for consumers (ISR caught up) |
| Log start offset | Per partition | Retention/compaction floor |

**FAILURE** — Slow follower → HW stalls → consumer lag if consumers wait for HW (rare) but mainly acks=all produce fails. Leader crash → new leader from ISR; followers truncate to leader epoch if their log diverged. Replica fetcher thread starvation → ISR drop.

**MONITOR** — ReplicaFetcherLagMetrics, leader HW vs follower LEO gap, Produce/Fetch request queue time, leader epoch changes, LogFlushRate.

**TEMP** — Increase \`num.replica.fetchers\`; move leader off overloaded broker; throttle producers.

**PERM** — Disk IOPS for followers, network sizing, unclean=false for money paths, monitor fetcher lag alerts before ISR shrink.

**INTERVIEW** — Precisely: "LEO is per-replica log end; HW is the offset replicated across ISR for consumer visibility." Walk produce then replica fetch. Deep dive: /kafka-cluster.`,
    remember: [
      'HW ≤ LEO on every replica; consumer reads bounded by HW on leader.',
      'Followers pull via replica fetcher — Kafka does not push to followers.',
      'acks=all success requires minISR replicas in ISR and HW policy satisfied.',
      'Leader epoch guards against log divergence after failover.',
      'Replica recovery = truncate + fetch until back in ISR.',
    ],
    oneLiner: 'Produce appends on leader; followers fetch to raise LEO; HW advances when ISR catches up — never equate HW with LEO.',
    trap: 'Saying consumers read from followers for load balancing — they read from leaders only (excluding KIP-392 fetch-from-follower opt-in, not default interview answer).',
    tables: [
      {
        headers: ['acks', 'Waits for', 'Durability'],
        rows: [
          ['0', 'Leader append (no wait)', 'Lowest — loss on leader crash'],
          ['1', 'Leader persisted', 'Leader loss may lose un-replicated tail'],
          ['all', 'All ISR persisted per minISR', 'Strongest broker ack — typical money path starting point'],
        ],
      },
    ],
  },
  {
    id: 'leader-election',
    part: 36,
    title: 'Leader election — preferred, clean vs unclean, data loss',
    lead: 'Controller elects partition leaders from ISR. Unclean election trades tail data for availability — never on payment paths.',
    ascii: `Preferred leader = first replica in assignment list (broker id order)
Controller detects leader loss → elect from ISR (clean)
unclean.leader.election.enable=true → elect out-of-sync replica (DATA LOSS RISK)

acks=all + minISR=2 + RF=3 + unclean=false:
  AZ loss → often still writable (2/3 ISR)
  2 brokers lost → partition offline (preferable to silent tail loss)`,
    body: `**CONCEPT** — **Preferred leader election** (\`kafka-leader-election --election-type preferred\`) moves leadership back to the first replica in the assignment when that replica is in ISR — fixes leader imbalance after broker recovery. **Leader imbalance** (\`auto.leader.rebalance.enable\`, \`leader.imbalance.per.broker.percentage\`) triggers automatic preferred elections. **Controlled shutdown** sets broker state so controller migrates leaders gracefully before process exit.

**WHY** — Leaders concentrate CPU/disk/network; imbalance hotspots brokers. Clean election preserves committed log; unclean may promote a replica missing recent messages.

**EXAMPLE** — Broker-2 was leader for 40% of partitions; after restart, leaders stay on Broker-1/3 → skew. Run preferred election or wait for auto rebalance. Payment topic: ISR = {1,3}, broker-2 out of sync with 500 messages behind — unclean=false → partition offline until caught up or manual ops; unclean=true → promote broker-2 → **500 message tail loss**.

**FAILURE** — Flapping leader elections (controller instability, network partition). All replicas out of ISR → offline partition. Enabling unclean for "availability" → silent financial discrepancies.

**MONITOR** — LeaderElectionRate, OfflinePartitionsCount, per-broker leader count, PreferredReplicaImbalanceCount, IsrShrinksPerSec.

**TEMP** — Restore lagging follower disk/network; controlled shutdown for maintenance.

**PERM** — \`unclean.leader.election.enable=false\` (hard requirement for money); RF=3 minISR=2 rack-aware; dedicated controllers; post-incident preferred leader election runbook.

**INTERVIEW** — Lead with: "I never enable unclean leader election for money paths — offline partition is better than wrong balance." Explain acks=all + minISR interaction. /kafka-cluster for ISR details.`,
    remember: [
      'NEVER enable unclean.leader.election.enable for payment / ledger topics.',
      'Clean election = leader from ISR only.',
      'Controlled shutdown reduces unplanned election storm.',
      'Preferred leader = first replica in list when in ISR.',
      'Offline partition with unclean=false is a feature, not a bug, for durability.',
    ],
    oneLiner: 'Elect from ISR (clean); unclean sacrifices tail data — forbid on money paths; rebalance leaders after recovery.',
    trap: 'Enabling unclean election as a "temp fix" during ISR shrink — permanent data loss with no audit trail.',
    tables: [
      {
        headers: ['Scenario', 'unclean=false', 'unclean=true'],
        rows: [
          ['Only out-of-sync replicas left', 'Partition offline', 'Availability restored, tail loss'],
          ['acks=all + minISR=2, 1 AZ down', 'Usually writable', 'Unnecessary risk'],
          ['Staff interview money path', 'Correct default', 'Automatic fail'],
        ],
      },
    ],
  },
  {
    id: 'offsets',
    part: 37,
    title: 'Offsets — __consumer_offsets, commit, reset, replay',
    lead: 'Committed offsets are consumer progress pointers in an internal compacted topic — not a guarantee of exactly-once business processing.',
    ascii: `__consumer_offsets (compacted, 50 partitions default)
  key: (group, topic, partition)  →  value: offset + metadata

  poll → process → commit (manual)     auto-commit: timer-based (risky for money)
  reset: earliest | latest | seek by timestamp`,
    body: `**CONCEPT** — \`__consumer_offsets\` stores committed offsets per consumer group. **Commit flow**: consumer sends OffsetCommit to group coordinator broker; coordinator appends to \`__consumer_offsets\`. **Auto-commit** (\`enable.auto.commit=true\`) commits on interval — can commit before processing completes. **Manual commit** after side effect → at-least-once with idempotency.

**WHY** — Offset is Kafka's notion of "done"; business correctness requires idempotent handlers. **earliest** reset replays from log start (or retention floor); **latest** skips history on new group. **Offset expiration** (\`offsets.retention.minutes\`) drops idle group commits — surprise replay on rejoin.

**EXAMPLE** — Settlement group commits offset 5000 after DB UPSERT. Crash before commit → redelivery from 5000 → duplicate unless UNIQUE(payment_id). Commit failure during rebalance → CommitFailedException → reprocess or ambiguous state.

**FAILURE** — Commit before process → at-most-once loss. Process before commit → duplicates. Expired offsets → consumer starts at earliest/latest per \`auto.offset.reset\`. __consumer_offsets compaction lag → disk pressure.

**MONITOR** — records-lag-max, commit rate/latency, failed commit count, offset expiration events, __consumer_offsets size.

**TEMP** — Retry commit; static membership to reduce rebalance; pause consumption during deploy.

**PERM** — Manual commit after idempotent write; monitor expiration for long-idle groups; replay strategy with business-key dedup — /kafka-consumer, /kafka-dlq.

**INTERVIEW** — "Lag = log-end offset − committed offset. Commit defines Kafka progress, not DB correctness."`,
    remember: [
      '__consumer_offsets is a compacted internal topic — not infinite history.',
      'Manual commit after idempotent side effect for money paths.',
      'auto.offset.reset only applies when no committed offset exists.',
      'Offset expiration can bite dormant consumer groups.',
      'Replay = seek + reprocess — requires dedup downstream.',
    ],
    oneLiner: 'Offsets track consumer progress in __consumer_offsets; commit timing defines delivery semantics — pair with idempotency.',
    trap: 'Assuming committed offset means exactly-once end-to-end — duplicates still happen without idempotent consumers.',
    tables: [
      {
        headers: ['Strategy', 'Commit timing', 'Semantics'],
        rows: [
          ['Manual after process', 'After DB write', 'At-least-once + idempotency (money default)'],
          ['Auto-commit', 'Interval, may be before process', 'Duplicates or skips under failure'],
          ['Commit before process', 'Before handler', 'At-most-once — loss risk'],
        ],
      },
    ],
  },
  {
    id: 'producer-internals',
    part: 38,
    title: 'Producer internals — metadata, batching, idempotence',
    lead: 'Producer is a pipeline: partition pick → batch → send → retry. Idempotence fixes retry duplicates within a PID session — not cross-session.',
    ascii: `Metadata refresh → partitioner (key hash | sticky | custom)
RecordAccumulator batches per partition → Sender thread
In-flight requests per connection (max.in.flight.requests.per.connection)
Idempotent: PID + sequence per partition → broker dedup within session`,
    body: `**CONCEPT** — **Metadata discovery**: bootstrap brokers return cluster metadata; producer caches leaders, refreshes on NOT_LEADER. **Partition selection**: murmur2 hash of key mod partition count (default); null key → sticky round-robin. **Batching**: \`linger.ms\`, \`batch.size\` trade latency for throughput. **Compression**: producer-side (lz4, zstd, snappy) — CPU vs bandwidth. **In-flight**: pipelined requests; >1 without idempotence can reorder retries → duplicates.

**WHY** — Idempotent producer (\`enable.idempotence=true\`) assigns Producer ID (PID), monotonic sequence per partition; broker deduplicates retries. **Fencing**: transactional producer fences old PID on transaction init. Ordering with retries requires idempotence + \`max.in.flight.requests.per.connection≤5\` (Kafka default with idempotence).

**EXAMPLE** — Payment events keyed by accountId → same partition → per-account ordering. linger.ms=5, batch 64KB → 15k events/s per producer instance (workload-dependent). Network blip → retry → without idempotence duplicate offset N.

**FAILURE** — Metadata storm after broker mass restart. Buffer exhaustion when broker slow. Sequence gap → OutOfOrderSequenceException (fencing or stale producer).

**MONITOR** — record-error-rate, batch-size-avg, metadata-age, buffer-available-bytes, produce latency — /kafka-producer.

**TEMP** — Raise buffer.memory cautiously; reduce produce rate at gateway.

**PERM** — enable.idempotence=true, acks=all, proper key design; client upgrade; broker ISR health.

**INTERVIEW** — Distinguish idempotent producer (per PID) vs transactional (atomic across partitions). Full client board: /kafka-producer.`,
    remember: [
      'Idempotence dedupes broker-side retries for same PID — not application-level duplicates.',
      'max.in.flight > 1 without idempotence risks reorder on retry.',
      'Partition key determines ordering scope — hot keys cap throughput.',
      'Compression saves network, costs CPU — measure on your payload.',
      'Metadata age spikes correlate with cluster instability.',
    ],
    oneLiner: 'Batch and compress on the client; idempotent PID+seq prevents retry duplicates within a producer session.',
    trap: 'Claiming idempotent producer gives exactly-once to the database — it only covers broker retry dedup for that producer instance.',
  },
  {
    id: 'transactions',
    part: 39,
    title: 'Transactions — coordinator, EOS, external DB limits',
    lead: 'Kafka transactions atomize consume+produce+offset commit inside the broker — they do not atomize Kafka and PostgreSQL in one round trip.',
    ascii: `Transaction Coordinator (broker) + __transaction_state log
Producer: initTransactions → begin → send → sendOffsetsToTransaction → commit
Consumer: read_committed hides open txn data; read_uncommitted sees all

Kafka→Kafka EOS ✓     Kafka→PostgreSQL EOS ✗ (without outbox/idempotency)`,
    body: `**CONCEPT** — **Transaction coordinator** broker manages transaction state; **transaction log** is internal compacted topic. **Timeout** (\`transaction.timeout.ms\`) aborts hung transactions. **Zombie producer**: old producer instance tries to write after fence — FencedInstanceId / ProducerFencedException. **read_committed** consumers skip uncommitted transactional data; **read_uncommitted** sees everything.

**WHY** — EOS across multiple partitions in one produce burst. **Limitation**: external DB write is not in the same Kafka transaction — use outbox pattern or idempotent consumer for DB boundary.

**EXAMPLE** — Streams app reads input topic, writes output topic + commits offsets in one transaction — true Kafka-internal EOS. Payment service writes ledger in Postgres then produces event — **not** transactional across both; use outbox or ALO+idempotency.

**FAILURE** — Transaction timeout → abort → consumers see aborted markers. Coordinator broker down → brief txn unavailability. Zombie producer after long GC pause → fencing exception storm.

**MONITOR** — transaction-coordinator-metrics, aborted transaction rate, transaction commit latency, open transaction count.

**TEMP** — Increase transaction.timeout.ms for legitimately slow pipelines (careful).

**PERM** — Scope EOS to Kafka-internal pipelines; document DB boundary explicitly in architecture reviews.

**INTERVIEW** — "EOS is broker-scoped atomicity; money paths use ALO + idempotent ledger unless pipeline is Kafka-only." Cross-link semantics Part 27.`,
    remember: [
      'Transaction coordinator is a broker role — not every broker for every txn.',
      'read_committed is required to respect transactional produces.',
      'EOS does not span Kafka and external DB without extra design.',
      'Zombie/fencing protects against stale producer instances.',
      'transaction.timeout.ms aborts hung transactions — tune to p99 pipeline.',
    ],
    oneLiner: 'Kafka transactions EOS-wrap broker operations; external DB needs outbox or idempotency — not raw consume-transform-produce alone.',
    trap: 'Enabling transactions on payment API → Postgres without outbox and claiming exactly-once.',
  },
  {
    id: 'schema',
    part: 40,
    title: 'Schema — Registry, Avro/Protobuf, compatibility',
    lead: 'Schema Registry is the contract enforcement layer — breaking changes become production incidents at deserialization time.',
    ascii: `Producer → serialize(Avro + schema id) → Kafka
Consumer ← deserialize via Registry lookup (schema id in wire format)

Compatibility: BACKWARD (default) | FORWARD | FULL | NONE
Consumer-driven: old consumers read new data — plan field adds as optional`,
    body: `**CONCEPT** — **Avro/Protobuf/JSON Schema** with Confluent wire format (magic byte + schema id). **Schema Registry** stores versions; brokers do not enforce schema — clients do. **Compatibility modes**: BACKWARD (new schema, old reader), FORWARD (old schema, new reader), FULL (both), NONE (dangerous in prod).

**WHY** — Evolution without coordinated stop-the-world deploys. **Breaking changes**: remove field, change type, rename without alias → deserialization failures → poison messages → DLQ.

**EXAMPLE** — Add optional field \`fraudScore\` with default → BACKWARD compatible. Change \`amount\` from int to string → break consumers → need new subject/topic or dual-write migration.

**FAILURE** — Registry unavailable → serializer cache may work until new schema needed. Incompatible schema registered → producer succeeds, consumer fails.

**MONITOR** — Schema registration rate, incompatible schema attempts, deserialization error rate by subject, Registry SLA.

**TEMP** — Pin producer to last known good schema version; rollback consumer deploy.

**PERM** — CI compatibility checks; subject naming strategy; document evolution rules; DLQ for bad payloads — /kafka-dlq.

**INTERVIEW** — "Registry enforces compat at register time; runtime safety still needs consumer tolerance and DLQ."`,
    remember: [
      'BACKWARD: new schema, old consumer — most common prod default.',
      'Always add optional fields with defaults for safe evolution.',
      'Breaking change = new topic or dual-schema migration period.',
      'Schema id is in the payload — not in Kafka headers by default.',
      'Consumer-driven contract: consumers define minimum fields they need.',
    ],
    oneLiner: 'Registry + compatibility modes govern evolution; breaking schema changes need migration, not Friday deploys.',
    trap: 'Setting compatibility NONE in prod to "move fast" — guarantees consumer outages.',
    tables: [
      {
        headers: ['Change', 'BACKWARD safe?', 'Pattern'],
        rows: [
          ['Add optional field + default', 'Yes', 'Preferred evolution'],
          ['Remove field', 'No', 'New subject or major version topic'],
          ['Rename field', 'No (use alias)', 'Avro aliases or new field'],
          ['Widen type', 'Depends', 'Test in CI compat check'],
        ],
      },
    ],
  },
  {
    id: 'connect',
    part: 41,
    title: 'Kafka Connect — source/sink, workers, DLQ, EOS limits',
    lead: 'Connect is distributed ETL with offset tracking in internal topics — not a replacement for domain-aware consumers.',
    ascii: `Connect cluster (workers)
  SourceConnector → tasks → Kafka topics
  Kafka topics → tasks → SinkConnector → external system
  Offsets in connect-offsets topic; config in connect-configs; status in connect-status`,
    body: `**CONCEPT** — **Workers** run connectors; **tasks** are parallel units (max parallelism often = partition count for sink). **Source** ingests DB/JDBC/S3; **Sink** writes to S3/ES/JDBC. **Offsets** stored in \`connect-offsets\` — separate from consumer groups. **DLQ** (\`errors.tolerance=all\`, \`errors.deadletterqueue.topic.name\`) routes bad records — see /kafka-dlq.

**WHY** — Operational integration without bespoke consumers for standard pipes. **EOS limits**: Connect exactly-once sink supported for some connectors (e.g., JDBC with specific versions) — verify per connector; not universal.

**EXAMPLE** — Debezium source → \`payments.cdc\` topic → S3 sink for lake. Scale tasks to match topic partitions. Connector failure → task restarts from last offset — may duplicate without idempotent sink.

**FAILURE** — Rebalance storm on worker join; poison record blocks task without DLQ tolerance. Offset commit lag on sink → duplicates on restart.

**MONITOR** — connector-task-status, source-record-poll-rate, sink-record-send-rate, errors.deadletterqueue count, rebalance time.

**TEMP** — Pause connector; route errors to DLQ; scale workers.

**PERM** — Right task count; idempotent sink keys; error tolerance policy; compare vs custom consumer for complex logic.

**INTERVIEW** — "Connect for integration plumbing; custom consumer when business logic, ordering guarantees, or DLQ taxonomy is rich."`,
    remember: [
      'Sink task parallelism is usually bounded by topic partitions.',
      'Connect offsets ≠ consumer group offsets — different namespace.',
      'errors.tolerance=all without DLQ drops or hides failures.',
      'EOS connector support is connector-specific — verify docs.',
      'Worker failure triggers rebalance across remaining workers.',
    ],
    oneLiner: 'Connect moves data with its own offset topic; use DLQ and idempotent sinks; custom consumers for domain logic.',
    trap: 'Using Connect sink as payment ledger writer without idempotent keys — restart duplicates rows.',
  },
  {
    id: 'streams',
    part: 42,
    title: 'Kafka Streams — state, changelog, repartition, EOS',
    lead: 'Streams embeds consumer/producer with local RocksDB state — changelog topics make state fault-tolerant.',
    ascii: `app input → process → (repartition topic) → aggregate
State store ← changelog topic (compacted) for recovery
Standby replicas on other instances for fast failover (optional)`,
    body: `**CONCEPT** — **State stores** (RocksDB) hold aggregates/windows. **Changelog** topic backs store — compacted, replayed on restore. **Repartition** topic created when key changes — partition count = parallelism ceiling. **Standby** tasks replicate state for faster recovery. **IQ** (Interactive Queries) serves local store via RPC — consistency is eventual across instances. **EOS** via \`processing.guarantee=exactly_once_v2\`.

**WHY** — Stateful stream processing without external DB for every aggregate — but changelog + repartition add topic sprawl.

**EXAMPLE** — Fraud: count events per card in 5-minute window; repartition by cardId; 24 partitions → max 24 stream threads per app instance topology (workload-dependent scaling).

**FAILURE** — Changelog compaction lag → disk growth. Rebalance during restore → long rebalance. IQ on stale standby → wrong answer if queried too early.

**MONITOR** — restore-consumer-lag, state-dir disk, rebalance latency, process-latency, failed-stream-threads.

**TEMP** — Increase standby replicas; scale threads to partition count.

**PERM** — Size repartition topics upfront; capacity plan changelog retention; restrict IQ to ready state.

**INTERVIEW** — "Streams EOS is Kafka-internal; joining external DB still needs design." Compare to Flink for complex event time.`,
    remember: [
      'Repartition topic partition count caps parallelism.',
      'Changelog is source of truth for state store recovery.',
      'exactly_once_v2 covers consume-transform-produce in Streams.',
      'Standby reduces recovery time — costs CPU/disk.',
      'IQ reads local state — not global strong consistency.',
    ],
    oneLiner: 'Streams state is local RocksDB + changelog replay; repartition and standby are scaling and recovery knobs.',
    trap: 'Setting repartition topic to 1 partition — entire topology serializes.',
  },
  {
    id: 'tiered-storage',
    part: 43,
    title: 'Tiered storage — hot local, cold remote, recovery',
    lead: 'Tiered storage offloads closed segments to object storage — retention extends without linear local disk growth.',
    ascii: `Active segment → local SSD (hot writes)
Closed segments → tier (S3/GCS) per remote.log.manager config
Fetch: local cache → remote object if needed (higher latency)`,
    body: `**CONCEPT** — **Local tier** holds active segment and hot recent data. **Remote tier** stores closed segments per \`remote.storage.enable\` and retention rules. **Recovery** fetches segments from remote on broker restore or consumer read of old offsets.

**WHY** — Long retention (compliance, replay) without provisioning petabytes of broker SSD. **Cost** trade: object storage $ vs SSD $ + cross-AZ egress for remote reads.

**EXAMPLE** — 7-day hot local, 90-day total retention with tiered — consumers replaying last 2 days hit local; forensic replay at day 60 pays latency.

**FAILURE** — Remote API throttle → slow fetch → consumer lag on historical replay. Misconfigured retention → unexpected delete. Broker without local cache cold start.

**MONITOR** — remote-read-rate, local-log-size vs remote-log-size, fetch latency p99 for old offsets, tier upload failures.

**TEMP** — Pause historical replay jobs; increase local retention cache window.

**PERM** — Capacity model including remote GET costs; test recovery drills; align retention.ms with compliance.

**INTERVIEW** — "Tiered saves disk; does not remove need for partition/broker count for throughput."`,
    remember: [
      'Only closed segments tier — active segment always local.',
      'Old offset replay latency increases on remote fetch.',
      'RF still applies — remote is per-broker segment copy policy per vendor impl.',
      'Cost = storage + API + egress — model all three.',
      'Recovery drill: restore broker and verify remote segment fetch.',
    ],
    oneLiner: 'Tiered storage moves cold closed segments to object store — extends retention, adds fetch latency for old data.',
    trap: 'Assuming tiered storage removes disk alerts — local active segments still fill if ingress spikes.',
  },
  {
    id: 'reassignment',
    part: 44,
    title: 'Partition reassignment — add brokers, move, throttle',
    lead: 'Moving replicas is bandwidth-heavy — unthrottled reassignment is a common Sev2 self-inflicted wound.',
    ascii: `kafka-reassign-partitions --generate / --execute
Throttle: leader.replication.throttled.replicas per broker
Follow replication bytes during move — RF copies entire partition log`,
    body: `**CONCEPT** — **Add brokers** → generate reassignment JSON to move replicas from crowded brokers. **Move partitions** for disk balance or AZ correction. **Throttle** via \`leader.replication.throttled.replicas\` and follower throttle configs. **Remove broker** → move all replicas off first, then decommission.

**WHY** — Replication during move duplicates network/disk load on top of production traffic.

**EXAMPLE** — Add broker-7; move 200 leaders from broker-1 at 50 MB/s throttle during business hours vs 500 MB/s overnight window.

**FAILURE** — Unthrottled move → ISR shrink, produce timeout, consumer fetch delay. Wrong assignment → all RF in one AZ.

**MONITOR** — UnderReplicatedPartitions during move, replication bytes, throttle queue, disk on destination broker.

**TEMP** — Cancel reassignment (\`--cancel\`); lower throttle if ISR at risk (trade duration).

**PERM** — Maintenance windows; automated reassignment tools (Cruise Control); pre-check rack awareness.

**INTERVIEW** — "Never run naked reassignment in peak — throttle and monitor URP." /kafka-cluster.`,
    remember: [
      'Reassignment copies full partition data — not metadata-only.',
      'Always set replication throttle for prod moves.',
      'Verify rack assignment in generated JSON before execute.',
      'Cancel stuck reassignment before retrying.',
      'Adding brokers does not auto-rebalance — plan JSON or Cruise Control.',
    ],
    oneLiner: 'Reassignment moves replica bytes — throttle replication and watch URP during moves.',
    trap: 'Executing generated plan without rack verification — accidentally stack replicas in one AZ.',
  },
  {
    id: 'expand-shrink',
    part: 45,
    title: 'Expand / shrink — add, drain, decommission, replace',
    lead: 'Broker lifecycle is: add → assign replicas → drain leaders → remove — never yank a broker with sole ISR replica.',
    ascii: `ADD: broker empty → reassignment in
DRAIN: preferred election away + wait ISR clean
DECOMMISSION: verify no replicas → shutdown
REPLACE: same broker.id on new hardware (preferred) or reassignment`,
    body: `**CONCEPT** — **Add broker** increases capacity pool; requires reassignment to be useful. **Drain** moves leaders and replicas off before maintenance. **Decommission** removes broker from cluster metadata after empty. **Replace disk/broker**: preserve \`broker.id\` and \`log.dirs\` when possible for faster recovery.

**WHY** — Ordered shrink prevents offline partitions and data loss.

**EXAMPLE** — Replace failed NVMe: new node same broker.id=5, restore from replicas if log dirs lost — otherwise replicas rebuild from peers.

**FAILURE** — Decommission broker still holding only copy → offline partitions. Skip drain → leader election storm.

**MONITOR** — replica count per broker, leader count, log dirs healthy, reassignment progress.

**TEMP** — Controlled shutdown; cancel in-flight produce to draining broker (clients metadata refresh).

**PERM** — Runbooks for broker replace; automation (K8s operator, ASG); capacity headroom for rebuild bandwidth.

**INTERVIEW** — Walk add vs drain vs decommission with rack-aware checks.`,
    remember: [
      'Drain replicas before decommission — verify metric zero replicas on broker.',
      'Same broker.id speeds replacement — metadata already knows broker.',
      'Disk replace may require full replica rebuild from peers.',
      'Expansion without reassignment only adds empty capacity.',
      'Maintain RF across AZs during shrink — one broker per AZ minimum for RF=3.',
    ],
    oneLiner: 'Add brokers then reassign; shrink by draining replicas and leaders before removing the broker.',
    trap: 'Killing broker without drain during peak — mass leader election and client errors.',
  },
  {
    id: 'quotas',
    part: 46,
    title: 'Quotas — producer, consumer, request, tenant isolation',
    lead: 'Quotas enforce fair share on a shared cluster — money paths get dedicated quotas, not wildcard unlimited.',
    ascii: `user-principal or client-id quota:
  producer_byte_rate, consumer_byte_rate, request_percentage
Violations → throttle (delay) not hard disconnect (usually)`,
    body: `**CONCEPT** — **Producer/consumer byte rate quotas** cap bandwidth per client principal. **Request quota** (\`request_percentage\`) caps CPU share of request handler threads. **Noisy neighbor**: one team’s flood degrades others without quotas.

**WHY** — Multi-tenant cluster stability; chargeback alignment.

**EXAMPLE** — \`payment-producer\` quota 50 MB/s; \`analytics-batch\` 200 MB/s; breach → client-side throttle delay observable in metrics.

**FAILURE** — Quota too tight → legitimate payment throttle during peak. No quotas → analytics batch reassignment starves produce.

**MONITOR** — quota-bytes-rate, throttle-time, per-client request queue time, tenant-level bytes in.

**TEMP** — Raise quota for incident tenant after approval.

**PERM** — Quota templates per team; alert on sustained throttle; dedicate cluster for extreme isolation if needed.

**INTERVIEW** — "Quotas are tenant fairness; cluster capacity is still finite — quotas don't create disk."`,
    remember: [
      'Quotas throttle — they do not add broker capacity.',
      'Set per service principal in multi-tenant prod.',
      'consumer_byte_rate includes fetch bytes.',
      'request_percentage protects CPU — not just network.',
      'Document quota change approval for payment tenants.',
    ],
    oneLiner: 'Byte and request quotas isolate tenants — throttle overload instead of collapsing the shared cluster.',
    trap: 'Giving all clients unlimited quota in shared prod — one bad deploy takes everyone down.',
  },
  {
    id: 'backpressure',
    part: 47,
    title: 'Backpressure — producer, consumer, DB, load shed',
    lead: 'Backpressure must propagate upstream — buffering without bounds converts slow consumers into OOM producers.',
    ascii: `API ──► Producer buffer ──► Kafka ──► Consumer ──► DB pool
         ▲ max.block.ms          ▲ lag           ▲ connections
         └── rate limit          └── pause       └── circuit breaker`,
    body: `**CONCEPT** — **Producer→Kafka**: \`max.block.ms\`, buffer.memory, broker ack latency. **Kafka→Consumer**: fetch rate, max.poll.records, partition lag. **Consumer→DB**: connection pool, handler time vs \`max.poll.interval.ms\`. **Load shed**: reject at API when lag SLO breached. **RL/CB**: rate limiter at edge; circuit breaker on DB.

**WHY** — Unbounded queues hide failure until catastrophic.

**EXAMPLE** — DB 2s p99 → consumer exceeds max.poll.interval → rebalance → worse lag. Fix: async processing with pause(), or scale DB, or shed load at gateway.

**FAILURE** — BufferExhaustedException; rebalance storm; retry amplification without CB.

**MONITOR** — lag, buffer-available-bytes, pool wait time, CB open state, 429 rate at API.

**TEMP** — Pause non-critical consumers; shed analytics traffic.

**PERM** — End-to-end SLO chain; idempotent handlers; DLQ; Resilience4j-style CB on DB — /kafka-dlq.

**INTERVIEW** — Trace backpressure from DB slowness to producer — staff expects full chain.`,
    remember: [
      'Slow DB → consumer poll timeout → rebalance — not just "add consumers".',
      'Producer buffer is not infinite — max.block.ms eventually blocks app threads.',
      'Load shed at API protects Kafka and DB.',
      'Circuit breaker stops retry storms.',
      'Pause consumption per partition when handler overloaded (consumer.pause).',
    ],
    oneLiner: 'Propagate pressure upstream: DB slow → consumer stuck → lag → producer buffer → API reject — don’t infinite-buffer.',
    trap: 'Raising max.poll.interval to 30 minutes instead of fixing DB — hides stuck threads.',
  },
  {
    id: 'dr-testing',
    part: 48,
    title: 'DR testing — RPO/RTO, failover, split-brain',
    lead: 'DR without quarterly drills is wishful thinking — MM2 lag is your RPO floor.',
    ascii: `Primary region cluster ──MM2──► DR region cluster
Failover: stop primary produce → verify DR → redirect consumers
Failback: reverse replication sync → cut back`,
    body: `**CONCEPT** — **RPO**: max acceptable data loss = MM2 lag window at failover (workload-dependent). **RTO**: time to restore service — DNS, consumer deploy, offset strategy. **Drills**: scripted failover/failback. **Reconciliation**: compare counts by business key, not Kafka offset. **Split-brain**: both regions accepting writes → divergent truth.

**WHY** — RF=3 does not survive region loss — second cluster required.

**EXAMPLE** — Quarterly drill: pause primary, promote DR, run settlement idempotency checks on last hour sample, document 8-minute RTO.

**FAILURE** — Failover with active primary → duplicate processing. Offset-based seek on DR → wrong positions. Forgot Schema Registry DR.

**MONITOR** — MM2 lag, offset-sync latency, drill success metric, dual-write detectors.

**TEMP** — Manual traffic switch; read-only mode on primary.

**PERM** — Runbook automation; conflict-free keys; governance lock prevents dual produce.

**INTERVIEW** — "RPO = replication lag; failback is harder than failover — plan both." Part 16 multiregion.`,
    remember: [
      'RF ≠ region DR — MM2 or cluster linking required.',
      'Reconcile by business key, not offset.',
      'Split-brain is worse than planned outage — use traffic locks.',
      'Drills must include Schema Registry and ACL sync.',
      'Document RPO/RTO with measured lag, not aspirational SLA only.',
    ],
    oneLiner: 'DR is second cluster + measured MM2 lag; drill failover/failback and reconcile by business keys.',
    trap: 'Failing over consumers with same offsets on DR cluster — partitions differ, data diverges.',
  },
  {
    id: 'chaos',
    part: 49,
    title: 'Chaos engineering — broker, AZ, network, slow I/O',
    lead: 'Game days prove RF/minISR/unclean=false policies — not slide decks.',
    ascii: `Experiments (staging → prod small blast radius):
  kill -9 broker | isolate AZ | tc netem delay/loss
  fill disk 95% | slow consumer | partition controller quorum`,
    body: `**CONCEPT** — Inject failures: **broker kill**, **controller loss**, **AZ network partition**, **disk full**, **slow broker** (iowait), **slow consumer**, **packet loss**, **latency injection**.

**WHY** — Validates runbooks, alerts, and architecture assumptions before real incidents.

**EXAMPLE** — Staging: kill broker in AZ-a; verify acks=all still succeeds with minISR=2; measure leader election time. Prod canary: throttle one non-critical topic consumer.

**FAILURE** — Chaos in prod without blast radius → real Sev1. No hypothesis → "we broke things and learned nothing."

**MONITOR** — Experiment dashboards: URP, election rate, lag, error budget burn — abort thresholds pre-defined.

**TEMP** — Abort experiment if payment SLO breaches.

**PERM** — Automated chaos in staging each release; annual prod AZ failure exercise with executive sign-off.

**INTERVIEW** — Hypothesis format: "Given RF=3 minISR=2, AZ loss should not stop payment produce."`,
    remember: [
      'Start staging — prod only with narrow blast radius and abort criteria.',
      'Never chaos test unclean election on money topics.',
      'Measure leader election p99 during broker kill.',
      'Slow consumer chaos validates max.poll.interval tuning.',
      'Document deltas between expected and observed.',
    ],
    oneLiner: 'Chaos validates durability config — kill brokers and AZs in staging before production teaches the hard way.',
    trap: 'Running network partition chaos in prod without isolating payment traffic — self-inflicted region incident.',
  },
  {
    id: 'benchmark',
    part: 50,
    title: 'Benchmark — perf tests, baseline, soak, capacity',
    lead: 'kafka-producer-perf-test and consumer-perf-test establish hardware ceilings — not your application SLA.',
    ascii: `kafka-producer-perf-test --topic test --num-records N --record-size B --throughput -1
kafka-consumer-perf-test --topic test --messages N

Phases: baseline → load → stress → soak (24h+) → failure injection → capacity report`,
    body: `**CONCEPT** — **Baseline**: single partition, minimal replication load. **Load**: target prod MB/s. **Stress**: 2× peak until break. **Soak**: memory leak, GC, disk creep. **Failure**: kill broker during load. **Capacity**: document max sustainable MB/s per broker at p99 latency SLO.

**WHY** — Partition count and RF math need measured per-partition throughput — not blog "10 MB/s" guesses.

**EXAMPLE** — On r6i.2xlarge: producer perf 120 MB/s aggregate, acks=all RF=3 → plan 40 MB/s ingress per cluster with headroom (workload-dependent numbers — label as measured).

**FAILURE** — Benchmark without compression matching prod. Single partition test only → wrong partition count plan.

**MONITOR** — latency p99/p999, throughput, CPU, disk await, network during tests.

**TEMP** — N/A — benchmark is offline/isolated topic.

**PERM** — Quarterly retest after hardware/Kafka version change; store results in capacity wiki.

**INTERVIEW** — "I benchmark hardware first, then app path with representative payload and acks settings."`,
    remember: [
      'Match acks, compression, record size to production in tests.',
      'Soak tests find slow leaks baseline misses.',
      'Stress to failure to find knee of curve.',
      'Consumer perf test ignores your DB — measure end-to-end separately.',
      'Label all numbers as environment-specific measurements.',
    ],
    oneLiner: 'Perf-test tools measure broker/client ceilings — baseline, stress, soak, then capacity report with prod-like settings.',
    trap: 'Using acks=1 perf numbers to size acks=all payment cluster — ISR wait changes everything.',
  },
  {
    id: 'security-deep',
    part: 51,
    title: 'Security deep dive — authn/z, TLS, SASL, rotation',
    lead: 'Defense in depth: mTLS/SASL authentication, ACL authorization, audit logs, and cert rotation without downtime.',
    ascii: `Client ──TLS/SASL──► Broker listener
ACL: principal → Operation (READ/WRITE) on Resource (TOPIC, GROUP, CLUSTER)
Secrets: K8s secrets / Vault → rotation dual-trust window`,
    body: `**CONCEPT** — **Authn**: TLS client certs (mTLS), SASL/SCRAM, OAuthBearer (OIDC). **Authz**: ACLs per principal on topics, groups, cluster actions. **Multi-tenant**: separate principals per service; no shared credentials. **Audit**: authorizer logs denials and allows. **Rotation**: stagger broker cert reload and client trust stores.

**WHY** — Shared cluster = shared risk; compliance requires traceable access.

**EXAMPLE** — \`payment-producer\` SCRAM user: WRITE on \`payments.*\`; \`settlement-consumer\`: READ + GROUP READ on \`settlement-svc\`. Deny ALL for default.

**FAILURE** — Expired cert → metadata storm. Wildcard ACL temp fix persists. Principal typo → silent consume stall (authorization exception).

**MONITOR** — authentication failures, authorization failure rate, cert expiry days, ACL drift vs IaC.

**TEMP** — Never wildcard ALL in prod crisis without ticket — if unavoidable, time-bound.

**PERM** — ACL-as-code review; automated cert renewal; separate listeners for internal/external trust chains.

**INTERVIEW** — "Authentication proves identity; ACL proves entitlement — both required." Part 28 security overview.`,
    remember: [
      'ACLs are deny-by-default when authorizer enabled — explicit grants only.',
      'mTLS + SASL_SSL are complementary patterns — pick per listener.',
      'Cert rotation needs dual-trust overlap window.',
      'One principal per microservice — no shared password.',
      'Audit denials — spike may mean deploy typo not attack.',
    ],
    oneLiner: 'SASL/mTLS for authn, ACLs for authz, automated cert rotation, per-service principals — no wildcard ALL.',
    trap: 'PLAINTEXT listeners on internet-facing LB — instant compliance failure.',
    tables: [
      {
        headers: ['Mechanism', 'Use case', 'Note'],
        rows: [
          ['SASL/SCRAM', 'Service accounts', 'Store creds in Vault'],
          ['mTLS', 'Internal zero-trust', 'Rotate client certs'],
          ['OAuthBearer', 'Enterprise SSO', 'Broker OAuth callback config'],
          ['ACL', 'Topic/group isolation', 'IaC + CI review'],
        ],
      },
    ],
  },
  {
    id: 'upgrade-migrate',
    part: 52,
    title: 'Upgrade & migrate — KRaft, rolling, ZDT, rollback',
    lead: 'Version upgrades are stepped protocols — skipping inter.broker.protocol or message format steps breaks rollback.',
    ascii: `ZK ──migrate──► KRaft (dual-write metadata phase — follow vendor runbook)
Broker upgrade: controllers → brokers rolling → finalize log.message.format.version
Clients: upgrade consumer/producer libs before broker feature dependency`,
    body: `**CONCEPT** — **ZK→KRaft**: metadata migration tool, dual-phase, irreversible without planning — Kafka 4.x drops ZK. **Version upgrade**: rolling broker bounce one rack/AZ at a time. **Client upgrade**: compatibility matrix per release. **Rollback**: possible until message format finalized. **ZDT**: maintain minISR during rolling; clients retry NOT_LEADER.

**WHY** — Mixed versions exist during rolling — feature flags gate new protocol.

**EXAMPLE** — 3.5 → 3.7: upgrade brokers, set inter.broker.protocol.version stepwise, upgrade clients, then bump log.message.format.version after all brokers on new version.

**FAILURE** — Finalize format on day one → cannot rollback. Old consumer protocol on new broker only feature → consume fail.

**MONITOR** — Broker version mix dashboard, URP during roll, failed protocol negotiation metrics.

**TEMP** — Pause roll if URP > threshold; rollback last wave.

**PERM** — Canary rack; documented stepping; test in staging with production topic configs.

**INTERVIEW** — "Upgrade order: compatible clients → rolling brokers → finalize format; KRaft migration is a project not a patch Tuesday."`,
    remember: [
      'Finalize log.message.format.version only when all brokers upgraded.',
      'KRaft migration is one-way without disaster recovery plan.',
      'Controllers before or with careful ordering per runbook.',
      'Inter.broker.protocol must step through supported versions.',
      'ZDT relies on RF/minISR — never roll all replicas of a partition simultaneously.',
    ],
    oneLiner: 'Roll brokers with protocol stepping; finalize message format only at end; KRaft migration is a dedicated program.',
    trap: 'Big-bang upgrade all brokers same hour with new message format — no rollback path.',
  },
  {
    id: 'ops-automation',
    part: 53,
    title: 'Ops automation — scaling, operators, managed vs self',
    lead: 'Automate toil: broker replacement, reassignment, alert remediation — humans approve blast-radius changes.',
    ascii: `Self-managed: Cruise Control / Strimzi / Confluent Operator
Managed: MSK / Confluent Cloud — still need client design + ACL + monitoring

Autoscale: consumer on lag (not broker on CPU alone)`,
    body: `**CONCEPT** — **Autoscaling**: consumers on lag metrics (KEDA); brokers on disk/throughput forecasts — not reactive CPU alone. **Broker replacement**: ASG/operator recreates node, same broker.id. **Auto reassignment**: Cruise Control goals (disk, CPU, rack). **Alert remediation**: runbook hooks (page → throttle → reassignment ticket). **K8s operator**: Strimzi CRD manages rolling, certs, listeners. **Managed vs self**: MSK reduces patch toil; you still own client semantics and multi-AZ design.

**WHY** — Manual reassignment at 3am does not scale with partition count.

**EXAMPLE** — Strimzi Kafka CR: rack awareness via K8s topology labels; Cruise Control auto-rebalance on disk 75%. KEDA scales settlement consumers on lag > 10k per partition.

**FAILURE** — Autoscale consumers past partition count → idle pods + rebalance. Operator roll too aggressive → URP.

**MONITOR** — Operator reconcile status, Cruise Control proposal execution, autoscaler decision log.

**TEMP** — Disable auto-rebalance during incident.

**PERM** — GitOps for Kafka CR; approval workflow for CC proposals affecting payment topics.

**INTERVIEW** — "Managed Kafka removes broker patching; it does not remove partition math, idempotency, or DR."`,
    remember: [
      'Autoscaled consumers still capped by partition count.',
      'Operators automate roll — you still set RF/minISR/ACL policy.',
      'Cruise Control proposals need human approval for prod payment topics.',
      'MSK/Cloud ≠ managed application semantics.',
      'Automate broker replace with preserved broker.id where possible.',
    ],
    oneLiner: 'Automate broker lifecycle and rebalancing with operators/Cruise Control; scale consumers on lag; managed Kafka does not fix client design.',
    trap: 'HPA on consumer CPU only during DB bottleneck — scales pods into rebalance hell without clearing lag.',
  },
];
