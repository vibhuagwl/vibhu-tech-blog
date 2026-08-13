import Link from 'next/link';
import {getPostsByCategories,SECTION_CATEGORIES} from '@/lib/posts';

export const metadata={title:'Performance — Java / Spring Playbooks'};

const ORDER=[
  'performance-master-index',
  'performance-latency-spike-investigation',
  'performance-scale-10k-to-1m',
  'performance-identify-bottlenecks',
  'performance-caching-spring-redis',
  'performance-jvm-high-throughput',
  'performance-backpressure-load-shedding',
];

export default function PerformanceHub(){
  const posts=getPostsByCategories([...SECTION_CATEGORIES.performance]);
  const bySlug=new Map(posts.map((p)=>[p.slug,p]));
  const ordered=ORDER.map((s)=>bySlug.get(s)).filter(Boolean) as typeof posts;
  const rest=posts.filter((p)=>!ORDER.includes(p.slug));
  const list=[...ordered,...rest];
  const index=bySlug.get('performance-master-index');

  return (
    <main>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,.04)] md:p-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="text-xs font-black uppercase tracking-[.16em] text-slate-600">Staff+ · Principal · On-call</div>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-5xl">Performance — fix it in Spring, not in slides.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          Practical Java/Spring playbooks: latency 50ms→2s, scale 10K→1M RPS, bottlenecks, Redis cache patterns,
          JVM throughput, backpressure, traffic spikes, and load shedding — with runnable-style code, not theory.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold dark:bg-slate-900">{posts.length} guides</span>
          {index && (
            <Link href={`/performance/${index.slug}`} className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
              Start with the index →
            </Link>
          )}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-black">Playbooks</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {list.map((p)=>(
            <Link key={p.slug} href={`/performance/${p.slug}`} className="card p-6 transition hover:-translate-y-0.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-600">{p.difficulty} · {p.readingTime}</div>
              <h3 className="mt-3 text-xl font-bold">{p.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{p.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
