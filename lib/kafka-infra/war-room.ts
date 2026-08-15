import type {FailureScenario, InterviewQ, SectionBlock} from './types';
import {CALC_PROBLEMS} from './production-numbers';

function q(
  id: string,
  topic: string,
  question: string,
  intent: string,
  answer30s: string,
  answer2m: string,
  tradeoffs: string,
  mistakes: string[],
  followUps: string[],
  architecture?: string,
): InterviewQ {
  return {id, topic, question, intent, answer30s, answer2m, architecture, tradeoffs, mistakes, followUps};
}

function inc(
  id: string,
  title: string,
  symptoms: string[],
  causes: string[],
  metrics: string[],
  logs: string[],
  tempFix: string[],
  permanentFix: string[],
  tradeoffs: string,
  interviewAnswer: string,
  architecture?: string,
): FailureScenario {
  return {id, title, architecture, symptoms, causes, metrics, logs, tempFix, permanentFix, tradeoffs, interviewAnswer};
}

const HOW_MANY_SEEDS: [string, string, string, string][] = [
  ['Brokers', 'How many brokers for RF=3 across 3 AZs with rolling upgrade headroom?', 'Minimum 3 (1/AZ); production prefers 6–9 (2+/AZ) for maintenance without losing margin.', 'Layout math: RF spread + partition leadership + disk/NIC per broker; never answer "3" without headroom story.'],
  ['Brokers', 'How many brokers if 8,000 partitions and 2,000/broker budget?', 'ceil(8000/2000)=4 absolute floor; plan 6–8 for leader skew and reassignment.', 'Partition-per-broker guideline is metadata/ops bound — add controllers and rebalance throttle plan.'],
  ['Brokers', 'How many brokers for 200 MB/s ingress RF=3 on 25 GbE NIC?', 'Wire ≈200×RF=600 MB/s ≪ 3 GB/s NIC — not NIC-bound; pick brokers from disk/partition budget instead (~5–9).', 'Network formula is ingress×RF; consumer fetch fan-out adds more.'],
  ['Brokers', 'How many brokers for 50 TB disk each and 400 TB cluster storage?', 'ceil(400/50)=8 brokers + 30% headroom → 10–11 brokers.', 'Cluster storage = ingress×RF×retention; per-broker is even spread assumption — tiered storage changes math.'],
  ['Partitions', 'How many partitions for 30k msg/s and 20 MB/s/partition target?', '30k×2KB≈60 MB/s → ceil(60/20)=3 min → round to 12–24 for headroom and consumer scale.', 'Benchmark per-partition throughput on your hardware — 10–50 MB/s range.'],
  ['Partitions', 'How many partitions if 12 consumer pods each need one partition?', '≥12 partitions; prefer 16–24 for growth.', 'Consumers ≤ partitions — extra pods without partitions idle.'],
  ['Partitions', 'How many partitions for keyed ordering on 500 distinct merchants?', 'Parallelism up to 500 if keys uniform; start 48–96 and measure skew — hot merchants need salting.', 'Key cardinality sets upper bound; skew lowers effective parallelism.'],
  ['Partitions', 'How many partitions before metadata pain on 6 brokers?', 'Stay under ~2–4k/broker → 12k–24k cluster max guideline; pain starts earlier on combined controllers.', 'Dedicated KRaft controllers buy more partition headroom.'],
  ['Consumers', 'How many consumers in group for 5k msg/s and 50ms handler?', '5000×0.05=250 parallel tasks → need ≥250 partitions; cap consumers at partition count.', 'Batch processing amortizes handler — state realistic p99 not mean.'],
  ['Consumers', 'How many consumers max for topic with 24 partitions?', '24 — hard ceiling per group.', 'Second group can have another 24 — fan-out multiplies broker fetch.'],
  ['Consumers', 'How many consumer instances with cooperative assignor and static membership?', 'Still ≤ partitions; static id reduces rebalance churn not partition math.', 'Unique group.instance.id per pod.'],
  ['Controllers', 'How many KRaft voters for production payment cluster?', '3 voters (tolerate 1 loss) spread 1/AZ; 5 voters if must tolerate 2 simultaneous losses.', 'Odd count only; dedicated controllers at high partition/metadata load.'],
  ['Controllers', 'How many dedicated controllers if 40k partitions?', '3–5 dedicated voters; data brokers separate (9+).', 'Watch ControllerEventQueueTimeMs — split before elections hurt.'],
  ['Controllers', 'How many controllers in combined mode for dev?', '3 combined broker+controller nodes sufficient.', 'Not for 500K TPS prod — interview distinction matters.'],
  ['Clusters', 'How many Kafka clusters for prod vs DR vs analytics?', 'Minimum 3: primary prod, DR (MM2), analytics/PII isolation optional 4th.', 'Blast radius and upgrade isolation — not one mega-cluster.'],
  ['Clusters', 'How many clusters for multi-tenant SaaS isolation?', 'Tier 0 dedicated; Tier 1 shared with quotas; Tier 2 dev — at least 2–3 clusters.', 'Noisy neighbor and compliance drive split.'],
  ['ZK', 'How many ZooKeeper nodes for legacy cluster still on ZK?', '3 or 5 odd across AZs — greenfield answer is KRaft not ZK.', 'Kafka 4.x KRaft-only — know migration narrative.'],
  ['ZK', 'How many ZK nodes minimum for quorum?', '3 — tolerates 1 loss.', 'Never even count; dedicated ZK disks.'],
  ['Connect', 'How many Connect workers for 20 connectors × 4 tasks?', '80 tasks → ~8–16 workers at 5–10 tasks/worker guideline.', 'Rebalance stops tasks — avoid maxing workers.'],
  ['Connect', 'How many workers for sink doing 50 MB/s total?', 'Benchmark worker ~10–20 MB/s → 3–5 workers minimum; scale until lag SLO.', 'Sink DB may be bottleneck not Connect CPU.'],
  ['SR', 'How many Schema Registry instances?', '3 for HA quorum (master election).', 'SR down blocks new schema — not always produce with cached schema.'],
  ['SR', 'How many SR for read-heavy edge caches?', '3 SR + client schema cache; optional CDN not typical.', 'Compatibility mode enforced at register time.'],
  ['MM2', 'How many MM2 connectors for 200 topics?', 'Often 1 MirrorSourceConnector per source-target pair with topic filter; tasks scale inside.', 'Too many connectors → ops burden — allowlist critical topics.'],
  ['MM2', 'How many MM2 tasks for 80 MB/s mirror?', 'Increase tasks until MM2 consumer lag < RPO; often 4–16 tasks.', 'Dedicated MM2 cluster — do not colocate with primary brokers.'],
  ['Topics', 'How many topics for event-driven microservices (50 services)?', '50+ domain topics if bounded context clean; governance cap via platform API.', 'Topic explosion hurts metadata — prefer domain aggregates.'],
  ['Topics', 'How many internal topics for Kafka Streams app?', 'At least 2× stateful stores (changelog + repartition) per topology stage.', 'Plan retention on changelog topics.'],
  ['RF', 'How many replicas for financial audit log?', '3 rack-aware minimum.', 'RF=2 fails AZ-loss staff question.'],
  ['RF', 'How many replicas for metrics telemetry?', '2 may suffice if AZ loss acceptable; 3 if platform standard.', 'State cost explicitly.'],
  ['ISR', 'How many in-sync replicas needed for acks=all with RF=3?', 'min.insync.replicas=2 — ack when 2 of 3 have record.', 'minISR=3 blocks on single follower lag.'],
  ['minISR', 'How many minISR for RF=3 during AZ maintenance?', 'Keep minISR=2 — cluster stays writable with 2 AZs.', 'Maintenance is not excuse for minISR=1 on money topics.'],
  ['Leaders', 'How many leader partitions per broker at 72 partitions RF=3 on 6 brokers?', '~36 replica assignments each if balanced; ~12 leaders each if even.', 'Leader skew breaks even math — run leader balance.'],
  ['NIC', 'How many 25 GbE NICs per broker at 3 GB/s peak?', 'Single 25 GbE ≈3 GB/s theoretical — at ceiling; add brokers or second NIC before saturation.', 'Leave 30% headroom; replication bursts during reassignment.'],
  ['Disks', 'How many log dirs per broker for JBOD?', '1–12 JBOD volumes; Kafka stripes partitions across log.dirs.', 'Single RAID ≠ JBOD benefits for Kafka sequential I/O.'],
  ['AZs', 'How many AZs for regional HA?', '3 — tolerate one AZ loss with RF=3 rack-aware.', '2 AZs cannot place RF=3 one-per-AZ.'],
  ['Regions', 'How many regions for active-passive payments?', '2 minimum (primary + DR); MM2 between.', 'Active-active needs conflict resolution — rare first answer.'],
  ['Groups', 'How many consumer groups reading orders topic?', 'One per downstream system (settlement, fraud, analytics) — 3–10 typical.', 'Each group = independent lag cursor.'],
  ['Producers', 'How many producer instances for 100k msg/s?', 'Pool sized with batching — often 10–50 app instances; partition count bounds parallelism not instance count.', 'Idempotent producer per process; partition key distribution matters.'],
  ['Transactions', 'How many transactional producers per service?', 'One transactional.id per active writer process; fencing prevents duplicates.', 'Never share transactional.id across blue/green without plan.'],
  ['Listeners', 'How many listeners on broker (internal/external)?', 'At least 2: INTERNAL (SASL_SSL inter-broker) + EXTERNAL (clients).', 'advertised.listeners must match client routes.'],
  ['Quotas', 'How many quota buckets for multi-tenant cluster?', 'Per tenant produce + fetch + request quota; 2–3 knobs × tenant count.', 'Default unlimited until first abuse.'],
  ['ACLs', 'How many ACL entries manageable without automation?', 'Hundreds manual; thousands need ACL-as-code + CI.', 'Wildcard ACL is tech debt.'],
  ['Brokers', 'How many brokers to survive one AZ loss with 2 per AZ?', '6 brokers (2×3 AZ) — after AZ loss 4 remain carrying RF=3 replicas.', 'Controllers also spread across AZs.'],
  ['Partitions', 'How many partitions for 500K TPS 2KB peak 3×?', 'Peak ~3 GB/s → 96–128 partitions at 25–30 MB/s/partition illustrative.', 'Validate with benchmark — see WORKED_500K.'],
  ['Brokers', 'How many brokers for 1.7 PB raw without tiered storage?', 'Impractical on few brokers — pivot to tiered hot 24–72h + object storage or 20+ brokers.', 'Strong interview move: PB disk forces tiering conversation.'],
  ['Consumers', 'How many consumers for stream join with 2 topics × 32 partitions?', '32 max per stage — join requires matching partition counts via repartition.', 'Repartition topic adds internal topics.'],
  ['Controllers', 'How many voters tolerate 2 failures?', '5 voters (need 3 for quorum).', '3 voters tolerate only 1.'],
  ['Connect', 'How many connectors per worker before rebalance pain?', '~5–10 total tasks per worker guideline.', 'Connector pause during rebalance.'],
  ['SR', 'How many schema versions retained per subject?', 'Policy: often all compatible versions; cleanup job for old incompatible.', 'FULL_TRANSITIVE compatibility recommended.'],
  ['MM2', 'How many dedicated MM2 brokers?', 'Separate 3–6 broker cluster for MM2 at scale — never share with primary data nodes.', 'MM2 is consumer+producer load.'],
  ['Brokers', 'How many brokers if Cruise Control max 3000 partitions/broker and 18k partitions?', 'ceil(18000/3000)=6 minimum; prefer 8–9 for AZ balance.', 'Cruise Control goals need human approve in prod.'],
];

