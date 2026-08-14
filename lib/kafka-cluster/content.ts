/** Defaults verified against Apache Kafka 4.x broker configs (kafka.apache.org/43). Kafka 4.0 removed ZooKeeper mode. */

export const VERSION_NOTE =
  'Targets Apache Kafka 4.x / KRaft-only (ZooKeeper mode removed). Documented broker defaults often look like a single-node lab (default.replication.factor=1, min.insync.replicas=1, auto.create.topics.enable=true). Production MUST override. For acks=all, the leader waits for the current ISR; min.insync.replicas is the floor on ISR size. Always re-check kafka.apache.org docs for your exact release — do not treat board text as a substitute for the config reference.';

export const MEMORY_SENTENCE =
  'Clients talk to partition leaders on brokers. Brokers append to local logs (segments + indexes) via page cache. Followers fetch to stay in ISR. Controllers (KRaft Raft quorum) own metadata: leaders, ISR, topics, broker membership. Durability = RF × ISR × min.insync.replicas × unclean.election=false — not “we have 3 brokers” alone.';

export const CLUSTER_PIECES: string[][] = [
  ['Cluster', 'Set of brokers + one KRaft controller quorum sharing a cluster.id'],
  ['Broker / node', 'Process that stores partition replicas and serves Produce/Fetch'],
  ['Controller', 'Metadata brain: leaders, ISR, topics, broker registration (KRaft Raft)'],
  ['Topic', 'Named stream of partitions with configs (RF, retention, cleanup)'],
  ['Partition', 'Ordered log; unit of ordering, parallelism, replication, storage'],
  ['Replica', 'Copy of a partition on a broker; one leader, RF−1 followers'],
  ['ISR', 'In-sync replicas caught up within replica.lag.time.max.ms'],
  ['LEO', 'Log end offset — next offset this replica will append'],
  ['HW', 'High watermark — last offset known replicated to ISR; consumers read < HW'],
  ['LSO', 'Last stable offset — txn visibility bound for read_committed'],
  ['Leader epoch', 'Monotonic leadership generation; fences stale leaders / guides truncation'],
];

export const BROKER_LAYERS: string[][] = [
  ['SocketServer / Acceptor', 'Accept TCP connections per listener'],
  ['Processor (network threads)', 'Read requests, write responses, parse Kafka protocol'],
  ['Request / response queues', 'Hand-off between network and I/O pools'],
  ['KafkaRequestHandler (I/O threads)', 'Dispatch by ApiKey to ReplicaManager, etc.'],
  ['ReplicaManager', 'Partition leadership, append, fetch, ISR, HW'],
  ['LogManager / UnifiedLog', 'Segments, indexes, retention, cleaner hooks'],
  ['ReplicaFetcher threads', 'Follower pull from leaders'],
  ['Group / Transaction coordinators', 'Internal topics __consumer_offsets, __transaction_state'],
  ['MetadataCache', 'Local view published from KRaft metadata log'],
];

export const THREAD_ROWS: string[][] = [
  ['num.network.threads', '3 (per data listener)', 'Accept/read/write sockets. Saturate → NetworkProcessorAvgIdle ↓'],
  ['num.io.threads', '8', 'Request handlers. Saturate → RequestHandlerAvgIdle ↓, queue size ↑'],
  ['num.replica.fetchers', '1', 'Fetcher threads per source broker. Raise carefully for catch-up'],
  ['Log cleaner threads', 'log.cleaner.threads', 'Compaction I/O/CPU'],
  ['Controller (KRaft)', 'Controller event thread + Raft I/O', 'Separate process.roles=controller or combined'],
];

export const KRAFT_ROWS: string[][] = [
  ['Why leave ZK', 'One metadata system in Kafka; simpler ops; Kafka 4.0 removed ZK mode'],
  ['Controller quorum', 'Odd-sized Raft set (3 or 5). Majority must be alive to commit metadata'],
  ['Active controller', 'Raft leader of the metadata log; applies metadata records'],
  ['Metadata log', 'Replicated Raft log of topic/partition/broker/config changes'],
  ['Snapshots', 'Compact history so new brokers catch up without replaying forever'],
  ['Broker registration', 'Brokers register with features, listeners, rack; get fenced by epoch'],
  ['Failover', 'Controller leader dies → new Raft leader; brokers continue serving data'],
  ['Quorum loss', 'Majority down → no metadata commits: no topic create, no leader election. Existing leaders may still serve until they need controller'],
];

