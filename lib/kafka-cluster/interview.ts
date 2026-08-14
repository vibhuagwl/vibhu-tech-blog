import type {InterviewQ} from './types';

export const SENIOR: InterviewQ[] = [
  {
    id: 's1',
    topic: 'Produce path',
    question: 'What happens inside the broker when a ProduceRequest arrives?',
    answer30s:
      'Network processor parses it, I/O handler routes to ReplicaManager on the leader partition, append to UnifiedLog/segment via page cache, wait for ISR if acks=all, respond with base offset.',
    answer2m:
      'Followers are not on that write path; they pull via Fetch as replica fetchers. Controller is not consulted per produce. Correlation ID ties the response.',
    followUps: ['Where does HW move?', 'What if not leader?'],
  },
  {
    id: 's2',
    topic: 'ISR',
    question: 'What exactly is ISR and why does it matter?',
    answer30s:
      'In-sync replicas that caught up within replica.lag.time.max.ms. acks=all and min.insync.replicas use ISR as the durability set. HW cannot advance beyond ISR.',
    answer2m:
      'Slow disk/network shrinks ISR. If |ISR| < minISR, acks=all fails — prefer that to silent under-replication. URP means RF > |ISR|.',
    followUps: ['How does a replica re-enter ISR?'],
  },
  {
    id: 's3',
    topic: 'Leader crash',
    question: 'Partition leader crashes — walk every step.',
    answer30s:
      'Controller detects loss, elects from ISR, bumps leader epoch, commits metadata, brokers update cache, clients refresh and continue.',
    answer2m:
      'With unclean=false, out-of-ISR cannot become leader. Stale old leader is fenced by epoch. Brief client errors are expected; data loss is not if durability knobs were set.',
    followUps: ['What is leader epoch for?'],
  },
  {
    id: 's4',
    topic: 'KRaft',
    question: 'How does KRaft replace ZooKeeper for the cluster?',
    answer30s:
      'A Raft quorum of controllers stores the metadata log. Brokers register and receive metadata updates. Kafka 4.x is KRaft-only.',
    answer2m:
      'Data plane still lives on brokers. Quorum loss freezes metadata changes, not instantly every produce. Combined broker+controller is fine small; split when metadata fights log I/O.',
    followUps: ['What if majority controllers die?'],
    trick: '“Every produce goes through the controller.”',
  },
  {
    id: 's5',
    topic: 'HW',
    question: 'LEO vs HW vs LSO?',
    answer30s:
      'LEO is local end. HW is ISR-replicated watermark for consumers. LSO bounds transactional visibility for read_committed.',
    answer2m:
      'Followers trail LEO. HW is min over ISR LEOs (conceptually). Consumers reading past HW would see unreplicated data.',
    followUps: ['acks=1 and HW?'],
  },
  {
    id: 's6',
    topic: 'Storage',
    question: 'How does Kafka store a record on disk?',
    answer30s:
      'Append to the active segment .log, update offset/time indexes, rely on page cache; roll segments by size/time; retention deletes old closed segments.',
    answer2m:
      'Not a per-message fsync story by default. Durability is replication. Compaction is a cleaner rewriting segments for keyed topics.',
    followUps: ['Why not keep logs in JVM heap?'],
  },
  {
    id: 's7',
    topic: 'Unclean',
    question: 'When would you enable unclean leader election?',
    answer30s:
      'Almost never for money. Only when availability matters more than possible loss of unreplicated tail.',
    answer2m:
      'Unclean elects out-of-ISR → may lose messages the old leader had. Default false. Prefer failing produces when ISR is thin.',
    followUps: ['Safety vs availability?'],
  },
  {
    id: 's8',
    topic: 'AZ',
    question: 'Design a 3-AZ Kafka cluster with no planned data loss.',
    answer30s:
      'RF=3, rack-aware placement one replica per AZ, minISR=2, unclean=false, controllers across AZs, acks=all producers.',
    answer2m:
      'RF=3 alone is insufficient if all replicas land in one AZ. After AZ loss, watch leader concentration and run preferred leader election when recovering.',
    followUps: ['Why not minISR=3?'],
  },
  {
    id: 's9',
    topic: 'Scale',
    question: 'How do you add brokers safely?',
    answer30s:
      'Join KRaft, verify healthy, then throttled partition reassignment. Nothing auto-balances for you.',
    answer2m:
      'Monitor URP, disk, throttle, ISR during move. Preferred leader election afterward. Removing a broker is the reverse: move replicas off, then shut down.',
    followUps: ['What does NOT happen automatically?'],
  },
  {
    id: 's10',
    topic: 'Hotspot',
    question: 'One broker has 90% of traffic — why?',
    answer30s:
      'Leader imbalance, partition skew, or key hotspots concentrating leaders on one node.',
    answer2m:
      'Check BytesIn per broker vs per partition. Fix with preferred leader election, reassignment, or re-keying. Adding consumers does not move leadership.',
    followUps: ['Hot partition vs hot broker?'],
  },
  {
    id: 's11',
    topic: 'Threading',
    question: 'NetworkProcessorAvgIdle vs RequestHandlerAvgIdle — what do they tell you?',
    answer30s:
      'Network idle low → socket/TLS/connection pressure. Handler idle low → append/fetch/disk/ISR wait pressure.',
    answer2m:
      'Raising the wrong thread pool multiplies contention. Always pair with queue sizes and disk latency.',
    followUps: ['When would you raise num.replica.fetchers?'],
  },
  {
    id: 's12',
    topic: 'Page cache',
    question: 'Why is Kafka broker memory not “just -Xmx”?',
    answer30s:
      'Logs live in OS page cache. Heap holds threads, metadata, buffers — oversized heap steals cache and hurts throughput.',
    answer2m:
      'Fetch hot path can sendfile from page cache. Size RAM for working set of active segments + replication.',
    followUps: ['What does zero-copy buy you?'],
  },
  {
    id: 's13',
    topic: 'Epoch',
    question: 'How do leader epochs prevent split-brain corruption?',
    answer30s:
      'Each leadership generation increments epoch. Stale leaders are fenced; replicas truncate divergent suffixes using epoch checkpoints.',
    answer2m:
      'After network partitions, an old leader cannot quietly append forever. This is core to safe recovery with unclean=false.',
    followUps: ['Relate to fencing tokens on producers?'],
  },
  {
    id: 's14',
    topic: 'Reassignment',
    question: 'What fails during an unthrottled partition reassignment?',
    answer30s:
      'Replication bandwidth eats disk/net; followers lag; ISR shrinks; client latency spikes.',
    answer2m:
      'Always throttle, watch URP, and schedule moves off peak. Prefer incremental moves over big-bang.',
    followUps: ['How do you evacuate one disk?'],
  },
  {
    id: 's15',
    topic: 'Defaults',
    question: 'Name three Kafka 4.x lab defaults that are dangerous in production.',
    answer30s:
      'default.replication.factor=1, min.insync.replicas=1, auto.create.topics.enable=true.',
    answer2m:
      'Also unclean=false is good — leave it. Override RF/minISR/auto-create explicitly; verify on your exact release docs.',
    followUps: ['What about offsets.topic.replication.factor?'],
    trick: 'Assuming RF=3 is the broker default.',
  },
];