export const WAR_HOW_MANY: InterviewQ[] = HOW_MANY_SEEDS.map(([topic, question, a30, a2m], i) =>
  q(
    `war-hm-${String(i + 1).padStart(2, '0')}`,
    topic,
    question,
    'Sizing / count — show formula before number',
    a30,
    `${a2m} Close: add 30% headroom and benchmark on staging hardware.`,
    'Higher counts cost money; lower counts risk Sev1 — state assumption.',
    ['Magic number without math', 'Ignoring RF or peak', 'Consumers > partitions'],
    ['What if traffic doubles?', 'DR cluster separate count?'],
  ),
);

const WHAT_IF_SEEDS: [string, string, string, string][] = [
  ['AZ loss', 'What happens if one AZ dies with RF=3 rack-aware minISR=2?', 'Cluster stays writable; leaders re-elect on surviving AZs.', 'URP until replicas catch up; no data loss if unclean=false.'],
  ['AZ loss', 'What happens if one AZ dies but all replicas were in that AZ?', 'Offline partitions — RF meaningless without rack awareness.', 'Design failure — not a tuning problem.'],
  ['Broker loss', 'What happens if one broker dies with RF=3?', 'URP for partitions with replica on dead broker; writes continue if ISR≥minISR.', 'Replace broker.id; replicas rebuild.'],
  ['Broker loss', 'What happens if two brokers die simultaneously with RF=3?', 'Partitions lacking third copy go offline if ISR<minISR.', 'Unclean election trades loss for availability — avoid on money.'],
  ['minISR', 'What happens if minISR=3, RF=3, one follower lags?', 'acks=all produce fails until follower catches up or removed.', 'Higher durability margin, lower availability during lag.'],
  ['minISR', 'What happens if minISR=1 and only one replica alive?', 'Writes continue — single copy risk.', 'Never long-term on financial topics.'],
  ['unclean', 'What happens if unclean leader election fires?', 'Leader may be missing recent writes — tail loss.', 'Availability over consistency — reject for payments.'],
  ['Producer', 'What happens if producer retries without idempotence?', 'Duplicate records in log.', 'Consumers must dedupe by business key.'],
  ['Producer', 'What happens if producer is idempotent but consumer is not?', 'Duplicates still appear in database.', 'Idempotency must be end-to-end for effects.'],
  ['Consumer', 'What happens if consumer commits offset before processing?', 'At-most-once — crash after commit loses message.', 'Rare except metrics.'],
  ['Consumer', 'What happens if consumer processes then crashes before commit?', 'At-least-once redelivery — duplicate if not idempotent.', 'Default payment path.'],
  ['Rebalance', 'What happens if max.poll.interval exceeded?', 'Member removed; rebalance; partitions redistributed; possible duplicate.', 'Consumption stops during rebalance.'],
  ['Partition', 'What happens if partition count increased on live topic?', 'New keys map to new partitions only; old keys stay.', 'Repartition migration needed to rebalance old keys.'],
  ['Partition', 'What happens if you try to decrease partitions?', 'Unsupported — create new topic and migrate.', 'Plan partition count upfront.'],
  ['Disk', 'What happens if broker disk hits 100%?', 'Produce fails for leaders on that broker; possible ISR shrink.', 'Lag irrelevant — cluster append stops.'],
  ['Controller', 'What happens if KRaft loses majority voters?', 'Metadata operations freeze — no leader elections.', 'Restore quorum urgently.'],
  ['Controller', 'What happens if controller flaps?', 'Leadership churn; client metadata storms; p99 spikes.', 'Dedicated controllers + GC tune.'],
  ['Network', 'What happens if cross-AZ link saturated?', 'Replica lag; ISR shrink; produce latency up.', 'Throttle reassignment; add bandwidth.'],
  ['Retention', 'What happens if retention.ms lowered live?', 'Segments delete asynchronously — disk frees over hours.', 'Emergency retention cut loses replay window.'],
  ['Compaction', 'What happens if log cleaner stops?', 'Compacted topic disk grows without bound.', 'Monitor cleaner backlog.'],
  ['Auth', 'What happens if ACL denies WRITE?', 'Producer fails immediately for that principal.', 'Total outage for service — canary ACL first.'],
  ['TLS', 'What happens if broker TLS cert expires?', 'All TLS clients fail handshake.', 'Dual-trust rotation window prevents.'],
  ['Upgrade', 'What happens if message format version skipped?', 'Protocol errors; mixed cluster instability.', 'Step inter.broker.protocol then finalize format.'],
  ['MM2', 'What happens if MM2 lags during region failover?', 'DR missing events in lag window — RPO violated.', 'RPO = lag at failure instant.'],
  ['Region', 'What happens if entire region lost?', 'Primary cluster gone — DR only if MM2 + runbook.', 'RF does not help region loss.'],
  ['Hot key', 'What happens if 80% traffic uses one key?', 'One partition hot; other consumers idle.', 'Salting or shuffle topic.'],
  ['Poison', 'What happens if poison message blocks partition?', 'Infinite retry on same offset; lag grows.', 'DLT classifier routes permanent failures out.'],
  ['EOS', 'What happens if transactional producer is fenced?', 'Old producer cannot write — zombie killed.', 'By design for EOS safety.'],
  ['Quota', 'What happens if client exceeds produce quota?', 'ThrottlingException — backpressure.', 'Protects cluster from noisy neighbor.'],
  ['Fetch', 'What happens if fetch.min.bytes too high on low traffic?', 'Higher end-to-end latency waiting for batch.', 'Tune per consumer SLA.'],
  ['acks', 'What happens if acks=1 and leader dies before replicate?', 'Message may be lost if no unclean leader.', 'acks=all + minISR for durability.'],
  ['acks', 'What happens if acks=all and ISR has 2 of RF=3?', 'Write acked when both in-sync replicas stored it.', 'Third replica may lag without blocking.'],
  ['Static', 'What happens if two pods share group.instance.id?', 'Only one active; instant rebalance on overlap.', 'Unique static id per pod.'],
  ['ZK', 'What happens if ZooKeeper quorum is lost (legacy)?', 'Kafka metadata frozen until ZK restored.', 'Migrate to KRaft.'],
  ['Tiered', 'What happens if consumer reads cold tier segment?', 'Higher fetch latency — seconds possible.', 'Replay SLA must account for tiering.'],
  ['Reassignment', 'What happens if partition reassignment unthrottled at peak?', 'Latency spike; URP; ISR pressure.', 'Throttle and maintenance window.'],
  ['Segment', 'What happens if message.max.bytes < producer record?', 'RecordTooLargeException.', 'Align all limits in chain.'],
  ['Group', 'What happens if consumer group deleted?', 'Committed offsets gone — replay from policy.', 'Break-glass admin only.'],
  ['Order', 'What happens if two producers write same key to different partitions?', 'Global order for key broken.', 'Single writer per key or partition by key.'],
  ['ISR', 'What happens if replica.lag.time.max.ms too aggressive?', 'ISR shrink flapping on transient lag.', 'Tune vs disk/network reality.'],
  ['ISR', 'What happens if lagging follower catches up?', 'Rejoins ISR if within replica.lag.time.max.ms.', 'URP clears when ISR full.'],
  ['Leader', 'What happens if preferred leader election runs?', 'Leaders move to preferred replica when possible.', 'Run after AZ recovery to fix skew.'],
  ['Bootstrap', 'What happens if config lists only one bootstrap broker?', 'Client still discovers full cluster from metadata.', 'But single bootstrap is fragile for first connect.'],
  ['Compression', 'What happens if compression disabled on large JSON?', 'Higher disk and network — cost impact.', 'lz4/zstd typical.'],
  ['Batch', 'What happens if linger.ms=0 always?', 'More requests, lower throughput, higher CPU.', 'Batch for throughput; zero linger for latency.'],
  ['Session', 'What happens if session.timeout.ms too low?', 'False positive rebalance on GC pause.', 'Balance with heartbeat and max.poll.interval.'],
  ['Cooperative', 'What happens if one member stuck in cooperative rebalance?', 'Subset of partitions unassigned — partial consumption stop.', 'Remove stuck member.'],
  ['Streams', 'What happens if changelog topic deleted?', 'Streams cannot rebuild state — catastrophic.', 'Protect internal topics with ACL.'],
  ['Connect', 'What happens if sink connector task fails repeatedly?', 'Offsets may not advance — at-least-once duplicates on fix.', 'DLQ for connect errors.'],
  ['Security', 'What happens if PLAINTEXT exposed to internet?', 'Instant fail security review; credential leak risk.', 'TLS+SASL mandatory prod.'],
];

