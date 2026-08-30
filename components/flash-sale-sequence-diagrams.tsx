'use client';

import Mermaid from '@/components/mermaid';

const SUCCESS = `sequenceDiagram
    autonumber
    actor U as User
    participant G as API Gateway
    participant F as FlashSale
    participant R as Redis
    participant K as Kafka
    participant I as Inventory
    participant O as Order
    participant P as Payment

    U->>G: POST /orders
    G->>F: purchase + correlationId
    F->>R: Lua DECR inv:gate
    R-->>F: accepted
    F->>F: outbox OrderRequested
    F-->>U: 202 PENDING
    K->>I: OrderRequested
    I->>I: UPDATE available >= qty
    I->>K: InventoryReserved
    K->>O: create order + saga
    O->>K: PaymentRequested
    K->>P: charge (outside DB TX)
    P->>K: PaymentSucceeded
    K->>O: CONFIRMED
    K->>I: confirm sold`;

const FAILURE = `sequenceDiagram
    autonumber
    participant P as Payment
    participant K as Kafka
    participant O as Order
    participant I as Inventory

    P->>K: PaymentFailed
    K->>O: cancel + COMPENSATING
    O->>K: InventoryReleaseRequested
    K->>I: increment available
    Note over I: reservation RELEASED (idempotent)`;

export default function FlashSaleSequenceDiagrams() {
  return (
    <section className="mt-10 max-w-5xl" aria-labelledby="flash-sale-flows-heading" id="diagrams">
      <h2 id="flash-sale-flows-heading" className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
        Interview flows
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        HTTP never waits for payment. Redis is not the source of truth. Payment failure must release stock.
      </p>
      <div className="mt-6 space-y-8">
        <div>
          <h3 className="text-lg font-semibold">Happy path</h3>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <Mermaid chart={SUCCESS} />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Payment failure → compensate</h3>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <Mermaid chart={FAILURE} />
          </div>
        </div>
      </div>
    </section>
  );
}
