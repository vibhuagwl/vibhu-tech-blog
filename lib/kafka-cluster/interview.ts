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
];

export const ALL: InterviewQ[] = [...SENIOR, ...ARCHITECT, ...RAPID];
