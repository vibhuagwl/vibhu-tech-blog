import Link from 'next/link';
import {getPostsByCategories,SECTION_CATEGORIES} from '@/lib/posts';

export const metadata={title:'Kafka Interview — Staff+ / Principal'};

const ORDER=[
  'kafka-staff-principal-interview-index',
  'kafka-architecture-interview',
  'kafka-partitions-ordering-interview',
  'kafka-producer-interview',
  'kafka-consumer-interview',
  'kafka-offset-management-interview',
  'kafka-failure-scenarios-interview',
  'kafka-dlq-poison-message-interview',
  'kafka-transactions-payments-interview',
  'kafka-microservices-schema-interview',
  'kafka-performance-scaling-interview',
  'kafka-system-design-architect-interview',
  'kafka-scenario-drills-staff-plus',
];

export default function KafkaInterview(){
  const posts=getPostsByCategories([...SECTION_CATEGORIES['kafka-interview']]);
  const bySlug=new Map(posts.map((p)=>[p.slug,p]));
  const ordered=ORDER.map((s)=>bySlug.get(s)).filter(Boolean) as typeof posts;
  const rest=posts.filter((p)=>!ORDER.includes(p.slug));
  const list=[...ordered,...rest];
  const index=bySlug.get('kafka-staff-principal-interview-index');

  return (
    <main>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,.04)] md:p-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="text-xs font-black uppercase tracking-[.16em] text-blue-600">Staff+ · Principal · Architect</div>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-5xl">Kafka interviews beyond definitions.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          130+ questions on architecture, ordering, producers/consumers, offsets, failure, DLQ, payments/EOS,
          microservices, performance, multi-region design, and scenario drills — scored on recovery and trade-offs.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold dark:bg-slate-900">{posts.length} guides</span>
          {index && (
            <Link href={`/kafka-interview/${index.slug}`} className="rounded-full bg-blue-600 px-3 py-1 font-semibold text-white">
              Start with the index →
            </Link>
          )}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-black">All topics</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {list.map((p)=>(
            <Link key={p.slug} href={`/kafka-interview/${p.slug}`} className="card p-6 transition hover:-translate-y-0.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-600">{p.difficulty} · {p.readingTime}</div>
              <h3 className="mt-3 text-xl font-bold">{p.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{p.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
