'use client';

import {useState} from 'react';
import Link from 'next/link';
import {EXECUTOR_TOC, MEMORY_SENTENCE, TWO_MIN, VERSION_NOTE} from '@/lib/java-executor/toc';
import {
  MEMORY_HOOKS_INTRO,
  MENTAL_MODEL,
  SHUTDOWN_DIAGRAM,
  SUBMIT_INTERNALS,
  THREAD_LIFECYCLE,
  TYPE_MAP,
  WHY_EXECUTOR,
  WORKER_LIFECYCLE,
} from '@/lib/java-executor/overview';
import {
  CALLER_RUNS_TRAP,
  CONCRETE_WALK,
  EXECUTE_TREE,
  FACTORIES,
  QUEUE_TABLE,
  REJECTION_POLICIES,
  TPE_PARAMS,
  UNBOUNDED_DANGER,
} from '@/lib/java-executor/thread-pool';
import {
  AFTER_EXECUTE,
  CF_NOTES,
  EXECUTE_VS_SUBMIT,
  FUTURE_FLOW,
  PAYMENT_EXCEPTION_FLOW,
  RUNNABLE_VS_CALLABLE,
  SCHEDULED,
  THREAD_FACTORY_CODE,
} from '@/lib/java-executor/futures';
import {
  ASYNC_SPRING,
  BULKHEAD,
  CPU_IO,
  DEADLOCK_NESTED,
  FJP,
  FULL_ARCH,
  INCIDENTS,
  KAFKA_EXECUTOR,
  MONITORING,
  PAYMENT_DESIGN,
  POOL_INTERACT,
  SHUTDOWN_PAYMENTS,
  THREADLOCAL_TRAP,
  TX_ASYNC,
  VIRTUAL_THREADS,
} from '@/lib/java-executor/production';
import {
  ANTIPATTERNS,
  CHEAT_ASCII,
  MEMORY_HOOKS,
  REVISION_30,
  TEN_DEBUG_QS,
  TEN_MISTAKES,
  TEN_RULES,
  TEN_SENIOR_LINES,
} from '@/lib/java-executor/antipatterns';
import {INTERVIEW_BANK} from '@/lib/java-executor/interview';
import {BROKEN_EXAMPLES} from '@/lib/java-executor/broken-code';
import {
  BATCH_CODE,
  BATCH_SCENARIO,
  EXTERNAL_API_CODE,
  EXTERNAL_API_SCENARIO,
  KAFKA_FLOW,
  KAFKA_SPRING_CODE,
  PAYMENT_COMPLETE_CODE,
  PAYMENT_SLOW_PATHS,
  QUEUE_SIZE_EXPERIMENT,
  REPORT_BULKHEAD_CODE,
} from '@/lib/java-executor/scenarios-deep';
import {
  ANSWERS_60S,
  BACKPRESSURE_SECTION,
  CANCEL_CODE,
  CANCEL_DEEP,
  CF_PIPELINE,
  CTL_STATES,
  DEBUG_SCENARIO_WALK,
  DECISION_INCREASE_POOL,
  DECISION_WORKLOAD,
  EXCEPTION_MATRIX,
  EXCEPTION_TYPES,
  FIVE_MIN_REVISION,
  INTERVIEW_TRAPS,
  MDC_PROPAGATION,
  MICROMETER_SNIPPET,
  REJECTION_LAB_CODE,
  REJECTION_LABS,
  TOP10_DESIGN,
  TOP20_CODE,
  TOP20_PROD,
  TOP20_TRAPS,
} from '@/lib/java-executor/interview-depth';
import StickyToc from './sticky-toc';
import CodePanel from '@/components/hub-code-panel-compact';

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

function Callout({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <div className="rounded-2xl border border-slate-900 bg-slate-900 p-4 text-white">
      <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-300">{title}</p>
      <div className="mt-2 text-sm leading-7 text-slate-100">{children}</div>
    </div>
  );
}

