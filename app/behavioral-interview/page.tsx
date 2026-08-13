import Link from 'next/link';
import {getPostsByCategories,SECTION_CATEGORIES} from '@/lib/posts';

export const metadata={title:'Behavioral Interview — Staff+ / Principal'};

const ORDER=[
  'behavioral-staff-principal-interview-index',
  'behavioral-story-bank-and-top-15',
  'behavioral-intro-and-leadership',
  'behavioral-decisions-and-conflict',
  'behavioral-failure-and-accountability',
  'behavioral-people-mentoring-influence',
  'behavioral-delivery-performance-cost',
  'behavioral-philosophy-and-closing',
  'behavioral-leadership-ownership-bank',
  'behavioral-strategic-thinking-bank',
  'behavioral-architecture-leadership-bank',
  'behavioral-business-impact-and-cost-bank',
  'behavioral-conflict-and-executive-bank',
  'behavioral-failure-crisis-bank',
  'behavioral-mentoring-hiring-bank',
  'behavioral-innovation-ai-security-bank',
  'behavioral-delivery-global-customer-bank',
  'behavioral-decision-personal-career-bank',
];

export default function BehavioralInterview(){
  const posts=getPostsByCategories([...SECTION_CATEGORIES['behavioral-interview']]);
  const bySlug=new Map(posts.map((p)=>[p.slug,p]));
  const ordered=ORDER.map((s)=>bySlug.get(s)).filter(Boolean) as typeof posts;
  const rest=posts.filter((p)=>!ORDER.includes(p.slug));
  const list=[...ordered,...rest];
  const index=bySlug.get('behavioral-staff-principal-interview-index');

  return (
    <main>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,.04)] md:p-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="text-xs font-black uppercase tracking-[.16em] text-slate-600">Staff+ · Principal · Architect</div>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-5xl">Behavioral answers that sound like a leader.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          260+ competency-mapped prompts for 25+ YOE interviews — plus a reusable STAR story bank and Top 15 drills.
          Leadership voice, not IC task narration.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold dark:bg-slate-900">{posts.length} guides</span>
          {index && (
            <Link href={`/behavioral-interview/${index.slug}`} className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
              Start with the index →
            </Link>
          )}
        </div>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <Link href="/behavior" className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-600">Behavior stories</div>
          <h2 className="mt-3 text-2xl font-bold">Behavior</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Story frameworks, leadership themes, conflict, ownership, and reusable examples you can shape into STAR answers.
          </p>
        </Link>
        <Link href="/behavioral-interview" className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-600">Question bank</div>
          <h2 className="mt-3 text-2xl font-bold">Behavior Interview</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Staff+ and Principal interview prompts, story bank drills, and follow-up questions for practice.
          </p>
        </Link>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-black">All topics</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {list.map((p)=>(
            <Link key={p.slug} href={`/behavioral-interview/${p.slug}`} className="card p-6 transition hover:-translate-y-0.5">
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
