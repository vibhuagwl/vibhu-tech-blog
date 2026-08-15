import type {ComponentCard, SectionBlock} from './types';

export const MENTAL_ASCII = `┌─────────────────────────────────────────────────────────────────────────────────────┐
│  KAFKA CLUSTER (one cluster.id — many brokers, one metadata quorum)                 │
│                                                                                     │
│  ┌── KRaft CONTROLLER QUORUM (3 or 5 dedicated controller nodes) ──────────────┐   │
│  │  Raft leader = active controller │ metadata log: topics, leaders, ISR, ACLs  │   │
│  │  Brokers REGISTER here — controllers do NOT sit on every Produce/Fetch      │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│         ▲ register / heartbeat / metadata publish                                   │
│         │                                                                           │
│  ┌──────┴──────────────────────────────────────────────────────────────────────┐   │
│  │  BROKERS (data plane — store replicas, serve clients)                        │   │
│  │                                                                               │   │
│  │   Broker-1 (AZ-a)      Broker-2 (AZ-b)      Broker-3 (AZ-c)                   │   │
│  │   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                 │   │
│  │   │ Topic T     │      │ Topic T     │      │ Topic T     │                 │   │
│  │   │  P0 LEADER  │◄─────│  P0 follower│      │  P0 follower│  replica fetch  │   │
│  │   │  P1 follower│─────►│  P1 LEADER  │◄─────│  P1 follower│                 │   │
│  │   │  P2 follower│      │  P2 follower│─────►│  P2 LEADER  │                 │   │
│  │   └─────────────┘      └─────────────┘      └─────────────┘                 │   │
│  └───────────────────────────────────────────────────────────────────────────────┘   │
│         ▲ Produce (acks)              │ Fetch (replica)              ▲ Fetch (consume) │
│         │                             │                              │                 │
│  ┌──────┴──────┐               (internal)                    ┌───────┴────────┐       │
│  │  PRODUCER   │  partition key → hash → pick ONE partition   │ CONSUMER GROUP │       │
│  │  (N client  │  (many producer instances, one logical       │ (many consumer │       │
│  │   JVMs)     │   client id optional)                        │  instances,    │       │
│  └─────────────┘                                              │  ≤ partitions) │       │
│                                                                └────────────────┘       │
│  Topic T = logical name │ Partition = ordered log + unit of parallelism/ordering       │
│  Replica = copy on a broker │ ISR = in-sync subset │ Offset = position in log         │
└─────────────────────────────────────────────────────────────────────────────────────┘`;

export const WHO_TALKS_TO_WHOM =
  'Producer → partition LEADER broker (Produce API). Follower → leader broker (replica Fetch, not client traffic). Consumer → partition LEADER (Fetch + commit offsets to __consumer_offsets). Controller quorum ↔ all brokers (registration, metadata publish); active controller elects leaders and updates ISR — not on the hot data path for every record.';

