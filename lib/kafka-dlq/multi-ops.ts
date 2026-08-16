/** Multi-service ownership, multi-region, capacity, alerts, payment reconcile, final arch. */

export const MULTI_SERVICE = `orders-topic
    |
    +--> payment-service   (group payment-cg)   → payment-cg.orders.DLT
    +--> notification-svc  (group notify-cg)    → notify-cg.orders.DLT
    +--> fraud-service     (group fraud-cg)     → fraud-cg.orders.DLT

Prefer per-consumer-group (or per-service) DLT over one global orders-dlt:
  • Ownership: who may replay? who is paged?
  • ACL: payment team WRITE/READ only their DLT
  • Failure modes differ (bank vs SMTP vs ML model)
  • Noisy neighbor: fraud poison should not fill payment DLT
  • Retention / capacity charged to the owning service

Shared global DLT only for platform quarantine with strict RBAC — not default.`;

export const MULTI_REGION = `MirrorMaker 2 / Cluster Linking:
  • DLT topics can be replicated to DR — plan retention + ACL in both regions
  • Offsets are NOT portable across clusters — do not assume same offset numbers
  • Active-active: duplicate delivery risk → global idempotency keys
  • Failover replay: replay in the region that owns the consumer group
  • Region-specific DLT names (…dlt.us-east) reduce accidental cross-region replay
  • Runbook: freeze producers → drain → promote → rebuild consumer offsets carefully
  • Never “just replay DR DLT into prod main” without idempotency + audit`;

export const CAPACITY_MATH = `Example:
  1_000_000 failed events/day
  2 KB / event
  7 days retention
  RF = 3

  Logical bytes ≈ 1e6 * 2KB * 7 = 14e9 bytes ≈ 14 GB
  Cluster storage ≈ 14 GB * RF = 42 GB (plus indexes/overhead ~20–30%)

Also plan:
  retention.ms / retention.bytes, segment.bytes, disk headroom,
  cleanup.policy=delete (compaction is usually wrong for DLT payloads),
  backlog SLO: oldest DLT age, DLT produce rate, consumer lag on retry topics.`;

export const OBS_METRICS = [
  'dlq.messages.total / rate',
  'dlq.oldest.age',
  'dlq.replay.total / dlq.replay.failure / dlq.replay.loop_blocked',
  'kafka.consumer.lag (main + retry + dlt sinks)',
  'kafka.retry.count / retry.topic.lag',
  'kafka.dlt.publish.failure (recoverer) — Sev1',
  'kafka.rebalance.count',
  'kafka.deserialization.failure',
  'inbox.duplicate / processed_events.conflict',
];

export const OBS_LOG_FIELDS =
  'eventId, topic, partition, offset, consumerGroup, attempt, exceptionType, correlationId, replayCount, failureCategory';

export const OBS_TRACE = `Producer → Kafka → Consumer → Retry hop → DLT publish → Replay Service → main
Propagate W3C/OpenTelemetry traceparent in headers; on DLT add link back to failing consumer span.
DLT count alone is not enough — pair with oldest age, recoverer failures, and retry lag.`;

export const ALERTS: string[][] = [
  ['Sudden DLT spike', 'Sev2', 'Deploy bug / dependency outage — classify poison vs transient'],
  ['DLT publish failure', 'Sev1', 'Partition stall + loss risk if misconfigured commit'],
  ['Retry storm', 'Sev2', 'CB open / pause / shed'],
  ['Poison storm', 'Sev2', 'Schema break — stop retries, page owners'],
  ['Oldest DLT age SLO', 'Sev2', 'Ops backlog / understaffed replay'],
  ['Consumer lag main/retry', 'Sev2', 'Saturation'],
  ['DLT disk / retention', 'Sev2', 'Capacity'],
  ['Replay failure / loop block', 'Sev2', 'Bad replay or max exceeded'],
  ['Schema / deser failures', 'Sev2', 'Compat break'],
  ['ACL failures', 'Sev1', 'Security misconfig'],
  ['Rebalance storm', 'Sev2', 'max.poll / session / deploy'],
];

