import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import {
  buildSpringAiInvestigatorTree,
  listSpringAiInvestigatorFiles,
} from '@/lib/spring-ai-investigator-source';

export const metadata = {
  title: 'Spring AI Payment Investigator — Full Source',
  description:
    'Browse spring-ai-payment-investigator: ContextEngineeringService, AiExecutionHarness, ToolGateway, RAG, MCP, TXN-1001.',
};

const LAB_GITHUB = 'https://github.com/vibhuagwl/vibhu-tech-blog/tree/main/spring-ai-payment-investigator';

const LAB_RUN = `cd spring-ai-payment-investigator
mvn test
mvn -pl ai-orchestrator spring-boot:run`;

const LAB_CURL = `curl -s -X POST http://localhost:8090/api/ai/chat \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer demo' \\
  -d '{"conversationId":"c1","message":"Why did payment TXN-1001 fail?"}'`;

export default function SpringAiInvestigatorDemoPage() {
  const files = listSpringAiInvestigatorFiles();
  const tree = buildSpringAiInvestigatorTree(files);
  const defaultPath =
    files.find((f) => f.path === 'README.md')?.path ??
    files.find((f) => f.path.includes('AiExecutionHarness.java'))?.path ??
    files.find((f) => f.path.includes('ContextEngineeringService.java'))?.path ??
    files[0]?.path ??
    '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Source explorer
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          Payment Investigator — full source
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Browse{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">
            spring-ai-payment-investigator/
          </code>
          : context engineering, harness state machine, tool gateway, RAG, MCP, HITL, and TXN-1001 E2E.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/spring-ai-investigator" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            ← Investigator hub
          </Link>
          <Link href="/spring-ai" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Spring AI playbook
          </Link>
          <a href={LAB_GITHUB} className="font-semibold text-slate-700 hover:underline dark:text-blue-400" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </header>

      <section className="mt-8 grid gap-4 max-w-3xl md:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Run</h2>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-[11px] leading-5 text-slate-100">
            {LAB_RUN}
          </pre>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Investigate</h2>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-[11px] leading-5 text-slate-100">
            {LAB_CURL}
          </pre>
        </div>
      </section>

      <section className="mt-10">
        <Suspense fallback={<div className="text-sm text-slate-500">Loading source tree…</div>}>
          <OAuthCodeExplorer
            files={files}
            tree={tree}
            defaultPath={defaultPath}
            routeBase="/spring-ai-investigator-demo"
            ariaLabel="Payment investigator source tree"
          />
        </Suspense>
      </section>
    </main>
  );
}
