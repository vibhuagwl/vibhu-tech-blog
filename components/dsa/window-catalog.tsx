'use client';

import {useMemo, useState} from 'react';
import type {DsaApproach, DsaDifficulty, DsaProblem} from '@/lib/dsa/types';
import {WINDOW_FAMILIES, familyForProblem} from '@/lib/dsa/window-families';
import {approachesFor} from '@/lib/dsa/window-approaches';
import CodePanel from './code-panel';

type Tab = 'statement' | 'approaches' | 'code' | 'remember';

const TABS: [Tab, string][] = [
  ['statement', 'Problem'],
  ['approaches', 'Brute → Optimized'],
  ['code', 'Java'],
  ['remember', 'Remember'],
];

const DIFFS: ('all' | DsaDifficulty)[] = ['all', 'Easy', 'Medium', 'Hard'];

function matchesQuery(p: DsaProblem, q: string) {
  if (!q) return true;
  const hay = `${p.lc} ${p.title} ${p.pattern} ${p.remember}`.toLowerCase();
  return hay.includes(q);
}

function ApproachCard({approach, openDefault}: {approach: DsaApproach; openDefault: boolean}) {
  const [open, setOpen] = useState(openDefault);
  const tone =
    approach.name === 'Optimized'
      ? 'border-emerald-300 dark:border-emerald-800'
      : approach.name === 'Better'
        ? 'border-sky-200 dark:border-sky-900'
        : 'border-slate-200 dark:border-slate-800';
  return (
    <article className={`rounded-2xl border ${tone} bg-white dark:bg-slate-950`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-500">{approach.name}</div>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
            Time {approach.time} · Space {approach.space}
          </p>
        </div>
        <span className="text-slate-400">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-slate-200 px-4 py-3 text-sm leading-7 text-slate-600 dark:border-slate-800 dark:text-slate-300">
          <p>{approach.idea}</p>
          <p className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
            <span className="font-semibold text-slate-900 dark:text-white">Why this complexity: </span>
            {approach.why}
          </p>
          {approach.java && <CodePanel title={`${approach.name} — Java`} code={approach.java} tone={approach.name === 'Optimized' ? 'ok' : 'neutral'} language="java" />}
        </div>
      )}
    </article>
  );
}

