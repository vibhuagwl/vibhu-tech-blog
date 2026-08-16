export type StaffQ = {
  id: string;
  level: 'Basic' | 'Senior' | 'Staff' | 'Scenario';
  question: string;
  expected: string;
  whyAsked: string;
  wrong: string;
  followUp: string;
};

/** Foundational Kafka DLQ/DLT interview bank (Staff/Principal track). */
export const BASIC_Q: StaffQ[] = [
  {
    id: 'b01',
    level: 'Basic',
    question: 'Does Apache Kafka provide a built-in DLQ?',
    expected:
      'No. Kafka stores topics, partitions, offsets, and replicas. DLQ/DLT is an application or framework pattern: you create a topic, publish failures, and manage offsets yourself.',
    whyAsked: 'Filters candidates who confuse broker primitives with Spring Kafka recoverers.',
    wrong: 'Kafka automatically sends failed messages to a DLQ topic.',
    followUp: 'What does Spring Kafka DeadLetterPublishingRecoverer add on top of the broker?',
  },
  {
    id: 'b02',
    level: 'Basic',
    question: 'Why is there no broker-level DLQ?',
    expected:
      'The broker cannot know your business semantics: poison vs transient, retry budget, or which topic is terminal. It only accepts produce/consume; failure routing is consumer policy.',
    whyAsked: 'Must-have: why no broker DLQ. Separates platform thinking from app design.',
    wrong: 'Brokers always move failed records to __dlq or a system topic.',
    followUp: 'Is __consumer_offsets a DLQ? Why or why not?',
  },
  {
    id: 'b03',
    level: 'Basic',
    question: 'DLT vs retry topic -- what is the difference?',
    expected:
      'Retry topics hold transient work with delay while the main partition can advance. DLT is terminal parking after exhausted retries or non-retryable errors for ops and replay.',
    whyAsked: 'Checks naming clarity used in Spring @RetryableTopic designs.',
    wrong: 'Retry topics and DLT are the same; both are DLQs.',
    followUp: 'When would you skip retry and publish straight to DLT?',
  },
  {
    id: 'b04',
    level: 'Basic',
    question: 'Producer failure vs consumer processing failure vs DLT producer failure -- distinguish them.',
    expected:
      'Producer failure: record never lands on the source topic. Consumer processing failure: record is on the topic but the listener fails. DLT producer failure: recoverer cannot publish to the DLT topic.',
    whyAsked: 'Core taxonomy for Staff answers; prevents mixing unrelated recovery paths.',
    wrong: 'All three are handled by the same consumer DLQ path.',
    followUp: 'Which of these can DefaultErrorHandler actually see?',
  },
  {
    id: 'b05',
    level: 'Basic',
    question: 'Can producer failures go to a consumer DLQ?',
    expected:
      'No. If produce never succeeds, no consumer record exists for DefaultErrorHandler or a DLT recoverer. Use producer retries, idempotence, transactions, and outbox instead.',
    whyAsked: 'Must-have: can producer failures go to consumer DLQ.',
    wrong: 'Failed produces are automatically routed to the consumer group DLQ.',
    followUp: 'How does a transactional outbox change that story?',
  },
  {
    id: 'b06',
    level: 'Basic',
    question: 'What is DeadLetterPublishingRecoverer in Spring Kafka 3.x?',
    expected:
      'A framework recoverer that publishes the failed ConsumerRecord to a DLT (default originalTopic + "-dlt") with DLT_* headers. It is not a broker feature and needs a KafkaTemplate.',
    whyAsked: 'Confirms Spring Kafka 3.x vocabulary for DLQ interviews.',
    wrong: 'It is a Kafka broker plugin that auto-creates DLQs.',
    followUp: 'What happens if the DLT topic has fewer partitions than the source?',
  },
  {
    id: 'b07',
    level: 'Basic',
    question: 'What does DefaultErrorHandler do after retries are exhausted?',
    expected:
      'It invokes the configured recoverer (often DeadLetterPublishingRecoverer). If no recoverer, it logs and may leave seeks depending on config; with recoverer success it advances past the bad record.',
    whyAsked: 'Basic Spring Kafka 3.x error-handler path.',
    wrong: 'Kafka itself moves the record after 10 failures.',
    followUp: 'What is the common FixedBackOff default attempt count?',
  },
  {
    id: 'b08',
    level: 'Basic',
    question: 'What headers does a typical DLT record carry?',
    expected:
      'Spring adds provenance such as original topic, partition, offset, exception class/message, and related DLT_* headers so ops can replay and debug.',
    whyAsked: 'Replay and forensics depend on headers, not payload alone.',
    wrong: 'DLT records are bare copies with no original metadata.',
    followUp: 'Why keep original key on the DLT record?',
  },
  {
    id: 'b09',
    level: 'Basic',
    question: 'What is a poison message in a Kafka consumer?',
    expected:
      'A record that will never succeed with current code/schema (bad JSON, unknown enum, NPE). Classify as not retryable and send to DLT instead of looping.',
    whyAsked: 'Prevents partition stalls from infinite retry of permanent errors.',
    wrong: 'Retry poison ten times because defaults say ten attempts.',
    followUp: 'How does ErrorHandlingDeserializer change poison handling?',
  },
  {
    id: 'b10',
    level: 'Basic',
    question: 'How do you handle deserialization failures before the listener runs?',
    expected:
      'Wrap with ErrorHandlingDeserializer so DeserializationException is surfaced to the error handler and can be recovered to DLT with original bytes restored when configured.',
    whyAsked: 'Deser is a classic DLQ path that bypasses normal listener logic.',
    wrong: 'Ignore bad bytes; Kafka skips them automatically.',
    followUp: 'Key deser failure vs value deser failure -- any header difference?',
  },
  {
    id: 'b11',
    level: 'Basic',
    question: 'At-least-once vs exactly-once for DLT paths -- what should you claim?',
    expected:
      'DLT publish plus offset commit is typically at-least-once: duplicates are possible. Exactly-once needs proven transactional boundaries and still does not cover external DBs alone.',
    whyAsked: 'Semantics honesty is a Staff signal on payments topics.',
    wrong: 'Publishing to DLT is always exactly-once.',
    followUp: 'Where do duplicate DLT rows come from?',
  },
  {
    id: 'b12',
    level: 'Basic',
    question: 'What is an offset commit in consumer failure recovery?',
    expected:
      'Committing advances the group so the failed record is not redelivered. You must not commit if recovery failed, or you drop the failure trail.',
    whyAsked: 'Offsets are the control plane of DLQ design.',
    wrong: 'Always commit before attempting DLT publish for speed.',
    followUp: 'What seeks does DefaultErrorHandler use when recoverer fails?',
  },
  {
    id: 'b13',
    level: 'Basic',
    question: 'Blocking retry vs @RetryableTopic -- one-line difference?',
    expected:
      'Blocking retry sleeps on the consumer thread and can hit max.poll.interval. @RetryableTopic forwards to delay topics so the main partition can move on.',
    whyAsked: 'Spring Kafka 3.x retry topology literacy.',
    wrong: '@RetryableTopic works unchanged with batch listeners.',
    followUp: 'Why is @RetryableTopic unsupported for batch listeners?',
  },
  {
    id: 'b14',
    level: 'Basic',
    question: 'What does same-partition DLT routing preserve?',
    expected:
      'It keeps the failed record on the same partition index as the source so partition-scoped order context is easier to reason about during forensics and replay.',
    whyAsked: 'Ordering basics for DLT design.',
    wrong: 'Same-partition DLT gives global cross-partition ordering.',
    followUp: 'What breaks if DLT has fewer partitions than source?',
  },
  {
    id: 'b15',
    level: 'Basic',
    question: 'What is consumer lag in a DLQ incident?',
    expected:
      'Lag is unconsumed offsets on the source (or retry) topic. Poison without DLT stalls a partition and lag grows; with DLT, lag should clear after recoverer success.',
    whyAsked: 'Ops metric that interviewers expect tied to DLQ design.',
    wrong: 'DLT size is the only lag that matters.',
    followUp: 'How do you alert differently for DLT publish rate vs source lag?',
  },
  {
    id: 'b16',
    level: 'Basic',
    question: 'What is a consumer group rebalance in recovery context?',
    expected:
      'Membership change reassigns partitions mid-retry or mid-recoverer. In-flight work may stop; another member may redeliver the same offsets until commit.',
    whyAsked: 'Rebalance interacts with retry/DLT timing.',
    wrong: 'Rebalance never redelivers; Kafka remembers in-memory retry state.',
    followUp: 'How can long blocking backoff trigger a rebalance?',
  },
  {
    id: 'b17',
    level: 'Basic',
    question: 'What does "park to DLT" mean operationally?',
    expected:
      'After policy says stop retrying, publish the record (or bytes) to a terminal topic, then advance the source offset so the partition unblocks for healthy traffic.',
    whyAsked: 'Confirms DLQ is deliberate policy, not magic.',
    wrong: 'Kafka parks messages when consumer throws any exception.',
    followUp: 'Who owns replay from that park topic?',
  },
  {
    id: 'b18',
    level: 'Basic',
    question: 'Name three failure classes you would not retry long.',
    expected:
      'Deserialization/schema poison, authorization/ACL permanent denies, and clear business validation errors that will not change without a deploy or data fix.',
    whyAsked: 'Classifier design is half of DLQ quality.',
    wrong: 'Retry everything ten times then hope.',
    followUp: 'Give one failure class that should retry with backoff.',
  },
  {
    id: 'b19',
    level: 'Basic',
    question: 'What is replay from a DLT?',
    expected:
      'An authorized process republishes a DLT record back to the original (or retry) topic with audit headers, after a fix, relying on business idempotency.',
    whyAsked: 'DLQ without replay is incomplete for payments and ops.',
    wrong: 'Delete DLT offsets and consumers magically reprocess history.',
    followUp: 'Why avoid calling the listener method directly from an admin API?',
  },
  {
    id: 'b20',
    level: 'Basic',
    question: 'In one sentence, what problem does a consumer DLT solve?',
    expected:
      'It unblocks a partition after non-progressing failures while preserving the failed record for diagnosis and controlled replay.',
    whyAsked: 'Closes basics with purpose, not tooling trivia.',
    wrong: 'It guarantees no message is ever lost or duplicated.',
    followUp: 'What complementary pattern handles producer-side loss risk?',
  },
];

