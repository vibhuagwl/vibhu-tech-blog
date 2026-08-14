import Link from 'next/link';

export const metadata={
  title:'Kafka — Interview Mastery, Producer, Consumer, Cluster, Monitoring',
  description:'Kafka interview hub: dedicated producer, consumer, cluster/controller, optimization, properties, monitoring, instance counts, syncing, and partition sizing — plus Spring code and realtime cases.',
};

const MASTERY_SECTIONS=[
  {
    href:'/kafka-producer',
    number:'01',
    title:'Producer',
    blurb:'Complete producer board: send() internals, acks, idempotence, PID/seq, transactions, Spring, failure matrix.',
  },
  {
    href:'/kafka-mastery#consumer',
    number:'02',
    title:'Consumer',
    blurb:'Groups, poll/commit, lag, crash replay — how many consumer instances (≤ partitions).',
  },
  {
    href:'/kafka-cluster',
    number:'03',
    title:'Cluster & Broker',
    blurb:'Complete cluster board: KRaft, request path, ISR, storage, multi-AZ, capacity, failures, ops.',
  },
  {
    href:'/kafka-mastery#optimization',
    number:'04',
    title:'Optimization',
    blurb:'Tune producer, consumer, broker, and controller — one bottleneck at a time.',
  },
  {
    href:'/kafka-mastery#properties',
    number:'05',
    title:'All properties',
    blurb:'Must-set producer, consumer, cluster, and controller configs with GO/NO-GO.',
  },
  {
    href:'/kafka-mastery#monitoring',
    number:'06',
    title:'Monitoring in prod',
    blurb:'Lag, under-replicated partitions, ISR, disk, rebalances, offline partitions.',
  },
  {
    href:'/kafka-mastery#instances',
    number:'07',
    title:'Instance counts',
    blurb:'Producers, consumers, brokers, controllers, clusters — what to say in the interview.',
  },
  {
    href:'/kafka-mastery#syncing',
    number:'08',
    title:'How syncing works',
    blurb:'Follower fetch, ISR, acks=all, high watermark — how replicas stay in sync.',
  },
  {
    href:'/kafka-mastery#partitions',
    number:'09',
    title:'How many partitions',
    blurb:'Production formula, examples, hot keys, and why “1000 for later” fails interviews.',
  },
];

const LAB_PAGES=[
  {
    href:'/kafka-mastery',
    number:'00',
    title:'Interview Mastery Board',
    blurb:'Full curriculum in one board — producer through partitions, plus spoken-answer drills.',
  },
  {
    href:'/kafka-producer',
    number:'P1',
    title:'Producer Complete Board',
    blurb:'Producer-only deep dive: lifecycle, accumulator, idempotence, transactions, configs, failures, Spring.',
  },
  {
    href:'/kafka-cluster',
    number:'C1',
    title:'Cluster & Broker Board',
    blurb:'KRaft, replication, ISR, storage, page cache, multi-AZ, scaling, monitoring, failure matrix.',
  },
  {
    href:'/spring-kafka-payments-demo',
    number:'A1',
    title:'Kafka Code',
    blurb:'Spring payment-api producer + settlement-worker consumer source explorer.',
  },
  {
    href:'/kafka-interview/kafka-optimization-index',
    number:'A2',
    title:'Optimization story',
    blurb:'Payment-story tuning page (pairs with Mastery §04).',
  },
  {
    href:'/kafka-interview/kafka-properties',
    number:'A3',
    title:'Properties story',
    blurb:'Demo values and corner cases (pairs with Mastery §05).',
  },
  {
    href:'/kafka-interview/kafka-cheat-sheet',
    number:'A4',
    title:'Cheatsheet & Interview',
    blurb:'Memory formulas plus 30s/90s from the Spring payment story.',
  },
  {
    href:'/kafka-interview/kafka-realtime-case',
    number:'A5',
    title:'Realtime Case',
    blurb:'Controller → producer → broker → consumer → retry/DLQ with diagrams.',
  },
  {
    href:'/hadron-dlq',
    number:'A6',
    title:'Hadron CashLines DLQ',
    blurb:'Neptune → retry → DLQ → replay with ordering and idempotency.',
  },
  {
    href:'/kafka-internals',
    number:'A7',
    title:'Internals Board',
    blurb:'Partition writes, replication walkthrough, consumer crash replay.',
  },
];

export default function KafkaInterview(){
  return (
    <main>
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Kafka Tab · Interview Mastery
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          Kafka — win the interview round
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Dedicated sections for producer, consumer, cluster/controller, optimization, properties,
          production monitoring, instance counts, syncing, and partition sizing. Open the mastery board
          first if Kafka keeps getting you rejected.
        </p>
        <p className="mt-4">
          <Link
            href="/kafka-mastery"
            className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
          >
            Open Interview Mastery Board →
          </Link>
        </p>
      </header>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Interview curriculum (one section each)</h2>
        <p className="mt-2 text-sm text-slate-500">Jump straight to the section you get grilled on.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MASTERY_SECTIONS.map((page)=>(
            <Link
              key={page.href}
              href={page.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-400">{page.number}</div>
              <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{page.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{page.blurb}</p>
              <div className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Open section →</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Labs & deep pages</h2>
        <p className="mt-2 text-sm text-slate-500">Code, stories, and boards that back the curriculum.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {LAB_PAGES.map((page)=>(
            <Link
              key={page.href}
              href={page.href}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900/40"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-400">{page.number}</div>
              <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{page.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{page.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">How to revise before an interview (45 minutes)</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
          <li>Open <strong>Producer Complete Board</strong> — say the send() lifecycle and acks=1 vs all out loud.</li>
          <li>Open <strong>Cluster & Broker Board</strong> — KRaft, ISR/HW, leader crash, multi-AZ.</li>
          <li>Open <strong>Interview Mastery</strong> — consumer, monitoring, instance counts, partitions.</li>
          <li>Drill <strong>§07 instance counts</strong> and <strong>§09 partitions</strong> — these fail candidates constantly.</li>
          <li>Skim <strong>§06 monitoring</strong> — name lag, URP, ISR, disk, rebalances.</li>
          <li>Walk <strong>Realtime Case</strong> once so you have a payment story.</li>
          <li>Practice the Mastery <strong>spoken-answer deck</strong> (Senior → Rapid).</li>
        </ol>
      </section>
    </main>
  );
}
