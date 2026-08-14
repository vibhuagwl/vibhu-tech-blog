/** Defaults verified against Apache Kafka 4.x consumer configs (kafka.apache.org). Do not invent defaults. */

export const VERSION_NOTE =
  'Targets Apache Kafka 4.x Java consumer + Spring Kafka patterns. Documented defaults: enable.auto.commit=true, auto.offset.reset=latest, max.poll.records=500, max.poll.interval.ms=300000, session.timeout.ms=45000 (classic), heartbeat.interval.ms=3000, isolation.level=read_uncommitted, group.protocol=classic. group.protocol=consumer is opt-in (new rebalance protocol; broker-side assignors via group.remote.assignor / group.consumer.assignors). Some classic client timeout configs do not apply under the consumer protocol — verify kafka.apache.org for your exact release. Production almost always overrides auto-commit and offset reset.';

export const MEMORY_SENTENCE =
  'poll() is membership + fetch + deserialize + return buffered records — not “read one message.” One partition → one active member per group. Position ≠ committed offset ≠ lag. session.timeout detects dead heartbeats; max.poll.interval detects stuck processing. Prefer manual commit after successful processing; use commitAsync in the loop and commitSync on revoke/shutdown. Kafka EOS does not make your database exactly-once.';

export const FUNDAMENTALS: string[][] = [
  ['Consumer', 'Client that pulls records from partition leaders'],
  ['Pull model', 'Consumer decides pace — backpressure via poll/pause, not broker push'],
  ['Partition', 'Ordered log; ≤1 active consumer per group owns it'],
  ['Consumer group', 'Set of members sharing work via group.id + coordinator'],
  ['Group coordinator', 'Broker (via __consumer_offsets key) managing membership/commits'],
  ['Assignment', 'Which member owns which partitions'],
  ['Lag', 'How far behind end (LEO/HW/LSO) the position/committed offset is'],
];

export const POLL_LIFECYCLE = `Application
  → KafkaConsumer.poll(timeout)
  → ensure group membership / heartbeats / maybe rebalance
  → SubscriptionState: assigned partitions + positions
  → Fetcher: send FetchRequests (sessions) / collect FetchResponses
  → deserialize key/value → ConsumerRecord
  → return up to max.poll.records from internal buffers
  → application processes
  → commit (auto or manual)
  → next poll (keeps membership alive for classic + processing budget)`;

export const INTERNAL_LAYERS: string[][] = [
  ['KafkaConsumer', 'Public API; not thread-safe — one thread owns the instance'],
  ['ConsumerCoordinator / AbstractCoordinator', 'FindCoordinator, Join/Sync, heartbeat, commits'],
  ['SubscriptionState', 'subscribe/assign, positions, paused partitions, assignment'],
  ['Fetcher', 'Fetch requests, buffers, fetch sessions'],
  ['ConsumerNetworkClient / NetworkClient', 'I/O to brokers'],
  ['Metadata', 'Cluster/topic leaders for fetch routing'],
  ['Deserializers', 'Bytes → objects on the consumer thread'],
];

export const THREAD_RULES = `KafkaConsumer is NOT thread-safe.
Canonical: one consumer thread runs poll() + commit + seek + pause/resume.

Dangerous:
  Worker threads calling poll()/commit() concurrently → corruption / ConcurrentModification

Safe patterns:
  1) Consumer-per-thread (each thread its own KafkaConsumer + group member)
  2) One consumer thread + workers process records; ONLY consumer thread commits/seeks
     → need careful offset tracking per partition (pause until workers drain)

wakeup() is the supported cross-thread interrupt for shutdown.`;

export const SUBSCRIBE_VS_ASSIGN: string[][] = [
  ['subscribe(topics)', 'Group management ON', 'Rebalance + assignors', 'Normal microservices'],
  ['assign(partitions)', 'Group management OFF', 'No JoinGroup rebalance', 'Tools, replay jobs, static ownership you manage'],
  ['unsubscribe()', 'Leave subscription', 'Triggers leave/rebalance if in a group', 'Shutdown / switch topics'],
];

export const OFFSET_TYPES = `Committed offset  — last successfully committed (in __consumer_offsets)
Position          — next offset this consumer will return for a partition
LEO               — log end on leader
HW                — high watermark (consumers typically cannot read past HW)
LSO               — last stable offset (read_committed visibility bound)

Lag (committed) ≈ end_offset − committed_offset
Lag (position)  ≈ end_offset − position
These differ during processing and with transactions.

Position ≠ committed offset ≠ lag`;

