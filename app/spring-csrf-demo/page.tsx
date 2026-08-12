import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import SpringCsrfSequenceDiagrams from '@/components/spring-csrf-sequence-diagrams';
import {buildSpringCsrfDemoTree,listSpringCsrfDemoFiles} from '@/lib/spring-csrf-demo-source';

export const metadata={
  title:'Spring CSRF Protection Demo — Full Source',
  description:'Browse Spring Security CSRF protection demo: session tokens, CookieCsrfTokenRepository, attack 403, and when to disable CSRF.',
};

export default function SpringCsrfDemoPage(){
  const files=listSpringCsrfDemoFiles();
  const tree=buildSpringCsrfDemoTree(files);
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
          CSRF Protection — Spring Security
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Browse <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">spring-csrf-demo/</code>:
          session CSRF forms, Cookie CSRF for SPA paths, forged-POST 403, and tests.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/distributed-systems/spring-csrf-protection-demo" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Interview guide →
          </Link>
          <span className="text-slate-300">·</span>
          <a href="#csrf-attack" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Sequence diagrams →
          </a>
          <span className="text-slate-300">·</span>
          <Link href="/spring-security" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Spring Security hub →
          </Link>
        </div>
      </header>

      <SpringCsrfSequenceDiagrams />

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
              routeBase="/spring-csrf-demo"
              ariaLabel="Spring CSRF protection demo source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
