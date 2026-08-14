'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {KAFKA_CONSUMER_TOC} from '@/lib/kafka-consumer/toc';
import {
  ANTI,
  ASSIGNORS,
  AUTO_COMMIT,
  BACKPRESSURE,
  CHEATS,
  COMMIT_COMPARE,
  COMMIT_PATTERN,
  CONFIG_CORE,
  EAGER_VS_COOP,
  EOS_FLOW,
  FETCH_CONFIGS,
  FETCH_NOTE,
  FUNDAMENTALS,
  GROUP_PIECES,
  INTERACTIONS,
  INTERNAL_LAYERS,
  LAG_FORMULA,
  MEMBERSHIP_FLOW,
  MEMORY_SENTENCE,
  OFFSET_LIFECYCLE,
  OFFSET_TYPES,
  POLL_LIFECYCLE,
  RANGE_EXAMPLE,
  REBALANCE_TRIGGERS,
  SCALING,
  SEMANTICS,
  STATIC_MEMBERSHIP,
  SUBSCRIBE_VS_ASSIGN,
  THREAD_RULES,
  TIMEOUT_COMPARE,
  VERSION_NOTE,
} from '@/lib/kafka-consumer/content';
import {
  CHAOS,
  ERROR_CODES,
  FAILURE_MATRIX,
  PAYMENT_FAILURES,
  TROUBLESHOOT,
  WAR_POLL_INTERVAL,
  WAR_STATIC,
} from '@/lib/kafka-consumer/failures';
import {
  COORDINATOR_DISCOVERY,
  FAILURE_TIMELINES,
  GROUP_PROTOCOL,
  INTERCEPTORS,
  LAG_LEVELS,
  NETWORK_INTERNALS,
  OFFSET_METADATA,
  OFFSET_OUT_OF_RANGE,
  PROTOCOL_COMPARE,
  REMOTE_ASSIGNOR,
  REVOKE_VS_LOST,
  STAFF_GAP_CHEATS,
  TX_VISIBILITY,
} from '@/lib/kafka-consumer/staff-gaps';
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

