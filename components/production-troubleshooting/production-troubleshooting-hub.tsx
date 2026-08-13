'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {PROD_TOC} from '@/lib/production-troubleshooting/toc';
import {TOPICS} from '@/lib/production-troubleshooting/topics';
import {
  CHEAT,
  COMMANDS,
  DECISION,
  FIVE_MIN,
  MITIGATION_MATRIX,
  REMEMBER,
  SIXTY,
  SYMPTOM_TABLE,
} from '@/lib/production-troubleshooting/comparison';
import StickyToc from './sticky-toc';
import TopicPanel from './topic-panel';
import InterviewMode from './interview-mode';
import ScenarioBrowser from './scenario-browser';
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

export default function ProductionTroubleshootingHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Staff · Principal · Architect · Java · Spring · AWS · Incident Commander
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Production Troubleshooting Playbook
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Detect → triage → evidence → mitigate → root cause → rollback/fix-forward → escalate → RCA. Full stack:
          browser to AWS. ~90% diagrams, commands, and incidents.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Related:{' '}
          <Link href="/load-balancing" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Load Balancing
          </Link>
          {' · '}
          <Link href="/db-sharding" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            DB Sharding
          </Link>
          {' · '}
          <Link href="/performance" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Performance
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={PROD_TOC} />
        <div className="min-w-0 space-y-5">
          <Section
            id="overview"
            title="Incident: Payment Latency After Deploy"
            lead="p95 200ms → 8s, errors 0.2% → 12%, CPU 90%, threads 500, DB connections 100% — right after production deployment."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <Mermaid
                  chart={`flowchart TD
  U[User] --> FE[Angular/React] --> CF[CloudFront] --> WAF --> GW[API Gateway] --> ALB
  ALB --> A1[App-1]
  ALB --> A2[App-2]
  ALB --> A3[App-3]
  A1 --> PAY[Payment]
  PAY --> REDIS[(Redis)]
  PAY --> PG[(PostgreSQL)]
  PAY --> KAFKA[[Kafka]]`}
                />
              </div>
              <CodePanel
                title="Before → After"
                code={`Before deploy
  p95=200ms  p99=400ms  err=0.2%

After deploy
  p95=4s  p99=8s  err=12%
  CPU=90%  threads=500  DB pool=100%

Path: SYMPTOM → EVIDENCE → CORRELATION → ROOT CAUSE
Do not guess. Mitigate with evidence.`}
                tone="danger"
              />
            </div>
          </Section>

          {TOPICS.map((t) => (
            <TopicPanel key={t.id} t={t} />
          ))}

          <Section id="scenarios" title="50 Production Scenarios" lead="Filter by layer. Each card is a war-room mini-runbook.">
            <ScenarioBrowser />
          </Section>

          <Section id="architecture" title="Master Decision Tree">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TD
  P[PROD ISSUE] --> IMP{Impact layer?}
  IMP --> FE[Frontend Angular/React/CDN]
  IMP --> BE[Backend Spring/GW/ALB]
  BE --> LAT{API latency?}
  LAT --> CPU
  LAT --> THREADS
  LAT --> DB
  LAT --> DEPS[Redis Kafka HTTP]
  IMP --> INF[AWS Network DNS K8s]
  FE --> RCA[Evidence → Mitigate → RCA]
  CPU --> RCA
  THREADS --> RCA
  DB --> RCA
  DEPS --> RCA
  INF --> RCA`}
              />
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  U[USER] --> FE[Angular/React] --> CF[CloudFront] --> WAF --> GW --> ALB
  ALB --> SA[Service A]
  ALB --> SB[Service B]
  ALB --> SC[Service C]
  SA --> REDIS[(Redis)]
  SA --> KAFKA[[Kafka]]
  SA --> DB[(DB)]
  DB --> AWS[EC2/EKS/RDS]
  OBS[Metrics Logs Traces Alerts Profiles Events]`}
              />
            </div>
          </Section>

          <Section id="decision" title="Symptom → Check → Root Cause">
            <MiniTable
              headers={['Symptom', 'First check', 'Next', 'Likely roots']}
              rows={SYMPTOM_TABLE.map((r) => [r.s, r.f, r.n, r.r])}
            />
            <div className="mt-6">
              <MiniTable
                headers={['Problem', 'Immediate mitigation', 'Investigate']}
                rows={MITIGATION_MATRIX.map((r) => [r.p, r.m, r.i])}
              />
            </div>
            <div className="mt-6 space-y-2">
              {DECISION.map((d) => (
                <div key={d.q} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="font-semibold">{d.q}</div>
                  <div className="text-slate-500">Yes → {d.yes}</div>
                  <div className="text-slate-500">No → {d.no}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="commands" title="Command Toolbox">
            <MiniTable
              headers={['Layer', 'Commands', 'When', 'Look for']}
              rows={COMMANDS.map((r) => [r.g, r.c, r.w, r.l])}
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

          <Section id="cheat" title="Cheat Sheet">
            <div className="grid gap-2 md:grid-cols-2">
              {CHEAT.map(([k, v]) => (
                <div key={k} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="font-bold">{k}</div>
                  <div className="text-slate-500">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
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
