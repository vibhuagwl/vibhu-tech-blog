'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import SpringSecurityInterviewMemory from '@/components/spring-security-interview-memory';
import CodePanel from '@/components/hub-code-panel';
import {CHEAT_SHEET} from '@/lib/spring-security/cheatsheet';
import {COMPARISON_TABLES} from '@/lib/spring-security/comparison';
import {SECURITY_TOC, VERSION_NOTE} from '@/lib/spring-security/toc';
import {INTERVIEW_QA, TOPICS} from '@/lib/spring-security/topics';
import StickyToc from './sticky-toc';
import TopicPanel from './topic-panel';

const existingLabs = [
  {href: '/encryption', title: 'Encryption & Decryption', blurb: 'AES-GCM · hybrid RSA+AES · field crypto · HMAC · Argon2 — lab :8093'},
  {href: '/spring-jwt-demo', title: 'JWT Access + Refresh', blurb: 'First-party JWT · BCrypt · HS256 · opaque refresh — :8092'},
  {href: '/oauth-jwt-demo', title: 'OAuth + JWT', blurb: 'Authorization Server :9000 · Gateway :8080 · Resource Server :8081'},
  {href: '/spring-auth-demo', title: 'Authn + Authz', blurb: 'Form session + HTTP Basic — no OAuth — :8080/:8081'},
  {href: '/spring-csrf-demo', title: 'CSRF Protection', blurb: 'Session CSRF · SPA XSRF token · forged POST → 403 — :8090'},
  {href: '/spring-cors-demo', title: 'CORS Security', blurb: 'Allowlist · preflight OPTIONS · blocked evil origins — :8091'},
  {href: '/idanywhere-demo', title: 'IDAnywhere OIDC SSO', blurb: 'OIDC vs Okta/Keycloak · groups → roles — :8088/:9080/:8089'},
  {href: '/spring-xss-demo', title: 'XSS Defense', blurb: 'th:text vs th:utext · HtmlUtils escape'},
  {href: '/spring-sql-injection-demo', title: 'SQL Injection', blurb: 'Concat SQL vs PreparedStatement / JdbcTemplate'},
  {href: '/spring-ddos-demo', title: 'DDoS Defenses', blurb: 'Rate limiting → 429 · CDN/WAF layers'},
  {href: '/spring-n-plus-one', title: 'JPA N+1', blurb: 'Query performance — related security/ops topic'},
];

