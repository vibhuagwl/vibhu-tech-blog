import Link from 'next/link';

const items=[
  {href:'/gof-design-patterns',title:'1. GoF patterns master (23)',blurb:'Same UX as Microservices Patterns: filterable cards with Why → Architecture → Code → Failures → Ops → Interview for every GoF pattern.'},
  {href:'/java-design-patterns-real-world',title:'2. Full source repository',blurb:'Browse all 23 GoF demos, docs, tests, and the real-world payment system code.'},
  {href:'/design-patterns-revision',title:'3. Revision stories',blurb:'One Meridian Bank payment. 23 purposes, financial scenes, and the twins you keep mixing up.'},
  {href:'/design-patterns-memory-formula',title:'4. Memory formula',blurb:'Best formula to remember implementation and interview explanation quickly.'},
  {href:'/design-patterns-poster',title:'5. Visual poster',blurb:'One grouped visual memory map for all 23 patterns.'},
  {href:'/design-patterns-mock-interview',title:'6. Mock interview',blurb:'Practice real senior-style pattern questions with model answers.'},
];

export const metadata={
  title:'Design Patterns',
  description:'GoF master catalog (23 patterns), source lab, revision cards, memory formula, poster, and mock interview.',
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
          Start with the GoF master catalog (Microservices Patterns format), then drill into source, revision stories, poster, and mock interview.
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
