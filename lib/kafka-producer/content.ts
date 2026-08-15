/** Defaults verified against Apache Kafka 4.x producer configs (kafka.apache.org/43). */

export const VERSION_NOTE =
  'Config defaults below target Apache Kafka 4.x (docs /43). Notable 4.0 change: linger.ms default became 5 (was 0). enable.idempotence default true; acks default all; max.in.flight default 5; retries default Integer.MAX_VALUE. Always re-check docs for your broker/client JAR pair.';

export const MEMORY_SENTENCE =
  'producer.send() validates → serializes → partitions → queues into RecordAccumulator batches → Sender thread compresses and ProduceRequests the partition leader → waits for acks (ISR if all) → callback/Future. Idempotence (PID+epoch+seq) stops retry duplicates in the log. Transactions + fencing cover multi-partition atomicity. Outbox covers DB dual-write. Exactly-once to a database still needs an idempotent side effect.';

export const SEND_PIPELINE = `Application thread
  → KafkaProducer.send(ProducerRecord)
  → validate (topic, size, nullability rules)
  → Serializer (key + value + headers as needed)
  → Metadata.waitIfNeeded (bootstrap → leaders)
  → Partitioner → partition id
  → RecordAccumulator.append → ProducerBatch / BufferPool
  → (batch full OR linger.ms) wake Sender
Sender thread
  → drain ready batches → optional compression
  → NetworkClient → ProduceRequest to leader Node
  → broker: append log → replicate to ISR → respond per acks
  → complete Future / Callback (often on I/O thread — keep light)
  → on retriable error: backoff within delivery.timeout.ms`;

export const LAYER_STACK = `Application Message
  → Kafka Record (key, value, headers, timestamp)
  → ProducerBatch (many records, ONE partition)
  → ProduceRequest (one or more batches to ONE broker Node)
  → Kafka Log Entry (offset assigned by that partition's leader)`;

/** One send() vs batch vs ProduceRequest — common confusion. */
export const PRODUCE_REQUEST_EXPLAIN = `Does one send() ship to multiple partitions?
  → NO. One producer.send(record) = ONE record → ONE partition (chosen first).
  → That record joins a ProducerBatch for THAT partition only.
  → Batches never mix partitions.

What "ProduceRequest (one or more batches to a broker)" means
  → The Sender builds ONE network ProduceRequest per destination broker Node.
  → If partitions 0 and 3 both have leaders on broker-2, and both have ready batches,
    those TWO batches ride in the SAME ProduceRequest to broker-2.
  → That is batching across partitions that share a leader host — not one send() fanning out.
  → Different leaders (different brokers) → separate ProduceRequests on separate TCP connections.

Timeline example
  send(A) → partition 0 (leader = broker-1) → wait in batch P0
  send(B) → partition 2 (leader = broker-1) → wait in batch P2
  send(C) → partition 5 (leader = broker-3) → wait in batch P5
  linger/full → Sender:
    ProduceRequest → broker-1  [batch P0 + batch P2]
    ProduceRequest → broker-3  [batch P5]`;

/** How metadata finds the partition leader. */
export const METADATA_LEADER_EXPLAIN = `How the producer finds the leader via metadata

1) bootstrap.servers
   → Seed list only. Client opens TCP to any reachable broker and asks for Metadata.
2) MetadataResponse
   → For each topic partition: partition id, leader broker id, replica set, ISR, offline replicas.
   → Also broker id → host:port (advertised.listeners).
3) Client cache (Metadata)
   → send() looks up: topic + partition → leader Node → host:port.
   → Produce goes ONLY to that leader (never to followers for produce).
4) Refresh
   → On NotLeaderOrFollower / unknown topic / metadata.max.age.ms / new topics.
   → After refresh, retries go to the new leader.

You do not pick the leader in code — you pick (or the partitioner picks) a partition;
metadata maps partition → current leader.`;

/** Null key → how partition is chosen. */
export const NULL_KEY_PARTITION_EXPLAIN = `If you do NOT specify a key (and no explicit partition)

Modern DefaultPartitioner / sticky behavior (Kafka 2.4+ clients):
  → Null key does NOT mean "hash null" or classic round-robin-per-record.
  → Client picks one partition and STICKS to it while filling a batch (linger / batch.size).
  → When that batch is full/sent (or sticky window ends), it may switch to another partition.
  → Goal: better batching for keyless traffic; still spreads load over time.

Other modes (you choose one):
  → Explicit partition in ProducerRecord → that partition, key ignored for routing.
  → Non-null key → murmur2(keyBytes) % numPartitions (stable until partition count changes).
  → Custom Partitioner → your logic (document the order boundary).

Ordering note
  → No key ⇒ no per-entity order guarantee across sends (sticky may keep order briefly
    inside one batch/partition, then jump).
  → Need order for accountId → put accountId as the key.`;

/** Broker "Enforce quotas / ACLs". */
export const QUOTAS_ACLS_EXPLAIN = `What "Enforce quotas / ACLs" means (broker side)

ACLs (authorization)
  → Who may WRITE this topic / use IDEMPOTENT_WRITE / transactional IDs.
  → Producer identity comes from SASL / mTLS principal.
  → Fail → TopicAuthorizationException / ClusterAuthorizationException (usually non-retriable).

Quotas (rate limits)
  → Broker caps produce byte-rate and/or request-rate per client.id / user / IP.
  → Over quota → produce is delayed or throttled (client sees throttle-time metrics / slower sends).
  → This is cluster protection — not application backpressure from buffer.memory.

Producer view
  → You configure credentials + ACLs so produce is allowed.
  → Quotas show up as elevated request-latency / produce-throttle-time — scale or raise quota.`;

