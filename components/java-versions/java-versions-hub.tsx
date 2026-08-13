'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {JAVA_VERSIONS_TOC} from '@/lib/java-versions/toc';
import {CAPABILITY_MATRIX,VERSION_TIMELINE} from '@/lib/java-versions/comparison';
import {JAVA_8} from '@/lib/java-versions/java8';
import {JAVA_11} from '@/lib/java-versions/java11';
import {JAVA_17} from '@/lib/java-versions/java17';
import {JAVA_21} from '@/lib/java-versions/java21';
import {JAVA_25} from '@/lib/java-versions/java25';
import {
  CONCURRENCY_MATRIX,
  CONCURRENCY_TIMELINE,
  FEATURE_EVOLUTIONS,
  GC_ROWS,
  JVM_ACROSS_VERSIONS,
  JVM_PIPELINE,
  JVM_TOPICS,
  PERFORMANCE_NOTES,
  SECURITY_NOTES,
} from '@/lib/java-versions/evolution';
import {
  ANTI_PATTERNS,
  ARCHITECTURE_DECISION_MATRIX,
  FULL_MIGRATION_STEPS,
  MIGRATION_FLOWS,
  RISK_MATRIX,
  VT_DECISION_TREE,
} from '@/lib/java-versions/migration';
import {
  ANSWER_FRAMEWORK,
  CHEAT_SHEET,
  INTERVIEW_QUESTIONS,
  ONE_LINERS,
  PRINCIPAL_QUESTIONS,
  SCENARIOS,
} from '@/lib/java-versions/interview';
import StickyToc from './sticky-toc';
import StatusBadge from './status-badge';
import VersionPanel from './version-panel';
import MigrationChecklist from './migration-checklist';
import InterviewMode from './interview-mode';

