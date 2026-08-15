'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {KAFKA_PRODUCER_TOC} from '@/lib/kafka-producer/toc';
import {
  ACK_ROWS,
  ANTI_PATTERNS,
  API_ROWS,
  BACKPRESSURE_EXPLAIN,
  BOOTSTRAP_SEED_EXPLAIN,
  CAPACITY_EXAMPLE,
  CHEATS,
  COMPONENT_THREADS,
  CONFIG_CORE,
  CONFIG_INTERACTIONS,
  CONFIG_INTERACTIONS_EXPLAIN,
  DECISIONS,
  FENCING_EXPLAIN,
  IDEMP_ROWS,
  IDEMPOTENCE_LINK_EXPLAIN,
  KEY_ROWS,
  LATENCY_VS_THROUGHPUT,
  LAYER_STACK,
  MEMORY_SENTENCE,
  METADATA_LEADER_EXPLAIN,
  METRIC_ROWS,
  NETWORK_CLIENT_EXPLAIN,
  NULL_KEY_PARTITION_EXPLAIN,
  ORDER_ROWS,
  OUTBOX_COMPARE,
  OUTBOX_VS_KAFKA_TXN,
  PARTITION_ROWS,
  PERF_BREAKDOWN,
  PRODUCE_REQUEST_EXPLAIN,
  PRODUCER_COUNT_EXPLAIN,
  PRODUCER_LIFECYCLE_PROD,
  PROFILES,
  QUOTAS_ACLS_EXPLAIN,
  SCHEMA_REGISTRY_EXPLAIN,
  SECURITY_LAYERS_EXPLAIN,
  SECURITY_ROWS,
  SEND_MODES,
  SEND_MODES_EXPLAIN,
  SEND_PIPELINE,
  SERDE_ROWS,
  SOURCE_CLASSES,
  SPRING_COMPARE,
  SPRING_PRODUCER_CREATE,
  AWS_PRODUCER_DEPLOY,
  THREADING_EXPLAIN,
  TX_FLOW,
  VERSION_NOTE,
} from '@/lib/kafka-producer/content';
import {CHAOS, CHAOS_EXPLAIN, FAILURE_MATRIX, FAILURE_MATRIX_EXPLAIN, TROUBLESHOOT} from '@/lib/kafka-producer/failures';
import {
  AFTER_FATAL,
  AUTH_LIFECYCLE,
  CORNER_ACK_CRASH,
  CORNER_FENCE,
  CORNER_PARTITIONS,
  DNS_ROWS,
  ERROR_CLASSES,
  EXCEPTION_TREE,
  FENCING_ROWS,
  JVM_ADV,
  PROTOCOL_APIS,
  PROTOCOL_EVOLUTION,
  QUOTA_ROWS,
  RACK_ROWS,
  SHUTDOWN_ROWS,
  TOPIC_LIFECYCLE,
  WIRE_HEADER,
} from '@/lib/kafka-producer/staff';
import CodePanel from './code-panel';
import InterviewMode from './interview-mode';
import StickyToc from './sticky-toc';

