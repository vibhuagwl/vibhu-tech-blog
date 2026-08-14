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
  → ProducerBatch (many records, one partition)
  → ProduceRequest (one or more batches to a broker)
  → Kafka Log Entry (offset assigned by leader)`;

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
  ['Null key', 'Sticky / uniform sticky batching to a partition (modern clients)', 'Version-sensitive — verify client docs; not round-robin-per-record anymore'],
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

buffer.memory too small vs (batch.size × active partitions)
  → max.block.ms waits → TimeoutException under load`;

export const PROFILES: {name: string; goal: string; code: string}[] = [
  {
    name: 'Low latency',
    goal: 'Minimize queueing; accept lower batching efficiency',
    code: `linger.ms=0
batch.size=16384
compression.type=lz4
acks=all
enable.idempotence=true`,
  },
  {
    name: 'High throughput',
    goal: 'Fill batches, compress, keep connections busy',
    code: `linger.ms=20-50
batch.size=65536-131072
compression.type=zstd
buffer.memory=67108864
acks=all
enable.idempotence=true`,
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
  {bad: 'Blindly raise buffer.memory / batch.size', good: 'Measure queue-time, latency, GC, broker quotas'},
  {bad: 'Log full payloads + secrets', good: 'Log topic, partition, key hash, correlation id'},
  {bad: 'Assume Kafka txn fixes DB dual-write', good: 'Outbox or CDC'},
  {bad: 'Custom partitioner that ignores key order needs', good: 'Document the new order boundary'},
  {bad: 'Unlimited linger for “throughput”', good: 'Cap linger vs SLO latency'},
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
