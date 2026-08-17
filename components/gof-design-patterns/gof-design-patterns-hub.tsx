'use client';

import {useMemo, useState} from 'react';
import Link from 'next/link';
import type {PatternCard} from '@/lib/gof-design-patterns/types';
import {GOF_TOC, MEMORY_SENTENCE, VERSION_NOTE} from '@/lib/gof-design-patterns/toc';
import {ALL_PATTERNS, LAB_RUNBOOK, PATTERN_GROUPS} from '@/lib/gof-design-patterns/catalog';
import {
  FAMILY_MEMORY,
  MASTER_MAP,
  ONE_LINERS,
  PATTERN_STORIES,
  PAYMENT_DOMAIN,
  PHILOSOPHY,
  PROBLEM_TABLE,
  type PatternStory,
} from '@/lib/gof-design-patterns/playbook';
import {
  CODE_SMELL,
  COMPARISONS,
  DECISION_TREE,
  FINAL_PROJECT,
  FINAL_PROJECT_USES,
  FLASHCARDS,
  GUESS,
  REVISION_15,
  SPRING_LINKS,
  SPRING_NOTE,
  WHEN_YOU_SEE,
} from '@/lib/gof-design-patterns/drills';
import {
  INTERVIEW_ALL,
  BASIC,
  INTERMEDIATE,
  LEAD,
  SCENARIO,
  SENIOR,
} from '@/lib/gof-design-patterns/interview';
import StickyToc from '@/components/microservices-patterns/sticky-toc';
import CodePanel from '@/components/microservices-patterns/code-panel';
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
      <div className="mt-6 space-y-4">{children}</div>
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
                  className={`px-2 py-2 align-top ${
                    i === 0 ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'
                  }`}
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

function Callout({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <div className="rounded-2xl border border-slate-900 bg-slate-900 p-4 text-white">
      <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-300">{title}</p>
      <div className="mt-2 text-sm leading-7 text-slate-100">{children}</div>
    </div>
  );
}

