'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import type {DemoSourceFile, DemoTreeNode} from '@/lib/oauth-demo-source';
import {
  ALGORITHM_PROS,
  ALGORITHM_ROWS,
  ASCII_CLASS,
  ASCII_CONFIG,
  ASCII_HLD,
  ASCII_MULTI,
  ASCII_SEQ,
  ASCII_WHERE,
  ASSUMPTIONS,
  CHEAT,
  CHECKLIST,
  FIVE_MIN,
  JAVA_SNIPPET,
  LUA_LINES,
  MEMORY_SENTENCE,
  OBS_ALERTS,
  REST_EXAMPLE,
  SCALE_ROWS,
  TRADEOFFS,
} from '@/lib/rate-limiter/content';
import {
  MERMAID_ALLOW,
  MERMAID_CLASS,
  MERMAID_HLD,
  MERMAID_LAYERS,
  MERMAID_PAYMENT,
  MERMAID_REJECT,
  MERMAID_TOKEN,
} from '@/lib/rate-limiter/diagrams';
import {ANTI_PATTERNS, INCIDENTS} from '@/lib/rate-limiter/incidents';
import {
  AWS_ASCII,
  CAPACITY_MATH,
  CAP_VIEW,
  CLOCK_NOTES,
  CONCURRENCY_VS_RATE,
  DYNAMIC_CONFIG,
  FAIRNESS,
  HYBRID,
  KAFKA_RL,
  ONE_PAGE,
  PAYMENT_FLOW,
  PERF_COMPARE,
  RESILIENCE_ORDER,
  RETRY_CODE,
  THIRTY_SEC,
} from '@/lib/rate-limiter/ops';
import {
  CONCEPT_ROWS,
  DEFINITION,
  FUNCTIONAL_LIMITS,
  NFR_BLOCKS,
  PROBLEM_STORY,
  RATE_FORMULA,
  WHY_WITHOUT,
} from '@/lib/rate-limiter/problem';
import {RATE_LIMIT_TOC} from '@/lib/rate-limiter/toc';
import CodePanel from './code-panel';
import InterviewMode from './interview-mode';
import StickyToc from './sticky-toc';

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

function Insight({
  problem,
  why,
  solution,
  example,
  tradeoff,
  senior,
}: {
  problem: string;
  why: string;
  solution: string;
  example?: string;
  tradeoff?: string;
  senior?: string;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
      <p>
        <strong className="text-slate-900 dark:text-white">Problem:</strong> {problem}
      </p>
      <p>
        <strong className="text-slate-900 dark:text-white">Why:</strong> {why}
      </p>
      <p>
        <strong className="text-slate-900 dark:text-white">Solution:</strong> {solution}
      </p>
      {example && (
        <p>
          <strong className="text-slate-900 dark:text-white">Example:</strong> {example}
        </p>
      )}
      {tradeoff && (
        <p>
          <strong className="text-slate-900 dark:text-white">Trade-off:</strong> {tradeoff}
        </p>
      )}
      {senior && (
        <p className="text-emerald-800 dark:text-emerald-300">
          <strong>Senior insight:</strong> {senior}
        </p>
      )}
    </div>
  );
}