export const WAR_WHAT_IF: InterviewQ[] = WHAT_IF_SEEDS.map(([topic, question, a30, a2m], i) =>
  q(
    `war-wi-${String(i + 1).padStart(2, '0')}`,
    topic,
    question,
    'Failure semantics — what breaks, what metric proves it',
    a30,
    `${a2m} Prevention: RF/minISR/idempotency/runbook tied to scenario.`,
    'Availability vs consistency depends on knobs — state which you choose.',
    ['"Kafka handles it" hand-wave', 'No metric named', 'Skipping ISR/minISR'],
    ['How detect in monitoring?', 'Temp vs permanent fix?'],
  ),
);

const ARCH_SEEDS: [string, string][] = [
  ['Payment bus', 'Design Kafka for card authorization 25k TPS peak 2×'],
  ['Audit log', 'Design immutable audit trail with 7-year retention'],
  ['Multi-tenant', 'Design shared cluster for 200 tenants with isolation'],
  ['CDC', 'Design Debezium CDC from PostgreSQL to Kafka'],
  ['Outbox', 'Design transactional outbox to Kafka'],
  ['Active-passive DR', 'Design primary + DR with MM2'],
  ['Active-active', 'Design dual-region active-active (when would you refuse?)'],
  ['Streams', 'Design Kafka Streams fraud detection'],
  ['Connect', 'Design sink to Snowflake at 100 MB/s'],
  ['Observability', 'Design metrics pipeline through Kafka'],
  ['Log aggregation', 'Design centralized app logs via Kafka'],
  ['IoT', 'Design 2M devices telemetry ingress'],
  ['SaaS events', 'Design product analytics event bus with PII'],
  ['Microservices', 'Design domain events between 40 services'],
  ['Batch + stream', 'Design lambda architecture with Kafka'],
  ['GDPR', 'Design right-to-erasure with Kafka'],
  ['PCI', 'Design PCI-scoped Kafka cluster'],
  ['Zero trust', 'Design mTLS + ACL for every service'],
  ['Cost optimize', 'Design tiered storage to cut disk 60%'],
  ['Migration', 'Design migration from RabbitMQ to Kafka'],
  ['KRaft greenfield', 'Design new KRaft cluster in 2025'],
  ['ZK legacy', 'Design ZK → KRaft migration plan'],
  ['Hybrid cloud', 'Design on-prem + cloud replication'],
  ['Edge', 'Design store-and-forward edge to central Kafka'],
  ['ML features', 'Design feature store updates via Kafka'],
  ['Search index', 'Design Kafka to Elasticsearch pipeline'],
  ['Order workflow', 'Design order saga choreography with Kafka'],
  ['Rate limiting', 'Design per-tenant produce quotas'],
  ['Blue/green', 'Design blue/green Kafka cluster migration'],
  ['Chaos', 'Design game day for AZ failure'],
];

export const WAR_ARCHITECTURE: InterviewQ[] = ARCH_SEEDS.map(([topic, question], i) =>
  q(
    `war-ar-${String(i + 1).padStart(2, '0')}`,
    topic,
    question,
    'Full whiteboard — ingress math through DR',
    'RF=3 rack-aware, partitions from math, idempotent consumers, URP/lag/disk alerts, MM2 DR cluster.',
    'Structured: traffic → partitions → brokers/controllers → producers/consumers semantics → security → observability → DR/failover → ops. State assumptions and benchmark plan.',
    'Cost vs durability vs complexity — pick explicitly.',
    ['No DR story', 'Consumers = microservice count', 'RF=2 for money'],
    ['Peak 3×?', 'RPO/RTO numbers?'],
    'Producers → Kafka (3 AZ) → consumer groups → stores; MM2 → DR cluster.',
  ),
);