function StoryBrowser() {
  const [family, setFamily] = useState<'All' | 'Creational' | 'Structural' | 'Behavioral'>('All');
  const list = family === 'All' ? PATTERN_STORIES : PATTERN_STORIES.filter((s) => s.family === family);
  const [id, setId] = useState(list[0]?.id ?? PATTERN_STORIES[0].id);
  const story = list.find((s) => s.id === id) ?? list[0] ?? PATTERN_STORIES[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['All', 'Creational', 'Structural', 'Behavioral'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => {
              setFamily(f);
              const next = f === 'All' ? PATTERN_STORIES : PATTERN_STORIES.filter((s) => s.family === f);
              setId(next[0]?.id ?? id);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              family === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <ul className="max-h-[32rem] space-y-0.5 overflow-y-auto rounded-2xl border border-slate-200 p-2 dark:border-slate-800">
          {list.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setId(s.id)}
                className={`w-full rounded-lg px-2 py-1.5 text-left text-[13px] ${
                  story.id === s.id
                    ? 'bg-slate-900 font-semibold text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
              >
                {s.name}
              </button>
            </li>
          ))}
        </ul>
        <StoryDetail story={story} />
      </div>
    </div>
  );
}

function StoryDetail({story: s}: {story: PatternStory}) {
  return (
    <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">
          {s.family} · problem first
        </p>
        <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{s.name}</h3>
        <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          Remember: {s.rememberProblem}
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{s.story}</p>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-rose-700 dark:text-rose-300">Bad / naive</p>
        <CodePanel title="BEFORE" code={s.badCode} language="java" />
      </div>
      <Pre>{s.pain}</Pre>
      <Pre>{s.diagram}</Pre>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Pattern · improved
        </p>
        <CodePanel title="AFTER" code={s.goodCode} language="java" />
      </div>
      <div className="space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
        <p>
          <strong>How:</strong> {s.how}
        </p>
        <p>
          <strong>When:</strong> {s.when}
        </p>
        <p>
          <strong>When not:</strong> {s.whenNot}
        </p>
      </div>
      <Pre>{s.recognize}</Pre>
      <Callout title="Memory trick">{s.memory}</Callout>
    </article>
  );
}

function Flashcards() {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = FLASHCARDS[i % FLASHCARDS.length];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">
        Flashcard {i + 1} / {FLASHCARDS.length}
      </p>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="mt-3 flex min-h-[140px] w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-lg font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
      >
        {flipped ? card.back : card.front}
      </button>
      <p className="mt-2 text-center text-xs text-slate-500">
        {flipped ? 'Answer' : 'Tap card to reveal'} · click card
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          onClick={() => {
            setI((x) => (x + 1) % FLASHCARDS.length);
            setFlipped(false);
          }}
        >
          Next
        </button>
        <button
          type="button"
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 dark:bg-slate-900 dark:text-slate-100"
          onClick={() => setFlipped(true)}
        >
          Reveal
        </button>
      </div>
    </div>
  );
}

function GuessGame() {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const q = GUESS[i % GUESS.length];
  const correct = pick === q.answer;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">
        Scenario {i + 1} / {GUESS.length}
      </p>
      <p className="mt-3 text-base font-semibold leading-7 text-slate-900 dark:text-white">{q.scenario}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {q.options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setPick(opt)}
            className={`rounded-lg px-3 py-2 text-left text-sm font-semibold ${
              pick === opt
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
      {pick && (
        <div className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
          <p className="font-semibold text-slate-900 dark:text-white">
            {correct ? 'Correct.' : `Not ${pick} — answer is ${q.answer}.`}
          </p>
          <p className="mt-1">{q.why}</p>
        </div>
      )}
      <button
        type="button"
        className="mt-4 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
        onClick={() => {
          setI((x) => (x + 1) % GUESS.length);
          setPick(null);
        }}
      >
        Next scenario
      </button>
    </div>
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
        p.problem.toLowerCase().includes(q),
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
          placeholder="Filter deep cards…"
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
      </div>
      <DeepCard pattern={selected} />
    </div>
  );
}

function DeepCard({pattern: p}: {pattern: PatternCard}) {
  const [tab, setTab] = useState<'why' | 'arch' | 'code' | 'interview'>('why');
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{p.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{p.problem}</p>
        </div>
        {p.deepLabHref && (
          <Link href={p.deepLabHref} className="rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white">
            Deep lab →
          </Link>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(['why', 'arch', 'code', 'interview'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              tab === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {id}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
        {tab === 'why' && (
          <>
            <p>
              <strong>Real world:</strong> {p.realWorld}
            </p>
            <p>
              <strong>Why:</strong> {p.whyExists}
            </p>
            <p>
              <strong>Trade-offs:</strong> {p.tradeoffs}
            </p>
          </>
        )}
        {tab === 'arch' && (
          <>
            <Pre>{p.ascii}</Pre>
            <p>
              <strong>Flow:</strong> {p.flow}
            </p>
          </>
        )}
        {tab === 'code' && (
          <>
            <CodePanel title="Java" code={p.javaCode} />
            {p.springCode && <CodePanel title="Spring" code={p.springCode} />}
          </>
        )}
        {tab === 'interview' && (
          <ul className="list-disc pl-5">
            {p.interviewQs.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
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
            {id}
          </button>
        ))}
      </div>
      {q && (
        <>
          <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{q.question}</p>
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
            <div className="mt-4 space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
              <p>
                <strong>Short:</strong> {q.answer30s}
              </p>
              <p>
                <strong>Deep:</strong> {q.answer2m}
              </p>
              <p className="text-rose-700 dark:text-rose-300">
                <strong>Wrong:</strong> {q.wrongAnswer}
              </p>
            </div>
          )}
          <p className="mt-3 text-xs text-slate-400">
            {idx + 1}/{list.length} · {INTERVIEW_ALL.length} prompts
          </p>
        </>
      )}
    </div>
  );
}

export default function GofDesignPatternsHub({
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
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Java 17/21 · Spring Boot · FinTech payment platform
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Design Patterns — remember the problem
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Not 23 definitions to memorize. <strong>23 production problems</strong> you already know how to
          solve — bad code → pain → pattern → one-line memory.
        </p>
        <p className="mt-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-3 text-sm text-slate-500">
          {VERSION_NOTE} · {ALL_PATTERNS.length} deep cards · {PATTERN_STORIES.length} problem stories ·{' '}
          <Link href="/design-patterns" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Design Patterns hub
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_1fr]">
        <StickyToc items={GOF_TOC} title="GoF · problem first" ariaLabel="GoF design patterns sections" />
        <div className="min-w-0 space-y-16">
          <Section id="philosophy" title="00. Golden rule" lead={PHILOSOPHY}>
            <Pre>{`REAL-WORLD PROBLEM
        ↓ BAD CODE → PAIN
        ↓ PATTERN → IMPROVED CODE
        ↓ WHEN / WHEN NOT
        ↓ RECOGNIZE IN INTERVIEW
        ↓ MEMORY TRICK`}</Pre>
            <Pre>{PAYMENT_DOMAIN}</Pre>
          </Section>

          <Section id="map" title="01. Master map · C / S / B" lead="Do not memorize the list. Memorize the three jobs.">
            <Pre>{MASTER_MAP}</Pre>
            <Callout title="Family memory">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-6">{FAMILY_MEMORY}</pre>
            </Callout>
          </Section>

          <Section
            id="problem-table"
            title="02. Problem-first memory table"
            lead="Primary revision tool — pattern name is secondary."
          >
            <MiniTable
              headers={['Pattern', "Don't memorize", 'Remember this problem']}
              rows={PROBLEM_TABLE}
            />
          </Section>

          <Section
            id="stories"
            title="03. Pattern stories (problem → code → memory)"
            lead="Every pattern starts with a FinTech problem — never a textbook definition."
          >
            <StoryBrowser />
          </Section>

          <Section id="twins" title="04. Confusing patterns" lead="The comparisons interviewers love to mix.">
            <div className="grid gap-4 lg:grid-cols-2">
              {COMPARISONS.map((c) => (
                <div key={c.title}>
                  <h3 className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-100">{c.title}</h3>
                  <Pre>{c.ascii}</Pre>
                </div>
              ))}
            </div>
          </Section>

          <Section id="decision" title="05. Decision tree" lead="Start here when you are stuck naming the pattern.">
            <Pre>{DECISION_TREE}</Pre>
          </Section>

          <Section id="smells" title="06. Code smell → pattern" lead="How you recognize patterns in a real codebase / whiteboard.">
            <MiniTable headers={['When you see…', 'Reach for']} rows={CODE_SMELL} />
          </Section>

          <Section id="revision" title="07. 15-minute revision" lead="Night-before interview mode — problem → pattern only.">
            <MiniTable headers={['Need…', 'Pattern']} rows={REVISION_15} />
          </Section>

          <Section id="flashcards" title="08. Flashcards" lead="Tap to flip. Train recognition, not definitions.">
            <Flashcards />
          </Section>

          <Section id="guess" title="09. Guess the pattern" lead="Mini interview scenarios — pick A/B/C/D.">
            <GuessGame />
          </Section>

          <Section id="spring" title="10. Spring Boot connections" lead="Conceptually similar ≠ exact GoF clone.">
            <MiniTable headers={['Spring idea', 'Pattern lens']} rows={SPRING_LINKS} />
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{SPRING_NOTE}</p>
          </Section>

          <Section
            id="project"
            title="11. Payment platform mini-project"
            lead="One architecture that deliberately uses the patterns together."
          >
            <Pre>{FINAL_PROJECT}</Pre>
            <MiniTable headers={['Pattern', 'Where it shows up']} rows={FINAL_PROJECT_USES} />
          </Section>

          <Section id="oneliners" title="12. One-line cheat sheet">
            <MiniTable headers={['Pattern', 'Memory']} rows={ONE_LINERS} />
          </Section>

          <Section id="when-you-see" title="13. When you see…" lead="Final memory system.">
            <MiniTable headers={['Cue', 'Pattern']} rows={WHEN_YOU_SEE} />
            <Callout title="Final message">{PHILOSOPHY}</Callout>
          </Section>

          <Section
            id="deep"
            title="14. Deep cards (ops / failures / lab links)"
            lead="Full PatternCards — use after you know the problem story."
          >
            {PATTERN_GROUPS.map((g) => (
              <div key={g.id} className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{g.title}</h3>
                <PatternBrowser patterns={g.patterns} />
              </div>
            ))}
          </Section>

          <Section id="interview" title="15. Interview bank">
            <InterviewBank />
          </Section>

          <Section
            id="lab"
            title="16. Runnable lab"
            lead="java-design-patterns-real-world — Maven demos for hands-on recall."
          >
            <ul className="list-disc space-y-1 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {LAB_RUNBOOK.map((line) => (
                <li key={line}>
                  <code className="text-xs">{line}</code>
                </li>
              ))}
            </ul>
            {files.length > 0 && (
              <div className="mt-4">
                <OAuthCodeExplorer files={files} tree={tree} defaultPath={defaultPath} ariaLabel="Lab source" />
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
