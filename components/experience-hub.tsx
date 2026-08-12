import Link from 'next/link';
import type {JpmcSection} from '@/lib/jpmc-hub';

const MODE_LABEL={
  domain:'Domain',
  messaging:'Messaging',
  integration:'Integration',
  platform:'Platform',
  interview:'Interview',
} as const;

export default function ExperienceHub({
  title,
  subtitle,
  description,
  sections,
  modes,
}:{
  title:string;
  subtitle:string;
  description:string;
  sections:JpmcSection[];
  modes?:{title:string;blurb:string}[];
}){
  return (
    <div>
      <header className="rounded-2xl border border-slate-200 bg-white p-6 md:p-10 dark:border-slate-800 dark:bg-slate-950">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Experience hub
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.035em] text-slate-900 md:text-5xl dark:text-white">
          {title}
        </h1>
        <p className="mt-2 text-lg font-medium text-slate-500">{subtitle}</p>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
          {description}
        </p>
        <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Business → Architecture → Code → Messaging → Failure → Test → Deploy → Monitor → Recover
        </p>
        <nav aria-label={`${title} sections`} className="mt-6 flex flex-wrap gap-2">
          {sections.map((s)=>(
            <Link
              key={s.id}
              href={s.href}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {s.number} {s.title}
            </Link>
          ))}
        </nav>
      </header>

      {modes && modes.length>0 && (
        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {modes.map((m)=>(
            <div key={m.title} className="border-t border-slate-200 pt-4 dark:border-slate-800">
              <h2 className="text-sm font-semibold uppercase tracking-[.12em] text-slate-500">{m.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{m.blurb}</p>
            </div>
          ))}
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Experience map</h2>
        <p className="mt-2 text-slate-500">
          Separate from generic Kafka/Java banks. Drill into a real project story, then practice interview answers.
        </p>
        <div className="mt-6 grid gap-3">
          {sections.map((s)=>(
            <Link
              key={s.id}
              href={s.href}
              className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold tracking-[.14em] text-slate-400">{s.number}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[.08em] text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  {MODE_LABEL[s.mode]}
                </span>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-slate-900 group-hover:text-blue-700 dark:text-white">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{s.blurb}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
