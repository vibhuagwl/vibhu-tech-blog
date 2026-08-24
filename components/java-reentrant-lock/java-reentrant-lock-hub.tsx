'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import CodePanel from '@/components/hub-code-panel';
import type {ConceptBlock} from '@/lib/java-reentrant-lock/types';
import {RL_TOC} from '@/lib/java-reentrant-lock/toc';
import {
  MENTAL_MODEL,
  OVERVIEW_HOOKS,
  PROGRESSION,
  RACE_CONCEPT,
  REENTRANCY_CONCEPT,
  SYNC_VS_RL,
  SYNC_VS_RL_TABLE,
} from '@/lib/java-reentrant-lock/fundamentals';
import {
  AQS_CONCEPT,
  FAIR_CONCEPT,
  INTERRUPT_CONCEPT,
  TRYLOCK_CONCEPT,
  UNLOCK_PATTERN,
} from '@/lib/java-reentrant-lock/aqs';
import {AWAIT_CONCEPT, CONDITION_CONCEPT, SPURIOUS_CONCEPT} from '@/lib/java-reentrant-lock/condition';
import {
  DOWNGRADE_CONCEPT,
  LOCK_COMPARISON,
  LOCK_SCENARIOS,
  RW_CONCEPT,
  RW_MATRIX,
  RW_REENTRANCY,
  STAMPED_CONCEPT,
  STARVATION_CONCEPT,
  UPGRADE_CONCEPT,
} from '@/lib/java-reentrant-lock/read-write';
import {
  ATOMICS_CONCEPT,
  CONTENTION,
  DB_CONCEPT,
  DEADLOCK_CONDITIONS,
  DEADLOCK_DUMP,
  GRANULARITY,
  POOL_STARVATION,
  TRADING_MAP,
  TRANSFER_CONCEPT,
  TX_SPRING,
} from '@/lib/java-reentrant-lock/production';
import {ANTI_PATTERNS, INCIDENTS} from '@/lib/java-reentrant-lock/production-drills';
import {
  DEBUG_QUESTIONS,
  DECISION_TREE,
  FINANCE_USE_CASES,
  MUST_UNDERSTAND,
  NEVER_DO,
  ONE_PAGE,
  PITCH_2MIN,
  REVISION_30,
  SENIOR_STATEMENTS,
} from '@/lib/java-reentrant-lock/revision';
import StickyToc from './sticky-toc';
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

function Pre({children}: {children: string}) {
  return (
    <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[13px] leading-6 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
      {children}
    </pre>
  );
}

function Hook({text}: {text: string}) {
  return (
    <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      Memory hook: {text}
    </p>
  );
}

function ConceptCard({c}: {c: ConceptBlock}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500">Why it exists</div>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{c.why}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500">Analogy</div>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{c.analogy}</p>
        </div>
      </div>
      <Pre>{c.flow}</Pre>
      {c.code && <CodePanel title="Java" code={c.code} language="java" />}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <Mermaid chart={c.diagram} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:text-slate-300">
          <strong className="text-slate-900 dark:text-white">Finance:</strong> {c.finance}
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
          <strong>Failure:</strong> {c.failure}
        </div>
        <div className="rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:text-slate-300">
          <strong className="text-slate-900 dark:text-white">Debug:</strong> {c.debug}
        </div>
        <div className="rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:text-slate-300">
          <strong className="text-slate-900 dark:text-white">When not:</strong> {c.whenNot}
        </div>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        <strong>Interview:</strong> {c.interviewQ}
      </p>
      <Hook text={c.hook} />
    </div>
  );
}

