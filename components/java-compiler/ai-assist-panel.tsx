'use client';

import {useState} from 'react';
import type {AiActionId,AiSuggestion} from '@/lib/java-compiler-ai';

const ACTIONS:{id:AiActionId;label:string}[]=[
  {id:'explain',label:'Explain Code'},
  {id:'fix',label:'Fix Error'},
  {id:'optimize',label:'Optimize Code'},
  {id:'generate',label:'Generate Code'},
  {id:'test',label:'Generate Unit Test'},
  {id:'refactor',label:'Refactor Code'},
];

type Props={
  onAction:(id:AiActionId)=>void;
  suggestion:AiSuggestion|null;
  onApply:()=>void;
  onDismiss:()=>void;
  busy?:boolean;
};

export default function AiAssistPanel({onAction,suggestion,onApply,onDismiss,busy}:Props){
  const [copied,setCopied]=useState(false);

  async function copyPrompt(){
    if(!suggestion) return;
    await navigator.clipboard.writeText(suggestion.cursorPrompt);
    setCopied(true);
    window.setTimeout(()=>setCopied(false),1200);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500">Cursor / AI Assist</div>
          <p className="mt-1 text-xs text-slate-500">Suggestions are reviewed before apply. Nothing overwrites your code automatically.</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {ACTIONS.map((a)=>(
          <button
            key={a.id}
            type="button"
            disabled={busy}
            onClick={()=>onAction(a.id)}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            {a.label}
          </button>
        ))}
      </div>

      {suggestion && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">{suggestion.title} — review</div>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{suggestion.summary}</p>
          <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-white/80 p-2 font-mono text-[11px] text-slate-700 dark:bg-slate-950 dark:text-slate-300">
{suggestion.proposedFiles.map((f)=>`// ${f.path}\n${f.content}`).join('\n\n---\n\n').slice(0,2500)}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onApply}
              className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
            >
              Apply changes
            </button>
            <button
              type="button"
              onClick={copyPrompt}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white dark:border-slate-600 dark:text-slate-200"
            >
              {copied?'Copied':'Copy prompt for Cursor'}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