export default function WindowCatalog({problems}: {problems: DsaProblem[]}) {
  const byId = useMemo(() => new Map(problems.map((p) => [p.id, p])), [problems]);
  const [query, setQuery] = useState('');
  const [diff, setDiff] = useState<'all' | DsaDifficulty>('all');
  const [id, setId] = useState(problems[0]?.id ?? '');
  const [tab, setTab] = useState<Tab>('approaches');
  const [openFamilies, setOpenFamilies] = useState<Set<string>>(() => {
    const fam = familyForProblem(problems[0]?.id ?? '');
    return new Set(fam ? [fam.id] : WINDOW_FAMILIES.slice(0, 1).map((f) => f.id));
  });

  const q = query.trim().toLowerCase();

  const families = useMemo(() => {
    return WINDOW_FAMILIES.map((family) => {
      const items = family.problemIds
        .map((pid) => byId.get(pid))
        .filter((p): p is DsaProblem => !!p)
        .filter((p) => (diff === 'all' || p.difficulty === diff) && matchesQuery(p, q));
      return {...family, items};
    }).filter((f) => f.items.length > 0);
  }, [byId, diff, q]);

  const visibleIds = families.flatMap((f) => f.items.map((p) => p.id));
  const selectedId = visibleIds.includes(id) ? id : (visibleIds[0] ?? problems[0]?.id);
  const selected = byId.get(selectedId) ?? problems[0];
  const selectedFamily = familyForProblem(selected.id);
  const approaches = approachesFor(selected.id, selected);
  const related = (selectedFamily?.problemIds ?? [])
    .map((pid) => byId.get(pid))
    .filter((p): p is DsaProblem => !!p && p.id !== selected.id);

  function select(nextId: string) {
    setId(nextId);
    setTab('approaches');
    const fam = familyForProblem(nextId);
    if (fam) {
      setOpenFamilies((prev) => new Set(prev).add(fam.id));
    }
  }

  function toggleFamily(fid: string) {
    setOpenFamilies((prev) => {
      const next = new Set(prev);
      if (next.has(fid)) next.delete(fid);
      else next.add(fid);
      return next;
    });
  }

  const searching = q.length > 0 || diff !== 'all';

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search LC number or title…"
          className="min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-emerald-600 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
        />
        <div className="flex flex-wrap gap-1">
          {DIFFS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDiff(d)}
              className={`rounded-md px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide ${
                diff === d ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {d === 'all' ? 'All' : d}
            </button>
          ))}
        </div>
        <p className="w-full text-xs text-slate-500 sm:ml-auto sm:w-auto">
          {visibleIds.length} of {problems.length} problems · {WINDOW_FAMILIES.length} families
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
        <nav aria-label="Sliding window families" className="max-h-[70vh] overflow-y-auto border-b border-slate-200 lg:border-b-0 lg:border-r dark:border-slate-800">
          {families.length === 0 && <p className="px-4 py-6 text-sm text-slate-500">No problems match that filter.</p>}
          {families.map((family) => {
            const open = searching || openFamilies.has(family.id);
            return (
              <div key={family.id} className="border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => toggleFamily(family.id)}
                  className="flex w-full items-start justify-between gap-2 px-4 py-3 text-left"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{family.title}</div>
                    <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{family.blurb}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    {family.items.length}
                  </span>
                </button>
                {open && (
                  <ul className="pb-2">
                    {family.items.map((item) => {
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => select(item.id)}
                            className={`flex w-full items-baseline justify-between gap-2 px-4 py-2 text-left text-sm ${
                              selected.id === item.id
                                ? 'bg-emerald-50 font-semibold text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100'
                                : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                            }`}
                          >
                            <span className="min-w-0">
                              <span className="mr-2 font-mono text-[11px] text-slate-400">{item.lc === '—' ? '—' : item.lc}</span>
                              {item.title}
                            </span>
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.difficulty[0]}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        <div className="min-w-0 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-500">
                {selectedFamily?.title ?? selected.pattern} · LC {selected.lc}
              </div>
              <h3 className="mt-1 text-2xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{selected.title}</h3>
              {selectedFamily && (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Family invariant: {selectedFamily.invariant}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {selected.difficulty}
              </span>
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                Best {selected.time}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                Space {selected.space}
              </span>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-4">
              <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">Same family</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {related.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => select(r.id)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:border-emerald-400 dark:border-slate-700 dark:text-slate-300"
                  >
                    {r.lc !== '—' ? `${r.lc} · ` : ''}
                    {r.title}
                  </button>
                ))}
              </div>
            </div>
          )}

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
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
                      <tr>
                        <th className="px-3 py-2 text-left">Approach</th>
                        <th className="px-3 py-2 text-left">Time</th>
                        <th className="px-3 py-2 text-left">Space</th>
                        <th className="px-3 py-2 text-left">When you use it</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approaches.map((a) => (
                        <tr key={a.name} className="border-t border-slate-200 dark:border-slate-800">
                          <td className="px-3 py-2 font-semibold">{a.name}</td>
                          <td className="px-3 py-2">{a.time}</td>
                          <td className="px-3 py-2">{a.space}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{a.why}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {approaches.map((a, i) => (
                  <ApproachCard key={a.name} approach={a} openDefault={i === approaches.length - 1 || approaches.length <= 2} />
                ))}
                {selected.pitfalls.length > 0 && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
                    <div className="text-[11px] font-bold uppercase tracking-[.12em]">Pitfalls</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {selected.pitfalls.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {tab === 'code' && <CodePanel title={`${selected.title} — optimized Java`} code={selected.java} tone="ok" language="java" />}

            {tab === 'remember' && (
              <p className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">{selected.remember}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
