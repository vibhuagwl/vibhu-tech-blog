import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import {buildSpringAiDemoTree, listSpringAiDemoFiles} from '@/lib/spring-ai-demo-source';
import {LAB_CURL, LAB_GITHUB, LAB_RUN} from '@/lib/spring-ai/lab';

export const metadata = {
  title: 'Spring AI FinTech Lab — Full Source in Browser',
  description:
    'Browse the complete financial-ai-platform source: ChatClient, @Tool, ToolCallAdvisor, RAG, scripted ChatModel, approvals, MCP catalog, and tests.',
};

export default function SpringAiDemoPage() {
  const files = listSpringAiDemoFiles();
  const tree = buildSpringAiDemoTree(files);
  const defaultPath =
    files.find((f) => f.path === 'README.md')?.path ??
    files.find((f) => f.path.includes('FinancialAiOrchestrator.java'))?.path ??
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
          Spring AI FinTech lab — full source
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Browse every file in{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">
            financial-ai-platform/
          </code>
          : ai-orchestrator (ChatClient, tools, RAG, approvals), common (PnL/risk calculators),
          MCP catalog, Docker, and tests. Select a file in the tree to read it in the browser.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/spring-ai" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Interview hub →
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
          Default profile uses H2 + Caffeine + a scripted ChatModel — no OpenAI key required.
          GitHub Pages cannot execute Spring Boot; clone and run on your machine.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-[13px] leading-6 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {LAB_RUN}
        </pre>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-[13px] leading-6 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {LAB_CURL}
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
              routeBase="/spring-ai-demo"
              ariaLabel="Spring AI FinTech lab source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
