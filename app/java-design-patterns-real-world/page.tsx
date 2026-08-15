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
    'Browse the Java design patterns interview repository: all 23 GoF patterns with runnable main methods, docs, tests, Kafka flow, and combined payment system.',
};

export default function JavaDesignPatternsRealWorldPage() {
  const files = listJavaDesignPatternsRealWorldFiles();
  const tree = buildJavaDesignPatternsRealWorldTree(files);
  const defaultPath =
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
          : all 23 GoF patterns with <strong>full working</strong>{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">main</code> methods,
          numbered STEP output, behavior-focused tests, interview docs, Spring mapping, Kafka event flow, and one
          combined payment processing system.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link
            href="/java-design-patterns-real-world?path=docs%2FHOW_TO_RUN.md"
            className="font-semibold text-slate-700 hover:underline dark:text-blue-400"
          >
            Step-by-step how to run →
          </Link>
          <span className="text-slate-300">·</span>
          <Link
            href="/java-design-patterns-real-world?path=src%2Fmain%2Fjava%2Fcom%2Fexample%2Fdesignpatterns%2FDesignPatternDemo.java"
            className="font-semibold text-slate-700 hover:underline dark:text-blue-400"
          >
            All-demos main →
          </Link>
          <span className="text-slate-300">·</span>
          <Link
            href="/java-design-patterns-real-world?path=src%2Fmain%2Fjava%2Fcom%2Fexample%2Fdesignpatterns%2Fcreational%2Ffactory%2FPaymentGatewayFactoryDemo.java"
            className="font-semibold text-slate-700 hover:underline dark:text-blue-400"
          >
            Example: Factory main →
          </Link>
          <span className="text-slate-300">·</span>
          <Link
            href="/java-design-patterns-real-world?path=docs%2Fcheatsheet.md"
            className="font-semibold text-slate-700 hover:underline dark:text-blue-400"
          >
            5-minute cheat sheet →
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/design-patterns-revision" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Revision stories →
          </Link>
        </div>
      </header>

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
          <h2 className="text-lg font-semibold">Runnable mains</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Every GoF Demo has <code>run()</code> + <code>main</code>. <code>DesignPatternDemo</code> runs the full
            catalog.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold">Implementation rules</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Each Demo JavaDoc covers WHEN TO IMPLEMENT and JAVA IMPLEMENTATION RULES — read the header first.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold">Interview core</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Strategy, State, Decorator, Facade, Proxy, Chain, Observer, and the combined payment flow.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold">Spring mapping</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Open <code>docs/spring-pattern-mapping.md</code> for Spring Boot-specific usage and caveats.
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