export const OFFSET_LIFECYCLE = `No committed offset / out of range
  → auto.offset.reset = earliest | latest | none
Start / after assign
  → fetch from position
poll returns records
  → position advances as records are returned (not when you finish business logic)
process
  → commitSync/Async (or auto-commit on poll interval)
  → committed offset updates (next start = committed)`;

export const AUTO_COMMIT = `enable.auto.commit=true (default)
auto.commit.interval.ms=5000 (default)

Auto-commit runs on the consumer thread around poll timing — NOT “after each message processed.”
Risks:
  • Process slowly → may commit offsets for records not yet processed (loss on crash)
  • Or reprocess depending on timing
Prod payments: usually enable.auto.commit=false + manual commits after success.`;

export const COMMIT_COMPARE: string[][] = [
  ['Blocking', 'Yes', 'No'],
  ['Latency', 'Higher', 'Lower'],
  ['Retry', 'Client retries on retriable errors', 'You handle in callback'],
  ['Ordering', 'Safer sequential', 'Can complete out of order if misused'],
  ['Error handling', 'Throws', 'Callback'],
  ['Throughput', 'Lower', 'Higher'],
  ['Typical use', 'Revoke / shutdown / critical boundaries', 'Steady poll loop'],
];

export const COMMIT_PATTERN = `Steady state: commitAsync() after successful batch
OnPartitionsRevoked / shutdown: commitSync() to flush last offsets
Limitation: still at-least-once unless combined with idempotent/EOS sinks
Never commit offsets for partitions you no longer own`;

export const SEMANTICS: string[][] = [
  ['At-most-once', 'Commit before / auto-commit ahead of process', 'Possible loss; rare dups'],
  ['At-least-once', 'Process then commit', 'Duplicates on crash after process before commit'],
  ['Exactly-once (Kafka EOS)', 'Transactional produce + sendOffsetsToTransaction + read_committed', 'Within Kafka read-process-write; NOT automatic for external DBs'],
];

export const EOS_FLOW = `Consume (isolation.level=read_committed)
 → process
 → produce to output topics in a transaction
 → producer.sendOffsetsToTransaction(offsets, groupMetadata)
 → commitTransaction

External DB: use idempotent writes / outbox / dedupe keys — Kafka EOS does not wrap your DB.`;

export const READ_COMMITTED = `isolation.level=read_uncommitted (default): see transactional records before commit; may see aborted later filtered? 
  Actually uncommitted isolation can return records that are part of open txns (implementation: consumers may see them before abort filtering depending path — teach: use read_committed for EOS pipelines)
isolation.level=read_committed: only committed transactional records; aborted skipped; bound by LSO

Always verify current docs for visibility guarantees on your version.`;

export const GROUP_PIECES: string[][] = [
  ['group.id', 'Required for subscribe() group management'],
  ['Member', 'A live KafkaConsumer in the group'],
  ['Coordinator', 'Broker owning the group key in __consumer_offsets'],
  ['Generation', 'Increments each rebalance; fences stale commits'],
  ['member.id', 'Assigned by coordinator'],
  ['group.instance.id', 'Static membership — survive restart without instant rebalance'],
  ['__consumer_offsets', 'Internal compacted topic: offsets + group metadata'],
];

export const MEMBERSHIP_FLOW = `FindCoordinator
 → JoinGroup (protocols / assignors / subscriptions)
 → Group leader computes assignment (classic) OR server-side assignor (group.protocol=consumer)
 → SyncGroup (members receive assignment)
 → Heartbeat loop
 → poll / fetch / commit
 → LeaveGroup on close

group.protocol (4.x): classic (default) | consumer (new protocol — verify broker/client support)`;

export const TIMEOUT_COMPARE = `session.timeout.ms (default 45000, classic)
  Coordinator: no heartbeats → member dead → rebalance
  Pair with heartbeat.interval.ms (default 3000) — typically ~1/3 of session

max.poll.interval.ms (default 300000)
  Client: time between poll() calls too long → considered failed processing → rebalance
  Independent of heartbeat thread in modern clients — long process without poll trips THIS, not session

Interview line:
  Heartbeat timeout ≠ processing timeout.`;

export const REBALANCE_TRIGGERS = `Join / leave / crash
max.poll.interval exceeded
session timeout (missed heartbeats)
subscription change
topic partition count change
coordinator move (often rejoin)
static member expiry (after session + timeouts)`;

