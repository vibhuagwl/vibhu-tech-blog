import type {InterviewQ} from './types';

export const SENIOR: InterviewQ[] = [
  {
    id: 's1',
    topic: 'Internals',
    question: 'How does Kafka work internally?',
    answer30s:
      'Distributed append-only log. Topics split into partitions stored on brokers. A controller elects leaders. Producers append to the leader; followers fetch; consumers pull by offset.',
    answer2m:
      'A record is a bytes payload plus key, timestamp, and headers. The partitioner maps it to a partition. The leader appends to a segment file and assigns the next offset. Followers replicate by fetching. Consumers in a group are assigned partitions and fetch from the high watermark, committing offsets to __consumer_offsets. Retention, not consume, deletes data.',
    followUps: ['Log vs queue?', 'What is a segment?'],
    trick: 'Calling Kafka a message queue that deletes on consume.',
  },
  {
    id: 's2',
    topic: 'Write path',
    question: 'How does Kafka write content into a partition?',
    answer30s:
      'Only the leader appends. Sequential write into the active segment, offset assigned, page cache, then replication. Not a random B-tree insert.',
    answer2m:
      'Active segment is a .log file plus offset and time indexes. When it hits log.segment.bytes it rolls. Kafka leans on OS page cache and sequential I/O. Durability for produces is replication to ISR (acks=all), not fsync on every record.',
    followUps: ['What is HW vs LEO?', 'Why sequential I/O matters?'],
  },
  {
    id: 's3',
    topic: 'Replication',
    question: 'How is data replicated between Kafka instances?',
    answer30s:
      'Each partition has RF replicas on different brokers. Followers pull from the leader. ISR is the set that is caught up. acks=all waits on ISR.',
    answer2m:
      'RF=3 means three copies. Followers run replica fetchers. If a follower lags past replica.lag.time.max.ms it leaves ISR. min.insync.replicas=2 plus acks=all means the producer ACK requires two live copies. Controller elects a new leader from ISR if the current leader dies.',
    followUps: ['unclean leader election?', 'Push or pull?'],
    trick: 'Saying the leader pushes to followers.',
  },
  {
    id: 's4',
    topic: 'Production',
    question: 'How many Kafka instances do you need in production?',
    answer30s:
      'Floor is 3 brokers for RF=3, plus a KRaft quorum of 3. Real load often 5–7 brokers. Consumers scale with partitions, not with a magic pod count.',
    answer2m:
      'Never one broker with RF=3 — that is a single disk failure domain. Spread replicas across racks/AZs. Combined broker+controller is fine for small clusters; dedicated controllers for large metadata. Schema Registry and Connect are separate. Extra consumers beyond partition count idle in the group.',
    followUps: ['Why not RF=2?', 'How do you size partitions?'],
    trick: 'Answering “as many consumers as QPS” without partitions.',
  },
  {
    id: 's5',
    topic: 'Consumer',
    question: 'If a consumer fails, will the same consumer read the same message?',
    answer30s:
      'Not the same JVM. The group re-reads uncommitted offsets. Whoever inherits the partition — restarted pod or a sibling — sees those records again.',
    answer2m:
      'Kafka does not pin messages to a process. Contract is group.id + partition assignment + committed offset. Crash before commit → at-least-once replay. Crash after commit → no replay for that group. A different group has its own cursor and can read the same log independently. Payments need idempotency because replay is expected.',
    followUps: ['auto.commit?', 'Two groups on one topic?'],
    trick: '“The same consumer always retries the same message.”',
  },
  {
    id: 's6',
    topic: 'Offsets',
    question: 'Where does Kafka store consumer progress?',
    answer30s: 'Committed offsets in the internal topic __consumer_offsets, keyed by group + topic + partition.',
    answer2m:
      'The log itself is not marked consumed. That is why fan-out is cheap: N groups, N cursors, one log. Manual commit after side effects is the payment default. auto.offset.reset only applies when there is no committed offset.',
    followUps: ['commitSync vs async?', 'Replay yesterday?'],
  },
  {
    id: 's7',
    topic: 'Ordering',
    question: 'What ordering does Kafka actually guarantee?',
    answer30s: 'Total order inside one partition. No order across partitions of a topic.',
    answer2m:
      'Put the order boundary in the key (accountId, orderId). Same key → same partition → same consumer in a group at a time. Global order requires one partition, which kills parallelism.',
    followUps: ['Hot key?'],
  },
  {
    id: 's8',
    topic: 'Deploy',
    question: 'KRaft vs ZooKeeper — what do you run in 2026?',
    answer30s: 'KRaft. New clusters should not introduce ZooKeeper.',
    answer2m:
      'Metadata lives in a Raft quorum of controllers. Brokers still store partition logs. Interview should mention ZK history: controller used ZK for membership. Migration exists, but greenfield is KRaft.',
    followUps: ['Odd-sized quorum?'],
  },
  {
    id: 's9',
    topic: 'HW',
    question: 'What is the high watermark?',
    answer30s: 'The offset known to be replicated to the ISR. Consumers read below it so they do not see unreplicated data.',
    answer2m:
      'LEO is local log end. Followers can be behind. HW is the durability cursor. Leader failure then elects from ISR so the new leader’s log should contain everything previously HW-acked.',
    followUps: ['acks=1 vs HW?'],
  },
  {
    id: 's10',
    topic: 'Groups',
    question: 'Why can two consumer groups both read the same messages?',
    answer30s: 'Because consume does not delete. Each group has its own committed offsets.',
    answer2m:
      'That is the log model: settlement-workers and audit-indexers share payments. Inside one group, a partition has at most one owner so you do not double-process in that group.',
    followUps: ['static membership?'],
  },
];

