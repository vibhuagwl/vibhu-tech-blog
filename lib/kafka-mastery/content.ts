export const MEMORY_SENTENCE =
  'Producer batches to the partition leader. Cluster stores RF copies; controller elects leaders. Consumers pull by offset in a group. Size brokers by disk×RF, consumers by partitions, partitions by parallelism. Monitor lag, ISR, under-replicated, and rebalances — not CPU alone.';

export const REJECTION_KILLERS = [
  {
    trap: '“Kafka deletes the message when the consumer reads it.”',
    fix: 'Log model. Retention deletes. Consume only moves a cursor (__consumer_offsets).',
  },
  {
    trap: '“I’ll add more consumer pods and lag will drop.”',
    fix: 'In one group, useful members ≤ partitions. Extra pods idle. Raise partitions (with a plan) or fix processing time.',
  },
  {
    trap: '“acks=1 is fine for payments.”',
    fix: 'Leader can die before followers catch up. Payments: acks=all + min.insync.replicas=2 + idempotence.',
  },
  {
    trap: '“Same consumer always retries the same message.”',
    fix: 'Group + committed offset. Any member that inherits the partition may replay. Need idempotency.',
  },
  {
    trap: '“RF=3 on one broker / one AZ is HA.”',
    fix: 'Replicas must live on different brokers and racks. Floor = 3 brokers in 3 failure domains.',
  },
  {
    trap: '“I set 1000 partitions for future scale.”',
    fix: 'Partitions cost memory, elect leaders, and hurt rebalances. Size from measured parallelism; grow with a migration story.',
  },
];

export const PRODUCER_FLOW = `send()
  → serialize key/value
  → partitioner (hash key → partition)
  → accumulator (batch by topic-partition)
  → wait linger.ms / fill batch.size
  → compress (zstd/lz4/snappy)
  → ProduceRequest to LEADER broker
  → wait acks (0 / 1 / all)
  → retry with idempotent PID+seq if enabled`;

export const PRODUCER_ROWS: string[][] = [
  ['Role', 'App that appends records to a topic. Never writes a follower.'],
  ['Key decision', 'Key = ordering + partitioning. Null key = round-robin / sticky.'],
  ['Durability', 'acks=all + enable.idempotence=true for money paths.'],
  ['Throughput', 'linger.ms + batch.size + compression.type.'],
  ['Ordering under retry', 'Idempotence + max.in.flight.requests.per.connection ≤ 5.'],
  ['Transactions', 'transactional.id when you need atomic multi-partition produce / EOS pipe.'],
  ['Instances', 'Scale producers with app pods. Each pod = producer client(s). No Kafka-imposed max.'],
  ['Interview line', 'I send keyed events to the leader, wait for ISR with acks=all, batch+compress, idempotent retries.'],
];

export const CONSUMER_FLOW = `subscribe(topic) / assign
  → join group (coordinator)
  → get partition assignment (≤1 owner per partition in group)
  → poll() fetch from leader up to HW
  → process side effects (DB / bank)
  → commit offset (manual for payments)
  → on crash: resume from last commit (at-least-once)`;

export const CONSUMER_ROWS: string[][] = [
  ['Role', 'App that pulls records and tracks progress with offsets.'],
  ['Group', 'group.id = load-balancing unit. Same group → share partitions. Different group → full fan-out.'],
  ['Ownership', 'One live member owns a given partition. Two members never both process it in the same group.'],
  ['Commit', 'enable.auto.commit=false for payments. Commit after durable, idempotent side effect.'],
  ['Failure', 'Crash before commit → replay. Crash after commit → skip for this group. JVM identity irrelevant.'],
  ['Lag', 'log-end-offset − consumer-offset. Fix processing, poll budget, or partitions — not “more pods” blindly.'],
  ['Instances', 'Useful consumers in a group ≤ partition count. Extra sit idle after rebalance.'],
  ['Interview line', 'I poll, process idempotently, then commit. Lag is a processing budget problem before it is a Kafka problem.'],
];

