'use client';

import {useState} from 'react';
import {ChevronDown,ChevronUp,Eye,EyeOff} from 'lucide-react';

type PracticeItem={
  question:string;
  think:string;
  points:string[];
  followUps:string[];
};

export default function InterviewPractice({items}:{items:PracticeItem[]}){
  const [index,setIndex]=useState(0);
  const [revealed,setRevealed]=useState(false);
  const item=items[index];

  function go(delta:number){
    setRevealed(false);
    setIndex((i)=>(i+delta+items.length)%items.length);
  }

  return (
    <section className="practice-panel" aria-labelledby="practice-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Active recall</div>
          <h2 id="practice-heading" className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Interview practice
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Think first. Reveal expected discussion points only after you have an answer.
          </p>
        </div>
        <div className="text-sm font-medium text-slate-500">
          {index+1} / {items.length}
        </div>
      </div>

      <div className="interview-question mt-6">
        <div className="interview-question__label">Interview question</div>
        <p className="interview-question__text">{item.question}</p>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
        <span className="font-semibold text-slate-900 dark:text-white">Think about: </span>
        {item.think}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary"
          onClick={()=>setRevealed((v)=>!v)}
          aria-expanded={revealed}
        >
          {revealed?<><EyeOff size={16}/> Hide answer</>:<><Eye size={16}/> Reveal answer</>}
        </button>
        <button type="button" className="btn-secondary" onClick={()=>go(-1)}>
          <ChevronUp size={16} className="-rotate-90"/> Previous
        </button>
        <button type="button" className="btn-secondary" onClick={()=>go(1)}>
          Next <ChevronDown size={16} className="-rotate-90"/>
        </button>
      </div>

      {revealed && (
        <div className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">
              Expected discussion points
            </div>
            <ul className="mt-3 space-y-2">
              {item.points.map((point)=>(
                <li key={point} className="flex gap-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-700" aria-hidden="true"/>
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">
              Staff-level follow-ups
            </div>
            <ul className="mt-3 space-y-2">
              {item.followUps.map((q)=>(
                <li key={q} className="text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
