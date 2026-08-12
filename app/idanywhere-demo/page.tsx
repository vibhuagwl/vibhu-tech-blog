import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import IdAnywhereSequenceDiagrams from '@/components/idanywhere-sequence-diagrams';
import {buildIdAnywhereDemoTree,listIdAnywhereDemoFiles} from '@/lib/idanywhere-demo-source';

export const metadata={
  title:'IDAnywhere / ADFS / OIDC Demo — Full Source',
  description:'Browse Spring Security OIDC client and resource server wiring for IDAnywhere/ADFS, with a local IdP stand-in.',
};

export default function IdAnywhereDemoPage(){
  const files=listIdAnywhereDemoFiles();
  const tree=buildIdAnywhereDemoTree(files);
  const defaultPath=files.find((f)=>f.path==='README.md')?.path
    ?? files.find((f)=>f.path==='pom.xml')?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Source explorer
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          IDAnywhere / ADFS / OIDC
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Browse <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">idanywhere-oidc-demo/</code>:
          IdP stand-in, OIDC web client, JWT resource API with AD group → role mapping, and production profile notes.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/distributed-systems/idanywhere-adfs-oidc-demo" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Interview guide →
          </Link>
          <span className="text-slate-300">·</span>
          <a href="#e2e" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Sequence diagrams →
          </a>
          <span className="text-slate-300">·</span>
          <Link href="/oauth-jwt-demo" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            OAuth + JWT lab →
          </Link>
        </div>
      </header>

      <IdAnywhereSequenceDiagrams />

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
              routeBase="/idanywhere-demo"
              ariaLabel="IDAnywhere OIDC demo source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
