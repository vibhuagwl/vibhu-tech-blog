'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {GW_TOC} from '@/lib/api-gateway/toc';
import {TOPICS} from '@/lib/api-gateway/topics';
import {
  CHEAT,
  DECISION,
  FIVE_MIN,
  LB_VS_GW,
  REMEMBER,
  SIXTY,
  STATUS,
} from '@/lib/api-gateway/comparison';
import StickyToc from './sticky-toc';
import TopicPanel from './topic-panel';
import InterviewMode from './interview-mode';
import CodePanel from './code-panel';

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
                <td key={i} className={`px-2 py-2 ${i === 0 ? 'font-semibold' : ''}`}>
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

export default function ApiGatewayHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · Architect · Spring Cloud Gateway · AWS API Gateway
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          API Gateway
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Controlled entry for client APIs — routing, auth, rate limits, HA, AWS, troubleshooting, and
          payment idempotency. ~90% diagrams and code.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Live lab (full code):{' '}
          <Link
            href="/distributed-systems/gateway-live-interview-lab"
            className="font-semibold text-slate-700 hover:underline dark:text-slate-300"
          >
            Gateway Live Interview Lab
          </Link>
          {' · '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-900">spring-gateway-live-lab/</code>
          {' · '}
          <Link href="/load-balancing" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Load Balancing
          </Link>
          {' · '}
          <Link href="/resilience4j" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Resilience4j
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={GW_TOC} />
        <div className="min-w-0 space-y-5">
          <Section
            id="overview"
            title="Why API Gateway?"
            lead="Without a gateway, every microservice duplicates URLs, auth, rate limits, CORS, TLS, and logging — and clients learn the topology."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
                <Mermaid
                  chart={`flowchart TD
  CL[Client] --> U[User]
  CL --> P[Payment]
  CL --> A[Account]
  U --> D1[Auth RL CORS TLS]
  P --> D2[Auth RL CORS TLS]
  A --> D3[Auth RL CORS TLS]`}
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <Mermaid
                  chart={`flowchart TD
  CL[Client] --> GW[API Gateway]
  GW --> AUTH[Auth]
  GW --> RL[Rate Limit]
  GW --> RT[Routing]
  GW --> OBS[Observability]
  GW --> U[User]
  GW --> P[Payment]
  GW --> A[Account]`}
                />
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <strong>API Gateway is the controlled entry point between clients and backend services.</strong>
            </p>
          </Section>

          {TOPICS.map((t) => (
            <TopicPanel key={t.id} t={t} />
          ))}

          <Section id="lb-table" title="Load Balancer vs API Gateway">
            <MiniTable
              headers={['Feature', 'Load Balancer', 'API Gateway']}
              rows={LB_VS_GW.map((r) => [r.f, r.lb, r.gw])}
            />
            <div className="mt-4 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">
              LB = WHERE SHOULD TRAFFIC GO? · Gateway = IS THIS REQUEST ALLOWED AND HOW HANDLED?
            </div>
          </Section>

          <Section id="status-table" title="Status Code First Checks">
            <MiniTable
              headers={['Status', 'Typical area', 'First investigation']}
              rows={STATUS.map((r) => [r.c, r.a, r.i])}
            />
          </Section>

          <Section
            id="architecture"
            title="Final Banking Architecture"
            lead="Users → SPA → CloudFront → WAF → API Gateway (auth/RL/routing) → ALB → services → Redis/Kafka/DB."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  USERS --> FE[Angular/React] --> CF[CloudFront] --> WAF --> GW[API Gateway]
  GW --> AUTH[AuthN/AuthZ]
  GW --> RL[Rate Limit]
  GW --> RT[Routing/Versioning]
  GW --> ALB
  ALB --> SA[Service A]
  ALB --> SB[Service B]
  ALB --> SC[Service C]
  SA --> REDIS[(Redis)]
  SA --> KAFKA[[Kafka]]
  SA --> DB[(Database)]`}
              />
            </div>
            <CodePanel
              title="30-second interview answer"
              code={SIXTY}
              tone="ok"
            />
          </Section>

          <Section id="decision" title="Decision Trees">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TD
  P[API Problem] --> R{GW received?}
  R -->|NO| DNS[DNS/WAF/TLS]
  R -->|YES| S{Status}
  S --> C4[4xx Auth CORS RL Route]
  S --> C5[5xx Backend LB]
  S --> OK[2xx but slow → Trace]`}
              />
            </div>
            <div className="mt-4 space-y-2">
              {DECISION.map((d) => (
                <div key={d.q} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="font-semibold">{d.q}</div>
                  <div className="text-slate-500">Yes → {d.yes}</div>
                  <div className="text-slate-500">No → {d.no}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="interview" title="Interview Mode">
            <InterviewMode />
            <div className="mt-6 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">5-minute architect answer</div>
              <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{FIVE_MIN}</p>
            </div>
          </Section>

          <Section
            id="lab"
            title="Runnable Lab"
            lead="Full live interview stack: Eureka, lb://, multi-instance LB, AWS Terraform, fail-closed payments. Search the blog for fail-closed or gateway-live."
          >
            <p className="mb-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Blog walkthrough with embedded source:{' '}
              <Link
                href="/distributed-systems/gateway-live-interview-lab"
                className="font-semibold text-slate-800 underline-offset-2 hover:underline dark:text-slate-200"
              >
                API Gateway Live Lab — Full Code
              </Link>
              . Repo folder:{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-900">spring-gateway-live-lab/</code>
            </p>
            <CodePanel
              title="Quick start (live lab)"
              code={`cd spring-gateway-live-lab
mvn -pl eureka-server,user-service,order-service,payment-service,api-gateway spring-boot:run
./scripts/smoke-payments.sh
# Fail-closed CB · Idempotency-Key ledger · AWS terraform under aws/`}
            />
            <p className="mt-3 text-xs text-slate-500">
              Older utilities (token bucket / JWT samples):{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-900">spring-api-gateway-lab/</code>
            </p>
          </Section>

          <Section id="cheat" title="Cheat Sheet">
            <div className="grid gap-2 md:grid-cols-2">
              {CHEAT.map(([k, v]) => (
                <div key={k} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="font-bold">{k}</div>
                  <div className="text-slate-500">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {REMEMBER.map(([n, a]) => (
                <div key={n} className="rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">
                  <span className="font-bold">{n}</span> = {a}
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
