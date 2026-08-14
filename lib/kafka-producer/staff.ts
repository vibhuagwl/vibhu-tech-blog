/** Staff+ operational, protocol, and pathological producer gaps. */

export const PROTOCOL_EVOLUTION: string[][] = [
  ['ApiVersions first', 'Every new connection: client asks what APIs/versions the broker supports, then speaks the max mutually supported version.'],
  ['Produce v0–v2', 'Basic produce + timestamps (v2). No PID in batch.'],
  ['Produce v3+', 'Idempotent/transactional batches: PID, epoch, sequence, isTransactional in RecordBatch header.'],
  ['Produce v7+', 'zstd compression codec on the wire.'],
  ['Produce flexible (v9+)', 'Tagged fields / compact strings — version-dependent; client negotiates.'],
  ['Client/broker skew', 'Old client → new broker usually OK (negotiate down). New client → ancient broker may fail InitProducerId / idempotence.'],
  ['KRaft vs ZK (producer view)', 'Produce path is still “talk to partition leader”. Difference: metadata/controller. ZK-era: controller via ZK; KRaft: Raft metadata. Producers still use Metadata API; bootstrap still seeds discovery.'],
  ['Idempotence default era', 'Kafka 3.0+ client: enable.idempotence default true if no conflicts. Pre-3.0: often false — do not mix tribal memory with the JAR on the classpath.'],
];

export const WIRE_HEADER = `Request header (conceptual)
  api_key, api_version
  correlation_id     // echoed in response — match in-flight
  client_id
  (+ tagged fields on flexible versions)

Response header
  correlation_id
  (+ tagged fields)

Always: one TCP connection multiplexes many requests via correlation_id
and InFlightRequests.`;

export const PROTOCOL_APIS: {
  name: string;
  key: string;
  request: string;
  response: string;
  retry: string;
  broker: string;
}[] = [
  {
    name: 'ApiVersions',
    key: '18',
    request: 'Client software name/version (newer). Empty/simple on old versions.',
    response: 'error_code, api_keys[] {api_key, min_version, max_version}, throttle_time_ms',
    retry: 'On disconnect, reconnect and negotiate again. Fatal if broker too old for required APIs.',
    broker: 'Answer supported API range. Does not touch partition logs.',
  },
  {
    name: 'Metadata',
    key: '3',
    request: 'topics[] (or all), allow_auto_topic_creation flag, include_cluster/topic authorized ops (versioned)',
    response: 'brokers[] {node_id, host, port, rack}, controller_id / cluster_id, topics[] {error, partitions[] {leader, replicas, isr, leader_epoch}}',
    retry: 'Refresh on NotLeader*, unknown topic, metadata.max.age.ms. Retriable.',
    broker: 'Any broker can serve metadata. Leader info must be current enough to route Produce.',
  },
  {
    name: 'Produce',
    key: '0',
    request: 'acks / timeout / transactional_id (v3+), topic_data[] {partitions[] {records RecordBatch: magic, CRC, PID, epoch, baseSequence, records}}',
    response: 'responses[] {partition, error_code, base_offset, log_append_time, log_start_offset, record_errors[], error_message}, throttle_time_ms',
    retry: 'Retriable: NotLeaderOrFollower, NotEnoughReplicas, RequestTimedOut, ThrottlingQuotaExceeded, ConcurrentTransactions. Fatal: RecordTooLarge, InvalidPidMapping, ProducerFenced, ClusterAuthorization.',
    broker: 'Only the LEADER appends. Then replicate; respond per acks. Idempotent: dedupe on PID+epoch+seq.',
  },
  {
    name: 'InitProducerId',
    key: '22',
    request: 'transactional_id (nullable), transaction_timeout_ms, producer_id + producer_epoch (for keep-alive / bump)',
    response: 'throttle_time_ms, error_code, producer_id, producer_epoch',
    retry: 'Coordinator not available → retry FindCoordinator + Init. Concurrent transactions → retry. Fenced → fatal for that instance.',
    broker: 'Txn coordinator (or any broker for non-txn idempotent PID). Bump epoch for same transactional.id → fence zombies.',
  },
  {
    name: 'AddPartitionsToTxn',
    key: '24',
    request: 'transactional_id, producer_id, producer_epoch, topics[] {partitions[]}',
    response: 'throttle_time_ms, results per partition error_code',
    retry: 'Coordinator load / ConcurrentTransactions retriable. InvalidProducerEpoch / ProducerFenced fatal.',
    broker: 'Enlist partitions so commit/abort writes markers there. Produce of txn records still goes to partition leaders.',
  },
  {
    name: 'AddOffsetsToTxn',
    key: '25',
    request: 'transactional_id, producer_id, producer_epoch, group_id',
    response: 'throttle_time_ms, error_code',
    retry: 'Same class as other txn APIs. Needed for EOS consume-transform-produce.',
    broker: 'Enlist the __consumer_offsets partitions for that group into the txn.',
  },
  {
    name: 'EndTxn',
    key: '26',
    request: 'transactional_id, producer_id, producer_epoch, committed (bool)',
    response: 'throttle_time_ms, error_code',
    retry: 'UNKNOWN_SERVER_ERROR / coordinator failover — client must not double-commit blindly; TransactionManager tracks state. InvalidProducerEpoch fatal.',
    broker: 'Coordinator writes PREPARE_COMMIT/ABORT then asks leaders to write COMMIT/ABORT markers; visibility via LSO for read_committed.',
  },
];

