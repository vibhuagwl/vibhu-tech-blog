'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {COST_TOC} from '@/lib/cost-optimization/toc';
import {TOPICS} from '@/lib/cost-optimization/topics';
import {
  CHEAT,
  CODE_REVIEW_COST,
  DECISION,
  FIVE_MIN,
  GOLDEN,
  OPTION_COMPARE,
  REVIEW_CHECKLIST,
  SAVINGS_BACKLOG,
  SCORECARD,
  SIXTY,
  TOOLBOX,
} from '@/lib/cost-optimization/comparison';
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

export default function CostOptimizationHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Staff · Principal · Architect · Java · Spring · AWS · FinOps
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Cloud Cost Optimization &amp; Impact Analysis
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Predict, measure, control, and reduce cost — before and after you build. Code → traffic amplification
          → capacity math → NAT/logs/Kafka → TCO and cost/txn. ~90% diagrams, calculations, and production
          scenarios. ₹ figures are illustrative; verify live AWS pricing.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Related:{' '}
          <Link href="/production-troubleshooting" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Prod Troubleshooting
          </Link>
          {' · '}
          <Link href="/api-gateway" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            API Gateway
          </Link>
          {' · '}
          <Link href="/db-sharding" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            DB Sharding
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={COST_TOC} />
        <div className="min-w-0 space-y-5">
          <Section
            id="overview"
            title="Core Cost Equation · Mindset"
            lead="Cheapest architecture is not always best. Optimize waste and TCO while meeting performance, availability, and security."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <Mermaid
                  chart={`flowchart TD
  TOTAL[TOTAL CLOUD COST] --> COMP[Compute EC2 ECS EKS Lambda]
  TOTAL --> DATA[Data RDS DynamoDB S3 Cache]
  TOTAL --> NET[Network NAT CF APIGW Transfer]
  APP[Application waste] --> INEFF[N+1 · retries · logs · cache miss · amplification]
  INEFF --> TOTAL`}
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <Mermaid
                  chart={`flowchart TB
  CO[COST OPTIMIZATION] --> R[REDUCE waste]
  CO --> C[CONTROL budgets alerts]
  CO --> P[PREDICT capacity forecast]
  COST --> ST[Short-term infra]
  COST --> LT[Long-term eng + ops]`}
                />
              </div>
            </div>
            <CodePanel
              title="Architect thinking"
              code={`Ask NOT: "What is the cheapest AWS service?"
Ask: "What architecture delivers the business outcome
at lowest acceptable TOTAL COST while meeting
performance, availability, security, and ops constraints?"

Business → Traffic → SLA → Data profile
  → Architecture → Capacity model → Cost model
  → Risk model → Decision`}
            />
          </Section>

          {TOPICS.map((t) => (
            <TopicPanel key={t.id} t={t} />
          ))}

          <Section
            id="scorecard"
            title="Scorecard · Options · Checklists · Savings Backlog"
            lead="Lowest AWS bill ≠ lowest TCO. Compare options; prioritize Impact × Confidence ÷ Effort."
          >
            <MiniTable
              headers={['Dimension', 'A: EC2+RDS', 'B: ECS+RDS', 'C: Lambda+DDB']}
              rows={OPTION_COMPARE.map((r) => [r.d, r.a, r.b, r.c])}
            />
            <div className="mt-4">
              <MiniTable
                headers={['Architecture', 'Compute', 'DB', 'Net', 'Ops', 'Eng', 'Scale', 'Cost']}
                rows={SCORECARD.map((s) => [
                  s.name,
                  String(s.compute),
                  String(s.db),
                  String(s.net),
                  String(s.ops),
                  String(s.eng),
                  String(s.scale),
                  String(s.cost),
                ])}
              />
            </div>
            <div className="mt-4">
              <MiniTable
                headers={['Optimization', 'Monthly save*', 'Effort', 'Risk', 'Priority']}
                rows={SAVINGS_BACKLOG}
              />
              <p className="mt-2 text-xs text-slate-500">*Illustrative savings — verify with your Cost Explorer baseline.</p>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Architecture review</div>
                <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  {REVIEW_CHECKLIST.map((c) => (
                    <li key={c}>□ {c}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Cost-aware code review</div>
                <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  {CODE_REVIEW_COST.map((c) => (
                    <li key={c}>□ {c}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4">
              <MiniTable headers={['Problem', 'Primary tool']} rows={TOOLBOX} />
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TD
  USERS --> CF[CloudFront / WAF]
  CF --> APIGW[API Gateway]
  APIGW --> ALB
  ALB --> SA[Service A] & SB[Service B] & SC[Service C]
  SA & SB & SC --> REDIS & KAFKA & DB
  DB --> AWS[AWS bill]
  AWS --> COST[Compute DB Network Storage Observability]
  OPT[Code · Query · Cache · Traffic control · Right-size · Lifecycle · NAT · Sampling] --> COST`}
              />
            </div>
            <div className="mt-4 space-y-2">
              {DECISION.map((d) => (
                <div key={d.q} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="font-semibold">{d.q}</div>
                  <div className="text-slate-500">Yes → {d.yes}</div>
                  <div className="text-slate-500">Else → {d.no}</div>
                </div>
              ))}
            </div>
            <CodePanel
              title="100k RPS payment whiteboard prompts"
              code={`1. Instances? (RPS × latency / capacity × HA)
2. Edge / APIGW / ALB choice?
3. Why this DB / cache / Kafka shape?
4. Fan-out budget per user request?
5. NAT / cross-AZ / cross-region paths?
6. Log & trace volume at peak?
7. Spike / retry / cache-miss behavior?
8. Monthly TCO + cost/txn at 1×, 2×, 10×?
9. Biggest optimization opportunities?
10. What must NOT be cut (HA/security)?`}
            />
          </Section>

          <Section id="interview" title="Interview Mode">
            <InterviewMode />
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">60-second answer</div>
                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{SIXTY}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">5-minute architect answer</div>
                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{FIVE_MIN}</p>
              </div>
            </div>
          </Section>

          <Section id="cheat" title="Cheat Sheet · Golden Rules">
            <div className="grid gap-2 md:grid-cols-2">
              {CHEAT.map(([k, v]) => (
                <div key={k} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="font-bold">{k}</div>
                  <div className="text-slate-500">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {GOLDEN.map((g, i) => (
                <div key={g} className="rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">
                  <span className="font-bold">{i + 1}.</span> {g}
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm font-semibold text-slate-800 dark:text-slate-200">
              Best cost optimization is eliminating unnecessary work — not buying the cheapest SKU.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
