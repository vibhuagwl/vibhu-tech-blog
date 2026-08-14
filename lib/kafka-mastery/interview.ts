import type {InterviewQ} from './types';

export const SENIOR: InterviewQ[] = [
  {
    id: 's1',
    topic: 'Producer',
    question: 'Explain the Kafka producer end-to-end.',
    answer30s:
      'Serialize, partition by key, batch in the accumulator, compress, send to the partition leader, wait for acks. With idempotence, retries do not duplicate in the log.',
    answer2m:
      'The producer never writes followers. For payments I set acks=all, enable.idempotence=true, linger and batch.size for throughput, zstd compression, and a stable key so one account stays ordered on one partition. transactional.id only if I need multi-partition atomicity.',
    followUps: ['acks=0 vs 1 vs all?', 'What does linger.ms trade?'],
    trick: 'Saying the producer pushes to all replicas.',
  },
  {
    id: 's2',
    topic: 'Consumer',
    question: 'Explain the Kafka consumer and consumer groups.',
    answer30s:
      'A group splits partitions so each partition has one owner. Members poll, process, commit offsets. Different groups each read the full log.',
    answer2m:
      'Offsets live in __consumer_offsets. For payments I disable auto-commit and commit after an idempotent ledger write. If the process dies before commit, another member may see the same records — that is at-least-once, not a bug.',
    followUps: ['What if members > partitions?', 'auto.offset.reset when?'],
  },
  {
    id: 's3',
    topic: 'Cluster',
    question: 'Broker vs controller — what does each do?',
    answer30s:
      'Brokers store and serve partition data. The controller (KRaft quorum) manages metadata: leaders, ISR, membership.',
    answer2m:
      'Produces and fetches go to partition leaders on brokers. Controllers are not required on the hot data path for every record. Greenfield clusters use KRaft, not ZooKeeper.',
    followUps: ['What happens when a broker dies?'],
  },
  {
    id: 's4',
    topic: 'Optimization',
    question: 'How do you optimize producer, consumer, and broker?',
    answer30s:
      'Find the bottleneck first. Producer: batch+compress. Consumer: poll budget and processing time. Broker: disk, partitions, ISR health. Change one layer and measure.',
    answer2m:
      'I never turn every knob. Produce p99 high → linger/batch/compression. Lag with low CPU → downstream. Lag with high CPU → records/poll or concurrency model. Under-replicated → broker disk/net. Controller issues → quorum health and preferred leaders.',
    followUps: ['What do you measure before changing config?'],
    trick: 'Listing 20 properties without a bottleneck.',
  },
  {
    id: 's5',
    topic: 'Properties',
    question: 'Which Kafka properties must you set for a payment system?',
    answer30s:
      'Producer: acks=all, idempotence, linger/batch/compression. Consumer: auto-commit off, poll limits, sticky assignor. Broker: RF=3, minISR=2, unclean election off, auto-create off. Plus SASL/SSL.',
    answer2m:
      'I also set retention to the replay window, bound message.max.bytes, and use read_committed if transactions are on. Security is a GO/NO-GO — local Docker without SASL is not a production story.',
    followUps: ['min.insync.replicas why 2?'],
  },
  {
    id: 's6',
    topic: 'Monitoring',
    question: 'What do you monitor for Kafka in production?',
    answer30s:
      'Under-replicated partitions, ISR changes, offline partitions, produce/fetch latency, disk, consumer lag per group/partition, and rebalance rate.',
    answer2m:
      'Lag alone is incomplete. URP and NotEnoughReplicas mean durability or capacity pain. Rebalance storms destroy throughput during deploys. Disk full stops produces regardless of consumer lag. Alert on SLO lag and on cluster health separately.',
    followUps: ['Which metric is P0 at 3am?'],
  },
  {
    id: 's7',
    topic: 'Instances',
    question: 'How many producers, consumers, brokers do you need?',
    answer30s:
      'Brokers: ≥3 across AZs. Controllers: 3. Producers: as many app pods as RPS needs. Consumers in a group: ≤ partitions.',
    answer2m:
      'Producer count is an application scaling question. Consumer count is a partition question. Broker count is a disk/network/partition-leadership question. One shared cluster with quotas beats a cluster per service.',
    followUps: ['When do you add a second cluster?'],
    trick: 'Consumers = number of microservices.',
  },
  {
    id: 's8',
    topic: 'Syncing',
    question: 'How does data sync between Kafka brokers?',
    answer30s:
      'Followers pull from the leader. ISR is the caught-up set. acks=all waits on ISR. HW advances; consumers read HW.',
    answer2m:
      'Replication is not a push from leader to followers. Replica fetchers behave like internal consumers. If a follower lags, it leaves ISR. If ISR falls below minISR, acks=all produces fail — preferred to silent loss.',
    followUps: ['unclean leader election?'],
  },
  {
    id: 's9',
    topic: 'Partitions',
    question: 'How many partitions do you need in production?',
    answer30s:
      'At least enough for required consumer parallelism and for produce/consume rate per partition ceilings — then headroom. Not 1000 by default.',
    answer2m:
      'Formula: max of needed parallel consumers and ceil(rate / per-partition capacity). Account for key skew. Increasing later is possible but old keys stay on old partitions. Decreasing is hard. Measure before you multiply.',
    followUps: ['Hot partition fix?'],
  },
  {
    id: 's10',
    topic: 'End-to-end',
    question: 'Walk a payment event from produce to consume.',
    answer30s:
      'API keys by account, producer batches to leader, followers sync, HW moves, settlement consumer polls, writes ledger uniquely, commits offset.',
    answer2m:
      'If the worker dies after ledger write but before commit, another worker may see the event again — UNIQUE(payment_id) makes that safe. Poison payloads go to DLQ after bounded retries. That is the story interviewers want.',
    followUps: ['Where do you put the idempotency key?'],
  },
];

