import type {InterviewQ} from './types';

export const SENIOR: InterviewQ[] = [
  {
    id: 's1',
    topic: 'poll()',
    question: 'What exactly happens when poll() is called?',
    answer30s:
      'Maintains group membership/heartbeats/rebalance as needed, drives fetches, deserializes, and returns up to max.poll.records from internal buffers.',
    answer2m:
      'It is not a single-message read API. Skipping poll long enough trips max.poll.interval. Position advances as records are returned, not when business logic finishes.',
    followUps: ['Where do heartbeats run?', 'What does max.poll.records limit?'],
    trick: '“poll() only reads from Kafka.”',
  },
  {
    id: 's2',
    topic: 'Offsets',
    question: 'Position vs committed offset vs lag?',
    answer30s:
      'Position is next fetch offset. Committed is last durable group offset in __consumer_offsets. Lag is end minus one of those — specify which.',
    answer2m:
      'After poll returns records, position moved even if you have not committed. Lag dashboards often use committed lag, which can trail processing.',
    followUps: ['auto.offset.reset when?'],
  },
  {
    id: 's3',
    topic: 'Timeouts',
    question: 'session.timeout.ms vs max.poll.interval.ms?',
    answer30s:
      'Session: coordinator declares dead without heartbeats. max.poll.interval: processing gap between polls too long → kicked.',
    answer2m:
      'You can heartbeat fine and still be removed for slow processing. Defaults: 45s session, 5m poll interval (classic / 4.x docs).',
    followUps: ['heartbeat.interval.ms ratio?'],
    trick: 'Treating them as the same knob.',
  },
  {
    id: 's4',
    topic: 'Rebalance',
    question: 'Eager vs cooperative rebalancing?',
    answer30s:
      'Eager revokes all partitions then reassigns (stop-the-world). Cooperative incrementally moves only what must move.',
    answer2m:
      'CooperativeStickyAssignor is the usual production choice with subscribe(). Still need commitSync on revoke for owned partitions.',
    followUps: ['What triggers rebalance?'],
  },
  {
    id: 's5',
    topic: 'Commit',
    question: 'Why commitAsync in the loop and commitSync on shutdown/revoke?',
    answer30s:
      'Async keeps throughput; sync flushes critical last offsets when ownership ends.',
    answer2m:
      'Still at-least-once. Commit only partitions you own. Auto-commit is not “after each processed message.”',
    followUps: ['commit before process semantics?'],
  },
  {
    id: 's6',
    topic: 'Groups',
    question: 'How is the group coordinator chosen and what is __consumer_offsets?',
    answer30s:
      'Group id hashes to a partition of __consumer_offsets; that partition’s leader coordinates the group. Topic stores offsets + group metadata (compacted).',
    answer2m:
      'Coordinator failure → FindCoordinator → new broker. Commits/heartbeats briefly fail then recover.',
    followUps: ['RF of __consumer_offsets?'],
  },
  {
    id: 's7',
    topic: 'Static',
    question: 'What does group.instance.id buy you?',
    answer30s:
      'Static membership: restart can retain partitions without an immediate rebalance if within timeouts.',
    answer2m:
      'K8s gold. Duplicate instance ids fence. Not a substitute for cooperative assignors or good poll budgets.',
    followUps: ['FencedInstanceId?'],
  },
  {
    id: 's8',
    topic: 'Scaling',
    question: '20 consumers, 10 partitions, same group — what happens?',
    answer30s:
      'At most 10 are active; the rest idle. Parallelism capped by partitions.',
    answer2m:
      'Add partitions (with key remap cost) or split groups by responsibility. More consumers alone cannot exceed partition count.',
    followUps: ['Ordering impact of more partitions?'],
  },
  {
    id: 's9',
    topic: 'EOS',
    question: 'Does Kafka exactly-once make DB updates exactly once?',
    answer30s:
      'No. EOS covers Kafka read-process-write with transactions + read_committed. External DB needs idempotency/outbox.',
    answer2m:
      'sendOffsetsToTransaction ties offsets to the producer txn. DB write is outside that atomic boundary unless you design for it.',
    followUps: ['isolation.level default?'],
    trick: '“enable.idempotence on consumer.”',
  },
  {
    id: 's10',
    topic: 'Poison',
    question: 'How do you handle a poison message without blocking a partition forever?',
    answer30s:
      'Bounded retries with backoff, then DLQ with headers/metadata, commit past the poison, alert.',
    answer2m:
      'Infinite retry = infinite lag on that partition. Skipping without DLQ can hide money bugs — payments need audit.',
    followUps: ['pause/resume role?'],
  },
];

