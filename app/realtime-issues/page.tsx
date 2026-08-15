import type {Metadata} from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Real-Time Issues — Production Incident Interview Hub',
  description:
    'Staff/Principal on-call curricula: stuck threads, 10GB file processing, Aurora/Oracle DB incidents, API integration, Java migration, lead ownership, and a 30-YOE interview bank. One card per curriculum — no duplicate chapter dump.',
};

/** One card per curriculum destination. Deep chapters live under each master index. */
const CURRICULA = [
  {
    href: '/realtime-issues/realtime-issues-master-index',
    number: '00',
    title: 'Section map',
    blurb: 'How to use this hub: study path, incident narrative style, and where each curriculum fits.',
  },
  {
    href: '/realtime-issues/stuck-thread-incident-response',
    number: '01',
    title: 'Stuck threads',
    blurb: 'First response → dumps → pools/DB/API → Kafka/locks → CPU/GC → RCA → payment case → interview answers.',
    index: '/realtime-issues/stuck-thread-cheat-sheet',
  },
  {
    href: '/realtime-issues/process-10gb-file-master-index',
    number: '02',
    title: 'Process a 10 GB file',
    blurb: 'Stream, don’t heap-load. Chunks, Spring Batch, checkpoints, S3/distributed, backpressure, spoken answers.',
  },
  {
    href: '/realtime-issues/java-30yoe-interview-master-index',
    number: '03',
    title: '30-YOE interview bank',
    blurb: 'Q1–Q100 Principal production readiness: incidents, concurrency, JVM, Spring, Kafka/DB, architecture.',
  },
  {
    href: '/realtime-issues/api-integration-frameworks-master-index',
    number: '04',
    title: 'API integration',
    blurb: 'Contracts, sync/async patterns, versioning, auth, errors/resilience, service-to-service, interview answers.',
  },
  {
    href: '/realtime-issues/aurora-postgresql-master-index',
    number: '05',
    title: 'Aurora PostgreSQL',
    blurb: 'SQL/architecture, indexes, vacuum/locks/pools, CloudWatch, migrations, incident case, interview answers.',
  },
  {
    href: '/realtime-issues/oracle-database-realtime-troubleshooting',
    number: '06',
    title: 'Oracle DB incidents',
    blurb: 'v$session / locks / plans + payment API case study when the query used to be fast.',
  },
  {
    href: '/realtime-issues/java-migration-master-index',
    number: '07',
    title: 'Java migration',
    blurb: 'Honest 11→17 framing: baseline, Spring, deps, tests, canary/rollback, runbook, before-prod checklist.',
  },
  {
    href: '/realtime-issues/lead-experience-master-index',
    number: '08',
    title: 'Lead experience',
    blurb: 'Hands-on delivery ownership: standards, mentoring, releases, payment STAR case, interview answers.',
  },
  {
    href: '/realtime-issues/query-used-to-be-fast-now-timeouts',
    number: '09',
    title: 'DB change playbooks',
    blurb: 'Query timeouts investigation script + production migration risk checklist + Spring PII/secrets pattern.',
  },
] as const;

const RELATED = [
  {href: '/performance', label: 'Performance handbook', blurb: 'Measure → bottleneck → optimize'},
  {href: '/production-troubleshooting', label: 'Production troubleshooting', blurb: 'On-call frameworks'},
  {href: '/kafka-interview', label: 'Kafka interview', blurb: 'Producer · consumer · DLQ'},
  {href: '/resilience4j', label: 'Resilience4j', blurb: 'Timeout · CB · bulkhead'},
] as const;

export default function RealtimeIssuesPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · Architect · On-call
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Real-time production issues
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Diagnose like you are on-call. <strong>One card per curriculum</strong> — deep chapters live under each
          index, not as a duplicated wall of 60+ cards.
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Tone: what you check first, what you refuse to guess, mitigate vs RCA, when to restart, how you protect
          downstreams.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Interview curricula</h2>
        <p className="mt-2 text-sm text-slate-500">
          Jump to the topic you get grilled on. Each destination appears once.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CURRICULA.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-400">{page.number}</div>
              <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{page.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{page.blurb}</p>
              <div className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Open →</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">45-minute revision path</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
          <li>
            <strong>§01 Stuck threads</strong> — say first-5-minute checks and when you will not restart.
          </li>
          <li>
            <strong>§05 Aurora</strong> or <strong>§06 Oracle</strong> — walk one slow-query / pool story with evidence.
          </li>
          <li>
            <strong>§02 10 GB file</strong> — streaming + checkpoint + idempotency in 2 minutes.
          </li>
          <li>
            <strong>§04 API integration</strong> — timeouts, retries, when not to retry.
          </li>
          <li>
            <strong>§03 30-YOE bank</strong> — drill 5 spoken answers from the Top 15 list.
          </li>
          <li>
            Skim <strong>§07 Migration</strong> or <strong>§08 Lead</strong> if the panel is behavioral / upgrade-focused.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Related hubs</h2>
        <p className="mt-2 text-sm text-slate-500">
          Kafka payment/DLQ content lives under Kafka (stubs under this section redirect there — not listed twice).
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RELATED.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800"
            >
              <div className="font-semibold text-slate-900 dark:text-white">{r.label}</div>
              <div className="mt-1 text-slate-500">{r.blurb}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