function Section({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-3xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{title}</h2>
      {lead && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function MiniTable({headers, rows}: {headers: string[]; rows: string[][]}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-2 py-2 text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.join('|')} className="border-t border-slate-200 dark:border-slate-800">
              {r.map((c, i) => (
                <td key={i} className={`px-2 py-2 align-top ${i === 0 ? 'font-semibold' : ''}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SecuritySvg({src, alt}: {src: string; alt: string}) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/vibhu-tech-blog/images/security/${src}`} alt={alt} className="h-auto w-full" loading="lazy" />
    </figure>
  );
}

export default function SpringSecurityHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Senior · Staff · Principal · Java · Spring Boot · FinTech Security
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Spring Security &amp; Architecture Security Hub
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          HTTP → HTTPS → TLS → mTLS → JWT/OAuth/OIDC → AWS KMS — diagram-first, ~90% runnable Java/Spring
          config and commands.
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-500">{VERSION_NOTE}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <a href="#master-map" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
            Master map →
          </a>
          <a href="#cheat-sheet" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
            Cheat sheet →
          </a>
          <a href="#labs" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
            Labs →
          </a>
          <a href="#interview-memory" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
            Interview memory →
          </a>
        </div>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={SECURITY_TOC} />
        <div className="min-w-0 space-y-8">
          <Section
            id="master-map"
            title="Security master map"
            lead="One screen: client → edge → Spring Boot → data plane. Blue = network · green = auth · orange = crypto · purple = authz · red = threat."
          >
            <SecuritySvg src="security-master-map.svg" alt="End-to-end security master map from client to SIEM" />
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  subgraph NET["Network (blue)"]
    C[Client] --> DNS --> CDN --> WAF --> LB --> GW[API Gateway]
  end
  GW --> SB[Spring Boot]
  subgraph SS["Spring Security (green/purple)"]
    SB --> FC[Filter Chain]
    FC --> AUTH[Authentication]
    FC --> AUTHZ[Authorization]
  end
  AUTH --> JWT[JWT / OAuth2 / OIDC]
  AUTH --> MTLS[mTLS identity]
  SB --> DB[(Database TLS)]
  SB --> KF[Kafka TLS/SASL]
  SB --> KMS[AWS KMS]
  SB --> SM[Secrets Manager]
  SB --> SIEM[Audit / SIEM]`}
              />
            </div>
          </Section>

          <Section id="cheat-sheet" title="Security interview cheat sheet" lead="Term → memory hook. Expand any row in topic panels for code.">
            <MiniTable headers={['Term', 'Remember']} rows={CHEAT_SHEET} />
          </Section>

          <Section id="stack-ladder" title="HTTP → HTTPS → TLS → mTLS → Spring → AWS" lead="The ladder every Staff interview draws on a whiteboard.">
            <SecuritySvg src="security-stack-ladder.svg" alt="Security stack ladder from HTTP to AWS KMS" />
            <CodePanel
              title="Stack ladder — copy for whiteboard"
              code={`HTTP (8080 plaintext)
  ↓ TLS cert on server
HTTPS (8443 server.ssl.enabled)
  ↓ client-auth: need + trust-store
mTLS (both sides present certs)
  ↓ Spring Security filter chain
JWT / OAuth2 / OIDC (user + client identity)
  ↓ @PreAuthorize / scopes
RBAC / ABAC / OAuth scopes
  ↓ envelope + rotation
AWS ACM (edge) · KMS (data keys) · Secrets Manager (credentials)`}
              tone="neutral"
            />
          </Section>

          <div id="labs" className="scroll-mt-28">
            <h2 className="text-3xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">Runnable labs (preserved)</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
              All existing labs remain — open for full source, Mermaid flows, and Spring Boot code.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {existingLabs.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-950"
                >
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.blurb}</p>
                  <div className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">Open lab →</div>
                </Link>
              ))}
            </div>
          </div>

          <div id="interview-memory" className="scroll-mt-28">
            <SpringSecurityInterviewMemory />
          </div>

          <Section id="topics" title="All security topics" lead="Click + to expand. Default tab is Code / config. 75+ topics across network, crypto, app, OAuth/tokens, authorization, cloud, and architecture — gap-filled for Staff/Principal interviews.">
            <div className="space-y-4">
              {TOPICS.map((t) => (
                <TopicPanel key={t.id} t={t} />
              ))}
            </div>
          </Section>

          <Section id="comparisons" title="Comparison tables">
            <div className="space-y-6">
              {COMPARISON_TABLES.map((t) => (
                <div key={t.title}>
                  <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">{t.title}</h3>
                  <MiniTable headers={t.headers} rows={t.rows} />
                </div>
              ))}
            </div>
          </Section>

          <Section id="interview-qa" title="Interview Q&amp;A">
            <div className="space-y-4">
              {INTERVIEW_QA.map((q) => (
                <details
                  key={q.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
                >
                  <summary className="cursor-pointer text-base font-bold text-slate-900 dark:text-white">
                    {q.question}
                    <span className="ml-2 text-xs font-normal text-slate-500">({q.topic})</span>
                  </summary>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    <p>
                      <strong>30s:</strong> {q.answer30s}
                    </p>
                    <p>
                      <strong>2m:</strong> {q.answer2m}
                    </p>
                    <p>
                      <strong>Follow-ups:</strong> {q.followUps.join(' · ')}
                    </p>
                    {q.traps && (
                      <p className="rounded-lg bg-amber-50 p-3 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                        <strong>Traps:</strong> {q.traps}
                      </p>
                    )}
                    {'labHref' in q && q.labHref && (
                      <Link href={q.labHref} className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
                        Open lab →
                      </Link>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
