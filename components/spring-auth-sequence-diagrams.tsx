'use client';

import Mermaid from '@/components/mermaid';

const FORM_LOGIN = `sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant Portal as web-portal :8080
    participant UDS as DbUserDetailsService
    participant DB as users/roles

    User->>Browser: GET /payments
    Browser->>Portal: no session
    Portal-->>Browser: 302 /login
    User->>Browser: POST username + password
    Browser->>Portal: POST /login + CSRF
    Portal->>UDS: loadUserByUsername
    UDS->>DB: load hash + ROLE_*
    Portal->>Portal: BCrypt match → SecurityContext
    Portal-->>Browser: 302 + JSESSIONID
    Browser->>Portal: GET /payments + session
    Portal->>Portal: URL authz + @PreAuthorize
    Portal-->>Browser: 200 HTML`;

const HTTP_BASIC = `sequenceDiagram
    autonumber
    participant Client
    participant API as api-service :8081
    participant UDS as DbUserDetailsService

    Client->>API: GET /api/admin/stats
    API-->>Client: 401
    Client->>API: Basic alice:password
    API->>UDS: load alice
    API->>API: hasRole ADMIN fails
    API-->>Client: 403
    Client->>API: Basic admin:password
    API->>API: URL + @PreAuthorize OK
    API-->>Client: 200`;

const AUTHN_VS_AUTHZ = `sequenceDiagram
    autonumber
    participant Client
    participant Authn as Authentication filters
    participant Authz as AuthorizationFilter / PreAuthorize
    participant App as Controller

    Client->>Authn: credentials (form or Basic)
    Authn->>Authn: Authentication in SecurityContext
    Authn->>Authz: continue chain
    Authz->>Authz: URL role checks
    Authz->>App: invoke handler
    App->>Authz: method @PreAuthorize
    Authz-->>Client: 200 or 403`;

const diagrams = [
  {
    id: 'form-login',
    title: 'Form login authentication + session authorization',
    blurb: 'web-portal proves identity once, then authorizes each request from the session SecurityContext.',
    chart: FORM_LOGIN,
  },
  {
    id: 'http-basic',
    title: 'HTTP Basic authentication (stateless API)',
    blurb: 'api-service authenticates every request with Basic credentials — still no OAuth token endpoint.',
    chart: HTTP_BASIC,
  },
  {
    id: 'authn-authz',
    title: 'Authn vs Authz inside one Spring app',
    blurb: 'Same process does both: filters authenticate, then URL/method rules authorize.',
    chart: AUTHN_VS_AUTHZ,
  },
] as const;

export default function SpringAuthSequenceDiagrams() {
  return (
    <section className="mt-10 max-w-5xl" aria-labelledby="spring-auth-flows-heading">
      <h2 id="spring-auth-flows-heading" className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
        Sequence diagrams — Authn & Authz (no OAuth)
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        Contrast with the OAuth lab: here there is no Authorization Server issuing JWTs — each app
        authenticates credentials and authorizes locally.
      </p>
      <div className="mt-6 space-y-10">
        {diagrams.map((d) => (
          <div key={d.id} id={d.id}>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{d.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{d.blurb}</p>
            <Mermaid chart={d.chart} />
          </div>
        ))}
      </div>
    </section>
  );
}
