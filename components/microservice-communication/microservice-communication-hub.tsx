'use client';

import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {MEMORY_SENTENCE, MSC_STORY_TOC_IDS, MSC_TOC, VERSION_NOTE} from '@/lib/microservice-communication/toc';
import {OPTIONS} from '@/lib/microservice-communication/parts-options';
import {CLIENTS} from '@/lib/microservice-communication/parts-clients';
import {DISCOVERY} from '@/lib/microservice-communication/parts-discovery';
import {RESILIENCE} from '@/lib/microservice-communication/parts-resilience';
import {MESSAGING} from '@/lib/microservice-communication/parts-messaging';
import {DESIGN} from '@/lib/microservice-communication/parts-design';
import {
  PRODUCTION_INTERVIEW,
  TECH_CHEAT_DETAILED,
} from '@/lib/microservice-communication/parts-production-interview';
import {
  COMMUNICATION_TAXONOMY,
  INFRA_VS_MECHANISM,
  TAXONOMY_EXTRAS,
} from '@/lib/microservice-communication/parts-taxonomy';
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
        {s.problem && (
          <p>
            <strong>Problem:</strong> {s.problem}
          </p>
        )}
        <p>
          <strong>What:</strong> {s.what}
        </p>
        <p>
          <strong>Why:</strong> {s.why}
        </p>
        <p>
          <strong>When to use:</strong> {s.when}
        </p>
        {s.whenNot && (
          <p>
            <strong>When NOT to use:</strong> {s.whenNot}
          </p>
        )}
        <p>
          <strong>How (Spring / production):</strong> {s.how}
        </p>
        <CodePanel title="Flow" code={s.flow} />
        {s.badDesign && s.goodDesign && (
          <div className="grid gap-3 md:grid-cols-2">
            <CodePanel title="Bad design" code={s.badDesign} tone="danger" />
            <CodePanel title="Better design" code={s.goodDesign} tone="ok" />
          </div>
        )}
        {(s.pros || s.cons) && (
          <p>
            {s.pros && (
              <>
                <strong>Pros:</strong> {s.pros}{' '}
              </>
            )}
            {s.cons && (
              <>
                <strong>Cons:</strong> {s.cons}
              </>
            )}
          </p>
        )}
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
        <p className="rounded-xl bg-slate-900 px-3 py-2 font-semibold text-slate-100">
          <strong>Senior interview answer:</strong> {s.interviewAnswer}
        </p>
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
  const [tocFocus, setTocFocus] = useState<'story' | 'full'>('full');
  const sectionCount =
    OPTIONS.length +
    CLIENTS.length +
    DISCOVERY.length +
    RESILIENCE.length +
    MESSAGING.length +
    DESIGN.length +
    TAXONOMY_EXTRAS.length +
    PRODUCTION_INTERVIEW.length;

  const tocItems = useMemo(
    () => (tocFocus === 'story' ? MSC_TOC.filter((i) => MSC_STORY_TOC_IDS.has(i.id)) : MSC_TOC),
    [tocFocus],
  );

  // Hash links (#grpc, #architectures, …) must land after paint — sections are always mounted.
  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.replace(/^#/, '');
      if (!id) return;
      // Prefer full TOC when a deep-only hash is opened while story TOC is filtered.
      if (!MSC_STORY_TOC_IDS.has(id)) setTocFocus('full');
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({behavior: 'smooth', block: 'start'});
      });
    };
    scrollToHash();
    window.addEventListener('hashchange', scrollToHash);
    return () => window.removeEventListener('hashchange', scrollToHash);
  }, []);

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Architect · FinTech production · Interview decisions · Java 21 · Spring Boot 3
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Microservice Communication — Production & Interview Guide
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Not a glossary of REST and Kafka. A decision guide for how Payment, Account, Risk, Ledger, and
          Notification talk in production — problem → options → implementation → failure → trade-off → what you
          say in a senior interview.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ['story', 'Sidebar: story path'],
              ['full', 'Sidebar: full TOC'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTocFocus(id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                tocFocus === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200'
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
        <StickyToc items={tocItems} />
        <div className="min-w-0 space-y-16">
          <Section
            id="overview"
            title="00. Start here · interview spine"
            lead="Answer the interviewer: how do your services communicate, and why?"
          >
            <CodePanel
              title="Production answer spine"
              code={`Business interaction (Payment → Account? Ledger? Notify?)
  → Does the caller need an immediate answer?
       YES → Sync REST / gRPC  (+ timeout, CB, bulkhead, idempotency)
       NO  → Async Kafka / webhook (+ outbox, idempotent consumer, DLQ)
  → Hybrid is normal: sync decide, async fan-out
  → TRICKS-OLD on every sync edge
  → Observe: RED + traces + consumer lag + DLQ
  → Never: shared DB as a bus · blind POST retries · broker EOS = business EOS`}
            />
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Deep reference (taxonomy, clients, discovery, incidents) stays on this page. Start with why-comm and
              the payment case study if you are revising for a staff interview.
            </p>
          </Section>

          <Section
            id="why-comm"
            title="01. Why services talk · sync vs async"
            lead="Network boundary = failure boundary. Decide sync vs async before naming a product."
          >
            <Group
              cards={PRODUCTION_INTERVIEW.filter(
                (c) => c.id === 'why-services-communicate' || c.id === 'sync-vs-async-framework',
              )}
            />
          </Section>

          <Section id="stories" title="02. Story theater" lead="Draw sync vs async, taxonomy, webhooks, CDC vs outbox, retry storm before naming libraries.">
            <StoryWalkthrough />
          </Section>

          <Section
            id="production-decisions"
            title="03. REST · Kafka · hybrid · failure playbook"
            lead="FinTech-first decisions: when REST, when Kafka, when both, and what breaks."
          >
            <Group
              cards={PRODUCTION_INTERVIEW.filter((c) =>
                [
                  'rest-production-fintech',
                  'kafka-production-fintech',
                  'rest-vs-kafka-matrix',
                  'rest-vs-kafka-scenario',
                  'hybrid-architecture',
                  'failure-playbook',
                  'retry-idempotency-deep',
                  'timeout-circuit-breaker',
                  'saga-payments',
                  'bad-vs-good-designs',
                  'observability-security-perf',
                ].includes(c.id),
              )}
            />
          </Section>

          <Section
            id="payment-case"
            title="04. Payment platform case study"
            lead="One end-to-end architecture you can draw and defend in a staff interview."
          >
            <Group cards={PRODUCTION_INTERVIEW.filter((c) => c.id === 'payment-case-study-complete')} />
          </Section>

          <Section
            id="taxonomy"
            title="05. Complete taxonomy"
            lead="Classify the mechanism first. Gateway, mesh, DNS, and load balancers wrap it — they are not the call itself."
          >
            <CodePanel title="Eight branches" code={COMMUNICATION_TAXONOMY} />
            <div className="mt-4">
              <CodePanel title="Mechanism vs infrastructure" code={INFRA_VS_MECHANISM} />
            </div>
          </Section>

          <Section id="options" title="06. All options compared">
            <Group cards={OPTIONS} />
          </Section>
          <Section id="extras" title="07. RSocket · webhooks · SSE · CDC · SFTP · UDS">
            <Group cards={TAXONOMY_EXTRAS.filter((c) => c.id !== 'taxonomy-overview')} />
          </Section>
          <Section id="rest-clients" title="08. RestClient · WebClient · Feign · RestTemplate">
            <Group cards={CLIENTS} />
          </Section>
          <Section id="discovery-lb" title="09. Discovery · K8s · LB · Gateway · Mesh (infra)">
            <Group cards={DISCOVERY} />
          </Section>
          <Section id="grpc" title="10. gRPC (see options + clients comparison)">
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              Deep gRPC tradeoffs live in the options matrix; RSocket comparison sits under taxonomy extras.
            </p>
            <Group cards={OPTIONS.filter((o) => o.id.includes('grpc') || o.title.toLowerCase().includes('grpc'))} />
          </Section>
          <Section id="async" title="11. Kafka · brokers · events">
            <Group cards={MESSAGING} />
          </Section>
          <Section id="gateway-mesh" title="12. Gateway · mesh — infrastructure, not the mechanism">
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              These wrap REST/gRPC/Kafka. Say the mechanism first, then the infra.
            </p>
            <Group
              cards={DISCOVERY.filter(
                (d) =>
                  d.title.toLowerCase().includes('gateway') ||
                  d.title.toLowerCase().includes('mesh') ||
                  d.title.toLowerCase().includes('east'),
              )}
            />
          </Section>
          <Section id="resilience" title="13. Timeout · retry · CB · bulkhead · pools">
            <Group cards={RESILIENCE} />
          </Section>
          <Section id="idempotency" title="14. Idempotency · saga · chains">
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
          <Section id="security-obs" title="15. Security · tracing · capacity">
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
          <Section id="capacity" title="16. Capacity · architectures · anti-patterns">
            <Group cards={DESIGN} />
          </Section>
          <Section id="architectures" title="17. Payment · ecommerce · banking">
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
          <Section id="antipatterns" title="18. Anti-patterns · bad vs good">
            <Group
              cards={[
                ...PRODUCTION_INTERVIEW.filter((c) => c.id === 'bad-vs-good-designs'),
                ...OPTIONS.filter((o) => o.id === 'shared-database' || o.id === 'shared-cache'),
                ...DESIGN.filter((d) => d.title.toLowerCase().includes('anti') || d.id.includes('anti')),
              ]}
            />
          </Section>

          <Section id="choose" title="19. Which would you choose?">
            <ChooseBrowser />
          </Section>

          <Section id="incidents" title="20. Production incidents">
            <IncidentBrowser />
          </Section>

          <Section
            id="failure-matrix"
            title="21. Failure matrix"
            lead="What breaks, what you do in the first five minutes, and what you change permanently."
          >
            <MiniTable
              headers={['Failure', 'What happens', 'Temporary mitigation', 'Permanent solution']}
              rows={FAILURE_MATRIX.map((r) => [r.failure, r.happens, r.temporary, r.permanent])}
            />
          </Section>

          <Section id="spoken" title="22. Spoken answers (30s / 2m / 5m Staff)">
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

          <Section id="tricks" title="23. Trick questions">
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

          <Section id="interview" title="24. Interview mode">
            <InterviewMode />
            <p className="mt-2 text-sm text-slate-500">
              {RAPID_QS.length} rapid · {TRICK_QS.length} tricks · {ARCHITECT.length} architect bank ·{' '}
              {INCIDENTS.length} incidents · {CHOOSE_QS.length} choose scenarios
            </p>
          </Section>

          <Section
            id="cheatsheet"
            title="25. Cheat sheet · tech revision"
            lead="Revise decisions the night before — best for, avoid when, one-liner."
          >
            <Group cards={PRODUCTION_INTERVIEW.filter((c) => c.id === 'tech-cheat-sheet')} />
            <div className="mt-4">
              <MiniTable
                headers={[
                  'Technology',
                  'Best for',
                  'Avoid when',
                  'Coupling',
                  'Consistency',
                  'Failure handling',
                  'One-liner',
                ]}
                rows={TECH_CHEAT_DETAILED.map((r) => [
                  r.technology,
                  r.bestFor,
                  r.avoidWhen,
                  r.coupling,
                  r.consistency,
                  r.failureHandling,
                  r.oneLiner,
                ])}
              />
            </div>
            <div className="mt-4">
              <CodePanel title="Decision tree" code={DECISION_ASCII} />
            </div>
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

          <Section id="checklist" title="26. Coverage checklist">
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
