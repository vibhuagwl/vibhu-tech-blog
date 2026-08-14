'use client';

import {useMemo, useState} from 'react';
import Link from 'next/link';
import type {PatternCard} from '@/lib/microservices-patterns/types';
import {MSP_TOC, MEMORY_SENTENCE, VERSION_NOTE} from '@/lib/microservices-patterns/toc';
import {PATTERN_GROUPS, ALL_PATTERNS, DECOMPOSE_ASCII, GATEWAY_ASCII} from '@/lib/microservices-patterns/catalog';
import {
  PRODUCTION_PROJECT,
  TESTING_STRATEGY,
  PERFORMANCE_ROWS,
  PERF_NOTES,
} from '@/lib/microservices-patterns/parts-project-testing-perf';
import {DECISION_TREES, CHEAT_SHEET, PATTERN_MATRIX} from '@/lib/microservices-patterns/decisions';
import {
  ALL as INTERVIEW_ALL,
  BASIC,
  INTERMEDIATE,
  SENIOR,
  LEAD,
  SCENARIO,
} from '@/lib/microservices-patterns/interview';
import StickyToc from './sticky-toc';
import CodePanel from './code-panel';
import type {DemoSourceFile, DemoTreeNode} from '@/lib/oauth-demo-source';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';

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

function Pre({children}: {children: string}) {
  return (
    <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-[12px] leading-5 text-slate-100 dark:border-slate-800">
      {children.trim()}
    </pre>
  );
}