const TROUBLE_SEEDS: [string, string, string][] = [
  ['Lag all partitions', 'Consumer lag high on all partitions — triage order?', 'Cluster health → handler/downstream → rebalance'],
  ['Lag one partition', 'Only partition 7 lagging — what next?', 'Hot key or poison — not more pods'],
  ['URP', 'UnderReplicatedPartitions sustained — diagnose?', 'Lagging follower disk/network'],
  ['Offline', 'OfflinePartitionsCount > 0 — first actions?', 'ISR, restore brokers, no unclean on money'],
  ['Produce timeout', 'Producer TimeoutException spike — where to look?', 'ISR/minISR before client timeout.ms'],
  ['Rebalance loop', 'Consumer group rebalance every minute — fix?', 'GC, max.poll.interval, static membership'],
  ['Disk growth', 'Disk growing 2× forecast — investigate?', 'Retention, compaction, RF×ingress math'],
  ['Auth errors', 'AuthenticationException after deploy — checklist?', 'Cred sync, mechanism, canary pod'],
  ['ACL deny', 'TopicAuthorizationException — debug?', 'Principal, operation, idempotent_write'],
  ['Not leader', 'NotLeaderOrPartitionException — meaning?', 'Metadata stale or election in progress'],
  ['Record too large', 'RecordTooLargeException — align which configs?', 'producer, broker, replica.fetch, consumer fetch.max'],
  ['ISR shrink', 'ISR shrinking hourly — root causes?', 'Disk, network, replica.lag.time.max.ms'],
  ['Controller slow', 'ControllerEventQueueTimeMs high — why?', 'Partition count, metadata load'],
  ['Fetch slow', 'Fetch latency high but produce ok — causes?', 'Consumer fetch size, disk read, tiered cold'],
  ['Duplicate events', 'Downstream duplicates — trace?', 'Retry, commit order, idempotency gap'],
  ['Missing events', 'Events missing in consumer — trace?', 'AMO, retention, wrong seek'],
  ['OOO events', 'Out-of-order per key — debug?', 'Multiple producers, repartition'],
  ['MM2 lag', 'DR mirror lag growing — tune what?', 'Tasks, bandwidth, topic filter'],
  ['Connect lag', 'Sink connector lag — metrics?', 'Connect consumer lag not app group'],
  ['Streams rebalance', 'Kafka Streams rebalance storm — fix?', 'Standby replicas, state size, session timeout'],
  ['Broker CPU', 'Broker CPU 90% — bottleneck?', 'Network threads, compression, fetch load'],
  ['Broker heap', 'Broker heap high — increase?', 'Usually no — shrink heap, use page cache'],
  ['ZK session', 'Broker lost ZK session (legacy)?', 'ZK quorum health first'],
  ['KRaft quorum', 'KRaft voter unreachable — recovery?', 'Restore majority — never edit log manually'],
  ['Throttle', 'Cluster throttling producers — find who?', 'Client-id quota metrics'],
  ['Leader skew', '3 brokers carry 80% leaders — fix?', 'Preferred leader election / Cruise Control'],
  ['Segment corrupt', 'Corrupt log segment on broker — safe fix?', 'Promote replica; replace broker disk'],
  ['Txn abort', 'Aborted transaction records visible?', 'isolation.level=read_committed'],
  ['Metadata timeout', 'Consumer metadata update timeout?', 'Controller load, partition explosion'],
  ['SSL handshake', 'SSL handshake failed — common fixes?', 'Cert chain, SAN, hostname verification'],
];

export const WAR_TROUBLESHOOT: InterviewQ[] = TROUBLE_SEEDS.map(([topic, question, a30], i) =>
  q(
    `war-tr-${String(i + 1).padStart(2, '0')}`,
    topic,
    question,
    'Ordered triage — cluster before client',
    a30,
    'Confirm metric → deploy correlation → one vs all partitions → ISR/controller/disk → temp stabilize → permanent fix → validation gate before resolved.',
    'Temp without root cause repeats louder next time.',
    ['Tune producer on consumer lag', 'Skip URP check', 'Unclean leader for quick fix'],
    ['Which metric proves fixed?', 'Prevention ticket owner?'],
  ),
);

export const WAR_CALC: InterviewQ[] = CALC_PROBLEMS.map((p, i) =>
  q(
    `war-ca-${String(i + 1).padStart(2, '0')}`,
    'Capacity',
    p.prompt,
    'Back-of-envelope production math',
    p.solution.split('.')[0] + '.',
    `${p.solution} Traps: ${p.traps.join('; ')}.`,
    'Constants are illustrative — benchmark on prod-like hardware.',
    p.traps,
    ['What if compression 3:1?', 'What if peak doubles?'],
  ),
);

const STAFF_SEEDS: [string, string, string][] = [
  ['Blast radius', 'Why not one giant cluster for everything?', 'Isolation for upgrade, noisy neighbor, and security boundaries'],
  ['CAP', 'Where does Kafka sit on CAP for payments?', 'Ordering + durability within partition; explicit tradeoffs on availability during minISR breach'],
  ['Cost', 'How justify 3× disk from RF to finance?', 'Outage cost vs storage cost — frame as insurance'],
  ['Org', 'Who owns topic creation in your platform?', 'Governance API + standards — not ad-hoc CLI'],
  ['SLO', 'What SLOs on Kafka platform vs applications?', 'Durability: URP/offline; app: processing lag'],
  ['Testing', 'How load-test before peak season?', '10% peak synthetic + failure injection'],
  ['Version', 'How upgrade Kafka with 200 teams?', 'Canary rack, comms, protocol stepping, rollback plan'],
  ['Data contract', 'How enforce schema compatibility?', 'SR + CI breaking-change gate'],
  ['PII', 'How handle PII in Kafka?', 'Tokenize, encrypt fields, restrict ACL'],
  ['Compliance', 'How prove audit trail integrity?', 'Immutable topics, access audit, retention policy'],
  ['Multi-team', 'How resolve partition count disputes?', 'Platform council with metrics-backed recommendation'],
  ['On-call', 'What pages at 3am vs next business day?', 'Offline, disk, money-topic ISR'],
  ['Postmortem', 'Kafka questions in Sev1 retro?', 'Temp vs permanent, detection gap, benchmark miss'],
  ['Build vs buy', 'Managed Kafka vs self-hosted?', 'Ops burden, feature gaps, cost model'],
  ['Observability', 'Golden signals for Kafka platform?', 'Durability, latency, lag, disk growth rate'],
  ['Idempotency', 'Standard consumer idempotency contract?', 'Business key UNIQUE + commit after effect'],
  ['DR test', 'How often failover DR Kafka?', 'Quarterly game day minimum'],
  ['KRaft migration', 'Riskiest part of ZK → KRaft?', 'Metadata migration window and rollback'],
  ['FinOps', 'Kafka cost hot spots?', 'Ingress, retention, cross-AZ egress, over-partitioning'],
  ['Staff loop', 'Tell me about a Kafka outage you led.', 'STAR: detect → triage durability → fix → prevent'],
];

export const WAR_STAFF_FOLLOWUPS: InterviewQ[] = STAFF_SEEDS.map(([topic, question, intent], i) =>
  q(
    `war-st-${String(i + 1).padStart(2, '0')}`,
    topic,
    question,
    intent,
    'Business impact first, then durability mechanism, explicit tradeoff, operational proof.',
    'Connect technology to org: governance, SLOs, game days, cost, compliance. Use concrete incident or design story — not config laundry list.',
    'Platform standards vs team speed — how you arbitrate matters.',
    ['Only junior tech knobs', 'No incident learning', 'Ignoring cost/compliance'],
    ['How measure success?', 'What would you do differently?'],
  ),
);

