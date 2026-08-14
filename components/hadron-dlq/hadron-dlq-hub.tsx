'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import type {DemoSourceFile, DemoTreeNode} from '@/lib/oauth-demo-source';
import {HADRON_DLQ_TOC} from '@/lib/hadron-dlq/toc';
import {TOPICS} from '@/lib/hadron-dlq/topics';
import {
  CHEAT,
  CHECKLIST,
  CLOSING,
  COST_MODEL,
  DECISION_MATRIX,
  FIVE_MIN,
  MEMORY_SENTENCE,
  SIXTY_SEC,
  TWO_MINUTE_STORY,
} from '@/lib/hadron-dlq/comparison';
import {PRODUCTION_MISTAKES} from '@/lib/hadron-dlq/mistakes';
import {DLQ_CORNER_CASES} from '@/lib/hadron-dlq/corner-cases';
import CodePanel from './code-panel';
import InterviewMode from './interview-mode';
import SequenceWalkthrough, {LabCallMap} from './sequence-walkthrough';
import StickyToc from './sticky-toc';
import TopicPanel from './topic-panel';
import CornerCaseCatalog from './corner-case-catalog';

function Section({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-3xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{title}</h2>
      {lead && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function MiniTable({headers, rows}: {headers: string[]; rows: string[][]}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-2 py-2 text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.join('|')} className="border-t border-slate-200 dark:border-slate-800">
              {r.map((c, i) => (
                <td key={i} className={`px-2 py-2 align-top ${i === 0 ? 'font-semibold' : ''}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HadronDlqHub({
  files = [],
  tree = [],
  defaultPath = '',
}: {
  files?: DemoSourceFile[];
  tree?: DemoTreeNode[];
  defaultPath?: string;
}) {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · Architect · Spring Kafka · PostgreSQL · Hadron CashLines
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Hadron CashLines DLQ — Production Kafka Recovery
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Neptune to Kafka to Hadron: validation, retry topics, dead letters, idempotency, ordering,
          replay, and the interview story for financial event pipelines.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Lab:{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-900">hadron-cashlines-dlq/</code>
          {' · '}
          <Link href="/kafka-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Kafka
          </Link>
          {' · '}
          <Link href="/kafka-mastery" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Interview mastery
          </Link>
          {' · '}
          <Link href="/kafka-internals" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Internals board
          </Link>
          {' · '}
          <Link href="/jpmc-experience" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            JPMC / Hadron
          </Link>
          {' · '}
          <Link href="/fintech" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            FinTech
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={HADRON_DLQ_TOC} />
        <div className="min-w-0 space-y-16">
          <Section
            id="overview"
            title="01. Business Story"
            lead="Central interview narrative: Neptune is the source system. Hadron consumes CashLine events. Failures must retry, park, or die — never loop and never skip a middle lifecycle event."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TD
  N[Neptune DB] --> P[CDC / Poller]
  P --> K[Kafka cashline-events]
  K --> H[Hadron Consumer]
  H --> V[Validate / Transform]
  V --> DB[(Hadron DB)]
  DB --> OK[Commit offset]
  H --> F[Failure]
  F --> R[Retry 5s / 30s / 5m]
  R --> DLT[DLQ topic]
  DLT --> DDB[(dead_letter_messages)]
  DDB --> RP[Replay API]
  RP --> K`}
              />
            </div>
          </Section>

          <Section id="architecture" title="02. Architecture">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  N[Neptune DB] --> POLL[Poller cursor updated_at,id]
  POLL --> K[cashline-events key=cashLineId]
  K --> C[Hadron Consumer]
  C -->|success| H[(cash_lines + processed_events)]
  C -->|transient| R1[retry-1]
  R1 --> R2[retry-2]
  R2 --> R3[retry-3]
  R3 --> D[cashline-events-dlq]
  C -->|poison / business| D
  D --> L[(dead_letter_messages)]
  L --> API[POST /api/dlq/id/replay]
  API --> K`}
              />
            </div>
          </Section>

          <Section
            id="code-sequences"
            title="Lifecycle Sequences"
            lead="Success, retry, DLQ, replay, duplicate, and the Event-2-fails story."
          >
            <SequenceWalkthrough />
            <div className="mt-6">
              <LabCallMap />
            </div>
          </Section>

          <Section id="retry-vs-dlq" title="04. Retry vs DLQ matrix">
            <MiniTable headers={['Situation', 'Retry', 'DLQ', 'Why']} rows={DECISION_MATRIX} />
          </Section>

          <Section
            id="failures"
            title="24. Dead-letter corner cases"
            lead={`Every Kafka/Hadron failure needs a decision: retry, DLQ now, DLQ after cap, park later events, ignore as duplicate/stale, or conflict on replay. ${DLQ_CORNER_CASES.length} cases below — filter by family or classifier decision. Expand a card for detection, recovery, lab curl, and the interview trap.`}
          >
            <MiniTable
              headers={['Case', 'Decision', 'Retry', 'DLQ', 'Ordering', 'Lab']}
              rows={DLQ_CORNER_CASES.map((c) => [
                c.title,
                c.classify,
                c.classify === 'RETRY' || c.classify === 'DLQ_AFTER_CAP' ? 'Yes/capped' : c.classify === 'PARK' ? 'Park' : 'No',
                c.classify === 'DLQ_NOW' || c.classify === 'DLQ_AFTER_CAP' ? 'Yes' : c.classify === 'PARK' ? 'Maybe prior' : 'No',
                c.holdCashLine ? 'Hold CashLine' : '—',
                c.lab ? 'lab' : '—',
              ])}
            />
            <div className="mt-8">
              <CornerCaseCatalog />
            </div>
          </Section>

          <Section id="cost" title="Cost of unbounded retry">
            <MiniTable headers={['', 'No DLQ cap', 'With DLQ']} rows={COST_MODEL} />
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              DLQ is not itself a cost-saving product. It prevents you from running a self-inflicted amplification
              attack: CPU, pool slots, Kafka traffic, logs, alerts, and downstream APIs.
            </p>
          </Section>

          {TOPICS.filter(
            (t) => !['overview', 'architecture', 'failures', 'cost', 'retry-vs-dlq'].includes(t.id),
          ).map((t) => (
              <TopicPanel key={t.id} t={t} />
            ),
          )}

          <Section id="mistakes" title="Production mistakes">
            <MiniTable
              headers={['Bad', 'Good', 'Why']}
              rows={PRODUCTION_MISTAKES.map((r) => [r.bad, r.good, r.why])}
            />
          </Section>

          <Section id="interview" title="Interview bank" lead="Short answer, Hadron example, follow-up if they push.">
            <InterviewMode />
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">60-second answer</div>
                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{SIXTY_SEC}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">5-minute architect answer</div>
                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{FIVE_MIN}</p>
              </div>
            </div>
          </Section>

          <Section id="storytelling" title="27. Two-minute interview story">
            <div className="rounded-2xl bg-slate-900 p-6 text-sm font-medium leading-8 text-slate-100">{TWO_MINUTE_STORY}</div>
          </Section>

          <Section
            id="lab"
            title="Runnable lab"
            lead="Spring Boot 3 lab on port 8095. Default profile uses H2 and an in-memory broker so you can poison a message, watch retries, inspect the DLQ table, correct, replay, and see exactly-once business behavior."
          >
            <CodePanel
              title="Quick start + curl"
              code={`cd hadron-cashlines-dlq
mvn test
mvn spring-boot:run   # :8095

curl -sS -X POST http://127.0.0.1:8095/api/lab/scenario/success
curl -sS -X POST http://127.0.0.1:8095/api/lab/scenario/poison
curl -sS http://127.0.0.1:8095/api/dlq

curl -sS -X POST http://127.0.0.1:8095/api/lab/scenario/invalid-amount
# correct + replay (use the id from GET /api/dlq)
curl -sS -X POST http://127.0.0.1:8095/api/dlq/1/correct \\
  -H 'Content-Type: application/json' -H 'X-Replay-Actor: ops' \\
  -d '{"eventId":"e-amt-1","cashLineId":"CL-AMT","eventType":"CASHLINE_CREATED","sequenceNumber":1,"version":1,"participantId":"P-NEPTUNE","accountId":"ACC-1001","currency":"USD","amount":25,"transactionType":"DRAWDOWN"}'
curl -sS -X POST http://127.0.0.1:8095/api/dlq/1/replay -H 'X-Replay-Actor: ops'
curl -sS http://127.0.0.1:8095/api/cashlines/CL-AMT

# Corner cases (full catalog: GET /api/lab/scenarios)
curl -sS http://127.0.0.1:8095/api/lab/scenarios
curl -sS -X POST http://127.0.0.1:8095/api/lab/scenario/npe
curl -sS -X POST http://127.0.0.1:8095/api/lab/scenario/cancelled-then-settle
curl -sS -X POST http://127.0.0.1:8095/api/lab/scenario/replay-after-settle
curl -sS -X POST http://127.0.0.1:8095/api/lab/scenario/stale-event
curl -sS -X POST http://127.0.0.1:8095/api/lab/scenario/currency-mismatch
curl -sS http://127.0.0.1:8095/api/dlq`}
            />
            {files.length > 0 && (
              <div className="mt-6">
                <OAuthCodeExplorer
                  files={files}
                  tree={tree}
                  defaultPath={defaultPath}
                  routeBase="/hadron-dlq"
                  ariaLabel="Hadron CashLines DLQ lab source tree"
                />
              </div>
            )}
          </Section>

          <Section id="checklist" title="28. Production checklist">
            <ul className="grid gap-2 md:grid-cols-2">
              {CHECKLIST.map((item) => (
                <li key={item} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-800">
                  [ ] {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="cheat-sheet" title="Cheat sheet">
            <div className="grid gap-2 md:grid-cols-2">
              {CHEAT.map(([k, v]) => (
                <div key={k} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="font-bold">{k}</div>
                  <div className="text-slate-500">{v}</div>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-3xl text-base font-semibold leading-7 text-slate-800 dark:text-slate-200">
              {CLOSING}
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