export const COMPONENT_THREADS: string[][] = [
  ['KafkaProducer / send()', 'App threads', 'Thread-safe entry; appends into accumulator'],
  ['Serializer / Partitioner / Interceptor.onSend', 'App threads', 'Must be thread-safe if shared'],
  ['RecordAccumulator / BufferPool', 'App + Sender', 'Memory accounting; may block up to max.block.ms'],
  ['Sender', '1 background thread', 'Builds requests, retries, completes futures'],
  ['NetworkClient / InFlightRequests', 'Sender', 'TCP, request/response, connections'],
  ['Metadata', 'Shared', 'Cached cluster/topic/leader; refresh on errors/age'],
  ['Callback.onCompletion', 'I/O / sender path', 'Keep tiny — no heavy business work'],
  ['TransactionManager', 'Sender + app tx APIs', 'PID, epochs, EndTxn, fencing'],
];

/** Plain-English: "single-threaded producer" vs thread-safe KafkaProducer. */
export const THREADING_EXPLAIN = `What people mean by "the Kafka producer is single-threaded"
  → ONE Sender background thread owns the network I/O loop:
    drain batches → build ProduceRequests → talk to brokers → complete Futures/callbacks.
  → Your app CAN call send() from many threads — KafkaProducer is thread-safe.
  → Serialization / partitioning run on the calling app thread inside send().
  → Do NOT create a new KafkaProducer per request (that is the anti-pattern).
  → Reuse ONE producer (or Spring ProducerFactory singleton) so TCP, metadata,
    BufferPool, and PID stay shared and healthy.`;

/** Plain-English: producer backpressure. */
export const BACKPRESSURE_EXPLAIN = `What backpressure means for a Kafka producer
  → Your app wants to produce faster than Kafka (or the network) can accept.
  → Batches pile up in RecordAccumulator until buffer.memory is full.
  → send() then BLOCKS (waits) instead of accepting more records — that wait IS backpressure.
  → It waits at most max.block.ms; then throws TimeoutException.
  → Healthy response: slow the app (bounded queue, rate limit, 429/shed),
    raise capacity (brokers, partitions, quotas), or tune memory/batching —
    do not ignore TimeoutException and keep hammering.`;

/** How max.in.flight + retries + idempotence (PID/seq) connect. */
export const IDEMPOTENCE_LINK_EXPLAIN = `How retries, max.in.flight, and idempotence (unique try id) connect

1) Unique try identity (not your business paymentId)
   → Broker allocates a Producer ID (PID) + epoch.
   → For each partition, the client stamps a monotonic sequence number on every record/batch try.
   → PID + epoch + seq is the unique produce-attempt id the broker uses to dedupe.

2) retries > 0
   → If the ProduceResponse is lost or the leader flaps, the Sender resends the SAME seq.
   → Without idempotence the broker would append again → log duplicate.
   → With idempotence the broker sees the same PID+epoch+seq → keeps one append.

3) max.in.flight.requests.per.connection
   → How many ProduceRequests may be outstanding on one TCP connection before waiting.
   → Higher = more pipeline / throughput; also more chance that a failed earlier batch
     retries AFTER a later batch already succeeded → reorder (if not idempotent).
   → With enable.idempotence=true the broker enforces order via seq, and the client
     requires max.in.flight ≤ 5 (the supported safe window).

4) Required set for safe retries in the log
   → acks=all + enable.idempotence=true + retries>0 + max.in.flight≤5
   → This is transport-level exactly-once produce into the Kafka log for one producer session.
   → It does NOT replace a business idempotency key (paymentId) for DB/PSP side effects.`;

/** What NetworkClient is in the producer. */
export const NETWORK_CLIENT_EXPLAIN = `What NetworkClient is
  → The Kafka client's TCP / protocol engine used by the Sender thread.
  → Not something you call from app code — KafkaProducer → Sender → NetworkClient.

Responsibilities
  → Maintain one (or few) TCP connections per broker Node (host:port from metadata).
  → Send Kafka protocol requests: Metadata, Produce, InitProducerId, FindCoordinator, AddPartitionsToTxn, EndTxn, ApiVersions…
  → Track InFlightRequests (requests waiting for a response) — this is where max.in.flight applies.
  → Read responses, complete futures / wake retries, apply reconnect + backoff.
  → Optionally TLS-wrap sockets (security.protocol = SSL / SASL_SSL).

Where it sits
  App threads → KafkaProducer.send → RecordAccumulator
  Sender thread → NetworkClient ↔ brokers

Interview one-liner
  → NetworkClient = the I/O layer that turns ProduceBatches into bytes on the wire and maps responses back.`;

/** Fire-and-forget vs async vs sync send. */
export const SEND_MODES_EXPLAIN = `Send modes — what they actually mean

1) Fire-and-forget: producer.send(record)  and ignore the Future
   → send() still enqueues into the accumulator (may block on metadata/buffer).
   → You never look at success/failure → silent loss / silent errors possible.
   → Highest “I don't care” throughput; almost never OK for money events.

2) Async (preferred): producer.send(record, callback)  or Future handled later
   → Caller returns quickly after enqueue.
   → When the broker acks (or final error), callback / Future completes on I/O path.
   → Handle errors in callback (metrics, DLQ/outbox replay) — do NOT do heavy DB work there.
   → This is the default production mode.

3) Sync: producer.send(record).get(timeout)
   → Caller THREAD blocks until that record is fully sent+acked (or fails).
   → OK for tests, rare critical writes, or tiny admin tools.
   → BAD in a hot loop: destroys throughput (no useful pipelining / batching across waits).

Common confusion
  → “Async” does NOT mean “acks=0”. You can be async AND use acks=all + idempotence.
  → Sync vs async is about the CALLER waiting — not about broker durability.`;