export const WAR_INCIDENTS: FailureScenario[] = [
  inc('war-inc-01', 'Broker OOM during peak traffic', ['Pod restart loop', 'Request handler idle drops', 'Produce timeouts'], ['Oversized broker heap', 'G1 long pauses starving I/O threads'], ['GCTimeMillis', 'RequestHandlerAvgIdlePercent'], ['Long GC pause detected'], ['Rolling restart broker', 'Temporarily reduce heap'], ['Modest heap + G1 tune', 'Dedicated KRaft controllers'], 'Large heap steals OS page cache — Kafka logs live on page cache.', 'Shrink heap, tune GC, split controllers — broker OOM is usually page-cache fight not "need more RAM".', 'Broker JVM vs page cache'),
  inc('war-inc-02', 'Leader election storm after bad rolling restart', ['Leadership flapping', 'NOT_LEADER_OR_PARTITION errors', 'Consumer rebalance'], ['All brokers bounced together', 'Controller overload'], ['LeaderElectionRate', 'OfflinePartitions'], ['Election for partition'], ['Pause rolling restart', 'Stabilize controller quorum'], ['One broker at a time with URP=0 gate', 'Preferred leader election after'], 'Fast roll saves minutes, risks hours of churn.', 'Never roll entire cluster simultaneously — wait URP=0 between waves.', 'Clients → leaders → ISR'),
  inc('war-inc-03', 'Shared cloud volume throttling', ['Replica lag on all followers of broker', 'ISR shrink cluster-wide for affected partitions'], ['Noisy neighbor on shared disk', 'IOPS credit exhaustion'], ['ReplicaFetcherLag', 'DiskQueueTime'], ['Slow log flush'], ['Move leaders off hot broker', 'Throttle reassignment'], ['Dedicated NVMe per broker', 'Provisioned IOPS'], 'Shared storage breaks Kafka tail latency.', 'One slow broker poisons every partition with a follower there — fix disk not consumer.', 'Leader + followers on broker'),
  inc('war-inc-04', 'TLS certificate expiry overnight', ['SSL handshake failures 100%', 'All producers/consumers fail'], ['Missed rotation alarm', 'No dual-trust window'], ['auth failure rate', 'connection drop'], ['certificate has expired'], ['Emergency cert deploy', 'Rollback cert if needed'], ['Automated cert rotation', 'Canary listener validation'], 'Self-signed emergency certs create new debt.', 'Total outage — canary one broker listener before fleet rollout.', 'TLS listener :9093'),
  inc('war-inc-05', 'SASL credential rotation half-complete', ['~50% pods auth fail interleaved', 'Intermittent produce fail'], ['K8s secret updated before all pods restarted'], ['auth failure by pod age'], ['Authentication failed'], ['Complete rolling restart', 'Rollback secret'], ['Dual-credential rotation window'], 'Partial rotation looks like flake but is binary per pod.', 'Auth is all-or-nothing — finish roll or rollback fully.', 'SCRAM on all clients'),
  inc('war-inc-06', 'ACL missing Idempotent_Write', ['New payment service cannot produce after idempotence enabled'], ['ACL template missing CLUSTER action'], ['Authorization failures'], ['Principal denied Idempotent_Write'], ['Emergency ACL with ticket', 'Disable idempotence temp (bad)'], ['ACL-as-code template per service'], 'Wildcard ACL fixes outage, fails audit.', 'Idempotent producer requires CLUSTER Idempotent_Write — top interview miss.', 'Producer → broker ACL'),
  inc('war-inc-07', 'Schema Registry HA loss', ['Avro serialization fails for new schemas', 'Connect tasks fail'], ['Single SR node', 'No quorum'], ['SR 5xx rate'], ['Schema registry timeout'], ['Failover to SR replica', 'Use cached schema short-term'], ['3-node SR cluster', 'Client cache + compatibility CI'], 'Cached producers survive briefly — new deploys fail.', 'SR is CP dependency — HA cluster mandatory for schema-on-write paths.', 'Producer → SR → broker'),
  inc('war-inc-08', 'Breaking schema deployed to prod', ['Consumer deserialization storm', 'DLQ flood'], ['INCOMPATIBLE schema change', 'No CI gate'], ['deser error rate', 'DLT rate'], ['Unknown magic byte'], ['Rollback schema version', 'Forward-compatible hotfix'], ['FULL_TRANSITIVE in CI'], 'Skip review for "small" field change.', 'Schema compatibility gate in CI before any producer deploy.', 'SR compatibility'),
  inc('war-inc-09', 'Connect worker rebalance loop', ['Sink lag grows', 'Duplicate warehouse rows'], ['Too many tasks per worker', 'Small heap'], ['Connect rebalance rate'], ['Rebalance started'], ['Reduce tasks per worker', 'Add workers'], ['Dedicated Connect cluster', '5–10 tasks/worker cap'], 'More connectors without workers = churn.', 'Connect rebalance pauses writes — right-size tasks before adding connectors.', 'Connect → Kafka → sink'),
  inc('war-inc-10', 'EOS Connect sink without idempotent DB', ['Duplicate fact rows', 'PK violations'], ['Marketing "exactly-once" believed literally'], ['duplicate insert rate'], ['Constraint violation'], ['Stop connector', 'Enable idempotent upsert'], ['Business key UNIQUE in warehouse'], 'EOS marketing ≠ DB semantics.', 'EOS connector scope ends at sink API — DB needs keys.', 'Connect EOS → Snowflake'),
  inc('war-inc-11', 'Tiered storage cold read latency SLO miss', ['p99 fetch spike on replay job', 'Analyst complaint'], ['Replay 30-day-old offsets'], ['tiered fetch latency'], ['Fetching from remote tier'], ['Limit replay window', 'Prefetch hot set'], ['Hot retention SLA documented'], 'Cold is slow by design.', 'Tiered saves disk — document cold read latency in replay SLO.', 'Consumer → tiered segment'),
  inc('war-inc-12', 'Log segment corruption on broker', ['URP', 'Possible offline partition'], ['Disk fault', 'Unclean shutdown'], ['OfflinePartitions', 'LogDirError'], ['Corrupt segment'], ['Replace broker volume', 'Fail broker out of cluster'], ['RF=3', 'Monitor fsync errors'], 'RF=1 means loss.', 'Promote healthy replica; replace hardware; never delete segments manually without runbook.', 'Leader/follower segments'),
  inc('war-inc-13', 'Zombie consumer after crash', ['Rebalance every deploy', 'Lag plateaus'], ['No graceful shutdown', 'Long session timeout'], ['group members > expected'], ['Member still in group'], ['Remove zombie via admin API', 'Rolling consumer restart'], ['preStop hook', 'group.instance.id static'], 'Delete group loses offsets.', 'Zombie holds assignment — static membership + graceful shutdown.', 'Consumer group coordinator'),
  inc('war-inc-14', 'Cooperative rebalance stuck member', ['Some partitions unassigned', 'Partial throughput'], ['Buggy client', 'Long GC on one pod'], ['sync incomplete'], ['Assignment not complete'], ['Remove stuck member', 'Upgrade client lib'], ['CooperativeStickyAssignor fleet-wide'], 'Eager stops all consumption.', 'One stuck member blocks cooperative sync completion — evict and patch.', 'Consumer group'),
  inc('war-inc-15', 'Transactional producer fencing during blue/green', ['FencedInstanceIdException', 'Deploy failure'], ['Same transactional.id both colors'], ['fence rate'], ['Producer fenced'], ['Unique txn id per color', 'Drain old color'], ['txn id naming convention'], 'Fencing is feature not bug.', 'Duplicate transactional.id triggers fence — plan blue/green ids.', 'Txn producer'),
  inc('war-inc-16', 'Hung open transaction bloat', ['Txn marker disk growth', 'read_committed consumer stall'], ['Zombie txn producer', 'timeout too high'], ['open txn age'], ['Open transaction'], ['Abort hung txn admin', 'Lower transaction.timeout.ms'], ['Monitor open txn count'], 'Aborted records visible to wrong isolation level.', 'Hung transactions fill disk — alert on open txn age.', '__transaction_state'),
  inc('war-inc-17', 'Leader skew after AZ recovery', ['3 brokers carry 70% leaders', 'Disk/network hot spot'], ['No leader rebalance post-incident'], ['leaders per broker'], ['Leader imbalance'], ['Preferred leader election'], ['Scheduled leader balance'], 'Leaders write more than followers.', 'Post-AZ recovery run leader election — skew causes hidden hot brokers.', 'Leaders per broker'),
  inc('war-inc-18', 'Unclean leader enabled by mistake', ['Missing tail events', 'Downstream reconciliation'], ['unclean.leader.election.enable=true'], ['log start offset jump'], ['Unclean leader elected'], ['Disable unclean immediately', 'Reconcile from audit'], ['Policy: unclean=false hard'], 'Availability bought with loss.', 'Unclean election unacceptable for money — say it before they ask.', 'Leader election'),
  inc('war-inc-19', 'minISR=2 on RF=2 blocks maintenance', ['All writes stop during single follower lag'], ['Template copied from RF=3 without edit'], ['NotEnoughReplicas'], ['ISR size 1'], ['Temp lower minISR with ticket', 'Upgrade RF=3'], ['RF=3 minISR=2 standard'], 'RF=2 money fails interview.', 'minISR=RF on RF=2 means any lag blocks writes — fix topology not timeout.', 'RF/minISR'),
  inc('war-inc-20', 'EU producers wired to US cluster', ['200ms+ produce p99', 'Timeout storm'], ['Wrong bootstrap DNS'], ['RTT', 'produce latency'], ['Connection timeout'], ['Fix regional bootstrap', 'Stop cross-wire'], ['Region-local clusters + MM2'], 'Latency breaks acks=all SLO.', 'Clients regional; cross-region is MM2 between clusters only.', 'Cross-region clients'),
  inc('war-inc-21', 'New tenant exceeds default quota', ['ThrottlingException', 'Sudden drop in TPS'], ['No quota ticket for onboarding'], ['throttle time', 'quota violated'], ['Quota exceeded'], ['Raise quota temp', 'Rate limit tenant at gateway'], ['Quota per tenant defaults'], 'Unlimited until first abuse.', 'Quotas protect platform — onboarding checklist includes quota.', 'Producer quota'),
  inc('war-inc-22', 'broker.rack mislabeled in Kubernetes', ['AZ loss causes offline partitions despite RF=3'], ['All pods labeled same rack'], ['replicas per rack metric'], ['same rack'], ['Fix labels', 'Reassign replicas'], ['Topology spread + audit'], 'Fake rack awareness worse than none — false confidence.', 'broker.rack must match real AZ — automate from node labels.', 'Rack awareness'),
  inc('war-inc-23', 'KRaft snapshot stale — slow controller restart', ['Broker startup 30+ min', 'Metadata timeouts'], ['Infrequent snapshot', 'Huge metadata log'], ['snapshot lag'], ['Replaying metadata log'], ['Increase snapshot frequency', 'Fast disk on voters'], ['Dedicated controller nodes'], 'Long restart extends incident.', 'Controller restart time ∝ log since snapshot — tune snapshot interval.', 'KRaft voters'),
  inc('war-inc-24', 'Prometheus JMX scrape overload', ['Broker CPU from metrics', 'Produce latency up'], ['15s scrape all MBeans'], ['scrape duration', 'broker CPU'], ['JMX connection flood'], ['Reduce cardinality', 'kafka-exporter'], ['Recording rules', 'Allowlist metrics'], 'Metrics can DDOS brokers.', 'High-cardinality JMX hurts brokers — exporter sidecar pattern.', 'JMX → Prometheus'),
  inc('war-inc-25', 'Retention not deleting compacted topic', ['Disk growth after retention cut'], ['cleanup.policy=compact only'], ['cleaner backlog'], ['Delete ignored for compact'], ['Trigger compaction', 'Fix policy mix'], ['delete+compact where needed'], 'Compact topics ignore retention.ms alone.', 'Know cleanup.policy — compact vs delete retention behavior.', 'Log cleaner'),
  inc('war-inc-26', 'Fetch session eviction storm', ['Consumers reconnect loop', 'Metadata pressure'], ['fetch.session.cache too small', 'Too many consumers'], ['session evict rate'], ['Session evicted'], ['Tune broker fetch cache', 'Reduce consumer fan-out'], ['Right-size consumer count'], 'Fan-out has broker memory cost.', 'Many consumers evict fetch sessions — costs broker RAM.', 'Fetch path'),
  inc('war-inc-27', 'Unthrottled reassignment during peak', ['p99 latency', 'URP spike'], ['Admin started move during Black Friday'], ['reassignment bytes'], ['Moving partition'], ['Throttle reassignment', 'Pause move'], ['Maintenance windows', 'Cruise Control dry-run'], 'Move during peak is Sev2 self-inflicted.', 'Partition moves duplicate data — throttle and schedule.', 'Inter-broker replication'),
  inc('war-inc-28', 'Cruise Control auto-execute bad proposal', ['URP after "healing"', 'Leader thrash'], ['Wrong goals / no dry-run'], ['CC anomaly'], ['Proposal executed'], ['Pause CC', 'Rollback leaders'], ['Human approve proposals'], 'Automation without guardrails dangerous.', 'Cruise Control dry-run + throttle defaults mandatory prod.', 'Cruise Control'),
  inc('war-inc-29', 'Network thread pool exhausted', ['Delayed heartbeat', 'False consumer failures'], ['Connection storm', 'Low num.network.threads'], ['NetworkProcessorIdle', 'connections'], ['Timed out heartbeat'], ['Raise network threads', 'Connection limits'], ['Per-IP connection quotas'], 'Threads finite.', 'Connection storm exhausts network threads — quotas protect brokers.', 'Broker network threads'),
  inc('war-inc-30', 'advertised.listeners NAT mismatch', ['Intermittent connection refused', 'Works from some subnets'], ['Wrong advertised host'], ['connection errors by AZ'], ['Connection refused'], ['Fix advertised.listeners', 'DNS update'], ['Listener integration tests'], 'Clients use advertised address not bootstrap.', 'advertised.listeners must match what clients can route to.', 'Listeners'),
  inc('war-inc-31', 'SASL mechanism mismatch post-upgrade', ['Handshake failures after broker upgrade'], ['Mixed SCRAM/OAUTH on listener'], ['auth errors'], ['Mechanism mismatch'], ['Align broker + client mechanism'], ['Document listener map'], 'Dual mechanism listeners confuse ops.', 'One listener one mechanism — matrix test in CI.', 'SASL'),
  inc('war-inc-32', 'Skipped finalize message format version', ['Mixed version produce errors', 'URP during upgrade'], ['Upgrade runbook skipped step'], ['broker version mix'], ['Unsupported version'], ['Complete stepping', 'Finalize version'], ['Checklist enforced upgrade'], 'Finalize may be irreversible.', 'Upgrade: roll brokers → protocol → finalize — never skip on money cluster.', 'Rolling upgrade'),
  inc('war-inc-33', 'read_uncommitted on ledger consumer', ['Aborted txn data in settlement'], ['Wrong isolation.level'], ['unexpected txn data'], ['Uncommitted read'], ['Switch read_committed'], ['Config lint in CI'], 'Finance needs read_committed.', 'read_uncommitted sees aborted transactions — wrong for ledger.', 'Consumer isolation'),
  inc('war-inc-34', 'Duplicate group.instance.id in K8s', ['Only one pod consumes', 'Mystery lag'], ['Helm chart copied static id'], ['member count wrong'], ['Static member conflict'], ['Unique id per pod'], ['Downward API pod name in id'], 'Static id must be unique.', 'Collision = silent loss of consumer capacity.', 'Static membership'),
  inc('war-inc-35', 'broker.id reuse on fresh disk', ['Metadata inconsistency', 'Cluster unstable'], ['IaC reuses id for new VM'], ['duplicate broker id'], ['Broker registered'], ['Isolate node', 'Assign new id properly'], ['Idempotent broker provisioning'], 'broker.id is forever.', 'Never reuse broker.id on empty disk — treat as pet identity.', 'Broker registration'),
  inc('war-inc-36', 'Log dir read-only after filesystem error', ['All partitions on broker fail produce'], ['Disk error → ro remount'], ['LogDirError'], ['Read-only file system'], ['Replace volume', 'Drain broker'], ['Disk health alerts'], 'One broker many partitions.', 'Read-only log dir is broker-level Sev1 — fast drain.', 'Log directories'),
  inc('war-inc-37', 'fetch.max.bytes enormous on analytics consumer', ['Broker OOM', 'Fetch failures cluster-wide'], ['Misguided "bigger is faster" tuning'], ['fetch size p99', 'OOM'], ['Java heap OOM'], ['Lower client fetch.max.bytes', 'Restart broker'], ['Client config standards'], 'Big fetch risks broker memory.', 'Consumer fetch.max.bytes is broker OOM risk — cap fleet-wide.', 'Fetch sizing'),
  inc('war-inc-38', 'JVM DNS cache sticks to dead broker IP', ['Partial client connectivity after broker replace'], ['Java security DNS TTL'], ['connection skew by JVM age'], ['Connection refused'], ['Restart clients', 'networkaddress.cache.ttl'], ['3+ bootstrap brokers'], 'Bootstrap list not single IP.', 'JVM caches DNS — restart or TTL tuning after broker IP change.', 'Client bootstrap'),
  inc('war-inc-39', 'MM2 failover used primary offsets', ['Duplicates or gaps in DR settlement'], ['Runbook seeked same offset'], ['duplicate rate in DR'], ['Offset out of range'], ['Replay by paymentId header', 'Fix runbook'], ['Business-key replay standard'], 'Offsets not portable across clusters.', 'DR replay uses business keys — never primary offset seek.', 'MM2 → DR cluster'),
  inc('war-inc-40', 'Kafka Streams state store disk full', ['App crash loop', 'Rebalance storm'], ['Undersized PVC', 'Changelog lag'], ['state dir bytes'], ['No space left'], ['Expand PVC', 'Reduce changelog retention'], ['Size state in design'], 'Streams = state + changelog.', 'State store disk must fit changelog replay — size both.', 'Streams state'),
  inc('war-inc-41', 'ksqlDB pull queries on prod money cluster', ['Broker CPU spike', 'Payment latency affected'], ['Analysts pointed at prod'], ['pull query rate'], ['Query rejected'], ['Block pull on prod', 'Dedicated ksql cluster'], ['Cluster isolation policy'], 'Interactive ≠ streaming load.', 'Never ad-hoc pull queries on tier-0 cluster.', 'ksql → brokers'),
  inc('war-inc-42', 'Delegation token expired mid-batch job', ['Auth fail 12h into job'], ['Token TTL < job duration'], ['token expiry'], ['Token expired'], ['SCRAM or refresh flow'], ['Token lifetime policy'], 'Long jobs need credential strategy.', 'Batch jobs exceed delegation token TTL — plan renewal.', 'SASL tokens'),
  inc('war-inc-43', 'Kerberos ticket not renewed on broker', ['GSSAPI fail after 24h'], ['Missed kinit cron'], ['GSSAPI errors'], ['Ticket expired'], ['Renew tickets', 'Restart with keytab'], ['Automated renewal'], 'Kerberos ops burden.', 'GSSAPI needs ticket renewal automation — classic day-2 surprise.', 'Kerberos'),
  inc('war-inc-44', 'Blocked poll thread — one partition frozen', ['Partition 3 lag infinite', 'Other partitions fine'], ['Sync HTTP in listener', 'Deadlock'], ['lag by partition'], ['Blocked thread in dump'], ['Kill pod', 'Remove blocking call'], ['Async processing pattern'], 'Poll thread must never block.', 'One blocked thread = one partition stuck forever.', 'Consumer poll thread'),
  inc('war-inc-45', 'Reassignment throttle too low for migration', ['URP days', 'Extended risk window'], ['1 MB/s throttle on PB move'], ['reassignment throttle queue'], ['Throttled replication'], ['Raise throttle in window'], ['Cruise Control plan with ETA'], 'Low throttle extends exposure.', 'Throttle protects prod but lengthens URP — schedule accordingly.', 'Partition migration'),
  inc('war-inc-46', 'Dev bootstrap in prod canary by mistake', ['Wrong data consumed', 'Test events in settlement'], ['Shared helm values'], ['cluster.id mismatch warning ignored'], ['Consumed wrong topic'], ['Rollback deploy', 'Separate DNS per env'], ['Env-specific bootstrap DNS'], 'Silent wrong-cluster disaster.', 'Validate cluster.id and topic prefix on every deploy.', 'Client config'),
  inc('war-inc-47', 'Produce slow fetch fine — ISR path sick', ['Produce p99 up', 'Fetch p99 normal'], ['One slow follower in ISR'], ['produce vs fetch latency'], ['Waiting for ISR'], ['Fix follower disk/network'], ['ISR size alerts'], 'Split metrics by API.', 'Produce up fetch ok → replication/ISR not consumer.', 'ISR replication'),
  inc('war-inc-48', 'Marketing campaign single-key burst', ['One partition 100% hot', 'Batch expire'], ['All traffic keyed campaignId=LAUNCH'], ['RecordsPerSec per partition'], ['Batch expired'], ['Emergency salt topic', 'Rate limit'], ['Campaign partition review'], 'Campaign without key plan.', 'Coordinated burst needs partition/key design — not just scale consumers.', 'Hot partition'),
  inc('war-inc-49', 'Accidental consumer offset reset on prod', ['Replay storm', 'Massive duplicate processing'], ['Admin --reset-offsets debug'], ['lag spike', 'duplicate rate'], ['Reset offsets executed'], ['Pause consumers', 'Restore offset backup if any'], ['Break-glass ACL on admin tools'], 'Offset reset destructive.', 'Admin offset reset on prod → replay storm — ACL protect tools.', '__consumer_offsets'),
  inc('war-inc-50', 'Fleet-wide client restart metadata stampede', ['Controller spike', 'Produce latency'], ['All pods restarted same second'], ['metadata request rate'], ['Metadata fetch storm'], ['Stagger restarts', 'Jitter metadata.max.age.ms'], ['Rolling deploy policy'], 'Thundering herd on metadata.', 'Stagger client restarts — metadata storm looks like broker issue.', 'Metadata path'),
];

