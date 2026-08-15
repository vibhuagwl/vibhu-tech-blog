import type {CapSection} from './types';

export const SECTIONS_SYSTEMS: CapSection[] = [
  {
    id: 'microservices',
    title: 'Microservices and CAP',
    what:
      'A microservice architecture is a network of independently deployed services with separate data stores, connected by synchronous APIs and asynchronous messaging. CAP applies at every boundary: between services, between service and database, and across regions.',
    why:
      'Interviewers use microservices to test whether you reason about distributed failure domains rather than treating each service as a single-node CRUD app. Every cross-service call is a partition risk; every local database has its own consistency/availability posture.',
    how:
      'Map each service to its datastore consistency model. Identify synchronous chains (order→payment) that amplify partition sensitivity. Prefer async boundaries (events, sagas) where availability during partition matters. Use idempotency keys, correlation IDs, and outbox patterns at integration points. Do not assume “one database per service” eliminates distributed consistency problems — cross-service workflows still span partitions.',
    example:
      'Checkout: Order Service (PostgreSQL CP-ish with sync replication) calls Payment Service (strong consistency required). Inventory uses Cassandra (tunable AP). During a partition between Order and Payment, you choose: fail the order (consistency) or accept the order and reconcile payment later (availability + eventual consistency).',
    failure:
      'Cascading timeouts when one downstream service is partitioned: callers retry, thread pools exhaust, circuit breakers trip. Split deployments where half the fleet sees stale service discovery registry and routes to dead instances. Partial saga completion without compensation leaves inconsistent business state.',
    tradeoff:
      'More services = more partition surfaces. Choreography maximizes availability but complicates debugging. Orchestration centralizes control but creates a CP bottleneck. Hybrid: strong consistency inside financial core, AP at the edges (notifications, analytics).',
    tech:
      'Spring Cloud / Kubernetes for deployment; Kafka for async boundaries; gRPC/REST with retries; Resilience4j circuit breakers; distributed tracing (OpenTelemetry); service mesh (Istio) for timeout/retry policy.',
    trap:
      'Saying “microservices are AP because each service is independent.” Independence does not remove network partitions between services — it multiplies them.',
    interviewAnswer:
      'Microservices do not have a single CAP label. Each service plus its datastore has a posture; cross-service workflows create distributed consistency problems regardless of per-service isolation. During a partition I map failure domains, identify which operations must halt vs degrade, and use async boundaries, sagas, and idempotency at integration points. CAP applies at every network hop, not just the database.',
    remember: [
      'Every RPC is a partition point.',
      'Local ACID does not fix cross-service consistency.',
      'Async boundaries trade latency for partition tolerance.',
      'Saga/outbox at service edges, not inside every CRUD.',
      'Never stamp the whole architecture CP or AP.',
    ],
    oneLiner: 'Microservices multiply partition surfaces — CAP applies per boundary, not per monolith replacement.',
  },
  {
    id: 'databases',
    title: 'Database selection under CAP',
    what:
      'Databases offer tunable consistency, replication, and failure behavior. No product is permanently CP or AP — configuration (replication mode, read/write concern, consistency level) and failure scenario determine actual guarantees during a partition.',
    why:
      'Staff interviews expect you to match datastore posture to business invariant, not pick “the best database.” The same product can behave CP or AP depending on settings and what failed.',
    how:
      'For each candidate datastore: identify default replication, quorum requirements, leader election behavior, and what happens when a minority partition is isolated. Use tables to compare practical CAP interpretation with caveats. Prefer PACELC framing: latency vs consistency when no partition.',
    example:
      'Payment ledger on PostgreSQL with synchronous replication to a standby: partition isolating primary → writes fail (CP). Social feed on Cassandra with LOCAL_ONE reads: partition → stale reads possible (AP). Same company, different CAP trade-offs by domain.',
    failure:
      'Choosing AP defaults for financial data → duplicate charges or lost reservations. Choosing CP everywhere → checkout unavailable during any replica lag. Misreading “multi-master” marketing as partition-safe without conflict resolution plan.',
    tradeoff:
      'Stronger consistency = higher latency and lower availability during partition. Tunable systems (Cassandra, MongoDB) require explicit per-operation policy — defaults often wrong for your domain.',
    tech:
      'PostgreSQL, MySQL, Oracle (leader/standby or cluster); MongoDB, Cassandra, DynamoDB (tunable); Redis, Elasticsearch (replication modes); CockroachDB, Spanner (geo-distributed SQL); etcd, ZooKeeper (consensus CP).',
    trap:
      'Permanently labeling any row in the table as “CP” or “AP” without naming replication config, consistency level, and partition scenario.',
    interviewAnswer:
      'I never stamp a database CP or AP permanently. I ask: what is the replication topology, what quorum is required for writes and reads, and what happens when a minority side is partitioned? PostgreSQL with sync rep is CP during partition on the minority; Cassandra with QUORUM is CP for that operation but LOCAL_ONE is AP. Match the tunable knob to the business invariant.',
    remember: [
      'Config and operation-level — not product-level labels.',
      'Sync rep / majority quorum → CP during minority partition.',
      'Async rep / single-replica reads → AP with staleness risk.',
      'PACELC: latency vs consistency when healthy.',
      'Table caveats matter more than the label.',
    ],
    oneLiner: 'Database CAP posture is a function of replication config and consistency level — never a permanent product stamp.',
    tables: [
      {
        headers: ['Database', 'Typical replication', 'Partition behavior (caveats)', 'Practical CAP read'],
        rows: [
          [
            'PostgreSQL',
            'Streaming/async or sync standby; Patroni failover',
            'Sync rep: minority partition cannot commit (CP). Async: promoted standby may lose last writes (AP + data loss risk).',
            'CP with sync rep + quorum failover; AP with async rep',
          ],
          [
            'MySQL',
            'Async binlog replica; InnoDB Cluster / Group Replication semi-sync',
            'Group Replication needs majority for writes. Classic async replica promotion → split-brain risk without fencing.',
            'CP with GR majority; AP with async replica reads',
          ],
          [
            'Oracle',
            'Data Guard sync/async; RAC multi-node',
            'Sync Data Guard: partition blocks commit on isolated primary. RAC split-brain protected by voting disk.',
            'CP with sync Data Guard; tunable per config',
          ],
          [
            'MongoDB',
            'Replica set: primary + secondaries; optional multi-doc transactions',
            'w:majority + readConcern majority → CP for those ops. readPreference secondary → stale reads (AP).',
            'Tunable: CP with majority concerns; AP with secondary reads',
          ],
          [
            'Cassandra',
            'RF replicas, no single leader; tunable CL',
            'QUORUM/ALL need overlapping quorum → minority partition rejects writes (CP). ONE/LOCAL_ONE → accepts with staleness (AP).',
            'Tunable per CL — never permanent CP/AP',
          ],
          [
            'DynamoDB',
            'Multi-AZ replication; optional global tables',
            'Strongly consistent read needs current leader partition. Eventual read may return pre-write value. Global tables = async cross-region.',
            'CP per-key with strong read; AP with eventual + global tables',
          ],
          [
            'Redis',
            'Standalone; async replication; Sentinel or Cluster failover',
            'Async rep: master partition may accept writes both sides → split brain. Cluster minority cannot serve writes to hash slots without quorum.',
            'AP with async rep; CP-ish with Cluster quorum + min replicas',
          ],
          [
            'Elasticsearch',
            'Primary/replica shards; near-real-time indexing',
            'Write ack after primary + replica sync (wait_for_active_shards). Search may return stale until refresh. Split cluster → divergent indices.',
            'CP for indexed writes with replication; AP for search freshness',
          ],
          [
            'CockroachDB',
            'Raft per range; multi-region survival goals',
            'SURVIVE ZONE/REGION FAILURE needs quorum across zones. Minority partition cannot write (CP).',
            'CP by design for distributed SQL quorum',
          ],
          [
            'Spanner',
            'Paxos per shard; TrueTime for external consistency',
            'Quorum required for writes. Minority partition unavailable for writes. Strong global consistency when quorum intact.',
            'CP with global strong consistency; latency cost (PACELC)',
          ],
          [
            'etcd',
            'Raft consensus; linearizable reads via quorum',
            'Needs majority for writes and linearizable reads. Minority partition → unavailable (CP).',
            'CP — consensus store, not AP cache',
          ],
          [
            'ZooKeeper',
            'Zab protocol; majority quorum for writes',
            'Minority partition cannot elect leader or accept writes. Designed for coordination CP workloads.',
            'CP — coordination, not high-write AP data plane',
          ],
        ],
      },
      {
        headers: ['Workload', 'Suggested posture', 'Why'],
        rows: [
          ['Payment ledger', 'CP — sync rep or majority quorum', 'Duplicate or lost money is unacceptable'],
          ['Inventory reservation', 'CP or strong quorum', 'Over-selling is a business invariant violation'],
          ['Social feed / likes', 'AP — eventual or LOCAL_ONE', 'Stale count tolerable; availability wins'],
          ['Session cache', 'AP — Redis async rep', 'Stale session ok; partition → degrade not halt'],
          ['Service config / locks', 'CP — etcd/ZK', 'Split brain on config worse than brief outage'],
          ['Search / analytics', 'AP — ES near-real-time', 'Freshness SLA in seconds, not linearizable'],
        ],
      },
    ],
  },
  {
    id: 'kafka',
    title: 'Kafka and CAP',
    what:
      'Kafka is a distributed log: brokers hold topic partitions; each partition has one leader and RF replicas in the ISR (in-sync replica set). Producers write to leaders; consumers read from leaders. Controllers (KRaft) manage metadata and leader election.',
    why:
      'Kafka is often mislabeled “AP.” In practice, durability and availability depend on acks, min.insync.replicas, ISR size, and unclean leader election — all tunable. Interviewers test whether you know the CP moments (acks=all with insufficient ISR) vs AP moments (acks=0, unclean election).',
    how:
      'Durability path: acks=all + min.insync.replicas=2 + idempotent producer → CP for committed records (minority partition cannot ack). Availability path: acks=1 or acks=0, unclean.leader.election.enable=true → higher availability but data loss or duplicate risk. ISR shrinkage is the CP trigger: if |ISR| < min.insync.replicas, producers with acks=all fail.',
    example:
      'RF=3, min.insync.replicas=2, acks=all: broker dies, ISR still has 2 → writes continue (available + durable). Network partition isolates leader with one follower: ISR drops to 1 < minISR → producers fail until new leader elected from remaining ISR (consistency over availability for new writes).',
    failure:
      'Unclean leader election promotes out-of-ISR replica → data loss but restores availability. acks=1 acknowledges before all replicas sync → leader dies → uncommitted data lost. Consumer lag during partition does not mean Kafka is “down” — it may be a CP choice on the producer side.',
    tradeoff:
      'acks=all + minISR=2: best durability, writes fail when ISR shrinks. acks=1: lower latency, single-broker ack risk. acks=0: fire-and-forget, maximum throughput, no durability guarantee. Cross-region: separate clusters + MirrorMaker — RF does not protect against region partition.',
    tech:
      'Brokers, partitions, replicas, ISR, acks=0/1/all, min.insync.replicas, unclean.leader.election.enable, replication.factor, log.flush settings, idempotent producer, transactions (read_committed).',
    trap:
      'Saying “Kafka is AP” without mentioning acks, minISR, ISR, and unclean election. Or claiming RF=3 makes Kafka CP — RF is durability within a cluster, not cross-partition consistency semantics.',
    interviewAnswer:
      'Kafka is tunable, not permanently CP or AP. With acks=all and min.insync.replicas=2, a partition that shrinks ISR below minISR blocks producers — that is a CP choice for durability. With acks=0 or unclean leader election enabled, Kafka favors availability and accepts data loss. I align acks/minISR/unclean settings to whether lost or duplicate messages are worse than brief write unavailability.',
    remember: [
      'ISR size drives acks=all success.',
      'min.insync.replicas is the CP threshold.',
      'Unclean election = availability over consistency.',
      'acks=0/1/all is the durability ladder.',
      'Consumers read leaders only — not AP read replicas.',
    ],
    oneLiner: 'Kafka CAP posture = acks + minISR + ISR health + unclean election — never a fixed label.',
  },
  {
    id: 'redis',
    title: 'Redis and CAP',
    what:
      'Redis is an in-memory datastore supporting standalone, primary-replica async replication, Sentinel for failover, and Redis Cluster for sharded multi-master with quorum-based failover.',
    why:
      'Redis is often called AP, but Cluster mode with min-replicas and WAIT command shifts toward CP for specific operations. Split-brain during async replication is the classic interview trap.',
    how:
      'Standalone: single node — CA in CAP diagram but not fault-tolerant. Async replication: master accepts writes, replicas lag — partition can produce two writable masters (split brain) if Sentinel fails both sides. Cluster: hash slots, majority of masters required for failover; minority partition cannot commit slot migrations. WAIT N ms: block until N replicas ack (CP moment for that write).',
    example:
      'Master in AZ-a, replica in AZ-b. Partition splits them. Sentinel on AZ-b promotes replica. Master still accepts writes in AZ-a → divergent data. Clients without fencing see inconsistent reads. Fix: quorum Sentinel + CLIENT PAUSE + verified failover, or use Cluster with proper majority.',
    failure:
      'Split brain with async rep. Lost writes on hard failover. Cluster minority cannot serve writes for slots without quorum. Large-key eviction under memory pressure mistaken for partition outage. Sentinel flapping during network jitter.',
    tradeoff:
      'Async rep: low latency, AP with data loss risk on failover. WAIT/sync: higher latency, stronger durability. Cluster: horizontal scale but operational complexity. Not a replacement for CP database — cache/session use cases tolerate AP.',
    tech:
      'Redis standalone, replication (REPLICAOF), Sentinel (quorum, failover), Cluster (hash slots, gossip, failover auth), WAIT, CLIENT PAUSE, Redlock (controversial), Redis Stack.',
    trap:
      'Labeling Redis AP without distinguishing standalone vs Sentinel vs Cluster, or ignoring split-brain with async replication.',
    interviewAnswer:
      'Redis default async replication is AP-leaning: a partitioned master can keep accepting writes while a promoted replica also serves writes — split brain. Redis Cluster adds quorum-based failover — minority partition loses write ability for affected slots, a CP moment. I use Redis for cache/session where staleness is acceptable, and I never rely on Redlock alone for financial correctness without fencing.',
    remember: [
      'Async rep → split-brain risk on partition.',
      'Sentinel needs quorum to avoid dual master.',
      'Cluster minority partition → writes fail for slots.',
      'WAIT adds CP moment per write.',
      'Cache use case ≠ ledger use case.',
    ],
    oneLiner: 'Redis async replication is AP-leaning; Cluster quorum and WAIT add CP moments — mode and config matter.',
  },
  {
    id: 'dynamodb',
    title: 'DynamoDB and CAP',
    what:
      'DynamoDB is AWS managed key-value/document store with multi-AZ synchronous replication within a region, optional DynamoDB Streams, and Global Tables for async cross-region replication.',
    why:
      'DynamoDB exposes an explicit consistency knob on reads (eventual vs strongly consistent) — a clean CAP teaching example. Global Tables add cross-region AP with eventual consistency.',
    how:
      'Writes are always durable to multiple AZs within region once acknowledged. Eventually consistent reads may return stale data (AP). Strongly consistent reads cost 2× RCU and require reading from leader partition — may fail or retry if leader isolated (CP for that read). Global Tables: async replication across regions — write in us-east visible in eu-west with lag (AP cross-region). Conditional writes (PutItem with condition) provide optimistic concurrency.',
    example:
      'Wallet balance: use TransactWriteItems + strongly consistent read before debit → CP for that operation. Product catalog: eventual reads, tolerate stale price for seconds → AP. Global Table active-active: two regions accept writes to same item → last-writer-wins conflict (AP, needs application merge).',
    failure:
      'Hot partition throttling mistaken for partition outage. Strongly consistent read fails when storage node for partition leader unavailable. Global Table replication lag causes cross-region invariant violations without version vectors.',
    tradeoff:
      'Strong reads: 2× cost, higher latency, CP for that item. Eventual reads: half cost, AP staleness. Global Tables: low RTO multi-region but RPO > 0 and no cross-region linearizability.',
    tech:
      'DynamoDB tables, partitions, RCU/WCU, eventual vs strong reads, TransactWriteItems, conditional writes, DynamoDB Streams, Global Tables, DAX (cache — AP staleness).',
    trap:
      'Saying DynamoDB is AP because it descends from Dynamo paper — within-region strong reads and transactions are CP moments.',
    interviewAnswer:
      'DynamoDB is tunable per operation. Eventually consistent reads are AP — may return pre-update value. Strongly consistent reads and TransactWriteItems are CP for that item — they fail or retry rather than return stale financial state. Global Tables are AP across regions with async replication lag. I pick the consistency model per access pattern, not per product.',
    remember: [
      'Eventual read = AP; strong read = CP for that op.',
      'TransactWriteItems = atomic CP boundary.',
      'Global Tables = async cross-region AP.',
      'Hot partitions are not CAP partitions.',
      'Conditional writes for OCC, not full consensus.',
    ],
    oneLiner: 'DynamoDB: eventual reads are AP; strong reads and transactions are CP per item — Global Tables add cross-region AP.',
  },
  {
    id: 'cassandra',
    title: 'Cassandra and CAP',
    what:
      'Cassandra is a masterless wide-column store: RF copies per row across nodes, tunable consistency levels (ONE, QUORUM, ALL, LOCAL_QUORUM), and eventual repair mechanisms (hinted handoff, read repair, anti-entropy).',
    why:
      'Cassandra is the textbook tunable-CAP system. Interviewers expect you to name the CL for writes and reads separately and compute W + R > RF for strong consistency.',
    how:
      'CL=ONE on both: AP — accepts reads/writes with single replica, stale/forked data possible during partition. CL=QUORUM/LOCAL_QUORUM with RF=3: need 2 replicas — minority partition (1 node) cannot quorum → rejects ops (CP). ALL: all replicas must respond — highest consistency, lowest availability. Hinted handoff: writes to unavailable node delivered when it returns (repairs AP behavior). Read repair: fix inconsistencies on read path. Anti-entropy (nodetool repair): background Merkle tree comparison.',
    example:
      'RF=3, LOCAL_QUORUM write + LOCAL_QUORUM read: W=2, R=2, RF=3 → W+R>RF → strong per-query consistency within datacenter. Same cluster, analytics job with ONE read: AP, may see pre-repair stale data. Partition isolates 1 of 3 nodes: quorum still on 2 → writes continue; isolate 2 of 3 → minority cannot write.',
    failure:
      'Using ONE for financial counters → lost updates. Tombstone accumulation slowing reads. Multi-datacenter without LOCAL_QUORUM → cross-DC latency or consistency surprises. Never running repair → permanent divergence even after partition heals.',
    tradeoff:
      'Lower CL = higher availability + lower latency + staleness. Higher CL = CP behavior for that query. LOCAL_* limits quorum to local DC — AP across DCs by default unless EACH_QUORUM.',
    tech:
      'Consistency levels, RF, hinted handoff, read repair, nodetool repair, lightweight transactions (LWT/CAS), materialized views (async).',
    trap:
      '“Cassandra is AP” — it is tunable; QUORUM during partition is CP for that operation.',
    interviewAnswer:
      'Cassandra does not have a fixed CAP label. ONE/LOCAL_ONE is AP — single replica suffices, stale data possible. QUORUM with RF=3 needs overlapping majorities — minority partition cannot write, a CP choice. I pick CL per query: LOCAL_QUORUM for inventory, ONE for metrics. Hinted handoff and read repair restore eventual consistency after partition heals.',
    remember: [
      'CL is per operation, not per cluster.',
      'W + R > RF → strong per-query consistency.',
      'Minority partition fails QUORUM writes.',
      'Hinted handoff + repair heal AP divergence.',
      'LWT is CP but expensive — rare use.',
    ],
    oneLiner: 'Cassandra CL chooses CAP per query — QUORUM is CP; ONE is AP; repair mechanisms heal eventual divergence.',
  },
  {
    id: 'mongodb',
    title: 'MongoDB and CAP',
    what:
      'MongoDB replica set: one primary accepts writes, secondaries replicate via oplog. Drivers support write concern (w, j, wtimeout) and read concern (local, majority, linearizable) plus read preference (primary, secondary, nearest).',
    why:
      'MongoDB defaults are AP-leaning (w:1, read from primary with local concern). Majority concerns shift to CP during partition — minority primary steps down or cannot ack.',
    how:
      'Write concern majority: write must replicate to majority before ack → CP (minority partition primary rolls back or steps down). Read concern majority: reads reflect majority-committed data — no stale reads from rolled-back primary. readPreference secondary: AP — may read pre-rollback or lagging data. Stale reads: secondary lag, causal consistency session without proper read concern. Partition: old primary isolated → split brain until election timeout; writes on stale primary roll back when it rejoins.',
    example:
      'E-commerce cart: w:1, read primary — fast, AP if primary fails over with rollback risk. Order payment state: w:majority, readConcern majority, readPreference primary — CP for committed orders. Analytics: readPreference secondaryPreferred — AP stale reads acceptable.',
    failure:
      'w:1 + isolated primary → writes acknowledged then rolled back on rejoin. Secondary reads without readConcern majority → stale inventory counts. Long election timeout prolongs write outage. Multi-document transactions add overhead but do not remove replica set partition behavior.',
    tradeoff:
      'majority write+read: CP, higher latency. w:1 + secondary reads: AP, rollback and staleness risk. Causal consistency: middle ground for session-scoped ordering.',
    tech:
      'Replica set elections, writeConcern, readConcern, readPreference, oplog, change streams, sharded cluster (per-shard replica set).',
    trap:
      '“MongoDB is CP because it has a primary” — secondary reads with w:1 are AP; only majority concerns are CP during partition.',
    interviewAnswer:
      'MongoDB replica set behavior depends on write and read concern. w:majority + readConcern majority is CP — minority partition cannot commit or returns rolled-back data. w:1 with readPreference secondary is AP — accepts writes and stale reads. I never use defaults for financial data; I set majority concerns and primary read preference when correctness beats availability during partition.',
    remember: [
      'Primary is single writer — not automatically CP.',
      'w:majority = CP commit barrier.',
      'Secondary reads without majority = stale AP.',
      'Isolated primary rolls back w:1 writes.',
      'Election timeout = brief write unavailability.',
    ],
    oneLiner: 'MongoDB CAP = writeConcern + readConcern + readPreference — majority is CP; w:1 secondary reads are AP.',
  },
  {
    id: 'xa',
    title: 'Distributed transactions (2PC / 3PC / Saga / Outbox)',
    what:
      'XA two-phase commit (2PC) coordinates commit across resources with a coordinator: prepare then commit. 3PC adds pre-commit to reduce blocking. Saga and outbox patterns avoid global locks by decomposing into local transactions with compensation or async delivery.',
    why:
      '2PC is the classic CP choice: if coordinator or participant partition occurs, resources stay locked — availability sacrificed for atomicity. Modern microservices prefer saga/outbox for partition tolerance.',
    how:
      '2PC: coordinator sends prepare; all vote yes → commit; any no or timeout → abort. Partition during prepare: participants hold locks (blocking — CP, unavailable). 3PC: reduces blocking but still fragile. Saga: local commit per step + compensating transaction on failure — AP during partition (each service available), eventual consistency. Outbox: write business row + outbox row in same local DB transaction; relay publishes to Kafka — avoids dual-write but delivery is at-least-once.',
    example:
      'Transfer between two PostgreSQL instances via XA: partition during prepare → both hold row locks, transfer API times out (CP). Same transfer via saga: debit locally committed, credit fails → compensate debit — both services stayed available, money briefly inconsistent until compensation.',
    failure:
      '2PC coordinator crash with all participants in prepared state → blocking until manual intervention. Heuristic commits. Saga without idempotency → duplicate compensation. Outbox relay down → events stuck, downstream never notified.',
    tradeoff:
      '2PC/3PC: strong atomicity, poor partition availability, not recommended cross-microservice. Saga: available, complex compensation, eventual consistency. Outbox: reliable local+event atomicity, at-least-once delivery.',
    tech:
      'JTA/XA datasources, Narayana, Atomikos; 3PC rare in practice; Saga orchestration (Camunda) or choreography (Kafka); transactional outbox + Debezium relay.',
    trap:
      'Proposing 2PC across microservices for availability-critical flows — locks amplify partition outages.',
    interviewAnswer:
      '2PC is CP under partition: prepared participants block, sacrificing availability for atomicity. I avoid cross-service 2PC in microservices. Saga keeps each service available during partition with local commits and compensation — AP with eventual consistency. Outbox gives atomic local write + event intent without XA, accepting at-least-once delivery with idempotent consumers.',
    remember: [
      '2PC prepare phase holds locks — CP.',
      'Coordinator partition → blocking.',
      'Saga = available steps + compensation.',
      'Outbox = local ACID + async relay.',
      'Never XA across many microservices.',
    ],
    oneLiner: '2PC blocks for CP atomicity; Saga and outbox favor availability with eventual consistency under partition.',
  },
  {
    id: 'saga',
    title: 'Saga pattern',
    what:
      'A saga decomposes a long-running transaction into local transactions with compensating actions. Orchestration uses a central coordinator; choreography uses domain events between services.',
    why:
      'Sagas are the standard AP answer for cross-service workflows during partition: each service stays up on its side, accepting local commits even when partners are unreachable.',
    how:
      'Forward flow: Order → Payment → Inventory → Shipping. Each step commits locally then triggers next. Failure: publish compensating events (PaymentFailed → release inventory, cancel order). Orchestration: central state machine tracks saga instance — CP risk at coordinator if not replicated. Choreography: each service reacts to events — more available but harder to debug. Idempotency keys + processed_events table prevent duplicate steps. Eventual consistency: order may show “paid” before inventory confirms — UI must tolerate intermediate states.',
    example:
      'Partition between Payment and Inventory after payment reserved: Payment service committed, Inventory unreachable. Saga choice: (AP) keep payment reserved, retry inventory with backoff until partition heals; or (CP) block payment until inventory confirms — reduces availability. Compensation if inventory permanently fails: refund payment, cancel order.',
    failure:
      'Missing compensation → orphaned reservations. Duplicate event delivery without idempotency → double ship. Orchestrator partition without HA → all sagas stall. Compensating action itself fails (refund declined) → requires manual intervention queue.',
    tradeoff:
      'Orchestration: easier visibility, coordinator is CP bottleneck. Choreography: more available, distributed debugging pain. Both: eventual consistency, not ACID across services.',
    tech:
      'Kafka event choreography; Camunda/Temporal orchestration; correlationId; idempotency keys; DLQ for poison steps; saga timeout policies.',
    trap:
      'Claiming saga provides exactly-once across services — it provides eventual consistency with at-least-once delivery and idempotent/compensating steps.',
    interviewAnswer:
      'Saga trades cross-service ACID for partition tolerance. Each step commits locally — services stay available on their side during partition. Failures trigger compensations. I use choreography with Kafka for high availability, idempotency keys for duplicate events, and clear intermediate states in the UI. Orchestration when I need a visible state machine and can HA the coordinator.',
    remember: [
      'Local commit per step — AP during partition.',
      'Compensation is the rollback mechanism.',
      'Idempotency mandatory on every handler.',
      'Intermediate states are normal.',
      'Orchestrator HA or choreography for availability.',
    ],
    oneLiner: 'Saga: local commits keep services available during partition; compensation restores consistency eventually.',
  },
  {
    id: 'caching',
    title: 'Caching under CAP',
    what:
      'Caches (Redis, Memcached, CDN edge, application local cache) sit in front of authoritative stores to reduce latency. They are inherently AP-leaning: async population, TTL expiry, and partition isolation produce stale data.',
    why:
      'Cache inconsistency during partition is a classic production incident: each partition serves different cached values with no way to coordinate invalidation across the split.',
    how:
      'Cache-aside: app reads cache, on miss reads DB, writes cache — partition may populate cache with stale DB snapshot. Write-through: write DB + cache together — still AP if cache nodes partition from each other. Invalidation: pub/sub invalidation fails across partition → stale until TTL. Stale-while-revalidate: serves old value during refresh — intentional AP. Under partition: prefer serve stale (AP) vs fail request (CP) — most caches choose AP.',
    example:
      'Product price in Redis cache, authoritative in PostgreSQL. Partition isolates cache from DB writer: cache serves old price for TTL duration (AP). CP alternative: cache miss on any doubt, always read DB — higher latency, DB load, but fresh price.',
    failure:
      'Thundering herd on TTL expiry after partition heals. Cache stampede during invalidation broadcast failure. Local in-process cache diverges across JVMs with no coordination. Negative cache of “not found” hides newly created record until TTL.',
    tradeoff:
      'Short TTL: fresher data, more DB load. Long TTL: AP staleness, better availability. Invalidation: precise but partition-sensitive. Versioned cache entries: app checks version against DB on critical reads.',
    tech:
      'Redis/Memcached, Caffeine local cache, CDN cache-control headers, cache-aside vs read-through vs write-behind, Hazelcast replicated cache.',
    trap:
      'Assuming cache invalidation is reliable during partition — it is the first thing that breaks.',
    interviewAnswer:
      'Caches are AP by design. During partition, isolated cache nodes serve stale data because invalidation messages cannot cross the split. I set TTL based on staleness tolerance, use version stamps for critical reads, and accept that cache-aside under partition means each side may show different values until TTL or heal. For price or inventory, I bypass cache or use short TTL + read-through on write path.',
    remember: [
      'Cache = intentional staleness for speed.',
      'Invalidation fails across partition.',
      'TTL is the partition heal mechanism.',
      'Critical reads bypass or version-check cache.',
      'Local JVM cache diverges without coordination.',
    ],
    oneLiner: 'Caches favor AP — partition blocks invalidation; TTL and version checks bound staleness.',
  },
  {
    id: 'locks',
    title: 'Distributed locking',
    what:
      'Distributed locks coordinate exclusive access across nodes using Redis, ZooKeeper, etcd, or database advisory locks. Correctness requires fencing tokens and lease TTL to handle process pause and split-brain.',
    why:
      'Locks are CP primitives: only one holder should act on a resource. Incorrect locking under partition causes double execution — worse than brief unavailability.',
    how:
      'Redis Redlock: acquire on N independent masters — controversial, needs fencing. ZooKeeper/etcd: create ephemeral sequential node, lowest sequence holds lock — CP via consensus, minority partition cannot acquire. Lease: lock expires if holder dies — tradeoff: short lease = CP risk if holder paused; long lease = slow failover. Fencing token: monotonic token passed to storage; storage rejects stale token writes — prevents split-brain holder from corrupting data after lock lost.',
    example:
      'Payment idempotency lock on etcd: holder processes charge. Holder pauses (GC), lease expires, new holder acquires. Old holder wakes, writes without fencing → duplicate charge. With fencing: storage rejects old token, duplicate prevented (CP).',
    failure:
      'Redlock without fencing → dual holders after partition. Lease too long → availability loss waiting for expiry. Lock not released on crash → until TTL. ZK session timeout vs operation duration mismatch.',
    tradeoff:
      'ZK/etcd locks: CP, higher latency, consensus cost. Redis locks: faster, AP risk without fencing. DB advisory locks: CP but couples to DB availability.',
    tech:
      'Redis SET NX PX + Redlock; ZooKeeper ephemeral nodes; etcd leases; Curator InterProcessMutex; database pg_advisory_lock; fencing tokens in storage layer.',
    trap:
      'Using Redis SETNX as CP lock without fencing token and without acknowledging split-brain risk.',
    interviewAnswer:
      'Correct distributed locks are CP: only one holder across the cluster. ZooKeeper and etcd use consensus — minority partition cannot acquire (CP). Redis locks are fast but AP-leaning unless I add fencing tokens so storage rejects stale holders after lease expiry. I match lock TTL to operation timeout + GC pause budget and always fence writes to shared storage.',
    remember: [
      'Locks are CP — one holder only.',
      'Fencing token prevents stale holder writes.',
      'Lease TTL vs GC pause is the trap.',
      'ZK/etcd = consensus CP locks.',
      'Redis lock needs fencing for correctness.',
    ],
    oneLiner: 'Distributed locks are CP; etcd/ZK via consensus; Redis needs fencing to survive partition split-brain.',
  },
  {
    id: 'discovery',
    title: 'Service discovery',
    what:
      'Service discovery (Consul, Eureka, ZooKeeper, Kubernetes Endpoints) maintains a registry of healthy instances and routes clients to live backends.',
    why:
      'Registries are AP-leaning: during partition, different clients see different instance lists — stale registries route to dead nodes (false availability) or hide live nodes (false unavailability).',
    how:
      'Eureka: AP design — prefers availability, clients may get stale list, self-preservation keeps registering during partition. Consul: CP with Raft — leader partition needs quorum for writes; stale catalog on minority. K8s Endpoints: updated by kubelet watch — AP during apiserver partition. ZK: CP service registry — minority cannot update. Client-side: cache + refresh; server-side: load balancer polls registry.',
    example:
      'Partition between Eureka server and app instance: Eureka self-preservation keeps instance registered (AP) — clients route to dead instance, requests fail at TCP level. Consul partition: minority server cannot register new instances (CP) — clients on minority see stale catalog.',
    failure:
      'Stale registry → retry storm to dead instances. Split registry where half fleet sees old list. Health check too slow → flapping. DNS TTL in discovery layer adds extra staleness.',
    tradeoff:
      'AP registry (Eureka): higher availability of discovery, stale routes. CP registry (Consul/ZK): consistent catalog, minority partition blocks updates. K8s: eventual consistency via watch with bounded staleness.',
    tech:
      'Eureka, Consul, ZooKeeper, Kubernetes Endpoints/EndpointSlice, CoreDNS, Spring Cloud LoadBalancer, gRPC xDS.',
    trap:
      'Assuming service discovery is always consistent — it is usually AP with TTL-based healing.',
    interviewAnswer:
      'Service discovery registries are typically AP. Eureka deliberately serves stale instance lists during partition to stay available — clients may hit dead nodes. Consul uses Raft — minority partition cannot update registry (CP). I combine discovery with client-side health checks, circuit breakers, and retries with backoff so stale registry entries do not amplify outages.',
    remember: [
      'Registry staleness is normal AP behavior.',
      'Eureka self-preservation = AP stale list.',
      'Consul Raft = CP catalog updates.',
      'Combine with CB and health checks.',
      'K8s Endpoints are watch-based eventual.',
    ],
    oneLiner: 'Discovery registries are AP-leaning — stale instance lists during partition; CP options block minority updates.',
  },
  {
    id: 'dns-cdn',
    title: 'DNS and CDN',
    what:
      'DNS maps names to IPs with TTL-based caching. CDNs replicate content to edge nodes globally. Both deliberately trade consistency for latency and availability — intentional inconsistency.',
    why:
      'DNS/CDN are the clearest AP examples in production: edge caches and resolver caches serve stale content by design. CAP interviewers use them to show AP is often a business choice, not a failure.',
    how:
      'DNS: TTL 300s means resolver may return old IP after failover for minutes (AP). Low TTL improves consistency but increases load and latency. Geo-DNS routes to nearest healthy region — partition may route to wrong region until TTL expires. CDN: cache-control, s-maxage, stale-while-error — edge serves cached copy when origin partitioned (AP). Purge API propagates invalidation eventually — not instantaneous across all edges.',
    example:
      'Failover from us-east to us-west: update DNS A record. Resolvers worldwide still return us-east IP for TTL duration — users hit failed region (AP staleness). CDN serves stale product image from edge while origin down — A+ latency, intentional inconsistency.',
    failure:
      'DNS propagation delay during DR failover extends outage. CDN serves revoked content until purge completes. Geo-DNS partition routes EU users to US edge with higher latency, not wrong data. DNS cache poisoning — security, not CAP.',
    tradeoff:
      'Low DNS TTL: faster failover (more consistent), more DNS load. High TTL: AP staleness, resilient to DNS server outage. CDN long TTL: fast, stale on update. active CDN purge: consistent, slower, origin dependent.',
    tech:
      'Route 53, Cloudflare, Akamai, DNS TTL, GeoDNS, CDN cache-control, stale-while-revalidate, cache purge APIs.',
    trap:
      'Expecting instant global DNS failover — TTL means AP staleness is guaranteed.',
    interviewAnswer:
      'DNS and CDN are intentional AP systems. DNS resolvers cache records per TTL — after failover, stale IPs are served until TTL expires. CDNs serve edge copies for latency, accepting stale content until purge or TTL. This is a deliberate CAP trade: A+ latency over immediate global consistency. I plan RTO with TTL budget and use health-checked DNS + low TTL for critical failover paths.',
    remember: [
      'DNS TTL = bounded staleness window.',
      'CDN edge = intentional AP copy.',
      'Purge is eventual, not global instant.',
      'Low TTL trades consistency for DNS load.',
      'Geo-DNS adds partition-aware routing.',
    ],
    oneLiner: 'DNS and CDN are deliberate AP — TTL and edge caches trade consistency for availability and latency.',
  },
  {
    id: 'multi-region',
    title: 'Multi-region architecture',
    what:
      'Multi-region deployments span geographic regions for disaster recovery, latency, and regulatory residency. Patterns: active-passive (one write region), active-active (multi-write), sync vs async cross-region replication.',
    why:
      'Multi-region is where CAP bites hardest: cross-region links partition frequently (latency, undersea cable cuts). PACELC applies — even without partition, cross-region sync adds latency.',
    how:
      'Active-passive: primary region CP for writes, secondary async replica — partition isolates primary → failover to secondary with RPO > 0 (AP for DR availability). Active-active: both accept writes — AP, needs conflict resolution (last-writer-wins, version vectors). Sync cross-region rep: CP, write waits for remote ack — high latency. Async: AP, RPO > 0. PACELC: if partition, choose consistency (stop one region writes) or availability (both write, merge later).',
    example:
      'Global bank: active-passive PostgreSQL sync rep — CP, writes fail if both regions cannot communicate. Social network active-active Cassandra LOCAL_QUORUM per region — AP across regions, eventual via repair. DynamoDB Global Tables: active-active AP with replication lag.',
    failure:
      'Split-brain active-active without conflict resolution. Failover to async replica with hours of data loss. Sync rep cross-region latency kills write SLA. Regulatory data residency violated by automatic failover routing.',
    tradeoff:
      'Active-passive: simpler CP story, failover RTO/RPO. Active-active: lower latency globally, AP conflict complexity. Sync: CP, slow. Async: AP, data loss window.',
    tech:
      'Route 53 failover, PostgreSQL cross-region, Cassandra multi-DC, DynamoDB Global Tables, Kafka MirrorMaker 2, Spanner multi-region, S3 cross-region replication.',
    trap:
      'Active-active without stating conflict resolution strategy — implies impossible CP across regions.',
    interviewAnswer:
      'Multi-region forces explicit CAP choices. Active-passive with async DR is AP on failover — RPO > 0. Sync cross-region replication is CP — writes block if link down. Active-active is AP — both regions accept writes, I need conflict resolution and accept eventual consistency. PACELC: cross-region sync costs latency even when healthy; on partition I choose stop-one-side (CP) or both-write-merge (AP) based on business invariant.',
    remember: [
      'Cross-region link = frequent partition.',
      'Active-passive: RPO/RTO explicit.',
      'Active-active needs conflict resolution.',
      'Sync rep CP; async rep AP + RPO.',
      'PACELC: latency even when healthy.',
    ],
    oneLiner: 'Multi-region: sync rep is CP; async and active-active are AP — partition demands conflict or failover strategy.',
  },
  {
    id: 'rpo-rto',
    title: 'RPO and RTO',
    what:
      'RPO (Recovery Point Objective) is maximum acceptable data loss measured in time. RTO (Recovery Time Objective) is maximum acceptable downtime. Both directly map to replication mode and consistency choices in CAP.',
    why:
      'Interviewers link RPO/RTO to CAP: async replication gives low RTO but RPO > 0 (AP); sync replication gives RPO ≈ 0 but higher RTO risk if sync link is CP bottleneck.',
    how:
      'RPO=0 requires sync replication or quorum ack before commit — CP during partition (writes fail rather than lose data). RPO>0 with async rep: commits ack before remote copy — AP, partition may lose last N seconds. RTO: automated failover (Eureka DNS, Patroni) vs manual — affects availability metric. Multi-AZ sync: RPO≈0, RTO minutes. Cross-region async: RPO minutes-hours, RTO depends on failover automation. Backup/restore: high RTO, RPO to last backup.',
    example:
      'Payment DB: RPO=0 → sync rep + majority quorum — CP, brief write outage during partition beats data loss. Analytics pipeline: RPO=24h, RTO=4h → async S3 replication — AP, stale ok.',
    failure:
      'Claiming RPO=0 with async replication — impossible. Underestimating DNS TTL in RTO. Failover test never run — actual RTO unknown. Backup without restore test — RPO illusion.',
    tradeoff:
      'Lower RPO → more sync → CP behavior + latency. Lower RTO → automated failover → AP risk (stale DNS, split brain). Cost: sync cross-region 2× write latency.',
    tech:
      'PostgreSQL sync/async rep, MySQL GR, S3 replication, backup PITR, Route 53 health checks, runbook automation, chaos failover drills.',
    trap:
      'Confusing SLA uptime (availability) with RPO (consistency of data) — related but distinct CAP dimensions.',
    interviewAnswer:
      'RPO maps to consistency: RPO=0 needs synchronous or quorum replication — CP during partition, writes halt rather than lose data. RPO>0 accepts async replication — AP, data loss window equals replication lag. RTO maps to availability: how fast failover restores service. I state both explicitly and derive replication architecture from them, not vice versa.',
    remember: [
      'RPO=0 → sync/quorum → CP on partition.',
      'RPO>0 → async → AP + loss window.',
      'RTO = failover speed, not consistency.',
      'DNS TTL counts toward RTO.',
      'Test failover — don’t assume RTO.',
    ],
    oneLiner: 'RPO=0 demands CP sync replication; RPO>0 allows AP async — RTO is the availability recovery target.',
  },
  {
    id: 'routing',
    title: 'Read/write routing',
    what:
      'Routing policies direct reads and writes to primary (leader) or replicas: leader-only writes, replica reads, sticky sessions, read-your-own-writes (RYOW), and quorum reads.',
    why:
      'Routing is how applications implement CAP in practice: sending reads to replicas is AP (stale); forcing leader reads is CP (higher load, partition-sensitive).',
    how:
      'Write routing: always leader/primary — CP for writes. Read routing: leader → CP, consistent. Replica read → AP, lagging secondary. Sticky session to primary after write → RYOW without global consistency. Quorum read (Cassandra W+R>RF) → CP for that query. Load balancer health check removes partitioned nodes — routing adapts to partition side.',
    example:
      'User updates profile (write primary), immediately reads profile: route read to primary (RYOW, CP for session). Feed timeline: route to nearest replica (AP, 5s stale ok). Inventory check before ship: quorum read (CP).',
    failure:
      'Replica read after write shows old value — user confusion. Sticky routing to failed primary until health check catches. Global load balancer routes to partitioned region. Connection pool holds connections to isolated replica.',
    tradeoff:
      'All reads to primary: CP, primary overload. Replica reads: AP scale, staleness. RYOW sticky: middle ground, session-scoped CP.',
    tech:
      'PostgreSQL read replicas + proxy (PgBouncer, RDS proxy), MongoDB readPreference, Cassandra CL per query, MySQL Router, proxySQL, custom routing in app layer.',
    trap:
      'readPreference secondaryPreferred for financial balance — AP staleness on money.',
    interviewAnswer:
      'Read/write routing implements CAP per request. Writes go to leader — CP. Reads to replicas are AP — accept replication lag. For read-your-own-writes I sticky-route session reads to primary after write. For inventory or balance I use quorum or primary reads — CP. Routing policy is per operation, not per application.',
    remember: [
      'Leader write = CP path.',
      'Replica read = AP staleness.',
      'RYOW = sticky to primary after write.',
      'Quorum read = CP for that query.',
      'Route per operation, not globally.',
    ],
    oneLiner: 'Routing chooses CAP per request — replica reads AP, leader/quorum reads CP, RYOW sticky to primary.',
  },
  {
    id: 'api',
    title: 'API design under CAP',
    what:
      'API patterns that manage distributed consistency: idempotency keys, ETags, If-Match headers, optimistic concurrency control (OCC), conditional updates, and explicit consistency hints.',
    why:
      'APIs are the contract where CAP trade-offs become visible to clients. Retries, concurrent updates, and partition timeouts all surface at the API layer.',
    how:
      'Idempotency-Key header: duplicate POST with same key returns same result — safe AP retries. ETag + If-Match: client sends version; server rejects stale update with 412 — CP rejection over silent overwrite. OCC: read version, write if version matches — fails on conflict (CP). Conditional writes (DynamoDB, HTTP): atomically check state. Consistency hint: ?consistent=true routes to primary read — client chooses CAP per call.',
    example:
      'PUT /account/{id} with If-Match: "v5" — if partition caused client stale read v4, server returns 412 Precondition Failed (CP) instead of overwriting newer v5 (AP lost update).',
    failure:
      'Missing idempotency → duplicate payment on retry. No ETag → lost update under concurrent writers. 412 without client retry logic → user sees error. Long timeout masks partition — client retries amplify load.',
    tradeoff:
      'Strict If-Match: CP, more 409/412 errors. Last-write-wins: AP, simpler client, data loss risk. Idempotency store: small CP overhead for safe retries.',
    tech:
      'HTTP ETag/If-Match/If-None-Match, Idempotency-Key (Stripe pattern), DynamoDB conditional expressions, PostgreSQL xmin, RFC 7232.',
    trap:
      'Idempotency key without durable idempotency store — lost on service restart, duplicates return.',
    interviewAnswer:
      'APIs expose CAP choices. Idempotency keys make AP retries safe. ETags and If-Match implement OCC — server rejects stale writes (CP) rather than overwrite. I return 412 on conflict and let client refresh. For reads I offer consistency parameter or separate endpoints: /balance vs /balance?consistent=true.',
    remember: [
      'Idempotency-Key enables safe AP retries.',
      'ETag + If-Match = OCC CP rejection.',
      '412 Precondition Failed = consistency enforced.',
      'Client chooses consistency per read call.',
      'Durable idempotency store required.',
    ],
    oneLiner: 'APIs surface CAP: idempotency for safe retries (AP), ETag/If-Match for OCC rejection (CP).',
  },
  {
    id: 'idempotency',
    title: 'Idempotency',
    what:
      'An operation is idempotent if multiple identical requests produce the same effect as one. Idempotency keys let clients safely retry POSTs during timeout without duplicate side effects.',
    why:
      'During partition, requests timeout and clients retry — without idempotency, retries create duplicate payments, orders, or messages. Idempotency is the bridge between AP retries and CP correctness.',
    how:
      'Client sends Idempotency-Key (UUID) with payment POST. Server: check idempotency store; if key exists return stored response; else process, store result, return. Store must be durable (same DB as business or CP store). TTL on keys (24h). Partition scenario: client times out, retries — second request hits idempotency store, returns original result without double charge. Timeout retry without key → duplicate (AP failure).',
    example:
      'Payment timeout retry: POST /charge Idempotency-Key: abc-123. First request committed but response lost in partition. Retry with same key → server finds abc-123 in store, returns 200 with original charge_id — no duplicate (CP outcome via idempotent AP retries).',
    failure:
      'Idempotency store only in memory → restart loses keys, duplicate on retry. Different keys on retry → intentional duplicate. Store slower than processing → race allows double execution. Key TTL too short → old retry duplicates.',
    tradeoff:
      'Durable idempotency store: CP overhead, safe retries. No idempotency: simpler, duplicate risk on any timeout. At-least-once delivery + idempotency ≈ exactly-once effect.',
    tech:
      'Stripe Idempotency-Key, PostgreSQL idempotency table, Redis SET NX with TTL (weaker), Kafka idempotent producer + consumer dedup.',
    trap:
      'Saying idempotency gives exactly-once — it gives at-least-once delivery with duplicate suppression at effect boundary.',
    interviewAnswer:
      'Payment timeout retry is the classic case. Client retries on timeout; without idempotency key, duplicate charge. With durable idempotency key stored in the same transaction as the charge, retry returns original result — CP correctness despite AP network retries. I use UUID keys, 24h TTL, and store response body for replay.',
    remember: [
      'Timeout → retry is normal AP behavior.',
      'Idempotency key + durable store = safe retry.',
      'Same key → same response, no double effect.',
      'Store in same DB transaction as business op.',
      'Not exactly-once — effect-level dedup.',
    ],
    oneLiner: 'Idempotency keys turn AP timeout retries into CP-safe effects — payment retry without duplicate charge.',
  },
  {
    id: 'exactly-once',
    title: 'Exactly-once semantics',
    what:
      'Delivery semantics: at-most-once (fire and forget, may lose), at-least-once (retry, may duplicate), exactly-once (each message processed once). True exactly-once end-to-end is impossible in distributed systems — practical exactly-once is idempotent at-least-once.',
    why:
      'Interviewers test whether you know the impossibility result and the practical composition: transactional outbox + idempotent consumer + dedup store ≈ exactly-once effect.',
    how:
      'At-most-once: acks=0, no retry — AP, data loss. At-least-once: retry on failure — AP, duplicates. Kafka idempotent producer: exactly-once per partition sequence within session. Kafka transactions: atomic write multiple partitions — exactly-once between Kafka topics (not to external DB without outbox). Practical exactly-once: outbox pattern (DB + event atomic) + consumer idempotency key + processed_events table. Partition: duplicate delivery likely — idempotency is mandatory.',
    example:
      'Order event to payment: Kafka at-least-once delivery. Payment consumer checks processed_events(orderId, eventType) — skip if seen. Charge uses idempotency key. Effect: exactly-once payment despite AP message delivery.',
    failure:
      'Claiming Kafka transactions give exactly-once to database without outbox. Idempotency store not transactional with effect. Consumer crash after effect before ack → redelivery, needs idempotency. EOS across regions impossible without shared coordination.',
    tradeoff:
      'At-most-once: simple, data loss. At-least-once + idempotency: production standard. True EOS: impossible globally; bounded to single transactional boundary.',
    tech:
      'Kafka idempotent producer, transactions, read_committed, outbox, processed_events dedup, Flink exactly-once state.',
    trap:
      '“We use Kafka exactly-once” without scoping to Kafka-to-Kafka and mentioning external side effects need outbox/idempotency.',
    interviewAnswer:
      'True exactly-once end-to-end is not achievable in distributed systems. I implement at-least-once delivery with idempotent consumers and durable dedup stores — exactly-once effect. Kafka EOS covers producer-to-Kafka-to-consumer within one cluster; crossing to a database requires outbox or idempotency keys. During partition, duplicates increase — idempotency is non-optional.',
    remember: [
      'End-to-end EOS impossible — effect-level dedup.',
      'At-least-once + idempotency = practical EOS.',
      'Kafka EOS scoped to Kafka pipeline.',
      'Outbox for DB + event atomicity.',
      'Partition increases duplicate deliveries.',
    ],
    oneLiner: 'Exactly-once is impossible globally — at-least-once plus idempotency achieves exactly-once effect.',
  },
  {
    id: 'failure-handling',
    title: 'Failure handling (timeout, retry, CB)',
    what:
      'Resilience patterns: timeouts bound partition wait, retries recover transient failures, exponential backoff with jitter spreads load, circuit breakers stop calling failed deps, bulkheads isolate failure domains.',
    why:
      'Retries during partition amplify outages — the classic AP trap. Every retry policy is an implicit CAP choice: aggressive retry favors perceived availability; fail-fast favors consistency and protects shared resources.',
    how:
      'Timeout: shorter than client SLA — fail before thread exhaustion. Retry: only idempotent ops; max attempts + backoff + jitter. Circuit breaker: open after failure threshold, fail fast (CP — stop calling partition). Half-open probe. Bulkhead: separate thread pools per dependency — partition in Payment does not exhaust Order pool. Retry storm during partition: 1000 clients × 5 retries = 5000 calls to isolated node — bulkhead + CB limits amplification.',
    example:
      'Partition to Payment service: without CB, Order service retries 3× per request, thread pool full, Order API down too (retry amplified partition). With CB: after 5 failures, open circuit — Order returns degraded response (AP) or fails fast (CP) without killing Order.',
    failure:
      'Retry without idempotency → duplicates. No timeout → hung threads. CB too aggressive → slow recovery flapping. Shared thread pool → bulkhead failure. Jitter missing → synchronized retry thundering herd.',
    tradeoff:
      'Aggressive retry: AP appearance, amplifies partition. Fail-fast + CB: CP, faster error to user, protects system. Degraded mode: AP partial response.',
    tech:
      'Resilience4j, Istio outlier detection, gRPC deadline, AWS SDK retry mode, Hystrix bulkhead (legacy), retry-after headers.',
    trap:
      'Retrying non-idempotent POST on timeout without idempotency key — duplicates during partition recovery.',
    interviewAnswer:
      'Retries during partition amplify outages — each retry hits the still-isolated node. I use timeouts shorter than SLA, retry only idempotent operations with exponential backoff and jitter, circuit breakers to fail fast after threshold, and bulkheads to contain blast radius. Retry policy is a CAP lever: aggressive retry looks available but can collapse the caller; CB fail-fast is CP protection.',
    remember: [
      'Retries amplify partition outages.',
      'Idempotent ops only for retry.',
      'Backoff + jitter prevents thundering herd.',
      'Circuit breaker = fail-fast CP protection.',
      'Bulkhead isolates failure domains.',
    ],
    oneLiner: 'Retries amplify partition failures — timeout, backoff, jitter, CB, and bulkhead bound the blast radius.',
  },
  {
    id: 'observability',
    title: 'Observability for CAP behavior',
    what:
      'Metrics, logs, and traces that reveal consistency vs availability trade-offs in production: replication lag, quorum failures, leader elections, stale-read rates, consumer lag, ISR shrinkage, and circuit breaker state.',
    why:
      'You cannot operate CAP trade-offs you cannot see. Observability distinguishes “AP stale read” from “service down” and triggers correct response (refresh vs failover).',
    how:
      'Replication lag (PostgreSQL pg_stat_replication, MongoDB secondary lag) → stale read risk. Quorum failure metrics (Cassandra write timeout CL=QUORUM) → CP rejection. Leader elections (Kafka, MongoDB, etcd) → brief CP unavailability. ISR shrinkage (Kafka |ISR| < minISR) → producer CP block. Consumer lag → processing delay not necessarily CAP partition. Stale-read metric: compare replica timestamp vs primary on sample. CB open rate → partition or dependency failure. Trace span shows retry amplification.',
    example:
      'Alert: kafka_isr_shrink_rate high + |ISR| < min.insync.replicas → CP mode, producers failing — not “Kafka down” but durability gate. Action: restore brokers, not restart producers. Versus: high consumer lag with healthy ISR → AP lag, scale consumers.',
    failure:
      'Monitoring only uptime misses stale reads. No lag metric → AP incident invisible until user reports wrong balance. Election storm after partition heal undetected. Retry count not traced → miss amplification.',
    tradeoff:
      'More CAP metrics: better ops, instrumentation cost. Sampling stale-read checks: overhead vs coverage. Alert fatigue if ISR flaps during broker restart confused with partition.',
    tech:
      'Prometheus + Grafana, Kafka JMX / kafka_exporter, PostgreSQL pg_stat_replication, MongoDB serverStatus, etcd metrics, OpenTelemetry traces, Resilience4j metrics.',
    trap:
      'Consumer lag alert treated as availability outage when it is processing backlog — different from write unavailability due to CP quorum failure.',
    interviewAnswer:
      'I monitor lag, quorum failures, elections, and stale-read rates — not just uptime. Kafka ISR below minISR means CP durability gate, not cluster down. Replication lag predicts AP stale reads. CB open rate signals partition to dependency. Traces show retry amplification. Correct metric drives correct fix: scale consumers for lag, restore quorum for CP blocks.',
    remember: [
      'Lag ≠ outage — know which lag metric.',
      'ISR shrink = CP producer block.',
      'Replication lag = AP stale read risk.',
      'Election metrics = brief CP windows.',
      'CB open = partition or dependency fail.',
    ],
    oneLiner: 'Observe lag, quorum fails, elections, and stale reads — not just uptime — to diagnose CAP behavior.',
  },
];
