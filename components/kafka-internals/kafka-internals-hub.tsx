'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {KAFKA_INTERNALS_TOC} from '@/lib/kafka-internals/toc';
import {
  ANATOMY_ROWS,
  CHEAT_ROWS,
  CONSUMER_FAIL_ROWS,
  FIVE_MIN,
  INSTANCE_HEADERS,
  INSTANCE_ROWS,
  MEMORY_SENTENCE,
  MISTAKES,
  PROD_CHECKLIST,
  REPLICA_ROWS,
  SIXTY_SEC,
  TWO_MINUTE_STORY,
  WRITE_STEPS,
} from '@/lib/kafka-internals/comparison';
import CodePanel from './code-panel';
import InterviewMode from './interview-mode';
import SequenceWalkthrough from './sequence-walkthrough';
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
                <td key={i} className={`px-2 py-2 align-top ${i === 0 ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
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

const QUESTION_CARDS = [
  {href: '#overview', q: 'How does Kafka work internally?', a: 'Distributed append-only log. Leader writes. Followers fetch. Consumers pull by offset.'},
  {href: '#production', q: 'How do you deploy it in production?', a: 'KRaft, 3 AZs, RF=3, minISR=2, acks=all, dedicated disks.'},
  {href: '#production', q: 'How many instances?', a: '3 brokers floor. Often 5–7+. KRaft quorum 3. Consumers ≤ partitions.'},
  {href: '#replication', q: 'How is data replicated?', a: 'Followers pull from the partition leader until they join the ISR.'},
  {href: '#write-path', q: 'How is a record written into a partition?', a: 'Sequential append to the active segment. Offset assigned. Then replicate.'},
  {href: '#consumer-fail', q: 'Consumer failed — same message again?', a: 'Same group, uncommitted offset → yes, but not necessarily the same JVM.'},
];

export default function KafkaInternalsHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · Architect · Production Kafka
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Kafka Internals Board
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          How Kafka actually stores, replicates, and redelivers a payment event — instance counts included.
          Not a property dump. One board you can walk in an interview.
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
          <Link href="/kafka-mastery" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Interview mastery
          </Link>
          {' · '}
          <Link href="/realtime-issues/spring-kafka-dlq-payments" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Realtime case
          </Link>
          {' · '}
          <Link href="/spring-kafka-payments-demo" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Spring code
          </Link>
          {' · '}
          <Link href="/hadron-dlq" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Hadron DLQ
          </Link>
        </p>
      </header>

      <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {QUESTION_CARDS.map((c) => (
          <a
            key={c.q}
            href={c.href}
            className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950"
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.q}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{c.a}</p>
          </a>
        ))}
      </div>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={KAFKA_INTERNALS_TOC} />
        <div className="min-w-0 space-y-16">
          <Section
            id="overview"
            title="01. How Kafka works internally"
            lead="Kafka is a replicated commit log. It is not a queue that deletes when someone reads. That one sentence explains fan-out, replay, and why a crashed consumer can see the same payment again."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart LR
  P[Producers] --> T[Topic partitions]
  T --> B[Broker logs]
  B --> G1[Group settlement]
  B --> G2[Group audit]
  G1 --> C1[One owner per partition]
  G2 --> C2[Independent cursor]`}
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Queue mindset — wrong"
                tone="danger"
                code={`put(msg)
consumer.take()  → message gone
failed consumer  → message lost unless ack/nack queue
second team      → cannot read the same stream cheaply`}
              />
              <CodePanel
                title="Log mindset — Kafka"
                tone="ok"
                code={`append(record) → offset 1042
retain 7 days / 1 TB
group A cursor = 1043
group B cursor = 900
crash before commit → cursor stays 1040
anyone in the group may replay`}
              />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Sequential disk I/O plus partition parallelism is why Kafka is fast. Random updates and global
              ordering are not the product. If you need a work queue with competing consumers and destructive
              reads, say so in the interview — and then explain why payments still pick the log.
            </p>
          </Section>

          <Section
            id="anatomy"
            title="02. Cluster anatomy"
            lead="A cluster is brokers plus a metadata quorum. Data lives on brokers. Leadership and membership live on the controller (KRaft)."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  subgraph meta [KRaft quorum]
    K1[Controller-1]
    K2[Controller-2]
    K3[Controller-3]
  end
  subgraph data [Brokers]
    B1[Broker-1 AZ-a]
    B2[Broker-2 AZ-b]
    B3[Broker-3 AZ-c]
  end
  P[payment-api] --> B1
  C[settlement-worker] --> B2
  meta --> data`}
              />
            </div>
            <div className="mt-4">
              <MiniTable headers={['Piece', 'What it actually does']} rows={ANATOMY_ROWS} />
            </div>
            <div className="mt-4">
              <CodePanel
                title="One topic on three brokers"
                code={`topic payments  RF=3  partitions=6

