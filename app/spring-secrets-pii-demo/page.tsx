import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import SpringSecretsPiiSequenceDiagrams from '@/components/spring-secrets-pii-sequence-diagrams';
import {buildSpringSecretsPiiDemoTree,listSpringSecretsPiiDemoFiles} from '@/lib/spring-secrets-pii-demo-source';

export const metadata={
  title:'Spring Secrets + PII Demo — Full Source',
  description:'Browse runnable Spring Boot customer-service: env-based secrets, AES-GCM PII encryption, masked API responses, audit logging.',
};

export default function SpringSecretsPiiDemoPage(){
  const files=listSpringSecretsPiiDemoFiles();
  const tree=buildSpringSecretsPiiDemoTree(files);
  const defaultPath=files.find((f)=>f.path==='README.md')?.path
    ?? files.find((f)=>f.path.includes('CustomerService.java'))?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Source explorer
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          Spring Secrets + PII handling
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Browse <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">spring-secrets-pii-demo/</code>:
          K8s/Vault-style env secrets, AES-256-GCM column encryption, masked JSON responses, PII audit aspect, log redaction.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/realtime-issues/spring-secrets-pii-handling" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Real-time guide →
          </Link>
          <span className="text-slate-300">·</span>
          <a href="#secrets-flow" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Diagrams →
          </a>
          <span className="text-slate-300">·</span>
          <Link href="/oauth-jwt-demo" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            OAuth + JWT lab →
          </Link>
        </div>
      </header>

      <SpringSecretsPiiSequenceDiagrams />

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
              routeBase="/spring-secrets-pii-demo"
              ariaLabel="Spring secrets and PII demo source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
