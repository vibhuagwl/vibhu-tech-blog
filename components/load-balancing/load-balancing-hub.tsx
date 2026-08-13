'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {LB_TOC} from '@/lib/load-balancing/toc';
import {TOPICS} from '@/lib/load-balancing/topics';
import {ALB_NLB,CHEAT,DECISION,GW_VS_LB,L4_L7,REMEMBER} from '@/lib/load-balancing/comparison';
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

function MiniTable({headers,rows}:{headers:string[];rows:string[][]}){
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
          <tr>{headers.map((h)=><th key={h} className="px-2 py-2 text-left">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r)=>(
            <tr key={r.join('|')} className="border-t border-slate-200 dark:border-slate-800">
              {r.map((c,i)=><td key={i} className={`px-2 py-2 ${i===0?'font-semibold':''}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function LoadBalancingHub(){
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · Architect · Java · Spring · AWS
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Load Balancing
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Problem → diagram → Java/Spring/AWS code → failure → trade-off → interview answer
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          ~90% visual/code. Lab:{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-900">load-balancer-lab/</code>
          {' '}· related:{' '}
          <Link href="/distributed-caching" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">Caching</Link>
          {' · '}
          <Link href="/performance" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">Performance</Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={LB_TOC}/>
        <div className="min-w-0 space-y-5">
          <Section id="overview" title="The Problem" lead="A load balancer distributes traffic across healthy instances so one Spring Boot pod is not a bottleneck.">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
                <Mermaid chart={`flowchart TD
  C[10k req/s] --> A1[App-1]
  A1 --> OVL[Overloaded]
  A1 --> DB[(DB)]`}/>
              </div>
              <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <Mermaid chart={`flowchart TD
  C[Clients] --> LB[Load Balancer]
  LB --> A1[App-1]
  LB --> A2[App-2]
  LB --> A3[App-3]
  A1 --> DB[(DB)]
  A2 --> DB
  A3 --> DB`}/>
              </div>
            </div>
          </Section>

          <Section id="taxonomy" title="Load Balancer Taxonomy">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TB
  ROOT[LOAD BALANCER]
  ROOT --> L4[Layer 4 TCP/UDP]
  ROOT --> L7[Layer 7 HTTP]
  ROOT --> DNS[DNS / Global]
  L4 --> NLB[NLB / HAProxy L4]
  L7 --> ALB[ALB / NGINX]
  L7 --> RP[Reverse Proxy]
  ROOT --> CS[Client-side]
  ROOT --> SS[Server-side]
  ROOT --> HW[Hardware / Software / Cloud]`}/>
            </div>
          </Section>

          <Section id="l4-l7-table" title="L4 vs L7 Table">
            <MiniTable headers={['Feature','L4','L7']} rows={L4_L7.map((r)=>[r.feature,r.l4,r.l7])}/>
          </Section>

          {TOPICS.map((t)=><TopicPanel key={t.id} t={t}/>)}

          <Section id="alb-nlb-table" title="ALB vs NLB">
            <MiniTable headers={['Feature','ALB','NLB']} rows={ALB_NLB.map((r)=>[r.feature,r.alb,r.nlb])}/>
          </Section>

          <Section id="gw-table" title="API Gateway vs Load Balancer">
            <MiniTable headers={['Feature','Load Balancer','API Gateway']} rows={GW_VS_LB.map((r)=>[r.feature,r.lb,r.gw])}/>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TB
  NET[Internet] --> CF[CloudFront]
  CF --> WAF
  WAF --> GW[API Gateway]
  GW --> ALB
  ALB --> P[Payment]
  ALB --> A[Account]
  ALB --> C[Customer]`}/>
            </div>
          </Section>

          <Section id="architecture" title="Banking Production Architecture">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TB
  NET[Internet] --> WAF --> GW[API Gateway] --> ALB
  ALB --> PAY[Payment App]
  ALB --> ACC[Account App]
  ALB --> CUS[Customer App]
  PAY --> REDIS[(Redis)]
  PAY --> KAFKA[[Kafka]]
  PAY --> PG[(PostgreSQL)]
  ACC --> PG
  CUS --> PG`}/>
            </div>
            <p className="mt-3 text-sm text-slate-500">LB scales apps — not the database. Add read replicas / CQRS when DB is the bottleneck.</p>
          </Section>

          <Section id="decision" title="Decision Tree">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TD
  N[Need traffic distribution?] --> H{HTTP?}
  H -->|Yes| L7[L7 / ALB]
  H -->|No| L4[L4 / NLB]
  L7 --> G{API governance?}
  G -->|Yes| GW[API Gateway + ALB]
  G -->|No| ALB2[ALB alone]
  N2[Service-to-service?] --> SCL[Spring Cloud LoadBalancer]`}/>
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

          <Section id="lab" title="Runnable Lab" lead="Core Java algorithms with JUnit — Round Robin, Weighted, Least Connections, IP Hash, Consistent Hash.">
            <CodePanel title="Quick start" code={`cd load-balancer-lab
mvn test
# RoundRobin / Weighted / LeastConn / IpHash / ConsistentHash`}/>
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