export const PAYMENT_RECONCILE = `PaymentRequested → Payment Service → Bank API

Timeout / unknown outcome ≠ safe to retry charge:
  Bank may have accepted while response was lost.
  Consumer crash AFTER bank accept + BEFORE offset commit → redelivery.

Design:
  paymentId + idempotencyKey (to bank)
  state machine: REQUESTED → AUTHORIZED → SETTLED | FAILED | NEEDS_RECONCILE
  outbox for Kafka emits; inbox for consumes
  DLT for poison / permanent / exhausted
  reconciliation job queries bank by paymentId before settle/replay

DLT replay must NOT blindly call the bank again:
  1) load state
  2) if AUTHORIZED/SETTLED → skip charge; maybe emit result only
  3) if NEEDS_RECONCILE → inquire bank
  4) if REQUESTED → charge with same Idempotency-Key
  5) audit every replay`;

export const PAYMENT_CODE = `public void replayPayment(DeadLetterRow row) {
  Payment p = payments.require(row.eventId());
  switch (p.status()) {
    case SETTLED, AUTHORIZED -> { metrics.dup(); return; }
    case NEEDS_RECONCILE -> bank.inquire(p.paymentId()).ifPresent(this::applyBankState);
    case REQUESTED, FAILED_RETRYABLE -> bank.charge(p.paymentId(), p.amount(), p.idempotencyKey());
    default -> quarantine(row, "unsafe-replay-state=" + p.status());
  }
}`;

export const FINAL_ARCH = `                         +----------------+
                         |    Producer    |
                         | idempotent+outbox
                         +-------+--------+
                                 |
                                 v
                       +-------------------+
                       |   Main Topic      |
                       +---------+---------+
                                 |
                                 v
                       +-------------------+
                       | Consumer Service  |
                       | inbox UNIQUE + SM |
                       +---------+---------+
                                 |
                       +---------+---------+
                       | Failure Classifier|
                       +---------+---------+
             +---------+---------+---------+
             |                   |         |
          SUCCESS            TRANSIENT  PERMANENT/POISON
             |                   |         |
          Commit            Retry hops    DLT (+ DB row)
                                 |
                          Retry consumer
                                 |
                                DLT

                       +----------------+
                       | Replay Service |
                       | RBAC + audit   |
                       | replayCount    |
                       +-------+--------+
                               |
                        Idempotency + reconcile
                               |
                         Original topic

Cross-cutting: PostgreSQL inbox/outbox, Schema Registry, OTel, metrics, alerts, RBAC, DR.`;

export const FINAL_RECOMMENDATION = `For a high-volume financial system today I would ship:

1) Consumer: DefaultErrorHandler + DeadLetterPublishingRecoverer for poison/permanent;
   manual or @RetryableTopic hops (5s/30s/5m) for transient — NOT hour-long thread sleeps.
2) Ordering: same business key on main/retry/DLT; parking/hold when lifecycle order matters
   (do not let Shipped commit while Paid is in DLT).
3) No loss: never commit source before successful DLT publish; on recoverer failure seek+alert Sev1.
4) No dup side effects: UNIQUE(event_id) / payment idempotencyKey in the same DB transaction as mutate;
   Kafka EOS for Kafka hops only — not a substitute for inbox.
5) Safe replay: dedicated Replay Service with RBAC, audit, replayCount cap, and payment reconcile
   before any bank call; quarantine on loop.
6) Ops: per-service DLT (not one global), retention/capacity math, metrics beyond count,
   ErrorHandlingDeserializer, batch only with BatchListenerFailedException.
7) Multi-region: replicate DLT intentionally; global idempotency; never assume offset equality.`;

export const CHEAT_SHEET: [string, string][] = [
  ['Kafka DLQ?', 'App/Spring pattern — not a broker feature'],
  ['Producer fail', 'Retries/outbox — not consumer DLT'],
  ['DLT then commit', 'Safe-ish; crash → dup DLT'],
  ['Commit then DLT', 'Loss risk — never'],
  ['DLT publish fail', 'Seek + alert; do not commit'],
  ['EOS + Postgres', 'Need inbox/outbox'],
  ['Ordering + DLT skip', 'May corrupt workflows — park'],
  ['Payment timeout', 'Reconcile — not blind retry'],
  ['Replay', 'Audit + replayCount + idempotency'],
  ['Batch', 'BatchListenerFailedException; no @RetryableTopic'],
];