/** Senior depth: Spring Kafka 3.x mechanics, offsets, batch, rebalance. */
export const SENIOR_Q: StaffQ[] = [
  {
    id: 'r01',
    level: 'Senior',
    question: 'Walk DefaultErrorHandler + DeadLetterPublishingRecoverer for a single-record listener.',
    expected:
      'On exception, backoff retries; then recoverer publishes to DLT. On recoverer success the handler seeks/commits past the record. On recoverer failure the record stays in seeks and is retried.',
    whyAsked: 'Senior must narrate the real Spring Kafka 3.x path.',
    wrong: 'After N failures Kafka moves the record; Spring only observes.',
    followUp: 'Where do you configure notRetryableExceptions?',
  },
  {
    id: 'r02',
    level: 'Senior',
    question: 'DLT published OK, then crash before offset commit -- what happens?',
    expected:
      'On restart the same source offset is redelivered, may fail again, and can publish a duplicate DLT entry. Deduplicate DLT by original topic/partition/offset headers.',
    whyAsked: 'Must-have: DLT ok then crash before commit.',
    wrong: 'Kafka rolls back the DLT produce because the consumer crashed.',
    followUp: 'How does commitRecovered with transactions change this gap?',
  },
  {
    id: 'r03',
    level: 'Senior',
    question: 'Offset committed but DLT publish failed -- outcome?',
    expected:
      'Worst case: failure trail lost and source advanced. Correct Spring config must not commit when recoverer throws; alert recoverer failures hard.',
    whyAsked: 'Must-have adjacent: DLT unavailable / publish failure semantics.',
    wrong: 'Commit first for latency; DLT can catch up later.',
    followUp: 'What does resetStateOnRecoveryFailure control?',
  },
  {
    id: 'r04',
    level: 'Senior',
    question: 'DLT topic unavailable (ACL, missing topic, broker outage) -- design response?',
    expected:
      'Recoverer throws; DefaultErrorHandler keeps seeking the bad offset; partition stalls until DLT is writable. Page Sev1, fix ACL/topic capacity; do not skip-commit around it for money flows.',
    whyAsked: 'Must-have: DLT unavailable.',
    wrong: 'Skip the record and continue; DLT is optional telemetry.',
    followUp: 'How do you capacity-plan DLT under a poison storm?',
  },
  {
    id: 'r05',
    level: 'Senior',
    question: 'DB commit succeeds, Kafka offset commit fails -- what must be true?',
    expected:
      'Redelivery will re-run the listener. Business write must be idempotent (inbox UNIQUE on event_id in the same SQL txn as the mutate).',
    whyAsked: 'Must-have: DB commit then offset fail.',
    wrong: 'Kafka EOS makes the DB write roll back automatically.',
    followUp: 'Opposite gap: offset committed, DB rolled back -- how do you prevent silent loss?',
  },
  {
    id: 'r06',
    level: 'Senior',
    question: 'Does Kafka EOS make PostgreSQL + Kafka exactly once?',
    expected:
      'No. Kafka transactions atomicize Kafka produces and offsets, not Postgres. Cross-store exactly-once needs inbox/outbox patterns and idempotent business keys.',
    whyAsked: 'Must-have: does Kafka EOS make PG+Kafka exactly once.',
    wrong: 'enable.idempotence plus read_committed equals exactly-once payments with Postgres.',
    followUp: 'What does sendOffsetsToTransaction actually cover?',
  },
  {
    id: 'r07',
    level: 'Senior',
    question: 'Records A,B,C same partition; B goes to DLT, C succeeds -- ordering story?',
    expected:
      'Per-partition consume order is A then B then C, but after B is parked, downstream effects of C can commit while B is absent. Business order for key of B is broken until replay; C is not held behind B.',
    whyAsked: 'Must-have: ordering when B->DLT and C succeeds.',
    wrong: 'Kafka pauses C until B is successfully replayed from DLT.',
    followUp: 'When would you block the partition instead of DLT-ing B?',
  },
  {
    id: 'r08',
    level: 'Senior',
    question: 'How do you safely replay a payment event from DLT?',
    expected:
      'Authorize ops, republish to source with same key and event_id, bump replay-count headers, require UNIQUE inbox + bank Idempotency-Key, audit who/when/why. Never invent a new payment id per replay.',
    whyAsked: 'Must-have: safe payment DLT replay.',
    wrong: 'Blindly replay the whole DLT topic into prod every night.',
    followUp: 'How do you stop DLT->replay->fail->DLT infinite loops?',
  },
  {
    id: 'r09',
    level: 'Senior',
    question: 'Batch listener fails mid-batch -- how should recovery work?',
    expected:
      '@RetryableTopic is unsupported for batch. Use DefaultErrorHandler with batch recoverers/seeks; often fall back to per-record retry or fall-through so one poison does not lose siblings incorrectly.',
    whyAsked: 'Batch is a common Senior trap in Spring Kafka 3.x.',
    wrong: 'Put @RetryableTopic on batch=true and trust defaults.',
    followUp: 'What is CommonErrorHandler seekAfterError behavior for batches?',
  },
  {
    id: 'r10',
    level: 'Senior',
    question: 'DefaultErrorHandler vs DefaultAfterRollbackProcessor -- when each?',
    expected:
      'Non-transactional containers use DefaultErrorHandler. Transactional listener containers roll back and use AfterRollbackProcessor for seeks/recovery, optionally with the same DLT recoverer and commitRecovered.',
    whyAsked: 'Transactional pipeline literacy.',
    wrong: 'Always wire DefaultErrorHandler even when every listen is transactional.',
    followUp: 'What is ProducerFencedException impact on after-rollback recovery?',
  },
  {
    id: 'r11',
    level: 'Senior',
    question: 'How can blocking backoff cause a rebalance?',
    expected:
      'Sleeping past max.poll.interval.ms makes the member appear dead; group rebalances and another member may take partitions while retries were in memory only.',
    whyAsked: 'Ties retry design to consumer protocol.',
    wrong: 'Backoff is always safe because Kafka pauses heartbeats for you.',
    followUp: 'Why prefer @RetryableTopic under tight poll intervals?',
  },
  {
    id: 'r12',
    level: 'Senior',
    question: 'Design exception classification for payments.',
    expected:
      'Retry timeouts/503s with capped backoff; do not retry poison serde, 4xx validation, or duplicate-detected business rejects; circuit-break dependency outages to avoid retry storms.',
    whyAsked: 'Senior production judgment beyond defaults.',
    wrong: 'One FixedBackOff for all Throwable types.',
    followUp: 'How do you encode that in Spring BinaryExceptionClassifier?',
  },
  {
    id: 'r13',
    level: 'Senior',
    question: 'ErrorHandlingDeserializer + DLT recoverer: what must be restored?',
    expected:
      'Original failed bytes should be published to DLT (recoverer can restore value/key) so engineers can inspect and replay after schema fix, not a null payload.',
    whyAsked: 'Deser DLQ usefulness depends on bytes preservation.',
    wrong: 'DLT only needs the exception message string.',
    followUp: 'Where is DeserializationException stored before the listener?',
  },
  {
    id: 'r14',
    level: 'Senior',
    question: 'Same key across source, retry, and DLT -- why?',
    expected:
      'Preserves per-key partition affinity for reasoning and often for compacted follow-on topics. Changing keys on retry breaks order assumptions for that payment id.',
    whyAsked: 'Ordering and multi-topic topology.',
    wrong: 'Randomize DLT keys to spread load; order never matters for payments.',
    followUp: 'Hot key on DLT -- how do you operate without breaking affinity?',
  },
  {
    id: 'r15',
    level: 'Senior',
    question: 'What if DLT has fewer partitions than source with same-partition resolver?',
    expected:
      'Publish to missing partition index fails; recoverer errors; source partition can stick. Size DLT partitions >= source or use a custom resolver deliberately.',
    whyAsked: 'Concrete Spring DLT operational footgun.',
    wrong: 'Kafka remaps partitions silently for DLT.',
    followUp: 'Tradeoff of DestinationTopicResolver returning partition -1?',
  },
  {
    id: 'r16',
    level: 'Senior',
    question: 'How do multi-service DLTs stay operable?',
    expected:
      'Per-service or per-domain DLT topics, shared header contract (event_id, original topic, exception), centralized replay RBAC, and clear ownership so one team does not replay another service blindly.',
    whyAsked: 'Multi-service focus required by content rules.',
    wrong: 'One global DLQ topic for the entire company with mixed schemas.',
    followUp: 'How do you correlate a payment across three service DLTs?',
  },
  {
    id: 'r17',
    level: 'Senior',
    question: 'Multi-region: active-active consumers and DLT -- what breaks?',
    expected:
      'Two regions may both process or both DLT the same logical event without regional fencing or idempotent keys. Prefer region-sticky consumption or shared inbox UNIQUE across regions.',
    whyAsked: 'Multi-region is a required theme.',
    wrong: 'Geo-replication of DLT topics alone gives exactly-once globally.',
    followUp: 'How do you replay in DR without double-settling?',
  },
  {
    id: 'r18',
    level: 'Senior',
    question: 'Transactional DLT publish: what does commitRecovered buy you?',
    expected:
      'It can publish the DLT record and commit the recovered offset in a Kafka transaction so those two broker-side effects commit together, shrinking the crash window between them.',
    whyAsked: 'EOS-aware Senior answer without overclaiming DB.',
    wrong: 'commitRecovered also commits the Postgres payment row.',
    followUp: 'Still need idempotent DLT consumers? Why?',
  },
  {
    id: 'r19',
    level: 'Senior',
    question: 'Producer timeout after possible broker accept -- consumer DLQ relevant?',
    expected:
      'No. That is producer uncertainty. Use idempotent produce, outbox reconcile, and business keys. Consumer DLQ never saw a record if the client abandons without a successful produce ack path you trust.',
    whyAsked: 'Reinforces producer vs consumer failure split.',
    wrong: 'Route unknown produce outcomes into the consumer DLT topic.',
    followUp: 'How does an outbox relay retry without creating a fake producer DLQ?',
  },
  {
    id: 'r20',
    level: 'Senior',
    question: 'When is seeking past a poison without DLT ever acceptable?',
    expected:
      'Almost never for payments. Non-money telemetry might skip with metrics, but you lose forensics. Prefer DLT or quarantine topic with audit.',
    whyAsked: 'Staff-track judgment under pressure.',
    wrong: 'auto.offset.reset tricks to skip poison in prod.',
    followUp: 'Difference between quarantine topic and DLT naming?',
  },
  {
    id: 'r21',
    level: 'Senior',
    question: 'How do you observe DLT producer failure distinctly in metrics?',
    expected:
      'Separate counters: listener failures, recoverer publish failures, recoverer successes, and source seeks stuck. Alert when recoverer fails even if listener error rate is flat.',
    whyAsked: 'DLT producer failure is its own severity class.',
    wrong: 'One consumer.error metric covers everything.',
    followUp: 'What log fields prove original offset on recoverer failure?',
  },
  {
    id: 'r22',
    level: 'Senior',
    question: 'Explain FixedBackOff vs ExponentialBackOff with DeadLetterPublishingRecoverer.',
    expected:
      'Backoff only spaces in-thread retries before recoverer runs. It does not create delay topics. Cap attempts; long exponential sleeps risk rebalance; prefer retry topics for long delays.',
    whyAsked: 'Prevents misusing backoff as a delay queue.',
    wrong: 'ExponentialBackOff alone gives non-blocking delayed retries.',
    followUp: 'What FixedBackOff(1000L, 2L) means in attempt math?',
  },
  {
    id: 'r23',
    level: 'Senior',
    question: 'Schema evolution breaks consumers -- DLQ strategy?',
    expected:
      'Deser failures go to DLT with bytes; fix schema/compat; replay. Do not burn long retries on forever-incompatible payloads. Coordinate producer compatibility before rollout.',
    whyAsked: 'Deser + replay combo in real systems.',
    wrong: 'Keep retrying until Schema Registry heals itself.',
    followUp: 'Forward vs backward compatibility impact on DLT volume?',
  },
  {
    id: 'r24',
    level: 'Senior',
    question: 'How should a DLT consumer (ops indexer) be designed?',
    expected:
      'Idempotent upsert on (originalTopic, partition, offset) or event_id, no side effects that settle money, and clear RBAC before any replay publish API.',
    whyAsked: 'DLT is a product surface, not a dump.',
    wrong: 'DLT consumer settles payments to "catch up".',
    followUp: 'Why store both headers and raw bytes in the index?',
  },
  {
    id: 'r25',
    level: 'Senior',
    question: 'Partition stuck: infinite seek to current on poison without recoverer -- fix?',
    expected:
      'Attach DeadLetterPublishingRecoverer or a custom recoverer, classify non-retryable, ensure DLT writable, then verify lag drains and DLT receives the poison.',
    whyAsked: 'Classic production incident narrative.',
    wrong: 'Scale consumers horizontally; lag will self-heal.',
    followUp: 'How do you prove the stuck offset in tooling?',
  },
  {
    id: 'r26',
    level: 'Senior',
    question: 'Manual ack mode and DLT -- what extra footgun?',
    expected:
      'Acking before successful DLT publish can drop the trail. Ack only after recoverer success (or use container ack modes that align with error handler completion).',
    whyAsked: 'Offset discipline under manual ack.',
    wrong: 'Ack immediately on listener entry for throughput.',
    followUp: 'How does AckMode.RECORD interact with DefaultErrorHandler?',
  },
  {
    id: 'r27',
    level: 'Senior',
    question: 'Cross-topic transactions: main produce + DLT in one txn -- when useful?',
    expected:
      'Useful when the listener also produces Kafka side effects and you want broker-atomic offset+produces. Still does not include Postgres; keep inbox idempotency.',
    whyAsked: 'EOS nuance without overclaim.',
    wrong: 'One Kafka txn replaces all dual-write patterns to SQL.',
    followUp: 'read_committed requirement for downstream readers?',
  },
  {
    id: 'r28',
    level: 'Senior',
    question: 'How do you prevent retry storms against a down payment API?',
    expected:
      'Classifier + circuit breaker, pause consumption or stop forwarding to retry topics when open, capped attempts, then DLT with reason header; wake only on health recovery.',
    whyAsked: 'Storm control is Senior production competence.',
    wrong: 'Increase concurrency so more threads retry faster.',
    followUp: 'Pause partition vs pause entire container -- tradeoffs?',
  },
  {
    id: 'r29',
    level: 'Senior',
    question: 'What provenance must survive multi-hop retry then DLT?',
    expected:
      'Original topic/partition/offset, original event_id, exception chain or first failure cause, and attempt counts. Do not overwrite original headers on each hop.',
    whyAsked: 'Forensics across Spring retry topology.',
    wrong: 'Only keep the last retry topic name.',
    followUp: 'How do headers differ between @RetryableTopic hops and final DLT?',
  },
  {
    id: 'r30',
    level: 'Senior',
    question: 'Summary: three failure planes and their tools.',
    expected:
      'Producer plane: retries/idempotence/outbox. Consumer processing plane: classifier/retry/DLT. DLT producer plane: ACL/capacity/alerts and non-commit on recoverer failure.',
    whyAsked: 'Compresses Senior mental model cleanly.',
    wrong: 'One consumer DLQ covers all three planes.',
    followUp: 'Which plane is DefaultErrorHandler blind to?',
  },
];

