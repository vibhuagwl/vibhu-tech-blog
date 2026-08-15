import type {InterviewQ} from './types';

export type TrickQ = InterviewQ & {trick?: string};

export const DESIGN_QS: InterviewQ[] = [
  {
    id: 'd01',
    topic: 'End-to-end',
    question: 'Design Kafka infrastructure for a payment event bus at 15k events/s.',
    intent: 'Tests sizing, durability knobs, AZ layout, and consumer semantics in one narrative.',
    answer30s:
      'RF=3 rack-aware across 3 AZs, minISR=2, KRaft controllers 3/5, idempotent producers acks=all, partitions from consumer parallelism math, idempotent consumers + DLQ, monitor URP/lag/disk.',
    answer2m:
      'Ingress ~30MB/s at 2KB events × RF3 → plan disk/network. Brokers 5–7, controllers dedicated at scale. Topic partitions ~24–48 from worker throughput. Producers keyed by accountId. Consumers manual commit after UNIQUE(payment_id) write. Alerts: offline, URP, disk 70%, lag SLO. DR via MM2 second cluster — RF does not replace region DR.',
    architecture:
      'API → producer pool → Kafka cluster (3 AZ) → settlement consumer group → DB + outbox; MM2 → DR cluster; metrics stack on JMX/Prometheus.',
    tradeoffs: 'minISR=2 keeps AZ-loss writable; minISR=3 safer but blocks on single AZ outage. More partitions ↑ ops overhead.',
    mistakes: ['Consumers = microservice count', 'RF=2 for money', 'Lag-only monitoring', 'No idempotency story'],
    followUps: ['Hot account 40% traffic?', 'RPO/RTO for region loss?', 'EOS scope?'],
  },
  {
    id: 'd02',
    topic: 'Multi-AZ HA',
    question: 'Design a 3-AZ Kafka cluster that survives one AZ loss with no planned data loss.',
    intent: 'RF alone is insufficient — rack awareness and minISR story matter.',
    answer30s: 'RF=3, replica placement one per AZ, minISR=2, unclean=false, acks=all, controllers spread across AZs.',
    answer2m:
      'Brokers ≥3 one per AZ minimum; prefer 2 brokers/AZ for headroom. Producers/consumers prefer same-AZ clients to cut latency. After AZ return run preferred leader election. Test game day yearly. DR region still separate cluster.',
    architecture: '9 brokers (3/AZ) + 3 KRaft voters (1/AZ) + rack-aware replica selector.',
    tradeoffs: 'Cross-AZ replication costs latency and bandwidth — required for AZ fault tolerance.',
    mistakes: ['RF=3 all replicas one AZ', 'minISR=1', 'Enabling unclean leader for availability'],
    followUps: ['Two brokers lost same time?', 'Client produce from wrong AZ?'],
  },
  {
    id: 'd03',
    topic: 'Multi-region',
    question: 'Design multi-region Kafka for active-passive payments DR.',
    intent: 'Separate cluster DR from RF; MM2 and idempotent replay.',
    answer30s: 'Primary cluster RF=3 in region A; MM2 to DR cluster region B; failover DNS; consumers idempotent by business key; RPO = MM2 lag.',
    answer2m:
      'Do not stretch one cluster across regions. MM2 mirrors critical topics with transforms/ACL sync. Failover: stop primary produce, promote DR, accept lag window. Replay uses headers not offsets. Active-active needs conflict resolution — rarely first answer for payments.',
    architecture: 'Region A cluster ←MM2→ Region B cluster; shared Schema Registry strategy; ops runbook for failover.',
    tradeoffs: 'Active-passive simpler; active-active lower RTO but hard consistency.',
    mistakes: ['RF=3 across regions myth', 'Offset seek failover', 'Ignoring MM2 capacity'],
    followUps: ['Split-brain prevention?', 'Schema Registry DR?'],
  },
  {
    id: 'd04',
    topic: 'Capacity',
    question: 'How do you capacity-plan brokers, disk, and network?',
    intent: 'Show math not magic numbers.',
    answer30s: 'Disk = ingress × RF × retention; network = ingress × RF + consumer fan-out; brokers from partition leadership load.',
    answer2m:
      'Example: 50MB/s ingress, RF3, 7d retention ≈ 50×3×86400×7 TB before compaction. Add 30% headroom. Partitions ≤4000/broker guideline. Network NIC must carry replication. Scale brokers before partitions explode.',
    architecture: 'Capacity spreadsheet: bytes/s, RF, retention, partition count, MM2 egress.',
    tradeoffs: 'Tiered storage saves disk, adds latency for cold reads.',
    mistakes: ['Sizing disk from single broker ingress only', 'No RF in math'],
    followUps: ['Tiered storage when?', 'When split clusters?'],
  },
  {
    id: 'd05',
    topic: 'Partitions',
    question: 'How many partitions for a new high-volume topic?',
    intent: 'Parallelism math vs metadata overhead.',
    answer30s: 'max(required consumer parallelism, ceil(produce_rate / per_partition_throughput)) + headroom.',
    answer2m:
      'Start measure: one partition ~10–50MB/s depending hardware. 20k/s × 2KB ≈ 40MB/s → need several partitions. Increasing later does not reshuffle old keys. Budget metadata: avoid 10k partitions on tiny cluster.',
    architecture: 'Topic with P partitions; consumer group max scale = P.',
    tradeoffs: 'More P → more files and election work; too few P → hot keys.',
    mistakes: ['Default 1000 partitions', 'Decrease partitions later'],
    followUps: ['Hot key after increase?', 'Leadership skew?'],
  },
  {
    id: 'd06',
    topic: 'Controllers',
    question: 'When split KRaft controllers from data brokers?',
    intent: 'Combined vs dedicated controller topology.',
    answer30s: 'Dedicated when metadata/event queue latency hurts elections or cluster is large/multi-tenant.',
    answer2m:
      'Small payment bus: 3 combined nodes OK. Large: 3–5 dedicated voters + N brokers. Odd voter count; 5 voters if tolerate 2 simultaneous losses. Monitor ControllerEventQueueTimeMs.',
    architecture: 'Dedicated controller tier + broker tier; voters never even count.',
    tradeoffs: 'Dedicated costs more nodes; combined simpler for small teams.',
    mistakes: ['Even number of KRaft voters', 'All controllers one AZ'],
    followUps: ['Combined mode limits?', 'Metadata snapshot backup?'],
  },
  {
    id: 'd07',
    topic: 'Producers',
    question: 'Design producer layer for financial topics.',
    intent: 'acks, idempotence, keys, error handling.',
    answer30s: 'acks=all, enable.idempotence=true, stable key, zstd compression, bounded retries, DLQ at API validation before produce.',
    answer2m:
      'Separate transactional.id only if consume-transform-produce in Kafka txn. Circuit breaker when cluster NotEnoughReplicas. Monitor batch age and retry rate. Never acks=1 for settlement topics.',
    architecture: 'Stateless API pods → shared producer pool → Schema Registry → Kafka.',
    tradeoffs: 'linger.ms ↑ throughput, ↑ latency; compression saves disk/NET, costs CPU.',
    mistakes: ['acks=1 for money', 'No key → random partition order loss'],
    followUps: ['Transactional producer when?', 'max.in.flight without idempotence?'],
  },
  {
    id: 'd08',
    topic: 'Consumers',
    question: 'Design consumer infrastructure for settlement workers.',
    intent: 'Groups, commits, idempotency, DLQ.',
    answer30s: 'One group, members ≤ partitions, manual commit after idempotent DB write, DLQ poison, static membership for deploys.',
    answer2m:
      'CooperativeStickyAssignor reduces rebalance stop-the-world. max.poll.interval from p99 handler × safety factor. Separate read groups for analytics. EOS only if producing back to Kafka atomically with offset.',
    architecture: 'K8s HPA capped at partition count; DB with UNIQUE business key; DLT topic per source.',
    tradeoffs: 'Parallel processing within partition breaks order — use cautiously.',
    mistakes: ['auto.commit=true payments', 'Commit before DB write'],
    followUps: ['Rebalance during deploy?', 'Batch listener?'],
  },
  {
    id: 'd09',
    topic: 'Monitoring',
    question: 'Design observability for Kafka platform team.',
    intent: 'Tiered alerts — durability before lag.',
    answer30s: 'P0: offline, URP sustained, disk, controller down. P1: ISR shrink, lag SLO, rebalance rate. Dashboards per tenant topic.',
    answer2m:
      'JMX → Prometheus; lag exporter per group/partition; synthetic canaries produce/consume; audit ACL deny rate; MM2 lag for DR. SLO dashboards separate infra health vs business age.',
    architecture: 'Prometheus + Grafana + PagerDuty routes; canary in each AZ.',
    tradeoffs: 'High-cardinality labels (payment_id) forbidden — use histograms and sampled traces.',
    mistakes: ['Only lag alert', 'No MM2 monitoring'],
    followUps: ['SLO error budget?', 'Tenant noisy neighbor?'],
  },
  {
    id: 'd10',
    topic: 'Security',
    question: 'Design secure Kafka for multi-team shared cluster.',
    intent: 'TLS, SASL, ACL boundaries, audit.',
    answer30s: 'TLS everywhere, SCRAM/OAuth per service account, prefix ACLs per team topic namespace, no wildcard prod, audit logs.',
    answer2m:
      'Separate INTERNAL/EXTERNAL listeners. Idempotent producers need Idempotent_Write cluster permission. Schema Registry auth aligned. Certificate rotation runbook with dual-trust window. CI tests ACL on deploy.',
    architecture: 'Central cluster with namespace topics team.* ; ACL-as-code repo; break-glass admin role.',
    tradeoffs: 'Shared cluster efficient; dedicated cluster for regulated isolation.',
    mistakes: ['PLAINTEXT internal “because VPC”', 'Shared super-user creds in apps'],
    followUps: ['OAuth vs SCRAM?', 'Cross-cluster ACL sync?'],
  },
  {
    id: 'd11',
    topic: 'Upgrade',
    question: 'Design rolling upgrade for production Kafka 3.x → 4.x.',
    intent: 'Protocol stepping and validation gates.',
    answer30s: 'Upgrade clients first; rolling brokers one rack at a time; step inter.broker.protocol; finalize format; URP=0 between waves.',
    answer2m:
      'Canary rack/broker first. KRaft migration if from ZK is separate project. Rollback impossible after format bump — snapshot metadata before. Communicate client API deprecations. Game day in staging with production traffic shadow.',
    architecture: 'Maintenance window automation: drain leaders → upgrade → verify ISR → next node.',
    tradeoffs: 'Slower roll safer; big-bang faster and unacceptable for payments.',
    mistakes: ['All brokers at once', 'Skip client compatibility check'],
    followUps: ['KRaft-only 4.x narrative?', 'Zookeeper migration path?'],
  },
  {
    id: 'd12',
    topic: 'Hot key',
    question: 'Design mitigation for celebrity account hot partition.',
    intent: 'Key surgery without naive consumer scale.',
    answer30s: 'Detect skew metrics; salt/shuffle topic for hot keys; cache hot path; rate limit producer; do not only add consumers.',
    answer2m:
      'Shuffle topic: random salt in key for ingress, downstream re-partition by business id with state store — complexity high. Simpler: dedicated topic for hot tenant with own partitions. Document order scope change.',
    architecture: 'Skew detector on produce → router service → multiple partitions/topics.',
    tradeoffs: 'Salting breaks strict global order for that key — business must accept.',
    mistakes: ['10 more consumers on 1 hot partition'],
    followUps: ['Kafka sticky partitioner?', 'Auto-scaling consumers?'],
  },
  {
    id: 'd13',
    topic: 'DLQ platform',
    question: 'Design DLQ/retry strategy at cluster edge for many teams.',
    intent: 'Platform vs app responsibility split.',
    answer30s: 'App owns classifier; platform provides DLT topic templates, metrics, replay API SDK; broker has no DLQ.',
    answer2m:
      'Standard: retry topics or @RetryableTopic, terminal -dlt suffix, headers for original offset. Platform monitors dlt.lag and recoverer failures. Replay RBAC with audit. Poison → immediate DLT not 10 retries.',
    architecture: 'Library + ops portal; per-service DLT ACL; central alert templates.',
    tradeoffs: 'Shared DLT topic simpler ops; per-topic clearer ownership.',
    mistakes: ['Believing Kafka moves failed msgs automatically'],
    followUps: ['Transactional consumer + DLT?', 'Replay idempotency?'],
  },
  {
    id: 'd14',
    topic: 'Compaction',
    question: 'Design compacted vs delete retention topics for account state.',
    intent: 'When compaction fits changelog pattern.',
    answer30s: 'Compacted changelog for latest state per key; delete retention for event audit trail; often both topics.',
    answer2m:
      'payments.events.v1 delete retention for audit. account.state.v1 compacted for latest balance snapshot. Compaction needs tombstones and cleaner capacity. Never compact raw payment audit without legal review.',
    architecture: 'Dual topic: immutable event log + compacted projection.',
    tradeoffs: 'Compaction rewrites segments — CPU/disk spikes during cleaner.',
    mistakes: ['Compact financial audit topic'],
    followUps: ['Tombstone semantics?', 'Cleaner lag alert?'],
  },
  {
    id: 'd15',
    topic: 'Schema',
    question: 'Design Schema Registry integration for 50 microservices.',
    intent: 'Compatibility, governance, failure modes.',
    answer30s: 'BACKWARD compatibility default; CI schema check; unknown reader → DLT; Registry HA behind load balancer.',
    answer2m:
      'Subject naming strategy per team. Breaking change = new topic or versioned subject with dual consume period. Registry ACL mirrors Kafka. Cache schemas on clients; handle REGISTRY_UNAVAILABLE as produce fail closed for money.',
    architecture: 'Registry cluster + Kafka backing topic _schemas; gateway plugin optional validation.',
    tradeoffs: 'Strict compatibility slows teams; loose compatibility breaks consumers at runtime.',
    mistakes: ['No compatibility mode', 'Schema change without consumer rollout order'],
    followUps: ['Protobuf vs Avro?', 'Wire format in DLT?'],
  },
  {
    id: 'd16',
    topic: 'Tenant isolation',
    question: 'Design multi-tenant Kafka on one cluster.',
    intent: 'Quotas, ACL, noisy neighbor.',
    answer30s: 'Topic prefix per tenant, client quotas bytes/s, ACL isolation, separate consumer groups, monitor per-tenant lag.',
    answer2m:
      'client.quota.bytes per service account. Consider dedicated brokers for largest tenant (rack labels). Chargeback metrics. Prevent auto.create.topics. Large tenant may need dedicated cluster — interview escape hatch.',
    architecture: 'tenantA.payments.v1 naming; quota templates in IaC.',
    tradeoffs: 'Hard isolation needs cluster split; soft isolation cheaper.',
    mistakes: ['One shared consumer group cross-tenant'],
    followUps: ['Fair scheduler?', 'Dedicated cluster threshold?'],
  },
  {
    id: 'd17',
    topic: 'Stream processing',
    question: 'Design Kafka + Flink/ksql for fraud detection alongside OLTP consumers.',
    intent: 'Multiple consumer groups same topic; ops separation.',
    answer30s: 'Same topic, separate consumer groups; fraud group scales independently; idempotent sinks; lag SLO per group.',
    answer2m:
      'Flink checkpointing separate from DB settlement commits. Hot path stays Java consumer; Flink for windowed rules. Do not share processing code paths. Cluster sized for combined ingress + internal topics.',
    architecture: 'payments.events → settlement group + flink fraud job → alert topic.',
    tradeoffs: 'Flink ops heavier than consumer; stronger window semantics.',
    mistakes: ['One group tries to settle and detect fraud'],
    followUps: ['Exactly-once Flink?', 'Backpressure to Kafka?'],
  },
  {
    id: 'd18',
    topic: 'Cost',
    question: 'Design cost-optimized Kafka without sacrificing payment durability.',
    intent: 'Where to cut — not RF or minISR.',
    answer30s: 'Tiered storage, right retention, compression, partition right-sizing, cluster consolidation with quotas — never RF=1.',
    answer2m:
      'Archive old segments to object storage; shorten non-audit topics; zstd producers; review mirror topics to DR. FinOps dashboard per team bytes×RF. Cost cut that removes AZ diversity is false savings.',
    architecture: 'Hot NVMe tier + cold S3 tier; retention policies by topic class.',
    tradeoffs: 'Tiered adds fetch latency for old data — OK for analytics not hot path.',
    mistakes: ['Reduce RF to save disk', 'Infinite retention on all topics'],
    followUps: ['Compaction vs tiering?', 'Chargeback model?'],
  },
  {
    id: 'd19',
    topic: 'On-prem vs cloud',
    question: 'Design Kafka on AWS MSK vs self-managed EKS — tradeoffs.',
    intent: 'Ops burden vs control.',
    answer30s: 'MSK: managed patches, IAM, less JVM tuning control. Self-managed: full tuning, KRaft ops, team owns upgrades.',
    answer2m:
      'MSK good when team small; self-managed when custom listeners, odd ACL patterns, or colocation with apps on K8s. Both need same RF/AZ story. MSK still needs client design and monitoring — not fully managed application semantics.',
    architecture: 'MSK multi-AZ brokers + IAM auth OR Strimzi on EKS with node pools per AZ.',
    tradeoffs: 'MSK cost premium vs engineer time; Strimzi adds K8s complexity.',
    mistakes: ['Thinking MSK solves consumer idempotency'],
    followUps: ['PrivateLink networking?', 'Cross-account MSK?'],
  },
  {
    id: 'd20',
    topic: 'Incident response',
    question: 'Design incident response integration for Kafka platform.',
    intent: 'Runbooks, roles, comms — people + tech.',
    answer30s: 'Severity matrix tied to offline/URP/lag; primary/secondary on-call; runbook ids in pager; blameless retro with permanent ticket per temp fix.',
    answer2m:
      'Status page updates when offline>0. Escalation to app team when lag but cluster green. Game days quarterly. Post-incident: update FAILURE_SCENARIOS card + RUNBOOKS validation step. Interview: mention humans not only metrics.',
    architecture: 'PagerDuty → Slack war room → runbook links → Grafana dashboards prefilled.',
    tradeoffs: 'Heavy process slows tiny teams; under-process repeats outages.',
    mistakes: ['No runbook owner', 'Resolve on temp fix only'],
    followUps: ['Who owns poison message?', 'Comms template for DR failover?'],
  },
  {
    id: 'd21',
    topic: 'Logistics realtime',
    question: 'Design Kafka for GPS telemetry 500k msgs/s with 24h retention.',
    intent: 'High throughput lower durability tier vs payments.',
    answer30s: 'Separate cluster or namespace; RF=3 still but acks=1 may OK for telemetry; many partitions; compression required; retention 24h; no shared brokers with payments.',
    answer2m:
      'Partition count high from parallelism; avoid mixing with payment topics on same brokers if noisy neighbor. Different SLA and ACL. Optional RF=2 for non-critical telemetry only if explicit loss acceptance — compare to payments RF=3.',
    architecture: 'Telemetry cluster RF3 acks1 + payments cluster RF3 acksall isolation.',
    tradeoffs: 'Cluster split costs money; shared cluster risks noisy neighbor.',
    mistakes: ['Same cluster and same ops runbook as payments'],
    followUps: ['De-dupe GPS points?', 'Edge aggregation?'],
  },
];

