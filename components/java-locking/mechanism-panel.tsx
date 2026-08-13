'use client';

import {useState} from 'react';
import Mermaid from '@/components/mermaid';
import type {Mechanism} from '@/lib/java-locking/types';
import CodePanel from './code-panel';

type Tab='problem'|'code'|'diagram'|'interview';

export default function MechanismPanel({m}:{m:Mechanism}){
  const [tab,setTab]=useState<Tab>('problem');
  const [open,setOpen]=useState(true);

  return (
    <section id={m.id} className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <button
        type="button"
        onClick={()=>setOpen((o)=>!o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">{m.name}</h2>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              {m.since}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{m.problemTitle}</p>
        </div>
        <span className="text-slate-400">{open?'−':'+'}</span>
      </button>

      {open && (
        <div className="space-y-5 border-t border-slate-200 px-5 py-5 dark:border-slate-800">
          <div className="flex flex-wrap gap-2">
            {([
              ['problem','Problem'],
              ['code','Code'],
              ['diagram','Diagram'],
              ['interview','Interview'],
            ] as const).map(([id,label])=>(
              <button
                key={id}
                type="button"
                onClick={()=>setTab(id)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                  tab===id?'bg-blue-600 text-white':'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab==='problem' && (
            <div className="space-y-4">
              <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">{m.problem}</p>
              <CodePanel title="Broken code" code={m.brokenCode} tone="danger"/>
              <pre className="overflow-x-auto rounded-xl bg-rose-50 p-4 text-xs leading-5 text-rose-950 dark:bg-rose-950/40 dark:text-rose-100">
                {m.bugTrace}
              </pre>
              <div className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-bold text-white">{m.bugLabel}</div>
            </div>
          )}

          {tab==='code' && (
            <div className="space-y-4">
              <CodePanel title="Fixed / runnable" code={m.fixedCode} tone="ok"/>
              <pre className="overflow-x-auto rounded-xl bg-emerald-50 p-4 text-xs leading-5 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100">
                {m.fixTrace}
              </pre>
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Expected output</div>
                <pre className="mt-2 overflow-x-auto text-xs leading-5 text-slate-700 dark:text-slate-300">{m.expectedOutput}</pre>
                {m.outputNote && <p className="mt-2 text-sm text-slate-500">{m.outputNote}</p>}
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500 dark:bg-slate-900">
                    <tr>
                      <th className="px-4 py-2 text-left">Without lock</th>
                      <th className="px-4 py-2 text-left">With fix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.beforeAfter.map((r)=>(
                      <tr key={r.without} className="border-t border-slate-200 dark:border-slate-800">
                        <td className="px-4 py-2 text-rose-700 dark:text-rose-300">{r.without}</td>
                        <td className="px-4 py-2 text-emerald-700 dark:text-emerald-300">{r.with}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">Why it works: </span>{m.whyFixWorks}
              </p>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">When NOT: </span>{m.whenNot}
              </p>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">Alternative: </span>{m.alternative}
              </p>
            </div>
          )}

          {tab==='diagram' && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <Mermaid chart={m.mermaid}/>
              </div>
              {m.tabs?.internals && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                  <strong>Internals: </strong>{m.tabs.internals}
                </div>
              )}
              {m.tabs?.production && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
                  <strong>Production tip: </strong>{m.tabs.production}
                </div>
              )}
            </div>
          )}

          {tab==='interview' && (
            <div className="space-y-3 text-sm leading-7">
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">30-second answer</div>
                <p className="mt-2 text-slate-700 dark:text-slate-300">{m.interview30s}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Senior follow-up</div>
                <p className="mt-2 text-slate-700 dark:text-slate-300">{m.seniorFollowUp}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Production follow-up</div>
                <p className="mt-2 text-slate-700 dark:text-slate-300">{m.productionFollowUp}</p>
              </div>
              <div className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                Remember: {m.memoryTrick}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
