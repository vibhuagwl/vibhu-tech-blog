import type {Metadata} from 'next';
import Link from 'next/link';
import {Suspense} from 'react';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import {buildReactInterviewLabTree, listReactInterviewLabFiles} from '@/lib/react-interview-source';

export const metadata: Metadata = {
  title: 'React + Spring Boot Interview Lab — Payment Ops',
  description:
    'Senior backend engineer React interview weapon: Payment Operations Dashboard, JWT, TanStack Query, SSE, virtualization, 150+ questions, cheat sheets.',
};

const RUN = `cd react-springboot-interview
docker compose up -d          # optional Postgres
cd backend && mvn spring-boot:run
cd frontend && npm install && npm run dev
# UI http://localhost:5173  API http://localhost:8080
# admin/admin123 · support/support123 · reader/reader123`;

export default function ReactInterviewDemoPage() {
  const files = listReactInterviewLabFiles();
  const tree = buildReactInterviewLabTree(files);
  const defaultPath =
    files.find((f) => f.path === 'frontend/src/App.tsx')?.path ??
    files.find((f) => f.path === 'frontend/src/pages/PaymentsPage.tsx')?.path ??
    files.find((f) => f.path === 'README.md')?.path ??
    files.find((f) => f.path === 'REACT_CHEAT_SHEET.md')?.path ??
    files.find((f) => f.path.includes('PaymentController.java'))?.path ??
    files[0]?.path ??
    '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Source explorer
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          React + Spring Boot interview lab
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Browse <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">react-springboot-interview/</code>
          : Payment Ops dashboard (React 19), Spring Boot JWT APIs, SSE, virtualization, and interview docs.
          GitHub Pages cannot run the SPA — clone and use the commands below.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/react-interview" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            ← Interview hub
          </Link>
          <a
            href="https://github.com/vibhuagwl/vibhu-tech-blog/tree/main/react-springboot-interview"
            className="font-semibold text-slate-700 hover:underline dark:text-blue-400"
            target="_blank"
            rel="noreferrer"
          >
            GitHub folder
          </a>
        </div>
      </header>

      <section className="mt-8 max-w-3xl">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Run locally</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
          {RUN}
        </pre>
      </section>

      <section className="mt-10">
        <Suspense fallback={<div className="text-sm text-slate-500">Loading source tree…</div>}>
          <OAuthCodeExplorer files={files} tree={tree} defaultPath={defaultPath} />
        </Suspense>
      </section>
    </main>
  );
}
