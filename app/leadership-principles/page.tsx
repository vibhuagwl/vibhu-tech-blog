import Link from 'next/link';
import {getPostsByCategories,SECTION_CATEGORIES} from '@/lib/posts';

export const metadata={title:'Amazon Leadership Principles'};

const ORDER=[
  'amazon-leadership-principles-index',
  'lp-kafka-story-bank-all-cases',
  'lp-customer-obsession',
  'lp-ownership',
  'lp-invent-and-simplify',
  'lp-are-right-a-lot',
  'lp-learn-and-be-curious',
  'lp-hire-and-develop-the-best',
  'lp-insist-on-the-highest-standards',
  'lp-think-big',
  'lp-bias-for-action',
  'lp-frugality',
  'lp-earn-trust',
  'lp-dive-deep',
  'lp-have-backbone-disagree-and-commit',
  'lp-deliver-results',
  'lp-strive-to-be-earths-best-employer',
  'lp-success-and-scale-bring-broad-responsibility',
];

export default function LeadershipPrinciples(){
  const posts=getPostsByCategories([...SECTION_CATEGORIES['leadership-principles']]);
  const bySlug=new Map(posts.map((p)=>[p.slug,p]));
  const ordered=ORDER.map((s)=>bySlug.get(s)).filter(Boolean) as typeof posts;
  const rest=posts.filter((p)=>!ORDER.includes(p.slug));
  const list=[...ordered,...rest];
  const index=bySlug.get('amazon-leadership-principles-index');

  return (
    <main>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,.04)] md:p-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="text-xs font-black uppercase tracking-[.16em] text-blue-600">Amazon Interview Prep</div>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-5xl">Leadership Principles — all 16, end to end.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          STAR answers grounded in JPMorgan, PayPal, Citi, and UBS work — with Kafka case banks, follow-up probes,
          metrics, and weak-vs-strong contrasts for every principle.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold dark:bg-slate-900">{posts.length} guides</span>
          {index && (
            <Link href={`/leadership-principles/${index.slug}`} className="rounded-full bg-blue-600 px-3 py-1 font-semibold text-white">
              Start with the index →
            </Link>
          )}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-black">All principles</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {list.map((p)=>(
            <Link key={p.slug} href={`/leadership-principles/${p.slug}`} className="card p-6 transition hover:-translate-y-0.5">
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
