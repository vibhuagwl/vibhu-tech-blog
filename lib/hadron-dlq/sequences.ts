export type CodeSequence = {
  id: string;
  title: string;
  endpoint: string;
  classes: string[];
  why: string;
  mermaid: string;
};

export const CODE_SEQUENCES: CodeSequence[] = [
  {
    id: 'success',
    title: 'Success',
    endpoint: 'POST /api/cashlines/events → cashline-events',
    classes: ['CashLineProducer', 'FailurePipeline', 'CashLineProcessingService', 'IdempotencyService'],
    why: 'Neptune (or a lab client) publishes a CashLine event keyed by cashLineId. Hadron validates, persists, marks processed_events, then the consumer can commit the offset.',
    mermaid: `sequenceDiagram
  autonumber
  participant N as Neptune
  participant P as CashLineProducer
  participant K as Kafka cashline-events
  participant C as Hadron Consumer
  participant DB as Hadron DB
  N->>P: CashLine CL123 seq=1 CREATED
  P->>K: key=CL123 payload
  K->>C: poll record
  C->>DB: UNIQUE event_id insert
  C->>DB: cash_lines VALIDATED
  C->>DB: cashline_state last_seq=1
  C-->>K: commit offset`,
  },
  {
    id: 'retry',
    title: 'Retry topics',
    endpoint: 'forceFailure=TRANSIENT_THEN_OK',
    classes: ['ExceptionClassifier', 'FailurePipeline', 'InMemoryEventBroker'],
    why: 'DB timeout is transient. Do not block the consumer thread for minutes. Publish to retry-1/2/3 with backoff, then succeed.',
    mermaid: `sequenceDiagram
  autonumber
  participant C as Consumer
  participant DB as Hadron DB
  participant R1 as retry-1 (5s)
  participant R2 as retry-2 (30s)
  C->>DB: persist CashLine
  DB-->>C: timeout
  C->>R1: same key CL123
  Note over R1: wait backoff
  R1->>DB: persist
  DB-->>R1: timeout
  R1->>R2: retry-2
  R2->>DB: persist OK
  R2-->>R2: commit offset`,
  },
  {
    id: 'dlq',
    title: 'DLQ',
    endpoint: 'POST /api/lab/scenario/poison',
    classes: ['FailurePipeline', 'DeadLetterMessageService', 'DeadLetterPublishingRecoverer'],
    why: 'Poison JSON must not retry forever. After classification, persist dead_letter_messages (REQUIRES_NEW, unique event_id) and publish cashline-events-dlq.',
    mermaid: `sequenceDiagram
  autonumber
  participant C as Consumer
  participant X as ExceptionClassifier
  participant DLT as cashline-events-dlq
  participant DB as DLQ DB
  C->>C: deserialize JSON
  C-->>X: PoisonMessageException
  X-->>C: DLQ_IMMEDIATE
  C->>DB: INSERT dead_letter_messages
  C->>DLT: publish original payload
  C-->>C: commit offset (stop retry loop)`,
  },
  {
    id: 'replay',
    title: 'Replay',
    endpoint: 'POST /api/dlq/{id}/replay',
    classes: ['DlqReplayService', 'CashLineProducer', 'CashLineProcessingService'],
    why: 'Operators never call the consumer service directly. Replay claims REPLAYING with @Version, then afterCommit publishes back to cashline-events.',
    mermaid: `sequenceDiagram
  autonumber
  participant Ops as Operator
  participant API as DlqController
  participant DB as DLQ DB
  participant K as cashline-events
  participant C as Hadron Consumer
  participant H as Hadron DB
  Ops->>API: POST /api/dlq/42/replay
  API->>DB: status=REPLAYING version++
  API->>K: republish key=cashLineId
  K->>C: same processing path
  C->>H: persist + processed_events
  C->>DB: status=REPLAYED`,
  },
  {
    id: 'duplicate',
    title: 'Duplicate',
    endpoint: 'POST /api/lab/scenario/duplicate',
    classes: ['IdempotencyService', 'ProcessedEventRepository'],
    why: 'At-least-once delivery plus a failed offset commit would insert twice without UNIQUE(event_id). The second delivery is a no-op.',
    mermaid: `sequenceDiagram
  autonumber
  participant K as Kafka
  participant C as Consumer
  participant I as processed_events
  participant H as cash_lines
  K->>C: event e-dup-1
  C->>H: INSERT CashLine
  C->>I: INSERT event_id UNIQUE
  Note over C: crash before offset commit
  K->>C: redelivery e-dup-1
  C->>I: INSERT conflict
  C-->>C: DUPLICATE ignore
  C-->>K: commit offset`,
  },
  {
    id: 'ooo',
    title: 'Out of order',
    endpoint: 'POST /api/lab/scenario/out-of-order',
    classes: ['EventOrderingService', 'WaitingEventService', 'CashLineStateMachine'],
    why: 'If Event 101 goes to DLQ while 102/103 succeed, Hadron would settle a CashLine that never applied the update. Sequence + open-DLQ hold parks later events.',
    mermaid: `sequenceDiagram
  autonumber
  participant E1 as Event 1 CREATE
  participant E2 as Event 2 UPDATE
  participant E3 as Event 3 SETTLE
  participant S as cashline_state
  participant W as waiting_events
  E1->>S: last_seq=1
  E2-->>E2: FAIL → DLQ
  S-->>S: blocked
  E3->>S: expected=2 received=3
  E3->>W: park Event 3
  Note over E3: do NOT settle`,
  },
];
