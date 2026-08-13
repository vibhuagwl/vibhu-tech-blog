import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import {
  buildSpringDistributedCounterDemoTree,
  listSpringDistributedCounterDemoFiles,
} from '@/lib/spring-distributed-counter-demo-source';

export const metadata={
  title:'Spring distributed counter demo — full source',
  description:'Browse runnable Spring Boot distributed counter microservices: sharded INCR, idempotency, outbox, Kafka aggregator snapshots.',
};

export default function SpringDistributedCounterDemoPage(){
  const files=listSpringDistributedCounterDemoFiles();
  const tree=buildSpringDistributedCounterDemoTree(files);
  const defaultPath=files.find((f)=>f.path==='README.md')?.path
    ?? files.find((f)=>f.path.includes('CounterController.java'))?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Source explorer
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          Spring distributed counter microservices
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Browse <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">spring-distributed-counter-demo/</code>:
          counter-api sharded INCR, LIKE idempotency, outbox deltas, and counter-aggregator snapshots.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/system-design/design-distributed-counter" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Distributed Counter HLD + LLD →
          </Link>
        </div>
      </header>

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
              routeBase="/spring-distributed-counter-demo"
              ariaLabel="Spring distributed counter demo source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
