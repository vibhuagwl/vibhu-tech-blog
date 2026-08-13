'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {CONCURRENCY_TOC} from '@/lib/java-concurrency/toc';
import {CONCURRENCY_TIMELINE} from '@/lib/java-concurrency/timeline';
import {API_COVERAGE} from '@/lib/java-concurrency/coverage';
import {TOPICS} from '@/lib/java-concurrency/topics';
import {CHEAT,COMPARISONS,DECISION_ROWS,REMEMBER,THIRTY_MIN} from '@/lib/java-concurrency/comparison';
import StickyToc from './sticky-toc';
import TopicPanel from './topic-panel';
import {Challenges,InterviewMode} from './interview-mode';
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

const MAP_LINKS=[
  ['thread','Threads'],['synchronized','Locks'],['atomic','Atomics'],['executor','Executors'],
  ['chm','Collections'],['bq','Queues'],['semaphore','Synchronizers'],['cf','Async'],
  ['vt','Virtual Threads'],['structured','Structured Concurrency'],['scoped','Scoped Values'],
];

export default function JavaConcurrencyHub(){
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Staff · Principal · Architect · 25+ years · Java 1 → 25
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Java Concurrency
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Internals · APIs · Patterns · Production — SEE → RUN → BREAK → FIX → REMEMBER
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          ~10% theory. Lock deep-dives also on{' '}
          <Link href="/java-locking" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">Java Locking</Link>
          . JDK 25: <strong>Scoped Values FINAL (JEP 506)</strong>; <strong>Structured Concurrency PREVIEW (JEP 505)</strong>.
          Run code in the{' '}
          <Link href="/java-compiler" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">Java Compiler</Link>.
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={CONCURRENCY_TOC}/>
        <div className="min-w-0 space-y-5">
          <Section id="overview" title="Overview" lead="Concurrent Bank / Payment Platform story maps every API to a teller, line, vault key, or badge.">
            <div className="grid gap-3 md:grid-cols-3">
              {REMEMBER.slice(0,6).map(([n,a])=>(
                <div key={n} className="rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-800">
                  <div className="font-bold">{n}</div>
                  <div className="mt-1 text-slate-500">{a}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="timeline" title="Version Timeline">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TB
  J1[Java1 Thread sync wait] --> J5[Java5 j.u.c pools locks atomics]
  J5 --> J7[Java7 ForkJoin Phaser]
  J7 --> J8[Java8 CF StampedLock LongAdder]
  J8 --> J9[Java9 Flow VarHandle]
  J9 --> J21[Java21 Virtual Threads FINAL]
  J21 --> J25[Java25 ScopedValue FINAL / SC PREVIEW]`}/>
            </div>
            <div className="mt-4 space-y-3">
              {CONCURRENCY_TIMELINE.map((era)=>(
                <div key={era.version} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="font-bold">{era.version}{era.year?` · ${era.year}`:''}</div>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    {era.features.map((f)=>(
                      <li key={f.name}>
                        <span className="font-semibold">{f.name}</span>
                        <span className="ml-2 text-xs uppercase text-slate-400">{f.status}</span>
                        {f.note && <span className="ml-2 text-xs text-slate-500">{f.note}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section id="api-map" title="API Master Map" lead="Click a node to jump.">
            <div className="flex flex-wrap gap-2">
              {MAP_LINKS.map(([id,label])=>(
                <a key={id} href={`#${id}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:border-blue-400 dark:border-slate-700 dark:bg-slate-950">{label}</a>
              ))}
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TB
  ROOT[JAVA CONCURRENCY]
  ROOT --> TH[Threads]
  ROOT --> LK[Locks]
  ROOT --> EX[Executors]
  ROOT --> AT[Atomics]
  ROOT --> COL[Collections]
  ROOT --> SYN[Synchronizers]
  ROOT --> AS[Async]
  ROOT --> MOD[Modern]
  TH --> thread
  LK --> synchronized
  LK --> reentrant-lock
  AT --> atomic
  EX --> tpe
  EX --> fjp
  COL --> chm
  COL --> bq
  SYN --> semaphore
  AS --> cf
  MOD --> vt
  MOD --> scoped
  MOD --> structured`}/>
            </div>
          </Section>

          {TOPICS.map((t)=><TopicPanel key={t.id} t={t}/>)}

          <Section id="bugs" title="Concurrency Bug Lab" lead="Broken → observe → fix. More lock-focused labs on /java-locking.">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ['Race','unsync balance -= amt'],
                ['Deadlock','lock A then B vs B then A'],
                ['Visibility','non-volatile ready flag'],
                ['Atomicity','volatile count++'],
                ['TL leak','set without remove on pool'],
                ['Queue bomb','unbounded FixedThreadPool'],
                ['CommonPool JDBC','CF supplyAsync blocking'],
                ['VT DB melt','10k VT → same pool'],
              ].map(([t,b])=>(
                <div key={t} className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm dark:border-rose-900 dark:bg-rose-950/30">
                  <div className="font-bold text-rose-900 dark:text-rose-100">{t}</div>
                  <div className="mt-1 text-rose-800 dark:text-rose-200">{b}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="payment" title="Payment Processing System">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TB
  API[Payment API] --> VAL[Validate]
  VAL --> F[Fraud CF/VT]
  VAL --> A[Account]
  VAL --> X[FX]
  F --> C[Combine]
  A --> C
  X --> C
  C --> SEM[Semaphore gateway]
  SEM --> DB[(DB txn)]
  DB --> K[Event]`}/>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Use CF/VT for fan-out, Semaphore for gateway, DB/@Version for money, CHM for idempotency — not one lock for everything.
            </p>
            <CodePanel title="Fan-out sketch (Java 21+)" code={`try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
  var fraud = ex.submit(this::fraud);
  var acct = ex.submit(this::account);
  return decide(fraud.get(), acct.get());
}`}/>
          </Section>

          <Section id="ecommerce" title="E-commerce Aggregator Evolution">
            <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">{`Future get chains → CompletableFuture thenCombine
  → VirtualThreadPerTaskExecutor
  → Structured Concurrency (PREVIEW in 25 — experiment only)`}</pre>
          </Section>

          <Section id="decision" title="Decision Tree / Which API?">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500 dark:bg-slate-900">
                  <tr><th className="px-3 py-2 text-left">Problem</th><th className="px-3 py-2 text-left">Start with</th><th className="px-3 py-2 text-left">Why</th></tr>
                </thead>
                <tbody>
                  {DECISION_ROWS.map((r)=>(
                    <tr key={r.problem} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-3 py-2">{r.problem}</td>
                      <td className="px-3 py-2 font-semibold">{r.pick}</td>
                      <td className="px-3 py-2 text-slate-500">{r.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="comparison" title="Master Comparisons">
            <div className="space-y-3">
              {COMPARISONS.map((c)=>(
                <div key={c.pair} className="rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-800">
                  <div className="font-bold">{c.pair}</div>
                  <div className="mt-1">A: {c.a}</div>
                  <div>B: {c.b}</div>
                  {'c' in c && (c as {c?:string}).c && <div>C: {(c as {c?:string}).c}</div>}
                  <div className="mt-1 text-rose-700 dark:text-rose-300">Breaks at scale: {c.breaks}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="coverage" title="API Coverage Matrix">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-2 py-2 text-left">API</th>
                    <th className="px-2 py-2 text-left">Since</th>
                    <th className="px-2 py-2 text-left">Java 25</th>
                    <th className="px-2 py-2 text-left">Code</th>
                    <th className="px-2 py-2 text-left">Diagram</th>
                  </tr>
                </thead>
                <tbody>
                  {API_COVERAGE.map((a)=>(
                    <tr key={a.name} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-2 py-2 font-semibold">{a.name}</td>
                      <td className="px-2 py-2">{a.introduced}</td>
                      <td className="px-2 py-2">{a.java25}</td>
                      <td className="px-2 py-2">{a.code?'✓':''}</td>
                      <td className="px-2 py-2">{a.diagram?'✓':''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="challenges" title="Guess the Output">
            <Challenges/>
          </Section>

          <Section id="interview" title="Interview Mode">
            <InterviewMode/>
          </Section>

          <Section id="rapid-fire" title="Rapid-Fire Bank" lead="Principal-level prompts — open Interview Mode → rapid (100) or scenario (75+).">
            <p className="text-sm text-slate-500">Use filters above in Interview Mode; answers emphasize mechanism → failure → production choice.</p>
          </Section>

          <Section id="thirty-min" title="Interview in 30 Minutes">
            <div className="grid gap-3 md:grid-cols-2">
              {THIRTY_MIN.map((t)=>(
                <a key={t.id} href={`#${t.id==='syncvol'?'synchronized':t.id==='cas'?'atomic':t.id==='scsv'?'scoped':t.id}`} className="rounded-2xl border border-slate-200 p-4 hover:border-blue-400 dark:border-slate-800">
                  <div className="font-bold">{t.title}</div>
                  <ul className="mt-2 list-disc pl-4 text-sm text-slate-600 dark:text-slate-300">
                    {t.facts.map((f)=><li key={f}>{f}</li>)}
                  </ul>
                  <div className="mt-2 text-xs text-rose-600">Trap: {t.trap}</div>
                  <div className="mt-1 text-xs text-blue-700 dark:text-blue-400">Q: {t.q}</div>
                </a>
              ))}
            </div>
          </Section>

          <Section id="cheat" title="One-Page Cheat Sheet">
            <div className="grid gap-2 md:grid-cols-2">
              {CHEAT.map(([q,a])=>(
                <div key={q} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="text-slate-500">{q}</div>
                  <div className="font-semibold">→ {a}</div>
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

          <Section id="architecture" title="Internal Architecture Map">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TB
  APP[Application] --> API[Concurrency APIs]
  API --> LOCKS[Locks AQS]
  API --> ATM[Atomics VarHandle]
  API --> EX[Executors FJP]
  API --> VT[Virtual Threads]
  LOCKS --> JVM[JVM]
  ATM --> JVM
  EX --> JVM
  VT --> JVM
  JVM --> OS[OS / CPU caches / atomics]`}/>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