export const CLUSTER_ROWS: string[][] = [
  ['Broker', 'Stores partition replicas. Serves produce/fetch. Disk + network appliance.'],
  ['Controller (KRaft)', 'Metadata quorum. Elects leaders, tracks ISR, broker membership. Not on the data path for every produce.'],
  ['Topic', 'Named stream. Config: partitions, RF, retention, cleanup policy.'],
  ['Partition', 'Ordered log. Unit of parallelism and ordering.'],
  ['Replica', 'Copy of a partition. One leader, RF−1 followers on other brokers.'],
  ['ZooKeeper (legacy)', 'Old metadata. Do not start new ZK clusters in 2026 — use KRaft.'],
];

export const OPT_PRODUCER: string[][] = [
  ['Throughput up', 'Raise linger.ms + batch.size, keep compression (zstd)', 'Latency ↑'],
  ['Latency down', 'Lower linger, smaller batches', 'Throughput ↓'],
  ['Safe retries', 'enable.idempotence=true, retries>0', 'Config coupling with max.in.flight'],
  ['Less network', 'compression.type=zstd/lz4', 'CPU ↑'],
  ['Durability', 'acks=all', 'p99 ↑ slightly'],
];

export const OPT_CONSUMER: string[][] = [
  ['Lag, CPU low', 'Downstream slow — timeouts, pool, bulkhead', 'Not a linger fix'],
  ['Rebalance storms', 'Lower max.poll.records; raise max.poll.interval carefully; CooperativeSticky', 'Masking a stuck worker if interval too high'],
  ['More pods, same lag', 'Partitions saturated — add partitions or split topics', 'Rekey / migration cost'],
  ['Duplicates', 'Manual commit + UNIQUE/idempotency store', 'Never “trust Kafka alone”'],
];

export const OPT_BROKER: string[][] = [
  ['Disk pressure', 'Retention, compaction, tiered storage, more brokers', 'Do not shrink RF'],
  ['Under-replicated', 'Slow follower disk/net; ISR shrink alerts', 'Fix hardware before raising minISR'],
  ['Hot partitions', 'Key cardinality, custom partitioner, split whales', 'More consumers will not help one hot key'],
  ['Controller load', 'Dedicated KRaft controllers on large clusters', 'Combined roles OK when small'],
];

export const OPT_CONTROLLER: string[][] = [
  ['Quorum size', '3 or 5 controllers (odd)', 'Even size wastes a vote'],
  ['Placement', 'One controller per AZ when possible', 'AZ loss should not kill metadata'],
  ['Combined role', 'process.roles=broker,controller for small', 'Split when metadata fights log I/O'],
  ['Leader balance', 'Preferred leader election / auto rebalance', 'All leaders on 2 brokers melts NICs'],
];

export const PROPS_PRODUCER: string[][] = [
  ['acks', 'all', 'Wait for ISR (≥ min.insync.replicas)'],
  ['enable.idempotence', 'true', 'Safe produce retries (PID+seq)'],
  ['retries', '≥10 (or MAX)', 'Transient leader/network blips'],
  ['linger.ms', '5–50', 'Batching wait'],
  ['batch.size', '32–64 KB', 'Accumulator fill target'],
  ['compression.type', 'zstd', 'Network vs CPU'],
  ['buffer.memory', '32–64 MB', 'Accumulator RAM'],
  ['max.in.flight.requests.per.connection', '5', 'With idempotence — keep ≤5'],
  ['key.serializer / value.serializer', 'String + Json/Avro', 'Stable contracts'],
  ['transactional.id', 'per-pod unique', 'Only if using transactions'],
  ['delivery.timeout.ms', 'tuned', 'Total time for send success including retries'],
  ['security.protocol / sasl.*', 'SASL_SSL', 'Prod NO-GO without auth'],
];

