import type {DlqCornerCase} from './corner-types';

export const CORNER_CASES_C: DlqCornerCase[] = [
  {
    id: 'concurrent-replay',
    family: 'Replay',
    title: 'Two operators replay the same DLQ row',
    whatHappens: 'Both click Replay. Without a lock you double-produce the same event.',
    symptom: 'One 200, one 409. UNIQUE(event_id) still saves money if both produce.',
    classify: 'CONFLICT',
    retry: 'Loser does not retry blindly.',
    dlq: 'Row already REPLAYING/REPLAYED.',
    holdCashLine: false,
    idempotency: 'Optimistic @Version + processed_events.',
    detection: 'OptimisticLockingFailureException → ReplayConflictException',
    recovery: 'Second operator waits; GET status.',
    fallback: 'Belt: unique event_id if both still publish.',
    alert: 'replay.failed / 409 count.',
    lab: 'IT concurrentReplayIsRejectedForLoser (invalid-business)',
    mermaid: `sequenceDiagram
  participant A as Ops A
  participant B as Ops B
  participant R as DLQ row
  A->>R: REPLAYING v=1
  B->>R: REPLAYING v=1
  R-->>B: 409`,
    code: `row.setStatus(REPLAYING);
dlq.saveAndFlush(row); // @Version
catch (OptimisticLockingFailureException) throw ReplayConflictException`,
    interview: 'Replay is a producer with a claim, not a double-click form.',
    trap: 'Calling CashLineService from both HTTP threads.',
  },
  {
    id: 'replay-through-kafka',
    family: 'Replay',
    title: 'Replay must republish, not call the service',
    whatHappens: 'Direct process() from REST skips retry topics, ordering, and the real consumer path.',
    symptom: 'Works in staging; diverges in prod (headers, metrics, hold).',
    classify: 'RETRY',
    retry: 'Replay uses afterCommit produce to cashline-events.',
    dlq: 'Original row tracks REPLAYING → REPLAYED.',
    holdCashLine: false,
    idempotency: 'Same event_id / corrected payload.',
    detection: 'Code review; missing HEADER_REPLAY_DLQ_ID.',
    recovery: 'Always produce; consumer marks DLQ REPLAYED.',
    fallback: 'Do not process in the API JVM as a shortcut.',
    alert: 'Replays with no consumer metrics.',
    mermaid: `flowchart TD
  API[POST /replay] --> Claim[REPLAYING]
  Claim --> K[cashline-events]
  K --> C[same consumer]
  C --> Done[REPLAYED]`,
    code: `afterCommit:
  headers.put(HEADER_REPLAY_DLQ_ID, id);
  publisher.publish(CASHLINE_EVENTS, key, payload, headers);`,
    interview: 'Operators never call the domain service. They produce.',
    trap: 'cashLineProcessingService.process() inside DlqController.',
  },
  {
    id: 'dlq-persist-requires-new',
    family: 'Replay',
    title: 'DLQ persist must survive the failed TX',
    whatHappens: 'If INSERT dead_letter_messages joins the rolled-back CashLine TX, the ticket disappears and you may ack.',
    symptom: 'No DLQ row, event skipped or infinite retry.',
    classify: 'DLQ_NOW',
    retry: 'If persist fails, do not ack — redeliver.',
    dlq: 'REQUIRES_NEW insert with unique event_id.',
    holdCashLine: true,
    idempotency: 'unique(event_id) and unique(topic,partition,offset).',
    detection: 'Missing DLQ row after classified failure.',
    recovery: 'Fix TX boundary; never persist DLQ in the failed TX.',
    fallback: 'Losing the DLQ row and committing is worse than extra poison retries.',
    alert: 'failed counter without dlq insert.',
    mermaid: `flowchart TD
  Fail[CashLine TX rollback] --> New[REQUIRES_NEW DLQ insert]
  New --> Ack[then publish DLQ topic / commit]`,
    code: `@Transactional(propagation = REQUIRES_NEW)
public DeadLetterMessageEntity persist(...) { ... }`,
    interview: 'DLQ table is the ops UI. It cannot roll back with the payment.',
    trap: '@Transactional on persist using the same TX as process().',
  },
  {
    id: 'replay-already-replayed',
    family: 'Replay',
    title: 'Replay of REPLAYED / RESOLVED row',
    whatHappens: 'Operator replays twice after success.',
    symptom: '409 illegal status.',
    classify: 'CONFLICT',
    retry: 'No.',
    dlq: 'Leave REPLAYED. Idempotent consumer would ignore anyway.',
    holdCashLine: false,
    idempotency: 'event_id already in processed_events.',
    detection: 'REPLAYABLE = FAILED | READY_FOR_REPLAY | REPLAY_FAILED',
    recovery: 'No-op. Use a new compensating event if business needs change.',
    fallback: 'Do not reset to FAILED without audit.',
    alert: 'Optional — noisy clicks.',
    mermaid: `flowchart TD
  R[REPLAYED] --> Click[replay]
  Click --> 409`,
    code: `EnumSet.of(FAILED, READY_FOR_REPLAY, REPLAY_FAILED);`,
    interview: 'Replay is a state machine too.',
    trap: 'Always allowing replay “to be safe”.',
  },
  {
    id: 'rebalance',
    family: 'Consumer',
    title: 'Consumer rebalance mid-event',
    whatHappens: 'max.poll.interval exceeded (blocking retry) or scale-in. New owner gets the same records.',
    symptom: 'Rebalance logs; possible duplicate process.',
    classify: 'RETRY',
    retry: 'New owner retries. Must be idempotent. Key order stays per partition.',
    dlq: 'No extra DLQ from rebalance itself.',
    holdCashLine: false,
    idempotency: 'UNIQUE(event_id) is mandatory.',
    detection: 'Revoke/assign logs; max.poll.interval kills.',
    recovery: 'Retry topics instead of long sleeps; keep processing under poll interval.',
    fallback: 'Cooperative sticky assignor; enough partitions.',
    alert: 'Rebalance rate.',
    mermaid: `flowchart TD
  Sleep[listener sleep 5m] --> Poll[max.poll.interval]
  Poll --> RB[rebalance]
  RB --> Dup[redeliver → UNIQUE]`,
    code: `// Hadron: retry topics, not Thread.sleep
properties.getRetry().isBlockingInMemory() is lab-only anti-pattern toggle`,
    interview: 'Rebalance is why blocking retry is forbidden on money consumers.',
    trap: 'Spring Retry with 5-minute @Backoff on the listener.',
  },
  {
    id: 'retry-partition-count',
    family: 'Consumer',
    title: 'Mismatched partition count on retry/DLQ topics',
    whatHappens: 'cashline-events has 12 partitions; retry-1 has 3. Same key hashes to a different sibling set — ordering across hops breaks.',
    symptom: 'Event 2 on retry overtakes Event 3 on main, or vice versa.',
    classify: 'PARK',
    retry: 'N/A — config bug.',
    dlq: 'Sequence gate still parks, but you created the race.',
    holdCashLine: true,
    idempotency: 'Does not restore Kafka order.',
    detection: 'Topic describe; NewTopic beans.',
    recovery: 'Same partition count on source, retry-1/2/3, DLQ.',
    fallback: 'Ordering service is a safety net, not an excuse.',
    alert: 'out.of.order after a topic recreate.',
    mermaid: `flowchart LR
  M[main 12p] --> R[retry 3p]
  R --> Shuffle[key affinity lost across hops]`,
    code: `@Bean NewTopic retry1() { return new NewTopic(RETRY_1, partitions, rf); }
// partitions == cashline-events`,
    interview: 'Retry topics are not a different stream. They are delayed copies of the same key space.',
    trap: 'Letting Kafka auto-create retry topics with default 1 partition.',
  },
  {
    id: 'null-key',
    family: 'Consumer',
    title: 'Null / missing partition key',
    whatHappens: 'Producer sends null key. Events for one CashLine spread across partitions — order is gone.',
    symptom: 'Random interleaving; waiting_events storms.',
    classify: 'DLQ_NOW',
    retry: 'No — will keep spreading.',
    dlq: 'Reject at producer; DLQ if it lands.',
    holdCashLine: true,
    idempotency: 'Cannot restore order.',
    detection: 'null key metric; producer interceptor.',
    recovery: 'Fix producer; replay with cashLineId key.',
    fallback: 'Fail the produce in CashLineProducer if key blank.',
    alert: 'null-key counter.',
    mermaid: `flowchart TD
  Null[key=null] --> P0[p0]
  Null --> P1[p1]
  Null --> P2[p2]
  P0 --> Race[seq 2 vs 3 race]`,
    code: `publisher.publish(topic, event.cashLineId(), json, headers);
// never null key for CashLine events`,
    interview: 'The key is the ordering contract. Null key is a Sev-1 producer bug.',
    trap: 'Using eventId as key (orders a single event, not the facility).',
  },
  {
    id: 'blocking-sleep',
    family: 'Consumer',
    title: 'Blocking in-memory retry (anti-pattern)',
    whatHappens: 'Listener sleeps 5m on timeout. Poll thread blocked; group rebalances; lag explodes.',
    symptom: 'max.poll.interval; session timeouts.',
    classify: 'RETRY',
    retry: 'Wrong mechanism. Use retry topics.',
    dlq: 'May never reach DLQ because the consumer is busy sleeping.',
    holdCashLine: false,
    idempotency: 'Irrelevant if the group is thrashing.',
    detection: 'Lab toggle blockingInMemory — do not enable in prod.',
    recovery: 'Disable; retry-1/2/3.',
    fallback: 'None — this is the failure.',
    alert: 'Rebalances + lag.',
    mermaid: `flowchart TD
  TO[timeout] --> Sleep[Thread.sleep 5m]
  Sleep --> Kill[max.poll.interval]
  Kill --> Chaos[rebalance storm]`,
    code: `if (properties.getRetry().isBlockingInMemory()) {
  blockingRetry.execute(() -> processing.process(envelope));
}`,
    interview: 'Name the config: max.poll.interval.ms. Sleeping through it is how juniors fail this question.',
    trap: '@Retryable(backoff = @Backoff(delay = 300000)).',
  },
  {
    id: 'poller-cursor',
    family: 'Neptune',
    title: 'Neptune poller timestamp-only cursor',
    whatHappens: 'Two CashLines share updated_at. WHERE updated_at > lastTs drops one.',
    symptom: 'Missing events with equal timestamps.',
    classify: 'RETRY',
    retry: 'Won’t help — the row was never published.',
    dlq: 'Nothing to DLQ. Gap in Hadron vs Neptune.',
    holdCashLine: true,
    idempotency: 'Stable event_id neptune-{id}-v{version} when you do publish.',
    detection: 'Reconciliation count mismatch.',
    recovery: 'Cursor is (updated_at, id). Produce then advance.',
    fallback: 'CDC if you can operate it.',
    alert: 'Poller published < expected.',
    lab: 'POST /api/neptune/poll (IT neptunePollerUsesCompositeCursor)',
    mermaid: `flowchart TD
  T["updated_at tie"] --> Bad["updated_at > lastTs drops peer"]
  T --> Good["(updated_at, id) keyset"]`,
    code: `// cursor (updated_at, id) — never timestamp alone
// produce to Kafka THEN advance cursor`,
    interview: 'Polling bugs look like DLQ problems. They are lost publishes.',
    trap: 'Advancing the cursor before Kafka ack.',
  },
  {
    id: 'poller-dual-write',
    family: 'Neptune',
    title: 'Poller: produce vs cursor crash window',
    whatHappens: 'Publish succeeds, crash before cursor advance → duplicate publish. Opposite: advance then fail produce → silent skip.',
    symptom: 'Duplicates (safe) vs gaps (unsafe).',
    classify: 'RETRY',
    retry: 'Prefer produce-first so crash = duplicate.',
    dlq: 'Gaps need reconciliation, not DLQ.',
    holdCashLine: false,
    idempotency: 'event_id from Neptune id+version, not a new UUID each poll.',
    detection: 'Cursor vs max(updated_at) in Neptune.',
    recovery: 'Produce then cursor; UNIQUE on consume.',
    fallback: 'Outbox in Neptune if you own that DB.',
    alert: 'Poller duplicate vs skip monitors.',
    mermaid: `flowchart TD
  P[produce] --> C[advance cursor]
  C --> Crash[crash here = duplicate OK]
  Bad[advance first] --> Lost[crash = gap]`,
    code: `producer.publish(event);
cursor.save(updatedAt, id); // after success`,
    interview: 'Choose the duplicate-safe order. DLQ cannot resurrect unpublished rows.',
    trap: 'new UUID() on every poll — duplicates become new money events.',
  },
  {
    id: 'payload-log',
    family: 'Security',
    title: 'Unmasked payload in DLQ logs',
    whatHappens: 'Failure handler logs full JSON with amount and accountId.',
    symptom: 'PII in CloudWatch; DLQ table is a treasure chest.',
    classify: 'DLQ_NOW',
    retry: 'N/A.',
    dlq: 'Still persist (needed for replay) but encrypt at rest; mask logs.',
    holdCashLine: false,
    idempotency: 'N/A.',
    detection: 'Log review; PayloadMasker.',
    recovery: 'Mask amount/account/participant; RBAC on GET /api/dlq; audit replay actor.',
    fallback: 'Truncate payload in table (lab 256KiB).',
    alert: 'Security review, not a lag alert.',
    mermaid: `flowchart TD
  Fail --> Log[masked payload only]
  Fail --> Tab[(encrypted DLQ row)]
  Replay --> Audit[X-Replay-Actor]`,
    code: `log.warn("... maskedPayload={} ...", masker.mask(envelope.payload()));
maskField(object, "amount"); maskField(object, "accountId");`,
    interview: 'DLQ is production financial data. Replay is a payment write.',
    trap: 'Logging the payload “just for debug”.',
  },
  {
    id: 'unauthorized-replay',
    family: 'Security',
    title: 'Unauthorized / unaudited replay',
    whatHappens: 'Open POST /api/dlq/{id}/replay in prod.',
    symptom: 'Anyone can re-fire a drawdown.',
    classify: 'CONFLICT',
    retry: 'N/A.',
    dlq: 'Replay is write access to the ledger.',
    holdCashLine: false,
    idempotency: 'Does not replace authz.',
    detection: 'Missing RBAC; missing X-Replay-Actor.',
    recovery: 'AuthN/Z, mTLS, audit_log, Kafka ACLs.',
    fallback: 'Lab default actor is not a production control.',
    alert: 'Replay without actor / 401s.',
    mermaid: `flowchart TD
  R[Replay API] --> A[RBAC + actor]
  A --> U[audit_log]
  A --> K[produce]`,
    code: `@RequestHeader(name = "X-Replay-Actor") String actor
audit(actor, "REPLAY", id, cashline);`,
    interview: 'Treat replay like POST /payments.',
    trap: 'GET /api/dlq open on the internet “because it’s failed data”.',
  },
  {
    id: 'dlq-retention',
    family: 'Replay',
    title: 'Resolved DLQ never purged',
    whatHappens: 'dead_letter_messages grows forever with payloads.',
    symptom: 'Table bloat; compliance retention breach.',
    classify: 'IGNORE',
    retry: 'N/A.',
    dlq: 'Retention job for RESOLVED/REPLAYED/IGNORED after policy days.',
    holdCashLine: false,
    idempotency: 'Keep event_id tombstone if you still fear late replays — or crypto-shred payload.',
    detection: 'DeadLetterRetentionJob; table size.',
    recovery: 'Scheduled purge; legal hold flag.',
    fallback: 'Object store for huge payloads with TTL.',
    alert: 'DLQ table size / age of RESOLVED.',
    mermaid: `flowchart LR
  Res[REPLAYED] --> Age[retention days]
  Age --> Purge`,
    code: `// DeadLetterRetentionJob — resolved rows after policy
// payments usually keep until resolved, then purge`,
    interview: 'DLQ retention is a compliance control, not “disk cleanup”.',
    trap: 'Deleting FAILED rows automatically.',
  },
  {
    id: 'hot-key-poison',
    family: 'Consumer',
    title: 'Poison key on a hot partition',
    whatHappens: 'One bad CashLine hashes to a busy partition. Infinite retry stalls every other facility on that partition.',
    symptom: 'Lag on one partition; other partitions healthy.',
    classify: 'DLQ_NOW',
    retry: 'Do not pin the partition. DLQ the poison key.',
    dlq: 'Immediate for poison; other keys in the partition proceed.',
    holdCashLine: true,
    idempotency: 'Only that CashLine is blocked (open DLQ hold).',
    detection: 'Per-partition lag; DLQ by cashLineId.',
    recovery: 'DLQ + hold per CashLine, not pause-entire-partition unless serde cannot even read the key.',
    fallback: 'Pause/resume partition only if the record is unreadable at the fetch layer.',
    alert: 'Partition lag skew + DLQ for one key.',
    mermaid: `flowchart TD
  P[partition 4] --> Bad[CL-POISON loop]
  Bad --> Stall[all keys on p4 wait]
  Fix[DLQ poison] --> Move[other keys proceed]`,
    code: `// Per-CashLine hold in DB beats pause/resume of the whole partition`,
    interview: 'Availability for everyone else vs safety for one facility. DLQ the key, do not freeze the partition.',
    trap: 'Seek-to-current retry on poison JSON in a shared partition.',
  },
  {
    id: 'replay-self-hold',
    family: 'Replay',
    title: 'Replay must not be parked by its own open DLQ hold',
    whatHappens: 'CREATE failed validation → DLQ + CashLine blocked. Ops corrects and replays the same row. If the hold counts REPLAYING as an unresolved prior failure, the replay parks itself forever.',
    symptom: 'Replay publishes; waiting_events grows; cash_lines never appears.',
    classify: 'RETRY',
    retry: 'The replayed record should apply as seq 1, not retry as out-of-order.',
    dlq: 'Exclude this DLQ id from hasUnresolvedPriorFailure while HEADER_REPLAY_DLQ_ID is set.',
    holdCashLine: true,
    idempotency: 'Same event_id; after success mark REPLAYED so the hold lifts for later sequences.',
    detection: 'Replay metrics without cash_lines row; waiting_events for the same event.',
    recovery: 'Pass excludeOpenDlqId from the replay header into the sequence gate.',
    fallback: 'Do not clear ALL holds on any replay — other open DLQs for that CashLine must still park later events.',
    alert: 'replay.ok but CashLine missing.',
    lab: 'POST /api/lab/scenario/invalid-amount then /correct + /replay',
    mermaid: `flowchart TD
  Fail[CREATE invalid] --> Hold[open DLQ hold]
  Hold --> Replay[replay same row]
  Replay --> Exclude[exclude this DLQ id]
  Exclude --> Apply[apply seq 1]
  Apply --> Lift[REPLAYED]`,
    code: `ordering.validateSequence(event, payload, parseReplayDlqId(envelope));
// existsByCashLineIdAndStatusInAndIdNot(cashLineId, OPEN, excludeDlqId)`,
    interview: 'A DLQ hold is for later events, not for the event that is currently being repaired.',
    trap: 'Blocking replay with the same row that operators just claimed REPLAYING.',
  },
];