export const ERROR_CLASSES: string[][] = [
  ['Retriable', 'NotLeaderOrFollower, LeaderNotAvailable, NotEnoughReplicas, RequestTimedOut, NetworkException, UnknownTopicOrPartition (often), ThrottlingQuotaExceeded, CoordinatorNotAvailable, ConcurrentTransactions', 'Sender retries within delivery.timeout.ms; metadata refresh as needed'],
  ['Fatal (close producer)', 'AuthenticationException, AuthorizationException (often), ProducerFencedException, OutOfOrderSequenceException (typical handling), UnsupportedVersionException, InvalidPidMappingException, RecordTooLargeException, SerializationException', 'Instance is poisoned. Close it. Create a new producer. Do not keep send()ing.'],
  ['Abortable (txn)', 'UnknownProducerId after log expiry, some InvalidTxnState, timeout mid-txn', 'abortTransaction() if possible, then begin a new txn. Do not commit unknown state.'],
  ['Application / non-retriable record', 'SerializationException, InvalidTopicException, RecordTooLargeException', 'This record fails; others may continue if producer still healthy'],
];

export const EXCEPTION_TREE = `KafkaException
  ├─ ApiException (broker error_code mapped)
  │    ├─ RetriableException          → Sender retries
  │    │    NotLeaderOrFollowerException
  │    │    NotEnoughReplicasException
  │    │    TimeoutException (often)
  │    │    ThrottlingQuotaExceededException
  │    ├─ AuthorizationException / TopicAuthorizationException
  │    ├─ AuthenticationException / SslAuthenticationException
  │    ├─ ProducerFencedException     → FATAL for this instance
  │    ├─ OutOfOrderSequenceException → usually FATAL for idempotent producer
  │    ├─ InvalidProducerEpochException
  │    ├─ RecordTooLargeException
  │    └─ UnknownTopicOrPartitionException
  ├─ SerializationException           → before network
  └─ InterruptException / IllegalStateException after close`;

export const AFTER_FATAL = `After a fatal producer error:
  1. Callbacks/Futures complete exceptionally
  2. Sender may refuse new sends (IllegalStateException)
  3. You MUST close() the producer
  4. New KafkaProducer → new PID (or InitProducerId with bumped epoch if transactional.id reused)
  5. In-flight unsent batches are NOT magically recovered — app must decide replay from source (outbox)`;

export const SHUTDOWN_ROWS: string[][] = [
  ['flush()', 'Block until all buffered + in-flight records are sent and acked (or fail). Producer stays open. Use before a quiet checkpoint.'],
  ['close()', 'flush() then stop Sender, close sockets. Further send() is illegal.'],
  ['close(Duration)', 'Try to complete within timeout. Remaining records may be dropped — treat as possible loss unless outbox can replay.'],
  ['Graceful k8s', 'SIGTERM → Spring DisposableBean/KafkaProducer.close(timeout) → pod exit. PreStop hook must exceed close timeout + linger.'],
  ['App crash / kill -9', 'No flush. Unsent accumulator batches gone. Broker-acked records are durable. Dual-write hole unless outbox.'],
  ['JVM shutdown hook', 'Do not rely on Kafka to register a hook for you. Spring/app must close the producer. Hooks can race with logging shutdown.'],
  ['Unsent during shutdown', 'linger batches not yet drained, in-flight Produce without response, txn not EndTxn’d → abort or unknown.'],
  ['Timeout on close', 'Assume unknown outcome for remaining records. Idempotent retry on a NEW producer does not share PID unless transactional.id + InitProducerId recovery — still prefer outbox replay.'],
];

