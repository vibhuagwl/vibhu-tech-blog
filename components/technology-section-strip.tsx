import Link from 'next/link';
import {KAFKA_HUB} from '@/lib/technology-hub';

/** Compact section strip for Kafka (and future technology) article pages. */
export default function TechnologySectionStrip({
  technology='kafka',
}:{
  technology?:'kafka';
}){
  const hub=technology==='kafka'?KAFKA_HUB:null;
  if(!hub) return null;

  return (
    <nav
      aria-label={`${hub.title} learning sections`}
      className="mb-6 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/50"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">
          {hub.title} · {hub.subtitle}
        </p>
        <Link href={hub.basePath} className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400">
          Hub →
        </Link>
      </div>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {hub.sections.map((s)=>(
          <li key={s.id}>
            <Link
              href={s.href}
              className="inline-block rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              {s.number} {s.title.replace(/^Kafka /,'')}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