/** Schema Registry plain English. */
export const SCHEMA_REGISTRY_EXPLAIN = `What Schema Registry is (producer view)
  → A separate HTTP service (Confluent / Apicurio / etc.) that stores schemas
    (Avro / Protobuf / JSON Schema) under a subject name + version number.
  → The Kafka broker does NOT validate your Avro schema by itself — the serializer + registry do.

Produce path with Avro (typical)
  1) Serializer asks registry: “register or lookup schema for subject payments-value”.
  2) Registry returns a numeric schema id (e.g. 42).
  3) Wire payload = magic byte + schema id + Avro binary (not raw JSON).
  4) Consumer deserializer reads id → fetches schema → decodes.

Why it exists
  → Contracts between producers and consumers without sharing JAR classes forever.
  → Compatibility modes (BACKWARD / FORWARD / FULL) block breaking schema changes at register time.
  → Breaking change → new subject/topic strategy (or careful FULL_TRANSITIVE evolution).

What it is NOT
  → Not a replacement for Kafka ACLs.
  → Not required for String/ByteArray serializers.
  → Not “find the partition leader” — that is Metadata (§11).`;

/** bootstrap.servers discovery seed — where it applies. */
export const BOOTSTRAP_SEED_EXPLAIN = `“bootstrap.servers is a discovery seed” — what that means and where it applies

Config location
  → Producer (and consumer) client config: bootstrap.servers=broker1:9092,broker2:9092
  → Spring: spring.kafka.bootstrap-servers=...

What “seed” means
  → These hosts are ONLY the first contact list to fetch Metadata.
  → After that, the client talks to the ACTUAL leaders/coordinators returned in Metadata
    (advertised.listeners host:ports) — which may be different machines than the seed list.
  → You do NOT need every broker in bootstrap.servers — usually 2–3 reachable brokers is enough.
  → You also should NOT assume produce forever sticks to the bootstrap host.

Where it applies in the send path
  1) First send / first metadata need → connect to a bootstrap host.
  2) MetadataResponse → cache all brokers + partition leaders.
  3) ProduceRequest → leader of THAT partition (often not the bootstrap broker).
  4) InitProducerId / txn coordinator → may be yet another broker (FindCoordinator).

K8s / cloud gotcha
  → If advertised.listeners is wrong (internal DNS clients cannot resolve),
    bootstrap works but Produce to “leader” fails — fix listeners, not linger.ms.`;

/** Fencing plain English. */
export const FENCING_EXPLAIN = `What fencing means (zombie producer kill-switch)

Problem
  → Two processes think they are the “same” transactional producer (same transactional.id).
  → Example: old pod still alive during deploy, or network-partitioned “zombie” that keeps sending.

Mechanism
  → transactional.id is a stable identity registered with the transaction coordinator.
  → initTransactions() / InitProducerId allocates or bumps a producer EPOCH for that id.
  → Newer epoch WINS. Older epoch is FENCED — further Produce / EndTxn → ProducerFencedException.

What “fenced” means in practice
  → Broker/coordinator rejects the old instance so it cannot commit more transactions
    or leave split-brain writes for that transactional identity.
  → App must STOP that instance (crash / exit) — do not swallow ProducerFencedException.

Idempotent-only (no transactional.id)
  → You still have PID+epoch+seq for retry dedupe inside one process lifetime.
  → That is NOT the same as transactional fencing across pods/restarts.
  → Restarts get a new PID; old process is not “fenced” by identity unless you use transactional.id.

Rule
  → Unique transactional.id per live instance (e.g. payment-api-\${HOSTNAME}).
  → Sharing one txn id across replicas on purpose = the new one fences the old one.`;

/** TLS / SASL / ACLs security layers. */
export const SECURITY_LAYERS_EXPLAIN = `18. Security — TLS, SASL, ACLs (three different jobs)

① TLS (encryption in transit) — security.protocol = SSL or SASL_SSL
  → Encrypts bytes between client NetworkClient and broker.
  → Truststore = which broker certs you trust; keystore = client cert if mTLS.
  → Failure → SslAuthenticationException / handshake errors (often before any Produce).

② SASL (authentication — who are you?)
  → Mechanisms: PLAIN, SCRAM-SHA-256/512, GSSAPI (Kerberos), OAUTHBEARER.
  → Client proves identity → broker maps to a principal (User:alice).
  → Failure → AuthenticationException (bad password / token / kerberos ticket).

③ ACLs (authorization — what may you do?)
  → After auth, broker checks: may principal WRITE topic X? IDEMPOTENT_WRITE? transactional id?
  → Failure → TopicAuthorizationException / ClusterAuthorizationException (usually non-retriable).

Order of the handshake (mental model)
  TCP connect → (TLS) → (SASL auth) → Kafka ApiVersions/Metadata/Produce → ACL check on Produce

Also related (not the same)
  → Quotas = rate limits after you are allowed (§00/§31) — throttle, not “forbidden”.
  → Schema Registry often has its own auth — separate from Kafka ACLs.

Producer config sketch
  security.protocol=SASL_SSL
  sasl.mechanism=SCRAM-SHA-512
  sasl.jaas.config=...
  ssl.truststore.location=...
  # plus topic WRITE + IDEMPOTENT_WRITE ACLs for that principal`;

export const API_ROWS: string[][] = [
  ['send(record)', 'Future<RecordMetadata>', 'Async enqueue; may block on metadata/buffer'],
  ['send(record, callback)', 'Future + Callback', 'Preferred async path'],
  ['flush()', 'void', 'Blocks until all buffered records sent+acked'],
  ['partitionsFor(topic)', 'List<PartitionInfo>', 'Forces metadata; useful for custom routing'],
  ['metrics()', 'Map', 'Client JMX/Micrometer bridge source'],
  ['close() / close(Duration)', 'void', 'Flush + shutdown sender'],
  ['initTransactions()', 'void', 'Requires transactional.id; fences prior epoch'],
  ['beginTransaction()', 'void', 'Open txn boundary'],
  ['commitTransaction()', 'void', 'Commit; writes markers'],
  ['abortTransaction()', 'void', 'Abort; markers'],
  ['sendOffsetsToTransaction(...)', 'void', 'EOS consume-transform-produce'],
];

