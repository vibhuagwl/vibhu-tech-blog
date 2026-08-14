import type {InterviewQ} from './types';

export const SENIOR: InterviewQ[] = [
  {
    id: 's01',
    topic: 'Fundamentals',
    question: 'Does Apache Kafka provide a built-in DLQ?',
    answer30s:
      'No. Kafka provides topics, partitions, offsets, and replication. DLQ/DLT is an application or framework pattern: a dedicated topic plus error handling, producer publish, offset policy, retry, and replay.',
    answer2m:
      'Interview trap: confusing broker primitives with Spring Kafka DeadLetterPublishingRecoverer. The broker will happily store whatever you produce to a DLT topic — it has no opinion on failure semantics. Your consumer must classify, publish, and commit/seek explicitly or via Spring DefaultErrorHandler.',
    followUps: ['What does Spring Kafka add?', 'Is __consumer_offsets a DLQ?'],
    trick: '“Kafka automatically moves failed messages to a DLQ topic.”',
  },
  {
    id: 's02',
    topic: 'DLT vs retry',
    question: 'DLT vs retry topic — when use each?',
    answer30s:
      'Retry topics handle transient failures with delay without blocking the partition. DLT is terminal parking for poison, business permanent errors, or exhausted retries.',
    answer2m:
      'Retry-0/1/2 with same key preserves per-payment order context. DLT is where ops and replay tooling work. Calling a retry topic a “DLQ” blurs cap semantics — retries are still in-flight work, not terminal failure.',
    followUps: ['@RetryableTopic naming?', 'Same partition count?'],
  },
  {
    id: 's03',
    topic: 'Offsets',
    question: 'Offset race: DLT published but offset not committed?',
    answer30s:
      'Crash between recoverer success and ack → redelivery → possible duplicate DLT entry. Offset not advanced → partition may reprocess same failure.',
    answer2m:
      'This is the at-least-once gap between produce-to-DLT and commit offset. Mitigate with DLT dedupe by original offset header, idempotent DLT consumer, or transactional commitRecovered path for transactional pipelines. Never claim exactly-once across both steps without proof.',
    followUps: ['Opposite: commit before DLT?', 'Idempotent DLT sink?'],
  },
  {
    id: 's04',
    topic: 'Offsets',
    question: 'Offset committed but DLT publish failed?',
    answer30s:
      'Message lost from failure queue — worst case. Recoverer threw; if buggy code committed anyway, ops has no DLT row.',
    answer2m:
      'DefaultErrorHandler should not commit when recoverer fails — record stays in seeks. Alert on recoverer failure. For money, dual-write DLT topic + DB with unique (topic,partition,offset) helps forensics but adds dual-write complexity.',
    followUps: ['resetStateOnRecoveryFailure?'],
    trick: 'Assuming recoverer always succeeds.',
  },
  {
    id: 's05',
    topic: 'Ordering',
    question: 'How does DLT affect ordering?',
    answer30s:
      'Kafka orders per partition. Spring default DLT publish uses same partition index as source — preserves partition-scoped order context. Cross-partition order never guaranteed.',
    answer2m:
      'Stable business key → same partition on source, retry, DLT, and replay. If DLT has fewer partitions than source with same-partition resolver, publish fails and partition stalls. Using partition -1 in resolver sacrifices strict partition alignment.',
    followUps: ['Hot key on DLT?', 'Lifecycle OOO?'],
  },
  {
    id: 's06',
    topic: 'Poison',
    question: 'What is a poison message and how do you handle it?',
    answer30s:
      'Payload or code path that will never succeed — bad JSON, unknown enum, NPE in mapper. DLT immediately; zero long retry loops.',
    answer2m:
      'Without DLT, DefaultErrorHandler seek-to-current retries forever and stalls partition lag. ErrorHandlingDeserializer moves deser failures into listener path with headers. Classifier must mark poison as notRetryable. Replay only after schema/code fix.',
    followUps: ['Deser before listener?', 'Skip vs DLT?'],
    trick: 'Retrying poison 10 times because “default is 10 attempts.”',
  },
  {
    id: 's07',
    topic: 'Storms',
    question: 'How do you prevent retry storms?',
    answer30s:
      'Exception classifier, capped retries, circuit breaker on dependency, @RetryableTopic instead of long in-thread sleep, jitter on backoff.',
    answer2m:
      'When API returns 503 for all keys, blind retry multiplies load on victim and consumer threads. Pause consumption or stop forwarding to retry topics when circuit open. DLT flood is sometimes better than infinite hot loop — but alert and capacity plan DLT rate.',
    followUps: ['Pause partition vs consumer group?', 'DLT rate SLO?'],
  },
  {
    id: 's08',
    topic: 'DeadLetterPublishingRecoverer',
    question: 'Explain DeadLetterPublishingRecoverer defaults.',
    answer30s:
      'Spring Kafka framework component. Default destination: originalTopic + "-dlt", same partition as failed record. Adds KafkaHeaders.DLT_* provenance headers.',
    answer2m:
      'Requires KafkaTemplate. Not a broker feature. DLT topic needs ≥ partitions as source for default resolver. On publish failure, throws → DefaultErrorHandler includes record in seeks — partition stuck until broker/ACL fixed. With ErrorHandlingDeserializer, restores original value bytes in DLT record.',
    followUps: ['Custom BiFunction resolver?', 'Multiple KafkaTemplates?'],
  },
  {
    id: 's09',
    topic: 'DefaultErrorHandler',
    question: 'DefaultErrorHandler default retry behavior?',
    answer30s:
      'Spring Kafka docs default: FixedBackOff(0L, 9) — 10 delivery attempts, 0 ms between. After exhaustion, logs ERROR unless recoverer configured.',
    answer2m:
      'Overrides common in prod: FixedBackOff(1000L, 2L) = 3 attempts with 1s delay. notRetryableExceptions skip backoff. resetStateOnRecoveryFailure default true since 2.5.5 — backoff resets if recoverer fails. Blocks partition during sleep — max.poll.interval risk.',
    followUps: ['vs SeekToCurrentErrorHandler legacy?', 'Batch listeners?'],
  },
  {
    id: 's10',
    topic: 'AfterRollback',
    question: 'DefaultErrorHandler vs DefaultAfterRollbackProcessor?',
    answer30s:
      'Transactional containers default to rollback on listener exception — DefaultAfterRollbackProcessor seeks/recovers, not DefaultErrorHandler unless you add custom EH that throws for rollback.',
    answer2m:
      'AfterRollbackProcessor can use same DeadLetterPublishingRecoverer. commitRecovered + kafkaTemplate publishes DLT in new transaction and commits recovered offset. ProducerFencedException may skip processor — tune txn timeout. Non-transactional pipelines use DefaultErrorHandler path.',
    followUps: ['commitRecovered?', 'Batch recover after rollback?'],
  },
  {
    id: 's11',
    topic: 'RetryableTopic',
    question: 'What does @RetryableTopic provide?',
    answer30s:
      'Non-blocking retries: forward failed record to retry topics with backoff, main partition advances. Terminal failure routes to DLT per dltStrategy.',
    answer2m:
      'NOT supported with batch listeners — use DEH + DLP for batch. Creates retry topic topology — operational overhead. Same key routing required for per-key order. Contrasts with blocking DEH sleep on consumer thread.',
    followUps: ['attempts and backoff config?', 'autoCreateTopics false?'],
    trick: 'Using @RetryableTopic on @KafkaListener batch=true.',
  },
  {
    id: 's12',
    topic: 'Deserialization',
    question: 'How handle deserialization failures?',
    answer30s:
      'ErrorHandlingDeserializer wraps real deserializer; puts DeserializationException in headers; listener may see null value. Route to DLT via recoverer.',
    answer2m:
      'Without it, poll loop can fail hard or skip depending on config. DeadLetterPublishingRecoverer can restore bytes for DLT publish. Key failures use DLT_KEY_EXCEPTION_* headers. Poison serde is not transient — do not retry 10 times.',
    followUps: ['Schema Registry compatibility?', 'ByteArrayDeserializer path?'],
  },
  {
    id: 's13',
    topic: 'Semantics',
    question: 'Is DLT exactly-once?',
    answer30s:
      'No. DLT path is at-least-once. Duplicate DLT entries and duplicate replays are possible without dedupe.',
    answer2m:
      'Kafka transactional EOS can tie consume and produce offsets inside broker but external DB and DLT+commit ordering still need idempotency. Say “effectively-once” for payments with UNIQUE business key. Never claim DLQ guarantees exactly-once.',
    followUps: ['read_committed role?', 'sendOffsetsToTransaction?'],
    trick: '“EOS consumer means no duplicate settlements.”',
  },
  {
    id: 's14',
    topic: 'Replay',
    question: 'Safe replay from DLT?',
    answer30s:
      'Republish to source topic with same key, RBAC audit, optimistic lock, business idempotency key. Never invoke listener directly from API.',
    answer2m:
      'Replay duplicates look like normal redelivery — processed_events UNIQUE must absorb them. Illegal lifecycle transitions should reject and increment replay.failed. Headers: replay-dlq-id, correlation-id. Auto-replay only when dependency health proven and failure was transient.',
    followUps: ['Replay to DLT partition vs source?', 'Manual payload edit?'],
  },
  {
    id: 's15',
    topic: 'Partition',
    question: 'Why same partition on DLT default?',
    answer30s:
      'Preserves partition index context for ordering forensics and tooling that assumes partition-scoped sequences.',
    answer2m:
      'Not a broker requirement — Spring default resolver choice. If DLT partition count differs, use custom resolver with partition -1 or expand DLT. Interview: explain tradeoff between strict alignment and operational partition sizing.',
    followUps: ['DLT fewer partitions bug?', 'GitHub issue #1700?'],
  },
  {
    id: 's16',
    topic: 'Recoverer failure',
    question: 'What if DeadLetterPublishingRecoverer throws?',
    answer30s:
      'Record included in seeks; offset not committed; partition retries same offset; backoff may reset (default resetStateOnRecoveryFailure true).',
    answer2m:
      'Sev1: ACL deny, record too large, disk full. Source lag may look healthy while one partition stuck. Metrics on recoverer failure mandatory. Do not manually commit past poison until DLT path works.',
    followUps: ['Alert threshold?', 'Truncate stack trace headers?'],
  },
  {
    id: 's17',
    topic: 'Classification',
    question: 'How classify transient vs permanent?',
    answer30s:
      'Transient: timeout, 503, deadlock — retry capped. Permanent: validation, 400 business, poison deser — DLT now.',
    answer2m:
      'ExceptionClassifier or setNotRetryableExceptions on DEH/ARP. Unknown exceptions: short cap + alert + add rule. SQLSTATE 40P01 deadlock retry; JsonProcessingException not. NPE is poison not transient unless you enjoy 10 stack traces.',
    followUps: ['Exception hierarchy gotchas?', 'HTTP status mapping?'],
  },
  {
    id: 's18',
    topic: 'Headers',
    question: 'Which DLT headers matter for ops?',
    answer30s:
      'DLT_ORIGINAL_TOPIC, PARTITION, OFFSET, DLT_EXCEPTION_FQCN, MESSAGE, STACKTRACE, ORIGINAL_CONSUMER_GROUP.',
    answer2m:
      'Enable DELIVERY_ATTEMPT for retry budgeting metrics. Scrub PII from MESSAGE and stack traces in prod. Custom x-payment-id header for idempotency separate from Kafka metadata. Envelope JSON alternative if headers insufficient for portal.',
    followUps: ['Header size limits?', 'Key vs value deser headers?'],
  },
  {
    id: 's19',
    topic: 'Retention',
    question: 'DLT retention vs source retention?',
    answer30s:
      'DLT often longer or matched to dispute/compliance window. Retry topics short. Compaction usually wrong for audit DLT.',
    answer2m:
      'Capacity plan: failure rate × payload × retention × RF. Tier cold storage for old DLT. Source topic retention must cover replay window for re-ingest after fix.',
    followUps: ['Compacted DLT?', 'Legal hold?'],
  },
  {
    id: 's20',
    topic: 'Rebalance',
    question: 'DLQ interaction with rebalance?',
    answer30s:
      'Revoke may duplicate in-flight work. commitSync onPartitionsRevoked for owned partitions. Long DEH sleep can cause max.poll.interval kick.',
    answer2m:
      'Static group.instance.id reduces deploy rebalance. Cooperative assignor limits stop-the-world. Another member may process same offset if previous crashed after process before commit — idempotency required regardless of DLT.',
    followUps: ['Lost vs revoked?', 'FencedInstanceId?'],
  },
  {
    id: 's21',
    topic: 'Blocking',
    question: 'When is in-thread retry acceptable?',
    answer30s:
      'Very short delays, low volume, non-financial, max.poll.interval comfortably above worst backoff sum.',
    answer2m:
      'Payments and settlement: prefer @RetryableTopic or explicit retry topics. FixedBackOff(0,9) with 0 delay still blocks partition through 10 rapid failures — can starve max.poll if listener slow. Non-blocking keeps main consumer responsive.',
    followUps: ['max.poll.interval math?', 'Pause vs retry topic?'],
  },
  {
    id: 's22',
    topic: 'Topology',
    question: 'One DLT per topic vs shared platform DLT?',
    answer30s:
      'Per-topic -dlt: clear ownership, Spring default, easy partition alignment. Shared: one alert but needs rich source metadata in headers.',
    answer2m:
      'Per-service DLT common in microservices. Split by failure type (schema.dlt) only for ACL/mandate. Ops cost scales with topic count — automate lag dashboards.',
    followUps: ['Multi-tenant ACL?', 'Quarantine topic?'],
  },
  {
    id: 's23',
    topic: 'Batch',
    question: 'DLQ with batch listener?',
    answer30s:
      '@RetryableTopic not supported. Use DefaultErrorHandler + DeadLetterPublishingRecoverer. BatchListenerFailedException for failed index.',
    answer2m:
      'Partial batch: records before index may duplicate if batch reprocessed. Idempotent per record. Transactional batch: batchRecoverAfterRollback on ARP. Conversion errors with MessageConverter + ByteArrayDeserializer path per Spring 2.8+.',
    followUps: ['AckMode BATCH?', 'Partial commit policies?'],
  },
  {
    id: 's24',
    topic: 'Security',
    question: 'How secure DLT for payments?',
    answer30s:
      'Tighter ACL than source READ; RBAC replay; encrypt at rest; truncate payloads; audit actor; no PII in metrics labels.',
    answer2m:
      'DLT is a copy of failed financial payloads — treat as confidential. Separate consumer on DLT for ops tooling with least privilege. Quarantine for fraud-tagged failures. TLS + SASL on produce to DLT same as main.',
    followUps: ['Log scrubbing?', 'Cross-region replication?'],
  },
  {
    id: 's25',
    topic: 'Delay',
    question: 'How implement delayed retry in Kafka?',
    answer30s:
      'No broker delay queue. Use retry topics + @RetryableTopic, scheduled republish, or external store — not long Thread.sleep in listener.',
    answer2m:
      'DELAY_NOTE pattern: retry-1 at 5s, retry-2 30s, retry-3 5m via topic topology and listener delay configuration. Kafka timestamp is metadata not scheduling. In-thread sleep blocks partition and risks rebalance.',
    followUps: ['Kafka timestamp type?', 'Scheduled replay cron?'],
  },
  {
    id: 's26',
    topic: 'Observability',
    question: 'Key DLT metrics and alerts?',
    answer30s:
      'dlt.publish.rate, recoverer.failure (Sev1 if >0), dlt.lag, poison rate by exception FQCN, replay.failed.',
    answer2m:
      'Correlate: retry lag up + DLT flat = dependency blip. DLT spike + flat retry = deploy/schema. Single partition lag = hot poison. Never put payment_id as metric label — cardinality.',
    followUps: ['Lag vs rate?', 'SLO for DLT age?'],
  },
  {
    id: 's27',
    topic: 'OOO',
    question: 'Event 2 fails, event 3 arrives — what do?',
    answer30s:
      'Do not apply event 3 settlement. Park in waiting_events or parking topic. DLT event 2. Replay 2 then drain parked.',
    answer2m:
      'DLT skips middle lifecycle corrupts state if later events proceed. Per-key hold beats pausing entire partition. Sequence expected=last+1 gate. This is beyond bare DLT — application state machine.',
    followUps: ['Parking lot vs DLT?', 'Open-DLQ hold pattern?'],
    trick: 'DLT event 2 and keep consuming 3 and 4.',
  },
];