export const FENCING_ROWS: string[][] = [
  ['Same transactional.id, two live instances', 'InitProducerId on B bumps epoch. A is fenced. A.send → ProducerFencedException. Correct: unique txn id per pod (payment-api-${pod}) or StatefulSet ordinal.'],
  ['Rolling deploy overlap', 'Old replica + new replica both up. If they share txn id, the newer InitProducerId wins; old becomes zombie. Expected if you reuse the id; design for it or unique ids.'],
  ['K8s restart', 'New pod InitProducerId fences the dead pod’s epoch — good. In-flight txn of the dead pod is aborted by coordinator.'],
  ['Network partition zombie', 'A cannot talk to coordinator but still thinks it owns the epoch. B starts, fences A. A’s later Produce/EndTxn rejected. App must stop on fence — never ignore it.'],
  ['Idempotent without transactional.id', 'PID is per producer instance, not a stable identity across restarts. Restarts get a new PID — fencing of “the old process” is not the txn fencing story.'],
];

export const TOPIC_LIFECYCLE: string[][] = [
  ['auto.create.topics.enable (broker)', 'Prod: false. Typo topics are incidents, not features.'],
  ['allow.auto.create.topics (client)', 'Even if broker allows, keep false in apps.'],
  ['Topic does not exist', 'UnknownTopicOrPartition / timeout waiting metadata. Do not retry forever without alerting.'],
  ['Partition count increases', 'Partitioner uses NEW numPartitions. hash(key) % N changes for many keys. Historical records stay on old partitions. Per-key order is NOT preserved across the cut for keys that remapped.'],
  ['Partition count decrease', 'Not a supported live shrink in classic Kafka — treat as migration to a new topic.'],
  ['Leader election', 'NotLeaderOrFollower → metadata refresh → Produce to new leader. Offsets do not rewind because of election.'],
  ['Partition reassignment', 'Replicas move; leadership may move. Producers only care that Metadata leaders update. Brief produce errors, then retry.'],
  ['Preferred leader election', 'Leadership returns to preferred replica (often first in replica list) to rebalance produce load. Producers follow metadata. Watch request-latency during PLE.'],
];

export const QUOTA_ROWS: string[][] = [
  ['<client-id> quota', 'quota.producer.default / kafka-configs --add-config producer_byte_rate'],
  ['<user> quota', 'SASL user based'],
  ['<user, client-id>', 'Most specific wins'],
  ['What throttle feels like', 'Broker delays ProduceResponse; throttle_time_ms > 0. App sees latency, not always an exception.'],
  ['Metrics', 'produce-throttle-time-avg/max on kafka.producer:type=producer-metrics. Also broker quota-metrics.'],
  ['Misdiagnosis', 'Raising linger because p99 rose — check throttle-time first.'],
];

export const RACK_ROWS: string[][] = [
  ['broker.rack', 'Broker config used by replica placement (rack-aware replica assignment).'],
  ['Who the producer writes', 'Always the partition LEADER. Producers do not write followers. Do not confuse with consumer replica.selector.class / follower fetch (KIP-392) which is a READ path.'],
  ['AZ failure + acks=all', 'If ISR still ≥ minISR (typical RF=3, minISR=2, racks=3 AZs) produces continue. If minISR=3, one AZ death blocks produces.'],
  ['Produce traffic after AZ loss', 'All leaders may concentrate on remaining AZs → NIC/disk hot spots until preferred leaders rebalance.'],
  ['Metadata rack field', 'Broker rack is in Metadata response — used by clients that implement rack-aware replica selection for reads, not for Produce routing.'],
];

export const DNS_ROWS: string[][] = [
  ['advertised.listeners', 'What producers MUST reach. If you advertise localhost or an internal-only k8s DNS name, external producers fail after metadata (bootstrap worked, Produce fails). Classic bug.'],
  ['bootstrap vs advertised', 'bootstrap.servers only for first hop. Subsequent connections use advertised host:port from Metadata.'],
  ['JVM DNS cache', 'networkaddress.cache.ttl / negative.ttl. Stale IPs after broker move. Restart or short TTL in apps.'],
  ['IPv4 / IPv6', 'Dual stack mismatches (A vs AAAA) → random connect failures. Prefer consistent family.'],
  ['NAT / L4 load balancer', 'Do not hide all brokers behind one NLB VIP as if it were one node. Sticky or pass-through still breaks advertised.listeners unless each broker is reachable on its advertised address.'],
  ['Kubernetes', 'headless Service per broker, advertised.listeners = pod DNS or external ingress per broker. NetworkPolicy must allow producer → broker 9092/9093.'],
];

