'use client';

import {useEffect,useRef} from 'react';

export default function Mermaid({chart}:{chart:string}){
  const ref=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    let cancelled=false;
    const isDark=document.documentElement.classList.contains('dark');

    import('mermaid').then(({default:mermaid})=>{
      mermaid.initialize({
        startOnLoad:false,
        theme:isDark?'dark':'neutral',
        securityLevel:'strict',
      });
      if(ref.current && !cancelled){
        const id='m'+Math.random().toString(36).slice(2);
        mermaid.render(id,chart).then(({svg})=>{
          if(ref.current) ref.current.innerHTML=svg;
        });
      }
    });

    return ()=>{cancelled=true};
  },[chart]);

  return (
    <div
      ref={ref}
      className="mermaid-wrap my-6 overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
    />
  );
}
