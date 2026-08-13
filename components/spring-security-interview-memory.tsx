import Link from 'next/link';

const labs = [
  {
    href: '/oauth-jwt-demo',
    title: 'OAuth + JWT',
    oneLiner: 'Browser → Client :8082 → AS :9000 → (Gateway :8080) → RS :8081',
    glue: 'Bearer JWT',
    remember: [
      'IdP: /oauth2/authorize · /oauth2/token · /oauth2/jwks',
      'Client: GET /payments (then RestClient + Bearer)',
      'API: GET|POST /api/payments · GET /api/admin/reports',
    ],
    say: 'Authorization Code gets JWT; resource server trusts JWKS, not the password.',
  },
  {
    href: '/spring-auth-demo',
    title: 'Authn + Authz',
    oneLiner: 'Browser → Portal :8080 (form+session). Tools → API :8081 (Basic).',
    glue: 'Session cookie  OR  Basic',
    remember: [
      'Portal: GET/POST /payments · GET /admin · POST /login',
      'API: GET /api/accounts/me · GET|POST /api/payments',
      'API: GET /api/admin/stats (ROLE_ADMIN)',
    ],
    say: 'Authn = who are you. Authz = what may you do. No OAuth in this lab.',
  },
  {
    href: '/spring-csrf-demo',
    title: 'CSRF',
    oneLiner: 'Browser → App :8090 with session. Evil site POST fails without token.',
    glue: 'Session + CSRF token',
    remember: [
      'Form: GET /transfer · POST /transfer (+ _csrf)',
      'SPA: GET /spa/csrf · POST /spa/transfer (+ X-XSRF-TOKEN)',
      'Missing token → HTTP 403 Invalid CSRF token',
    ],
    say: 'Cookie auth + browser → CSRF on. Pure Bearer JWT API → CSRF usually off.',
  },
  {
    href: '/spring-cors-demo',
    title: 'CORS',
    oneLiner: 'Page :5500 → fetch → API :8091. Browser enforces Origin allowlist.',
    glue: 'Basic + CORS headers',
    remember: [
      'GET /api/public/ping (open)',
      'GET /api/accounts/me · POST /api/transfers (auth + CORS)',
      'Bad Origin → browser blocks; Spring may 403 Invalid CORS request',
    ],
    say: 'CORS is browser policy. Server allowlists Origin; preflight is OPTIONS.',
  },
  {
    href: '/idanywhere-demo',
    title: 'IDAnywhere OIDC',
    oneLiner: 'Browser → Web :8088 → IdP :9080 → API :8089 (same as Okta/Keycloak).',
    glue: 'Bearer JWT (groups → roles)',
    remember: [
      'IdP: /oauth2/authorize · /oauth2/token · /oauth2/jwks',
      'Web: GET /payments · /login/oauth2/code/idanywhere',
      'API: GET /api/payments · GET /api/admin/stats',
    ],
    say: 'OIDC protocol. IDAnywhere/Okta/Keycloak only change issuer-uri.',
  },
] as const;

const triad = [
  {label: 'IdP trio', paths: '/oauth2/authorize  →  /oauth2/token  →  /oauth2/jwks'},
  {label: 'App trio', paths: '/  ·  /payments  ·  /login/oauth2/code/{reg}'},
  {label: 'API trio', paths: '/api/payments  ·  /api/admin/**  ·  Bearer header'},
] as const;

export default function SpringSecurityInterviewMemory() {
  return (
    <section id="interview-memory" className="mt-14 scroll-mt-24">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Interview memory
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          REST endpoints &amp; who calls whom
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
          Memorize <strong>4 boxes</strong> and <strong>3 glues</strong>. Every demo is the same story with different glue.
        </p>
      </header>

      <figure className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/vibhu-tech-blog/images/spring-security/spring-security-components-map.svg"
          alt="Spring Security interview map: Browser, Login App, IdP, API and three auth glues"
          className="h-auto w-full"
        />
      </figure>

      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {triad.map((t) => (
          <div
            key={t.label}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-600 dark:text-slate-300">
              {t.label}
            </div>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-6 text-slate-800 dark:text-slate-200">
              {t.paths}
            </pre>
          </div>
        ))}
      </div>

      <blockquote className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-5 text-sm leading-7 text-slate-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-slate-200">
        <strong>30-second answer:</strong> The browser hits a login app. The login app redirects to the IdP
        (<code className="mx-1 rounded bg-white px-1.5 py-0.5 text-xs dark:bg-slate-900">/oauth2/authorize</code>
        and exchanges the code at
        <code className="mx-1 rounded bg-white px-1.5 py-0.5 text-xs dark:bg-slate-900">/oauth2/token</code>.
        APIs then accept
        <code className="mx-1 rounded bg-white px-1.5 py-0.5 text-xs dark:bg-slate-900">Authorization: Bearer</code>
        and verify the JWT with
        <code className="mx-1 rounded bg-white px-1.5 py-0.5 text-xs dark:bg-slate-900">/oauth2/jwks</code>.
        Session apps add CSRF; cross-origin SPAs add CORS.
      </blockquote>

      <h3 className="mt-10 text-xl font-bold text-slate-900 dark:text-white">
        Five labs — one chain each
      </h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        For each lab, remember the chain, the glue, and three endpoints.
      </p>

      <div className="mt-5 space-y-4">
        {labs.map((lab, i) => (
          <article
            key={lab.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 md:p-6"
          >
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-400">
                {i + 1} / 5
              </span>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">{lab.title}</h4>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {lab.glue}
              </span>
            </div>
            <p className="mt-2 font-mono text-sm leading-6 text-slate-700 dark:text-slate-300">
              {lab.oneLiner}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {lab.remember.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-blue-600 dark:text-blue-400">→</span>
                  <code className="rounded bg-slate-50 px-1 dark:bg-slate-900">{line}</code>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm italic leading-6 text-slate-500 dark:text-slate-400">
              Say: “{lab.say}”
            </p>
            <Link
              href={lab.href}
              className="mt-3 inline-block text-sm font-semibold text-slate-700 hover:underline dark:text-slate-300"
            >
              Open lab →
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3 font-semibold">Question</th>
              <th className="px-4 py-3 font-semibold">Answer in one line</th>
            </tr>
          </thead>
          <tbody className="text-slate-700 dark:text-slate-300">
            <tr className="border-t border-slate-200 dark:border-slate-800">
              <td className="px-4 py-3">Where does the password go?</td>
              <td className="px-4 py-3">Only the IdP / form login app — never the resource API.</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-800">
              <td className="px-4 py-3">How does the API trust the caller?</td>
              <td className="px-4 py-3">JWT signature via JWKS, or session/Basic — not by calling the IdP every request.</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-800">
              <td className="px-4 py-3">When is CSRF on?</td>
              <td className="px-4 py-3">Browser + cookie session. Off for pure Bearer JWT APIs.</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-800">
              <td className="px-4 py-3">When is CORS needed?</td>
              <td className="px-4 py-3">JS on origin A calling API on origin B — server allowlists A.</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-800">
              <td className="px-4 py-3">Okta vs IDAnywhere vs Keycloak?</td>
              <td className="px-4 py-3">Same endpoints conceptually — swap <code>issuer-uri</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
