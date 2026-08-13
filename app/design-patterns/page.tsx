import Link from 'next/link';

const items=[
  {href:'/java-design-patterns-real-world',title:'1. Full source repository',blurb:'Browse all 23 GoF patterns, docs, tests, and the real-world payment system code.'},
  {href:'/design-patterns-revision',title:'2. Revision cards',blurb:'Fast cards for when to use, when not to use, interview traps, and Spring Boot examples.'},
  {href:'/design-patterns-memory-formula',title:'3. Memory formula',blurb:'Best formula to remember implementation and interview explanation quickly.'},
  {href:'/design-patterns-poster',title:'4. Visual poster',blurb:'One grouped visual memory map for all 23 patterns.'},
  {href:'/design-patterns-mock-interview',title:'5. Mock interview',blurb:'Practice real senior-style pattern questions with model answers.'},
];

export const metadata={
  title:'Design Patterns',
  description:'One hub for all design-pattern learning resources: source, revision cards, memory formula, poster, and mock interview.',
};

export default function DesignPatternsHubPage(){
  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Design Pattern Tab
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          Design patterns hub
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          All 5 design-pattern resources in one place: source code, revision cards, memory formula, poster, and mock interview.
        </p>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item)=>(
          <Link key={item.href} href={item.href} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.blurb}</p>
            <div className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Open →</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