export const PROPS_CONSUMER: string[][] = [
  ['group.id', 'stable name', 'Load-balance + offset namespace'],
  ['enable.auto.commit', 'false', 'Payments: commit after side effect'],
  ['auto.offset.reset', 'earliest|latest|none', 'Only when no committed offset'],
  ['max.poll.records', '10–500', 'Work per poll'],
  ['max.poll.interval.ms', '> longest processing', 'Avoid rebalance while working'],
  ['session.timeout.ms', '10–45s', 'Liveness'],
  ['heartbeat.interval.ms', '< session/3', 'Stay in group'],
  ['partition.assignment.strategy', 'CooperativeSticky', 'Smoother deploys'],
  ['isolation.level', 'read_committed', 'If producers are transactional'],
  ['fetch.min.bytes / fetch.max.wait.ms', 'tuned', 'Fetch batching'],
  ['allow.auto.create.topics', 'false', 'Client-side guard'],
];

export const PROPS_CLUSTER: string[][] = [
  ['num.partitions (default)', 'intentional', 'Default for auto-created — prefer explicit topics'],
  ['default.replication.factor', '3', 'Prod RF'],
  ['min.insync.replicas', '2', 'With acks=all'],
  ['unclean.leader.election.enable', 'false', 'No silent data loss'],
  ['auto.create.topics.enable', 'false', 'No typo topics'],
  ['log.retention.hours / bytes', 'business window', 'Replay horizon — not “until consumed”'],
  ['log.segment.bytes', '1 GB typical', 'Segment roll'],
  ['message.max.bytes', 'bounded', 'Stop giant payloads'],
  ['replica.fetch.max.bytes', '≥ message max', 'Followers can sync large records'],
  ['num.replica.fetchers', 'tuned', 'Follower catch-up parallelism'],
  ['log.dirs', 'dedicated disks', 'No NFS'],
];

export const PROPS_CONTROLLER: string[][] = [
  ['process.roles', 'broker / controller / both', 'KRaft role split'],
  ['controller.quorum.voters', 'id@host:port…', 'Odd-sized quorum'],
  ['node.id', 'unique', 'Stable identity'],
  ['controller.listener.names', 'CONTROLLER', 'Metadata plane listener'],
  ['metadata.log.dir', 'fast local disk', 'Raft log durability'],
];

export const MONITOR_ROWS: string[][] = [
  ['Under-replicated partitions', 'Replicas behind — disk/net/broker health', 'P0 if growing'],
  ['ISR shrink / expand rate', 'Follower instability', 'Correlate with produce errors'],
  ['Active controller count', 'Must be 1 active in ZK era; KRaft quorum healthy', 'Split brain / no controller = outage'],
  ['Produce / fetch request latency', 'p99 to clients', 'Broker or network bottleneck'],
  ['Disk usage % per log dir', 'Retention failing / traffic spike', 'Produce will fail when full'],
  ['Network bytes in/out', 'Saturation vs batching', 'Compression opportunity'],
  ['Consumer group lag', 'Per partition lag + max lag', 'SLO for settlement'],
  ['Rebalance rate / join rate', 'Deploy storms, poll interval, session timeout', 'Throughput killer'],
  ['Offline partitions', 'No leader', 'Immediate incident'],
  ['Failed produce (NotEnoughReplicas)', 'ISR < minISR', 'Durability protecting you — fix capacity'],
];

