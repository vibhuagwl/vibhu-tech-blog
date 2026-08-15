import type {CapSection} from './types';

export const SECTIONS_MODELS: CapSection[] = [
  {
    id: 'strong',
    title: 'Strong consistency models',
    what:
      '“Strong” is not one guarantee — it is a family of formal models that bound what clients can observe across concurrent operations. Linearizability (single-object, real-time order), sequential consistency (multi-object program order), and serializability (transactional equivalence to some serial order) are the three most cited. Session guarantees — read-your-writes (RYOW), monotonic reads, monotonic writes — sit below linearizability but above eventual on the ladder.',
    why:
      'Staff interviews test whether you can name the guarantee a product actually provides, not just say “strong.” Mislabeling linearizability as serializability, or assuming RYOW implies global linearizability, leads to wrong architecture choices — especially under partitions and multi-region routing.',
    how:
      'Linearizability: every operation appears to take effect atomically at some instant between its invocation and response; respects real-time precedence (if op A completes before op B starts, A is ordered before B). Sequential consistency: all processes see the same total order of operations, but it need not match wall-clock time — only each process’s program order is preserved. Serializability: transactions appear to execute in some serial order; individual reads inside a transaction may not be linearizable in real time (phantom reads allowed unless higher isolation). RYOW: a client never reads a value older than one it wrote in the same session. Monotonic reads: once a client reads value v at time t, it never reads an older value for that key in the same session.',
    example:
      'DynamoDB with ConsistentRead=true on a single item after a successful PutItem gives read-your-writes for that client session on that key — not full multi-key linearizability. Spanner external consistency is close to linearizability across shards via TrueTime. ZooKeeper znode writes are linearizable per znode. A bank ledger using SERIALIZABLE isolation in PostgreSQL gets serializable transactions, not necessarily linearizable cross-region reads without extra sync.',
    failure:
      'Under partition, a system claiming linearizability must reject or delay operations that cannot be ordered with the majority — stale leader reads violate linearizability. Sequential consistency can be satisfied while two clients observe contradictory orders if real-time order is not required. Serializability does not prevent stale reads across sessions or from async replicas.',
    tradeoff:
      'Stronger models cost latency (quorum round-trips, clock sync), throughput (leader bottlenecks), and availability during partitions (minority side must fail writes/reads). Weaker session guarantees are cheaper and often sufficient for UX (profile page shows your own edit immediately) without paying global linearizability.',
    tech:
      'Linearizable: etcd, ZooKeeper, Consul (with correct read paths), Spanner, DynamoDB strong reads on single item. Sequential consistency: rare as advertised; some shared-memory hardware. Serializable: PostgreSQL SERIALIZABLE, CockroachDB default, FoundationDB. Session/RYOW: DynamoDB session tokens, Cassandra LOCAL_QUORUM + sticky sessions, MongoDB causal consistency.',
    trap:
      '“Our DB is ACID so we are linearizable” — ACID serializability is transactional, not real-time linearizable across replicas. “Strong consistency” on a cloud API often means RYOW or monotonic reads, not linearizability.',
    interviewAnswer:
      'I distinguish four layers: (1) Linearizability — single-object, real-time total order; gold standard for registers and locks. (2) Sequential consistency — global order exists but wall clock ignored. (3) Serializability — transactions equivalent to serial execution; strongest for multi-key invariants. (4) Session guarantees — RYOW and monotonic reads bound per-client staleness without global sync. For a payment debit I want serializable or linearizable writes with quorum; for a profile name change RYOW after write is often enough. I always ask: strong for whom, which objects, and during partition?',
    remember: [
      'Linearizability = real-time + atomic; strongest single-object model.',
      'Sequential consistency drops real-time; order can disagree with wall clock.',
      'Serializability = transactions; not the same as linearizability.',
      'RYOW / monotonic reads are session-scoped, not global.',
      'CAP “C” often means linearizability or quorum — clarify which.',
    ],
    oneLiner:
      'Linearizability is real-time atomic order; serializability is transactional; RYOW/monotonic reads are per-session — do not conflate them.',
    tables: [
      {
        headers: ['Model', 'Scope', 'Real-time order?', 'Typical use'],
        rows: [
          ['Linearizability', 'Single object / register', 'Yes', 'Locks, leader election, config'],
          ['Sequential consistency', 'All objects', 'No', 'Theoretical; rare in prod'],
          ['Serializability', 'Transactions (multi-key)', 'No (across txns)', 'Ledgers, inventory'],
          ['Read-your-writes', 'Same client session', 'Per session', 'Profile edits, cart'],
          ['Monotonic reads', 'Same client session', 'No backward time', 'Feeds, timelines'],
        ],
      },
    ],
  },
  {
    id: 'eventual',
    title: 'Eventual consistency',
    what:
      'If updates stop, all replicas converge to the same value — but there is no bound on how long replicas may disagree. Clients may read stale data; concurrent writes create conflicts resolved later (last-writer-wins, vector clocks, CRDT merge, application merge).',
    why:
      'High availability and low latency under partition and across regions require accepting temporary divergence. Most read-heavy workloads (social, DNS, CDN, shopping catalog) tolerate staleness if business invariants are protected elsewhere.',
    how:
      'Replicas accept writes locally or on a reachable subset; gossip or anti-entropy propagates state. Reads may hit any replica. On conflict: LWW with timestamps (risky without good clocks), version vectors, CRDTs (counters, sets), or custom merge (e.g., union of likes). “Convergence” means no live writes ⇒ all replicas equal; not “soon” unless qualified (Δ-consistency).',
    example:
      'User changes display name from “Alice” to “Alicia” on phone (Region US); tablet (Region EU) still shows “Alice” for 200 ms — stale read. Both regions accept edits during partition; on heal, merge picks latest timestamp or prompts user. DynamoDB/Cassandra AP paths, CouchDB, Riak — eventual by default on some consistency levels.',
    failure:
      'Stale reads cause double-spend if balance checks are eventual. LWW loses concurrent updates silently. Anti-entropy lag means “eventually” is hours in ops incidents. Conflict resolution bugs create permanent ghost state.',
    tradeoff:
      'Gain: availability, partition tolerance, write locality, horizontal scale. Pay: application complexity, testing burden, user-visible anomalies, compensating transactions for invariants.',
    tech:
      'Cassandra ONE/LOCAL_ONE reads, DynamoDB eventual reads, CouchDB, Voldemort, DNS, CDN caches, Redis async replication for reads, custom AP microservices with event sourcing.',
    trap:
      '“Eventual consistency is fine for everything except payments” — many payment paths use strong ledger + eventual read models; the trap is applying eventual to the invariant, not the view.',
    interviewAnswer:
      'Eventual means replicas converge when writes quiesce — no staleness bound unless you add one. I design: (1) which reads can be stale, (2) conflict strategy (CRDT vs LWW vs app merge), (3) how users see their own writes (session token / RYOW overlay), (4) healing and monitoring (replication lag). Profile name: eventual + RYOW on session is typical. I never use eventual for uniqueness or balance without a strongly consistent authority.',
    remember: [
      'Eventual = convergence, not “fast” or “probably fresh.”',
      'Stale reads are a feature of AP, not a bug to patch without changing model.',
      'Conflict resolution is application or datastore policy — design it upfront.',
      'Session overlays (RYOW) improve UX without global strong consistency.',
      'Measure replication lag; “eventual” without metrics is blind.',
    ],
    oneLiner:
      'Eventual consistency trades bounded staleness for availability — convergence is guaranteed, timing is not.',
    tables: [
      {
        headers: ['Resolution', 'Mechanism', 'Risk'],
        rows: [
          ['Last-writer-wins', 'Timestamp per write', 'Clock skew drops updates'],
          ['Vector clock', 'Causal ancestry', 'Complexity, tombstones'],
          ['CRDT', 'Merge lattice', 'Limited data types'],
          ['App merge', 'Business rules', 'Must be commutative/idempotent'],
        ],
      },
    ],
  },
  {
    id: 'models',
    title: 'Consistency model ladder',
    what:
      'Consistency models form a partial order from weakest (eventual) to strongest (linearizability). Intermediate rungs — causal, read-your-writes, monotonic reads, monotonic writes, session, bounded staleness — let engineers match guarantees to UX without paying full strong consistency everywhere.',
    why:
      'PACELC and real systems are not binary CP/AP — they expose a menu. Staff design requires placing each operation on the ladder and explaining what clients can prove.',
    how:
      'Bottom: eventual — no order guarantees. Causal — if A causally precedes B (same session or chained reads), all nodes see A before B; weaker than sequential consistency. Session — bundle RYOW + monotonic reads + monotonic writes for one client context (sticky routing or session token). Bounded staleness — reads at most T seconds old. Strong per key — linearizable register. Top — serializable / linearizable transactions across keys.',
    example:
      'Instagram-like feed: monotonic reads (timeline never “rewinds”) + eventual global fanout. Shopping cart: session consistency on cart service (RYOW) + strong inventory decrement at checkout. Cross-service: causal via version vectors in event headers.',
    failure:
      'Mixing models without documenting boundaries — checkout reads eventual cart + strong stock → oversell. Losing session stickiness breaks RYOW without client-side tokens. “Causal” claimed but implemented as eventual + hope.',
    tradeoff:
      'Each rung up adds coordination, latency, or routing constraints. Stay low on ladder for scale; climb only where invariants demand it.',
    tech:
      'Causal: MongoDB causal consistency, DynamoDB session / transact writes chain. Session: sticky load balancer + replica set. Bounded staleness: Spanner staleness bound reads, Azure Cosmos session/consistent prefix. Strong: etcd, Spanner, Cockroach.',
    trap:
      'Drawing one consistency label on the whole system — Netflix is not “AP”; individual services differ.',
    interviewAnswer:
      'I use a ladder: eventual → causal → session (RYOW, monotonic reads/writes) → bounded staleness → per-key linearizable → serializable transactions. I map operations: social like = eventual/CRDT; feed scroll = monotonic reads; post edit = RYOW; payment = serializable or linearizable write path. Causal fits comment threads tied to parent post. I state what breaks if we go one rung lower.',
    remember: [
      'Models are per-operation, not per-company.',
      'Causal ⊂ session in practice when sticky + chains; formal definitions differ.',
      'Monotonic writes: client’s writes appear in order it sent them.',
      'Bounded staleness is explicit Δ — better than vague “eventual.”',
      'Ladder helps PACELC EL vs EC discussion.',
    ],
    oneLiner:
      'Pick the weakest model that preserves the invariant — climb the ladder only where the business forces it.',
    tables: [
      {
        headers: ['Rung', 'Guarantee', 'Client observable'],
        rows: [
          ['Eventual', 'Convergence when quiet', 'Arbitrary stale order'],
          ['Causal', 'Respect cause → effect', 'No reading parent after child if linked'],
          ['RYOW', 'See own writes', 'Own edit visible immediately'],
          ['Monotonic reads', 'No time travel', 'Older values never reappear'],
          ['Monotonic writes', 'Own write order preserved', 'Writes appear in send order'],
          ['Session', 'Bundle of per-client guarantees', 'Coherent session view'],
          ['Bounded staleness', '≤ Δ lag', 'Known max age'],
          ['Linearizable', 'Real-time atomic', 'Behaves like single copy'],
        ],
      },
    ],
  },
  {
    id: 'quorum',
    title: 'Quorum reads and writes (N, W, R)',
    what:
      'N replicas; write quorum W (acks required to accept write); read quorum R (replicas consulted on read). Classic rule: if R + W > N, read and write sets overlap — some replica saw the latest write. For N=3, W=2, R=2: tolerate one replica loss and still overlap.',
    why:
      'Quorums are the arithmetic behind Dynamo-family availability and the bridge between “replicated” and “consistent enough.” Staff must explain overlap vs linearizability and choose W/R for SLA.',
    how:
      'Write sends to all N; commit when W acks. Read queries R replicas; return latest version (by vector clock or timestamp). Sloppy quorum + hinted handoff extends availability beyond strict quorum. With W > N/2, writes serialize through overlapping majorities — helps avoid forked histories.',
    example:
      'N=3, W=2, R=2: node failure loses one copy; remaining 2 still satisfy both quorums. Client writes v2 to {A,B}; read from {B,C} must include B → sees v2. N=3, W=1, R=1: fast but no overlap guarantee — classic AP tuning.',
    failure:
      'R+W>N does not imply linearizability without single-round coordination — concurrent writes with W=2 can fork if not coordinated. Read repair fixes divergence but after stale return. Clock skew makes “latest” wrong.',
    tradeoff:
      'Higher W,R → more consistency and durability, higher latency, lower write availability. Lower W,R → faster, more available, stale/conflicting reads.',
    tech:
      'Dynamo, Cassandra (CL QUORUM = majority of N), Riak, Voldemort, early S3 metadata patterns; adjustable per operation.',
    trap:
      '“R+W>N means strong consistency” — false without synchronized rounds, leader serialization, or read-from-leader; overlap only guarantees you touch a replica that had the write, not that you read the latest concurrent write.',
    interviewAnswer:
      'For N=3 I often start W=2, R=2: survives one failure and R+W=4>3 so read set intersects write set. That gives monotonic read potential with versioning, not automatic linearizability — two writers can still race unless W>N/2 and you use leader or transactional layer. I tune: W=N for durability-critical, R=1 for read-heavy AP, W=1 R=1 for lowest latency with accepted staleness. I always pair quorum math with failure tolerance: need W ≤ N - f for f simultaneous failures if you require every quorum to intersect.',
    remember: [
      'R + W > N ⇒ read/write replica sets overlap.',
      'Overlap ≠ linearizability without coordination.',
      'W > N/2 helps avoid dual-write forks.',
      'N=3 W=2 R=2 tolerates 1 node loss for strict quorum.',
      'Quorum is per-key partition in Dynamo/Cassandra.',
    ],
    oneLiner:
      'R+W>N guarantees overlap — not by itself linearizability; coordination or leader still required for strong order.',
    tables: [
      {
        headers: ['Param', 'N=3 W=2 R=2', 'Meaning'],
        rows: [
          ['Overlap', '4 > 3', 'Some replica in both quorums'],
          ['Write fault tolerance', '1 node', 'W acks from any 2 of 3'],
          ['Read fault tolerance', '1 node', 'R responses from any 2 of 3'],
          ['Concurrent writes', 'Possible conflict', 'Resolve with versions / LWW'],
          ['Linearizable?', 'Not automatic', 'Need leader or sync round'],
        ],
      },
    ],
  },
  {
    id: 'quorum-fail',
    title: 'Quorum failure scenarios',
    what:
      'Concrete analysis of how N, W, R choices behave under node loss and partition for consistency, availability, latency, and failure tolerance — comparing R=1 W=1, R=2 W=2 on N=3, and R=3 W=3 on N=5.',
    why:
      'Interviewers give numbers and ask “can we still write?” and “what do reads see?” Staff answers quantify trade-offs instead of hand-waving “quorum.”',
    how:
      'For each config: (1) max simultaneous replica failures tolerated for writes/reads, (2) behavior under partition (majority side vs minority), (3) latency (round-trips), (4) consistency (stale? fork?), (5) availability (reject vs accept).',
    example:
      'N=3 R=1 W=1: write/read need only one live node — highest availability, lowest latency; reads often stale; two partitions both accept writes → divergence. N=3 R=2 W=2: need 2 of 3 — loses availability if partition splits 1|2 (minority side dead); majority side consistent overlap; 1 node crash OK. N=5 R=3 W=3: tolerates 2 failures; partition 2|3 → minority (2) cannot quorum — CP behavior; majority keeps strong overlap; higher latency (3 acks).',
    failure:
      'R=1 W=1 during split-brain: both sides accept conflicting writes — heal requires merge. R=2 W=2 with 1|2 split: side with 1 node blocks — availability hit. N=5 R=3 W=3: losing 3 nodes bricks writes — plan capacity accordingly.',
    tradeoff:
      'R=1 W=1 optimizes AP (latency + availability); R=2 W=2 on N=3 is balanced CP-leaning for single-node loss; R=3 W=3 on N=5 buys 2-node fault tolerance at 3-replica RTT cost.',
    tech:
      'Cassandra ONE vs QUORUM vs ALL; Dynamo sloppy quorum; MongoDB writeConcern majority; Riak PR/pw/pr values.',
    trap:
      'Assuming symmetric partition — 1|2 on N=3 means minority cannot serve quorum reads/writes; only majority side is live for W=2,R=2.',
    interviewAnswer:
      'N=3 R=1 W=1: AP — always one node can serve; stale reads and write conflicts under partition; lowest latency. N=3 R=2 W=2: CP-leaning — survives 1 crash; on 1|2 partition minority unavailable; consistent on majority; ~2 RTT. N=5 R=3 W=3: survives 2 failures; 2|3 split blocks minority; 3 acks add latency; best overlap margin for same relative majority. I pick based on whether minority must accept traffic (AP) or reject (CP).',
    remember: [
      'Lower W,R → more available, less consistent.',
      'Majority quorum needs > N/2 nodes on same side.',
      'N=3 W=2 R=2: 1 failure OK; 1|2 partition kills minority.',
      'N=5 W=3 R=3: 2 failures OK; higher write latency.',
      'Always analyze partition shape, not only crash count.',
    ],
    oneLiner:
      'Tune W and R for the failure shape you must survive — R=1 W=1 is AP; majority quorums are CP-leaning.',
    tables: [
      {
        headers: ['Config', 'Consistency', 'Availability (partition)', 'Latency', 'Fault tolerance'],
        rows: [
          ['N=3 R=1 W=1', 'Stale / fork risk', 'Both sides may serve', 'Low (1 RTT)', '0 for overlap; N-1 for single-op'],
          ['N=3 R=2 W=2', 'Overlap on majority', 'Majority only', 'Medium (2 RTT)', '1 node crash; 1|2 blocks minority'],
          ['N=5 R=3 W=3', 'Strong overlap', 'Majority (3+) only', 'Higher (3 RTT)', '2 node crash; 2|3 blocks minority'],
        ],
      },
    ],
  },
  {
    id: 'leader',
    title: 'Leader-based replication',
    what:
      'One leader (primary) accepts writes; followers replicate via log shipping. Reads may hit leader (strong) or followers (stale). Failover promotes a follower when leader dies. Sync replication waits for follower ack; async does not.',
    why:
      'Leader serialization is the practical way to get linearizable writes and ordered logs without full peer quorum on every write. Raft and Paxos are the standard ways to elect and maintain a safe leader.',
    how:
      'Sync: leader waits for quorum or all followers before ack — durability, higher latency, risk if follower slow. Async: leader acks after local write — fast, data loss if leader dies before replicate. Failover: detect lease expiry / heartbeat loss, run election (Raft) or ballot (Paxos), fence old leader. Reads from leader or quorum-read for linearizability; follower reads need lag monitoring.',
    example:
      'MySQL primary-replica: async replication — read replica shows lag. MongoDB replica set: primary + secondaries, election on primary loss. Kafka: partition leader handles all client IO; ISR defines sync set. etcd: Raft leader serves linearizable reads with quorum.',
    failure:
      'Split-brain if two leaders without fencing. Async gap → promoted replica missing last writes. Sync with one slow replica stalls writes. Stale follower reads after failover before catch-up.',
    tradeoff:
      'Sync + quorum: CP, higher latency. Async: AP on reads, fast writes, RPO > 0. Leader bottleneck limits write scale — shard leaders.',
    tech:
      'MySQL/Postgres streaming replication, MongoDB replica sets, Redis Sentinel/Cluster primary, Kafka partition leaders, etcd/Consul Raft, Spanner (Paxos per tablet).',
    trap:
      '“We have a leader so we are consistent” — async replication + read from replica is not linearizable; failover without fencing can double-write.',
    interviewAnswer:
      'Leader/followers centralize write ordering. Sync replication (wait for ISR/quorum) trades latency for durability — CP during partition if minority cannot elect. Async is fast but RPO risk. Failover uses Raft (terms, votes, log matching) or Paxos (proposers, acceptors) conceptually: only one leader per term, log entries committed on majority. For Staff I add: read policy (leader vs follower), fencing (STONITH, epoch), and whether failover is manual or automatic with blast radius.',
    remember: [
      'Leader serializes writes — one ordered log.',
      'Sync = wait for replicas; async = latency vs loss.',
      'Raft: understandable leader election + log replication.',
      'Paxos: foundational; Multi-Paxos ≈ Raft in practice.',
      'Failover needs fencing to kill zombie leader.',
    ],
    oneLiner:
      'Leader replication orders writes; sync vs async and read routing decide how strong you actually are.',
  },
  {
    id: 'consensus',
    title: 'Consensus and CAP',
    what:
      'Consensus is the problem of agreeing on a single value or log order among distributed nodes despite failures. CAP is a theorem about trade-offs during network partition between consistency and availability — not an algorithm. Raft and Paxos are consensus protocols used to build CP systems (leader election, replicated logs).',
    why:
      'Conflating CAP with “we use Raft” misses the point: consensus implements the C side when partitions force minority unavailability. Staff separates theorem (what is impossible) from mechanism (how we approximate strong guarantees).',
    how:
      'Paxos: propose value, majority acceptors agree; Multi-Paxos for sequence. Raft: leader, follower, candidate; log replication with matchIndex/commitIndex; safety via term and log consistency. Both require majority for commit → during partition minority cannot make progress (CP). CAP does not choose an algorithm; it states you cannot have full C and full A under partition.',
    example:
      'etcd uses Raft: 3 nodes, partition 1|2 — 2-node side has majority, keeps serving; 1-node side rejects writes (CP). Kafka KRaft controllers use Raft for metadata — not the same as consumer availability during broker partition.',
    failure:
      'Treating consensus cluster as AP by reading from minority. Even number of nodes (split vote). Large Paxos/Raft clusters — higher election latency. CAP slide decks without linking to actual read/write paths.',
    tradeoff:
      'Consensus adds latency (rounds) and operational complexity but gives agreed order. Without it, AP shortcuts need application-level merge.',
    tech:
      'etcd, Consul, ZooKeeper (Zab), Kafka KRaft, Cockroach/Spanner internal Paxos groups, TiKV Raft.',
    trap:
      '“CAP says pick two so we picked Raft” — Raft is how you implement strong consistency when you accept unavailability on the minority side during P; it is not a third CAP letter.',
    interviewAnswer:
      'CAP is not consensus. CAP: during partition, C and A cannot both hold in the formal sense. Consensus: algorithms (Raft/Paxos) that replicate a log with majority commit — used to implement CP behavior. I say: we use Raft in etcd for config so writes are linearizable on majority; during partition the minority is unavailable for writes — that is the CAP trade-off instantiated, not “consensus instead of CAP.”',
    remember: [
      'CAP = impossibility sketch under partition.',
      'Consensus = mechanism for agreed order.',
      'Raft/Paxos need majority → CP when split.',
      'Multi-Paxos ≈ practical replicated log.',
      'Do not say “we solved CAP with Raft.”',
    ],
    oneLiner:
      'CAP states the trade-off; Raft/Paxos are how you pay for consistency on the majority side.',
  },
  {
    id: 'split-brain',
    title: 'Split brain',
    what:
      'Two or more nodes believe they are the primary and accept writes — usually after network partition without quorum or fencing. Data diverges irreconcilably without merge semantics or one side forced down.',
    why:
      'Classic production disaster for HA pairs (DB, Redis, NFS). Staff must explain detection, prevention (quorum, STONITH), and recovery.',
    how:
      'Prevention: require majority quorum to serve writes (etcd, MongoDB); lease with epoch (fencing token) so stale leader writes rejected; witness/arbiter for 2-node; manual failover with STONITH. Detection: dual write monitoring, divergent row counts, two primaries in metrics. Recovery: pick winner, resync loser, validate invariants.',
    example:
      'Two-node MySQL master-master without arbiter — partition → both accept deposits → double balance. Redis Sentinel split: two sentinels promote different replicas → conflicting keys until operator intervenes. Proper: 3-node Raft — minority steps down automatically.',
    failure:
      'Fencing fails → zombie primary corrupts data after new primary elected. Witness misconfigured → both sides think they have majority. Auto-failover too aggressive → flapping primaries.',
    tradeoff:
      'Quorum/witness adds cost and latency but prevents split brain. 2-node HA without witness is fast but structurally risky — accept operator failover only.',
    tech:
      'STONITH (Pacemaker), MongoDB majority writeConcern, etcd Raft, Redis CLUSTER failover with majority masters, cloud AZ witness, fencing tokens in storage arrays.',
    trap:
      '“We will merge later” after split-brain on financial counters — merge without CRDT is lossy.',
    interviewAnswer:
      'Split brain is dual primary during partition. Prevent with: (1) quorum — only majority elects leader; (2) fencing — epoch/lease so old leader cannot commit; (3) STONITH — kill old node hardware/VM. For 2-node I insist witness or accept manual failover. Recovery: stop one side, full resync, audit divergent writes. CP systems sacrifice minority availability to avoid split brain; AP systems accept divergence.',
    remember: [
      'Split brain = two writers, one dataset.',
      'Quorum majority prevents dual primary.',
      'Fencing beats heartbeat alone.',
      '2-node HA needs witness or human failover.',
      'Recovery is painful — design prevention.',
    ],
    oneLiner:
      'Split brain is two primaries — quorum plus fencing beats hope.',
  },
  {
    id: 'partition-scenarios',
    title: 'Partition scenarios (CP vs AP)',
    what:
      'Network partitions come in many shapes: two-node split, three-node majority/minority, cross-region/AZ, client-server isolation vs server-server, symmetric vs asymmetric (one-way packets). Each shape interacts differently with quorum, leader election, and client routing.',
    why:
      'CAP bites differently per topology. Staff designs name partition type and predict CP vs AP behavior for each subsystem.',
    how:
      'Two-node: no majority possible with one each — need witness or CP stops one side / AP accepts fork. Three-node 1|2: majority=2 continues (CP), minority=1 blocks. Region/zone: AZ partition — route to majority AZ; cross-region — often AP with async replication or CP with unwritable minority region. Client-server partition: client cannot reach cluster — looks like outage from client view even if cluster healthy. Asymmetric partition: A→B works, B→A drops — heartbeats fail, false failover risk; use bidirectional health checks.',
    example:
      'CP: etcd 3-node, AZ failure isolates 1 node — 2-node majority serves linearizable writes; isolated node read-only or errors. AP: Cassandra 3-node, CL ONE — both sides accept writes during 1|2 split; conflict on heal. Multi-region: US-EU link cut — EU AP continues checkout with local quorum; US CP ledger blocks EU writes until heal or async conflict queue.',
    failure:
      'Assuming partition is always 50/50 — asymmetric breaks naive heartbeat. Client partition causes retries on wrong side → duplicate writes without idempotency. Geo-DNS still routes to dead region.',
    tradeoff:
      'CP: minority region/users unavailable but no fork. AP: all regions up, merge cost later. Hybrid: CP for ledger, AP for catalog — route by operation.',
    tech:
      'Route53 health checks, global load balancer, Cassandra LOCAL_QUORUM, Spanner true-time + majority, application dual-write antipatterns.',
    trap:
      '“We are multi-AZ so no partition” — AZ partition is exactly the staff scenario; also conflating client offline with server partition.',
    interviewAnswer:
      'I walk scenarios: (1) 2-node — no quorum; CP picks one via witness/STONITH or AP forks. (2) 3-node 1|2 — majority CP continues, minority down. (3) Region partition — async AP regions diverge; sync CP blocks minority region. (4) Client-server partition — retries, idempotency, local edge cache; server may be fine. (5) Asymmetric — tune failure detectors, avoid split-brain flapping. I map each to business: payments CP on majority; product browse AP. Healing: anti-entropy, read repair, backlog replay.',
    remember: [
      'Partition shape drives quorum outcome.',
      '2-node without witness cannot be safe CP and fully available.',
      'Client partition ≠ server partition.',
      'Asymmetric links cause ghost failures.',
      'Design per operation CP vs AP under same partition.',
    ],
    oneLiner:
      'Name the partition shape first — majority/minority, region, and client isolation predict CP vs AP behavior.',
    tables: [
      {
        headers: ['Scenario', 'Topology', 'CP behavior', 'AP behavior'],
        rows: [
          ['Two-node split', '1 | 1', 'One side down / witness', 'Both write; fork'],
          ['Three-node', '1 | 2', 'Majority (2) serves', 'Both sides may serve with CL ONE'],
          ['Cross-region', 'US | EU', 'Minority region read-only', 'Both regions write; merge later'],
          ['Client-server', 'Client isolated', 'Client errors/timeouts', 'Stale cache / queue offline ops'],
          ['Asymmetric', 'A→B only', 'False failure detection risk', 'Partial divergence'],
        ],
      },
    ],
  },
];