export const ARCHITECT: InterviewQ[] = [
  {
    id: 'a1',
    topic: '1M/s',
    question: 'Design Kafka for 1M events/sec.',
    answer30s:
      'Start from bytes/s, replication amplification, disk and NIC ceilings → broker count. Partitions from parallelism. RF=3 across AZs. Observe page cache and URP.',
    answer2m:
      'Example: 1KB events → ~1 GB/s ingress, ×~3 write with RF. Need brokers whose disks/NICs sum with headroom. Controllers dedicated. Quotas for noisy clients. Don’t invent 1000 partitions without math.',
    followUps: ['How do you validate the bottleneck?'],
  },
  {
    id: 'a2',
    topic: 'Quorum',
    question: 'Two of three KRaft controllers fail.',
    answer30s:
      'Metadata commits stop. Existing leaders may still serve. New elections/admin ops fail until majority returns.',
    answer2m:
      'This is control-plane SEV-1. Data-plane is not magically fine forever — first leader death without election becomes an outage. Restore voters; never shrink quorum casually.',
    followUps: ['5-controller trade-off?'],
  },
  {
    id: 'a3',
    topic: 'DR',
    question: 'Multi-region Kafka DR with low RPO.',
    answer30s:
      'Do not stretch one RF across WAN. Dual clusters + MM2/Cluster Linking; accept async lag; business idempotency on failover.',
    answer2m:
      'RPO≈0 active-active is product complexity (duplicates, ordering). Prefer honest RPO of link lag. Offsets and transactional state are cluster-local.',
    followUps: ['Active-active pitfalls?'],
  },
  {
    id: 'a4',
    topic: 'Partitions',
    question: 'Cluster has 500k partitions — what breaks?',
    answer30s:
      'Controller/metadata load, FD and memory per broker, recovery time, leader election cost, slower rebalances.',
    answer2m:
      'More partitions ≠ free throughput. Cap partitions/broker; split clusters by domain; watch metadata metrics and restart times.',
    followUps: ['How do you shrink safely?'],
    trick: 'More partitions always increase throughput linearly.',
  },
  {
    id: 'a5',
    topic: 'Upgrade',
    question: 'Rolling upgrade Kafka brokers safely.',
    answer30s:
      'Follow official upgrade path and feature levels. Rolling restart with controlled.shutdown, one broker at a time, verify URP=0 between steps.',
    answer2m:
      'Controllers and inter-broker protocol compatibility matter. Canary a broker. Have a rollback story — some upgrades are one-way after feature finalize.',
    followUps: ['Client version skew?'],
  },
  {
    id: 'a6',
    topic: 'Financial',
    question: 'Design Kafka for 100k+ tx/sec payments with no accidental data loss.',
    answer30s:
      'Multi-AZ RF=3 minISR=2 unclean=false; acks=all + idempotence; dedicated controllers; NVMe JBOD; quotas; observability; MM2 DR.',
    answer2m:
      'Every architectural number comes from bytes×RF and failure domains. Prove AZ loss with chaos. Prefer failing writes over silent loss.',
    followUps: ['Where do you place controllers?'],
  },
  {
    id: 'a7',
    topic: 'K8s',
    question: 'What breaks first when running Kafka on Kubernetes?',
    answer30s:
      'advertised.listeners, storage classes/PVs, zone anti-affinity, and resource limits that starve page cache.',
    answer2m:
      'StatefulSets need stable identity. Rolling restarts must honor controlled shutdown. Ephemeral disks are a data-loss machine.',
    followUps: ['How do you do topology spread?'],
  },
  {
    id: 'a8',
    topic: 'Availability',
    question: 'How do you target 99.99% availability for Kafka?',
    answer30s:
      'Multi-AZ RF with rack awareness, healthy quorum, rolling ops, fast detection, capacity headroom, and practiced recovery.',
    answer2m:
      'Four nines is an ops+design claim. Measure URP/offline SLOs. Control-plane quorum is part of the budget.',
    followUps: ['What eats your error budget?'],
  },
];

