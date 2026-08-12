'use client';

import Mermaid from '@/components/mermaid';

const SIMPLE = `sequenceDiagram
    autonumber
    participant Page as Frontend :5500
    participant Browser
    participant API as API :8091

    Page->>Browser: fetch GET /api/public/ping
    Browser->>API: GET + Origin: http://localhost:5500
    API-->>Browser: 200 + ACAO: http://localhost:5500
    Browser-->>Page: JS can read JSON
    Note over Browser: Same machine, different port = cross-origin`;

const PREFLIGHT = `sequenceDiagram
    autonumber
    participant Page as Frontend :5500
    participant Browser
    participant API as API :8091

    Page->>Browser: fetch POST /api/transfers JSON + Basic
    Browser->>API: OPTIONS preflight
    Note right of Browser: Access-Control-Request-Method: POST
    API-->>Browser: 200 + Allow-Origin/Methods/Headers + Credentials
    Browser->>API: POST + Authorization + JSON
    API-->>Browser: 200 ACCEPTED + ACAO
    Browser-->>Page: JS reads body`;

const BLOCKED = `sequenceDiagram
    autonumber
    participant Evil as evil.example
    participant Browser
    participant API as API :8091

    Evil->>Browser: fetch GET /api/public/ping
    Browser->>API: GET + Origin: http://evil.example
    API-->>Browser: 403 Invalid CORS request
    Browser-->>Evil: blocked
    Note over API: Spring CorsFilter rejects disallowed Origin`;

const DECISION = `flowchart TD
  A[Browser JS calls another origin?] -->|No| Z[CORS N/A]
  A -->|Yes| B{Simple GET/POST form?}
  B -->|Yes| C[Request + Origin header]
  B -->|No JSON/auth headers| D[Preflight OPTIONS first]
  C --> E{Origin allowlisted?}
  D --> E
  E -->|Yes| F[ACAO exact match · JS reads body]
  E -->|No| G[Browser blocks JS access]
  F --> H{Credentials?}
  H -->|Yes| I[ACAC true · never ACAO *]
  H -->|No| J[ACAO may be * for public APIs]
`;

const diagrams = [
  {
    id: 'cors-simple',
    title: 'Simple cross-origin GET',
    blurb: 'Frontend :5500 → API :8091. Browser attaches Origin; Spring echoes ACAO for the allowlist.',
    chart: SIMPLE,
  },
  {
    id: 'cors-preflight',
    title: 'Preflight then credentialed POST',
    blurb: 'JSON + Authorization triggers OPTIONS. Only after a successful preflight does the real POST run.',
    chart: PREFLIGHT,
  },
  {
    id: 'cors-blocked',
    title: 'Evil origin blocked in the browser',
    blurb: 'The API may return 200; without ACAO the browser refuses to expose the body to JS.',
    chart: BLOCKED,
  },
  {
    id: 'cors-decision',
    title: 'CORS decision map',
    blurb: 'CORS ≠ auth. Credentials require an exact ACAO — never *.',
    chart: DECISION,
  },
] as const;

export default function SpringCorsSequenceDiagrams() {
  return (
    <section className="mt-10 max-w-5xl" aria-labelledby="spring-cors-flows-heading">
      <h2 id="spring-cors-flows-heading" className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
        CORS end-to-end diagrams
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
        Interview story: different origins → Origin header → optional preflight → allowlist ACAO → browser allow or block.
      </p>
      <div className="mt-6 space-y-8">
        {diagrams.map((d) => (
          <article key={d.id} id={d.id} className="scroll-mt-24">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{d.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{d.blurb}</p>
            <Mermaid chart={d.chart} />
          </article>
        ))}
      </div>
    </section>
  );
}
