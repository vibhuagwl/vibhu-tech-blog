'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import type {DemoSourceFile, DemoTreeNode} from '@/lib/oauth-demo-source';
import {MULTI_TENANT_TOC} from '@/lib/multi-tenant/toc';
import {TOPICS} from '@/lib/multi-tenant/topics';
import {
  CHEAT,
  CHECKLIST,
  CLOSING,
  COST_MODEL,
  DECISION_MATRIX,
  FAILURE_CASES,
  FIVE_MIN,
  INDUSTRY_PICKS,
  MEMORY_SENTENCE,
  SIXTY_SEC,
  STRATEGY_HEADERS,
  TEN_MIN,
  TWO_MINUTE_STORY,
} from '@/lib/multi-tenant/comparison';
import {PRODUCTION_MISTAKES} from '@/lib/multi-tenant/mistakes';
import CodePanel from './code-panel';
import InterviewMode from './interview-mode';
import SequenceWalkthrough, {LabCallMap} from './sequence-walkthrough';
import StickyToc from './sticky-toc';
import TopicPanel from './topic-panel';

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

const SECTION_TOPIC_IDS = new Set([
  'overview',
  'architecture',
  'strategies',
  'lab',
  'checklist',
  'cheat-sheet',
]);

export default function MultiTenantHub({
  files = [],
  tree = [],
  defaultPath = '',
}: {
  files?: DemoSourceFile[];
  tree?: DemoTreeNode[];
  defaultPath?: string;
}) {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · Architect · Spring Boot · PostgreSQL · Kafka · Redis
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Multi-Tenant SaaS — Order Platform Architecture
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Production multi-tenancy for a SaaS Order Management Platform: Walmart vs Amazon isolation, JWT
          binding, shared schema + RLS, hybrid dedicated DBs, Redis keys, Kafka outbox/DLQ, and interview banks.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Lab:{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-900">spring-multitenant-lab/</code>
          {' · '}
          <Link href="/spring-security" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Spring Security
          </Link>
          {' · '}
          <Link href="/kafka-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Kafka
          </Link>
          {' · '}
          <Link href="/distributed-caching" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Caching
          </Link>
          {' · '}
          <Link href="/db-sharding" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Sharding
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={MULTI_TENANT_TOC} />
        <div className="min-w-0 space-y-16">
          <Section
            id="overview"
            title="01. Business Story"
            lead="One platform, many companies. Tenant A must never access Tenant B — across DB, cache, Kafka, files, and logs."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TD
  Client --> GW[API Gateway]
  GW --> Auth[JWT / OAuth2]
  Auth --> TR[Tenant Resolver]
  TR --> TC[Tenant Context]
  TC --> Svc[Order / Payment / Customer]
  Svc --> DL[Tenant Data Layer]
  DL --> Shared[(Shared Postgres + tenant_id + RLS)]
  DL --> Ded[(Dedicated DB enterprise)]`}
              />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Demo tenants: <strong>walmart</strong>, <strong>amazon</strong>, <strong>jpmorgan</strong> (enterprise
              metadata), <strong>abc-retail</strong>. Hard rule: cross-tenant access is a Sev-1.
            </p>
          </Section>

          <Section id="architecture" title="02. Recommended Architecture">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  Internet --> GW[API Gateway]
  GW --> JWT[OAuth2 / JWT]
  JWT --> TR[Tenant Resolver]
  TR --> TC[Tenant Context + MDC]
  TC --> REST[REST APIs]
  TC --> K[Kafka / Outbox]
  REST --> SVC[Spring Services]
  K --> ES[Event Services]
  SVC --> TDL[Tenant Data Layer]
  ES --> TDL
  TDL --> PG[(Shared Postgres)]
  TDL --> DED[(Dedicated DB)]
  PG --> RLS[RLS]
  TDL --> Redis[(Redis tenant keys)]`}
              />
            </div>
          </Section>

          <Section
            id="code-sequences"
            title="Request Sequences"
            lead="Happy path, cross-tenant deny, header spoof, outbox/Kafka, and onboarding saga."
          >
            <SequenceWalkthrough />
            <div className="mt-6">
              <LabCallMap />
            </div>
          </Section>

          <Section id="strategies" title="03. DB Strategy Comparison">
            <MiniTable headers={STRATEGY_HEADERS} rows={DECISION_MATRIX} />
            <div className="mt-6">
              <MiniTable headers={['Industry', 'Pick', 'Why']} rows={INDUSTRY_PICKS} />
            </div>
            <div className="mt-6">
              <MiniTable headers={['Model', 'Shape', 'Cost signal']} rows={COST_MODEL} />
            </div>
          </Section>

          {TOPICS.filter((t) => !SECTION_TOPIC_IDS.has(t.id)).map((t) => (
            <TopicPanel key={t.id} t={t} />
          ))}

          <Section id="failures" title="Failure scenarios">
            <MiniTable
              headers={['Failure', 'Detection', 'Recovery', 'Retry', 'Fallback', 'Alert']}
              rows={FAILURE_CASES}
            />
          </Section>

          <Section id="mistakes" title="Production mistakes">
            <MiniTable
              headers={['Bad', 'Good', 'Why']}
              rows={PRODUCTION_MISTAKES.map((r) => [r.bad, r.good, r.why])}
            />
          </Section>

          <Section id="interview" title="Interview bank" lead="Short answer, deep answer, follow-up if they push.">
            <InterviewMode />
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">60-second answer</div>
                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{SIXTY_SEC}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">5-minute architect answer</div>
                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{FIVE_MIN}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">10-minute deep dive</div>
                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{TEN_MIN}</p>
              </div>
            </div>
          </Section>

          <Section id="storytelling" title="2-minute interview story">
            <div className="rounded-2xl bg-slate-900 p-6 text-sm font-medium leading-8 text-slate-100">{TWO_MINUTE_STORY}</div>
          </Section>

          <Section
            id="lab"
            title="Runnable lab"
            lead="Spring Boot 3.4 / Java 21 on port 8096. Default profile uses H2 + in-memory cache/event bus. infra profile adds Postgres, Redis, and Kafka via Docker Compose."
          >
            <CodePanel
              title="Quick start + cross-tenant curl"
              code={`cd spring-multitenant-lab
mvn test
mvn spring-boot:run   # :8096

# Mint tokens
WAL=$(curl -sS -X POST 'http://127.0.0.1:8096/api/lab/token?tenantSlug=walmart' | jq -r .token)
AMZ=$(curl -sS -X POST 'http://127.0.0.1:8096/api/lab/token?tenantSlug=amazon' | jq -r .token)

# Walmart creates an order (see README for full JSON)
ORDER=$(curl -sS -X POST http://127.0.0.1:8096/api/orders \\
  -H "Authorization: Bearer $WAL" -H 'Content-Type: application/json' \\
  -d '{"customerEmail":"c@walmart.example","amount":49.99}')
ID=$(echo "$ORDER" | jq -r .id)

# Amazon cannot read it
curl -sS -o /dev/null -w '%{http_code}\\n' \\
  -H "Authorization: Bearer $AMZ" http://127.0.0.1:8096/api/orders/$ID
# expect 404

# Header spoof
curl -sS -o /dev/null -w '%{http_code}\\n' \\
  -H "Authorization: Bearer $WAL" -H 'X-Tenant-ID: amazon' \\
  http://127.0.0.1:8096/api/orders
# expect 403

# Full stack
docker compose up -d
mvn spring-boot:run -Dspring-boot.run.profiles=infra`}
            />
            {files.length > 0 && (
              <div className="mt-6">
                <OAuthCodeExplorer
                  files={files}
                  tree={tree}
                  defaultPath={defaultPath}
                  routeBase="/multi-tenant"
                  ariaLabel="Multi-tenant Spring lab source tree"
                />
              </div>
            )}
          </Section>

          <Section id="checklist" title="Production checklist">
            <ul className="grid gap-2 md:grid-cols-2">
              {CHECKLIST.map((item) => (
                <li key={item.item} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-800">
                  <span className="font-semibold text-slate-500">{item.level}</span>
                  <span className="mx-2">·</span>
                  {item.item}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="cheat-sheet" title="Cheat sheet">
            <div className="grid gap-2 md:grid-cols-2">
              {CHEAT.map(([k, v]) => (
                <div key={k} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="font-bold">{k}</div>
                  <div className="text-slate-500">{v}</div>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-3xl text-base font-semibold leading-7 text-slate-800 dark:text-slate-200">
              {CLOSING}
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