p0 leader=B1  followers=B2,B3
p1 leader=B2  followers=B3,B1
p2 leader=B3  followers=B1,B2
p3 leader=B1  followers=B3,B2
...

Producer for key=A100 → partition p0 → talks to B1 only`}
              />
            </div>
          </Section>

          <Section
            id="write-path"
            title="03. How Kafka writes content in a partition"
            lead="The leader appends. It does not update-in-place. Offset is the address. Segments are the files."
          >
            <MiniTable headers={['Step', 'What happens']} rows={WRITE_STEPS} />
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TD
  Rec[Record key=A100] --> Part[Partitioner]
  Part --> L[Leader broker]
  L --> Seg[Active segment .log]
  Seg --> Off[Offset 1042]
  Off --> Idx[.index + .timeindex]
  Off --> Fetchers[Follower fetchers]
  Fetchers --> HW[High watermark]
  HW --> Cons[Consumers may fetch]`}
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="On disk — one partition"
                code={`.../payments-7/
  00000000000000000000.log
  00000000000000000000.index
  00000000000000000000.timeindex
  00000000000000001024.log     ← rolled
  00000000000000001024.index
  leader-epoch-checkpoint

Active segment takes sequential appends.
Old segments are deleted by retention, not by consume.`}
              />
              <CodePanel
                title="Offsets in the log"
                tone="ok"
                code={`offset 1040  capture A100 ₹500
offset 1041  capture B200 ₹20
offset 1042  capture A100 ₹80   ← just appended
LEO = 1043   (next write)
HW  = 1042   (ISR has 1041; 1042 still catching up)

Consumer fetch returns 1040,1041
not 1042 until HW moves`}
              />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Kafka does not fsync every produce by default. The production durability story is{' '}
              <strong>replication to ISR</strong> plus OS page cache, not “every byte on spinning rust before ACK”.
              That is why <code>acks=all</code> and <code>min.insync.replicas</code> are the payment knobs, and why a
              single-broker “cluster” is a toy.
            </p>
          </Section>

          <Section
            id="replication"
            title="04. Replication between Kafka instances"
            lead="Copies live on different brokers. Followers fetch from the leader — the same pull model consumers use. ISR is the live durability set."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart LR
  subgraph azA [AZ-a]
    L[Leader B1]
  end
  subgraph azB [AZ-b]
    F2[Follower B2]
  end
  subgraph azC [AZ-c]
    F3[Follower B3]
  end
  P[Producer acks=all] --> L
  F2 -->|fetch| L
  F3 -->|fetch| L
  L -->|ACK when ISR has it| P`}
              />
            </div>
            <div className="mt-4">
              <MiniTable headers={['Question', 'Production answer']} rows={REPLICA_ROWS} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="ISR healthy"
                tone="ok"
                code={`RF = 3
ISR = {B1, B2, B3}
min.insync.replicas = 2
acks = all
→ produce succeeds
→ two other AZs have the bytes
→ B1 can die; B2 becomes leader`}
              />
              <CodePanel
                title="ISR shrinks"
                tone="danger"
                code={`B3 disk stall → leaves ISR
