'use client';

import {useMemo, useState} from 'react';
import Link from 'next/link';
import {CMP_TOC, MEMORY_SENTENCE, VERSION_NOTE} from '@/lib/java-comparable-comparator/toc';
import {
  SECTIONS_FUND,
  COMPARABLE_VS_COMPARATOR_ROWS,
  MEMORY_RULES,
} from '@/lib/java-comparable-comparator/parts-fundamentals';
import {SECTIONS_COLL} from '@/lib/java-comparable-comparator/parts-collections';
import {
  TRAP_QS,
  RAPID_QS,
  STAFF_QS,
  SCENARIO_QS,
  OUTPUT_PREDICT,
  CODING_PROBLEMS,
  SPOKEN_TEMPLATES,
  CHEAT_ROWS,
  DECISION_ASCII,
  COVERAGE_CHECKLIST,
  ALL as INTERVIEW_ALL,
} from '@/lib/java-comparable-comparator/interview';
import StickyToc from './sticky-toc';
import CodePanel from './code-panel';
import InterviewMode from './interview-mode';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import type {DemoSourceFile, DemoTreeNode} from '@/lib/oauth-demo-source';

type NormSection = {
  id: string;
  title: string;
  lead: string;
  body: string;
  code?: string;
  remember: string[];
  oneLiner: string;
  trap: string;
  tables?: {headers: string[]; rows: string[][]}[];
};

function normalizeFund(): NormSection[] {
  return SECTIONS_FUND.map((s) => ({
    id: s.id,
    title: s.title,
    lead: s.lead,
    body: s.body,
    code: s.code,
    remember: s.remember,
    oneLiner: s.oneLiner,
    trap: s.trap,
    tables: s.tables,
  }));
}

function normalizeColl(): NormSection[] {
  return SECTIONS_COLL.map((s) => ({
    id: s.id,
    title: s.title,
    lead: s.what,
    body: [
      `**What:** ${s.what}`,
      `**Why:** ${s.why}`,
      `**How:** ${s.how}`,
      `**Real world:** ${s.realWorld}`,
      `**Mistake:** ${s.mistake}`,
      `**Interview:** ${s.interviewAnswer}`,
    ].join('\n\n'),
    code: s.code,
    remember: s.remember,
    oneLiner: s.oneLiner,
    trap: s.trap,
  }));
}

const ALL_SECTIONS = [...normalizeFund(), ...normalizeColl()];

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

function SectionCard({s}: {s: NormSection}) {
  return (
    <div className="space-y-4">
      <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">{s.body}</div>
      {s.code && <CodePanel title="Java" code={s.code} />}
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
  const q = OUTPUT_PREDICT[idx];
  if (!q) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <CodePanel title={`Predict #${idx + 1}`} code={q.code} />
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
            setIdx((i) => (i + 1) % OUTPUT_PREDICT.length);
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
          <p className="text-rose-700 dark:text-rose-300">
            <strong>Trap:</strong> {q.trap}
          </p>
        </div>
      )}
    </div>
  );
}

function CodingBrowser() {
  const levels = [1, 2, 3, 4, 5] as const;
  const [level, setLevel] = useState<(typeof levels)[number]>(1);
  const list = useMemo(() => CODING_PROBLEMS.filter((p) => p.level === level), [level]);
  const [idx, setIdx] = useState(0);
  const p = list[Math.min(idx, Math.max(list.length - 1, 0))];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {levels.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => {
              setLevel(l);
              setIdx(0);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              level === l ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            L{l} ({CODING_PROBLEMS.filter((x) => x.level === l).length})
          </button>
        ))}
      </div>
      {p && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{p.title}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{p.statement}</p>
          <p className="mt-2 text-sm">
            <strong>Approach:</strong> {p.approach}
          </p>
          <div className="mt-3">
            <CodePanel title="Solution" code={p.code} />
          </div>
          <p className="mt-2 text-sm text-slate-500">Complexity: {p.complexity}</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-600 dark:text-slate-300">
            {p.edgeCases.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{p.interviewExplain}</p>
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % list.length)}
            className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          >
            Next L{level}
          </button>
        </div>
      )}
    </div>
  );
}

