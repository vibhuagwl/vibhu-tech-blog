'use client';

import {useMemo, useState} from 'react';
import type {StreamProblem} from '@/lib/java-streams/types';
import CodePanel from './code-panel';

export default function ProblemBrowser({problems}: {problems: StreamProblem[]}) {
  const [q, setQ] = useState('');
  const [diff, setDiff] = useState('All');
  const [selectedId, setSelectedId] = useState(problems[0]?.id ?? '');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return problems.filter((p) => {
      if (diff !== 'All' && p.difficulty !== diff) return false;
      if (!query) return true;
      return (
        p.title.toLowerCase().includes(query) ||
        p.problem.toLowerCase().includes(query) ||
        p.id.includes(query) ||
        (p.tags ?? []).some((t) => t.includes(query))
      );
    });
  }, [problems, q, diff]);

  const selected = filtered.find((p) => p.id === selectedId) ?? filtered[0] ?? problems[0];
  if (!selected) return null;

  const diffs = ['All', ...Array.from(new Set(problems.map((p) => p.difficulty)))];

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter problems…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
        />
        <select
          value={diff}
          onChange={(e) => setDiff(e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
        >
          {diffs.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
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
                <span className="block truncate">{p.title}</span>
                <span className="text-[10px] uppercase tracking-wide opacity-70">{p.difficulty}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-slate-400">
          {filtered.length}/{problems.length}
        </p>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-2xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{selected.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{selected.problem}</p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            {selected.difficulty}
          </span>
        </div>

        <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Input</p>
            <pre className="mt-1 overflow-x-auto rounded-xl bg-slate-950 p-3 text-[12px] text-slate-100">{selected.input}</pre>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Expected output</p>
            <pre className="mt-1 overflow-x-auto rounded-xl bg-slate-950 p-3 text-[12px] text-slate-100">{selected.output}</pre>
          </div>
          <CodePanel title="Solution (Java 21 style)" code={selected.solution} language="java" />
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Pipeline</p>
            <pre className="mt-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-[12px] dark:border-slate-800 dark:bg-slate-900">
              {selected.pipeline}
            </pre>
          </div>
          <p>
            <strong>Why:</strong> {selected.why}
          </p>
          <p>
            <strong>Time:</strong> {selected.timeComplexity} · <strong>Space:</strong> {selected.spaceComplexity}
          </p>
          {selected.alternative && (
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Alternative</p>
              <CodePanel title="Alternative" code={selected.alternative} language="java" />
            </div>
          )}
          <p className="text-rose-700 dark:text-rose-300">
            <strong>Interview trap:</strong> {selected.trap}
          </p>
          <p className="text-emerald-800 dark:text-emerald-300">
            <strong>Senior insight:</strong> {selected.senior}
          </p>
          {selected.javaSince && (
            <p className="text-xs text-slate-400">API notes: {selected.javaSince}</p>
          )}
        </div>
      </article>
    </div>
  );
}