ISR = {B1, B2}  still ≥ minISR 2
→ produces still OK
B2 also dies → ISR = {B1}
→ acks=all fails (NotEnoughReplicas)
→ better than silent data loss`}
              />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              <code>unclean.leader.election.enable=true</code> lets an out-of-ISR replica become leader and silently
              drop records the old leader had. Leave it off. Prefer a brief outage over a wrong ledger.
            </p>
          </Section>

          <Section
            id="production"
            title="05. Deploy in production — how many instances?"
            lead="There is no universal ‘N Kafka boxes’. There is a floor (3), a quorum (3 or 5), and then math: disk × RF × retention, plus partitions for consumer parallelism."
          >
            <MiniTable headers={INSTANCE_HEADERS} rows={INSTANCE_ROWS} />
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  subgraph floor [Production floor]
    B1[Broker AZ-a]
    B2[Broker AZ-b]
    B3[Broker AZ-c]
    C1[KRaft]
    C2[KRaft]
    C3[KRaft]
  end
  App1[payment-api x N] --> B1
  App1 --> B2
  App1 --> B3
  W1[settlement-worker x P] --> B1
  W1 --> B2
  W1 --> B3`}
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Interview default (say this)"
                tone="ok"
                code={`Brokers:            3 minimum, 3 racks
KRaft controllers:  3 (combined OK if small)
RF:                 3
min.insync.replicas 2
acks:               all
unclean election:   false
Consumers:          start = partition count
Disk:               local SSD, sized for retention×RF`}
              />
              <CodePanel
                title="How I would NOT size it"
                tone="danger"
                code={`“Just run 1 Kafka in Kubernetes”
RF=3 on one StatefulSet replica
ZooKeeper on the same disk
Consumers = number of engineers
Partitions = 1000 “for the future”
minISR = 3  (any blip blocks payments)`}
              />
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {PROD_CHECKLIST.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Combined broker+controller (KRaft process.roles=broker,controller) is acceptable for a small
              payments bus. When metadata traffic and log I/O fight, split controllers onto dedicated nodes.
              Kafka Connect, Schema Registry, and Cruise Control are extra processes — they do not count as
              “Kafka instances” for RF.
            </p>
          </Section>

          <Section
            id="consumer-fail"
            title="06. Consumer failed — will the same consumer read the same message?"
            lead="Short answer: the group may re-read the same records. The same process is not part of the contract. Kafka tracks group + partition + committed offset, not pod name."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TD
  Crash[Consumer dies] --> Q{Offset committed?}
  Q -->|No| Replay[Rebalance. Someone fetches those offsets again]
  Q -->|Yes| Skip[Group continues from next offset]
  Replay --> Who[C2 or a new C1 pod — not 'the same consumer']
  Skip --> Done[Those records are done for this group]
  Crash --> Other[A different group still has its own cursor]`}
              />
            </div>
            <div className="mt-4">
              <MiniTable headers={['Question', 'Answer']} rows={CONSUMER_FAIL_ROWS} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Before commit — replay"
                tone="danger"
                code={`C1 poll offset 1042
C1 ledger.insert(payment)   // succeeded
C1 crash
committed offset still 1040

Rebalance
C2 assigned payments-7
C2 poll 1040..1042
Same message, different JVM

UNIQUE(payment_id) saves you`}
              />
              <CodePanel
                title="After commit — no replay"
                tone="ok"
                code={`C1 poll 1042
C1 ledger.insert
C1 commitSync(1043)
C1 crash

C2 starts at 1043
1042 will not return to this group

If you committed BEFORE the ledger
write, 1042 is skipped forever
→ at-most-once / lost payment`}
              />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              <code>enable.auto.commit=true</code> commits on a timer, which can land before or after your side
              effect. Payments use manual commit after a successful, idempotent write. A second consumer{' '}
              <em>group</em> (audit, warehouse) is supposed to read the same messages — that is the point of a log.
            </p>
          </Section>

          <Section
            id="walkthrough"
            title="07. Internals walkthrough"
            lead="Click each strip. Same payment event: produce, replicate, ACK, consume, crash, leader fail."
          >
            <SequenceWalkthrough />
          </Section>

          <Section
            id="interview"
            title="08. Interview board"
            lead="Senior for the six questions on this page. Architect for sizing and AZ loss. Rapid for offsets, ISR, and instance counts."
          >
            <InterviewMode />
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">60-second answer</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{SIXTY_SEC}</p>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">2-minute story</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                {TWO_MINUTE_STORY}
              </p>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">5-minute board walk</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {FIVE_MIN.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
          </Section>

          <Section id="cheat" title="09. Memory formulas and production traps">
            <MiniTable headers={['Idea', 'Remember']} rows={CHEAT_ROWS} />
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {MISTAKES.map((m) => (
                <div key={m.title} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{m.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-rose-700 dark:text-rose-300">
                    <strong>Wrong:</strong> {m.bad}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-emerald-800 dark:text-emerald-300">
                    <strong>Right:</strong> {m.good}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm leading-7 text-slate-500">
              Next:{' '}
              <Link href="/realtime-issues/spring-kafka-dlq-payments" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Realtime payment case
              </Link>
              {' · '}
              <Link href="/kafka-interview/kafka-properties" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Properties
              </Link>
              {' · '}
              <Link href="/kafka-interview/kafka-cheat-sheet" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Cheatsheet
              </Link>
              {' · '}
              <Link href="/hadron-dlq" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Hadron DLQ
              </Link>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
