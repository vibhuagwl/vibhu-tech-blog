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
  WORKER_LIFECYCLE,
} from '@/lib/java-executor/overview';
import {
  CALLER_RUNS_TRAP,
  CONCRETE_WALK,
  EXECUTE_TREE,
  FACTORIES,
  REJECTION_POLICIES,
  TPE_PARAMS,
  UNBOUNDED_DANGER,
} from '@/lib/java-executor/thread-pool';
import {
  EXECUTE_VS_SUBMIT,
  FUTURE_FLOW,
  PAYMENT_EXCEPTION_FLOW,
  RUNNABLE_VS_CALLABLE,
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
  CTL_STATES,
  DEBUG_SCENARIO_WALK,
  DECISION_INCREASE_POOL,
  DECISION_WORKLOAD,
  EXCEPTION_MATRIX,
  FIVE_MIN_REVISION,
  INTERVIEW_TRAPS,
  MDC_PROPAGATION,
  MICROMETER_SNIPPET,
  REJECTION_LAB_CODE,
  REJECTION_LABS,
  TOP10_DESIGN,
  TOP20_CODE,
  TOP20_PROD,
} from '@/lib/java-executor/interview-depth';
import {
  ABSTRACTION_ROLES,
  ALLOW_CORE_TIMEOUT,
  EXECUTE_VS_SUBMIT_CODE,
  FACTORY_EXTRA,
  HIERARCHY,
  WHY_EXECUTOR as WHY_EXECUTOR_HIER,
} from '@/lib/java-executor/hierarchy';
import {
  HOOKS_CODE,
  METRICS_CODE,
  QUEUE_DEMOS,
  QUEUE_TABLE_DEEP,
  SCENARIO_A,
  SCENARIO_B,
  SCENARIO_C,
  SCHEDULED_DEEP,
  SCHEDULED_TIMELINE,
} from '@/lib/java-executor/tpe-depth';
import {
  COMPLETION_SERVICE,
  COMPLETION_SERVICE_CODE,
  COMPLETION_USE_CASES,
  INVOKE_ALL,
  INVOKE_ANY,
  INVOKE_COMPARE,
} from '@/lib/java-executor/completion-service';
import {
  CF_AGGREGATOR,
  CF_ALL_ANY,
  CF_ASYNC_VS,
  CF_COMPOSE_COMBINE,
  CF_CREATE,
  CF_DEADLOCK,
  CF_EXCEPTIONS,
  CF_INTRO,
  CF_JOIN_GET,
  CF_MEMORY_BOXES,
  CF_THEN_FAMILY,
  CF_TIMEOUT,
} from '@/lib/java-executor/completable-future';
import {CODING_PROBLEMS} from '@/lib/java-executor/coding-problems';
import {
  CHEAT_SHEET_EXTRA,
  COMPARISON_TABLES,
  MOST_ASKED,
  SENIOR_50,
} from '@/lib/java-executor/senior-reference';
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

