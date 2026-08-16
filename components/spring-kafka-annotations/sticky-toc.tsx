'use client';

import {useEffect, useState} from 'react';
import type {TocItem} from '@/lib/spring-kafka-annotations/types';

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
      {rootMargin: '-15% 0px -70% 0px', threshold: [0, 1]},
    );
    for (const el of els) observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  const filtered = query.trim()
    ? items.filter((i) => i.label.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  return (
    <nav aria-label="Spring Kafka annotations sections" className="hidden xl:block">
      <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">
          Spring Kafka · Annotations
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter..."
          className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
        />
        <ul className="mt-3 space-y-1">
          {filtered.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`block rounded-lg px-2 py-1.5 text-xs leading-5 transition ${
                  active === item.id
                    ? 'bg-slate-900 font-semibold text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
