'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {MEMORY_SENTENCE, PROD_TOC} from '@/lib/production-troubleshooting/toc';
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
import {
  ANTI_PATTERNS,
  CHECKLIST,
  DEBEZIUM_ASCII,
  DEBEZIUM_ROWS,
  DECISION_TREES,
  FIRST_MINUTES_ROWS,
  GOLDEN_SIGNALS_NOTE,
  IMMEDIATE_VS_PERMANENT_ROWS,
  LAYER_CHAIN_ASCII,
  MINDSET_ASCII,
  MONGO_ROWS,
  MULTI_LAYER,
  OBSERVE_CORRELATE_ASCII,
  POSTMORTEM_TEMPLATE,
  RELATED_DEEP_DIVES,
  SENIORITY_ROWS,
  UNIVERSAL_FRAMEWORK_ASCII,
} from '@/lib/production-troubleshooting/handbook';
import {SCENARIOS} from '@/lib/production-troubleshooting/scenarios';
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
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · Architect · Java · Spring · AWS · Incident Commander
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Production Troubleshooting Playbook
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          15+ years production engineer handbook: incident commander mindset, investigation framework, 90+ war-room
          scenarios, multi-layer chains, CDC/Mongo/K8s commands — without duplicating Performance / Realtime / Kafka /
          Resilience4j deep dives.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Related:{' '}
          <Link href="/performance" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Performance
          </Link>
          {' · '}
          <Link href="/realtime-issues" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Real-Time Issues
          </Link>
          {' · '}
          <Link href="/kafka-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Kafka
          </Link>
          {' · '}
          <Link href="/resilience4j" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Resilience4j
          </Link>
          {' · '}
          <Link href="/api-gateway" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            API Gateway
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={PROD_TOC} />
        <div className="min-w-0 space-y-5">
          <Section id="mindset" title="00. Production engineering mindset" lead="What separates a 15+ YOE IC from a restart-and-hope engineer.">
            <CodePanel title="IC contract" code={MINDSET_ASCII} />
          </Section>

          <Section id="framework" title="01. Universal incident investigation framework" lead="Alert → mitigate → RCA → prevent. Measure before you change anything.">
            <CodePanel title="Lifecycle + resource tree" code={UNIVERSAL_FRAMEWORK_ASCII} />
          </Section>

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

          <Section id="first-minutes" title="03. First minutes playbook" lead="What to establish before you change production.">
            <MiniTable headers={['Window', 'Establish', 'Decide']} rows={FIRST_MINUTES_ROWS} />
            <p className="mt-3 text-sm text-slate-500">
              Deep stuck-thread dumps & payment RCA:{' '}
              <Link href="/realtime-issues" className="font-semibold hover:underline">
                Real-Time Issues curricula
              </Link>
              . JVM/GC/Hikari deep dive:{' '}
              <Link href="/performance" className="font-semibold hover:underline">
                Performance handbook
              </Link>
              .
            </p>
          </Section>

          <Section id="layers" title="04. Dependency layer chain" lead="Locate the hop before naming the fix.">
            <CodePanel title="Where time goes" code={LAYER_CHAIN_ASCII} />
          </Section>

          <Section id="immediate" title="05. Immediate mitigation vs permanent fix" lead="Restart is never a permanent fix.">
            <MiniTable headers={['Situation', 'Immediate', 'Permanent', 'Never']} rows={IMMEDIATE_VS_PERMANENT_ROWS} />
          </Section>

          <Section id="cdc" title="14. Debezium · CDC" lead="Troubleshoot the whole pipe — slot growth is a P1 waiting to happen.">
            <CodePanel title="CDC pipe" code={DEBEZIUM_ASCII} />
            <MiniTable headers={['Incident', 'Check first', 'Mitigate', 'Permanent']} rows={DEBEZIUM_ROWS} />
          </Section>

          <Section id="mongo" title="15. MongoDB incidents" lead="Hot shards and missing indexes look like app failures.">
            <MiniTable headers={['Incident', 'Check first', 'Mitigate', 'Permanent']} rows={MONGO_ROWS} />
          </Section>

          <Section id="antipatterns" title="20. Things experienced engineers never do" lead="These make outages worse.">
            <MiniTable headers={['Never', 'Why dangerous', 'Do instead']} rows={ANTI_PATTERNS} />
          </Section>

          <Section id="trees" title="21. Decision trees" lead="Memorize the first branch — then follow evidence.">
            <div className="space-y-4">
              {Object.entries(DECISION_TREES).map(([key, tree]) => (
                <CodePanel key={key} title={key} code={tree} />
              ))}
            </div>
          </Section>

          <Section id="multilayer" title="22. Multi-layer incidents" lead="Staff/Principal: reason across App → JVM → Kafka → CDC → DB → K8s → AWS.">
            <div className="space-y-3">
              {MULTI_LAYER.map((m) => (
                <details key={m.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <summary className="cursor-pointer list-none text-lg font-semibold text-slate-900 dark:text-white">
                    {m.title}
                  </summary>
                  <div className="mt-3 space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
                    <CodePanel title="Chain" code={m.chain} />
                    <p>
                      <strong>Root cause:</strong> {m.rootCause}
                    </p>
                    <p className="font-semibold">{m.interview}</p>
                  </div>
                </details>
              ))}
            </div>
          </Section>

          <Section id="scenarios" title={`23. ${SCENARIOS.length}+ production scenarios`} lead="Filter by layer. Each card is a war-room mini-runbook — compact; deep curricula link out.">
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

          <Section id="commands" title="Command Toolbox" lead="Command → tells me → abnormal → next.">
            <MiniTable
              headers={['Layer', 'Command', 'Tells me', 'Abnormal', 'Next']}
              rows={COMMANDS.map((r) => [r.g, r.c, r.t, r.a, r.n])}
            />
          </Section>

          <Section id="interview" title="30. Interview mode">
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

          <Section id="cheat" title="31. Cheat sheet">
            <CodePanel title="Correlate signals" code={OBSERVE_CORRELATE_ASCII} />
            <CodePanel title="SLI / SLO / error budget" code={GOLDEN_SIGNALS_NOTE} />
            <div className="mt-4 grid gap-2 md:grid-cols-2">
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

          <Section id="related" title="32. Deep dives — link out, do not duplicate" lead="Canonical depth lives on sibling hubs. Use this page for IC process and war-room scenarios.">
            <div className="grid gap-3 md:grid-cols-2">
              {RELATED_DEEP_DIVES.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 dark:border-slate-800"
                >
                  <p className="font-semibold text-slate-900 dark:text-white">{r.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{r.useWhen}</p>
                </Link>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
