import Link from 'next/link';
import {DESIGN_PATTERN_REVISION_CARDS} from '@/lib/design-patterns-revision-data';

export const metadata={
  title:'Design Patterns Revision Cards',
  description:'Fast revision cards for all 23 GoF patterns: when to use, when not to use, interview trap, and Spring Boot example.',
};

const categories=['Creational','Structural','Behavioral'] as const;

export default function DesignPatternsRevisionPage(){
  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Interview revision
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          Design patterns revision cards
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          One quick card per GoF pattern: <strong>when to use</strong>, <strong>when not to use</strong>, <strong>interview trap</strong>, and a
          <strong> Spring Boot example</strong>. Made for senior Java interview revision, not textbook theory.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/java-design-patterns-real-world" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Browse full source repo →
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/design-patterns-memory-formula" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Memory formula →
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/design-patterns-mock-interview" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Mock interview →
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/java-design-patterns-real-world?path=docs%2Fpattern-comparisons.md" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Comparison docs →
          </Link>
        </div>
      </header>

      <div className="mt-8 flex flex-wrap gap-2 text-xs text-slate-500">
        {categories.map((category)=>(
          <a key={category} href={`#${category.toLowerCase()}`} className="rounded-full bg-slate-100 px-3 py-1 font-semibold dark:bg-slate-900">
            {category}
          </a>
        ))}
      </div>

      {categories.map((category)=>(
        <section key={category} id={category.toLowerCase()} className="mt-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{category}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {DESIGN_PATTERN_REVISION_CARDS.filter((card)=>card.category===category).map((card)=>(
              <article key={card.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-blue-700 dark:text-blue-400">{card.rememberAs}</div>
                <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{card.name}</h3>
                <dl className="mt-4 space-y-3 text-sm leading-6">
                  <div>
                    <dt className="font-semibold text-slate-900 dark:text-white">When to use</dt>
                    <dd className="text-slate-600 dark:text-slate-400">{card.whenToUse}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-900 dark:text-white">When not to use</dt>
                    <dd className="text-slate-600 dark:text-slate-400">{card.whenNotToUse}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-900 dark:text-white">Interview trap</dt>
                    <dd className="text-slate-600 dark:text-slate-400">{card.interviewTrap}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-900 dark:text-white">Spring Boot example</dt>
                    <dd className="text-slate-600 dark:text-slate-400">{card.springBootExample}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
