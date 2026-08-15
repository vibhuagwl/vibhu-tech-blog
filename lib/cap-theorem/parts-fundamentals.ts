import type {CapSection} from './types';

export const SECTIONS_FUND: CapSection[] = [
  {
    id: 'fundamentals',
    title: 'CAP Theorem Fundamentals',
    what:
      'The CAP theorem (Brewer, 2000; formally proved by Gilbert and Lynch, 2002) states that a distributed data store cannot simultaneously provide all three of: Consistency (every read returns the most recent write or an error), Availability (every request to a non-failing node receives a non-error response), and Partition tolerance (the system continues operating despite arbitrary message loss or delay between nodes). In practice, network partitions are inevitable in distributed systems, so the real theorem is: during a partition you must choose between C and A.',
    why:
      'Distributed systems span racks, AZs, regions, and WAN links. Messages can be delayed, dropped, or reordered. Without a formal trade-off framework, teams over-promise "always consistent AND always available" and ship architectures that fail in production during cable cuts, DNS failures, or asymmetric routing. CAP gives interviewers and architects a shared vocabulary for what breaks first when the network lies.',
    how:
      'Start every CAP discussion by defining C, A, and P in the distributed-systems sense (not SLA uptime or ACID). Assume P is mandatory for any multi-node deployment. Ask: "When nodes cannot talk, do we reject/wait (C) or respond with possibly stale data (A)?" Map that choice to product requirements: financial ledger vs social feed. Cite Brewer for intuition and Gilbert/Lynch for the impossibility proof under asynchronous networks.',
    example: `PHONE BANK ANALOGY (Brewer's original intuition)
  Central operator connects you to the correct branch.
  Partition: phone lines between branches cut.
  C choice: "Sorry, I cannot confirm your balance — call back when lines restore."
  A choice: "Your balance is $500" (local branch ledger, may be stale).

BANK BRANCHES (technical mapping)
  Node A (NYC) and Node B (London) replicate account balance.
  Client writes $100 debit on A; partition before replication.
  C: B rejects reads until A and B reconcile (or returns error).
  A: B serves last known balance — client sees inconsistent state.

WHO & WHAT CAP DOES NOT SAY
  Proposed: Eric Brewer, PODC keynote 2000.
  Proved: Seth Gilbert & Nancy Lynch, "Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services" (2002).
  CAP does NOT say: pick any two of three at design time.
  CAP does NOT say: you can opt out of partitions in the cloud.
  CAP does NOT say: CAP C equals ACID C or SQL "consistency."
  CAP does NOT rank systems as "better" — it exposes forced trade-offs.`,
    failure:
      'Treating CAP as a product label ("we are CP") without naming partition behavior, consistency level, and failure modes. Confusing CAP availability with 99.99% SLA. Designing single-region systems as if partitions never happen, then blaming "the network" when split-brain corrupts data.',
    tradeoff:
      'You do not "balance" C, A, and P on a slider. P is a fact of distributed deployments. The trade-off is operational and product-level: strong guarantees vs uninterrupted service during isolation. Hybrid systems choose per operation (read-your-writes vs stale reads) or per subsystem (CP metadata, AP cache).',
    tech:
      'Java/Spring microservices: Eureka + Ribbon over multiple AZs = partition-tolerant by default. JDBC to single Postgres primary is CA within one node; add read replica across AZ and you are in CAP territory. Feign timeouts are partition detectors — they force a C or A decision (fail vs retry/circuit-break).',
    trap:
      'Memorizing "CA / CP / AP" triangles without explaining partition behavior. Saying "we use Kafka so we are CP" without discussing acks, min.insync.replicas, and consumer lag.',
    interviewAnswer:
      'CAP says that when a network partition occurs, a distributed system cannot be both fully consistent and fully available. Consistency here means linearizability — all nodes agree on a single total order of operations. Availability means every non-failed node responds successfully to every request. Partition tolerance means the system continues despite lost or delayed messages between nodes. Because partitions happen in real distributed systems, the meaningful choice is C vs A during a partition — not "pick any two" at design time. I would map this to the business: payment authorization leans CP; product catalog leans AP with conflict resolution.',
    remember: [
      'Brewer 2000, Gilbert/Lynch 2002 — partition forces C vs A',
      'CAP C ≈ linearizability, not ACID C',
      'CAP A = every non-failing node responds, not SLA uptime',
      'P is not optional in multi-node / multi-AZ systems',
      'CAP is about behavior during partition, not normal operation',
    ],
    oneLiner:
      'During a partition you cannot have both linearizable consistency and full availability — P is mandatory in real distributed systems.',
    tables: [
      {
        headers: ['Letter', 'CAP meaning', 'Common confusion'],
        rows: [
          ['C', 'Linearizability / single-copy illusion', 'ACID C, "strong typing," schema validity'],
          ['A', 'Every non-failing node returns success', '99.99% uptime SLA, low latency'],
          ['P', 'Operates despite network split', '"Optional feature" you can turn off'],
        ],
      },
      {
        headers: ['CAP does say', 'CAP does not say'],
        rows: [
          ['C and A conflict when P occurs', 'Choose any two at design time'],
          ['Applies to distributed shared-data systems', 'Single-node DB is "CA" in the distributed sense'],
          ['Forces explicit partition policy', 'One label (CP/AP) fits a product forever'],
        ],
      },
    ],
  },
  {
    id: 'consistency',
    title: 'Consistency (CAP C)',
    what:
      'In CAP, Consistency means linearizability (also called atomic consistency): every operation appears to take effect instantaneously at some point between its invocation and response, and all nodes agree on a single total order — as if there were one copy of the data. A read must return the latest successful write or an error; it cannot return stale data.',
    why:
      'Financial balances, inventory counts, seat reservations, and idempotency keys require clients to trust that "what I wrote is what I read" across nodes. Without CAP-C semantics, double-spend, overselling, and lost updates appear under partition or replication lag. Interviewers test whether you distinguish this from weaker models (eventual, causal).',
    how:
      'Achieve CAP-C via single leader + quorum writes (majority ack before ack to client), distributed consensus (Raft/Paxos), or synchronous replication (wait for replica ACK). On partition, CP systems reject or block minority-side operations. Measure with linearizability checkers (Jepsen) and explicit client contracts (read-after-write routing to leader).',
    example: `WRITE NODE A, READ NODE B (partition before replication)

  t0: balance = $1000 (replicated on A and B)
  t1: client writes debit $200 on Node A → balance $800 (committed on A)
  t2: network partition — A and B cannot communicate
  t3: client reads balance on Node B

  CAP-C behavior: B returns ERROR or blocks (503/timeout) — does not return $1000 or $800
                 until partition heals and order is reconciled.
  CAP-A behavior: B returns $1000 (stale) — available but inconsistent.

  JAVA / SPRING
  @Transactional on single DB primary → linearizable within that DB.
  Read from async replica in another AZ without sync → NOT CAP-C for that read path.
  Spring @Cacheable on inventory count + write-through to leader only → C for writes;
  cache miss on stale replica → violation unless invalidated or routed to leader.`,
    failure:
      'Calling a system "consistent" because it uses a SQL database, while reads hit lagging replicas. Assuming "strong consistency" from Spring @Transactional across microservices (it is local to one DB). Ignoring session stickiness: user writes to A, reads from B, sees own write disappear.',
    tradeoff:
      'Strong C increases latency (quorum/leader round-trips) and reduces availability during partition (minority partition unavailable). Weaker models (eventual, read-your-writes) improve A and performance at the cost of visible staleness and merge logic.',
    tech:
      'Linearizable: ZooKeeper/etcd/Consul writes, Postgres sync replica (synchronous_commit=on), Redis WAIT/strong configs. Not automatically linearizable: Cassandra ONE, DynamoDB eventual, Kafka consumer at-least-once without idempotent producer. Java: use leader-aware routing (write + critical read to primary).',
    trap:
      'Equating CAP C with ACID C ("valid constraints"). Saying "eventual consistency is weak CAP C" — eventual is a post-partition convergence goal, not CAP C during partition.',
    interviewAnswer:
      'CAP consistency is linearizability: every read sees the latest write or the system errors. It is stronger than eventual consistency and different from ACID consistency, which is about transaction invariants. Example: client writes on Node A; before replication completes, a partition isolates B. CAP-C requires B to reject the read, not return the old value. In microservices I enforce this with leader reads, quorum writes, or fencing tokens — not by assuming @Transactional spans services.',
    remember: [
      'CAP C = linearizability / single-copy semantics',
      'ACID C = invariants within a transaction — different C',
      'Eventual = converge later; not CAP-C during partition',
      'Read from lagging replica breaks CAP-C for that read',
      'Jepsen is the hammer for claimed linearizability',
    ],
    oneLiner:
      'CAP C means every read returns the latest write or an error — linearizability, not ACID rules or eventual convergence.',
    tables: [
      {
        headers: ['Term', 'Meaning', 'During partition'],
        rows: [
          ['CAP C (linearizable)', 'Single total order; fresh read or error', 'Minority side rejects/stales blocked'],
          ['ACID C', 'DB constraints hold per transaction', 'Local to one node/txn scope'],
          ['Eventual consistency', 'Replicas converge if no new writes', 'Stale reads allowed (AP)'],
          ['Causal consistency', 'Preserves cause-effect order', 'Weaker than linearizable'],
        ],
      },
    ],
  },
  {
    id: 'availability',
    title: 'Availability (CAP A)',
    what:
      'In CAP, Availability means every request received by a non-failing node must eventually receive a non-error response — without the guarantee that the response reflects the latest write. A node cannot refuse requests solely because it cannot reach peers. This is a liveness property of the API, not a monthly uptime percentage.',
    why:
      'User-facing services (feeds, search, recommendations, status pages) prioritize responding over being perfectly fresh. During partitions, unavailable systems strand users on error pages while a minority partition might still serve stale but useful data. Staff interviews probe whether you conflate "five nines" SLAs with CAP availability.',
    how:
      'AP designs: local reads/writes on each partition, version vectors or LWW for conflicts, async replication, hinted handoff. Degrade gracefully: serve cached/stale data with explicit staleness headers. Health checks should not mark entire region down when only cross-region link fails if local serving is still valid.',
    example: `CAP A vs SLA UPTIME (different axes)

  SLA 99.99%: allowed ~52 min downtime/year — can be single-node maintenance.
  CAP A:       every non-crashed replica must respond NOW, even if stale.

  PARTITION SCENARIO
  Region US and EU lose connectivity. Both still have live nodes.

  CAP-A: US serves writes/reads locally; EU serves locally — both return 200.
         Clients may see divergent state until merge.
  CAP-C: minority side returns 503/unavailable for writes (and often reads)
         until quorum/leader is reachable.

  LATENCY TRAP
  Slow response (5s) can still be CAP-available if it eventually returns success.
  CAP does not require low latency — only non-error completion.`,
    failure:
      'Declaring "highly available" based on SLA while minority partition returns 503 for all writes. Confusing circuit-breaker OPEN (fail fast) with CAP unavailability — if the service returns a structured fallback, it may still be "available" in a degraded sense; empty 503 is not.',
    tradeoff:
      'Maximizing CAP A during partition accepts stale reads, write conflicts, and complex merge semantics. Product must tolerate duplicate likes, temporary inventory drift, or explicit "conflict resolution" UX.',
    tech:
      'Cassandra/Dynamo-style tunable CL (when configured for availability), Couchbase, Riak. CDN edge caches are AP for static content. Spring: return cached ProductDTO with X-Stale-Data: true instead of 503 when origin partition detected. Hystrix/Resilience4j fallbacks are availability patterns — with semantic cost.',
    trap:
      'Saying "we need 99.99% so we choose A" — SLA and CAP A are orthogonal. Claiming a single-leader DB is CAP-A during partition when all writes fail on non-leader nodes.',
    interviewAnswer:
      'CAP availability means every non-failing node in the cluster must respond successfully to every request, without requiring that response to be the latest write. It is not the same as an uptime SLA or low latency. During a partition, an AP system keeps serving from local replicas — possibly stale — while a CP system may reject requests on the minority side to preserve consistency. I choose AP when the business tolerates staleness and can merge conflicts; I choose CP when wrong answers are worse than no answer.',
    remember: [
      'CAP A = non-error response from every live node',
      'SLA uptime ≠ CAP availability',
      'Latency/performance are outside CAP\'s formal A',
      'Degraded/stale response can still be CAP-available',
      '503 on minority partition = CP leaning, not AP',
    ],
    oneLiner:
      'CAP A means every non-failing node always returns a successful response — not guaranteed fresh, and not the same as an uptime SLA.',
    tables: [
      {
        headers: ['Concept', 'Measures', 'Partition example'],
        rows: [
          ['CAP A', 'Liveness: non-error response', 'Stale balance returned vs error'],
          ['SLA uptime', '% time service reachable', 'Monthly roll-up; ignores staleness'],
          ['Latency SLO', 'Response time p99', 'Slow but successful = still CAP-A'],
          ['Degradation', 'Reduced quality fallback', 'Cache hit during origin partition'],
        ],
      },
    ],
  },
  {
    id: 'partition',
    title: 'Partition Tolerance (P)',
    what:
      'Partition tolerance means the system continues to operate despite arbitrary network failures: dropped packets, delayed messages, split links between datacenters, or complete loss of connectivity between subsets of nodes. Partitions are indistinguishable from slow nodes — timeouts are the practical detector.',
    why:
      'Any system with more than one node over an unreliable network will experience partitions. Switches fail, AZs isolate, BGP routes flap, GC pauses look like dead peers. Declaring "we do not tolerate partitions" really means single-node — which does not scale and still fails on host loss without redundancy that reintroduces P.',
    how:
      'Design assuming partitions happen: use timeouts, retries with idempotency, quorum, fencing tokens, generation numbers, and explicit split-brain prevention. Test with chaos (iptables DROP, Toxiproxy, Jepsen). Document behavior: which side stays writable, what minority clients see.',
    example: `NETWORK PARTITION TYPES

  Symmetric:  [A] | [B]  — both sides know they are split (if heartbeats work one-way)
  Asymmetric: A can send to B, B cannot reply to A (common with firewall/routing)
  Split-brain: two partitions both believe they are primary → dual writes

  TIMEOUT = PARTITION (pragmatic view)
  Node A waits for B ACK; timeout fires.
  A cannot know: B is down, B is slow, or network is cut.
  → Must act as if partition occurred (choose C or A).

  JAVA MICROSERVICE
  Service X → Service Y call times out after 2s.
  Circuit opens; X serves cached data (A) or fails order (C).
  Eureka may still show Y as UP — network partition ≠ process crash.`,
    failure:
      'Infinite retries without idempotency during partition cause duplicate charges. Split-brain with two writable primaries corrupts data. Ignoring asymmetric partitions where health checks pass but replication fails.',
    tradeoff:
      'Accepting P is mandatory for distributed systems. The trade-off is not "enable P" but how you behave when P occurs: stall (C) or diverge (A). Single-node avoids network partition between replicas but sacrifices fault tolerance and scale.',
    tech:
      'Kubernetes across AZs, multi-region RDS, Kafka cluster spanning racks — all partition-tolerant deployments. etcd uses Raft election timeout to detect partition. Redis Sentinel/Cluster split-brain scenarios. Istio mTLS does not prevent partitions.',
    trap:
      'Saying "we run in one AZ so no partition" — host failure + failover still creates brief split-brain windows. Believing synchronous RPC eliminates partitions.',
    interviewAnswer:
      'Partition tolerance means the system continues operating when messages between nodes are lost or delayed. In practice, any distributed system over a real network must tolerate partitions — you cannot opt out in multi-node deployments. Timeouts are how we detect partitions: when an ACK does not arrive, we cannot distinguish slow from split. The CAP theorem says that once we are in that situation, we cannot have both linearizable consistency and full availability. I design for P with quorums, leader election, and explicit minority-side behavior.',
    remember: [
      'P is mandatory for multi-node distributed systems',
      'Timeout ≈ partition — cannot distinguish slow from cut',
      'Asymmetric partitions are common and nasty',
      'Split-brain = two writable leaders — prevent with quorum/fencing',
      'Single-node avoids replica partition, not fault tolerance',
    ],
    oneLiner:
      'Partition tolerance is continuing to operate when the network splits — unavoidable in real distributed systems; timeouts are how we detect it.',
    tables: [
      {
        headers: ['Partition type', 'Symptom', 'Risk'],
        rows: [
          ['Link cut', 'No cross-AZ traffic', 'Forced C vs A choice'],
          ['Asymmetric', 'One-way reachability', 'False healthy checks'],
          ['Split-brain', 'Dual primaries', 'Divergent writes / corruption'],
          ['Slow network', 'Late ACKs', 'False partition detection'],
        ],
      },
    ],
  },
  {
    id: 'tradeoff',
    title: 'Core C vs A Trade-off During Partition',
    what:
      'When a network partition divides the cluster, the system cannot simultaneously guarantee linearizable consistency and full availability. It must either reject or block operations that cannot be verified against a quorum/leader (Consistency), or allow operations on isolated nodes with potentially stale or divergent state (Availability).',
    why:
      'This is the heart of CAP for interviews and architecture reviews. Every multi-region payment, inventory, or session system will face this moment. Without an explicit policy, engineers default to undefined behavior — split-brain, duplicate orders, or mysterious 500s.',
    how:
      'Document partition playbook before production: (1) detect via timeout/quorum loss, (2) elect or freeze minority, (3) client routing rules, (4) reconciliation after heal. Encode in code: if (!quorum) return 503 (C) vs allowLocalWrite() (A). Use CRDTs, version vectors, or last-writer-wins for AP merge.',
    example: `REJECT/WAIT (C) vs RESPOND INDEPENDENTLY (A)

  Cluster: 3 nodes {A, B, C}, quorum = 2
  Partition: {A,B} | {C}

  CP (C during partition):
    {A,B} majority → can commit writes (2/3)
    {C} minority → REJECTS writes (cannot reach quorum)
    Reads on C: error or stale + fenced

        [A,B] ~~~partition~~~ [C]
          |                      X  write → 503 UNAVAILABLE
          +-- write OK (quorum)

  AP (A during partition):
    Both sides ACCEPT writes locally
    {A,B} and {C} diverge → merge on heal (LWW, vector clock)

        [A,B] ~~~partition~~~ [C]
          |                      |
       write OK               write OK
       (stale to C)           (stale to A,B)

  WAIT variant of C: block until timeout rather than immediate 503`,
    failure:
      'Flip-flopping policies per incident. CP cluster without fencing lets minority resume writes after heal. AP system without conflict detection loses updates silently.',
    tradeoff:
      'C protects correctness; A protects liveness. Money and inventory → C. Social graph and analytics → A. Many systems are hybrid: CP for metadata (leader election), AP for content.',
    tech:
      'CP: etcd, ZK, Consul — minority not writable. AP: Cassandra with LOCAL_QUORUM + conflict resolution. Spring: separate read models — Command service CP on ledger DB; Query service AP from Elasticsearch.',
    trap:
      'Claiming "we do both" during partition — mathematically impossible for shared mutable state under CAP definitions. Hand-waving with "it depends on config" without specifying partition behavior.',
    interviewAnswer:
      'During a partition, I must choose between consistency and availability. If I require linearizability, the minority partition cannot commit writes and should reject or block requests that cannot reach a quorum — that sacrifices availability on that side. If I require availability, both sides continue serving, accepting that reads and writes may be stale or conflicting until the partition heals. There is no third option for shared mutable state under the CAP definitions.',
    remember: [
      'Partition → forced choice: C or A (not both)',
      'CP: quorum/leader only; minority rejects',
      'AP: both sides serve; merge later',
      'Hybrid = different subsystems, not same datastore',
      'Write the partition playbook before prod',
    ],
    oneLiner:
      'When the network splits, you either reject unverified operations (C) or serve locally with possible staleness (A) — not both.',
  },
  {
    id: 'pick-two',
    title: 'Not "Pick Any Two"',
    what:
      'The popular phrase "pick two of three" from CAP is misleading. You do not choose to "leave out" partition tolerance in a distributed system — if you deploy multiple nodes over a network, P is a fact. The actual choice is: when a partition occurs, prioritize C or A. In normal (non-partition) operation, systems can achieve both C and A.',
    why:
      'Misunderstanding "pick two" leads to absurd claims: "we chose CA so we do not have partitions," or labeling a product permanently "CP" without context. Senior interviews reward correcting the myth and reframing around partition behavior.',
    how:
      'Teach the corrected model: (1) single node → CAP trivially satisfied until you distribute; (2) no partition → C and A together; (3) partition → C XOR A for shared state. Use PACELC for the no-partition latency trade-off. Never stamp products — describe behavior under partition with config.',
    example: `MYTH vs REALITY

  MYTH (triangle pick-any-two):
    "Our system is CP — we dropped Availability."
    → Implies A is gone always. Wrong.

  REALITY:
    Normal:     [C + A + P] all fine — no trade-off active
    Partition:  [P] forced → choose [C] or [A]

  ANALOGY
    You cannot choose to ignore gravity (P).
    On a stable road you walk fine (C+A).
    On a broken bridge you choose: wait for repair (C) or cross carefully with risk (A).

  INTERVIEW CORRECTION SCRIPT
    "We don't pick two at design time. We assume partitions will happen.
     When they do, we favor consistency for ledger writes and
     availability for read replicas serving catalog data."`,
    failure:
      'Architecture diagrams showing "CA database" for a multi-AZ cluster. Vendor slides claiming "CP product" without partition scenario. Engineers optimizing only for happy path.',
    tradeoff:
      'Clarifying the myth shifts design effort to partition policies and per-operation consistency levels — where real trade-offs live — instead of checkbox labeling.',
    tech:
      'Postgres single instance: CAP not meaningfully tested. Postgres with sync replica across AZ: partition → primary or replica must block (C) or risk split (misconfig). Kafka: not a CAP triangle pick — depends on producer acks and consumer offset policy.',
    trap:
      'Repeating "pick two" confidently in Staff interviews without correction. Drawing CA as a third equal vertex for distributed systems.',
    interviewAnswer:
      'The "pick two" framing is a common simplification that is wrong for distributed systems. Partition tolerance is not optional when you have multiple nodes on a network — partitions will happen. CAP really says: during a partition, you cannot have both linearizable consistency and full availability. In normal operation you can have both. So the design choice is not "drop P" but "when partitioned, do we fail requests or serve stale data?" I also use PACELC for the latency vs consistency trade-off when the network is healthy.',
    remember: [
      '"Pick two" is a myth — P is not optional',
      'No partition → C and A together',
      'Partition → C vs A only',
      'Products are not permanently CP or AP',
      'PACELC covers the no-partition case',
    ],
    oneLiner:
      'You do not pick two of three — partitions are inevitable; during a partition you choose C or A.',
  },
  {
    id: 'normal-vs-partition',
    title: 'Normal Operation vs Partition',
    what:
      'Under normal network conditions (no partition), a well-designed distributed system can provide both consistency and availability — clients get timely, correct responses. The CAP impossibility applies only during a partition. The operational mistake is optimizing only for the happy path and having no defined behavior when the network splits.',
    why:
      'Production incidents happen during partitions, not during slides. Teams that conflate steady-state performance with CAP confuse interviewers and ship undefined minority behavior. Explicit normal vs partition modes are how SRE runbooks and client SDKs stay coherent.',
    how:
      'Define two modes in design docs: STEADY (quorum healthy, sync replication caught up) and PARTITION (quorum lost or split). Specify client behavior: retry, failover region, read-only mode. Monitor replication lag; lag is a pre-partition warning, not just metrics wallpaper.',
    example: `STEADY STATE vs PARTITION

  STEADY (no partition):
    3-node cluster, all reachable
    Writes: quorum ack → C satisfied
    Reads:  any replica with sync → C + A both OK
    User experience: fast AND correct

  PARTITION:
    {A,B} | {C}
    CAP forces trade-off on shared mutable state
    Cannot have B read A's latest write AND C serving writes`,
    failure:
      'Testing only on LAN with 0% packet loss. Replication lag of minutes treated as "normal" until AZ cut exposes stale reads. No runbook for "we are in partition mode."',
    tradeoff:
      'Invest in partition behavior (chaos tests, explicit errors, merge logic) even though partitions are rare — impact is catastrophic. Steady-state optimization (caching, read replicas) must not violate stated C unless labeled AP for that path.',
    tech:
      'Steady: Eureka full registry, Feign calls succeed, DB replication < 100ms. Partition: Eureka split registry, Hystrix opens, DB promotes replica — behavior must be pre-defined. Chaos Monkey / Litmus validate transition.',
    trap:
      'Saying "CAP says we cannot have C and A" without qualifying "during partition." Using this section to claim CAP is irrelevant because partitions are rare.',
    interviewAnswer:
      'CAP only bites during a network partition. In normal operation, there is no reason you cannot have both consistency and availability — quorums respond, replication is caught up, clients get correct answers quickly. When a partition happens, that is when you must choose: reject operations that cannot be linearized, or keep serving possibly stale data. I design and test both modes explicitly.',
    remember: [
      'C + A together when no partition',
      'CAP trade-off activates only during partition',
      'Replication lag is a gray zone — treat seriously',
      'Chaos test the partition mode, not just load test steady state',
      'Runbooks must name minority-side behavior',
    ],
    oneLiner:
      'Without a partition you can have C and A; CAP only forces the trade-off when the network splits.',
    tables: [
      {
        headers: ['State', 'Network', 'C + A possible?', 'Engineering focus'],
        rows: [
          ['Normal', 'All nodes reachable', 'Yes (for shared state)', 'Latency, throughput, lag'],
          ['Partition', 'Split subsets', 'No (both fully)', 'Quorum, reject vs stale, merge'],
          ['Degraded', 'High lag, no cut', 'Risky — "almost partition"', 'Monitor lag, fence reads'],
        ],
      },
      {
        headers: ['Scenario', 'Consistency', 'Availability', 'Notes'],
        rows: [
          ['Single AZ, healthy quorum', 'Strong', 'Full', 'CAP trade-off dormant'],
          ['Cross-region sync repl', 'Strong if sync', 'Full if quorum', 'Latency cost'],
          ['AZ partition, CP config', 'Preserved', 'Minority down', 'Expected CP behavior'],
          ['AZ partition, AP config', 'Violated temporarily', 'Both sides up', 'Merge on heal'],
        ],
      },
    ],
  },
  {
    id: 'cp',
    title: 'CP Systems (Consistency + Partition Tolerance)',
    what:
      'CP systems prioritize linearizable consistency during a partition: they may reject, block, or return errors on nodes that cannot participate in a quorum or reach the leader, rather than serve potentially stale or divergent data. Availability is sacrificed on the minority or non-quorum side until the partition heals.',
    why:
      'Use when incorrect data is worse than no data: distributed locks, leader election, metadata stores, financial invariants, inventory decrements that must not oversell. Kubernetes, Kafka controllers, and payment ledgers depend on CP coordination layers.',
    how:
      'Implement with consensus (Raft/Paxos), majority quorums, fencing tokens, and leader-only writes. Clients must handle 503/unavailable and retry with backoff. On heal: single leader re-established; unreplicated minority writes discarded.',
    example: `CP BEHAVIOR (3-node, quorum=2)

  Partition {A,B} | {C}

  Leader on A; writes need A+B ack
  C isolated: all writes FAIL at C
  Reads at C: fail or strictly stale + read-only

  ZOOKEEPER / ETCD / CONSUL (coordination — typically CP-leaning)
  Used for: service discovery metadata, distributed locks, config leadership
  Session timeout → ephemeral nodes disappear; minority cannot elect leader

  MONGO / REDIS / SQL CAVEAT (config-dependent — do not permanently label)
  MongoDB: default replica set needs majority for primary election;
           writeConcern majority → CP-leaning; w:1 + read from secondary → not
  Redis:   single primary + Sentinel; minority cannot promote without quorum
  SQL:     sync replication across AZ → primary blocks if replica ack lost (C)`,
    failure:
      'CP system without proper quorum: split-brain dual primaries. Clients that do not retry on 503 wedge user flows. Long partition → extended outage on minority — product must accept that cost.',
    tradeoff:
      'Safety over liveness on minority side. Higher latency from quorum round-trips. Operational complexity: careful deploy of consensus members (odd count, spread across AZs).',
    tech:
      'Java: Curator on ZooKeeper for locks; Spring Cloud with Consul CP KV; etcd for K8s. JDBC to Postgres with synchronous_commit and no writes to non-primary. Kafka: min.insync.replicas=2, acks=all for CP-leaning produce path.',
    trap:
      'Labeling "Mongo is CP" or "Redis is CP" without write concern / replication / failover config. Ignoring that CP only applies during partition — system is available on quorum side.',
    interviewAnswer:
      'A CP system keeps linearizable consistency during a partition by refusing operations that cannot reach a quorum or leader. The minority partition becomes unavailable for writes — and often for strongly consistent reads — rather than risk split-brain. I use CP coordination for locks, leader election, and metadata. For databases, the same product can be CP or AP depending on replication and read routing — I describe behavior under partition, not a permanent label.',
    remember: [
      'CP: quorum/leader commits; minority rejects',
      'Coordination services (ZK/etcd) are CP-leaning',
      'Mongo/Redis/SQL: behavior depends on config',
      'CP sacrifices A on minority, not globally forever',
      'Fencing tokens prevent stale leader writes',
    ],
    oneLiner:
      'CP systems preserve linearizability during a partition by rejecting operations that cannot reach a quorum — minority side goes unavailable.',
    tables: [
      {
        headers: ['System / pattern', 'CP-leaning when…', 'Not CP when…'],
        rows: [
          ['ZooKeeper/etcd/Consul', 'Leader + quorum for writes', 'N/A — coordination layer'],
          ['MongoDB replica set', 'writeConcern majority, read primary', 'w:1, read secondaries'],
          ['Redis + Sentinel', 'Quorum failover, single master', 'Split-brain misconfig'],
          ['Postgres', 'sync_commit, writes to primary only', 'Async replica reads'],
          ['Kafka producer', 'acks=all, min.insync.replicas met', 'acks=1, unclean leader election'],
        ],
      },
    ],
  },
  {
    id: 'ap',
    title: 'AP Systems (Availability + Partition Tolerance)',
    what:
      'AP systems prioritize remaining available during a partition: every non-failing node continues to accept reads and writes, even if replicas have diverged. Consistency is sacrificed — clients may see stale data, and conflicting writes require merge strategies (LWW, vector clocks, CRDTs) after heal.',
    why:
      'High write throughput, geographic distribution, and tolerance for temporary inconsistency: shopping carts, social feeds, DNS, sensor telemetry, session preferences. Downtime or mass 503s cost more than showing a slightly stale like count.',
    how:
      'Use asynchronous replication, tunable consistency levels, hinted handoff, read repair, and anti-entropy. Clients use version vectors; servers resolve conflicts on read or with background merge. Expose staleness in APIs where honesty matters.',
    example: `AP BEHAVIOR

  Partition {A,B} | {C}
  All nodes accept writes independently

  t1: write x=1 on A side
  t2: write x=2 on C side
  t3: partition heals → merge (LWW, or keep both with vector clock)

  CASSANDRA / DYNAMO-STYLE (config-dependent)
  Replication factor 3, CL ONE: write/read single replica → high A, weak C
  CL QUORUM: stronger but may reject if quorum unavailable → moves toward CP
  Hinted handoff: write to coordinator even if replica down

  CONFLICT EXAMPLE (shopping cart)
  User adds item on phone (partition A); removes on laptop (partition B)
  Heal: union merge vs LWW — product decision, not database default`,
    failure:
      'LWW silently drops updates (last timestamp wins — clock skew). No idempotency → duplicate events on retry. "Available" nodes serve garbage without version metadata — clients cannot detect staleness.',
    tradeoff:
      'Liveness and partition survival vs application complexity for merge, UX for conflicts, and weaker guarantees for reads. Cannot do global strong inventory without external coordination.',
    tech:
      'Cassandra, DynamoDB (eventual default), Couchbase, Riak. Java: event-sourced cart with CRDT or saga compensation. Spring Cache + local fallback during upstream partition. CDN as extreme AP for static assets.',
    trap:
      'Claiming Cassandra is "always AP" — QUORUM + SERIAL can block. Ignoring conflict resolution — AP is not "ignore consistency forever," it is "eventual with merge."',
    interviewAnswer:
      'AP systems stay available during a partition by allowing each side to serve reads and writes locally, accepting that replicas may diverge. When the partition heals, we reconcile with version vectors, CRDTs, or last-writer-wins depending on business rules. I use AP for workloads where staleness is acceptable and conflicts are rare or mergeable. Tunable consistency — like Cassandra quorum — lets us strengthen guarantees when needed, which blurs simple CP/AP labels.',
    remember: [
      'AP: all sides serve; consistency sacrificed during partition',
      'Merge strategy is a product decision',
      'Tunable CL changes C vs A — not fixed label',
      'LWW is dangerous with clock skew',
      'Idempotency + versions are mandatory',
    ],
    oneLiner:
      'AP systems keep every live node responding during a partition, accepting stale data and merge work when the network heals.',
    tables: [
      {
        headers: ['Consistency level (Dynamo/Cassandra style)', 'Behavior', 'CAP lean'],
        rows: [
          ['ONE', 'Single replica', 'AP — highest availability'],
          ['QUORUM', 'Majority R+W overlap', 'Balanced — may reject if no quorum'],
          ['ALL', 'All replicas', 'CP-leaning — partition blocks'],
          ['LOCAL_QUORUM', 'Per-datacenter quorum', 'AP within DC, eventual across DC'],
        ],
      },
    ],
  },
  {
    id: 'ca',
    title: 'CA Systems (Consistency + Availability)',
    what:
      'In the CAP formulation, CA means consistency and availability without partition tolerance — effectively a single-node or tightly coupled system where network partitions between replicas do not exist. Classic RDBMS on one server is CA until you replicate across an unreliable network, which reintroduces P and the C vs A choice.',
    why:
      'Clarifying CA prevents the myth "SQL is always CA" for distributed deployments. Single-node Postgres/MySQL is strongly consistent and available until the disk catches fire — then you add replication and enter CAP. Interviewers use CA to test whether you understand scope.',
    how:
      'Recognize CA as single-site, single-primary, no cross-network replica semantics — or as an abstraction that ignores distribution. When scaling out, explicitly transition to CP or AP per use case. Do not claim cloud multi-AZ SQL is "CA."',
    example: `CA IN PRACTICE

  TRUE CA (CAP sense): one MySQL instance, one JVM heap cache
    No network between replicas → no partition between data copies
    Crash = total outage — not a CAP partition, just failure

  NOT CA (common myth):
    "PostgreSQL is CA"
    → Multi-AZ synchronous replica: partition → primary blocks (C) or split risk
    → Async replica reads: A for reads, not linearizable

  RDBMS ON ONE NODE
    ACID transactions + always available until hardware fails
    Scale-up limit; HA via failover introduces P`,
    failure:
      'Marketing "CA database" for geo-replicated SQL. Assuming local @Transactional consistency spans microservices. Single node CA becomes SPoF — no partition tolerance means no geographic resilience.',
    tradeoff:
      'CA simplicity vs scale and fault tolerance. You gain conceptual ease and strong local ACID; you lose horizontal write scale and survive only single-node failure modes without reintroducing distribution.',
    tech:
      'Dev laptop H2/Postgres, single-node Oracle. Spring monolith + one DB — CA within deployment boundary. Sharded multi-master across regions is NOT CA.',
    trap:
      '"SQL = CA, NoSQL = AP" — false dichotomy. Any replicated SQL over WAN is partition-tolerant with config-dependent C/A behavior.',
    interviewAnswer:
      'CA in CAP means consistency and availability when there is no partition between nodes — practically a single node or system that does not replicate over an unreliable network. A standalone Postgres instance is CA until you add cross-AZ replicas; then partitions are possible and you must choose CP or AP behavior via sync vs async replication and read routing. SQL is not inherently CA in the cloud.',
    remember: [
      'CA = no network partition between replicas',
      'Single-node RDBMS is the classic CA example',
      'Replicated SQL is not CA in the distributed CAP sense',
      'SQL vs NoSQL does not map to CA vs AP',
      'Failover HA reintroduces partition scenarios',
    ],
    oneLiner:
      'CA only applies without replication over an unreliable network — single-node databases, not geo-distributed SQL.',
    tables: [
      {
        headers: ['Deployment', 'CAP classification', 'Why'],
        rows: [
          ['Single Postgres instance', 'CA (no replica partition)', 'One copy of data'],
          ['Postgres sync replica other AZ', 'P applies → CP or AP', 'Network between nodes'],
          ['Postgres async read replica', 'AP-leaning reads', 'Stale replica reads'],
          ['Sharded Cockroach/Spanner', 'P applies — engineered trade-offs', 'Distributed by design'],
        ],
      },
    ],
  },
  {
    id: 'triangle',
    title: 'CAP Triangle (Misleading Diagram)',
    what:
      'The equilateral triangle with C, A, and P at vertices — "pick any two" — is the most common CAP visualization. It is pedagogically catchy but misleading: it implies three equal choices at design time and that CA, CP, and AP are permanent product categories. Better model: partition occurs → forced edge on C vs A; P is the environment, not a vertex you select.',
    why:
      'Interviewers at Staff level expect you to critique the triangle and replace it with the partition-forces-trade-off diagram. Teams that internalize the triangle make wrong procurement and architecture decisions.',
    how:
      'Draw triangle only to debunk it. Prefer: [Normal: C+A] → [Partition detected] → branch {CP path | AP path}. Link to PACELC for latency when no partition. Teach engineers the corrected narrative in onboarding.',
    example: `MISLEADING TRIANGLE

              C
             / \\
            /   \\
           /     \\
          A-------P
    "Pick CP, CA, or AP"  ← WRONG for distributed systems

  BETTER MODEL (partition-forces C/A)

    [ Steady state: C + A OK ]

    Network partition detected
            |
      +-----+-----+
      |           |
   Choose C     Choose A
   (reject/     (serve
    wait)        stale)
      |           |
   CP behavior  AP behavior

  WHY TRIANGLE MISLEADS
  - P is not optional — not a "pick"
  - CA vertex implies distributed CA exists
  - Products slide around with config
  - Normal operation ignored`,
    failure:
      'Architecture review slides with only the triangle. Vendor mapping Mongo→CP, Cassandra→AP without caveats. Engineers cannot explain behavior during partition after using triangle memorization.',
    tradeoff:
      'Triangle is fast to teach, costly if left uncorrected. Spend extra minute in interviews correcting it — signals Staff-level depth.',
    tech:
      'Replace triangle wiki page with partition state machine. Align labels with PACELC in design templates.',
    trap:
      'Drawing triangle in interview without immediate qualification. Saying "we are at the CP edge of the triangle" as final answer.',
    interviewAnswer:
      'The CAP triangle is a useful mnemonic but misleading. You do not pick two of three — partition tolerance is mandatory for distributed systems, and in normal operation you can have both consistency and availability. The real insight is that during a partition you choose between consistency and availability. I prefer a state diagram: steady state versus partition mode, with explicit minority behavior — and PACELC for latency versus consistency when the network is healthy.',
    remember: [
      'Triangle implies false "pick two"',
      'P is environment, not a design choice',
      'CA vertex misleads for distributed SQL',
      'Prefer partition-forces-C/A diagram',
      'Correct the triangle in Staff interviews',
    ],
    oneLiner:
      'The CAP triangle is misleading — partitions are inevitable; during a split you choose C or A, not a permanent corner of a triangle.',
  },
  {
    id: 'pacelc',
    title: 'PACELC (Beyond CAP)',
    what:
      'PACELC (Daniel Abadi, 2012) extends CAP: if there is a Partition (P), choose between Availability (A) and Consistency (C); Else (E), choose between Latency (L) and Consistency (C). CAP ignores the everyday trade-off when the network is healthy: sync cross-region replication gives C at the cost of L.',
    why:
      'CAP alone leaves interview answers incomplete — most user complaints are latency, not partitions. Multi-region Java services face EL/EC constantly: replicate sync to EU (C, slow) vs async (fast, stale). PACELC names the trade-off CAP omits.',
    how:
      'Classify systems: PA/EL (Dynamo, Cassandra — available + low latency, eventual), PC/EC (Bigtable-style — consistent on partition, eventual when no partition is rare), PC/EL (rare — Spanner/Cockroach approximate with TrueTime). Per operation: critical path PC/EC, feed PA/EL.',
    example: `PACELC DECISION TREE

  Is there a Partition?
    YES → A or C  (same as CAP)
    NO  → L or C

  ELSE (no partition) examples:

  CROSS-REGION SYNC (choose C over L)
    US write → wait EU replica ACK → +100ms, linearizable across regions

  CROSS-REGION ASYNC (choose L over C)
    US write → ack locally → replicate later → EU reads stale ms–sec

  JAVA MICROSERVICE
    OrderService → PaymentService sync HTTP (L cost, strong per-request flow)
    OrderService → Analytics Kafka fire-and-forget (EL — low latency, eventual)`,
    failure:
      'Assuming PACELC labels are fixed per database. Ignoring EL trade-off until p99 latency SLO breach. Using PACELC without defining partition detection (same timeout problem as CAP).',
    tradeoff:
      'PAC/EL maximizes uptime and speed; PCC/EC maximizes correctness. Real platforms mix: PA/EL for catalog, PC/EC for wallet balance.',
    tech:
      'Cassandra: PA/EL default. Spanner/Cockroach: PC/EC with clock synchronization. DynamoDB global tables: EL across regions. Spring @Async + eventual projection vs synchronous @Transactional chain.',
    trap:
      'Replacing CAP with PACELC without still explaining partition behavior. Claiming "we are PACELC PC/EL" without workload examples.',
    interviewAnswer:
      'PACELC reminds us that even without partitions we trade latency for consistency. If partitioned, we choose A or C — as CAP says. If not partitioned, we still choose: synchronous replication for consistency or asynchronous for lower latency. Most geo-distributed systems are PA/EL for many workloads and PC/EC for money. I pick per operation, not per entire stack.',
    remember: [
      'P → A vs C (CAP)',
      'Else → L vs C (daily trade-off)',
      'Most geo systems are PA/EL for many paths',
      'Financial paths often PC/EC',
      'PACELC complements — does not replace — CAP',
    ],
    oneLiner:
      'PACELC: if Partition then A vs C; else Latency vs Consistency — CAP plus the everyday replication lag trade-off.',
    tables: [
      {
        headers: ['PACELC class', 'Partition behavior', 'Normal behavior', 'Examples (typical)'],
        rows: [
          ['PA/EL', 'Prefer A', 'Prefer low L (eventual)', 'Dynamo-style, Cassandra'],
          ['PC/EC', 'Prefer C', 'Eventual acceptable', 'Some wide-column defaults'],
          ['PC/EL', 'Prefer C', 'Prefer low L', 'Spanner-like (engineered)'],
          ['PA/EC', 'Prefer A', 'Prefer C', 'Less common hybrid'],
        ],
      },
      {
        headers: ['Scenario', 'CAP / PACELC choice', 'Outcome'],
        rows: [
          ['Same-AZ quorum read/write', 'E → can have C + low L', 'Best case'],
          ['Cross-region sync repl', 'E → C over L', 'High latency writes'],
          ['Cross-region async repl', 'E → L over C', 'Fast writes, stale remote reads'],
          ['AZ partition', 'P → C or A', 'CAP activates'],
        ],
      },
    ],
  },
  {
    id: 'acid',
    title: 'CAP C vs ACID C',
    what:
      'ACID and CAP use "consistency" differently. ACID Consistency means a transaction moves the database from one valid state to another — constraints, foreign keys, and invariants hold. CAP Consistency means linearizability across distributed replicas. A system can have strong ACID on one node while violating CAP-C on reads from lagging replicas.',
    why:
      'Conflating the two C\'s is the #1 CAP interview trap. Java developers equate @Transactional with "strongly consistent distributed system." Staff answers must separate transaction local ACID from replica linearizability.',
    how:
      'Map ACID to single-database boundaries. Map CAP-C to replication and read routing. Cross-service sagas achieve neither full ACID nor CAP-C without distributed transactions (which have their own partition problems). Mention BASE as the AP-friendly alternative philosophy — detailed in BASE section.',
    example: `SIDE-BY-SIDE

  ACID C: UPDATE accounts SET balance = balance - 100 WHERE id=1 AND balance >= 100
          → balance never negative (invariant)

  CAP C:  Client reads balance after transfer from any replica → must see deduction
          → not about CHECK constraints

  @Transactional in Spring:
    ACID within one DataSource — yes
    CAP-C across PaymentDB and InventoryDB — no (needs saga/2PC)`,
    failure:
      'Distributed monolith with multiple DBs assuming one @Transactional. Calling eventual NoSQL "no ACID" while ignoring application-level invariants. Using CAP triangle to discuss transaction isolation levels (unrelated).',
    tradeoff:
      'ACID on one node is well-understood (2PL, MVCC). CAP-C across nodes costs latency and availability. BASE accepts soft state and eventual convergence — see BASE section.',
    tech:
      'Postgres SERIALIZABLE = ACID I + C locally. Read from streaming replica = breaks CAP-C. XA/2PC attempts ACID across DBs — partition → blocking (CP). Saga + outbox = eventual cross-service.',
    trap:
      'Saying "we need ACID so we are CP." Isolation levels (READ COMMITTED vs SERIALIZABLE) are not CAP.',
    interviewAnswer:
      'ACID consistency is about preserving database invariants within a transaction on one node. CAP consistency is linearizability across distributed replicas. A Postgres transaction can be fully ACID while reads from an async replica violate CAP-C. In microservices I use ACID inside each service boundary and choose CAP-aware replication and sagas across boundaries. BASE is the AP-flavored alternative to strict ACID across distributed nodes.',
    remember: [
      'ACID C = valid states / constraints',
      'CAP C = linearizability across replicas',
      '@Transactional ≠ distributed CAP-C',
      'Isolation levels ≠ CAP',
      'BASE complements this picture for AP systems',
    ],
    oneLiner:
      'ACID C is about valid transaction states; CAP C is about linearizable reads across replicas — same word, different meaning.',
    tables: [
      {
        headers: ['', 'ACID C', 'CAP C'],
        rows: [
          ['Scope', 'Single database transaction', 'Distributed replica set'],
          ['Guarantee', 'Constraints / invariants hold', 'Fresh read or error globally'],
          ['Violated when', 'Bad transaction logic', 'Stale replica read during/after partition'],
          ['Java example', '@Transactional debit', 'Read from lagging replica'],
          ['Typical fix', 'Constraints, isolation level', 'Quorum, leader reads, sync repl'],
        ],
      },
      {
        headers: ['Property', 'ACID', 'BASE (preview)'],
        rows: [
          ['Consistency', 'Immediate invariants', 'Eventual convergence'],
          ['Availability', 'Not primary focus', 'Basically available'],
          ['State', 'Hard state after commit', 'Soft state allowed'],
          ['CAP association', 'Local to one node', 'AP-leaning distributed'],
        ],
      },
    ],
  },
  {
    id: 'base',
    title: 'BASE (Basically Available, Soft state, Eventual consistency)',
    what:
      'BASE is a design philosophy for distributed systems that favor availability and partition tolerance over immediate strong consistency. Basically Available: system remains responsive with possible degradation. Soft state: state may change without new input (replication, TTL, background merge). Eventual consistency: given no new writes, replicas converge.',
    why:
      'Large-scale Java platforms (e-commerce, social, IoT) cannot block globally on every write. BASE names acceptable semantics so product and engineering align on staleness, conflicts, and UX. Contrasts with ACID\'s all-or-nothing single-node rigor.',
    how:
      'Implement with async replication, caches, message queues, read repair, and compensating transactions. Document SLAs: "order status may lag 5s." Use version columns, ETags, If-Match. Test convergence with chaos and property-based tests.',
    example: `BASE IN E-COMMERCE

  Basically Available: product page loads from CDN/cache during catalog DB partition
  Soft state:      cart replica count may differ 2 vs 3 until sync
  Eventual:        inventory counts converge after partition heals + read repair

  vs ACID checkout on single PaymentDB shard (local ACID, not global BASE)

  BUSINESS TOLERANCE
  Stale "42 likes" OK
  Stale "42 items in stock" NOT OK without reservation protocol`,
    failure:
      'BASE without eventual guarantee — replicas never converge. No conflict handling → silent data loss. Product promises ACID UX on AP backend.',
    tradeoff:
      'Scale and resilience vs application merge logic and user-visible inconsistency windows. Often hybrid: BASE catalog + CP inventory reservation service.',
    tech:
      'Dynamo/Cassandra, DynamoDB, Couchbase. Kafka log compaction for eventual materialized views. Spring @Cacheable + Redis TTL. CQRS read models lagging behind write model — classic BASE.',
    trap:
      'BASE = "no consistency" — wrong; eventual is a consistency model. Assuming BASE means no transactions — local ACID slices still valid.',
    interviewAnswer:
      'BASE trades immediate strong consistency for availability and partition tolerance: basically available under stress, soft state that replication can reshape, and eventual consistency when writes stop. I associate it with AP designs but implement it selectively — catalog and analytics can be BASE; payments use CP coordination. The business must accept staleness windows and we must prove convergence.',
    remember: [
      'B = basically available (degraded OK)',
      'A = soft state (replication/TTL)',
      'S = eventual consistency (converge)',
      'BASE pairs with AP — not "no rules"',
      'Hybrid: BASE reads + CP writes for inventory',
    ],
    oneLiner:
      'BASE accepts soft, eventually consistent state to stay available under partitions — the AP-friendly counterpart to single-node ACID.',
    tables: [
      {
        headers: ['ACID vs BASE', 'ACID', 'BASE'],
        rows: [
          ['Primary goal', 'Correctness on one node', 'Availability at scale'],
          ['Consistency', 'Immediate invariants', 'Eventual convergence'],
          ['Partition behavior', 'N/A (single node)', 'Keep serving, merge later'],
          ['Microservice fit', 'Per-service DB transaction', 'CQRS, events, caches'],
          ['Risk', 'Scale limits', 'Stale reads, conflicts'],
        ],
      },
      {
        headers: ['Workload', 'BASE OK?', 'Mitigation'],
        rows: [
          ['Product catalog', 'Yes', 'Short TTL, version in UI'],
          ['Like/view counts', 'Yes', 'Approximate counters'],
          ['Inventory sell-down', 'Risky alone', 'CP reservation / ledger'],
          ['Payment balance', 'No', 'Strong consistency path'],
        ],
      },
    ],
  },
];