export const RAFT_FLOW = `Metadata change (CreateTopic, leader election, ISR update)
  → Controller Raft leader appends to metadata log
  → Replicate to controller followers
  → Commit when majority ack
  → Apply to controller state
  → Publish to brokers (MetadataPublisher)
  → Brokers update MetadataCache
  → Clients learn via Metadata API refresh`;

export const CONTROLLER_DUTIES: string[][] = [
  ['Topic create/delete/alter', 'Partition count, RF, configs'],
  ['Partition leadership', 'Elect leaders from ISR (or unclean if enabled)'],
  ['ISR updates', 'Shrink/expand as brokers report'],
  ['Broker lifecycle', 'Register, fence, unregister'],
  ['Reassignment', 'Move replicas; preferred leader election'],
  ['Config changes', 'Broker/topic dynamic configs'],
  ['NOT on data path', 'Every Produce does not go through the controller'],
];

export const BROKER_START = `Process start
 → load configs (node.id, process.roles, listeners, log.dirs)
 → kafka-storage formatted dirs / cluster.id check
 → network + SocketServer
 → KRaft: register with controller quorum / sync metadata
 → load local logs (segments, recover unclean shutdown)
 → become follower/leader per metadata
 → serve Produce/Fetch`;

export const BROKER_STOP = `Graceful:
  controlled.shutdown.enable=true
  → migrate leaders away
  → stop fetchers
  → close logs
  → deregister

Unclean / kill -9:
  → controller detects session loss
  → elect new leaders from ISR
  → restart: log recovery + catch up + rejoin ISR`;

export const CONFIG_CORE: string[][] = [
  ['node.id', 'int', '(required)', 'Stable unique identity'],
  ['process.roles', 'broker,controller,or both', '(required KRaft)', 'Split controllers on large clusters'],
  ['controller.quorum.voters', 'id@host:port…', '(required)', 'Odd-sized quorum'],
  ['listeners', 'list', '(required)', 'Bind addresses'],
  ['advertised.listeners', 'list', '(required prod)', 'What clients must reach — classic k8s bug'],
  ['inter.broker.listener.name', 'string', '—', 'Listener for replica traffic'],
  ['controller.listener.names', 'string', '—', 'Controller plane'],
  ['log.dirs', 'list', '(required)', 'JBOD disks preferred over one huge RAID for Kafka'],
  ['num.network.threads', 'int', '3', 'Per data listener'],
  ['num.io.threads', 'int', '8', 'Request handlers'],
  ['default.replication.factor', 'int', '1', 'OVERRIDE to 3 in prod'],
  ['min.insync.replicas', 'int', '1', 'OVERRIDE to 2 with RF=3'],
  ['unclean.leader.election.enable', 'boolean', 'false', 'Keep false unless availability > durability'],
  ['auto.create.topics.enable', 'boolean', 'true', 'OVERRIDE false in prod'],
  ['num.partitions', 'int', '1', 'Default for auto-created topics — prefer explicit'],
  ['log.segment.bytes', 'int', '1073741824', '1 GiB segment roll size'],
  ['log.retention.hours', 'int', '168', '7 days — business window'],
  ['replica.lag.time.max.ms', 'long', '30000', 'ISR shrink threshold'],
  ['num.replica.fetchers', 'int', '1', 'Catch-up parallelism'],
  ['message.max.bytes', 'int', '1048588', 'Align with client max.request.size'],
];

export const LISTENER_ROWS: string[][] = [
  ['Client → advertised.listeners', 'After bootstrap Metadata, clients connect to advertised host:port'],
  ['Broker → inter-broker listener', 'Replica fetch + inter-broker control'],
  ['Controller listener', 'Brokers ↔ controllers; often separate from public'],
  ['PLAINTEXT / SSL / SASL_SSL', 'Map via listener.security.protocol.map'],
  ['Wrong advertised', 'Bootstrap works, Produce fails to localhost/internal DNS'],
];

export const REQUEST_PATH = `Client TCP
 → Acceptor
 → Processor (network thread): read + parse RequestHeader (api_key, api_version, correlation_id)
 → RequestChannel queue
 → KafkaRequestHandler (I/O thread)
 → ReplicaManager / coordinators / admin handlers
 → Response queue
 → Processor writes response (same correlation_id)
 → Client`;

