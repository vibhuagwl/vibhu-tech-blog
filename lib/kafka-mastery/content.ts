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