export const TRICK_QS: TrickQ[] = [
  {
    id: 't01',
    topic: 'Producer path',
    question: 'Does the producer send messages directly to all brokers?',
    intent: 'Expose broker vs leader confusion.',
    answer30s: 'No — producer sends to the partition leader only; followers replicate via fetch.',
    answer2m: 'Metadata lists leader broker id per partition. Producer batch goes to leader TCP connection. Misunderstanding drives wrong scaling (adding brokers does not fix client-side serialization).',
    tradeoffs: 'Leader-heavy traffic if partition skew.',
    mistakes: ['“Producer replicates for durability”'],
    followUps: ['Who pulls replicas?', 'What acks=all waits on?'],
    trick: 'Producer pushes to all replicas for speed.',
  },
  {
    id: 't02',
    topic: 'Consumer groups',
    question: 'Two consumers same group — same partition?',
    intent: 'Partition assignment exclusivity.',
    answer30s: 'One partition assigned to at most one consumer in the group at a time.',
    answer2m: 'Scale consumers until count = partitions; extras idle. Different groups each get full partition set independently.',
    tradeoffs: 'More groups multiply fetch load on brokers.',
    mistakes: ['Two members same group both read partition 0'],
    followUps: ['What if members > partitions?'],
    trick: 'Same group doubles throughput on same partition.',
  },
  {
    id: 't03',
    topic: 'Replication',
    question: 'RF=3 — survive any two broker failures?',
    intent: 'RF vs simultaneous loss and minISR.',
    answer30s: 'Not always — if two failures hit the only two replicas of a partition, it is offline even with RF=3 cluster-wide.',
    answer2m: 'RF is per partition. Rack-aware spread makes correlated AZ loss survivable. Two random broker losses usually OK; two losses plus bad placement can offline subset.',
    tradeoffs: 'Higher RF costs storage; does not replace DR region.',
    mistakes: ['RF=3 means any 2 brokers anywhere'],
    followUps: ['AZ loss scenario?', 'minISR role?'],
    trick: 'RF=3 guarantees cluster survives any two broker deaths with zero offline partitions.',
  },
  {
    id: 't04',
    topic: 'Ordering',
    question: 'Does Kafka guarantee global order?',
    intent: 'Partition scope of order.',
    answer30s: 'No — only per-partition order.',
    answer2m: 'Multiple partitions interleave. Key chooses partition; same key → same partition order (single producer typical). Global order needs single partition (not scalable) or application sequencing.',
    tradeoffs: 'More partitions break global order.',
    mistakes: ['Topic order equals business order across keys'],
    followUps: ['Multiple producers same key?'],
    trick: 'Kafka preserves order for the whole topic.',
  },
  {
    id: 't05',
    topic: 'Offsets',
    question: 'Is committing offset the same as processing exactly once?',
    intent: 'ALO vs EOS.',
    answer30s: 'No — commit-after-process is at-least-once; crash before commit redelivers.',
    answer2m: 'Exactly-once needs idempotent business logic or Kafka txn scope limited to Kafka pipeline. read_committed does not dedupe consumer DB writes.',
    tradeoffs: 'EOS txn overhead; external DB still needs UNIQUE keys.',
    mistakes: ['Manual commit = exactly once'],
    followUps: ['Commit before process result?'],
    trick: 'disable.auto.commit=true gives exactly-once.',
  },
  {
    id: 't06',
    topic: 'Controller',
    question: 'Does every produce request go through the controller?',
    intent: 'Metadata vs data plane.',
    answer30s: 'No — controller manages metadata; produce goes to partition leader broker.',
    answer2m: 'Clients cache metadata; refresh on NOT_LEADER. Controller churn hurts leadership stability, not per-record routing through controller JVM.',
    tradeoffs: 'Stale metadata causes transient errors — normal with retry.',
    mistakes: ['Controller is bottleneck for all writes'],
    followUps: ['When client refreshes metadata?'],
    trick: 'Controller validates every record content.',
  },
  {
    id: 't07',
    topic: 'ISR',
    question: 'If ISR has one replica, is data safe?',
    intent: 'minISR and acks interaction.',
    answer30s: 'Fragile — single copy; broker loss loses partition data; acks=all may fail if below minISR.',
    answer2m: 'ISR=1 means no replication redundancy. Temporary ISR shrink during maintenance is different from steady state ISR=1.',
    tradeoffs: 'Waiting for full ISR reduces availability during incidents.',
    mistakes: ['ISR=1 OK because RF=3 configured'],
    followUps: ['unclean leader?'],
    trick: 'RF=3 means you always have 3 copies even when ISR shows 1.',
  },
  {
    id: 't08',
    topic: 'Lag',
    question: 'Consumer lag zero means no problems?',
    intent: 'Lag vs durability.',
    answer30s: 'False — URP, offline partitions, or commit-before-process can show zero lag with data risk.',
    answer2m: 'Lag measures offset delta vs log end — not processing correctness. Poison message can stall partition with lag spike, not zero. Always pair lag with cluster health.',
    tradeoffs: 'Low lag with acks=1 during ISR shrink hides risk until broker dies.',
    mistakes: ['Lag-only green dashboard'],
    followUps: ['URP alert?'],
    trick: 'Lag zero equals healthy cluster.',
  },
  {
    id: 't09',
    topic: 'Partitions',
    question: 'Can you decrease partition count?',
    intent: 'Partition immutability.',
    answer30s: 'No native decrease — only increase (split) or new topic migration.',
    answer2m: 'Plan partition count upfront. Migration = dual consume or new topic + reroute. Interview trap: “just merge partitions”.',
    tradeoffs: 'Over-partitioning wastes metadata; under-partitioning limits scale.',
    mistakes: ['We will reduce partitions next release'],
    followUps: ['Increase effect on keys?'],
    trick: 'kafka-topics --alter can shrink partitions.',
  },
  {
    id: 't10',
    topic: 'Keys',
    question: 'Null key — random partition — any issue?',
    intent: 'Round-robin breaks per-entity order.',
    answer30s: 'No key order guarantee; round-robin spread — OK for metrics, wrong for account events.',
    answer2m: 'Sticky partitioner batches null keys to one partition briefly — still no business order. Payments need stable business id key.',
    tradeoffs: 'Null key simplest load spread; loses ordering.',
    mistakes: ['Payment events with null key'],
    followUps: ['Sticky partitioner behavior?'],
    trick: 'Null key is best practice for payments.',
  },
  {
    id: 't11',
    topic: 'acks',
    question: 'acks=1 is faster and safe enough for payments?',
    intent: 'Durability tradeoff.',
    answer30s: 'No for money — leader ack without ISR wait loses data if leader dies before replication.',
    answer2m: 'acks=all with minISR=2 waits ISR persistence. acks=1 is tail-loss window on leader failure. Speed difference often small vs network; correctness dominates.',
    tradeoffs: 'acks=all fails when ISR thin — signals cluster issue early.',
    mistakes: ['acks=1 + RF=3 equals safe'],
    followUps: ['minISR=2 with RF=3?'],
    trick: 'RF=3 makes acks=1 safe.',
  },
  {
    id: 't12',
    topic: 'Idempotence',
    question: 'enable.idempotence fixes duplicate consumer processing?',
    intent: 'Producer vs consumer dedupe scope.',
    answer30s: 'No — idempotent producer dedupes producer retries in broker log; consumer still needs idempotent handler.',
    answer2m: 'PID+sequence scope is producer session to broker. Consumer rebalance redelivery unaffected. Business UNIQUE key still required.',
    tradeoffs: 'Idempotent producer small overhead; mandatory for payments produce path.',
    mistakes: ['Turn on idempotence — duplicates solved end-to-end'],
    followUps: ['Transactional consumer?'],
    trick: 'Idempotent producer means exactly-once settlement.',
  },
  {
    id: 't13',
    topic: 'ZooKeeper',
    question: 'Greenfield Kafka 4.x — still need ZooKeeper?',
    intent: 'KRaft default narrative.',
    answer30s: 'No — Kafka 4.x KRaft-only; know ZK for legacy migration interviews.',
    answer2m: 'Metadata in Raft quorum. ZK ensemble was separate ops burden. Migration projects exist but new design is KRaft voters 3/5.',
    tradeoffs: 'KRaft younger history but current standard.',
    mistakes: ['Install ZK for new cluster'],
    followUps: ['Combined broker+controller?'],
    trick: 'Production Kafka always uses ZooKeeper.',
  },
  {
    id: 't14',
    topic: 'Rebalance',
    question: 'Adding consumers always reduces lag?',
    intent: 'Partition ceiling.',
    answer30s: 'Only until consumer count equals partition count; beyond that idle instances.',
    answer2m: 'Hot partition unaffected by extra consumers — other partitions idle. Fix partitions/keys first.',
    tradeoffs: 'Auto-scaling consumers without partition headroom wastes cost.',
    mistakes: ['HPA 50 replicas on 12 partitions'],
    followUps: ['Static membership benefit?'],
    trick: 'Double consumers halves lag always.',
  },
  {
    id: 't15',
    topic: 'Retention',
    question: 'Unlimited retention is free because disk is cheap?',
    intent: 'Retention cost math.',
    answer30s: 'False — ingress × RF × time; compaction and recovery time grow.',
    answer2m: 'Replay window should drive retention, not infinite audit by default. Tiered storage and legal hold exceptions. Disk full stops cluster.',
    tradeoffs: 'Short retention limits replay after long outage.',
    mistakes: ['No retention policy on high-volume topics'],
    followUps: ['Tiered storage?'],
    trick: 'Keep everything forever — Kafka is a database.',
  },
  {
    id: 't16',
    topic: 'MM2',
    question: 'MM2 active-active with zero duplicate on failover?',
    intent: 'Async replication limits.',
    answer30s: 'False — MM2 lag + bidirectional mirror → duplicates and conflicts without idempotency.',
    answer2m: 'RPO is lag at failure. Failover replay must use business keys. Active-active needs conflict resolution design.',
    tradeoffs: 'Active-passive simpler for payments.',
    mistakes: ['Failover offset seek primary offsets on DR'],
    followUps: ['Heartbeats connector?'],
    trick: 'MM2 gives synchronous DR.',
  },
  {
    id: 't17',
    topic: 'Transactions',
    question: 'Kafka transactions make database updates atomic with consume?',
    intent: 'EOS boundary.',
    answer30s: 'No — transactions atomicity is broker-internal consume+produce; DB is external.',
    answer2m: 'sendOffsetsToTransaction atomically commits offsets with produces to output topics. DB write still separate unless outbox in same DB TX.',
    tradeoffs: 'EOS adds latency and operational complexity.',
    mistakes: ['Transactional consumer protects PostgreSQL write'],
    followUps: ['Outbox pattern?'],
    trick: 'Begin transaction wraps DB + Kafka in one ACID.',
  },
  {
    id: 't18',
    topic: 'Auto topic',
    question: 'auto.create.topics.enable=true in production?',
    intent: 'Governance trap.',
    answer30s: 'Bad — typos create RF=1 default topics; disable in prod.',
    answer2m: 'Use IaC/terraform topic creation with RF=3 minISR=2. Auto-create OK dev only.',
    tradeoffs: 'Strict governance slows ad-hoc tests.',
    mistakes: ['Leave auto-create on in prod'],
    followUps: ['Default RF=1 danger?'],
    trick: 'Auto-create is fine with RF=3 defaults.',
  },
  {
    id: 't19',
    topic: 'Heap',
    question: 'Bigger broker heap equals faster Kafka?',
    intent: 'Page cache model.',
    answer30s: 'False — logs in OS page cache; huge heap steals cache and hurts throughput.',
    answer2m: 'Moderate heap for threads/metadata; RAM for page cache. Long GC pauses from oversized heap cause ISR shrink.',
    tradeoffs: 'Some heap needed; not linear performance gain.',
    mistakes: ['32GB heap on 64GB broker'],
    followUps: ['G1 vs ZGC?'],
    trick: 'Max heap = total RAM for best performance.',
  },
  {
    id: 't20',
    topic: 'Followers',
    question: 'Consumers can read from followers to load-balance?',
    intent: 'Leader-only fetch for consumers.',
    answer30s: 'No — consumers fetch from partition leader (unlike some DB replicas).',
    answer2m: 'Followers only replicate. Rack-aware consumers near leader helps latency. Kafka 2.4+ follower fetching not standard consumer path in interviews.',
    tradeoffs: 'All read load on leaders — leader skew matters.',
    mistakes: ['Round-robin fetch to any replica'],
    followUps: ['Replica fetch vs consumer fetch?'],
    trick: 'Consumers read nearest replica by default.',
  },
  {
    id: 't21',
    topic: 'Log end',
    question: 'Deleting consumed messages frees consumer lag?',
    intent: 'Lag vs retention.',
    answer30s: 'Lag is offset gap to log end — retention delete advances log start, not fix slow consumer.',
    answer2m: 'Slow consumer may lose data if retention expires before catch-up. Fix processing or extend retention temporarily — not “delete to heal”.',
    tradeoffs: 'Short retention + slow consumer = data loss.',
    mistakes: ['Shrink retention to fix lag'],
    followUps: ['Earliest vs latest reset?'],
    trick: 'Truncate topic fixes lag metric.',
  },
  {
    id: 't22',
    topic: 'minISR',
    question: 'min.insync.replicas=1 with RF=3 — good default?',
    intent: 'Silent under-replication acceptance.',
    answer30s: 'Weak — allows acks=all with only one replica in ISR — single copy durability.',
    answer2m: 'Production money topics: minISR=2 with RF=3. minISR=1 masks follower outages until second failure.',
    tradeoffs: 'minISR=2 blocks produce when ISR=1 — intentional pain signal.',
    mistakes: ['minISR=1 for availability'],
    followUps: ['When minISR equals RF?'],
    trick: 'minISR=1 is best practice for HA.',
  },
  {
    id: 't23',
    topic: 'Consumer offset',
    question: '__consumer_offsets is a DLQ?',
    intent: 'Internal topic confusion.',
    answer30s: 'No — internal compacted topic storing committed offsets per group.',
    answer2m: 'Not for failed messages. DLQ is application pattern. Offset topic loss is catastrophic — backup/ACL carefully.',
    tradeoffs: 'Large groups increase offset topic partitions.',
    mistakes: ['Publish failures to __consumer_offsets'],
    followUps: ['offsets.topic.num.partitions?'],
    trick: 'Failed messages go to __consumer_offsets automatically.',
  },
  {
    id: 't24',
    topic: 'Compression',
    question: 'Compression on producer only — brokers store uncompressed?',
    intent: 'Compression end-to-end.',
    answer30s: 'Brokers store compressed bytes as sent (batch compression); consumers decompress.',
    answer2m: 'compression.type producer zstd/lz4 saves disk and replication bandwidth. Broker compression.type affects producer if recompress — usually align settings.',
    tradeoffs: 'CPU vs bytes — zstd strong ratio, higher CPU.',
    mistakes: ['No compression on high-volume JSON'],
    followUps: ['Broker recompression?'],
    trick: 'Brokers always decompress for storage.',
  },
  {
    id: 't25',
    topic: 'KRaft voters',
    question: 'KRaft cluster with 2 controllers — OK?',
    intent: 'Quorum odd number.',
    answer30s: 'No — need odd quorum (3/5) for majority; 2 voters tolerate zero failures cleanly.',
    answer2m: 'Split brain risk with even misconfigured voters. 3 voters tolerate 1 loss; 5 tolerate 2.',
    tradeoffs: 'More voters ↑ metadata fault tolerance, ↑ ops.',
    mistakes: ['2-node KRaft to save cost'],
    followUps: ['Combined 3 brokers enough?'],
    trick: 'Even voter count is fine with Raft.',
  },
  {
    id: 't26',
    topic: 'Preferred leader',
    question: 'Preferred leader election fixes hot key?',
    intent: 'Leader vs key skew.',
    answer30s: 'No — moves leadership among replicas; does not change key→partition mapping.',
    answer2m: 'PLE balances broker leader load. Hot partition needs key/partition change. PLE after AZ recovery redistributes leaders.',
    tradeoffs: 'PLE causes brief leadership movement — schedule off peak.',
    mistakes: ['Run PLE for lag on single partition hot key'],
    followUps: ['kafka-leader-election tool?'],
    trick: 'Preferred leader election rebalances keys across partitions.',
  },
  {
    id: 't27',
    topic: 'EOS read',
    question: 'read_committed consumers never see duplicates?',
    intent: 'Transactional visibility scope.',
    answer30s: 'False — hides aborted transactions; does not dedupe normal at-least-once duplicates.',
    answer2m: 'read_committed skips open/aborted txn records in log. Committed duplicates from producer retry still visible if not txn deduped. Consumer still idempotent.',
    tradeoffs: 'read_committed adds LSO lag visibility delay.',
    mistakes: ['read_committed = exactly-once consumer'],
    followUps: ['LSO vs HW?'],
    trick: 'read_committed fixes all duplicate issues.',
  },
];

