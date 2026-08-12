import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import {buildJavaDesignPatternsRealWorldTree,listJavaDesignPatternsRealWorldFiles} from '@/lib/java-design-patterns-real-world-source';

export const metadata={
  title:'Java design patterns real world — full source',
  description:'Browse the Java design patterns interview repository: all 23 GoF patterns, docs, tests, Kafka flow, and combined payment system.',
};

export default function JavaDesignPatternsRealWorldPage(){
  const files=listJavaDesignPatternsRealWorldFiles();
  const tree=buildJavaDesignPatternsRealWorldTree(files);
  const defaultPath=files.find((f)=>f.path==='README.md')?.path
    ?? files.find((f)=>f.path.includes('PaymentProcessingSystem.java'))?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Source explorer
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          Java design patterns — real world repository
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Browse <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">java-design-patterns-real-world/</code>: all 23 GoF patterns,
          behavior-focused tests, interview docs, Spring mapping, Kafka event flow, and one combined payment processing system.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/java-design-patterns-real-world?path=docs%2Fcheatsheet.md" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            5-minute cheat sheet →
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/java-design-patterns-real-world?path=docs%2Fpattern-comparisons.md" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Pattern comparisons →
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/java-design-patterns-real-world?path=src%2Fmain%2Fjava%2Fcom%2Fexample%2Fdesignpatterns%2Frealworld%2Fpayment%2FPaymentProcessingSystem.java" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Main interview example →
          </Link>
        </div>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold">Start here</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">README, cheat sheet, and memory stories for quick revision.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold">Interview core</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Strategy, State, Decorator, Facade, Proxy, Chain, Observer, and the combined payment flow.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold">Spring mapping</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Open <code>docs/spring-pattern-mapping.md</code> for Spring Boot-specific usage and caveats.</p>
        </div>
      </section>

      <div className="mt-10">
        {files.length===0?(
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            Source folder not found at build time.
          </div>
        ):(
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
