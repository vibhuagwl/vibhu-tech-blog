import Link from 'next/link';
import {getPostsByCategories,SECTION_CATEGORIES} from '@/lib/posts';

export const metadata={title:'Distributed Systems'};

export default function Distributed(){
  const posts=getPostsByCategories([...SECTION_CATEGORIES['distributed-systems']]);

  return (
    <main>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,.04)] md:p-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="text-xs font-black uppercase tracking-[.16em] text-blue-600">Distributed Systems</div>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-5xl">Reason about scale, failure and consistency.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          Use the left catalog to jump between topics. Core building blocks for senior backend interviews:
          caching, messaging, partitioning, replication, idempotency and resilience.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold dark:bg-slate-900">{posts.length} topics</span>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-black">All topics</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {posts.map((p)=>(
            <Link key={p.slug} href={`/distributed-systems/${p.slug}`} className="card p-6 transition hover:-translate-y-0.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-600">{p.category} · {p.difficulty}</div>
              <h3 className="mt-3 text-xl font-bold">{p.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{p.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