export const ARCHITECT: InterviewQ[] = [
  {
    id: 'a1',
    topic: 'Capacity',
    question: 'Size a Kafka cluster for a payments bus at 20k events/s, 7-day retention.',
    answer30s:
      'Start from bytes/s × retention × RF for disk, then brokers from disk and network, partitions from consumer parallelism.',
    answer2m:
      'Example: 2 KB events → ~40 MB/s inbound. RF=3 → ~120 MB/s cluster write. 7 days ≈ 70 TB raw before indexes/compaction overhead — actually 40MB/s × 86400 × 7 × 3 ≈ 72 TB. 6× 15 TB brokers with headroom, 3 AZs, RF=3, minISR=2. Partition count: if one consumer handles 2k/s, need ~10 partitions plus spare for bursts. Measure, do not cargo-cult 100 partitions.',
    followUps: ['compaction vs delete?', 'tiered storage?'],
  },
  {
    id: 'a2',
    topic: 'Failure',
    question: 'Design for losing one AZ.',
    answer30s: 'Rack-aware replica placement, 3 AZs, RF=3, minISR=2 so one AZ loss still accepts produces.',
    answer2m:
      'If minISR=3, one AZ death blocks acks=all. If RF=2, one AZ death can lose a partition. Prefer staying writable with two copies over blocking the payment API. Controllers also spread across AZs.',
    followUps: ['What if two AZs die?'],
    trick: 'minISR=RF so any broker blip stalls the bus.',
  },
  {
    id: 'a3',
    topic: 'EOS',
    question: 'Is Kafka exactly-once for a Spring payment worker?',
    answer30s: 'Kafka EOS is for the Kafka-in / Kafka-out path. A DB ledger still needs idempotency.',
    answer2m:
      'Idempotent producer + transactions can make consume-transform-produce atomic. Side effects outside Kafka (PSP charge, ledger row) are not covered. Staff answer: unique payment_id, state machine, outbox. Do not claim EOS as a business guarantee.',
    followUps: ['read_committed isolation?'],
  },
  {
    id: 'a4',
    topic: 'Rebalance',
    question: 'Consumer dies every few minutes — what happens internally?',
    answer30s:
      'Group coordinator marks the member dead after session timeout, revokes partitions, assigns them to others, stop-the-world pause unless cooperative sticky.',
    answer2m:
      'Uncommitted work is replayed. Frequent rebalances destroy throughput (lag storms). Fix session.timeout / heartbeat / max.poll.interval, static membership, or stop doing 30s work inside poll. Cooperative sticky reduces the blast radius.',
    followUps: ['eager vs cooperative?'],
  },
  {
    id: 'a5',
    topic: 'Disk',
    question: 'Kafka disk fills — what actually happens?',
    answer30s: 'Retention cannot free space fast enough; brokers reject produces; under-replication spreads.',
    answer2m:
      'Logs are segments. Oldest segments delete when retention.ms/bytes hit, unless a consumer is “done” — consume does not free disk. Alerts on disk %, log-dir usage, and produce error rate. Never put Kafka on a shared NAS.',
    followUps: ['compaction topics?'],
  },
  {
    id: 'a6',
    topic: 'Multi-tenant',
    question: 'How many clusters vs how many brokers?',
    answer30s: 'One shared cluster with quotas for most teams; isolate noisy or regulated domains.',
    answer2m:
      'Adding brokers scales a cluster. A second cluster is for blast-radius, compliance, or wildly different SLAs — not because “we have two apps”. Quotas, ACLs, and separate topics first.',
    followUps: ['MirrorMaker?'],
  },
  {
    id: 'a7',
    topic: 'Leader',
    question: 'Preferred leader election and why it matters.',
    answer30s: 'The first replica in the replica list is preferred. After a bounce, leadership should return to spread load.',
    answer2m:
      'If all leaders pile onto two brokers, those disks and NICs melt while others idle. auto.leader.rebalance.enable and replica.selector / rack awareness keep produce traffic even.',
    followUps: ['observer replicas?'],
  },
  {
    id: 'a8',
    topic: 'Idempotent producer',
    question: 'What problem does enable.idempotence actually solve?',
    answer30s: 'Retries from the same producer session will not append duplicate records to the log.',
    answer2m:
      'PID + sequence per partition. It does not stop a second producer, a second HTTP call, or consumer redelivery. Interview trap: “idempotent producer = exactly-once payments.”',
    followUps: ['max.in.flight?'],
    trick: 'Idempotent producer replaces consumer idempotency.',
  },
  {
    id: 'a9',
    topic: 'Connect',
    question: 'Where do Kafka Connect / ksqlDB sit in the instance count?',
    answer30s: 'Separate workers. Do not colocate Connect tasks on broker JVMs in production.',
    answer2m:
      'Connect cluster is 2–3+ workers with its own group. Brokers stay storage/network appliances. Treat Connect like app runtime: heap, tasks, DLQ.',
    followUps: ['exactly.once.source.support?'],
  },
  {
    id: 'a10',
    topic: 'DR',
    question: 'How do you replicate Kafka across regions?',
    answer30s: 'Cluster linking / MirrorMaker 2, not RF across a WAN as one cluster.',
    answer2m:
      'A single RF=3 cluster stretched over 200ms WAN is a bad controller and ISR story. Two clusters, async replicate, offset translation for consumers, accept lag. Payments often dual-write via outbox instead of stretching Kafka.',
    followUps: ['offset translation?'],
  },
];