function Trap({children}: {children: React.ReactNode}) {
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-7 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
      <p className="text-[11px] font-semibold uppercase tracking-[.14em]">Interview trap</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Rule({children}: {children: React.ReactNode}) {
  return (
    <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm leading-7 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
      <p className="text-[11px] font-semibold uppercase tracking-[.14em]">Production rule</p>
      <div className="mt-2">{children}</div>
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

function InterviewBrowser() {
  const levels = ['Beginner', 'Intermediate', 'Senior', 'Principal'] as const;
  const [level, setLevel] = useState<(typeof levels)[number] | 'All'>('Senior');
  const items = level === 'All' ? INTERVIEW_BANK : INTERVIEW_BANK.filter((q) => q.level === level);
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(['All', ...levels] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => {
              setLevel(l);
              const next = l === 'All' ? INTERVIEW_BANK : INTERVIEW_BANK.filter((q) => q.level === l);
              setOpen(next[0]?.id ?? null);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              level === l ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      {items.map((q) => {
        const isOpen = open === q.id;
        return (
          <div key={q.id} className="rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
              onClick={() => setOpen(isOpen ? null : q.id)}
            >
              <span>
                <span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">
                  {q.level} · {q.id}
                </span>
                <span className="mt-1 block text-sm font-semibold text-slate-900 dark:text-white">{q.question}</span>
              </span>
              <span className="text-slate-400">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div className="space-y-2 border-t border-slate-100 px-4 py-3 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:text-slate-300">
                <p>
                  <strong>Thought process:</strong> {q.thought}
                </p>
                <p>
                  <strong>Strong answer:</strong> {q.strong}
                </p>
                <p className="text-rose-700 dark:text-rose-300">
                  <strong>Wrong:</strong> {q.wrong}
                </p>
                <p>
                  <strong>Follow-up:</strong> {q.followUp}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function IncidentDrill() {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const s = INCIDENTS[i % INCIDENTS.length];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">
        Incident {i + 1} / {INCIDENTS.length}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{s.title}</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Clue: {s.clue}</p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setShow(true)}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
        >
          Reveal reasoning
        </button>
        <button
          type="button"
          onClick={() => {
            setI((x) => x + 1);
            setShow(false);
          }}
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          Next
        </button>
      </div>
      {show && <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-300">{s.answer}</p>}
    </div>
  );
}

function BrokenBrowser() {
  const [open, setOpen] = useState<string | null>(BROKEN_EXAMPLES[0]?.id ?? null);
  return (
    <div className="space-y-3">
      {BROKEN_EXAMPLES.map((ex, idx) => {
        const isOpen = open === ex.id;
        return (
          <div key={ex.id} className="rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
              onClick={() => setOpen(isOpen ? null : ex.id)}
            >
              <span>
                <span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">
                  Broken {idx + 1} · {ex.id}
                </span>
                <span className="mt-1 block text-sm font-semibold text-slate-900 dark:text-white">{ex.title}</span>
              </span>
              <span className="text-slate-400">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div className="space-y-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">What is wrong? {ex.ask}</p>
                <CodePanel title="Bad code" code={ex.bad} language="java" />
                <Pre>{ex.runtime}</Pre>
                <CodePanel title="Fixed code" code={ex.fix} language="java" />
                <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">
                  <strong>Why the fix works:</strong> {ex.why}
                </p>
                <Callout title="Remember">{ex.hook}</Callout>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function JavaExecutorHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Java concurrency · FinTech / payments · Staff–Principal interview
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Java Executor Framework — production playbook
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Problem → broken code → runtime → fix → internals → interview answer. Built around{' '}
          <strong>core → queue → max → reject</strong> for payment platforms.
        </p>
        <p className="mt-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-3 text-sm text-slate-500">
          {VERSION_NOTE}{' '}
          <Link href="/java-concurrency" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Java Concurrency
          </Link>
          {' · '}
          <Link href="/java-locking" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Locking
          </Link>
          {' · '}
          <Link href="/java-reentrant-lock" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            ReentrantLock
          </Link>
          {' · '}
          <Link href="/kafka-dlq" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Kafka DLQ
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[240px_minmax(0,1fr)]">
        <StickyToc items={EXECUTOR_TOC} />
        <div className="min-w-0 space-y-14">
          <Section id="big-picture" title="01. Big picture" lead="Why the framework exists — stop raw Thread storms.">
            <Pre>{WHY_EXECUTOR}</Pre>
            <Pre>{MENTAL_MODEL}</Pre>
            <MiniTable headers={['Type', 'Role']} rows={TYPE_MAP} />
            <MiniTable headers={['Hook', 'Line']} rows={MEMORY_HOOKS_INTRO} />
          </Section>

          <Section id="submit-internals" title="02. What submit() does internally" lead="Every step from call site to worker.">
            <Pre>{SUBMIT_INTERNALS}</Pre>
            <Trap>submit() does not throw task failures to the caller — they wait inside the Future until get().</Trap>
          </Section>

          <Section id="lifecycle" title="03. Thread lifecycle vs pool worker" lead="Platform Thread.State ≠ worker reuse story.">
            <Pre>{THREAD_LIFECYCLE}</Pre>
            <Pre>{WORKER_LIFECYCLE}</Pre>
            <Pre>{SHUTDOWN_DIAGRAM}</Pre>
          </Section>

          <Section id="tpe-params" title="04. ThreadPoolExecutor parameters" lead="Every constructor knob with FinTech consequences.">
            <div className="space-y-3">
              {TPE_PARAMS.map((p) => (
                <div
                  key={p.name}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-7 dark:border-slate-800 dark:bg-slate-950"
                >
                  <p className="font-mono text-base font-bold text-slate-900 dark:text-white">{p.name}</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    <strong>Controls:</strong> {p.controls}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>Why:</strong> {p.why}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>Too small / large:</strong> {p.tooSmall} / {p.tooLarge}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>Production:</strong> {p.production}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>FinTech:</strong> {p.fintech}
                  </p>
                  <p className="mt-1 text-slate-500">
                    <strong>Interview:</strong> {p.interviewQ}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="algorithm" title="05. execute() decision tree" lead="The most misunderstood algorithm in j.u.c.">
            <Pre>{EXECUTE_TREE}</Pre>
            <Callout title="Concrete walk — core=5 max=10 queue=100">{CONCRETE_WALK}</Callout>
            <Rule>Max threads are created ONLY after the queue refuses the task.</Rule>
          </Section>

          <Section id="queue-experiment" title="05b. Queue size experiment" lead="Same pool, different buffers — different production outcomes.">
            <Pre>{QUEUE_SIZE_EXPERIMENT}</Pre>
          </Section>

          <Section id="queues" title="06. BlockingQueue deep dive" lead="Queue choice is a production decision.">
            <MiniTable headers={['Queue', 'Behavior', 'Use']} rows={QUEUE_TABLE} />
            <Pre>{UNBOUNDED_DANGER}</Pre>
          </Section>

          <Section id="factories" title="07. Executors factories — hidden risks" lead="Seniors prefer explicit ThreadPoolExecutor.">
            <div className="space-y-3">
              {FACTORIES.map((f) => (
                <div
                  key={f.name}
                  className="rounded-2xl border border-slate-200 p-4 text-sm leading-7 dark:border-slate-800"
                >
                  <p className="font-mono font-bold text-slate-900 dark:text-white">{f.name}</p>
                  <p>
                    <strong>Impl:</strong> {f.impl} · <strong>Queue:</strong> {f.queue}
                  </p>
                  <p>
                    <strong>Threads:</strong> {f.threads}
                  </p>
                  <p className="text-rose-700 dark:text-rose-300">
                    <strong>Risk:</strong> {f.risk}
                  </p>
                  <p>
                    <strong>OK:</strong> {f.whenOk} · <strong>Not:</strong> {f.whenNot}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="callable" title="08. Runnable · Callable · Future">
            <Pre>{RUNNABLE_VS_CALLABLE}</Pre>
            <Pre>{FUTURE_FLOW}</Pre>
          </Section>

          <Section id="exceptions" title="09. Exception handling" lead="Silent failures lose money.">
            <Pre>{EXECUTE_VS_SUBMIT}</Pre>
            <Pre>{PAYMENT_EXCEPTION_FLOW}</Pre>
            <CodePanel title="afterExecute logging" code={AFTER_EXECUTE} language="java" />
          </Section>

          <Section id="exception-matrix" title="09b. Exception handling matrix">
            <MiniTable headers={EXCEPTION_MATRIX[0]} rows={EXCEPTION_MATRIX.slice(1)} />
            <Pre>{EXCEPTION_TYPES}</Pre>
          </Section>

          <Section id="thread-factory" title="10. ThreadFactory">
            <CodePanel title="Named payment workers" code={THREAD_FACTORY_CODE} language="java" />
          </Section>

          <Section id="rejection" title="11. RejectedExecutionHandler" lead="Saturated pool — what now?">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    {['Policy', 'Behavior', 'Payments', 'Trading', 'Reports', 'Notify', 'Audit', 'Batch'].map((h) => (
                      <th key={h} className="px-2 py-2 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REJECTION_POLICIES.map((p) => (
                    <tr key={p.name} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-2 py-2 font-semibold">{p.name}</td>
                      <td className="px-2 py-2">{p.behavior}</td>
                      <td className="px-2 py-2">{p.payments}</td>
                      <td className="px-2 py-2">{p.trading}</td>
                      <td className="px-2 py-2">{p.reports}</td>
                      <td className="px-2 py-2">{p.notify}</td>
                      <td className="px-2 py-2">{p.audit}</td>
                      <td className="px-2 py-2">{p.batch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pre>{CALLER_RUNS_TRAP}</Pre>
          </Section>

          <Section id="rejection-labs" title="11b. Rejection policy labs" lead="Feel each policy with a tiny pool.">
            <Pre>{REJECTION_LABS}</Pre>
            <CodePanel title="Rejection demo harness" code={REJECTION_LAB_CODE} language="java" />
          </Section>

          <Section id="payment-design" title="12. Payment pool design" lead="Numbers with reasons — not vanity TPS.">
            <Pre>{PAYMENT_DESIGN}</Pre>
            <Pre>{PAYMENT_SLOW_PATHS}</Pre>
          </Section>

          <Section id="payment-code" title="12b. Complete payment executor code">
            <CodePanel title="PaymentExecutorFactory + authorize" code={PAYMENT_COMPLETE_CODE} language="java" />
          </Section>

          <Section id="cpu-io" title="13. CPU-bound vs I/O-bound">
            <Pre>{CPU_IO}</Pre>
            <Trap>&quot;CPU cores × 2&quot; is not a universal rule — it collapses when DB/HTTP dominate.</Trap>
          </Section>

          <Section id="pools-interact" title="14. Thread pool vs DB / HTTP pools">
            <Pre>{POOL_INTERACT}</Pre>
            <Rule>The smallest pool on the path is the real concurrency limit.</Rule>
          </Section>

          <Section id="deadlock" title="15. Deadlock & pool starvation">
            <Pre>{DEADLOCK_NESTED}</Pre>
          </Section>

          <Section id="nested" title="16. Nested tasks" lead="Same diagram — redesign before enlarging the pool.">
            <Callout title="Remember">Separate executor · compose with CF · or run inline. Do not hope max helps.</Callout>
          </Section>

          <Section id="cancel" title="16b. Future cancellation" lead="cancel(true) is cooperative, not a kill switch.">
            <Pre>{CANCEL_DEEP}</Pre>
            <CodePanel title="Interrupt-aware Callable" code={CANCEL_CODE} language="java" />
          </Section>

          <Section id="cf" title="17. CompletableFuture + Executor">
            <Pre>{CF_NOTES}</Pre>
          </Section>

          <Section id="cf-pipeline" title="17b. CF customer / account / transactions pipeline">
            <CodePanel title="Sequential vs parallel fan-out" code={CF_PIPELINE} language="java" />
          </Section>

          <Section id="scheduled" title="18. ScheduledExecutorService">
            <Pre>{SCHEDULED}</Pre>
          </Section>

          <Section id="ctl-states" title="18b. ThreadPoolExecutor run states">
            <Pre>{CTL_STATES}</Pre>
          </Section>

          <Section id="shutdown" title="19. Graceful shutdown" lead="Deploys must not double-charge.">
            <Pre>{SHUTDOWN_PAYMENTS}</Pre>
          </Section>

          <Section id="monitoring" title="20. Monitoring">
            <Pre>{MONITORING}</Pre>
            <CodePanel title="Micrometer / Spring sketch" code={MICROMETER_SNIPPET} language="java" />
          </Section>

          <Section id="debug-walk" title="20b. Production debug walkthrough" lead="Latency up, CPU low — reason before scaling.">
            <Pre>{DEBUG_SCENARIO_WALK}</Pre>
          </Section>

          <Section id="incidents" title="21. Production incidents" lead="Reason before revealing.">
            <IncidentDrill />
          </Section>

          <Section id="corner" title="22. Corner cases · ThreadLocal">
            <Pre>{THREADLOCAL_TRAP}</Pre>
          </Section>

          <Section id="mdc" title="22b. MDC / context propagation" lead="traceId must survive the hop to a worker.">
            <Pre>{MDC_PROPAGATION}</Pre>
          </Section>

          <Section id="virtual" title="23. Virtual threads">
            <Pre>{VIRTUAL_THREADS}</Pre>
            <Trap>100,000 virtual threads still share 20 DB connections — VT do not invent capacity.</Trap>
          </Section>

          <Section id="fjp" title="24. ForkJoinPool">
            <Pre>{FJP}</Pre>
          </Section>

          <Section id="kafka" title="25. Kafka + ExecutorService">
            <Pre>{KAFKA_EXECUTOR}</Pre>
            <Pre>{KAFKA_FLOW}</Pre>
            <CodePanel title="Spring Kafka handoff cautions" code={KAFKA_SPRING_CODE} language="java" />
          </Section>

          <Section id="external-api" title="25b. External API orchestration" lead="One slow dependency must not freeze the order path.">
            <Pre>{EXTERNAL_API_SCENARIO}</Pre>
            <CodePanel title="CF with timeouts per dependency" code={EXTERNAL_API_CODE} language="java" />
          </Section>

          <Section id="batch" title="25c. Batch processing">
            <Pre>{BATCH_SCENARIO}</Pre>
            <CodePanel title="Paged batch with bounded queue" code={BATCH_CODE} language="java" />
          </Section>

          <Section id="tx" title="26. @Transactional + executor">
            <Pre>{TX_ASYNC}</Pre>
          </Section>

          <Section id="async" title="27. Spring @Async">
            <Pre>{ASYNC_SPRING}</Pre>
          </Section>

          <Section id="report-pool" title="27b. Report generation isolation" lead="Protect customer APIs from expensive reports.">
            <CodePanel title="customerApiExecutor + reportExecutor" code={REPORT_BULKHEAD_CODE} language="java" />
          </Section>

          <Section id="architecture" title="28. Full payment architecture">
            <Pre>{FULL_ARCH}</Pre>
          </Section>

          <Section id="bulkhead" title="29. Pool isolation / bulkhead">
            <Pre>{BULKHEAD}</Pre>
          </Section>

          <Section id="backpressure" title="29b. Backpressure" lead="Controlled reject beats uncontrolled collapse.">
            <Pre>{BACKPRESSURE_SECTION}</Pre>
          </Section>

          <Section id="decision-trees" title="29c. Decision trees">
            <Pre>{DECISION_WORKLOAD}</Pre>
            <Pre>{DECISION_INCREASE_POOL}</Pre>
          </Section>

          <Section
            id="broken-code"
            title="30. Broken-code interview drills (15)"
            lead="Bad code → ask → runtime → fix → why. Expand each card."
          >
            <BrokenBrowser />
          </Section>

          <Section id="antipatterns" title="31. Anti-patterns">
            <div className="space-y-3">
              {ANTIPATTERNS.map((a) => (
                <div
                  key={a.name}
                  className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm dark:border-rose-900 dark:bg-rose-950/30"
                >
                  <p className="font-bold text-rose-900 dark:text-rose-100">{a.name}</p>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">
                    <strong>Problem:</strong> {a.problem}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Why:</strong> {a.why}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Impact:</strong> {a.impact}
                  </p>
                  <p className="text-emerald-800 dark:text-emerald-200">
                    <strong>Better:</strong> {a.better}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="traps" title="32. Things interviewers try to trick you with">
            <div className="space-y-2">
              {INTERVIEW_TRAPS.map((t) => (
                <div key={t.trap} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <p className="font-semibold text-rose-700 dark:text-rose-300">Myth: {t.trap}</p>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">Truth: {t.truth}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="answers-60s" title="33. Interview answers in 30 / 60 / senior seconds">
            <div className="space-y-4">
              {ANSWERS_60S.map((a) => (
                <div key={a.concept} className="rounded-2xl border border-slate-200 p-4 text-sm leading-7 dark:border-slate-800">
                  <p className="font-bold text-slate-900 dark:text-white">{a.concept}</p>
                  <p className="mt-2">
                    <strong>30s:</strong> {a.s30}
                  </p>
                  <p>
                    <strong>60s:</strong> {a.s60}
                  </p>
                  <p>
                    <strong>Senior:</strong> {a.senior}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="interview" title="34. Interview bank" lead="Scenario questions with thought process.">
            <InterviewBrowser />
          </Section>

          <Section id="memory" title="35. Memory hooks">
            <MiniTable headers={['Concept', 'Hook']} rows={MEMORY_HOOKS} />
          </Section>

          <Section id="cheatsheet" title="36. Cheat sheet · 5-min revision · traps · scenarios">
            <Pre>{CHEAT_ASCII}</Pre>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Executor Framework — 5 minute revision</h3>
            <MiniTable headers={['Concept', 'One-liner']} rows={FIVE_MIN_REVISION} />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">10 rules</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                  {TEN_RULES.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">10 mistakes</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                  {TEN_MISTAKES.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">10 senior lines</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                  {TEN_SENIOR_LINES.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">10 debug questions</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                  {TEN_DEBUG_QS.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">Top 20 interview traps</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {TOP20_TRAPS.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">Top 20 production scenarios</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {TOP20_PROD.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">Top 20 code questions</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {TOP20_CODE.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">Top 10 design questions</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {TOP10_DESIGN.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <Callout title="30-minute revision">
              <ul className="list-disc space-y-1 pl-5">
                {REVISION_30.map((r) => (
                  <li key={r}>{r}</li>
                ))}
                <li>Extra: expand 3 broken-code cards + say one 60s answer aloud</li>
              </ul>
            </Callout>
            <Callout title="2-minute interview explanation">{TWO_MIN}</Callout>
          </Section>
        </div>
      </div>
    </div>
  );
}
