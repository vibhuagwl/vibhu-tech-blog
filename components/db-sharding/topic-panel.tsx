'use client';

import {useState} from 'react';
import Mermaid from '@/components/mermaid';
import type {ShardTopic} from '@/lib/db-sharding/types';
import CodePanel from './code-panel';

type Tab='problem'|'flow'|'code'|'failure'|'interview';

export default function TopicPanel({t}:{t:ShardTopic}){
  const [tab,setTab]=useState<Tab>('problem');
  const [open,setOpen]=useState(true);

  return (
    <section id={t.id} className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <button type="button" onClick={()=>setOpen((o)=>!o)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">{t.title}</h2>
            {t.badge && (
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-blue-800 dark:bg-blue-950 dark:text-blue-100">
                {t.badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">{t.problem}</p>
        </div>
        <span className="text-slate-400">{open?'−':'+'}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex flex-wrap gap-2">
            {([
              ['problem','Problem'],
              ['flow','Flow'],
              ['code','Code'],
              ['failure','Failure'],
              ['interview','Interview'],
            ] as const).map(([id,label])=>(
              <button key={id} type="button" onClick={()=>setTab(id)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${tab===id?'bg-blue-600 text-white':'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`}>
                {label}
              </button>
            ))}
          </div>

          {tab==='problem' && (
            <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p><span className="font-semibold text-slate-900 dark:text-white">When: </span>{t.whenToUse}</p>
              <p><span className="font-semibold text-slate-900 dark:text-white">When NOT: </span>{t.whenAvoid}</p>
              <p><span className="font-semibold text-slate-900 dark:text-white">Production: </span>{t.production}</p>
              <p><span className="font-semibold text-slate-900 dark:text-white">Trade-off: </span>{t.tradeoff}</p>
            </div>
          )}

          {tab==='flow' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={t.mermaid}/>
            </div>
          )}

          {tab==='code' && <CodePanel title="Spring / Redis production sketch" code={t.code} tone="ok"/>}

          {tab==='failure' && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
              {t.failure}
            </div>
          )}

          {tab==='interview' && (
            <div className="space-y-3 text-sm leading-7">
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">30-second</div>
                <p className="mt-2 text-slate-700 dark:text-slate-300">{t.interview30s}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Follow-up</div>
                <p className="mt-2 text-slate-700 dark:text-slate-300">{t.followUp}</p>
              </div>
              <div className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Remember: {t.memoryTrick}</div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
