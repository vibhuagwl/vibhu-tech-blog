'use client';

import Mermaid from '@/components/mermaid';

const ATTACK = `sequenceDiagram
    autonumber
    actor Victim
    participant Browser
    participant Bank as csrf-demo :8090
    participant Evil as evil.example

    Victim->>Bank: Login · JSESSIONID set
    Victim->>Evil: Visit attacker page
    Evil-->>Browser: Auto POST /transfer
    Browser->>Bank: POST /transfer + session cookie · no CSRF
    Bank-->>Browser: 403 Forbidden
    Note over Bank: CsrfFilter rejects missing token`;

const FORM_OK = `sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant App as csrf-demo
    participant Filter as CsrfFilter

    User->>Browser: GET /transfer
    Browser->>App: session cookie
    App->>Filter: ensure session CSRF token
    App-->>Browser: HTML + hidden _csrf
    User->>Browser: Submit transfer
    Browser->>App: POST + session + _csrf
    Filter->>Filter: token matches session
    App-->>Browser: 302 /transfer · ledger updated`;

const SPA_COOKIE = `sequenceDiagram
    autonumber
    participant JS as SPA JavaScript
    participant App as /spa/**
    participant Filter as CsrfFilter

    JS->>App: GET /spa/csrf (Basic auth)
    App-->>JS: Set-Cookie XSRF-TOKEN (HttpOnly=false)
    JS->>JS: read cookie · set X-XSRF-TOKEN
    JS->>App: POST /spa/transfer + header
    Filter->>Filter: header matches cookie token
    App-->>JS: 200 OK
    Note over JS,App: Missing header → 403`;

const WHEN_DISABLE = `flowchart TD
  A[Mutating request?] -->|No GET/HEAD| Z[CSRF N/A]
  A -->|Yes POST/PUT/DELETE| B{Browser auto-sends credentials?}
  B -->|Session cookie| C[Keep CSRF ON]
  B -->|Authorization Bearer JWT| D[CSRF usually OFF]
  B -->|Cookie + SPA| E[CookieCsrfTokenRepository]
  C --> F[Hidden field or header]
  E --> G[XSRF-TOKEN + X-XSRF-TOKEN]
`;

const diagrams = [
  {
    id: 'csrf-attack',
    title: 'CSRF attack blocked',
    blurb: 'Evil site can trigger a cookie-authenticated POST, but cannot read the CSRF token — Spring returns 403.',
    chart: ATTACK,
  },
  {
    id: 'csrf-form',
    title: 'Browser form with session CSRF',
    blurb: 'Thymeleaf renders the hidden _csrf field; CsrfFilter validates it on POST /transfer.',
    chart: FORM_OK,
  },
  {
    id: 'csrf-spa',
    title: 'SPA CookieCsrfTokenRepository',
    blurb: 'JS reads the non-HttpOnly XSRF-TOKEN cookie and sends X-XSRF-TOKEN on mutating calls.',
    chart: SPA_COOKIE,
  },
  {
    id: 'csrf-when',
    title: 'When to enable vs disable CSRF',
    blurb: 'CSRF protects cookie-authenticated browsers. Stateless Bearer JWT APIs typically disable it.',
    chart: WHEN_DISABLE,
  },
] as const;

export default function SpringCsrfSequenceDiagrams() {
  return (
    <section className="mt-10 max-w-5xl" aria-labelledby="spring-csrf-flows-heading">
      <h2 id="spring-csrf-flows-heading" className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
        CSRF sequence diagrams
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
        Same story the interview expects: attack → token defense → SPA cookie variant → when CSRF is N/A.
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
