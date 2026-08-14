export const FAILURE_MATRIX: string[][] = [
  ['Consumer crash mid-process', 'Yes (stop)', 'Session/poll timeout', 'Yes', 'Yes (at-least-once)', 'If committed early', 'Restart; resume from committed'],
  ['JVM / OOM kill', 'No', 'Timeouts', 'Yes', 'Yes', 'If auto-commit ahead', 'Fix heap; manual commit'],
  ['Long GC pause', 'Heartbeats may fail', 'May remove member', 'Maybe', 'Yes', 'Low', 'Tune GC; static membership'],
  ['Network partition to coordinator', 'Commit/HB fail', 'May rebalance', 'Yes', 'Yes', 'Low', 'Rediscover coordinator'],
  ['Broker leader crash', 'Fetch errors', 'No (unless member dies)', 'No*', 'Retry', 'Low', 'Metadata refresh; new leader'],
  ['Coordinator crash', 'NotCoordinator', 'Group moves', 'Often rejoin', 'Retry commits', 'Low', 'FindCoordinator; continue'],
  ['Commit failure after process', 'Exception/callback', 'Maybe', 'Maybe', 'Yes on retry process', 'No if uncommitted', 'Retry commit; idempotent sink'],
  ['Process failure before commit', 'App error', 'No', 'No', 'No (retry same)', 'No', 'Retry/DLQ'],
  ['Deserialization failure', 'Exception', 'No', 'No', 'N/A', 'Skip risk if you seek', 'Error handler + DLQ'],
  ['Rebalance revoke', 'Listener', 'Yes', 'Yes', 'If uncommitted work', 'If commit-before-process', 'commitSync on revoke'],
  ['max.poll.interval exceeded', 'Removed from group', 'Yes', 'Yes', 'Yes', 'Low', 'Smaller batches / faster process'],
  ['FencedInstanceId', 'Exception', 'Static conflict', 'Yes', '—', '—', 'Unique instance.id'],
  ['K8s SIGKILL', 'No', 'Timeouts', 'Yes', 'Yes', 'If bad commit policy', 'preStop + grace + wakeup'],
];

export const TROUBLESHOOT: {title: string; symptoms: string; causes: string; metrics: string; fix: string; prevention: string}[] = [
  {title: 'Lag steadily rising', symptoms: 'records-lag-max ↑', causes: 'Slow process, underscaled, hot key, fetch starved', metrics: 'lag, records-consumed-rate, process latency', fix: 'Scale ≤ partitions; speed sink; split hot keys', prevention: 'Capacity model + lag SLO'},
  {title: 'Lag spike then recovers', symptoms: 'Temporary lag mountain', causes: 'Rebalance, deploy, broker blip, GC', metrics: 'rebalance-rate, fetch-latency', fix: 'Confirm recovery; static membership on deploys', prevention: 'Cooperative sticky; rolling with grace'},
  {title: 'One partition lagging', symptoms: 'Only one lag series high', causes: 'Hot key / slow poison retries', metrics: 'per-partition lag', fix: 'Isolate key; DLQ poison; re-key', prevention: 'Key design; retry budgets'},
  {title: 'All consumers lagging', symptoms: 'Group-wide lag', causes: 'Broker slow, network, shared sink outage', metrics: 'fetch-latency, sink errors', fix: 'Fix broker/sink; pause if needed', prevention: 'Multi-AZ; sink SLOs'},
  {title: 'Zero throughput', symptoms: 'records-consumed-rate=0', causes: 'No assignment, auth, wrong topic, paused all', metrics: 'assigned-partitions, auth errors', fix: 'Describe group; ACLs; resume', prevention: 'Startup checks'},
  {title: 'Rebalance storm', symptoms: 'Constant rebalances', causes: 'Poll interval trips, flapping pods, session too tight', metrics: 'rebalance-rate, join latency', fix: 'Fix poll budget; static ids; probe tuning', prevention: 'Load test deploys'},
  {title: 'Commit failures', symptoms: 'IllegalGeneration / RebalanceInProgress', causes: 'Stale generation; commit after revoke', metrics: 'commit-latency, errors', fix: 'Commit only owned partitions; on revoke sync', prevention: 'Rebalance listeners'},
  {title: 'Heartbeat failures', symptoms: 'Member drops', causes: 'Net, overload, bad session/heartbeat ratio', metrics: 'heartbeat-response-time', fix: 'Network; tune timeouts within broker bounds', prevention: 'Alert HB latency'},
  {title: 'Deser poison loop', symptoms: 'Partition stuck; lag↑', causes: 'Bad payload forever retried', metrics: 'error rate; lag on one part', fix: 'DLQ + skip/commit policy', prevention: 'Schema validation'},
  {title: 'Coordinator unavailable', symptoms: 'FindCoordinator loops', causes: 'Broker down; __consumer_offsets issues', metrics: 'coordinator discovery errors', fix: 'Restore brokers; check offsets topic RF', prevention: 'RF≥3 on internal topics'},
];