export default function KafkaConsumerHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · Consumer Groups · Apache Kafka 4.x · Java 21 · Spring Kafka
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Kafka Consumer & Consumer Group — Complete Board
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Consumer-only: <code>poll()</code>, fetch protocol, groups, coordinator, assignors, rebalancing, offsets,
          commits, lag, poison/DLQ, EOS/`read_committed`, k8s, DR, and Staff war games. Producer/broker appear only
          when needed to explain the consumer.
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
          <Link href="/kafka-producer" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Producer
          </Link>
          {' · '}
          <Link href="/kafka-mastery" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Mastery
          </Link>
          {' · '}
          <Link href="/kafka-cluster#replication" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Cluster
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[280px_minmax(0,1fr)]">
        <StickyToc items={KAFKA_CONSUMER_TOC} />
        <div className="min-w-0 space-y-16">
          <Section id="overview" title="00. Overview & version" lead="Pull-based consumption + group coordination is the whole game.">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  App[Application] --> KC[KafkaConsumer]
  KC --> Sub[Subscription]
  Sub --> GC[Group coordinator]
  GC --> Asg[Partition assignment]
  Asg --> Fetch[FetchRequest]
  Fetch --> Br[Broker / partition]
  Br --> Rec[Records]
  Rec --> Poll[poll returns ConsumerRecords]
  Poll --> Proc[Process]
  Proc --> Commit[Offset commit]
  Commit --> Offs[__consumer_offsets]`}
              />
            </div>
          </Section>

          <Section id="fundamentals" title="01. Consumer fundamentals" lead="One partition can be consumed by only one active member inside a consumer group.">
            <MiniTable headers={['Piece', 'Meaning']} rows={FUNDAMENTALS} />
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart LR
  subgraph topic [Topic]
    P0[P0]
    P1[P1]
    P2[P2]
    P3[P3]
  end
  subgraph group [Consumer group]
    A[A]
    B[B]
    C[C]
    D[D]
  end
  A --> P0
  B --> P1
  C --> P2
  D --> P3`}
              />
            </div>
          </Section>

          <Section id="lifecycle" title="02. Complete poll() lifecycle">
            <CodePanel title="What poll really does" tone="ok" code={POLL_LIFECYCLE} />
          </Section>

          <Section id="architecture" title="03. Internals and threading model">
            <MiniTable headers={['Class / layer', 'Responsibility']} rows={INTERNAL_LAYERS} />
            <div className="mt-4">
              <CodePanel title="Threading rules" tone="danger" code={THREAD_RULES} />
            </div>
          </Section>

          <Section id="subscribe" title="04. subscribe() vs assign()">
            <MiniTable headers={['API', 'Group mgmt', 'Rebalance', 'Use']} rows={SUBSCRIBE_VS_ASSIGN} />
          </Section>

          <Section id="poll" title="05. poll() and the canonical loop" lead="poll() is not simply “read messages from Kafka.”">
            <CodePanel
              title="Canonical loop"
              tone="ok"
              code={`while (running) {
  ConsumerRecords<String, Order> records =
      consumer.poll(Duration.ofMillis(1000));
  for (ConsumerRecord<String, Order> r : records) {
    process(r); // keep total time << max.poll.interval
  }
  consumer.commitAsync(); // or sync at boundaries
}
// shutdown: wakeup() → commitSync() → close()`}
            />
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Processing time, commit frequency, rebalances, and graceful shutdown all orbit this loop. Long work
              without returning to <code>poll</code> is how you invent rebalance storms.
            </p>
          </Section>

          <Section id="deser" title="06. Deserialization and ConsumerRecord">
            <CodePanel
              title="Bytes → object"
              code={`Fetch bytes
 → KeyDeserializer / ValueDeserializer
 → ConsumerRecord(topic, partition, offset, timestamp, key, value, headers, …)
Deser failure: exception on consumer thread — decide retry / DLQ / skip
Null values = deletes for compacted topics (tombstones)
Schema evolution: Avro/Protobuf/JSON Schema compatibility is a contract, not magic`}
            />
          </Section>

          <Section id="offsets" title="07. Position, commit, auto.offset.reset">
            <CodePanel title="Offset vocabulary" tone="ok" code={OFFSET_TYPES} />
            <div className="mt-4">
              <CodePanel title="Lifecycle" code={OFFSET_LIFECYCLE} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel title="OffsetAndMetadata" code={OFFSET_METADATA} />
              <CodePanel title="OffsetOutOfRange" tone="danger" code={OFFSET_OUT_OF_RANGE} />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              <code>auto.offset.reset</code> default is <strong>latest</strong> (4.x docs). Use{' '}
              <code>earliest</code> for rebuilds, <code>none</code> when missing commits must fail loudly.
            </p>
          </Section>

          <Section id="commits" title="08. Auto commit vs commitSync vs commitAsync">
            <CodePanel title="Auto commit" tone="danger" code={AUTO_COMMIT} />
            <div className="mt-4">
              <MiniTable headers={['Feature', 'commitSync', 'commitAsync']} rows={COMMIT_COMPARE} />
            </div>
            <div className="mt-4">
              <CodePanel title="Production pattern" tone="ok" code={COMMIT_PATTERN} />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Process-then-commit → at-least-once (duplicates possible). Commit-then-process → loss possible. Design
              the sink for idempotency either way.
            </p>
          </Section>

          <Section id="semantics" title="09. Delivery semantics, EOS, read_committed">
            <MiniTable headers={['Semantic', 'How', 'Failure shape']} rows={SEMANTICS} />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel title="Kafka EOS path" tone="ok" code={EOS_FLOW} />
              <CodePanel title="LEO · HW · LSO visibility" code={TX_VISIBILITY} />
            </div>
            <div className="mt-4">
              <CodePanel title="Failure timelines (interview gold)" tone="danger" code={FAILURE_TIMELINES} />
            </div>
          </Section>

          <Section id="group" title="10. Consumer group and coordinator">
            <MiniTable headers={['Concept', 'Detail']} rows={GROUP_PIECES} />
            <div className="mt-4">
              <CodePanel title="Coordinator discovery" tone="ok" code={COORDINATOR_DISCOVERY} />
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  A[Consumer A] --> G[group.id]
  B[Consumer B] --> G
  C[Consumer C] --> G
  G --> H[hash to __consumer_offsets partition]
  H --> CO[Partition leader = Group coordinator]
  CO --> T[__consumer_offsets]`}
              />
            </div>
          </Section>

          <Section id="membership" title="11. Membership: JoinGroup, SyncGroup, generation">
            <CodePanel title="Membership lifecycle" tone="ok" code={MEMBERSHIP_FLOW} />
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Generation ID increments each rebalance and fences stale members/commits (<code>ILLEGAL_GENERATION</code>
              ). Heartbeats prove liveness to the coordinator under the classic protocol.
            </p>
          </Section>

          <Section id="timeouts" title="12. session.timeout vs max.poll.interval" lead="This distinction must be interview-perfect.">
            <CodePanel title="Two different failure detectors" tone="danger" code={TIMEOUT_COMPARE} />
          </Section>

          <Section id="rebalance" title="13. Rebalancing — eager vs cooperative">
            <CodePanel title="Triggers" code={REBALANCE_TRIGGERS} />
            <div className="mt-4">
              <MiniTable headers={['Mode', 'Behavior', 'Impact', 'Notes']} rows={EAGER_VS_COOP} />
            </div>
          </Section>

          <Section id="assignors" title="14. Partition assignors">
            <MiniTable headers={['Assignor', 'Idea', 'Trade-off', 'Notes']} rows={ASSIGNORS} />
            <div className="mt-4">
              <CodePanel title="Range example" code={RANGE_EXAMPLE} />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500">
              Kafka 4.x default <code>partition.assignment.strategy</code> list includes RangeAssignor and
              CooperativeStickyAssignor — prefer cooperative sticky in prod subscribe() apps.
            </p>
          </Section>

          <Section id="static" title="15. Static membership and rebalance listeners">
            <CodePanel title="group.instance.id" tone="ok" code={STATIC_MEMBERSHIP} />
            <div className="mt-4">
              <CodePanel title="Revoked vs Lost (cooperative corner)" tone="danger" code={REVOKE_VS_LOST} />
            </div>
          </Section>

          <Section id="fetch" title="16. Fetch protocol and configuration">
            <CodePanel
              title="Fetch path"
              tone="ok"
              code={`Consumer → FetchRequest (positions, max bytes, isolation)
 → Broker partition read (≤ HW / LSO rules)
 → FetchResponse
 → Fetcher buffer / fetch session
 → poll() dribbles ≤ max.poll.records`}
            />
            <div className="mt-4">
              <MiniTable headers={['Config', '4.x default', 'Role']} rows={FETCH_CONFIGS} />
            </div>
            <div className="mt-4">
              <CodePanel title="Critical nuance" code={FETCH_NOTE} />
            </div>
          </Section>

          <Section id="backpressure" title="17. Backpressure, pause/resume, workers">
            <CodePanel title="When the app is slower than Kafka" tone="ok" code={BACKPRESSURE} />
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Worker pools break ordering unless you keep per-partition sequencing. Only the consumer thread should
              call <code>commit*</code>/<code>seek</code>/<code>pause</code>.
            </p>
          </Section>

          <Section id="seek" title="18. Seek, replay, ListOffsets">
            <CodePanel
              title="Replay toolkit"
              code={`seek / seekToBeginning / seekToEnd