export const SENIOR: InterviewQ[] = DESIGN_QS.slice(0, 12);
export const ARCHITECT: InterviewQ[] = DESIGN_QS.slice(12);
export const RAPID: InterviewQ[] = TRICK_QS;
export const ALL: InterviewQ[] = [...SENIOR, ...ARCHITECT, ...RAPID];

export const FRAMEWORK_10 = `KAFKA 10-POINT INTERVIEW FRAMEWORK
1. Workload — rate, payload, retention, ordering scope (key)
2. Durability — RF, minISR, acks, unclean=false
3. Topology — brokers, AZ/rack, KRaft voters, dedicated controllers?
4. Partitions — parallelism math, hot key plan
5. Producers — idempotence, compression, keys, error policy
6. Consumers — groups, commit point, idempotency, DLQ
7. Semantics — ALO + idempotent vs EOS scope; outbox/CDC to DB
8. Multi-region — MM2 DR, RPO/RTO, not RF across regions
9. Observability — URP/offline/disk before lag; SLOs
10. Operations — upgrades stepping, security TLS/SASL/ACL, game days`;

export const ANSWER_30S =
  'Three AZs, RF=3 rack-aware, minISR=2, KRaft 3 voters, idempotent producers acks=all, partitions sized for consumer throughput and key skew plan, manual commit after idempotent DB, DLQ poison, monitor offline/URP/disk then lag, DR second cluster via MM2.';

