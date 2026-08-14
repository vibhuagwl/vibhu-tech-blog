/** Staff zero-gap — new group protocol, coordinator discovery, OffsetAndMetadata, interceptors, failure timelines. */

export const PROTOCOL_COMPARE: string[][] = [
  ['Assignment location', 'Client (group leader computes)', 'Broker / server-side assignor'],
  ['Client config', 'partition.assignment.strategy', 'group.remote.assignor (optional)'],
  ['Broker assignors', 'N/A (client strategies)', 'group.consumer.assignors (default uniform,range on 4.0)'],
  ['session.timeout.ms / heartbeat.interval.ms', 'Client configs (within broker min/max)', 'Often broker-driven (group.consumer.*); client knobs may not apply — verify docs'],
  ['Rebalance model', 'JoinGroup/SyncGroup classic path', 'New consumer rebalance protocol + improved threading'],
  ['Default in 4.x', 'group.protocol=classic', 'Opt-in: group.protocol=consumer'],
  ['Empty group convert', 'Classic ↔ Consumer when empty', 'Always possible when empty'],
  ['Non-empty migrate', 'Policy-controlled', 'group.consumer.migration.policy (default bidirectional on 4.0)'],
];

export const GROUP_PROTOCOL = `group.protocol=classic  (DEFAULT in Kafka 4.x)
  • Classic Consumer Group Protocol
  • Client-side assignors via partition.assignment.strategy
  • session.timeout.ms / heartbeat.interval.ms are classic client configs
  • JoinGroup / SyncGroup / Heartbeat as traditionally taught

group.protocol=consumer
  • New Consumer Group Protocol (supported since 4.0; NOT default)
  • Broker-side assignment; optional group.remote.assignor
  • If unset, coordinator uses first of group.consumer.assignors (docs: uniform,range)
  • Some classic client timeout configs are NOT supported — session timeout may be
    broker config group.consumer.session.timeout.ms (verify your release)
  • Rolling upgrade possible when classic assignor does not embed custom metadata
  • Empty groups convert freely; non-empty follows migration policy

Interview rule: say “classic is still the default; consumer protocol is opt-in —
verify which timeouts and assignors apply before flipping in prod.”`;

export const REMOTE_ASSIGNOR = `group.remote.assignor (default null)
  Applied ONLY when group.protocol=consumer
  Names the server-side assignor; if null → first in broker group.consumer.assignors
  Why it exists: move assignment CPU/logic to brokers; uniform sticky-like server strategies;
  enable protocol evolution without shipping new client JARs for every assignor tweak
  Ops: brokers must expose the assignor; mismatch → join/assignment failures
  Do not confuse with partition.assignment.strategy (classic only)`;

export const COORDINATOR_DISCOVERY = `group.id
  ↓  hash(group.id)
  ↓  pick partition of internal topic __consumer_offsets
  ↓  that partition’s LEADER broker
  ↓  becomes the Group Coordinator for this group

Why the leader?
  Coordinator state for the group lives with that __consumer_offsets partition.
  Leadership of the offsets partition = who owns group membership + offset commits
  for groups hashing to it.

If that broker dies:
  ISR elects new leader for the offsets partition
  → new coordinator
  → consumers FindCoordinator again
  → brief NotCoordinator / rejoin

RF of __consumer_offsets must be production-grade (typically ≥3) or coordinator
availability collapses with the offsets partition.`;

export const OFFSET_METADATA = `OffsetCommit stores:
  offset          — next offset to consume
  metadata        — optional string (size-limited by broker)
  leader epoch    — fencing/consistency (protocol version dependent)

Java:
  new OffsetAndMetadata(offset)
  new OffsetAndMetadata(offset, metadata)
  new OffsetAndMetadata(offset, Optional.of(leaderEpoch), metadata)  // newer APIs

Use cases for metadata:
  • checkpoint processing stage / batch id
  • human-readable “why we seeked”
  • correlating commits in audits
Not a general-purpose database — keep small; commits still go to __consumer_offsets.`;

export const OFFSET_OUT_OF_RANGE = `Consumer position points at an offset no longer in the log
  (retention deleted segments, incorrect seek, truncated replica, bad reset)

  → OffsetOutOfRangeException (or equivalent fetch error path)
  → auto.offset.reset:
       earliest → start of log
       latest   → end of log   (DEFAULT)
       none     → throw / fail loudly

Causes:
  • retention.ms / retention.bytes cleaned the offset
  • seek() to a deleted offset
  • long downtime while log rolled forward
  • consuming a compacted topic assuming old offsets still exist

Prevention:
  • lag SLOs shorter than retention
  • none + alerting for critical pipelines
  • never seek blindly without ListOffsets / end offsets check`;