export const COMPONENT_CARDS: ComponentCard[] = [
  {
    id: 'producer',
    name: 'Producer',
    what: 'Client application process(es) that serialize records and send them to exactly one partition leader per message via the Produce API.',
    why: 'Ingress path for event streams; partition key chooses ordering scope; acks/minISR/retries define durability vs latency.',
    howMany: 'Many JVM/process instances per service (horizontal app scaling). Not counted in broker/controller sizing. Throughput drives partition count, not “one producer per broker.”',
    ifFails: 'Retries may duplicate (use idempotence + acks=all for strongest client guarantees). No cluster impact unless misconfigured firehose overwhelms leaders.',
    scales: 'Add producer instances; raise partition count when aggregate MB/s or ordering domains exceed one partition’s ceiling.',
    monitored: 'record-error-rate, request-latency, buffer-available-bytes, metadata age; broker-side request queue time on Produce.',
    interviewQs: [
      'Does adding producer instances increase partition parallelism?',
      'What happens if every message uses the same partition key?',
      'How do acks=all and min.insync.replicas interact when ISR shrinks?',
    ],
  },
  {
    id: 'topic',
    name: 'Topic',
    what: 'Named logical stream of partitions sharing configs (RF, retention, cleanup policy, compression).',
    why: 'Domain boundary for ACLs, retention, and consumer contracts; not a physical disk — partitions/replicas are.',
    howMany: 'As many topics as bounded domains need (avoid “topic per microservice call” sprawl). Partition count is per topic.',
    ifFails: 'Topic misconfiguration (RF=1, short retention) causes data loss or consumer gaps — not a runtime “topic crash.”',
    scales: 'Split hot topics; compacted vs delete policies per use case; cross-topic ordering is not guaranteed.',
    monitored: 'bytes-in/out per topic, under-replicated partitions, offline partitions, consumer lag per topic.',
    interviewQs: [
      'Topic vs partition — which is the unit of ordering?',
      'When would you use compact vs delete cleanup?',
      'Can two consumer groups read the same topic independently?',
    ],
  },
  {
    id: 'partition',
    name: 'Partition',
    what: 'Ordered, append-only log segment chain; unit of parallelism, replication, and per-key ordering.',
    why: 'Kafka scales by splitting a topic into independent logs; consumers in a group divide partitions among members.',
    howMany: 'Workload-dependent: max(ceil(producer_MB/s ÷ per-partition_MB/s), consumer_parallelism_needed) × safety margin — not a universal constant.',
    ifFails: 'Single partition offline → that slice of the topic unavailable; hot partition caps throughput for its key space.',
    scales: 'Increase partition count (plan reassignment); cannot split an existing partition in place.',
    monitored: 'per-partition bytes-in, leader skew, disk per log dir, consumer lag per partition.',
    interviewQs: [
      'Why can’t you reduce partition count later without migration pain?',
      'How does partition count relate to max consumer group parallelism?',
      'What is a hot partition and how do you detect it?',
    ],
  },
  {
    id: 'replica',
    name: 'Replica',
    what: 'A copy of a partition log on a specific broker; RF replicas spread across brokers (ideally racks/AZs).',
    why: 'Durability and availability when a broker or AZ fails; only the leader serves clients.',
    howMany: 'RF per partition (typically 3 in production multi-AZ — not a Kafka hard requirement, a durability default).',
    ifFails: 'Lost replica reduces redundancy; if leader dies, controller picks new leader from ISR.',
    scales: 'Higher RF = more disk + fetch traffic; cap RF at what failure domains you can afford to replicate across.',
    monitored: 'under-replicated partitions, replica lag, disk usage per replica, leader distribution.',
    interviewQs: [
      'Replica vs broker — can one broker hold multiple replicas of the same partition?',
      'What is the cost of RF=5 on a 500-partition topic?',
      'Does RF help across regions by itself?',
    ],
  },
  {
    id: 'leader',
    name: 'Leader',
    what: 'The one replica per partition that accepts Produce and consumer Fetch; followers pull from it.',
    why: 'Single writer avoids split-brain on the log; all client traffic for that partition targets the leader broker.',
    howMany: 'Exactly one leader per partition at a time; preferred leader is first in replica assignment list.',
    ifFails: 'Controller elects new leader from ISR (or unclean from out-of-ISR if enabled — data loss risk).',
    scales: 'Balance leaders across brokers (auto.leader.rebalance, rack awareness); hot leaders = broker hotspot.',
    monitored: 'Leader count per broker, Produce/Fetch request rate per broker, election rate.',
    interviewQs: [
      'Can consumers read from followers?',
      'What triggers a preferred leader election?',
      'Leader vs controller — who elects the partition leader?',
    ],
  },
  {
    id: 'follower',
    name: 'Follower',
    what: 'Non-leader replica that continuously fetches from the leader to stay in sync; may join ISR.',
    why: 'Durability copies + failover candidates; HW advances when ISR replicas acknowledge.',
    howMany: 'RF − 1 followers per partition (RF=3 → 2 followers).',
    ifFails: 'ISR shrinks; with min.insync.replicas, Produce with acks=all may fail if ISR too small.',
    scales: 'More followers (higher RF) = more inter-broker fetch bandwidth and disk.',
    monitored: 'replica.lag.time.max.ms breaches, follower fetch rate, out-of-sync replica count.',
    interviewQs: [
      'How does a follower become in-sync again?',
      'Why doesn’t Kafka push to followers?',
      'What is the difference between follower LEO and HW?',
    ],
  },
  {
    id: 'broker',
    name: 'Broker',
    what: 'Kafka server process (node.id) storing partition replicas on log.dirs and serving client + inter-broker APIs.',
    why: 'Data plane workhorse — disk I/O, page cache, network threads; distinct from controller role (can be combined in small clusters).',
    howMany: 'Workload + failure-domain driven: ≥ RF for rack/AZ spread; often 3–9+ for prod — 3 is a common starting point, not a law.',
    ifFails: 'Leaders on dead broker re-elected; under-replication until replicas catch up on survivors.',
    scales: 'Add brokers + partition reassignment; vertical scale for disk/CPU until network/disk bound.',
    monitored: 'RequestHandlerAvgIdle, disk utilization, offline log dirs, network throughput, URP count.',
    interviewQs: [
      'Broker vs cluster vs node — clarify terms.',
      'When is 6 brokers better than 3?',
      'What happens if you lose more brokers than RF allows?',
    ],
  },
  {
    id: 'controller',
    name: 'Controller',
    what: 'Metadata authority: active controller is Raft leader of the KRaft quorum (or legacy ZK era single active controller).',
    why: 'Elects partition leaders, tracks ISR/broker membership, applies topic/config changes — off the per-record hot path.',
    howMany: 'KRaft: dedicated controller quorum of 3 (tolerate 1 loss) or 5 (tolerate 2). Not one per broker.',
    ifFails: 'Failover to another controller node; if quorum lost, metadata changes stop (existing leaders may still serve until they need controller).',
    scales: 'Split process.roles=controller from brokers at scale; 5 controllers for higher metadata churn or stricter fault tolerance.',
    monitored: 'Controller active node, metadata apply latency, election rate, broker registration failures.',
    interviewQs: [
      'Does every Produce go through the controller?',
      'Controller vs broker — can one JVM be both?',
      'What breaks if you lose controller quorum majority?',
    ],
  },
  {
    id: 'consumer',
    name: 'Consumer',
    what: 'Client process that Fetch-es from assigned partition leaders and commits offsets (auto or manual).',
    why: 'Decoupled read path; pull model lets consumers pace processing and replay by resetting offsets.',
    howMany: 'Many instances per consumer group; effective parallelism ≤ assigned partitions for that group.',
    ifFails: 'Partition reassigned on rebalance; stuck consumer → lag grows; does not stop the cluster.',
    scales: 'Add consumers up to partition count; beyond that, idle members.',
    monitored: 'records-lag-max, commit rate, rebalance rate, processing time per poll batch.',
    interviewQs: [
      'Consumer vs consumer group vs partition assignment?',
      'Why can’t 10 consumers parallelize 3 partitions?',
      'What is at-least-once vs exactly-once in Kafka terms?',
    ],
  },
  {
    id: 'consumer-group',
    name: 'Consumer group',
    what: 'Logical set of consumers sharing a group.id; each partition assigned to at most one member at a time.',
    why: 'Horizontal scale-out of consumption; offset progress stored in internal __consumer_offsets topic.',
    howMany: 'One group per independent processing pipeline on a topic (e.g., indexing vs billing).',
    ifFails: 'Rebalance on member join/leave; cooperative vs eager rebalance affects availability during churn.',
    scales: 'Increase partitions to add parallel consumers; multiple groups read the same topic without sharing offsets.',
    monitored: 'lag per group-topic-partition, rebalance latency, members count vs partitions.',
    interviewQs: [
      'Two groups consuming same topic — offset relationship?',
      'Static membership vs dynamic?',
      'Who owns partition assignment — broker or consumer?',
    ],
  },
  {
    id: 'offset',
    name: 'Offset',
    what: 'Monotonic position in a partition log; committed offsets mark consumer progress.',
    why: 'Replay, reset-to-earliest, and lag calculation; stored per group-topic-partition.',
    howMany: 'One committed offset pointer per consumer group per assigned partition (plus transactional offsets if EOS).',
    ifFails: 'Commit after process → at-least-once duplicates; commit before process → loss.',
    scales: 'Not a scaling dimension — compaction of __consumer_offsets is automatic internal housekeeping.',
    monitored: 'lag (log-end − committed), offset commit rate, duplicate processing detectors downstream.',
    interviewQs: [
      'Offset vs message timestamp?',
      'What is log-start offset after retention?',
      'How does lag relate to HW?',
    ],
  },
  {
    id: 'cluster',
    name: 'Cluster',
    what: 'All brokers sharing one cluster.id plus one metadata system (KRaft quorum; ZooKeeper in legacy).',
    why: 'Security boundary, metric namespace, capacity pool; DR is usually another cluster (MM2), not RF alone.',
    howMany: 'Typically one prod cluster per environment/region; federation via MirrorMaker 2 or cluster linking.',
    ifFails: 'Partial — some partitions offline; total — quorum or all replicas for a partition lost.',
    scales: 'Add brokers, disks, partitions; split clusters when blast radius or compliance requires isolation.',
    monitored: 'Cluster-wide URP, offline partitions, controller health, aggregate throughput ceilings.',
    interviewQs: [
      'Cluster vs region — does RF=3 survive region loss?',
      'When do you need a second cluster?',
      'Can consumers connect to two clusters as one group?',
    ],
  },
  {
    id: 'availability-zone',
    name: 'Availability Zone',
    what: 'Failure domain within a region (separate power/network); mapped via broker.rack for replica placement.',
    why: 'RF spread across racks/AZs so single-AZ loss leaves ISR majority if minISR satisfied.',
    howMany: 'Match RF to independent failure domains you replicate across (often 3 AZs with RF=3).',
    ifFails: 'AZ loss kills replicas in that rack; surviving AZs host remaining ISR members.',
    scales: 'More AZs in assignment → need RF ≥ domains or accept uneven placement.',
    monitored: 'Replica distribution per rack, AZ-level broker count, cross-AZ fetch latency.',
    interviewQs: [
      'broker.rack purpose in replica assignment?',
      'RF=3 all in one AZ — interview red flag?',
      'Cross-AZ traffic cost vs durability tradeoff?',
    ],
  },
  {
    id: 'region',
    name: 'Region',
    what: 'Geographic area; one Kafka cluster is usually confined to one region’s network latency envelope.',
    why: 'Produce/Fetch latency and ISR sync assume low RTT; cross-region ISR is an anti-pattern for latency.',
    howMany: 'Active/active or active/passive clusters per region; async replication (MM2) between them.',
    ifFails: 'Region disaster = cluster unavailable unless DR cluster promoted with replicated data.',
    scales: 'Scale inside region; replicate out for DR — not by stretching one cluster across regions.',
    monitored: 'MM2 lag, offset sync between clusters, RPO/RTO for regional failover runbooks.',
    interviewQs: [
      'Why not RF across two regions?',
      'MM2 vs cluster linking vs Confluent Replicator?',
      'How do you fail over consumers to DR region?',
    ],
  },
  {
    id: 'zookeeper',
    name: 'ZooKeeper',
    what: 'Legacy external consensus store for Kafka metadata (pre–KRaft); single active controller elected via ZK.',
    why: 'Historical: broker registration, controller election, topic metadata — operational burden (separate ensemble).',
    howMany: 'Odd-sized ZK ensemble: 3 (tolerate 1 node loss) or 5 (tolerate 2) — independent from broker count.',
    ifFails: 'ZK quorum loss blocks metadata changes; Kafka 4.0+ removed ZK mode — know for legacy interviews.',
    scales: 'Does not scale Kafka throughput; separate JVM fleet to patch and monitor.',
    monitored: 'ZK latency, fsync time, outstanding requests, Kafka dependency on session timeouts.',
    interviewQs: [
      'ZK ensemble size vs broker count — any relationship?',
      'Why did Kafka move metadata in-house (KRaft)?',
      'What happens on ZK split-brain?',
    ],
  },
  {
    id: 'kraft',
    name: 'KRaft',
    what: 'Kafka Raft metadata mode: controllers replicate a metadata log; brokers consume metadata snapshots/records.',
    why: 'Single system to operate; faster metadata; required path for Kafka 3.3+ production and mandatory in 4.x.',
    howMany: 'Controller quorum 3 or 5 (odd only); brokers scale separately — combined broker+controller on small dev only.',
    ifFails: 'Lose minority → failover; lose majority → no leader elections / topic creates until restored.',
    scales: 'Dedicated controllers for large clusters; metadata log compacted via snapshots.',
    monitored: 'Raft leader, metadata apply lag, snapshot age, broker metadata staleness.',
    interviewQs: [
      'KRaft 3 vs 5 controllers — fault tolerance math?',
      'process.roles broker,controller — when to split?',
      'Is KRaft on the Produce hot path?',
    ],
  },
];