function Section({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-3xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{title}</h2>
      {lead && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function MiniTable({headers, rows}: {headers: string[]; rows: string[][]}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-2 py-2 text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.join('|')} className="border-t border-slate-200 dark:border-slate-800">
              {r.map((c, i) => (
                <td
                  key={i}
                  className={`px-2 py-2 align-top ${i === 0 ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function KafkaProducerHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · Java 21 · Spring Kafka · Apache Kafka 4.x
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Kafka Producer — Complete Board
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Producer only: API → Java internals → protocol → network → leader append → ISR ack → retry →
          idempotence → transactions → Spring → failures → payments architecture. Consumer topics appear only
          when they explain producer behavior.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{VERSION_NOTE}</p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Hub:{' '}
          <Link href="/kafka-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Kafka
          </Link>
          {' · '}
          <Link href="/kafka-mastery" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Interview mastery
          </Link>
          {' · '}
          <Link href="/kafka-cluster#replication" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Cluster
          </Link>
          {' · '}
          <Link href="/spring-kafka-payments-demo" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Spring code
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[280px_minmax(0,1fr)]">
        <StickyToc items={KAFKA_PRODUCER_TOC} />
        <div className="min-w-0 space-y-16">
          <Section
            id="overview"
            title="00. Executive overview"
            lead="A Kafka producer is an append client for a distributed log. It is not a queue put() that deletes on consume. Near-complete practical coverage is the goal — not a false claim of every undocumented broker edge forever."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  App[Application] --> KP[KafkaProducer]
  KP --> Acc[RecordAccumulator]
  Acc --> Sender
  Sender --> Net[NetworkClient]
  Net --> L[Partition leader]
  L --> Log[Log append]
  Log --> ISR[Replication ISR]
  ISR --> ACK[ProduceResponse]
  ACK --> CB[Future / Callback]
  ACK --> Retry[Retry if retriable]`}
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel title="Producer responsibilities" tone="ok" code={`Serialize key/value/headers
Choose partition (key / sticky / explicit)
Batch + compress (per partition)
Find leader via metadata cache
Send ProduceRequest (batches sharing a broker)
Honor acks / retries / timeouts
Optional: idempotence + transactions
Surface metrics + errors`} />
              <CodePanel
                title="Broker responsibilities"
                code={`Accept Produce on leader only
Assign offset
Append to partition log
Replicate to followers
Maintain ISR
Respond per acks
Enforce quotas / ACLs  ← who may write + rate caps
Txn markers when used`}
              />
            </div>
            <div className="mt-4">
              <CodePanel title="Quotas & ACLs (broker enforce)" code={QUOTAS_ACLS_EXPLAIN} />
            </div>
          </Section>

          <Section
            id="fundamentals"
            title="01. Fundamentals — record layers"
            lead="Do not confuse one send() (one record → one partition) with a ProduceRequest (may carry several ready batches that share the same leader broker)."
          >
            <CodePanel title="Layer stack" tone="ok" code={LAYER_STACK} />
            <div className="mt-4">
              <CodePanel title="One send() vs ProduceRequest" tone="ok" code={PRODUCE_REQUEST_EXPLAIN} />
            </div>
            <div className="mt-4">
              <CodePanel
                title="ProducerRecord fields"
                code={`topic          required
partition      optional explicit
key            optional — ordering + hashing
value          payload (nullable in some APIs)
timestamp      optional CreateTime
headers        key/value byte pairs

RecordMetadata after success:
topic, partition, offset, timestamp, serialized sizes`}
              />
            </div>
          </Section>

          <Section
            id="lifecycle"
            title="02. Complete producer.send() lifecycle"
            lead="Trace application thread work vs sender thread work. Most TCP I/O is not on the caller."
          >
            <CodePanel title="End-to-end pipeline" tone="ok" code={SEND_PIPELINE} />
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`sequenceDiagram
  participant A as App thread
  participant P as KafkaProducer
  participant Acc as Accumulator
  participant S as Sender
  participant B as Leader
  A->>P: send(record)
  P->>P: serialize + partition
  P->>Acc: append batch
  P-->>A: Future
  S->>Acc: drain ready
  S->>B: ProduceRequest
  B-->>S: ProduceResponse
  S-->>A: complete Future/callback`}
              />
            </div>
          </Section>

          <Section
            id="architecture"
            title="03. Internal architecture and threading"
            lead='KafkaProducer is thread-safe for many app threads calling send(). "Single-threaded" refers to the one Sender I/O loop — not "one thread may call the API." Creating a producer per request is the anti-pattern (TCP, metadata, buffers, PID).'
          >
            <MiniTable headers={['Component', 'Thread', 'Role']} rows={COMPONENT_THREADS} />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Threading model"
                code={`App T1 ─┐
App T2 ─┼─→ KafkaProducer.send (thread-safe)
App T3 ─┘         ↓
            RecordAccumulator
                  ↓
             Sender thread (ONE) → NetworkClient → brokers

Reuse ONE producer (or Spring ProducerFactory singleton).`}
              />
              <CodePanel title='What "single-threaded" means' tone="ok" code={THREADING_EXPLAIN} />
            </div>
            <div className="mt-4">
              <CodePanel title="What NetworkClient is" tone="ok" code={NETWORK_CLIENT_EXPLAIN} />
            </div>
            <div className="mt-4">
              <CodePanel title="How many producers do we need?" tone="ok" code={PRODUCER_COUNT_EXPLAIN} />
            </div>
          </Section>

          <Section
            id="api"
            title="04. Producer API and sync vs async"
            lead="Send mode = whether YOUR thread waits for the ack — not whether the broker uses acks=all. Prefer async + callback for production."
          >
            <MiniTable headers={['API', 'Returns', 'Notes']} rows={API_ROWS} />
            <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">Send modes</h3>
            <MiniTable headers={['Mode', 'Strength', 'Risk']} rows={SEND_MODES} />
            <div className="mt-4">
              <CodePanel title="Send modes explained" tone="ok" code={SEND_MODES_EXPLAIN} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Preferred async"
                tone="ok"
                code={`producer.send(record, (metadata, ex) -> {
  if (ex != null) metrics.fail(ex);
  else metrics.ok(metadata.partition());
});`}
              />
              <CodePanel
                title="Sync get() — rare"
                tone="danger"
                code={`// OK: rare critical path / test
producer.send(record).get(5, SECONDS);

// BAD: hot loop — kills throughput
for (r : million) producer.send(r).get();`}
              />
            </div>
          </Section>

          <Section
            id="serialization"
            title="05. Serialization and Schema Registry"
            lead="Serialization runs on the application thread inside send(). Schema Registry is a separate schema store used by Avro/Protobuf/JSON Schema serializers — not the Kafka metadata/leader path."
          >
            <MiniTable headers={['Serializer', 'Use', 'Watch']} rows={SERDE_ROWS} />
            <div className="mt-4">
              <CodePanel title="Schema Registry explained" tone="ok" code={SCHEMA_REGISTRY_EXPLAIN} />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Null keys and null values are allowed depending on serializer — know your contract. Breaking schema
              changes need a new subject/topic strategy or careful compatibility evolution.
            </p>
          </Section>

          <Section
            id="partitioning"
            title="06. Partitioning and key design"
            lead="Key chooses the ordering boundary. With no key, modern clients use sticky partitioning (batch-friendly), not classic per-record round-robin. Partition count changes remapping for newly hashed keys."
          >
            <MiniTable headers={['Mode', 'Behavior', 'Notes']} rows={PARTITION_ROWS} />
            <div className="mt-4">
              <CodePanel title="No key — how partition is chosen" tone="ok" code={NULL_KEY_PARTITION_EXPLAIN} />
            </div>
            <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">Key choices</h3>
            <MiniTable headers={['Key', 'Ordering', 'Risk']} rows={KEY_ROWS} />
            <div className="mt-4">
              <CodePanel
                title="Custom Partitioner sketch"
                code={`class TenantPartitioner implements Partitioner {
  public int partition(String topic, Object key, byte[] keyBytes,
                       Object value, byte[] valueBytes, Cluster cluster) {
    // hash tenant → partition; document order boundary
  }
  public void close() {}
  public void configure(Map<String, ?> configs) {}
}`}
              />
            </div>
          </Section>

          <Section id="ordering" title="07. Ordering — precise guarantees">
            <MiniTable headers={['Scope', 'Guarantee']} rows={ORDER_ROWS} />
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Reorder classic: non-idempotent producer, <code>max.in.flight &gt; 1</code>, earlier batch fails and
              retries after a later batch succeeds. Idempotence + in-flight ≤ 5 preserves per-partition order across
              retries.
            </p>
          </Section>

          <Section
            id="headers-ts"
            title="08. Headers and timestamps"
            lead="Headers carry correlation IDs, trace context, event type — not secrets. Timestamps are CreateTime or LogAppendTime."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Headers"
                tone="ok"
                code={`record.headers()
  .add("x-correlation-id", idBytes)
  .add("x-event-type", typeBytes);

// Keep small. Do not put tokens/PII.
// Tracing: W3C traceparent via interceptor/OTel`}
              />
              <CodePanel
                title="Timestamps"
                code={`CreateTime   — producer/record timestamp
LogAppendTime — broker sets on append
Clock skew can surprise event-time joins
Topic config message.timestamp.type`}
              />
            </div>
          </Section>

          <Section
            id="batching"
            title="09. RecordAccumulator, batching, compression"
            lead="Records queue per partition. A batch ships when full (batch.size) or linger.ms elapses — whichever first. Sender may pack several ready batches into one ProduceRequest only when those partitions share the same leader broker."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TD
  R[Record one send] --> Acc[RecordAccumulator per partition]
  Acc --> Batch[ProducerBatch ONE partition]
  Batch -->|full OR linger| S[Sender]
  S --> Comp[Compression per batch]
  Comp --> Req[ProduceRequest to one broker]
  Req --> Note[May include other ready batches whose leaders are on that same broker]`}
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Batching trade-off"
                tone="ok"
                code={`More batching → higher throughput
              → better compression
              → potentially higher latency

Kafka 4.x linger.ms default = 5
batch.size default = 16384

This trade-off is the "high throughput" profile
(§16) — not an anti-pattern by itself.

Anti-pattern: raise linger/batch forever
with no p99 / memory / GC budget.

Blindly raising batch.size with many
partitions can exhaust buffer.memory.`}
              />
              <CodePanel
                title="Compression"
                code={`none | gzip | snappy | lz4 | zstd
Compresses the batch, not each record alone
zstd/lz4: usual prod picks
gzip: often more CPU
Broker stores compressed batches
CPU vs network is the trade`}
              />
            </div>
            <div className="mt-4">
              <CodePanel title="Reminder: send vs ProduceRequest" code={PRODUCE_REQUEST_EXPLAIN} />
            </div>
          </Section>

          <Section
            id="memory"
            title="10. Memory management and backpressure"
            lead="buffer.memory is a shared heap BufferPool for ProducerBatches. When it is full, send() blocks — that block is producer backpressure. Quotas (broker throttle) are a different slowdown."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <CodePanel title="What backpressure means" tone="ok" code={BACKPRESSURE_EXPLAIN} />
              <CodePanel
                title="Memory pressure path"
                tone="danger"
                code={`Produce > broker accept  (or batches too big for pool)
  → batches pile in RecordAccumulator
  → buffer.memory exhausted  (default ~32MB shared)
  → send() blocks  ← this wait IS backpressure
  → waits up to max.block.ms (default 60s)
  → TimeoutException

Also: buffer.memory ≪ (batch.size × active partitions)
  → you run out of BufferPool even before brokers are slow

NOT the same as:
  broker produce quota throttle (latency ↑, throttle-time ↑)
  TLS/SASL/ACL failures (authz errors, not buffer waits)

Metrics: buffer-available-bytes, bufferpool-wait-time
Fix: bound app rate, scale brokers, tune memory/batch, shed load`}
              />
            </div>
          </Section>

          <Section
            id="network-meta"
            title="11. Networking, bootstrap, metadata"
            lead="bootstrap.servers is a discovery seed (first contact only). After Metadata, Produce goes to each partition’s leader — often not the bootstrap host."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Network path"
                code={`KafkaProducer
  → Sender
  → NetworkClient   ← TCP + Kafka protocol (§03)
  → Produce / Metadata / InitProducerId ...

Reconnect with backoff on failure
TLS handshake failures block new conns
Leader change → metadata refresh → new node`}
              />
              <CodePanel
                title="Metadata cache (short)"
                tone="ok"
                code={`bootstrap.servers → initial Metadata
cache: topics, partitions, leaders
refresh on: errors, metadata.max.age.ms
stale leader → NotLeader* → retry
partitionsFor(topic) forces fetch`}
              />
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <CodePanel title="bootstrap.servers = discovery seed" tone="ok" code={BOOTSTRAP_SEED_EXPLAIN} />
              <CodePanel title="Find leader via metadata — step by step" code={METADATA_LEADER_EXPLAIN} />
            </div>
          </Section>

          <Section id="acks" title="12. Acknowledgements and replication (producer view)">
            <MiniTable headers={['acks', 'Success means', 'Latency', 'Loss risk', 'Notes']} rows={ACK_ROWS} />
            <div className="mt-4">
              <CodePanel
                title="acks × RF × min.insync.replicas"
                tone="ok"
                code={`RF=3, minISR=2, acks=all
  → need 2 in-sync replicas to ack
  → one AZ can die and still produce
  → ISR=1 → NotEnoughReplicas (prefer fail over silent loss)

unclean.leader.election.enable=false in prod
Followers PULL from leader — producer never writes followers`}
              />
            </div>
          </Section>

          <Section
            id="retries"
            title="13. Retries and delivery semantics"
            lead="retries are bounded in practice by delivery.timeout.ms. request.timeout.ms is one attempt. Rule: delivery.timeout.ms must be ≥ linger.ms + request.timeout.ms or the client rejects / fails early."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Timeout triangle"
                tone="ok"
                code={`delivery.timeout.ms  (default 120s)
  = total budget including linger + retries

request.timeout.ms   (default 30s)
  = wait for one response

retry.backoff.ms → retry.backoff.max.ms
  = space between attempts

MUST: delivery ≥ linger + request
  else config rejected / sends fail early
  (you budgeted less than the minimum path)`}
              />
              <CodePanel
                title="Semantics (precise)"
                code={`At-most-once:  no retry / commit-before-process styles
At-least-once: retries without dedupe → possible dups
Exactly-once (Kafka):
  idempotent produce = one log append per try id
  transactions = atomic multi-partition visibility
Exactly-once (business DB/PSP):
  still needs idempotent side effects / outbox`}
              />
            </div>
          </Section>

          <Section
            id="idempotence"
            title="14. Idempotence, PID/epoch/seq, max.in.flight"
            lead="Idempotence links retries to a unique produce-attempt id (PID+epoch+seq). max.in.flight is how many requests may pipeline on one connection; with idempotence that window stays ≤5 so order and dedupe both hold."
          >
            <MiniTable headers={['Concept', 'Meaning']} rows={IDEMP_ROWS} />
            <div className="mt-4">
              <CodePanel title="Retries × in-flight × unique try id" tone="ok" code={IDEMPOTENCE_LINK_EXPLAIN} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Idempotent requirements"
                tone="ok"
                code={`enable.idempotence=true  (default true in 4.x)
acks=all
retries > 0
max.in.flight.requests.per.connection ≤ 5

Exceptions to know:
OutOfOrderSequenceException
UnknownProducerId
ProducerFencedException (txn)`}
              />
              <CodePanel
                title="In-flight reorder"
                tone="danger"
                code={`Without idempotence:
  in-flight=5, batch1 fails, batch2 succeeds,
  batch1 retries → order swap + possible duplicate

With idempotence:
  same PID+epoch+seq is not appended twice
  broker sequences keep per-partition order
  for in-flight ≤ 5`}
              />
            </div>
          </Section>

          <Section
            id="transactions"
            title="15. Transactions, EOS visibility, outbox"
            lead="Kafka transactions atomicize Kafka writes (and optional EOS consume-produce). They do not enlist JDBC. When the database is the source of truth, use a transactional outbox (or CDC) — often together with an idempotent producer on the relay."
          >
            <CodePanel title="Transaction lifecycle" tone="ok" code={TX_FLOW} />
            <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">
              Outbox vs Kafka transactions
            </h3>
            <div className="mt-4">
              <CodePanel title="Outbox vs Kafka txn (choose by boundary)" tone="ok" code={OUTBOX_VS_KAFKA_TXN} />
            </div>
            <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">DB dual-write patterns</h3>
            <MiniTable headers={['Pattern', 'Pros', 'Cons']} rows={OUTBOX_COMPARE} />
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart LR
  subgraph bad [Dual-write hole]
    D1[DB commit] --> Gap[Crash] --> K1[Kafka send?]
  end
  subgraph kotxn [Kafka txn only]
    KT[beginTransaction] --> KS[send topics]
    KS --> KC[commitTransaction]
    DB2[JDBC] -.->|NOT enlisted| KT
  end
  subgraph outbox [Outbox]
    OB[DB: business + outbox row] --> Rel[Relay]
    Rel --> KP[Idempotent KafkaProducer]
  end`}
              />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              <code>read_committed</code> consumers skip aborted transactional data. Mention consumers only to
              explain that producer commit markers control visibility — then return focus to the producer.
            </p>
          </Section>

          <Section
            id="config"
            title="16. Configuration reference, interactions, profiles"
            lead="Defaults verified against Apache Kafka 4.x producer docs. The short matrix below is the cheat sheet; the plain-English block explains each arrow — including why batch/linger/zstd is a throughput trade-off, not an anti-pattern by itself."
          >
            <MiniTable headers={['Config', 'Type', 'Default (4.x)', 'Notes']} rows={CONFIG_CORE} />
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <CodePanel title="Interaction matrix (memorize)" tone="ok" code={CONFIG_INTERACTIONS} />
              <CodePanel title="Plain English — what each arrow means" code={CONFIG_INTERACTIONS_EXPLAIN} />
            </div>
            <div className="mt-4">
              <CodePanel title="Low latency vs high throughput" tone="ok" code={LATENCY_VS_THROUGHPUT} />
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {PROFILES.map((p) => (
                <div key={p.name}>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {p.name} — {p.goal}
                  </h3>
                  <CodePanel title={p.name} code={p.code} />
                </div>
              ))}
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Large messages: align <code>max.request.size</code>, topic <code>max.message.bytes</code>, broker{' '}
              <code>message.max.bytes</code>. Prefer object-store + pointer events over multi-MB Kafka payloads.
            </p>
          </Section>

          <Section id="performance" title="17. Performance, latency breakdown, capacity">
            <MiniTable headers={['Latency slice', 'What it is']} rows={PERF_BREAKDOWN} />
            <div className="mt-4">
              <CodePanel title="Capacity sketch" tone="ok" code={CAPACITY_EXAMPLE} />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Scaling producers = scale app pods reusing a producer each. Scaling partitions increases parallelism
              and accumulator fanout. Multiple producers in one JVM help isolation (different txn ids), not
              per-request throughput theater.
            </p>
          </Section>

          <Section
            id="security"
            title="18. Security — TLS, SASL, ACLs"
            lead="Three layers, three jobs: TLS encrypts the wire, SASL proves identity, ACLs authorize WRITE / IDEMPOTENT_WRITE. Quotas are rate limits after you are allowed."
          >
            <MiniTable headers={['Layer', 'Producer need']} rows={SECURITY_ROWS} />
            <div className="mt-4">
              <CodePanel title="TLS vs SASL vs ACLs" tone="ok" code={SECURITY_LAYERS_EXPLAIN} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Security failures"
                tone="danger"
                code={`Expired cert → SslAuthenticationException → fix rotation
Bad SCRAM secret → AuthenticationException
Missing WRITE ACL → TopicAuthorizationException
Missing IDEMPOTENT_WRITE → idempotent produce fails
Symptom: immediate fail on new connections / first produce
Prevention: alert cert expiry; least-privilege ACL CI checks`}
              />
              <CodePanel title="Quotas vs ACLs" code={QUOTAS_ACLS_EXPLAIN} />
            </div>
          </Section>

          <Section id="observability" title="19. Metrics, tracing, logging">
            <MiniTable headers={['Metric', 'Use']} rows={METRIC_ROWS} />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Tracing"
                tone="ok"
                code={`HTTP → app span → producer send span
Inject traceparent into Kafka headers
Consumer continues trace
OpenTelemetry instrumentation preferred`}
              />
              <CodePanel
                title="Logging rules"
                code={`Log: topic, partition, key hash, correlationId, error, latency
Do NOT log: PAN, tokens, passwords, full PII payloads
Callbacks: increment metrics, don't write essays`}
              />
            </div>
          </Section>

          <Section
            id="spring"
            title="20. Spring Kafka producer"
            lead="Boot gives you a ProducerFactory + KafkaTemplate singleton. Configure acks/idempotence underneath; reuse one producer per process; let Spring close it on shutdown."
          >
            <MiniTable headers={['Piece', 'When', 'Note']} rows={SPRING_COMPARE} />
            <div className="mt-4">
              <CodePanel title="Create producer with Spring Kafka" tone="ok" code={SPRING_PRODUCER_CREATE} />
            </div>
            <div className="mt-4">
              <CodePanel
                title="Spring shape (short)"
                code={`DefaultKafkaProducerFactory → singleton producer
KafkaTemplate.send → CompletableFuture / ListenableFuture
@Transactional + KafkaTransactionManager needs transactional.id
Micrometer binds producer metrics
Test with EmbeddedKafka / Testcontainers
Still configure acks/idempotence/linger underneath`}
              />
            </div>
          </Section>

          <Section
            id="aws-deploy"
            title="20b. AWS deploy — microservice + Kafka producer"
            lead="On AWS you deploy the microservice (EKS/ECS/EC2). The Kafka producer is a library inside that JVM. Brokers are usually Amazon MSK in the VPC — not a separate “producer deployable.”"
          >
            <CodePanel title="How producer deploy works on AWS" tone="ok" code={AWS_PRODUCER_DEPLOY} />
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  Users --> ALB
  ALB --> Pods[EKS/ECS microservice pods]
  Pods --> KP[KafkaProducer / KafkaTemplate inside JVM]
  KP --> MSK[Amazon MSK brokers VPC]
  MSK --> T[Topics]
  SSM[SSM / Secrets: bootstrap + creds] --> Pods
  IAM[Task role IAM or SCRAM] --> KP`}
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="MSK + Spring (IAM sketch)"
                tone="ok"
                code={`# env from SSM / task def
SPRING_KAFKA_BOOTSTRAP_SERVERS=b-1....:9098,b-2....:9098

spring.kafka.properties.security.protocol=SASL_SSL
spring.kafka.properties.sasl.mechanism=AWS_MSK_IAM
spring.kafka.properties.sasl.jaas.config=\\
  software.amazon.msk.auth.iam.IAMLoginModule required;
spring.kafka.properties.sasl.client.callback.handler.class=\\
  software.amazon.msk.auth.iam.IAMClientCallbackHandler

# producer still: acks=all, enable.idempotence=true, …`}
              />
              <CodePanel
                title="Deploy anti-patterns on AWS"
                tone="danger"
                code={`Public MSK for app producers
Wrong SG → bootstrap timeout (looks like “Kafka down”)
One giant shared transactional.id across ECS tasks
Skipping SIGTERM drain on ECS/EKS rollback
Auto-create topics in prod
Treating MSK multi-AZ as cross-region DR`}
              />
            </div>
          </Section>

          <Section
            id="failures"
            title="21. Failure matrix"
            lead="When something breaks mid-produce, this matrix answers: did we ACK, will we retry, can we duplicate, can we lose data, what exception shows up. Use it in interviews and incident reviews."
          >
            <div className="mb-4">
              <CodePanel title="When do these failures occur?" tone="ok" code={FAILURE_MATRIX_EXPLAIN} />
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-[11px]">
                <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    {['Failure', 'ACK?', 'Retry?', 'Dup?', 'Loss?', 'Order', 'Exception'].map((h) => (
                      <th key={h} className="px-2 py-2 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FAILURE_MATRIX.map((f) => (
                    <tr key={f.failure} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-2 py-2 font-semibold text-slate-800 dark:text-slate-100">{f.failure}</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{f.ack}</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{f.retry}</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{f.dup}</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{f.loss}</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{f.order}</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{f.exception}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section
            id="ops"
            title="22. Troubleshooting, chaos, multi-cluster DR"
            lead="Troubleshooting = diagnose live symptoms. Chaos = deliberately inject the failure-matrix scenarios in a controlled game day to prove retries, fencing, and alerts behave."
          >
            <div className="space-y-3">
              {TROUBLESHOOT.map((t) => (
                <div key={t.title} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    <strong>Symptoms:</strong> {t.symptoms}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    <strong>Causes:</strong> {t.causes}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-emerald-800 dark:text-emerald-300">
                    <strong>Fix:</strong> {t.fix}
                  </p>
                </div>
              ))}
            </div>
            <h3 className="mt-8 text-lg font-semibold text-slate-900 dark:text-white">Chaos expectations</h3>
            <div className="mt-4 mb-4">
              <CodePanel title="What chaos means" tone="ok" code={CHAOS_EXPLAIN} />
            </div>
            <MiniTable headers={['Inject', 'Expected']} rows={CHAOS} />
            <div className="mt-4">
              <CodePanel
                title="DR note"
                code={`Do not RF=3 across high-RTT regions as one cluster.
Primary → MM2 / Cluster Linking → Secondary
Failover may duplicate — business idempotency required
PID/txn state is per cluster
Outbox + deterministic event ids travel better than hoping`}
              />
            </div>
          </Section>

          <Section
            id="finance"
            title="23. Financial / payments producer architecture"
            lead="100k+/s is a capacity problem. Correctness is an idempotency + outbox problem."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TD
  Client --> API
  API --> Val[Validate]
  Val --> DB[(Ledger UNIQUE payment_id)]
  DB --> Outbox[Outbox row]
  Outbox --> Relayer
  Relayer --> KP[KafkaProducer idempotent]
  KP --> Topic[payments keyed by accountId]
  Topic --> Settle[Consumers]`}
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Corner cases"
                tone="danger"
                code={`Timeout after broker write → retry safe if idempotent
DB commit + Kafka fail → outbox relay retries
Kafka success + app crash → outbox already marked or relay dedupes
Duplicate HTTP submit → UNIQUE payment_id rejects
Region fail → secondary cluster + idempotent settle`}
              />
              <CodePanel
                title="Outbox vs Kafka txn (payments)"
                tone="ok"
                code={`Payments default: transactional OUTBOX (§15)
  DB payment + outbox row in one JDBC txn
  Relay → idempotent KafkaProducer

Kafka transactions alone:
  atomic multi-partition Kafka writes / EOS pipe
  do NOT cover the ledger JDBC commit

Often both:
  outbox closes DB↔Kafka hole
  idempotent (or txn) producer on the relay`}
              />
              <CodePanel
                title="Producer profile"
                tone="ok"
                code={`acks=all, idempotence=true, in-flight=5
zstd, linger 5-25, batch 32-64KB
key=accountId (or accountId:paymentId)
SASL_SSL + ACLs
metrics on queue-time + error-rate
txn only if multi-partition atomic needed`}
              />
            </div>
          </Section>

          <Section
            id="antipatterns"
            title="24. Anti-patterns"
            lead={
              'Do not confuse §16’s “batch.size ↑ + linger ↑ + zstd → throughput ↑, latency ↑” with an anti-pattern. That line is a deliberate high-throughput trade-off. Anti-patterns are the wrong habits below — e.g. unlimited linger, blind memory raises, or turning off idempotence “to go faster.”'
            }
          >
            <div className="grid gap-3 md:grid-cols-2">
              {ANTI_PATTERNS.map((a) => (
                <div key={a.bad} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-sm leading-6 text-rose-700 dark:text-rose-300">
                    <strong>Wrong:</strong> {a.bad}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-emerald-800 dark:text-emerald-300">
                    <strong>Right:</strong> {a.good}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="source"
            title="25. Source classes"
            lead="Know the Java types. Do not dump Kafka.git in an interview — name responsibility and who calls whom."
          >
            <MiniTable headers={['Class', 'Responsibility']} rows={SOURCE_CLASSES} />
          </Section>

          <Section
            id="protocol"
            title="26. Producer protocol and API evolution"
            lead="This is the jump from “I can call KafkaTemplate.send” to “I know what bytes go on the wire.” Clients always ApiVersions-negotiate; they do not assume a broker speaks today’s Produce version."
          >
            <MiniTable headers={['Topic', 'Producer-relevant fact']} rows={PROTOCOL_EVOLUTION} />
            <div className="mt-4">
              <CodePanel title="Every request/response" tone="ok" code={WIRE_HEADER} />
            </div>
            <div className="mt-6 space-y-4">
              {PROTOCOL_APIS.map((p) => (
                <div key={p.name} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {p.name} <span className="font-normal text-slate-500">(api_key {p.key})</span>
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    <strong>Request:</strong> {p.request}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    <strong>Response:</strong> {p.response}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    <strong>Retry:</strong> {p.retry}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    <strong>Broker:</strong> {p.broker}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500">
              Exact field lists evolve by API version. State the client+broker versions in an interview rather than
              reciting a frozen binary layout from memory.
            </p>
          </Section>

          <Section
            id="errors"
            title="27. Error classification and fatal lifecycle"
            lead="Map error_code → exception → retry vs die. After fatal errors the producer instance is done."
          >
            <MiniTable headers={['Class', 'Examples', 'What you do']} rows={ERROR_CLASSES} />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel title="Exception hierarchy (simplified)" code={EXCEPTION_TREE} />
              <CodePanel title="After fatal" tone="danger" code={AFTER_FATAL} />
            </div>
          </Section>

          <Section
            id="shutdown"
            title="28. Producer lifecycle, flush, close, crash"
            lead="Start once at boot. Stop with flush/close on SIGTERM — k8s preStop must outlive close. Unsent records on hard kill are a correctness issue unless outbox can replay."
          >
            <div className="mb-4">
              <CodePanel title="Start / stop in production" tone="ok" code={PRODUCER_LIFECYCLE_PROD} />
            </div>
            <MiniTable headers={['Event', 'What happens']} rows={SHUTDOWN_ROWS} />
          </Section>

          <Section
            id="fencing"
            title="29. Fencing and zombie producers"
            lead="Fencing = kill-switch for an older producer that still thinks it owns a transactional.id. Newer InitProducerId bumps epoch; old epoch gets ProducerFencedException."
          >
            <div className="mb-4">
              <CodePanel title="What fencing means" tone="ok" code={FENCING_EXPLAIN} />
            </div>
            <MiniTable headers={['Scenario', 'Outcome']} rows={FENCING_ROWS} />
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`sequenceDiagram
  participant A as Producer A epoch 7
  participant C as Txn coordinator
  participant B as Producer B
  A->>C: produce with epoch 7
  B->>C: InitProducerId same txn.id
  C-->>B: PID epoch 8
  A->>C: send or EndTxn epoch 7
  C-->>A: FENCED`}
              />
            </div>
          </Section>

          <Section
            id="topic-life"
            title="30. Topic and partition lifecycle (producer view)"
            lead="Metadata is eventually consistent with cluster truth. Partition expansion remaps keys. Leadership moves; producers follow, they do not pin a broker."
          >
            <MiniTable headers={['Event', 'Producer impact']} rows={TOPIC_LIFECYCLE} />
          </Section>

          <Section
            id="quotas-rack"
            title="31. Quotas, rack/AZ, DNS, auth rotation"
            lead="Four ops topics interviewers use to separate people who tuned linger.ms from people who ran Kafka in Kubernetes."
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Quotas and throttling</h3>
            <MiniTable headers={['Topic', 'Detail']} rows={QUOTA_ROWS} />
            <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">Rack / AZ — and what producers do not do</h3>
            <MiniTable headers={['Topic', 'Detail']} rows={RACK_ROWS} />
            <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">DNS and network edges</h3>
            <MiniTable headers={['Topic', 'Detail']} rows={DNS_ROWS} />
            <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">Authentication lifecycle</h3>
            <MiniTable headers={['Topic', 'Detail']} rows={AUTH_LIFECYCLE} />
          </Section>

          <Section
            id="jvm-obs"
            title="32. JMX, Micrometer, OpenTelemetry, JVM internals"
            lead="Advanced observability and runtime: where CPU actually goes, and what “zero-copy” does not mean on the produce path."
          >
            <MiniTable headers={['Area', 'Staff answer']} rows={JVM_ADV} />
          </Section>

          <Section
            id="corners"
            title="33. Pathological corner cases (Staff war games)"
            lead="Walk these three on a whiteboard until they are boring. They fail candidates who only memorized acks=all."
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">1) Write succeeded, ACK never arrived, producer retries</h3>
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TD
  S[Producer send] --> W[Broker append]
  W --> X[Broker crash]
  X --> N[ACK never arrives]
  N --> R[Producer retry]
  R --> Q{idempotence / acks / txn?}`}
              />
            </div>
            <div className="mt-4">
              <MiniTable headers={['Combo', 'What happens']} rows={CORNER_ACK_CRASH} />
            </div>
            <h3 className="mt-8 text-lg font-semibold text-slate-900 dark:text-white">2) Two producers, one transactional.id</h3>
            <CodePanel title="Zombie fence" tone="danger" code={CORNER_FENCE} />
            <h3 className="mt-8 text-lg font-semibold text-slate-900 dark:text-white">3) Same key after partition count change</h3>
            <CodePanel title="Key remapping" tone="danger" code={CORNER_PARTITIONS} />
          </Section>

          <Section id="interview" title="34. Interview drills, decisions, cheat sheets">
            <InterviewMode />
            <h3 className="mt-8 text-lg font-semibold text-slate-900 dark:text-white">Decision framework</h3>
            <div className="mt-3 space-y-2">
              {DECISIONS.map((d) => (
                <div key={d.q} className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{d.q}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{d.a}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 grid gap-3 md:grid-cols-2">
              <CodePanel title="Mental model" tone="ok" code={CHEATS.mental} />
              <CodePanel title="Lifecycle" code={CHEATS.lifecycle} />
              <CodePanel title="Retry cheat" code={CHEATS.retry} />
              <CodePanel title="Interview hit list" code={CHEATS.interview} />
            </div>
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  APP[APPLICATION] --> KP[KafkaProducer]
  KP --> SER[Serializer]
  KP --> INT[Interceptor]
  KP --> META[Metadata]
  SER --> PART[Partitioner]
  META --> PART
  PART --> ACC[RecordAccumulator]
  ACC --> PB[ProducerBatch]
  ACC --> BP[BufferPool]
  PB --> COMP[Compression]
  COMP --> SEND[Sender]
  SEND --> NC[NetworkClient]
  NC --> TCP[TCP]
  TCP --> BR[Broker leader]
  BR --> LOG[Log append]
  LOG --> REP[Replication ISR]
  REP --> ACKN[Ack]
  ACKN --> OK[Success callback]
  ACKN --> FAIL[Failure]
  FAIL --> RT[Retry / timeout / error]`}
              />
            </div>
            <p className="mt-6 text-sm leading-7 text-slate-500">
              Next:{' '}
              <Link href="/kafka-consumer" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Consumer board
              </Link>
              {' · '}
              <Link href="/kafka-cluster#replication" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Cluster board
              </Link>
              {' · '}
              <Link href="/spring-kafka-payments-demo" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                payment-api producer code
              </Link>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