export const TX_VISIBILITY = `LEO  — leader log end (next write offset)
HW   — high watermark (replicated to ISR; normal read bound)
LSO  — last stable offset (no open transaction before it)

read_uncommitted (default):
  Consumer can read up to HW; may see transactional records before abort/commit settles
  (teach carefully: use this only when you accept that visibility model)

read_committed:
  Consumer reads up to LSO — skips aborted transactional data; waits out open txns
  Lag dashboards using LEO can look “high” while consumer is correctly blocked on LSO

Interview line:
  “For EOS pipelines, isolation.level=read_committed and understand LSO ≠ LEO.”`;

export const NETWORK_INTERNALS = `ConsumerNetworkClient / NetworkClient
  • Connections per broker node (bootstrap → metadata → leaders + coordinator)
  • Request / response correlation IDs
  • In-flight request limits per connection
  • Reconnect backoff on disconnect
  • Metadata refresh (metadata.max.age.ms + errors like NOT_LEADER)
  • request.timeout.ms / default.api.timeout.ms bound waits
  • Broker quota throttle → fetch-throttle-time / throttle_time_ms in responses

Failure modes:
  Coordinator blip → FindCoordinator retry
  Leader move → metadata refresh → new fetch target
  Sustained throttle → lag rises without “app bug”
Do not treat every empty poll as “no data” — could be metadata/reconnect/throttle.`;

export const INTERCEPTORS = `ConsumerInterceptor<K,V>
  onConsume(ConsumerRecords)  — mutate/observe records before app sees them
  onCommit(Map<TopicPartition, OffsetAndMetadata>) — observe commits
  close()

Wire via interceptor.classes (comma-separated)
Use cases: OpenTelemetry spans, audit logs, metrics tags, redaction
Caveats: runs on consumer thread — keep fast; exceptions can break poll path
Not a substitute for proper ACL/security`;

export const LAG_LEVELS = `Group lag     — aggregate across members (can hide skew)
Consumer lag  — one member’s total
Partition lag — THE truth for hot keys

Healthy average + one partition at 2M lag = still an outage for that key.
Always chart max partition lag and top-N partitions, not only group sum/avg.`;

export const REVOKE_VS_LOST = `onPartitionsRevoked(partitions)
  • Still owned in this generation’s revoke path
  • SAFE to commitSync offsets for work already processed
  • Flush per-partition state

onPartitionsAssigned(partitions)
  • New ownership — init positions, caches, metrics labels

onPartitionsLost(partitions)
  • Ownership already gone (crash path / fencing / lost generation)
  • Do NOT assume commit will succeed
  • Drop local state; do not write to sinks assuming exclusivity

Cooperative corner:
  Only a SUBSET may be revoked; keep processing remaining assigned partitions
  Multi-round rebalance — don’t treat first revoke as “group is dead”
  Committing revoked partitions after lost → IllegalGeneration / unknown member`;

export const FAILURE_TIMELINES = `=== Timeline A: process then crash (no commit) — AT-LEAST-ONCE ===
poll() → get P0 offset 100
process record 100  ✓
CRASH (offset 100 NOT committed)
restart → committed still 100’s previous
re-read offset 100 → DUPLICATE side effects unless sink idempotent

=== Timeline B: process then commit then crash — SAFE PROGRESS ===
poll → process 100 → commitSync(101)
CRASH
restart → resume at 101 → no reprocess of 100

=== Timeline C: commit then process — AT-MOST-ONCE / LOSS RISK ===
poll → commit 101 BEFORE process
CRASH before business logic
restart → starts at 101 → record 100 LOST to this consumer

=== Timeline D: revoke mid-batch ===
process 100,101 (uncommitted) → rebalance revoke
without commitSync on revoke → another member may re-read → duplicates
with commitSync of safely processed offsets → minimizes redo

Golden interview pair:
  Process→Commit = at-least-once (prefer + idempotent sink)
  Commit→Process = at-most-once (loss on crash)`;

export const STAFF_GAP_CHEATS = {
  protocol: `classic = default, client assignors
consumer = opt-in, broker assignors + group.remote.assignor
Verify which timeouts apply`,
  coordinator: `hash(group.id) → __consumer_offsets part → leader = coordinator`,
  offsetMeta: `OffsetAndMetadata(offset, metadata)
metadata is small audit/checkpoint — not a DB`,
  oor: `Missing offset → OffsetOutOfRange → auto.offset.reset
Retention + long downtime = classic cause`,
  lso: `read_committed stops at LSO
LEO lag can look scary while waiting on open txns`,
  revokeLost: `Revoked: commitSync OK
Lost: do not commit; drop exclusivity assumptions`,
  timelines: `Process→crash→re-read = dups
Commit→crash→skip = loss
Idempotent sink + process-then-commit`,
};
