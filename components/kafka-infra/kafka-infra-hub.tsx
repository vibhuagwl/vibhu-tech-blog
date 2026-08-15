'use client';

import {useMemo, useState} from 'react';
import Link from 'next/link';
import {KAFKA_INFRA_TOC, MEMORY_SENTENCE, VERSION_NOTE} from '@/lib/kafka-infra/toc';
import {
  MENTAL_ASCII,
  WHO_TALKS_TO_WHOM,
  COMPONENT_CARDS,
  SECTIONS_CORE,
} from '@/lib/kafka-infra/parts-core';
import {SECTIONS_OPS} from '@/lib/kafka-infra/parts-ops';
import {
  SECTIONS_INCIDENTS,
  FAILURE_SCENARIOS,
  RUNBOOKS,
  TEMP_PERM_ROWS,
} from '@/lib/kafka-infra/parts-incidents';
import {
  SECTIONS_STAFF_GAPS,
  E2E_TRACE_ASCII,
  E2E_TRACE_FAILURES,
} from '@/lib/kafka-infra/parts-staff-gaps';
import {
  PRODUCTION_INPUTS,
  CALC_FORMULAS,
  WORKED_500K,
  CALC_PROBLEMS,
  SECTION_PRODUCTION_NUMBERS,
} from '@/lib/kafka-infra/production-numbers';
import {
  WAR_INCIDENTS,
  WAR_HOW_MANY,
  WAR_WHAT_IF,
  WAR_ARCHITECTURE,
  WAR_TROUBLESHOOT,
  WAR_CALC,
  WAR_STAFF_FOLLOWUPS,
  WAR_ALL,
  BAD_GOOD_EXCELLENT,
  TIMED_RESPONSES,
  SECTION_WAR_ROOM,
  SECTION_E2E_TRACE,
} from '@/lib/kafka-infra/war-room';
import {
  DESIGN_QS,
  TRICK_QS,
  FRAMEWORK_10,
  ANSWER_30S,
  ANSWER_1M,
  ANSWER_3M,
  ANSWER_10M,
  HOW_MANY_CHEAT,
  DECISION_TREES,
  CHECKLIST,
  JUNIOR_VS_STAFF,
} from '@/lib/kafka-infra/interview';
import type {SectionBlock, FailureScenario, ComponentCard} from '@/lib/kafka-infra/types';
import StickyToc from './sticky-toc';
import CodePanel from './code-panel';
import InterviewMode from './interview-mode';
import WarRoomMode from './war-room-mode';

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

