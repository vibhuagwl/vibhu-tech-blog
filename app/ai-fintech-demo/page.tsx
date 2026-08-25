import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import {buildAiFintechDemoTree, listAiFintechDemoFiles} from '@/lib/ai-fintech-demo-source';

export const metadata = {
  title: 'AI FinTech Ops Assistant — Full Source in Browser',
  description:
    'Browse ai-fintech-platform: AI Harness, MCP servers (@McpTool), RAG, Context Engineering, guardrails, HITL, and interview docs.',
};

const LAB_GITHUB = 'https://github.com/vibhuagwl/vibhu-tech-blog/tree/main/ai-fintech-platform';

const LAB_RUN = `cd ai-fintech-platform
mvn -q -DskipTests package
mvn -pl ai-assistant -am spring-boot:run
# or: java -jar ai-assistant/target/ai-assistant-1.0.0-SNAPSHOT.jar`;

const LAB_CURL = `curl -s -X POST http://localhost:8080/api/ai/chat \\
  -H 'Content-Type: application/json' \\
  -H 'X-User-Id: ops-1' -H 'X-User-Role: OPS' \\
  -d '{"conversationId":"c1","message":"Why did payment PAY-123 fail?"}'`;

export default function AiFintechDemoPage() {
  const files = listAiFintechDemoFiles();
  const tree = buildAiFintechDemoTree(files);
  const defaultPath =
    files.find((f) => f.path === 'README.md')?.path ??
    files.find((f) => f.path.includes('AiHarness.java'))?.path ??
    files[0]?.path ??
    '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Source explorer
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          AI FinTech Ops Assistant — full source
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Browse every file in{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">
            ai-fintech-platform/
          </code>
          : AI Harness, Context Engineering, RAG, domain MCP servers (@McpTool / Resources / Prompts),
          guardrails, human approval, evaluation, and interview packs. Select a file to read it in the
          browser.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/spring-ai" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Spring AI hub →
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/spring-ai-demo" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Earlier FinTech AI lab →
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
          Default profile uses a scripted ChatModel — no OpenAI key. MCP HTTP servers are separate
          modules (8091–8094) and require an API key boundary in production.
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
              routeBase="/ai-fintech-demo"
              ariaLabel="AI FinTech Ops Assistant source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
