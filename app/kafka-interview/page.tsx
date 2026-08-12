import Link from 'next/link';

export const metadata={
  title:'Kafka — Code, Optimization, Properties, Cheatsheet, Realtime',
  description:'Five practical Kafka pages: runnable Spring code, optimization story, properties, cheatsheet & interview, and realtime payment case with diagrams.',
};

const PAGES=[
  {
    href:'/spring-kafka-payments-demo',
    number:'01',
    title:'Kafka Code',
    blurb:'Browse the Spring microservices source: payment-api producer, settlement-worker consumer, DLQ, keys, batching, compression.',
  },
  {
    href:'/kafka-interview/kafka-optimization-index',
    number:'02',
    title:'Optimization',
    blurb:'One page for producer + consumer + broker tuning with diagrams and the payment story — not three separate theory pages.',
  },
  {
    href:'/kafka-interview/kafka-properties',
    number:'03',
    title:'Properties',
    blurb:'Producer, consumer, and broker must-set properties with demo values, corner cases, and GO/NO-GO.',
  },
  {
    href:'/kafka-interview/kafka-cheat-sheet',
    number:'04',
    title:'Cheatsheet & Interview',
    blurb:'Memory formulas plus one interview story: 30s, 90s, and follow-ups from real Spring Kafka code.',
  },
  {
    href:'/kafka-interview/kafka-realtime-case',
    number:'05',
    title:'Realtime Case',
    blurb:'Controller → producer → broker → consumer → retry/DLQ with sequence diagrams, curl, and failure matrix.',
  },
];

export default function KafkaInterview(){
  return (
    <main>
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Kafka Tab
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          Kafka — 5 practical pages
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          No giant topic dump. One Spring payment story, real code, diagrams, and interview lines you can remember.
        </p>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PAGES.map((page)=>(
          <Link
            key={page.href}
            href={page.href}
            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-400">{page.number}</div>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{page.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{page.blurb}</p>
            <div className="mt-4 text-sm font-semibold text-blue-700 dark:text-blue-400">Open →</div>
          </Link>
        ))}
      </section>

      <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">How to revise (15 minutes)</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
          <li>Open <strong>Realtime Case</strong> — learn the payment flow with diagrams.</li>
          <li>Open <strong>Kafka Code</strong> — click `PaymentController` and `SettlementKafkaConfig`.</li>
          <li>Skim <strong>Optimization</strong> then <strong>Properties</strong> — same knobs, same story.</li>
          <li>Say the <strong>Cheatsheet & Interview</strong> 30-second answer out loud.</li>
        </ol>
      </section>
    </main>
  );
}