export const SEND_MODES: string[][] = [
  ['Fire-and-forget send(r)', 'Highest throughput', 'Errors easy to miss; loss if you ignore Future'],
  ['Async send(r, cb)', 'High throughput', 'Handle errors in callback; do not block callback'],
  ['Sync send(r).get()', 'Simple correctness', 'Destroys throughput if per-record; OK for rare critical writes'],
];

export const SERDE_ROWS: string[][] = [
  ['StringSerializer', 'Debug / simple keys', 'UTF-8 strings'],
  ['ByteArraySerializer', 'Raw bytes / pre-encoded', 'No schema'],
  ['JsonSerializer (Spring)', 'JSON POJOs', 'Schema drift risk — version topics'],
  ['Avro + Schema Registry', 'Contracts at scale', 'Subject, ID, compatibility modes'],
  ['Protobuf + SR', 'Compact contracts', 'Same registry concerns'],
  ['Custom Serializer', 'Domain encoding', 'Must be deterministic + thread-safe'],
];

export const PARTITION_ROWS: string[][] = [
  ['Explicit partition in ProducerRecord', 'Full control', 'You own skew and migration'],
  ['Key present', 'hash(key) % numPartitions (DefaultPartitioner family)', 'Stable key → stable partition until count changes'],
  ['Null key (no partition set)', 'Sticky: stay on one partition while filling a batch, then may switch', 'Not classic round-robin-per-record; better batching; weak order'],
  ['Custom Partitioner', 'Tenant / priority / anti-hot-key', 'Must preserve intended ordering boundary'],
  ['Partition count increases', 'New keys may hash elsewhere; old keys stay', 'Ordering window can split across migration'],
];

export const KEY_ROWS: string[][] = [
  ['accountId / customerId', 'Per-entity order', 'Hot whale accounts skew'],
  ['orderId', 'Per-order order', 'Good cardinality if many orders'],
  ['transactionId / paymentId', 'Unique events', 'No multi-event order per account'],
  ['tenantId', 'Tenant isolation', 'Large tenants become hot partitions'],
  ['accountId:paymentId', 'Order per account + unique event', 'Payment demo default'],
];

export const ORDER_ROWS: string[][] = [
  ['Within one partition', 'Total order of offsets'],
  ['Across partitions / topics', 'No order guarantee'],
  ['Across producer instances', 'No order unless you design a single writer'],
  ['Retries without idempotence + max.in.flight>1', 'Reorder risk'],
  ['Idempotence on (acks=all, in-flight≤5)', 'Per-partition produce order preserved across retries'],
  ['Transactions', 'Atomic multi-partition visibility; not a global order fairy'],
];

export const ACK_ROWS: string[][] = [
  ['acks=0', 'Socket write considered done', 'Lowest latency', 'Loss on almost any failure', 'No offset in metadata'],
  ['acks=1', 'Leader append acked', 'Faster than all', 'Loss if leader dies before followers catch up', 'Common “looks fine” trap'],
  ['acks=all (-1)', 'ISR acks (≥ min.insync.replicas)', 'Strongest durable produce', 'Fails with NotEnoughReplicas when ISR thin', 'Required for idempotence'],
];

export const IDEMP_ROWS: string[][] = [
  ['PID', 'Producer ID allocated by broker'],
  ['Epoch', 'Bumps on init / fencing; invalidates zombies'],
  ['Sequence number', 'Per partition, monotonic per PID+epoch'],
  ['Broker dedupe', 'Same PID+epoch+seq → not appended twice'],
  ['Guarantees', 'Retry of same produce session does not duplicate in the log'],
  ['Does NOT guarantee', 'Two app calls, two producers, or consumer redelivery side effects'],
];

export const TX_FLOW = `initTransactions()     // fence old epoch for transactional.id
beginTransaction()
  send(...)             // one or many partitions
  // optional sendOffsetsToTransaction for EOS pipe
commitTransaction()     // or abortTransaction() on failure

Coordinator tracks state in __transaction_state
Commit writes control markers; read_committed consumers skip aborted`;

export const OUTBOX_COMPARE: string[][] = [
  ['Direct DB then Kafka', 'Simple', 'Crash between → dual-write hole'],
  ['Kafka then DB', 'Simple', 'Kafka success + DB fail → phantom events'],
  ['Kafka transactions only', 'Multi-partition atomic in Kafka', 'Does not include your JDBC commit'],
  ['Transactional outbox', 'DB row + relay', 'Gold standard for DB↔Kafka consistency'],
  ['CDC (Debezium)', 'Capture DB log', 'Ops heavy; great when DB is source of truth'],
];

