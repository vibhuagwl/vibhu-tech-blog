import type {DlqCornerCase} from './corner-types';

export const CORNER_CASES_A: DlqCornerCase[] = [
  {
    id: 'poison-json',
    family: 'Poison',
    title: 'Malformed JSON / poison payload',
    whatHappens: 'Consumer cannot deserialize `{not-json`. The message will never succeed with this payload and current code.',
    symptom: 'Deserialize throws; partition would stall if you seek-to-current forever.',
    classify: 'DLQ_NOW',
    retry: 'No — time cannot fix JSON.',
    dlq: 'Immediate: persist dead_letter_messages + cashline-events-dlq, then commit offset.',
    holdCashLine: true,
    idempotency: 'event_id may be missing; use topic+partition+offset uniqueness as fallback.',
    detection: 'JsonProcessingException / PoisonMessageException',
    recovery: 'Ops corrects payload or drops; replay through Kafka.',
    fallback: 'Do not skip silently — you would lose a money event.',
    alert: 'cashline.dlq + poison reason spike (often a bad deploy or producer bug).',
    lab: 'POST /api/lab/scenario/poison',
    mermaid: `flowchart TD
  M["{not-json"] --> D[deserialize]
  D --> P[PoisonMessageException]
  P --> DLQ[DLQ now]
  DLQ --> Hold[block later seq for that key]`,
    code: `} catch (JsonProcessingException e) {
  throw new PoisonMessageException("Malformed CashLine JSON", e);
}
// FailurePipeline: poisonOrPermanent → routeDlq, skip retry-1/2/3`,
    interview: 'Poison is data/code that will never succeed. Park immediately. Zero retry strikes.',
    trap: 'Treating poison like a timeout and retrying 1000 times.',
  },
  {
    id: 'serde-enum',
    family: 'Poison',
    title: 'Unknown enum / schema mismatch',
    whatHappens: 'Producer sends eventType=CASHLINE_REVERSED before Hadron knows the enum. Jackson fails or validator rejects.',
    symptom: 'SerializationException or InvalidCashLineException on every attempt.',
    classify: 'DLQ_NOW',
    retry: 'No until consumer is upgraded.',
    dlq: 'Yes now. Replay after deploy.',
    holdCashLine: true,
    idempotency: 'Same event_id after upgrade must apply once.',
    detection: 'Serde / unknown enum / schema registry error',
    recovery: 'Deploy compatible consumer, then replay. Ignore unknown JSON fields; fail closed on unknown enums.',
    fallback: 'Never default unknown type to DRAWDOWN.',
    alert: 'DLQ with exception SerializationException clustered after a producer release.',
    lab: 'POST /api/lab/scenario/unknown-enum',
    mermaid: `flowchart LR
  Prod[New enum] --> Cons[Old consumer]
  Cons --> DLQ
  DLQ --> Upgrade[deploy]
  Upgrade --> Replay`,
    code: `classifier.classify(new SerializationException("schema")) == DLQ_IMMEDIATE;
// Jackson: FAIL_ON_UNKNOWN_PROPERTIES=false; unknown enum still fails`,
    interview: 'Forward-compatible fields vs fail-closed enums. Replay is the migration tool.',
    trap: 'Mapping unknown enum to a default money type.',
  },
  {
    id: 'npe',
    family: 'Poison',
    title: 'NullPointerException / programmer bug',
    whatHappens: 'A null field the code assumed present. Retrying burns CPU and hides the bug.',
    symptom: 'NPE in logs; same stack every poll.',
    classify: 'DLQ_NOW',
    retry: 'No — code will throw again.',
    dlq: 'Immediate so the partition moves; fix code; replay.',
    holdCashLine: true,
    idempotency: 'After fix, UNIQUE(event_id) still protects double apply.',
    detection: 'ExceptionClassifier maps NPE → DLQ_IMMEDIATE',
    recovery: 'Patch null-safety, deploy, replay parked events.',
    fallback: 'Do not swallow NPE as retry.',
    alert: 'DLQ + NPE class name — page the owning team, not the database.',
    lab: 'POST /api/lab/scenario/npe',
    mermaid: `flowchart TD
  E[event] --> NPE[NullPointerException]
  NPE --> C[classifier]
  C --> DLQ[DLQ now not retry]`,
    code: `if (t instanceof NullPointerException) return RetryDecision.DLQ_IMMEDIATE;`,
    interview: 'NPE is poison of the code, not of the network. Classifier must not default it to RETRY.',
    trap: 'Default retry for all RuntimeException.',
  },
  {
    id: 'invalid-amount',
    family: 'Business',
    title: 'Invalid amount / currency / account',
    whatHappens: 'Amount ≤ 0, unknown currency, or unknown account. Human or producer must correct data.',
    symptom: 'Validator throws InvalidCashLineException; CashLine never created.',
    classify: 'DLQ_NOW',
    retry: 'No — payload is wrong.',
    dlq: 'Yes. Correct via POST /api/dlq/{id}/correct then replay.',
    holdCashLine: true,
    idempotency: 'event_id stays stable across correction so replay is the same business event.',
    detection: 'CashLineValidator amount/currency/account checks',
    recovery: 'Ops patches payload; READY_FOR_REPLAY; produce to cashline-events.',
    fallback: 'Do not clamp negatives to zero.',
    alert: 'Business DLQ rate — often a producer mapping bug.',
    lab: 'POST /api/lab/scenario/invalid-amount',
    mermaid: `flowchart TD
  Amt["amount=-10"] --> V[validator]
  V --> DLQ
  DLQ --> Correct[POST /correct]
  Correct --> Replay[POST /replay]
  Replay --> OK[cash_lines]`,
    code: `if (event.amount() == null || event.amount().compareTo(BigDecimal.ZERO) <= 0)
  throw new InvalidCashLineException("Invalid amount");`,
    interview: 'Business errors need humans. DLQ is the ticket, not a retry delay.',
    trap: 'Retrying invalid amount hoping Neptune fixes itself without a new event.',
  },
  {
    id: 'unknown-participant',
    family: 'Business',
    title: 'Unknown participant / missing master data',
    whatHappens: 'Reference data not loaded yet. Might be transient (cache/DB lag) or permanent (bad id).',
    symptom: 'Validation fail or forced UNKNOWN_PARTICIPANT.',
    classify: 'RETRY',
    retry: 'Yes briefly — wait for master data.',
    dlq: 'If still unknown after cap → DLQ and load reference data, then replay.',
    holdCashLine: true,
    idempotency: 'Do not insert a ghost CashLine.',
    detection: 'participant not in allow-list; or TransientTechnicalException waiting for master data',
    recovery: 'Load participant; replay. If id is truly invalid, treat as business DLQ.',
    fallback: 'Cap retries so a typo does not retry forever.',
    alert: 'Retry storm on unknown participant after a static-data outage.',
    lab: 'POST /api/lab/scenario/unknown-participant',
    mermaid: `flowchart TD
  P[unknown P-X] --> R[retry-1/2/3]
  R --> M[master data arrives?]
  M -->|yes| OK
  M -->|no| DLQ`,
    code: `case "UNKNOWN_PARTICIPANT" ->
  throw new TransientTechnicalException("Unknown participant reference, waiting for master data");`,
    interview: 'Unknown FK is the classic “retry then DLQ”. Time might fix cache; data typos need DLQ.',
    trap: 'DLQ immediately on the first cache miss of a new participant.',
  },
  {
    id: 'db-timeout',
    family: 'Transient',
    title: 'Database timeout',
    whatHappens: 'Hadron DB is slow. The event is good; the dependency is not.',
    symptom: 'QueryTimeoutException / TransactionTimedOutException.',
    classify: 'RETRY',
    retry: 'retry-1/2/3 with 5s/30s/5m (lab: short delays). Never sleep on the listener.',
    dlq: 'Only after maxAttempts so someone pages the database.',
    holdCashLine: false,
    idempotency: 'If the write actually committed before timeout, UNIQUE(event_id) on redelivery.',
    detection: 'ExceptionClassifier: QueryTimeoutException → RETRY',
    recovery: 'Backoff; if exhausted, DLQ with retryCount≥3; DBA + replay.',
    fallback: 'Do not block max.poll.interval.',
    alert: 'Retry up + DLQ flat = dependency. Then DLQ up = exhausted.',
    lab: 'POST /api/lab/scenario/timeout',
    mermaid: `flowchart LR
  C[consumer] --> TO[DB timeout]
  TO --> R1[retry-1]
  R1 --> R2[retry-2]
  R2 --> R3[retry-3]
  R3 --> DLQ`,
    code: `if (t instanceof QueryTimeoutException || t instanceof TransactionTimedOutException)
  return RetryDecision.RETRY;`,
    interview: 'Timeouts are time-fixable. Retry topics preserve the key and free the poll thread.',
    trap: 'Thread.sleep(5 minutes) inside @KafkaListener.',
  },
  {
    id: 'deadlock',
    family: 'Transient',
    title: 'Deadlock / serialization failure (40P01 / 40001)',
    whatHappens: 'Two CashLine updates deadlock. Postgres aborts one transaction.',
    symptom: 'SQLSTATE 40P01 or 40001; CannotAcquireLockException.',
    classify: 'RETRY',
    retry: 'Yes — classic transient. Same key, short backoff.',
    dlq: 'Only if it keeps deadlocking (hot row / missing index).',
    holdCashLine: false,
    idempotency: 'Aborted TX rolled back; redelivery is a first write.',
    detection: 'RETRY_SQL_STATES contains 40001, 40P01, 55P03',
    recovery: 'Retry; fix lock order / indexes if chronic.',
    fallback: 'Statement timeout so deadlocks do not hang the pool.',
    alert: 'Deadlock rate on cash_lines / cashline_state.',
    lab: 'POST /api/lab/scenario/deadlock',
    mermaid: `flowchart TD
  T1[TX A lock state] --> T2[TX B lock cash_lines]
  T2 --> Abort[40P01]
  Abort --> Retry[retry topic same key]`,
    code: `Set.of("40001", "40P01", "55P03", "08006", "57014");`,
    interview: 'Walk the cause chain for SQLException. Deadlock is retry, not poison.',
    trap: 'Mapping all SQLException to DLQ.',
  },
  {
    id: 'db-down',
    family: 'Transient',
    title: 'Database permanently down / pool exhaustion',
    whatHappens: 'Every write fails. Retrying forever creates a self-DDoS when DB returns.',
    symptom: 'Connection refused, 08006, pool timeout.',
    classify: 'DLQ_AFTER_CAP',
    retry: 'Capped. Pause consumers if the whole fleet is failing.',
    dlq: 'Yes after cap — but also circuit-break so you do not fill DLQ with 10M timeouts.',
    holdCashLine: false,
    idempotency: 'Nothing committed.',
    detection: 'SQLState 08xxx / pool metrics / health',
    recovery: 'Restore DB; rewind or replay DLQ; consider pause/resume instead of DLQ flood.',
    fallback: 'Consumer pause on consecutive infra errors.',
    alert: 'Page DB first, not “poison spike”.',
    lab: 'POST /api/lab/scenario/timeout  (exhausted path)',
    mermaid: `flowchart TD
  Down[DB down] --> R[bounded retry]
  R --> Decide{still down?}
  Decide -->|yes| Pause[pause consumer / DLQ cap]
  Decide -->|no| Resume`,
    code: `// 08000/08003/08006 retryable
// Production: circuit breaker around JDBC so DLQ is not the outage log`,
    interview: 'Infra outages are not poison. Cap retry AND pause. DLQ is a last resort, not an outage archive.',
    trap: 'DLQ-ing every timeout during a 20-minute RDS failover.',
  },
  {
    id: 'kafka-blip',
    family: 'Transient',
    title: 'Kafka broker blip (produce retry/DLQ publish)',
    whatHappens: 'Broker bounce while publishing retry or DLQ. The consume side may also disconnect.',
    symptom: 'Timeouts on produce; consumer rejoin.',
    classify: 'RETRY',
    retry: 'Kafka client retries produce. Listener will redeliver if not acked.',
    dlq: 'Not for a broker blip of the source record. If DLQ publish itself fails, do not ack.',
    holdCashLine: false,
    idempotency: 'Redelivery + UNIQUE.',
    detection: 'Producer metrics, disconnect logs — not a poison classifier.',
    recovery: 'Client retry; do not persist a fake business DLQ for infra.',
    fallback: 'If DLQ persist succeeded but DLQ topic publish failed, row exists — replay tooling still works.',
    alert: 'Produce failures, not cashline.dlq.',
    mermaid: `flowchart LR
  Rec[record] --> Fail[broker timeout]
  Fail --> NoAck[do not ack]
  NoAck --> Redeliver`,
    code: `// routeDlq: persist REQUIRES_NEW first, then publish DLQ topic
// if publish throws, offset not committed → redelivery updates same DLQ row`,
    interview: 'Broker blips are client retries. Do not classify them as poison messages.',
    trap: 'Writing a DLQ row for “NotCoordinatorException”.',
  },
  {
    id: 'constraint-23505',
    family: 'Idempotency',
    title: 'Unique constraint 23505 (duplicate vs real integrity)',
    whatHappens: 'INSERT processed_events conflicts because we already committed, or a real unique violation (duplicate CashLine PK from a different event_id).',
    symptom: 'DataIntegrityViolationException / SQLState 23505.',
    classify: 'IGNORE',
    retry: 'Usually no — duplicate is success.',
    dlq: 'Only if it is NOT the idempotency key (unexpected unique). Classifier defaults integrity to DLQ_IMMEDIATE — application should catch processed_events duplicates first.',
    holdCashLine: false,
    idempotency: 'IdempotencyService.alreadyProcessed / markProcessed must run before treating 23505 as poison.',
    detection: 'Catch duplicate event_id as DUPLICATE; other 23505 → investigate.',
    recovery: 'Commit offset on duplicate. For unexpected uniques, DLQ and inspect.',
    fallback: 'Do not retry 23505 in a hot loop.',
    alert: 'cashline.duplicate vs unexpected integrity.',
    lab: 'POST /api/lab/scenario/duplicate',
    mermaid: `flowchart TD
  Ins[INSERT event_id] --> Hit{23505?}
  Hit -->|processed_events| Dup[IGNORE commit]
  Hit -->|other unique| DLQ[DLQ investigate]`,
    code: `if (idempotency.alreadyProcessed(event.eventId())) {
  metrics.duplicate();
  return ProcessResult.duplicate(event.eventId());
}`,
    interview: '23505 is not automatically poison. The unique that is event_id is your exactly-once claim.',
    trap: 'DLQ every unique violation, including successful redeliveries.',
  },
];