/** Staff/Principal: architecture, payments, multi-region, EOS tradeoffs. */
export const STAFF_Q: StaffQ[] = [
  {
    id: 'p01',
    level: 'Staff',
    question: 'Design a payments consumer DLQ policy for Staff review.',
    expected:
      'Classify transient vs poison; capped retry or retry topics; DLT with full provenance; inbox UNIQUE in same SQL txn as ledger; never claim broker auto-DLQ; separate alerts for DLT publish failure.',
    whyAsked: 'Staff must synthesize policy, not list annotations.',
    wrong: 'Enable a Kafka DLQ flag and move on.',
    followUp: 'What SLO would you put on DLT age for payments?',
  },
  {
    id: 'p02',
    level: 'Staff',
    question: 'Argue why consumer DLQ cannot fix producer dual-write loss.',
    expected:
      'If the API wrote Postgres but never produced, no consumer sees work. DLQ recovers consumed failures only. Producer path needs outbox/CDC or reconciled idempotent produce.',
    whyAsked: 'Staff boundary clarity under executive pressure.',
    wrong: 'Point producers at the consumer DLT topic for failed sends.',
    followUp: 'When is best-effort produce without outbox acceptable?',
  },
  {
    id: 'p03',
    level: 'Staff',
    question: 'Propose an exactly-once story for PG + Kafka you would defend.',
    expected:
      'Kafka EOS for broker-side consume/produce; inbox UNIQUE + business txn for DB effects; outbox for produce-after-DB. Say effectively-once settlements, not magical EOS across stores.',
    whyAsked: 'Must-have EOS vs Postgres at Staff depth.',
    wrong: 'transactional.id on the consumer equals exactly-once with Postgres.',
    followUp: 'Where do you still accept at-least-once and why?',
  },
  {
    id: 'p04',
    level: 'Staff',
    question: 'Multi-service payment saga: one step DLT-parks -- blast radius?',
    expected:
      'Downstream may proceed or timeout depending on choreography; compensating actions must key off event_id; do not assume Kafka holds global order across services. Replay must re-enter the saga safely.',
    whyAsked: 'Multi-service DLQ consequences.',
    wrong: 'Kafka transactions span all microservices automatically.',
    followUp: 'Who is allowed to replay another service DLT?',
  },
  {
    id: 'p05',
    level: 'Staff',
    question: 'Multi-region active-passive failover with DLT backlog -- runbook shape?',
    expected:
      'Fence old region consumers, drain or freeze DLT replay in old region, promote with shared idempotency store or replicated inbox, then replay carefully with region tags to avoid double settle.',
    whyAsked: 'Multi-region Staff ops design.',
    wrong: 'Mirror DLT and auto-replay everything on promote.',
    followUp: 'How do you detect split-brain double processing?',
  },
  {
    id: 'p06',
    level: 'Staff',
    question: 'When would you intentionally not DLT and block the partition?',
    expected:
      'When later messages for the same key must not pass a failed prerequisite (strict state machine) and parking B while C commits would corrupt money or inventory. Accept lag until fixed or use a per-key sequencer.',
    whyAsked: 'Ordering B->DLT vs C -- Staff policy choice.',
    wrong: 'Always DLT everything for availability.',
    followUp: 'How do you implement per-key head-of-line blocking without stalling other keys?',
  },
  {
    id: 'p07',
    level: 'Staff',
    question: 'Define ownership of DLT topics in a platform org.',
    expected:
      'Producing service owns schema, recoverer config, and lag/alerts; platform owns naming, RBAC, and replay tooling; security owns who can publish back to prod topics.',
    whyAsked: 'Staff org design around DLQ.',
    wrong: 'Ops owns all DLT content and silently edits payloads.',
    followUp: 'How do you prevent cross-env replay (stage DLT into prod)?',
  },
  {
    id: 'p08',
    level: 'Staff',
    question: 'Cost and risk of a company-wide single DLQ topic?',
    expected:
      'Schema chaos, noisy neighbor retention, unclear ownership, dangerous bulk replay, and ACL blast radius. Prefer bounded DLT per domain with shared header conventions.',
    whyAsked: 'Anti-pattern recognition at Staff level.',
    wrong: 'One topic simplifies everything and is always better.',
    followUp: 'What shared contract would you still standardize?',
  },
  {
    id: 'p09',
    level: 'Staff',
    question: 'How do you make DLT replay safe under PCI/payments controls?',
    expected:
      'Break-glass RBAC, dual control, immutable audit, redaction of PAN, idempotent settle keys, max replay count, and no raw listener invocation from UI.',
    whyAsked: 'Safe payment DLT replay at compliance depth.',
    wrong: 'Give support engineers KafkaTemplate to any topic.',
    followUp: 'What belongs in quarantine vs replayable DLT?',
  },
  {
    id: 'p10',
    level: 'Staff',
    question: 'Connect max.poll.interval, cooperative rebalance, and DLT recoverer latency.',
    expected:
      'Slow recoverer (DLT broker down) extends processing without poll; member can be kicked. Prefer fail-fast alerts, non-blocking retry topology, and healthy DLT capacity so recoverer is quick.',
    whyAsked: 'Rebalance + DLT unavailable interaction.',
    wrong: 'Ignore poll interval; DLT will wait forever safely.',
    followUp: 'How do you tune session vs poll interval for DEH sleeps?',
  },
  {
    id: 'p11',
    level: 'Staff',
    question: 'Design metrics/SLOs for a Staff Kafka DLQ program.',
    expected:
      'Source poison rate, time-to-DLT, DLT publish failure rate, DLT age p99, replay success/fail, and duplicate DLT insert rate. Page on DLT publish failure and rising age for payments.',
    whyAsked: 'Staff makes programs measurable.',
    wrong: 'Only monitor consumer lag on the main topic.',
    followUp: 'Which metric distinguishes recoverer failure from listener failure?',
  },
  {
    id: 'p12',
    level: 'Staff',
    question: 'Batch consume of payment posts: Staff stance on DLT?',
    expected:
      'Prefer record-level ack/error handling for money. If batch required, isolate failed records explicitly; never commit whole batch if one settlement is uncertain without idempotent proof.',
    whyAsked: 'Batch + payments is a Staff judgment call.',
    wrong: 'Batch for throughput; DLT the whole batch always.',
    followUp: 'How do partial batch commits interact with seeks?',
  },
  {
    id: 'p13',
    level: 'Staff',
    question: 'How do you reason about duplicates across DLT and main after crash windows?',
    expected:
      'Model at-least-once on both paths. Dedupe DLT index by original offset; dedupe business by event_id. Treat duplicate DLT rows as normal, not corruption.',
    whyAsked: 'Crash between DLT and commit is a Staff narrative.',
    wrong: 'Duplicates mean the platform is broken; page Kafka team only.',
    followUp: 'Can Kafka transactions remove duplicate DLT rows entirely?',
  },
  {
    id: 'p14',
    level: 'Staff',
    question: 'Schema Registry outage vs poison schema -- DLQ differences?',
    expected:
      'Outage may be transient (retry/circuit). Incompatible poison should DLT quickly. Misclassifying outage as poison floods DLT; misclassifying poison as transient stalls partitions.',
    whyAsked: 'Classifier quality at Staff level.',
    wrong: 'Treat all SerdeExceptions identically with ten retries.',
    followUp: 'How do headers help later decide auto-replay eligibility?',
  },
  {
    id: 'p15',
    level: 'Staff',
    question: 'Should DLT use the same cluster as source?',
    expected:
      'Usually yes for operational simplicity and transactional recoverer options. Separate cluster adds dual failure domains and harder EOS. If separate, document non-atomic DLT publish and stronger stall alerts.',
    whyAsked: 'Platform topology tradeoff.',
    wrong: 'Always remote DLT for safety; no downsides.',
    followUp: 'Multi-region: is DLT local to the consuming region?',
  },
  {
    id: 'p16',
    level: 'Staff',
    question: 'How do you stop infinite replay loops as policy?',
    expected:
      'Enforce max x-replay-count, quarantine beyond max, require human approval for poison classes, and keep event_id stable so inbox still dedupes.',
    whyAsked: 'Replay safety beyond a single happy path.',
    wrong: 'Auto-replay all DLT every hour until empty.',
    followUp: 'Who increments replay-count -- replay service or consumer?',
  },
  {
    id: 'p17',
    level: 'Staff',
    question: 'Explain a Staff-level review comment: "Kafka automatically DLQs".',
    expected:
      'Reject it. Brokers do not auto-route failures. Demand Spring recoverer config, DLT topic IaC, classifier, and offset policy written down.',
    whyAsked: 'Never claim broker auto-DLQ routing -- Staff enforces precise language.',
    wrong: 'Accept the phrase as shorthand for Spring defaults.',
    followUp: 'What doc section must exist before production approval?',
  },
  {
    id: 'p18',
    level: 'Staff',
    question: 'Compare skip, DLT, and retry-topic for a non-idempotent email side effect.',
    expected:
      'Skip loses audit; DLT parks for manual decision; retry may duplicate emails. Prefer idempotent provider keys or outbox; if must DLT, replay only with dedupe token.',
    whyAsked: 'Side effects complicate DLQ.',
    wrong: 'DLT always makes side effects safe.',
    followUp: 'How do you design the email Idempotency-Key?',
  },
  {
    id: 'p19',
    level: 'Staff',
    question: 'DLT publish succeeds in Kafka txn, DB settlement still pending -- narrative?',
    expected:
      'Broker txn does not settle money. Crash after Kafka commit before DB leaves a DLT or main redelivery depending on design; inbox must make redelivery safe. Never equate DLT success with payment success.',
    whyAsked: 'Keeps EOS vs Postgres sharp.',
    wrong: 'If DLT txn commits, payment is durably done.',
    followUp: 'Where should settlement state live relative to DLT?',
  },
  {
    id: 'p20',
    level: 'Staff',
    question: 'How would you capacity-test DLT under poison storms?',
    expected:
      'Inject incompatible payloads at rate; verify partition unblocks, DLT ingest keeps up, alerts fire, and main SLO holds for healthy keys. Include DLT ACL deny chaos.',
    whyAsked: 'Staff insists on chaos for DLT unavailable paths.',
    wrong: 'Unit-test recoverer only; skip load.',
    followUp: 'What is the success criterion when DLT is intentionally down?',
  },
  {
    id: 'p21',
    level: 'Staff',
    question: 'Govern payload mutation on replay.',
    expected:
      'Default immutable replay; allow edited payload only with dual control, stored before/after, and reason codes. Prefer code/schema fix + original bytes when possible.',
    whyAsked: 'Payments and audit realities.',
    wrong: 'Let on-call edit JSON freely in the DLT UI.',
    followUp: 'How do you version the mutated replay event_id?',
  },
  {
    id: 'p22',
    level: 'Staff',
    question: 'Team wants consumer DLQ for producer serialization failures -- response?',
    expected:
      'Refuse. Serialization failures never create a consumer record. Fail the API, fix schema, use outbox for durable intent. Consumer DLQ is the wrong plane.',
    whyAsked: 'Must-have producer vs consumer DLQ distinction at Staff.',
    wrong: 'Create a "producer DLQ topic" that consumers treat as source of truth for money.',
    followUp: 'What telemetry should producers emit instead?',
  },
  {
    id: 'p23',
    level: 'Staff',
    question: 'Align Spring Kafka 3.x defaults with org standards.',
    expected:
      'Override FixedBackOff, require recoverer bean, set notRetryable set, document AfterRollback for transactional listeners, ban @RetryableTopic on batch, and IaC DLT partitions >= source.',
    whyAsked: 'Staff standardizes Spring Kafka 3.x safely.',
    wrong: 'Ship framework defaults unchanged to prod payments.',
    followUp: 'Which default attempt count do you disallow and why?',
  },
  {
    id: 'p24',
    level: 'Staff',
    question: 'Cross-region read of another region DLT for analytics -- risks?',
    expected:
      'PII egress, stale poison, and accidental replay tooling pointed at wrong cluster. Isolate analytics copies; block produce ACLs from analytics principals.',
    whyAsked: 'Multi-region data governance.',
    wrong: 'Give analysts WRITE to all DLT topics for convenience.',
    followUp: 'How do you tag records with region of failure?',
  },
  {
    id: 'p25',
    level: 'Staff',
    question: 'Decide retention for payment DLTs.',
    expected:
      'Long enough for investigation and regulated replay windows, short enough for cost/PII. Often compacting is wrong for DLT; use time/size retention plus cold archive of indexed rows.',
    whyAsked: 'Operational Staff detail.',
    wrong: 'Infinite retention on the hot cluster for all DLTs.',
    followUp: 'What must be archived before retention delete?',
  },
  {
    id: 'p26',
    level: 'Staff',
    question: 'How do you explain offset races to an EM in two minutes?',
    expected:
      'Three gaps: DLT ok/commit fail (dup DLT); commit ok/DLT fail (lost trail if misconfigured); DB ok/offset fail (dup business work). Mitigations: correct handler, idempotent inbox, alerts.',
    whyAsked: 'Staff communication of offset reality.',
    wrong: 'Tell them Kafka EOS removed all races.',
    followUp: 'Which gap is Sev1 for payments and why?',
  },
  {
    id: 'p27',
    level: 'Staff',
    question: 'Integrate circuit breakers with DLT classification.',
    expected:
      'When breaker open, fail fast with a typed exception: either short retry/pause or DLT with "dependency_open" after budget -- do not thrash. Close breaker before auto-replay.',
    whyAsked: 'Connects resilience and DLQ.',
    wrong: 'Ignore breaker; let DefaultErrorHandler hammer forever.',
    followUp: 'Do you DLT or pause on breaker open for payments?',
  },
  {
    id: 'p28',
    level: 'Staff',
    question: 'What belongs in a Staff architecture decision record for DLQ?',
    expected:
      'Failure taxonomy, Spring handler choice, DLT naming/partitions, idempotency model, replay RBAC, multi-region fencing, and explicit non-goals (no broker auto-DLQ, no producer-via-consumer-DLQ).',
    whyAsked: 'Documentation bar for Principal-ready work.',
    wrong: 'Only list topic names.',
    followUp: 'Which non-goal prevents the most production incidents?',
  },
  {
    id: 'p29',
    level: 'Staff',
    question: 'Evaluate "process DLT with the same listener as main".',
    expected:
      'Dangerous: can re-enter failure loops and blur terminal vs active traffic. Prefer dedicated replay to main/retry with headers and separate consumer for indexing only.',
    whyAsked: 'Topology hygiene.',
    wrong: 'Subscribe the payment listener to both main and DLT for simplicity.',
    followUp: 'When is a dedicated "reprocess" topic better than DLT replay to main?',
  },
  {
    id: 'p30',
    level: 'Staff',
    question: 'Principal-level one-pager: what must every Kafka consumer team prove?',
    expected:
      'No reliance on broker auto-DLQ; distinct handling for producer vs processing vs DLT-publish failures; idempotent DB story; tested DLT-down behavior; safe replay runbook for payments.',
    whyAsked: 'Closes Staff bank with a bar teams can be measured on.',
    wrong: 'Prove only that a *-dlt topic exists.',
    followUp: 'What demo would you require in a readiness review?',
  },
];

