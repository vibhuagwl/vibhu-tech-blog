'use client';

import {useMemo, useState} from 'react';
import Mermaid from '@/components/mermaid';
import {DLQ_CORNER_CASES} from '@/lib/hadron-dlq/corner-cases';
import {CORNER_FAMILIES, type CornerDisposition, type CornerFamily} from '@/lib/hadron-dlq/corner-types';
import CodePanel from './code-panel';

const DISPOSITIONS: CornerDisposition[] = [
  'RETRY',
  'DLQ_NOW',
  'DLQ_AFTER_CAP',
  'PARK',
  'IGNORE',
  'CONFLICT',
];

function badgeClass(d: CornerDisposition) {
  switch (d) {
    case 'DLQ_NOW':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200';
    case 'DLQ_AFTER_CAP':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200';
    case 'RETRY':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200';
    case 'PARK':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200';
    case 'IGNORE':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200';
    case 'CONFLICT':
      return 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
  }
}

export default function CornerCaseCatalog() {
  const [family, setFamily] = useState<CornerFamily | 'ALL'>('ALL');
  const [disposition, setDisposition] = useState<CornerDisposition | 'ALL'>('ALL');
  const [openId, setOpenId] = useState<string>(DLQ_CORNER_CASES[0]?.id ?? '');

  const list = useMemo(() => {
    return DLQ_CORNER_CASES.filter((c) => {
      if (family !== 'ALL' && c.family !== family) return false;
      if (disposition !== 'ALL' && c.classify !== disposition) return false;
      return true;
    });
  }, [family, disposition]);

  const counts = useMemo(() => {
    const byFamily: Record<string, number> = {};
    for (const c of DLQ_CORNER_CASES) {
      byFamily[c.family] = (byFamily[c.family] ?? 0) + 1;
    }
    return byFamily;
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFamily('ALL')}
          className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
            family === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          All ({DLQ_CORNER_CASES.length})
        </button>
        {CORNER_FAMILIES.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFamily(f)}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              family === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {f} ({counts[f] ?? 0})
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDisposition('ALL')}
          className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
            disposition === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          Any decision
        </button>
        {DISPOSITIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDisposition(d)}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              disposition === d ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.map((c) => {
          const open = openId === c.id;
          return (
            <article
              key={c.id}
              id={`case-${c.id}`}
              className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? '' : c.id)}
                className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{c.title}</h3>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeClass(c.classify)}`}>
                      {c.classify}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      {c.family}
                    </span>
                    {c.holdCashLine && (
                      <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                        Hold CashLine
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{c.whatHappens}</p>
                </div>
                <span className="text-slate-400">{open ? '−' : '+'}</span>
              </button>
              {open && (
                <div className="space-y-4 border-t border-slate-200 px-5 py-4 text-sm leading-7 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-white">Symptom: </span>
                    {c.symptom}
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                      <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">Retry</div>
                      {c.retry}
                    </div>
                    <div className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                      <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">DLQ</div>
                      {c.dlq}
                    </div>
                    <div className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                      <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">Detection</div>
                      {c.detection}
                    </div>
                    <div className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                      <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">Recovery</div>
                      {c.recovery}
                    </div>
                    <div className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                      <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">Fallback</div>
                      {c.fallback}
                    </div>
                    <div className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                      <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">Alert</div>
                      {c.alert}
                    </div>
                    <div className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                      <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">Idempotency</div>
                      {c.idempotency}
                    </div>
                    {c.lab && (
                      <div className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                        <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">Lab</div>
                        <code className="text-xs">{c.lab}</code>
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <Mermaid chart={c.mermaid} />
                  </div>
                  <CodePanel title="Implementation" code={c.code} />
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-white">Interview: </span>
                    {c.interview}
                  </p>
                  <p className="text-rose-700 dark:text-rose-300">
                    <span className="font-semibold">Trap: </span>
                    {c.trap}
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {list.length === 0 && <p className="text-sm text-slate-500">No cases match this filter.</p>}
    </div>
  );
}