ListOffsets by timestamp
New group.id for full rebuild (often safest)
Risks: duplicates, side effects, compacted history gaps
Always pair replay with idempotent sinks`}
            />
          </Section>

          <Section id="lag" title="19. Lag and performance">
            <CodePanel title="Lag" tone="ok" code={LAG_FORMULA} />
            <div className="mt-4">
              <CodePanel title="Group vs consumer vs partition lag" tone="danger" code={LAG_LEVELS} />
            </div>
            <div className="mt-4 space-y-3">
              {TROUBLESHOOT.slice(0, 5).map((t) => (
                <div key={t.title} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    <strong>Symptoms:</strong> {t.symptoms} · <strong>Causes:</strong> {t.causes}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-emerald-800 dark:text-emerald-300">
                    <strong>Fix:</strong> {t.fix}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="scaling" title="20. Scaling, ordering, poison messages">
            <CodePanel title="Partition ceiling" tone="ok" code={SCALING} />
            <div className="mt-4">
              <CodePanel
                title="Poison path"
                tone="danger"
                code={`Bad record → process fails → retry forever → partition blocked → lag↑
Strategies: bounded retry + backoff → retry topic → DLQ with headers
            → alert → manual replay
Trade-off: skip without audit can hide payment bugs`}
              />
            </div>
          </Section>

          <Section id="errors" title="21. Retry, DLQ, error decision tree">
            <CodePanel
              title="Decision tree"
              tone="ok"
              code={`Transient downstream? → retry with backoff / pause
