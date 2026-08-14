import type {InterviewQ} from './types';

export const SENIOR: InterviewQ[] = [
  {
    id: 's1',
    topic: 'Lifecycle',
    question: 'What exactly happens when producer.send() is called?',
    answer30s:
      'Validate, serialize, refresh metadata if needed, pick partition, append into RecordAccumulator. Sender thread later compresses and ProduceRequests the leader, then completes the Future/callback after acks.',
    answer2m:
      'Application threads do not usually perform the TCP write. They may block up to max.block.ms for metadata or buffer memory. Batching is governed by batch.size and linger.ms. With acks=all the leader waits for ISR before success.',
    followUps: ['Which thread runs the callback?', 'When does send() block?'],
  },
  {
    id: 's2',
    topic: 'Acks',
    question: 'acks=1 vs acks=all — exact durability trade-off?',
    answer30s:
      'acks=1: leader append is enough — loss if leader dies before followers catch up. acks=all: ISR must ack (≥ min.insync.replicas) — fails rather than under-replicate.',
    answer2m:
      'Pair acks=all with RF=3 and minISR=2 for payments. Idempotence requires acks=all. acks=0 is fire-and-forget and unsuitable for money.',
    followUps: ['What if minISR cannot be met?'],
    trick: '“acks=1 is durable because the leader wrote to disk.”',
  },
  {
    id: 's3',
    topic: 'Idempotence',
    question: 'How do PID, epoch, and sequence numbers prevent duplicates?',
    answer30s:
      'Broker stores per-PID per-partition sequences. A retry with the same PID+epoch+seq is not appended again. Epoch fencing invalidates zombies.',
    answer2m:
      'This prevents duplicate log appends from producer retries in one session. It does not dedupe two application send() calls or consumer redelivery side effects.',
    followUps: ['OutOfOrderSequenceException?', 'UnknownProducerId?'],
  },
  {
    id: 's4',
    topic: 'In-flight',
    question: 'How can max.in.flight.requests.per.connection reorder records?',
    answer30s:
      'With retries and in-flight>1 without idempotence, a later batch can succeed before an earlier retried batch, swapping order.',
    answer2m:
      'Idempotent producer allows in-flight up to 5 while preserving per-partition order. Above 5 is incompatible with idempotence because brokers retain limited batch state.',
    followUps: ['Why default is 5?'],
  },
  {
    id: 's5',
    topic: 'Timeout',
    question: 'Producer times out but the record may already exist — what now?',
    answer30s:
      'Treat as unknown outcome. Idempotent retry is safe for the same produce. Application must still be idempotent if it issues a new logical send.',
    answer2m:
      'Never interpret timeout as definite failure. delivery.timeout.ms exhausted means the client gave up; broker may have committed. Design with idempotence keys at the business layer.',
    followUps: ['Difference vs NotEnoughReplicas?'],
  },
  {
    id: 's6',
    topic: 'Ordering',
    question: 'How do you guarantee ordering per account?',
    answer30s:
      'Use accountId as key so all account events land in one partition; one producer writer path; idempotence on; consumers process that partition sequentially.',
    answer2m:
      'Kafka does not order across partitions. Hot accounts need sharding strategies that preserve a declared order boundary. Partition count changes remapping for new keys.',
    followUps: ['Multiple producer pods writing same account?'],
  },
  {
    id: 's7',
    topic: 'Memory',
    question: 'What happens when producer memory is exhausted?',
    answer30s:
      'RecordAccumulator/BufferPool blocks send up to max.block.ms, then TimeoutException. That is backpressure.',
    answer2m:
      'Fix produce vs broker mismatch, raise buffer.memory carefully, reduce fanout of partitions with huge batch.size, or shed load. Ignoring this creates cascading app thread pileups.',
    followUps: ['Which metric?'],
  },
  {
    id: 's8',
    topic: 'Metadata',
    question: 'What happens when metadata becomes stale?',
    answer30s:
      'Produce to old leader fails with NotLeader*; client refreshes metadata and retries.',
    answer2m:
      'Bootstrap servers are only the discovery seed. Metadata cache ages out via metadata.max.age.ms and error-driven refresh. Idempotence keeps retries safe.',
    followUps: ['Do you need every broker in bootstrap.servers?'],
  },
  {
    id: 's9',
    topic: 'Transactions',
    question: 'When do you use Kafka transactions vs outbox?',
    answer30s:
      'Kafka transactions for atomic Kafka multi-write / EOS pipe. Outbox when the database commit must not diverge from the event.',
    answer2m:
      'Kafka txn does not enlist JDBC. Dual-write without outbox/CDC is a classic money bug. transactional.id must be unique per live instance for fencing.',
    followUps: ['read_committed?', 'ProducerFencedException?'],
    trick: '“Kafka transactions give exactly-once payments into Postgres.”',
  },
  {
    id: 's10',
    topic: 'Scale',
    question: 'Design a producer for 1M events/sec.',
    answer30s:
      'Batch+compress, many partitions, enough brokers for disk/net, multiple app instances reusing producers, acks=all with capacity for ISR, observe queue-time and throttle.',
    answer2m:
      'Compute bytes/s, replication amplification, serialization CPU. Avoid sync get(). Shard keys to avoid hot partitions. Separate produce SLOs from consumer lag SLOs.',
    followUps: ['How many producer instances?'],
  },
];

