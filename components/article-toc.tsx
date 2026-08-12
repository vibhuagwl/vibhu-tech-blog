'use client';

import {useEffect,useState} from 'react';
import type {Heading} from '@/lib/headings';

export default function ArticleToc({headings}:{headings:Heading[]}){
  const [active,setActive]=useState(headings[0]?.id ?? '');

  useEffect(()=>{
    if(headings.length===0) return;
    const els=headings
      .map((h)=>document.getElementById(h.id))
      .filter((el):el is HTMLElement=>!!el);

    if(els.length===0) return;

    const observer=new IntersectionObserver(
      (entries)=>{
        const visible=entries
          .filter((e)=>e.isIntersecting)
          .sort((a,b)=>(a.target as HTMLElement).offsetTop-(b.target as HTMLElement).offsetTop);
        if(visible[0]?.target?.id) setActive(visible[0].target.id);
      },
      {rootMargin:'-20% 0px -65% 0px',threshold:[0,1]},
    );

    for(const el of els) observer.observe(el);
    return ()=>observer.disconnect();
  },[headings]);

  if(headings.length<2) return null;

  return (
    <nav aria-label="On this page" className="article-toc hidden xl:block">
      <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-950/90">
        <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">
          On this page
        </div>
        <ul className="mt-3 space-y-1.5">
          {headings.map((h)=>(
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={[
                  'block border-l-2 py-1 text-[13px] leading-snug transition',
                  h.level===3?'pl-4':'pl-3',
                  active===h.id
                    ? 'border-blue-600 font-semibold text-slate-900 dark:text-white'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:hover:text-slate-200',
                ].join(' ')}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