export const INSTANCE_HEADERS = ['Component', 'What “instance” means', 'Distributed production default', 'How to scale'];
export const INSTANCE_ROWS: string[][] = [
  ['Producer apps', 'payment-api pods with KafkaProducer', 'N app replicas behind LB (2–N). Not tied to partition count.', 'Scale on CPU/RPS. Each pod opens its own producer.'],
  ['Consumer apps', 'settlement-worker pods in one group.id', 'Start = partition count. Never expect gain beyond that.', 'Add partitions (planned) then add pods. Or split topics.'],
  ['Brokers', 'Kafka data nodes', '3 minimum (3 AZs). Often 5–7+.', 'Add brokers + reassign partitions. Size disk for retention×RF.'],
  ['Controllers', 'KRaft metadata quorum', '3 (or 5). Combined OK if small.', 'Dedicated controllers when cluster is large.'],
  ['Cluster', 'One Kafka deployment (one metadata quorum)', 'Usually 1 shared cluster + quotas. 2nd cluster for blast radius / DR.', 'Do not create a cluster per microservice by default.'],
  ['Schema Registry', 'Separate HA service', '2–3', 'Not on broker disks.'],
  ['Connect workers', 'Separate runtime', '2–3+', 'Scale tasks; keep off broker JVMs.'],
];

export const SYNC_STEPS: string[][] = [
  ['1', 'Producer sends to the partition leader only.'],
  ['2', 'Leader appends to its local log and advances LEO.'],
  ['3', 'Follower brokers run replica fetchers and pull bytes from the leader (pull, not push).'],
  ['4', 'When a follower catches up within replica.lag.time.max.ms, it stays in / rejoins ISR.'],
  ['5', 'With acks=all, leader waits until ISR size ≥ min.insync.replicas before ACK.'],
  ['6', 'High watermark advances — consumers may read those offsets.'],
  ['7', 'If leader dies, controller elects a new leader from ISR. Clients refresh metadata and continue.'],
];

export const PARTITION_FORMULA = `partitions ≥ max(
  peak_consumer_parallelism_needed,
  ceil(peak_produce_rate / produce_rate_per_partition),
  ceil(peak_consume_rate / consume_rate_per_partition)
)

Then add ~20–50% headroom.
Prefer fewer well-sized partitions over thousands “for later”.`;

export const PARTITION_ROWS: string[][] = [
  ['Ordering need', 'One key → one partition. Global order ⇒ 1 partition (hurts scale).'],
  ['Consumer parallelism', 'Max useful consumers in a group = partition count.'],
  ['Produce rate', 'Each partition has a leader throughput ceiling (disk/net).'],
  ['Broker count', 'Spread leaders across brokers; avoid all hot partitions on one broker.'],
  ['Rebalance cost', 'More partitions ⇒ longer/ heavier rebalances and more open files.'],
  ['Change later', 'Increasing partitions is possible but does not rebalance old keys. Decreasing is painful.'],
  ['Interview default', 'Start from measured consumer work: if one worker does 2k msg/s and you need 20k ⇒ ~10 partitions + headroom.'],
];

export const PARTITION_EXAMPLES: string[][] = [
  ['Low traffic admin events', '3–6', 'RF=3, few consumers'],
  ['Payments bus ~5–20k/s', '12–48', 'Match worker count; watch hot account keys'],
  ['Clickstream 100k+/s', '100–300+', 'Many brokers; careful with consumer memory'],
  ['“Future proof 1000”', 'Usually wrong', 'Cost now; rebalance pain; fix when metrics demand'],
];

export const FIVE_MIN = [
  'Producer: key → leader → batch → compress → acks=all → idempotent retry.',
  'Consumer: group owns partitions → poll → process → commit. Crash before commit = replay.',
  'Cluster: 3 brokers / 3 AZs / RF=3 / minISR=2. Controller = KRaft quorum of 3.',
  'Sync: followers fetch; ISR; HW; consumers read HW.',
  'Size: producers = app pods; consumers ≤ partitions; partitions from parallelism math; monitor lag + ISR + URP.',
];

export const SIXTY_SEC =
  'I explain Kafka in layers. Producer sends keyed records to the partition leader with batching, compression, acks=all and idempotence. Brokers store RF=3 copies; followers fetch; the controller manages leaders and ISR. Consumers in a group pull and commit offsets after idempotent side effects. In production I run at least three brokers across AZs, size partitions from parallelism, keep consumers ≤ partitions, and alert on lag, under-replicated partitions, and ISR shrinks.';
