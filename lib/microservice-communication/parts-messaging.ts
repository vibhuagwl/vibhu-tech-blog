import type {CommSection} from './types';

export const MESSAGING: CommSection[] = [
  {
    id: 'kafka-producer-deep',
    title: 'Kafka Producer — Deep Dive',
    what:
      'Kafka producer client serializes records, chooses partition via key hash or sticky batching, accumulates batches in `RecordAccumulator`, and sends to partition leader with configurable `acks`, retries, compression, and idempotence. Java client: `KafkaProducer` / Spring `KafkaTemplate`.',
    why:
      'Producer configuration determines durability-latency trade-off. Misconfigured acks=1 or retries without idempotence causes lost or duplicate messages under broker failure.',
    when:
      'Every event emit from Spring Boot 3 service. Financial and order events: `acks=all`, idempotent producer, `min.insync.replicas=2`. Fire-and-forget metrics: `acks=1` acceptable.',
    how:
      'Boot 3: `spring.kafka.producer.acks=all`, `retries=2147483647`, `enable.idempotence=true`, `linger.ms=5`, `batch.size=16384`, `compression.type=lz4`. `KafkaTemplate.send(topic, key, value)` — key drives partition. Callback or `CompletableFuture` for failure handling. Custom `ProducerInterceptor` for trace headers.',
    flow: `sequenceDiagram
  participant App as Producer app
  participant Acc as RecordAccumulator
  participant Br as Broker leader
  App->>Acc: send(key, value)
  Acc->>Acc: batch by partition
  Acc->>Br: Produce request
  Br-->>Acc: ack offset
  Acc-->>App: callback success`,
    failure:
      'No key on ordering-critical events — random partition. `buffer.memory` exhausted — `RecordTooLargeException` or block. Idempotence disabled + retries → duplicates. `max.in.flight.requests.per.connection>5` without idempotence → reorder risk.',
    tradeoff:
      'acks=all + minISR=2: durable, higher latency. acks=1: faster, lose on leader crash before replicate.',
    security:
      'SASL/SCRAM or mTLS to brokers. ACL: producer principal WRITE on topic. Encrypt sensitive fields in payload — Kafka ACLs do not protect message body.',
    observability:
      'Metrics: `record-error-rate`, `request-latency-avg`, `batch-size-avg`, `buffer-available-bytes`. Trace via OpenTelemetry Kafka instrumentation propagating headers.',
    trap:
      'Assuming `send()` synchronous success — it is async; process failures in callback or flush() before shutdown.',
    interviewAnswer:
      'Kafka producer batches records per partition, sends to leader with acks controlling durability. I use acks=all, enable.idempotence=true, and retries for production events. Partition key ensures per-key ordering. send() is async — must handle failures in callback and flush on shutdown.',
    remember: [
      'acks=all + minISR for durability',
      'enable.idempotence=true with retries',
      'Key hash → partition → per-key ordering',
      'send() async — callback or flush on shutdown',
    ],
    oneLiner: 'Producer batches to partition leaders — acks, idempotence, and key define durability and order.',
  },
  {
    id: 'kafka-topic-partition',
    title: 'Kafka Topic & Partition',
    what:
      'Topic is logical stream name with config (retention, RF, cleanup). Partition is ordered append-only log — unit of parallelism, replication, and per-key ordering. More partitions = more parallel consumers and producers but more broker metadata overhead.',
    why:
      'Single partition caps throughput (~MB/s per partition typical ceiling). Partition count is hard to reduce later. Topic design bounds domain ACLs and retention policies.',
    when:
      'Design phase: partition count from `max(ceil(producer_MB/s ÷ per_partition_MB/s), consumer_parallelism)`. Compact topic for changelog; delete retention for event streams.',
    how:
      'Create: `kafka-topics --create --topic order.events.v1 --partitions 12 --replication-factor 3`. Spring `@Topic(name="order.events.v1", partitions=12, replicas=3)`. Hot key problem: split by compound key or salt then downstream reorder.',
    flow: `flowchart TB
  T[Topic order.events.v1]
  T --> P0[Partition 0 log]
  T --> P1[Partition 1 log]
  T --> P2[Partition 2 log]
  K[key hash] --> P1`,
    failure:
      'Too few partitions — consumer group cannot scale past partition count. Too many — controller metadata lag, rebalance storms. RF=1 in prod — data loss on broker death.',
    tradeoff:
      'Partitions enable scale; cross-partition ordering not guaranteed. Increasing partitions does not split existing keys retroactively.',
    security:
      'Topic ACL per service principal. Separate topics per tenant only at scale — prefer keyed messages with consumer filter.',
    observability:
      'Per-partition bytes-in, leader skew, under-replicated partitions. Alert hot partition — one partition 10x traffic of peers.',
    trap:
      'Consumer instances > partition count — excess consumers idle forever.',
    interviewAnswer:
      'Partition is the unit of ordering and parallelism in Kafka. Messages with same key go to same partition. Consumer group max parallelism equals partition count. I size partitions from throughput and consumer count, plan RF=3 multi-AZ, and cannot easily reduce partition count later.',
    remember: [
      'Ordering guaranteed per partition only',
      'Max consumers in group = partition count',
      'Partition count hard to decrease',
      'RF=3 typical production multi-AZ',
    ],
    oneLiner: 'Partition = ordered log + parallelism unit; key maps to partition for ordering scope.',
  },
  {
    id: 'kafka-consumer-group',
    title: 'Kafka Consumer Group & Rebalance',
    what:
      'Consumers sharing same `group.id` divide partitions — each partition consumed by exactly one consumer in group. Coordinator assigns partitions; rebalance on member join/leave/heartbeat timeout moves partition ownership.',
    why:
      'Horizontal scale consumption by adding consumer instances up to partition count. Different groups read same topic independently — order service and analytics both consume `order.events.v1` with different group ids.',
    when:
      'Spring `@KafkaListener(groupId="payment-processor")`. Scale Deployment replicas = consumer instances. Static membership reduces rebalance on rolling deploy.',
    how:
      'Boot 3: `spring.kafka.consumer.group-id=payment-processor`, `enable-auto-commit=false` (manual ack preferred). `@KafkaListener(topics="order.events.v1", concurrency=3)` — concurrency ≤ partitions on that listener. `CooperativeStickyAssignor` reduces stop-the-world rebalance.',
    flow: `sequenceDiagram
  participant C as Group coordinator
  participant A as Consumer A
  participant B as Consumer B
  A->>C: join group payment-processor
  B->>C: join group
  C->>A: assign P0 P1
  C->>B: assign P2 P3
  Note over A,B: rebalance on B crash`,
    failure:
      'Rebalance storm during deploy — all consumers stop processing. `max.poll.interval.ms` exceeded on slow handler — consumer kicked, rebalance loop. Two listeners same group different topics — unintended sharing.',
    tradeoff:
      'More consumers improve throughput until partition limited; rebalance pauses consumption during assignment.',
    security:
      'ACL: consumer group READ on topic + READ on `__consumer_offsets`. Group id naming convention prevents accidental cross-env consumption.',
    observability:
      'Metrics: `records-lag-max`, rebalance rate, `time-between-poll-avg`. Alert lag growing > SLA. Log partition assignment on rebalance.',
    trap:
      'concurrency=10 with 3 partitions — 7 threads idle; concurrency does not create partitions.',
    interviewAnswer:
      'Consumer group members share partition assignment — one consumer per partition max. Adding consumers scales until partition count. Rebalance on member change pauses consumption — I use cooperative assignor and static group instance id for rolling deploys. Different group ids = independent consumers of same topic.',
    remember: [
      'One partition → one consumer in group',
      'Rebalance pauses processing',
      'CooperativeStickyAssignor for smoother deploy',
      'max.poll.interval.ms for slow handlers',
    ],
    oneLiner: 'Group divides partitions across consumers; rebalance on membership change pauses consumption.',
  },
  {
    id: 'kafka-offsets-commit',
    title: 'Kafka Offsets & Commit Strategy',
    what:
      'Offset is position in partition log. Consumer commits offset to `__consumer_offsets` after processing — defines at-least-once (commit after process) vs at-most-once (commit before). Spring `Acknowledgment.acknowledge()` triggers commit.',
    why:
      'Wrong commit order causes duplicates or lost messages. Auto-commit with long processing — message reprocessed on crash after commit but before finish.',
    when:
      'Manual ack: financial processing, inbox pattern. Auto-commit: metrics, idempotent aggregation. Sync commit for testing; async commit for throughput.',
    how:
      'Boot 3: `enable-auto-commit=false`, `AckMode.MANUAL_IMMEDIATE` or `BATCH`. `@KafkaListener` + `Acknowledgment ack` — ack after DB commit in same transactional listener. Store offset in DB with inbox for EOS-ish semantics.',
    flow: `sequenceDiagram
  participant K as Kafka
  participant C as Consumer
  participant DB as Database
  K->>C: poll records offset 100
  C->>DB: process + inbox TX
  DB-->>C: commit TX ok
  C->>K: commit offset 101`,
    failure:
      'Ack before DB commit — message lost on crash after ack. No ack on success — infinite redelivery. Commit offset 101 but processed 100 only — gap. `__consumer_offsets` compaction lag hides true lag.',
    tradeoff:
      'Manual ack + TX: safer, slower. Auto-commit: faster, duplicates or gaps on failure.',
    security:
      'Offset commit principal needs WRITE on internal topic — restrict to service account.',
    observability:
      'Consumer lag per partition: `kafka.consumer:lost-time` or Burrow. Compare committed offset vs log end offset.',
    trap:
      'Transactional Kafka producer + consumer EOS across DB — Kafka TX does not include your Postgres; use inbox/outbox.',
    interviewAnswer:
      'Offset commit marks what consumer considers done. At-least-once: process then commit offset — duplicates on crash before commit. I use manual ack after database transaction commits in inbox pattern. Kafka exactly-once streams EOS is within Kafka ecosystem — cross DB needs outbox/inbox.',
    remember: [
      'Commit after process = at-least-once',
      'Ack after DB TX in inbox pattern',
      'Auto-commit risky for slow handlers',
      'EOS Kafka TX ≠ cross-database TX',
    ],
    oneLiner: 'Offset marks consumption progress — commit timing defines at-least-once vs at-most-once.',
  },
  {
    id: 'kafka-dlq',
    title: 'Kafka DLQ — Dead Letter Queue',
    what:
      'Failed messages after max retries route to dead-letter topic (DLQ) for inspection, manual replay, or automated repair — instead of infinite redelivery blocking partition or poison-pill looping.',
    why:
      'One bad JSON message at offset 500 prevents processing 501+ if consumer stops. DLQ isolates poison while main consumer advances. Operations gets visibility into failures.',
    when:
      'Every production consumer with non-trivial deserialization or external API calls. Pattern: retry topic with delay + DLQ topic `order.events.v1.dlq`.',
    how:
      'Spring Kafka `DefaultErrorHandler` with `DeadLetterPublishingRecoverer` → publish to `topic.DLT` with headers: `original-topic`, `original-offset`, `exception-message`. `FixedBackOff(1000L, 3)` before DLQ. Monitor DLQ lag; replay tool copies back to source with fixed payload.',
    flow: `flowchart LR
  Main[order.events.v1] --> C[Consumer]
  C -->|fail 3x| DLQ[order.events.v1.DLT]
  DLQ --> Ops[Replay / fix tool]
  Ops --> Main`,
    failure:
      'DLQ without alert — failures invisible until audit. DLQ same retention as main — fills disk. Replay without fix — poison returns. DLQ key null — loses ordering context.',
    tradeoff:
      'DLQ adds topics and ops process; without DLQ one poison blocks or loses data silently.',
    security:
      'DLQ contains same PII as source — same ACL tier. Restrict replay tooling to break-glass roles.',
    observability:
      'Alert DLQ rate > 0 sustained. Dashboard DLQ message headers for exception class distribution.',
    trap:
      'Seek past bad offset without DLQ — silent data loss for that message.',
    interviewAnswer:
      'Dead letter queue captures messages that fail processing after retries. Spring Kafka DeadLetterPublishingRecoverer sends to topic.DLT with metadata headers. I alert on any DLQ traffic, fix root cause, and replay with corrected code or payload — never auto-replay blindly.',
    remember: [
      'DLQ isolates poison messages',
      'Headers preserve original offset/topic',
      'Alert on DLQ — not a silent dump',
      'Replay only after fixing root cause',
    ],
    oneLiner: 'DLQ captures poison messages after retries — alert, fix, replay safely.',
  },
  {
    id: 'kafka-idempotency-eos',
    title: 'Kafka Idempotency & Exactly-Once Semantics',
    what:
      'Idempotent producer assigns PID + sequence per partition — broker dedupes retries within session. EOS streams: transactional producer `initTransactions` + `sendOffsetsToTransaction` — atomic write to output topic and consumer offset. Consumer-side inbox/outbox extends idempotency to business DB.',
    why:
      'At-least-once delivery + retries = duplicates without idempotence. Payment charged twice on redelivery. Producer idempotence fixes broker retry duplicates; consumer inbox fixes redelivery duplicates.',
    when:
      'Producer: always enable idempotence for critical topics. EOS: Kafka Streams, connect internal pipelines — rarely raw Spring `@KafkaListener` to DB without inbox.',
    how:
      'Producer: `enable.idempotence=true` (sets acks=all, retries, in.flight=5). Consumer inbox: `INSERT message_id PK` in same TX as business write. Idempotency-Key in event payload for business-level dedupe beyond transport offset.',
    flow: `sequenceDiagram
  participant P as Idempotent producer
  participant B as Broker
  participant C as Consumer + inbox
  P->>B: seq 1 ok
  P->>B: seq 1 retry duplicate
  B-->>P: dedupe ok
  C->>C: inbox PK prevents reprocess`,
    failure:
      'Producer idempotence session expires — new PID, duplicate possible if old retry arrives late. Inbox only transport id — business duplicate with different offset still double-charges.',
    tradeoff:
      'Producer idempotence: small latency overhead, per-partition state. Full EOS limited to Kafka-native pipelines.',
    security:
      'Transactional id `transactional.id` per app instance — ACL WRITE on transactional ids.',
    observability:
      'Producer `producer-id-expiration` metrics. Consumer `inbox_duplicate_skip_total`.',
    trap:
      'enable.idempotence without acks=all — config overridden automatically but verify broker minISR.',
    interviewAnswer:
      'Idempotent producer uses PID and sequence numbers so broker dedupes producer retries. Consumer at-least-once still needs inbox or business idempotency key. Kafka EOS transactional API covers produce + offset commit in Kafka — crossing to Postgres requires outbox/inbox. I always enable idempotent producer for critical events.',
    remember: [
      'Producer idempotence = PID + sequence dedupe',
      'Consumer still needs inbox for redelivery',
      'EOS in Kafka ≠ EOS across DB',
      'Business idempotency key for domain dupes',
    ],
    oneLiner: 'Idempotent producer dedupes retries; inbox/idempotency key handles consumer redelivery.',
  },
  {
    id: 'broker-comparison-matrix',
    title: 'Broker Comparison Matrix',
    what:
      'Message brokers differ on persistence model, ordering guarantees, protocol, ops complexity, and cloud managed offerings. Kafka: distributed log. RabbitMQ: smart broker dumb consumer. SQS/SNS: managed queue/topic AWS. Pub/Sub: GCP. ASB: Azure.',
    why:
      'Wrong broker choice — ops burden or missing features. Interview expects articulate Kafka vs Rabbit vs SQS trade-offs for given workload.',
    when:
      'Architecture decision for new event backbone. Kafka: high-throughput event streaming. Rabbit: task queues routing. SQS: simple AWS decoupling. SNS+SQS fan-out AWS-native.',
    how:
      'Spring Boot: `spring-kafka`, `spring-rabbit`, `spring-cloud-aws` SQS. Hybrid: outbox to Kafka, SQS for per-tenant work queues. See comparison table.',
    flow: `flowchart TB
  subgraph Kafka
    K[Log retention replay]
  end
  subgraph Rabbit
    R[Exchange routing]
  end
  subgraph AWS
    SNS[SNS fan-out] --> SQS[SQS queue]
  end`,
    failure:
      'Kafka as task queue without consumer — retained messages replay storm. SQS visibility timeout too short — duplicate work. Rabbit without DLQ — poison blocks.',
    tradeoff:
      'Kafka: scale and replay, higher ops. Managed SQS: simple, no replay without extra design. Rabbit: flexible routing, broker CPU bottleneck.',
    security:
      'Per-broker IAM/SASL/ACL model. Encrypt payloads at app layer for multi-tenant SaaS.',
    observability:
      'Broker-native metrics + unified tracing across publish/consume.',
    trap:
      'SNS alone without SQS — no persistence if no subscriber online.',
    interviewAnswer:
      'Kafka is a durable distributed log with replay and high throughput — best for event streaming. RabbitMQ excels at routing and task queues with lower ops than Kafka cluster. SQS is fully managed at-least-once queue — simple but no log replay. SNS is fan-out notification — pair with SQS for persistence. I pick Kafka for event backbone; SQS for simple job queues on AWS.',
    remember: [
      'Kafka = log, replay, stream processing',
      'Rabbit = routing, task queue, broker-centric',
      'SQS = managed queue, no native replay',
      'SNS fan-out needs SQS for persistence',
    ],
    oneLiner: 'Kafka for streaming/replay; Rabbit for routing; SQS/SNS for managed AWS decoupling.',
    tables: [
      {
        headers: ['Broker', 'Model', 'Ordering', 'Replay', 'Best for'],
        rows: [
          ['Kafka', 'Distributed log', 'Per partition', 'Yes — retained', 'Event streaming, high throughput'],
          ['RabbitMQ', 'Queue + exchange', 'Per queue (single consumer)', 'Limited', 'Task queues, routing'],
          ['AWS SQS', 'Managed queue', 'FIFO option only', 'No (delete on ack)', 'Simple decoupling, jobs'],
          ['AWS SNS', 'Pub/sub topic', 'None', 'No', 'Fan-out notifications'],
          ['GCP Pub/Sub', 'Managed topic/sub', 'Per ordering key', 'Retention window', 'GCP-native events'],
          ['Azure ASB', 'Queue or topic', 'Sessions/partitions', 'Peek-lock replay', 'Azure enterprise messaging'],
        ],
      },
      {
        headers: ['Broker', 'Ops burden', 'Spring Boot starter'],
        rows: [
          ['Kafka', 'High — cluster tuning', 'spring-kafka'],
          ['RabbitMQ', 'Medium', 'spring-rabbit'],
          ['SQS', 'Low — managed', 'spring-cloud-aws'],
          ['SNS', 'Low', 'spring-cloud-aws'],
          ['Pub/Sub', 'Low', 'spring-cloud-gcp-pubsub'],
          ['ASB', 'Low-Medium', 'spring-cloud-azure-servicebus'],
        ],
      },
    ],
  },
  {
    id: 'event-driven-fanout',
    title: 'Event-Driven Fan-Out',
    what:
      'Single domain event published once; multiple independent consumers react — notification, analytics, inventory, search index — without orchestrator calling each service synchronously. Kafka consumer groups or SNS→multiple SQS subscriptions implement fan-out.',
    why:
      'Decouples producers from consumer count and failure. New subscriber added without changing order service. Scales each consumer path independently.',
    when:
      'OrderCreated → email, warehouse, CRM, data lake. Avoid sync orchestrator calling 8 HTTP endpoints on critical path.',
    how:
      'Kafka: one topic `order.events.v1`, groups `notification`, `warehouse`, `analytics` each consume all messages. SNS→SQS: one SNS topic, three SQS queue subscriptions with filter policies. Boot 3: single outbox event, multiple topics only if different retention/ACL needs.',
    flow: `flowchart TB
  O[Order service] -->|OrderCreated| T[order.events.v1]
  T --> G1[notification group]
  T --> G2[warehouse group]
  T --> G3[analytics group]`,
    failure:
      'Fan-out without idempotent consumers — one event N services N failure modes. Slow analytics consumer lags — does not block notification if separate groups. Shared consumer group by mistake — only one service gets events.',
    tradeoff:
      'Choreography fan-out: loose coupling, harder global view. Orchestration: visible saga, central bottleneck.',
    security:
      'Each consumer ACL READ only on topic. Filter policies prevent warehouse consumer seeing PII fields — use separate compacted identity topic.',
    observability:
      'Lag per consumer group on same topic. End-to-end trace: event id in all child processing spans.',
    trap:
      'Multiple groups is fan-out; multiple consumers in ONE group is load-sharing not fan-out.',
    interviewAnswer:
      'Event fan-out publishes once and multiple consumer groups each process every message independently. Kafka separate group ids per downstream service. On AWS SNS fans to many SQS queues. I use fan-out to keep order service fast — it emits one event; notification and warehouse scale independently with own consumer lag SLAs.',
    remember: [
      'One publish, many consumer groups',
      'Groups independent — lag isolated',
      'SNS → multiple SQS subscriptions',
      'Not the same as consumers in one group',
    ],
    oneLiner: 'One event, many independent consumer groups — decoupled parallel reactions.',
  },
  {
    id: 'when-kafka-beats-rest',
    title: 'When Kafka Beats REST',
    what:
      'Choose Kafka over synchronous REST when: high-throughput fire-and-forget emit, multiple subscribers need same event, replay/audit required, peak load buffering, or caller cannot block on downstream slowness. REST wins for immediate query/response and simple two-party CRUD.',
    why:
      'REST sync chains multiply latency; Kafka decouples time — producer ms, consumer processes at own pace. Buffer absorbs spikes without dropping mobile clients.',
    when:
      'Kafka > REST: order placed → notify + analytics + search (fan-out). Audit log. CDC pipeline. REST > Kafka: getAccountBalance, authorizePayment (immediate answer). Command-query separation: write event, read REST from materialized view.',
    how:
      'Hybrid Boot 3: `POST /orders` saves + outbox → 202 with orderId; `GET /orders/{id}` reads DB. Critical authorize stays sync REST with timeout + idempotency. CQRS: consumer builds read model, API serves reads.',
    flow: `flowchart LR
  subgraph Sync REST
    C[Client] -->|need answer now| API
  end
  subgraph Async Kafka
    API2[API] -->|emit| K[Kafka]
    K --> W1[Worker]
    K --> W2[Analytics]
  end`,
    failure:
      'Kafka for request-reply when user waits — wrong tool, adds correlation complexity. REST for fire-and-forget notify — ties up HTTP connection.',
    tradeoff:
      'Kafka: complexity, eventual consistency. REST: simple, immediate consistency on single service read.',
    security:
      'Async does not reduce auth — consumers validate event signature or source principal.',
    observability:
      'Define SLAs: sync API p99 vs event processing lag. Alert when user-facing read model lag exceeds stale tolerance.',
    trap:
      'Kafka request-reply pattern to avoid REST — usually worse than HTTP with good timeouts.',
    interviewAnswer:
      'I use Kafka when I need fan-out, replay, buffering, or fire-and-forget side effects. I use REST when the caller needs an immediate authoritative answer or simple two-party mutation with idempotency keys. Hybrid is normal: sync write API returns 202, async consumers process; reads from materialized view or sync GET when freshness matters.',
    remember: [
      'Kafka: fan-out, replay, buffer, async side effects',
      'REST: immediate response, query, simple CRUD',
      'Hybrid 202 + outbox common pattern',
      'Avoid Kafka request-reply for user waits',
    ],
    oneLiner: 'Kafka for fan-out, replay, and buffering; REST when caller needs immediate answer.',
    tables: [
      {
        headers: ['Criterion', 'Prefer Kafka', 'Prefer REST'],
        rows: [
          ['Response needed now', 'No', 'Yes'],
          ['Multiple subscribers', 'Yes', 'No — N sync calls'],
          ['Replay / audit log', 'Yes', 'No'],
          ['Peak load buffering', 'Yes', 'No — caller blocks'],
          ['Simple two-service CRUD', 'No', 'Yes'],
          ['Strong read-after-write', 'No (unless CQRS lag OK)', 'Yes'],
        ],
      },
    ],
  },
  {
    id: 'kafka-rest-hybrid',
    title: 'Kafka + REST Hybrid Architecture',
    what:
      'Production systems combine sync REST/gRPC for command-query on critical path with Kafka for side effects, integration, and analytics. Outbox bridges DB writes to bus; materialized views bridge bus to read APIs.',
    why:
      'Pure event-only architecture struggles with "what is my order status now?" Pure REST cannot scale fan-out notify without N×HTTP and retry storms.',
    when:
      'E-commerce order flow, banking payment initiation, SaaS webhook delivery. Pattern: REST command → outbox → Kafka → N consumers; REST query from read DB.',
    how:
      'Boot 3 order service: `POST /orders` `@Transactional` order+outbox, return `201` with id. Notification `@KafkaListener` sends email. `GET /orders/{id}` reads primary or read replica. Payment authorize: sync REST to payment gateway with Resilience4j — not Kafka on user click path.',
    flow: `sequenceDiagram
  participant C as Client
  participant O as Order API
  participant DB as Postgres
  participant K as Kafka
  participant N as Notify consumer
  C->>O: POST /orders
  O->>DB: TX order + outbox
  O-->>C: 201 orderId
  O->>K: relay outbox
  K->>N: OrderCreated
  N->>N: send email
  C->>O: GET /orders/id
  O->>DB: read`,
    failure:
      'Read-your-writes broken — GET before consumer updates read model. Kafka on payment authorize — user waits on consumer lag. No outbox — dual write inconsistency.',
    tradeoff:
      'Hybrid ops complexity vs best latency and consistency per operation type.',
    security:
      'REST JWT at edge; Kafka ACL per producer/consumer service account. Same tenantId in event payload validated at consumer.',
    observability:
      'Single trace id from HTTP request through outbox relay to consumer span. SLO dashboard: API p99 + max consumer lag.',
    trap:
      'Returning 200 only after all Kafka consumers finish — recreates sync chain via messaging.',
    interviewAnswer:
      'Hybrid architecture uses REST for commands and queries needing immediate answers, Kafka for asynchronous side effects and integration. Outbox ensures DB and bus stay consistent. I never block HTTP response on Kafka consumer completion — return order id immediately; email lag is separate SLA. Payment authorization stays sync REST with timeout and idempotency.',
    remember: [
      'REST command + outbox + async consumers',
      'Do not block HTTP on consumer completion',
      'CQRS read model fed by consumers',
      'Critical authorize path stays sync REST',
    ],
    oneLiner: 'REST for immediate commands/queries; Kafka + outbox for async side effects — do not block HTTP on consumers.',
  },
];
