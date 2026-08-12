import Mermaid from '@/components/mermaid';

export const metadata={
  title:'Design Patterns Poster',
  description:'One big visual memory map for all 23 GoF design patterns.',
};

const chart = `mindmap
  root((GoF Patterns))
    Creational
      Singleton
        one shared instance
      Factory Method
        choose implementation
      Abstract Factory
        create family together
      Builder
        assemble complex object
      Prototype
        clone template
    Structural
      Adapter
        translate API
      Bridge
        separate two dimensions
      Composite
        tree structure
      Decorator
        add runtime behavior
      Facade
        one simple door
      Flyweight
        share immutable state
      Proxy
        control access
    Behavioral
      Chain of Responsibility
        request pipeline
      Command
        action as object
      Interpreter
        evaluate small rules
      Iterator
        traverse safely
      Mediator
        central coordinator
      Memento
        save and restore
      Observer
        one event many listeners
      State
        lifecycle behavior
      Strategy
        swap algorithm
      Template Method
        fixed workflow
      Visitor
        new operation on stable objects`;

export default function DesignPatternsPosterPage(){
  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Visual poster
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          Design patterns memory poster
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Use this page like a wall poster: one grouped diagram for all 23 GoF patterns with the shortest useful memory phrase for each one.
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <Mermaid chart={chart} />
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3 text-sm leading-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="font-bold text-slate-900 dark:text-white">How to revise</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Say the category, then the pressure, then one real Java example.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="font-bold text-slate-900 dark:text-white">Best sequence</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Problem → pattern → code skeleton → interview sentence.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="font-bold text-slate-900 dark:text-white">Use with</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">`/design-patterns-memory-formula` and `/design-patterns-revision` for final review.</p>
        </div>
      </section>
    </main>
  );
}
