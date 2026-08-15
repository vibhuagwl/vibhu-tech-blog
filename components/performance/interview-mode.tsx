'use client';

import {useMemo, useState} from 'react';
import {ALL, BEGINNER, INTERMEDIATE, RAPID, SENIOR, STAFF} from '@/lib/performance/interview';

type Mode = 'beginner' | 'intermediate' | 'senior' | 'staff' | 'rapid';

export default function InterviewMode() {
  const [mode, setMode] = useState<Mode>('senior');
  const list = useMemo(() => {
    if (mode === 'beginner') return BEGINNER;
    if (mode === 'intermediate') return INTERMEDIATE;
    if (mode === 'staff') return STAFF;
    if (mode === 'rapid') return RAPID;
    return SENIOR;
  }, [mode]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const q = list[Math.min(idx, Math.max(list.length - 1, 0))];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['beginner', 'Beginner'],
            ['intermediate', 'Intermediate'],
            ['senior', 'Senior'],
            ['staff', 'Staff'],
            ['rapid', 'Rapid'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setMode(id);
              setIdx(0);
              setRevealed(false);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              mode === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {q && (
        <>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500">
            {q.topic} · {q.level}
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{q.question}</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setRevealed(true)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
              Reveal
            </button>
            <button
              type="button"
              onClick={() => {
                setIdx((i) => (i + 1) % list.length);
                setRevealed(false);
              }}
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold dark:bg-slate-900"
            >
              Next
            </button>
          </div>
          {revealed && (
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
              <p>
                <strong>30s:</strong> {q.answer30s}
              </p>
              <p>
                <strong>2m:</strong> {q.answer2m}
              </p>
              {q.deepDive && (
                <p>
                  <strong>Deep dive:</strong> {q.deepDive}
                </p>
              )}
              {q.mistake && (
                <p className="text-rose-700 dark:text-rose-300">
                  <strong>Common mistake:</strong> {q.mistake}
                </p>
              )}
              {q.followUps && q.followUps.length > 0 && (
                <p>
                  <strong>Follow-ups:</strong> {q.followUps.join(' · ')}
                </p>
              )}
            </div>
          )}
          <p className="mt-3 text-xs text-slate-400">
            Bank: {list.length} in this mode · {ALL.length} total
          </p>
        </>
      )}
    </div>
  );
}
