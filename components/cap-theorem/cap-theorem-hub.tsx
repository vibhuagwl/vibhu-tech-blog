'use client';

import {useState} from 'react';
import Link from 'next/link';
import {CAP_TOC, MEMORY_SENTENCE, VERSION_NOTE} from '@/lib/cap-theorem/toc';
import {SECTIONS_FUND} from '@/lib/cap-theorem/parts-fundamentals';
import {SECTIONS_MODELS} from '@/lib/cap-theorem/parts-models';
import {SECTIONS_SYSTEMS} from '@/lib/cap-theorem/parts-systems';
import {SECTIONS_DESIGN} from '@/lib/cap-theorem/parts-design';
import {
  TRAP_QS,
  RAPID_QS,
  SCENARIO_QS,
  BEHAVIOR_PREDICT,
  PSEUDO,
  INCIDENTS,
  SENIOR_TRADEOFF_QS,
  SPOKEN,
  CHEAT_ROWS,
  DECISION_ASCII,
  COVERAGE_CHECKLIST,
  MEMORY_RULES,
  ALL as INTERVIEW_ALL,
} from '@/lib/cap-theorem/interview';
import type {CapSection} from '@/lib/cap-theorem/types';
import StickyToc from './sticky-toc';
import CodePanel from './code-panel';
import InterviewMode from './interview-mode';

const ALL_SECTIONS: CapSection[] = [
  ...SECTIONS_FUND,
  ...SECTIONS_MODELS,
  ...SECTIONS_SYSTEMS,
  ...SECTIONS_DESIGN,
];

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

