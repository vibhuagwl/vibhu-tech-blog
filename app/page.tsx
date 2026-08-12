import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
import {getAllPosts} from '@/lib/posts';
import {hrefForPost} from '@/lib/href';

const paths=[
  {title:'System Design',href:'/system-design',blurb:'Architecture problems, trade-offs, and Staff follow-ups.'},
  {title:'Real-Time Issues',href:'/realtime-issues',blurb:'Stuck threads, dumps, pools — production incident playbooks.'},
  {title:'Kafka & Redis',href:'/kafka-interview',blurb:'Interview banks for messaging and caching failure modes.'},
  {title:'Behavioral & LPs',href:'/behavioral-interview',blurb:'STAR answers for Staff+ leadership and Amazon LPs.'},
];

export default function Home(){
  const all=getAllPosts();
  const prep=all.find((p)=>p.slug==='system-design-interview-preparation');
  const featured=[
    ...(prep?[prep]:[]),
    ...all.filter((p)=>p.slug!=='system-design-interview-preparation'),
  ].slice(0,3);

  return (
    <main>
      <section className="border-b border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-950/60">
        <div className="mx-auto max-w-7xl px-5 py-16 md:py-24">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-blue-700 dark:text-blue-400">
              Senior Engineering Interview Hub
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-.035em] text-slate-900 md:text-6xl dark:text-white">
              Engineering knowledge for senior developers.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Real-world Java, Spring Boot, microservices, Kafka, system design, and production engineering.
              Learn the problem. Understand the trade-offs. Tell the story. Answer the interview.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/learn"
                className="inline-flex items-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                Start learning <ArrowRight className="ml-2" size={16}/>
              </Link>
              <Link
                href="/search"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                Search topics
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Choose a path</h2>
          <p className="mt-2 text-slate-500">Four focused entry points — not a wall of cards.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {paths.map((p)=>(
            <Link
              key={p.href}
              href={p.href}
              className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-blue-200 dark:border-slate-800 dark:bg-slate-950"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{p.title}</h3>
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

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Featured guides</h2>
            <p className="mt-2 text-slate-500">Start with high-signal interview preparation.</p>
          </div>
          <Link href="/system-design" className="hidden text-sm font-semibold text-blue-700 md:block dark:text-blue-400">
            Browse system design →
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {featured.map((p)=>(
            <Link
              href={hrefForPost(p.category,p.slug)}
              key={p.slug}
              className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[.12em] text-blue-700 dark:text-blue-400">
                {p.category} · {p.difficulty}
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
