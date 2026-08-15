'use client';

import {useEffect, useState} from 'react';
import type {TocItem} from '@/lib/performance/types';

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
    <nav aria-label="Performance sections">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 xl:mb-0 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto dark:border-slate-800 dark:bg-slate-950">
        <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">
          Measure · Bottleneck · Optimize · Prove
        </div>
        <label className="mt-3 block xl:hidden">
          <span className="sr-only">Jump to section</span>
          <select
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={active}
            onChange={(e) => {
              const id = e.target.value;
              setActive(id);
              window.location.hash = id;
              document.getElementById(id)?.scrollIntoView({behavior: 'smooth', block: 'start'});
            }}
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter…"
          className="mt-3 hidden w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2 xl:block dark:border-slate-700 dark:bg-slate-900"
        />
        <ul className="mt-3 hidden space-y-0.5 xl:block">
          {filtered.map((item) => (
            <li key={item.id}>
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
          ))}
        </ul>
      </div>
    </nav>
  );
}