export const ARCHITECT: InterviewQ[] = [
  {
    id: 'a01',
    topic: 'Architecture',
    question: 'Design end-to-end DLT for payment settlement.',
    answer30s:
      'Idempotent producer to payments.requested.v1; worker with classifier, @RetryableTopic or retry topics, payments.requested.v1-dlt, processed_payments UNIQUE, replay API with RBAC.',
    answer2m:
      'Layers: broker (topics only), Spring (DEH/DLP/@RetryableTopic), app (classifier, state machine, DB idempotency). DLT publish and offset commit explicitly sequenced — document crash windows. Ops console on DLT headers + optional SQL. EOS claim only with business idempotency proof.',
    followUps: ['Outbox for results?', 'Multi-region?'],
  },
  {
    id: 'a02',
    topic: 'Transactions',
    question: 'When use transactional consumer + DLT?',
    answer30s:
      'When Kafka consume and produce (result topic or DLT) must be atomic in broker. DefaultAfterRollbackProcessor + commitRecovered for DLT path.',
    answer2m:
      'External ledger still outside txn. Pattern: read_committed downstream, sendOffsetsToTransaction on happy path. On failure ARP seeks or DLT in new txn. ProducerFencedException handling stops zombie producers. Not a substitute for UNIQUE payment_id.',
    followUps: ['Empty txn keepalive?', 'stopContainerWhenFenced?'],
  },
  {
    id: 'a03',
    topic: 'Capacity',
    question: 'Size DLT cluster capacity?',
    answer30s:
      'ingress × failure% × bytes × retention_seconds × replication_factor + retry topic multiplier.',
    answer2m:
      'Example: 100K eps × 1% fail × 2KB × 7d ≈ 1.2TB before RF3. Add headroom for replay storms. Payload truncation and object-store pointers reduce load. Alert on DLT bytes in rate vs disk.',
    followUps: ['Tiered storage?', 'Sampling DLT in crisis?'],
  },
  {
    id: 'a04',
    topic: 'Governance',
    question: 'DLT governance for regulated payments?',
    answer30s:
      'Retention policy, encryption, access audit, replay approval workflow, legal hold, no compaction on audit queue.',
    answer2m:
      'DLT duplicates PII — data classification same as source. Replay API is financial write — SOC controls. Cross-border replication needs residency review. Document who can IGNORE vs REPLAY vs DELETE.',
    followUps: ['GDPR delete in DLT?', 'Immutable audit log?'],
  },
  {
    id: 'a05',
    topic: 'Multi-service',
    question: 'Shared cluster — per-team DLT strategy?',
    answer30s:
      'Per-service DLT topic with ACL; source metadata in headers; central platform monitors lag templates.',
    answer2m:
      'Avoid one platform.dlt without strong headers — replay routing errors. Namespace topics by domain. Quota on DLT produce rate per service. Shared retry patterns as library (ExceptionClassifier).',
    followUps: ['Topic naming standards?', 'Shared classifier library?'],
  },
  {
    id: 'a06',
    topic: 'Idempotency',
    question: 'Prove effective-once for replay-heavy pipeline.',
    answer30s:
      'UNIQUE business key in same SQL TX as effect; consumer ignores DUPLICATE; replay uses same key; metrics for duplicate ignored.',
    answer2m:
      'Test matrix: commit fail, DLT fail, replay twice, rebalance dup. Kafka txn reduces duplicate publishes to output topic but DB gap remains without constraint. Chaos: kill pod after DB commit before ack.',
    followUps: ['Saga vs idempotent consumer?', 'Outbox vs processed table?'],
  },
  {
    id: 'a07',
    topic: 'Circuit breaker',
    question: 'DLT flood during dependency outage — strategy?',
    answer30s:
      'Circuit open → pause consumption or stop retry forward; avoid million identical DLT rows; page dependency.',
    answer2m:
      'Alternative: sample DLT + aggregate alert. Trade lag growth vs DLT storage. Auto-resume when health check passes. Distinguish per-key poison from systemic outage via exception rate cardinality.',
    followUps: ['Kafka pause vs stop listener?', 'Bulkhead pools?'],
  },
  {
    id: 'a08',
    topic: 'Schema',
    question: 'Schema evolution with DLT replay?',
    answer30s:
      'Forward-compatible readers; unknown enum → DLT until consumer upgraded; replay after deploy with same schema version or transform.',
    answer2m:
      'Schema Registry INCOMPATIBLE mode blocks bad produces at edge — still plan consumer lag during rollout. DLT headers preserve original bytes for re-parse. Replay job may need version adapter.',
    followUps: ['Avro vs JSON?', 'WIRE format in DLT?'],
  },
  {
    id: 'a09',
    topic: 'DR',
    question: 'DR and DLT replication?',
    answer30s:
      'Mirror DLT topics to DR cluster; replay idempotency must work globally; offset mapping not portable — use headers.',
    answer2m:
      'Failover: ops replays from DR DLT with same idempotency keys. Consumer group offsets in DR differ — replay is intentional republish not offset seek. Document split-brain replay prevention.',
    followUps: ['Active-active?', 'MM2 offset translation?'],
  },
  {
    id: 'a10',
    topic: 'Platform',
    question: 'Build internal DLQ platform vs per-app DLT?',
    answer30s:
      'Library: classifier templates, recoverer factory, metrics, replay API SDK. Apps own topic names and business rules.',
    answer2m:
      'Central portal reads DLT headers generically. Per-app state machine stays in domain service. Platform provides RBAC, audit, republish client — not settlement logic. Trade build cost vs inconsistent anti-patterns across teams.',
    followUps: ['Self-service replay?', 'Policy as code?'],
  },
  {
    id: 'a11',
    topic: 'Corner matrix',
    question: 'Walk top DLQ corner cases for staff panel.',
    answer30s:
      'Process/commit ordering, DLT publish fail seek loop, poison, rebalance dup, replay without lock, OOO lifecycle, fewer DLT partitions.',
    answer2m:
      'Staff expects matrix not theory: each case states processed?, dlt?, offset?, dup risk, loss risk, recovery. Unrecoverable: ack-before-process. Recoverer failure is Sev1 design. Transactional ARP vs DEH confusion is common fail.',
    followUps: ['Which is P0 at 3am?', 'Chaos test list?'],
  },
  {
    id: 'a12',
    topic: 'Kafka vs app',
    question: 'Where does responsibility split broker vs Spring vs app?',
    answer30s:
      'Broker: store/replicate. Spring: retry/backoff/recoverer hooks. App: classify, idempotency, replay policy, state machine.',
    answer2m:
      'Never attribute Spring defaults to Kafka broker. Document in runbooks: FixedBackOff(0,9) is Spring Kafka DefaultErrorHandler default. Broker has no opinion on 10 attempts.',
    followUps: ['What broker gives for free?', 'Client retries vs app retries?'],
  },
  {
    id: 'a13',
    topic: 'Parking',
    question: 'Parking lot pattern vs DLT?',
    answer30s:
      'Parking holds not-yet-terminal blocked messages (OOO gap). DLT is terminal failure evidence.',
    answer2m:
      'Same infrastructure (Kafka topic) but different semantics and ops workflow. Parking drains when gap resolved. Quarantine for security isolation third variant. Teach three buckets: retry in-flight, park blocked, DLT terminal.',
    followUps: ['DB waiting_events?', 'TTL on park?'],
  },
  {
    id: 'a14',
    topic: 'Testing',
    question: 'How test DLT paths in CI?',
    answer30s:
      'Embedded Kafka or testcontainers; inject poison and 503; assert DLT headers, offset advance, idempotent ignore on redelivery.',
    answer2m:
      'Chaos tests: recoverer ACL deny, kill after DLT publish, rebalance during retry. Contract tests on header schema. Load test retry storm does not wedge max.poll.interval.',
    followUps: ['Embedded vs TC?', 'Synthetic poison 1%?'],
  },
  {
    id: 'a15',
    topic: 'Migration',
    question: 'Migrate from SeekToCurrentErrorHandler to DefaultErrorHandler?',
    answer30s:
      'Map recoverer to DeadLetterPublishingRecoverer; replace infinite seek with capped backoff + DLT; audit classifier.',
    answer2m:
      'Legacy seek loops stall partitions silently. Migration checklist: DLT topic create with partition count, ACL WRITE, metrics, replay runbook, disable auto-commit. Parallel run shadow DLT in staging with production traffic sample.',
    followUps: ['SeekToCurrent vs DEH?', 'Rollback plan?'],
  },
  {
    id: 'a16',
    topic: 'SLO',
    question: 'DLT SLOs for payment platform?',
    answer30s:
      'Max DLT age for actionable failures; recoverer failure = immediate page; DLT lag bound; settlement lag separate.',
    answer2m:
      'Not all DLT rows need same SLA — poison needs fast triage, transient dependency may self-heal via replay job. Define tiers: auto-replay transient, 4h human for business, 24h schema. Error budget links to deploy quality.',
    followUps: ['Age vs count alert?', 'IGNORE workflow SLA?'],
  },
];

