'use client';

import {useEffect, useState} from 'react';
import type {TocItem} from '@/lib/dsa/types';

export default function StickyToc({items}: {items: TocItem[]}) {
  const [active, setActive] = useState(items[0]?.id ?? '');

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.target as HTMLElement).offsetTop - (b.target as HTMLElement).offsetTop);
        if (visible[0]?.target?.id) setActive(visible[0].target.id);
      },
      {rootMargin: '-15% 0px -70% 0px', threshold: [0, 1]},
    );
    for (const el of els) observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  let lastGroup = '';
  return (
    <nav aria-label="DSA sections" className="hidden xl:block">
      <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">DSA · Java</div>
        <ul className="mt-3 space-y-0.5">
          {items.map((item) => {
            const showGroup = Boolean(item.group && item.group !== lastGroup);
            if (item.group) lastGroup = item.group;
            return (
              <li key={item.id}>
                {showGroup && (
                  <div className="mt-3 mb-1 px-1 text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">
                    {item.group}
                  </div>
                )}
                <a
                  href={`#${item.id}`}
                  className={[
                    'block border-l-2 py-1.5 pl-3 text-[13px] leading-snug transition',
                    active === item.id
                      ? 'border-slate-700 font-semibold text-slate-900 dark:text-white'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:hover:text-slate-200',
                  ].join(' ')}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