/** Head-to-head: transactional outbox vs Kafka transactions. */
export const OUTBOX_VS_KAFKA_TXN = `Outbox vs Kafka transactions — pick by the boundary you need atomic

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kafka transactions (transactional.id + begin/commit)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT they make atomic
  → Several Kafka produces (often multi-partition) succeed or abort TOGETHER.
  → Optional EOS pipe: consume → process → produce, with offsets in the same txn
    (sendOffsetsToTransaction) so read_committed consumers see a consistent cut.

WHAT they do NOT cover
  → Your Postgres/MySQL/Oracle JDBC commit.
  → Kafka txn API does NOT enlist the DB. Two separate systems remain.

WHEN to use
  → Atomic multi-topic / multi-partition Kafka writes.
  → Consume-transform-produce exactly-once *inside Kafka*.
  → Need fencing (§29) so only one live owner of transactional.id.

WHEN NOT enough alone
  → “Save payment in DB AND publish PaymentSettled” — crash between DB and Kafka
    still creates a dual-write hole even if Kafka side uses transactions.

Config sketch
  transactional.id=<unique-per-live-instance>
  enable.idempotence=true (implied)
  acks=all
  consumer isolation.level=read_committed (for visibility)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Transactional outbox (DB is source of truth)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT it makes atomic
  → Business row + outbox row in ONE DB transaction.
  → A relay (poller / CDC / Debezium) reads outbox → KafkaProducer.send.
  → If relay crashes, row remains → retry. If Kafka acks, mark published.

WHAT it does NOT give by itself
  → Multi-partition atomicity inside Kafka (use Kafka txn in the relay if needed).
  → Automatic fencing of app pods (relay still uses normal idempotent producer,
    or transactional.id if the relay design requires it).

WHEN to use
  → DB commit and Kafka event must not diverge (payments, ledger, orders).
  → You already have a DB write path — event is a side effect of that commit.

Shape
  BEGIN;
    INSERT payment ...;
    INSERT outbox(event_id, topic, payload, status='NEW') ...;
  COMMIT;
  -- relay: SELECT NEW → producer.send → mark SENT (idempotent on event_id)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Side-by-side
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                 Kafka txn              Outbox
Atomic across    Kafka partitions       DB + “will publish” intent
Includes JDBC?   NO                     YES (same DB txn)
Dual-write hole  Still possible         Closed at DB commit
EOS consume-prod YES (offsets in txn)   Usually separate consumer design
Ops complexity   txn.id uniqueness      Outbox table + relay/CDC
Payments default Rarely alone           Preferred (+ idempotent producer)

Rule of thumb
  → Kafka-only atomicity → Kafka transactions.
  → DB truth must match the event → outbox (or CDC).
  → Often BOTH: outbox for DB↔Kafka, idempotent (or txn) producer on the relay.
  → Never say “Kafka transactions give exactly-once into Postgres.”`;

export const CONFIG_CORE: string[][] = [
  ['bootstrap.servers', 'list', '(required)', 'Initial contact — not “the whole cluster forever”'],
  ['key.serializer / value.serializer', 'class', '(required)', 'Must match consumers'],
  ['acks', 'string', 'all', 'Idempotence requires all'],
  ['enable.idempotence', 'boolean', 'true', 'Default true if no conflicts (Kafka 3.0+/4.x)'],
  ['retries', 'int', '2147483647', 'Bounded by delivery.timeout.ms in practice'],
  ['delivery.timeout.ms', 'int', '120000', 'Total time for send success including retries+linger'],
  ['request.timeout.ms', 'int', '30000', 'Per-request wait; should be < delivery.timeout'],
  ['linger.ms', 'long', '5', 'Kafka 4.0+ default 5 (was 0)'],
  ['batch.size', 'int', '16384', 'Upper batch bytes per partition batch'],
  ['buffer.memory', 'long', '33554432', 'Total accumulator memory (~32MB)'],
  ['compression.type', 'string', 'none', 'none|gzip|snappy|lz4|zstd — prefer zstd/lz4 in prod'],
  ['max.in.flight.requests.per.connection', 'int', '5', '≤5 with idempotence'],
  ['max.block.ms', 'long', '60000', 'Block on metadata/buffer before TimeoutException'],
  ['max.request.size', 'int', '1048576', 'Client request cap; align with broker message.max.bytes'],
  ['retry.backoff.ms', 'long', '100', 'Initial backoff; exponential to max'],
  ['retry.backoff.max.ms', 'long', '1000', 'Backoff ceiling'],
  ['metadata.max.age.ms', 'long', '300000', 'Forced refresh period'],
  ['connections.max.idle.ms', 'long', '540000', 'Idle connection cull'],
  ['transactional.id', 'string', 'null', 'Stable per logical producer instance for fencing'],
  ['client.id', 'string', '""', 'Metrics / quotas identity'],
];

export const CONFIG_INTERACTIONS = `acks=all + enable.idempotence=true + max.in.flight≤5 + retries>0
  → safe retries without log duplicates; required set for idempotence

delivery.timeout.ms ≥ linger.ms + request.timeout.ms
  → otherwise configs rejected / sends fail early

batch.size ↑ + linger.ms ↑ + compression=zstd
  → throughput ↑, latency ↑, CPU ↑, better ratio on similar records
  → this is a THROUGHPUT PROFILE trade-off — not an "anti-pattern" by itself
  → anti-pattern = raising these blindly past your p99 SLO / GC / buffer budget

buffer.memory too small vs (batch.size × active partitions)
  → max.block.ms waits → TimeoutException under load`;

/** Expanded plain-English for the interaction matrix (section 16). */
export const CONFIG_INTERACTIONS_EXPLAIN = `① Idempotent safe-retry set (correctness first — used by BOTH latency and throughput profiles)
  acks=all
    → leader waits for ISR (≥ min.insync.replicas) before success — durable produce.
  enable.idempotence=true
    → broker dedupes by PID+epoch+seq so a retry does not create a second log append.
  max.in.flight.requests.per.connection ≤ 5
    → pipelining window the idempotent client supports while keeping per-partition order.
  retries > 0
    → actually retry retriable failures; without retries idempotence never gets to save you.
  Together: "safe retries without log duplicates." This set is required for idempotence.
  It is NOT a latency vs throughput choice — keep it on for money / correctness workloads.

② delivery.timeout.ms ≥ linger.ms + request.timeout.ms
  delivery.timeout.ms = total budget for one record to succeed (linger wait + attempts + backoffs).
  request.timeout.ms  = how long ONE ProduceRequest may wait for a response.
  linger.ms           = how long a batch may sit waiting to fill before the first attempt.
  If delivery is smaller than linger + one request, the client rejects the config or
  fails sends early — you gave a budget smaller than the minimum path time.

③ batch.size ↑ + linger.ms ↑ + compression=zstd  (HIGH THROUGHPUT knob — not an anti-pattern)
  What you mean by HIGH THROUGHPUT: more records/bytes successfully produced per second.
  What you mean by LOW LATENCY: each record reaches an ack sooner (less waiting in the batch).
  Raising batch.size / linger.ms → Sender waits for fuller batches → fewer, fatter ProduceRequests
    → throughput ↑, but each record may wait longer → end-to-end latency ↑.
  compression=zstd → CPU ↑ to compress, wire bytes ↓, often better records/sec on similar payloads.
  Anti-pattern (see §24): unlimited linger "for throughput", or blind batch/buffer raises
    without measuring record-queue-time, p99, GC, and buffer-available-bytes.

④ buffer.memory too small vs (batch.size × active partitions)
  Each in-flight partition batch can reserve up to ~batch.size from the shared BufferPool.
  Many active partitions × large batch.size can exhaust buffer.memory even before brokers are slow.
  Then send() blocks up to max.block.ms → TimeoutException under load (producer backpressure).`;