export const SECTIONS_CORE: SectionBlock[] = [
  {
    id: 'mental',
    part: 1,
    title: 'Mental model',
    lead: 'Separate metadata plane (controllers), data plane (brokers/replicas), and client plane (producers/consumers). One record → one partition leader; followers catch up; consumers never talk to followers for reads.',
    ascii: MENTAL_ASCII,
    body: `WHY: Interviewers test whether you confuse broker count with partition count, or think ZooKeeper/KRaft sits in the Produce path.

WHEN: Open with this diagram before sizing RF, partitions, or consumer groups.

KEY DISTINCTIONS:
• Cluster = all brokers + one metadata quorum (cluster.id).
• Broker = JVM storing replicas; many partitions/replicas per broker.
• Controller = metadata brain (KRaft Raft quorum); NOT one per broker.
• Producer instance = client JVM; many instances, optional shared client.id.
• Consumer group = offset namespace + partition assignment; consumer instance = group member.
• Partition = ordered log; replica = copy on a broker; leader = single writer/reader endpoint for clients.

FAILURE: Losing a broker ≠ losing cluster if RF and ISR allow new leaders. Losing controller quorum majority ≠ immediate data loss, but metadata operations halt.

MONITORING: Lag is consumer-group scoped; URP is cluster/replica scoped; leader elections spike on broker death.

TEMP vs PERM: Temp — restart stuck consumer. Perm — fix RF/minISR/acks mismatch, rebalance leaders, add brokers.

INTERVIEW: Draw producer → leader, follower fetch → leader, consumer → leader, controller → brokers (dashed). State clearly: followers are not read replicas for clients.`,
    remember: [
      'Clients only talk to partition leaders for Produce/Fetch.',
      'Controller quorum size is independent of broker count.',
      'Consumer group parallelism is capped by assigned partitions.',
      'Topic is logical; partition is the unit of ordering and scale.',
      'Many producer/consumer instances ≠ many brokers.',
    ],
    oneLiner: 'Producers and consumers hit partition leaders on brokers; controllers own metadata, not every record.',
    trap: 'Saying “Kafka has 3 brokers so we have 3 consumers max” — confuses brokers with partitions and consumer groups.',
  },
  {
    id: 'architecture',
    part: 2,
    title: 'Production architecture',
    lead: 'Typical multi-AZ layout: 3+ brokers spread across racks, RF=3, min.insync.replicas=2, acks=all, dedicated or combined KRaft controllers (3), producers/consumers in app tier. Numbers are starting points — justify with workload.',
    ascii: `Region (e.g. us-east-1)
├── AZ-a          AZ-b          AZ-c
│  Broker-1       Broker-2      Broker-3        ← data plane (6 or 9 brokers = more disk/leader capacity)
│  Ctrl-1         Ctrl-2        Ctrl-3        ← KRaft quorum (often 3, not 6)
│
├── Producers (autoscaled app pods) ──Produce──► leaders
└── Consumer groups (≤ partitions each) ◄──Fetch── leaders

Cross-region: second cluster + MM2 (RF does NOT substitute for DR)`,
    body: `WHY: Staff interviews want failure-domain story: AZ, broker, disk, controller quorum — not a single “magic 3.”

ARCHITECTURE SIZES (when appropriate):
• 3 brokers: common dev/small prod STARTING POINT when RF=3 across 3 AZs — one replica per AZ, minimal prod footprint.
• 5 brokers: more disk headroom, lower leader-per-broker density, room for rolling replace while keeping RF spread.
• 6 brokers: often 2 brokers/AZ × 3 AZs — lets RF=3 place replicas without stacking all on one broker per AZ; better rebuild margin.
• 9 brokers: higher throughput / TB-scale per cluster, rebalancing headroom, isolation of noisy neighbors — workload-dependent, not default.

HARD REQUIREMENTS vs STARTING POINTS:
• HARD: RF ≤ broker count; RF replicas should span failure domains you claim to survive; controller quorum must be odd; |ISR| ≥ min.insync.replicas for acks=all to succeed.
• TYPICAL STARTING POINT: RF=3, minISR=2, 3 AZs, 3 controllers — say “unless workload or SLO dictates otherwise.”
• WORKLOAD-DEPENDENT: broker count, partition count, disk type, network, consumer lag SLO.

FAILURE: Single AZ loss with rack-aware RF=3 → one replica per partition gone → ISR often still ≥2 if minISR=2. Region loss → need DR cluster.

MONITORING: Per-AZ broker count, leader skew, aggregate disk %, cross-AZ replication bytes.

TEMP/PERM: Temp — throttle producers during incident. Perm — rack awareness, separate controller nodes, MM2 for region DR.

INTERVIEW: Explicitly label diagram: “this is one region, one cluster; DR is another cluster.”`,
    remember: [
      '3 brokers is a common starting point, not a universal law.',
      '6 or 9 brokers add capacity and rebalance margin — justify with disk and leader load.',
      'Controllers (3/5) are sized for metadata fault tolerance, not throughput.',
      'RF=3 across AZs is typical prod default — override with eyes open.',
      'Multi-region = multi-cluster + replication tool.',
    ],
    oneLiner: 'Prod = multi-AZ brokers + KRaft quorum + RF/minISR/acks alignment; scale brokers for disk/CPU, partitions for parallelism.',
    trap: 'Claiming RF=3 protects against region failure — it does not; only rack/AZ within one cluster.',
    tables: [
      {
        headers: ['Layout', 'Brokers', 'When'],
        rows: [
          ['Minimal multi-AZ', '3', 'Small prod, RF=3, one broker/AZ — starting point'],
          ['Headroom', '5', 'Lower disk %, maintenance without tight capacity'],
          ['2 per AZ', '6', 'RF=3 with 2 brokers/AZ — common mid-size pattern'],
          ['High scale', '9+', 'TB/day, many partitions, strict rebalance/isolation needs'],
        ],
      },
    ],
  },
  {
    id: 'brokers',
    part: 3,
    title: 'Brokers · how many',
    lead: 'Broker count follows failure domains, RF, disk/CPU/network ceilings, and leader/replica load — not “always 3.”',
    body: `WHY: Wrong broker count → disk full, NetworkProcessor idle → 0, or inability to place RF replicas across racks.

DECISION FRAMEWORK:
1. Failure domains: need ≥ RF brokers in distinct racks/AZs for the survival story you promise.
2. Capacity: sum(partition replicas × retention × bytes/s) ÷ usable disk per broker; aim <70% steady state (workload-dependent).
3. Leader/load skew: hot partitions need more brokers to spread leaders; use metrics, not guesses.
4. Ops margin: rolling restarts, broker replacement, reassignment bandwidth — extra brokers reduce blast radius.
5. Cost floor: 3 may suffice; 6/9 when metrics show disk, CPU, or request handler saturation.

WHEN 3 vs 5 vs 6 vs 9:
• 3: starting point for RF=3 one-per-AZ; tight — losing 2 brokers simultaneously can offline partitions.
• 5: extra capacity without doubling AZ footprint; still check AZ balance.
• 6: 2 brokers/AZ × 3 AZs — popular when you need maintenance headroom while keeping RF=3 rack-aware.
• 9: large partition counts, strict isolation, or sustained high MB/s — not for every startup.

FAILURE: Broker death → URP until catch-up; multiple simultaneous losses can drop below minISR.

MONITORING: log.dirs utilization, RequestHandlerAvgIdle, leader count per broker, disk read/write await.

TEMP: throttle clients, cancel reassignment. PERM: add brokers, reassign partitions, tune retention.

INTERVIEW: Say “I start with 3 AZs and RF=3, then size brokers from retention math and observed leader skew — I’d move to 6 before blindly raising RF.”`,
    remember: [
      'Brokers ≠ controllers ≠ producer instances.',
      'You need at least RF brokers to place replicas; more for capacity.',
      '3 is typical starting point; 6/9 are capacity/failure-margin choices.',
      'Disk full on one broker can fence replicas — monitor per log.dir.',
      'Adding brokers does not auto-fix too few partitions.',
    ],
    oneLiner: 'Size brokers from RF placement + disk/CPU/network + leader skew — 3 is common start, not a cap.',
    trap: '“We have 10 partitions so we need 10 brokers” — partitions and brokers are independent dimensions.',
  },
  {
    id: 'controllers',
    part: 4,
    title: 'Controllers',
    lead: 'KRaft controller quorum (usually 3 or 5 dedicated nodes) holds metadata; active controller is Raft leader. Brokers scale separately.',
    ascii: `Controller quorum (3 nodes)
  Ctrl-1 (follower) ── Raft ── Ctrl-2 (LEADER / active controller)
         │                              │
         └──────── Ctrl-3 (follower) ───┘
                    │
         metadata publish / broker registration
                    ▼
              All brokers`,
    body: `WHY: Metadata changes (topic create, leader election, ISR) must be strongly consistent; data plane stays available when controller fails over.

WHAT CONTROLLERS DO: Partition leader election, ISR updates, broker registration/fencing, topic/config mutations. They do NOT append user records.

HOW MANY: 3 controllers tolerate 1 simultaneous failure; 5 tolerate 2. Odd quorum only. Independent of broker count — 100 brokers still often use 3 controllers unless metadata churn demands 5.

WHEN 5 controllers: Large cluster metadata velocity, stricter control-plane SLO, or policy requiring dual failure tolerance on metadata.

FAILURE: Minority loss → new Raft leader in seconds. Majority loss → no elections/topic admin; existing partition leaders may still serve until needing controller.

MONITORING: Active controller identity, metadata apply latency, time since last successful registration.

TEMP: none safe for quorum loss — restore nodes. PERM: dedicated hardware, JVM heap for metadata, snapshot monitoring.

INTERVIEW: Emphasize controllers are NOT “one per broker” and NOT on Produce hot path.`,
    remember: [
      'Active controller = one at a time; quorum = 3 or 5 typically.',
      '3 controllers → tolerate 1 loss; 5 → tolerate 2.',
      'Broker count does not dictate controller count.',
      'Combined broker+controller OK for dev; split in prod at scale.',
      'Quorum majority loss blocks metadata, not necessarily all reads/writes immediately.',
    ],
    oneLiner: 'Odd-sized KRaft controller quorum owns metadata; 3/5 is fault tolerance, not throughput scaling.',
    trap: 'Drawing a controller inside every broker box — that is not the production pattern at scale.',
  },
  {
    id: 'zookeeper',
    part: 5,
    title: 'ZooKeeper (legacy)',
    lead: 'Pre-KRaft Kafka relied on an external ZK ensemble for controller election and metadata. Kafka 4.x removed ZK mode — still asked in legacy migration interviews.',
    body: `WHY: Historical context and brownfield ops; understand separation of ZK ensemble from Kafka brokers.

ZK ENSEMBLE: Odd nodes (3 or 5). 3 → tolerate 1 ZK node loss; 5 → tolerate 2. Completely independent sizing from Kafka broker count.

WHAT ZK HELD: Controller registration, broker ephemeral nodes, topic/partition metadata (older formats), ACLs in some versions.

FAILURE: ZK slow → controller session timeout → flapping leadership. ZK quorum loss → Kafka admin stuck.

MONITORING: ZK latency, outstanding requests, Kafka controller migration events.

TEMP: restart unhealthy ZK follower. PERM: migrate to KRaft, reduce metadata in ZK (upgrade path), dedicated ZK SSDs.

INTERVIEW: State Kafka 4.0+ is KRaft-only; compare ZK 3/5 ensemble rules to KRaft 3/5 — same tolerate math, different process.

TEMP vs PERM: Staying on ZK is tech debt post-3.x; KRaft migration is permanent fix.`,
    remember: [
      'ZK ensemble 3 or 5 — same tolerate-1 / tolerate-2 math as KRaft.',
      'ZK nodes ≠ Kafka brokers — separate JVMs to patch.',
      'Kafka 4.0 removed ZooKeeper mode.',
      'ZK issues manifest as controller instability.',
      'Greenfield should be KRaft only.',
    ],
    oneLiner: 'Legacy metadata ensemble (3/5) separate from brokers; replaced by KRaft in modern Kafka.',
    trap: 'Saying ZK stores Kafka messages — it held metadata only.',
    tables: [
      {
        headers: ['', 'ZooKeeper 3', 'ZooKeeper 5', 'KRaft controllers 3', 'KRaft controllers 5'],
        rows: [
          ['Tolerate simultaneous loss', '1', '2', '1', '2'],
          ['Majority needed', '2', '3', '2', '3'],
          ['Runs where', 'External ensemble', 'External ensemble', 'Kafka controller processes', 'Kafka controller processes'],
          ['Kafka 4.x', 'Removed', 'Removed', 'Supported', 'Supported'],
          ['Data path', 'No', 'No', 'No', 'No'],
        ],
      },
    ],
  },
  {
    id: 'kraft',
    part: 6,
    title: 'KRaft deep dive',
    lead: 'Metadata replicated via Raft on controller quorum; brokers subscribe to metadata updates. Quorum size sets control-plane fault tolerance: 3→lose 1, 5→lose 2.',
    ascii: `Metadata change → Raft leader appends → majority commit → apply → publish to brokers
Brokers update MetadataCache → clients learn via Metadata API`,
    body: `WHY: Eliminate ZK ops; faster topic/partition operations; unified security and release train.

MEMORY RULES:
• 3 controllers: cluster survives any 1 controller failure; needs 2 alive for quorum.
• 5 controllers: survives any 2 simultaneous controller failures; needs 3 alive for quorum.
• Never run even counts (2, 4) — split-brain risk without majority.

process.roles:
• broker — data plane only.
• controller — metadata only (prod large clusters).
• broker,controller — dev/small combined nodes.

FAILURE: Controller failover is seconds; broker continues if it has current metadata. Majority loss → cannot elect leaders for NEW failures.

MONITORING: Raft term/leader, metadata max lag, snapshot download failures on new brokers.

TEMP: restore controller nodes in order from snapshot. PERM: dedicated controllers, 5-quorum if metadata SLO requires dual failure tolerance.

INTERVIEW: KRaft fault tolerance is identical math to ZK ensemble — tolerate (N-1)/2 failures for odd N.`,
    remember: [
      '3 controllers → tolerate 1 failure; 5 → tolerate 2.',
      'Quorum majority required for metadata commits.',
      'Brokers and controllers scale independently.',
      'Metadata log compacted via snapshots.',
      'KRaft not on per-record Produce path.',
    ],
    oneLiner: 'KRaft = Raft metadata quorum; 3/5 sets how many controllers can die before metadata stops.',
    trap: 'Running 2 controllers “to save cost” — no majority on single failure.',
    tables: [
      {
        headers: ['Controllers', 'Quorum', 'Tolerate loss', 'Interview sound bite'],
        rows: [
          ['3', '2', '1', '“Standard prod control plane”'],
          ['5', '3', '2', '“Dual controller failure during maintenance”'],
          ['4', '—', '—', 'Avoid — even size'],
        ],
      },
    ],
  },
  {
    id: 'producers',
    part: 7,
    title: 'Producer infrastructure',
    lead: 'Producers are stateless client fleets; partition key routes to one partition; durability is acks + minISR + RF, not broker count.',
    body: `WHY: Producer misconfig causes duplicates, loss, or hot partitions.

PRODUCER → CLUSTER: Metadata fetch finds leader for topic-partition; batch Produce to leader; leader waits per acks setting.

acks:
• 0 — fire and forget.
• 1 — leader ack only (loss if leader dies before replication).
• all — wait for ISR acknowledgements per min.insync.replicas.

PRODUCTION DEFAULT (typical starting point): acks=all, enable.idempotence=true (implies acks=all), RF=3, min.insync.replicas=2 — state as default then validate latency SLO.

HOT KEY: Same partition key → same partition → single leader disk/network ceiling. Fix: salt keys, split topic, async aggregation, or accept ordering tradeoffs.

HOW MANY PRODUCERS: Scale app instances freely; throughput ceiling = partition layout and leader capacity.

FAILURE: retries + no idempotence → duplicates; ISR < minISR + acks=all → NotEnoughReplicasException.

MONITORING: produce latency, batch size, compression ratio, record error rate, broker Produce queue time.

TEMP: reduce batch size, backoff. PERM: more partitions, key splitting, dedicated leader rebalancing.

INTERVIEW: Distinguish producer INSTANCE from broker; adding producers does not add ordering lanes without partitions.`,
    remember: [
      'Partition key → hash → single partition.',
      'Hot key = hot partition = leader hotspot.',
      'acks=all needs |ISR| ≥ min.insync.replicas.',
      'Idempotence is typical prod companion to acks=all.',
      'Many producer JVMs share cluster metadata.',
    ],
    oneLiner: 'Producers send to leaders; keys pick partitions; acks+minISR+RF define durability.',
    trap: '“Turn acks to 1 for speed” in a payment topic without acknowledging minISR tradeoff.',
  },
  {
    id: 'topics',
    part: 8,
    title: 'Topic design',
    lead: 'Topics bound retention, ACLs, and consumer contracts; design partition count and cleanup policy up front — partition count is costly to lower.',
    body: `WHY: Topic sprawl hurts operability; wrong cleanup policy loses data or disk.

DESIGN CHOICES:
• Name/version: orders.v1, domain.event-type — explicit schema evolution.
• cleanup.policy: delete (streams) vs compact (changelog/KTable).
• retention.ms/bytes: business + legal; not infinite by default.
• compression: lz4/zstd/snappy — broker and producer aligned.

RF & MINISR (topic or cluster default): Production typical starting point RF=3, minISR=2 — workload may allow RF=2 in constrained edge cases; RF=1 dev only.

PARTITION COUNT: Set at create (increase later via admin, decrease effectively requires migration). See partition section for formulas.

FAILURE: auto.create.topics.enable=true in prod → accidental RF=1 topics.

MONITORING: bytes in/out per topic, retention disk, compaction lag.

TEMP: raise retention temporarily. PERM: topic governance, Schema Registry, explicit create with RF/minISR.

INTERVIEW: Topic is logical; physical cost = partitions × RF × retention.`,
    remember: [
      'Topic ≠ partition — partitions are created inside topic.',
      'Compact for keyed state; delete for events.',
      'Disable auto-create in prod.',
      'RF/minISR set per topic or cluster default.',
      'Cross-topic ordering unsupported.',
    ],
    oneLiner: 'Topic = config + namespace; get RF, retention, and partition count right at create time.',
    trap: 'One topic per event type with 1 partition each — destroys throughput and creates ops nightmare.',
  },
  {
    id: 'partitions',
    part: 9,
    title: 'Partition count',
    lead: 'Partitions cap consumer group parallelism and spread producer load; size with formulas and a safety margin — never “12 because someone said so.”',
    ascii: `partitions_needed = max(
  ceil(target_producer_MBps / safe_MBps_per_partition),
  required_consumer_parallelism
) × safety_margin

Example A — producer bound:
  120 MB/s target, 10 MB/s/partition safe → ceil(12)=12
  consumer needs 8 parallel → max(12,8)=12
  ×1.25 margin → 15 → round to 16 (power of 2 optional)

Example B — consumer bound:
  40 MB/s producer, 10 MB/s/partition → 4
  consumer needs 24 workers → max(4,24)=24
  ×1.2 margin → 29 partitions`,
    body: `WHY: Too few → cannot scale consumers or saturate cluster; too many → file handles, metadata overhead, longer rebalances.

FORMULAS (workload-dependent constants):
• From producer: P_prod = ceil(total_ingress_MB/s ÷ per_partition_MB/s). per_partition_MB/s from benchmark or vendor guide — NOT a universal 10 MB/s; measure yours.
• From consumers: P_cons = peak parallel tasks that must process independently while preserving per-key order.
• Take: P = max(P_prod, P_cons) × margin (1.2–1.5 typical planning margin).

HOT PARTITION / HOT KEY: Skewed keys defeat partition math — monitor per-partition bytes-in; fix keys before blindly adding partitions.

CONSUMER GROUP RULE: Max effective consumers in group ≈ partition count (one partition → one consumer in group at a time).

FAILURE: Too many partitions on few brokers → disk spread thin, leader churn on rebalance.

MONITORING: per-partition throughput skew, partition count per broker, rebalance duration.

TEMP: scale consumers to partition count. PERM: add partitions (empty new ones only for new keys), fix key distribution, split topics.

INTERVIEW: Always say numbers are examples; cite measurement. Distinguish partition from replica from broker.`,
    remember: [
      'partitions = max(producer, consumer) × margin.',
      'Constants are workload-dependent — benchmark.',
      'Cannot shrink partition count in place.',
      'Hot key bypasses partition scaling.',
      'Consumers ≤ partitions per group.',
    ],
    oneLiner: 'Partition count = max(ingress per partition, consumer parallelism) with safety margin.',
    trap: 'Quoting “4000 partitions max” without broker heap/disk context — limits are cluster-specific.',
    tables: [
      {
        headers: ['Input', 'Example value', 'Result'],
        rows: [
          ['Ingress', '120 MB/s ÷ 10 MB/s/part', '12'],
          ['Consumers', '24 parallel pipelines', '24'],
          ['max(12,24)', '—', '24'],
          ['×1.25 margin', '—', '30 partitions'],
        ],
      },
    ],
  },
  {
    id: 'replication',
    part: 10,
    title: 'Replication factor',
    lead: 'RF = replica copies per partition across brokers. Production typical default RF=3 with min.insync.replicas=2 and acks=all — trade availability, durability, disk, and cross-AZ traffic.',
    body: `WHY: RF is your within-cluster durability knob; it does not replace cross-region DR.

RF TRADEOFFS:
• RF=1: dev/test only — broker loss = data unavailable/lost.
• RF=2: tolerates one replica loss; minISR=1 + acks=all is weak (single copy in sync).
• RF=3: typical prod STARTING POINT — survive one replica loss with minISR=2; rack-aware across 3 AZs.
• RF=4: uncommon — even RF complicates leader election symmetry; prefer 3 AZs + RF=3 or add brokers.
• RF=5: rare, high durability or regulatory — 2x disk/fetch vs RF=3; justify cost.

PRODUCTION DEFAULT (state explicitly as typical, not law):
RF=3, min.insync.replicas=2, acks=all, unclean.leader.election.enable=false.

HEALTHY REPLICAS vs WHAT PRODUCE SEES (RF=3, minISR=2, acks=all):
• 3 in-sync (ISR=3): writes succeed; strongest.
• 2 in-sync (ISR=2): writes succeed (meets minISR).
• 1 in-sync (ISR=1): acks=all FAILS (below minISR=2) — prefer fail over silent loss.
• 0 in-sync / no leader: partition offline — admin intervention.

RF=2, minISR=1, acks=all: only 1 in-sync required — survives but single copy on disk for committed msgs.

FAILURE: Under-replicated if |ISR| < RF — alert. Broker loss drops one replica per partition.

MONITORING: URP count, ISR shrink rate, replication bytes, minISR violations.

TEMP: accept write failure until ISR recovers. PERM: restore brokers, rack awareness, avoid unclean election.

INTERVIEW: RF is per partition; total replicas = partitions × RF.`,
    remember: [
      'RF=3 + minISR=2 + acks=all is typical prod default.',
      'RF must be ≤ broker count and span racks you claim.',
      'Higher RF = more disk + inter-broker fetch.',
      'RF does not cross regions for DR.',
      'unclean.leader.election=false for durability.',
    ],
    oneLiner: 'RF copies the log; with minISR=2 and acks=all, writes need at least 2 in-sync replicas.',
    trap: 'RF=3 with all replicas in one AZ — numerically 3, operationally 1 failure domain.',
    tables: [
      {
        headers: ['RF', 'Use', 'Tradeoff'],
        rows: [
          ['1', 'Dev', 'No fault tolerance'],
          ['2', 'Cost-sensitive', 'Weaker; careful minISR'],
          ['3', 'Typical prod start', 'Balance durability/cost'],
          ['5', 'Rare strict', '2× storage vs RF=3'],
        ],
      },
      {
        headers: ['Healthy in-sync (RF=3, minISR=2, acks=all)', 'acks=all'],
        rows: [
          ['3 replicas in ISR', 'OK'],
          ['2 replicas in ISR', 'OK'],
          ['1 replica in ISR', 'FAIL (NotEnoughReplicas)'],
          ['0 / no leader', 'Partition unavailable'],
        ],
      },
    ],
  },
  {
    id: 'isr',
    part: 11,
    title: 'ISR deep dive',
    lead: 'ISR = in-sync replica set for a partition; acks=all commits only when enough ISR members ack per min.insync.replicas; HW advances with ISR.',
    ascii: `Leader LEO ─────────────────────────────►
Follower A (in ISR)  LEO ────────────────►
Follower B (lagging) LEO ───────►  → dropped from ISR

HW = min(LEO) across ISR — consumers read < HW (simplified)`,
    body: `WHY: ISR is the live durability contract — not the same as RF. A replica can exist but be out of ISR.

ISR MECHANICS:
• Followers join ISR when caught up within replica.lag.time.max.ms.
• Slow disk/network shrinks ISR.
• Leader is always in ISR when healthy.

acks=all + min.insync.replicas=2:
• Producer waits for ISR acks meeting minISR floor.
• If ISR size drops to 1 with minISR=2 → produce fails — availability trade for durability.

LEO vs HW: HW cannot pass minimum ISR LEO; consumers fetching with read_uncommitted see up to HW.

FAILURE SCENARIOS:
• One broker down (RF=3, rack-aware): ISR often 2 → writes continue.
• Two brokers down: ISR may be 1 → acks=all stops with minISR=2.
• Unclean election: out-of-ISR replica becomes leader → possible data loss — keep disabled in prod unless explicit policy.

MONITORING: UnderReplicatedPartitions, IsrShrinksPerSec, replica lag, offline replicas.

TEMP: restore network/disk; broker restart. PERM: faster disks, replica.fetch.max.bytes tuning, add brokers to spread load.

INTERVIEW: ISR ⊆ replicas; |ISR| can be less than RF; minISR is cluster/topic config floor for writes.`,
    remember: [
      'ISR ⊆ all replicas; lagging followers excluded.',
      'acks=all uses ISR, not RF alone.',
      'minISR=2 means need 2 in-sync for writes.',
      'URP = |ISR| < RF — investigate.',
      'Unclean election trades safety for availability.',
    ],
    oneLiner: 'ISR is who counts for acks=all; shrink below minISR and durable writes stop by design.',
    trap: 'Assuming RF=3 guarantees 3 in-sync at all times — lagging follower drops from ISR.',
  },
];
