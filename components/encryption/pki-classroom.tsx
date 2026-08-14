'use client';

import {useMemo, useState} from 'react';
import Mermaid from '@/components/mermaid';
import {
  PKI_DEFINITION,
  PKI_JOBS,
  PKI_MAP_MERMAID,
  PKI_PIECES,
  PKI_PILLARS,
  PKI_SENTENCE,
  PKI_X509_FIELDS,
  type PkiPieceId,
} from '@/lib/encryption/pki';
import CodePanel from './code-panel';

type Tab = 'internals' | 'code' | 'proscons' | 'remember';

const TABS: [Tab, string][] = [
  ['internals', 'How it works'],
  ['code', 'Java / Spring'],
  ['proscons', 'Pros / cons'],
  ['remember', 'Remember'],
];

export default function PkiClassroom() {
  const [id, setId] = useState<PkiPieceId>('framework');
  const [tab, setTab] = useState<Tab>('internals');
  const piece = useMemo(() => PKI_PIECES.find((p) => p.id === id) ?? PKI_PIECES[0], [id]);

  function select(next: PkiPieceId) {
    setId(next);
    setTab('internals');
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">{PKI_SENTENCE}</div>
      <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{PKI_DEFINITION}</p>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <Mermaid chart={PKI_MAP_MERMAID} />
      </div>

      <div>
        <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Building blocks</div>
        <div className="mt-2 grid gap-3 md:grid-cols-4">
          {PKI_PILLARS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => select(p.id)}
              className={`rounded-2xl border px-3 py-3 text-left transition ${
                id === p.id
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-white'
                  : 'border-slate-200 bg-white hover:border-slate-400 dark:border-slate-800 dark:bg-slate-950'
              }`}
            >
              <div className="text-sm font-bold">{p.title}</div>
              <div className={`mt-1 text-xs leading-5 ${id === p.id ? 'text-slate-200' : 'text-slate-500'}`}>{p.job}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">What PKI enables</div>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PKI_JOBS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => select(p.id)}
              className={`rounded-2xl border px-3 py-3 text-left transition ${
                id === p.id
                  ? 'border-emerald-800 bg-emerald-800 text-white'
                  : 'border-slate-200 bg-white hover:border-slate-400 dark:border-slate-800 dark:bg-slate-950'
              }`}
            >
              <div className="text-sm font-bold">{p.title}</div>
              <div className={`mt-1 text-xs leading-5 ${id === p.id ? 'text-emerald-100' : 'text-slate-500'}`}>{p.job}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PKI_PIECES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => select(p.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              piece.id === p.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-500">{piece.famousAs}</div>
            <h3 className="mt-1 text-2xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{piece.name}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">{piece.oneLiner}</p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            Lab · {piece.labClass}
          </span>
        </div>
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
          <span className="font-semibold">Analogy: </span>
          {piece.analogy}
        </p>

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
          {tab === 'internals' && (
            <div className="space-y-4">
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {piece.internals.map((step) => (
                  <li key={step.slice(0, 56)}>{step}</li>
                ))}
              </ol>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <Mermaid chart={piece.mermaid} />
              </div>
            </div>
          )}
          {tab === 'code' && <CodePanel title={piece.javaTitle} code={piece.java} tone="ok" language="java" />}
          {tab === 'proscons' && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-emerald-800 dark:text-emerald-200">Pros</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-emerald-950 dark:text-emerald-100">
                  {piece.pros.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-rose-800 dark:text-rose-200">Cons</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-rose-950 dark:text-rose-100">
                  {piece.cons.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">Use when: </span>
                {piece.useWhen}
              </p>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">Avoid when: </span>
                {piece.avoidWhen}
              </p>
            </div>
          )}
          {tab === 'remember' && (
            <div className="space-y-3">
              <p className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">{piece.memory}</p>
              <p className="rounded-xl border border-slate-200 px-4 py-3 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:text-slate-300">
                <span className="font-semibold">Interview: </span>
                {piece.interview}
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">X.509 fields — what to actually look at</div>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-3 py-2 text-left">Field</th>
                <th className="px-3 py-2 text-left">Meaning</th>
                <th className="px-3 py-2 text-left">Interview note</th>
              </tr>
            </thead>
            <tbody>
              {PKI_X509_FIELDS.map((row) => (
                <tr key={row.field} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-3 py-2 font-semibold">{row.field}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.meaning}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.interview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
