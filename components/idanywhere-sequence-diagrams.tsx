'use client';

import Mermaid from '@/components/mermaid';

/** Keep labels Mermaid-safe: no curly braces in messages; use <br/> for line breaks. */
const INTERNAL = `sequenceDiagram
    autonumber
    participant Browser
    participant App as Spring web-app<br/>oauth2Login
    participant IdP as IdP IDAnywhere / Okta / Keycloak
    participant Disco as Discovery + JWKS
    participant API as resource-api<br/>JWT resource server

    Browser->>App: GET /payments no session
    App-->>Browser: 302 /oauth2/authorization/idanywhere
    Browser->>IdP: GET /oauth2/authorize openid state nonce
    IdP->>Browser: Login + MFA
    Browser->>IdP: credentials
    IdP-->>Browser: 302 redirect_uri?code
    Browser->>App: GET /login/oauth2/code/idanywhere?code
    App->>Disco: GET /.well-known/openid-configuration
    App->>IdP: POST /oauth2/token
    IdP-->>App: id_token + access_token
    App->>App: Validate id_token via JWKS
    App-->>Browser: Session + 302 /payments
    Browser->>App: GET /payments with session
    App->>API: GET /api/payments Bearer access_token
    API->>Disco: GET /oauth2/jwks
    API->>API: Validate JWT map groups to roles
    API-->>App: 200 JSON
    App-->>Browser: 200 HTML`;

const WAYS = `flowchart TD
  A[OIDC SSO for a Spring app] --> B[Authorization Code confidential]
  A --> C[Authorization Code SPA plus BFF]
  A --> D[Avoid ROPC for browsers]
  B --> E[Web MVC oauth2Login]
  C --> F[BFF holds tokens]
  E --> G[IdP product]
  F --> G
  G --> H[IDAnywhere ADFS]
  G --> I[Okta]
  G --> J[Keycloak]
  G --> K[Azure AD Auth0 Cognito]
  H --> L[Same Spring code different issuer-uri]
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
    App->>IDA: GET /oauth2/authorize
    IDA->>ADFS: Federate login
    ADFS->>AD: Authenticate user + groups
    AD-->>ADFS: OK + group membership
    ADFS-->>IDA: Authn success + claims
    IDA-->>App: authorization code
    App->>IDA: POST /oauth2/token
    IDA-->>App: id_token + access_token JWT
    Note over App,AD: App never sees AD password`;

const OKTA = `sequenceDiagram
    autonumber
    participant User
    participant App as Spring web-app<br/>profile=okta
    participant Okta as Okta Org
    participant API as resource-api<br/>profile=okta

    User->>App: GET /payments
    App->>Okta: GET /oauth2/default/v1/authorize
    Okta->>User: Okta login / MFA
    Okta-->>App: code
    App->>Okta: POST /token
    Okta-->>App: id_token + access_token
    App->>API: GET /api/payments Bearer
    API->>Okta: GET JWKS
    API-->>App: 200`;

const KEYCLOAK = `sequenceDiagram
    autonumber
    participant User
    participant App as Spring web-app<br/>profile=keycloak
    participant KC as Keycloak<br/>realms/payments
    participant API as resource-api<br/>profile=keycloak

    User->>App: GET /payments
    App->>KC: GET openid-connect/auth
    KC->>User: Realm login
    KC-->>App: code
    App->>KC: POST openid-connect/token
    KC-->>App: id_token + access_token
    App->>API: GET /api/payments Bearer
    API->>KC: GET certs JWKS
    API-->>App: 200`;

const GROUPS = `sequenceDiagram
    autonumber
    participant API as resource-api
    Note over API: Claim name differs by IdP
    API->>API: IDAnywhere ADFS groups claim
    API->>API: Okta groups claim
    API->>API: Keycloak realm_access.roles
    API->>API: JwtAuthenticationConverter to ROLE_
    API->>API: PreAuthorize hasRole ADMIN`;

const diagrams = [
  {
    id: 'ida-stack',
    title: 'IDAnywhere + ADFS + AD relationship',
    blurb:
      'Read bottom-up: AD stores users; ADFS authenticates against AD; IDAnywhere is the OIDC front door your Spring app calls. App never LDAP-binds to AD and usually never talks to ADFS hostnames directly.',
    chart: IDA_STACK,
  },
  {
    id: 'internal',
    title: 'How OIDC SSO works internally (any IdP)',
    blurb:
      'Browser ↔ Spring ↔ IdP only. Discovery finds /authorize, /token, JWKS. Code becomes id_token + access_token. Session for HTML; Bearer JWT for the API. Swap IdP product — this sequence stays the same.',
    chart: INTERNAL,
  },
  {
    id: 'ways-flow',
    title: 'Ways to implement OIDC SSO (flow)',
    blurb:
      'First pick a browser pattern (Authorization Code or BFF). Then pick an IdP product. Spring oauth2Login wiring does not care which product — only issuer-uri / client credentials change.',
    chart: WAYS,
  },
  {
    id: 'okta',
    title: 'Same app with Okta',
    blurb:
      'Profile okta — only issuer-uri / client-id / secret change. End-to-end OIDC flow identical to IDAnywhere. Okta replaces the IDAnywhere+ADFS front door from the app’s point of view.',
    chart: OKTA,
  },
  {
    id: 'keycloak',
    title: 'Same app with Keycloak',
    blurb:
      'Profile keycloak — realm issuer URL. Same Authorization Code + JWT API pattern. Useful for local / self-hosted IdP practice.',
    chart: KEYCLOAK,
  },
  {
    id: 'groups',
    title: 'Group / role claims → Spring authorization',
    blurb:
      'IdP proves identity (authentication). Your API still decides authorization: map IdP group/role claims to ROLE_* then @PreAuthorize. Claim JSON paths differ by IdP — converter code absorbs that.',
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
        Diagrams start with the <a href="#ida-stack" className="font-semibold underline dark:text-blue-400">IDAnywhere + ADFS + AD stack</a>, then the{' '}
        <a href="#internal" className="font-semibold underline dark:text-blue-400">OIDC token handshake</a>, then Okta / Keycloak.
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