function PatternBrowser({patterns}: {patterns: PatternCard[]}) {
  const [qid, setQ] = useState('');
  const [selectedId, setSelectedId] = useState(patterns[0]?.id ?? '');
  const filtered = useMemo(() => {
    const q = qid.trim().toLowerCase();
    if (!q) return patterns;
    return patterns.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.includes(q) ||
        p.definition.toLowerCase().includes(q) ||
        p.frequency.toLowerCase().includes(q),
    );
  }, [patterns, qid]);
  const selected = filtered.find((p) => p.id === selectedId) ?? filtered[0] ?? patterns[0];

  if (!selected) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
        <input
          value={qid}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter patterns…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
        />
        <ul className="mt-2 max-h-[28rem] space-y-0.5 overflow-y-auto">
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`w-full rounded-lg px-2 py-1.5 text-left text-[13px] ${
                  selected.id === p.id
                    ? 'bg-slate-900 font-semibold text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-slate-400">
          {filtered.length}/{patterns.length}
        </p>
      </div>
      <PatternDetail pattern={selected} />
    </div>
  );
}

function PatternDetail({pattern: p}: {pattern: PatternCard}) {
  const [tab, setTab] = useState<'why' | 'arch' | 'code' | 'fail' | 'ops' | 'interview'>('why');
  const tabs = [
    ['why', 'Why'],
    ['arch', 'Architecture'],
    ['code', 'Code'],
    ['fail', 'Failures'],
    ['ops', 'Ops'],
    ['interview', 'Interview'],
  ] as const;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{p.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{p.definition}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            {p.frequency}
          </span>
          {p.deepLabHref && (
            <Link
              href={p.deepLabHref}
              className="rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white"
            >
              Deep lab →
            </Link>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              tab === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
        {tab === 'why' && (
          <>
            <p>
              <strong>Problem:</strong> {p.problem}
            </p>
            <p>
              <strong>Real world:</strong> {p.realWorld}
            </p>
            <p>
              <strong>Why it exists:</strong> {p.whyExists}
            </p>
            <p>
              <strong>Trade-offs:</strong> {p.tradeoffs}
            </p>
            <div>
              <p className="font-semibold">Alternatives</p>
              <ul className="mt-1 list-disc pl-5">
                {p.alternatives.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold">Common mistakes</p>
              <ul className="mt-1 list-disc pl-5">
                {p.mistakes.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold">Anti-patterns</p>
              <ul className="mt-1 list-disc pl-5">
                {p.antiPatterns.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          </>
        )}
        {tab === 'arch' && (
          <>
            <Pre>{p.ascii}</Pre>
            <p>
              <strong>Flow:</strong> {p.flow}
            </p>
            <MiniTable
              headers={['Component', 'Responsibility']}
              rows={p.components.map((c) => [c.name, c.responsibility])}
            />
          </>
        )}
        {tab === 'code' && (
          <>
            <CodePanel title="Java 21" code={p.javaCode} />
            {p.springCode && <CodePanel title="Spring Boot" code={p.springCode} />}
            {p.config && <CodePanel title="Configuration" code={p.config} />}
            {p.restApi && <CodePanel title="REST API" code={p.restApi} />}
            {p.kafkaCode && <CodePanel title="Kafka" code={p.kafkaCode} />}
            {p.dbCode && <CodePanel title="Database" code={p.dbCode} />}
            {p.redisCode && <CodePanel title="Redis" code={p.redisCode} />}
            <CodePanel title="Unit test" code={p.unitTest} />
            {p.integrationTest && <CodePanel title="Integration test" code={p.integrationTest} />}
            {p.failureTest && <CodePanel title="Failure test" code={p.failureTest} />}
            {p.concurrencyTest && <CodePanel title="Concurrency test" code={p.concurrencyTest} />}
          </>
        )}
        {tab === 'fail' && (
          <>
            <p>
              <strong>Retry:</strong> {p.retry}
            </p>
            <p>
              <strong>Idempotency:</strong> {p.idempotency}
            </p>
            <p>
              <strong>Timeout:</strong> {p.timeout}
            </p>
            <div>
              <p className="font-semibold">Edge cases</p>
              <ul className="mt-1 list-disc pl-5">
                {p.edgeCases.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold">Failure scenarios</p>
              <ul className="mt-1 list-disc pl-5">
                {p.failureScenarios.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          </>
        )}
        {tab === 'ops' && (
          <>
            <p>
              <strong>Observability:</strong> {p.observability}
            </p>
            <p>
              <strong>Security:</strong> {p.security}
            </p>
            <p>
              <strong>Performance:</strong> {p.performance}
            </p>
            <p>
              <strong>Scalability:</strong> {p.scalability}
            </p>
            <p>
              <strong>Production:</strong> {p.production}
            </p>
          </>
        )}
        {tab === 'interview' && (
          <>
            <div>
              <p className="font-semibold">Interview</p>
              <ul className="mt-1 list-disc pl-5">
                {p.interviewQs.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold">Tricky</p>
              <ul className="mt-1 list-disc pl-5">
                {p.trickyQs.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold">Senior / Lead follow-ups</p>
              <ul className="mt-1 list-disc pl-5">
                {p.seniorFollowUps.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function InterviewBank() {
  const banks = [
    ['basic', BASIC],
    ['intermediate', INTERMEDIATE],
    ['senior', SENIOR],
    ['lead', LEAD],
    ['scenario', SCENARIO],
  ] as const;
  const [mode, setMode] = useState<(typeof banks)[number][0]>('senior');
  const list = banks.find(([id]) => id === mode)?.[1] ?? SENIOR;
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const q = list[Math.min(idx, Math.max(list.length - 1, 0))];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap gap-2">
        {banks.map(([id]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setMode(id);
              setIdx(0);
              setRevealed(false);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              mode === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {id} ({banks.find(([x]) => x === id)?.[1].length})
          </button>
        ))}
      </div>
      {q && (
        <>
          <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{q.question}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[.12em] text-slate-400">{q.topic}</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setRevealed(true)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
              Reveal
            </button>
            <button
              type="button"
              onClick={() => {
                setIdx((i) => (i + 1) % list.length);
                setRevealed(false);
              }}
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              Next
            </button>
          </div>
          {revealed && (
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
              <p>
                <strong>Short:</strong> {q.answer30s}
              </p>
              <p>
                <strong>Deep:</strong> {q.answer2m}
              </p>
              <p>
                <strong>Follow-up:</strong> {q.followUps.join(' · ')}
              </p>
              <p className="text-rose-700 dark:text-rose-300">
                <strong>Common wrong answer:</strong> {q.wrongAnswer}
              </p>
              {q.trick && (
                <p className="text-amber-700 dark:text-amber-300">
                  <strong>Trap:</strong> {q.trick}
                </p>
              )}
            </div>
          )}
          <p className="mt-3 text-xs text-slate-400">
            {idx + 1} / {list.length} · {INTERVIEW_ALL.length} total prompts
          </p>
        </>
      )}
    </div>
  );
}

export default function MicroservicesPatternsHub({
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
          Principal · Staff · Java 21 · Spring Boot 3 · Kafka · Redis · PostgreSQL
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Microservices Design Patterns — Implementation Master
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Not definitions — runnable Java 21 + Spring code for every pattern: when to use it, when not to, how it
          fails, how you test it, and how you defend it in a Senior/Lead/Staff interview.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{VERSION_NOTE}</p>
        <p className="mt-3 text-sm text-slate-500">
          {ALL_PATTERNS.length} pattern cards · {INTERVIEW_ALL.length} interview prompts · deep labs:{' '}
          <Link href="/resilience4j" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Resilience4j
          </Link>
          {' · '}
          <Link href="/api-gateway" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            API Gateway
          </Link>
          {' · '}
          <Link href="/rate-limiter" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Rate limiter
          </Link>
          {' · '}
          <Link href="/kafka-dlq" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Kafka DLQ
          </Link>
          {' · '}
          <Link href="/distributed-locking" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Locking
          </Link>
          {' · '}
          <Link href="/distributed-caching" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Caching
          </Link>
          {' · '}
          <Link href="/design-patterns" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            GoF
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_1fr]">
        <StickyToc items={MSP_TOC} />
        <div className="min-w-0 space-y-16">
          <Section id="overview" title="00. Overview · how to use" lead="For every pattern: implement → fail it → measure → defend.">
            <div className="grid gap-4 md:grid-cols-2">
              <Pre>{DECOMPOSE_ASCII}</Pre>
              <Pre>{GATEWAY_ASCII}</Pre>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Use the pattern browser in each part: Why → Architecture → Code → Failures → Ops → Interview. The lab
              below compiles and tests the core algorithms without Docker.
            </p>
          </Section>

          {PATTERN_GROUPS.map((g) => (
            <Section key={g.id} id={g.id} title={`${String(g.part).padStart(2, '0')}. ${g.title}`} lead={g.lead}>
              <PatternBrowser patterns={g.patterns} />
            </Section>
          ))}

          <Section id="project" title="22. Production project · lab" lead={PRODUCTION_PROJECT.title}>
            <Pre>{PRODUCTION_PROJECT.ascii}</Pre>
            <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
              {PRODUCTION_PROJECT.description}
            </div>
            {files.length > 0 && (
              <div className="mt-6">
                <OAuthCodeExplorer
                  files={files}
                  tree={tree}
                  defaultPath={defaultPath}
                  routeBase="/microservices-patterns"
                  ariaLabel="Microservices patterns lab source"
                />
              </div>
            )}
            <div className="mt-4">
              <MiniTable
                headers={['Service', 'Port', 'Patterns']}
                rows={PRODUCTION_PROJECT.services.map((s) => [
                  s.name,
                  String(s.port ?? '—'),
                  (s.patterns ?? []).join(', '),
                ])}
              />
            </div>
            <ul className="mt-4 list-disc pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {PRODUCTION_PROJECT.runbook.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Section>

          <Section id="testing" title="23. Testing strategy" lead={TESTING_STRATEGY.overview}>
            {TESTING_STRATEGY.layers.map((layer) => (
              <div key={layer.name} className="mt-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{layer.name}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{layer.scope}</p>
                <div className="mt-2">
                  <CodePanel title={layer.name} code={layer.example} />
                </div>
              </div>
            ))}
            <ul className="mt-4 list-disc pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {TESTING_STRATEGY.ci.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Section>

          <Section id="performance" title="24. Performance at scale" lead="What breaks at 100 → 100k RPS.">
            <MiniTable
              headers={['Pattern', '100 rps', '1k', '10k', '100k', 'Mitigation']}
              rows={PERFORMANCE_ROWS}
            />
            <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
              {PERF_NOTES}
            </div>
          </Section>

          <Section
            id="interview"
            title="25. Interview master bank"
            lead="100 basic · 100 intermediate · 100 senior · 100 lead/architect · 100 scenario — with wrong answers."
          >
            <InterviewBank />
          </Section>

          <Section id="decisions" title="26. Decision trees" lead="Pick the pattern from the symptom, not the buzzword.">
            <div className="grid gap-4 lg:grid-cols-2">
              {DECISION_TREES.map((t) => (
                <div key={t.id}>
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-[.12em] text-slate-500">{t.title}</h3>
                  <Pre>{t.ascii}</Pre>
                </div>
              ))}
            </div>
          </Section>

          <Section id="cheatsheet" title="27. Cheat sheet · matrix" lead="One-page recall + Pattern → Problem → Solution → Trade-off → Interview Q.">
            <Pre>{CHEAT_SHEET}</Pre>
            <div className="mt-6">
              <MiniTable
                headers={['Pattern', 'Problem', 'Solution', 'Trade-off', 'Interview Q']}
                rows={PATTERN_MATRIX.map((r) => [r.pattern, r.problem, r.solution, r.tradeoff, r.interviewQ])}
              />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