export default function JavaComparableComparatorHub({
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
          Senior · Staff · Core Java · Java 8–21
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Comparable & Comparator — Interview Mastery
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Natural order vs external strategy — TreeSet/TreeMap uniqueness, BigDecimal, overflow,{' '}
          <code className="text-sm">Comparator{'<? super T>'}</code>, TimSort, PriorityQueue traps, and Staff spoken
          answers.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{VERSION_NOTE}</p>
        <p className="mt-3 text-sm text-slate-500">
          Related:{' '}
          <Link href="/java-equals-hashcode" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            equals & hashCode
          </Link>
          {' · '}
          <Link href="/complexity" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Complexity
          </Link>
          {' · '}
          <Link href="/java-compiler" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Java Compiler
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_1fr]">
        <StickyToc items={CMP_TOC} />
        <div className="min-w-0 space-y-16">
          <Section id="overview" title="00. Overview" lead="Comparable = natural order · Comparator = strategy · Tree* uses compare==0.">
            <Pre>{MEMORY_RULES}</Pre>
            <div className="mt-4">
              <MiniTable
                headers={['Dimension', 'Comparable', 'Comparator']}
                rows={COMPARABLE_VS_COMPARATOR_ROWS}
              />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              {ALL_SECTIONS.length} concept sections · {TRAP_QS.length} traps · {RAPID_QS.length} rapid ·{' '}
              {CODING_PROBLEMS.length} coding · {OUTPUT_PREDICT.length} predict-output · {INTERVIEW_ALL.length} interview
              prompts
            </p>
          </Section>

          {ALL_SECTIONS.map((s, i) => (
            <Section key={s.id} id={s.id} title={`${String(i + 1).padStart(2, '0')}. ${s.title}`} lead={s.lead}>
              <SectionCard s={s} />
            </Section>
          ))}

          <Section id="scenarios" title="36. Interview scenarios" lead="Staff walk-throughs.">
            <div className="space-y-4">
              {SCENARIO_QS.map((q) => (
                <details
                  key={q.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white">{q.question}</summary>
                  <p className="mt-2 text-slate-700 dark:text-slate-300">{q.answer2m}</p>
                  <p className="mt-2 text-slate-500">Follow-ups: {q.followUps.join(' · ')}</p>
                </details>
              ))}
            </div>
          </Section>

          <Section id="predict" title="37. Predict the output" lead="Say the result before revealing.">
            <PredictBrowser />
          </Section>

          <Section id="coding" title="38. Coding problems" lead="Levels 1–5.">
            <CodingBrowser />
          </Section>

          <Section id="modern" title="39. Java 8→21 · records · enums" lead="Lambdas, method refs, records, enum ordinal traps.">
            <div className="space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
              <p>
                Java 8+ made Comparator the default for multi-order use cases via lambdas and{' '}
                <code>comparing*</code>/<code>thenComparing*</code>. Records do <strong>not</strong> auto-implement
                Comparable — add <code>implements Comparable&lt;R&gt;</code> or use Comparator. Enums implement
                Comparable by ordinal — do not use ordinal for business ranking; use an explicit field + Comparator.
              </p>
              <CodePanel
                title="Record + enum"
                code={`record Emp(int id, String name, double salary) {}
// Emp does NOT implement Comparable automatically
Comparator<Emp> byName = Comparator.comparing(Emp::name);

enum Priority { LOW, MEDIUM, HIGH } // natural = declaration order
Comparator<Priority> byBusiness =
  Comparator.comparingInt(p -> switch (p) { case HIGH -> 0; case MEDIUM -> 1; default -> 2; });`}
              />
            </div>
          </Section>

          <Section id="mistakes" title="40. Production mistakes" lead="Checklist of real outages.">
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700 dark:text-slate-300">
              {[
                'Subtraction-based compareTo / Comparator (overflow)',
                'Inconsistent / non-transitive comparator',
                'Mutable fields used in TreeSet/TreeMap ordering',
                'Ignoring nulls → NPE in sort',
                'Expensive transforms inside comparing() (toLowerCase alloc)',
                'equals/compareTo inconsistency without understanding Tree* vs Hash*',
                'Wrong reverse: reverseOrder vs reversed',
                'Assuming PriorityQueue iteration is sorted',
                'Assuming TreeSet uses equals for duplicates',
                'Unnecessary boxing: comparing(Integer) vs comparingInt',
                'Sorting formatted strings / date-as-string',
                'Using enum ordinal for business priority',
                'Modifying keys after insert into TreeMap',
                'Stateful shared Comparator across threads',
              ].map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </Section>

          <Section id="traps" title="41. Trap questions" lead="Classic interviewer gotchas.">
            <MiniTable
              headers={['Question', '30s answer']}
              rows={TRAP_QS.map((q) => [q.question, q.answer30s])}
            />
          </Section>

          <Section id="rapid" title="42. Rapid-fire" lead="One-liners under pressure.">
            <MiniTable
              headers={['Q', 'A']}
              rows={RAPID_QS.map((q) => [q.question, q.answer30s])}
            />
          </Section>

          <Section id="staff" title="43. Senior / Staff questions" lead="Contracts, variance, production.">
            <div className="space-y-3">
              {STAFF_QS.map((q) => (
                <details
                  key={q.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white">{q.question}</summary>
                  <p className="mt-2">{q.answer2m}</p>
                </details>
              ))}
            </div>
          </Section>

          <Section id="templates" title="44. Spoken templates" lead="20–60 second answers.">
            <div className="space-y-3">
              {SPOKEN_TEMPLATES.map((t) => (
                <div
                  key={t.title}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-7 dark:border-slate-800 dark:bg-slate-950"
                >
                  <p className="font-semibold text-slate-900 dark:text-white">{t.title}</p>
                  <p className="mt-2 text-slate-700 dark:text-slate-300">{t.answer}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="cheatsheet" title="45. Cheat sheet" lead="Purpose · rule · trap.">
            <MiniTable headers={['API', 'Purpose', 'Key rule', 'Trap']} rows={CHEAT_ROWS} />
          </Section>

          <Section id="decision" title="46. Decision framework" lead="Pick Comparable vs Comparator in 10 seconds.">
            <Pre>{DECISION_ASCII}</Pre>
          </Section>

          <Section id="checklist" title="47. Coverage checklist" lead="100% interview coverage gate.">
            <ul className="grid gap-2 md:grid-cols-2">
              {COVERAGE_CHECKLIST.map((c) => (
                <li
                  key={c}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                >
                  ✓ {c}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="demo" title="48. Runnable demos" lead="javac + java — overflow, BigDecimal, PQ, TreeSet traps.">
            {files.length > 0 ? (
              <OAuthCodeExplorer
                files={files}
                tree={tree}
                defaultPath={defaultPath}
                routeBase="/java-comparable-comparator"
                ariaLabel="Comparable Comparator demo source"
              />
            ) : (
              <p className="text-sm text-slate-500">Demo sources unavailable.</p>
            )}
          </Section>

          <Section id="interview" title="49. Interview mode" lead="Senior · Architect · Rapid decks.">
            <InterviewMode />
          </Section>
        </div>
      </div>
    </div>
  );
}
