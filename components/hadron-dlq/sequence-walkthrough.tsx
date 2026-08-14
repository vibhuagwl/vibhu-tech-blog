'use client';

import {useState} from 'react';
import Mermaid from '@/components/mermaid';
import {CODE_SEQUENCES} from '@/lib/hadron-dlq/sequences';
import CodePanel from './code-panel';

export default function SequenceWalkthrough() {
  const [activeId, setActiveId] = useState(CODE_SEQUENCES[0].id);
  const active = CODE_SEQUENCES.find((s) => s.id === activeId) ?? CODE_SEQUENCES[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {CODE_SEQUENCES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveId(s.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              activeId === s.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{active.why}</p>
      <p className="font-mono text-xs text-slate-500">{active.endpoint}</p>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <Mermaid chart={active.mermaid} />
      </div>

      <div className="flex flex-wrap gap-2">
        {active.classes.map((cls) => (
          <span
            key={cls}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            {cls}
          </span>
        ))}
      </div>
    </div>
  );
}

export function LabCallMap() {
  return (
    <CodePanel
      title="HTTP map (Spring app :8095)"
      tone="ok"
      code={`POST /api/cashlines/events          CashLineProducer → cashline-events
GET  /api/cashlines/{id}            CashLine table

GET  /api/lab/scenarios               catalog of corner cases
POST /api/lab/scenario/success
POST /api/lab/scenario/poison
POST /api/lab/scenario/unknown-enum
POST /api/lab/scenario/npe
POST /api/lab/scenario/invalid-amount
POST /api/lab/scenario/invalid-business
POST /api/lab/scenario/unknown-participant
POST /api/lab/scenario/invalid-currency
POST /api/lab/scenario/invalid-account
POST /api/lab/scenario/transient-then-ok
POST /api/lab/scenario/timeout
POST /api/lab/scenario/deadlock
POST /api/lab/scenario/duplicate
POST /api/lab/scenario/out-of-order
POST /api/lab/scenario/stale-event
POST /api/lab/scenario/cancelled-then-settle
POST /api/lab/scenario/replay-after-settle
POST /api/lab/scenario/currency-mismatch

GET  /api/dlq
GET  /api/dlq/{id}
POST /api/dlq/{id}/correct          fix payload → READY_FOR_REPLAY
POST /api/dlq/{id}/replay           claim REPLAYING → Kafka
POST /api/dlq/replay/{cashlineId}
POST /api/dlq/replay/batch
POST /api/dlq/{id}/resolve

POST /api/neptune/seed
POST /api/neptune/poll              cursor (updated_at, id)
GET  /actuator/prometheus`}
    />
  );
}
