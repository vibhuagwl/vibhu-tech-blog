import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import {buildSpringCacheLabTree, listSpringCacheLabFiles} from '@/lib/spring-cache-lab-source';

export const metadata = {
  title: 'Spring Cache Lab — Full Source in Browser',
  description:
    'Browse the complete spring-cache-lab source: LRU/LFU/TTL caches, @Cacheable Product API, Caffeine, Redis profile, negative caching, and docs.',
};

const LAB_GITHUB = 'https://github.com/vibhuagwl/vibhu-tech-blog/tree/main/spring-cache-lab';

const LAB_RUN = `cd spring-cache-lab
mvn test
mvn spring-boot:run
curl -s localhost:8080/api/products/1
curl -s localhost:8080/api/products/1   # expect HIT
curl -s localhost:8080/api/products/_stats`;

const LAB_REDIS = `docker compose up -d redis
mvn spring-boot:run -Dspring-boot.run.profiles=redis`;

export default function SpringCacheDemoPage() {
  const files = listSpringCacheLabFiles();
  const tree = buildSpringCacheLabTree(files);
  const defaultPath =
    files.find((f) => f.path === 'README.md')?.path ??
    files.find((f) => f.path.includes('ProductService.java'))?.path ??
    files.find((f) => f.path === 'pom.xml')?.path ??
    files[0]?.path ??
    '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Source explorer
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          Spring Cache lab — full source
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Browse every file in{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">spring-cache-lab/</code>
          : LRU/LFU/TTL algorithms, @Cacheable Product API, Caffeine + Redis configs, cache-aside,
          negative caching, docs, and tests. Select a file in the tree to read it in the browser.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/spring-cache" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Cache master guide →
          </Link>
          <span className="text-slate-300">·</span>
          <Link
            href="/distributed-caching"
            className="font-semibold text-slate-700 hover:underline dark:text-blue-400"
          >
            Distributed caching →
          </Link>
          <span className="text-slate-300">·</span>
          <a href="#run" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Build & run →
          </a>
          <span className="text-slate-300">·</span>
          <a
            href={LAB_GITHUB}
            className="font-semibold text-slate-700 hover:underline dark:text-blue-400"
            target="_blank"
            rel="noreferrer"
          >
            GitHub folder →
          </a>
        </div>
      </header>

      <section id="run" className="mt-10 max-w-3xl scroll-mt-28">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Build & run locally
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Default profile uses Caffeine in-process. GitHub Pages cannot execute Spring Boot — clone and run
          on your machine.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-[13px] leading-6 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {LAB_RUN}
        </pre>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-[13px] leading-6 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {LAB_REDIS}
        </pre>
      </section>

      <div id="source" className="mt-10 scroll-mt-28">
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
              routeBase="/spring-cache-demo"
              ariaLabel="Spring Cache lab source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
