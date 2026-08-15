import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import {
  buildJavaDesignPatternsRealWorldTree,
  listJavaDesignPatternsRealWorldFiles,
} from '@/lib/java-design-patterns-real-world-source';

export const metadata = {
  title: 'Java design patterns real world — full source',
  description:
    'Browse the Java design patterns interview repository: each pattern explains the problem it fixes, how it resolves it, and ships a runnable main with STEP output.',
};

const PATTERN_BOARDS: {group: string; items: {name: string; file: string; demo: string}[]}[] = [
  {
    group: 'Creational',
    items: [
      {name: 'Singleton', file: 'singleton-explanation.md', demo: 'ConfigManagerDemo'},
      {name: 'Factory Method', file: 'factory-method-explanation.md', demo: 'PaymentGatewayFactoryDemo'},
      {name: 'Abstract Factory', file: 'abstract-factory-explanation.md', demo: 'RegionalBankingFactoryDemo'},
      {name: 'Builder', file: 'builder-explanation.md', demo: 'PaymentTransactionBuilderDemo'},
      {name: 'Prototype', file: 'prototype-explanation.md', demo: 'ReportConfigurationPrototypeDemo'},
    ],
  },
  {
    group: 'Structural',
    items: [
      {name: 'Adapter', file: 'adapter-explanation.md', demo: 'LegacyPaymentAdapterDemo'},
      {name: 'Bridge', file: 'bridge-explanation.md', demo: 'NotificationBridgeDemo'},
      {name: 'Composite', file: 'composite-explanation.md', demo: 'OrderCompositeDemo'},
      {name: 'Decorator', file: 'decorator-explanation.md', demo: 'PaymentDecoratorDemo'},
      {name: 'Facade', file: 'facade-explanation.md', demo: 'PaymentFacadeDemo'},
      {name: 'Flyweight', file: 'flyweight-explanation.md', demo: 'CurrencyFlyweightDemo'},
      {name: 'Proxy', file: 'proxy-explanation.md', demo: 'PaymentServiceProxyDemo'},
    ],
  },
  {
    group: 'Behavioral',
    items: [
      {name: 'Chain of Responsibility', file: 'chain-of-responsibility-explanation.md', demo: 'PaymentValidationChainDemo'},
      {name: 'Command', file: 'command-explanation.md', demo: 'PaymentCommandDemo'},
      {name: 'Interpreter', file: 'interpreter-explanation.md', demo: 'TransactionRuleInterpreterDemo'},
      {name: 'Iterator', file: 'iterator-explanation.md', demo: 'TransactionIteratorDemo'},
      {name: 'Mediator', file: 'mediator-explanation.md', demo: 'OrderProcessingMediatorDemo'},
      {name: 'Memento', file: 'memento-explanation.md', demo: 'PaymentConfigurationMementoDemo'},
      {name: 'Observer', file: 'observer-explanation.md', demo: 'PaymentObserverDemo'},
      {name: 'State', file: 'state-explanation.md', demo: 'PaymentStateDemo'},
      {name: 'Strategy', file: 'strategy-explanation.md', demo: 'PaymentStrategyDemo'},
      {name: 'Template Method', file: 'template-method-explanation.md', demo: 'PaymentProcessingTemplateDemo'},
      {name: 'Visitor', file: 'visitor-explanation.md', demo: 'AccountVisitorDemo'},
    ],
  },
];

