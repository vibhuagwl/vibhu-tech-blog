'use client';

import {useMemo, useState} from 'react';
import {interviewByLevel} from '@/lib/java-reentrant-lock/interview';
import type {InterviewQ} from '@/lib/java-reentrant-lock/types';

const LEVELS: {id: InterviewQ['level']; label: string}[] = [
  {id: 'mid', label: 'Mid (20)'},
  {id: 'senior', label: 'Senior (30)'},
  {id: 'staff', label: 'Staff/Principal (30)'},
  {id: 'architecture', label: 'Architecture (20)'},
];

export default function InterviewMode() {
  const [level, setLevel] = useState<InterviewQ['level']>('senior');
  const list = useMemo(() => interviewByLevel(level), [level]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const q = list[Math.min(idx, Math.max(list.length - 1, 0))];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => {
              setLevel(l.id);
              setIdx(0);
              setRevealed(false);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              level === l.id
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
      {q && (
        <>
          <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{q.question}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[.12em] text-slate-400">
            Testing: {q.testing} · {idx + 1}/{list.length}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
            >
              Reveal
            </button>
            <button
              type="button"
              onClick={() => {
                setIdx((i) => (i + 1) % list.length);
                setRevealed(false);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 dark:border-slate-600 dark:text-slate-100"
            >
              Next
            </button>
          </div>
          {revealed && (
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
              <p>
                <strong>Thought process:</strong> {q.thought}
              </p>
              <p>
                <strong>Strong answer:</strong> {q.strong}
              </p>
              <p className="text-rose-700 dark:text-rose-300">
                <strong>Common wrong:</strong> {q.wrong}
              </p>
              <p>
                <strong>Follow-up:</strong> {q.followUp}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