export const BAD_GOOD_EXCELLENT: {question: string; bad: string; good: string; excellent: string}[] = [
  {question: 'How many brokers?', bad: 'Three.', good: 'RF=3 across 3 AZs → min 3, prefer 6–9; disk from ingress×RF×retention.', excellent: 'Traffic math → ~TB disk → partition budget → 9 brokers (3/AZ) + tiered storage + benchmark plan.'},
  {question: 'Consumer lag high?', bad: 'Restart consumers.', good: 'URP/offline first; one partition vs all; scale to partition ceiling only.', excellent: 'Cluster red → broker ops. One partition → hot key/poison. All → trace handler p99 + DB + rebalance; DLQ + idempotency permanent.'},
  {question: 'Exactly-once?', bad: 'Turn on idempotence.', good: 'Idempotent producer + scope; DB needs idempotent consumer or outbox.', excellent: 'EOS bounded to Kafka txn scope; payments = ALO + idempotent ledger by paymentId + outbox egress; dup risk explicit.'},
  {question: 'RF for production?', bad: 'Two saves money.', good: 'RF=3 rack-aware money; RF=2 non-critical only.', excellent: 'RF=3 one/AZ, minISR=2, unclean=false; cost = durability insurance; RF=2 fails AZ question.'},
  {question: 'DR strategy?', bad: 'RF=3 is enough.', good: 'Second region cluster + MM2; RPO = lag.', excellent: 'Active-passive DR, MM2 allowlist, idempotent replay by business key, quarterly failover drill.'},
  {question: 'Partition count?', bad: 'Default 1000.', good: 'peak_MB/s ÷ per_partition + consumer parallelism.', excellent: 'Both constraints; 16–32 example; key migration plan if increase later.'},
  {question: 'minISR setting?', bad: 'Always equals RF.', good: 'minISR=2 when RF=3 for AZ-loss write availability.', excellent: 'Tradeoff table: minISR=RF blocks on any lag; minISR=1 risks under-replicated ack; money = 2 of 3.'},
  {question: 'Controllers?', bad: 'Same as brokers.', good: 'Combined small; dedicated 3/5 KRaft at scale.', excellent: '500K TPS: 5 voters/AZ spread + 9+ data brokers; split when ControllerEventQueueTimeMs hurts.'},
  {question: 'Hot partition?', bad: 'Add consumers.', good: 'Max consumers = partitions; fix key skew.', excellent: 'Salt pipeline + rate limit hot key + partition increase with rekey migration plan.'},
  {question: 'Disk sizing?', bad: '1 TB each.', good: 'ingress × RF × retention + 30% headroom.', excellent: 'PB scale → tiered hot+cold; 70/80/90% alerts; weekly forecast.'},
  {question: 'Upgrade plan?', bad: 'Restart all brokers.', good: 'One at a time, URP=0 between.', excellent: 'Client matrix → rack roll → protocol step → finalize format; abort criteria defined.'},
  {question: 'Poison message?', bad: 'Skip offset.', good: 'DLQ + classifier.', excellent: 'ErrorHandlingDeserializer → DLT with headers; replay runbook; seek only break-glass.'},
  {question: 'Cross-region?', bad: 'One global cluster.', good: 'Region-local + MM2.', excellent: 'EU cluster, US DR, MM2 bandwidth sized, no cross-ocean clients.'},
  {question: 'Ordering guarantees?', bad: 'Kafka is fully ordered.', good: 'Ordered per partition within key.', excellent: 'Partition key = order scope; multi-producer same key breaks order — design writer.'},
  {question: 'Security baseline?', bad: 'Add ACLs later.', good: 'TLS + SASL + ACL day one.', excellent: 'SCRAM/OAuth, least-privilege ACL templates in CI, idempotent_write perm, quarterly audit.'},
];