export const ERROR_CODES: string[][] = [
  ['OFFSET_OUT_OF_RANGE', 'Yes/seek', 'Reset per auto.offset.reset or seek', 'Maybe', 'Position jumps'],
  ['NOT_COORDINATOR', 'Yes', 'FindCoordinator; retry', 'Maybe', 'Retry commit'],
  ['COORDINATOR_LOAD_IN_PROGRESS', 'Yes', 'Backoff retry', 'No', 'Wait'],
  ['REBALANCE_IN_PROGRESS', 'Yes', 'Complete rebalance; retry commit', 'Yes', 'Hold commits'],
  ['ILLEGAL_GENERATION', 'Yes', 'Rejoin; stale gen', 'Yes', 'Discard stale commit'],
  ['UNKNOWN_MEMBER_ID', 'Yes', 'Rejoin group', 'Yes', 'Clear state'],
  ['FENCED_INSTANCE_ID', 'No/ops', 'Duplicate static id', 'Yes', 'Fix instance.id'],
  ['GROUP_AUTHORIZATION_FAILED', 'No', 'Grant GROUP READ', 'No', 'ACL'],
  ['TOPIC_AUTHORIZATION_FAILED', 'No', 'Grant TOPIC READ', 'No', 'ACL'],
  ['RECORD_TOO_LARGE', 'No', 'Config / skip / DLQ', 'No', 'Align fetch sizes'],
  ['AUTHENTICATION_FAILED', 'No', 'Fix SASL/TLS', 'No', 'Creds'],
];

export const CHAOS: string[][] = [
  ['Kill consumer', 'Rebalance; another member takes partitions; at-least-once dups possible'],
  ['Pause processing (no poll)', 'max.poll.interval → kick → rebalance'],
  ['Slow processing', 'Lag↑; risk poll interval'],
  ['Kill coordinator broker', 'FindCoordinator; brief commit/HB errors'],
  ['Kill partition leader', 'Fetch fail → metadata → new leader'],
  ['Network latency', 'HB/session risk; fetch latency↑'],
  ['Force rebalance', 'Revoke/assign; commitSync path matters'],
  ['Inject bad message', 'Without DLQ → partition stall'],
  ['Expire TLS cert', 'Auth failures; zero consume'],
  ['Throttle broker', 'fetch-throttle-time↑; lag↑'],
];

export const PAYMENT_FAILURES: string[][] = [
  ['Process payment then crash before commit', 'Duplicate payment risk on restart', 'Idempotent ledger key; then commit'],
  ['Commit before process', 'Loss on crash', 'Never for money'],
  ['Process OK, commit fails', 'Will reprocess', 'Idempotent sink + retry commit'],
  ['Broker fails mid-fetch', 'Retries; transient empty polls', 'Metadata refresh'],
  ['Lose partition mid-process', 'Another member may process same offsets', 'Idempotent + commit on revoke'],
  ['Duplicate event', 'Two delivers', 'Business idempotency'],
  ['Poison message', 'Infinite retry blocks partition', 'DLQ with audit headers'],
  ['DB down', 'Retries explode lag', 'Pause; retry topic; circuit breaker'],
];

export const WAR_POLL_INTERVAL = `Batch of 500 records × 2s each = 1000s
max.poll.interval.ms default 300000 (5 min)
Consumer kicked mid-batch → rebalance → duplicates
Fix: smaller max.poll.records, faster process, or raise interval with eyes open`;

export const WAR_STATIC = `Pod restart with group.instance.id
Within timeout → keeps assignment → no rebalance storm
Two pods same instance.id → FencedInstanceId
K8s: unique stable ids; preStop wakeup+close; enough terminationGracePeriodSeconds`;
