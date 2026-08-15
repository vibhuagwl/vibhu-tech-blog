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
      <div className="article-toc__panel sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
        <div className="article-toc__label">On this page</div>
        <ul className="article-toc__list">
          {headings.map((h)=>(
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={[
                  'article-toc__link',
                  h.level===3?'is-h3':'',
                  active===h.id?'is-active':'',
                ].filter(Boolean).join(' ')}
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