export const ANSWER_1M = `${ANSWER_30S} Separate telemetry from payments if rate differs 10×. Tiered storage for long audit. Rolling upgrades one broker at a time with URP gates. ACL per service account — no PLAINTEXT.`;

export const ANSWER_3M = `${ANSWER_1M} Walk produce path: API validates → keyed produce → leader append → ISR replicate → HW. Consume: poll → idempotent UPSERT payment_id → commit offset. Failure modes: ISR shrink stops acks=all intentionally; lag one partition → hot key; URP → follower disk. Temp vs permanent in incidents. EOS only for Kafka-internal pipelines; outbox for domain events.`;

export const ANSWER_10M = `${ANSWER_3M} Deep-dive sizing example 20k/s 2KB. Capacity disk/network. Controller split criteria. Security listeners INTERNAL/EXTERNAL. Upgrade 3→4 protocol steps. Runbook hooks: rb-lag, rb-broker, rb-isr. Staff contrast: junior lists features; staff states tradeoffs, failure order, and what not to do (unclean, acks=1 money, scale consumers past partitions).`;

export const HOW_MANY_CHEAT: string[][] = [
  ['Component', 'Small', 'Medium', 'Large', 'How to decide'],
  ['Brokers (data)', '3 (1/AZ)', '5–7', '9–15+', 'Disk×RF×retention + partition leadership; not RPS alone'],
  ['KRaft voters', '3 combined', '3 dedicated', '5 dedicated', 'Odd quorum; 5 if tolerate 2 voter loss'],
  ['Partitions / topic', '6–12', '24–48', '96+', 'max(parallel consumers, ceil(rate/partition cap))'],
  ['Consumers / group', '≤ partitions', 'same', 'same', 'Extra consumers idle; scale partitions first'],
  ['Producers (app)', '2+ pods', 'HPA on API RPS', 'Pool + backpressure', 'Bottleneck rarely Kafka with batching'],
  ['Replication factor', '3 prod', '3', '3 (2 DR mirror)', 'RF=2 only if explicit loss OK'],
  ['min.insync.replicas', '2 (RF=3)', '2', '2', 'minISR=3 blocks single AZ loss writes'],
  ['Retention (audit)', '7–30d hot', '+ tiered cold', 'legal-driven', 'Replay window + compliance, not infinite'],
];