export default function JavaReentrantLockHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Principal · FinTech · Implementation · Interview
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          ReentrantLock &amp; ReadWriteLock
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Problem-first concurrency for financial systems — fairness, reentrancy, tryLock, Conditions, upgrade traps,
          starvation, AQS, and when a Java lock is not enough.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Broad catalog:{' '}
          <Link href="/java-locking" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            JVM Locking
          </Link>
          {' · '}
          <Link href="/java-concurrency" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Java Concurrency
          </Link>
          {' · '}
          <Link href="/distributed-locking" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Distributed Locking
          </Link>
          .
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={RL_TOC} />

        <div className="min-w-0 space-y-16">
          <Section
            id="overview"
            title="Overview — the progression that matters"
            lead="Do not memorize APIs in isolation. Climb this ladder when the problem demands it."
          >
            <Pre>{PROGRESSION}</Pre>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              {OVERVIEW_HOOKS.map((h) => (
                <li key={h}>• {h}</li>
              ))}
            </ul>
          </Section>

          <Section id="race" title="1. Why locking exists" lead="Correctness first — invented money is not a latency bug.">
            <ConceptCard c={RACE_CONCEPT} />
          </Section>

          <Section id="mental-model" title="2. Locking mental model">
            <Pre>{MENTAL_MODEL}</Pre>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              synchronized and ReentrantLock both give exclusive mutual exclusion. ReadWriteLock splits shared vs
              exclusive. StampedLock adds optimistic reads on top of read/write modes. All of these are one-JVM tools.
            </p>
          </Section>

          <Section id="reentrancy" title="3. What reentrant means">
            <ConceptCard c={REENTRANCY_CONCEPT} />
          </Section>

          <Section id="sync-vs-rl" title="4. synchronized vs ReentrantLock" lead="Trade-offs — not slogans.">
            <MiniTable headers={SYNC_VS_RL_TABLE[0]} rows={SYNC_VS_RL_TABLE.slice(1)} />
            <div className="mt-6 space-y-2">
              {SYNC_VS_RL.map((r) => (
                <div key={r.requirement} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <span className="font-semibold text-slate-900 dark:text-white">{r.requirement}</span>
                  <span className="text-slate-500"> → </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{r.choose}</span>
                  <span className="text-slate-600 dark:text-slate-300"> — {r.why}</span>
                </div>
              ))}
            </div>
            <Hook text="Need control APIs → ReentrantLock. Otherwise prefer synchronized." />
          </Section>

          <Section id="aqs" title="5. AQS — internal behavior">
            <ConceptCard c={AQS_CONCEPT} />
          </Section>

          <Section id="fair" title="6. Fair vs non-fair">
            <ConceptCard c={FAIR_CONCEPT} />
          </Section>

          <Section id="trylock" title="7. tryLock()">
            <ConceptCard c={TRYLOCK_CONCEPT} />
          </Section>

          <Section id="interrupt" title="8. lockInterruptibly()">
            <ConceptCard c={INTERRUPT_CONCEPT} />
          </Section>

          <Section id="unlock" title="9. Correct unlock pattern">
            <ConceptCard c={UNLOCK_PATTERN} />
          </Section>

          <Section id="condition" title="10. ReentrantLock + Condition">
            <ConceptCard c={CONDITION_CONCEPT} />
          </Section>

          <Section id="await" title="11. await / signal internals">
            <ConceptCard c={AWAIT_CONCEPT} />
          </Section>

          <Section id="spurious" title="12. Spurious wakeups">
            <ConceptCard c={SPURIOUS_CONCEPT} />
          </Section>

          <Section id="rw" title="13. ReentrantReadWriteLock">
            <ConceptCard c={RW_CONCEPT} />
          </Section>

          <Section id="rw-rules" title="14–15. Read / write rules">
            <MiniTable headers={RW_MATRIX[0]} rows={RW_MATRIX.slice(1)} />
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Readers share. Any writer excludes all readers and other writers. Writer + writer never concurrent.
            </p>
            <Hook text="Many readers OR one writer — never both modes mixed." />
          </Section>

          <Section id="rw-reentrancy" title="16. Reentrancy in ReadWriteLock">
            <Pre>{RW_REENTRANCY}</Pre>
            <Hook text="Match unlocks to acquires — read and write hold counts are separate." />
          </Section>

          <Section id="upgrade" title="17. Read → write upgrade">
            <ConceptCard c={UPGRADE_CONCEPT} />
          </Section>

          <Section id="downgrade" title="18. Write → read downgrade">
            <ConceptCard c={DOWNGRADE_CONCEPT} />
          </Section>

          <Section id="starvation" title="19–20. Fairness & writer starvation">
            <ConceptCard c={STARVATION_CONCEPT} />
          </Section>

          <Section id="compare" title="21. Lock comparison">
            <MiniTable headers={LOCK_COMPARISON[0]} rows={LOCK_COMPARISON.slice(1)} />
          </Section>

          <Section id="stamped" title="22. StampedLock">
            <ConceptCard c={STAMPED_CONCEPT} />
          </Section>

          <Section id="scenarios" title="23. Scenario choices">
            <div className="space-y-3">
              {LOCK_SCENARIOS.map((s) => (
                <div key={s.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">{s.name}</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{s.situation}</p>
                  <p className="mt-2 text-sm">
                    <strong>Choose:</strong> {s.choose}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{s.why}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="atomics" title="24. Lock vs atomics">
            <ConceptCard c={ATOMICS_CONCEPT} />
          </Section>

          <Section id="db" title="25. Java vs DB vs distributed">
            <ConceptCard c={DB_CONCEPT} />
          </Section>

          <Section id="transfer" title="26. Financial transfer example">
            <ConceptCard c={TRANSFER_CONCEPT} />
          </Section>

          <Section id="trading" title="27. Trading-system mapping">
            <div className="space-y-3">
              {TRADING_MAP.map((t) => (
                <div key={t.data} className="rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-800">
                  <div className="font-semibold text-slate-900 dark:text-white">{t.data}</div>
                  <div className="mt-1 text-slate-700 dark:text-slate-200">
                    <strong>Tool:</strong> {t.tool}
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">{t.why}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="deadlock" title="28. Deadlock detection">
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {DEADLOCK_CONDITIONS.map((c) => (
                <li key={c}>• {c}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Tools: jstack, JConsole, Java Flight Recorder, ThreadMXBean.findDeadlockedThreads().
            </p>
            <Pre>{DEADLOCK_DUMP}</Pre>
            <Hook text="Break circular wait — ordered locks or one authority." />
          </Section>

          <Section id="contention" title="29–31. Contention, granularity, striping">
            <Pre>{CONTENTION}</Pre>
            <Pre>{GRANULARITY}</Pre>
            <Hook text="Fine locks raise concurrency and deadlock risk; striping is a middle ground." />
          </Section>

          <Section id="pool" title="32–34. Executor pools & I/O under lock">
            <ConceptCard c={POOL_STARVATION} />
          </Section>

          <Section id="spring" title="35–36. Transactions & Spring">
            <ConceptCard c={TX_SPRING} />
          </Section>

          <Section id="antipatterns" title="37. ReentrantLock anti-patterns (20)">
            <div className="space-y-3">
              {ANTI_PATTERNS.map((a, i) => (
                <div key={a.id} className="rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {i + 1}. {a.title}
                  </div>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">
                    <strong>Why:</strong> {a.why}
                  </p>
                  <p className="text-rose-700 dark:text-rose-300">
                    <strong>Impact:</strong> {a.impact}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>Detect:</strong> {a.detect}
                  </p>
                  <p className="text-slate-700 dark:text-slate-200">
                    <strong>Better:</strong> {a.better}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="incidents" title="38. Production incident drills">
            <div className="space-y-4">
              {INCIDENTS.map((inc) => (
                <div key={inc.id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{inc.title}</h3>
                  <Pre>{inc.signals}</Pre>
                  <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{inc.question}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{inc.answer}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    <strong>Fix:</strong> {inc.fix}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="interview" title="39. Interview bank" lead="Scenario-based — reveal strong answers after you reason.">
            <InterviewMode />
          </Section>

          <Section id="decision" title="41. Decision tree">
            <Pre>{DECISION_TREE}</Pre>
          </Section>

          <Section id="onepager" title="42. One-page mental model">
            <Pre>{ONE_PAGE}</Pre>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">10 things to understand</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  {MUST_UNDERSTAND.map((x) => (
                    <li key={x}>• {x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">10 things never to do</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  {NEVER_DO.map((x) => (
                    <li key={x}>• {x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">10 debug questions</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  {DEBUG_QUESTIONS.map((x) => (
                    <li key={x}>• {x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">10 senior statements</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  {SENIOR_STATEMENTS.map((x) => (
                    <li key={x}>• {x}</li>
                  ))}
                </ul>
              </div>
            </div>
            <h3 className="mt-6 font-bold text-slate-900 dark:text-white">10 financial use cases</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
              {FINANCE_USE_CASES.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </Section>

          <Section id="revision" title="43. 30-minute revision">
            <div className="space-y-2">
              {REVISION_30.map((r) => (
                <div key={r.mins} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <span className="font-semibold text-slate-900 dark:text-white">{r.mins}</span>
                  <span className="text-slate-500"> · </span>
                  <span className="font-semibold">{r.topic}</span>
                  <span className="text-slate-600 dark:text-slate-300"> — {r.focus}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section id="pitch" title="44. 2-minute senior explanation">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              {PITCH_2MIN.split('\n\n').map((para) => (
                <p key={para.slice(0, 40)} className="mt-3 first:mt-0">
                  {para}
                </p>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
