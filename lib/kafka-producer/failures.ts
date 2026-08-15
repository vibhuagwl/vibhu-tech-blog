import type {FailureRow} from './types';

/** How to read §21 and when these failures show up. */
export const FAILURE_MATRIX_EXPLAIN = `What the Failure matrix is
  → A cheat sheet: IF this bad thing happens WHILE producing,
    THEN will the client get an ACK? Will it retry? Can the log
    get a duplicate? Can data be lost? What exception do you see?

How to read the columns
  ACK?   — Did the producer consider this send successful?
  Retry? — Will the client (or should the app) retry?
  Dup?   — Can the Kafka log end up with two copies of the same produce try?
  Loss?  — Can the record disappear after the app thought it was safe?
  Order  — Per-partition ordering impact
  Exception — Typical client signal

WHEN each row occurs (trigger → what you see)

Broker / replication
  Leader crash after append, before ACK
    → Leader wrote the record then died before ProduceResponse reached you.
    → You see timeout/disconnect/NotLeader; client retries after metadata refresh.
    → Idempotent: same PID+seq → no second append. acks=1: possible loss if followers never had it.

  ACK lost on network
    → Broker succeeded; response packet dropped. Client times out and retries.
    → Classic “timeout after success” — idempotence prevents log duplicate.

  Follower crash (ISR still ≥ minISR)
    → One replica dies but enough in-sync replicas remain.
    → Produce with acks=all still succeeds. No client error.

  ISR < min.insync.replicas + acks=all
    → Not enough healthy replicas (broker down, disk full, slow replica kicked from ISR).
    → Produce FAILS with NotEnoughReplicas* — better than silent loss.

  Stale metadata → wrong leader
    → Leadership moved; your cache still points at the old broker.
    → NotLeaderOrFollower → refresh metadata → retry new leader.

  unclean leader election (misconfig)
    → Broker allowed an out-of-ISR replica to become leader.
    → Rare in sane prod (unclean.leader.election.enable=false); can lose committed offsets.

Client / app path
  Serialization error / Record too large
    → Bad payload or over max.request.size / broker message.max.bytes.
    → Fails on THIS record before/without a durable append; do not infinite-retry as-is.

  BufferPool exhausted past max.block.ms
    → App outran brokers or buffer.memory too small (§10 backpressure).
    → send() blocked then TimeoutException — shed load / tune / scale.

  DNS / bootstrap all down
    → Cannot reach any bootstrap.servers / reconnect path.
    → Timeouts until network/DNS restored.

Security
  AuthN / AuthZ / TLS handshake fail
    → Wrong creds, missing WRITE ACL, expired cert (§18).
    → Fail closed; fix config/ACL/certs — not a linger.ms problem.

Idempotence / transactions
  DuplicateSequence (broker)
    → Retry of an already-accepted seq — broker suppresses duplicate (success path).

  OutOfOrderSequenceException
    → Seq gap / unexpected order for this PID+epoch (bug, fatal-ish session, or mishandled state).

  Producer fenced (txn)
    → Another instance InitProducerId’d the same transactional.id (§29).
    → Stop the zombie; do not retry as if retriable.

  Transaction timeout / coordinator crash mid-txn
    → Txn took too long or coordinator restarted.
    → Abort/recover; uncommitted data not visible to read_committed consumers.

Quota
  Broker throttle / quota
    → Produce over producer_byte_rate (or similar).
    → Responses delayed (throttle_time_ms); latency ↑ — not AuthorizationException.

Interview use
  → Pick a money-critical row (ACK lost, leader crash, ISR thin) and narrate
    acks=all + idempotence + outbox — that is the matrix’s point.`;

/** What “chaos” means on this page (§22). */
export const CHAOS_EXPLAIN = `What “chaos” means here
  → Chaos engineering = INTENTIONALLY inject failures in a test/staging
    (or game day) to prove the producer behaves as the failure matrix predicts.
  → It is NOT a Kafka config. It is NOT random production vandalism.
  → “Chaos expectations” table =: if I inject X, I should observe Y.

Why do it
  → Configs look fine until a leader dies mid-ACK or TLS expires at 2am.
  → Practice reading metrics (NotLeader rate, throttle-time, buffer wait)
    and confirming idempotent retries do not duplicate.

How it maps
  Kill partition leader     → matrix: leader crash / NotLeader / metadata refresh
  Kill follower             → matrix: ISR shrink; NotEnoughReplicas if < minISR
  Drop Produce responses    → matrix: ACK lost → timeout → idempotent retry
  Fill buffer.memory        → matrix: backpressure → TimeoutException
  Fence via second txn id   → matrix: ProducerFencedException
  Expire TLS / block DNS    → matrix: security / bootstrap failures

Safe practice
  → Run in non-prod or controlled game days with rollback.
  → Assert: no silent loss for acks=all+minISR; no log dups with idempotence;
    app stops cleanly on fence; alerts fire.
  → Production “chaos” without a plan is just an outage.`;