export const RAPID: InterviewQ[] = [
  {id: 'r1', topic: 'Rapid', question: 'Who writes the partition log?', answer30s: 'The leader broker.', answer2m: 'Followers fetch.', followUps: ['Controller?']},
  {id: 'r2', topic: 'Rapid', question: 'Kafka 4.x ZooKeeper?', answer30s: 'Removed. KRaft only.', answer2m: 'Metadata Raft quorum.', followUps: ['Combined roles?']},
  {id: 'r3', topic: 'Rapid', question: 'Default min.insync.replicas?', answer30s: '1 (override in prod).', answer2m: 'Use 2 with RF=3.', followUps: ['acks=all?']},
  {id: 'r4', topic: 'Rapid', question: 'URP means?', answer30s: 'Under-replicated partitions.', answer2m: '|ISR| < RF.', followUps: ['P0?']},
  {id: 'r5', topic: 'Rapid', question: 'Page cache role?', answer30s: 'Holds hot log data outside heap.', answer2m: 'Enables sequential I/O + zero-copy fetch.', followUps: ['Heap size?']},
  {id: 'r6', topic: 'Rapid', question: 'unclean election default?', answer30s: 'false', answer2m: 'Avoid data loss.', followUps: ['When true?']},
  {id: 'r7', topic: 'Rapid', question: 'Add broker auto-balance?', answer30s: 'No.', answer2m: 'Reassign partitions explicitly.', followUps: ['Throttle?']},
  {id: 'r8', topic: 'Rapid', question: 'HW vs LEO?', answer30s: 'HW≤ISR; LEO local.', answer2m: 'Consumers use HW.', followUps: ['LSO?']},
  {id: 'r9', topic: 'Rapid', question: 'num.network.threads default?', answer30s: '3', answer2m: 'Per data listener.', followUps: ['Idle metric?']},
  {id: 'r10', topic: 'Rapid', question: 'Preferred leader?', answer30s: 'First replica in assignment.', answer2m: 'PLE rebalances produce load.', followUps: ['Hot broker?']},
  {id: 'r11', topic: 'Rapid', question: 'Replica fetch direction?', answer30s: 'Follower pulls from leader.', answer2m: 'Not push replication.', followUps: ['num.replica.fetchers?']},
  {id: 'r12', topic: 'Rapid', question: 'Segment roll triggers?', answer30s: 'Size and/or time.', answer2m: 'log.segment.bytes / .ms', followUps: ['Retention deletes?']},
  {id: 'r13', topic: 'Rapid', question: 'JBOD vs one RAID for Kafka?', answer30s: 'Prefer multiple log.dirs.', answer2m: 'Isolate disk failure blast radius.', followUps: ['Disk full?']},
  {id: 'r14', topic: 'Rapid', question: 'Who advances HW?', answer30s: 'Leader based on ISR progress.', answer2m: 'Not controller per message.', followUps: ['minISR?']},
  {id: 'r15', topic: 'Rapid', question: 'process.roles values?', answer30s: 'broker, controller, or both.', answer2m: 'Split on large clusters.', followUps: ['Voters?']},
];