export const ARCHITECT: InterviewQ[] = [
  {
    id: 'a1',
    topic: 'Sizing',
    question: 'Size producers, consumers, brokers, and partitions for 20k payment events/s.',
    answer30s:
      'Estimate bytes/s for disk×RF×retention → brokers. Estimate work/s per consumer → partitions and consumer pods. Producers scale with API tier.',
    answer2m:
      'Example: 2KB events → 40MB/s in, ×RF3 ≈ 120MB/s cluster write. Retention 7d drives tens of TB. Start ~12–24 partitions if one worker handles ~1–2k/s with headroom. Brokers 5–7 across 3 AZs. Producer pods from API RPS with batching so Kafka is not 1:1 with HTTP.',
    followUps: ['What if one account is 30% of traffic?'],
  },
  {
    id: 'a2',
    topic: 'HA',
    question: 'Design Kafka to survive one AZ loss.',
    answer30s: 'RF=3, rack-aware placement, minISR=2, controllers across AZs.',
    answer2m:
      'minISR=3 blocks produces when one AZ dies. RF=2 can lose a partition. Prefer staying writable with two copies. Clients retry with idempotence. Test preferred leader rebalance after AZ recovery.',
    followUps: ['Multi-region?'],
  },
  {
    id: 'a3',
    topic: 'Ops',
    question: 'Consumer lag SLO is breached — run the war room.',
    answer30s:
      'Confirm cluster health (URP, offline, disk). Then per-partition lag, rebalance rate, processing time, downstream errors. Fix the layer that is actually red.',
    answer2m:
      'If URP/offline — broker incident first. If rebalances — deploy/session/poll. If lag on one partition — hot key. If all partitions lag equally — scale processing or partitions. Do not flip linger.ms during a consumer outage.',
    followUps: ['What dashboard do you open first?'],
  },
  {
    id: 'a4',
    topic: 'Controller',
    question: 'When do you split KRaft controllers from brokers?',
    answer30s: 'When metadata and log I/O contend, or the cluster is large enough that controller jitter hurts leadership changes.',
    answer2m:
      'Small payments bus: combined roles on 3 nodes is fine. Large multi-tenant cluster: 3–5 dedicated controllers, brokers only for data. Keep voters odd and AZ-diverse.',
    followUps: ['What breaks if all controllers are in one AZ?'],
  },
  {
    id: 'a5',
    topic: 'Partitions',
    question: 'You need to increase partitions on a live payments topic — how?',
    answer30s:
      'Add partitions carefully knowing keyed routing for old messages does not reshuffle. Dual-write or accept split ordering windows. Expand consumers after.',
    answer2m:
      'New partitions get new keys hashed into them; historical keys stay. For strict per-account order across the cut, you need a migration topic or a pause. Always update consumer autoscaling max to the new count.',
    followUps: ['Can you decrease partitions?'],
    trick: '“Just increase partitions; order is unchanged for everyone.”',
  },
];

export const RAPID: InterviewQ[] = [
  {id: 'r1', topic: 'Rapid', question: 'Who does the producer talk to?', answer30s: 'The partition leader.', answer2m: 'Followers only fetch.', followUps: ['Metadata refresh?']},
  {id: 'r2', topic: 'Rapid', question: 'Useful consumers vs partitions?', answer30s: 'Consumers ≤ partitions in a group.', answer2m: 'Extras idle.', followUps: ['Two groups?']},
  {id: 'r3', topic: 'Rapid', question: 'min.insync.replicas for RF=3?', answer30s: '2', answer2m: 'With acks=all.', followUps: ['Why not 3?']},
  {id: 'r4', topic: 'Rapid', question: 'Replication push or pull?', answer30s: 'Pull.', answer2m: 'Follower fetchers.', followUps: ['ISR?']},
  {id: 'r5', topic: 'Rapid', question: 'Commit before process?', answer30s: 'No for payments.', answer2m: 'At-most-once / loss.', followUps: ['Auto commit?']},
  {id: 'r6', topic: 'Rapid', question: 'P0 Kafka metric?', answer30s: 'Offline / URP / disk full.', answer2m: 'Then lag SLO.', followUps: ['ISR shrink?']},
  {id: 'r7', topic: 'Rapid', question: 'Default partition guess?', answer30s: 'From parallelism math.', answer2m: 'Not 1000.', followUps: ['Hot key?']},
  {id: 'r8', topic: 'Rapid', question: 'Controller in KRaft?', answer30s: 'Raft quorum of 3/5.', answer2m: 'Metadata brain.', followUps: ['Combined role?']},
  {id: 'r9', topic: 'Rapid', question: 'Producer scale limit?', answer30s: 'App/CPU/network.', answer2m: 'Not partition count.', followUps: ['Idempotent PID?']},
  {id: 'r10', topic: 'Rapid', question: 'HW vs LEO?', answer30s: 'HW = replicated; consumers use HW.', answer2m: 'LEO is local end.', followUps: ['acks=1?']},
];

export const ALL: InterviewQ[] = [...SENIOR, ...ARCHITECT, ...RAPID];
