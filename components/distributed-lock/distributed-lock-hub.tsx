'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {LOCK_TOC} from '@/lib/distributed-lock/toc';
import {TOPICS} from '@/lib/distributed-lock/topics';
import {CHEAT,DECISION,MATRIX,REMEMBER} from '@/lib/distributed-lock/comparison';
import StickyToc from './sticky-toc';
import TopicPanel from './topic-panel';
import InterviewMode from './interview-mode';
import CodePanel from './code-panel';

function Section({id,title,lead,children}:{id:string;title:string;lead?:string;children:React.ReactNode}){
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-3xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{title}</h2>
      {lead && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function DistributedLockHub(){
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Staff · Principal · Architect · Spring Boot · Banking
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Distributed Locking
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Problem → diagram → Spring code → failure → trade-off → interview answer
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          ~90% visual/code. JVM locks:{' '}
          <Link href="/java-locking" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">Java Locking</Link>
          {' '}· deep 2PL/3PL lab:{' '}
          <Link href="/distributed-systems/distributed-locking" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">Distributed Systems</Link>
          {' '}· demo:{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-900">spring-distributed-lock-demo/</code>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={LOCK_TOC}/>
        <div className="min-w-0 space-y-16">
          <Section id="overview" title="Why synchronized Fails Across Pods" lead="A distributed lock lets many Spring Boot instances coordinate so only one owns a critical section.">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TB
  LB[Load Balancer] --> A1[App-1 JVM]
  LB --> A2[App-2 JVM]
  LB --> A3[App-3 JVM]
  A1 --> DB[(Database)]
  A2 --> DB
  A3 --> DB`}/>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel title="WRONG mental model" tone="danger" code={`App-1 → synchronized → JVM-1 only
App-2 → synchronized → JVM-2 only
❌ Locks are NOT shared across instances`}/>
              <CodePanel title="Distributed lock" tone="ok" code={`App-1 ──┐
App-2 ──┼──> Lock Store (Redis/DB/ZK)
App-3 ──┘         │
                  ▼
            Critical Section`}/>
            </div>
          </Section>

          <Section id="taxonomy" title="Distributed Locking Map">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TB
  ROOT[DISTRIBUTED LOCKING]
  ROOT --> DB[Database]
  ROOT --> RD[Redis]
  ROOT --> ZK[ZooKeeper]
  ROOT --> OT[Other]
  DB --> FU[FOR UPDATE]
  DB --> LT[Lock Table]
  RD --> NX[SET NX PX]
  RD --> RS[Redisson]
  ZK --> CUR[Curator]
  OT --> HZ[Hazelcast]
  OT --> ISP[Infinispan]
  OT --> FL[File FS legacy]`}/>
            </div>
          </Section>

          <Section id="banking" title="Bank Debit Race — Account A100" lead="Balance ₹1000. Two requests debit ₹700. Without coordination both can succeed incorrectly.">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`sequenceDiagram
  participant A as App-1
  participant B as App-2
  participant DB as PostgreSQL
  A->>DB: read 1000
  B->>DB: read 1000
  A->>DB: write 300
  B->>DB: write 300
  Note over DB: Race — both debits applied wrongly`}/>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TD
  R1[Request-1] --> L[Acquire account:A100]
  L --> OK[Read → Validate → Debit → Commit → Release]
  R2[Request-2] --> L2[Acquire]
  L2 --> BUSY[LOCK BUSY → wait/retry/fail]`}/>
            </div>
          </Section>

          {TOPICS.map((t)=><TopicPanel key={t.id} t={t}/>)}

          <Section id="matrix" title="Comparison Matrix">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    {['Lock','Implementation','Best for','Main risk'].map((h)=>(
                      <th key={h} className="px-2 py-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MATRIX.map((r)=>(
                    <tr key={r.name} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-2 py-2 font-semibold">{r.name}</td>
                      <td className="px-2 py-2">{r.impl}</td>
                      <td className="px-2 py-2">{r.best}</td>
                      <td className="px-2 py-2 text-slate-500">{r.risk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="decision" title="Final Decision Tree">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TD
  N[Need concurrency control?] --> J{Single JVM?}
  J -->|Yes| JVM[synchronized / ReentrantLock]
  J -->|No| ROW{Row is critical section?}
  ROW -->|Yes| FU[FOR UPDATE / atomic SQL]
  ROW -->|No| R{Redis in stack?}
  R -->|Yes| RD[Redis / Redisson]
  R -->|No| Z[ZK / Hazelcast / lock table]
  N2[Conflicts rare?] -->|Yes| OPT[@Version]
  N3[Multi-service TX?] -->|Yes| SAGA[Saga — not one giant lock]`}/>
            </div>
            <div className="mt-4 space-y-2">
              {DECISION.map((d)=>(
                <div key={d.q} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="font-semibold">{d.q}</div>
                  <div className="text-slate-500">Yes → {d.yes}</div>
                  <div className="text-slate-500">No → {d.no}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="interview" title="Interview Mode">
            <InterviewMode/>
          </Section>

          <Section id="lab" title="Runnable Lab" lead="spring-distributed-lock-demo — concurrent debit of A100 with Redis-style lock (in-memory for tests) + optional Redis profile.">
            <CodePanel title="Quick start" code={`cd spring-distributed-lock-demo
mvn test
mvn spring-boot:run
# two shells:
curl -X POST 'localhost:8080/api/accounts/A100/debit?amount=700'
curl -X POST 'localhost:8080/api/accounts/A100/debit?amount=700'
# one succeeds, one gets 409 LOCK_BUSY — balance never negative`}/>
          </Section>

          <Section id="cheat" title="Cheat Sheet">
            <div className="grid gap-2 md:grid-cols-2">
              {CHEAT.map(([k,v])=>(
                <div key={k} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="font-bold">{k}</div>
                  <div className="text-slate-500">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {REMEMBER.map(([n,a])=>(
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
