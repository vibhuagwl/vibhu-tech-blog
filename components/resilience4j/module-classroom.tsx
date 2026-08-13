'use client';

import {useState} from 'react';
import Mermaid from '@/components/mermaid';
import {MODULES_DEEP} from '@/lib/resilience4j/module-deep';
import CodePanel from './code-panel';

type Sub = 'simple' | 'types' | 'flow' | 'code';

export default function ModuleClassroom() {
  const [id, setId] = useState(MODULES_DEEP[0].id);
  const [sub, setSub] = useState<Sub>('simple');
  const m = MODULES_DEEP.find((x) => x.id === id) ?? MODULES_DEEP[0];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <Mermaid
          chart={`flowchart TB
  R4J[Resilience4j]
  R4J --> CB[CircuitBreaker]
  R4J --> RT[Retry]
  R4J --> RL[RateLimiter]
  R4J --> BH[Bulkhead]
  R4J --> TL[TimeLimiter]
  R4J --> CA[Cache]
  R4J --> MI[Micrometer]`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {MODULES_DEEP.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => {
              setId(x.id);
              setSub('simple');
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              id === x.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {x.emoji} {x.title}
          </button>
        ))}
      </div>

      <p className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">{m.analogy}</p>
      <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
        <span className="font-semibold text-slate-900 dark:text-white">In one line: </span>
        {m.oneLiner}
      </p>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['simple', 'Explain'],
            ['types', 'Types'],
            ['flow', 'Sequence'],
            ['code', 'YAML + Java'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setSub(k)}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              sub === k ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {sub === 'simple' && (
        <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          <p>{m.simple}</p>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Where you use it</div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {m.uses.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </div>
          <p>
            <span className="font-semibold text-slate-900 dark:text-white">With other modules: </span>
            {m.together}
          </p>
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
            <span className="font-semibold">Mistake: </span>
            {m.mistake}
          </p>
          <p className="rounded-xl bg-slate-900 px-4 py-3 text-white">
            <span className="font-semibold">Interview: </span>
            {m.interview}
          </p>
        </div>
      )}

      {sub === 'types' && (
        <div className="grid gap-3 md:grid-cols-2">
          {m.types.map((t) => (
            <div key={t.name} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</div>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                <span className="font-semibold text-slate-700 dark:text-slate-300">When: </span>
                {t.when}
              </p>
              <p className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-300">
                <span className="font-semibold">How: </span>
                {t.how}
              </p>
            </div>
          ))}
        </div>
      )}

      {sub === 'flow' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <Mermaid chart={m.mermaid} />
        </div>
      )}

      {sub === 'code' && (
        <div className="space-y-3">
          <CodePanel title={`${m.title} — YAML`} code={m.yaml} />
          <CodePanel title={`${m.title} — Java (lab)`} code={m.java} tone="ok" />
        </div>
      )}
    </div>
  );
}
