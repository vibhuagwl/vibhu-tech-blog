export const MEMORY_SENTENCE =
  'Kafka is an append-only distributed log. Produce to the partition leader. Followers fetch copies. Consumers pull up to the high watermark. Offsets are the cursor — crash before commit and the group re-reads.';

export const TWO_MINUTE_STORY = `I treat Kafka as a replicated commit log, not a queue. A payment event is keyed by accountId so one partition keeps order. The producer talks only to that partition's leader. The leader appends the record, assigns the next offset, and followers fetch the bytes until they join the ISR. With acks=all and min.insync.replicas=2, the produce ACK waits for a majority of replicas, then the high watermark moves and consumers may read it.

Consumers in one group split partitions: one live member per partition. Kafka never deletes on consume. Progress is a committed offset in __consumer_offsets. If a worker dies after writing the ledger but before commit, a restarted member — not necessarily the same JVM — re-reads those offsets. That is at-least-once. Payments stay correct with idempotency keys, not by hoping the same consumer comes back.`;

export const SIXTY_SEC =
  'Log, not queue. Leader writes, followers fetch, ISR is the durability set. RF=3, minISR=2, acks=all, KRaft quorum of 3, at least 3 brokers. Consume does not delete. Same group re-reads uncommitted offsets after a crash; different groups each have their own cursor.';

export const FIVE_MIN = [
  'Start from the payment story: produce keyed events, consume with manual commit, DLQ poison.',
  'Draw one partition as a log: offsets 0..N, segments on disk, HW vs LEO.',
  'Show 3 brokers, RF=3, one leader + two followers fetching.',
  'State instance counts: 3 brokers minimum, 3 KRaft controllers, consumers ≤ partitions in a group.',
  'Close with consumer crash: same group, uncommitted → replay; committed → skip; identity of the JVM is irrelevant.',
];

export const ANATOMY_ROWS: string[][] = [
  ['Topic', 'Named stream. Split into partitions for scale and ordering.'],
  ['Partition', 'Ordered, immutable log. Unit of parallelism and of ordering.'],
  ['Offset', 'Monotonic index of a record inside one partition. Not global.'],
  ['Broker', 'Process that stores replica data and serves produce/fetch.'],
  ['Controller', 'Metadata brain: leaders, ISR, membership. KRaft quorum today.'],
  ['Replica', 'Copy of a partition. One leader, RF-1 followers.'],
  ['ISR', 'In-sync replicas that have caught up. Durability set for acks=all.'],
  ['LEO', 'Log end offset — next offset the replica will append.'],
  ['HW', 'High watermark — last offset known replicated to the ISR. Consumers typically read < HW.'],
  ['Consumer group', 'Load-balanced consumers. One live member owns a given partition.'],
];

export const INSTANCE_HEADERS = ['Role', 'Laptop / lab', 'Small production', 'Busy payments cluster'];
export const INSTANCE_ROWS: string[][] = [
  ['Brokers', '1', '3 (hard floor for RF=3)', '5–7+ sized by disk, network, partition count'],
  ['KRaft controllers', '1 combined', '3 (combined OK)', '3 or 5 dedicated controllers'],
  ['Replication factor', '1', '3', '3 (rarely 4+; cost vs extra durability)'],
  ['min.insync.replicas', '1', '2', '2 with acks=all'],
  ['ZooKeeper (legacy)', '1', '3', '5 — prefer KRaft; do not start new ZK clusters'],
  ['Consumers in one group', '1', '≤ partition count', 'Scale pods to partitions; extra members sit idle'],
  ['Schema Registry (if used)', '1', '2–3', 'HA pair / 3, not on broker disks'],
];

export const WRITE_STEPS: string[][] = [
  ['1. Key → partition', 'Partitioner hashes the record key (accountId). Null key round-robins. Order is per partition only.'],
  ['2. Metadata', 'Producer already cached which broker is leader for that partition. Stale metadata → refresh and retry.'],
  ['3. ProduceRequest', 'Batched, compressed records go to the leader. Idempotent producer stamps PID + sequence.'],
  ['4. Append', 'Leader writes sequentially into the active log segment (page cache + disk). Next offset assigned.'],
  ['5. Replicate', 'Followers fetch from the leader. They do not receive a push. Catch-up stays in ISR; lag drops them.'],
  ['6. ACK', 'acks=0 fire-and-forget. acks=1 leader only. acks=all waits until ISR size ≥ min.insync.replicas.'],
  ['7. High watermark', 'HW advances when ISR replicas have the offset. Consumers fetch up to HW, not uncommitted LEO.'],
];

