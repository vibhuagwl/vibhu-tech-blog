'use client';

import Mermaid from '@/components/mermaid';

const E2E = `sequenceDiagram
    autonumber
    actor User
    participant App as web-app :8088
    participant IDA as IDAnywhere/ADFS<br/>(idp-standin :9080)
    participant API as resource-api :8089

    User->>App: GET /payments
    App->>IDA: /oauth2/authorize (OIDC code flow)
    IDA->>User: Corporate login
    User->>IDA: Authenticate
    IDA->>App: Redirect with code
    App->>IDA: POST /oauth2/token
    IDA-->>App: id_token + access_token JWT
    App->>API: Bearer access_token
    API->>IDA: JWKS (cached)
    API->>API: Map groups to roles
    API-->>App: 200`;

const GROUPS = `sequenceDiagram
    autonumber
    participant API as resource-api
    Note over API: groups claim from ADFS/IDAnywhere
    API->>API: JwtAuthenticationConverter
    API->>API: App.Payments.Users → ROLE_USER
    API->>API: App.Payments.Admins → ROLE_ADMIN
    API->>API: @PreAuthorize / URL rules`;

export default function IdAnywhereSequenceDiagrams() {
  return (
    <section className="mt-10 max-w-5xl" aria-labelledby="ida-flows-heading">
      <h2 id="ida-flows-heading" className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
        Sequence diagrams — IDAnywhere OIDC
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        Local <code className="text-xs">idp-standin</code> mimics IDAnywhere/ADFS. Production swaps
        <code className="text-xs"> issuer-uri</code> to the real corporate discovery endpoint.
      </p>
      <div className="mt-6 space-y-10">
        <div id="e2e">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            OAuth + OIDC end-to-end
          </h3>
          <Mermaid chart={E2E} />
        </div>
        <div id="groups">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            AD group claims → Spring roles
          </h3>
          <Mermaid chart={GROUPS} />
        </div>
      </div>
    </section>
  );
}
