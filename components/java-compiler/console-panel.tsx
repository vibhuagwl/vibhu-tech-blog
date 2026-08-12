'use client';

import {useEffect,useRef} from 'react';

export type ConsoleLine={
  id:string;
  kind:'stdout'|'stderr'|'system'|'success'|'error';
  text:string;
};

const KIND_CLASS:Record<ConsoleLine['kind'],string>={
  stdout:'text-slate-800 dark:text-slate-100',
  stderr:'text-rose-700 dark:text-rose-300',
  system:'text-slate-500',
  success:'text-emerald-700 dark:text-emerald-300',
  error:'text-rose-700 dark:text-rose-300',
};

export default function ConsolePanel({lines}:{lines:ConsoleLine[]}){
  const endRef=useRef<HTMLDivElement|null>(null);

  useEffect(()=>{
    endRef.current?.scrollIntoView({behavior:'smooth',block:'end'});
  },[lines]);

  return (
    <section className="flex h-full min-h-[160px] flex-col rounded-xl border border-slate-200 bg-[#0b1220] text-slate-100 dark:border-slate-800">
      <div className="border-b border-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[.12em] text-slate-400">
        Console
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 py-2 font-mono text-[12.5px] leading-5">
        {lines.length===0?(
          <div className="text-slate-500">Output will appear here after Compile / Run.</div>
        ):(
          lines.map((line)=>(
            <div key={line.id} className={`whitespace-pre-wrap break-words ${KIND_CLASS[line.kind]}`}>
              {line.text}
            </div>
          ))
        )}
        <div ref={endRef}/>
      </div>
    </section>
  );
}