export const EAGER_VS_COOP: string[][] = [
  ['Eager', 'Revoke ALL partitions then reassign', 'Stop-the-world pause', 'Simple; higher disruption'],
  ['Cooperative', 'Revoke only partitions that must move', 'Incremental multi-round', 'Less downtime; sticky preferred'],
];

export const ASSIGNORS: string[][] = [
  ['RangeAssignor', 'Contiguous ranges per topic', 'Can skew with multiple topics', 'Default list includes Range'],
  ['RoundRobinAssignor', 'Spread partitions round-robin', 'Better mixed subs sometimes', 'Legacy-ish'],
  ['StickyAssignor', 'Balance + minimize movement', 'Eager sticky', 'Reduce shuffle'],
  ['CooperativeStickyAssignor', 'Sticky + cooperative revoke', 'Default preference alongside Range in 4.x list', 'Prod favorite for subscribe()'],
];

export const RANGE_EXAMPLE = `Partitions: P0 P1 P2 P3 P4 P5
Consumers: C1 C2 C3
Range (single topic, sorted members):
  C1 → P0 P1
  C2 → P2 P3
  C3 → P4 P5
Uneven when partition count % consumers ≠ 0 — e.g. 5 parts / 3 consumers → 2,2,1.`;

export const STATIC_MEMBERSHIP = `group.instance.id = stable pod/instance identity
Restart within session window → often NO rebalance (partitions retained)
K8s: StatefulSet ordinal / stable ID; tune session + leave timeouts carefully
Zombie risk: two processes same instance.id → FencedInstanceId
Always unique instance ids per live member`;

export const FETCH_CONFIGS: string[][] = [
  ['fetch.min.bytes', '1', 'Broker waits for this much data (or max wait)'],
  ['fetch.max.wait.ms', '500', 'Max broker block for min.bytes'],
  ['fetch.max.bytes', '52428800', 'Total fetch response cap'],
  ['max.partition.fetch.bytes', '1048576', 'Per-partition fetch cap'],
  ['max.poll.records', '500', 'Max records returned per poll() from buffer'],
  ['receive.buffer.bytes', '65536', 'SO_RCVBUF'],
];

export const FETCH_NOTE = `max.poll.records does NOT limit broker fetch size — consumer buffers fetches and dribbles out on poll.
Huge max.poll.records + slow process → trip max.poll.interval.
fetch.min.bytes↑ + wait↑ → fewer larger fetches (throughput) vs latency.`;

export const BACKPRESSURE = `Downstream slow:
  • Reduce max.poll.records
  • pause(partitions) until workers drain; resume()
  • Bounded worker queues — never unbounded
  • Scale consumers (≤ partitions) or speed processors
pause does not release ownership — still must poll for membership`;

export const LAG_FORMULA = `end_offset − consumer_offset ≈ lag
Clarify which end (LEO vs HW vs LSO) and which consumer offset (position vs committed).
Misleading lag:
  • Batching / paused partitions
  • read_committed waiting on LSO
  • One hot partition
  • Commit lag vs processing lag`;

export const SCALING = `Active consumers in a group ≤ partition count
10 partitions + 20 consumers → ≥10 idle
20 partitions + 10 consumers → ~2 each (assignor-dependent)
Scale partitions for parallelism; scale consumers to match load up to that ceiling`;

export const CONFIG_CORE: string[][] = [
  ['bootstrap.servers', 'list', '""', 'Required'],
  ['group.id', 'string', 'null', 'Required for subscribe groups'],
  ['key/value.deserializer', 'class', '(required)', 'Must match producers'],
  ['enable.auto.commit', 'bool', 'true', 'OVERRIDE false for payments'],
  ['auto.offset.reset', 'earliest|latest|none', 'latest', 'earliest for rebuild; none for strict'],
  ['max.poll.records', 'int', '500', 'Bound processing time'],
  ['max.poll.interval.ms', 'int', '300000', 'Must exceed worst batch process'],
  ['session.timeout.ms', 'int', '45000', 'Classic; within broker min/max'],
  ['heartbeat.interval.ms', 'int', '3000', '~1/3 session'],
  ['partition.assignment.strategy', 'list', 'Range,CooperativeSticky', 'Prefer cooperative sticky'],
  ['group.instance.id', 'string', 'null', 'Static membership for k8s'],
  ['isolation.level', 'enum', 'read_uncommitted', 'read_committed for EOS pipelines'],
  ['group.protocol', 'classic|consumer', 'classic', 'Verify before flipping to consumer'],
  ['fetch.min.bytes', 'int', '1', 'Throughput vs latency'],
  ['fetch.max.wait.ms', 'int', '500', 'With min.bytes'],
  ['max.partition.fetch.bytes', 'int', '1048576', 'Large record headroom'],
];

