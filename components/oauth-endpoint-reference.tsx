'use client';

import {
  ARCHITECTURE,
  AUTH_CODE_SEQUENCE,
  CLIENT_CREDENTIALS_SEQUENCE,
  CLIENT_ENDPOINTS,
  GATEWAY_ROUTES,
  JWT_VALIDATION_SEQUENCE,
  OAUTH_ENDPOINTS,
  PKCE_SEQUENCE,
  REFRESH_SEQUENCE,
  RESOURCE_ENDPOINTS,
  SERVICES,
  TOKEN_GRANTS,
  type EndpointRow,
  type FlowStep,
} from '@/lib/oauth-jwt-endpoints';

function EndpointTable({rows, headers}: {rows: EndpointRow[]; headers?: string[]}) {
  const h = headers ?? ['Method', 'Endpoint', 'Service', 'Purpose', 'Auth / scope', 'Flow'];
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
          <tr>
            {h.map((col) => (
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

export default function OAuthEndpointReference() {
  return (
    <section className="mt-10 max-w-5xl" aria-labelledby="oauth-endpoints-heading" id="endpoints">
      <h2 id="oauth-endpoints-heading" className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
        OAuth API endpoints &amp; sequence
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        Every HTTP endpoint in this demo, grouped by service. Use the numbered sequences below with the Mermaid
        diagrams — same flows, explicit method + path names for interviews.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Authorization Server (:9000) — OAuth / OIDC</h3>
          <div className="mt-3">
            <EndpointTable rows={OAUTH_ENDPOINTS} />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Token endpoint grants</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            All grants hit <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">POST /oauth2/token</code>{' '}
            with different bodies and client authentication.
          </p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
                <tr>
                  {['Grant', 'Client', 'Token body', 'Client auth', 'Returns'].map((h) => (
                    <th key={h} className="px-2 py-2 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOKEN_GRANTS.map((g) => (
                  <tr key={g.grant} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="px-2 py-2 font-semibold text-slate-800 dark:text-slate-100">{g.grant}</td>
                    <td className="px-2 py-2 font-mono text-slate-600 dark:text-slate-300">{g.client}</td>
                    <td className="px-2 py-2 font-mono text-[11px] text-slate-600 dark:text-slate-300">{g.body}</td>
                    <td className="px-2 py-2 text-slate-500">{g.auth}</td>
                    <td className="px-2 py-2 text-slate-500">{g.returns}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Client App (:8082)</h3>
          <div className="mt-3">
            <EndpointTable rows={CLIENT_ENDPOINTS} />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">API Gateway (:8080) — routes</h3>
          <div className="mt-3">
            <EndpointTable rows={GATEWAY_ROUTES} />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Resource Server (:8081) — protected APIs</h3>
          <div className="mt-3">
            <EndpointTable rows={RESOURCE_ENDPOINTS} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Via Gateway use the same paths on <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">:8080</code>
            ; direct RS calls use <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">:8081</code> (Postman /
            curl).
          </p>
        </div>
      </div>

      <div className="mt-12 space-y-10">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Numbered sequences (endpoint names)</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Step-by-step call order — pair with the Mermaid diagrams in the next section.
        </p>

        <SequenceSteps
          id="seq-auth-code"
          title="Authorization Code → JWT → Gateway → Resource Server"
          steps={AUTH_CODE_SEQUENCE}
        />
        <SequenceSteps id="seq-pkce" title="Authorization Code + PKCE (spa-client)" steps={PKCE_SEQUENCE} />
        <SequenceSteps id="seq-client-creds" title="Client Credentials (payment-service)" steps={CLIENT_CREDENTIALS_SEQUENCE} />
        <SequenceSteps id="seq-jwt-validation" title="JWT validation at Gateway + Resource Server" steps={JWT_VALIDATION_SEQUENCE} />
        <SequenceSteps id="seq-refresh" title="Refresh token grant" steps={REFRESH_SEQUENCE} />
      </div>
    </section>
  );
}