export default function JavaDesignPatternsRealWorldPage() {
  const files = listJavaDesignPatternsRealWorldFiles();
  const tree = buildJavaDesignPatternsRealWorldTree(files);
  const defaultPath =
    files.find((f) => f.path === 'docs/patterns/composite-explanation.md')?.path ??
    files.find((f) => f.path === 'docs/PATTERN_EXPLANATION_FORMAT.md')?.path ??
    files.find((f) => f.path === 'docs/problem-and-solution.md')?.path ??
    files.find((f) => f.path === 'docs/HOW_TO_RUN.md')?.path ??
    files.find((f) => f.path === 'README.md')?.path ??
    files[0]?.path ??
    '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Source explorer · runnable demos
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          Java design patterns — real world repository
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Browse{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">
            java-design-patterns-real-world/
          </code>
          : all 23 GoF patterns document the <strong>problem</strong> and{' '}
          <strong>how the pattern resolves it</strong>, plus <strong>full working</strong>{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">main</code> methods with
          numbered STEP output, tests, Spring mapping, Kafka flow, and a combined payment system.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link
            href="/java-design-patterns-real-world?path=docs%2Fpatterns%2Fcomposite-explanation.md"
            className="font-semibold text-slate-700 hover:underline dark:text-blue-400"
          >
            Composite full board (21 sections) →
          </Link>
          <span className="text-slate-300">·</span>
          <Link
            href="/java-design-patterns-real-world?path=docs%2Fpatterns%2FREADME.md"
            className="font-semibold text-slate-700 hover:underline dark:text-blue-400"
          >
            All pattern boards →
          </Link>
          <span className="text-slate-300">·</span>
          <Link
            href="/java-design-patterns-real-world?path=docs%2FPATTERN_EXPLANATION_FORMAT.md"
            className="font-semibold text-slate-700 hover:underline dark:text-blue-400"
          >
            Explanation format →
          </Link>
          <span className="text-slate-300">·</span>
          <Link
            href="/java-design-patterns-real-world?path=docs%2FHOW_TO_RUN.md"
            className="font-semibold text-slate-700 hover:underline dark:text-blue-400"
          >
            How to run →
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/design-patterns-revision" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Revision stories →
          </Link>
        </div>
      </header>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          How every pattern is explained (problem-first)
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Do <strong>not</strong> start with syntax. Each board uses the same interview structure: problem → why
          naive code is bad → how the pattern solves it → code mapping → runtime flow → what the client need not know →
          SOLID → trade-offs → 30–60s answer. Spec:{' '}
          <Link
            href="/java-design-patterns-real-world?path=docs%2FPATTERN_EXPLANATION_FORMAT.md"
            className="font-semibold text-slate-800 hover:underline dark:text-blue-400"
          >
            PATTERN_EXPLANATION_FORMAT.md
          </Link>
          . Index:{' '}
          <Link
            href="/java-design-patterns-real-world?path=docs%2Fpatterns%2FREADME.md"
            className="font-semibold text-slate-800 hover:underline dark:text-blue-400"
          >
            docs/patterns/
          </Link>
          . Gold standard:{' '}
          <Link
            href="/java-design-patterns-real-world?path=docs%2Fpatterns%2Fcomposite-explanation.md"
            className="font-semibold text-slate-800 hover:underline dark:text-blue-400"
          >
            Composite
          </Link>
          .
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          All 23 patterns — same explanation format
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Every board is problem-first (like Composite): without the pattern → how the pattern solves it → code
          mapping → runtime flow → interview answer. Open any link in the explorer below.
        </p>
        <div className="mt-6 space-y-6">
          {PATTERN_BOARDS.map((g) => (
            <div key={g.group}>
              <h3 className="text-sm font-semibold uppercase tracking-[.08em] text-slate-500">{g.group}</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((p) => (
                  <li key={p.file}>
                    <Link
                      href={`/java-design-patterns-real-world?path=${encodeURIComponent(`docs/patterns/${p.file}`)}`}
                      className="block rounded-xl border border-slate-200 px-3 py-2 text-sm hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600"
                    >
                      <span className="font-semibold text-slate-900 dark:text-white">{p.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{p.demo}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          What was the problem? How does the pattern fix it?
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Interview answer shape: <em>pain without the pattern</em> → <em>structure the pattern introduces</em> →{' '}
          <em>what gets easier</em>. Every Demo JavaDoc has <strong>PROBLEM</strong> and{' '}
          <strong>HOW THIS PATTERN SOLVES IT</strong>; running <code>main</code> prints the same lines before the STEPs.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-rose-200/80 bg-rose-50/50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
            <p className="text-xs font-semibold uppercase tracking-[.08em] text-rose-700 dark:text-rose-300">Problem</p>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Example (Composite): order tree of products + nested bundles — how does the client total without{' '}
              <code>instanceof</code> and nested loops?
            </p>
          </div>
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <p className="text-xs font-semibold uppercase tracking-[.08em] text-amber-800 dark:text-amber-300">Pattern</p>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Composite: common <code>OrderComponent</code>; Bundle recursively asks children for{' '}
              <code>total()</code>.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <p className="text-xs font-semibold uppercase tracking-[.08em] text-emerald-800 dark:text-emerald-300">
              Resolved
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Client only knows <code>OrderComponent</code> — Composite walks the tree, not the client.
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          Deep dive (full 21 sections):{' '}
          <Link
            href="/java-design-patterns-real-world?path=docs%2Fpatterns%2Fcomposite-explanation.md"
            className="font-semibold text-slate-800 hover:underline dark:text-blue-400"
          >
            docs/patterns/composite-explanation.md
          </Link>
          . All boards:{' '}
          <Link
            href="/java-design-patterns-real-world?path=docs%2Fpatterns%2FREADME.md"
            className="font-semibold text-slate-800 hover:underline dark:text-blue-400"
          >
            docs/patterns/
          </Link>
          . One-page catalog:{' '}
          <Link
            href="/java-design-patterns-real-world?path=docs%2Fproblem-and-solution.md"
            className="font-semibold text-slate-800 hover:underline dark:text-blue-400"
          >
            docs/problem-and-solution.md
          </Link>
          .
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Run the demos — step by step</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-700 dark:text-slate-300">
          <li>
            Install <strong>JDK 17+</strong> and <strong>Maven 3.9+</strong>, then{' '}
            <code className="rounded bg-white px-1.5 py-0.5 dark:bg-slate-950">cd java-design-patterns-real-world</code>
          </li>
          <li>
            Verify: <code className="rounded bg-white px-1.5 py-0.5 dark:bg-slate-950">mvn clean test</code>
          </li>
          <li>
            Run <strong>all</strong> patterns (each prints STEP 1, STEP 2, …):
            <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">
              {`mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.DesignPatternDemo`}
            </pre>
          </li>
          <li>
            Or run <strong>one</strong> pattern (open its <code>*Demo.java</code> and scroll to{' '}
            <code>main</code>):
            <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">
              {`mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.creational.factory.PaymentGatewayFactoryDemo`}
            </pre>
          </li>
          <li>
            In the explorer below: open <code>docs/HOW_TO_RUN.md</code>, then any{' '}
            <code>*Demo.java</code> — read JavaDoc rules, then the <code>run()</code> / <code>main</code> at the
            bottom.
          </li>
        </ol>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          Full command catalog and IDE tips:{' '}
          <Link
            href="/java-design-patterns-real-world?path=docs%2FHOW_TO_RUN.md"
            className="font-semibold text-slate-800 hover:underline dark:text-blue-400"
          >
            docs/HOW_TO_RUN.md
          </Link>
          .
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold">Problem → solution</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Each Demo states the pain without the pattern and how the structure fixes it — also in{' '}
            <code>docs/problem-and-solution.md</code>.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold">Runnable mains</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Every GoF Demo has <code>run()</code> + <code>main</code>. <code>DesignPatternDemo</code> runs the full
            catalog.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold">Implementation rules</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            JavaDoc covers WHEN TO IMPLEMENT and JAVA IMPLEMENTATION RULES — read the header first.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold">Interview core</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Strategy, State, Decorator, Facade, Proxy, Chain, Observer, and the combined payment flow.
          </p>
        </div>
      </section>

      <div className="mt-10">
        {files.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            Source folder not found at build time.
          </div>
        ) : (
          <Suspense fallback={<div className="text-sm text-slate-500">Loading source explorer…</div>}>
            <OAuthCodeExplorer
              files={files}
              tree={tree}
              defaultPath={defaultPath}
              routeBase="/java-design-patterns-real-world"
              ariaLabel="Java design patterns source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