export const TIMED_RESPONSES: {question: string; s30: string; m2: string; m5: string}[] = [
  {question: 'Design Kafka for 500K TPS 2KB peak 3×', s30: 'Peak 1.5M/s, ~3GB/s ingress, RF3, 96–128 partitions, 9+ brokers, tiered disk, KRaft 3/5, minISR=2, MM2 DR.', m2: 'WORKED_500K math: PB disk → tiering pivot; consumers ≤ partitions; idempotent; URP/lag/disk alerts; benchmark 10% peak.', m5: 'Security ACLs, SR HA, topic governance, Connect, game days, cost model, walk WAR_INCIDENTS for failure modes.'},
  {question: 'AZ failure happens now', s30: 'Confirm scope, offline partitions, no unclean on money, traffic to healthy AZs.', m2: 'Leader/AZ distribution, rack-aware validation, comms, preferred leader election after recovery.', m5: 'Blast radius, game day gaps, rack audit automation, client AZ affinity, capacity headroom math.'},
  {question: 'Consumer lag Sev1', s30: 'URP/offline/disk; one vs all partitions; recent deploy.', m2: 'Hot key/poison vs handler/DB; scale to partition count; p99 trace; DLQ; static membership.', m5: 'Runbook roles, validation gates, prevention OKRs, load test gaps, lag SLO definition.'},
  {question: 'Size partitions for new topic', s30: 'peak_MB/s ÷ per_partition; ≥ consumer count; round up.', m2: 'Benchmark partition; hot key risk; migration if increase later.', m5: 'Metadata limits, Cruise Control, key design workshop, consumer group fan-out.'},
  {question: 'acks=all failures', s30: 'ISR < minISR — not just timeout.ms.', m2: 'Follower lag/disk/network; throttle reassignment; fix replica health first.', m5: 'Idempotent producer, circuit breaker, ISR alerts, link to war-inc-47.'},
  {question: 'MM2 DR failover', s30: 'Stop primary produce; check lag; promote DR; idempotent consumers.', m2: 'DNS/bootstrap switch; replay by business key; RPO comms.', m5: 'Schema Registry DR, active-active comparison, governance, quarterly test.'},
  {question: 'KRaft vs ZooKeeper', s30: 'Greenfield KRaft 3/5; ZK only legacy + migrate.', m2: 'Combined vs dedicated; quorum loss; Kafka 4 without ZK.', m5: 'Migration risks, metadata backup, dual-ops training plan.'},
  {question: 'Multi-tenant isolation', s30: 'ACL + quotas; naming conventions.', m2: 'Dedicated clusters for tier-0; chargeback metrics.', m5: 'Platform API, abuse detection, onboarding checklist.'},
  {question: 'EOS scope question', s30: 'Kafka txn scope — not external DB.', m2: 'ALO + idempotency + outbox for money path.', m5: 'Streams EOS, Connect limits, fencing, read_committed.'},
  {question: 'Broker disk 85%', s30: 'Throttle reassignment; retention check; expand/tier.', m2: 'Capacity model; 70/80/90 thresholds; emergency retention policy.', m5: 'FinOps, tiered architecture, delete test topics automation.'},
];

