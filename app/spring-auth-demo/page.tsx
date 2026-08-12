import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import SpringAuthSequenceDiagrams from '@/components/spring-auth-sequence-diagrams';
import {buildSpringAuthDemoTree,listSpringAuthDemoFiles} from '@/lib/spring-auth-demo-source';

export const metadata={
  title:'Spring Authn + Authz Demo — Full Source (No OAuth)',
  description:'Browse Spring Security form login and HTTP Basic authentication/authorization demo source without OAuth2.',
};

export default function SpringAuthDemoPage(){
  const files=listSpringAuthDemoFiles();
  const tree=buildSpringAuthDemoTree(files);
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
          Spring Authn + Authz — no OAuth
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Browse <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">spring-authn-authz-demo/</code>:
          form-login web portal, HTTP Basic API, roles, method security, Flyway, and tests.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/distributed-systems/spring-security-authn-authz-demo" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Interview guide →
          </Link>
          <span className="text-slate-300">·</span>
          <a href="#form-login" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Sequence diagrams →
          </a>
          <span className="text-slate-300">·</span>
          <Link href="/oauth-jwt-demo" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            OAuth + JWT lab →
          </Link>
        </div>
      </header>

      <SpringAuthSequenceDiagrams />

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
              routeBase="/spring-auth-demo"
              ariaLabel="Spring authn/authz demo source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