export const PROTOCOL_APIS: string[][] = [
  ['ApiVersions', 'Negotiate capabilities'],
  ['Metadata', 'Brokers, topics, leaders, ISR, rack'],
  ['Produce', 'Leader append + acks'],
  ['Fetch', 'Consumer + replica fetcher'],
  ['ListOffsets', 'Time/offset lookup'],
  ['FindCoordinator', 'Group / txn coordinators'],
  ['InitProducerId / AddPartitionsToTxn / EndTxn', 'Idempotence & transactions'],
  ['CreateTopics / DeleteTopics / AlterConfigs', 'Often controller-driven'],
  ['AlterPartition', 'ISR/leadership metadata path (KRaft era)'],
];

export const TOPIC_ROWS: string[][] = [
  ['delete', 'Drop old segments by time/size — event streams, payments'],
  ['compact', 'Keep latest value per key — changelog, compacted state'],
  ['compact,delete', 'Compact then also bound total size/time'],
];

export const REPLICA_ASSIGN = `Partition 0 replicas: [B1, B2, B3]
  preferred leader = B1 (first in list)
  rack-aware: place replicas on different broker.rack / AZs
Bad: all three replicas in one AZ → AZ loss = partition offline`;

export const ISR_ROWS: string[][] = [
  ['Enter ISR', 'Follower caught up within replica.lag.time.max.ms and fetching'],
  ['Leave ISR', 'Lagged / failed / network / slow disk'],
  ['acks=all', 'Leader waits for ISR acknowledgements; needs |ISR| ≥ min.insync.replicas'],
  ['HW advance', 'Only offsets known on all ISR members'],
  ['Under-replicated', 'RF > |ISR| — alert P0 if growing'],
];

export const OFFSET_TYPES = `LEO  — local log end (next write)
HW   — last offset replicated to ISR (consumers typically fetch < HW)
LSO  — last stable (committed txn bound for read_committed)

Follower LEO can trail leader LEO
HW cannot pass the min ISR LEO`;

export const ELECTION_FLOW = `Leader broker dies
 → controller detects (broker epoch / registration)
 → pick new leader from ISR (clean)
 → bump leader epoch
 → update metadata log (Raft commit)
 → publish to brokers
 → clients Metadata refresh → Produce/Fetch new leader

unclean.leader.election.enable=true
 → may elect out-of-ISR replica
 → AVAILABILITY over SAFETY — possible data loss`;

export const EPOCH_WHY = `Leader epoch fences stale leaders after network partitions
On become-leader: epoch++
Replicas truncate divergent suffix using epoch checkpoints
Prevents old leader from appending after it was deposed`;

export const STORAGE_TREE = `log.dirs/.../topic-partition/
  00000000000000000000.log
  00000000000000000000.index      # offset → file position
  00000000000000000000.timeindex  # timestamp → offset
  00000000000000000000.txnindex   # optional
  leader-epoch-checkpoint
  partition.metadata

Active segment receives appends
Roll when size (log.segment.bytes) or time (log.segment.ms)`;

export const PAGE_CACHE = `Kafka leans on OS page cache — not giant JVM heaps of records
Append: sequential write → page cache → disk
Fetch: often served from page cache (sendfile / zero-copy path)
JVM heap: threads, metadata, network buffers, request objects
Rule: leave most RAM for page cache; heap is relatively modest
Kafka broker memory ≠ -Xmx`;

export const ZERO_COPY = `Hot fetch path: data in page cache → kernel sendfile → socket
Avoids copy into userspace JVM for the payload
Produce path still builds RecordBatches in broker memory then writes log`;

export const COMPACTION = `key=A v1, key=A v2, key=A v3  → cleaner eventually keeps latest A=v3
Tombstone (null value) marks delete; retained delete.retention.ms
Dirty ratio / lag metrics show cleaner backlog
Compaction ≠ instantaneous; never assume “only one A exists right now” without reading the log`;

export const CAPACITY = `Storage ≈ events/day × avg bytes × retention_days × RF
  (+ indexes ~overhead; + headroom 30%+)

Network ≈ ingress + (RF-1)×ingress replication + egress to consumers

Partitions/broker: recovery time, FD count, memory map — not free
1M events/s design starts from bytes/s and disk/net ceilings, then brokers`;