export const DECISION_TREES: {id: string; title: string; ascii: string}[] = [
  {
    id: 'brokers',
    title: 'How many brokers?',
    ascii: `
Need HA across AZs?
├─ NO → not production (stop)
└─ YES → RF=3 rack-aware
    Disk = ingress × RF × retention (+30%) fits one broker?
    ├─ NO → add brokers OR tiered storage OR cut retention
    └─ YES → Partitions / broker < ~4000?
        ├─ NO → add brokers or reduce partitions
        └─ YES → 3 (min) / 5–7 (typical medium) / 9+ (large)
`,
  },
  {
    id: 'partitions',
    title: 'How many partitions?',
    ascii: `
Required parallel consumers = C
Peak rate = R msg/s (or MB/s)
Per-partition ceiling = P (measure ~10–50MB/s)
Need = max(C, ceil(R/P)) × headroom(1.2–2×)
Hot key skew?
├─ YES → salt/split topic BEFORE blind increase
└─ NO → create topic; plan increase (keys don't migrate)
`,
  },
  {
    id: 'consumers',
    title: 'How many consumers in group?',
    ascii: `
Partitions = N
Members in group?
├─ < N → some idle partitions possible if skew
├─ = N → full parallelism (ideal upper bound)
└─ > N → extras idle (waste)
Lag with members = N?
├─ YES → slow handler / DB — fix code not brokers
└─ NO → add members until = N (then fix handler)
`,
  },
];

