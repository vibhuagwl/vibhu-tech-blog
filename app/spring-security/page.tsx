import Link from 'next/link';

const items=[
  {href:'/oauth-jwt-demo',title:'OAuth + JWT Code',blurb:'Browse full Spring Security source for authorization server, resource server, JWT, and OAuth flows.'},
  {href:'/spring-auth-demo',title:'Authn + Authz Code',blurb:'Spring Security form login and HTTP Basic without OAuth.'},
  {href:'/spring-csrf-demo',title:'CSRF Protection',blurb:'Session CSRF, CookieCsrfTokenRepository for SPAs, forged POST → 403, and when JWT APIs disable CSRF.'},
<<<<<<< HEAD
  {href:'/spring-cors-demo',title:'CORS Security',blurb:'End-to-end CORS: allowlist, preflight OPTIONS, credentials, blocked evil origins, and a second-origin frontend.'},
  {href:'/idanywhere-demo',title:'IDAnywhere OIDC',blurb:'ADFS/OIDC SSO Spring wiring with enterprise-style login flow and JWT API.'},
=======
      {href:'/idanywhere-demo',title:'IDAnywhere OIDC SSO',blurb:'OIDC vs ADFS vs IDAnywhere; Okta/Keycloak profiles; internal token flow and sequence diagrams.'},
>>>>>>> origin/main
];

export const metadata={
  title:'Spring Security',
<<<<<<< HEAD
  description:'One hub for Spring Security source demos: OAuth + JWT, Authn + Authz, CSRF Protection, CORS Security, and IDAnywhere OIDC.',
=======
  description:'One hub for Spring Security source demos: OAuth + JWT, Authn + Authz, CSRF Protection, and IDAnywhere OIDC SSO.',
>>>>>>> origin/main
};

export default function SpringSecurityHubPage(){
  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Spring Security Tab
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          Spring Security hub
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          All Spring Security code demos in one place: OAuth + JWT, authentication + authorization,
          CSRF protection, CORS security, and IDAnywhere-style OIDC wiring.
        </p>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        {items.map((item)=>(
          <Link key={item.href} href={item.href} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.blurb}</p>
            <div className="mt-4 text-sm font-semibold text-blue-700 dark:text-blue-400">Open →</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