export const FAILURE_MATRIX: FailureRow[] = [
  {failure: 'Leader crash after append, before ACK', ack: 'No', retry: 'Yes (metadata refresh)', dup: 'No if idempotent; yes if not', loss: 'No if ISR had it / acks=all; possible with acks=1', order: 'Preserved if idempotent', exception: 'Timeout / disconnect / NotLeader'},
  {failure: 'ACK lost on network', ack: 'Client sees fail', retry: 'Yes', dup: 'No if idempotent', loss: 'No if broker committed', order: 'OK with idempotence', exception: 'TimeoutException'},
  {failure: 'Follower crash (ISR still ≥ minISR)', ack: 'Yes', retry: 'No', dup: 'No', loss: 'No', order: 'None', exception: '—'},
  {failure: 'ISR < min.insync.replicas + acks=all', ack: 'No', retry: 'Until delivery timeout', dup: 'No', loss: 'Produce fails (good)', order: 'N/A', exception: 'NotEnoughReplicas'},
  {failure: 'Broker throttle / quota', ack: 'Delayed', retry: 'May', dup: 'No if idempotent', loss: 'No', order: 'Latency ↑', exception: 'ThrottleTime in response'},
  {failure: 'Record too large', ack: 'No', retry: 'No', dup: 'No', loss: 'This record fails', order: 'N/A', exception: 'RecordTooLargeException'},
  {failure: 'Serialization error', ack: 'No', retry: 'No', dup: 'No', loss: 'This record fails', order: 'N/A', exception: 'SerializationException'},
  {failure: 'AuthN failure', ack: 'No', retry: 'No', dup: 'No', loss: 'Fails closed', order: 'N/A', exception: 'AuthenticationException'},
  {failure: 'AuthZ / ACL deny', ack: 'No', retry: 'No', dup: 'No', loss: 'Fails closed', order: 'N/A', exception: 'AuthorizationException / TopicAuthorization'},
  {failure: 'TLS handshake fail', ack: 'No', retry: 'Reconnect backoff', dup: 'No', loss: 'Until fixed', order: 'N/A', exception: 'SslAuthenticationException'},
  {failure: 'Unknown topic / invalid metadata', ack: 'No', retry: 'Metadata refresh', dup: 'No', loss: 'Until topic exists', order: 'N/A', exception: 'UnknownTopicOrPartition / Timeout'},
  {failure: 'BufferPool exhausted past max.block.ms', ack: 'No', retry: 'No (send fails)', dup: 'No', loss: 'App must backpressure', order: 'N/A', exception: 'TimeoutException'},
  {failure: 'Producer fenced (txn)', ack: 'No', retry: 'No', dup: 'Prevented', loss: 'Zombie stopped', order: 'N/A', exception: 'ProducerFencedException'},
  {failure: 'OutOfOrderSequenceException', ack: 'No', retry: 'Depends / fatal-ish', dup: 'Risk if mishandled', loss: 'Session may reset', order: 'Broken sequence', exception: 'OutOfOrderSequenceException'},
  {failure: 'DuplicateSequence (broker)', ack: 'Success path', retry: 'N/A', dup: 'Suppressed', loss: 'No', order: 'OK', exception: 'Handled internally'},
  {failure: 'Transaction timeout', ack: 'Abort path', retry: 'App must abort/retry txn', dup: 'Aborted invisible if read_committed', loss: 'Uncommitted work dropped', order: 'N/A', exception: 'Timeout / InvalidTxnState'},
  {failure: 'Coordinator crash mid-txn', ack: 'Pending', retry: 'FindCoordinator + recover', dup: 'Controlled by markers', loss: 'Uncommitted aborted', order: 'N/A', exception: 'Timeout / disconnect'},
  {failure: 'Stale metadata → wrong leader', ack: 'No', retry: 'Yes after refresh', dup: 'No if idempotent', loss: 'No', order: 'OK', exception: 'NotLeaderOrFollower'},
  {failure: 'DNS / bootstrap all down', ack: 'No', retry: 'Until max.block / delivery', dup: 'No', loss: 'Cannot produce', order: 'N/A', exception: 'TimeoutException'},
  {failure: 'unclean leader election (misconfig)', ack: 'Maybe', retry: '—', dup: 'Possible weirdness', loss: 'YES possible', order: 'Can lose offsets', exception: 'Silent durability bug'},
];