export const ARCHITECT: InterviewQ[] = [
  {
    id: 'a1',
    topic: 'DR',
    question: 'Multi-region producer failover design?',
    answer30s:
      'Do not stretch one RF across high RTT WAN. Dual cluster + MirrorMaker/Cluster Linking or active-active with idempotent business keys.',
    answer2m:
      'Failover can duplicate. Transactions and PID state are cluster-local. Prefer outbox + deterministic event ids. Document RPO/RTO honestly.',
    followUps: ['Active-active ordering?'],
  },
  {
    id: 'a2',
    topic: 'Finance',
    question: 'Prevent duplicate financial transactions end-to-end.',
    answer30s:
      'Idempotent producer for transport retries; unique paymentAttemptId in DB; outbox for DB↔Kafka; consumer upsert by key.',
    answer2m:
      'Timeout-after-write is expected. Never charge PSP solely because Kafka acked. State machine: INIT→PRODUCED→SETTLED with unique constraints.',
    followUps: ['Where is the source of truth?'],
  },
  {
    id: 'a3',
    topic: 'Perf',
    question: 'Latency rises from 10ms to 500ms — war room steps?',
    answer30s:
      'Split record-queue-time vs request-latency. Check broker disk/URP/ISR, throttle metrics, GC, linger changes, network.',
    answer2m:
      'If queue-time dominates → client batching/backpressure. If request-latency dominates → broker/ISR/network. Do not flip compression mid-incident without a hypothesis.',
    followUps: ['Which three Grafana panels?'],
  },
  {
    id: 'a4',
    topic: 'Hot key',
    question: 'One partition receives 80% of traffic.',
    answer30s:
      'Key skew. More consumers will not help that partition. Re-key, isolate whale accounts, or sub-shard with care for order.',
    answer2m:
      'Custom partitioner can spread load but changes ordering semantics — make that explicit in the contract.',
    followUps: ['Can sticky null keys cause this?'],
  },
  {
    id: 'a5',
    topic: 'EOS',
    question: 'What does exactly-once actually mean for producers?',
    answer30s:
      'Idempotent produce: exactly one log append per produce attempt identity. Transactions: atomic multi-partition produce visibility.',
    answer2m:
      'read_committed consumers skip aborted. Side effects outside Kafka are not covered. Staff answer separates Kafka EOS from business EOS.',
    followUps: ['EOS read-process-write?'],
  },
  {
    id: 'a6',
    topic: 'ACK loss',
    question: 'Broker wrote the record, crashed, ACK never arrived — producer retries. What happens?',
    answer30s:
      'Idempotent + acks=all: same PID+seq, broker dedupes, one log record. Without idempotence: retry can duplicate. acks=1 also risks loss if the write never reached ISR.',
    answer2m:
      'Timeout is unknown, not failure. Walk the matrix: idempotence off/on, acks=1 vs all, transactions (uncommitted vs committed). Payments still need a business idempotency key because the application may issue a new send with a new sequence.',
    followUps: ['What does the callback see?', 'Unclean leader election?'],
    trick: '“Timeout means it was not written.”',
  },
  {
    id: 'a7',
    topic: 'Fencing',
    question: 'Producer A and B share transactional.id. B starts. A sends.',
    answer30s:
      'B’s InitProducerId bumps epoch. A is fenced. A’s send/commit fails with ProducerFencedException. A must die; do not reuse that instance.',
    answer2m:
      'Rolling deploys and k8s restarts must use unique transactional.id per live pod, or accept that the new replica fences the old one. Network-partition zombies are why fence is fatal.',
    followUps: ['Idempotent producer without transactional.id?'],
  },
  {
    id: 'a8',
    topic: 'Partitions',
    question: 'Partition count changes. Same key. Where does the next record go?',
    answer30s:
      'hash(key) % newCount — often a different partition. Old records stay put. Per-key order across the change is not preserved.',
    answer2m:
      'This is why “just add partitions for scale” is a contract change for keyed ordering. Migrate with a new topic or accept a split window. Never tell an interviewer that remapping keeps order.',
    followUps: ['Can you decrease partitions?'],
    trick: 'Increasing partitions preserves per-key order.',
  },
];

