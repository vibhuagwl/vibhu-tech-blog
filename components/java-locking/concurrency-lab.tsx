'use client';

import {useMemo,useState,useTransition} from 'react';

type LockKind='none'|'synchronized'|'reentrant'|'atomic'|'longadder';

/**
 * Browser-side educational simulator (not a JVM).
 * Models lost updates vs protected increments for interview intuition.
 */
function simulate(threads:number, ops:number, lock:LockKind, criticalMs:number){
  const start=performance.now();
  let value=0;
  const total=threads*ops;

  if(lock==='none'){
    // approximate lost updates under races
    const lossFactor=Math.min(0.45, 0.02*Math.log10(total+10));
    value=Math.floor(total*(1-lossFactor));
  }else if(lock==='atomic' || lock==='longadder' || lock==='synchronized' || lock==='reentrant'){
    value=total;
  }

  // pretend critical section cost
  const contentionPenalty=
    lock==='none'?1:
    lock==='atomic'?1.05:
    lock==='longadder'?1.02:
    lock==='synchronized'?1.15+criticalMs/50:
    1.2+criticalMs/45;

  const elapsed=(performance.now()-start)+total*0.00002*contentionPenalty*Math.max(1,criticalMs);
  const throughput=total/Math.max(elapsed,0.001);

  return {
    total,
    success:value,
    elapsedMs:Number(elapsed.toFixed(3)),
    throughput:Math.round(throughput),
    note:
      lock==='none'
        ? 'Simulator approximates lost updates without a JVM memory model.'
        : lock==='longadder'
          ? 'LongAdder usually wins under high contention — measure on a real JMH run.'
          : 'Correctness preserved in model; real timings depend on hardware/JVM.',
  };
}

export default function ConcurrencyLab(){
  const [threads,setThreads]=useState(100);
  const [ops,setOps]=useState(1000);
  const [lock,setLock]=useState<LockKind>('none');
  const [critical,setCritical]=useState(1);
  const [pending,start]=useTransition();
  const [result,setResult]=useState<ReturnType<typeof simulate>|null>(null);

  const summary=useMemo(()=>`threads=${threads} ops/thread=${ops} lock=${lock}`,[threads,ops,lock]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Concurrency Laboratory</h3>
      <p className="mt-1 text-sm text-slate-500">
        Educational browser simulator for intuition. For real numbers, run the Java lab / JMH module.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          <span className="font-semibold">Threads: {threads}</span>
          <input type="range" min={2} max={1000} value={threads} onChange={(e)=>setThreads(Number(e.target.value))} className="mt-2 w-full"/>
        </label>
        <label className="text-sm">
          <span className="font-semibold">Ops / thread: {ops}</span>
          <input type="range" min={100} max={10000} step={100} value={ops} onChange={(e)=>setOps(Number(e.target.value))} className="mt-2 w-full"/>
        </label>
        <label className="text-sm">
          <span className="font-semibold">Critical section size: {critical}</span>
          <input type="range" min={1} max={20} value={critical} onChange={(e)=>setCritical(Number(e.target.value))} className="mt-2 w-full"/>
        </label>
        <label className="text-sm">
          <span className="font-semibold">Lock type</span>
          <select
            value={lock}
            onChange={(e)=>setLock(e.target.value as LockKind)}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="none">None (race)</option>
            <option value="synchronized">synchronized</option>
            <option value="reentrant">ReentrantLock</option>
            <option value="atomic">AtomicInteger</option>
            <option value="longadder">LongAdder</option>
          </select>
        </label>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={()=>start(()=>setResult(simulate(threads,ops,lock,critical)))}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending?'Running…':'Run experiment'}
      </button>

      <p className="mt-3 text-xs text-slate-500">{summary}</p>

      {result && (
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Stat label="Total ops" value={String(result.total)}/>
          <Stat label="Successful incs" value={String(result.success)}/>
          <Stat label="Elapsed (sim ms)" value={String(result.elapsedMs)}/>
          <Stat label="Throughput (ops/ms)" value={String(result.throughput)}/>
          <p className="md:col-span-4 text-sm text-slate-600 dark:text-slate-300">{result.note}</p>
        </div>
      )}
    </div>
  );
}

function Stat({label,value}:{label:string;value:string}){
  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}
