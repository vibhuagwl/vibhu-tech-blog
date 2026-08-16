'use client';

import {useMemo, useState} from 'react';
import {
  INTERVIEWER_FOLLOWUPS,
  PRIORITY_15,
  SENIOR_PROGRESSION,
  TOUGH_100,
  TOUGH_LEVELS,
  TOUGH_MODEL,
  type ToughLevel,
  type ToughProblem,
} from '@/lib/java-streams/tough-100';
import CodePanel from './code-panel';

function ProblemCard({p}: {p: ToughProblem}) {
  return (
    <details className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold text-slate-400">#{p.n}</span>
          <span className="font-semibold text-slate-900 dark:text-white">{p.title}</span>
          {p.priority && (
            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Priority
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">{p.keyConcept}</p>
      </summary>
      <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
        <CodePanel title="Java 21 solution" code={p.solution} language="java" />
        <p>
          <strong>Time:</strong> {p.time} · <strong>Space:</strong> {p.space}
        </p>
        <p>
          <strong>Edges:</strong> {p.edges}
        </p>
        {p.withoutStreams && (
          <p>
            <strong>Without streams:</strong> {p.withoutStreams}
          </p>
        )}
        {p.parallel && (
          <p>
            <strong>Parallel:</strong> {p.parallel}
          </p>
        )}
      </div>
    </details>
  );
}

export default function Tough100Browser() {
  const [level, setLevel] = useState<ToughLevel | 'all' | 'priority'>('priority');
  const [q, setQ] = useState('');

  const visible = useMemo(() => {
    let list = TOUGH_100;
    if (level === 'priority') list = PRIORITY_15;
    else if (level !== 'all') list = TOUGH_100.filter((p) => p.level === level);
    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(needle) ||
          p.keyConcept.toLowerCase().includes(needle) ||
          String(p.n) === needle,
      );
    }
    return list;
  }, [level, q]);

  return (
    <div className="space-y-6">
      <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
        For senior / SDE3 / Staff interviews, skip basic <code className="text-xs">filter/map/collect</code> drills.
        Master grouping, multi-level aggregation, flatMap, duplicates, anagrams, and custom collectors — then answer
        complexity, null/empty/duplicates, and parallelization follow-ups.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-900">
            <tr>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Problem</th>
              <th className="px-3 py-2">Key concept</th>
            </tr>
          </thead>
          <tbody>
            {PRIORITY_15.map((p) => (
              <tr key={p.n} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-2 font-mono font-semibold text-amber-800 dark:text-amber-200">🔥🔥🔥 #{p.n}</td>
                <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">{p.title}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{p.keyConcept}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CodePanel title="Employee model used in solutions" code={TOUGH_MODEL} language="java" />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setLevel('priority')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            level === 'priority' ? 'bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-900'
          }`}
        >
          Priority 15
        </button>
        <button
          type="button"
          onClick={() => setLevel('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            level === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-900'
          }`}
        >
          All 100
        </button>
        {TOUGH_LEVELS.map((l) => (
          <button
            key={l.level}
            type="button"
            onClick={() => setLevel(l.level)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              level === l.level ? 'bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-900'
            }`}
          >
            L{l.level}
          </button>
        ))}
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter by title, concept, or #…"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
      />

      {level !== 'priority' && level !== 'all' && (
        <p className="text-sm text-slate-500">
          {TOUGH_LEVELS.find((l) => l.level === level)?.title} — {TOUGH_LEVELS.find((l) => l.level === level)?.focus}
        </p>
      )}

      <p className="text-xs text-slate-500">
        Showing {visible.length} problem{visible.length === 1 ? '' : 's'}
      </p>

      <div className="space-y-2">
        {visible.map((p) => (
          <ProblemCard key={p.n} p={p} />
        ))}
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Senior preparation progression</h3>
        <pre className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-[12px] leading-5 text-slate-100 dark:border-slate-800">
          {SENIOR_PROGRESSION}
        </pre>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Interviewer follow-ups (answer after every solution)
        </h3>
        <div className="mt-3 space-y-2">
          {INTERVIEWER_FOLLOWUPS.map((f) => (
            <details key={f.q} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
              <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white">{f.q}</summary>
              <p className="mt-2 text-slate-600 dark:text-slate-300">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
