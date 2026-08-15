'use client';

import Link from 'next/link';
import {API_BAD_GOOD, HTTP_ROWS, REST_API_ROWS} from '@/lib/performance/api';
import {
  ADV_CACHE_ROWS,
  AWS_COST_PERF_ROWS,
  DB_INTERNALS_ROWS,
  DIST_API_ROWS,
  DISTRIBUTED_PERF_ROWS,
  GC_DEEP_ROWS,
  GC_LOG_ASCII,
  JAVA21_PERF_ROWS,
  JMH_METHOD_ROWS,
  JVM_INTERNALS_ROWS,
  KAFKA_DEEP_ROWS,
  MASTER_FRAMEWORK_ASCII,
  MATH_ASCII,
  MATH_ROWS,
  NETWORKING_ROWS,
  PERF_COST_EQUATION,
} from '@/lib/performance/advanced';
import {
  CACHE_ASCII,
  CACHE_PATTERN_ROWS,
  KAFKA_CONSUMER_ROWS,
  KAFKA_PRODUCER_ROWS,
  KAFKA_RULE,
  MICROSERVICES_NETWORK_ASCII,
  AWS_COMPUTE_ROWS,
  AWS_DATA_ROWS,
  AWS_LB_ROWS,
  AWS_NETWORK_ROWS,
  SERIALIZATION_ROWS,
  LOGGING_DANGER,
} from '@/lib/performance/cache-kafka-aws';
import {ARCHITECTURE_ASCII, CARGO_CULT, CHEAT_ASCII, FORMULAS_ASCII, TOP_50_RULES} from '@/lib/performance/cheat';
import {
  LATENCY_VS_THROUGHPUT,
  LOOP_ASCII,
  LOOP_STEPS,
  METRICS_ROWS,
  PYRAMID_ASCII,
  SPOKEN_2M,
  SPOKEN_30S,
  SPOKEN_5M,
  TWO_SEC_TREE,
} from '@/lib/performance/fundamentals';
import {
  COLLECTIONS_ROWS,
  CONCURRENCY_ROWS,
  GC_ASCII,
  GC_ROWS,
  JAVA_ANTIPATTERNS,
  JVM_FLAG_ROWS,
  JVM_FLAGS,
  THREAD_POOL_ASCII,
  VIRTUAL_THREADS_NOTE,
} from '@/lib/performance/java-jvm';
import {
  ANTIPATTERNS,
  BEFORE_AFTER,
  CASE_STUDIES,
  DECISION_MATRIX,
  LITTLES_LAW,
  OBSERVE_ROWS,
  PLAYBOOKS,
  PROFILE_ASCII,
  TEST_TYPES_ROWS,
} from '@/lib/performance/ops';
import {
  HIKARI_ROWS,
  INDEX_ASCII,
  INDEX_TRADEOFF_ROWS,
  JPA_NPLUS1,
  MVC_VS_WEBFLUX_ROWS,
  POOL_MATH_ASCII,
  SPRING_BOOT_STARTUP_VS_RUNTIME,
  SPRING_MVC_FLOW,
  SQL_SELECT_STAR,
  TOMCAT_ROWS,
  WEBFLUX_WARNING,
} from '@/lib/performance/spring-db';
import {MEMORY_SENTENCE, PERF_TOC, VERSION_NOTE} from '@/lib/performance/toc';
import type {BeforeAfter} from '@/lib/performance/types';
import StickyToc from './sticky-toc';
import CodePanel from './code-panel';
import InterviewMode from './interview-mode';

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
      <div className="mt-6 space-y-4">{children}</div>
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
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-slate-200 dark:border-slate-800">
              {r.map((c, i) => (
                <td key={i} className={`px-2 py-2 align-top ${i === 0 ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
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

function Callout({title, children, tone = 'neutral'}: {title: string; children: React.ReactNode; tone?: 'neutral' | 'warn' | 'tip'}) {
  const border =
    tone === 'warn'
      ? 'border-rose-300 dark:border-rose-900'
      : tone === 'tip'
        ? 'border-emerald-300 dark:border-emerald-900'
        : 'border-slate-200 dark:border-slate-800';
  return (
    <div className={`rounded-2xl border ${border} bg-slate-50 p-4 text-sm leading-7 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300`}>
      <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function BeforeAfterCard({item}: {item: BeforeAfter}) {
  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <summary className="cursor-pointer list-none">
        <p className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.problem}</p>
      </summary>
      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
        <p>
          <strong>Why slow:</strong> {item.whySlow}
        </p>
        <CodePanel title="Before" code={item.bad} />
        <CodePanel title="After" code={item.good} />
        <p>
          <strong>Why faster:</strong> {item.whyFaster}
        </p>
        <p>
          <strong>Trade-off:</strong> {item.tradeoff}
        </p>
        <p>
          <strong>Validate:</strong> {item.validate}
        </p>
        <p className="font-semibold text-slate-900 dark:text-white">{item.interview}</p>
      </div>
    </details>
  );
}

const PLAYBOOK_LINKS = [
  {href: '/performance/performance-latency-spike-investigation', title: 'Latency spike 50ms → 2s', blurb: 'First-5-min checklist, pools, dumps, RCA'},
  {href: '/performance/performance-identify-bottlenecks', title: 'Identify bottlenecks', blurb: 'USE method, Micrometer, JFR, EXPLAIN'},
  {href: '/performance/performance-scale-10k-to-1m', title: 'Scale 10K → 1M RPS', blurb: 'Capacity math, cache, Kafka offload, HPA'},
  {href: '/performance/performance-caching-spring-redis', title: 'Caching · Spring · Redis', blurb: 'Aside/through/behind, stampede, keys'},
  {href: '/performance/performance-jvm-high-throughput', title: 'JVM high-throughput', blurb: 'Heap flags, G1, pools, virtual threads'},
  {href: '/performance/performance-backpressure-load-shedding', title: 'Backpressure · shedding', blurb: 'Bulkhead, 503, Kafka pause, spikes'},
];

export default function PerformanceHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · Architect · Java 21 · Spring Boot 3 · AWS
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Performance Engineering
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Near-complete Staff/Principal handbook: JVM/JIT/GC internals, networking, DB MVCC, distributed systems, Kafka deep, AWS cost×performance, JMH — not a tip dump.
          Central story: <strong>measure, find the bottleneck, optimize it, prove it, monitor it</strong>.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">{MEMORY_SENTENCE}</p>
        <p className="mt-3 text-sm text-slate-500">
          {VERSION_NOTE}{' '}
          <Link href="/resilience4j" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Resilience4j
          </Link>
          {' · '}
          <Link href="/api-gateway" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Gateway
          </Link>
          {' · '}
          <Link href="/kafka-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Kafka
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={PERF_TOC} />
        <div className="min-w-0 space-y-16">
          <Section
            id="master"
            title="00. Performance investigation master framework"
            lead="The memorable Staff spine: one bottleneck at a time, proved with numbers."
          >
            <CodePanel title="From user report to monitor" code={MASTER_FRAMEWORK_ASCII} />
            <Callout title="Say this in interviews" tone="tip">
              I measure percentiles and saturation first, use a distributed trace to pick the layer, then open JFR/heap/EXPLAIN only for that layer. I change one thing, load-test against baseline, roll out gradually, and watch the same metrics in production.
            </Callout>
          </Section>

          <Section id="loop" title="00. The 10-step performance engineering loop" lead="Never optimize on assumptions. Every claim needs a metric before and after.">
            <CodePanel title="Story spine" code={LOOP_ASCII} />
            <ol className="grid gap-2 sm:grid-cols-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
              {LOOP_STEPS.map((s, i) => (
                <li key={s} className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                  <span className="font-semibold">{i + 1}.</span> {s}
                </li>
              ))}
            </ol>
            <Callout title="Interview line" tone="tip">
              {SPOKEN_30S}
            </Callout>
          </Section>

          <Section id="fundamentals" title="01. Performance fundamentals" lead="Name the signal before naming the fix.">
            <MiniTable headers={['Metric', 'Meaning', 'Interview tip']} rows={METRICS_ROWS} />
            <CodePanel title="Do not confuse these" code={LATENCY_VS_THROUGHPUT} />
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ['30 seconds', SPOKEN_30S],
                ['2 minutes', SPOKEN_2M],
                ['5 minutes Staff', SPOKEN_5M],
              ].map(([label, text]) => (
                <div key={label} className="rounded-2xl border border-slate-200 p-4 text-sm leading-7 dark:border-slate-800">
                  <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">{label}</p>
                  <p className="mt-2 text-slate-700 dark:text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="pyramid" title="02. Performance pyramid" lead="Optimize the layer that actually owns the latency.">
            <CodePanel title="Bottleneck-first hierarchy" code={PYRAMID_ASCII} />
            <Callout title="Rule" tone="warn">
              Optimizing Java code does not help if the query is 500&nbsp;ms. Optimizing SQL does not help if you wait 2&nbsp;s on an
              external API. Adding CPU does not help if every request is blocked on the connection pool.
            </Callout>
          </Section>

          <Section id="math" title="04. Performance mathematics" lead="Little's Law, Amdahl, USL, and why 90% utilization destroys p99.">
            <MiniTable headers={['Law / idea', 'Formula / meaning', 'Interview use']} rows={MATH_ROWS} />
            <CodePanel title="Worked intuition" code={MATH_ASCII} />
            <CodePanel title="Architect equation" code={PERF_COST_EQUATION} />
          </Section>

          <Section id="api" title="03. API · HTTP performance" lead="Bound payloads, reuse connections, and never ship unbounded lists.">
            <MiniTable headers={['Topic', 'What', 'Practice']} rows={HTTP_ROWS} />
            <MiniTable headers={['REST lever', 'Why', 'Note']} rows={REST_API_ROWS} />
            <CodePanel title="Bad — unbounded" code={API_BAD_GOOD.bad} />
            <CodePanel title="Better — paginated DTO" code={API_BAD_GOOD.good} />
            <CodePanel title='Interview: "API takes 2 seconds"' code={TWO_SEC_TREE} />
          </Section>

          <Section id="networking" title="06. Networking deep dive" lead="DNS, TCP, TLS, HTTP/2/3, buffers, HOL, and network backpressure.">
            <MiniTable headers={['Topic', 'What', 'Practice']} rows={NETWORKING_ROWS} />
          </Section>

          <Section id="dist-api" title="07. Distributed API resilience" lead="Timeouts, retry budgets, hedging, collapsing, adaptive concurrency, shedding.">
            <MiniTable headers={['Pattern', 'Idea', 'Trap']} rows={DIST_API_ROWS} />
            <p className="text-sm text-slate-500">
              Deep labs:{' '}
              <Link href="/resilience4j" className="font-semibold hover:underline">
                Resilience4j
              </Link>
              {' · '}
              <Link href="/api-gateway" className="font-semibold hover:underline">
                API Gateway
              </Link>
              {' · '}
              <Link href="/performance/performance-backpressure-load-shedding" className="font-semibold hover:underline">
                Backpressure playbook
              </Link>
            </p>
          </Section>

          <Section id="java" title="04. Java · collections · streams" lead="Choose structures for access patterns; streams are not free.">
            <MiniTable headers={['Structure', 'Ops', 'Use when']} rows={COLLECTIONS_ROWS} />
            <div className="space-y-3">
              {JAVA_ANTIPATTERNS.map((a) => (
                <BeforeAfterCard key={a.id} item={a} />
              ))}
            </div>
          </Section>

          <Section id="concurrency" title="05. Concurrency · thread pools" lead="More threads often make saturation worse.">
            <MiniTable headers={['Primitive', 'Strength', 'Watch for']} rows={CONCURRENCY_ROWS} />
            <CodePanel title="Pool sizing heuristic" code={THREAD_POOL_ASCII} />
          </Section>

          <Section id="virtual-threads" title="10. Virtual threads · Java 21" lead="Concurrency capacity ≠ faster database. Prefer ScopedValue over unbounded ThreadLocals on VT.">
            <Callout title="Staff line" tone="tip">
              {VIRTUAL_THREADS_NOTE}
            </Callout>
            <MiniTable headers={['Java 21 topic', 'Perf angle', 'Watch']} rows={JAVA21_PERF_ROWS} />
          </Section>

          <Section id="jvm" title="07. JVM performance" lead="Container-aware heap first; flags second; evidence always.">
            <CodePanel title="Baseline flags (starting point — benchmark)" code={JVM_FLAGS} />
            <MiniTable headers={['Flag / area', 'Why', 'Watch']} rows={JVM_FLAG_ROWS} />
          </Section>

          <Section id="jvm-internals" title="12. JVM internals · JIT" lead="Warm-up, inlining, escape analysis, safepoints, TLAB, compressed OOPs, native memory.">
            <MiniTable headers={['Topic', 'What', 'Interview tip']} rows={JVM_INTERNALS_ROWS} />
          </Section>

          <Section id="gc" title="08. Garbage collection" lead="Allocation rate drives GC; pause time drives p99.">
            <CodePanel title="Object life cycle" code={GC_ASCII} />
            <MiniTable headers={['Collector', 'Fit', 'Avoid when']} rows={GC_ROWS} />
          </Section>

          <Section id="gc-deep" title="14. GC deep dive" lead="G1 regions, RSets, evacuation, humongous objects, ZGC barriers, reading GC logs.">
            <MiniTable headers={['Topic', 'Mechanism', 'Signal']} rows={GC_DEEP_ROWS} />
            <CodePanel title="How to read GC logs in an interview" code={GC_LOG_ASCII} />
          </Section>

          <Section id="spring" title="09. Spring · Boot" lead="Startup cost ≠ runtime cost. Proxies and scanning matter at boot; pools matter at runtime.">
            <Callout title="Startup vs runtime">{SPRING_BOOT_STARTUP_VS_RUNTIME}</Callout>
            <MiniTable headers={['Tomcat knob', 'Meaning', 'Heuristic']} rows={TOMCAT_ROWS} />
          </Section>

          <Section id="mvc-webflux" title="10. Spring MVC · WebFlux" lead="Reactive only helps when the stack is non-blocking end-to-end.">
            <CodePanel title="MVC request path" code={SPRING_MVC_FLOW} />
            <MiniTable headers={['Aspect', 'MVC', 'WebFlux']} rows={MVC_VS_WEBFLUX_ROWS} />
            <Callout title="Warning" tone="warn">
              {WEBFLUX_WARNING}
            </Callout>
          </Section>

          <Section id="jpa" title="11. JPA · Hibernate" lead="N+1 and SELECT * are still the most common interview traps.">
            <BeforeAfterCard item={JPA_NPLUS1} />
          </Section>

          <Section id="database" title="12. Database · SQL · indexes" lead="AWS and PostgreSQL guidance: measure access patterns, query plans, and indexing — do not blind-tune knobs.">
            <BeforeAfterCard item={SQL_SELECT_STAR} />
            <CodePanel title="Index story" code={INDEX_ASCII} />
            <MiniTable headers={['Index topic', 'Rule', 'Trap']} rows={INDEX_TRADEOFF_ROWS} />
          </Section>

          <Section id="db-internals" title="19. Database internals" lead="MVCC, WAL, buffer pool, vacuum/bloat, stats, partitioning, sharding, locks.">
            <MiniTable headers={['Topic', 'Idea', 'Perf impact']} rows={DB_INTERNALS_ROWS} />
          </Section>

          <Section id="pool" title="13. Database connection pools (HikariCP)" lead="Spring Boot prefers HikariCP. Right-size to the database — not to hope.">
            <MiniTable headers={['Property', 'Meaning', 'Heuristic']} rows={HIKARI_ROWS} />
            <CodePanel title="Pool math" code={POOL_MATH_ASCII} />
          </Section>

          <Section id="cache" title="14. Caching · Redis" lead="Cache expensive stable reads. Measure hit ratio. Stampede kills p99.">
            <CodePanel title="Request path" code={CACHE_ASCII} />
            <MiniTable headers={['Pattern / risk', 'When', 'Watch']} rows={CACHE_PATTERN_ROWS} />
          </Section>

          <Section id="cache-adv" title="22. Advanced caching" lead="Stampede, coalescing, early expire, SWR, negative cache, warming, hot keys.">
            <MiniTable headers={['Technique', 'Problem it solves', 'Practice']} rows={ADV_CACHE_ROWS} />
          </Section>

          <Section id="microservices" title="15. Microservices performance" lead="Every hop adds latency, failure probability, and serialization cost.">
            <CodePanel title="Network tax" code={MICROSERVICES_NETWORK_ASCII} />
          </Section>

          <Section id="distributed" title="24. Distributed systems performance" lead="Consistency costs latency. Quorum, replication, locks, hot partitions, queue leveling.">
            <MiniTable headers={['Topic', 'Idea', 'Perf angle']} rows={DISTRIBUTED_PERF_ROWS} />
            <p className="text-sm text-slate-500">
              Related:{' '}
              <Link href="/cap-theorem" className="font-semibold hover:underline">
                CAP
              </Link>
              {' · '}
              <Link href="/distributed-locking" className="font-semibold hover:underline">
                Distributed locking
              </Link>
            </p>
          </Section>

          <Section id="kafka" title="16. Kafka performance" lead="Batching and partitions dominate throughput; lag is a symptom, not a root cause.">
            <MiniTable headers={['Producer knob', 'Effect', 'Note']} rows={KAFKA_PRODUCER_ROWS} />
            <MiniTable headers={['Consumer knob', 'Effect', 'Note']} rows={KAFKA_CONSUMER_ROWS} />
            <Callout title="Rule" tone="tip">
              {KAFKA_RULE}
            </Callout>
          </Section>

          <Section id="kafka-deep" title="26. Kafka deep performance" lead="ISR, page cache, skew, rebalance, fetch tuning, EOS cost.">
            <MiniTable headers={['Topic', 'Mechanism', 'Watch']} rows={KAFKA_DEEP_ROWS} />
          </Section>

          <Section id="serialization" title="17. Serialization · logging" lead="JSON CPU and log volume show up as p99 and GC.">
            <MiniTable headers={['Format', 'Pros', 'Cons']} rows={SERIALIZATION_ROWS} />
            <BeforeAfterCard item={LOGGING_DANGER} />
          </Section>

          <Section id="aws-compute" title="18. AWS compute · load balancing · CDN" lead="Right-size and measure — bigger instances are not a strategy.">
            <MiniTable headers={['Service', 'Perf levers', 'Trap']} rows={AWS_COMPUTE_ROWS} />
            <MiniTable headers={['LB', 'Use when', 'Watch']} rows={AWS_LB_ROWS} />
          </Section>

          <Section id="aws-data" title="19. AWS data · network" lead="Collect datastore metrics (CPU, IOPS, connections, slow queries) before changing instance class.">
            <MiniTable headers={['Service', 'Perf levers', 'Trap']} rows={AWS_DATA_ROWS} />
            <MiniTable headers={['Network', 'Effect', 'Practice']} rows={AWS_NETWORK_ROWS} />
          </Section>

          <Section id="aws-cost" title="30. AWS cost × performance" lead="Architect interviews: latency without cost is incomplete.">
            <CodePanel title="Performance equation" code={PERF_COST_EQUATION} />
            <MiniTable headers={['Topic', 'Why it matters', 'Practice']} rows={AWS_COST_PERF_ROWS} />
          </Section>

          <Section id="observe" title="20. Observability · profiling" lead="Metrics find the layer; traces find the hop; profilers find the line.">
            <MiniTable headers={['Signal', 'What', 'Example']} rows={OBSERVE_ROWS} />
            <CodePanel title="Choose the tool from the symptom" code={PROFILE_ASCII} />
          </Section>

          <Section id="testing" title="21. Load testing · capacity planning" lead="No optimization is real until it survives a realistic load test.">
            <MiniTable headers={['Test', 'Question it answers', 'Note']} rows={TEST_TYPES_ROWS} />
            <CodePanel title="Little's Law" code={LITTLES_LAW} />
          </Section>

          <Section id="jmh" title="33. JMH · benchmark methodology" lead="Warm-up, JIT effects, coordinated omission, isolation, regression gates.">
            <MiniTable headers={['Practice', 'Why', 'Note']} rows={JMH_METHOD_ROWS} />
            <Callout title="Rule" tone="warn">
              A 30-second local curl is not a benchmark. Warm the JIT, model real mix, and compare percentiles to a recorded baseline.
            </Callout>
          </Section>

          <Section id="playbook" title="22. Troubleshooting playbook" lead="Ten production scenarios with the same spine: symptom → metrics → tools → fix → validate.">
            <div className="space-y-3">
              {PLAYBOOKS.map((p) => (
                <details key={p.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <summary className="cursor-pointer list-none text-lg font-semibold text-slate-900 dark:text-white">{p.title}</summary>
                  <div className="mt-3 space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
                    <p>
                      <strong>Symptom:</strong> {p.symptom}
                    </p>
                    <p>
                      <strong>Causes:</strong> {p.causes.join(' · ')}
                    </p>
                    <p>
                      <strong>Metrics:</strong> {p.metrics.join(' · ')}
                    </p>
                    <p>
                      <strong>Tools:</strong> {p.tools.join(' · ')}
                    </p>
                    <p>
                      <strong>Root cause:</strong> {p.rootCause}
                    </p>
                    <p>
                      <strong>Fix:</strong> {p.fix}
                    </p>
                    <p>
                      <strong>Validate:</strong> {p.validate}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </Section>

          <Section id="antipatterns" title="23. Cargo-cult anti-patterns" lead="More of almost anything can make latency worse.">
            <MiniTable headers={['Never blindly…', 'Why it hurts', 'Do this instead']} rows={ANTIPATTERNS} />
            <ul className="grid gap-2 sm:grid-cols-2 text-sm">
              {CARGO_CULT.map((c) => (
                <li key={c} className="rounded-xl bg-slate-900 px-3 py-2 font-semibold text-white">
                  {c}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="before-after" title="24. Before vs after" lead="Fifteen practical optimizations with validation built in.">
            <div className="space-y-3">
              {BEFORE_AFTER.map((b) => (
                <BeforeAfterCard key={b.id} item={b} />
              ))}
            </div>
          </Section>

          <Section id="cases" title="25. Production case studies">
            <div className="space-y-3">
              {CASE_STUDIES.map((c) => (
                <details key={c.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <summary className="cursor-pointer list-none text-lg font-semibold">{c.title}</summary>
                  <div className="mt-3 space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
                    <CodePanel title="Architecture" code={c.architecture} />
                    <p>
                      <strong>Before:</strong> {c.before}
                    </p>
                    <p>
                      <strong>Root cause:</strong> {c.rootCause}
                    </p>
                    <p>
                      <strong>Fix:</strong> {c.fix}
                    </p>
                    <p>
                      <strong>After:</strong> {c.after}
                    </p>
                    <p className="font-semibold">{c.interview}</p>
                  </div>
                </details>
              ))}
            </div>
          </Section>

          <Section id="matrix" title="26. Decision matrix">
            <MiniTable headers={['Problem', 'First check', 'Likely fix']} rows={DECISION_MATRIX} />
          </Section>

          <Section id="interview" title="27. Interview mode" lead="Drill beginner → staff. Reveal 30s / 2m / deep dive / common mistakes.">
            <InterviewMode />
          </Section>

          <Section id="cheat" title="28. Cheat sheet · formulas · top 50 rules">
            <CodePanel title="Rapid memory sheet" code={CHEAT_ASCII} />
            <CodePanel title="Formulas" code={FORMULAS_ASCII} />
            <CodePanel title="Reference architecture" code={ARCHITECTURE_ASCII} />
            <ol className="columns-1 gap-x-8 text-sm leading-7 text-slate-700 sm:columns-2 dark:text-slate-300">
              {TOP_50_RULES.map((r, i) => (
                <li key={i} className="mb-1 break-inside-avoid">
                  <span className="font-semibold">{i + 1}.</span> {r}
                </li>
              ))}
            </ol>
          </Section>

          <Section
            id="playbooks"
            title="29. Deep playbooks (existing articles)"
            lead="Incident-depth MDX playbooks preserved — use them after the handbook spine above. Duplicated pool/JVM/cache theory was merged into this page."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {PLAYBOOK_LINKS.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 dark:border-slate-800"
                >
                  <p className="font-semibold text-slate-900 dark:text-white">{p.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{p.blurb}</p>
                </Link>
              ))}
            </div>
            <p className="text-sm text-slate-500">
              Also:{' '}
              <Link href="/performance/performance-master-index" className="font-semibold hover:underline">
                Legacy master index
              </Link>{' '}
              (spoken one-liners map into this hub).
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
