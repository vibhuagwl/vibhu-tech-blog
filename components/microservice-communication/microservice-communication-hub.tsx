'use client';

import {useState} from 'react';
import Link from 'next/link';
import {MEMORY_SENTENCE, MSC_TOC, VERSION_NOTE} from '@/lib/microservice-communication/toc';
import {OPTIONS} from '@/lib/microservice-communication/parts-options';
import {CLIENTS} from '@/lib/microservice-communication/parts-clients';
import {DISCOVERY} from '@/lib/microservice-communication/parts-discovery';
import {RESILIENCE} from '@/lib/microservice-communication/parts-resilience';
import {MESSAGING} from '@/lib/microservice-communication/parts-messaging';
import {DESIGN} from '@/lib/microservice-communication/parts-design';
import {
  ALL,
  ARCHITECT,
  CHEAT_ROWS,
  CHOOSE_QS,
  COVERAGE_CHECKLIST,
  DECISION_ASCII,
  FAILURE_MATRIX,
  FRAMEWORK_TRICKS_OLD,
  INCIDENTS,
  MEMORY_RULES,
  RAPID_QS,
  SENIOR_VS_STAFF,
  SPOKEN,
  TRICK_QS,
} from '@/lib/microservice-communication/interview';
import {MSC_STORIES} from '@/lib/microservice-communication/stories';
import type {CommSection} from '@/lib/microservice-communication/types';
import StickyToc from './sticky-toc';
import CodePanel from './code-panel';
import InterviewMode from './interview-mode';
import StoryWalkthrough from './story-walkthrough';

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
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-slate-200 dark:border-slate-800">
              {r.map((c, i) => (
                <td
                  key={i}
                  className={`px-2 py-2 align-top ${i === 0 ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}
                >
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

function CommCard({s}: {s: CommSection}) {
  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <summary className="cursor-pointer list-none">
        <p className="text-lg font-semibold text-slate-900 dark:text-white">{s.title}</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{s.oneLiner}</p>
        <p className="mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200">Remember: {s.remember[0]}</p>
      </summary>
      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
        <p>
          <strong>What:</strong> {s.what}
        </p>
        <p>
          <strong>Why:</strong> {s.why}
        </p>
        <p>
          <strong>When:</strong> {s.when}
        </p>
        <p>
          <strong>How:</strong> {s.how}
        </p>
        <CodePanel title="Flow" code={s.flow} />
        <p>
          <strong>Failure:</strong> {s.failure}
        </p>
        <p>
          <strong>Trade-off:</strong> {s.tradeoff}
        </p>
        <p>
          <strong>Security:</strong> {s.security}
        </p>
        <p>
          <strong>Observability:</strong> {s.observability}
        </p>
        <p className="text-rose-700 dark:text-rose-300">
          <strong>Trap:</strong> {s.trap}
        </p>
        <p className="font-semibold text-slate-900 dark:text-white">{s.interviewAnswer}</p>
        <ul className="list-disc pl-5">
          {s.remember.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        {s.tables?.map((t, i) => (
          <MiniTable key={i} headers={t.headers} rows={t.rows} />
        ))}
      </div>
    </details>
  );
}

function Group({cards}: {cards: CommSection[]}) {
  return (
    <div className="space-y-3">
      {cards.map((c) => (
        <CommCard key={c.id} s={c} />
      ))}
    </div>
  );
}

function ChooseBrowser() {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const q = CHOOSE_QS[idx];
  if (!q) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-lg font-semibold text-slate-900 dark:text-white">{q.title}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => setRevealed(true)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          Reveal
        </button>
        <button
          type="button"
          onClick={() => {
            setIdx((i) => (i + 1) % CHOOSE_QS.length);
            setRevealed(false);
          }}
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold dark:bg-slate-900"
        >
          Next
        </button>
      </div>
      {revealed && (
        <div className="mt-4 space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
          <p>
            <strong>Recommended:</strong> {q.recommended}
          </p>
          <p>
            <strong>Why:</strong> {q.why}
          </p>
          <p>
            <strong>Alternative:</strong> {q.alternative}
          </p>
          <p>
            <strong>Trade-offs:</strong> {q.tradeoffs}
          </p>
          <p className="font-semibold">{q.interviewAnswer}</p>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-400">
        {idx + 1}/{CHOOSE_QS.length}
      </p>
    </div>
  );
}

function IncidentBrowser() {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const inc = INCIDENTS[idx];
  if (!inc) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-lg font-semibold text-slate-900 dark:text-white">{inc.title}</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{inc.symptoms}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => setRevealed(true)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          Reveal
        </button>
        <button
          type="button"
          onClick={() => {
            setIdx((i) => (i + 1) % INCIDENTS.length);
            setRevealed(false);
          }}
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold dark:bg-slate-900"
        >
          Next
        </button>
      </div>
      {revealed && (
        <div className="mt-4 space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
          <p>
            <strong>Metrics:</strong> {inc.metrics}
          </p>
          <p>
            <strong>Logs:</strong> {inc.logs}
          </p>
          <p>
            <strong>Root cause:</strong> {inc.rootCause}
          </p>
          <p>
            <strong>Mitigate:</strong> {inc.mitigate}
          </p>
          <p>
            <strong>Permanent:</strong> {inc.permanent}
          </p>
          <p>
            <strong>Architecture:</strong> {inc.architecture}
          </p>
          <p className="font-semibold">{inc.interviewAnswer}</p>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-400">
        {idx + 1}/{INCIDENTS.length}
      </p>
    </div>
  );
}

export default function MicroserviceCommunicationHub() {
  const [view, setView] = useState<'stories' | 'deep'>('stories');
  const sectionCount =
    OPTIONS.length + CLIENTS.length + DISCOVERY.length + RESILIENCE.length + MESSAGING.length + DESIGN.length;

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Architect · Java 21 · Spring Boot 3 · Sync · Async · Resilience
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          How Microservice A Calls Microservice B
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Not client syntax — production reliability: discovery, load balancing, timeouts, retries, circuit breakers,
          idempotency, Kafka vs REST, Feign vs RestClient, mesh vs app resilience, and Staff-level spoken answers.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ['stories', 'Story + TRICKS-OLD first'],
              ['deep', 'Full deep reference'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                view === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-500">
          {VERSION_NOTE}{' '}
          <Link href="/resilience4j" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Resilience4j
          </Link>
          {' · '}
          <Link href="/kafka-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Kafka
          </Link>
          {' · '}
          <Link href="/api-gateway" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Gateway
          </Link>
          {' · '}
          <Link href="/microservices-patterns" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Patterns
          </Link>
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            `${MSC_STORIES.length} stories`,
            `${sectionCount} deep sections`,
            `${INCIDENTS.length} incidents`,
            `${ALL.length} interview prompts`,
          ].map((x) => (
            <div key={x} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-800">
              {x}
            </div>
          ))}
        </div>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={MSC_TOC} />
        <div className="min-w-0 space-y-16">
          <Section id="overview" title="00. Start here" lead="A → B is a reliability design, not a GET call.">
            <CodePanel
              title="Production answer spine"
              code={`Business need
  → Sync or Async?
  → REST / gRPC / Kafka / messaging
  → Discovery + Load balancing
  → Connection pool
  → Timeout
  → Retry + backoff + jitter (idempotent only)
  → Circuit breaker + bulkhead
  → Idempotency
  → Security (TLS/mTLS/JWT)
  → Observability (RED + OTel)
  → Capacity (Little's Law)
  → Failure / DR / testing`}
            />
          </Section>

          <Section id="stories" title="01. Story theater" lead="Draw sync vs async, retry storm, Feign proxy, Kafka fan-out before naming libraries.">
            <StoryWalkthrough />
          </Section>

          <Section id="spoken" title="17. Spoken answers (30s / 2m / 5m Staff)">
            <div className="space-y-4">
              {(
                [
                  ['30 seconds', SPOKEN.thirtySec],
                  ['2 minutes', SPOKEN.twoMin],
                  ['5 minutes Staff', SPOKEN.fiveMinStaff],
                ] as const
              ).map(([label, text]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">{label}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <CodePanel title="TRICKS-OLD framework" code={FRAMEWORK_TRICKS_OLD} />
            </div>
            <div className="mt-6">
              <MiniTable headers={['Title', 'Rule']} rows={MEMORY_RULES.map((m) => [m.title, m.rule])} />
            </div>
          </Section>

          <Section id="choose" title="14. Which would you choose?">
            <ChooseBrowser />
          </Section>

          <Section id="incidents" title="15. Production incidents">
            <IncidentBrowser />
          </Section>

          <Section
            id="failure-matrix"
            title="16. Failure matrix"
            lead="What breaks, what you do in the first five minutes, and what you change permanently."
          >
            <MiniTable
              headers={['Failure', 'What happens', 'Temporary mitigation', 'Permanent solution']}
              rows={FAILURE_MATRIX.map((r) => [r.failure, r.happens, r.temporary, r.permanent])}
            />
          </Section>

          <Section id="interview" title="19. Interview mode">
            <InterviewMode />
            <p className="mt-2 text-sm text-slate-500">
              {RAPID_QS.length} rapid · {TRICK_QS.length} tricks · {ARCHITECT.length} architect bank ·{' '}
              {INCIDENTS.length} incidents
            </p>
          </Section>

          <Section id="cheatsheet" title="20. Cheat sheet">
            <CodePanel title="Decision tree" code={DECISION_ASCII} />
            <div className="mt-4">
              <MiniTable
                headers={['Term', 'Rule', 'Trap']}
                rows={CHEAT_ROWS.map((r) => [r.term, r.rule, r.trap])}
              />
            </div>
            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold">Junior vs Senior vs Staff</p>
              <MiniTable
                headers={['Topic', 'Junior', 'Senior', 'Staff']}
                rows={SENIOR_VS_STAFF.map((r) => [r.topic, r.junior, r.senior, r.staff])}
              />
            </div>
          </Section>

          {view === 'deep' && (
            <>
              <Section id="options" title="02. All options compared">
                <Group cards={OPTIONS} />
              </Section>
              <Section id="rest-clients" title="03. RestClient · WebClient · Feign · RestTemplate">
                <Group cards={CLIENTS} />
              </Section>
              <Section id="discovery-lb" title="04. Discovery · K8s · LB · Gateway · Mesh">
                <Group cards={DISCOVERY} />
              </Section>
              <Section id="grpc" title="05. gRPC (see options + clients comparison)">
                <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                  Deep gRPC tradeoffs live in the options matrix and client comparison; mesh and LB sections cover HTTP/2
                  transport concerns.
                </p>
                <Group cards={OPTIONS.filter((o) => o.id.includes('grpc') || o.title.toLowerCase().includes('grpc'))} />
              </Section>
              <Section id="async" title="06. Kafka · brokers · events">
                <Group cards={MESSAGING} />
              </Section>
              <Section id="gateway-mesh" title="07. Gateway · mesh (in discovery)">
                <Group
                  cards={DISCOVERY.filter(
                    (d) =>
                      d.title.toLowerCase().includes('gateway') ||
                      d.title.toLowerCase().includes('mesh') ||
                      d.title.toLowerCase().includes('east'),
                  )}
                />
              </Section>
              <Section id="resilience" title="08. Timeout · retry · CB · bulkhead · pools">
                <Group cards={RESILIENCE} />
              </Section>
              <Section id="idempotency" title="09. Idempotency · saga · chains">
                <Group
                  cards={RESILIENCE.filter(
                    (r) =>
                      r.title.toLowerCase().includes('idempot') ||
                      r.title.toLowerCase().includes('saga') ||
                      r.title.toLowerCase().includes('chain') ||
                      r.title.toLowerCase().includes('outbox'),
                  )}
                />
              </Section>
              <Section id="security-obs" title="10. Security · tracing · capacity">
                <Group
                  cards={DESIGN.filter(
                    (d) =>
                      d.title.toLowerCase().includes('security') ||
                      d.title.toLowerCase().includes('observ') ||
                      d.title.toLowerCase().includes('little') ||
                      d.title.toLowerCase().includes('cascad') ||
                      d.title.toLowerCase().includes('version') ||
                      d.title.toLowerCase().includes('contract') ||
                      d.title.toLowerCase().includes('api'),
                  )}
                />
              </Section>
              <Section id="capacity" title="11. Capacity · architectures · anti-patterns">
                <Group cards={DESIGN} />
              </Section>
              <Section id="architectures" title="12. Payment · ecommerce · banking">
                <Group
                  cards={DESIGN.filter(
                    (d) =>
                      d.title.toLowerCase().includes('payment') ||
                      d.title.toLowerCase().includes('commerce') ||
                      d.title.toLowerCase().includes('bank') ||
                      d.title.toLowerCase().includes('trad'),
                  )}
                />
              </Section>
              <Section id="antipatterns" title="13. Anti-patterns">
                <Group cards={DESIGN.filter((d) => d.title.toLowerCase().includes('anti') || d.id.includes('anti'))} />
              </Section>
            </>
          )}

          {view === 'stories' && (
            <Section id="deep-hint" title="Open full deep reference" lead="Stories + spoken + choose + incidents always on. Unlock clients, discovery, resilience, Kafka, architectures.">
              <button
                type="button"
                onClick={() => setView('deep')}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Show RestClient/Feign · K8s/Mesh · Kafka · Resilience · Architectures
              </button>
              <div className="mt-6">
                <Group cards={OPTIONS.slice(0, 6)} />
              </div>
            </Section>
          )}

          <Section id="tricks" title="18. Trick questions">
            <div className="space-y-2">
              {TRICK_QS.slice(0, 20).map((q) => (
                <details key={q.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                  <summary className="cursor-pointer font-medium">{q.question}</summary>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">{q.answer30s}</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">{q.answer2m}</p>
                </details>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">{TRICK_QS.length} tricks — full set in Interview mode</p>
          </Section>

          <Section id="checklist" title="21. Coverage checklist">
            <ul className="grid gap-1 sm:grid-cols-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
              {COVERAGE_CHECKLIST.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