function SectionBody({s}: {s: SectionBlock}) {
  return (
    <div className="space-y-4">
      {s.ascii && <Pre>{s.ascii}</Pre>}
      <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">{s.body}</div>
      {s.tables?.map((t, i) => (
        <MiniTable key={i} headers={t.headers} rows={t.rows} />
      ))}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">Remember this</p>
        <ul className="mt-2 list-disc pl-5 text-sm leading-7 text-slate-700 dark:text-slate-300">
          {s.remember.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Interview one-liner: {s.oneLiner}</p>
        <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">
          <strong>Common trap:</strong> {s.trap}
        </p>
      </div>
    </div>
  );
}

function ComponentBrowser({cards}: {cards: ComponentCard[]}) {
  const [id, setId] = useState(cards[0]?.id ?? '');
  const c = cards.find((x) => x.id === id) ?? cards[0];
  if (!c) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <ul className="max-h-[28rem] space-y-0.5 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
        {cards.map((card) => (
          <li key={card.id}>
            <button
              type="button"
              onClick={() => setId(card.id)}
              className={`w-full rounded-lg px-2 py-1.5 text-left text-[13px] ${
                c.id === card.id
                  ? 'bg-slate-900 font-semibold text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
              }`}
            >
              {card.name}
            </button>
          </li>
        ))}
      </ul>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{c.name}</h3>
        <p className="mt-2">
          <strong>What:</strong> {c.what}
        </p>
        <p>
          <strong>Why:</strong> {c.why}
        </p>
        <p>
          <strong>How many:</strong> {c.howMany}
        </p>
        <p>
          <strong>If it fails:</strong> {c.ifFails}
        </p>
        <p>
          <strong>Scales:</strong> {c.scales}
        </p>
        <p>
          <strong>Monitor:</strong> {c.monitored}
        </p>
        <p className="mt-2 font-semibold text-slate-900 dark:text-white">Interview Qs</p>
        <ul className="list-disc pl-5">
          {c.interviewQs.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </article>
    </div>
  );
}

function ScenarioBrowser({items}: {items: FailureScenario[]}) {
  const [q, setQ] = useState('');
  const [id, setId] = useState(items[0]?.id ?? '');
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) => i.title.toLowerCase().includes(s) || i.id.includes(s));
  }, [items, q]);
  const cur = filtered.find((i) => i.id === id) ?? filtered[0] ?? items[0];
  if (!cur) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter scenarios…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
        />
        <ul className="mt-2 max-h-[28rem] space-y-0.5 overflow-y-auto">
          {filtered.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => setId(i.id)}
                className={`w-full rounded-lg px-2 py-1.5 text-left text-[13px] ${
                  cur.id === i.id
                    ? 'bg-slate-900 font-semibold text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
              >
                {i.title}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-slate-400">
          {filtered.length}/{items.length}
        </p>
      </div>
      <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{cur.title}</h3>
        {cur.architecture && <Pre>{cur.architecture}</Pre>}
        <p>
          <strong>Symptoms:</strong> {cur.symptoms.join(' · ')}
        </p>
        <p>
          <strong>Causes:</strong> {cur.causes.join(' · ')}
        </p>
        <p>
          <strong>Metrics:</strong> {cur.metrics.join(' · ')}
        </p>
        <p>
          <strong>Logs:</strong> {cur.logs.join(' · ')}
        </p>
        <p>
          <strong>Temporary:</strong> {cur.tempFix.join(' · ')}
        </p>
        <p>
          <strong>Permanent:</strong> {cur.permanentFix.join(' · ')}
        </p>
        <p>
          <strong>Trade-offs:</strong> {cur.tradeoffs}
        </p>
        <p className="font-semibold text-slate-900 dark:text-white">Interview: {cur.interviewAnswer}</p>
      </article>
    </div>
  );
}

const ALL_SECTIONS = [
  ...SECTIONS_CORE,
  ...SECTIONS_OPS,
  ...SECTIONS_INCIDENTS,
  ...SECTIONS_STAFF_GAPS,
];

const SPECIAL_IDS = new Set(['mental', 'incidents', 'runbooks', 'tempperm']);

export default function KafkaInfraHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · SRE · 12+ YOE system design
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Kafka Production Infrastructure
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Deploy, size, operate, and defend Kafka in production interviews — including networking, request path,
          Connect/Streams, quotas, chaos/DR, production calculations, and the War Room.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{VERSION_NOTE}</p>
        <p className="mt-3 text-sm text-slate-500">
          Hub:{' '}
          <Link href="/kafka-mastery" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Mastery
          </Link>
          {' · '}
          <Link href="/kafka-cluster" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Cluster internals
          </Link>
          {' · '}
          <Link href="/kafka-producer" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Producer
          </Link>
          {' · '}
          <Link href="/kafka-consumer" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Consumer
          </Link>
          {' · '}
          <Link href="/kafka-dlq" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            DLQ
          </Link>
          {' · '}
          <Link href="/kafka-properties" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Properties
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_1fr]">
        <StickyToc items={KAFKA_INFRA_TOC} />
        <div className="min-w-0 space-y-16">
          <Section
            id="overview"
            title="00. Overview · how to use"
            lead="Mental model → calculate → fail each hop → temporary vs permanent → Staff verbal answer. Jump to §54–56 for numbers, War Room, and e2e trace."
          >
            <Pre>{MENTAL_ASCII}</Pre>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{WHO_TALKS_TO_WHOM}</p>
            <p className="mt-3 text-sm text-slate-500">
              {ALL_SECTIONS.length + 3} guided parts · {COMPONENT_CARDS.length} components ·{' '}
              {FAILURE_SCENARIOS.length + WAR_INCIDENTS.length} incidents · {WAR_ALL.length} war-room prompts ·{' '}
              {DESIGN_QS.length} design Qs
            </p>
          </Section>

          {ALL_SECTIONS.filter((s) => s.id === 'mental').map((s) => (
            <Section key={s.id} id={s.id} title={`${String(s.part).padStart(2, '0')}. ${s.title}`} lead={s.lead}>
              <ComponentBrowser cards={COMPONENT_CARDS} />
              <div className="mt-6">
                <SectionBody s={s} />
              </div>
            </Section>
          ))}

          {ALL_SECTIONS.filter((s) => !SPECIAL_IDS.has(s.id)).map((s) => (
            <Section key={s.id} id={s.id} title={`${String(s.part).padStart(2, '0')}. ${s.title}`} lead={s.lead}>
              <SectionBody s={s} />
            </Section>
          ))}

          {ALL_SECTIONS.filter((s) => s.id === 'tempperm').map((s) => (
            <Section key={s.id} id={s.id} title={`${String(s.part).padStart(2, '0')}. ${s.title}`} lead={s.lead}>
              <SectionBody s={s} />
              <div className="mt-4">
                <MiniTable
                  headers={['Problem', 'Immediate', 'Permanent', 'Why temp is dangerous']}
                  rows={TEMP_PERM_ROWS}
                />
              </div>
            </Section>
          ))}

          {ALL_SECTIONS.filter((s) => s.id === 'incidents').map((s) => (
            <Section key={s.id} id={s.id} title={`${String(s.part).padStart(2, '0')}. ${s.title}`} lead={s.lead}>
              <SectionBody s={s} />
              <div className="mt-6">
                <ScenarioBrowser items={FAILURE_SCENARIOS} />
              </div>
            </Section>
          ))}

          {ALL_SECTIONS.filter((s) => s.id === 'runbooks').map((s) => (
            <Section key={s.id} id={s.id} title={`${String(s.part).padStart(2, '0')}. ${s.title}`} lead={s.lead}>
              <SectionBody s={s} />
              <div className="mt-6 space-y-4">
                {RUNBOOKS.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-7 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <h3 className="font-bold text-slate-900 dark:text-white">{r.incident}</h3>
                    <p className="text-slate-500">Severity: {r.severity}</p>
                    <p className="mt-2">
                      <strong>First 5 min:</strong> {r.first5.join(' · ')}
                    </p>
                    <p>
                      <strong>Check:</strong> {r.check.join(' · ')}
                    </p>
                    <p>
                      <strong>Temp:</strong> {r.temp.join(' · ')}
                    </p>
                    <p>
                      <strong>Root:</strong> {r.root}
                    </p>
                    <p>
                      <strong>Permanent:</strong> {r.permanent.join(' · ')}
                    </p>
                    <p>
                      <strong>Validate:</strong> {r.validation.join(' · ')}
                    </p>
                    <p>
                      <strong>Prevent:</strong> {r.prevention.join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          ))}

          <Section id="interview" title="29. Interview Q&A" lead="Design prompts with Staff-level structure.">
            <InterviewMode />
            <p className="mt-4 text-sm text-slate-500">
              {DESIGN_QS.length} design · {TRICK_QS.length} trick (use Rapid deck) · War Room has {WAR_ALL.length} more
            </p>
          </Section>

          <Section id="tricks" title="30. Trick questions" lead="Say the distinction out loud before the number.">
            <MiniTable
              headers={['Question', '30s answer']}
              rows={TRICK_QS.map((q) => [q.question, q.answer30s])}
            />
          </Section>

          <Section id="cheatsheet" title="31. Cheat sheets" lead="Starting points — not universal production numbers.">
            <MiniTable
              headers={['Component', 'Small', 'Medium', 'Large', 'How to decide']}
              rows={HOW_MANY_CHEAT}
            />
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {DECISION_TREES.map((t) => (
                <div key={t.id}>
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-[.12em] text-slate-500">{t.title}</h3>
                  <Pre>{t.ascii}</Pre>
                </div>
              ))}
            </div>
            <ul className="mt-6 list-disc pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {CHECKLIST.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Section>

          <Section id="recall" title="32. 30-second recall" lead="KAFKA 10-point framework + timed answers.">
            <Pre>{FRAMEWORK_10}</Pre>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
              <p>
                <strong>30s:</strong> {ANSWER_30S}
              </p>
              <p>
                <strong>1 min:</strong> {ANSWER_1M}
              </p>
              <p>
                <strong>3 min:</strong> {ANSWER_3M}
              </p>
              <CodePanel title="10-minute deep dive" code={ANSWER_10M} />
            </div>
          </Section>

          <Section id="staff" title="33. Senior / Staff answers" lead="Never stop at “use 3 brokers.”">
            <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">
              {JUNIOR_VS_STAFF}
            </div>
          </Section>

          <Section
            id={SECTION_PRODUCTION_NUMBERS.id}
            title={`${String(SECTION_PRODUCTION_NUMBERS.part).padStart(2, '0')}. ${SECTION_PRODUCTION_NUMBERS.title}`}
            lead={SECTION_PRODUCTION_NUMBERS.lead}
          >
            <SectionBody s={SECTION_PRODUCTION_NUMBERS} />
            <div className="mt-4">
              <MiniTable headers={['Field', 'Meaning', 'How to measure']} rows={PRODUCTION_INPUTS} />
            </div>
            <div className="mt-4">
              <CodePanel title="Formulas" code={CALC_FORMULAS} />
            </div>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Worked: 500K TPS design</h3>
              <p className="mt-2 text-sm text-slate-500">{WORKED_500K.prompt}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                {WORKED_500K.disclaimer}
              </p>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-700 dark:text-slate-300">
                {WORKED_500K.steps.map((step) => (
                  <li key={step.label}>
                    <strong>{step.label}:</strong> {step.calc}
                    {step.note && <span className="block text-slate-500">{step.note}</span>}
                  </li>
                ))}
              </ol>
              <p className="mt-4 font-semibold text-slate-900 dark:text-white">{WORKED_500K.interviewClose}</p>
            </div>
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-[.12em] text-slate-500">
                Calculation drills ({CALC_PROBLEMS.length})
              </h3>
              {CALC_PROBLEMS.map((p) => (
                <details
                  key={p.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white">{p.prompt}</summary>
                  <p className="mt-2 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{p.solution}</p>
                  <p className="mt-2 text-rose-700 dark:text-rose-300">
                    <strong>Traps:</strong> {Array.isArray(p.traps) ? p.traps.join(' · ') : p.traps}
                  </p>
                </details>
              ))}
            </div>
          </Section>

          <Section
            id={SECTION_WAR_ROOM.id}
            title={`${String(SECTION_WAR_ROOM.part).padStart(2, '0')}. ${SECTION_WAR_ROOM.title}`}
            lead={SECTION_WAR_ROOM.lead}
          >
            <SectionBody s={SECTION_WAR_ROOM} />
            <div className="mt-6">
              <WarRoomMode />
            </div>
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-[.12em] text-slate-500">
                Bad · Good · Excellent
              </h3>
              <div className="space-y-3">
                {BAD_GOOD_EXCELLENT.map((row) => (
                  <div
                    key={row.question}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-7 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">{row.question}</p>
                    <p className="mt-2 text-rose-700 dark:text-rose-300">
                      <strong>Bad:</strong> {row.bad}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Good:</strong> {row.good}
                    </p>
                    <p className="text-emerald-800 dark:text-emerald-300">
                      <strong>Excellent:</strong> {row.excellent}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-[.12em] text-slate-500">
                Timed responses (30s / 2m / 5m)
              </h3>
              <div className="space-y-3">
                {TIMED_RESPONSES.map((t) => (
                  <div
                    key={t.question}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-7 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">{t.question}</p>
                    <p className="mt-2">
                      <strong>30s:</strong> {t.s30}
                    </p>
                    <p>
                      <strong>2m:</strong> {t.m2}
                    </p>
                    <p>
                      <strong>5m:</strong> {t.m5}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-[.12em] text-slate-500">
                War Room incidents ({WAR_INCIDENTS.length})
              </h3>
              <ScenarioBrowser items={WAR_INCIDENTS} />
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Banks: How many {WAR_HOW_MANY.length} · What if {WAR_WHAT_IF.length} · Architecture{' '}
              {WAR_ARCHITECTURE.length} · Troubleshoot {WAR_TROUBLESHOOT.length} · Calc {WAR_CALC.length} · Staff
              follow-ups {WAR_STAFF_FOLLOWUPS.length}
            </p>
          </Section>

          <Section
            id={SECTION_E2E_TRACE.id}
            title={`${String(SECTION_E2E_TRACE.part).padStart(2, '0')}. ${SECTION_E2E_TRACE.title}`}
            lead={SECTION_E2E_TRACE.lead}
          >
            <SectionBody s={SECTION_E2E_TRACE} />
            <Pre>{E2E_TRACE_ASCII}</Pre>
            <div className="mt-4">
              <MiniTable
                headers={['Step', 'If it fails', 'Temporary', 'Permanent']}
                rows={E2E_TRACE_FAILURES.map((f) => [f.step, f.ifFails, f.temp, f.permanent])}
              />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