function CapCard({s}: {s: CapSection}) {
  return (
    <div className="space-y-4">
      <div className="space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
        <p>
          <strong>What:</strong> {s.what}
        </p>
        <p>
          <strong>Why:</strong> {s.why}
        </p>
        <p>
          <strong>How:</strong> {s.how}
        </p>
        <p>
          <strong>Failure:</strong> {s.failure}
        </p>
        <p>
          <strong>Trade-off:</strong> {s.tradeoff}
        </p>
        <p>
          <strong>Tech:</strong> {s.tech}
        </p>
        <p>
          <strong>Interview:</strong> {s.interviewAnswer}
        </p>
      </div>
      {s.example && <CodePanel title="Example / diagram" code={s.example} />}
      {s.tables?.map((t, i) => (
        <MiniTable key={i} headers={t.headers} rows={t.rows} />
      ))}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">Remember</p>
        <ul className="mt-2 list-disc pl-5 text-sm leading-7 text-slate-700 dark:text-slate-300">
          {s.remember.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">One-liner: {s.oneLiner}</p>
        <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">
          <strong>Trap:</strong> {s.trap}
        </p>
      </div>
    </div>
  );
}

function PredictBrowser() {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const q = BEHAVIOR_PREDICT[idx];
  if (!q) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <CodePanel title={`Scenario #${idx + 1}`} code={q.setup} />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
        >
          Reveal
        </button>
        <button
          type="button"
          onClick={() => {
            setIdx((i) => (i + 1) % BEHAVIOR_PREDICT.length);
            setRevealed(false);
          }}
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          Next
        </button>
      </div>
      {revealed && (
        <div className="mt-4 space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
          <p>
            <strong>Expected:</strong> {q.expected}
          </p>
          <p>
            <strong>Why:</strong> {q.why}
          </p>
          <p>
            <strong>Trade-off:</strong> {q.tradeoff}
          </p>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-400">
        {idx + 1} / {BEHAVIOR_PREDICT.length}
      </p>
    </div>
  );
}

function ScenarioBrowser() {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const q = SCENARIO_QS[idx];
  if (!q) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-lg font-semibold text-slate-900 dark:text-white">{q.title}</p>
      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{q.requirements}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
        >
          Reveal answer
        </button>
        <button
          type="button"
          onClick={() => {
            setIdx((i) => (i + 1) % SCENARIO_QS.length);
            setRevealed(false);
          }}
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          Next
        </button>
      </div>
      {revealed && (
        <div className="mt-4 space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
          <p>
            <strong>Consistency:</strong> {q.consistency}
          </p>
          <p>
            <strong>Availability:</strong> {q.availability}
          </p>
          <p>
            <strong>Partition:</strong> {q.partition}
          </p>
          <p>
            <strong>Architecture:</strong> {q.architecture}
          </p>
          <p>
            <strong>Trade-off:</strong> {q.tradeoff}
          </p>
          <p>
            <strong>Failure:</strong> {q.failure}
          </p>
          <p>
            <strong>Recovery:</strong> {q.recovery}
          </p>
          <p className="font-semibold text-slate-900 dark:text-white">Spoken: {q.interviewAnswer}</p>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-400">
        {idx + 1} / {SCENARIO_QS.length}
      </p>
    </div>
  );
}

export default function CapTheoremHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · System Design · Distributed Systems · Java / Kafka / Cloud
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          CAP Theorem — End-to-End Interview Mastery
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          From Brewer&apos;s conjecture to PACELC, quorum math, Kafka/Cassandra/Mongo knobs, multi-region
          RPO/RTO, Saga vs 2PC, and Staff-level spoken answers — without the &quot;pick any two&quot; myth.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          {VERSION_NOTE}{' '}
          <Link href="/distributed-locking" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Locking
          </Link>
          {' · '}
          <Link href="/kafka-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Kafka
          </Link>
          {' · '}
          <Link href="/microservices-patterns" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Microservices
          </Link>
          {' · '}
          <Link href="/system-design" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            System Design
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={CAP_TOC} />
        <div className="min-w-0 space-y-16">
          <Section
            id="overview"
            title="00. Overview"
            lead="CAP is a partition-time guarantee trade-off — not a product label and not ACID."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['C', 'Consistency', 'Linearizable / single-copy illusion during ops'],
                ['A', 'Availability', 'Every non-failing node answers (no indefinite wait)'],
                ['P', 'Partition tolerance', 'Continue despite message loss between nodes'],
              ].map(([k, t, d]) => (
                <div
                  key={k}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{k}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{t}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{d}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                `${ALL_SECTIONS.length} deep sections`,
                `${TRAP_QS.length} trap Qs`,
                `${RAPID_QS.length} rapid-fire`,
                `${INTERVIEW_ALL.length} interview prompts`,
              ].map((x) => (
                <div
                  key={x}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-300"
                >
                  {x}
                </div>
              ))}
            </div>
            <div className="mt-6">
              <CodePanel
                title="Mental model (not the triangle myth)"
                code={`No partition  →  C and A can both hold
Partition     →  choose C (reject/wait)  OR  A (serve possibly stale)
P is assumed for any real multi-node / multi-AZ / multi-region system`}
              />
            </div>
          </Section>

          {ALL_SECTIONS.map((s) => (
            <Section key={s.id} id={s.id} title={s.title} lead={s.oneLiner}>
              <CapCard s={s} />
            </Section>
          ))}

          <Section id="design-qs" title="46. Design interview scenarios" lead="Walk requirements → partition behavior → spoken answer.">
            <ScenarioBrowser />
          </Section>

          <Section id="traps" title="47. Interview traps" lead="Correct the misconceptions interviewers bait with.">
            <div className="space-y-3">
              {TRAP_QS.slice(0, 12).map((q) => (
                <details
                  key={q.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white">{q.question}</summary>
                  <div className="mt-3 space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
                    <p>{q.answer30s}</p>
                    <p>{q.answer2m}</p>
                    {q.trick && (
                      <p className="text-rose-700 dark:text-rose-300">
                        Trap: {q.trick}
                      </p>
                    )}
                  </div>
                </details>
              ))}
              <p className="text-sm text-slate-500">
                {TRAP_QS.length} traps total — full set in Interview mode + Architect bank.
              </p>
            </div>
          </Section>

          <Section id="spoken" title="55–57. Spoken answers (60s / 2m / Staff)">
            <div className="space-y-4">
              {(
                [
                  ['60 seconds', SPOKEN.sixtySec],
                  ['2 minutes', SPOKEN.twoMin],
                  ['Staff / Principal', SPOKEN.staff],
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
              <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Memory rules</p>
              <MiniTable
                headers={['Title', 'Rule']}
                rows={MEMORY_RULES.map((m) => [m.title, m.rule])}
              />
            </div>
          </Section>

          <Section id="rapid" title="58. Rapid-fire bank" lead={`${RAPID_QS.length} one-liners for warm-ups.`}>
            <div className="grid gap-2 sm:grid-cols-2">
              {RAPID_QS.slice(0, 20).map((q) => (
                <details
                  key={q.id}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
                >
                  <summary className="cursor-pointer font-medium text-slate-800 dark:text-slate-100">{q.question}</summary>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">{q.answer30s}</p>
                </details>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-500">Use Interview mode → Rapid for the full {RAPID_QS.length}.</p>
          </Section>

          <Section id="predict" title="59. Predict behavior" lead="N/W/R, partitions, Kafka acks, Cassandra CL, split brain.">
            <PredictBrowser />
          </Section>

          <Section id="pseudocode" title="60. Pseudocode exercises">
            <div className="space-y-6">
              {PSEUDO.map((p) => (
                <div key={p.id} className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{p.title}</h3>
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{p.statement}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <strong>Approach:</strong> {p.approach}
                  </p>
                  <CodePanel title="Java-oriented pseudocode" code={p.code} />
                  <p className="text-xs text-slate-500">
                    {p.complexity} · Edges: {p.edgeCases.join('; ')}
                  </p>
                  <p className="text-sm italic text-slate-600 dark:text-slate-400">{p.interviewExplain}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="incidents" title="61. Production incidents">
            <div className="space-y-3">
              {INCIDENTS.map((inc) => (
                <details
                  key={inc.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white">{inc.title}</summary>
                  <div className="mt-3 space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
                    <p>
                      <strong>Symptom:</strong> {inc.symptom}
                    </p>
                    <p>
                      <strong>Cause:</strong> {inc.cause}
                    </p>
                    <p>
                      <strong>Investigate:</strong> {inc.investigate}
                    </p>
                    <p>
                      <strong>Fix:</strong> {inc.fix}
                    </p>
                    <p>
                      <strong>Prevent:</strong> {inc.prevent}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </Section>

          <Section id="senior-tradeoffs" title="64. Senior / Staff trade-off questions">
            <div className="space-y-3">
              {SENIOR_TRADEOFF_QS.map((q) => (
                <details
                  key={q.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white">{q.question}</summary>
                  <div className="mt-3 space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
                    <p>{q.answer30s}</p>
                    <p>{q.answer2m}</p>
                  </div>
                </details>
              ))}
            </div>
          </Section>

          <Section id="cheatsheet" title="65. Cheat sheet">
            <MiniTable
              headers={['Term', 'Purpose', 'Key rule', 'Trap']}
              rows={CHEAT_ROWS.map((r) => [r.term, r.purpose, r.rule, r.trap])}
            />
            <div className="mt-6">
              <CodePanel title="Decision tree" code={DECISION_ASCII} />
            </div>
          </Section>

          <Section id="checklist" title="66. Coverage checklist">
            <ul className="grid gap-1 sm:grid-cols-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
              {COVERAGE_CHECKLIST.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="interview" title="Interview mode" lead="Drill Senior, Architect, or Rapid banks.">
            <InterviewMode />
          </Section>
        </div>
      </div>
    </div>
  );
}
