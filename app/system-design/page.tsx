import Link from 'next/link';
import {getPostsByCategories,SECTION_CATEGORIES} from '@/lib/posts';

export const metadata={title:'System Design Problems'};

const WHATSAPP_PATH=[
  {
    href:'/system-design/whatsapp-system-design-master-index',
    title:'WhatsApp System Design Curriculum',
    blurb:'Staff/Lead HLD: WebSocket, Kafka, Redis, sharding, media, calls, failures — story-first with Mermaid.',
  },
  {
    href:'/system-design/whatsapp-diagrams-memory-map',
    title:'WhatsApp Diagram Memory Map',
    blurb:'Maximum Mermaid diagrams for last-minute whiteboard recall.',
  },
  {
    href:'/system-design/whatsapp-interview-failures-cheatsheet',
    title:'WhatsApp Cheat Sheet & What-Ifs',
    blurb:'25 Q&A answers, corner cases, and a one-page whiteboard cheat sheet.',
  },
];

export default function SystemDesign(){
  const posts=getPostsByCategories([...SECTION_CATEGORIES['system-design']]);
  const designs=posts.filter((p)=>p.category==='System Design');
  const guides=posts.filter((p)=>p.category!=='System Design');

  return (
    <main>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,.04)] md:p-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="text-xs font-black uppercase tracking-[.16em] text-blue-600">System Design</div>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-5xl">Design systems from first principles.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          Use the left catalog to jump between problems. Every guide follows the interview progression:
          requirements → estimation → architecture → reliability → trade-offs → Staff-level follow-ups.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold dark:bg-slate-900">{posts.length} total</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold dark:bg-slate-900">{designs.length} design problems</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold dark:bg-slate-900">{guides.length} deep dives</span>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-black">WhatsApp — featured curriculum</h2>
        <p className="mt-2 text-sm text-slate-500">Production-style messaging HLD for Senior/Staff interviews.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {WHATSAPP_PATH.map((item)=>(
            <Link key={item.href} href={item.href} className="card p-6 transition hover:-translate-y-0.5">
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.blurb}</p>
              <div className="mt-4 text-sm font-semibold text-blue-700 dark:text-blue-400">Open →</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-black">Featured design problems</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {designs.map((p)=>(
            <Link key={p.slug} href={`/system-design/${p.slug}`} className="card p-6 transition hover:-translate-y-0.5">
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