function Remember({children}: {children: React.ReactNode}) {
  return (
    <div className="rounded-2xl border border-sky-300 bg-sky-50 p-4 text-sm font-semibold leading-7 text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100">
      Remember: {children}
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
            <button type="button" className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left" onClick={() => setOpen(isOpen ? null : q.id)}>
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
                  <strong>Thought:</strong> {q.thought}
                </p>
                <p>
                  <strong>Strong:</strong> {q.strong}
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

function BrokenBrowser() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {BROKEN_EXAMPLES.map((ex, idx) => {
        const isOpen = open === ex.id;
        return (
          <div key={ex.id} className="rounded-2xl border border-slate-200 dark:border-slate-800">
            <button type="button" className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left" onClick={() => setOpen(isOpen ? null : ex.id)}>
              <span>
                <span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">
                  Broken {idx + 1}
                </span>
                <span className="mt-1 block text-sm font-semibold text-slate-900 dark:text-white">{ex.title}</span>
              </span>
              <span className="text-slate-400">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div className="space-y-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{ex.ask}</p>
                <CodePanel title="Bad" code={ex.bad} language="java" />
                <Pre>{ex.runtime}</Pre>
                <CodePanel title="Fix" code={ex.fix} language="java" />
                <p className="text-sm text-slate-700 dark:text-slate-300">{ex.why}</p>
                <Callout title="Remember">{ex.hook}</Callout>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CodingBrowser() {
  const [open, setOpen] = useState<string | null>(CODING_PROBLEMS[0]?.id ?? null);
  return (
    <div className="space-y-3">
      {CODING_PROBLEMS.map((p, idx) => {
        const isOpen = open === p.id;
        return (
          <div key={p.id} className="rounded-2xl border border-slate-200 dark:border-slate-800">
            <button type="button" className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left" onClick={() => setOpen(isOpen ? null : p.id)}>
              <span>
                <span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">
                  Problem {idx + 1}
                </span>
                <span className="mt-1 block text-sm font-semibold text-slate-900 dark:text-white">{p.title}</span>
              </span>
              <span className="text-slate-400">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div className="space-y-3 border-t border-slate-100 px-4 py-3 text-sm leading-7 dark:border-slate-800">
                <p>
                  <strong>Statement:</strong> {p.statement}
                </p>
                <p className="text-rose-700 dark:text-rose-300">
                  <strong>Naive:</strong> {p.naive}
                </p>
                <p>
                  <strong>Approach:</strong> {p.solution}
                </p>
                <CodePanel title="Solution" code={p.code} language="java" />
                <p>{p.why}</p>
                <p>
                  <strong>Complexity:</strong> {p.complexity}
                </p>
                <p>
                  <strong>Production:</strong> {p.production}
                </p>
                <p>
                  <strong>Follow-ups:</strong> {p.followUps.join(' · ')}
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
    <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
      <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">
        Incident {i + 1}/{INCIDENTS.length}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{s.title}</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Clue: {s.clue}</p>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => setShow(true)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          Reveal
        </button>
        <button
          type="button"
          onClick={() => {
            setI((x) => x + 1);
            setShow(false);
          }}
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold dark:bg-slate-900"
        >
          Next
        </button>
      </div>
      {show && <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-300">{s.answer}</p>}
    </div>
  );
}

export default function JavaExecutorHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Java 17+ · Executor · CompletableFuture · Staff interview
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Java Executor Framework — complete interview reference
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Hierarchy → ThreadPoolExecutor mechanics → Future/CompletionService → CompletableFuture pipelines → production
          sizing → coding drills. Built for 10–15+ year engineers.
        </p>
        <p className="mt-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">{MEMORY_SENTENCE}</p>
        <p className="mt-3 text-sm text-slate-500">
          {VERSION_NOTE}{' '}
          <Link href="/java-concurrency" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Concurrency
          </Link>
          {' · '}
          <Link href="/java-locking" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Locking
          </Link>
          {' · '}
          <Link href="/java-reentrant-lock" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            ReentrantLock
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[240px_minmax(0,1fr)]">
        <StickyToc items={EXECUTOR_TOC} />
        <div className="min-w-0 space-y-14">
          <Section id="big-picture" title="01. Overview" lead="Separate work from workers — stop Thread storms.">
            <Pre>{WHY_EXECUTOR_HIER}</Pre>
            <Pre>{MENTAL_MODEL}</Pre>
            <MiniTable headers={['Type', 'Role']} rows={TYPE_MAP} />
            <MiniTable headers={['Hook', 'Line']} rows={MEMORY_HOOKS_INTRO} />
          </Section>

          <Section id="hierarchy" title="02. Executor hierarchy" lead="Every abstraction and its job.">
            <Pre>{HIERARCHY}</Pre>
            <MiniTable headers={['Type', 'Key API', 'Responsibility']} rows={ABSTRACTION_ROLES} />
          </Section>

          <Section id="execute-submit" title="03. execute() vs submit()" lead="Same pool — different exception visibility.">
            <Pre>{EXECUTE_VS_SUBMIT}</Pre>
            <CodePanel title="Runnable demo" code={EXECUTE_VS_SUBMIT_CODE} language="java" />
            <Pre>{SUBMIT_INTERNALS}</Pre>
            <Trap>submit() does not throw task failures to the caller — they wait inside Future.get().</Trap>
          </Section>

          <Section id="factories" title="04. Executors factory methods" lead="Convenient defaults — often production hazards.">
            <div className="space-y-3">
              {FACTORIES.map((f) => (
                <div key={f.name} className="rounded-2xl border border-slate-200 p-4 text-sm leading-7 dark:border-slate-800">
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
            <Pre>{UNBOUNDED_DANGER}</Pre>
          </Section>

          <Section id="factory-extra" title="04b. Work-stealing · unconfigurable · single scheduled">
            {FACTORY_EXTRA.map((f) => (
              <div key={f.name} className="rounded-2xl border border-slate-200 p-4 text-sm leading-7 dark:border-slate-800">
                <p className="font-mono font-bold">{f.name}</p>
                <p>
                  {f.impl} · Queue: {f.queue}
                </p>
                <p>
                  Threads: {f.threads} · Idle: {f.idle}
                </p>
                <p className="text-rose-700 dark:text-rose-300">Danger: {f.danger}</p>
                <p>
                  Use: {f.use} · Prod: {f.prod}
                </p>
                <p className="text-slate-500">Interview: {f.interview}</p>
                <CodePanel title={f.name} code={f.code} language="java" />
              </div>
            ))}
            <Pre>{ALLOW_CORE_TIMEOUT}</Pre>
          </Section>

          <Section id="tpe-params" title="05. ThreadPoolExecutor parameters">
            <div className="space-y-3">
              {TPE_PARAMS.map((p) => (
                <div key={p.name} className="rounded-2xl border border-slate-200 p-4 text-sm leading-7 dark:border-slate-800">
                  <p className="font-mono text-base font-bold">{p.name}</p>
                  <p>
                    <strong>Controls:</strong> {p.controls}
                  </p>
                  <p>
                    <strong>FinTech:</strong> {p.fintech}
                  </p>
                  <p className="text-slate-500">Interview: {p.interviewQ}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="algorithm" title="06. CORE → QUEUE → MAX → REJECT">
            <Pre>{EXECUTE_TREE}</Pre>
            <Callout title="Concrete walk">{CONCRETE_WALK}</Callout>
            <Pre>{QUEUE_SIZE_EXPERIMENT}</Pre>
            <Remember>Max threads are created ONLY after the queue refuses the task.</Remember>
          </Section>

          <Section id="scenarios-abc" title="07. Submission scenarios A / B / C">
            <Callout title="Scenario A">{SCENARIO_A}</Callout>
            <Callout title="Scenario B">{SCENARIO_B}</Callout>
            <Callout title="Scenario C — SynchronousQueue">{SCENARIO_C}</Callout>
          </Section>

          <Section id="queues" title="08. Queue types">
            <MiniTable headers={QUEUE_TABLE_DEEP[0]} rows={QUEUE_TABLE_DEEP.slice(1)} />
            <Pre>{QUEUE_DEMOS}</Pre>
          </Section>

          <Section id="rejection" title="09. RejectedExecutionHandler">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900">
                  <tr>
                    {['Policy', 'Behavior', 'Payments', 'Trading', 'Reports'].map((h) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pre>{CALLER_RUNS_TRAP}</Pre>
          </Section>

          <Section id="rejection-labs" title="09b. Rejection labs">
            <Pre>{REJECTION_LABS}</Pre>
            <CodePanel title="Demo harness" code={REJECTION_LAB_CODE} language="java" />
          </Section>

          <Section id="thread-factory" title="10. ThreadFactory">
            <CodePanel title="Named workers" code={THREAD_FACTORY_CODE} language="java" />
          </Section>

          <Section id="lifecycle" title="11. Lifecycle & graceful shutdown">
            <Pre>{THREAD_LIFECYCLE}</Pre>
            <Pre>{WORKER_LIFECYCLE}</Pre>
            <Pre>{SHUTDOWN_DIAGRAM}</Pre>
            <Pre>{SHUTDOWN_PAYMENTS}</Pre>
          </Section>

          <Section id="ctl-states" title="11b. Run states">
            <Pre>{CTL_STATES}</Pre>
          </Section>

          <Section id="hooks" title="12. beforeExecute / afterExecute / terminated">
            <CodePanel title="MetricsThreadPoolExecutor" code={HOOKS_CODE} language="java" />
            <Trap>afterExecute’s Throwable is null for submit() failures — unwrap Future.get() inside the hook.</Trap>
          </Section>

          <Section id="monitoring" title="13. Metrics & monitoring">
            <Pre>{MONITORING}</Pre>
            <CodePanel title="Getter snapshot" code={METRICS_CODE} language="java" />
            <CodePanel title="Micrometer sketch" code={MICROMETER_SNIPPET} language="java" />
            <Pre>{DEBUG_SCENARIO_WALK}</Pre>
            <IncidentDrill />
          </Section>

          <Section id="callable" title="14. Future — complete guide">
            <Pre>{RUNNABLE_VS_CALLABLE}</Pre>
            <Pre>{FUTURE_FLOW}</Pre>
            <Pre>{PAYMENT_EXCEPTION_FLOW}</Pre>
            <MiniTable headers={EXCEPTION_MATRIX[0]} rows={EXCEPTION_MATRIX.slice(1)} />
            <Remember>Future is hard to compose — that is why CompletableFuture exists.</Remember>
          </Section>

          <Section id="cancel" title="14b. Cancellation">
            <Pre>{CANCEL_DEEP}</Pre>
            <CodePanel title="Interrupt-aware task" code={CANCEL_CODE} language="java" />
          </Section>

          <Section id="invoke-all-any" title="15. invokeAll · invokeAny">
            <CodePanel title="invokeAll" code={INVOKE_ALL} language="java" />
            <CodePanel title="invokeAny" code={INVOKE_ANY} language="java" />
            <Pre>{INVOKE_COMPARE}</Pre>
          </Section>

          <Section id="completion-service" title="16. ExecutorCompletionService" lead="Process results in completion order.">
            <Pre>{COMPLETION_SERVICE}</Pre>
            <CodePanel title="B then C then A" code={COMPLETION_SERVICE_CODE} language="java" />
            <Pre>{COMPLETION_USE_CASES}</Pre>
          </Section>

          <Section id="scheduled" title="17. ScheduledExecutorService">
            <Pre>{SCHEDULED_DEEP}</Pre>
            <Pre>{SCHEDULED_TIMELINE}</Pre>
          </Section>

          <Section id="fjp" title="18. ForkJoinPool">
            <Pre>{FJP}</Pre>
          </Section>

          <Section id="cf" title="19. CompletableFuture overview">
            <Pre>{CF_INTRO}</Pre>
            <CodePanel title="Creation" code={CF_CREATE} language="java" />
            <Pre>{CF_THEN_FAMILY}</Pre>
            <MiniTable headers={['Hook', 'Meaning']} rows={CF_MEMORY_BOXES} />
          </Section>

          <Section id="cf-pipeline" title="20. CF composition" lead="Async vs non-async · compose · combine · allOf · anyOf.">
            <Pre>{CF_ASYNC_VS}</Pre>
            <CodePanel title="Compose / Combine" code={CF_COMPOSE_COMBINE} language="java" />
            <CodePanel title="allOf / anyOf / sequence" code={CF_ALL_ANY} language="java" />
          </Section>

          <Section id="cf-exceptions" title="21. CF exceptions · join vs get">
            <Pre>{CF_EXCEPTIONS}</Pre>
            <Pre>{CF_JOIN_GET}</Pre>
          </Section>

          <Section id="cf-timeout" title="22. Timeout · cancellation · starvation">
            <Pre>{CF_TIMEOUT}</Pre>
            <Pre>{CF_DEADLOCK}</Pre>
            <Pre>{DEADLOCK_NESTED}</Pre>
          </Section>

          <Section id="cf-aggregator" title="23. Real-world CF aggregator">
            <CodePanel title="CustomerAggregator" code={CF_AGGREGATOR} language="java" />
          </Section>

          <Section id="payment-design" title="24. Pool sizing · payment design">
            <Pre>{PAYMENT_DESIGN}</Pre>
            <Pre>{PAYMENT_SLOW_PATHS}</Pre>
            <CodePanel title="Payment executor" code={PAYMENT_COMPLETE_CODE} language="java" />
            <Pre>{DECISION_WORKLOAD}</Pre>
            <Pre>{DECISION_INCREASE_POOL}</Pre>
          </Section>

          <Section id="cpu-io" title="24b. CPU vs I/O">
            <Pre>{CPU_IO}</Pre>
          </Section>

          <Section id="pools-interact" title="24c. Thread vs DB / HTTP pools">
            <Pre>{POOL_INTERACT}</Pre>
          </Section>

          <Section id="backpressure" title="25. Backpressure">
            <Pre>{BACKPRESSURE_SECTION}</Pre>
          </Section>

          <Section id="bulkhead" title="26. Bulkhead pattern">
            <Pre>{BULKHEAD}</Pre>
            <CodePanel title="Report isolation" code={REPORT_BULKHEAD_CODE} language="java" />
          </Section>

          <Section id="virtual" title="27. Virtual threads">
            <Pre>{VIRTUAL_THREADS}</Pre>
            <Trap>100k virtual threads still share 20 DB connections.</Trap>
          </Section>

          <Section id="kafka" title="28. Kafka · Spring · MDC · @Async">
            <Pre>{KAFKA_EXECUTOR}</Pre>
            <Pre>{KAFKA_FLOW}</Pre>
            <CodePanel title="Kafka handoff" code={KAFKA_SPRING_CODE} language="java" />
            <Pre>{TX_ASYNC}</Pre>
            <Pre>{ASYNC_SPRING}</Pre>
            <Pre>{THREADLOCAL_TRAP}</Pre>
            <Pre>{MDC_PROPAGATION}</Pre>
          </Section>

          <Section id="architecture" title="29. Full payment architecture">
            <Pre>{FULL_ARCH}</Pre>
          </Section>

          <Section id="broken-code" title="30. Broken-code drills">
            <BrokenBrowser />
          </Section>

          <Section id="antipatterns" title="31. Production mistakes">
            <div className="space-y-3">
              {ANTIPATTERNS.map((a) => (
                <div key={a.name} className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm dark:border-rose-900 dark:bg-rose-950/30">
                  <p className="font-bold text-rose-900 dark:text-rose-100">{a.name}</p>
                  <p className="mt-1">
                    {a.problem} — {a.impact}
                  </p>
                  <p className="text-emerald-800 dark:text-emerald-200">Better: {a.better}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="coding-problems" title="32. Coding interview problems (15)">
            <CodingBrowser />
          </Section>

          <Section id="senior-50" title="33. Senior Java Executor Q&A (50+)" lead="Concise answers for live interviews.">
            <div className="space-y-2">
              {SENIOR_50.map((item, i) => (
                <details key={item.q} className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-white">
                    {i + 1}. {item.q}
                  </summary>
                  <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{item.a}</p>
                </details>
              ))}
            </div>
            <Callout title="Most asked">
              <ul className="list-disc space-y-1 pl-5">
                {MOST_ASKED.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </Callout>
          </Section>

          <Section id="interview" title="34. Scenario interview bank">
            <InterviewBrowser />
          </Section>

          <Section id="tables" title="35. Comparison tables">
            {COMPARISON_TABLES.map((t) => (
              <div key={t.title}>
                <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">{t.title}</h3>
                <MiniTable headers={t.headers} rows={t.rows} />
              </div>
            ))}
          </Section>

          <Section id="traps" title="36. Interviewer traps">
            <div className="space-y-2">
              {INTERVIEW_TRAPS.map((t) => (
                <div key={t.trap} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <p className="font-semibold text-rose-700 dark:text-rose-300">Myth: {t.trap}</p>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">Truth: {t.truth}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="answers-60s" title="37. 30 / 60 / senior-second answers">
            {ANSWERS_60S.map((a) => (
              <div key={a.concept} className="rounded-2xl border border-slate-200 p-4 text-sm leading-7 dark:border-slate-800">
                <p className="font-bold">{a.concept}</p>
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
          </Section>

          <Section id="cheatsheet" title="38. Interview cheat sheet">
            <Pre>{CHEAT_SHEET_EXTRA}</Pre>
            <Pre>{CHEAT_ASCII}</Pre>
            <MiniTable headers={['Concept', 'One-liner']} rows={FIVE_MIN_REVISION} />
            <MiniTable headers={['Concept', 'Hook']} rows={MEMORY_HOOKS} />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-bold">10 rules</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                  {TEN_RULES.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold">10 mistakes</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                  {TEN_MISTAKES.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold">10 senior lines</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                  {TEN_SENIOR_LINES.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold">10 debug questions</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                  {TEN_DEBUG_QS.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
            <h3 className="text-sm font-bold">Top 20 production scenarios</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {TOP20_PROD.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <h3 className="mt-4 text-sm font-bold">Top 20 code questions</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {TOP20_CODE.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <h3 className="mt-4 text-sm font-bold">Top 10 design questions</h3>
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
                <li>Extra: CompletionService + thenCompose/Combine + one coding problem aloud</li>
              </ul>
            </Callout>
            <Callout title="2-minute pitch">{TWO_MIN}</Callout>
          </Section>
        </div>
      </div>
    </div>
  );
}
