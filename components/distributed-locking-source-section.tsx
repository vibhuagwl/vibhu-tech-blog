import {Suspense} from 'react';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import {
  buildDistributedLockingDemoTree,
  listDistributedLockingDemoFiles,
} from '@/lib/distributed-locking-demo-source';

export default function DistributedLockingSourceSection(){
  const files=listDistributedLockingDemoFiles();
  const tree=buildDistributedLockingDemoTree(files);
  const defaultPath=
    files.find((f)=>f.path.endsWith('TwoPhaseLockingManager.java'))?.path
    ?? files.find((f)=>f.path.endsWith('ThreePhaseTransactionManager.java'))?.path
    ?? files.find((f)=>f.path==='README.md')?.path
    ?? files[0]?.path
    ?? '';

  return (
    <section id="source" className="mt-12 scroll-mt-24 not-prose">
      <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
        Runnable code — <code className="text-xl">distributed-locking/</code>
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
        Full Spring multi-module sample on this page. Start with{' '}
        <code>TwoPhaseLockingManager</code> (why it is <strong>2-phase</strong>) and{' '}
        <code>ThreePhaseTransactionManager</code> / <code>TransferService</code> (why the transfer
        protocol is <strong>3-phase</strong>).
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="font-semibold text-slate-900 dark:text-white">2PL class</div>
          <code className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
            transaction-service/.../TwoPhaseLockingManager.java
          </code>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="font-semibold text-slate-900 dark:text-white">3PL class</div>
          <code className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
            transaction-service/.../ThreePhaseTransactionManager.java
          </code>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="font-semibold text-slate-900 dark:text-white">Orchestration</div>
          <code className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
            transaction-service/.../TransferService.java
          </code>
        </div>
      </div>
      <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`cd distributed-locking
mvn test
./scripts/start-services.sh   # or docker compose up
./scripts/test-transfer.sh`}</pre>
      {files.length===0?(
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          Source folder not found at build time.
        </div>
      ):(
        <div className="mt-6">
          <Suspense fallback={<div className="text-sm text-slate-500">Loading source explorer…</div>}>
            <OAuthCodeExplorer
              files={files}
              tree={tree}
              defaultPath={defaultPath}
              routeBase="/distributed-systems/2pl-3pl-money-transfer-interview"
              ariaLabel="Distributed locking 2PL 3PL source tree"
            />
          </Suspense>
        </div>
      )}
    </section>
  );
}
