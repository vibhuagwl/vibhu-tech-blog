import type {SectionBlock} from './types';

/** Fields to gather before sizing — [field, meaning, how to measure]. */
export const PRODUCTION_INPUTS: string[][] = [
  ['messages/sec', 'Sustained produce rate at the leader (not consumer lag)', 'Producer metrics, topic BytesIn/RecordsIn, load-test peak, business TPS'],
  ['MB/sec', 'Ingress bytes per second at leaders (avg record size × msg/s)', 'JMX BytesInPerSec, Prometheus kafka_server_BrokerTopicMetrics_BytesInPerSec'],
  ['peak multiplier', 'Burst factor over sustained (Black Friday, market open, batch jobs)', 'Historical p99/p999 vs mean, scheduled job spikes, 2–5× typical'],
  ['avg size', 'Mean serialized record size including headers', 'Sample payloads, producer batch metrics, compression ratio note'],
  ['partitions', 'Parallelism units per topic — caps consumer scale per group', 'ceil(peak_MB/s ÷ per_partition_throughput), consumer worker count, key cardinality'],
  ['brokers', 'Data nodes holding log segments and serving clients', 'Partition budget (~2–4k/broker), disk per broker, network NIC, RF spread across AZs'],
  ['RF (replication factor)', 'Total copies of each partition across the cluster', 'Durability policy: RF=3 money, RF=2 dev; must match AZ count for AZ fault tolerance'],
  ['ISR / minISR', 'In-sync replica set vs minimum required for acks=all', 'Topic min.insync.replicas; RF=3 → minISR=2 typical; minISR=RF blocks on single follower lag'],
  ['consumers', 'Members in a consumer group processing a topic', '≤ partitions per group; scale from handler throughput: ceil(peak_msg/s × process_ms / 1000)'],
  ['groups', 'Independent consumer groups reading the same topic', 'One offset cursor per group; fan-out multiplies fetch egress'],
  ['retention', 'How long log segments are kept on disk (ms or bytes)', 'Product replay window, compliance, compaction vs delete policy'],
  ['storage', 'Total disk required across all brokers', 'ingress × RF × retention_seconds (+ compaction factor); add 30% headroom'],
  ['network', 'NIC bandwidth for client + inter-broker replication', 'ingress × RF (rough); add consumer fan-out × egress per group'],
  ['cross-AZ', 'Replication and client traffic across availability zones', 'Rack awareness: one replica per AZ; cross-AZ bytes billed and add latency'],
  ['cross-region', 'DR replication (MM2) — separate from in-cluster RF', 'MM2 dedicated cluster bandwidth; RPO = mirror lag at failure'],
  ['RPO', 'Recovery point objective — max acceptable data loss window', 'MM2 lag, backup frequency, acks/minISR policy; RF alone ≠ zero RPO for region loss'],
  ['RTO', 'Recovery time objective — max downtime', 'Failover runbook time, DNS cutover, consumer replay, broker replacement SLA'],
  ['headroom', 'Safety margin on disk, CPU, network, partitions', '30% disk; plan for reassignment spikes; avoid 100% partition/broker utilization'],
];

export const CALC_FORMULAS = `
KAFKA CAPACITY FORMULAS (illustrative — validate with benchmarks on your hardware)
═══════════════════════════════════════════════════════════════════════════════

INGRESS (client → leader)
  avg_MB/s     = messages/sec × avg_bytes / 1_048_576
  peak_MB/s    = avg_MB/s × peak_multiplier

REPLICATION TRAFFIC (inter-broker, approximate)
  replicate_MB/s ≈ peak_MB/s × (RF − 1)     # followers pull from leader
  total_wire_MB/s ≈ peak_MB/s × RF            # produce + replication (order-of-magnitude)

STORAGE (delete retention, uncompressed estimate)
  cluster_bytes = avg_bytes/s × retention_seconds × RF
  per_broker    = cluster_bytes / broker_count   # if balanced; rack-aware spreads leaders

PARTITIONS
  P_min = max(
            ceil(peak_MB/s ÷ per_partition_MB/s),   # 10–50 MB/s/partition typical range
            required_consumer_parallelism,
            ceil(peak_msg/s ÷ per_partition_msg/s)
          )
  P_max_per_broker ≈ 2_000–4_000 (metadata / file-handle budget — workload-dependent)

BROKERS
  by_partitions:  brokers ≥ ceil(total_partitions × RF / replicas_per_broker_layout)
  by_disk:        brokers ≥ ceil(cluster_storage × (1 + headroom) / disk_per_broker)
  by_network:     brokers ≥ ceil(total_wire_MB/s / usable_NIC_MB/s)
  layout:         ≥ 1 broker per AZ for RF=3; prefer 2+ per AZ for rolling maintenance

CONSUMERS (one group)
  members ≤ partitions assigned
  needed ≈ ceil(peak_msg/s × handler_seconds_per_msg)

CONTROLLERS (KRaft)
  voters = 3 (tolerate 1 loss) or 5 (tolerate 2); odd count; spread across AZs

RULE: Numbers are interview scaffolding — always say "I'd benchmark one partition on prod-like hardware."
`;

