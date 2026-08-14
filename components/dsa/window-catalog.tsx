'use client';

import {useMemo, useState} from 'react';
import type {DsaProblem} from '@/lib/dsa/types';
import {WINDOW_FAMILIES, familyForProblem} from '@/lib/dsa/window-families';
import {approachesFor} from '@/lib/dsa/window-approaches';
import CodePanel from './code-panel';

type Tab = 'statement' | 'approaches' | 'code' | 'remember';

const TABS: [Tab, string][] = [
  ['statement', 'Problem'],
  ['approaches', 'How it works'],
  ['code', 'Java'],
  ['remember', 'Remember'],
];

export default function WindowCatalog({problems}: {problems: DsaProblem[]}) {
  const byId = useMemo(() => new Map(problems.map((p) => [p.id, p])), [problems]);
  const [familyId, setFamilyId] = useState<string>('all');
  const [id, setId] = useState(problems[0]?.id ?? '');
  const [tab, setTab] = useState<Tab>('statement');

  const grouped = useMemo(() => {
    return WINDOW_FAMILIES.map((family) => ({
      family,
      items: family.problemIds.map((pid) => byId.get(pid)).filter((p): p is DsaProblem => !!p),
    })).filter((g) => g.items.length > 0);
  }, [byId]);

  const visibleGroups = familyId === 'all' ? grouped : grouped.filter((g) => g.family.id === familyId);
  const visible = visibleGroups.flatMap((g) => g.items);
  const selected = visible.find((x) => x.id === id) ?? visible[0] ?? problems[0];
  const selectedFamily = familyForProblem(selected.id);
  const approaches = approachesFor(selected.id, selected);

  function pickFamily(next: string) {
    setFamilyId(next);
    const first =
      next === 'all' ? problems[0] : grouped.find((g) => g.family.id === next)?.items[0];
    if (first) setId(first.id);
    setTab('statement');
  }

  function pickProblem(nextId: string) {
    setId(nextId);
    setTab('statement');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => pickFamily('all')}
          className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
            familyId === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          All {problems.length} windows
        </button>
        {WINDOW_FAMILIES.map((family) => (
          <button
            key={family.id}
            type="button"
            onClick={() => pickFamily(family.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              familyId === family.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {family.shortLabel}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {visibleGroups.map(({family, items}) => (
          <div key={family.id}>
            {familyId === 'all' && (
              <div className="mb-2">
                <div className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-500">
                  {family.shortLabel}
                  <span className="ml-2 font-semibold tracking-normal text-slate-400">
                    {items.length}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{family.blurb}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => pickProblem(item.id)}
                  className={`rounded-md px-3 py-1.5 text-left text-xs font-semibold ${
                    selected.id === item.id
                      ? 'bg-emerald-800 text-white'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  {item.lc !== '—' ? `${item.lc} · ` : ''}
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-500">
              {selectedFamily?.shortLabel ?? selected.pattern} · LC {selected.lc}
            </div>
            <h3 className="mt-1 text-2xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
              {selected.title}
            </h3>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {selected.difficulty}
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
              <p>{selected.statement}</p>
              <p className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                <span className="font-semibold text-slate-900 dark:text-white">Example: </span>
                {selected.example}
              </p>
            </div>
          )}

          {tab === 'approaches' && (
            <div className="space-y-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {selectedFamily && (
                <p className="text-slate-500">
                  <span className="font-semibold text-slate-900 dark:text-white">Family: </span>
                  {selectedFamily.title}. {selectedFamily.invariant}
                </p>
              )}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
                    <tr>
                      <th className="px-3 py-2 text-left">Approach</th>
                      <th className="px-3 py-2 text-left">Time</th>
                      <th className="px-3 py-2 text-left">Space</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approaches.map((a) => (
                      <tr key={a.name} className="border-t border-slate-200 dark:border-slate-800">
                        <td className="px-3 py-2 font-semibold">{a.name}</td>
                        <td className="px-3 py-2">{a.time}</td>
                        <td className="px-3 py-2">{a.space}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {approaches.map((a) => (
                <div key={a.name}>
                  <div className="font-semibold text-slate-900 dark:text-white">{a.name}</div>
                  <p className="mt-1">{a.idea}</p>
                  <p className="mt-1">
                    <span className="font-semibold text-slate-900 dark:text-white">Time: </span>
                    {a.time}
                    <span className="mx-2 text-slate-300">·</span>
                    <span className="font-semibold text-slate-900 dark:text-white">Space: </span>
                    {a.space}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold text-slate-900 dark:text-white">Why: </span>
                    {a.why}
                  </p>
                  {a.java && a.name !== 'Optimized' && (
                    <div className="mt-3">
                      <CodePanel title={`${a.name} — Java`} code={a.java} language="java" />
                    </div>
                  )}
                </div>
              ))}
              {selected.pitfalls.length > 0 && (
                <ul className="list-disc space-y-1 pl-5">
                  {selected.pitfalls.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === 'code' && <CodePanel title={`${selected.title} — Java`} code={selected.java} tone="ok" language="java" />}

          {tab === 'remember' && (
            <p className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
              {selected.remember}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
