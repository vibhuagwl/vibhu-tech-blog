'use client';

import {useMemo, useState} from 'react';
import {SCENARIOS} from '@/lib/production-troubleshooting/scenarios';

export default function ScenarioBrowser() {
  const layers = useMemo(
    () => ['All', ...Array.from(new Set(SCENARIOS.map((s) => s.layer)))],
    [],
  );
  const [layer, setLayer] = useState('All');
  const [idx, setIdx] = useState(0);
  const list = layer === 'All' ? SCENARIOS : SCENARIOS.filter((s) => s.layer === layer);
  const s = list[Math.min(idx, Math.max(list.length - 1, 0))];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap gap-2">
        {layers.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => {
              setLayer(l);
              setIdx(0);
            }}
            className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
              layer === l ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      {s && (
        <>
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {s.id.toUpperCase()}. {s.title}
            </h3>
            <span className="text-xs font-semibold uppercase text-slate-400">
              {idx + 1}/{list.length} · {s.layer}
            </span>
          </div>
          <div className="mt-4 grid gap-2 text-sm leading-6 md:grid-cols-2">
            {[
              ['Symptom', s.symptom],
              ['Impact', s.impact],
              ['First check', s.firstCheck],
              ['Mitigate', s.mitigate],
              ['Root cause', s.rootCause],
              ['Prevent', s.prevent],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">{k}</div>
                <div className="mt-1 text-slate-700 dark:text-slate-300">{v}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-xl bg-slate-900 px-4 py-3 text-xs leading-6 text-slate-200">
            Chain: Incident → Symptom → Impact → Metrics → Logs → Trace → Hypothesis → Verify → Mitigate → Root
            Cause → Fix → Validate → Rollback/Failback → Escalate → RCA → Prevent
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setIdx((i) => (i + list.length - 1) % list.length)}
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold dark:bg-slate-900"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setIdx((i) => (i + 1) % list.length)}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            >
              Next scenario
            </button>
          </div>
        </>
      )}
    </div>
  );
}
