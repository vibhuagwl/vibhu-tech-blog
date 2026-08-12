import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import SpringCorsSequenceDiagrams from '@/components/spring-cors-sequence-diagrams';
import {buildSpringCorsDemoTree,listSpringCorsDemoFiles} from '@/lib/spring-cors-demo-source';

export const metadata={
  title:'Spring CORS Security Demo — Full Source',
  description:'Browse Spring Security CORS demo: allowlist, preflight OPTIONS, credentials, blocked origins, and a second-origin frontend lab.',
};

export default function SpringCorsDemoPage(){
  const files=listSpringCorsDemoFiles();
  const tree=buildSpringCorsDemoTree(files);
  const defaultPath=files.find((f)=>f.path==='README.md')?.path
    ?? files.find((f)=>f.path.includes('SecurityConfig.java'))?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Source explorer
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          CORS Security — Spring Security
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Browse <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">spring-cors-demo/</code>:
          allowlisted origins, preflight, credentials, blocked evil origins, and a :5500 frontend.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/distributed-systems/spring-cors-security-demo" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Interview guide →
          </Link>
          <span className="text-slate-300">·</span>
          <a href="#cors-simple" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Sequence diagrams →
          </a>
          <span className="text-slate-300">·</span>
          <Link href="/spring-security" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Spring Security hub →
          </Link>
        </div>
      </header>

      <SpringCorsSequenceDiagrams />

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
              routeBase="/spring-cors-demo"
              ariaLabel="Spring CORS security demo source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
