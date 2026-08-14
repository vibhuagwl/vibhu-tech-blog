'use client';

import Link from 'next/link';
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
  FOLLOWUPS,
  JAVA_SNIPPET,
  LUA_LINES,
  MEMORY_SENTENCE,
  OBS_ALERTS,
  REST_EXAMPLE,
  SCALE_ROWS,
  SCENARIOS,
  TRADEOFFS,
} from '@/lib/rate-limiter/content';
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
          Staff · System Design · Java · Spring Boot · Redis
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Distributed Rate Limiting — Token Bucket, Redis Lua, Multi-Level Quotas
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          A production-shaped design for APIs and internal services: per user, client, API, IP, tenant, and
          service limits that stay correct when traffic is spread across many application servers.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Lab:{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-900">spring-rate-limiter-lab/</code>
          {' · port 8098 · '}
          <Link href="/system-design/design-rate-limiter" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            short catalog article
          </Link>
          {' · '}
          <Link href="/resilience4j" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Resilience4j (per-JVM)
          </Link>
          {' · '}
          <Link href="/redis-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Redis
          </Link>
          {' · '}
          <Link href="/api-gateway" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            API Gateway
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={RATE_LIMIT_TOC} />
        <div className="min-w-0 space-y-16">
          <Section
            id="requirements"
            title="1. Requirements & Assumptions"
            lead="Functional: identity-scoped limits, multiple windows, burst, dynamic config, Allow/Reject/Retry-After/remaining, multi-tenant quotas, abuse blocks. Non-functional: multi-server, ~global counters, p99 check under 10ms, no extra SPOF, millions of keys, HA, Redis failure policy, no consume races, metrics."
          >
            <MiniTable headers={ASSUMPTIONS[0]} rows={ASSUMPTIONS.slice(1)} />
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Consistency is <strong>single-key atomic</strong> on a Redis primary, not a globally linearizable
              counter across continents. Availability is a <strong>per-route fail policy</strong>, because a
              limiter that fail-opens payments and a limiter that fail-closes a public homepage are different products.
            </p>
          </Section>

          <Section
            id="algorithms"
            title="2. Rate-Limiting Algorithms"
            lead="Five algorithms you must be able to compare on a whiteboard. Memory, accuracy, burst, and distributed complexity decide the production default."
          >
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

          <Section
            id="selection"
            title="3. Algorithm Selection"
            lead="Token bucket is the primary implementation unless the interviewer forces a shaper (leaky) or a billing-grade exact window (sliding log)."
          >
            <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p>
                <strong className="text-slate-900 dark:text-white">Why token bucket: </strong>
                capacity is burst, refillRate/period is sustained (100/min + burst 20 → capacity 120, refill 100 per
                minute), remaining tokens and Retry-After fall out of the math, memory is two numbers per key, and
                Redis Lua can make refill+consume atomic.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">Why not fixed window: </strong>
                a client can spend the full limit at 12:00:59 and again at 12:01:00 — up to 2×. That is a Staff trap.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">Why not sliding log: </strong>
                exact, but ZSET of timestamps explodes on a 10K req/hour client. Save it for billing disputes, not the
                hot path.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">At 1M RPS: </strong>
                keep token bucket for user/API keys; consider sliding-window counter for the coarsest global key if
                you need cheaper approximation.
              </p>
              <p>
                Resilience4j RateLimiter is <strong>per JVM</strong>. Ten pods × 100/s = 1000/s. That is a different
                layer (protect a dependency), not this system.
              </p>
            </div>
          </Section>

          <Section
            id="architecture"
            title="4. High-Level Architecture"
            lead="Limiter lives in two places: coarse at the gateway, identity-aware as an embedded library. Redis Cluster holds the buckets. Config fans out without restarts."
          >
            <CodePanel title="HLD" code={ASCII_HLD} />
            <div className="mt-4">
              <CodePanel title="Where it lives" code={ASCII_WHERE} />
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <li>
                <strong>Redis architecture:</strong> Cluster with replicas per shard. One EVAL per key. Connection
                pool per app pod in the same AZ.
              </li>
              <li>
                <strong>Sharding:</strong> CRC16 of the key → 16384 slots. Hash-tag <code>{'{tenantId}'}</code> only if
                you need multi-key Lua; otherwise let keys spread.
              </li>
              <li>
                <strong>Config:</strong> admin API → DB → Kafka → in-process map. Lab skips Kafka and upserts a
                ConcurrentHashMap.
              </li>
              <li>
                <strong>Failures:</strong> tight timeouts, circuit breaker, per-route fail-open / fail-closed /
                local-fallback.
              </li>
            </ul>
          </Section>

          <Section
            id="components"
            title="5. Component Design"
            lead="Strategy for algorithms, factory for selection, store for Redis vs memory, config provider for dynamic policies, Spring DI to wire them."
          >
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <li>
                <code>RateLimiter</code> — strategy. <code>TokenBucketRateLimiter</code> is the production strategy.
              </li>
              <li>
                <code>RateLimiterFactory</code> — flyweight per policy id; rejects unimplemented algorithms so the
                interview stays honest.
              </li>
              <li>
                <code>CompositeRateLimiter</code> — AND of matching policies, fail-fast.
              </li>
              <li>
                <code>RateLimitStore</code> / <code>RedisRateLimitStore</code> / <code>InMemoryRateLimitStore</code> —
                repository. Lua vs <code>ConcurrentHashMap.compute</code>.
              </li>
              <li>
                <code>RateLimitConfigProvider</code> — swap in DB+Kafka without touching the limiter.
              </li>
              <li>
                <code>RateLimitFilter</code> — servlet filter, 429 + headers. Config CRUD is excluded from the filter.
              </li>
            </ul>
          </Section>

          <Section id="class-diagram" title="6. Class Diagram">
            <CodePanel title="Classes" code={ASCII_CLASS} />
          </Section>

          <Section
            id="sequence"
            title="7. Sequence Diagram"
            lead="Auth happens before the limiter. Identity is not a client-supplied IP header."
          >
            <CodePanel title="Allow path" code={ASCII_SEQ} />
          </Section>

          <Section
            id="data-model"
            title="8. Data Model"
            lead="Two stores: policy config (small, strongly consistent enough via DB) and bucket state (huge, Redis, TTL)."
          >
            <CodePanel
              title="Keys"
              code={`Policy (config)
  id, scope, capacity, refillRate, refillPeriod,
  tenantId?, clientId?, apiPath?, serviceName?,
  failPolicy, blocked, algorithm=TOKEN_BUCKET

Bucket (Redis hash)
  key    = rate_limit:{tenantId}:SCOPE:...
  tokens = double
  ts     = last refill epoch ms
  TTL    = 2 × window (PEXPIRE)

Example
  rate_limit:{acme}:CLIENT_API:client-123:/api/payments
  HSET tokens 87.4  ts 1710000000000
  PEXPIRE 120000`}
            />
          </Section>

          <Section
            id="java"
            title="9. Java 17 Implementation"
            lead="Java 21 / Spring Boot 3.4 lab. Interfaces, records, thread-safe stores, explicit fail policies. Not pseudocode."
          >
            <CodePanel title="Core types" code={JAVA_SNIPPET} />
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Browse the runnable module in the lab section. Default store is in-memory so tests do not need Docker;
              <code> rate-limit.store=redis</code> swaps in Lua.
            </p>
          </Section>

          <Section
            id="lua"
            title="10. Redis Lua Script"
            lead="One key, one EVAL: calculation and update are atomic. Two application servers cannot consume the same token."
          >
            <div className="space-y-3">
              {LUA_LINES.map((l) => (
                <div key={l.line} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <code className="font-semibold text-slate-900 dark:text-white">{l.line}</code>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">{l.why}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Full script: <code>spring-rate-limiter-lab/src/main/resources/lua/token_bucket.lua</code>. Returns
              <code> {'{allowed, remaining, retry_after_ms, capacity}'}</code>.
            </p>
          </Section>

          <Section id="rest" title="11. REST APIs" lead="Config CRUD plus enforcement headers on the business API.">
            <CodePanel title="Config + headers" code={REST_EXAMPLE} />
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Rejected business calls are <strong>HTTP 429 Too Many Requests</strong>, not 401/403. If the store is
              down and the route is fail-closed, 429 or 503 with Retry-After is acceptable; say which you picked.
            </p>
          </Section>

          <Section
            id="concurrency"
            title="12. Distributed Concurrency"
            lead="The race is two requests (same or different pods) reading 1 token and both admitting."
          >
            <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p>
                <strong className="text-slate-900 dark:text-white">Same process: </strong>
                <code>ConcurrentHashMap.compute</code> serializes per key. The concurrency test fires 32 threads × 10
                against capacity 50 with a day-long refill and asserts allowed == 50.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">Many servers: </strong>
                they all EVAL the same Redis key. The shard thread runs scripts one at a time. Capacity is a hard
                ceiling.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">Clock: </strong>
                negative elapsed is clamped so a backwards NTP step does not steal tokens. Prefer Redis TIME in
                production Lua.
              </p>
            </div>
          </Section>

          <Section
            id="failure"
            title="13. Failure Handling"
            lead="Fail-open, fail-closed, local fallback — pick per route, never as a global religion."
          >
            <MiniTable
              headers={['Strategy', 'Behavior', 'Use', 'Risk']}
              rows={[
                ['Fail open', 'Allow when Redis errors/timeouts', 'Public reads, marketing APIs', 'Abuse during the outage'],
                ['Fail closed', 'Reject when Redis errors', 'Payments, login, OTP, transfers', 'Self-inflicted outage'],
                ['Local fallback', 'In-process bucket', 'Internal workers, mesh', 'N pods ≈ N× quota while Redis is down'],
              ]}
            />
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Recommendation: <strong>payments FAIL_CLOSED</strong>, <strong>public GET FAIL_OPEN</strong> with a
              budget and a page, <strong>internal services LOCAL_FALLBACK</strong>. Treat slow Redis like down —
              timeouts of a few milliseconds plus a circuit breaker.
            </p>
          </Section>

          <Section
            id="multilevel"
            title="14. Multi-Level Rate Limiting"
            lead="A request is allowed only if every matching policy grants a token."
          >
            <CodePanel title="Evaluation order" code={ASCII_MULTI} />
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Sequential, not one Redis MULTI: Cluster hash slots would CROSSSLOT unless every level shares a
              hash-tag — which recreates a hot partition. Fail-fast on reject so we do not spend inner tokens after
              an outer deny. That is a conscious trade-off, not a bug you hide.
            </p>
          </Section>

          <Section id="config" title="15. Dynamic Configuration">
            <CodePanel title="Propagation" code={ASCII_CONFIG} />
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Lab <code>PUT /api/rate-limits/{'{key}'}</code> upserts the map and evicts the factory flyweight. The
              next <code>allow()</code> uses the new capacity. Existing Redis tokens refill toward the new ceiling;
              they are not wiped (unless an operator deletes the key).
            </p>
          </Section>

          <Section id="observability" title="16. Observability">
            <MiniTable headers={OBS_ALERTS[0]} rows={OBS_ALERTS.slice(1)} />
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Micrometer names in the lab: <code>rate_limit_requests_total</code>, <code>rate_limit_allowed_total</code>,{' '}
              <code>rate_limit_rejected_total</code>, <code>rate_limit_latency</code>, <code>redis_errors</code>,{' '}
              <code>hot_keys</code>. Distinguish “customers hitting the plan” from “Redis is sick”.
            </p>
          </Section>

          <Section id="security" title="17. Security">
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <li>
                <strong>Identity:</strong> userId/clientId/tenantId from a verified JWT or API key, not from
                spoofable headers in production. The lab uses <code>X-User-Id</code> only as a stand-in.
              </li>
              <li>
                <strong>IP hopping:</strong> IP-only keys are bypassable. Bind quota to the principal; use IP as a
                secondary unauth signal.
              </li>
              <li>
                <strong>API-key abuse:</strong> stolen keys inherit the key&apos;s quota — revoke the key, do not just
                rate-limit. Optional per-key anomaly alerts.
              </li>
              <li>
                <strong>Authn vs rate limiting:</strong> 401 is “who are you”; 429 is “I know who you are, slow down”.
              </li>
              <li>
                <strong>Tenant isolation:</strong> keys are prefixed with <code>{'{tenantId}'}</code>. Never accept
                tenant from an unverified body field.
              </li>
              <li>
                <strong>Config APIs:</strong> role <code>RATE_LIMIT_ADMIN</code>, audit log. A public POST that
                raises everyone&apos;s quota is a vulnerability.
              </li>
            </ul>
          </Section>

          <Section id="scaling" title="18. Scaling Strategy">
            <MiniTable headers={SCALE_ROWS[0]} rows={SCALE_ROWS.slice(1)} />
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Tools: Redis sharding, extra clusters (region / money vs public), local caching of policies (not of
              remaining tokens, unless you accept over-admit), distributed counters via Lua, hot-key split,
              hierarchical limits, gateway scale-out for L7 floods.
            </p>
          </Section>

          <Section
            id="testing"
            title="19. Testing Strategy"
            lead="JUnit 5 + Mockito. Testcontainers Redis when Docker exists. The concurrency test is the one that proves the design."
          >
            <ul className="grid gap-2 md:grid-cols-2">
              {[
                'Within limit → allow, remaining decreases',
                'Over limit → reject + Retry-After',
                'Refill after fake clock advance',
                'Burst uses capacity, not refillRate',
                'Concurrent: allowed == capacity',
                'Independent client buckets',
                'Independent tenant buckets',
                'Store throw → fail-open / fail-closed / fallback',
                'Deleted key rebuilds at capacity',
                'Config upsert visible on next allow()',
                'Mocked Lua payload mapping',
                'Filter 200 + X-RateLimit-* headers',
              ].map((item) => (
                <li key={item} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-800">
                  [ ] {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="scenarios" title="20. Failure Scenarios">
            <div className="space-y-4">
              {SCENARIOS.map((s) => (
                <div key={s.title} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{s.what}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="tradeoffs" title="21. Design Trade-offs">
            <MiniTable headers={TRADEOFFS[0]} rows={TRADEOFFS.slice(1)} />
          </Section>

          <Section id="five-min" title="22. How I Would Explain This in a Senior Engineer Interview">
            <div className="rounded-2xl bg-slate-900 p-6 text-sm font-medium leading-8 text-slate-100">{FIVE_MIN}</div>
            <div className="mt-6">
              <InterviewMode />
            </div>
          </Section>

          <Section id="followups" title="23. Interview Follow-up Questions">
            <div className="space-y-4">
              {FOLLOWUPS.map((f, i) => (
                <div key={f.q} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {i + 1}. {f.q}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{f.a}</p>
                </div>
              ))}
            </div>
            <ul className="mt-8 grid gap-2 md:grid-cols-2">
              {CHECKLIST.map((item) => (
                <li key={item} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-800">
                  [ ] {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 grid gap-2 md:grid-cols-2">
              {CHEAT.map(([k, v]) => (
                <div key={k} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="font-bold">{k}</div>
                  <div className="text-slate-500">{v}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="lab"
            title="Runnable lab"
            lead="Java 21 / Spring Boot 3.4 on :8098. In-memory default, Redis Lua optional, multi-level policies, 429 headers, dynamic config."
          >
            <CodePanel
              title="Quick start"
              code={`cd spring-rate-limiter-lab
mvn test
mvn spring-boot:run

curl -i -X POST http://127.0.0.1:8098/api/payments \\
  -H 'X-Tenant-Id: acme' -H 'X-Client-Id: client-123' -H 'X-User-Id: user-1'

curl -sS http://127.0.0.1:8098/api/rate-limits | jq .`}
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
        </div>
      </div>
    </div>
  );
}