export const LATENCY_VS_THROUGHPUT = `Low latency vs high throughput (same producer, different knobs)

LOW LATENCY profile (send acks sooner)
  → linger.ms low/0: do not wait to fill the batch — ship ASAP.
  → smaller batches / lighter compression: less queue + less CPU before the wire.
  → Cost: more ProduceRequests, worse compression ratio, lower max records/sec.
  → Still keep: acks=all + enable.idempotence=true (+ in-flight≤5, retries).

HIGH THROUGHPUT profile (maximize records/sec)
  → linger.ms higher (e.g. 20–50): wait a bit so batches fill.
  → batch.size higher (e.g. 64–128KB): fewer, larger network requests.
  → compression=zstd: burn CPU to move more logical records per wire byte.
  → buffer.memory larger if many partitions need concurrent batches.
  → Cost: higher per-record latency (queue/linger) and more CPU; watch p99 vs SLO.
  → Still keep: acks=all + enable.idempotence=true (+ in-flight≤5, retries).

Rule of thumb: correctness knobs (acks/idempotence/in-flight/retries) stay on;
latency vs throughput is mostly linger + batch.size + compression + buffer.memory.`;

export const PROFILES: {name: string; goal: string; code: string}[] = [
  {
    name: 'Low latency',
    goal: 'Minimize queueing so each record is acked sooner; accept lower batching efficiency (fewer records/sec ceiling)',
    code: `linger.ms=0
batch.size=16384
compression.type=lz4
acks=all
enable.idempotence=true
max.in.flight.requests.per.connection=5
# Still durable + idempotent — "low latency" does NOT mean acks=0`,
  },
  {
    name: 'High throughput',
    goal: 'Fill batches, compress, keep connections busy — maximize records/sec; accept higher per-record latency',
    code: `linger.ms=20-50
batch.size=65536-131072
compression.type=zstd
buffer.memory=67108864
acks=all
enable.idempotence=true
max.in.flight.requests.per.connection=5
# Cap linger against your p99 SLO — unlimited linger is the anti-pattern`,
  },
  {
    name: 'Financial / payments',
    goal: 'Durability + idempotent retries + stable keys; measure p99',
    code: `acks=all
enable.idempotence=true
max.in.flight.requests.per.connection=5
delivery.timeout.ms=120000
compression.type=zstd
linger.ms=5-25
batch.size=32768-65536
# transactional.id only if multi-partition atomicity needed
# prefer outbox for DB consistency`,
  },
  {
    name: 'Transactional producer',
    goal: 'Multi-partition atomic produce / EOS pipe',
    code: `transactional.id=<stable-per-instance>
enable.idempotence=true   # implied
acks=all
transaction.timeout.ms=<under broker max>
# unique transactional.id per pod — never share across live instances`,
  },
];

export const PERF_BREAKDOWN: string[][] = [
  ['Application', 'Business build of ProducerRecord'],
  ['Serialization', 'CPU + allocations'],
  ['Queue / accumulator', 'Wait for batch space'],
  ['Batch wait (linger)', 'Intentional delay for fullness'],
  ['Network', 'RTT to leader'],
  ['Broker append', 'Page cache / disk'],
  ['Replication (acks=all)', 'Follower fetch catch-up'],
  ['Response + callback', 'Complete Future'],
];

export const CAPACITY_EXAMPLE = `Example: 100,000 records/sec × 2 KB = 200 MB/s ingress (app → Kafka leaders)
RF=3 → ~600 MB/s cluster write including replication (order-of-magnitude)
zstd ~3:1 on JSON → ~67 MB/s wire ingress before replication math
Producers: size by CPU/serialization + connections, not by partition count
Partitions: size by per-partition produce ceiling and consumer parallelism`;

export const SECURITY_ROWS: string[][] = [
  ['TLS / mTLS', 'Encrypt in transit; rotate keystores/truststores'],
  ['SASL PLAIN/SCRAM/GSSAPI/OAUTHBEARER', 'Authenticate client identity'],
  ['ACL WRITE on topic', 'Authorize produce'],
  ['IDEMPOTENT_WRITE', 'Required for idempotent producer'],
  ['Transactional ACLs', 'Transactional IDs + write on txn state'],
  ['DESCRIBE', 'Metadata for topics'],
];

export const METRIC_ROWS: string[][] = [
  ['record-send-rate / byte-rate', 'Throughput'],
  ['record-error-rate / retry-rate', 'Failure / retry storms'],
  ['request-latency-avg/max', 'End-to-end produce latency'],
  ['record-queue-time-avg', 'Time sitting in accumulator'],
  ['batch-size-avg + compression-rate-avg', 'Batching/compression health'],
  ['buffer-available-bytes / bufferpool-wait-time', 'Memory pressure'],
  ['requests-in-flight', 'Pipeline depth'],
  ['connection-count / creation-rate', 'Connection churn'],
];

