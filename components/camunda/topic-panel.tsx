'use client';

import {useState} from 'react';
import Mermaid from '@/components/mermaid';
import type {CamundaTopic} from '@/lib/camunda/types';
import CodePanel from './code-panel';

type Tab = 'theory' | 'flow' | 'code' | 'bpmn' | 'production' | 'interview';

export default function TopicPanel({t}: {t: CamundaTopic}) {
  const [tab, setTab] = useState<Tab>('theory');
  const [open, setOpen] = useState(true);

  return (
    <section id={t.id} className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">{t.title}</h2>
            {t.badge && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {t.badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">{t.theory}</p>
        </div>
        <span className="text-slate-400">{open ? '-' : '+'}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['theory', 'Theory'],
                ['flow', 'Flow'],
                ['code', 'Java'],
                ['bpmn', 'BPMN'],
                ['production', 'Prod'],
                ['interview', 'Interview'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                  tab === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'theory' && (
            <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">When: </span>
                {t.whenToUse}
              </p>
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">When NOT: </span>
                {t.whenAvoid}
              </p>
              <div className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                Remember: {t.memoryTrick}
              </div>
            </div>
          )}

          {tab === 'flow' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={t.mermaid} />
            </div>
          )}

          {tab === 'code' && <CodePanel title="Production Java / Spring sketch" code={t.code} tone="ok" />}

          {tab === 'bpmn' && <CodePanel title="BPMN sketch / payment-process.bpmn" code={t.bpmn} tone="neutral" />}

          {tab === 'production' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-7 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                {t.production}
              </div>
              <ul className="grid gap-2 md:grid-cols-3">
                {t.mistakes.map((m) => (
                  <li key={m} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
                    Avoid: {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === 'interview' && (
            <div className="space-y-3 text-sm leading-7">
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">30-second</div>
                <p className="mt-2 text-slate-700 dark:text-slate-300">{t.interview30s}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Follow-up</div>
                <p className="mt-2 text-slate-700 dark:text-slate-300">{t.followUp}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
