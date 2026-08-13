import type {HadronTopic} from './types';

export const TOPICS_A: HadronTopic[] = [
  {
    id: 'overview',
    title: '01. Business Story — Neptune to Hadron CashLines',
    badge: 'Interview spine',
    problem: 'Hadron consumes financial CashLine events that originated in Neptune. A single poison or out-of-order event can either melt the consumer or corrupt settlement state.',
    whenToUse: 'Any at-least-once Kafka consumer that mutates money, balances, or lifecycle state.',
    whenAvoid: 'Fire-and-forget telemetry where duplicates and drops are acceptable.',
    mermaid: `flowchart TD
  N[Neptune DB] --> P[CDC / Poller]
  P --> K[Kafka cashline-events]
  K --> H[Hadron Consumer]
  H --> V[Validate]
  V --> T[Transform]
  T --> DB[(Hadron DB)]
  DB --> OK[Commit offset]
  H --> F[Failure]
  F --> R[Retry topics]
  R --> DLT[DLQ topic]
  DLT --> DDB[(dead_letter_messages)]
  DDB --> RP[Replay API]
  RP --> K`,
    code: `producer.publish(TopicNames.CASHLINE_EVENTS, event.cashLineId(), json, headers);
// key = cashLineId → all events for CL123 share a partition`,
    failure: 'If UPDATE for CL123 is DLQ’d while SETTLE/COMPLETE continue, Hadron will complete a CashLine that never applied the update. Ordering + open-DLQ hold exist to stop that.',
    production: 'Treat this as a money pipeline: classify errors, bound retries, persist DLQ, idempotent consume, replay through Kafka.',
    interview30s: 'Neptune emits CashLine changes, Kafka carries them keyed by CashLine ID, Hadron validates and persists. Transient errors retry; poison and business errors go to DLQ with a DB record; ops replay back onto the same topic.',
    followUp: 'Walk Event 101 failing while 102/103 arrive. If you cannot pause the CashLine, you do not have a safe DLQ.',
    tradeoff: 'Safety (hold later events) vs availability (keep consuming other CashLines). Partition-by-cashLineId gives both: only one CashLine stalls.',
    memoryTrick: 'Neptune → Kafka → Hadron → retry → DLQ → DB → Kafka again.',
  },
  {
    id: 'architecture',
    title: '02. Architecture',
    badge: 'Lab = production shape',
    problem: 'Need one picture that an interviewer can redraw: source, bus, consumer, retry, DLQ, replay.',
    whenToUse: 'Staff design interviews and on-call runbooks.',
    whenAvoid: 'Do not hide retry inside an unbounded in-memory loop and call it architecture.',
    mermaid: `flowchart LR
  subgraph Source
    N[Neptune]
    POLL[Poller cursor updated_at,id]
  end
  subgraph Bus
    M[cashline-events]
    R1[retry-1]
    R2[retry-2]
    R3[retry-3]
    D[cashline-events-dlq]
  end
  subgraph Hadron
    C[Consumer]
    I[processed_events UNIQUE]
    S[cashline_state]
    L[dead_letter_messages]
  end
  N --> POLL --> M --> C
  C -->|ok| I
  C -->|transient| R1 --> R2 --> R3 --> D
  C -->|poison/business| D
  D --> L
  L -->|replay| M`,
    code: `public static final String CASHLINE_EVENTS = "cashline-events";
public static final String RETRY_1 = "cashline-events-retry-1";
public static final String DLQ = "cashline-events-dlq";`,
    failure: 'Mismatched partition counts on retry topics reshuffle CashLines and break the ordering story.',
    production: 'Same partition count on source, retry, and DLQ topics. Consumer concurrency = partitions, but key affinity still serializes a single CashLine.',
    interview30s: 'One topic family, CashLine ID as key, three delayed retry topics, one DLQ topic plus a PostgreSQL table for operators.',
    followUp: 'Why both a DLQ topic and a DLQ table? Topic is the bus; table is the ops UI, audit, and replay lock.',
    tradeoff: 'In-memory broker for tests vs real Kafka for the kafka profile. Same FailurePipeline.',
    memoryTrick: 'Bus for movement, DB for operators.',
  },
  {
    id: 'why-dlq',
    title: '03. Why DLQ Is Needed',
    badge: 'Failure taxonomy',
    problem: 'Without a DLQ, poison CashLines retry until CPU, pools, and Kafka lag explode — or the consumer blocks the whole partition.',
    whenToUse: 'Permanent, poison, and exhausted-transient failures.',
    whenAvoid: 'Do not DLQ broker disconnects or brief network blips that the client already retries.',
    mermaid: `flowchart TD
  E[Failure] --> B{Class?}
  B -->|Transient| R[Retry 3x]
  B -->|Permanent business| D[DLQ now]
  B -->|Poison| D
  B -->|Duplicate| I[Ignore]
  B -->|Out of order| W[Wait / park]
  R -->|still failing| D
  D --> M[Manual or automated replay]`,
    code: `if (t instanceof PoisonMessageException) return DLQ_IMMEDIATE;
if (t instanceof PermanentBusinessException) return DLQ_IMMEDIATE;
if (t instanceof QueryTimeoutException) return RETRY;`,
    failure: 'Business: invalid CashLine, missing field, bad participant/account/currency/amount/type, duplicate business tx, illegal state. Technical: DB down/timeout, broker, network, REST timeout, serde, NPE, constraint, deadlock, pool exhaustion. Data: corrupt, stale, missing ref data, bad version, unknown participant, wrong sequence.',
    production: 'Map each class: Transient → Retry; Permanent/Poison → DLQ; Duplicate → Ignore; Ordering → Park; Kafka client errors → retry connection, not DLQ.',
    interview30s: 'DLQ is a bounded parking lot for messages that will not succeed with the current payload or dependency. It protects the hot path.',
    followUp: 'Unknown participant: retry/wait for reference data, then DLQ if the master data never arrives.',
    tradeoff: 'Too eager DLQ hides outages as “bad data”. Too lazy DLQ turns one poison JSON into an incident.',
    memoryTrick: 'Retry what time can fix. DLQ what humans or a new payload must fix.',
  },
  {
    id: 'retry-vs-dlq',
    title: '04. Retry vs DLQ',
    badge: 'Decision matrix',
    problem: 'Interviewers want a table, not vibes.',
    whenToUse: 'On-call classification and consumer error handlers.',
    whenAvoid: 'Retrying validation errors “just in case”.',
    mermaid: `flowchart LR
  T[DB timeout] --> R[Retry]
  P[Invalid payload] --> D[DLQ]
  K[Broker blip] --> R2[Retry client]
  U[Unknown participant] --> W[Retry then DLQ]
  O[Ordering] --> S[Special / no DLQ skip]`,
    code: `boolean poisonOrPermanent = decision == DLQ_IMMEDIATE;
if (!poisonOrPermanent && nextRetry <= max) routeRetry();
else routeDlq();`,
    failure: 'Infinite retry of invalid JSON is the most expensive “retry vs DLQ” mistake.',
    production: 'See the matrix on this page. Exhausted transients become DLQ so someone can page the DB owners.',
    interview30s: 'Retry transient; DLQ poison and business; ignore duplicates; special-case ordering.',
    followUp: 'DB permanently down: retry with cap then DLQ/alert — never infinite.',
    tradeoff: 'Retry topics cost Kafka traffic; in-memory retry costs consumer liveness.',
    memoryTrick: 'If a human must change data, it is DLQ. If the world must change, it is retry.',
  },
  {
    id: 'when-not',
    title: '05. When DLQ Should NOT Be Used',
    badge: 'Trap question',
    problem: 'Blindly DLQ’ing Event 2 while 3 and 4 proceed corrupts CashLine state.',
    whenToUse: 'Unordered, independently idempotent messages (notifications, metrics).',
    whenAvoid: 'Lifecycle streams: CREATED → UPDATED → SETTLED → COMPLETED.',
    mermaid: `flowchart TD
  C[CREATED] --> U[UPDATED]
  U -->|DLQ| X[lost update]
  U --> S[SETTLED success]
  S --> D[COMPLETED success]
  X --> BAD[Settled the wrong version]`,
    code: `if (hasUnresolvedPriorFailure(cashLineId)) {
  waitingEvents.park(event, payload, expected);
  throw new OutOfOrderEventException(...);
}`,
    failure: 'Consumer concurrency > 1 on the same partition, or different keys for the same CashLine, also breaks order.',
    production: 'Preferred Hadron design: key=cashLineId, sequential processing per partition, sequenceNumber, pause later events when a prior DLQ is open.',
    interview30s: 'DLQ is wrong when skipping a message violates happens-before. Then you hold the CashLine, not just dump Event 2.',
    followUp: 'Blocking retry vs non-blocking: blocking preserves order but stalls the partition. Retry topics preserve key but you must not process 3 while 2 is still in retry.',
    tradeoff: 'Availability of other CashLines vs strict per-entity order. Partition key gives you both if you also gate on sequence.',
    memoryTrick: 'Never DLQ-and-forget a middle event in a state machine.',
  },
  {
    id: 'kafka-ordering',
    title: '06. Kafka Ordering',
    badge: 'Partition key',
    problem: 'Kafka only orders inside a partition. Random keys shuffle CL123 across partitions.',
    whenToUse: 'Always set key=cashLineId for this domain.',
    whenAvoid: 'Do not use round-robin keys to “increase parallelism” on a lifecycle topic.',
    mermaid: `flowchart TD
  ID[CashLine ID] --> KEY[Kafka key]
  KEY --> P[Same partition]
  P --> SEQ[Sequential consume]
  SEQ --> SM[State machine]`,
    code: `publisher.publish(TopicNames.CASHLINE_EVENTS, event.cashLineId(), json, headers);
factory.setConcurrency(1); // scale by partitions, not threads per partition`,
    failure: 'Producer retries with a different partitioner or changing partition count without sticky keys reshuffles history.',
    production: 'Keep retry/DLQ partition count equal. Pause/resume a partition only for poison that blocks the whole partition; prefer per-CashLine hold in DB.',
    interview30s: 'One CashLine, one key, one partition, one in-order consumer stream. Sequence numbers are a safety net, not a substitute for the key.',
    followUp: 'Non-blocking retry can deliver 3 before 2 succeeds unless you check last_processed_sequence.',
    tradeoff: 'Hot CashLine keys can skew partitions. Accept skew over breaking settlement order.',
    memoryTrick: 'Key is the order contract.',
  },
];