export const TROUBLESHOOT: {title: string; symptoms: string; causes: string; fix: string}[] = [
  {title: 'Producer timeout', symptoms: 'TimeoutException, rising request-latency', causes: 'Broker slow, ISR thin, network, linger+load', fix: 'Check URP/minISR, disk, network; tune delivery/request timeouts intentionally'},
  {title: 'Throughput cliff', symptoms: 'send-rate drop, buffer wait ↑', causes: 'Batch too small, compression CPU, broker throttle, GC', fix: 'Metrics: queue-time, throttle-time, GC; raise linger carefully'},
  {title: 'Latency 10ms → 500ms', symptoms: 'p99 spike', causes: 'linger, ISR, slow disk, retry storms, DNS', fix: 'Break down queue-time vs request-latency; fix broker first'},
  {title: 'Duplicates seen downstream', symptoms: 'Same event twice', causes: 'Non-idempotent retries OR two app sends OR consumer replay', fix: 'Idempotent producer + business idempotency key'},
  {title: 'Out-of-order per key', symptoms: 'Offsets reorder for key', causes: 'max.in.flight>1 without idempotence; multi writers', fix: 'Idempotence; single writer per key; in-flight≤5'},
  {title: 'Hot partition', symptoms: 'One partition bytes ≫ others', causes: 'Skewed key / low cardinality', fix: 'Re-key, salt carefully, isolate whales'},
  {title: 'Buffer exhaustion', symptoms: 'max.block.ms timeouts', causes: 'Produce > broker accept; buffer.memory small', fix: 'Backpressure app; scale brokers; tune memory'},
  {title: 'Record too large', symptoms: 'RecordTooLargeException', causes: 'Payload > max.request.size / broker max', fix: 'Shrink payload; object-store pattern; align limits'},
  {title: 'Not enough replicas', symptoms: 'NotEnoughReplicasException', causes: 'ISR < minISR', fix: 'Restore brokers; do not lower minISR casually'},
  {title: 'Producer fencing', symptoms: 'ProducerFencedException', causes: 'Another instance same transactional.id', fix: 'Unique txn id per live instance; stop zombies'},
  {title: 'Retry storm', symptoms: 'retry-rate ↑, broker load ↑', causes: 'Persistent error treated retriable', fix: 'Classify fatal vs retriable; circuit break'},
  {title: 'Auth / TLS failures', symptoms: 'Auth exceptions at start', causes: 'ACL, cert expiry, wrong truststore', fix: 'Rotate certs; grant WRITE+IDEMPOTENT_WRITE'},
  {title: 'Metadata flapping', symptoms: 'NotLeader loops', causes: 'Controller / rapid leadership changes', fix: 'Stabilize cluster; check controller metrics'},
  {title: 'Compression CPU spike', symptoms: 'High CPU, low send-rate', causes: 'gzip on huge batches', fix: 'lz4/zstd; right-size batches'},
  {title: 'Connection churn', symptoms: 'creation-rate ↑', causes: 'Idle timeouts, LB resets, DNS', fix: 'Fix network path; connections.max.idle'},
];

export const CHAOS: string[][] = [
  ['Kill partition leader', 'Clients refresh metadata; idempotent retries safe'],
  ['Kill follower', 'ISR shrinks; acks=all may fail if < minISR'],
  ['Inject 500ms RTT', 'Latency ↑; batches may grow; watch delivery timeout'],
  ['Drop Produce responses', 'Timeout → retry; dup suppressed if idempotent'],
  ['Restart txn coordinator', 'In-flight txns recover or abort; clients FindCoordinator'],
  ['Expire TLS cert', 'New connections fail; rolling outage'],
  ['Fill buffer.memory', 'send blocks → TimeoutException after max.block.ms'],
  ['Throttle producer quota', 'ThrottleTime; throughput falls; latency rises'],
  ['Block DNS briefly', 'Bootstrap/reconnect delays'],
  ['Fence via second txn.id user', 'Original producer hits ProducerFencedException'],
];
