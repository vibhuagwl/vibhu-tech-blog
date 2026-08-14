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
  ['Overloaded broker', 'CPU/queue/latency', 'May lose leadership under lag', 'Hotspot leaders suffer', 'Followers leave ISR', 'Throttle / timeouts', 'Low if RF healthy', 'Rebalance leaders; scale'],
];

export const TROUBLESHOOT: {title: string; symptoms: string; causes: string; metrics: string; fix: string; prevention: string}[] = [
  {title: '1. Broker is down', symptoms: 'Missing from Metadata; clients fail to that node', causes: 'Process crash, OOM, host death, bad deploy', metrics: 'BrokerAlive / process up; BytesIn=0', fix: 'Restart; check OOM/GC/disk; restore host', prevention: 'Health checks; capacity headroom; rolling deploys'},
  {title: '2. Broker won’t start', symptoms: 'Exit on boot; storage/format errors', causes: 'Wrong cluster.id, unformatted log.dirs, port bind, bad config', metrics: 'N/A — startup logs', fix: 'kafka-storage format once; match cluster.id; fix listeners', prevention: 'Immutable config; never re-format live dirs'},
  {title: '3. Controller unavailable', symptoms: 'Admin ops hang; ActiveControllerCount≠1', causes: 'Controller process down, overload, bad voters list', metrics: 'ActiveControllerCount; controller CPU', fix: 'Restore controller; check quorum.voters', prevention: 'Dedicated controllers on large clusters'},
  {title: '4. Controller quorum loses majority', symptoms: 'No metadata commits; elections stuck', causes: '2/3 or 3/5 controllers down', metrics: 'Raft/quorum metrics; admin failures', fix: 'Restore majority ASAP (SEV-1)', prevention: 'Odd quorum across AZs; monitor voters'},
  {title: '5. Under-replicated partitions', symptoms: 'URP > 0 growing', causes: 'Slow follower, disk, net, overloaded broker', metrics: 'UnderReplicatedPartitions; IsrShrinks', fix: 'Find lagging replicas; fix I/O; raise fetchers carefully', prevention: 'Disk/net headroom; never “fix” via unclean'},
  {title: '6. Offline partitions', symptoms: 'OfflinePartitionsCount > 0', causes: 'No ISR leader; all replicas down', metrics: 'OfflinePartitionsCount', fix: 'Bring brokers back; unclean only with eyes open', prevention: 'RF=3 + rack-aware; minISR=2'},
  {title: '7. ISR continuously shrinking', symptoms: 'IsrShrinksPerSec high', causes: 'Borderline lag, GC, net blips, slow disk', metrics: 'IsrShrinks/Expands; replica lag', fix: 'Stabilize resources; tune lag threshold only with data', prevention: 'Isolate noisy tenants; SSD/NVMe'},
  {title: '8. ISR not expanding', symptoms: 'Follower never rejoins ISR', causes: 'Stuck fetcher, truncated wrongly, disk full, network', metrics: 'ReplicaFetcher lag; LEO vs leader', fix: 'Check fetcher threads/logs; free disk; heal net', prevention: 'Graceful shutdown; healthy catch-up bandwidth'},
  {title: '9. High disk utilization', symptoms: 'Disk % climbing', causes: 'Retention too long, compaction lag, imbalance', metrics: 'DiskUsed%; log size per dir', fix: 'Tighten retention; move partitions; add disks', prevention: 'Capacity model + 30%+ headroom'},
  {title: '10. Disk full', symptoms: 'ENOSPC; produce fails on that dir', causes: 'Retention/compaction/imbalance', metrics: 'Disk 100%; log errors', fix: 'Delete/move; expand; never fill silently', prevention: 'Alert at 70/80/90%; JBOD balancing'},
  {title: '11. High disk latency', symptoms: 'p99 produce ↑; ISR thrash', causes: 'HDD saturation, noisy neighbor, RAID rebuild', metrics: 'iowait; LogFlushTime; disk latency', fix: 'Move load; replace media; stop rebuild storms', prevention: 'NVMe for hot; dedicated disks'},
  {title: '12. High CPU', symptoms: 'CPU pegged; latency ↑', causes: 'TLS, compression, too many partitions, GC', metrics: 'CPU%; Network/Request idle ↓', fix: 'Profile; offload TLS; reduce partitions/broker', prevention: 'Size for TLS CPU; quotas'},
  {title: '13. High GC / JVM pauses', symptoms: 'STW pauses; ISR blips', causes: 'Heap too large/small; allocation storms', metrics: 'GC pause; heap used', fix: 'Tune G1/ZGC; shrink heap to favor page cache', prevention: 'Modest heap; leave RAM for OS cache'},
  {title: '14. High network utilization', symptoms: 'NIC saturated; timeouts', causes: 'Ingress+replication+egress; fan-out', metrics: 'BytesIn/Out; NIC %', fix: 'Add NICs/brokers; throttle reassignment', prevention: 'Plan RF amplification in capacity'},
  {title: '15. High request latency', symptoms: 'Produce/Fetch p99↑', causes: 'Disk, ISR, queue, throttle, CPU', metrics: 'Request metrics; idle %; URP', fix: 'Idle metrics → root cause; fix disk/ISR/quota', prevention: 'SLOs + load tests'},
  {title: '16. Request queue growing', symptoms: 'RequestQueueSize↑', causes: 'I/O threads saturated, slow disk', metrics: 'RequestQueueSize; RequestHandlerAvgIdle', fix: 'num.io.threads carefully; fix disk; shed load', prevention: 'Don’t raise threads blindly'},
  {title: '17. Network processor saturation', symptoms: 'NetworkProcessorAvgIdle↓', causes: 'Too few network threads, TLS, connection storms', metrics: 'NetworkProcessorAvgIdle', fix: 'num.network.threads; connection limits', prevention: 'Connection quotas; TLS offload'},
  {title: '18. Request handler saturation', symptoms: 'RequestHandlerAvgIdle↓', causes: 'Slow appends, too few io threads', metrics: 'RequestHandlerAvgIdle', fix: 'Fix storage; tune io threads', prevention: 'Page cache headroom'},
  {title: '19. Leader imbalance', symptoms: 'One broker BytesIn huge', causes: 'Preferred leaders piled; skew', metrics: 'BytesIn per broker; leader count', fix: 'Preferred leader election; reassign', prevention: 'Regular PLE after moves'},
  {title: '20. Partition imbalance', symptoms: 'Uneven partition counts/sizes', causes: 'Manual assignment drift; growth', metrics: 'Partitions per broker; disk per dir', fix: 'Throttled reassignment', prevention: 'Rack-aware tools; review after scale'},
  {title: '21. Broker imbalance', symptoms: 'Hot broker CPU/disk/net', causes: 'Leaders + large partitions concentrated', metrics: 'Per-broker resource panels', fix: 'Move leaders and heavy partitions', prevention: 'Capacity + placement reviews'},
  {title: '22. Replication lag', symptoms: 'Follower LEO trails', causes: 'Slow disk/net; fetcher starvation', metrics: 'Replica lag; MaxLag', fix: 'num.replica.fetchers; fix I/O; throttle other moves', prevention: 'Dedicated replication bandwidth'},
  {title: '23. Slow follower', symptoms: 'One replica always last in ISR', causes: 'Bad disk, noisy VM, AZ latency', metrics: 'Per-replica lag', fix: 'Replace hardware; move replica', prevention: 'Heterogeneous hardware detection'},
  {title: '24. Log cleaner backlog', symptoms: 'Compacted topic size grows', causes: 'Too few cleaner threads, disk busy', metrics: 'LogCleaner metrics; dirty ratio', fix: 'log.cleaner.*; I/O headroom', prevention: 'Size cleaner for compact volume'},
  {title: '25. Compaction not progressing', symptoms: 'Dirty ratio stuck high', causes: 'Cleaner disabled/errors; tiny segments', metrics: 'Cleaner backlog; errors in logs', fix: 'Enable cleaner; fix exceptions; segment sizing', prevention: 'Monitor compact topics separately'},
  {title: '26. Too many partitions', symptoms: 'Slow restart; controller load; FD pressure', causes: 'Over-partitioning “for scale”', metrics: 'Partition count; restart time; FD', fix: 'Split domains/clusters; stop creating more', prevention: 'Partition budget per broker'},
  {title: '27. Metadata operation storm', symptoms: 'Controller CPU; slow admin', causes: 'Topic create storms, flapping', metrics: 'Controller request rates', fix: 'Rate-limit automation; stabilize brokers', prevention: 'GitOps with budgets'},
  {title: '28. Leader election storm', symptoms: 'Frequent leadership changes', causes: 'Broker flapping; net flaps', metrics: 'LeaderElectionRate; ISR churn', fix: 'Stabilize hosts; fix net', prevention: 'Controlled shutdown; health gates'},
  {title: '29. Frequent controller changes', symptoms: 'Active controller ID flapping', causes: 'Controller resource starvation; net', metrics: 'Controller election count', fix: 'Isolate controllers; fix quorum net', prevention: 'Dedicated controller nodes'},
  {title: '30. Authentication failures', symptoms: 'SASL errors; clients cannot connect', causes: 'Bad creds, clock skew, principal map', metrics: 'FailedAuthenticationRate', fix: 'Fix SCRAM/Kerberos/OAuth config', prevention: 'Credential rotation drills'},
  {title: '31. ACL failures', symptoms: 'Authorization failed', causes: 'Missing ACL; wrong principal', metrics: 'FailedAuthorizationRate', fix: 'Grant least-privilege ACLs', prevention: 'ACL as code; deny-by-default tests'},
  {title: '32. TLS failures', symptoms: 'Handshake errors; expired cert', causes: 'Wrong truststore; expired cert; hostname', metrics: 'SSL handshake failures', fix: 'Rotate certs with overlap; fix SAN', prevention: 'Expiry alerts; dual-cert windows'},
  {title: '33. Quota throttling', symptoms: 'Client latency; throttle-time↑', causes: 'producer_byte_rate quotas', metrics: 'ThrottleTime; quota metrics', fix: 'Raise quota or reduce client', prevention: 'Per-tenant quotas by design'},
  {title: '34. Broker registration failure', symptoms: 'Broker never joins Metadata', causes: 'Bad node.id, voters, features, epoch fence', metrics: 'Registration errors in logs', fix: 'Align cluster.id/features; clear fencing cause', prevention: 'Stable node.id; careful feature upgrades'},
  {title: '35. Metadata inconsistency symptoms', symptoms: 'Clients see stale leaders; NOT_LEADER storms', causes: 'Slow metadata publish; client refresh too slow', metrics: 'Metadata error rates', fix: 'Fix controller publish path; client metadata.max.age', prevention: 'Healthy quorum; avoid flaps'},
  {title: '36. Disk corruption', symptoms: 'Checksum/load failures', causes: 'Bad media; crash mid-write', metrics: 'Log load errors', fix: 'Stop replica; restore from healthy ISR peer', prevention: 'ECC storage; RF≥3'},
  {title: '37. Advertised listener problem', symptoms: 'Bootstrap OK, produce fails', causes: 'localhost/internal DNS advertised', metrics: 'Client connect errors to advertised host', fix: 'Fix advertised.listeners; k8s headless', prevention: 'Smoke test from outside cluster'},
  {title: '38. Broker cannot reach another broker', symptoms: 'Replica fetch fails; URP', causes: 'Firewall, wrong inter-broker listener, TLS', metrics: 'Fetcher errors; URP', fix: 'Open inter-broker path; fix listener map', prevention: 'Separate internal listener tests'},
  {title: '39. Broker restart takes too long', symptoms: 'Long recovery window', causes: 'Many partitions/segments; unclean shutdown', metrics: 'Startup duration; partition load time', fix: 'Graceful shutdown; fewer partitions/broker; faster disks', prevention: 'controlled.shutdown; partition budget'},
  {title: '40. Cluster recovery takes too long', symptoms: 'Extended URP after outage', causes: 'Huge catch-up; throttle too low; disk bottleneck', metrics: 'URP decay rate; replication bytes', fix: 'Raise catch-up bandwidth carefully; add fetchers', prevention: 'Rehearse AZ loss; size replication headroom'},
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
  ['Exhaust CPU', 'Queues grow; ISR thrash; p99 explodes'],
  ['Exhaust memory / page cache', 'Disk reads spike; latency cliff'],
  ['Drop packets inter-broker', 'Fetch timeouts; URP'],
  ['Restart leader mid-acks=all', 'Client retries; epoch fencing; check durability knobs'],
  ['Restart follower during catch-up', 'ISR delay; URP until caught'],
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

export const ERROR_CODES: string[][] = [
  ['NOT_LEADER_OR_FOLLOWER', 'Stale metadata / leadership moved', 'Yes (refresh)', 'Client metadata refresh'],
  ['LEADER_NOT_AVAILABLE', 'Election in progress', 'Yes', 'Wait; check Offline partitions'],
  ['NOT_ENOUGH_REPLICAS', '|ISR| < min.insync.replicas', 'Yes/ops', 'Restore replicas; never unclean as first fix'],
  ['NOT_ENOUGH_REPLICAS_AFTER_APPEND', 'Appended then ISR thinned', 'Yes/ops', 'Same — durability pressure'],
  ['REQUEST_TIMED_OUT', 'Broker overloaded / ISR wait', 'Yes', 'Latency/ISR/disk triage'],
  ['TOPIC_AUTHORIZATION_FAILED', 'ACL deny', 'No', 'Fix ACLs'],
  ['CLUSTER_AUTHORIZATION_FAILED', 'Cluster ACL', 'No', 'Fix CLUSTER_ACTION grants'],
  ['SASL_AUTHENTICATION_FAILED', 'Bad credentials', 'No', 'Fix SASL'],
  ['INVALID_REQUEST / RECORD_TOO_LARGE', 'Client misconfig', 'No', 'Align max bytes'],
  ['UNKNOWN_TOPIC_OR_PARTITION', 'Missing topic / stale meta', 'Maybe', 'Create topic; refresh'],
  ['FENCED_LEADER_EPOCH / stale epoch paths', 'Old leader fenced', 'Internal/retry', 'Epoch recovery working as designed'],
  ['BROKER_NOT_AVAILABLE', 'Broker down', 'Yes', 'Restore broker'],
];