export const WAR_ALL: InterviewQ[] = [
  ...WAR_HOW_MANY,
  ...WAR_WHAT_IF,
  ...WAR_ARCHITECTURE,
  ...WAR_TROUBLESHOOT,
  ...WAR_CALC,
  ...WAR_STAFF_FOLLOWUPS,
];

export const SECTION_WAR_ROOM: SectionBlock = {
  id: 'war-room',
  part: 55,
  title: 'War room — incidents, how-many, what-if, architecture, troubleshoot',
  lead: `${50} production incidents + ${WAR_ALL.length} interview questions for on-call drills and Staff loops.`,
  ascii: `
WAR ROOM FLOW
─────────────
1. Cluster durable? (offline, URP, ISR, disk, controller)
2. Scope: one partition vs all vs one client
3. Temp stabilize (throttle, scale to partition ceiling)
4. Permanent fix + validation gate
5. Drill CALC_PROBLEMS + BAD_GOOD_EXCELLENT
`,
  body: `Use **WAR_INCIDENTS** (ids \`war-inc-01\` … \`war-inc-50\`) as scenario cards — match metrics, read \`interviewAnswer\` for 60s verbal summary.

**Decks:** \`WAR_HOW_MANY\` (50) · \`WAR_WHAT_IF\` (50) · \`WAR_ARCHITECTURE\` (30) · \`WAR_TROUBLESHOOT\` (30) · \`WAR_CALC\` (20) · \`WAR_STAFF_FOLLOWUPS\` (20).

**BAD_GOOD_EXCELLENT** — escalate answer depth. **TIMED_RESPONSES** — 30s / 2m / 5m practice.

Interview mode: shuffle \`WAR_ALL\` or filter by \`topic\`.`,
  remember: ['URP/offline before lag', 'One partition → key/poison', 'RF ≠ region DR', 'Temp needs permanent ticket'],
  oneLiner: 'Match scenario, show math or metric, fix durability first, benchmark close.',
  trap: 'Config churn without matching WAR_INCIDENTS symptom pattern.',
  tables: [
    {
      headers: ['Deck', 'Count', 'Use'],
      rows: [
        ['WAR_INCIDENTS', '50', 'On-call + failure design'],
        ['WAR_HOW_MANY', '50', 'Sizing rapid fire'],
        ['WAR_WHAT_IF', '50', 'Semantics + failure'],
        ['WAR_ARCHITECTURE', '30', 'Whiteboard design'],
        ['WAR_TROUBLESHOOT', '30', 'Live triage'],
        ['WAR_CALC', '20', 'Back-of-envelope'],
        ['WAR_STAFF_FOLLOWUPS', '20', 'Staff loop'],
      ],
    },
  ],
};

export const SECTION_E2E_TRACE: SectionBlock = {
  id: 'e2e-trace',
  part: 56,
  title: 'End-to-end trace — one payment event through the platform',
  lead: 'Follow one record API → ledger → DR — every hop is an interview talking point.',
  ascii: `
PAYMENT EVENT E2E (placeholders — hub enriches)
──────────────────────────────────────────────
[api-gw] → [payment-svc] → (outbox TX) → [outbox-relay] → producer
  → leader AZ-a p=42 → followers AZ-b,c (ISR=3)
  → [settlement-cg] → idempotent UPSERT
  → [audit-cg] → [mm2] → DR → [dr-settlement-cg]

traceId=\${traceId} paymentId=\${paymentId} offset=\${offset}
`,
  body: `**Produce** — DB row + outbox same transaction; relay → \`payments.v1\` key=paymentId, acks=all, idempotent.

**Consume** — settlement: UPSERT by paymentId, commit offset after DB commit. Audit: separate group.

**Failures** — relay crash (outbox redelivery), ISR shrink, rebalance dup, poison→DLT, broker URP, region→MM2 lag.

**Observability** — \`traceId\` in record headers; lag on settlement-cg; URP; MM2 lag = RPO.

Placeholders \${traceId}, \${paymentId}, \${offset}, \${mm2LagMs} for hub enrichment.`,
  remember: ['Outbox closes DB→Kafka gap', 'Commit after idempotent effect', 'DR replays paymentId not offset'],
  oneLiner: 'Outbox → ISR → idempotent consumer → MM2 DR with trace headers end-to-end.',
  trap: 'Tracing consumer only while producer dual-writes without outbox.',
};
