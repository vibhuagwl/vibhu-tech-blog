import Link from 'next/link';

export const metadata={
  title:'Kafka — Interview Hub',
  description:'Kafka interview hub: producer, consumer, cluster, mastery drills, optimization, properties, code, and supporting boards — one card per destination.',
};

/** One card per destination — mastery drills live on /kafka-mastery (not as # fragment cards). */
const CURRICULUM=[
  {
    href:'/kafka-mastery',
    number:'00',
    title:'Interview Mastery',
    blurb:'Interview map + drills: monitoring, instance counts, syncing, partitions, spoken answers.',
  },
  {
    href:'/kafka-producer',
    number:'01',
    title:'Producer',
    blurb:'Complete producer board: send() internals, acks, idempotence, PID/seq, transactions, Spring, failure matrix.',
  },
  {
    href:'/kafka-consumer',
    number:'02',
    title:'Consumer',
    blurb:'Complete consumer board: poll() internals, groups, rebalance, commits, lag, DLQ, EOS, failures.',
  },
  {
    href:'/kafka-cluster',
    number:'03',
    title:'Cluster & Broker',
    blurb:'Complete cluster board: KRaft, request path, ISR, storage, multi-AZ, capacity, failures, ops.',
  },
  {
    href:'/kafka-interview/kafka-optimization-index',
    number:'04',
    title:'Optimization',
    blurb:'End-to-end: producer → broker → controller → cluster → consumer — bottlenecks, knobs, trade-offs.',
  },
  {
    href:'/kafka-interview/kafka-properties',
    number:'05',
    title:'Properties',
    blurb:'Complete Kafka 4.0 producer, consumer, broker, cluster, and controller configs — plus payment must-set GO/NO-GO.',
  },
  {
    href:'/kafka-interview/kafka-realtime-case',
    number:'06',
    title:'Realtime Case',
    blurb:'Controller → producer → broker → consumer → retry/DLQ with diagrams.',
  },
  {
    href:'/spring-kafka-payments-demo',
    number:'07',
    title:'Kafka Code',
    blurb:'Spring payment-api producer + settlement-worker consumer source explorer.',
  },
  {
    href:'/hadron-dlq',
    number:'08',
    title:'Hadron CashLines DLQ',
    blurb:'Neptune → retry → DLQ → replay with ordering and idempotency.',
  },
  {
    href:'/kafka-internals',
    number:'09',
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
          One card per destination. Deep curricula live on dedicated boards; mastery owns the sizing and
          spoken-answer drills.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Interview curriculum</h2>
        <p className="mt-2 text-sm text-slate-500">Jump straight to the topic you get grilled on — each link appears once.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CURRICULUM.map((page)=>(
            <Link
              key={page.href}
              href={page.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-400">{page.number}</div>
              <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{page.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{page.blurb}</p>
              <div className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Open →</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">How to revise before an interview (45 minutes)</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
          <li>Open <strong>§01 Producer</strong> — say the send() lifecycle and acks=1 vs all out loud.</li>
          <li>Open <strong>§02 Consumer</strong> — poll(), session vs max.poll.interval, process→commit timelines.</li>
          <li>Open <strong>§03 Cluster</strong> — KRaft, ISR/HW, leader crash, multi-AZ.</li>
          <li>Open <strong>§00 Mastery</strong> — monitoring, instance counts, syncing, partitions, spoken answers.</li>
          <li>Skim <strong>§05 Properties</strong> and <strong>§04 Optimization</strong> for must-set baselines.</li>
          <li>Walk <strong>§07 Realtime Case</strong> once so you have a payment story.</li>
          <li>Practice the Mastery <strong>spoken-answer deck</strong> (Senior → Rapid).</li>
        </ol>
      </section>
    </main>
  );
}
