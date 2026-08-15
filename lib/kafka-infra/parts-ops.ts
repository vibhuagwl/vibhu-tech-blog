import type {SectionBlock} from './types';

export const SECTIONS_OPS: SectionBlock[] = [
  {
    id: 'consumers',
    part: 12,
    title: 'Consumers',
    lead: 'Consumer parallelism is bounded by partition count — not pod count.',
    body: `**Rule:** In one consumer group, each partition is assigned to **at most one** active member at a time. Adding consumers beyond partition count does not increase throughput — they sit idle.

**Examples (10 partitions):**
| Consumers | Active | Idle | Effect |
|-----------|--------|------|--------|
| 3 | 3 | 0 | Each handles ~3–4 partitions; under-provisioned |
| 10 | 10 | 0 | Ideal 1:1 mapping for max parallelism |
| 15 | 10 | 5 | 5 consumers do nothing — wasted resources |

**Why idle happens:** The group coordinator assigns partitions round-robin/range/sticky — never double-assigns a partition. Extra members join the group, participate in rebalance, then receive zero partitions.

**Interview math:** Max parallel consumers per group = partition count. Need 20 parallel workers? You need ≥20 partitions (or multiple consumer groups reading the same topic independently).

**Scaling levers:**
- Increase partitions (one-way door — plan key distribution)
- Add separate consumer groups (fan-out — each group gets all partitions)
- Tune fetch batching / processing — does not break the partition ceiling`,
    ascii: `Topic: payments (10 partitions)
Group: payment-processor

  P0 P1 P2 P3 P4 P5 P6 P7 P8 P9
  │  │  │  │  │  │  │  │  │  │
  C1 C1 C1 C2 C2 C2 C3 C3 C3 C3   ← 3 consumers (10p+3c)

  P0 P1 P2 P3 P4 P5 P6 P7 P8 P9
  │  │  │  │  │  │  │  │  │  │
  C1 C2 C3 C4 C5 C6 C7 C8 C9 C10  ← 10 consumers (10p+10c) ✓

  P0 P1 P2 P3 P4 P5 P6 P7 P8 P9
  │  │  │  │  │  │  │  │  │  │
  C1 C2 C3 C4 C5 C6 C7 C8 C9 C10  ← 15 consumers (10p+15c)
  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·
  C11 C12 C13 C14 C15 = IDLE (no partitions assigned)`,
    remember: [
      'One partition → one active consumer per group — never two members on the same partition.',
      'Max useful consumers = partition count. Extra members are idle after rebalance.',
      'Fan-out (multiple groups) is different from scaling one group.',
      'Partition count is the parallelism knob; consumer pods are the workers.',
    ],
    oneLiner: 'You cannot out-scale partitions with pods — 10 partitions means at most 10 active consumers in one group.',
    trap: '"I\'ll scale consumers to 50 and lag will disappear" — if the topic has 12 partitions, 38 consumers sit idle and rebalance churn may make lag worse.',
  },
  {
    id: 'groups',
    part: 13,
    title: 'Consumer groups',
    lead: 'Groups are how Kafka shares work (one group) and fans out (many groups).',
    body: `**Fan-out pattern:** One topic, multiple independent consumer groups — each group receives every message on its own schedule.

| Service | group.id | Purpose |
|---------|----------|---------|
| Payment | payment-svc | Charge / settle |
| Fraud | fraud-svc | Score in real time |
| Notification | notify-svc | Email / SMS |
| Analytics | analytics-svc | Warehouse ETL |

Each group maintains its own offsets in \`__consumer_offsets\`. Fraud lag does not block Payment.

**Assignment strategies:**
| Assignor | Behavior | When |
|----------|----------|------|
| Range | Contiguous partition ranges per topic | Default; can skew with multiple topics |
| RoundRobin | Spread partitions evenly | Legacy; mixed subscriptions |
| Sticky | Balance + minimize movement | Reduce shuffle on rebalance |
| CooperativeSticky | Sticky + incremental revoke | **Production default preference** |

**Static membership:** \`group.instance.id\` = stable pod identity (StatefulSet ordinal). Restart within session window → often **no rebalance** — partitions stay with the same logical member. Requires unique IDs; duplicate → \`FencedInstanceId\`.

**Cooperative rebalance:** Only revokes partitions that must move — not stop-the-world. Members keep processing unaffected partitions during rebalance. Pair with \`CooperativeStickyAssignor\`. Contrast with eager (classic Range): revoke ALL → reassign → resume.`,
    ascii: `Topic: order.events
         │
    ┌────┼────┬────────┬──────────┐
    ▼    ▼    ▼        ▼          ▼
 payment fraud notify analytics   (4 groups, 4 offset tracks)
  grp-A  grp-B  grp-C    grp-D`,
    remember: [
      'Different group.id = fan-out. Same group.id = load sharing.',
      'CooperativeSticky minimizes rebalance disruption — prefer over eager Range.',
      'group.instance.id avoids rebalance on rolling restart when tuned correctly.',
      'Rebalance triggers: join/leave, partition count change, max.poll.interval, session timeout.',
    ],
    oneLiner: 'One group shares partitions; many groups fan out — Payment and Fraud both read the topic but commit offsets independently.',
    trap: 'Using the same group.id for Payment and Analytics — they steal partitions from each other instead of both processing every event.',
  },
  {
    id: 'storage',
    part: 14,
    title: 'Storage · retention',
    lead: 'Kafka stores everything on disk as segmented logs — retention is a business decision encoded in configs.',
    body: `**Segments:** Each partition is a directory of segment files (\`.log\`, \`.index\`, \`.timeindex\`). Active segment receives appends; rolls on \`log.segment.bytes\` or \`log.segment.ms\`. Closed segments are immutable.

**Retention policies:**
| Policy | Config | Behavior |
|--------|--------|----------|
| Time | \`retention.ms\` / \`retention.hours\` | Delete segments older than window |
| Size | \`retention.bytes\` | Cap total partition size |
| Compact | \`cleanup.policy=compact\` | Keep latest value per key; tombstones for deletes |
| Both | \`compact,delete\` | Compact then also bound by time/size |

**Compaction:** Background cleaner merges segments, keeps latest key. Not instantaneous — monitor \`LogCleaner\` metrics. Changelog / \`__consumer_offsets\` rely on compaction.

**Disk full behavior:**
1. Broker cannot append → producers get \`NOT_ENOUGH_REPLICAS\` / timeout
2. ISR may shrink if followers cannot catch up
3. \`log.retention.bytes\` per partition can shed old data — but if ALL disks full, cluster halts
4. **Prevention:** alert at 70/80/90% utilization; keep 30%+ headroom; size with formula (Part 18)

**Page cache:** Kafka leans on OS page cache — not giant JVM heaps. Leave RAM for cache; modest broker heap.`,
    ascii: `partition-0/
  00000000000000000000.log      ← closed
  00000000000000000001.log      ← closed
  00000000000000000002.log      ← ACTIVE (appends here)
  00000000000000000002.index
  00000000000000000002.timeindex

retention.ms expires closed segments → delete files
compact merges → latest key survives`,
    remember: [
      'Segments roll by size/time; only the active segment accepts writes.',
      'retention.ms/bytes = delete policy; compact = keep-latest-per-key.',
      'Disk full is a P0 — producers fail, ISR shrinks, URP grows.',
      'Size disks with RF × retention × throughput + 30–70% headroom.',
    ],
    oneLiner: 'Logs are segmented files on disk; retention deletes or compacts — disk full stops the world.',
    trap: 'Assuming compacted topics have only one value per key right now — cleaner lag means duplicates exist until compaction runs.',
  },
  {
    id: 'multiaz',
    part: 15,
    title: 'Multi-AZ',
    lead: 'Survive one Availability Zone loss inside a region — rack awareness spreads replicas across AZs.',
    body: `**Goal:** RF=3 with one replica per AZ. Losing one AZ leaves 2/3 replicas — partition stays online if minISR=2.

**Rack awareness:** Set \`broker.rack\` to AZ id (e.g. \`us-east-1a\`). Broker uses rack info during replica assignment so leaders and followers land on different racks.

**Cross-AZ cost:** Every produce with RF=3 writes across AZ boundaries. Replication traffic = (RF−1) × ingress — billed as inter-AZ data transfer. Budget this in capacity planning.

**Placement rules:**
- Never put all RF replicas in one AZ
- Controllers (KRaft) also spread across AZs (3 or 5)
- Clients connect to leaders — cross-AZ fetch is normal; minimize with rack-aware consumers where supported`,
    ascii: `Region: us-east-1
┌─────────────┬─────────────┬─────────────┐
│   AZ-1a     │   AZ-1b     │   AZ-1c     │
│  Broker-1   │  Broker-2   │  Broker-3   │
│  rack=1a    │  rack=1b    │  rack=1c    │
│  replica-0  │  replica-1  │  replica-2  │  ← Partition P0, RF=3
└─────────────┴─────────────┴─────────────┘

AZ-1a fails → replicas on 1b+1c remain → ISR ≥ minISR → partition online`,
    remember: [
      'broker.rack = AZ; RF=3 across 3 AZs survives one AZ loss.',
      'Cross-AZ replication is real money — factor (RF−1) × ingress in network budget.',
      'Multi-AZ is inside ONE cluster — not multi-region DR.',
      'Controllers follow the same AZ spread as data brokers.',
    ],
    oneLiner: 'Spread RF replicas across AZs with broker.rack — one AZ down, cluster keeps serving if minISR holds.',
    trap: 'Three brokers in three AZs but RF=1 or all replicas assigned to one rack — looks HA, is not.',
  },
  {
    id: 'multiregion',
    part: 16,
    title: 'Multi-region',
    lead: 'Multi-region DR is a second cluster — never stretched RF across WAN.',
    body: `**Multi-AZ vs multi-region:**
| | Multi-AZ | Multi-region |
|---|----------|--------------|
| Scope | One cluster, one region | Separate clusters per region |
| Latency | Low (ms) | High (WAN RTT) |
| Failure | One AZ | Entire region |
| Replication | Sync ISR inside cluster | Async (MM2 / Cluster Linking) |
| RPO | ~0 for acks=all + minISR | Minutes (link lag) |
| RTO | Seconds (failover AZ) | Minutes–hours (DNS, cutover) |

**DR topologies:**
| Mode | Pattern | RPO | RTO | Notes |
|------|---------|-----|-----|-------|
| Active-passive | Primary serves; DR standby | Link lag | Failover time | Common for finance |
| Active-active | Both regions serve (careful) | Conflict risk | Low | Needs idempotency + conflict rules |

**Critical rule:** Replicas stay in **ONE cluster**. Do not set RF=3 with replicas in us-east and eu-west — WAN latency destroys ISR, throughput collapses, and you still lack true DR semantics.

**RPO / RTO honesty:**
- RPO = how much data you can lose = async replication lag at failover moment
- RTO = time to redirect producers/consumers to DR cluster
- Offsets are **per-cluster** — consumers do not magically resume on DR`,
    remember: [
      'Multi-AZ = one cluster. Multi-region = separate clusters + async link.',
      'Never stretch RF across regions — use MM2 or Cluster Linking instead.',
      'RPO = replication lag; RTO = failover runbook time.',
      'Offsets, ACLs, and topic configs are local to each cluster.',
    ],
    oneLiner: 'DR is another cluster with async replication — not RF spanning continents.',
    trap: 'RF=3 with one replica in another region "for DR" — ISR thrashes, latency kills throughput, and you still cannot fail over cleanly.',
  },
  {
    id: 'mm2',
    part: 17,
    title: 'Cross-cluster · MM2',
    lead: 'MirrorMaker 2 and Cluster Linking replicate topics between independent clusters — async, at-least-once.',
    body: `**Scenarios:**
| Topology | Use case | Risk |
|----------|----------|------|
| A → B | DR standby, analytics sink | Simple; B is read-only until failover |
| A ↔ B | Active-active (rare) | Loop + conflict — needs careful topic naming |
| A → B → C | Hub aggregation | Latency stacks; offset sync chain |

**Offset sync:** MM2 maintains offset mapping in internal topics (\`mm2-offset-syncs.*\`). Consumers on B do not share offsets with A — failover means reset or translate offsets.

**Duplicates:** Replication is at-least-once. Network retries, restarts → duplicate records on target. Consumers must be idempotent (keys, dedupe store, upsert).

**Loop prevention:** Bidirectional mirroring requires:
- Separate topic prefixes or rename rules
- \`emit.heartbeats\` / \`sync.topic.acls\` tuned per direction
- Never mirror a topic back to its source without filtering
- Cluster Linking: use link-only topics; avoid circular link configs`,
    ascii: `Scenario A → B (DR):
  Cluster-A (primary)          Cluster-B (DR)
  ┌──────────────┐             ┌──────────────┐
  │ payments     │── MM2 ────▶│ payments     │
  │ orders       │── MM2 ────▶│ orders       │
  └──────────────┘             └──────────────┘
  Producers ──▶ A only         Consumers standby on B

Scenario A ↔ B (active-active — dangerous):
  A ──mirror──▶ B
  B ──mirror──▶ A   ← MUST filter / rename or infinite loop`,
    remember: [
      'MM2 / Cluster Linking = async, at-least-once, separate offset spaces.',
      'A→B is DR; A↔B needs loop prevention and idempotent consumers.',
      'RPO on DR = mirror lag — monitor it as an SLO.',
      'Failover = redirect clients + accept offset reset or translation.',
    ],
    oneLiner: 'Mirror topics between clusters asynchronously — expect duplicates, plan offset translation, never mirror in a loop.',
    trap: 'Assuming DR consumers resume at the same offset after failover — offsets are per-cluster; without sync mapping you reprocess or skip.',
  },
  {
    id: 'capacity',
    part: 18,
    title: 'Capacity planning',
    lead: 'Size brokers from throughput math — not gut feel.',
    body: `**Network (per broker, rough):**
\`\`\`
ingress          = producer_bytes/s ÷ brokers (leader spread)
replication      = ingress × (RF − 1)        ← follower fetch
consumer_egress  = consumer_bytes/s ÷ brokers
cross_AZ         = replication × inter_AZ_ratio
total_net        ≈ ingress + replication + consumer_egress
\`\`\`

**Storage (per broker):**
\`\`\`
raw_GB = msg/s × avg_msg_bytes × retention_sec × RF ÷ brokers
with_compression ≈ raw × compression_ratio   (0.3–0.5 for JSON→lz4)
with_headroom    ≈ compressed × 1.6–1.7      (60–70% free target)
\`\`\`

**Worked example — 1M msg/s (illustrative):**
| Input | Value |
|-------|-------|
| msg/s | 1,000,000 |
| avg size | 500 B |
| retention | 7 days |
| RF | 3 |
| compression | 0.4 (lz4) |
| brokers | 30 (3 AZ × 10) |

\`\`\`
ingress      = 1M × 500B = 500 MB/s cluster (~4 Gbps)
replication  = 500 × 2  = 1 GB/s cluster
per broker   ≈ 50 MB/s in + 100 MB/s repl = 150 MB/s (~1.2 Gbps) + consumer egress
storage raw  = 1M × 500 × 604800 × 3 = ~900 TB cluster raw
compressed   ≈ 360 TB
per broker   ≈ 12 TB + 70% headroom → ~40 TB disk per broker
\`\`\`
→ 30× NVMe brokers, 25 Gbps NIC, partition count driven by consumer parallelism.

**Financial 100K txn/s sketch:**
| Decision | Choice | Why |
|----------|--------|-----|
| Key | accountId | Ordering per account |
| Partitions | 120–240 | 100K ÷ ~500/part ≈ 200 parallel consumers |
| RF / minISR | 3 / 2 | Survive broker + AZ loss |
| acks | all | No silent loss on payments |
| Retention | 30d + compacted status topic | Audit + latest state |
| DR | us-west-2 cluster, MM2 A→B | RPO = mirror lag (~minutes) |
| DLQ | Per-service DLT + idempotent replay | Poison isolation |`,
    remember: [
      'Network = ingress + (RF−1)×ingress + consumer egress + cross-AZ multiplier.',
      'Storage = msg/s × size × retention × RF; apply compression then 60–70% headroom.',
      'Partition count follows consumer parallelism and key cardinality.',
      'Always say "workload-dependent" — these are starting points for interviews.',
    ],
    oneLiner: 'Math first: bytes in, bytes replicated, bytes out, bytes stored — then pick broker count and disk.',
    trap: 'Sizing only ingress and forgetting replication doubles (RF=3) and consumer egress — broker NIC saturates on day one.',
    tables: [
      {
        headers: ['Formula', 'Expression'],
        rows: [
          ['Ingress (cluster)', 'msg/s × avg_bytes'],
          ['Replication', 'ingress × (RF − 1)'],
          ['Storage (cluster)', 'msg/s × bytes × retention_sec × RF'],
          ['Per-broker disk', 'storage_cluster ÷ brokers × headroom'],
          ['Max consumers/group', 'partition_count'],
        ],
      },
    ],
  },
  {
    id: 'performance',
    part: 19,
    title: 'Broker capacity · tuning',
    lead: 'Brokers fail on disk, network, or CPU — in that order on most clusters.',
    body: `**Bottleneck matrix:**

| Resource | Symptoms | Key metrics | Temp fix | Permanent fix |
|----------|----------|-------------|----------|---------------|
| **Disk** | Produce timeout, ISR shrink, URP ↑ | LogFlushRateAndTimeMs p99, disk util %, IsrShrinksPerSec | Throttle reassignment; shed non-critical traffic | NVMe/JBOD; more brokers; retention ↓ |
| **Network** | Fetch lag, replica lag, client timeout | BytesIn/Out skew, NetworkProcessorAvgIdlePercent ↓ | Connection limits; client batching | 25G NIC; rack-local consumers; PLE |
| **CPU** | Handler queue ↑, TLS overhead | RequestHandlerAvgIdlePercent ↓, user CPU | Reduce compression on broker; quota | More brokers; dedicated controllers |
| **Page cache** | Read latency ↑, iowait ↑ | cache hit ratio, read throughput drop | Restart (last resort) | More RAM; fewer hot partitions per broker |

**Tuning order:** Fix disk/ISR first → then network → then raise \`num.io.threads\` / \`num.network.threads\` only when idle metrics prove that pool is saturated. Blindly raising threads on a disk-bound broker makes things worse.

**Hot partition:** One key dominates → one broker leader overload. Fix: more partitions + better key distribution, not more brokers alone.`,
    remember: [
      'Disk is the usual first bottleneck — watch flush p99 and ISR shrinks.',
      'Page cache matters more than giant JVM heap for log throughput.',
      'Raise io/network threads only when that pool\'s idle % is persistently low.',
      'Hot keys → hot partitions → one broker overloaded regardless of cluster size.',
    ],
    oneLiner: 'When brokers hurt, check disk and ISR before touching thread counts — page cache beats heap.',
    trap: 'Doubling num.io.threads on a disk-saturated broker — threads compete for the same saturated disk, latency gets worse.',
    tables: [
      {
        headers: ['Bottleneck', 'Symptom', 'Metric', 'Temp', 'Permanent'],
        rows: [
          ['Disk', 'Produce timeout, URP', 'LogFlush p99, disk %', 'Throttle move', 'NVMe, more brokers'],
          ['Network', 'Replica lag', 'BytesIn skew, NetIdle ↓', 'Batch clients', '25G NIC, PLE'],
          ['CPU', 'Queue buildup', 'RequestHandlerIdle ↓', 'Quotas', 'Scale out'],
          ['Page cache', 'Fetch slow', 'iowait, read latency', '—', 'More RAM, fewer parts/broker'],
        ],
      },
    ],
  },
  {
    id: 'dlq',
    part: 20,
    title: 'DLQ · retry',
    lead: 'Kafka has no broker-side DLQ — your consumer app builds the retry and dead-letter pipeline.',
    body: `**Application DLQ pipeline:**
1. Consumer polls record
2. Process → success → commit offset
3. Transient failure → retry topic (backoff) → re-consume
4. Permanent failure / max retries → publish to DLT (Dead Letter Topic)
5. Ops replays DLT after fix (idempotent handler required)

**Classification matters:**
| Error | Action |
|-------|--------|
| Timeout / 503 | Retry with backoff |
| Deserialization | DLT immediately (poison) |
| Business rule violation | DLT + alert |
| Duplicate | Skip (idempotency key) |

**Offset discipline:** Never commit offset for a record you have not successfully processed (unless explicitly at-most-once). On DLT publish, commit past the poison offset so the partition advances.

**Deep lab:** Full Spring Kafka patterns, retry topics, \`DeadLetterPublishingRecoverer\`, replay runbooks, and payment corner cases live at **/kafka-dlq** — this board covers the architecture; that hub is the hands-on lab.`,
    ascii: `Main topic: payments
        │
        ▼
   ┌─────────┐     transient     ┌──────────────┐
   │ Consumer│ ─── retry ──────▶ │ payments-retry│
   └────┬────┘                   └──────┬───────┘
        │ success                       │ max retries
        ▼                               ▼
   commit offset                  ┌──────────────┐
                                  │ payments-dlt │ → ops replay
                                  └──────────────┘`,
    remember: [
      'Broker stores bytes — DLQ is an application pattern (retry topic + DLT).',
      'Classify transient vs permanent before retrying — poison loops kill lag.',
      'Commit offset only after success or explicit DLT handoff.',
      'Replay requires idempotency — DLT may contain duplicates.',
    ],
    oneLiner: 'Retry topic for transient errors, DLT for poison — commit only after success or dead-letter publish.',
    trap: 'Infinite retry on a poison message — one bad JSON blocks the partition forever; classify and DLT fast.',
  },
  {
    id: 'monitoring',
    part: 21,
    title: 'Monitoring',
    lead: 'Monitor the data plane (lag, ISR, disk) and the control plane (controller, quorum) — not just CPU.',
    body: `Use JMX / Prometheus exporters (kafka_exporter, Burrow for lag). Dashboard per layer. Alert thresholds are in Part 22 — calibrate to your SLOs.`,
    tables: [
      {
        headers: ['Broker checklist', 'What', 'Why'],
        rows: [
          ['UnderReplicatedPartitions', '= 0 steady', 'Replica health'],
          ['OfflinePartitionsCount', '= 0', 'Availability'],
          ['ActiveControllerCount', '= 1', 'Metadata brain alive'],
          ['RequestHandlerAvgIdlePercent', 'Not persistently low', 'Handler saturation'],
          ['LogFlushRateAndTimeMs', 'p99 within SLO', 'Disk bottleneck early signal'],
          ['Disk utilization', '< 70% target', 'Headroom before full'],
          ['BytesIn/Out per broker', 'Balanced', 'Hot broker / leader skew'],
          ['IsrShrinksPerSec', 'Near 0', 'Replica falling behind'],
        ],
      },
      {
        headers: ['Producer checklist', 'What', 'Why'],
        rows: [
          ['record-error-rate', 'Near 0', 'Client failures'],
          ['record-retry-rate', 'Low steady', 'Transient broker issues'],
          ['request-latency-avg / max', 'Within SLO', 'Broker or network stress'],
          ['batch-size-avg', 'Matches tuning', 'Under-batching wastes throughput'],
          ['buffer-available-bytes', 'Not pinned at 0', 'Backpressure / overload'],
          ['txn-commit-time (if EOS)', 'Within SLO', 'Transaction path health'],
        ],
      },
      {
        headers: ['Consumer checklist', 'What', 'Why'],
        rows: [
          ['records-lag-max', 'Within SLO', 'Processing keeping up'],
          ['records-consumed-rate', 'Matches produce rate', 'Throughput balance'],
          ['commit-latency-avg', 'Stable', 'Offset commit health'],
          ['rebalance-rate / time', 'Low', 'Churn indicator'],
          ['fetch-latency-avg', 'Stable', 'Broker or network issue'],
          ['max-poll-interval exceeded', '0', 'Stuck processing detection'],
        ],
      },
      {
        headers: ['Cluster checklist', 'What', 'Why'],
        rows: [
          ['Broker count up', 'Matches expected', 'Node loss detection'],
          ['Controller quorum health', 'Majority alive', 'Metadata commits possible'],
          ['Topic count / partition count', 'Within budget', 'Metadata / FD limits'],
          ['Mirror lag (if DR)', 'Within RPO SLO', 'DR readiness'],
          ['ACL / auth failure rate', 'Near 0', 'Security misconfig'],
          ['Rolling upgrade progress', 'Tracked', 'Stuck bounce detection'],
        ],
      },
    ],
    remember: [
      'P0 signals: offline partitions, no controller, disk full, quorum loss.',
      'URP and ISR shrinks are early warnings — not noise.',
      'Consumer lag is a symptom — trace to produce rate, processing time, or rebalance.',
      'Mirror lag is your DR RPO gauge.',
    ],
    oneLiner: 'Watch URP, offline, disk, and lag before CPU — the data plane fails on disk and ISR, not load average.',
    trap: 'Dashboard with only CPU and heap — broker dies on disk full while CPU looks fine.',
  },
  {
    id: 'alerting',
    part: 22,
    title: 'Alerting',
    lead: 'Alert on symptoms that threaten availability and durability — tune thresholds to your cluster size and SLOs.',
    body: `**Calibration note:** Thresholds below are **starting points for interviews and greenfield clusters** — not universal constants. A 50-broker cluster tolerates different absolute lag than a 5-broker lab. Derive warning/critical from historical baselines, error budgets, and business SLOs. Re-tune after every major topology change.

**Escalation:** Warning → ticket / Slack. Critical → page on-call. Pair every alert with a runbook link.`,
    tables: [
      {
        headers: ['Metric', 'Warning', 'Critical', 'Meaning', 'Immediate', 'Permanent'],
        rows: [
          ['UnderReplicatedPartitions', '> 0 for 5m', '> 0 for 15m or rising', 'Replica lag / disk / net', 'Identify lagging broker; check disk', 'Add capacity; fix slow disk; throttle reassignment'],
          ['OfflinePartitionsCount', '> 0', '> 0 for 2m', 'No electable leader', 'Restore broker; check ISR', 'Fix AZ/network; last-resort unclean election'],
          ['ActiveControllerCount', 'Flapping', '= 0 for 1m', 'No metadata leader', 'Check controller quorum', 'Restore voters; dedicated controllers'],
          ['Disk utilization %', '> 70%', '> 85%', 'Running out of log space', 'Drop retention temp; add disk', 'Capacity plan; retention policy; JBOD'],
          ['consumer lag (max)', '> 5m SLO', '> 15m SLO', 'Consumers behind', 'Scale consumers/partitions; check rebalance', 'Optimize processing; right-size partitions'],
          ['IsrShrinksPerSec', '> 1 sustained', '> 5 sustained', 'Replicas falling out of ISR', 'Disk/net triage on shrinking broker', 'Hardware upgrade; rack balance'],
          ['RequestHandlerAvgIdlePercent', '< 20% for 10m', '< 10% for 10m', 'Handler pool saturated', 'Quotas; shed load', 'More brokers; fix disk first'],
          ['LogFlushRateAndTimeMs p99', '> 2× baseline', '> 5× baseline', 'Disk write latency', 'Throttle produce; pause reassignment', 'NVMe; reduce retention; JBOD'],
          ['MirrorMaker lag (DR)', '> RPO/2', '> RPO', 'DR data stale', 'Check link; MM2 connectors', 'Bandwidth; connector tuning; topic filter'],
          ['Broker down', '1 broker', '> 1 or controller', 'Node loss', 'Restart; check AZ', 'Hardware; AZ redundancy audit'],
        ],
      },
    ],
    remember: [
      'Thresholds are workload-dependent — baseline first, then alert.',
      'Critical = page; Warning = investigate before it becomes critical.',
      'Every alert needs Immediate (stop bleeding) and Permanent (prevent recurrence).',
      'DR mirror lag alert = your honest RPO enforcement.',
    ],
    oneLiner: 'Page on offline, quorum loss, and disk — warn on URP and lag before they become outages.',
    trap: 'Copy-pasting "lag > 1000" from a blog — on a 1M msg/s topic that is noise; on a 10 msg/s topic it is a day of backlog.',
  },
];