export const INTERACTIONS = `max.poll.records × processing_time_per_record < max.poll.interval.ms (with margin)
session.timeout.ms > heartbeat.interval.ms × ~3; within broker group min/max
fetch.min.bytes + fetch.max.wait.ms + max.partition.fetch.bytes + max.poll.records
  → memory, latency, and how fast you trip poll interval`;

export const ANTI: {bad: string; good: string}[] = [
  {bad: 'Commit before process', good: 'Process then commit (at-least-once) + idempotent sink'},
  {bad: 'Commit every single record sync', good: 'Batch commit; sync on revoke'},
  {bad: 'Huge max.poll.records', good: 'Size to process within max.poll.interval'},
  {bad: 'Ignore max.poll.interval', good: 'Budget poll cadence vs batch work'},
  {bad: 'Block forever in poll loop', good: 'Bounded work; pause/resume; DLQ'},
  {bad: 'Unbounded worker queue', good: 'Bounded queue + pause'},
  {bad: 'Multi-thread same KafkaConsumer', good: 'One owner thread / consumer-per-thread'},
  {bad: 'Ignore rebalance listeners', good: 'commitSync on revoke; clear state'},
  {bad: 'Retry poison forever', good: 'Retry budget → DLQ'},
  {bad: 'No lag monitoring', good: 'Lag + throughput + rebalance rate'},
  {bad: '20 consumers on 10 partitions', good: 'Idle waste; match ≤ partitions'},
  {bad: 'Blind auto.commit=true', good: 'Manual commits for money'},
  {bad: 'Ignore deser errors', good: 'Error handler + DLQ + alert'},
  {bad: 'No graceful shutdown', good: 'wakeup → commitSync → close'},
  {bad: 'Assume Kafka EOS = DB EOS', good: 'Idempotent DB / outbox'},
  {bad: 'Rebalance storm from k8s probes', good: 'Static membership + proper preStop'},
  {bad: 'Seek without idempotency', good: 'Replay only with safe sinks'},
  {bad: 'One consumer for huge topic', good: 'Partition for parallelism'},
  {bad: 'Share group.id across unrelated apps', good: 'Unique group per logical consumer'},
  {bad: 'No partition key for ordering', good: 'Key by account/order for order guarantee'},
];

export const CHEATS = {
  mental: `subscribe → coordinator → assign → fetch → poll → process → commit
One partition / one member / group
Position ≠ committed ≠ lag`,
  poll: `poll = membership maintenance + return buffered fetches
Not “one message API”
Must call often enough for max.poll.interval`,
  offset: `Committed in __consumer_offsets
Position advances on return from poll
auto.offset.reset when no/invalid commit`,
  commit: `Auto: background on poll cadence — dangerous for money
Manual: process→commit
Async loop + sync on revoke/shutdown`,
  group: `group.id + coordinator + generation
Heartbeats = liveness
Generation fences stale commits`,
  rebalance: `Triggers: join/leave/crash/timeouts/sub change
Eager: revoke all
Cooperative: incremental
Static membership reduces restart rebalances`,
  fetch: `min.bytes/max.wait = latency vs throughput
max.poll.records = app batch size from buffer
Sessions reduce fetch metadata chatter`,
  lag: `Define end + which offset
Hot partition vs all lagging
read_committed may wait on LSO`,
  eos: `read_committed + transactional offsets
External DB still needs idempotency`,
  errors: `Retry transient
DLQ poison
Never block a partition forever`,
  interview: `1) What does poll do?
2) Position vs committed vs lag
3) session vs max.poll.interval
4) Eager vs cooperative
5) commit sync/async pattern
6) Static membership
7) Poison / DLQ
8) 20 consumers / 10 partitions
9) EOS vs DB
10) Rebalance storm on k8s
11) classic vs group.protocol=consumer
12) Coordinator = offsets partition leader
13) OffsetOutOfRange + auto.offset.reset
14) Revoked vs lost
15) Process→crash vs commit→crash timelines`,
};