export const SCALE_ADD_BROKER = `1. Provision disk/net, set node.id, format storage with cluster.id
2. Start broker → registers with KRaft
3. Does NOT auto-steal partitions
4. kafka-reassign-partitions (throttled) move replicas
5. Prefer preferred leader election after move
6. Watch URP, disk, throttle, ISR during move`;

export const ANTI: {bad: string; good: string}[] = [
  {bad: 'RF=1 in prod', good: 'RF=3, minISR=2, unclean=false'},
  {bad: 'All replicas one AZ', good: 'broker.rack + rack-aware assignment'},
  {bad: 'auto.create.topics=true', good: 'Explicit topics + ACLs'},
  {bad: 'Giant JVM heap “for Kafka”', good: 'Modest heap; RAM for page cache'},
  {bad: 'Ignore UnderReplicatedPartitions', good: 'P0 page with ISR shrink rate'},
  {bad: '500k partitions “for scale”', good: 'Size partitions; watch recovery/FD/controller'},
  {bad: 'advertised.listeners=localhost', good: 'Reachable DNS per broker'},
  {bad: 'No reassignment throttle', good: 'Throttle replica move; protect ISR'},
  {bad: 'Combined controller starvation on huge cluster', good: 'Dedicated controller quorum'},
  {bad: 'Rolling upgrade without feature/compat plan', good: 'Docs upgrade path + canary'},
  {bad: 'Blindly raise num.io.threads', good: 'Fix disk/ISR first; then tune with idle metrics'},
  {bad: 'Blindly raise replication factor', good: 'Cost network×disk; only if durability needs it'},
  {bad: 'No disk headroom', good: 'Alert 70/80/90%; keep 30%+ free'},
  {bad: 'Ignore page cache pressure', good: 'Size RAM for active segments + replication'},
  {bad: 'No quotas', good: 'Per-tenant byte/request quotas'},
  {bad: 'No rack awareness', good: 'broker.rack on every broker'},
  {bad: 'Unbounded topic creation automation', good: 'Budgets + rate limits + review'},
  {bad: 'Ignore ISR shrink storms', good: 'Treat as early warning for disk/net'},
  {bad: 'Ignore disk latency', good: 'p99 disk is a first-class SLO'},
  {bad: 'No DR / multi-region plan', good: 'MM2/linking with honest RPO'},
  {bad: 'Stretch RF across WAN', good: 'Separate clusters; async replicate'},
  {bad: 'Ephemeral k8s disks', good: 'Persistent volumes; stable identity'},
  {bad: 'kill -9 rolling restarts', good: 'controlled.shutdown + URP gates'},
  {bad: 'One controller for “prod”', good: 'Odd quorum (3/5) across failure domains'},
  {bad: 'Assume RF=3 default', good: 'Kafka 4.x default RF is 1 — override'},
  {bad: 'No preferred leader election after moves', good: 'PLE to rebalance produce load'},
  {bad: 'Mixing OS swap with Kafka', good: 'swappiness low; don’t swap the broker'},
  {bad: 'No FD ulimit planning', good: 'Size for segments+indexes+sockets'},
  {bad: 'Security as plaintext “temporarily”', good: 'TLS+SASL+ACL from day one in prod'},
  {bad: 'Alert only on CPU', good: 'URP, offline, disk, idle%, quorum, p99'},
];

export const METRICS: string[][] = [
  ['UnderReplicatedPartitions', '0 steady', 'Growing URP', 'Lagging replicas / disk / net', 'Fix I/O; never unclean first'],
  ['OfflinePartitionsCount', '0', '>0', 'No electable ISR leader', 'Restore brokers; last-resort unclean'],
  ['ActiveControllerCount', '1 in cluster', '0 or flapping', 'Quorum/controller health', 'Restore voters'],
  ['IsrShrinksPerSec', 'Near 0', 'Sustained spikes', 'Lag / flaps', 'Stabilize resources'],
  ['RequestHandlerAvgIdlePercent', 'High idle', 'Persistently low', 'Disk/ISR/overload', 'Fix root; careful io threads'],
  ['NetworkProcessorAvgIdlePercent', 'High idle', 'Low', 'TLS/connections/net threads', 'Threads + connection limits'],
  ['RequestQueueSize', 'Stable low', 'Climbing', 'Handler saturation', 'Disk/load triage'],
  ['BytesIn / BytesOut', 'Per capacity plan', 'One broker skew', 'Leader imbalance / hot keys', 'PLE / reassign / re-key'],
  ['LogFlushTime / disk latency', 'Within SLO', 'Rising p99', 'Storage saturation', 'Media / load / JBOD'],
  ['LogCleaner metrics', 'Backlog draining', 'Stuck dirty ratio', 'Cleaner starved', 'Threads + I/O headroom'],
  ['JVM GC pause', 'Short', 'Multi-100ms+', 'Heap mis-size', 'Shrink heap; favor page cache'],
  ['ReplicaFetcher lag', 'Near 0', 'Growing', 'Slow follower path', 'Fetchers / disk / throttle'],
];

