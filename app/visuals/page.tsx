import Link from 'next/link';
import {getPostsByCategories,SECTION_CATEGORIES} from '@/lib/posts';

export const metadata={title:'Visual Stories'};

export default function Visuals(){
  const posts=getPostsByCategories([...SECTION_CATEGORIES.visuals]);

  return (
    <main>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,.04)] md:p-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="text-xs font-black uppercase tracking-[.16em] text-blue-600">Visual Stories</div>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-5xl">Learn architecture from pictures, not walls of theory.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          Each guide starts with a full story diagram. Read the image first. Use the short captions only if you need a quick verbal answer for interviews.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold dark:bg-slate-900">{posts.length} visual stories</span>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-black">All visual stories</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {posts.map((p)=>(
            <Link key={p.slug} href={`/visuals/${p.slug}`} className="card p-6 transition hover:-translate-y-0.5">
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
