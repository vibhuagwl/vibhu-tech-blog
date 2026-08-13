'use client';

import Link from 'next/link';
import type {ReactNode} from 'react';
import Mermaid from '@/components/mermaid';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import type {DemoSourceFile, DemoTreeNode} from '@/lib/spring-camunda-lab-source';
import {CAMUNDA_TOC} from '@/lib/camunda/toc';
import {TOPICS} from '@/lib/camunda/topics';
import {
  ALTERNATIVES_TABLE,
  C7_VS_C8_TABLE,
  CHEAT,
  CHECKLIST,
  CLOSING,
  COMPONENT_TABLE,
  DECISION_TREE,
  MEMORY_SENTENCE,
  PROS_CONS,
  STORY_ANSWERS,
} from '@/lib/camunda/comparison';
import {PRODUCTION_MISTAKES} from '@/lib/camunda/mistakes';
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
  children: ReactNode;
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

export default function CamundaHub({
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
          Staff · Principal · Architect · Camunda 8 · Zeebe · Spring Boot 3 · Payments
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Camunda 8 BPMN Payment Platform — Interview and Production Hub
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Build the payment processing story with Zeebe, BPMN, Spring workers, user tasks, timers,
          messages, retries, incidents, saga compensation, Kubernetes, and production runbooks.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Lab:{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-900">camunda-payment-platform/</code>
          {' · '}
          <Link href="/encryption" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Encryption
          </Link>
          {' · '}
          <Link href="/spring-security" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Spring Security
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={CAMUNDA_TOC} />
        <div className="min-w-0 space-y-5">
          <Section
            id="overview"
            title="Big Picture — Camunda 8 Payment Processing"
            lead="The platform orchestrates Validate -> Fraud -> Gateway -> Account -> Process -> Bank -> Notify. Failures are first-class: fraud reject, bank timeout/5xx retry, incident, and manager approval for amount > 100000."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
                <Mermaid
                  chart={`flowchart TD
  Client[Client request] --> API[PaymentController :8094]
  API --> DB[(Payment DB)]
  API --> Z[Zeebe Gateway :26500]
  Z --> V[validate-payment]
  V --> F[fraud-check]
  F -->|reject| NR[notify rejected]
  F -->|approved| G[payment-gateway]
  G --> A[account-validation]
  A --> H{amount > 100000}
  H -->|yes| M[manual-review]
  H -->|no| P[process-payment]
  M --> P
  P --> B[bank-settlement]
  B --> N[notify-payment]`}
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <Mermaid
                  chart={`flowchart LR
  Z[Zeebe] --> Jobs[Durable jobs]
  Jobs --> W[Idempotent Spring workers]
  W --> DB[(Payment DB source of truth)]
  W --> Bank[Bank/Gateway/Fraud]
  Z --> Op[Operate :8081 incidents]
  Z --> Task[Tasklist approvals]
  DB --> API[Customer status API]
  W --> Metrics[Metrics/traces/logs]`}
                />
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Payment story"
                code={`Validate -> Fraud -> Gateway -> Account -> Process -> Bank -> Notify

Failure paths:
1. Fraud reject -> notify rejected -> end
2. Bank timeout/5xx -> retry with backoff -> incident in Operate
3. Amount > 100000 -> manual-review user task
4. Approval timeout -> escalate or reject
5. Later failure -> saga compensation`}
              />
              <CodePanel
                title="Spring/Camunda lab shape"
                tone="ok"
                code={`camunda-payment-platform/ on port 8094

com.vibhu.payment.controller.PaymentController
com.vibhu.payment.config.CamundaConfiguration
com.vibhu.payment.worker.ValidatePaymentWorker
com.vibhu.payment.worker.FraudCheckWorker
com.vibhu.payment.worker.AccountValidationWorker
com.vibhu.payment.worker.ProcessPaymentWorker
com.vibhu.payment.worker.NotifyPaymentWorker
src/main/resources/payment-process.bpmn

Zeebe Gateway: 26500
Operate:       8081`}
              />
            </div>
          </Section>

          <Section
            id="code-sequences"
            title="Lifecycle Sequence Diagrams"
            lead="Read these before the topic cards. Each diagram maps the payment story to Spring classes, BPMN job types, Zeebe commands, and production failure behavior."
          >
            <SequenceWalkthrough />
            <div className="mt-6">
              <LabCallMap />
            </div>
          </Section>

          {TOPICS.map((t) => (
            <TopicPanel key={t.id} t={t} />
          ))}

          <Section
            id="reference-tables"
            title="Reference Tables — Components, C7/C8, Alternatives"
            lead="The topic cards explain the reasoning; these tables are the fast interview reference."
          >
            <div className="space-y-6">
              <MiniTable
                headers={['Component', 'Role', 'Port', 'Production note']}
                rows={COMPONENT_TABLE.map((r) => [r.component, r.role, r.port, r.production])}
              />
              <MiniTable
                headers={['Area', 'Camunda 7', 'Camunda 8', 'Note']}
                rows={C7_VS_C8_TABLE.map((r) => [r.area, r.c7, r.c8, r.note])}
              />
              <MiniTable
                headers={['Choice', 'Best when', 'Avoid when', 'Payment fit']}
                rows={ALTERNATIVES_TABLE.map((r) => [r.choice, r.best, r.avoid, r.paymentFit])}
              />
            </div>
          </Section>

          <Section id="decision-tree" title="Decision Tree">
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <CodePanel title="Camunda vs Temporal vs Step Functions vs Kafka" code={DECISION_TREE} tone="ok" />
              <div className="space-y-2">
                {PROS_CONS.map(([kind, text]) => (
                  <div
                    key={text}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                      kind === 'Pro'
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100'
                        : 'border border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100'
                    }`}
                  >
                    {kind}: {text}
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section
            id="storytelling"
            title="Storytelling Answers"
            lead="Use these when the interviewer asks for a concise production story instead of a definition."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {STORY_ANSWERS.map((story) => (
                <div key={story.label} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">{story.label}</div>
                  <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{story.text}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="interview" title="Interview Mode">
            <InterviewMode />
          </Section>

          <Section
            id="lab"
            title="Runnable Lab"
            lead="The Java lab is expected at camunda-payment-platform/. This hub only points to it; it does not create the lab."
          >
            <CodePanel
              title="Expected quick start + smoke tests"
              code={`cd camunda-payment-platform
mvn test
mvn spring-boot:run   # Spring app :8094

curl -sS -X POST http://127.0.0.1:8094/api/payments \\
  -H 'Content-Type: application/json' \\
  -d '{"paymentId":"pay-100","amount":4200,"currency":"USD"}'

curl -sS -X POST http://127.0.0.1:8094/api/payments/pay-100/bank-callback

open http://127.0.0.1:8081   # Operate
zeebe gateway: 127.0.0.1:26500`}
            />
            {files.length > 0 && (
              <div className="mt-6">
                <OAuthCodeExplorer
                  files={files}
                  tree={tree}
                  defaultPath={defaultPath}
                  routeBase="/camunda"
                  ariaLabel="Camunda payment platform source tree"
                />
              </div>
            )}
          </Section>

          <Section id="checklist" title="Production Checklist">
            <ul className="grid gap-2 md:grid-cols-2">
              {CHECKLIST.map((item) => (
                <li key={item} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-800">
                  [ ] {item}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <MiniTable
                headers={['Bad', 'Good', 'Why']}
                rows={PRODUCTION_MISTAKES.map((r) => [r.bad, r.good, r.why])}
              />
            </div>
          </Section>

          <Section id="cheat-sheet" title="Cheat Sheet">
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
