'use client';

import {useEffect,useId,useRef,useState} from 'react';

/** Serialize mermaid.render — concurrent calls race and often leave empty boxes. */
let renderQueue: Promise<void> = Promise.resolve();

function enqueueRender<T>(work: () => Promise<T>): Promise<T> {
  const run = renderQueue.then(work, work);
  renderQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export default function Mermaid({chart}:{chart:string}){
  const ref=useRef<HTMLDivElement>(null);
  const reactId=useId().replace(/:/g,'');
  const [error,setError]=useState<string|null>(null);
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    let cancelled=false;
    setError(null);
    setReady(false);

    enqueueRender(async ()=>{
      const {default:mermaid}=await import('mermaid');
      if(cancelled || !ref.current) return;

      const isDark=document.documentElement.classList.contains('dark');
      mermaid.initialize({
        startOnLoad:false,
        theme:isDark?'dark':'neutral',
        // loose allows <br/> in participant labels used across demos
        securityLevel:'loose',
        flowchart:{htmlLabels:true},
      });

      const id=`m${reactId}${Math.random().toString(36).slice(2,8)}`;
      try {
        const {svg}=await mermaid.render(id,chart.trim());
        if(!cancelled && ref.current){
          ref.current.innerHTML=svg;
          setReady(true);
        }
      } catch (e) {
        const msg=e instanceof Error?e.message:String(e);
        if(!cancelled){
          setError(msg);
          if(ref.current) ref.current.innerHTML='';
        }
      }
    });

    return ()=>{cancelled=true};
  },[chart,reactId]);

  return (
    <div className="my-6">
      {!ready && !error && (
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Rendering diagram…</p>
      )}
      {error && (
        <p className="mb-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          Diagram failed to render: {error}
        </p>
      )}
      <div
        ref={ref}
        className="mermaid-wrap overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
      />
    </div>
  );
}
