'use client';

import {useState} from 'react';
import Link from 'next/link';
import {
  AP_DIAGRAM,
  AP_JAVA,
  ARCH_PAYMENT,
  BEFORE_AFTER,
  CAP30,
  CAP_MEANINGS,
  CAP_VS_ACID,
  CP_DIAGRAM,
  CP_JAVA,
  DB_CAVEAT,
  DB_TABLE,
  DOUBLE_SPEND,
  ECOM_AP,
  EVENTUAL_TIMELINE,
  FORK_DIAGRAM,
  INTERVIEW_2MIN,
  MASTER_MEMORY,
  MEMORY_CALLOUT,
  MEMORY_SENTENCE,
  MICROSERVICES,
  PACELC,
  PICK_TWO_FIX,
  QUORUM,
  SIM_JAVA,
  STRONG_VS_EVENTUAL,
  TRAPS,
  VERSION_NOTE,
} from '@/lib/cap-theorem/tutorial';
import {CAP_BANK} from '@/lib/cap-theorem/interview-bank';
import {CAP_TOC} from '@/lib/cap-theorem/toc';
import {SECTIONS_FUND} from '@/lib/cap-theorem/parts-fundamentals';
import {SECTIONS_MODELS} from '@/lib/cap-theorem/parts-models';
import {SECTIONS_SYSTEMS} from '@/lib/cap-theorem/parts-systems';
import {SECTIONS_DESIGN} from '@/lib/cap-theorem/parts-design';
import type {CapSection} from '@/lib/cap-theorem/types';
import StickyToc from './sticky-toc';
import CodePanel from './code-panel';
import PartitionSimulator from './partition-simulator';

const THEORY: CapSection[] = [
  ...SECTIONS_FUND,
  ...SECTIONS_MODELS,
  ...SECTIONS_SYSTEMS,
  ...SECTIONS_DESIGN,
];

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
    <pre className="overflow-x-auto rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
      {children}
    </pre>
  );
}

