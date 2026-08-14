'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import type {DemoSourceFile, DemoTreeNode} from '@/lib/oauth-demo-source';
import {BLOOM_TOC} from '@/lib/bloom-filter/toc';
import {TOPICS} from '@/lib/bloom-filter/topics';
import {
  CHEAT,
  CHECKLIST,
  CLOSING,
  COMPARISON,
  DB_ENGINE_TABLE,
  FAILURE_CASES,
  FIVE_MIN,
  MEMORY_SENTENCE,
  MEMORY_TABLE,
  PROS_CONS,
  SIXTY_SEC,
  TWO_MINUTE_STORY,
} from '@/lib/bloom-filter/comparison';
import {PRODUCTION_MISTAKES} from '@/lib/bloom-filter/mistakes';
import CodePanel from './code-panel';
import InterviewMode from './interview-mode';
import SequenceWalkthrough, {LabCallMap} from './sequence-walkthrough';
import StickyToc from './sticky-toc';
import TopicPanel from './topic-panel';

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

const SECTION_IDS = new Set(['overview', 'architecture', 'math', 'lab', 'checklist']);

export default function BloomFilterHub({
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
          Staff · Principal · System Design · Java · Spring Boot · LSM / Cassandra
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Bloom Filter — Deep Dive for Java Backend Interviews
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          From bit arrays and false positives to Spring Boot cache-penetration shields, Cassandra SSTables,
          Kafka idempotency pitfalls, counting filters, and production sizing.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Lab:{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-900">spring-bloom-filter-lab/</code>
          {' · '}
          <Link href="/distributed-caching" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Caching
          </Link>
          {' · '}
          <Link href="/redis-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Redis
          </Link>
          {' · '}
          <Link href="/kafka-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Kafka
          </Link>
          {' · '}
          <Link href="/db-sharding" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            DB scaling
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={BLOOM_TOC} />
        <div className="min-w-0 space-y-16">
          <Section
            id="overview"
            title="01. What is a Bloom Filter?"
            lead="Alice, Bob, Charlie are inserted. Alice must always look present. David is usually absent — if present, that is a false positive."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TD
  Q[Is key in set?] --> BF[Bloom Filter]
  BF -->|false| No[Definitely NOT present]
  BF -->|true| Maybe[Maybe present — verify in Redis/DB]`}
              />
            </div>
            <CodePanel
              title="Narrative"
              code={`add(Alice), add(Bob), add(Charlie)

mightContain(Alice)  → true   // never a false negative
mightContain(David)  → false  // definitely absent
                     → true   // FALSE POSITIVE (allowed)`}
            />
          </Section>

          <Section id="architecture" title="02. Internal working">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TD
  Key[Alice] --> H1[Hash1 → 2]
  Key --> H2[Hash2 → 5]
  Key --> H3[Hash3 → 8]
  H1 --> Bits["bit array 0 1 1 0 0 1 0 0 1 0"]
  H2 --> Bits
  H3 --> Bits`}
              />
            </div>
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`              Hash Functions
                   |
        +----------+----------+
        |          |          |
      Hash1      Hash2      Hash3
        |          |          |
        v          v          v
       2           5          8
        |          |          |
        +----------+----------+
                   v
        0 1 1 0 0 1 0 0 1 0`}</pre>
          </Section>

          <Section
            id="code-sequences"
            title="Code sequences"
            lead="Missing id short-circuit, maybe→cache→DB, create updates Bloom, rebuild, Kafka hint+truth."
          >
            <SequenceWalkthrough />
            <div className="mt-6">
              <LabCallMap />
            </div>
          </Section>

          <Section id="math" title="03. Math & memory tables">
            <MiniTable headers={MEMORY_TABLE[0]} rows={MEMORY_TABLE.slice(1)} />
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Formulas: <code>m ≈ −n ln(p)/(ln 2)²</code>, <code>k ≈ (m/n) ln 2</code>, FPP ≈{' '}
              <code>(1 − e^(−kn/m))^k</code>. Rule of thumb: ~10 bits/key at 1% FPP → 1M keys ≈ 1.2 MB.
            </p>
            <div className="mt-6">
              <MiniTable headers={COMPARISON[0]} rows={COMPARISON.slice(1)} />
            </div>
            <div className="mt-6">
              <MiniTable headers={DB_ENGINE_TABLE[0]} rows={DB_ENGINE_TABLE.slice(1)} />
            </div>
            <div className="mt-6">
              <MiniTable headers={['', 'Note']} rows={PROS_CONS} />
            </div>
          </Section>

          {TOPICS.filter((t) => !SECTION_IDS.has(t.id)).map((t) => (
            <TopicPanel key={t.id} t={t} />
          ))}

          <Section id="failures" title="Failure scenarios">
            <MiniTable
              headers={['Failure', 'Detection', 'Recovery', 'Retry', 'Fallback', 'Alert']}
              rows={FAILURE_CASES}
            />
          </Section>

          <Section id="mistakes" title="Production mistakes">
            <MiniTable
              headers={['Bad', 'Good', 'Why']}
              rows={PRODUCTION_MISTAKES.map((r) => [r.bad, r.good, r.why])}
            />
          </Section>

          <Section id="interview" title="Interview bank">
            <InterviewMode />
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">60-second</div>
                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{SIXTY_SEC}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">5-minute</div>
                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{FIVE_MIN}</p>
              </div>
            </div>
          </Section>

          <Section id="storytelling" title="2-minute interview answer">
            <div className="rounded-2xl bg-slate-900 p-6 text-sm font-medium leading-8 text-slate-100">{TWO_MINUTE_STORY}</div>
          </Section>

          <Section
            id="lab"
            title="Runnable lab"
            lead="Java 21 / Spring Boot 3.4 on :8097. Classic + counting Bloom filters, user lookup, idempotency guard, Micrometer."
          >
            <CodePanel
              title="Quick start"
              code={`cd spring-bloom-filter-lab
mvn test
mvn spring-boot:run

curl -sS http://127.0.0.1:8097/api/users/user-1 | jq .
curl -sS -w '\\n%{http_code}\\n' http://127.0.0.1:8097/api/users/no-such-user
curl -sS http://127.0.0.1:8097/api/bloom/stats | jq .`}
            />
            {files.length > 0 && (
              <div className="mt-6">
                <OAuthCodeExplorer
                  files={files}
                  tree={tree}
                  defaultPath={defaultPath}
                  routeBase="/bloom-filter"
                  ariaLabel="Bloom filter lab source tree"
                />
              </div>
            )}
          </Section>

          <Section id="checklist" title="Production checklist & cheat sheet">
            <ul className="grid gap-2 md:grid-cols-2">
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
            <p className="mt-6 max-w-3xl text-base font-semibold leading-7 text-slate-800 dark:text-slate-200">
              {CLOSING}
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