export const RAPID: InterviewQ[] = [
  {id: 'r01', topic: 'Rapid', question: 'Kafka built-in DLQ?', answer30s: 'No — app/framework pattern.', answer2m: 'Broker stores topics; Spring provides recoverer.', followUps: ['Spring component name?']},
  {id: 'r02', topic: 'Rapid', question: 'Default DLT topic name?', answer30s: 'originalTopic + "-dlt" (Spring default).', answer2m: 'Hyphen lowercase suffix per DeadLetterPublishingRecoverer source.', followUps: ['.DLT suffix?']},
  {id: 'r03', topic: 'Rapid', question: 'Default DEH attempts?', answer30s: 'FixedBackOff(0L, 9) = 10 tries.', answer2m: 'Spring Kafka docs default — not Kafka broker.', followUps: ['Override example?']},
  {id: 'r04', topic: 'Rapid', question: '@RetryableTopic + batch?', answer30s: 'Not supported.', answer2m: 'Use DEH + DLP for batch listeners.', followUps: ['BatchListenerFailedException?']},
  {id: 'r05', topic: 'Rapid', question: 'Transactional default EH?', answer30s: 'DefaultAfterRollbackProcessor — not DEH.', answer2m: 'Exception rolls back txn; processor seeks/recovers.', followUps: ['commitRecovered?']},
  {id: 'r06', topic: 'Rapid', question: 'Recoverer throws?', answer30s: 'Seek; offset not committed; stall.', answer2m: 'resetStateOnRecoveryFailure default true.', followUps: ['Sev1?']},
  {id: 'r07', topic: 'Rapid', question: 'DLT exactly-once?', answer30s: 'No — at-least-once; dup on replay.', answer2m: 'Idempotency required for money.', followUps: ['Kafka EOS scope?']},
  {id: 'r08', topic: 'Rapid', question: 'Deser failure tool?', answer30s: 'ErrorHandlingDeserializer.', answer2m: 'Exception in headers before listener.', followUps: ['DLT value restore?']},
  {id: 'r09', topic: 'Rapid', question: 'Poison: retry?', answer30s: 'No — DLT now.', answer2m: 'JsonProcessingException notRetryable.', followUps: ['NPE?']},
  {id: 'r10', topic: 'Rapid', question: 'DLT partition default?', answer30s: 'Same index as source record.', answer2m: 'DLT partitions must be ≥ source.', followUps: ['partition -1?']},
  {id: 'r11', topic: 'Rapid', question: 'Delay queue in Kafka?', answer30s: 'No native per-message delay.', answer2m: 'Retry topics or external scheduler.', followUps: ['Thread.sleep risk?']},
  {id: 'r12', topic: 'Rapid', question: 'Header for original offset?', answer30s: 'KafkaHeaders.DLT_ORIGINAL_OFFSET.', answer2m: 'Plus TOPIC, PARTITION, TIMESTAMP.', followUps: ['Consumer group header?']},
  {id: 'r13', topic: 'Rapid', question: 'Replay safe key?', answer30s: 'Same business key as ingress.', answer2m: 'paymentId partition routing.', followUps: ['Null key?']},
  {id: 'r14', topic: 'Rapid', question: 'auto-commit + exception?', answer30s: 'Anti-pattern — loss or dup.', answer2m: 'Manual ack after success/DLT.', followUps: ['MANUAL_IMMEDIATE?']},
  {id: 'r15', topic: 'Rapid', question: 'DB timeout classify?', answer30s: 'Transient — retry capped.', answer2m: 'Then DLT after cap.', followUps: ['40P01?']},
  {id: 'r16', topic: 'Rapid', question: 'Validation 400 classify?', answer30s: 'Permanent — DLT immediate.', answer2m: 'No 10 retries.', followUps: ['HTTP mapping?']},
  {id: 'r17', topic: 'Rapid', question: 'DLT compacted topic?', answer30s: 'Usually wrong for audit.', answer2m: 'Delete retention typical.', followUps: ['Compaction use?']},
  {id: 'r18', topic: 'Rapid', question: 'Metric P0 recoverer fail?', answer30s: 'recoverer.failure > 0.', answer2m: 'Partition stuck on offset.', followUps: ['DLT lag?']},
  {id: 'r19', topic: 'Rapid', question: 'Rebalance + DEH sleep?', answer30s: 'max.poll.interval risk; dup.', answer2m: 'Use non-blocking retry topics.', followUps: ['Static membership?']},
  {id: 'r20', topic: 'Rapid', question: 'read_committed fixes DLT dup?', answer30s: 'No — downstream visibility only.', answer2m: 'Aborted txn records hidden.', followUps: ['LSO?']},
  {id: 'r21', topic: 'Rapid', question: 'DLT vs retry topic?', answer30s: 'Retry in-flight; DLT terminal.', answer2m: 'Different ops workflows.', followUps: ['Call retry DLQ?']},
  {id: 'r22', topic: 'Rapid', question: 'ProducerFencedException?', answer30s: 'Duplicate transactional.id; container may stop.', answer2m: 'ARP may not run.', followUps: ['Txn timeout?']},
  {id: 'r23', topic: 'Rapid', question: 'DELIVERY_ATTEMPT header?', answer30s: 'When DeliveryAttemptAware enabled.', answer2m: 'Starts at 1; byte[4] in raw record.', followUps: ['DEH supports?']},
  {id: 'r24', topic: 'Rapid', question: 'Ack before process payment?', answer30s: 'Unrecoverable loss risk.', answer2m: 'Never for money paths.', followUps: ['Worst corner case?']},
  {id: 'r25', topic: 'Rapid', question: 'Shared DLT risk?', answer30s: 'Lost source context without headers.', answer2m: 'ACL blur; noisy neighbor.', followUps: ['Per-topic default?']},
];

export const ALL: InterviewQ[] = [...SENIOR, ...ARCHITECT, ...RAPID];
