'use client';

import {useState} from 'react';
import Mermaid from '@/components/mermaid';
import {CODE_SEQUENCES} from '@/lib/resilience4j/sequences';
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
      title="HTTP → Java class map (port 8087) — no memorizing"
      tone="ok"
      code={`POST /api/orders
  OrderController.create
    → OrderService.placeOrder
      → FraudCheckClient.screen
      → IdempotencyStore.once
        → PaymentGatewayClient.charge
          AOP: Retry → CircuitBreaker → RateLimiter → Bulkhead
          → PaymentBankStub.charge
          fallback: pendingFallback → PENDING (never fake CAPTURED)

POST /api/orders/async
  → PaymentGatewayClient.chargeAsync
    → TimeLimiter + CircuitBreaker (+ async fallback)

GET  /api/payment/simulate?mode=OK|FLAKY|SLOW|DOWN|ERROR|REJECT
  → SimulateController → PaymentBankStub mode

GET  /api/fx
  → FxRateService.usdInr (@Cacheable Caffeine)

GET  /actuator/circuitbreakers | health | metrics
  → observe OPEN / HALF_OPEN / CLOSED`}
    />
  );
}