export const SPRING_COMPARE: string[][] = [
  ['Native KafkaProducer', 'Max control, explicit threading knowledge', 'More boilerplate'],
  ['KafkaTemplate', 'Spring DI, Micrometer, tx integration', 'Must still understand underlying producer'],
  ['ProducerFactory / DefaultKafkaProducerFactory', 'Lifecycle + config', 'One factory → reuse producer'],
  ['KafkaTransactionManager / @Transactional', 'Spring tx boundary', 'transactional.id uniqueness still your problem'],
];

/** How many KafkaProducer instances do you need? */
export const PRODUCER_COUNT_EXPLAIN = `How many producers do we need?

Default answer (most services)
  → ONE KafkaProducer (or ONE Spring ProducerFactory → one shared producer)
    PER JVM / pod / process.
  → Many app threads call send() on that same instance (thread-safe).
  → Scale out = more PODS, each with its own producer — not “one producer per HTTP request.”

When to use MORE than one producer in the same process
  → Different clusters (primary vs audit cluster).
  → Different security principals / ACL identities.
  → Isolation of configs (e.g. low-latency vs high-throughput profiles).
  → Different transactional.id owners (rare — usually one txn producer per instance).

When NOT to create more
  → Per request / per message / per thread “to go faster” → anti-pattern
    (TCP churn, metadata churn, buffer.memory × N, PID churn).
  → “One producer per topic” — usually unnecessary; one producer sends to many topics.

Mental count in Kubernetes
  → replicas=5 payment-api pods → 5 producers (one each) → fine.
  → 5 pods × 200 producers each → cluster connection / memory disaster.

transactional.id note
  → If using Kafka transactions: unique transactional.id PER LIVE INSTANCE
    (e.g. payment-api-\${HOSTNAME}), still typically ONE producer that uses that id.`;

/** Start / stop producer in production. */
export const PRODUCER_LIFECYCLE_PROD = `How to start / stop a producer in production

START (app boot)
  1) Build config (bootstrap, serializers, acks, idempotence, linger, security).
  2) new KafkaProducer(props)  OR  Spring creates via ProducerFactory on context refresh.
  3) Optional: initTransactions() if transactional.id is set (fences prior epoch).
  4) Ready to send() — first send may block briefly on metadata (max.block.ms).
  5) Warm path: avoid creating producers in the request thread.

STOP (graceful — deploys, scale-in, SIGTERM)
  1) Stop accepting new work (k8s readiness fail / drain HTTP).
  2) Optional flush() — wait for buffered + in-flight acks (producer still open).
  3) close(Duration) — flush then stop Sender + sockets.
     Further send() → IllegalStateException.
  4) Exit process only AFTER close completes (or timeout — then treat remainder as unknown;
     outbox must be able to replay).

Kubernetes checklist
  → preStop sleep or lifecycle hook ≥ close timeout + linger + a little slack.
  → terminationGracePeriodSeconds > preStop + close.
  → Spring: DefaultKafkaProducerFactory / KafkaTemplate are DisposableBean —
    context.close() closes the underlying producer — do not skip graceful shutdown.
  → Never kill -9 as the normal stop path (loses unsent accumulator batches).

Crash / OOM / kill -9
  → No close(). Unsent batches gone. Broker-acked records stay.
  → Rely on outbox / source-of-truth replay for anything not acked.

Do NOT
  → close() after every send.
  → Leave producers open across rolling deploys without draining (esp. shared txn id).`;

/** Create producer with Spring Kafka — practical recipe. */
export const SPRING_PRODUCER_CREATE = `Create a producer with Spring Kafka (production shape)

1) Dependency
  spring-boot-starter-kafka  (pulls spring-kafka + kafka-clients)

2) application.yml (Boot auto-config)
  spring:
    kafka:
      bootstrap-servers: kafka-1:9092,kafka-2:9092
      producer:
        key-serializer: org.apache.kafka.common.serialization.StringSerializer
        value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
        acks: all
        properties:
          enable.idempotence: true
          max.in.flight.requests.per.connection: 5
          linger.ms: 5
          compression.type: zstd
          # transactional.id: payment-api-\${HOSTNAME}   # only if you need Kafka txn
      # security.protocol / sasl.* as needed

3) Use KafkaTemplate (Boot creates ProducerFactory + KafkaTemplate beans)
  @Service
  class PaymentPublisher {
    private final KafkaTemplate<String, PaymentEvent> kafka;
    PaymentPublisher(KafkaTemplate<String, PaymentEvent> kafka) { this.kafka = kafka; }

    public CompletableFuture<SendResult<String, PaymentEvent>> publish(PaymentEvent e) {
      return kafka.send("payments", e.accountId(), e);  // key = ordering boundary
    }
  }

4) Explicit factory (when you need custom serializers / two clusters)
  @Bean
  ProducerFactory<String, PaymentEvent> paymentProducerFactory() {
    Map<String, Object> cfg = new HashMap<>();
    cfg.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "...");
    cfg.put(ProducerConfig.ACKS_CONFIG, "all");
    cfg.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
    cfg.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    cfg.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
    return new DefaultKafkaProducerFactory<>(cfg);
    // factory creates/reuses ONE underlying KafkaProducer (non-tx default)
  }

  @Bean
  KafkaTemplate<String, PaymentEvent> paymentKafkaTemplate(
      ProducerFactory<String, PaymentEvent> pf) {
    return new KafkaTemplate<>(pf);
  }

5) Lifecycle
  → Start: Spring context refresh builds factory/template (producer often lazy on first send).
  → Stop: context shutdown → factory.destroy() → producer.close().
  → You rarely call new KafkaProducer() yourself in Boot apps.

6) Transactions (only if needed)
  spring.kafka.producer.transaction-id-prefix: payment-api-\${HOSTNAME}-
  + KafkaTransactionManager + @Transactional("kafkaTransactionManager")
  → Still unique per live instance; see fencing §29.

Anti-pattern in Spring
  → @Bean KafkaProducer that you new up per request
  → new KafkaTemplate(new DefaultKafkaProducerFactory(...)) inside a controller method`;

