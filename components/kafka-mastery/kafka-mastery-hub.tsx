'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {KAFKA_MASTERY_TOC} from '@/lib/kafka-mastery/toc';
import {
  CLUSTER_ROWS,
  CONSUMER_FLOW,
  CONSUMER_ROWS,
  FIVE_MIN,
  INSTANCE_HEADERS,
  INSTANCE_ROWS,
  MEMORY_SENTENCE,
  MONITOR_ROWS,
  OPT_BROKER,
  OPT_CONSUMER,
  OPT_CONTROLLER,
  OPT_PRODUCER,
  PARTITION_EXAMPLES,
  PARTITION_FORMULA,
  PARTITION_ROWS,
  PRODUCER_FLOW,
  PRODUCER_ROWS,
  PROPS_CLUSTER,
  PROPS_CONSUMER,
  PROPS_CONTROLLER,
  PROPS_PRODUCER,
  REJECTION_KILLERS,
  SIXTY_SEC,
  SYNC_STEPS,
} from '@/lib/kafka-mastery/content';
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

const CURRICULUM = [
  {id: 'producer', n: '01', title: 'Producer', blurb: 'Send path, keys, acks, batching, idempotence, how many producer instances.'},
  {id: 'consumer', n: '02', title: 'Consumer', blurb: 'Groups, poll/commit, lag, crash replay, how many consumer instances.'},
  {id: 'cluster', n: '03', title: 'Cluster & controller', blurb: 'Brokers, KRaft controller, topics, partitions, replicas, ISR.'},
  {id: 'optimization', n: '04', title: 'Optimization', blurb: 'Tune producer, consumer, broker, and controller — one bottleneck at a time.'},
  {id: 'properties', n: '05', title: 'All properties', blurb: 'Must-set producer, consumer, cluster, and controller configs.'},
  {id: 'monitoring', n: '06', title: 'Monitoring', blurb: 'Prod metrics: lag, URP, ISR, disk, rebalances, offline partitions.'},
  {id: 'instances', n: '07', title: 'Instance counts', blurb: 'Producers, consumers, brokers, controllers, clusters in a distributed env.'},
  {id: 'syncing', n: '08', title: 'Syncing', blurb: 'How replicas fetch, ISR, acks=all, high watermark.'},
  {id: 'partitions', n: '09', title: 'Partitions', blurb: 'How many partitions you need — formula, examples, hot keys.'},
];