function Callout({
  title,
  children,
  tone = 'neutral',
}: {
  title: string;
  children: React.ReactNode;
  tone?: 'neutral' | 'warn' | 'tip' | 'memory';
}) {
  const cls =
    tone === 'warn'
      ? 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40'
      : tone === 'tip'
        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40'
        : tone === 'memory'
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50';
  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <p
        className={`text-[11px] font-semibold uppercase tracking-[.14em] ${
          tone === 'memory' ? 'text-slate-300' : 'text-slate-500'
        }`}
      >
        {title}
      </p>
      <div
        className={`mt-2 text-sm leading-7 ${
          tone === 'memory' ? 'text-slate-100' : 'text-slate-700 dark:text-slate-300'
        }`}
      >
        {children}
      </div>
    </div>
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
                  key={i}
                  className={`px-2 py-2 align-top ${
                    i === 0 ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'
                  }`}
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

function InterviewBank() {
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'All'>('All');
  const [open, setOpen] = useState<string | null>(CAP_BANK[0]?.id ?? null);
  const items = level === 'All' ? CAP_BANK : CAP_BANK.filter((q) => q.level === level);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLevel(l)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              level === l
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {items.map((q, idx) => {
          const isOpen = open === q.id;
          return (
            <div
              key={q.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800"
            >
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                onClick={() => setOpen(isOpen ? null : q.id)}
              >
                <span>
                  <span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">
                    {q.level} · Q{idx + 1}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-slate-900 dark:text-white">
                    {q.question}
                  </span>
                </span>
                <span className="text-slate-400">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="space-y-2 border-t border-slate-100 px-4 py-3 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:text-slate-300">
                  <p>
                    <strong>Short:</strong> {q.short}
                  </p>
                  <p>
                    <strong>Why:</strong> {q.why}
                  </p>
                  <p>
                    <strong>Real-world:</strong> {q.example}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CapTheoremHub() {
  const [showTheory, setShowTheory] = useState(false);
  const toc = showTheory
    ? [...CAP_TOC, ...THEORY.map((s) => ({id: s.id, label: `Theory · ${s.title}`}))]
    : CAP_TOC;

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Java / Spring Boot · system design interview
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          CAP Theorem — payment failure story
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Not a triangle first. Two replicas, a network break, and one engineering fork:{' '}
          <strong>correct data</strong> vs <strong>a response</strong>.
        </p>
        <p className="mt-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-3 text-sm text-slate-500">
          {VERSION_NOTE}{' '}
          <Link
            href="/microservice-communication"
            className="font-semibold text-slate-700 hover:underline dark:text-slate-300"
          >
            How services talk
          </Link>
          {' · '}
          <Link
            href="/kafka-interview"
            className="font-semibold text-slate-700 hover:underline dark:text-slate-300"
          >
            Kafka
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[220px_minmax(0,1fr)]">
        <StickyToc items={toc} />
        <div className="min-w-0 space-y-14">
          <Section id="cap30" title="01. CAP in 30 seconds" lead={CAP30}>
            <Callout title="Remember this" tone="memory">
              <p className="font-semibold">{MEMORY_CALLOUT.title}</p>
              <p className="mt-2">{MEMORY_CALLOUT.cp}</p>
              <p className="mt-1">{MEMORY_CALLOUT.ap}</p>
            </Callout>
            <Pre>{FORK_DIAGRAM}</Pre>
          </Section>

          <Section
            id="story"
            title="02. You are building a payment system..."
            lead="Both nodes hold payment/account data. Data is replicated. You want correct data, always respond, and survive network failures. Can you guarantee all three?"
          >
            <Pre>{ARCH_PAYMENT}</Pre>
            <Callout title="Do not answer yet" tone="tip">
              Hold the question. First watch what a partition actually looks like.
            </Callout>
          </Section>

          <Section
            id="replicas"
            title="03. Two database replicas"
            lead="Bangalore Node A and Mumbai Node B start in sync."
          >
            <Pre>{BEFORE_AFTER.healthy}</Pre>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              Customer withdraws ₹800 — both nodes update:
            </p>
            <Pre>{BEFORE_AFTER.afterWithdraw}</Pre>
          </Section>

          <Section
            id="partition"
            title="04. Network partition happens"
            lead="Servers are alive. The network between them is broken. That cut is the important moment in CAP."
          >
            <Pre>{BEFORE_AFTER.partitioned}</Pre>
            <Callout title="Production language" tone="warn">
              Partition ≠ node death. DB A is up. DB B is up. They simply cannot communicate.
            </Callout>
          </Section>

          <Section
            id="cp"
            title="05. Decision #1 → CP (be correct)"
            lead="GET /account/balance hits Node A. A cannot confirm the latest state with B."
          >
            <Pre>{CP_DIAGRAM}</Pre>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              System returns <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">503 Service Unavailable</code>{' '}
              — or waits — rather than guess. Use when overspend / wrong money / unique seat is unacceptable.
              Do <em>not</em> claim every bank or every RDBMS is automatically CP.
            </p>
          </Section>

          <Section
            id="ap"
            title="06. Decision #2 → AP (stay available)"
            lead="POST /payment hits Node A during the cut. Instead of rejecting, A accepts locally."
          >
            <Pre>{AP_DIAGRAM}</Pre>
            <Callout title="Eventual consistency" tone="tip">
              The system remains available now and becomes consistent later — after the link heals and
              replication / repair runs.
            </Callout>
            <MiniTable headers={['Time', 'What happens']} rows={EVENTUAL_TIMELINE} />
          </Section>

          <Section
            id="meanings"
            title="07. What C / A / P actually mean"
            lead="Production questions — not academic glossary first."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {CAP_MEANINGS.map((m) => (
                <div
                  key={m.letter}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{m.letter}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{m.title}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
                    <strong>Ask:</strong> {m.ask}
                  </p>
                  <p className="mt-2 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                    {m.memory}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{m.note}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="pick-two"
            title="08. Why “pick any two” is misleading"
            lead="In a real distributed system, network partitions must be tolerated. The practical CAP decision during a partition is usually CP vs AP."
          >
            <Pre>{PICK_TWO_FIX}</Pre>
          </Section>

          <Section
            id="spring"
            title="09. Java / Spring Boot implementation"
            lead="Simplified teaching code — not a production payment protocol. See the CAP decision in the if."
          >
            <CodePanel title="CP — reject when replication unavailable" code={CP_JAVA} language="java" />
            <CodePanel title="AP — local accept + event" code={AP_JAVA} language="java" />
            <CodePanel title="In-memory failure sketch" code={SIM_JAVA} language="java" />
          </Section>

          <Section
            id="simulator"
            title="10. Interactive partition simulator"
            lead="Click Break network → choose CP or AP → Withdraw ₹800 on Node A. This matters more than another triangle."
          >
            <PartitionSimulator />
          </Section>

          <Section
            id="double-spend"
            title="11. Payment double-spend example"
            lead="If both sides accept the same cash withdraw during a partition, money invents itself."
          >
            <Pre>{DOUBLE_SPEND}</Pre>
            <Callout title="Production decision">
              Individual operations may need different consistency — ledger debit ≠ statement email.
            </Callout>
          </Section>

          <Section
            id="ecommerce"
            title="12. E-commerce inventory (AP-leaning)"
            lead="Availability can matter more than instant stock agreement — with explicit conflict handling later."
          >
            <Pre>{ECOM_AP}</Pre>
          </Section>

          <Section
            id="databases"
            title="13. Database examples — be precise"
            lead="Typical discussion labels only. Configuration decides the real guarantee."
          >
            <MiniTable headers={DB_TABLE.headers} rows={DB_TABLE.rows} />
            <Callout title="Important" tone="warn">
              {DB_CAVEAT}
            </Callout>
          </Section>

          <Section id="acid" title="14. CAP vs ACID" lead="Common interview trap — same word, different contracts.">
            <Pre>{CAP_VS_ACID}</Pre>
          </Section>

          <Section
            id="eventual"
            title="15. CAP vs eventual consistency"
            lead="Strong path vs local accept + heal."
          >
            <Pre>{STRONG_VS_EVENTUAL}</Pre>
          </Section>

          <Section
            id="quorum"
            title="16. Quorum (after the basics)"
            lead="W + R > N helps reads observe latest writes — it does not repeal CAP."
          >
            <Pre>{QUORUM}</Pre>
          </Section>

          <Section
            id="microservices"
            title="17. CAP in microservices"
            lead="Architecture style is not a CAP stamp."
          >
            <Pre>{MICROSERVICES}</Pre>
          </Section>

          <Section
            id="pacelc"
            title="18. PACELC (after CAP)"
            lead="Only after the partition fork is clear: what do you trade when healthy?"
          >
            <Pre>{PACELC}</Pre>
          </Section>

          <Section
            id="spoken"
            title="19. Explain CAP in an interview (2 minutes)"
            lead="Sound like a senior Java engineer — start with Bangalore / Mumbai replicas."
          >
            <Callout title="Say this" tone="memory">
              <p className="whitespace-pre-wrap leading-7">{INTERVIEW_2MIN}</p>
            </Callout>
          </Section>

          <Section
            id="questions"
            title="20. Interview questions"
            lead="Question → short answer → why → real-world example."
          >
            <InterviewBank />
          </Section>

          <Section id="traps" title="21. Interview traps — don’t say this">
            <div className="space-y-3">
              {TRAPS.map((t) => (
                <div
                  key={t.wrong}
                  className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30"
                >
                  <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">❌ {t.wrong}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
                    ✅ {t.right}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="memory" title="22. Final memory diagram" lead="The only picture you need under pressure.">
            <Pre>{MASTER_MEMORY}</Pre>
            <Callout title="Success criterion" tone="tip">
              You should visualize the network failure and explain the engineering decision — not recite a
              triangle.
            </Callout>
          </Section>

          <Section
            id="theory-extra"
            title="Optional theory encyclopedia"
            lead="Only if the interviewer wants Gilbert/Lynch depth. Prefer the story above for recall."
          >
            <button
              type="button"
              onClick={() => setShowTheory((v) => !v)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              {showTheory ? 'Hide theory cards' : 'Show theory cards'}
            </button>
            {showTheory && (
              <div className="mt-6 space-y-10">
                {THEORY.map((s) => (
                  <div key={s.id} id={s.id} className="scroll-mt-28 space-y-3">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{s.title}</h3>
                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                      <strong>Architect take:</strong> {s.oneLiner}
                    </p>
                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                      <strong>Say:</strong> {s.interviewAnswer}
                    </p>
                    {s.example && <CodePanel title="Diagram" code={s.example} />}
                    <p className="text-sm text-rose-700 dark:text-rose-300">
                      <strong>Trap:</strong> {s.trap}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
