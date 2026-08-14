'use client';

import {useMemo, useState} from 'react';
import type {DsaProblem} from '@/lib/dsa/types';
import CodePanel from './code-panel';

type Tab = 'statement' | 'idea' | 'code' | 'remember';

const TABS: [Tab, string][] = [
  ['statement', 'Problem'],
  ['idea', 'How it works'],
  ['code', 'Java'],
  ['remember', 'Remember'],
];

export default function ProblemClassroom({
  problems,
  allLabel,
}: {
  problems: DsaProblem[];
  allLabel: string;
}) {
  const patterns = useMemo(() => {
    const set = new Set(problems.map((p) => p.pattern));
    return ['all', ...set];
  }, [problems]);
  const [pattern, setPattern] = useState('all');
  const [id, setId] = useState(problems[0]?.id ?? '');
  const [tab, setTab] = useState<Tab>('statement');

  const visible = pattern === 'all' ? problems : problems.filter((p) => p.pattern === pattern);
  const p = visible.find((x) => x.id === id) ?? visible[0] ?? problems[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {patterns.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              setPattern(name);
              const next = name === 'all' ? problems[0] : problems.find((x) => x.pattern === name);
              if (next) setId(next.id);
              setTab('statement');
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              pattern === name
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {name === 'all' ? allLabel : name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {visible.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setId(item.id);
              setTab('statement');
            }}
            className={`rounded-md px-3 py-1.5 text-left text-xs font-semibold ${
              p.id === item.id
                ? 'bg-emerald-800 text-white'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {item.lc !== '—' ? `${item.lc} · ` : ''}
            {item.title}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-500">
              {p.pattern} · LC {p.lc}
            </div>
            <h3 className="mt-1 text-2xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{p.title}</h3>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {p.difficulty}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                tab === k ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {tab === 'statement' && (
            <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p>{p.statement}</p>
              <p className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                <span className="font-semibold text-slate-900 dark:text-white">Example: </span>
                {p.example}
              </p>
            </div>
          )}
          {tab === 'idea' && (
            <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p>{p.idea}</p>
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">Time: </span>
                {p.time}
              </p>
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">Space: </span>
                {p.space}
              </p>
              <ul className="list-disc space-y-1 pl-5">
                {p.pitfalls.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          )}
          {tab === 'code' && <CodePanel title={`${p.title} — Java`} code={p.java} tone="ok" language="java" />}
          {tab === 'remember' && (
            <p className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">{p.remember}</p>
          )}
        </div>
      </div>
    </div>
  );
}