export const CHECKLIST: string[] = [
  'RF=3 with rack awareness across 3 AZs',
  'min.insync.replicas=2 and unclean.leader.election.enable=false for money topics',
  'Producers: acks=all, enable.idempotence=true, compression, stable keys',
  'Consumers: auto.commit=false, commit after idempotent side effect, DLQ path',
  'Partitions sized from throughput and consumer parallelism — documented hot key plan',
  'KRaft odd voter count; controllers spread across AZs',
  'Monitoring: offline, URP, ISR shrink, disk 70/80/90, lag SLO, rebalance rate',
  'DR: second cluster + MM2; failover runbook with RPO/RTO; idempotent replay keys',
  'Security: TLS, SASL, least-privilege ACL, no auto.create.topics in prod',
  'Upgrade: client compatibility matrix, rolling one broker at a time, URP gate between waves',
  'Runbooks linked in pager; temp fixes require permanent ticket',
  'Game day: AZ loss, broker loss, MM2 failover drill at least annually',
];

export const JUNIOR_VS_STAFF = `Junior — Lists Kafka features (partitions, groups, RF); says "scale consumers" for lag; treats lag as only metric; acks=1 OK; believes RF=3 fixes everything including region loss; no idempotency story.

Senior — States RF/minISR/acks together; consumers ≤ partitions; manual commit after idempotent write; mentions URP/offline; separates broker vs client tuning; knows order is per-partition.

Staff — Opens with Detect→Prevent; cluster durability before lag; temp vs permanent with tradeoffs; MM2 DR vs RF; hot partition key surgery; EOS scope vs outbox; security TLS/SASL/ACL + upgrade stepping; runs FAILURE_SCENARIOS mental matrix; articulates what NOT to do (unclean money, wildcard ACL, shrink retention to fix lag).`;
