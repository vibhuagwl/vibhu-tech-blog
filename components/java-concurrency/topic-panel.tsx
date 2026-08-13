'use client';

import {useState} from 'react';
import Mermaid from '@/components/mermaid';
import type {TopicCard} from '@/lib/java-concurrency/types';
import CodePanel from './code-panel';
import HighlightedCode from '@/components/highlighted-code';

type Tab='overview'|'code'|'execution'|'internals'|'interview';

export default function TopicPanel({t}:{t:TopicCard}){
  const [tab,setTab]=useState<Tab>('overview');
  const [open,setOpen]=useState(true);

  return (
    <section id={t.id} className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <button type="button" onClick={()=>setOpen((o)=>!o)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">{t.title}</h2>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">{t.since}</span>
            {t.status && (
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase ${
                t.status==='PREVIEW'?'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100':
                t.status==='FINAL'?'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100':
                'bg-slate-100 text-slate-700'
              }`}>{t.status}</span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">{t.story}</p>
        </div>
        <span className="text-slate-400">{open?'−':'+'}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex flex-wrap gap-2">
            {([
              ['overview','Overview'],
              ['code','Code'],
              ['execution','Execution'],
              ['internals','Internals'],
              ['interview','Interview'],
            ] as const).map(([id,label])=>(
              <button key={id} type="button" onClick={()=>setTab(id)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${tab===id?'bg-blue-600 text-white':'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`}>
                {label}
              </button>
            ))}
          </div>

          {tab==='overview' && (
            <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p><span className="font-semibold text-slate-900 dark:text-white">When: </span>{t.whenToUse}</p>
              <p><span className="font-semibold text-slate-900 dark:text-white">When NOT: </span>{t.whenAvoid}</p>
              <p><span className="font-semibold text-slate-900 dark:text-white">Production: </span>{t.production}</p>
              <div className="flex flex-wrap gap-2">
                {t.methods.map((m)=>(
                  <code key={m} className="rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-900">{m}</code>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <ul className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                  {t.pros.map((p)=><li key={p}>✅ {p}</li>)}
                </ul>
                <ul className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
                  {t.cons.map((c)=><li key={c}>⚠ {c}</li>)}
                </ul>
              </div>
            </div>
          )}

          {tab==='code' && (
            <div className="space-y-4">
              {t.brokenCode && <CodePanel title="Broken / anti-pattern" code={t.brokenCode} tone="danger"/>}
              <CodePanel title="Working program" code={t.fixedCode} tone="ok"/>
              <div className="overflow-hidden rounded-xl bg-slate-950">
                <HighlightedCode code={t.expectedOutput} language="plaintext" className="p-4 text-xs"/>
              </div>
            </div>
          )}

          {tab==='execution' && (
            <div className="space-y-4">
              <pre className="overflow-x-auto rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-700 dark:bg-slate-900 dark:text-slate-300">{t.timeline}</pre>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <Mermaid chart={t.mermaid}/>
              </div>
            </div>
          )}

          {tab==='internals' && (
            <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p>{t.internals}</p>
              <div className="overflow-hidden rounded-xl bg-slate-950">
                <HighlightedCode code={t.whatHappensInternally} language="java" className="p-4 text-xs"/>
              </div>
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