export const DECISIONS: string[][] = [
  ['Brokers?', 'From bytes×RF vs disk+NIC ceilings + AZ count — not a lucky number'],
  ['Partitions?', 'Consumer parallelism + key cardinality; cap per broker for recovery/FD'],
  ['RF?', 'Usually 3 for multi-AZ prod; 1 only for disposable'],
  ['Controllers?', '3 or 5 across AZs; dedicated when metadata fights data I/O'],
  ['Disk?', 'Storage formula + 30%+; prefer JBOD NVMe for hot'],
  ['Heap?', 'Modest; leave most RAM for page cache'],
  ['Network/io threads?', 'Raise only when idle metrics prove that pool is the bottleneck'],
  ['Add brokers?', 'When sustained resource ceilings hit — then reassign'],
  ['Add partitions?', 'When parallelism/keys need it — expect remapping cost'],
  ['Multi-region?', 'When RPO/RTO requires a second cluster — not stretched RF'],
];

export const CHEATS = {
  mental: `Data plane: Produce/Fetch → partition leader → log → followers fetch → ISR → HW
Control plane: KRaft quorum → metadata log → brokers' MetadataCache
Durability knobs: RF, ISR, minISR, unclean=false
Memory: page cache > heap for logs`,
  broker: `Acceptor → Processor → RequestQueue → Handler
→ ReplicaManager → UnifiedLog → page cache/disk
Controller not on Produce hot path`,
  kraft: `Odd Raft quorum owns metadata log
Active controller = Raft leader
Majority loss freezes metadata commits
Kafka 4.x: no ZooKeeper mode`,
  controller: `Topics, leaders, ISR, brokers, reassignment, configs
Brokers register + fence by epoch
Not every Produce`,
  partition: `Unit of order, parallelism, replication, storage
Leader + RF−1 followers
Preferred leader = first in assignment`,
  isr: `ISR = caught-up replicas
Leave if lag beyond replica.lag.time.max.ms
acks=all needs |ISR| ≥ min.insync.replicas
URP when |ISR| < RF`,
  election: `Prefer ISR member
Epoch++
Unclean = last resort data-loss risk
PLE restores preferred leaders for balance`,
  storage: `Partition = segments + indexes
Roll by size/time
Retention deletes closed segments
Compaction keeps latest key`,
  pagecache: `Logs in OS cache, not giant heaps
Fetch may sendfile
Broker RAM ≠ -Xmx`,
  network: `advertised.listeners = what clients dial
inter-broker listener for replica fetch
Wrong advertised = classic k8s foot-gun`,
  security: `TLS → SASL → ACL
Rotate certs with overlap
IDEMPOTENT_WRITE + CLUSTER_ACTION matter`,
  capacity: `Storage = events×size×retention×RF + headroom
Net = ingress + (RF-1)×repl + egress
Partitions cost recovery/FD/controller`,
  monitoring: `P0: offline, quorum, disk full, broker down
P1: URP, ISR thrash, idle%, disk latency, p99
Idle metrics beat guessing thread knobs`,
  troubleshooting: `URP → lagging replica → disk/net/CPU
Offline → empty ISR → restore / unclean last
Latency → idle% + disk + ISR + quotas
Slow restart → partitions/segments/unclean`,
  dr: `Multi-AZ inside region with rack-aware RF
Multi-region = second cluster + MM2/linking
Honest RPO = link lag; offsets are local`,
  design: `Math from bytes and failure domains
Override lab defaults
Chaos-test AZ loss and quorum loss`,
  interview: `1) Produce path inside broker
2) ISR / HW / LEO / LSO
3) Leader crash sequence
4) Unclean election trade-off
5) KRaft quorum loss
6) Page cache vs heap
7) Disk full / URP
8) 3-AZ RF=3 design
9) Add broker (no auto-balance)
10) Hot broker / hot partition
11) Partition count costs
12) Rolling upgrade`,
};
