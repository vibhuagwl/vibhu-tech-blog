import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import OAuthSequenceDiagrams from '@/components/oauth-sequence-diagrams';
import {buildOAuthDemoTree,listOAuthDemoFiles} from '@/lib/oauth-demo-source';

export const metadata={
  title:'OAuth 2.0 + JWT Demo — Full Source in Browser',
  description:'Browse the complete Spring Boot OAuth 2.0 + JWT multi-module source code: Authorization Server, Resource Server, API Gateway, and Client.',
};

export default function OAuthJwtDemoPage(){
  const files=listOAuthDemoFiles();
  const tree=buildOAuthDemoTree(files);
  const defaultPath=files.find((f)=>f.path==='README.md')?.path
    ?? files.find((f)=>f.path==='pom.xml')?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Source explorer
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          OAuth 2.0 + JWT — full source
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Browse every file in <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">oauth-jwt-demo/</code>:
          Authorization Server, Resource Server, API Gateway, Client App, Flyway SQL, Docker, tests, and docs.
          Select a file in the tree to read it in the browser.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/distributed-systems/oauth2-jwt-spring-boot-demo" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Interview guide →
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/spring-jwt-demo" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            First-party JWT (no OAuth) →
          </Link>
          <span className="text-slate-300">·</span>
          <a href="#auth-code" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Sequence diagrams →
          </a>
          <span className="text-slate-300">·</span>
          <a
            href="https://github.com/vibhuagwl/vibhu-tech-blog/tree/main/oauth-jwt-demo"
            className="font-semibold text-slate-700 hover:underline dark:text-blue-400"
            target="_blank"
            rel="noreferrer"
          >
            GitHub folder →
          </a>
        </div>
      </header>

      <OAuthSequenceDiagrams />

      <div className="mt-10">
        {files.length===0?(
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            Source folder not found at build time.
          </div>
        ):(
          <Suspense fallback={<div className="text-sm text-slate-500">Loading source explorer…</div>}>
            <OAuthCodeExplorer files={files} tree={tree} defaultPath={defaultPath}/>
          </Suspense>
        )}
      </div>
    </main>
  );
}
