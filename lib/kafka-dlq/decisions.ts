export const DECISION_TREES: {id: string; title: string; tree: string}[] = [
  {
    id: 'should-retry',
    title: 'Should this exception retry?',
    tree: `flowchart TD
  E[Exception in listener] --> T{Transient?}
  T -->|timeout 503 deadlock| R[Retry capped]
  T -->|poison deser NPE bad enum| D[DLT now]
  T -->|business 400 validation| D
  T -->|unknown| U[Short cap + alert + classify]
  R --> C{Cap exhausted?}
  C -->|no| R
  C -->|yes| DLT[Publish DLT]`,
  },
  {
    id: 'should-dlt',
    title: 'Should this record go to DLT now?',
    tree: `flowchart TD
  R[Failed record] --> P{Poison or permanent?}
  P -->|yes| DLT[DLT immediately]
  P -->|no| RY[Retrying]
  RY --> E{Exhausted cap?}
  E -->|yes| DLT
  E -->|no| RT[Retry topic / backoff]
  DLT --> C{DLT publish OK?}
  C -->|yes| COMMIT[Commit offset]
  C -->|no| SEEK[Seek + alert — do not commit]`,
  },
  {
    id: 'blocking-vs-nb',
    title: 'Blocking DEH vs @RetryableTopic?',
    tree: `flowchart TD
  Q[Need delayed retry?] --> D{Delay > few seconds?}
  D -->|yes| NB[@RetryableTopic / retry topics]
  D -->|no| B[DefaultErrorHandler FixedBackOff]
  NB --> BL{Batch listener?}
  BL -->|yes| DEH[Must use DEH + DLP]
  BL -->|no| NB
  B --> PI{max.poll.interval safe?}
  PI -->|no| NB`,
  },
  {
    id: 'one-vs-many-dlt',
    title: 'One DLT vs many?',
    tree: `flowchart TD
  S[Source topics] --> A{ACL isolation needed?}
  A -->|yes per team| PER[Per-service DLT]
  A -->|no| T{Many source topics?}
  T -->|few| PT[Per-topic -dlt Spring default]
  T -->|many| SH[Shared platform.dlt + rich headers]
  PER --> OPS{Ops can monitor all?}
  OPS -->|no| PT`,
  },
  {
    id: 'txn-vs-not',
    title: 'Transactional consumer for DLT?',
    tree: `flowchart TD
  P[Pipeline] --> K{Need atomic consume+produce in Kafka?}
  K -->|yes| TX[Transactional listener + ARP]
  K -->|no| DEH[DefaultErrorHandler + DLP]
  TX --> DB{External DB in path?}
  DB -->|yes| IDEM[Still need idempotent DB — txn not enough]
  DEH --> DB2{External DB?}
  DB2 -->|yes| IDEM`,
  },
  {
    id: 'auto-vs-manual-replay',
    title: 'Auto replay vs manual?',
    tree: `flowchart TD
  DLT[Record in DLT] --> F{Failure type?}
  F -->|transient dependency fixed| AUTO[Auto replay job when health OK]
  F -->|payload fix needed| MAN[Manual ops + RBAC]
  F -->|poison code bug| MAN
  AUTO --> I{Idempotency proven?}
  I -->|no| MAN
  I -->|yes| RP[Republish to source]`,
  },
  {
    id: 'partition-preservation',
    title: 'Preserve partition on DLT?',
    tree: `flowchart TD
  O[Ordering per key required?] -->|yes| K[Stable key + same partition index]
  O -->|no| P{DLT partition count < source?}
  P -->|yes| MINUS[Resolver partition -1]
  P -->|no| SAME[Same partition default]
  K --> C{DLT partitions >= source?}
  C -->|no| EXPAND[Expand DLT or fail deploy check]`,
  },
  {
    id: 'hold-vs-dlt',
    title: 'Parking lot vs DLT for OOO?',
    tree: `flowchart TD
  EV[Later event arrives] --> G{Gap in sequence?}
  G -->|yes| PARK[Parking / waiting_events — do not settle]
  G -->|no| PROC[Process normally]
  GAP[Earlier event failed] --> DLT[DLT gap event]
  DLT --> HOLD[Hold later events for key]
  HOLD --> REPLAY[Replay gap then drain park]`,
  },
];

export const MASTER_FAILURE_TREE = `flowchart TB
  subgraph ingest["Consume"]
    POLL[poll record]
    LIST[listener]
  end
  subgraph classify["Classify"]
    TR{Transient?}
    PO{Poison?}
    BU{Business permanent?}
  end
  subgraph retry["Retry plane"]
    DEH[DEH backoff / @RetryableTopic]
    CAP{Cap hit?}
  end
  subgraph terminal["Terminal"]
    DLP[DeadLetterPublishingRecoverer]
    DLT[DLT topic]
    COMMIT[offset commit / ack]
  end
  subgraph fail["Recoverer fail"]
    SEEK[seek + backoff reset]
    ALERT[Sev1 alert]
  end
  POLL --> LIST
  LIST -->|ok| COMMIT
  LIST -->|fail| TR
  TR -->|yes| DEH
  TR -->|no| PO
  PO -->|yes| DLP
  PO -->|no| BU
  BU -->|yes| DLP
  BU -->|no| DEH
  DEH --> CAP
  CAP -->|no| LIST
  CAP -->|yes| DLP
  DLP -->|ok| DLT
  DLP -->|ok| COMMIT
  DLP -->|fail| SEEK
  SEEK --> ALERT`;