Permanent bad payload? → DLQ + commit past / skip policy
Commit/rebalance errors? → refresh membership; never force illegal gen
Auth/ACL? → fix security (not retry loops)
Deser? → DLQ + schema fix
DB exactly-once needed? → idempotent upsert / outbox — not “Kafka EOS” alone`}
            />
            <p className="mt-4 text-sm text-slate-500">
              Full Staff curriculum:{' '}
              <Link href="/kafka-dlq" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Kafka DLQ / DLT board
              </Link>
              .
            </p>
            <div className="mt-4">
              <MiniTable headers={['Error', 'Retry?', 'Action', 'Rebalance?', 'Offset note']} rows={ERROR_CODES} />
            </div>
          </Section>

          <Section id="failures" title="22. Failure matrix and chaos">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-[11px]">
                <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    {['Failure', 'Consumer detects?', 'Group detects?', 'Rebalance?', 'Dup?', 'Loss?', 'Recovery'].map((h) => (
                      <th key={h} className="px-2 py-2 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FAILURE_MATRIX.map((r) => (
                    <tr key={r[0]} className="border-t border-slate-200 dark:border-slate-800">
                      {r.map((c, i) => (
                        <td key={i} className={`px-2 py-2 align-top ${i === 0 ? 'font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <MiniTable headers={['Inject', 'Expected']} rows={CHAOS} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel title="War: poll interval" tone="danger" code={WAR_POLL_INTERVAL} />
              <CodePanel title="War: static membership" code={WAR_STATIC} />
            </div>
            <div className="mt-4 space-y-3">
              {TROUBLESHOOT.slice(5).map((t) => (
                <div key={t.title} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    <strong>Metrics:</strong> {t.metrics} · <strong>Fix:</strong> {t.fix}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    <strong>Prevention:</strong> {t.prevention}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="config" title="23. Configuration reference and interactions">
            <MiniTable headers={['Config', 'Type', 'Default (4.x)', 'Prod note']} rows={CONFIG_CORE} />
            <div className="mt-4">
              <CodePanel title="Interaction matrix" code={INTERACTIONS} />
            </div>
          </Section>

          <Section id="security" title="24. Consumer security">
            <CodePanel
              title="AuthZ path"
              tone="ok"
              code={`Consumer → TLS → SASL → AuthN → ACL
Need: READ on topics + READ on group
GROUP_AUTHORIZATION_FAILED / TOPIC_AUTHORIZATION_FAILED are not “retry harder”
Rotate creds/certs with overlap; fix listeners like any client`}
            />
          </Section>

          <Section id="obs" title="25. Observability and alerts">
            <CodePanel
              title="Signals"
              tone="danger"
              code={`Lag: records-lag / records-lag-max (define committed vs position)
Fetch: fetch-rate, fetch-latency-avg/max, fetch-throttle-time
Commit: commit-rate, commit-latency
Group: assigned-partitions, rebalance-rate/latency, heartbeat-*
Health: records-consumed-rate, bytes-consumed-rate, error rates

P0: group empty / no assignment / auth fail / lag SLO breach accelerating
P1: rebalance storm, commit failures, fetch latency, poison loops
Avoid universal lag thresholds — use SLO + partition context`}
            />
          </Section>

          <Section id="ops" title="26. Kubernetes, DR, multi-cluster">
            <div className="grid gap-3 md:grid-cols-2">
              <CodePanel
                title="K8s consumers"
                tone="ok"
                code={`Deployment/StatefulSet
group.instance.id stable + unique
preStop: wakeup + commitSync + close
terminationGracePeriodSeconds > flush time
Probes must not murder slow batches casually
Roll one-by-one; watch rebalance-rate`}
              />
              <CodePanel
                title="DR / multi-cluster"
                code={`Offsets are cluster-local
MM2 / Cluster Linking → new topics
Failover: expect duplicates
Idempotent sinks + documented offset policy
Active-active = product dedupe problem`}
              />
            </div>
          </Section>

          <Section id="source" title="27. Source-level and protocol flows">
            <div className="grid gap-3 md:grid-cols-2">
              <CodePanel
                title="poll() (names to say)"
                tone="ok"
                code={`poll()
 → updateAssignmentMetadataIfNeeded
 → ConsumerCoordinator (join/HB/commit)
 → Fetcher.sendFetches / collectFetchResponses
 → fetchedRecords
 → ConsumerRecords ≤ max.poll.records
Classes: KafkaConsumer, Fetcher,
SubscriptionState, ConsumerNetworkClient,
FetchSessionHandler`}
              />
              <CodePanel
                title="Group protocol"
                code={`FindCoordinator
 → JoinGroup
 → SyncGroup
 → Heartbeat
 → OffsetCommit / OffsetFetch
 → LeaveGroup
Fetch / ListOffsets / Offset* APIs
carry isolation, generation, member id`}
              />
            </div>
          </Section>

          <Section id="finance" title="28. Financial / payments consumer design">
            <CodePanel
              title="Payment consumer sketch"
              tone="ok"
              code={`Key by accountId → per-account order
group settlement-workers; cooperative sticky; static ids
enable.auto.commit=false
process ledger upsert (idempotent txn id) → commitAsync
commitSync on revoke / shutdown
retry budget → payments.dlq with headers (orig topic/part/off/ex)
read_committed if consuming transactional upstream
Lag + rebalance + DLQ depth dashboards
Never commit-before-process`}
            />
            <div className="mt-4">
              <MiniTable headers={['Scenario', 'Risk', 'Safe design']} rows={PAYMENT_FAILURES} />
            </div>
          </Section>

          <Section id="antipatterns" title="29. Anti-patterns">
            <div className="grid gap-3 md:grid-cols-2">
              {ANTI.map((a) => (
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
            id="staff-gaps"
            title="30. Staff zero-gap — protocol, offsets, network, interceptors"
            lead="The remaining interview edge cases for current Kafka 4.x consumer groups."
          >
            <MiniTable headers={['Topic', 'Classic', 'group.protocol=consumer']} rows={PROTOCOL_COMPARE} />
            <div className="mt-4">
              <CodePanel title="1–2. group.protocol" tone="ok" code={GROUP_PROTOCOL} />
            </div>
            <div className="mt-4">
              <CodePanel title="3. group.remote.assignor" code={REMOTE_ASSIGNOR} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel title="4. Coordinator discovery" code={COORDINATOR_DISCOVERY} />
              <CodePanel title="5–6. OffsetAndMetadata" code={OFFSET_METADATA} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel title="7. OffsetOutOfRange" tone="danger" code={OFFSET_OUT_OF_RANGE} />
              <CodePanel title="8. Transactional fetch visibility" code={TX_VISIBILITY} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel title="9. Network / client internals" code={NETWORK_INTERNALS} />
              <CodePanel title="10. ConsumerInterceptor" code={INTERCEPTORS} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel title="11. Partition-level lag" tone="danger" code={LAG_LEVELS} />
              <CodePanel title="12. Revoked vs Lost" code={REVOKE_VS_LOST} />
            </div>
            <div className="mt-4">
              <CodePanel title="Failure timelines (at-least vs at-most once)" tone="danger" code={FAILURE_TIMELINES} />
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <CodePanel title="Cheat · Protocol" code={STAFF_GAP_CHEATS.protocol} />
              <CodePanel title="Cheat · Coordinator" code={STAFF_GAP_CHEATS.coordinator} />
              <CodePanel title="Cheat · Offset metadata" code={STAFF_GAP_CHEATS.offsetMeta} />
              <CodePanel title="Cheat · OOR" code={STAFF_GAP_CHEATS.oor} />
              <CodePanel title="Cheat · LSO" code={STAFF_GAP_CHEATS.lso} />
              <CodePanel title="Cheat · Revoke/Lost" code={STAFF_GAP_CHEATS.revokeLost} />
              <CodePanel title="Cheat · Timelines" code={STAFF_GAP_CHEATS.timelines} />
            </div>
          </Section>

          <Section id="interview" title="31. Interview drills and cheat sheets">
            <InterviewMode />
            <div className="mt-8 grid gap-3 md:grid-cols-2">
              <CodePanel title="Mental model" tone="ok" code={CHEATS.mental} />
              <CodePanel title="poll()" code={CHEATS.poll} />
              <CodePanel title="Offsets" code={CHEATS.offset} />
              <CodePanel title="Commit" code={CHEATS.commit} />
              <CodePanel title="Group" code={CHEATS.group} />
              <CodePanel title="Rebalance" code={CHEATS.rebalance} />
              <CodePanel title="Fetch" code={CHEATS.fetch} />
              <CodePanel title="Lag" code={CHEATS.lag} />
              <CodePanel title="EOS" code={CHEATS.eos} />
              <CodePanel title="Errors" code={CHEATS.errors} />
              <CodePanel title="Interview hit list" code={CHEATS.interview} />
            </div>
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  KC[KafkaConsumer] --> Sub[Subscription]
  KC --> Coord[ConsumerCoordinator]
  KC --> Meta[Metadata]
  Coord --> GC[Group coordinator]
  GC --> JG[JoinGroup / SyncGroup]
  JG --> Asg[Assignment]
  Asg --> SS[SubscriptionState]
  SS --> F[Fetcher]
  F --> FR[FetchRequest]
  FR --> BR[Broker partition]
  BR --> Buf[Consumer buffer]
  Buf --> Poll[poll]
  Poll --> App[Application]
  App --> Off[Offset commit]
  Off --> CO[__consumer_offsets]`}
              />
            </div>
            <p className="mt-6 text-sm leading-7 text-slate-500">
              Trio:{' '}
              <Link href="/kafka-producer" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Producer
              </Link>
              {' · '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">Consumer</span>
              {' · '}
              <Link href="/kafka-cluster" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Cluster board
              </Link>
              {' · '}
              <Link href="/kafka-mastery" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Interview mastery drills
              </Link>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
