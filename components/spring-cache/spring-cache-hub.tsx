'use client';

import Link from 'next/link';
import CodePanel from '@/components/hub-code-panel';
import {CORE_RULE, SPRING_CACHE_TOC, VERSION_NOTE} from '@/lib/spring-cache/toc';
import {ABSTRACTION, FINAL_ARCH, MENTAL_MODEL, MISSION} from '@/lib/spring-cache/fundamentals';
import {
  ALGO_TABLE,
  LFU,
  LFU_CODE,
  LRU,
  LRU_CODE,
  MANUAL_CACHE,
} from '@/lib/spring-cache/algorithms';
import {
  ANNOTATION_CODE,
  CACHEABLE,
  CACHING_CONFIG,
  ENABLE_CACHING,
  KEYS_SPEL,
  PARAMS,
  PUT_EVICT,
} from '@/lib/spring-cache/annotations';
import {
  CAFFEINE,
  CAFFEINE_CODE,
  L1L2,
  LOCAL_VS_DIST,
  PATTERNS,
  REDIS,
  REDIS_CODE,
} from '@/lib/spring-cache/providers';
import {
  ADVANCED,
  ECOMMERCE,
  FAILURES,
  FINTECH,
  JITTER_CODE,
  LAB,
  NEGATIVE_CODE,
} from '@/lib/spring-cache/production';
import StickyToc from './sticky-toc';
import InterviewBrowser from './interview-browser';

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

function Pre({children}: {children: string}) {
  return (
    <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[13px] leading-6 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
      {children}
    </pre>
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
                <td
                  key={`${r[0]}-${i}`}
                  className={`px-2 py-2 align-top ${i === 0 ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}
                >
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

function Callout({children}: {children: string}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm leading-7 text-slate-100 dark:border-slate-200 dark:bg-slate-100 dark:text-slate-900">
      <div className="text-[11px] font-bold uppercase tracking-[.12em] opacity-80">Core rule</div>
      <p className="mt-1 whitespace-pre-wrap">{children}</p>
    </div>
  );
}

export default function SpringCacheHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Beginner → Principal · Spring Cache · Caffeine · Redis
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Spring Caching Master Guide
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          From manual LRU/LFU to @Cacheable, Caffeine, Redis, L1/L2, stampede/penetration/avalanche, and
          interview-ready architecture — with a runnable lab.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{VERSION_NOTE}</p>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
          Related:{' '}
          <Link href="/distributed-caching" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Distributed Caching
          </Link>
          {' · '}
          <Link href="/redis-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Redis Interview
          </Link>
          .
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-16">
          <Section id="mission" title="00. Mission & rule">
            <Pre>{MISSION}</Pre>
            <Callout>{CORE_RULE}</Callout>
          </Section>

          <Section id="abstraction" title="01. Spring Cache ≠ distributed" lead="Abstraction vs provider — the #1 interview trap.">
            <Pre>{ABSTRACTION}</Pre>
            <Pre>{FINAL_ARCH}</Pre>
          </Section>

          <Section id="manual" title="02. Manual cache first" lead="Own get/put/remove before annotations hide the mechanics.">
            <Pre>{MANUAL_CACHE}</Pre>
          </Section>

          <Section id="lru" title="03. LRU" lead="Least Recently Used — O(1) with LinkedHashMap or HashMap+DLL.">
            <Pre>{LRU}</Pre>
            <CodePanel title="LruCache" code={LRU_CODE} language="java" />
          </Section>

          <Section id="lfu" title="04. LFU" lead="Least Frequently Used — frequency buckets.">
            <Pre>{LFU}</Pre>
            <CodePanel title="LFU sketch" code={LFU_CODE} language="java" />
          </Section>

          <Section id="algo-table" title="05. Eviction table">
            <MiniTable headers={ALGO_TABLE[0]} rows={ALGO_TABLE.slice(1)} />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Spring Cache does <strong>not</strong> implement LRU/LFU — the provider does.
            </p>
          </Section>

          <Section id="enable" title="06. @EnableCaching · AOP">
            <Pre>{ENABLE_CACHING}</Pre>
          </Section>

          <Section id="cacheable" title="07. @Cacheable" lead="HIT vs MISS vs DB.">
            <Pre>{CACHEABLE}</Pre>
          </Section>

          <Section id="params" title="08. condition vs unless · sync">
            <Pre>{PARAMS}</Pre>
          </Section>

          <Section id="put-evict" title="09. @CachePut · @CacheEvict">
            <Pre>{PUT_EVICT}</Pre>
          </Section>

          <Section id="caching-config" title="10. @Caching · @CacheConfig">
            <Pre>{CACHING_CONFIG}</Pre>
            <CodePanel title="ProductService annotations" code={ANNOTATION_CODE} language="java" />
          </Section>

          <Section id="keys-spel" title="11. Keys · SpEL · KeyGenerator">
            <Pre>{KEYS_SPEL}</Pre>
          </Section>

          <Section id="caffeine" title="12. Caffeine · TTL vs TTI">
            <Pre>{CAFFEINE}</Pre>
            <CodePanel title="CaffeineCacheManager" code={CAFFEINE_CODE} language="java" />
          </Section>

          <Section id="redis" title="13. Redis · serialization">
            <Pre>{REDIS}</Pre>
            <CodePanel title="RedisCacheManager" code={REDIS_CODE} language="java" />
          </Section>

          <Section id="local-vs-dist" title="14. Local vs distributed">
            <MiniTable headers={LOCAL_VS_DIST[0]} rows={LOCAL_VS_DIST.slice(1)} />
          </Section>

          <Section id="l1l2" title="15. L1 + L2">
            <Pre>{L1L2}</Pre>
          </Section>

          <Section id="patterns" title="16. Cache patterns">
            <Pre>{PATTERNS}</Pre>
          </Section>

          <Section id="failures" title="17. Stampede · penetration · avalanche">
            <Pre>{FAILURES}</Pre>
            <CodePanel title="Negative / sentinel" code={NEGATIVE_CODE} language="java" />
            <CodePanel title="TTL jitter" code={JITTER_CODE} language="java" />
          </Section>

          <Section id="advanced" title="18. Self-invocation · tx · multi CM">
            <Pre>{ADVANCED}</Pre>
          </Section>

          <Section id="ecommerce" title="19. Product API example">
            <Pre>{ECOMMERCE}</Pre>
          </Section>

          <Section id="fintech" title="20. FinTech what to cache">
            <Pre>{FINTECH}</Pre>
          </Section>

          <Section id="lab" title="21. Runnable lab">
            <Pre>{LAB}</Pre>
          </Section>

          <Section id="cheat" title="22. Memory framework">
            <Pre>{MENTAL_MODEL}</Pre>
          </Section>

          <Section id="interview" title="23. 40+ interview Q&A" lead="Filter by topic; expand for answers.">
            <InterviewBrowser />
          </Section>
        </div>
        <StickyToc items={SPRING_CACHE_TOC} />
      </div>
    </div>
  );
}