export const CHEATS: {title: string; bullets: string[]}[] = [
  {
    title: 'Mental model',
    bullets: [
      'Kafka broker: topics + offsets — no built-in DLQ',
      'DLQ = pattern: topic + classifier + producer + commit + replay',
      'Consumer → classify → retry → DLT → offset → replay',
      'At-least-once unless business idempotency',
    ],
  },
  {
    title: 'Offsets',
    bullets: [
      'Commit after success OR after successful DLT publish per policy',
      'Never ack before process for money',
      'Recoverer fail → seek → offset not advanced',
      'Position advances on poll return — not business finish',
    ],
  },
  {
    title: 'Ordering',
    bullets: [
      'Order per partition only',
      'Same key + same partition on retry/DLT/replay',
      'DLT default same partition index — match partition counts',
      'partition -1 trades order for operability',
    ],
  },
  {
    title: 'Headers',
    bullets: [
      'DLT_ORIGINAL_TOPIC/PARTITION/OFFSET — forensics',
      'DLT_EXCEPTION_* — exception evidence',
      'DELIVERY_ATTEMPT when enabled',
      'Add business idempotency header yourself',
    ],
  },
  {
    title: 'Spring DefaultErrorHandler',
    bullets: [
      'Default FixedBackOff(0L, 9) = 10 attempts (Spring docs)',
      'Blocks partition during backoff',
      'resetStateOnRecoveryFailure default true',
      'Not default path for transactional containers',
    ],
  },
  {
    title: 'DeadLetterPublishingRecoverer',
    bullets: [
      'Default: topic + "-dlt", same partition',
      'Requires KafkaTemplate',
      'Publish fail → seek loop',
      'ErrorHandlingDeserializer restores value bytes',
    ],
  },
  {
    title: '@RetryableTopic',
    bullets: [
      'Non-blocking retries',
      'NOT for batch listeners',
      'Main offset advances when forwarding to retry',
      'Configure attempts + backoff + dltStrategy',
    ],
  },
  {
    title: 'Transactional DLT',
    bullets: [
      'DefaultAfterRollbackProcessor — not DEH default',
      'commitRecovered + kafkaTemplate for DLT txn',
      'ProducerFencedException — container may stop',
      'DB still needs idempotency',
    ],
  },
  {
    title: 'Deserialization',
    bullets: [
      'ErrorHandlingDeserializer before listener',
      'Poison → DLT not infinite poll failure',
      'DLT_KEY_EXCEPTION_* headers for key failures',
    ],
  },
  {
    title: 'Replay',
    bullets: [
      'Republish to source topic — same key',
      'RBAC + audit + optimistic lock',
      'Idempotency key required for payments',
      'Never call handler directly from API',
    ],
  },
  {
    title: 'Security',
    bullets: [
      'DLT ACL tighter than source READ',
      'Encrypt at rest; mask logs',
      'Quarantine for sensitive failures',
      'Replay is a write — separate permission',
    ],
  },
  {
    title: 'Capacity',
    bullets: [
      'DLT rate = ingress × failure% × size × retention × RF',
      'Retry topics multiply transient traffic',
      'Truncate payloads; object store for blobs',
    ],
  },
  {
    title: 'Governance',
    bullets: [
      'Retention policy per DLT class',
      'No compaction on audit DLT',
      'Legal hold overrides deletion',
      'Schema evolution + replay runbook',
    ],
  },
  {
    title: 'Poison & storms',
    bullets: [
      'Poison → DLT immediately — zero long retry',
      'Circuit breaker on dependency — pause vs DLT flood',
      'Hot key: per-key hold not pause whole partition',
    ],
  },
  {
    title: 'Rebalance',
    bullets: [
      'commitSync onPartitionsRevoked',
      'Static group.instance.id for deploys',
      'Long DEH sleep triggers rebalance dup',
    ],
  },
  {
    title: 'EOS vs business EOS',
    bullets: [
      'Kafka txn: consume + produce offsets atomic in broker',
      'External DB not covered',
      'read_committed for downstream',
      'Effectively-once = ALO + UNIQUE key',
    ],
  },
  {
    title: 'Naming',
    bullets: [
      'Spring default: {topic}-dlt',
      'Retry: {topic}-retry-N or annotation suffix',
      'Per-topic DLT vs shared — headers matter',
    ],
  },
  {
    title: 'Observability',
    bullets: [
      'dlt.publish.rate, recoverer.failure, dlt.lag',
      'Poison by exception FQCN header',
      'replay.success / replay.failed',
    ],
  },
  {
    title: 'Anti-patterns flash',
    bullets: [
      '“Kafka has built-in DLQ” — false',
      '“DLT is exactly-once” — false',
      'auto-commit + exceptions',
      '@RetryableTopic on batch listener',
    ],
  },
  {
    title: 'Failure matrix summary',
    bullets: [
      'Transient → retry cap → DLT',
      'Poison → DLT now',
      'DLT publish fail → stall + seek',
      'Commit/process ordering bugs = loss or dup',
    ],
  },
  {
    title: 'Interview one-liners',
    bullets: [
      'DLQ is app pattern not broker feature',
      '10 attempts = Spring default not Kafka',
      'Same partition DLT preserves context',
      'Replay through Kafka with idempotency',
    ],
  },
  {
    title: 'Payments specifics',
    bullets: [
      'payment_id UNIQUE in processed table',
      'Illegal state transition → reject replay',
      'OOO lifecycle → park not skip',
      'DLT DB + topic for ops console',
    ],
  },
  {
    title: 'Batch listeners',
    bullets: [
      'BatchListenerFailedException index',
      'Partial batch dup risk',
      'DEH + DLP only — no @RetryableTopic',
      'batchRecoverAfterRollback for txn batch',
    ],
  },
  {
    title: 'Delay queues',
    bullets: [
      'No native Kafka per-message delay',
      'Retry topics + listeners',
      'External scheduler for long delays',
      'In-thread sleep blocks partition',
    ],
  },
];