export const STAFF: InterviewQ[] = [
  {
    id: 'st1',
    topic: 'Staff',
    question: 'Leader fails immediately after a successful local append but before ISR ack. What happens?',
    answer30s:
      'Depends on acks. acks=1 may have already acked the client with data not on followers — loss risk. acks=all waits; client retries after election.',
    answer2m:
      'New leader from ISR won’t have unreplicated tail. Idempotent producer retries safely. This is why payments use acks=all + minISR.',
    followUps: ['Relate to HW vs LEO'],
    trick: '“Leader append always means durable cluster-wide.”',
  },
  {
    id: 'st2',
    topic: 'Staff',
    question: 'Controller fails during leader election — is the cluster safe?',
    answer30s:
      'Raft elects a new controller; in-flight metadata must be re-driven. Data plane keeps serving existing leaders.',
    answer2m:
      'Partitions mid-election may stay unavailable until the new controller completes. Quorum health is the control-plane SLO.',
    followUps: ['What if majority is gone?'],
  },
  {
    id: 'st3',
    topic: 'Staff',
    question: 'Network partition isolates a leader that still thinks it is leader. How does Kafka stay safe?',
    answer30s:
      'Controller/ISR path and leader epochs fence the stale leader; clients refresh to the new leader.',
    answer2m:
      'KRaft majority prevents unsafe metadata commits. Old leader cannot win a new epoch without quorum.',
    followUps: ['Client behavior during the flap'],
  },
  {
    id: 'st4',
    topic: 'Staff',
    question: 'Distinguish data loss vs unavailable vs delayed vs duplicate at the broker layer.',
    answer30s:
      'Loss: unreplicated data discarded (acks=1, unclean, RF=1). Unavailable: no leader/ISR. Delayed: lag/throttle. Duplicate: client retry without idempotence.',
    answer2m:
      'Broker durability knobs mainly bound loss and unavailability. Duplicates are mostly client/protocol concerns.',
    followUps: ['Which metrics catch each?'],
  },
  {
    id: 'st5',
    topic: 'Staff',
    question: 'Why can one partition stay hot after you add 10 brokers?',
    answer30s:
      'Ordering and key hashing pin a key to one partition; brokers don’t split a partition automatically.',
    answer2m:
      'Add partitions (breaks key→partition history), re-key, or isolate whale keys. Scale-out helps only when load is partition-spread.',
    followUps: ['Impact of increasing partitions on ordering'],
  },
];

export const TROUBLESHOOT_Q: InterviewQ[] = [
  {
    id: 't1',
    topic: 'Troubleshoot',
    question: 'ISR keeps shrinking — how do you triage in 5 minutes?',
    answer30s:
      'URP + IsrShrinks → find lagging broker → disk latency, CPU, net, GC → fix resource before touching unclean or lag knobs.',
    answer2m:
      'Check BytesIn imbalance and fetcher errors. If one disk is sick, evacuate that log.dir’s partitions.',
    followUps: ['What metric proves catch-up?'],
  },
  {
    id: 't2',
    topic: 'Troubleshoot',
    question: 'OfflinePartitionsCount > 0 — first actions?',
    answer30s:
      'Identify partitions with empty ISR / all replicas down. Restore brokers. Unclean only as conscious last resort.',
    answer2m:
      'Check AZ/rack placement mistakes. Prefer bringing replicas online over electing stale data.',
    followUps: ['How do clients fail?'],
  },
  {
    id: 't3',
    topic: 'Troubleshoot',
    question: 'RequestHandlerAvgIdle collapses — what next?',
    answer30s:
      'Disk append latency, ISR waits, too few io threads, or overload. Fix storage/load before blindly raising threads.',
    answer2m:
      'Pair with RequestQueueSize and produce p99. Network idle may still look fine.',
    followUps: ['Contrast NetworkProcessorAvgIdle'],
  },
  {
    id: 't4',
    topic: 'Troubleshoot',
    question: 'Broker restart takes 40 minutes — why?',
    answer30s:
      'Partition/segment count, unclean shutdown recovery, slow disks, cold page cache.',
    answer2m:
      'Use controlled.shutdown; budget partitions/broker; faster media; avoid kill -9.',
    followUps: ['How does recovery interact with URP?'],
  },
  {
    id: 't5',
    topic: 'Troubleshoot',
    question: 'Compacted topic not compacting — checklist?',
    answer30s:
      'Cleaner enabled? Threads? Dirty ratio? Disk busy? Errors in cleaner logs? Segment sizing?',
    answer2m:
      'Compaction is async and I/O heavy. Never assume “only latest key exists” without reading.',
    followUps: ['Tombstone retention?'],
  },
];

export const ALL: InterviewQ[] = [...SENIOR, ...ARCHITECT, ...RAPID, ...STAFF, ...TROUBLESHOOT_Q];
