'use client';

import {useMemo, useState} from 'react';
import {ALL, ARCHITECT, PRINCIPAL, RAPID, SENIOR} from '@/lib/rate-limiter/interview';

export default function InterviewMode() {
  const [mode, setMode] = useState<'senior' | 'architect' | 'principal' | 'rapid'>('senior');
  const list = useMemo(() => {
    if (mode === 'architect') return ARCHITECT;
    if (mode === 'principal') return PRINCIPAL;
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
            ['senior', 'Senior'],
            ['architect', 'Architect'],
            ['principal', 'Principal'],
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
            {label} ({id === 'senior' ? SENIOR.length : id === 'architect' ? ARCHITECT.length : id === 'principal' ? PRINCIPAL.length : RAPID.length})
          </button>
        ))}
      </div>
      {q && (
        <>
          <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{q.question}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[.12em] text-slate-400">
            {q.level} · {q.topic}
          </p>
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
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              Next
            </button>
          </div>
          {revealed && (
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
              {q.expects && (
                <p>
                  <strong>Interviewer expects:</strong> {q.expects}
                </p>
              )}
              <p>
                <strong>Short:</strong> {q.answer30s}
              </p>
              <p>
                <strong>Strong answer:</strong> {q.answer2m}
              </p>
              <p>
                <strong>Follow-up:</strong> {q.followUps.join(' · ')}
              </p>
              {q.wrongAnswer && (
                <p className="text-rose-700 dark:text-rose-300">
                  <strong>Common wrong answer:</strong> {q.wrongAnswer}
                </p>
              )}
              {q.seniorInsight && (
                <p className="text-emerald-800 dark:text-emerald-300">
                  <strong>Senior insight:</strong> {q.seniorInsight}
                </p>
              )}
              {q.trick && (
                <p className="text-amber-700 dark:text-amber-300">
                  <strong>Trap:</strong> {q.trick}
                </p>
              )}
            </div>
          )}
          <p className="mt-3 text-xs text-slate-400">
            {idx + 1}/{list.length} · bank {ALL.length} prompts
          </p>
        </>
      )}
    </div>
  );
}
