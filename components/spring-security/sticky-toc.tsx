'use client';

import {useEffect, useMemo, useState} from 'react';
import type {TocItem} from '@/lib/spring-security/types';

export default function StickyToc({items}: {items: TocItem[]}) {
  const [active, setActive] = useState(items[0]?.id ?? '');
  const [query, setQuery] = useState('');

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
      {rootMargin: '-12% 0px -70% 0px', threshold: [0, 1]},
    );
    for (const el of els) observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  const filtered = query.trim()
    ? items.filter((i) => i.label.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  const groups = useMemo(() => {
    const map = new Map<string, TocItem[]>();
    for (const item of filtered) {
      const g = item.group ?? 'Other';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(item);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <nav aria-label="Spring Security sections" className="hidden xl:block">
      <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">Spring Security</div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter topics…"
          className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-slate-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
        />
        <div className="mt-3 space-y-4">
          {groups.map(([group, groupItems]) => (
            <div key={group}>
              <div className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">{group}</div>
              <ul className="mt-1 space-y-0.5">
                {groupItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={[
                        'block border-l-2 py-1 pl-3 text-[12px] leading-snug transition',
                        active === item.id
                          ? 'border-emerald-600 font-semibold text-slate-900 dark:text-white'
                          : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:hover:text-slate-200',
                      ].join(' ')}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