export type CalcProblem = {id: string; prompt: string; solution: string; traps: string[]};

export const WORKED_500K = {
  prompt:
    '500K transactions/sec, 2KB average, peak 3×, retention 7 days, RF=3, 3 AZs. Design Kafka infrastructure.',
  disclaimer: 'ILLUSTRATIVE — hardware and compression change every constant below. Validate with benchmarks.',
  steps: [
    {
      label: 'Peak message rate',
      calc: '500,000 msg/s × 3 peak = 1,500,000 msg/s',
      note: 'Size consumers and partition ingress for peak, not average.',
    },
    {
      label: 'Average ingress (leaders)',
      calc: '500,000 × 2,048 bytes = 1,024,000,000 B/s ≈ 976 MB/s (~0.95 GB/s)',
      note: 'Use bytes/s for disk; MB/s for NIC back-of-envelope.',
    },
    {
      label: 'Peak ingress (leaders)',
      calc: '976 MB/s × 3 ≈ 2,930 MB/s (~2.86 GB/s)',
      note: 'Producers hit leaders; peak drives network and ISR stress.',
    },
    {
      label: 'Inter-broker replication at peak (approx)',
      calc: '2,930 MB/s × (RF−1) = 2,930 × 2 ≈ 5,860 MB/s replication + 2,930 MB/s produce ≈ 8.8 GB/s cluster wire',
      note: 'Unthrottled reassignment adds more. Plan 25 GbE+ per broker or more brokers.',
    },
    {
      label: '7-day storage (RF=3, delete retention, avg rate)',
      calc: '1,024,000,000 B/s × 604,800 s × 3 RF ≈ 1.86×10¹⁸ bytes ≈ 1.69 PB cluster raw',
      note: 'Compaction lowers keyed topics; compression (lz4/zstd) divides by 2–4× on disk.',
    },
    {
      label: 'Partition estimate',
      calc: 'Assume 30 MB/s/partition sustainable → peak 2,930 ÷ 30 ≈ 98 → round to 96 or 128 partitions',
      note: 'Also check consumer parallelism: if 2ms handler, need ~3,000 in-flight workers → 128 partitions is floor not ceiling.',
    },
    {
      label: 'Broker estimate',
      calc: 'Layout: 3 AZ × 3 brokers = 9 minimum for RF=3 maintenance headroom; disk per broker ≈ 1.69 PB ÷ 9 ≈ 188 TB before headroom → unrealistic on one broker → need tiered storage OR more brokers OR shorter hot retention',
      note: 'Interview pivot: tiered storage (7d hot + S3 cold), or 21 brokers × ~90 TB, or reduce retention on replay topics.',
    },
    {
      label: 'Consumer estimate',
      calc: 'If p99 handler = 5ms → parallel ≈ 1,500,000 × 0.005 = 7,500 tasks → impractical; batch + 200ms handler budget → ~300 consumers at 128 partitions caps at 128 active',
      note: 'Must optimize handler or increase partitions; 128 consumers max per group unless multi-group sharding.',
    },
    {
      label: 'Controllers',
      calc: 'KRaft: 3 dedicated voters (1 per AZ) or 5 if large metadata; separate from 9+ data brokers at this scale',
      note: 'Combined broker+controller only for smaller clusters.',
    },
    {
      label: 'minISR / durability',
      calc: 'RF=3, min.insync.replicas=2, unclean.leader.election=false, acks=all, enable.idempotence=true',
      note: 'Survives one AZ loss with writable cluster; acks=all fails if ISR < minISR.',
    },
    {
      label: 'DR notes',
      calc: 'RF=3 does not survive region loss. MM2 to DR cluster; RPO = mirror lag; RTO = failover runbook (DNS, consumer idempotent replay by paymentId)',
      note: 'Never failover by seeking same offset in DR — business keys for replay.',
    },
    {
      label: 'Validate',
      calc: 'Benchmark: single-partition produce/consume on prod-like broker; reassignment throttle test; failure injection (AZ, broker)',
      note: 'Close with "I would load-test 10% peak in staging and watch URP, disk growth, and p99 produce."',
    },
  ],
  interviewClose:
    'State assumptions, show formulas, flag PB disk as "needs tiering or more brokers," set RF/minISR/acks, separate DR cluster, and commit to benchmarking.',
};

