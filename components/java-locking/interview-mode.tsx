'use client';

import {useState} from 'react';
import {INTERVIEW_QUESTIONS} from '@/lib/java-locking/interview';
import HighlightedCode from '@/components/highlighted-code';

export default function InterviewMode(){
  const [idx,setIdx]=useState(0);
  const [revealed,setRevealed]=useState(false);
  const q=INTERVIEW_QUESTIONS[idx];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">
        Java Locking — 25+ Years Interview · {idx+1}/{INTERVIEW_QUESTIONS.length}
      </div>
      <p className="mt-3 text-lg font-semibold leading-8 text-slate-900 dark:text-white">{q.question}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={()=>setRevealed(true)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          Reveal
        </button>
        <button
          type="button"
          onClick={()=>{setIdx((i)=>(i+1)%INTERVIEW_QUESTIONS.length);setRevealed(false);}}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
        >
          Next
        </button>
      </div>
      {revealed && (
        <div className="mt-5 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">30-second</div>
            <p className="mt-2">{q.short}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Detailed</div>
            <p className="mt-2">{q.detailed}</p>
          </div>
          {q.code && (
            <div className="overflow-hidden rounded-xl bg-slate-950">
              <HighlightedCode code={q.code} language="java" className="p-4 text-xs"/>
            </div>
          )}
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
            <strong>Common mistake: </strong>{q.mistake}
          </div>
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Senior follow-up</div>
            <p className="mt-2">{q.followUp}</p>
          </div>
        </div>
      )}
    </div>
  );
}
