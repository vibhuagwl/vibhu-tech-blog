'use client';

import {
  API_ENDPOINTS,
  ARCHITECTURE,
  CONSUMER_SEQUENCE,
  E2E_SEQUENCE,
  IDP_ENDPOINTS,
  KAFKA_ENDPOINTS,
  PRODUCER_SEQUENCE,
  SERVICES,
  TOKEN_CLIENTS,
  type EndpointRow,
  type FlowStep,
} from '@/lib/secure-kafka-endpoints';

function EndpointTable({rows}: {rows: EndpointRow[]}) {
  const headers = ['Method', 'Endpoint', 'Service', 'Purpose', 'Auth / scope', 'Flow'];
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
          <tr>
            {headers.map((col) => (
              <th key={col} className="px-2 py-2 text-left">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.method}-${r.path}-${r.service}`} className="border-t border-slate-200 dark:border-slate-800">
              <td className="px-2 py-2 font-mono font-semibold text-slate-800 dark:text-slate-100">{r.method}</td>
              <td className="px-2 py-2 font-mono text-emerald-800 dark:text-emerald-300">{r.path}</td>
              <td className="px-2 py-2 whitespace-nowrap text-slate-600 dark:text-slate-300">
                {r.service}
                <span className="ml-1 text-slate-400">:{r.port}</span>
              </td>
              <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{r.purpose}</td>
              <td className="px-2 py-2 text-slate-500">{r.auth ?? '—'}</td>
              <td className="px-2 py-2 text-slate-500">{r.flow ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SequenceSteps({title, steps, id}: {title: string; steps: FlowStep[]; id: string}) {
  return (
    <div id={id} className="scroll-mt-28">
      <h4 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h4>
      <ol className="mt-3 space-y-2">
        {steps.map((s) => (
          <li
            key={s.step}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900/50"
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-mono text-[11px] font-bold text-slate-500">#{s.step}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{s.actor}</span>
              <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {s.method}
              </span>
              <code className="font-mono text-[12px] text-emerald-800 dark:text-emerald-300">{s.endpoint}</code>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{s.detail}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function SecureKafkaEndpointReference() {
  return (
    <section className="mt-10 max-w-5xl" aria-labelledby="secure-kafka-endpoints-heading" id="endpoints">
      <h2 id="secure-kafka-endpoints-heading" className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
        Endpoints &amp; sequence
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        HTTP is a Spring Security resource server. Kafka is SASL_SSL + OAUTHBEARER + ACL — not{' '}
        <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">oauth2ResourceServer()</code>. Use the numbered
        sequences with the Mermaid diagrams.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {SERVICES.map((s) => (
          <div
            key={s.name}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-950"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500">{s.name}</p>
            <p className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-white">:{s.port}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{s.role}</p>
          </div>
        ))}
      </div>

      <pre className="mt-6 overflow-x-auto rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 font-mono text-[11px] leading-5 text-slate-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
        {ARCHITECTURE}
      </pre>

      <div className="mt-10 space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Okta (:443) — two authorization servers</h3>
          <div className="mt-3">
            <EndpointTable rows={IDP_ENDPOINTS} />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">OAuth clients (do not mix audiences)</h3>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
                <tr>
                  {['Client', 'Audience', 'Used by', 'Validation plane'].map((h) => (
                    <th key={h} className="px-2 py-2 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOKEN_CLIENTS.map((g) => (
                  <tr key={g.client} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="px-2 py-2 font-mono font-semibold text-slate-800 dark:text-slate-100">{g.client}</td>
                    <td className="px-2 py-2 font-mono text-slate-600 dark:text-slate-300">{g.audience}</td>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{g.usedBy}</td>
                    <td className="px-2 py-2 text-slate-500">{g.plane}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Payment API (:8081) — HTTP</h3>
          <div className="mt-3">
            <EndpointTable rows={API_ENDPOINTS} />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Kafka (:9093) — SASL + ACL</h3>
          <div className="mt-3">
            <EndpointTable rows={KAFKA_ENDPOINTS} />
          </div>
        </div>
      </div>

      <div className="mt-12 space-y-10">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Numbered sequences (endpoint names)</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Step-by-step call order — pair with the Mermaid diagrams in the next section.
        </p>
        <SequenceSteps id="seq-e2e" title="Three acts — six steps" steps={E2E_SEQUENCE} />
        <SequenceSteps id="seq-producer" title="Producer TLS + OAUTHBEARER + WRITE ACL" steps={PRODUCER_SEQUENCE} />
        <SequenceSteps id="seq-consumer" title="Consumer topic ACL + group ACL" steps={CONSUMER_SEQUENCE} />
      </div>
    </section>
  );
}
