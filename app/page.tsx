import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
import {getAllPosts} from '@/lib/posts';
import {hrefForPost} from '@/lib/href';
import DifficultyBadge from '@/components/difficulty-badge';

const reasons=[
  {
    title:'Real production problems',
    blurb:'Incidents, migrations, Kafka lag, pools, and failure modes — not textbook definitions.',
  },
  {
    title:'Senior-level explanations',
    blurb:'Trade-offs, rollback, observability, and ownership language interviewers expect.',
  },
  {
    title:'Interview-ready answers',
    blurb:'Short spoken answers, follow-ups, and memorable frameworks you can recall under pressure.',
  },
];

const paths=[
  {title:'System Design',href:'/system-design',blurb:'Architecture problems, estimation, and Staff follow-ups.'},
  {title:'Distributed Systems',href:'/distributed-systems',blurb:'Locking, messaging, resilience, and consistency.'},
  {title:'Real-Time Issues',href:'/realtime-issues',blurb:'Stuck threads, Aurora, Java migration, Lead Experience.'},
  {title:'Kafka & Redis',href:'/kafka-interview',blurb:'Messaging and caching failure banks for Principal rounds.'},
  {title:'Java Complexity',href:'/complexity',blurb:'Derive Big-O from Java code with interview framing.'},
  {title:'Behavioral & LPs',href:'/behavioral-interview',blurb:'STAR answers and Amazon Leadership Principles.'},
];

export default function Home(){
  const all=getAllPosts();
  const prep=all.find((p)=>p.slug==='system-design-interview-preparation');
  const featured=[
    ...(prep?[prep]:[]),
    ...all.filter((p)=>[
      'stuck-thread-incident-response',
      'java-migration-master-index',
      'lead-experience-master-index',
      'distributed-locking',
    ].includes(p.slug)),
  ]
    .filter((p,i,arr)=>arr.findIndex((x)=>x.slug===p.slug)===i)
    .slice(0,4);

  return (
    <main>
      <section className="border-b border-slate-200/80 bg-white/85 dark:border-slate-800 dark:bg-slate-950/70">
            <div className="mx-auto max-w-7xl px-5 py-16 md:py-24">
          <div className="max-w-3xl">
            <p className="eyebrow">Senior Engineering Interview Hub</p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-.035em] text-slate-900 md:text-6xl dark:text-white">
              Real-world engineering knowledge for senior technical interviews.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Learn the problem. Understand the trade-offs. Tell the story. Answer the interview.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/learn" className="btn-primary">
                Start learning <ArrowRight size={16}/>
              </Link>
              <Link href="/interview-questions" className="btn-secondary">
                Practice interview questions
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Why this platform</h2>
          <p className="mt-2 text-slate-500">Built for experienced engineers — calm, scannable, and interview-shaped.</p>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {reasons.map((r)=>(
            <div key={r.title} className="border-t border-slate-200 pt-4 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{r.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{r.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-14">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Choose your path</h2>
          <p className="mt-2 text-slate-500">Pick one lane. Every guide ends with an interview answer and a next step.</p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((p)=>(
            <Link
              key={p.href}
              href={p.href}
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 dark:border-slate-800 dark:bg-slate-950"
            >
              <h3 className="font-semibold text-slate-900 dark:text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{p.blurb}</p>
            </Link>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/learn" className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400">
            View the full learning curriculum →
          </Link>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white/70 dark:border-slate-800 dark:bg-slate-950/50">
        <div className="mx-auto max-w-7xl px-5 py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Interview practice</h2>
              <p className="mt-2 text-slate-500">
                Active recall: question → think → reveal discussion points and Staff follow-ups.
              </p>
            </div>
            <Link href="/interview-questions#practice" className="btn-secondary">
              Open practice mode
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 pb-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Featured guides</h2>
            <p className="mt-2 text-slate-500">High-signal starting points for senior interviews.</p>
          </div>
          <Link href="/search" className="hidden text-sm font-semibold text-blue-700 md:block dark:text-blue-400">
            Search all topics →
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {featured.map((p)=>(
            <Link
              href={hrefForPost(p.category,p.slug)}
              key={p.slug}
              className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-blue-700 dark:text-blue-400">
                  {p.category}
                </span>
                <DifficultyBadge difficulty={p.difficulty}/>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{p.description}</p>
              <div className="mt-4 text-xs text-slate-400">{p.readingTime}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
