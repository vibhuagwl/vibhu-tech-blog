'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {KAFKA_MASTERY_TOC} from '@/lib/kafka-mastery/toc';
import {
  FIVE_MIN,
  INSTANCE_HEADERS,
  INSTANCE_ROWS,
  MEMORY_SENTENCE,
  MONITOR_ROWS,
  PARTITION_EXAMPLES,
  PARTITION_FORMULA,
  PARTITION_ROWS,
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

/** Deep boards / MDX — no in-page crib copy of those curricula. */
const DEEP_LINKS = [
  {
    href: '/kafka-producer',
    n: '01',
    title: 'Producer',
    blurb: 'Complete board: send() internals, acks, idempotence, PID/seq, transactions, Spring, failures.',
  },
  {
    href: '/kafka-consumer',
    n: '02',
    title: 'Consumer',
    blurb: 'Complete board: poll(), groups, rebalance, commits, lag, DLQ, EOS, failures.',
  },
  {
    href: '/kafka-dlq',
    n: '03',
    title: 'DLQ / DLT / Retry',
    blurb: 'Complete failure recovery: classification, retry topics, Spring handlers, offsets, replay.',
  },
  {
    href: '/kafka-cluster',
    n: '04',
    title: 'Cluster & broker',
    blurb: 'Complete board: KRaft, request path, ISR, storage, multi-AZ, capacity, ops.',
  },
  {
    href: '/kafka-interview/kafka-optimization-index',
    n: '05',
    title: 'Optimization',
    blurb: 'Tune one bottleneck at a time — producer → broker → controller → cluster → consumer.',
  },
  {
    href: '/kafka-interview/kafka-properties',
    n: '06',
    title: 'Properties',
    blurb: 'Must-set baselines and full config reference — not duplicated here.',
  },
];

const DRILL_LINKS = [
  {id: 'monitoring', n: '06', title: 'Monitoring', blurb: 'Lag, URP, ISR, disk, rebalances, offline partitions.'},
  {id: 'instances', n: '07', title: 'Instance counts', blurb: 'Producers, consumers, brokers, controllers, clusters.'},
  {id: 'syncing', n: '08', title: 'Syncing', blurb: 'Follower fetch, ISR, acks=all, high watermark — interview walk.'},
  {id: 'partitions', n: '09', title: 'Partitions', blurb: 'Sizing formula, examples, hot keys.'},
  {id: 'interview', n: '10', title: 'Spoken answers', blurb: 'Senior → architect → rapid decks.'},
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
          Interview map and spoken drills — not a second copy of the producer, consumer, or cluster boards.
          Deep curricula live on those routes; this page owns monitoring, instance counts, syncing, partition
          sizing, and out-loud practice.
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
          <Link href="/kafka-producer" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Producer
          </Link>
          {' · '}
          <Link href="/kafka-consumer" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Consumer
          </Link>
          {' · '}
          <Link href="/kafka-cluster" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Cluster
          </Link>
          {' · '}
          <Link href="/kafka-internals" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Internals
          </Link>
          {' · '}
          <Link href="/spring-kafka-payments-demo" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Spring code
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={KAFKA_MASTERY_TOC} />
        <div className="min-w-0 space-y-16">
          <Section
            id="curriculum"
            title="00. Interview map — open these in order"
            lead="Deep boards first (01–05). Then the drills unique to this page (06–10). Do not study the same producer/consumer/cluster story twice."
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Deep boards (one home each)</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {DEEP_LINKS.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-400">{c.n}</div>
                  <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{c.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{c.blurb}</p>
                  <div className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Open →</div>
                </Link>
              ))}
            </div>

            <h3 className="mt-8 text-lg font-semibold text-slate-900 dark:text-white">Mastery drills (this page only)</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {DRILL_LINKS.map((c) => (
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
            id="monitoring"
            title="01. Kafka monitoring in production"
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
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Broker ops metrics depth:{' '}
              <Link href="/kafka-cluster#monitoring" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Cluster board → monitoring
              </Link>
            </p>
          </Section>

          <Section
            id="instances"
            title="02. How many instances in a distributed environment?"
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
            title="03. How syncing happens between brokers"
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
              Full replication / ISR / HW depth:{' '}
              <Link href="/kafka-cluster#replication" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Cluster board → replication
              </Link>
              {' · '}
              <Link href="/kafka-internals" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Internals board
              </Link>
            </p>
          </Section>

          <Section
            id="partitions"
            title="04. How many partitions do you need in production?"
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
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Related depth:{' '}
              <Link href="/kafka-consumer#scaling" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Consumer scaling
              </Link>
              {' · '}
              <Link href="/kafka-cluster#topics-parts" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Cluster topics & partitions
              </Link>
            </p>
          </Section>

          <Section
            id="interview"
            title="05. Spoken answers — practice out loud"
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
