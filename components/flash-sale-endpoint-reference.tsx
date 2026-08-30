'use client';

import {API_ENDPOINTS, ARCHITECTURE, BUY_STEPS, SERVICES, type EndpointRow} from '@/lib/flash-sale-endpoints';

function EndpointTable({rows}: {rows: EndpointRow[]}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
          <tr>
            {['Method', 'Endpoint', 'Service', 'Purpose', 'Auth', 'Flow'].map((col) => (
              <th key={col} className="px-2 py-2 text-left">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.method}-${r.path}`} className="border-t border-slate-200 dark:border-slate-800">
              <td className="px-2 py-2 font-mono font-semibold">{r.method}</td>
              <td className="px-2 py-2 font-mono text-emerald-800 dark:text-emerald-300">{r.path}</td>
              <td className="px-2 py-2 whitespace-nowrap text-slate-600 dark:text-slate-300">
                {r.service}
                <span className="ml-1 text-slate-400">:{r.port}</span>
              </td>
              <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{r.purpose}</td>
              <td className="px-2 py-2 text-slate-500">{r.auth}</td>
              <td className="px-2 py-2 text-slate-500">{r.flow}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FlashSaleEndpointReference() {
  return (
    <section className="mt-10 max-w-5xl" aria-labelledby="flash-sale-endpoints-heading" id="endpoints">
      <h2 id="flash-sale-endpoints-heading" className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
        Microservices & APIs
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        Six Java modules under <code className="rounded bg-slate-100 px-1 dark:bg-slate-900">flash-sale-system/</code>.
        Open the tree below — start at <strong>SubmitPurchaseService</strong> or{' '}
        <strong>ReserveInventoryService</strong>, not the docs folder.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => (
          <div key={s.port} className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">{s.name}</div>
            <div className="font-mono text-[11px] text-slate-400">:{s.port}</div>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{s.role}</p>
          </div>
        ))}
      </div>

      <pre className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[12px] leading-5 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
        {ARCHITECTURE}
      </pre>

      <div className="mt-6">
        <EndpointTable rows={[...API_ENDPOINTS]} />
      </div>

      <ol className="mt-6 space-y-2">
        {BUY_STEPS.map((s) => (
          <li
            key={s.step}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900/50"
          >
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-mono text-[11px] font-bold text-slate-500">#{s.step}</span>
              <span className="font-semibold">{s.actor}</span>
              <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[11px] dark:bg-slate-800">
                {s.method}
              </span>
              <code className="font-mono text-[12px] text-emerald-800 dark:text-emerald-300">{s.endpoint}</code>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{s.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
