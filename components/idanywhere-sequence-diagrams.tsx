'use client';

import Mermaid from '@/components/mermaid';

const INTERNAL = `sequenceDiagram
    autonumber
    participant Browser
    participant App as Spring web-app<br/>oauth2Login
    participant IdP as IdP (IDAnywhere / Okta / Keycloak)
    participant Disco as Discovery + JWKS
    participant API as resource-api<br/>JWT resource server

    Browser->>App: GET /payments (no session)
    App-->>Browser: 302 → /oauth2/authorization/{registrationId}
    Browser->>IdP: GET /oauth2/authorize?client_id&redirect_uri&scope=openid&state&nonce
    IdP->>Browser: Login + MFA (corp UI)
    Browser->>IdP: credentials
    IdP-->>Browser: 302 redirect_uri?code&state
    Browser->>App: GET /login/oauth2/code/{registrationId}?code
    App->>Disco: GET issuer/.well-known/openid-configuration (cached)
    App->>IdP: POST /oauth2/token (code + client_secret)
    IdP-->>App: id_token + access_token (+ refresh)
    App->>App: Validate id_token (iss,aud,nonce,sig via JWKS)
    App-->>Browser: Establish session · 302 /payments
    Browser->>App: GET /payments (session)
    App->>API: Bearer access_token
    API->>Disco: GET jwks_uri (cached)
    API->>API: Validate JWT iss/aud/exp/sig · map groups→roles
    API-->>App: 200 JSON
    App-->>Browser: 200 HTML`;

const WAYS = `flowchart TD
  A[OIDC SSO for a Spring app] --> B[Authorization Code + PKCE/confidential client]
  A --> C[Authorization Code for SPA + BFF]
  A --> D[Device / ROPC - avoid for browsers]
  B --> E[Web MVC: oauth2Login]
  C --> F[BFF holds tokens · SPA uses cookie session]
  E --> G[IdP product]
  F --> G
  G --> H[IDAnywhere/ADFS]
  G --> I[Okta]
  G --> J[Keycloak]
  G --> K[Azure AD / Auth0 / Cognito]
  H --> L[Same Spring code · different issuer-uri]
  I --> L
  J --> L
  K --> L`;

const IDA_STACK = `sequenceDiagram
    autonumber
    participant User
    participant App as Your Spring app
    participant IDA as IDAnywhere<br/>SSO gateway
    participant ADFS as ADFS<br/>federation
    participant AD as Active Directory

    User->>App: Open protected page
    App->>IDA: OIDC /authorize
    IDA->>ADFS: Federate login
    ADFS->>AD: Authenticate user + groups
    AD-->>ADFS: OK + group membership
    ADFS-->>IDA: Authn success + claims
    IDA-->>App: authorization code
    App->>IDA: /token
    IDA-->>App: id_token + access_token JWT
    Note over App,AD: App never sees AD password<br/>Claims often include upn + groups`;

const OKTA = `sequenceDiagram
    autonumber
    participant User
    participant App as Spring web-app<br/>profile=okta
    participant Okta as Okta Org
    participant API as resource-api<br/>profile=okta

    User->>App: GET /payments
    App->>Okta: /oauth2/default/v1/authorize
    Okta->>User: Okta login / MFA
    Okta-->>App: code
    App->>Okta: /token
    Okta-->>App: id_token + access_token
    App->>API: Bearer access_token
    API->>Okta: JWKS
    API-->>App: 200`;

const KEYCLOAK = `sequenceDiagram
    autonumber
    participant User
    participant App as Spring web-app<br/>profile=keycloak
    participant KC as Keycloak<br/>/realms/payments
    participant API as resource-api<br/>profile=keycloak

    User->>App: GET /payments
    App->>KC: /realms/payments/protocol/openid-connect/auth
    KC->>User: Realm login
    KC-->>App: code
    App->>KC: /token
    KC-->>App: id_token + access_token
    App->>API: Bearer access_token
    API->>KC: certs / JWKS
    API-->>App: 200`;

const GROUPS = `sequenceDiagram
    autonumber
    participant API as resource-api
    Note over API: Claim name differs by IdP
    API->>API: IDAnywhere/ADFS: groups
    API->>API: Okta: groups
    API->>API: Keycloak: realm_access.roles / groups
    API->>API: JwtAuthenticationConverter → ROLE_*
    API->>API: @PreAuthorize hasRole ADMIN`;

const diagrams = [
  {
    id: 'internal',
    title: 'How OIDC SSO works internally (any IdP)',
    blurb: 'Discovery → authorize → code → token → validate id_token → session → API with Bearer JWT + JWKS.',
    chart: INTERNAL,
  },
  {
    id: 'ways-flow',
    title: 'Ways to implement OIDC SSO (flow)',
    blurb: 'Pick a browser flow (code / BFF). Pick an IdP product. Spring wiring stays the same.',
    chart: WAYS,
  },
  {
    id: 'ida-stack',
    title: 'IDAnywhere + ADFS + AD relationship',
    blurb: 'AD stores users. ADFS federates. IDAnywhere is the OIDC front door your app calls.',
    chart: IDA_STACK,
  },
  {
    id: 'okta',
    title: 'Same app with Okta',
    blurb: 'Profile okta — only issuer-uri / client-id change. End-to-end flow identical.',
    chart: OKTA,
  },
  {
    id: 'keycloak',
    title: 'Same app with Keycloak',
    blurb: 'Profile keycloak — realm issuer. End-to-end flow identical.',
    chart: KEYCLOAK,
  },
  {
    id: 'groups',
    title: 'Group / role claims → Spring authorization',
    blurb: 'IdP authenticates. Your API still owns authorization by mapping claims to ROLE_*.',
    chart: GROUPS,
  },
] as const;

export default function IdAnywhereSequenceDiagrams() {
  return (
    <section className="mt-10 max-w-5xl" aria-labelledby="ida-flows-heading">
      <h2 id="ida-flows-heading" className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
        Detailed sequence diagrams
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        Internals first, then IDAnywhere/ADFS stack, then Okta and Keycloak — same Spring Security client.
      </p>
      <div className="mt-6 space-y-10">
        {diagrams.map((d) => (
          <article key={d.id} id={d.id} className="scroll-mt-24">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{d.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{d.blurb}</p>
            <Mermaid chart={d.chart} />
          </article>
        ))}
      </div>
    </section>
  );
}