export default function RateLimiterHub({
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
          Staff · Principal · Architect · Java · Spring Boot · Redis · AWS
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Rate Limiter — End-to-End HLD + LLD Interview Master
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Story-driven production design for Senior Staff / Principal interviews: why → requirements → algorithms →
          HLD/LLD → Redis Lua → AWS → failures → incidents — with a runnable algorithm playground on :8098.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-4 flex flex-wrap gap-3">
          <a
            href="#lab"
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Browse runnable lab source →
          </a>
          <a
            href="#algorithms"
            className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-900"
          >
            Algorithms ↓
          </a>
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Lab:{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-900">spring-rate-limiter-lab/</code>
          {' · Fixed · Sliding log/counter · Token · Leaky · Redis Lua · '}
          <Link href="/system-design/design-rate-limiter" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            short catalog article
          </Link>
          {' · '}
          <Link href="/resilience4j" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Resilience4j
          </Link>
          {' · '}
          <Link href="/api-gateway" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            API Gateway
          </Link>
          {' · '}
          <Link href="/redis-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Redis
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={RATE_LIMIT_TOC} />
        <div className="min-w-0 space-y-16">
          <Section
            id="lab"
            title="00. Runnable lab"
            lead="Java 21 / Spring Boot 3.4 on :8098. Swap Fixed Window · Sliding Log · Sliding Counter · Token Bucket · Leaky Bucket. In-memory default; Redis Lua for distributed. HTTP 429 + Retry-After."
          >
            <div className="mb-4 rounded-2xl border-2 border-slate-900 bg-slate-50 p-5 text-sm leading-7 text-slate-700 dark:border-slate-200 dark:bg-slate-900 dark:text-slate-200">
              <p>
                Playground: <code className="rounded bg-white/80 px-1 dark:bg-slate-800">GET /api/lab/{'{algorithm}'}</code>{' '}
                with <code className="rounded bg-white/80 px-1 dark:bg-slate-800">X-Lab-Key</code> — algorithms:{' '}
                <code>FIXED_WINDOW</code>, <code>SLIDING_WINDOW_LOG</code>, <code>SLIDING_WINDOW_COUNTER</code>,{' '}
                <code>TOKEN_BUCKET</code>, <code>LEAKY_BUCKET</code>.
              </p>
              <p className="mt-2">
                Docs in the repo: <code>INTERVIEW.md</code> · <code>RATE_LIMITER_CHEAT_SHEET.md</code> ·{' '}
                <code>COMMON_MISTAKES.md</code>.
              </p>
            </div>
            <CodePanel
              title="Quick start"
              code={`cd spring-rate-limiter-lab
mvn test
mvn spring-boot:run   # :8098

# List algorithms
curl -s http://127.0.0.1:8098/api/lab/algorithms

# Hit token bucket playground (repeat until 429)
curl -i 'http://127.0.0.1:8098/api/lab/TOKEN_BUCKET?cost=1' -H 'X-Lab-Key: demo-user'

# Payment filter path (composite policies)
curl -i -X POST http://127.0.0.1:8098/api/payments \\
  -H 'X-Tenant-Id: acme' -H 'X-Client-Id: client-123' -H 'X-User-Id: user-1'

# Optional Redis
docker compose up -d
mvn spring-boot:run -Dspring-boot.run.profiles=redis`}
            />
            {files.length > 0 && (
              <div className="mt-6">
                <OAuthCodeExplorer
                  files={files}
                  tree={tree}
                  defaultPath={defaultPath}
                  routeBase="/rate-limiter"
                  ariaLabel="Distributed rate limiter lab source tree"
                />
              </div>
            )}
          </Section>

          <Section id="problem" title="01. Problem statement" lead="Start with Meridian Bank POST /payments — not a textbook definition.">
            <CodePanel title="Cascade without admission control" code={PROBLEM_STORY} />
            <ul className="mt-4 grid gap-2 md:grid-cols-2">
              {WHY_WITHOUT.map((w) => (
                <li key={w} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-800">
                  {w}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="why" title="02. Why rate limiting" lead="It buys fairness, predictability, and time — it is not infinite scale.">
            <Insight
              problem="Uncontrolled RPS turns one buggy client into a cluster outage."
              why="Thread pools, DB pools, Kafka buffers, and providers all have hard ceilings."
              solution="Admit only what the system can absorb for each identity and route."
              example="50K RPS spike on /payments → without limits, provider 429s amplify retries."
              tradeoff="Good clients may wait; bad actors are shed. Quotas become a product contract."
              senior="Say what you protect (DB/provider) and what you explicitly do not claim (perfect global multi-region counters)."
            />
          </Section>

          <Section id="definition" title="03. Definition & cousins">
            <blockquote className="rounded-2xl border-l-4 border-slate-900 bg-slate-50 px-5 py-4 text-base leading-8 text-slate-800 dark:border-slate-100 dark:bg-slate-900 dark:text-slate-100">
              {DEFINITION}
            </blockquote>
            <div className="mt-4">
              <CodePanel title="Formula" code={RATE_FORMULA} />
            </div>
            <div className="mt-4">
              <MiniTable
                headers={['Concept', 'Definition', 'Controls', 'Typical response']}
                rows={CONCEPT_ROWS.map((c) => [c.name, c.definition, c.controls, c.typicalResponse])}
              />
            </div>
          </Section>

          <Section id="requirements" title="04. Requirements" lead="Functional dimensions + NFRs interviewers expect out loud.">
            <CodePanel title="Functional limits (AND)" code={FUNCTIONAL_LIMITS} />
            <div className="mt-4">
              <MiniTable headers={ASSUMPTIONS[0]} rows={ASSUMPTIONS.slice(1)} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {NFR_BLOCKS.map((n) => (
                <div key={n.title} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white">{n.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{n.body}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="algorithms" title="05. Algorithms" lead="Whiteboard all five — memory, accuracy, burst, distributed cost.">
            <MiniTable headers={ALGORITHM_ROWS[0]} rows={ALGORITHM_ROWS.slice(1)} />
            <div className="mt-6 space-y-4">
              {ALGORITHM_PROS.map((a) => (
                <div key={a.name} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white">{a.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{a.how}</p>
                  <p className="mt-2 text-sm leading-7 text-emerald-800 dark:text-emerald-300">
                    <strong>Advantages: </strong>
                    {a.pros}
                  </p>
                  <p className="mt-1 text-sm leading-7 text-rose-800 dark:text-rose-300">
                    <strong>Disadvantages: </strong>
                    {a.cons}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="selection" title="06. Algorithm selection" lead="Token bucket + Redis is the default Staff answer unless forced otherwise.">
            <CodePanel
              title="Decision tree"
              code={`Need simple coarse shield?     → Fixed window (gateway)
Need exact rolling count?      → Sliding log (expensive)
Need cheap almost-sliding?     → Sliding window counter
Need burst + sustained API?    → Token bucket  ★ choose this
Need smooth egress to DB?      → Leaky bucket (shaper)

Interview line:
  "I choose token bucket: capacity=burst, refill=sustained, O(1), Lua-atomic."`}
            />
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Resilience4j RateLimiter is <strong>per JVM</strong>. Ten pods × 100/s = 1000/s. Pair it with Redis for
              global quotas — do not confuse the layers.
            </p>
          </Section>

          <Section id="hld" title="07. High-level design">
            <div className="grid gap-4 lg:grid-cols-2">
              <CodePanel title="ASCII HLD" code={ASCII_HLD} />
              <Mermaid chart={MERMAID_HLD} />
            </div>
            <div className="mt-4">
              <Mermaid chart={MERMAID_LAYERS} />
            </div>
          </Section>

          <Section id="placement" title="08. Where it lives" lead="Client-only is insufficient. Defense in depth: edge + app.">
            <CodePanel title="Gateway + service" code={ASCII_WHERE} />
            <Insight
              problem="A single layer misses either floods or product quotas."
              why="WAF does not know JWT tenants; app alone dies under L7 floods."
              solution="Edge for volumetric/unauth; embedded library + Redis for identity-aware quotas."
              tradeoff="Two policies to keep coherent — publish an ownership matrix."
              senior="Central remote limiter services often blow the <5ms SLO unless co-located."
            />
          </Section>

          <Section id="lld" title="09. LLD & patterns" lead="Strategy + Factory + Store adapter — SOLID without ceremony.">
            <CodePanel title="Class sketch" code={ASCII_CLASS} />
            <div className="mt-4">
              <Mermaid chart={MERMAID_CLASS} />
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <li>
                <strong>Strategy:</strong> <code>RateLimiter</code> / <code>TokenBucketRateLimiter</code>
              </li>
              <li>
                <strong>Factory:</strong> <code>RateLimiterFactory</code> flyweight per policy
              </li>
              <li>
                <strong>Composite:</strong> AND of matching policies, fail-fast
              </li>
              <li>
                <strong>Store adapter:</strong> Redis Lua vs in-memory <code>compute</code>
              </li>
            </ul>
          </Section>

          <Section id="java" title="10. Java token bucket" lead="Thread-safe store; clamp clock; no GET/SET race.">
            <CodePanel title="Core types" code={JAVA_SNIPPET} />
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Full implementation lives in the lab explorer — <code>TokenBucketRateLimiter</code>,{' '}
              <code>TokenBucketMath</code>, <code>InMemoryRateLimitStore</code>, concurrency tests with capacity
              assertions.
            </p>
          </Section>

          <Section id="spring" title="11. Spring Boot filter" lead="OncePerRequestFilter → service → store → 429.">
            <CodePanel
              title="Request path"
              code={`HTTP Request
  → RateLimitFilter (OncePerRequestFilter)
  → extract tenant/user/client/api from JWT (lab: X-* headers)
  → CompositeRateLimiter.allow(ctx)
  → ALLOW → controller
  → REJECT → HTTP 429 + Retry-After + X-RateLimit-*`}
            />
            <CodePanel title="Headers" code={REST_EXAMPLE} />
          </Section>

          <Section id="redis" title="12. Redis design">
            <CodePanel
              title="Keys & structures"
              code={`rate_limit:{tenantId}:CLIENT_API:client-123:/api/payments
  Hash: tokens (double), ts (epoch ms)
  TTL:  PEXPIRE ≥ 2× window

Token bucket  → Hash + Lua
Fixed window  → String INCR + EXPIRE
Sliding log   → ZSET timestamps (expensive)
Sliding counter → two counters / hash fields

Cardinality: millions of identities OK if TTL expires idle keys.
Hot keys: celebrity tenants — see section 15.`}
            />
          </Section>

          <Section id="lua" title="13. Lua atomicity" lead="This is the Staff trap section — nail the race.">
            <CodePanel
              title="WRONG"
              code={`tokens = redis.get(key);
if (tokens > 0) {
  redis.decrement(key); // TOO LATE — another pod already read the same 1
  return true;
}`}
            />
            <div className="mt-4 space-y-3">
              {LUA_LINES.map((l) => (
                <div key={l.line} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <code className="font-semibold text-slate-900 dark:text-white">{l.line}</code>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">{l.why}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Mermaid chart={MERMAID_TOKEN} />
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Script: <code>spring-rate-limiter-lab/src/main/resources/lua/token_bucket.lua</code>
            </p>
          </Section>

          <Section id="distributed" title="14. Distributed limits">
            <Insight
              problem="Four pods each allowing 100/s become 400/s."
              why="Local memory is not shared coordination."
              solution="Redis (or gateway) as shared state; every pod EVAL the same key."
              example="Limit 100, 4 instances, in-memory → 400; Redis Lua → 100."
              senior="Say Cluster slot ownership: one primary runs the script for that key."
            />
            <CodePanel title="Multi-level AND" code={ASCII_MULTI} />
            <CodePanel title="Clock" code={CLOCK_NOTES} />
            <CodePanel title="Hybrid local+Redis" code={HYBRID} />
          </Section>

          <Section id="hotkeys" title="15. Hot keys">
            <Insight
              problem="One celebrity tenant hashes to one slot and melts Redis CPU."
              why="All RPS for that identity hits one primary thread."
              solution="Gateway pre-limit, local fractional buckets, hierarchical keys, shard into N approximate keys, isolate clusters."
              tradeoff="Sharded keys approximate the exact global for that tenant."
              senior="Hash-tags help multi-key Lua but can create hotter partitions — use deliberately."
            />
          </Section>

          <Section id="multiregion" title="16. Multi-region">
            <CodePanel
              title="Options"
              code={`1) Global Redis          — high latency, availability risk
2) Regional Redis        — low latency, over-admit vs “global”
3) Approximate global    — aggregator / sampled / slower central ledger

Strict exact global across 20 regions on the hot path is usually the wrong product.
Finance hard caps ≠ API admission limiter.`}
            />
            <CodePanel title="CAP perspective" code={CAP_VIEW} />
          </Section>

          <Section id="failure" title="17. Failure handling">
            <MiniTable
              headers={['Strategy', 'Behavior', 'Use', 'Risk']}
              rows={[
                ['Fail open', 'Allow when Redis errors', 'Public reads', 'Abuse during outage'],
                ['Fail closed', 'Reject when Redis errors', 'Payments / login / OTP', 'Self-inflicted outage'],
                ['Local fallback', 'In-process bucket', 'Internal workers', 'N pods ≈ N× while degraded'],
              ]}
            />
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Slow Redis without timeouts exhausts threads — treat latency like an outage (circuit + policy).
            </p>
          </Section>

          <Section id="retry" title="18. Retry + backoff">
            <CodePanel title="Client" code={RETRY_CODE} />
            <CodePanel title="Ordering with CB" code={RESILIENCE_ORDER} />
          </Section>

          <Section id="resilience" title="19. Circuit breaker · Kafka · DB · concurrency">
            <div className="grid gap-4 lg:grid-cols-2">
              <CodePanel title="Kafka" code={KAFKA_RL} />
              <CodePanel title="Concurrency vs rate" code={CONCURRENCY_VS_RATE} />
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Rate limit protects DB pools/IOPS by admitting fewer queries than the database can take. Example: DB
              5K QPS capacity ⇒ API admission must sit below that after fan-out.
            </p>
          </Section>

          <Section id="aws" title="20. AWS architecture">
            <CodePanel title="Production shape" code={AWS_ASCII} />
          </Section>

          <Section id="security" title="21. Security">
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <li>Principal from JWT/API key — not spoofable IP alone.</li>
              <li>IP + user + API key + tenant when appropriate.</li>
              <li>Helps brute force / stuffing / scraping — does not replace Shield/WAF/CloudFront.</li>
              <li>Config APIs require RATE_LIMIT_ADMIN + audit.</li>
              <li>Do not log secrets or PANs in reject bodies.</li>
            </ul>
          </Section>

          <Section id="observability" title="22. Observability">
            <MiniTable headers={OBS_ALERTS[0]} rows={OBS_ALERTS.slice(1)} />
          </Section>

          <Section id="capacity" title="23. Capacity & performance">
            <CodePanel title="1M RPS sketch" code={CAPACITY_MATH} />
            <div className="mt-4">
              <MiniTable headers={PERF_COMPARE[0]} rows={PERF_COMPARE.slice(1)} />
            </div>
            <div className="mt-4">
              <MiniTable headers={SCALE_ROWS[0]} rows={SCALE_ROWS.slice(1)} />
            </div>
          </Section>

          <Section id="testing" title="24. Load & unit tests">
            <ul className="grid gap-2 md:grid-cols-2">
              {[
                'Within limit → allow, remaining decreases',
                'Over limit → reject + Retry-After',
                'Refill after fake clock advance',
                'Burst uses capacity',
                '100 threads, capacity 10 → allowed ≤ 10 (+burst rules)',
                'Independent client/tenant buckets',
                'Store throw → fail-open / closed / fallback',
                'Config upsert visible next allow()',
                'Filter 200 + X-RateLimit-* / 429',
                'k6/Gatling: normal, burst, hot tenant, Redis latency, failover',
              ].map((item) => (
                <li key={item} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-800">
                  [ ] {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="incidents" title="25. Production incidents" lead="Symptom → investigation → root cause → fix → prevention.">
            <div className="space-y-4">
              {INCIDENTS.map((s) => (
                <div key={s.id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    <strong>Symptom:</strong> {s.symptom}
                  </p>
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                    <strong>Investigation:</strong> {s.investigation}
                  </p>
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                    <strong>Root cause:</strong> {s.rootCause}
                  </p>
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                    <strong>Fix:</strong> {s.fix}
                  </p>
                  <p className="text-sm leading-7 text-emerald-800 dark:text-emerald-300">
                    <strong>Prevention:</strong> {s.prevention}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="antipatterns" title="26. Anti-patterns">
            <div className="grid gap-3 md:grid-cols-2">
              {ANTI_PATTERNS.map((a) => (
                <div key={a.title} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="font-bold text-rose-800 dark:text-rose-300">{a.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{a.why}</p>
                  <p className="mt-1 text-sm leading-7 text-emerald-800 dark:text-emerald-300">
                    <strong>Instead:</strong> {a.instead}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <MiniTable headers={TRADEOFFS[0]} rows={TRADEOFFS.slice(1)} />
            </div>
          </Section>

          <Section id="diagrams" title="27. Mermaid diagrams">
            <div className="space-y-6">
              <Mermaid chart={MERMAID_ALLOW} />
              <Mermaid chart={MERMAID_REJECT} />
              <CodePanel title="Sequence ASCII" code={ASCII_SEQ} />
            </div>
          </Section>

          <Section id="payment" title="28. Payment system example">
            <CodePanel title="Meridian POST /payments" code={PAYMENT_FLOW} />
            <div className="mt-4">
              <Mermaid chart={MERMAID_PAYMENT} />
            </div>
          </Section>

          <Section id="config" title="29. Dynamic config · fairness">
            <div className="grid gap-4 lg:grid-cols-2">
              <CodePanel title="Config propagation" code={DYNAMIC_CONFIG} />
              <CodePanel title="Fairness" code={FAIRNESS} />
            </div>
            <div className="mt-4">
              <CodePanel title="Lab config path" code={ASCII_CONFIG} />
            </div>
          </Section>

          <Section id="answers" title="30. 5-minute · 30-second · cheat sheet">
            <h3 className="text-sm font-bold uppercase tracking-[.12em] text-slate-500">30-second</h3>
            <p className="mt-2 rounded-2xl bg-emerald-950 px-4 py-3 text-sm font-semibold leading-7 text-emerald-50">
              {THIRTY_SEC}
            </p>
            <h3 className="mt-6 text-sm font-bold uppercase tracking-[.12em] text-slate-500">5-minute</h3>
            <div className="mt-2 rounded-2xl bg-slate-900 p-6 text-sm font-medium leading-8 text-slate-100">{FIVE_MIN}</div>
            <h3 className="mt-6 text-sm font-bold uppercase tracking-[.12em] text-slate-500">One-page</h3>
            <CodePanel title="Cheat sheet" code={ONE_PAGE} />
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {CHEAT.map(([k, v]) => (
                <div key={k} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="font-bold">{k}</div>
                  <div className="text-slate-500">{v}</div>
                </div>
              ))}
            </div>
            <ul className="mt-6 grid gap-2 md:grid-cols-2">
              {CHECKLIST.map((item) => (
                <li key={item} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-800">
                  [ ] {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="interview" title="31. Interview bank" lead="Senior · Architect · Principal · Rapid — reveal expected vs trap answers.">
            <InterviewMode />
          </Section>
        </div>
      </div>
    </div>
  );
}