export const RAPID: InterviewQ[] = [
  {id: 'r1', topic: 'Rapid', question: 'Who assigns the offset?', answer30s: 'The partition leader.', answer2m: 'Followers copy that offset.', followUps: ['Producer-assigned?']},
  {id: 'r2', topic: 'Rapid', question: 'Minimum brokers for RF=3?', answer30s: '3 distinct brokers.', answer2m: 'Else replicas stack on one node.', followUps: ['Racks?']},
  {id: 'r3', topic: 'Rapid', question: 'min.insync.replicas for payments?', answer30s: '2 with RF=3.', answer2m: 'acks=all.', followUps: ['Why not 3?']},
  {id: 'r4', topic: 'Rapid', question: 'Consume delete the record?', answer30s: 'No.', answer2m: 'Retention does.', followUps: ['Compacted topic?']},
  {id: 'r5', topic: 'Rapid', question: 'Same consumer after crash?', answer30s: 'Not guaranteed.', answer2m: 'Group + offset contract.', followUps: ['Member id?']},
  {id: 'r6', topic: 'Rapid', question: 'Replication push or pull?', answer30s: 'Pull. Followers fetch.', answer2m: 'Like consumers.', followUps: ['ISR?']},
  {id: 'r7', topic: 'Rapid', question: 'Consumers read HW or LEO?', answer30s: 'HW.', answer2m: 'Avoid unreplicated data.', followUps: ['acks=1?']},
  {id: 'r8', topic: 'Rapid', question: 'KRaft quorum size?', answer30s: '3 or 5.', answer2m: 'Odd for majority.', followUps: ['Combined role?']},
  {id: 'r9', topic: 'Rapid', question: 'Idle extra consumers?', answer30s: 'Yes if members > partitions.', answer2m: 'One owner per partition.', followUps: ['How to scale?']},
  {id: 'r10', topic: 'Rapid', question: 'unclean.leader.election?', answer30s: 'Off in prod.', answer2m: 'Out-of-ISR leader can lose data.', followUps: ['Availability trade?']},
];

export const ALL: InterviewQ[] = [...SENIOR, ...ARCHITECT, ...RAPID];
