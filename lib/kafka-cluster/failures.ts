export const FAILURE_MATRIX: string[][] = [
  ['Broker crash (follower)', 'Controller / missing fetches', 'Remove from ISR', 'None if not leader', 'Shrink ISR', 'Possible URP; produces OK if minISR met', 'Low if RF≥3', 'Restart → catch up → ISR expand'],
  ['Broker crash (leader)', 'Session / registration loss', 'Elect from ISR, epoch++', 'New leader', 'Shrink then stabilize', 'Brief Produce errors → metadata refresh', 'Low if unclean=false', 'Clients retry to new leader'],
  ['Two brokers crash (RF=3)', 'Same', 'May leave |ISR|<minISR', 'Some partitions offline or produce fail', 'Heavy shrink', 'NotEnoughReplicas / offline', 'Medium if unclean on', 'Restore brokers ASAP'],
  ['Controller leader crash', 'Raft election', 'New controller leader', 'None on data path', 'None directly', 'Admin ops pause briefly', 'None', 'Quorum elects new leader'],
  ['Controller quorum majority loss', 'Raft cannot commit', 'No metadata changes', 'Existing leaders continue', 'ISR updates stuck', 'No create topic / elections', 'Risk rises over time', 'Restore majority controllers'],
  ['Disk full on broker', 'OS / log errors', 'May fence partitions on that disk', 'Leaders on that disk fail', 'URP', 'Produce/Fetch errors', 'If RF=1 local loss', 'Free disk / move partitions'],
  ['Slow disk', 'Latency metrics', 'Follower leaves ISR', 'Leader p99↑', 'ISR thrash', 'acks=all timeouts', 'If unclean later — yes', 'Replace disk; lower load'],
  ['Network partition broker', 'Missed fetches / registration', 'Fence / elect', 'May lose leadership', 'Shrink', 'Clients reconnect', 'Epoch fencing protects', 'Heal network; catch up'],
  ['AZ loss (good rack layout)', 'Multiple brokers gone', 'Elect in remaining AZs', 'Leaders move', 'ISR≥minISR if designed', 'Elevated latency', 'Low with minISR=2', 'Restore AZ; PLE'],
  ['AZ loss (bad layout)', 'All replicas of a partition gone', 'Cannot elect clean leader', 'OfflinePartitions', 'Empty ISR', 'Hard outage', 'High', 'Never place all RF in one AZ'],
  ['Corrupt segment', 'Checksum / load fail', 'Replica may stop', 'Failover if leader', 'Shrink', 'URP', 'Other replicas OK', 'Restore from healthy replica'],
];

export const TROUBLESHOOT: {title: string; symptoms: string; causes: string; fix: string}[] = [
  {title: 'Under-replicated partitions', symptoms: 'URP > 0 growing', causes: 'Slow follower, disk, net, overloaded broker', fix: 'Find lagging replicas; fix I/O; raise fetchers carefully; never “fix” by unclean'},
  {title: 'Offline partitions', symptoms: 'OfflinePartitionsCount > 0', causes: 'No ISR leader; all replicas down', fix: 'Bring brokers back; last resort unclean only with eyes open'},
  {title: 'ISR thrash', symptoms: 'IsrShrinks/Expands high', causes: 'Borderline lag, GC, net blips', fix: 'Stabilize resources; tune lag threshold only with data'},
  {title: 'High request latency', symptoms: 'Produce/Fetch p99↑', causes: 'Disk, ISR, queue, throttle, CPU', fix: 'RequestHandlerAvgIdle, disk latency, URP, quota throttle'},
  {title: 'Request queue growth', symptoms: 'RequestQueueSize↑', causes: 'I/O threads saturated, slow disk', fix: 'num.io.threads carefully; fix disk; shed load'},
  {title: 'Network processor saturation', symptoms: 'NetworkProcessorAvgIdle↓', causes: 'Too few network threads, TLS CPU, connection storms', fix: 'num.network.threads; connection limits'},
  {title: 'Controller unavailable', symptoms: 'ActiveControllerCount≠1 / admin fails', causes: 'Quorum issues, controller overload', fix: 'Check voters; CPU; metadata storm'},
  {title: 'Disk almost full', symptoms: 'Disk % high', causes: 'Retention too long, compaction lag, imbalance', fix: 'Retention; move partitions; add disks/brokers'},
  {title: 'Leader imbalance', symptoms: 'One broker BytesIn huge', causes: 'Preferred leaders piled; skew', fix: 'Preferred leader election; reassign'},
  {title: 'Hot partition', symptoms: 'One partition traffic dominates', causes: 'Key skew', fix: 'Re-key; isolate whales — more brokers won’t fix one key'},
  {title: 'Log cleaner backlog', symptoms: 'compacted topic size grows', causes: 'Too few cleaner threads, disk busy', fix: 'log.cleaner.*; I/O headroom'},
  {title: 'Broker restart too slow', symptoms: 'Long recovery', causes: 'Many partitions/segments, unclean shutdown', fix: 'Graceful shutdown; reduce partitions/broker; faster disks'},
  {title: 'Advertised listener broken', symptoms: 'Bootstrap OK, produce fails', causes: 'localhost/internal DNS advertised', fix: 'Fix advertised.listeners; k8s headless'},
  {title: 'Metadata storm', symptoms: 'Controller CPU, slow admin', causes: 'Topic create storms, flapping', fix: 'Rate-limit automation; stabilize brokers'},
  {title: 'Quota throttling', symptoms: 'Client latency, throttle-time↑', causes: 'producer_byte_rate quotas', fix: 'Raise quota or reduce client; don’t blame linger alone'},
];

export const CHAOS: string[][] = [
  ['Kill partition leader', 'Controller elects from ISR; clients refresh; brief errors'],
  ['Kill follower', 'ISR shrink; produces OK if minISR met'],
  ['Kill controller leader', 'Raft elects new; data plane continues'],
  ['Kill majority controllers', 'Metadata frozen; elections/admin stuck'],
  ['Fill disk', 'Partitions on that dir fail; URP/offline'],
  ['Inject disk latency', 'ISR shrink; acks=all timeouts'],
  ['Network partition one broker', 'Fenced/lost leadership; epoch protects'],
  ['Corrupt active segment', 'Replica stops; failover if leader'],
  ['Expire TLS cert', 'New connections fail'],
  ['Throttle replication', 'Reassignment/catch-up slows; watch URP'],
];

export const WAR_LEADER_CRASH = `Producer send → leader appends → followers may/may not have it
Leader crashes before ACK
Controller elects new leader from ISR
If unclean=false and write was HW-acked to ISR → no loss
If acks=1 and followers behind → LOSS possible
Producer retries to new leader (idempotent producer avoids dup)`;

export const WAR_QUORUM = `3 controllers; 2 die
Raft cannot commit metadata
Running partition leaders still serve Produce/Fetch for a while
Cannot elect replacements if a leader dies
Cannot create topics / reassign
Recovery: restore majority ASAP — this is SEV-1 control plane`;
