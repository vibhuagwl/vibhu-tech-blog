'use client';

import {useMemo, useState} from 'react';
import {
  WAR_HOW_MANY,
  WAR_WHAT_IF,
  WAR_ARCHITECTURE,
  WAR_TROUBLESHOOT,
  WAR_CALC,
  WAR_STAFF_FOLLOWUPS,
  WAR_ALL,
} from '@/lib/kafka-infra/war-room';
import type {InterviewQ} from '@/lib/kafka-infra/types';

const BANKS: {id: string; label: string; list: InterviewQ[]}[] = [
  {id: 'how-many', label: 'How many?', list: WAR_HOW_MANY},
  {id: 'what-if', label: 'What if?', list: WAR_WHAT_IF},
  {id: 'architecture', label: 'Architecture', list: WAR_ARCHITECTURE},
  {id: 'troubleshoot', label: 'Troubleshoot', list: WAR_TROUBLESHOOT},
  {id: 'calc', label: 'Calculate', list: WAR_CALC},
  {id: 'staff', label: 'Staff follow-ups', list: WAR_STAFF_FOLLOWUPS},
];

export default function WarRoomMode() {
  const [mode, setMode] = useState(BANKS[0].id);
  const list = useMemo(() => BANKS.find((b) => b.id === mode)?.list ?? WAR_HOW_MANY, [mode]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const q = list[Math.min(idx, Math.max(list.length - 1, 0))];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap gap-2">
        {BANKS.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => {
              setMode(b.id);
              setIdx(0);
              setRevealed(false);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              mode === b.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {b.label} ({b.list.length})
          </button>
        ))}
      </div>
      {q && (
        <>
          <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{q.question}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[.12em] text-slate-400">{q.topic}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            >
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
              <p>
                <strong>Intent:</strong> {q.intent}
              </p>
              <p>
                <strong>30s:</strong> {q.answer30s}
              </p>
              <p>
                <strong>2m:</strong> {q.answer2m}
              </p>
              {q.architecture && (
                <p>
                  <strong>Architecture:</strong> {q.architecture}
                </p>
              )}
              <p>
                <strong>Trade-offs:</strong> {q.tradeoffs}
              </p>
              <p>
                <strong>Mistakes:</strong> {q.mistakes.join(' · ')}
              </p>
              <p>
                <strong>Follow-ups:</strong> {q.followUps.join(' · ')}
              </p>
            </div>
          )}
          <p className="mt-3 text-xs text-slate-400">
            {idx + 1} / {list.length} · {WAR_ALL.length} war-room prompts total
          </p>
        </>
      )}
    </div>
  );
}