/** Scenario prompts: incident and design drills. */
export const SCENARIO_Q: StaffQ[] = [
  {
    id: 'x01',
    level: 'Scenario',
    question: 'Lag frozen on one partition; logs show same NPE forever; no DLT topic exists. What do you do in the first hour?',
    expected:
      'Confirm poison offset, ship recoverer + DLT IaC or temporary quarantine recoverer, classify NPE as non-retryable, drain lag, then fix code and plan replay.',
    whyAsked: 'Classic stuck-partition scenario.',
    wrong: 'Restart pods repeatedly hoping Kafka auto-DLQs.',
    followUp: 'How do you avoid losing the poison payload during the hotfix?',
  },
  {
    id: 'x02',
    level: 'Scenario',
    question: 'DLT ACL deny starts at 02:00; payments lag climbs. Narrate correct vs wrong mitigation.',
    expected:
      'Correct: page, restore ACL, keep non-commit on recoverer failure. Wrong: skip offsets to clear lag. Prove with recoverer failure metrics and stuck seeks.',
    whyAsked: 'DLT unavailable under money traffic.',
    wrong: 'Commit and drop to save the SLA chart.',
    followUp: 'What customer communication is honest here?',
  },
  {
    id: 'x03',
    level: 'Scenario',
    question: 'Crash dump shows DLT produce succeeded, process died before commit. Finance sees duplicate DLT rows. Explain.',
    expected:
      'At-least-once gap after recoverer success. Deduplicate index by original offset; source reprocessed; not a broker bug. Consider commitRecovered for Kafka-txn pipelines.',
    whyAsked: 'Must-have crash-after-DLT scenario.',
    wrong: 'Blame Kafka for not rolling back DLT automatically without a txn.',
    followUp: 'Would Postgres inbox see duplicates too?',
  },
  {
    id: 'x04',
    level: 'Scenario',
    question: 'DB ledger committed; offset commit timed out; same payment charged twice at bank. Root cause shape?',
    expected:
      'Redelivery after DB success without idempotent bank key/inbox. Fix UNIQUE event_id and bank Idempotency-Key; teach DB-commit-then-offset-fail gap.',
    whyAsked: 'Must-have DB then offset fail scenario.',
    wrong: 'Enable Kafka EOS and declare the incident impossible next time.',
    followUp: 'How do you reconcile the duplicate bank capture?',
  },
  {
    id: 'x05',
    level: 'Scenario',
    question: 'Events B then C same key; B DLT-parked; C marks payment COMPLETE. Product asks why.',
    expected:
      'Partition advanced past B; C applied. Global business order for that key broke. Options: block on key, saga checks, or accept park+repair before C-type transitions.',
    whyAsked: 'Must-have B->DLT C succeeds ordering scenario.',
    wrong: 'Tell them Kafka guarantees B before C side effects forever even after DLT.',
    followUp: 'Design a state machine guard that rejects C if B missing.',
  },
  {
    id: 'x06',
    level: 'Scenario',
    question: 'Ops wants to replay 50k DLT payment messages after a bugfix. Guardrails?',
    expected:
      'Sample first, filter by exception class, rate-limit, stable event_ids, dual control, stop on error budget, watch bank idempotency rejects, quarantine max-replay.',
    whyAsked: 'Safe payment DLT replay at scale.',
    wrong: 'Firehose all DLT to main at max producer throughput.',
    followUp: 'What metric aborts the bulk replay?',
  },
  {
    id: 'x07',
    level: 'Scenario',
    question: 'Producer API returns 500 on serialize; engineer adds consumer DLT "just in case". Critique.',
    expected:
      'Wrong plane. Nothing to consume. Fix schema validation at produce; outbox if durability needed. Consumer DLT never runs for that failure.',
    whyAsked: 'Producer failures cannot go to consumer DLQ -- scenario form.',
    wrong: 'Approve the DLT because more DLQs feel safer.',
    followUp: 'Rewrite their design in producer terms.',
  },
  {
    id: 'x08',
    level: 'Scenario',
    question: 'Transactional listener + DefaultErrorHandler configured; behavior looks "weird". Diagnose.',
    expected:
      'Transactional containers favor rollback processor paths; ErrorHandler may not run as assumed. Align with DefaultAfterRollbackProcessor and DeadLetterPublishingRecoverer + commitRecovered as needed.',
    whyAsked: 'Spring Kafka 3.x transactional scenario.',
    wrong: 'Assume DEH always wraps every container identically.',
    followUp: 'How do you verify which recoverer ran in logs?',
  },
  {
    id: 'x09',
    level: 'Scenario',
    question: 'Batch listener of 500; one poison JSON; 499 valid. Desired Staff outcome?',
    expected:
      'Poison to DLT (or per-record retry path); valid records processed or cleanly retried without silent loss; no @RetryableTopic on batch. Prove with offsets and DLT contents.',
    whyAsked: 'Batch deser/poison scenario.',
    wrong: 'Fail and infinite-seek the entire batch forever without progress.',
    followUp: 'Show how ErrorHandlingDeserializer changes the batch picture.',
  },
  {
    id: 'x10',
    level: 'Scenario',
    question: 'Rebalance every few minutes during incident; backoff is 3 minutes. Correlate.',
    expected:
      'Blocking retry exceeds max.poll.interval; member dropped. Shorten backoff, raise interval carefully, or move to @RetryableTopic non-blocking delays.',
    whyAsked: 'Rebalance + retry scenario.',
    wrong: 'Disable heartbeats to stop rebalances.',
    followUp: 'What evidence in group coordinator logs confirms this?',
  },
  {
    id: 'x11',
    level: 'Scenario',
    question: 'Multi-region active-active both DLT the same event_id. Next steps?',
    expected:
      'Stop dual consume, fence region, merge DLT indexes by event_id, replay once against shared inbox, add region sticky routing or global idempotency.',
    whyAsked: 'Multi-region duplicate DLT scenario.',
    wrong: 'Replay both regions fully to "catch up".',
    followUp: 'How do you pick the winning region payload?',
  },
  {
    id: 'x12',
    level: 'Scenario',
    question: 'Service A DLT parks; Service B already settled. Saga repair?',
    expected:
      'Compensate or complete A via controlled replay with saga id; do not blindly replay A if B side effects forbid it. Use state store keyed by saga id across services.',
    whyAsked: 'Multi-service DLQ scenario.',
    wrong: 'Replay A DLT without checking B.',
    followUp: 'Who owns the saga state authority?',
  },
  {
    id: 'x13',
    level: 'Scenario',
    question: 'Interview whiteboard: "Why no broker DLQ?" Give the 60-second answer.',
    expected:
      'Broker lacks business classification, retry policy, and commit rules. DLQ is consumer/application policy on top of topics. Spring recoverer is optional machinery, not broker magic.',
    whyAsked: 'Must-have why no broker DLQ in scenario/interview form.',
    wrong: 'Because Kafka is incomplete; other brokers have real DLQs built-in as the only model.',
    followUp: 'Contrast with JMS broker DLQ concepts carefully.',
  },
  {
    id: 'x14',
    level: 'Scenario',
    question: 'Does enable.idempotence + transactional consumer mean PG+Kafka exactly once in this outage review?',
    expected:
      'No. Explain broker-only atomicity; require inbox/outbox evidence. Incident writeup must not claim EOS across Postgres.',
    whyAsked: 'Must-have EOS vs PG in scenario language.',
    wrong: 'Close the incident as "EOS configured, cannot recur".',
    followUp: 'List the dual-write gaps still open.',
  },
  {
    id: 'x15',
    level: 'Scenario',
    question: 'DLT topic has 3 partitions; source has 12; same-partition resolver. Symptom?',
    expected:
      'Recoverer fails for partitions >=3; those source partitions stick. Expand DLT partitions or change resolver; then drain.',
    whyAsked: 'Concrete Spring DLT topology failure.',
    wrong: 'Kafka maps 12 to 3 automatically for DLT.',
    followUp: 'How do you migrate DLT partition count safely?',
  },
  {
    id: 'x16',
    level: 'Scenario',
    question: 'Nightly job replays DLT into main; poison returns; loop fills disk. Stop-gap and fix?',
    expected:
      'Stop job; enforce replay-count and quarantine; fix classifier/code; require human approval for that exception class.',
    whyAsked: 'Replay loop scenario.',
    wrong: 'Increase DLT retention and keep the job running.',
    followUp: 'What header proves a record is a replay?',
  },
  {
    id: 'x17',
    level: 'Scenario',
    question: 'Manual AckMode; engineer acks in finally{}; DLT sometimes missing. Explain.',
    expected:
      'Ack ran even when recoverer failed or before publish completed. Align ack with error handler success only.',
    whyAsked: 'Offset/ack footgun scenario.',
    wrong: 'Kafka drops DLT randomly.',
    followUp: 'How do you test ack ordering in integration tests?',
  },
  {
    id: 'x18',
    level: 'Scenario',
    question: 'Schema compatible in Registry but field semantic change breaks business validation -- DLQ or retry?',
    expected:
      'Not a deser poison; business validation may DLT as non-retryable after optional short retry if dependency-like. Coordinate producer contract; replay after consumer understand new semantics.',
    whyAsked: 'Semantic vs deser failure scenario.',
    wrong: 'Treat as serdes failure only.',
    followUp: 'How do you version business validators?',
  },
  {
    id: 'x19',
    level: 'Scenario',
    question: 'Chaos: kill DLT brokers mid-recoverer under load. Expected observable?',
    expected:
      'Recoverer errors, source seeks stuck, lag up, DLT publish failure alerts. Healthy keys on other partitions may proceed if not blocked by shared thread starvation.',
    whyAsked: 'Chaos for DLT unavailable.',
    wrong: 'Offsets skip because chaos tools reset them.',
    followUp: 'What pass criteria reopen traffic?',
  },
  {
    id: 'x20',
    level: 'Scenario',
    question: 'Principal asks for a single "platform DLQ" microservice consuming all *-dlt. Pros/cons?',
    expected:
      'Pros: shared indexing/RBAC. Cons: blast radius, schema coupling, replay temptation. Prefer thin indexer plus per-domain replay with strict ACLs.',
    whyAsked: 'Platform design scenario.',
    wrong: 'Approve one writer that can produce to all main topics.',
    followUp: 'Where does payment replay authorization live?',
  },
  {
    id: 'x21',
    level: 'Scenario',
    question: 'Consumer processes record, produces to outbound topic, then fails before offset commit. No DLT involved yet. Risks?',
    expected:
      'Duplicate outbound on redelivery unless outbound idempotent or transactional with sendOffsetsToTransaction. Distinguish from DLT path; still not Postgres EOS.',
    whyAsked: 'Producer side-effect vs DLT confusion scenario.',
    wrong: 'Say consumer DLQ will dedupe the outbound topic.',
    followUp: 'When do you add DLT vs fix transactional produce?',
  },
  {
    id: 'x22',
    level: 'Scenario',
    question: 'Hadron cashline payment stuck in DLT with ValidationException. Safe replay checklist?',
    expected:
      'Confirm code/config fix deployed, event_id present, bank idempotency ready, replay-count under max, dual control, publish to original topic with key preserved, watch inbox hits.',
    whyAsked: 'Payments-named safe replay scenario.',
    wrong: 'Edit amount upward in DLT UI and replay.',
    followUp: 'What proves the ValidationException is truly gone?',
  },
  {
    id: 'x23',
    level: 'Scenario',
    question: 'Two Spring services share a group id by mistake; DLT headers look inconsistent. What happened?',
    expected:
      'Split processing across apps; recoverer configs differ; offsets race. Split group ids; never share groups across different listener apps.',
    whyAsked: 'Multi-service misconfig scenario.',
    wrong: 'Kafka merges DLTs per group automatically.',
    followUp: 'How do you detect shared groups in inventory?',
  },
  {
    id: 'x24',
    level: 'Scenario',
    question: 'read_committed downstream reads DLT while recoverer uses transactions -- timing surprise?',
    expected:
      'DLT records appear only after txn commit. Crash before commit means downstream never saw DLT row; source may retry. Teach isolation, not "missing DLT bugs".',
    whyAsked: 'EOS read visibility scenario.',
    wrong: 'Assume uncommitted DLT is visible to all consumers.',
    followUp: 'What isolation does the DLT indexer use?',
  },
  {
    id: 'x25',
    level: 'Scenario',
    question: 'On-call proposes auto.offset.reset=latest to clear poison. Your Staff response?',
    expected:
      'Reject for prod money topics: data loss. Use DLT/quarantine and deliberate skip only with audited recoverer. reset is for empty new groups, not incidents.',
    whyAsked: 'Dangerous offset scenario.',
    wrong: 'Approve latest reset for speed.',
    followUp: 'When is offset reset ever acceptable?',
  },
  {
    id: 'x26',
    level: 'Scenario',
    question: 'Multi-region DR drill: replay DLT from region US into EU main. What must be true?',
    expected:
      'EU inbox must see same event_ids; fencing so US is not also live; headers carry region; RBAC allows cross-region produce only during drill; abort on duplicate settle signals.',
    whyAsked: 'Multi-region replay drill.',
    wrong: 'Replay freely because DR means all controls off.',
    followUp: 'How do you reverse the drill safely?',
  },
  {
    id: 'x27',
    level: 'Scenario',
    question: 'DeadLetterPublishingRecoverer custom resolver returns null destination. Effect?',
    expected:
      'Recoverer cannot publish; treated as recovery failure; record remains for retry/seeks. Fix resolver; do not silently drop.',
    whyAsked: 'Spring recoverer edge scenario.',
    wrong: 'Null means skip successfully.',
    followUp: 'When would you intentionally recover with a no-op -- and how do you ack?',
  },
  {
    id: 'x28',
    level: 'Scenario',
    question: 'Payment API outbox relay fails to produce for an hour; consumer DLT empty. Is that good?',
    expected:
      'Expected: producer/outbox plane, not consumer DLQ. Monitor outbox lag and relay errors. Empty consumer DLT does not mean produce path is healthy.',
    whyAsked: 'Plane separation under incident confusion.',
    wrong: 'Page consumer DLQ owners for outbox lag.',
    followUp: 'What dashboard proves outbox freshness?',
  },
  {
    id: 'x29',
    level: 'Scenario',
    question: 'Whiteboard sequence: listener fail -> retry -> DLT -> crash -> redelivery. Label each commit point.',
    expected:
      'Mark attempts without commit; DLT publish; crash before offset commit; redelivery; possible second DLT; commit after successful recovery. Emphasize at-least-once.',
    whyAsked: 'Integrates offset + DLT crash teaching.',
    wrong: 'Draw a single atomic broker DLQ move.',
    followUp: 'Add a Postgres inbox commit to the diagram.',
  },
  {
    id: 'x30',
    level: 'Scenario',
    question: 'Readiness review: team says "Kafka EOS so PG+Kafka exactly once; broker DLQ enabled; producer failures go to consumer DLQ." Pass or fail?',
    expected:
      'Fail. Correct all three myths: no broker auto-DLQ, EOS != PG exactly-once, producer failures are not consumer DLQ. Demand rewritten ADR and tests for DLT-down and idempotent settle.',
    whyAsked: 'Capstone scenario bundling must-have myths.',
    wrong: 'Conditional pass if topics exist.',
    followUp: 'What three demos flip this to pass?',
  },
];

export const ALL_STAFF_Q: StaffQ[] = [...BASIC_Q, ...SENIOR_Q, ...STAFF_Q, ...SCENARIO_Q];
