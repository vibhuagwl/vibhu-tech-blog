'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {SHARD_TOC} from '@/lib/db-sharding/toc';
import {TOPICS} from '@/lib/db-sharding/topics';
import {
  BACKUP_CLONE_REPLICA,
  CHEAT,
  DECISION,
  DR_STRATEGIES,
  PART_VS_SHARD,
  REMEMBER,
} from '@/lib/db-sharding/comparison';
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

export default function DbShardingHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Staff · Principal · Architect · Java · Spring · SQL/NoSQL · AWS · DR
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Database Partitioning &amp; Sharding
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Banking transactions · SQL partitions · shard routers · NoSQL keys · Spring routing · AWS ·
          disaster recovery — whiteboard-ready, code-first.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          ~90% diagrams/SQL/Java. Lab:{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-900">db-sharding-lab/</code>
          {' · '}
          <Link href="/distributed-caching" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Caching
          </Link>
          {' · '}
          <Link href="/load-balancing" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Load Balancing
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={SHARD_TOC} />
        <div className="min-w-0 space-y-5">
          <Section
            id="overview"
            title="500M Transactions Problem"
            lead="One PostgreSQL table with 500M banking rows, 10M inserts/month, thousands of QPS — indexes grow, vacuum hurts, queries crawl."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
                <Mermaid
                  chart={`flowchart TD
  APP[Spring Boot] --> PG[(PostgreSQL)]
  PG --> T[transactions 500M rows]
  T --> SLOW[Slow queries]
  T --> IDX[Huge indexes]
  T --> VAC[Heavy maintenance]`}
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <Mermaid
                  chart={`flowchart TB
  APP[Application] --> R[Shard Router]
  R --> S1[(Shard-1 cust 1-1M)]
  R --> S2[(Shard-2 cust 1M-2M)]
  R --> S3[(Shard-3 cust 2M-3M)]
  S1 --> Q1[Q1] --> Q2[Q2]
  S2 --> Q1b[Q1] --> Q2b[Q2]`}
                />
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart LR
  P[PARTITIONING] -->|same DB| T1[Split table]
  S[SHARDING] -->|many DBs| T2[Split instances]`}
              />
            </div>
            <CodePanel
              title="Schema under pressure"
              code={`transactions
------------------------------------------------
transaction_id | customer_id | account_id
amount | currency | transaction_date | status | region

Assume: 500M rows · 10M/month · thousands QPS`}
            />
          </Section>

          <Section id="vs-table" title="Partitioning vs Sharding">
            <MiniTable
              headers={['Feature', 'Partitioning', 'Sharding']}
              rows={PART_VS_SHARD.map((r) => [r.f, r.p, r.s])}
            />
          </Section>

          {TOPICS.map((t) => (
            <TopicPanel key={t.id} t={t} />
          ))}

          <Section id="dr-table" title="DR Strategy Comparison" lead="Illustrative RPO/RTO — actuals depend on config, lag, and runbooks.">
            <MiniTable
              headers={['Strategy', 'RPO', 'RTO', 'Cost']}
              rows={DR_STRATEGIES.map((r) => [r.s, r.rpo, r.rto, r.cost])}
            />
            <div className="mt-4">
              <MiniTable
                headers={['Feature', 'Backup', 'Clone', 'Replica']}
                rows={BACKUP_CLONE_REPLICA.map((r) => [r.f, r.b, r.c, r.r])}
              />
            </div>
          </Section>

          <Section
            id="architecture"
            title="AWS Banking + Shard + DR Architecture"
            lead="CloudFront → API GW → ALB → Spring services → Redis + shard router → per-shard primary/replica → Kafka/CDC. Backups/PITR sit beside replicas — not instead of them."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  NET[Internet] --> CF[CloudFront] --> GW[API Gateway] --> ALB
  ALB --> SVC[Spring Boot Services]
  SVC --> REDIS[(Redis shard map)]
  SVC --> ROUTER[Shard Router]
  ROUTER --> S1P[(Shard-1 Primary)]
  ROUTER --> S2P[(Shard-2 Primary)]
  ROUTER --> S3P[(Shard-3 Primary)]
  S1P --> S1R[(Replica)]
  S2P --> S2R[(Replica)]
  S3P --> S3R[(Replica)]
  S1P --> KAFKA[[Kafka CDC]]
  S2P --> KAFKA
  S3P --> KAFKA
  S1P --> BAK[Snapshots / PITR / Cross-region]`}
              />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Partition monthly RANGE inside each shard. Fail one shard → promote its replica. Region loss →
              cross-region promote + DNS/router flip. Logical DELETE → PITR, never blind promote.
            </p>
          </Section>

          <Section id="decision" title="Decision Tree">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TD
  L[Large table?] -->|Yes| ONE{One DB enough?}
  ONE -->|Yes| PART[Partition]
  ONE -->|No| SH[Shard]
  PART --> PK{Key?}
  PK -->|Time| RANGE
  PK -->|Region| LIST
  PK -->|Even| HASH
  SH --> SK{Strategy?}
  SK -->|Even| HSH[Hash / Consistent]
  SK -->|SaaS| TEN[Tenant directory]
  SK -->|Geo| GEO
  FAIL[DB failure?] --> REP{Clean replica?}
  REP -->|Yes| PROMOTE
  REP -->|No / corruption| PITR`}
              />
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
          </Section>

          <Section
            id="lab"
            title="Runnable Lab"
            lead="Core Java shard routers + Snowflake-style IDs — Hash, Consistent Hash, Range, JUnit 5."
          >
            <CodePanel
              title="Quick start"
              code={`cd db-sharding-lab
mvn test
# HashShardRouter · ConsistentHashShardRouter · SnowflakeId · RangeShardRouter`}
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
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {REMEMBER.map(([n, a]) => (
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
