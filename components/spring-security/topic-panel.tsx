'use client';

import {useState} from 'react';
import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import CodePanel from '@/components/hub-code-panel';
import type {SecTopic} from '@/lib/spring-security/types';

type Tab = 'what' | 'flow' | 'code' | 'verify' | 'interview';

export default function TopicPanel({t}: {t: SecTopic}) {
  const [tab, setTab] = useState<Tab>('code');
  const [open, setOpen] = useState(false);

  return (
    <section id={t.id} className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">{t.title}</h2>
            {t.badge && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {t.badge}
              </span>
            )}
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              {t.category}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{t.what.split('\n')[0]}</p>
        </div>
        <span className="shrink-0 text-slate-400">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['code', 'Code / config'],
                ['flow', 'Diagram'],
                ['what', 'What (short)'],
                ['verify', 'Test / verify'],
                ['interview', 'Interview'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                  tab === id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
            {t.labHref && (
              <Link
                href={t.labHref}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700"
              >
                Open lab →
              </Link>
            )}
          </div>

          {tab === 'what' && (
            <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p className="whitespace-pre-wrap">{t.what}</p>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
                <strong>Pitfalls:</strong> {t.pitfalls}
              </div>
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <strong>Production:</strong> {t.production}
              </div>
            </div>
          )}

          {tab === 'flow' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={t.mermaid} />
            </div>
          )}

          {tab === 'code' && <CodePanel title={`${t.title} — implementation`} code={t.code} tone="ok" />}

          {tab === 'verify' && (
            <div className="space-y-3">
              {t.verify ? (
                <CodePanel title="Run / verify" code={t.verify} tone="neutral" />
              ) : (
                <p className="text-sm text-slate-500">See Code tab for runnable commands.</p>
              )}
            </div>
          )}

          {tab === 'interview' && (
            <div className="space-y-3 text-sm leading-7">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-emerald-800 dark:text-emerald-200">
                  30-second answer
                </div>
                <p className="mt-2 text-slate-800 dark:text-slate-200">{t.interview30s}</p>
              </div>
              {t.interview2m && (
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">2-minute deep-dive</div>
                  <p className="mt-2 text-slate-700 dark:text-slate-300">{t.interview2m}</p>
                </div>
              )}
              {t.traps && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                  <strong>Interview traps:</strong> {t.traps}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