export const CALC_PROBLEMS: CalcProblem[] = [
  {
    id: 'calc-01',
    prompt: '10k msg/s, 1KB avg, RF=3, 3-day retention. Disk needed?',
    solution: '10,000 × 1,024 = 10.24 MB/s. Storage ≈ 10.24×1024×259,200×3 ≈ 8.2 TB cluster (uncompressed). +30% headroom ≈ 10.7 TB.',
    traps: ['Forgetting RF', 'Using peak without being asked', 'Ignoring compression'],
  },
  {
    id: 'calc-02',
    prompt: '50 MB/s ingress, RF=3, 7-day retention. Storage?',
    solution: '50×1024×604,800×3 ≈ 92.5 TB cluster raw. Per broker if 6 brokers ≈ 15.4 TB each + headroom.',
    traps: ['MB/s vs MiB/s', 'Per-broker = total not ÷RF'],
  },
  {
    id: 'calc-03',
    prompt: 'Peak 200 MB/s, each partition handles 25 MB/s. Minimum partitions?',
    solution: 'ceil(200/25) = 8 partitions minimum for produce; add headroom → 12–16.',
    traps: ['Using avg not peak', 'Forgetting consumer parallelism may need more'],
  },
  {
    id: 'calc-04',
    prompt: 'Topic needs 40 consumer workers. How many partitions?',
    solution: 'Partitions ≥ 40 (one consumer per partition max per group). Round to 48 for headroom.',
    traps: ['Thinking 40 consumers on 10 partitions works'],
  },
  {
    id: 'calc-05',
    prompt: '1M msg/s, 500B avg, peak 2×. Peak MB/s?',
    solution: 'Peak msg/s = 2M. Bytes/s = 2M×500 = 1 GB/s ≈ 954 MB/s.',
    traps: ['Off-by-1000 on bytes', 'Using avg msg/s for peak NIC'],
  },
  {
    id: 'calc-06',
    prompt: 'RF=3, peak ingress 100 MB/s. Approximate total broker wire?',
    solution: '≈ 100 × RF = 300 MB/s order-of-magnitude (produce + replication).',
    traps: ['Only counting replication', 'Forgetting consumer fetch egress'],
  },
  {
    id: 'calc-07',
    prompt: '3 AZs, RF=3. Minimum brokers for rack-aware RF?',
    solution: '3 brokers minimum (1/AZ). Production prefers 2+/AZ (6–9) for rolling upgrades.',
    traps: ['RF=3 on 2 brokers', 'All replicas in one AZ'],
  },
  {
    id: 'calc-08',
    prompt: 'Cluster has 12,000 partitions, budget 3,000/broker. Brokers?',
    solution: 'ceil(12000/3000) = 4 brokers absolute min; prefer 6+ for headroom and leader spread.',
    traps: ['Ignoring RF placement', 'No controller overhead'],
  },
  {
    id: 'calc-09',
    prompt: 'Handler 20ms, peak 5k msg/s. Consumers needed?',
    solution: 'Parallel ≈ 5000 × 0.02 = 100 consumers; need ≥100 partitions.',
    traps: ['Dividing instead of multiply', 'Ignoring batch amortization'],
  },
  {
    id: 'calc-10',
    prompt: 'Retention 168h, 20 MB/s avg, RF=2. Storage?',
    solution: '20×1024×604800×2 ≈ 24.7 TB cluster.',
    traps: ['RF=1 in prod', 'Hours vs seconds'],
  },
  {
    id: 'calc-11',
    prompt: 'MM2 mirrors 80 MB/s primary. DR bandwidth?',
    solution: 'Budget ≥80 MB/s dedicated MM2 egress+ingress; add transform overhead 10–20%.',
    traps: ['Assuming RF covers region', 'Sharing MM2 with app traffic'],
  },
  {
    id: 'calc-12',
    prompt: '5 consumer groups read same topic at 30 MB/s each. Egress?',
    solution: '30×5 = 150 MB/s fetch egress from brokers (plus replication separately).',
    traps: ['Counting only once', 'Forgetting follow-on internal topics'],
  },
  {
    id: 'calc-13',
    prompt: 'RF=3 minISR=2. How many broker failures before acks=all may fail?',
    solution: 'If ISR=2, still writable. Lose 2nd replica in ISR → ISR=1 < minISR → produce fails.',
    traps: ['Saying RF-1 always', 'Ignoring which replicas in ISR'],
  },
  {
    id: 'calc-14',
    prompt: 'Compacted topic, 500M keys, 200B/key avg. Disk order?',
    solution: '≈ 100 GB key space + overhead; compaction lags cause temporary 2–3× spike.',
    traps: ['Using ingress×retention formula', 'Ignoring compaction lag'],
  },
  {
    id: 'calc-15',
    prompt: 'Peak 3k msg/s, 4KB records, 64 partitions. MB/s per partition at peak?',
    solution: 'Peak bytes = 3000×4096 = 12.3 MB/s total → 12.3/64 ≈ 0.19 MB/s/partition (easy).',
    traps: ['Dividing before peak multiplier if given'],
  },
  {
    id: 'calc-16',
    prompt: '10 brokers, 25k partitions total. Partitions/broker?',
    solution: '2500/broker — within 2–4k guideline but watch metadata latency; may need dedicated controllers.',
    traps: ['Assuming linear forever', 'Ignoring leader skew'],
  },
  {
    id: 'calc-17',
    prompt: 'KRaft: tolerate 2 simultaneous voter failures. Voters?',
    solution: '5 voters (majority 3 of 5). 3 voters only tolerate 1.',
    traps: ['Even voter count', 'Confusing with RF'],
  },
  {
    id: 'calc-18',
    prompt: 'Ingress 40 MB/s, NIC 10 Gb/s (≈1.25 GB/s usable). Network-bound?',
    solution: 'RF≈3 → ~120 MB/s wire ≪ 1.25 GB/s — not NIC-bound; check disk.',
    traps: ['Forgetting Gb vs GB', 'Ignoring reassignment burst'],
  },
  {
    id: 'calc-19',
    prompt: 'RPO 5 min, MM2 avg lag 2 min, p99 lag 8 min. Compliant?',
    solution: 'p99 violates 5 min RPO — need scale MM2, filter topics, or accept higher RPO.',
    traps: ['Using avg lag only', 'Thinking RF eliminates RPO'],
  },
  {
    id: 'calc-20',
    prompt: 'Double partitions from 32→64 without traffic change. Consumer max parallelism?',
    solution: 'Doubles max consumers per group (64). Does not fix hot key on old partition mapping.',
    traps: ['Expecting auto key rebalance', 'More partitions without consumers = waste'],
  },
  {
    id: 'calc-21',
    prompt: '100k msg/s, 1KB, lz4 3:1 compression on disk. 1-day storage RF=3?',
    solution: 'Raw 100 MB/s → ~33 MB/s compressed × 86400 × 3 ≈ 8.4 TB.',
    traps: ['Compressing network not disk', 'RF after compression debate — state assumption'],
  },
  {
    id: 'calc-22',
    prompt: '6 brokers, RF=3, 90 partitions. Replicas per broker approx?',
    solution: '90×3/6 = 45 replica assignments each if balanced (leaders + followers).',
    traps: ['90/6=15 leaders only', 'Ignoring uneven leader skew'],
  },
];