export const AUTH_LIFECYCLE: string[][] = [
  ['SASL handshake', 'After TCP (+TLS), SaslHandshake then authenticate. Produce cannot start before this.'],
  ['connections.max.reauth.ms', 'Broker/session can require SASL re-authentication on long-lived connections (KIP-368). Client reauths without full reconnect when supported.'],
  ['Password / SCRAM rotation', 'Old connections may live until reauth/idle close. New connections use new JAAS. Coordinate rotation windows; don’t cut old secret instantly without overlap.'],
  ['Certificate rotation', 'Default Java SSLContext often loaded at producer construction. Rolling certs typically need producer rebuild (Spring factory reset) or a reloading SslEngineFactory. Expired cert → SslAuthenticationException on new conns.'],
  ['Keystore vs truststore', 'Client keystore = mTLS identity. Truststore = broker CA. Rotate both on CA change.'],
  ['OAUTHBEARER', 'Token expiry requires refresh callback. Failed refresh → auth exceptions, connection recreation.'],
];

export const JVM_ADV: string[][] = [
  ['JMX', 'kafka.producer:type=producer-metrics,client-id=X and producer-topic-metrics, producer-node-metrics. Enable via JMX exporter / Java agent.'],
  ['Micrometer → Prometheus', 'Spring Kafka / micrometer-registry-prometheus: kafka.producer.record.send, .record.error, .record.retry, .request.latency, .io.wait, throttle binders. Name prefix kafka_producer_* after scrape.'],
  ['OpenTelemetry', 'opentelemetry-kafka-clients instrumentation: spans around send, inject W3C traceparent into headers. Sampling 100% on payment produce can explode cost — tail-sample errors.'],
  ['Interceptor metrics', 'onSend / onAcknowledgement: increment counters, never block. Failures in interceptor can fail the send.'],
  ['Custom serializer perf', 'Avoid per-record mapper/ObjectMapper allocate-storm. Reuse; consider Afterburner/Jackson afterburner, Avro binary, pooled buffers.'],
  ['Zero-copy (honest)', 'Producer path is not sendfile from user payload. “Zero-copy” at broker is between page cache and socket for FETCH. Producer still copies into RecordBatch / ByteBuffer.'],
  ['GC pressure', 'JSON POJO → bytes allocates. Huge batches → large byte[] on heap (buffer.memory is heap ByteBuffers by default). Watch allocation rate, not just heap size.'],
  ['Native vs heap', 'buffer.memory is JVM heap via BufferPool (java.nio.HeapByteBuffer typically). Direct buffers appear more in NetworkClient I/O. Don’t tune -XX:MaxDirectMemorySize expecting it to replace buffer.memory.'],
  ['CPU profiling', 'async-profiler: serialization, compression (zstd/gzip), checksum/CRC, Jackson. Compression CPU vs network is the usual trade.'],
  ['Packet-level', 'tcpdump/Wireshark on 9092: TLS blocks you — use a debug plaintext listener in a lab only. Look for retransmits, window full, many small Produce requests (batching broken).'],
];

export const CORNER_ACK_CRASH: string[][] = [
  ['idempotence OFF, acks=1', 'Leader wrote, crashed before ACK. Retry may hit new leader. If old write survived on that replica elected leader → DUPLICATE in log. If write not in ISR and unclean/out-of-ISR issues → LOSS possible.'],
  ['idempotence OFF, acks=all', 'Write waited ISR. Crash before ACK still → retry can DUPLICATE without PID/seq. Loss unlikely if ISR had it and unclean election off.'],
  ['idempotence ON, acks=1', 'Idempotence requires acks=all — config conflict. Kafka 4.x: enabling idempotence forces/requires all. Don’t claim this combo in prod.'],
  ['idempotence ON, acks=all', 'Retry with same PID+epoch+seq. Broker dedupes. One log append. Producer eventually succeeds (or times out with unknown — but no dup).'],
  ['transaction ON', 'Records sit uncommitted until EndTxn. Crash/retry: txn may abort; read_committed consumers never see aborted. Duplicate committed txn still needs a new txn + business idempotency if app retries the whole unit.'],
];

export const CORNER_FENCE = `Producer A (transactional.id=payments-1, epoch=7)
  network blip / slow
Producer B starts with same transactional.id
  InitProducerId → epoch=8
  A is zombie
A.send / A.commitTransaction
  → ProducerFencedException / InvalidProducerEpoch
Correct: stop A, never retry that instance
K8s: transactional.id=payments-\${pod} so rolling deploys do not fence the peer`;

export const CORNER_PARTITIONS = `Topic payments partitions=6
key=account:A100 → murmur2 % 6 = partition 2
Admin increases partitions to 12
NEW produce: murmur2 % 12 = maybe partition 8
OLD records for A100 remain on p2
Ordering per key across the cut is BROKEN
  (p2 history then p8 future — consumers do not merge)
Interview: “increasing partitions preserves key order” is FALSE
Mitigation: new topic + dual-write, or accept split, or pause and migrate`;
