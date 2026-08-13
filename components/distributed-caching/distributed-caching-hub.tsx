'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {CACHE_TOC} from '@/lib/distributed-caching/toc';
import {TOPICS} from '@/lib/distributed-caching/topics';
import {CHEAT,DECISION,MATRIX,REMEMBER,THIRTY_MIN} from '@/lib/distributed-caching/comparison';
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

export default function DistributedCachingHub(){
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · Architect · Spring · Redis · 25+ years
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Distributed Caching in Spring
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Problem → diagram → Spring code → failure → production fix → interview answer
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          ~90% diagrams/code/scenarios. Companion Redis depth:{' '}
          <Link href="/redis-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">Redis Interview</Link>
          {' '}· lab:{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-900">spring-distributed-cache-demo/</code>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={CACHE_TOC}/>
        <div className="min-w-0 space-y-5">
          <Section id="overview" title="Production Problem — Payment API" lead="10k RPS without cache = 10k DB queries/sec.">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TB
  C[Customer] --> GW[API Gateway]
  GW --> PS[Payment Service]
  PS --> R[(Redis Cluster)]
  PS --> DB[(PostgreSQL)]`}/>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel title="WITHOUT cache — DB bottleneck" tone="danger" code={`@GetMapping("/payments/{id}")
public Payment get(@PathVariable String id) {
  return paymentRepository.findById(id).orElseThrow();
}
// 10,000 RPS → 10,000 SELECT/sec → DB meltdown`}/>
              <CodePanel title="WITH cache-aside — Redis first" tone="ok" code={`@Cacheable(cacheNames = "payments", key = "#id")
public Payment get(String id) {
  return paymentRepository.findById(id).orElseThrow();
}
// HIT → Redis (~1ms) · MISS → DB then populate`}/>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TD
  REQ[10k req/s] --> REDIS{Redis}
  REDIS -->|HIT| OK[Response]
  REDIS -->|MISS| PG[(PostgreSQL)]
  PG --> FILL[SET Redis EX]
  FILL --> OK`}/>
            </div>
          </Section>

          <Section id="taxonomy" title="Cache Taxonomy" lead="Local = fastest per JVM. Distributed = shared across pods.">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TB
  ROOT[CACHING]
  ROOT --> L[LOCAL]
  ROOT --> D[DISTRIBUTED]
  L --> CAF[Caffeine]
  L --> CM[ConcurrentMap]
  L --> EH[Ehcache]
  D --> RD[Redis]
  D --> HZ[Hazelcast]
  D --> INF[Infinispan]
  D --> MC[Memcached]`}/>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="font-bold">Local</div>
                <ul className="mt-2 list-disc pl-5 text-slate-600 dark:text-slate-300">
                  <li>No network · micro-latency</li>
                  <li>Per-instance · hard multi-pod invalidate</li>
                  <li>Choose for ultra-hot, pod-local</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="font-bold">Distributed</div>
                <ul className="mt-2 list-disc pl-5 text-slate-600 dark:text-slate-300">
                  <li>Shared · network hop</li>
                  <li>Horizontal scale · coherence problem</li>
                  <li>Choose when many pods share reads</li>
                </ul>
              </div>
            </div>
          </Section>

          {TOPICS.map((t)=><TopicPanel key={t.id} t={t}/>)}

          <Section id="matrix" title="Technology Matrix">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    {['Tech','Distributed','Persistence','Replication','Spring','Best for','Drawback'].map((h)=>(
                      <th key={h} className="px-2 py-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MATRIX.map((r)=>(
                    <tr key={r.name} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-2 py-2 font-semibold">{r.name}</td>
                      <td className="px-2 py-2">{r.distributed}</td>
                      <td className="px-2 py-2">{r.persistence}</td>
                      <td className="px-2 py-2">{r.replication}</td>
                      <td className="px-2 py-2">{r.spring}</td>
                      <td className="px-2 py-2">{r.best}</td>
                      <td className="px-2 py-2 text-slate-500">{r.drawback}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="decision" title="Decision Tree">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TD
  N[Need cache?] --> S{Shared across JVMs?}
  S -->|No| CAF[Caffeine]
  S -->|Yes| R[Redis / grid]
  R --> H{Ultra-low latency?}
  H -->|Yes| L12[L1 + L2]
  H -->|No| R2[Redis aside]
  L12 --> C{Strong consistency?}
  C -->|Yes| DB[Read DB / lock]
  C -->|No| EV[Eventual + invalidate]`}/>
            </div>
            <div className="mt-4 space-y-2">
              {DECISION.map((d)=>(
                <div key={d.q} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <span className="font-semibold">{d.q}</span>
                  <div className="mt-1 text-slate-500">No → {d.no}</div>
                  <div className="text-slate-500">Yes → {d.yes}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="scenarios" title="Interview Mode">
            <InterviewMode/>
          </Section>

          <Section id="architect-qs" title="30-Minute Architect Revision">
            <div className="grid gap-3 md:grid-cols-2">
              {THIRTY_MIN.map((t)=>(
                <a key={t.id} href={`#${t.id}`} className="rounded-2xl border border-slate-200 p-4 hover:border-slate-500 dark:border-slate-800">
                  <div className="font-bold">{t.title}</div>
                  <ul className="mt-2 list-disc pl-4 text-sm text-slate-600 dark:text-slate-300">
                    {t.facts.map((f)=><li key={f}>{f}</li>)}
                  </ul>
                  <div className="mt-2 text-xs text-rose-600">Trap: {t.trap}</div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">Q: {t.q}</div>
                </a>
              ))}
            </div>
          </Section>

          <Section id="lab" title="Runnable Lab" lead="spring-distributed-cache-demo — Spring Boot 3.4 · Java 21 · Caffeine · Redis · stampede lock · Kafka invalidate sketch.">
            <CodePanel title="Quick start" code={`cd spring-distributed-cache-demo
docker compose up -d redis
./mvnw test
./mvnw spring-boot:run
curl localhost:8080/api/payments/P100`}/>
            <p className="mt-3 text-sm text-slate-500">
              Source explorer also available when demo files are present under{' '}
              <code>spring-distributed-cache-demo/</code>.
            </p>
          </Section>

          <Section id="cheat" title="One-Page Cheat Sheet">
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
