'use client';

import {useDeferredValue, useMemo, useState} from 'react';
import type {PropertyRow} from '@/lib/kafka-properties/types';

const IMP_ORDER = ['high', 'medium', 'low'] as const;

function ImportanceChip({value}: {value: string}) {
  const v = value.toLowerCase();
  const cls =
    v === 'high'
      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
      : v === 'medium'
        ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[.08em] ${cls}`}>
      {v}
    </span>
  );
}

export default function PropertyCatalog({
  rows,
  docsUrl,
  label,
}: {
  rows: PropertyRow[];
  docsUrl: string;
  label: string;
}) {
  const [q, setQ] = useState('');
  const [imp, setImp] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const deferredQ = useDeferredValue(q);

  const filtered = useMemo(() => {
    const needle = deferredQ.trim().toLowerCase();
    return rows.filter((r) => {
      if (imp !== 'all' && r.importance.toLowerCase() !== imp) return false;
      if (!needle) return true;
      return (
        r.name.toLowerCase().includes(needle) ||
        r.purpose.toLowerCase().includes(needle) ||
        r.defaultValue.toLowerCase().includes(needle)
      );
    });
  }, [rows, deferredQ, imp]);

  const counts = useMemo(() => {
    const c = {all: rows.length, high: 0, medium: 0, low: 0};
    for (const r of rows) {
      const k = r.importance.toLowerCase();
      if (k === 'high' || k === 'medium' || k === 'low') c[k]++;
    }
    return c;
  }, [rows]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {label}: <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> of{' '}
          {rows.length} shown ·{' '}
          <a href={docsUrl} target="_blank" rel="noreferrer" className="font-semibold text-slate-700 underline-offset-2 hover:underline dark:text-slate-300">
            Official docs
          </a>
        </p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search property name or purpose…"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-slate-400 focus:ring-2 sm:max-w-sm dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(['all', ...IMP_ORDER] as const).map((key) => {
          const active = imp === key;
          const n = key === 'all' ? counts.all : counts[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setImp(key)}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                active
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300',
              ].join(' ')}
            >
              {key} ({n})
            </button>
          );
        })}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="max-h-[32rem] overflow-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] uppercase tracking-[.1em] text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Property</th>
                <th className="px-3 py-2.5 font-semibold">Default</th>
                <th className="px-3 py-2.5 font-semibold">Imp.</th>
                <th className="px-3 py-2.5 font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.name} className="border-t border-slate-100 align-top dark:border-slate-800">
                  <td className="px-3 py-2.5">
                    <code className="font-mono text-[11px] font-semibold text-slate-900 dark:text-slate-100">{r.name}</code>
                    <div className="mt-0.5 text-[10px] uppercase tracking-[.08em] text-slate-400">{r.type}</div>
                  </td>
                  <td className="max-w-[10rem] px-3 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {r.defaultValue}
                  </td>
                  <td className="px-3 py-2.5">
                    <ImportanceChip value={r.importance} />
                  </td>
                  <td className="max-w-xl px-3 py-2.5 leading-5 text-slate-600 dark:text-slate-300">
                    {r.purpose}
                    {r.incomplete ? (
                      <span className="ml-1 text-slate-400">
                        ·{' '}
                        <a href={docsUrl} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
                          full text
                        </a>
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-sm text-slate-500">
                    No properties match this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
