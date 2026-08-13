'use client';

import {useState} from 'react';
import Mermaid from '@/components/mermaid';
import {CODE_SEQUENCES} from '@/lib/camunda/sequences';
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
      title="HTTP / BPMN / Java map (Spring app :8094, Zeebe :26500)"
      tone="ok"
      code={`POST /api/payments                  PaymentController.start
                                     -> ZeebeClient.create payment-process
                                     -> payment-process.bpmn

validate-payment                     ValidatePaymentWorker.validate
fraud-check                          FraudCheckWorker.check
account-validation                   AccountValidationWorker.validateAccount
process-payment                      ProcessPaymentWorker.process
bank-settlement                      BankSettlementWorker.settle
notify-payment                       NotifyPaymentWorker.notify
manual-review                        ApprovalController + Tasklist user task

POST /api/payments/{id}/cancel       PaymentController.cancel
                                     -> publish PaymentCancelled message

POST /api/payments/{id}/bank-callback PaymentCallbackController.callback
                                     -> publish BankSettled message

Operate                              http://127.0.0.1:8081
Zeebe Gateway                         127.0.0.1:26500`}
    />
  );
}
