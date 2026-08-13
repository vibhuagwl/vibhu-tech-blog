'use client';

import {useMemo,useState} from 'react';
import type {InterviewQuestion} from '@/lib/java-versions/types';
import StatusBadge from './status-badge';

const TOPICS=['All','Java 8','Java 11','Java 17','Java 21','Java 25','Migration','JVM','Concurrency','Architecture'] as const;
const DIFFS=['All','Senior','Staff','Principal','Architect','25+ Years'] as const;

export default function InterviewMode({
  questions,
  title,
  subtitle,
}:{
  questions:InterviewQuestion[];
  title:string;
  subtitle:string;
}){
  const [topic,setTopic]=useState<(typeof TOPICS)[number]>('All');
  const [diff,setDiff]=useState<(typeof DIFFS)[number]>('All');
  const [idx,setIdx]=useState(0);
  const [revealed,setRevealed]=useState(false);
  const [paused,setPaused]=useState(false);

  const filtered=useMemo(()=>{
    return questions.filter((q)=>{
      if(topic!=='All' && q.topic!==topic) return false;
      if(diff!=='All' && q.difficulty!==diff) return false;
      return true;
    });
  },[questions,topic,diff]);

  const current=filtered[Math.min(idx,Math.max(filtered.length-1,0))];

  function next(){
    setRevealed(false);
    setPaused(false);
    setIdx((i)=>filtered.length===0?0:(i+1)%filtered.length);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <StatusBadge status="LTS"/>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TOPICS.map((t)=>(
          <button
            key={t}
            type="button"
            onClick={()=>{setTopic(t);setIdx(0);setRevealed(false);}}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${topic===t?'bg-slate-900 text-white':'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {DIFFS.map((d)=>(
          <button
            key={d}
            type="button"
            onClick={()=>{setDiff(d);setIdx(0);setRevealed(false);}}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${diff===d?'bg-slate-900 text-white dark:bg-white dark:text-slate-900':'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`}
          >
            {d}
          </button>
        ))}
      </div>

      {!current ? (
        <p className="mt-6 text-sm text-slate-500">No questions for this filter.</p>
      ) : (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-slate-500">
            <span>{current.topic}</span>
            <span>·</span>
            <span>{current.difficulty}</span>
            <span>·</span>
            <span>{Math.min(idx+1,filtered.length)} / {filtered.length}</span>
          </div>
          <p className="mt-3 text-lg font-semibold leading-8 text-slate-900 dark:text-white">
            {current.question}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={()=>setPaused((p)=>!p)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700"
            >
              {paused?'Resume think time':'Pause / Think'}
            </button>
            <button
              type="button"
              onClick={()=>setRevealed(true)}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            >
              Reveal Answer
            </button>
            <button
              type="button"
              onClick={next}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
            >
              Next
            </button>
          </div>

          {paused && !revealed && (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
              Think with the architect framework: Problem → Options → Trade-offs → Rollout → Rollback.
            </p>
          )}

          {revealed && (
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Model answer</div>
                <p className="mt-2">{current.answer}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Key points</div>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {current.keyPoints.map((k)=><li key={k}>{k}</li>)}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Follow-up</div>
                <p className="mt-2">{current.followUp}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Production example</div>
                <p className="mt-2">{current.productionExample}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