function Section({
  id,
  title,
  children,
  lead,
}:{
  id:string;
  title:string;
  lead?:string;
  children:React.ReactNode;
}){
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-3xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{title}</h2>
      {lead && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Flow({steps}:{steps:string[]}){
  return (
    <ol className="flex flex-col gap-2">
      {steps.map((s,i)=>(
        <li key={s} className="flex items-start gap-3 text-sm">
          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-900 text-[11px] font-bold text-white dark:bg-slate-100 dark:text-slate-900">
            {i+1}
          </span>
          <span className="leading-6 text-slate-700 dark:text-slate-300">{s}</span>
        </li>
      ))}
    </ol>
  );
}

export default function JavaVersionsHub(){
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Staff · Principal · Architect · 25+ years
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Java Version Evolution
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Java 8 → 11 → 17 → 21 → 25
          <span className="mt-1 block text-base text-slate-500">
            Features • JVM • Concurrency • Migration • Production • Interview
          </span>
        </p>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
          Code-first migration and interview reference for engineers who already ship Java in production.
          Java 25 feature status verified against the OpenJDK JDK 25 project page (GA 16 Sep 2025).
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <StatusBadge status="LTS"/>
          <StatusBadge status="FINAL"/>
          <StatusBadge status="PREVIEW"/>
          <StatusBadge status="INCUBATOR"/>
          <StatusBadge status="DEPRECATED"/>
          <StatusBadge status="REMOVED"/>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
          <a href="#timeline" className="text-blue-700 hover:underline dark:text-blue-400">Timeline</a>
          <a href="#java-21" className="text-blue-700 hover:underline dark:text-blue-400">Virtual Threads</a>
          <a href="#migrate-8-25" className="text-blue-700 hover:underline dark:text-blue-400">8→25 Roadmap</a>
          <a href="#interview-mode" className="text-blue-700 hover:underline dark:text-blue-400">Interview Mode</a>
          <a href="#cheat-sheet" className="text-blue-700 hover:underline dark:text-blue-400">Cheat Sheet</a>
        </div>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={JAVA_VERSIONS_TOC}/>

        <div className="min-w-0 space-y-20">
          <Section id="timeline" title="Version Timeline" lead="LTS landings that dominate enterprise platforms.">
            <div className="grid gap-3 md:grid-cols-5">
              {VERSION_TIMELINE.map((v,i)=>(
                <div key={v.version} className="relative rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{v.version}</div>
                    <StatusBadge status={v.kind}/>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-500">{v.year}</div>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{v.blurb}</p>
                  {i<VERSION_TIMELINE.length-1 && (
                    <div className="pointer-events-none absolute -right-2 top-1/2 hidden text-slate-300 md:block">→</div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart LR
  J8[Java 8 LTS 2014] --> J11[Java 11 LTS 2018]
  J11 --> J17[Java 17 LTS 2021]
  J17 --> J21[Java 21 LTS 2023]
  J21 --> J25[Java 25 LTS 2025]
  J8 -.-> Lang[Language evolution]
  J11 -.-> Ent[Enterprise baseline]
  J17 -.-> Mod[Modern Java]
  J21 -.-> Conc[Modern concurrency]
  J25 -.-> Latest[Latest LTS]`}/>
            </div>
          </Section>

          <Section id="comparison" title="Version Comparison Dashboard" lead="Capability presence by LTS. Structured Concurrency remains preview in 25 — shown as unavailable for production-final use.">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3">Capability</th>
                    <th className="px-4 py-3">8</th>
                    <th className="px-4 py-3">11</th>
                    <th className="px-4 py-3">17</th>
                    <th className="px-4 py-3">21</th>
                    <th className="px-4 py-3">25</th>
                  </tr>
                </thead>
                <tbody>
                  {CAPABILITY_MATRIX.map((row)=>(
                    <tr key={row.capability} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {row.capability}
                        {row.note && <div className="mt-1 text-xs font-normal text-slate-500">{row.note}</div>}
                      </td>
                      {([row.java8,row.java11,row.java17,row.java21,row.java25] as boolean[]).map((v,i)=>(
                        <td key={i} className="px-4 py-3">{v?'✓':''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <VersionPanel section={JAVA_8}/>
          <VersionPanel section={JAVA_11}/>
          <VersionPanel section={JAVA_17}/>

          <VersionPanel section={JAVA_21}/>

          <Section
            id="virtual-threads-deep-dive"
            title="Virtual Threads — Production Deep Dive"
            lead="Platform threads are scarce. Virtual threads are abundant for waiting work. They do not make CPU-bound applications faster."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                <h3 className="font-bold text-slate-900 dark:text-white">Platform threads</h3>
                <pre className="mt-3 overflow-x-auto text-xs leading-5 text-slate-600 dark:text-slate-300">{`Request 1 ───── Thread 1
Request 2 ───── Thread 2
Request 3 ───── Thread 3
...
Request 10000 ─ Thread 10000`}</pre>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                <h3 className="font-bold text-slate-900 dark:text-white">Virtual threads</h3>
                <pre className="mt-3 overflow-x-auto text-xs leading-5 text-slate-600 dark:text-slate-300">{`Request 1 ───┐
Request 2 ───┤
Request 3 ───┤
Request N ───┘── Virtual Threads
                 ↓
          Carrier Threads`}</pre>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TB
  API[Payment API] --> C[Customer Service]
  API --> A[Account Service]
  API --> F[Fraud Service]
  API --> DB[(Payment Database)]
  API -. platform pool .-> Risk1[Thread scarcity under wait]
  API -. virtual threads .-> Risk2[Downstream pool saturation risk]`}/>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ['Help', 'I/O-bound fan-out, blocking JDBC/HTTP, high concurrency waits'],
                ['Do not help', 'CPU-bound pricing/crypto/compression hot loops'],
                ['Watch', 'Pinning via synchronized/native; ThreadLocal proliferation'],
                ['Observe', 'JFR pinning, DB pool pending, downstream p99, carriers'],
              ].map(([t,b])=>(
                <div key={t} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">{t}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{b}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              <strong>Architect rule:</strong> Virtual threads primarily improve scalability for high-concurrency workloads where tasks spend significant time waiting.
              Do not claim they make CPU-bound applications faster.
            </div>
          </Section>

          <VersionPanel section={JAVA_25}/>

          <Section id="feature-evolution" title="Feature Evolution" lead="Interviewers love asking when a feature became final. Know the preview → final path.">
            <div className="grid gap-4 md:grid-cols-2">
              {FEATURE_EVOLUTIONS.map((f)=>(
                <div key={f.name} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                  <h3 className="font-bold text-slate-900 dark:text-white">{f.name}</h3>
                  <ol className="mt-4 space-y-2">
                    {f.steps.map((s)=>(
                      <li key={s.version+s.status} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{s.version}</span>
                        <StatusBadge status={s.status}/>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </Section>

          <Section id="jvm-evolution" title="JVM Evolution" lead="From source to machine code — and what changed across LTS lines.">
            <div className="flex flex-wrap gap-2">
              {JVM_PIPELINE.map((p,i)=>(
                <div key={p} className="flex items-center gap-2">
                  <span className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">{p}</span>
                  {i<JVM_PIPELINE.length-1 && <span className="text-slate-400">↓</span>}
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {JVM_TOPICS.map((t)=>(
                <div key={t.title} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white">{t.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{t.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-left">LTS</th>
                    <th className="px-4 py-3 text-left">JVM notes</th>
                  </tr>
                </thead>
                <tbody>
                  {JVM_ACROSS_VERSIONS.map((r)=>(
                    <tr key={r.version} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-4 py-3 font-semibold">Java {r.version}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="concurrency-evolution" title="Concurrency Evolution" lead="From executors to virtual threads — pick the model for the workload.">
            <div className="grid gap-3 md:grid-cols-3">
              {CONCURRENCY_TIMELINE.map((c)=>(
                <div key={c.era} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="text-xs font-bold uppercase tracking-[.12em] text-blue-700 dark:text-blue-400">{c.era}</div>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                    {c.items.map((i)=><li key={i}>{i}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-left">Workload</th>
                    <th className="px-4 py-3 text-left">Thread pool</th>
                    <th className="px-4 py-3 text-left">CompletableFuture</th>
                    <th className="px-4 py-3 text-left">Reactive</th>
                    <th className="px-4 py-3 text-left">Virtual threads</th>
                  </tr>
                </thead>
                <tbody>
                  {CONCURRENCY_MATRIX.map((r)=>(
                    <tr key={r.workload} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-4 py-3 font-semibold">{r.workload}</td>
                      <td className="px-4 py-3">{r.pool}</td>
                      <td className="px-4 py-3">{r.cf}</td>
                      <td className="px-4 py-3">{r.reactive}</td>
                      <td className="px-4 py-3">{r.vt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="gc-evolution" title="Garbage Collection Evolution" lead="No fake pause-number claims — choose from goals and bake-offs.">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-left">GC</th>
                    <th className="px-4 py-3 text-left">Latency</th>
                    <th className="px-4 py-3 text-left">Throughput</th>
                    <th className="px-4 py-3 text-left">Typical use</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {GC_ROWS.map((g)=>(
                    <tr key={g.name} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-4 py-3 font-semibold">{g.name}</td>
                      <td className="px-4 py-3">{g.latency}</td>
                      <td className="px-4 py-3">{g.throughput}</td>
                      <td className="px-4 py-3">{g.typical}</td>
                      <td className="px-4 py-3">{g.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Production choice: start from SLOs (pause vs throughput), heap shape, allocation rate, and vendor support.
              Bake off G1 vs Generational ZGC vs Generational Shenandoah under prod-like load; keep G1 as the paved-road default unless evidence wins.
            </p>
          </Section>

          <Section id="performance-evolution" title="Performance Evolution">
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {PERFORMANCE_NOTES.map((n)=><li key={n}>{n}</li>)}
            </ul>
          </Section>

          <Section id="security-evolution" title="Security Evolution">
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {SECURITY_NOTES.map((n)=><li key={n}>{n}</li>)}
            </ul>
          </Section>

          <Section id="migrate-8-11" title="Java 8 → 11 Migration" lead="Lowest-risk first hop for many estates — watch Java EE modules.">
            <div className="grid gap-6 lg:grid-cols-2">
              <Flow steps={MIGRATION_FLOWS['8to11']}/>
              <div className="rounded-2xl border border-slate-200 p-5 text-sm leading-7 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                Cover JDK upgrade, Maven/Gradle toolchains, Spring Boot 2.x alignment, Hibernate/JDBC/Kafka/Jackson,
                logging, Docker base images, CI agents, monitoring agents, TLS, GC, and JVM flag cleanup.
                Replace JDK-bundled Java EE APIs with explicit dependencies.
              </div>
            </div>
          </Section>

          <Section id="migrate-11-17" title="Java 11 → 17 Migration" lead="Strong encapsulation is the plot twist.">
            <div className="grid gap-6 lg:grid-cols-2">
              <Flow steps={MIGRATION_FLOWS['11to17']}/>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm leading-7 text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
                <strong>Illegal reflective access:</strong> libraries poking JDK internals warn on 9–16 and fail hard on 17.
                Detect with CI logs and agent trials; fix by upgrading libraries; temporary <code className="mx-1 rounded bg-white/70 px-1 dark:bg-black/30">--add-opens</code> only with expiry tickets.
              </div>
            </div>
          </Section>

          <Section id="migrate-17-21" title="Java 17 → 21 Migration" lead="Concurrency modernization — optional but high leverage for I/O services.">
            <div className="grid gap-6 lg:grid-cols-2">
              <Flow steps={MIGRATION_FLOWS['17to21']}/>
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white">Should we migrate to Virtual Threads?</h3>
                <ol className="mt-4 space-y-3">
                  {VT_DECISION_TREE.map((n)=>(
                    <li key={n.q} className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                      <div className="font-semibold text-slate-900 dark:text-white">{n.q}</div>
                      <div>Yes → {n.yes}</div>
                      <div>No → {n.no}</div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Section>

          <Section id="migrate-21-25" title="Java 21 → 25 Migration" lead="Verified against OpenJDK JDK 25 — do not assume 21 previews became final.">
            <div className="grid gap-6 lg:grid-cols-2">
              <Flow steps={MIGRATION_FLOWS['21to25']}/>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
                <li>Scoped Values final — plan context migration</li>
                <li>Structured Concurrency still preview — keep off paved road</li>
                <li>Compact headers + Gen Shenandoah — measure, don’t guess</li>
                <li>Framework/tooling certification gates before estate waves</li>
              </ul>
            </div>
          </Section>

          <Section id="migrate-8-25" title="Complete Java 8 → 25 Migration" lead="Prefer staged LTS landings for large estates; direct hops only for small, modern services.">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TB
  L[Legacy Java 8] --> D[Dependency Analysis]
  D --> J11[Java 11]
  J11 --> F[Framework Upgrade]
  F --> J17[Java 17]
  J17 --> M[Application Modernization]
  M --> J21[Java 21]
  J21 --> C[Concurrency Modernization]
  C --> J25[Java 25]
  J25 --> P[Production]`}/>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <h3 className="font-bold">Why 8 → 11 → 17 → 21 → 25</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Rollback points, framework coupling, encapsulation shock absorption, and safer VT adoption after dependencies are honest.
                </p>
                <Flow steps={FULL_MIGRATION_STEPS}/>
              </div>
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <h3 className="font-bold">When direct 8 → 25 can work</h3>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  <li>Small service, strong tests, deps already modern</li>
                  <li>No Java EE / illegal-access ghosts</li>
                  <li>Single deployable with easy image rollback</li>
                  <li>Still run the full checklist — “direct” is not “careless”</li>
                </ul>
              </div>
            </div>
          </Section>

          <Section id="checklist" title="Production Migration Checklist">
            <MigrationChecklist/>
          </Section>

          <Section id="risk-matrix" title="Migration Risk Matrix">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-left">Risk</th>
                    <th className="px-4 py-3 text-left">8→11</th>
                    <th className="px-4 py-3 text-left">11→17</th>
                    <th className="px-4 py-3 text-left">17→21</th>
                    <th className="px-4 py-3 text-left">21→25</th>
                    <th className="px-4 py-3 text-left">Mitigation</th>
                  </tr>
                </thead>
                <tbody>
                  {RISK_MATRIX.map((r)=>(
                    <tr key={r.risk} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-4 py-3 font-semibold">{r.risk}</td>
                      <td className="px-4 py-3">{r.r8_11}</td>
                      <td className="px-4 py-3">{r.r11_17}</td>
                      <td className="px-4 py-3">{r.r17_21}</td>
                      <td className="px-4 py-3">{r.r21_25}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.mitigation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="architecture-decisions" title="Architecture Decisions" lead="Which Java version should I choose?">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-left">Criterion</th>
                    <th className="px-4 py-3 text-left">8</th>
                    <th className="px-4 py-3 text-left">11</th>
                    <th className="px-4 py-3 text-left">17</th>
                    <th className="px-4 py-3 text-left">21</th>
                    <th className="px-4 py-3 text-left">25</th>
                  </tr>
                </thead>
                <tbody>
                  {ARCHITECTURE_DECISION_MATRIX.map((r)=>(
                    <tr key={r.criterion} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-4 py-3 font-semibold">{r.criterion}</td>
                      <td className="px-4 py-3">{r.java8}</td>
                      <td className="px-4 py-3">{r.java11}</td>
                      <td className="px-4 py-3">{r.java17}</td>
                      <td className="px-4 py-3">{r.java21}</td>
                      <td className="px-4 py-3">{r.java25}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="anti-patterns" title="Common Java Modernization Mistakes">
            <ul className="grid gap-3 md:grid-cols-2">
              {ANTI_PATTERNS.map((a)=>(
                <li key={a} className="rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:text-slate-300">
                  {a}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="interview-questions" title="Interview Questions" lead="Senior+ questions with model answers in Interview Mode.">
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {INTERVIEW_QUESTIONS.map((q)=>(
                <li key={q.id}><span className="font-semibold text-slate-900 dark:text-white">[{q.difficulty}]</span> {q.question}</li>
              ))}
            </ul>
          </Section>

          <Section id="principal-questions" title="Principal / Architect Questions">
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {PRINCIPAL_QUESTIONS.map((q)=>(
                <li key={q.id}><span className="font-semibold text-slate-900 dark:text-white">[{q.difficulty}]</span> {q.question}</li>
              ))}
            </ul>
          </Section>

          <Section id="scenarios" title="Scenario-Based Questions" lead={`${SCENARIOS.length} production scenarios — expand for model answers.`}>
            <div className="space-y-3">
              {SCENARIOS.map((s)=>(
                <details key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                  <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white">
                    {s.title}
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{s.scenario}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.pillars.map((p)=>(
                      <span key={p} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                        {p}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
                    <span className="font-semibold">Model approach: </span>{s.answer}
                  </p>
                </details>
              ))}
            </div>
          </Section>

          <Section id="answer-framework" title="Interview Answer Framework" lead="Answer like an architect, not a syntax encyclopedia.">
            <div className="flex flex-wrap items-center gap-2">
              {ANSWER_FRAMEWORK.map((step,i)=>(
                <div key={step} className="flex items-center gap-2">
                  <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950">
                    {step}
                  </span>
                  {i<ANSWER_FRAMEWORK.length-1 && <span className="text-slate-400">↓</span>}
                </div>
              ))}
            </div>
          </Section>

          <Section id="interview-mode" title="Interview Mode">
            <InterviewMode
              questions={INTERVIEW_QUESTIONS}
              title="Interview Mode"
              subtitle="Filter by topic and difficulty. Pause, then reveal the model answer."
            />
          </Section>

          <Section id="principal-mode" title="Principal / Architect Mode">
            <InterviewMode
              questions={[...PRINCIPAL_QUESTIONS,...INTERVIEW_QUESTIONS.filter((q)=>q.difficulty==='Architect'||q.difficulty==='Principal'||q.difficulty==='25+ Years')]}
              title="Principal / Architect Mode"
              subtitle="Trade-offs, migration strategy, risk, cost, and organizational rollout."
            />
          </Section>

          <Section id="cheat-sheet" title="Interview Cheat Sheet" lead="Ten-minute revision before a Staff+/Principal loop.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(CHEAT_SHEET).map(([k,items])=>(
                <div key={k} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white">{k}</h3>
                  <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    {items.map((i)=><li key={i}>→ {i}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section id="one-liners" title="One-Line Interview Answers" lead="If interviewer asks → answer like this">
            <div className="space-y-3">
              {ONE_LINERS.map((o)=>(
                <div key={o.ask} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="font-semibold text-slate-900 dark:text-white">{o.ask}</div>
                  <div className="mt-1 text-slate-600 dark:text-slate-300">→ {o.answer}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="quick-reference" title="Quick Reference">
            <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 p-5 text-xs leading-6 text-slate-100 dark:border-slate-800">{`
JAVA VERSION EVOLUTION

Java 8 ───── Java 11 ───── Java 17 ───── Java 21 ───── Java 25
   │             │             │             │             │
Language      Enterprise      Modern       Modern       Latest
Evolution     Baseline        Java         Concurrency  LTS
   └─────────────┴─────────────┴─────────────┴─────────────┘
                              ↓
                     Production Migration
                              ↓
                  Principal/Architect Interview

JDK 25 verified finals include: Scoped Values, KDF, module imports,
compact source/instance main, flexible constructors, AOT ergonomics/profiling,
JFR sampling + method timing, compact object headers, Gen Shenandoah,
32-bit x86 removal.
Still preview: Structured Concurrency, PEM, Stable Values, primitive patterns.
Still incubator: Vector API.
`}</pre>
          </Section>

          <Section
            id="playground"
            title="Java Code Playground"
            lead="This site’s compiler IDE targets the environment JDK (not multi-version execution). Use version-specific snippets above; run experiments in the Java Compiler without faking Java 8/11/17/21/25 output."
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                Multi-JDK compile/run is not available in this static export. Open the Monaco-based IDE for local compile/run against the provisioned JDK, and keep examples on this page as the version-accurate source of truth.
              </p>
              <Link
                href="/java-compiler"
                className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Open Java Compiler IDE →
              </Link>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
