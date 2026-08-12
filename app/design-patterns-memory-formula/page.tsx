import Mermaid from '@/components/mermaid';

export const metadata={
  title:'Design Patterns Memory Formula',
  description:'Fast memory formulas, implementation skeletons, and diagrams to remember all 23 GoF design patterns for Java interviews.',
};

const groups = {
  creational:[
    ['Singleton','Need one shared instance -> hide constructor + global access','private ctor + static instance/getInstance'],
    ['Factory Method','Object type changes -> move creation into factory','Factory -> Interface -> Concrete impl'],
    ['Abstract Factory','Family must stay compatible -> create related objects together','Factory -> createA/createB -> region pack'],
    ['Builder','Object construction is complex -> build step by step','Builder setters -> build()'],
    ['Prototype','Copy is cheaper than create -> clone template','prototype.deepCopy()'],
  ],
  structural:[
    ['Adapter','API does not match -> translate old into new','Client -> Adapter -> Legacy API'],
    ['Bridge','Two dimensions vary -> separate abstraction from implementation','Abstraction has Implementor'],
    ['Composite','Tree structure -> treat one and many the same','Component -> Leaf / Composite(children)'],
    ['Decorator','Add behavior at runtime -> wrap core object','Decorator(has Component)'],
    ['Facade','Too many subsystem calls -> create one simple door','Facade -> subsystem1..n'],
    ['Flyweight','Too many same immutable objects -> share common state','Factory cache -> shared flyweights'],
    ['Proxy','Need control before real call -> stand in front of object','Proxy -> RealSubject'],
  ],
  behavioral:[
    ['Chain','Many validators/filters -> pass request handler to handler','Handler -> next -> handle()'],
    ['Command','Turn action into object -> queue/retry/undo','Invoker -> Command -> Receiver'],
    ['Interpreter','Simple business rule language -> parse/evaluate expressions','Expression.interpret(context)'],
    ['Iterator','Traverse without exposing storage','Iterator hasNext/next'],
    ['Mediator','Too many objects talk directly -> central coordinator','Colleagues -> Mediator'],
    ['Memento','Need rollback -> snapshot + restore','Originator <-> Memento <-> Caretaker'],
    ['Observer','One event, many listeners -> publish/subscribe','Subject notify(Observers)'],
    ['State','Behavior changes by lifecycle -> state objects drive behavior','Context has State'],
    ['Strategy','Algorithm changes -> swap implementation','Context has Strategy'],
    ['Template Method','Workflow same, steps vary -> fixed skeleton + overrides','abstract workflow() calls hooks'],
    ['Visitor','Object structure stable, operations grow -> visitor adds behavior','Element.accept(visitor)'],
  ],
} as const;

function Card({name, formula, skeleton}:{name:string;formula:string;skeleton:string}){
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{name}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400"><strong>Formula:</strong> {formula}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400"><strong>Implementation skeleton:</strong> {skeleton}</p>
    </article>
  );
}

export default function DesignPatternsMemoryFormulaPage(){
  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Memory formula
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          Best formula to remember design patterns
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Do not memorize definitions. Memorize this sequence instead: <strong>problem → pressure → pattern → code skeleton → interview sentence</strong>.
          Use the cards below like flash cards before interviews.
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Master formula</h2>
        <div className="mt-4 overflow-x-auto">
          <Mermaid chart={`flowchart LR
              P[Business Problem] --> R[Change Pressure]
              R --> D[Pick Pattern]
              D --> C[Code Skeleton]
              C --> I[Interview Sentence]
              I --> E[Production Example]
          `} />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 dark:bg-slate-900">
            <strong>Implementation formula:</strong><br/>
            Interface/abstraction → concrete implementations → context/creator/wrapper/coordinator → client call
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 dark:bg-slate-900">
            <strong>Interview formula:</strong><br/>
            We had X problem, naive code became Y, so I used Z pattern because it isolates A and makes B easier.
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Creational</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.creational.map(([name, formula, skeleton]) => <Card key={name} name={name} formula={formula} skeleton={skeleton} />)}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Structural</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.structural.map(([name, formula, skeleton]) => <Card key={name} name={name} formula={formula} skeleton={skeleton} />)}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Behavioral</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.behavioral.map(([name, formula, skeleton]) => <Card key={name} name={name} formula={formula} skeleton={skeleton} />)}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ultra-short memory lines</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          <div><strong>Factory:</strong> I do not know which object; factory decides.</div>
          <div><strong>Strategy:</strong> I know the job; algorithm changes.</div>
          <div><strong>State:</strong> Same object, different behavior by lifecycle.</div>
          <div><strong>Decorator:</strong> Core is fine; add runtime layers.</div>
          <div><strong>Facade:</strong> Too many services; give me one entry point.</div>
          <div><strong>Adapter:</strong> Old API speaks a different language.</div>
          <div><strong>Proxy:</strong> Stop at the gate before the real object.</div>
          <div><strong>Chain:</strong> Let each validator get one chance.</div>
          <div><strong>Observer:</strong> One event, many listeners.</div>
          <div><strong>Builder:</strong> Too many constructor knobs.</div>
          <div><strong>Composite:</strong> One item and bundle look the same.</div>
          <div><strong>Template Method:</strong> Workflow fixed, steps vary.</div>
        </div>
      </section>
    </main>
  );
}