export const ARCHITECT: InterviewQ[] = [
  {
    id: 'a1',
    topic: '1M/s',
    question: 'Design consumers for 1M events/sec.',
    answer30s:
      'Start from bytes/s and process time → partitions → consumers ≤ partitions. Tune fetch + poll batch. Observe lag and rebalance rate.',
    answer2m:
      'Separate groups per pipeline. Avoid rebalance storms on deploy (static membership). Quotas and sink capacity matter as much as Kafka.',
    followUps: ['How do you prove the bottleneck?'],
  },
  {
    id: 'a2',
    topic: 'Ordering',
    question: 'Guarantee ordering per account?',
    answer30s:
      'Partition by account id; single-thread process per partition; no cross-partition workers that reorder.',
    answer2m:
      'Worker pools must preserve per-partition order (one worker per partition or sequenced queue). Multi-partition accounts break order by design.',
    followUps: ['Hot account mitigation?'],
  },
  {
    id: 'a3',
    topic: '10 min message',
    question: 'One message takes 10 minutes — how do you not break the group?',
    answer30s:
      'Do not hold the poll loop for 10 minutes. Pause partition, hand off to async worker with its own deadline, or raise poll interval carefully.',
    answer2m:
      'Better: async job system; Kafka carries a work ticket. Heartbeats alone do not protect max.poll.interval.',
    followUps: ['session vs poll interval again'],
  },
  {
    id: 'a4',
    topic: 'DR',
    question: 'Multi-region consumer DR?',
    answer30s:
      'Offsets are cluster-local. Failover to mirrored topic + new/translated offsets; expect duplicates; design idempotent sinks.',
    answer2m:
      'Active-active needs dedupe across regions. Active-passive: promote mirror, start consumers with documented offset policy, honest RPO.',
    followUps: ['MM2 offset translation pitfalls?'],
  },
  {
    id: 'a5',
    topic: 'K8s',
    question: 'Stop Kubernetes from causing rebalance storms?',
    answer30s:
      'group.instance.id, cooperative sticky, preStop wakeup/close, enough grace, careful probes, roll slowly.',
    answer2m:
      'Liveness that kills slow processors mid-batch is a rebalance machine. Scale horizontal only with partition headroom.',
    followUps: ['terminationGracePeriodSeconds sizing'],
  },
];

export const RAPID: InterviewQ[] = [
  {id: 'r1', topic: 'Rapid', question: 'Is KafkaConsumer thread-safe?', answer30s: 'No.', answer2m: 'One owning thread; wakeup() for shutdown.', followUps: ['Worker pattern?']},
  {id: 'r2', topic: 'Rapid', question: 'Default enable.auto.commit?', answer30s: 'true', answer2m: 'Override false for payments.', followUps: ['interval?']},
  {id: 'r3', topic: 'Rapid', question: 'Default auto.offset.reset?', answer30s: 'latest', answer2m: 'earliest for rebuilds.', followUps: ['none?']},
  {id: 'r4', topic: 'Rapid', question: 'Default max.poll.records?', answer30s: '500', answer2m: 'Buffer dribble size.', followUps: ['fetch size?']},
  {id: 'r5', topic: 'Rapid', question: 'Default max.poll.interval.ms?', answer30s: '300000', answer2m: '5 minutes.', followUps: ['vs session']},
  {id: 'r6', topic: 'Rapid', question: 'Default session.timeout.ms?', answer30s: '45000', answer2m: 'Classic protocol.', followUps: ['group.protocol=consumer?']},
  {id: 'r7', topic: 'Rapid', question: 'Default isolation.level?', answer30s: 'read_uncommitted', answer2m: 'Use read_committed for EOS.', followUps: ['LSO?']},
  {id: 'r8', topic: 'Rapid', question: 'subscribe vs assign?', answer30s: 'Group vs manual.', answer2m: 'assign skips JoinGroup rebalance.', followUps: ['When assign?']},
  {id: 'r9', topic: 'Rapid', question: 'Where are commits stored?', answer30s: '__consumer_offsets', answer2m: 'Compacted internal topic.', followUps: ['Coordinator?']},
  {id: 'r10', topic: 'Rapid', question: 'Active consumers vs partitions?', answer30s: '≤ partitions per group', answer2m: 'Extras idle.', followUps: ['Scale how?']},
  {id: 'r11', topic: 'Rapid', question: 'wakeup() purpose?', answer30s: 'Interrupt poll for shutdown', answer2m: 'Throws WakeupException.', followUps: ['close()?']},
  {id: 'r12', topic: 'Rapid', question: 'Cooperative sticky goal?', answer30s: 'Minimize partition movement', answer2m: 'Incremental revoke.', followUps: ['Eager?']},
];

