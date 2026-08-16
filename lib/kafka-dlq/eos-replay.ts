/** Kafka EOS vs PostgreSQL, idempotency, replay loops, envelope, schema evolution. */

export const EOS_VS_DB = `Kafka EOS (transactions + read_committed):
  Atomic across: consume offsets + Kafka produces (including DLT) inside one txn.
  NOT atomic with: PostgreSQL, REST calls, bank APIs.

Dual-write gaps:
  1) DB commit OK, Kafka offset commit fails → redelivery → must be idempotent
  2) Kafka commit OK, DB commit fails → lost business write unless outbox/inbox
  3) DB commit OK, consumer crash before offset commit → same as (1)

Patterns:
  • Inbox / processed_events UNIQUE(event_id) in SAME SQL TX as business mutate
  • Transactional outbox for produce-after-DB
  • CDC from outbox when relay preferred
  • Never claim “exactly-once payment” from enable.idempotence alone`;

export const IDEMPOTENCY_SQL = `CREATE TABLE processed_events (
  event_id VARCHAR PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Same transaction as CashLine / payment mutate:
BEGIN;
  INSERT INTO processed_events(event_id) VALUES (:id); -- fails 23505 if dup
  -- apply business state machine
COMMIT;
-- THEN ack Kafka offset (or sendOffsetsToTransaction for Kafka-only EOS)

-- Race: two consumers both pass SELECT-then-insert without UNIQUE → double charge.
-- UNIQUE constraint is the real lock; application if (!seen) is not.`;

export const IDEMPOTENCY_BAD = `// BAD — replay / rebalance doubles money
paymentService.charge(card, amount);

// GOOD — business idempotency key
if (!inbox.tryInsert(paymentId)) return; // already processed
bank.charge(Idempotency-Key: paymentId, ...);
ledger.write(...); // same TX as inbox when possible`;

export const REPLAY_ARCH = `DLT → Replay Service → validate → authorize → idempotency → original topic

Must support:
  • one record / time range / partition / offset / eventId
  • after schema fix / after code fix
  • optional modified payload (audited)
  • replay to retry topic vs original
  • preserve original key (and prefer original partition)
  • audit trail (who/when/why/before/after)

Blind “replay entire DLT” is dangerous: old poison storms, wrong env, unpaid holds.`;

export const REPLAY_LOOPS = `DLT → replay → main → fail → DLT → ...

Prevent infinite loops:
  headers: x-original-topic, x-event-id, x-replay-count, x-replay-source, x-correlation-id
  policy: if replayCount >= MAX (e.g. 3) → quarantine topic (not main) + Sev1
  never strip original failure headers on replay
  idempotency key remains event_id (not a new UUID per replay)

Example header mutate on replay publish:
  x-replay-count = previous + 1
  x-replay-source = dlt|ops-ui|job
  x-replayed-by = user@corp
  x-replayed-at = ISO-8601`;

export const REPLAY_LOOP_CODE = `@Component
public class ReplayService {
  static final int MAX_REPLAY = 3;

  public void replayOne(DeadLetterRow row, String actor) {
    int n = Optional.ofNullable(row.replayCount()).orElse(0);
    if (n >= MAX_REPLAY) {
      quarantine.publish(row, "max-replay-exceeded");
      metrics.increment("dlq.replay.loop_blocked");
      throw new ReplayRejectedException("max replay " + MAX_REPLAY);
    }
    ProducerRecord<String, byte[]> out = new ProducerRecord<>(row.originalTopic(), row.partitionHint(), row.key(), row.payload());
    out.headers().add("x-event-id", row.eventId().getBytes(UTF_8));
    out.headers().add("x-replay-count", String.valueOf(n + 1).getBytes(UTF_8));
    out.headers().add("x-replayed-by", actor.getBytes(UTF_8));
    kafka.send(out).get(10, SECONDS);
    audit.record(actor, row, n + 1);
  }
}`;

export const ENVELOPE_JSON = `{
  "eventId": "pay-9f3c",
  "originalTopic": "payment.requested.v1",
  "originalPartition": 0,
  "originalOffset": 12345,
  "originalKey": "acct:pay-9f3c",
  "failedAt": "2026-08-16T06:40:00Z",
  "consumerGroup": "settlement-worker",
  "service": "settlement-worker",
  "environment": "prod",
  "attempt": 3,
  "exceptionType": "org.springframework.dao.QueryTimeoutException",
  "exceptionMessage": "canceling statement due to statement timeout",
  "stackTrace": "(truncated/redacted)",
  "failureCategory": "TRANSIENT_EXHAUSTED",
  "replayCount": 0,
  "correlationId": "trc-...",
  "schemaVersion": "payment.requested.v1-3"
}`;

export const ENVELOPE_NOTES = `Headers vs body envelope:
  • Spring DLT headers carry original topic/partition/offset/exception — keep them
  • Body envelope helps non-Kafka tools and long retention forensics
  • PII: mask PANs/amounts in logs and prefer encrypted-at-rest topics
  • Stack traces: redact secrets/tokens; cap size
  • Evolve envelope with schemaVersion + dual-read; never break old DLT replay consumers`;

export const SCHEMA_EVOLUTION = `Producer schema v1 → consumer expects v2:
  • Compatible (FORWARD/BACKWARD/FULL) → may process or soft-default
  • Incompatible → deser/poison → DLT (do not hot-retry forever)
  • Schema Registry down → transient; backoff; avoid DLT storm
  • DLT retained months: replay consumers must read OLD schemas (dual-read / raw bytes)
  • Strategy: store raw bytes on DLT; re-deserialize with evolved app on replay after deploy`;
