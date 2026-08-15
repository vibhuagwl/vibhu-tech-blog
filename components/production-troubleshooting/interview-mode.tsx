'use client';

import {useMemo,useState} from 'react';
import {ALL,ARCHITECT,RAPID,SENIOR,STAFF} from '@/lib/production-troubleshooting/interview';

export default function InterviewMode(){
  const [mode,setMode]=useState<'senior'|'architect'|'staff'|'rapid'>('senior');
  const list=useMemo(()=>{
    if(mode==='architect') return ARCHITECT;
    if(mode==='staff') return STAFF;
    if(mode==='rapid') return RAPID;
    return SENIOR;
  },[mode]);
  const [idx,setIdx]=useState(0);
  const [revealed,setRevealed]=useState(false);
  const q=list[Math.min(idx,Math.max(list.length-1,0))];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap gap-2">
        {([
          ['senior',SENIOR.length],
          ['architect',ARCHITECT.length],
          ['staff',STAFF.length],
          ['rapid',RAPID.length],
        ] as const).map(([m,n])=>(
          <button key={m} type="button" onClick={()=>{setMode(m);setIdx(0);setRevealed(false);}}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase ${mode===m?'bg-slate-900 text-white':'bg-slate-100 dark:bg-slate-900'}`}>
            {m} ({n})
          </button>
        ))}
      </div>
      {q && (
        <>
          <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{q.question}</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={()=>setRevealed(true)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Reveal</button>
            <button type="button" onClick={()=>{setIdx((i)=>(i+1)%list.length);setRevealed(false);}} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">Next</button>
          </div>
          {revealed && (
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
              <p><strong>30s:</strong> {q.answer30s}</p>
              <p><strong>2m:</strong> {q.answer2m}</p>
              <p><strong>Follow-ups:</strong> {q.followUps.join(' · ')}</p>
              {q.trick && <p className="text-rose-700 dark:text-rose-300"><strong>Trap:</strong> {q.trick}</p>}
            </div>
          )}
          <p className="mt-3 text-xs text-slate-400">Bank: {ALL.length} prompts</p>
        </>
      )}
    </div>
  );
}
