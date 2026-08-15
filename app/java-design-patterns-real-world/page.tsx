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

export default function JavaDesignPatternsRealWorldPage() {
  const files = listJavaDesignPatternsRealWorldFiles();
  const tree = buildJavaDesignPatternsRealWorldTree(files);
  const defaultPath =
    files.find((f) => f.path === 'docs/problem-and-solution.md')?.path ??
    files.find((f) => f.path === 'docs/HOW_TO_RUN.md')?.path ??
    files.find((f) => f.path === 'README.md')?.path ??
    files.find((f) => f.path.includes('DesignPatternDemo.java'))?.path ??
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
            href="/java-design-patterns-real-world?path=docs%2Fcomposite-problem-solution.md"
            className="font-semibold text-slate-700 hover:underline dark:text-blue-400"
          >
            Composite: problem-first interview board →
          </Link>
          <span className="text-slate-300">·</span>
          <Link
            href="/java-design-patterns-real-world?path=docs%2Fproblem-and-solution.md"
            className="font-semibold text-slate-700 hover:underline dark:text-blue-400"
          >
            Problem → pattern → solution →
          </Link>
          <span className="text-slate-300">·</span>
          <Link
            href="/java-design-patterns-real-world?path=docs%2FHOW_TO_RUN.md"
            className="font-semibold text-slate-700 hover:underline dark:text-blue-400"
          >
            Step-by-step how to run →
          </Link>
          <span className="text-slate-300">·</span>
          <Link
            href="/java-design-patterns-real-world?path=src%2Fmain%2Fjava%2Fcom%2Fexample%2Fdesignpatterns%2Fbehavioral%2Fstrategy%2FPaymentStrategyDemo.java"
            className="font-semibold text-slate-700 hover:underline dark:text-blue-400"
          >
            Example: Strategy problem/solution →
          </Link>
          <span className="text-slate-300">·</span>
          <Link
            href="/java-design-patterns-real-world?path=src%2Fmain%2Fjava%2Fcom%2Fexample%2Fdesignpatterns%2FDesignPatternDemo.java"
            className="font-semibold text-slate-700 hover:underline dark:text-blue-400"
          >
            All-demos main →
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/design-patterns-revision" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Revision stories →
          </Link>
        </div>
      </header>

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
          Deep dive (problem → without → with → recursion → spoken answer):{' '}
          <Link
            href="/java-design-patterns-real-world?path=docs%2Fcomposite-problem-solution.md"
            className="font-semibold text-slate-800 hover:underline dark:text-blue-400"
          >
            docs/composite-problem-solution.md
          </Link>
          . Catalog of all 23:{' '}
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
