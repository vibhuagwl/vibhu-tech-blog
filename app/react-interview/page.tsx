import type {Metadata} from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ReactJS Interview Cheat Book — Backend → Frontend',
  description:
    'For senior Java/Spring engineers: React 19 Payment Ops lab, cheat sheet, 150+ questions, mock interview, security, and Spring Boot integration.',
};

const DOCS = [
  {href: '/react-interview-demo', label: 'Browse full lab source', note: 'README, frontend, backend, docs'},
  {file: 'REACT_CHEAT_SHEET.md', label: 'Cheat sheet', note: '60-second memory rules'},
  {file: 'REACT_INTERVIEW.md', label: 'Top interview answers', note: '75+ deep Q&A'},
  {file: 'INTERVIEW_150.md', label: '150+ question bank', note: 'Fundamentals → staff architecture'},
  {file: 'MOCK_INTERVIEW.md', label: '5-round mock', note: 'Fundamentals → architecture'},
  {file: 'REACT_PERFORMANCE.md', label: 'Performance map', note: 'Problem → solution'},
  {file: 'SECURITY.md', label: 'Security', note: 'XSS · CSRF · JWT · secrets'},
  {file: 'ARCHITECTURE.md', label: 'Architecture', note: 'BFF · SSE · contracts'},
];

const FLOW = `Login → Dashboard → Payments (debounce/filter/URL)
  → Payment detail → Retry (optimistic) → SSE SUCCESS
  → /labs/virtualized (10k rows)
  → /labs/concepts (stale closure, abort, transitions)`;

export default function ReactInterviewPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
        Interview weapon · not a beginner course
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
        React for senior backend engineers
      </h1>
      <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
        Payment Operations Dashboard: React 19 + Vite talks to Spring Boot JWT APIs. ~90% code, ~10% diagrams.
        Frontend route guards are UX only — Spring Security authorizes.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link
          href="/react-interview-demo"
          className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
        >
          Open source explorer
        </Link>
        <a
          href="https://github.com/vibhuagwl/vibhu-tech-blog/tree/main/react-springboot-interview"
          className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-800 dark:border-slate-600 dark:text-slate-100"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Demo path</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-5 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
          {FLOW}
        </pre>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Docs in the lab</h2>
        <ul className="mt-4 space-y-3">
          {DOCS.map((d) => (
            <li key={d.label} className="border-b border-slate-200 pb-3 dark:border-slate-800">
              {d.href ? (
                <Link href={d.href} className="font-semibold text-slate-900 hover:underline dark:text-blue-400">
                  {d.label}
                </Link>
              ) : (
                <Link
                  href={`/react-interview-demo?file=${encodeURIComponent(d.file!)}`}
                  className="font-semibold text-slate-900 hover:underline dark:text-blue-400"
                >
                  {d.label}
                </Link>
              )}
              <p className="text-sm text-slate-600 dark:text-slate-400">{d.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Correct these myths</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
          <li>Virtual DOM does not make React always faster.</li>
          <li>useMemo / useCallback are not default clothing for every function.</li>
          <li>Redux is not required for large apps — prefer TanStack Query for server state.</li>
          <li>Frontend ProtectedRoute is not authorization.</li>
          <li>localStorage JWT is a lab convenience; production prefers HttpOnly cookies / BFF.</li>
          <li>Server Components need a framework (e.g. Next.js) — not plain Vite + Spring Boot.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Run</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-5 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">{`cd react-springboot-interview/backend && mvn spring-boot:run
cd react-springboot-interview/frontend && npm install && npm run dev`}</pre>
      </section>
    </main>
  );
}
