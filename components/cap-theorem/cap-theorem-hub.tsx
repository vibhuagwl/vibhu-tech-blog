'use client';

import {useState} from 'react';
import Link from 'next/link';
import {CAP_TOC, CAP_TOC_THEORY, MEMORY_SENTENCE, VERSION_NOTE} from '@/lib/cap-theorem/toc';
import {SECTIONS_FUND} from '@/lib/cap-theorem/parts-fundamentals';
import {SECTIONS_MODELS} from '@/lib/cap-theorem/parts-models';
import {SECTIONS_SYSTEMS} from '@/lib/cap-theorem/parts-systems';
import {SECTIONS_DESIGN} from '@/lib/cap-theorem/parts-design';
import {SPOKEN, CHEAT_ROWS, MEMORY_RULES} from '@/lib/cap-theorem/interview';
import {
  ARCHITECT_CHEAT,
  ARCHITECT_PICKS,
  CAP_STORIES,
  STORY_MEMORY_STRIP,
} from '@/lib/cap-theorem/stories';
import type {CapSection} from '@/lib/cap-theorem/types';
import StickyToc from './sticky-toc';
import CodePanel from './code-panel';
import StoryWalkthrough from './story-walkthrough';

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
          <strong>Architect take:</strong> {s.oneLiner}
        </p>
        <p>
          <strong>When it bites:</strong> {s.failure}
        </p>
        <p>
          <strong>Say in interview:</strong> {s.interviewAnswer}
        </p>
      </div>
      {s.example && <CodePanel title="Diagram" code={s.example} />}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">Remember</p>
        <ul className="mt-2 list-disc pl-5 text-sm leading-7 text-slate-700 dark:text-slate-300">
          {s.remember.slice(0, 4).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">
          <strong>Trap:</strong> {s.trap}
        </p>
      </div>
    </div>
  );
}

function PickDrill() {
  const [idx, setIdx] = useState(0);
  const [guess, setGuess] = useState<'CP' | 'AP' | 'Hybrid' | null>(null);
  const q = ARCHITECT_PICKS[idx];
  const correct = guess === q.answer;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">
        Scenario {idx + 1} / {ARCHITECT_PICKS.length}
      </p>
      <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{q.situation}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(['CP', 'AP', 'Hybrid'] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setGuess(opt)}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${
              guess === opt
                ? opt === q.answer
                  ? 'bg-emerald-700 text-white'
                  : 'bg-rose-700 text-white'
                : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {guess && (
        <div className="mt-4 space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
          <p className="font-semibold text-slate-900 dark:text-white">
            {correct ? 'Yes.' : `Not ${guess} — answer is ${q.answer}.`}
          </p>
          <p>
            <strong>Say:</strong> {q.say}
          </p>
          <p>
            <strong>Why not the other:</strong> {q.whyNot}
          </p>
        </div>
      )}
      <button
        type="button"
        className="mt-4 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
        onClick={() => {
          setIdx((i) => (i + 1) % ARCHITECT_PICKS.length);
          setGuess(null);
        }}
      >
        Next scenario
      </button>
    </div>
  );
}

export default function CapTheoremHub() {
  const [view, setView] = useState<'kit' | 'theory'>('kit');
  const toc = view === 'kit' ? CAP_TOC : [...CAP_TOC, ...CAP_TOC_THEORY];

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Architect interview kit · Draw · Decide · Speak
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          CAP in 5 pictures — not a textbook
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Forget long definitions. In the interview you draw two boxes, cut the wire, and pick{' '}
          <strong>Correct</strong> or <strong>Answer</strong> for that API. Theory encyclopedia is optional.
        </p>
        <p className="mt-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ['kit', 'Interview kit (default)'],
              ['theory', 'Theory encyclopedia (optional)'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                view === id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-500">
          {VERSION_NOTE}{' '}
          <Link href="/microservice-communication" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            How services talk
          </Link>
          {' · '}
          <Link href="/kafka-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Kafka
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[220px_minmax(0,1fr)]">
        <StickyToc items={toc} />
        <div className="min-w-0 space-y-14">
          <Section
            id="decide"
            title="01. 30-second decision"
            lead="This is the only CAP fork you must remember under pressure."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['C', 'Correct', 'Latest truth — or refuse'],
                ['A', 'Answer', 'Live node replies — maybe stale'],
                ['P', 'Partition', 'The cut will happen'],
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
            <pre className="mt-4 overflow-x-auto rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">{`Wire cut?
  YES → Money/seats?  YES → CP (reject)
                 NO  → AP (answer stale OK)
  NO  → Multi-region? YES → PACELC (fast vs strong)
                 NO  → still size for failure`}</pre>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {STORY_MEMORY_STRIP.slice(0, 4).map((m) => (
                <div
                  key={m.title}
                  className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500">{m.title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{m.line}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="stories"
            title="02. Draw these stories"
            lead={`${CAP_STORIES.length} scenes. Click → diagram → one-liner. That is what sticks in interviews.`}
          >
            <StoryWalkthrough />
          </Section>

          <Section id="spoken" title="03. Say this out loud">
            <div className="space-y-4">
              {(
                [
                  ['60 seconds', SPOKEN.sixtySec],
                  ['2 minutes', SPOKEN.twoMin],
                  ['Staff close', SPOKEN.staff],
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
              <MiniTable
                headers={['Memory', 'Line']}
                rows={MEMORY_RULES.slice(0, 8).map((m) => [m.title, m.rule])}
              />
            </div>
          </Section>

          <Section
            id="picks"
            title="04. Pick CP or AP"
            lead="Train the reflex. Guess → hear the one sentence you should say."
          >
            <PickDrill />
          </Section>

          <Section id="cheat" title="05. One-page cheat">
            <CodePanel title="Architect cheat sheet" code={ARCHITECT_CHEAT} />
            <div className="mt-4">
              <MiniTable
                headers={['Term', 'Rule', 'Trap']}
                rows={CHEAT_ROWS.slice(0, 12).map((r) => [r.term, r.rule, r.trap])}
              />
            </div>
          </Section>

          <Section id="drill" title="06. Quick drill">
            <p className="mb-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Repeat until automatic: cut phone → money CP / likes AP → slice the product → add PACELC if
              multi-region.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {STORY_MEMORY_STRIP.map((m) => (
                <div
                  key={m.title}
                  className="rounded-xl border border-slate-200 px-3 py-3 dark:border-slate-800"
                >
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">{m.title}</p>
                  <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{m.line}</p>
                </div>
              ))}
            </div>
          </Section>

          {view === 'kit' && (
            <Section
              id="theory-hint"
              title="Need definitions?"
              lead="Only if the interviewer asks for Gilbert/Lynch depth — most Staff rounds want the design fork above."
            >
              <button
                type="button"
                onClick={() => setView('theory')}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Open theory encyclopedia
              </button>
            </Section>
          )}

          {view === 'theory' && (
            <>
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                Optional depth. Prefer the Interview kit for recall. Each card is trimmed to architect take +
                trap.
              </p>
              {ALL_SECTIONS.map((s) => (
                <Section key={s.id} id={s.id} title={s.title} lead={s.oneLiner}>
                  <CapCard s={s} />
                </Section>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