export const REPLICA_ROWS: string[][] = [
  ['Who writes?', 'Only the leader appends client data. Followers copy by fetching.'],
  ['How do copies move?', 'Replica fetcher threads on followers pull Produce-equivalent bytes from the leader.'],
  ['When is it durable?', 'acks=all + minISR=2 means at least two brokers have the record before the producer gets success.'],
  ['Who can become leader?', 'Controller elects from ISR (preferred). unclean.leader.election.enable=false in prod.'],
  ['What if a follower is slow?', 'It leaves ISR. Produces still succeed if remaining ISR ≥ minISR; otherwise produces fail.'],
  ['Do consumers read replicas?', 'Classic clients read the leader. Follower-fetch exists but is not the interview default.'],
];

export const CONSUMER_FAIL_ROWS: string[][] = [
  ['Kafka delete on consume?', 'No. Retention is time/size. Many groups can read the same log.'],
  ['Same JVM after crash?', 'Not guaranteed. Member id dies. Group coordinator reassigns the partition.'],
  ['Crash before commit', 'Group resumes from last committed offset → same records again (at-least-once).'],
  ['Crash after commit', 'Those offsets are done for this group → no re-read (skip / at-most-once if you committed too early).'],
  ['Another group', 'Independent cursor. They can (and will) read the same messages.'],
  ['Same group, two live members', 'A partition is assigned to at most one of them. They do not both process it.'],
];

export const PROD_CHECKLIST: string[] = [
  'KRaft (no new ZooKeeper). Controller quorum 3 or 5.',
  'At least 3 brokers in 3 racks/AZs. RF=3, min.insync.replicas=2, unclean leader election off.',
  'Producer: acks=all, enable.idempotence=true, retries bounded with max.in.flight.requests.per.connection=5 (idempotent-safe).',
  'Consumer: enable.auto.commit=false for money paths. Commit after durable side effects. Idempotency key in DB.',
  'Disk: dedicated volumes, sequential I/O, XFS/ext4, no NFS. Size for retention × RF, not “until consumed”.',
  'Partitions: start from consumer parallelism and peak produce rate. Revisit; shrinking is painful.',
  'Monitor: under-replicated partitions, ISR shrinks, request latency, disk, consumer lag, rebalance rate.',
];

export const MISTAKES: {title: string; bad: string; good: string}[] = [
  {
    title: 'One fat broker',
    bad: 'RF=3 on a single node, or 1 broker in “prod”. A disk death loses the cluster.',
    good: 'RF copies live on different brokers and racks. Three brokers is the floor, not a trophy.',
  },
  {
    title: 'Treat consume as delete',
    bad: 'Assume a failed consumer “lost” the message, or that restarting the same pod is required to retry.',
    good: 'The log is still there. The group cursor decides replay. Any live member can pick up the partition.',
  },
  {
    title: 'Commit then process',
    bad: 'auto.commit or commitSync before the ledger write. Crash → skipped payment.',
    good: 'Process (idempotently) then commit. Duplicate delivery is recoverable; skipped money is not.',
  },
  {
    title: 'More consumers than partitions',
    bad: 'Scale the group to 40 pods on a 12-partition topic and expect 40× throughput.',
    good: 'Idle members wait. Raise partitions (with a migration plan) or split topics.',
  },
  {
    title: 'acks=1 for payments',
    bad: 'Leader ACK, then the leader dies before followers catch up → lost produce that the API already called success.',
    good: 'acks=all + minISR=2. Fail the produce rather than lie about durability.',
  },
];

export const CHEAT_ROWS: string[][] = [
  ['Ordering', 'Per partition, not per topic. Key = order boundary.'],
  ['Parallelism', 'Partitions × consumer groups. In one group: min(members, partitions).'],
  ['Durability', 'RF × ISR × acks × minISR. Replication, not fsync-every-message.'],
  ['Delivery (typical)', 'At-least-once. Exactly-once needs EOS and/or idempotent effects.'],
  ['Consumer identity', 'group.id + assigned partitions + committed offset. Not pod name.'],
  ['Disk model', 'Append-only segments + offset index + time index. Sequential wins.'],
];
