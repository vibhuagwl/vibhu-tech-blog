import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
import {getAllPosts} from '@/lib/posts';
import {hrefForPost} from '@/lib/href';
import DifficultyBadge from '@/components/difficulty-badge';
import {TOPIC_GROUPS} from '@/lib/site-nav';

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
      'performance-master-index',
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
              Structured knowledge for senior technical interviews.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Browse by category — architecture, platform ops, data systems, and career tools —
              then drill into Staff-level playbooks with production examples.
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Browse by category</h2>
          <p className="mt-2 text-slate-500">Same structure as the Topics menu — pick a lane, then open a guide.</p>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {TOPIC_GROUPS.map((group)=>(
            <section
              key={group.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="text-[11px] font-black uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
                {group.title}
              </div>
              <p className="mt-2 text-sm text-slate-500">{group.description}</p>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {group.topics.map((t)=>(
                  <li key={t.href}>
                    <Link
                      href={t.href}
                      className="block rounded-xl border border-transparent px-3 py-3 transition hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                    >
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{t.label}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">{t.blurb}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
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