export const STAFF: InterviewQ[] = [
  {
    id: 'st0a',
    topic: 'Staff · Protocol',
    question: 'group.protocol=classic vs consumer — what actually changes?',
    answer30s:
      'Classic (default) uses client-side assignors and classic Join/Sync. consumer enables the new broker-side rebalance protocol; assignment via group.remote.assignor / broker group.consumer.assignors; some classic timeout configs stop applying.',
    answer2m:
      'Kafka 4.x supports consumer protocol but does not default to it. Empty groups convert freely; non-empty migration follows group.consumer.migration.policy. Rolling upgrade needs compatible classic assignors without custom embedded metadata.',
    followUps: ['What is group.remote.assignor?', 'Which timeouts move to the broker?'],
    trick: '“Kafka 4 always uses the new consumer protocol.”',
  },
  {
    id: 'st0b',
    topic: 'Staff · Coordinator',
    question: 'How is the group coordinator selected?',
    answer30s:
      'hash(group.id) → __consumer_offsets partition → that partition’s leader broker is the coordinator.',
    answer2m:
      'Coordinator failure follows offsets-partition leadership change; consumers FindCoordinator and rejoin. Undersized RF on __consumer_offsets is a hidden availability foot-gun.',
    followUps: ['Where are commits stored?'],
  },
  {
    id: 'st0c',
    topic: 'Staff · Offsets',
    question: 'What is OffsetAndMetadata and when do you use metadata?',
    answer30s:
      'Commit payload is offset plus optional small metadata string (and epoch on newer APIs). Metadata is for checkpoints/audit — not a side database.',
    answer2m:
      'new OffsetAndMetadata(offset, metadata). Useful to record batch ids or seek reasons. Size is broker-limited.',
    followUps: ['OffsetOutOfRange path?'],
  },
  {
    id: 'st0d',
    topic: 'Staff · Timelines',
    question: 'Walk process-then-crash vs commit-then-crash for one record.',
    answer30s:
      'Process then crash without commit → re-read → at-least-once duplicates. Commit then crash before process → skip → at-most-once loss.',
    answer2m:
      'Prefer process→commit with idempotent sinks. On revoke, commitSync safely processed offsets. Auto-commit can accidentally look like commit-before-process.',
    followUps: ['Revoked vs lost?'],
  },
  {
    id: 'st0e',
    topic: 'Staff · Lag',
    question: 'Why can group lag look fine while one customer is stuck?',
    answer30s:
      'Averages hide a hot partition. Chart max and per-partition lag; one key owns one partition.',
    answer2m:
      'read_committed waiting on LSO can also inflate LEO-based lag while the consumer is behaving correctly.',
    followUps: ['LSO vs HW?'],
  },
  {
    id: 'st1',
    topic: 'Staff',
    question: 'Process succeeds, commit fails, then rebalance — walk duplicates and recovery.',
    answer30s:
      'Offsets uncommitted → new owner re-reads → duplicate side effects unless sink idempotent. Retry commit only while you still own partitions.',
    answer2m:
      'IllegalGeneration means stop committing that gen. OnPartitionsRevoked should commitSync what was safely processed.',
    followUps: ['Lost vs revoked?'],
  },
  {
    id: 'st2',
    topic: 'Staff',
    question: 'How do fetch sessions change the Fetch protocol?',
    answer30s:
      'Incremental fetch sessions cache partition set on the broker so subsequent fetches send deltas, saving bandwidth.',
    answer2m:
      'Full fetch establishes session; errors may force session reset. Implementation detail — still FetchRequest/Response conceptually.',
    followUps: ['max.partition.fetch.bytes interaction'],
  },
  {
    id: 'st3',
    topic: 'Staff',
    question: 'group.protocol=classic vs consumer — what do you say in an interview?',
    answer30s:
      '4.x default classic. consumer enables the new broker-driven group protocol (KIP-848 lineage); some timeouts become broker configs — verify before flipping.',
    answer2m:
      'Do not invent behavior. Call out protocol negotiation and assignor location (client vs server) as the key difference.',
    followUps: ['How do you roll it out?'],
  },
];

export const ALL: InterviewQ[] = [...SENIOR, ...ARCHITECT, ...RAPID, ...STAFF];
