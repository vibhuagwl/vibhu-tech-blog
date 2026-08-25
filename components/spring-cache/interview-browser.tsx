'use client';

import {useMemo, useState} from 'react';
import {INTERVIEW_40} from '@/lib/spring-cache/interview';
import type {IQ} from '@/lib/spring-cache/types';

export default function InterviewBrowser() {
  const topics = useMemo(
    () => ['All', ...Array.from(new Set(INTERVIEW_40.map((q) => q.topic))).sort()],
    [],
  );
  const [topic, setTopic] = useState('All');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INTERVIEW_40.filter((item) => {
      if (topic !== 'All' && item.topic !== topic) return false;
      if (!q) return true;
      return item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
    });
  }, [topic, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {topics.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTopic(t)}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              topic === t
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${INTERVIEW_40.length} questions…`}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-slate-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
      />
      <p className="text-xs font-semibold uppercase tracking-[.12em] text-slate-400">
        Showing {filtered.length} / {INTERVIEW_40.length}
      </p>
      <div className="space-y-2">
        {filtered.map((item: IQ) => {
          const open = openId === item.id;
          return (
            <div key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : item.id)}
                className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left"
              >
                <span>
                  <span className="mr-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {item.topic}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.question}</span>
                </span>
                <span className="shrink-0 text-xs text-slate-400">{open ? '−' : '+'}</span>
              </button>
              {open && (
                <p className="border-t border-slate-200 px-3 py-3 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:text-slate-300">
                  {item.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
