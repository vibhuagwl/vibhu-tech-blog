'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {R4J_TOC} from '@/lib/resilience4j/toc';
import {TOPICS} from '@/lib/resilience4j/topics';
import {
  BENEFITS,
  CHEAT,
  DECISION,
  FIVE_MIN,
  MODULE_COMPARE,
  REMEMBER,
  SIXTY_SEC,
} from '@/lib/resilience4j/comparison';
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

export default function Resilience4jHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Staff · Principal · Architect · Java · Spring Boot 3 · AWS · Payments
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Resilience4j
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Circuit breaker · retry · bulkhead · rate limit · time limit — banking failures, Spring code,
          observability, and interview answers. ~90% practical.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Lab:{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-900">spring-resilience4j-lab/</code>
          {' · '}
          <Link href="/load-balancing" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Load Balancing
          </Link>
          {' · '}
          <Link href="/distributed-locking" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Distributed Locking
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={R4J_TOC} />
        <div className="min-w-0 space-y-16">
          <Section
            id="overview"
            title="Big Picture — Payment Path"
            lead="Resilience4j is a lightweight fault-tolerance library for Java. It replaced Hystrix-style patterns with composable CircuitBreaker, Retry, RateLimiter, Bulkhead, and TimeLimiter — Spring Boot 3 ready, Micrometer-native."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
                <Mermaid
                  chart={`flowchart TD
  C[Client] --> GW[API Gateway]
  GW --> O[Order Service]
  O --> P[Payment Service]
  P --> X[Bank down / slow]
  X --> CASCADE[Threads exhausted]
  CASCADE --> ODOWN[Order down]`}
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <Mermaid
                  chart={`flowchart TD
  C[Client] --> GW[API Gateway]
  GW --> O[Order Service]
  O --> R[Resilience Layer]
  R --> TL[Timeout]
  R --> RT[Retry]
  R --> CB[Circuit Breaker]
  R --> BH[Bulkhead]
  R --> RL[Rate Limiter]
  R --> P[Payment Service]`}
                />
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Why not hand-rolled?"
                code={`Custom retry/CB often misses:
- sliding windows + slow-call detection
- half-open probes
- metrics / Actuator
- composition + thread isolation
- battle-tested edge cases

vs Spring Retry: retries mainly
vs Hystrix: legacy, heavier
vs Spring Cloud CB: abstraction over R4j/others
vs Mesh: transport defaults — app still owns money semantics`}
              />
              <CodePanel
                title="Analogies"
                code={`CircuitBreaker = fuse box
Retry = knock again (if safe)
RateLimiter = ticket queue
Bulkhead = ship compartments
TimeLimiter = hard meeting stop
Fallback = honest degraded answer`}
                tone="ok"
              />
            </div>
          </Section>

          <Section id="module-table" title="Module Comparison">
            <MiniTable
              headers={['Module', 'Solves', 'Avoid when']}
              rows={MODULE_COMPARE.map((r) => [r.m, r.solves, r.avoid])}
            />
          </Section>

          {TOPICS.map((t) => (
            <TopicPanel key={t.id} t={t} />
          ))}

          <Section id="benefits-table" title="Benefits">
            <MiniTable
              headers={['Benefit', 'Explanation', 'Production impact']}
              rows={BENEFITS.map((r) => [r.b, r.e, r.i])}
            />
          </Section>

          <Section
            id="architecture"
            title="Payment Processing Platform"
            lead="Edge admit → Order → bulkhead → CB → optional idempotent retry → TimeLimiter/HTTP timeouts → Payment → Bank. Failures return PENDING, never fake SUCCESS."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  CUST[Customer] --> CF[CloudFront] --> GW[API Gateway + RL]
  GW --> ALB --> ORD[Order Service]
  ORD --> REDIS[(Redis cache)]
  ORD --> BH[Bulkhead]
  BH --> CB[CircuitBreaker]
  CB --> RT[Retry if idempotent]
  RT --> PAY[Payment Service]
  PAY --> BANK[Bank Gateway]
  ORD --> KAFKA[[Kafka outbox]]
  BANK -->|slow/500/503/down| DEC{R4j decision}
  DEC -->|OPEN| PEND[PENDING fallback]
  DEC -->|OK| OK[Captured]`}
              />
            </div>
            <CodePanel
              title="Per bank failure mode"
              code={`slow → TimeLimiter / slowCall → maybe OPEN
timeout → count failure → retry only with Idempotency-Key
500/503 → retry transient + CB window
network fail → same
duplicate req → unique idempotency_key wins
complete outage → OPEN → PENDING → alert → HALF_OPEN probe`}
              tone="ok"
            />
          </Section>

          <Section id="decision" title="Memory Framework">
            <div className="grid gap-2 md:grid-cols-2">
              {REMEMBER.map(([n, a]) => (
                <div key={n} className="rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">
                  <span className="font-bold">{n}</span> → {a}
                </div>
              ))}
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
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">60-second answer</div>
                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{SIXTY_SEC}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">5-minute architect answer</div>
                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{FIVE_MIN}</p>
              </div>
            </div>
          </Section>

          <Section id="lab" title="Runnable Lab" lead="Spring Boot 3.4 + Resilience4j 2.4 — simulated bank gateway, CB opens, retry, pending fallback, JUnit tests.">
            <CodePanel
              title="Quick start"
              code={`cd spring-resilience4j-lab
mvn test
# PaymentBankStub · CircuitBreaker · Retry · Pending fallback`}
            />
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
          </Section>
        </div>
      </div>
    </div>
  );
}