export const ANTI_PATTERNS: {bad: string; good: string}[] = [
  {bad: 'new KafkaProducer per HTTP request', good: 'Reuse one producer (or factory singleton) per process'},
  {bad: 'send(r).get() on every record in a hot loop', good: 'Async send + periodic flush or batch futures'},
  {bad: 'Random keys for “scale”', good: 'Key = ordering boundary; fix hot keys explicitly'},
  {bad: 'Single partition “for order” on a busy topic', good: 'Order per key across many partitions'},
  {bad: 'Multi-MB records in Kafka', good: 'Object store + pointer event'},
  {bad: 'acks=1 for money', good: 'acks=all + minISR=2 + idempotence'},
  {bad: 'enable.idempotence=false to “go faster”', good: 'Keep idempotence; tune linger/batch instead'},
  {bad: 'Transactions for every single event', good: 'Idempotent produce; txn when multi-partition atomicity needed'},
  {bad: 'Shared transactional.id across pods', good: 'Unique stable id per instance — fencing otherwise'},
  {bad: 'Ignore callback errors', good: 'Metric + alarm + retry/compensate path'},
  {
    bad: 'Blindly raise buffer.memory / batch.size / linger / zstd and call it “tuning”',
    good: 'Use the high-throughput profile on purpose; measure queue-time, p99, GC, buffer-available-bytes, quotas',
  },
  {bad: 'Log full payloads + secrets', good: 'Log topic, partition, key hash, correlation id'},
  {bad: 'Assume Kafka txn fixes DB dual-write', good: 'Outbox or CDC'},
  {bad: 'Custom partitioner that ignores key order needs', good: 'Document the new order boundary'},
  {
    bad: 'Unlimited linger for “throughput” (or treat §16 batch↑+linger↑+zstd as an anti-pattern)',
    good: 'Cap linger vs SLO; batch/linger/zstd is a throughput trade-off when measured — anti-pattern is raising them blindly',
  },
  {
    bad: 'Treat “single-threaded Sender” as “only one thread may call send()”',
    good: 'Many app threads may call the thread-safe KafkaProducer; reuse one instance; one Sender owns I/O',
  },
];

export const SOURCE_CLASSES: string[][] = [
  ['KafkaProducer', 'Public API, send/flush/tx, thread-safe facade'],
  ['RecordAccumulator', 'Per-partition deque of ProducerBatch; linger/drain'],
  ['ProducerBatch', 'Mutable batch + records; closes for send'],
  ['BufferPool', 'Allocates free/occupied memory for batches'],
  ['Sender', 'Background loop: ready batches → requests → complete'],
  ['NetworkClient', 'Kafka protocol I/O, connections, in-flight'],
  ['Metadata', 'Cluster/topic/partition/leader cache'],
  ['TransactionManager', 'PID, epochs, AddPartitionsToTxn, EndTxn'],
  ['ProducerInterceptors', 'onSend / onAcknowledgement chain'],
];

export const PROTOCOL_ROWS: string[][] = [
  ['ApiVersions', 'Negotiate broker capabilities'],
  ['Metadata', 'Topics, partitions, leaders, ISR info'],
  ['Produce', 'Batches to leaders; acks in response'],
  ['InitProducerId', 'Allocate PID/epoch (idempotent/tx)'],
  ['AddPartitionsToTxn / EndTxn', 'Transactional produce'],
  ['FindCoordinator', 'Txn / group coordinators'],
];

export const CHEATS = {
  mental: `Log append client → leader only
Batch in memory → network efficiency
acks + ISR = durability story
PID+seq = retry-safe produce
txn.id = fence zombies / multi-partition atomic
outbox = DB truth`,
  lifecycle: `send → serialize → partition → accumulate → linger/full → compress → Produce → ack → callback`,
  retry: `delivery.timeout.ms is the budget
request.timeout.ms is one attempt
retry.backoff.* spaces attempts
idempotence makes retries safe in-log`,
  interview: `1) Trace send() internals
2) acks=1 vs all loss story
3) PID/epoch/seq + retry after ACK loss
4) max.in.flight reorder
5) timeout after broker wrote
6) outbox vs Kafka txn
7) same transactional.id zombie
8) partition count change remaps keys
9) advertised.listeners / k8s DNS
10) fatal vs retriable errors
11) flush vs close timeout
12) produce-throttle-time vs linger`,
};

export const DECISIONS: {q: string; a: string}[] = [
  {q: 'Use idempotence?', a: 'Yes by default (Kafka 3+/4.x). Only disable with a written reason.'},
  {q: 'Use transactions?', a: 'When you need atomic multi-partition produce or EOS read-process-write. Not for DB dual-write alone.'},
  {q: 'Use outbox?', a: 'When Postgres/MySQL commit and Kafka must not diverge.'},
  {q: 'Custom partitioner?', a: 'Only for explicit routing (tenant/shard) you can operate; test skew.'},
  {q: 'Increase partitions?', a: 'When parallelism or per-partition rate is saturated — know key remapping limits.'},
  {q: 'Increase batch.size?', a: 'When batches are full early and latency SLO allows; watch memory × partitions.'},
  {q: 'Increase linger.ms?', a: 'When queue-time is low and you want fuller batches; watch p99.'},
  {q: 'Enable compression?', a: 'Almost always in prod for JSON/Avro text-like payloads — prefer zstd/lz4.'},
  {q: 'Multiple producers?', a: 'Per process usually one. Multiple for isolation (different txn ids / clusters), not per request.'},
  {q: 'Multiple clusters?', a: 'DR / isolation / compliance — not one cluster per microservice by default.'},
];
