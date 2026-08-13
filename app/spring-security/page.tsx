import Link from 'next/link';
import SpringSecurityInterviewMemory from '@/components/spring-security-interview-memory';

const items=[
  {href:'/oauth-jwt-demo',title:'OAuth + JWT Code',blurb:'Browse full Spring Security source for authorization server, resource server, JWT, and OAuth flows.'},
  {href:'/spring-auth-demo',title:'Authn + Authz Code',blurb:'Spring Security form login and HTTP Basic without OAuth.'},
  {href:'/spring-csrf-demo',title:'CSRF Protection',blurb:'Session CSRF, CookieCsrfTokenRepository for SPAs, forged POST → 403, and when JWT APIs disable CSRF.'},
  {href:'/spring-cors-demo',title:'CORS Security',blurb:'End-to-end CORS: allowlist, preflight OPTIONS, credentials, blocked evil origins, and a second-origin frontend.'},
  {href:'/idanywhere-demo',title:'IDAnywhere OIDC SSO',blurb:'OIDC vs ADFS vs IDAnywhere; Okta/Keycloak profiles; internal token flow and sequence diagrams.'},
  {href:'/spring-n-plus-one',title:'JPA N+1 Problem',blurb:'Root cause of 1+N queries, detection, JOIN FETCH, EntityGraph, @BatchSize, DTO projections — diagrams + runnable lab.'},
];

export const metadata={
  title:'Spring Security',
  description:'Spring interview hub: Security demos (OAuth, CSRF, CORS, OIDC) plus JPA N+1 — endpoints memory sheet, diagrams, and runnable labs.',
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
          Spring Security labs in one place — plus a short interview memory sheet for REST endpoints,
          and the JPA <strong>N+1</strong> problem guide (common Staff follow-up alongside Security).
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <a href="#interview-memory" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Interview memory (endpoints) →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#labs" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Labs →
          </a>
        </div>
      </header>

      <SpringSecurityInterviewMemory />

      <section id="labs" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Labs
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Open a lab for full source, Mermaid flows, and runnable Spring code.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          {items.map((item)=>(
            <Link key={item.href} href={item.href} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.blurb}</p>
              <div className="mt-4 text-sm font-semibold text-blue-700 dark:text-blue-400">Open →</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