export default function KafkaMasteryHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · Architect · Stop failing Kafka rounds
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Kafka Interview Mastery
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          One section for producer. One for consumer. One for cluster and controller. Then optimization,
          every important property, production monitoring, instance counts, syncing, and partition math —
          the answers interviewers expect when they reject “I used Kafka” stories.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Hub:{' '}
          <Link href="/kafka-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Kafka
          </Link>
          {' · '}
          <Link href="/kafka-internals" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Internals board
          </Link>
          {' · '}
          <Link href="/spring-kafka-payments-demo" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Spring code
          </Link>
          {' · '}
          <Link href="/kafka-interview/kafka-cheat-sheet" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Cheatsheet
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={KAFKA_MASTERY_TOC} />
        <div className="min-w-0 space-y-16">
          <Section
            id="curriculum"
            title="00. Interview map — open these in order"
            lead="If you only have one hour before a Kafka loop, walk 01→09 once out loud. If you have a day, drill the spoken answers at the bottom."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {CURRICULUM.map((c) => (
                <a
                  key={c.id}
                  href={`#${c.id}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-400">{c.n}</div>
                  <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{c.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{c.blurb}</p>
                </a>
              ))}
            </div>
            <div className="mt-6 space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Rejection killers — never say these</h3>
              {REJECTION_KILLERS.map((r) => (
                <div key={r.trap} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-sm leading-6 text-rose-700 dark:text-rose-300">
                    <strong>Trap:</strong> {r.trap}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-emerald-800 dark:text-emerald-300">
                    <strong>Say instead:</strong> {r.fix}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="producer"
            title="01. Producer only"
            lead="The producer is an application client. It appends to the partition leader. It does not delete, consume, or talk to followers for writes."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart LR
  App[payment-api] --> Ser[Serialize]
  Ser --> Part[Partitioner by key]
  Part --> Acc[Accumulator batch]
  Acc --> Comp[Compress]
  Comp --> L[Leader broker]
  L -->|acks=all| App`}
              />
            </div>
            <div className="mt-4">
              <MiniTable headers={['Idea', 'Interview answer']} rows={PRODUCER_ROWS} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel title="Producer path" tone="ok" code={PRODUCER_FLOW} />
              <CodePanel
                title="Payment producer baseline"
                code={`acks=all
enable.idempotence=true
retries=10
linger.ms=25
batch.size=65536
compression.type=zstd
max.in.flight.requests.per.connection=5
key = accountId:paymentId`}
              />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              <strong>How many producer instances?</strong> As many application pods as your API tier needs.
              Kafka does not cap producers at partition count. Each pod creates its own producer client. Scale on
              RPS/CPU; keep batching so you do not open one network request per HTTP call.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Full producer deep board:{' '}
              <Link href="/kafka-producer" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Kafka Producer Complete
              </Link>
              {' '}— send() internals, PID/epoch/seq, transactions, config profiles, failure matrix, Spring.
            </p>
          </Section>

          <Section
            id="consumer"
            title="02. Consumer only"
            lead="The consumer pulls. Progress is a committed offset, not message deletion. A group shares work; another group gets its own full copy of the log."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TD
  G[group settlement-workers] --> A[Consumer A owns p0 p1]
  G --> B[Consumer B owns p2 p3]
  G --> C[Consumer C owns p4 p5]
  A --> Poll[poll → process → commit]
  B --> Poll
  C --> Poll
  Audit[group audit-indexers] --> Full[Reads ALL partitions independently]`}
              />
            </div>
            <div className="mt-4">
              <MiniTable headers={['Idea', 'Interview answer']} rows={CONSUMER_ROWS} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel title="Consumer path" tone="ok" code={CONSUMER_FLOW} />
              <CodePanel
                title="Payment consumer baseline"
                code={`enable.auto.commit=false
max.poll.records=50
max.poll.interval.ms=300000
session.timeout.ms=45000
heartbeat.interval.ms=15000
CooperativeStickyAssignor
isolation.level=read_committed  # if tx used

process → UNIQUE(payment_id) → commitSync`}
              />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              <strong>How many consumer instances?</strong> In one <code>group.id</code>, useful members ≤
              partition count. Ten partitions and twenty pods ⇒ ten idle. Scale processing first; add partitions
              only with a migration story; then add pods.
            </p>
          </Section>

          <Section
            id="cluster"
            title="03. Kafka cluster and controller"
            lead="A cluster is brokers plus a metadata quorum. Brokers hold logs. The controller elects leaders and tracks ISR. Clients talk to leaders for data."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  subgraph kraft [KRaft controller quorum]
    C1[Controller]
    C2[Controller]
    C3[Controller]
  end
  subgraph brokers [Brokers 3 AZs]
    B1[B1 leader p0]
    B2[B2 follower p0]
    B3[B3 follower p0]
  end
  kraft --> brokers
  Prod[Producers] --> B1
  Cons[Consumers] --> B1`}
              />
            </div>
            <div className="mt-4">
              <MiniTable headers={['Piece', 'What it does']} rows={CLUSTER_ROWS} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Broker = data plane"
                tone="ok"
                code={`Stores segments on disk
Serves Produce / Fetch
Holds leader + follower replicas
Page cache + sequential I/O
Alert: disk, URP, request latency`}
              />
              <CodePanel
                title="Controller = metadata plane"
                code={`KRaft Raft quorum (3 or 5)
Elects partition leaders
Tracks ISR membership
Handles broker join/leave
NOT required on every produce path`}
              />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Interview trap: describing ZooKeeper as the modern default. Say KRaft. Mention ZK only as history
              or migration. Combined <code>broker,controller</code> roles are fine for a small cluster; split
              controllers when metadata load fights disk I/O.
            </p>
          </Section>

          <Section
            id="optimization"
            title="04. Optimization — producer, consumer, broker, controller"
            lead="Find where time goes. Change one layer. Measure again. Listing twenty properties without a bottleneck is how candidates get rejected."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TD
  Slow[Slow settlement?] --> Where{Where is time?}
  Where -->|produce p99| P[Producer batch compress]
  Where -->|lag CPU low| D[Downstream bank]
  Where -->|lag CPU high| C[Consumer poll budget]
  Where -->|URP disk| B[Broker disk net partitions]
  Where -->|leader flaps| K[Controller quorum preferred leaders]
  P --> M[Measure]
  D --> M
  C --> M
  B --> M
  K --> M`}
              />
            </div>
            <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">Producer</h3>
            <MiniTable headers={['Goal', 'Turn', 'Trade-off']} rows={OPT_PRODUCER} />
            <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">Consumer</h3>
            <MiniTable headers={['Symptom', 'First move', 'Watch out']} rows={OPT_CONSUMER} />
            <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">Broker</h3>
            <MiniTable headers={['Symptom', 'First move', 'Watch out']} rows={OPT_BROKER} />
            <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">Controller</h3>
            <MiniTable headers={['Topic', 'Do this', 'Why']} rows={OPT_CONTROLLER} />
            <p className="mt-4 text-sm leading-7 text-slate-500">
              Deep story page:{' '}
              <Link href="/kafka-interview/kafka-optimization-index" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Kafka Optimization
              </Link>
            </p>
          </Section>

          <Section
            id="properties"
            title="05. All Kafka properties — producer, consumer, cluster, controller"
            lead="Memorize the must-set table, not the entire Kafka docs. Security is a GO/NO-GO in production."
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Producer properties</h3>
            <MiniTable headers={['Property', 'Target', 'Remember']} rows={PROPS_PRODUCER} />
            <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">Consumer properties</h3>
            <MiniTable headers={['Property', 'Target', 'Remember']} rows={PROPS_CONSUMER} />
            <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">Cluster / broker properties</h3>
            <MiniTable headers={['Property', 'Target', 'Remember']} rows={PROPS_CLUSTER} />
            <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">Controller (KRaft) properties</h3>
            <MiniTable headers={['Property', 'Target', 'Remember']} rows={PROPS_CONTROLLER} />
            <div className="mt-4">
              <CodePanel
                title="GO / NO-GO before prod"
                tone="ok"
                code={`[ ] acks=all + idempotence + minISR=2
[ ] auto.commit=false on money consumers
[ ] unclean.leader.election.enable=false
[ ] auto.create.topics.enable=false
[ ] SASL_SSL from app pods
[ ] retention = replay window (not “forever guess”)
[ ] poison path → DLQ tested
[ ] lag + URP + disk alerts wired`}
              />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              Full property story:{' '}
              <Link href="/kafka-interview/kafka-properties" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Kafka Properties
              </Link>
            </p>
          </Section>

          <Section
            id="monitoring"
            title="06. Kafka monitoring in production"
            lead="If you only watch CPU, you will miss the outage. Cluster health and consumer lag are two different dashboards."
          >
            <MiniTable headers={['Metric', 'What it means', 'Severity']} rows={MONITOR_ROWS} />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="On-call order"
                tone="danger"
                code={`1. Offline partitions?
2. Disk full / produce failing?
3. Under-replicated rising?
4. ISR thrashing?
5. Then consumer lag SLO
6. Then rebalance rate during deploy`}
              />
              <CodePanel
                title="Lag is not enough"
                tone="ok"
                code={`Lag high + URP high     → fix brokers first
Lag high + rebalances   → fix membership / poll
Lag high + one partition→ hot key
Lag high + all equal    → scale processing / partitions
Lag low + produce errors→ minISR / ISR capacity`}
              />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Tooling: Kafka exporter / burrow / Confluent metrics → Prometheus → Grafana. JMX is fine; the
              interview cares that you know <em>which</em> signals map to which failure, not the brand name.
            </p>
          </Section>

          <Section
            id="instances"
            title="07. How many instances in a distributed environment?"
            lead="Say the unit clearly: producer pods ≠ broker count ≠ consumer pods ≠ number of clusters."
          >
            <MiniTable headers={INSTANCE_HEADERS} rows={INSTANCE_ROWS} />
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart LR
  API[Producer pods N] --> K[Kafka brokers 3+]
  K --> W[Consumer pods ≤ partitions]
  KC[KRaft 3] --> K
  API -.->|scale by RPS| API
  W -.->|scale by partitions| W
  K -.->|scale by disk net| K`}
              />
            </div>
            <div className="mt-4">
              <CodePanel
                title="Say this in the interview"
                tone="ok"
                code={`Brokers:     3 floor, 3 AZs, often 5–7+
Controllers: 3 (or 5) KRaft
RF / minISR: 3 / 2
Producers:   N API pods — not tied to partitions
Consumers:   ≤ partitions per group
Clusters:    1 shared + quotas; 2nd for DR/isolation
Connect/SR:  separate HA — not on broker JVMs`}
              />
            </div>
          </Section>

          <Section
            id="syncing"
            title="08. How syncing happens between brokers"
            lead="Replication is pull. Followers fetch from the leader. ISR is the durability set. Consumers read the high watermark."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`sequenceDiagram
  participant P as Producer
  participant L as Leader B1
  participant F2 as Follower B2
  participant F3 as Follower B3
  participant C as Consumer
  P->>L: Produce acks=all
  L->>L: append LEO
  F2->>L: Fetch
  F3->>L: Fetch
  F2-->>L: caught up
  F3-->>L: caught up
  L-->>P: ACK
  L->>L: HW advances
  C->>L: Fetch up to HW`}
              />
            </div>
            <div className="mt-4">
              <MiniTable headers={['Step', 'What happens']} rows={SYNC_STEPS} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Healthy sync"
                tone="ok"
                code={`RF=3
ISR={B1,B2,B3}
min.insync.replicas=2
acks=all
→ produce OK
→ lose B1 → B2 elected from ISR
→ no rewind of committed HW data`}
              />
              <CodePanel
                title="Broken sync"
                tone="danger"
                code={`B2+B3 lag out of ISR
ISR={B1} < minISR 2
acks=all → NotEnoughReplicas
Producer fails (good)
Do NOT enable unclean leader election
to “keep accepting writes”`}
              />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              Visual internals:{' '}
              <Link href="/kafka-internals" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Kafka Internals Board
              </Link>
            </p>
          </Section>

          <Section
            id="partitions"
            title="09. How many partitions do you need in production?"
            lead="Partitions buy parallelism and cost metadata, memory, and rebalance time. Size from math and measurement — not from fear."
          >
            <CodePanel title="Sizing formula" tone="ok" code={PARTITION_FORMULA} />
            <div className="mt-4">
              <MiniTable headers={['Driver', 'How it affects count']} rows={PARTITION_ROWS} />
            </div>
            <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">Example starting points</h3>
            <MiniTable headers={['Workload', 'Partitions', 'Notes']} rows={PARTITION_EXAMPLES} />
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TD
  Need[Need 20k msg/s consume] --> Per[One consumer ~2k/s]
  Per --> P[ceil 20k/2k = 10 partitions]
  P --> Head[Add headroom → 12–16]
  Head --> Cons[Run ≤16 consumer pods in the group]
  Cons --> Hot{Hot key?}
  Hot -->|yes| Split[Re-key / shard whales]
  Hot -->|no| Done[Measure lag p99]`}
              />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Increasing partitions later does <strong>not</strong> reshuffle existing keyed history. New keys
              hash into the new set; old keys stay. Decreasing partitions is operationally painful — treat
              partition count as a carefully grown capacity knob.
            </p>
          </Section>

          <Section
            id="interview"
            title="10. Spoken answers — practice out loud"
            lead="Senior deck covers each section. Architect deck is sizing and AZ loss. Rapid deck is offsets, ISR, and instance counts under pressure."
          >
            <InterviewMode />
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">60-second answer</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{SIXTY_SEC}</p>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">5-minute board walk</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {FIVE_MIN.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
            <p className="mt-6 text-sm leading-7 text-slate-500">
              Next:{' '}
              <Link href="/kafka-interview/kafka-realtime-case" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Realtime case
              </Link>
              {' · '}
              <Link href="/kafka-internals" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Internals
              </Link>
              {' · '}
              <Link href="/hadron-dlq" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Hadron DLQ
              </Link>
              {' · '}
              <Link href="/kafka-interview/kafka-cheat-sheet" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Cheatsheet
              </Link>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