export const SECTION_PRODUCTION_NUMBERS: SectionBlock = {
  id: 'prod-numbers',
  part: 54,
  title: 'Production numbers — gather inputs, run formulas, sanity-check',
  lead: 'Staff interviews reward a spreadsheet narrative: collect inputs, apply formulas, state assumptions, then say what you would benchmark.',
  ascii: CALC_FORMULAS,
  body: `Use **PRODUCTION_INPUTS** as your intake checklist — never jump to "nine brokers" without traffic, RF, retention, and consumer math.

**Workflow:** (1) Sustained vs peak msg/s and bytes. (2) Multiply by RF for storage and wire. (3) Partition count from peak ÷ per-partition throughput AND consumer parallelism. (4) Brokers from disk, partition budget, and NIC. (5) Controllers separate at scale. (6) DR = MM2 second cluster with explicit RPO/RTO.

**WORKED_500K** walks the classic 500K TPS prompt — note the deliberate PB disk moment: a strong candidate pivots to tiered storage, more brokers, or retention tiers instead of pretending one disk fits.

**CALC_PROBLEMS** — drill 20+ rapid-fire calcs until RF and retention are muscle memory.`,
  remember: [
    'Disk = bytes/s × retention × RF (delete policy)',
    'Consumers ≤ partitions per group',
    'Peak drives NIC and ISR; average drives disk forecast',
    'Always close with benchmark on prod-like hardware',
  ],
  oneLiner: 'Gather inputs → formula → headroom → benchmark — never magic broker counts.',
  trap: 'Quoting 500 brokers from a blog without RF, retention, or compression in the math.',
  tables: [
    {headers: ['Input', 'Meaning', 'How to measure'], rows: PRODUCTION_INPUTS},
    {
      headers: ['Step', '500K example', 'Note'],
      rows: WORKED_500K.steps.map((s) => [s.label, s.calc, s.note]),
    },
  ],
};
