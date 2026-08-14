'use client';

import {useMemo, useState} from 'react';
import Mermaid from '@/components/mermaid';
import {
  BANNED_ALGORITHMS,
  FAMOUS_ALGORITHMS,
  FIVE_ROOMS,
  FIVE_ROOMS_SENTENCE,
  ROOM_MAP_MERMAID,
  type AlgoCategoryId,
} from '@/lib/encryption/famous-algorithms';
import CodePanel from './code-panel';

type Tab = 'internals' | 'code' | 'proscons' | 'remember';

const TABS: [Tab, string][] = [
  ['internals', 'How it works'],
  ['code', 'Java code'],
  ['proscons', 'Pros / cons'],
  ['remember', 'Remember'],
];

export default function AlgorithmClassroom() {
  const [room, setRoom] = useState<AlgoCategoryId | 'all'>('all');
  const [id, setId] = useState(FAMOUS_ALGORITHMS[0].id);
  const [tab, setTab] = useState<Tab>('internals');

  const visible = useMemo(
    () => (room === 'all' ? FAMOUS_ALGORITHMS : FAMOUS_ALGORITHMS.filter((a) => a.category === room)),
    [room],
  );
  const algo = visible.find((a) => a.id === id) ?? visible[0] ?? FAMOUS_ALGORITHMS[0];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
        {FIVE_ROOMS_SENTENCE}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <Mermaid chart={ROOM_MAP_MERMAID} />
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {FIVE_ROOMS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => {
              setRoom(r.id);
              const first = FAMOUS_ALGORITHMS.find((a) => a.category === r.id);
              if (first) setId(first.id);
              setTab('internals');
            }}
            className={`rounded-2xl border px-3 py-3 text-left transition ${
              room === r.id
                ? 'border-slate-900 bg-slate-900 text-white dark:border-white'
                : 'border-slate-200 bg-white hover:border-slate-400 dark:border-slate-800 dark:bg-slate-950'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-[.14em] opacity-70">{r.room}</div>
            <div className="mt-1 text-sm font-bold">{r.job}</div>
            <div className={`mt-1 text-xs leading-5 ${room === r.id ? 'text-slate-200' : 'text-slate-500'}`}>
              {r.defaultAlgo}
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setRoom('all');
            setId(FAMOUS_ALGORITHMS[0].id);
            setTab('internals');
          }}
          className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
            room === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          All 11 famous
        </button>
        {visible.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => {
              setId(a.id);
              setTab('internals');
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              algo.id === a.id
                ? 'bg-emerald-800 text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {a.name}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-500">
              {FIVE_ROOMS.find((r) => r.id === algo.category)?.room} · {algo.famousAs}
            </div>
            <h3 className="mt-1 text-2xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{algo.name}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">{algo.oneLiner}</p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            Lab · {algo.labClass}
          </span>
        </div>
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
          <span className="font-semibold">Analogy: </span>
          {algo.analogy}
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
                {algo.internals.map((step) => (
                  <li key={step.slice(0, 48)}>{step}</li>
                ))}
              </ol>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <Mermaid chart={algo.mermaid} />
              </div>
            </div>
          )}

          {tab === 'code' && <CodePanel title={algo.javaTitle} code={algo.java} tone="ok" language="java" />}

          {tab === 'proscons' && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-emerald-800 dark:text-emerald-200">
                  Pros
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-emerald-950 dark:text-emerald-100">
                  {algo.pros.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-rose-800 dark:text-rose-200">
                  Cons
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-rose-950 dark:text-rose-100">
                  {algo.cons.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">Use when: </span>
                {algo.useWhen}
              </p>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">Avoid when: </span>
                {algo.avoidWhen}
              </p>
            </div>
          )}

          {tab === 'remember' && (
            <div className="space-y-3">
              <p className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">{algo.memory}</p>
              <p className="rounded-xl border border-slate-200 px-4 py-3 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:text-slate-300">
                <span className="font-semibold">Interview: </span>
                {algo.interview}
              </p>
              <p className="text-sm leading-7 text-slate-500">{FIVE_ROOMS.find((r) => r.id === algo.category)?.remember}</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Banned — do not memorize as options</div>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-3 py-2 text-left">Do not use</th>
                <th className="px-3 py-2 text-left">Why it is famous for the wrong reason</th>
                <th className="px-3 py-2 text-left">Use instead</th>
              </tr>
            </thead>
            <tbody>
              {BANNED_ALGORITHMS.map((row) => (
                <tr key={row.item} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-3 py-2 font-semibold">{row.item}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.why}</td>
                  <td className="px-3 py-2 font-semibold text-emerald-800 dark:text-emerald-300">{row.useInstead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