export const RAPID: InterviewQ[] = [
  {id: 'r1', topic: 'Rapid', question: 'Is KafkaProducer thread-safe?', answer30s: 'Yes — reuse one instance.', answer2m: 'Sender is internal.', followUps: ['Per-request producer?']},
  {id: 'r2', topic: 'Rapid', question: 'Default linger.ms in Kafka 4.x?', answer30s: '5 ms.', answer2m: 'Was 0 before 4.0.', followUps: ['Why changed?']},
  {id: 'r3', topic: 'Rapid', question: 'Default enable.idempotence?', answer30s: 'true (if no conflicts).', answer2m: 'Since 3.0+ era.', followUps: ['Requires acks?']},
  {id: 'r4', topic: 'Rapid', question: 'Who assigns offset?', answer30s: 'Partition leader.', answer2m: 'Returned in RecordMetadata.', followUps: ['acks=0 offset?']},
  {id: 'r5', topic: 'Rapid', question: 'bootstrap.servers purpose?', answer30s: 'Discovery seed.', answer2m: 'Not permanent single dependency.', followUps: ['How many to list?']},
  {id: 'r6', topic: 'Rapid', question: 'delivery vs request timeout?', answer30s: 'Delivery = total budget; request = one attempt.', answer2m: 'delivery ≥ linger + request.', followUps: ['Retries default?']},
  {id: 'r7', topic: 'Rapid', question: 'zstd vs gzip?', answer30s: 'Prefer zstd/lz4 for CPU/ratio.', answer2m: 'gzip often heavier.', followUps: ['Batch dependency?']},
  {id: 'r8', topic: 'Rapid', question: 'ProducerFencedException means?', answer30s: 'Newer epoch with same transactional.id.', answer2m: 'Stop the zombie.', followUps: ['When?']},
  {id: 'r9', topic: 'Rapid', question: 'Null key partition today?', answer30s: 'Sticky batching to a partition.', answer2m: 'Verify client version.', followUps: ['Explicit partition?']},
  {id: 'r11', topic: 'Rapid', question: 'flush() vs close()?', answer30s: 'flush waits; close flushes then dies.', answer2m: 'close(Duration) may drop remainder.', followUps: ['k8s preStop?']},
  {id: 'r12', topic: 'Rapid', question: 'Throttle metric name?', answer30s: 'produce-throttle-time-avg/max.', answer2m: 'Not the same as linger.', followUps: ['Quota entity?']},
  {id: 'r13', topic: 'Rapid', question: 'Who does producer write — leader or follower?', answer30s: 'Leader only.', answer2m: 'Follower fetch is a consumer/read feature.', followUps: ['broker.rack?']},
  {id: 'r14', topic: 'Rapid', question: 'advertised.listeners bug?', answer30s: 'Bootstrap works, Produce fails to localhost/internal DNS.', answer2m: 'Metadata returns advertised hosts.', followUps: ['k8s headless?']},
  {id: 'r15', topic: 'Rapid', question: 'Fatal after ProducerFenced?', answer30s: 'Close producer. Do not send more.', answer2m: 'New instance / new epoch.', followUps: ['Rolling deploy?']},
];

export const ALL: InterviewQ[] = [...SENIOR, ...ARCHITECT, ...RAPID];
