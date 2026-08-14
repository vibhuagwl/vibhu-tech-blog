import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {
  CATEGORIES,
  CATEGORY_BLURB,
  CONFUSED_TWINS,
  MASTER_STORY,
  PATTERN_STORIES,
  PURPOSE_WALL,
} from '@/lib/design-patterns-stories';

export const metadata = {
  title: 'Design Patterns as One Bank Payment — Revision Stories',
  description:
    'Remember all 23 GoF patterns through one Meridian Bank payment: purpose, a financial story, and the mix-ups people confuse. Built for people who keep forgetting the textbook cards.',
};

function renderStory(text: string) {
  const alias: Record<string, string> = {
    Chain: 'chain-of-responsibility',
  };
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const name = part.slice(2, -2);
      const hit = PURPOSE_WALL.find((p) => p.name === name) ?? PURPOSE_WALL.find((p) => p.slug === alias[name]);
      if (hit) {
        return (
          <a key={i} href={`#${hit.slug}`} className="font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-2 dark:text-emerald-300">
            {name}
          </a>
        );
      }
      return (
        <strong key={i} className="text-slate-900 dark:text-white">
          {name}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function DesignPatternsRevisionPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Financial storytelling · 23 patterns · one payment
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          Do not memorize 23 definitions. Remember Priya paying rent.
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Every GoF pattern is a job inside one ₹45,000 UPI at Meridian Bank. If you can retell the payment, you can
          retell the patterns. Cards below are the same story, one scene each.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/design-patterns" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Hub →
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/design-patterns-memory-formula" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Memory formula →
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/design-patterns-mock-interview" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Mock interview →
          </Link>
        </div>
      </header>

      <section className="mt-10 rounded-2xl bg-slate-900 px-5 py-5 text-slate-100">
        <div className="text-[11px] font-bold uppercase tracking-[.14em] text-emerald-300">How to remember</div>
        <p className="mt-2 text-base font-medium leading-8">
          Creational = how the bank is allowed to <em>make</em> things. Structural = how it is <em>wired</em>.
          Behavioral = how it <em>talks and decides</em>. If you mix two patterns, read the twins table — Factory is
          “which class,” Builder is “which fields.”
        </p>
      </section>

      <section id="purpose" className="mt-12 scroll-mt-24">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">23 purposes — say them out loud</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          This is the cheat sheet. One job per pattern. Tap a name to jump to its bank story.
        </p>
        <ol className="mt-5 grid gap-2 sm:grid-cols-2">
          {PURPOSE_WALL.map((row, i) => (
            <li key={row.slug}>
              <a
                href={`#${row.slug}`}
                className="flex items-baseline gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <span className="w-6 shrink-0 text-xs font-bold text-slate-400">{i + 1}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{row.name}</span>
                <span className="text-slate-500">— {row.purpose}</span>
              </a>
            </li>
          ))}
        </ol>
      </section>

      <section id="story" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">The 3-minute story</h2>
        <p className="mt-2 text-sm text-slate-500">Bold names jump to the scene. Read this once. Then close the laptop and retell it.</p>
        <div className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-base leading-8 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          {MASTER_STORY.split('\n\n').map((para) => (
            <p key={para.slice(0, 40)}>{renderStory(para)}</p>
          ))}
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <Mermaid
            chart={`flowchart TD
  P[Priya taps Pay] --> F[Facade]
  F --> X[Proxy: JWT + rate limit]
  X --> B[Builder: the form]
  B --> FM[Factory: UPI vs NEFT]
  FM --> AF[Abstract Factory: India kit]
  AF --> S[Strategy: how UPI talks]
  S --> A[Adapter: NPCI SDK]
  A --> C[Chain: KYC AML fraud limit]
  C --> D[Decorator + Command]
  D --> ST[State: CREATED to POSTED]
  ST --> T[Template: validate book notify]
  T --> M[Mediator hub]
  M --> O[Observer: SMS ledger RBI]
  O --> Z[Done: landlord paid]`}
          />
        </div>
      </section>

      <section id="twins" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Twins you keep mixing up</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Forgetting is usually a mix-up, not a blank. Lock these seven pairs and the rest of the catalog stays still.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {CONFUSED_TWINS.map((t) => (
            <article key={t.title} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="font-bold text-slate-900 dark:text-white">{t.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{t.left}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{t.right}</p>
              <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                Remember: {t.remember}
              </p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-2 text-xs">
        {CATEGORIES.map((category) => (
          <a key={category} href={`#${category.toLowerCase()}`} className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            {category}
          </a>
        ))}
      </div>

      {CATEGORIES.map((category) => (
        <section key={category} id={category.toLowerCase()} className="mt-14 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{category}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{CATEGORY_BLURB[category]}</p>
          <div className="mt-6 space-y-5">
            {PATTERN_STORIES.filter((card) => card.category === category).map((card) => (
              <article
                key={card.slug}
                id={card.slug}
                className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-emerald-700 dark:text-emerald-300">
                  {card.purpose}
                </div>
                <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{card.name}</h3>
                <p className="mt-2 text-base leading-7 text-slate-700 dark:text-slate-300">{card.inPlainWords}</p>
                <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400">{card.story}</p>
                <p className="mt-4 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium leading-7 text-slate-100">
                  Say this: {card.sayThis}
                </p>
                <dl className="mt-4 grid gap-3 text-sm leading-6 md:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-slate-900 dark:text-white">Don&apos;t confuse with</dt>
                    <dd className="text-slate-600 dark:text-slate-400">{card.dontConfuseWith}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-900 dark:text-white">When not</dt>
                    <dd className="text-slate-600 dark:text-slate-400">{card.whenNot}</dd>
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
