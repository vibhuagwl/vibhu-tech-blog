'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {LOCKING_TOC} from '@/lib/java-locking/toc';
import {LOCKING_TIMELINE} from '@/lib/java-locking/timeline';
import {MECHANISMS} from '@/lib/java-locking/mechanisms';
import {
  BEST_PRACTICES,
  CHEAT_SHEET,
  LOCK_FREE_TABLE,
  MASTER_COMPARISON,
  OPT_VS_PESS,
  REMEMBER,
} from '@/lib/java-locking/comparison';
import {PROD_PROBLEMS,SCENARIO_PICKS,WRONG_CHOICES} from '@/lib/java-locking/scenarios';
import StickyToc from './sticky-toc';
import MechanismPanel from './mechanism-panel';
import InterviewMode from './interview-mode';
import ConcurrencyLab from './concurrency-lab';
import CodePanel from './code-panel';

function Section({
  id,
  title,
  lead,
  children,
}:{
  id:string;
  title:string;
  lead?:string;
  children:React.ReactNode;
}){
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-3xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{title}</h2>
      {lead && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function JavaLockingHub(){
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Staff · Principal · Interview · Production
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Java Locking &amp; Concurrency
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Problem → broken code → race → fix → diagram → output → production choice.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          90% practical. Not a textbook. For multi-JVM locks see{' '}
          <Link href="/distributed-systems" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Distributed Systems
          </Link>
          . Run snippets in the{' '}
          <Link href="/java-compiler" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Java Compiler
          </Link>
          .
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <StickyToc items={LOCKING_TOC}/>

        <div className="min-w-0 space-y-16">
          <Section id="overview" title="Locking Overview" lead="Protect shared mutable state — or don't share it.">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ['JVM locks', 'synchronized, Lock, atomics — one process'],
                ['DB locks', '@Version / SELECT FOR UPDATE — durable rows'],
                ['Distributed locks', 'Lease + fencing across pods'],
              ].map(([t,b])=>(
                <div key={t} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">{t}</div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{b}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              <strong>Interview trap:</strong> answering every concurrency problem with synchronized — scope (memory vs DB vs cluster) chooses the tool.
            </div>
          </Section>

          <Section id="timeline" title="Java Locking Timeline / Evolution">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TB
  J1[Java 1.0 synchronized volatile wait/notify] --> J5[Java 5 j.u.c Lock Semaphore Latch Atomic]
  J5 --> J7[Java 7 ForkJoinPool Phaser]
  J7 --> J8[Java 8 StampedLock LongAdder]
  J8 --> J9[Java 9+ VarHandle]
  J9 --> J21[Java 21+ Virtual Threads]`}/>
            </div>
            <div className="mt-6 space-y-4">
              {LOCKING_TIMELINE.map((era)=>(
                <div key={era.version} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{era.version}</h3>
                  <div className="mt-3 space-y-3">
                    {era.features.map((f)=>(
                      <div key={f.name} className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                        <div className="font-semibold text-slate-900 dark:text-white">{f.name}</div>
                        <div>Why: {f.why}</div>
                        <div>Solved: {f.solved}</div>
                        <div>Before: {f.before}</div>
                        <div>Modern: {f.modern}</div>
                        <div>{f.stillUsed?'Still commonly used':'Niche / historical'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {MECHANISMS.map((m)=>(
            <MechanismPanel key={m.id} m={m}/>
          ))}

          <Section id="optimistic-pessimistic" title="Optimistic vs Pessimistic Locking">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <h3 className="font-bold">Optimistic</h3>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                  {OPT_VS_PESS.optimistic.map((s)=><li key={s}>{s}</li>)}
                </ol>
                <p className="mt-3 text-sm">Java: CAS / StampedLock validate · DB: @Version</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <h3 className="font-bold">Pessimistic</h3>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                  {OPT_VS_PESS.pessimistic.map((s)=><li key={s}>{s}</li>)}
                </ol>
                <p className="mt-3 text-sm">Java: synchronized/Lock · DB: PESSIMISTIC_WRITE</p>
              </div>
            </div>
          </Section>

          <Section id="fair-unfair" title="Fair vs Unfair Locking" lead="Unfair allows barging (usually faster). Fair reduces starvation (usually slower). Measure.">
            <CodePanel
              title="Fair lock"
              code={`ReentrantLock unfair = new ReentrantLock();      // default
ReentrantLock fair = new ReentrantLock(true);    // queue order ~honored`}
            />
          </Section>

          <Section id="reentrant-concepts" title="Reentrant vs Non-Reentrant" lead="Reentrant: same thread can re-acquire. StampedLock is not reentrant — nested acquire can deadlock yourself.">
            <CodePanel
              title="Reentrancy"
              code={`synchronized void a() { b(); }
synchronized void b() { /* same thread OK with synchronized/ReentrantLock */ }`}
            />
          </Section>

          <Section id="spin-lock" title="Spin Lock" lead="Busy-loop CAS/test until success. Burns CPU; sometimes OK for tiny critical sections. Prefer park-based locks in apps.">
            <CodePanel
              title="Conceptual spin"
              code={`while (!state.compareAndSet(UNLOCKED, LOCKED)) {
  Thread.onSpinWait(); // still a spin — not a general app lock
}`}
            />
          </Section>

          <Section id="custom-lock" title="Custom Lock Implementation" lead="Prefer j.u.c. If you must learn AQS: state + park/unpark + queue. Production: don't ship a custom mutex.">
            <CodePanel
              title="Tiny mutex sketch (educational)"
              code={`class TinyLock {
  private final AtomicBoolean locked = new AtomicBoolean(false);
  void lock() {
    while (!locked.compareAndSet(false, true)) {
      LockSupport.parkNanos(1_000);
    }
  }
  void unlock() { locked.set(false); }
}`}
            />
          </Section>

          <Section id="thread-safe-collections" title="Thread-safe Collections" lead="Vector/Hashtable are blunt. Prefer CHM, CopyOnWriteArrayList for read-heavy lists, BlockingQueue for handoff.">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-2 text-left">Collection</th>
                    <th className="px-4 py-2 text-left">Use</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['ConcurrentHashMap','Concurrent keyed state'],
                    ['CopyOnWriteArrayList','Rare writes, many iterators'],
                    ['BlockingQueue','Producer/consumer'],
                    ['ConcurrentLinkedQueue','Non-blocking queue'],
                  ].map(([a,b])=>(
                    <tr key={a} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-4 py-2 font-semibold">{a}</td>
                      <td className="px-4 py-2">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="jvm-vs-distributed" title="JVM Locking vs Distributed-System Locking">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart LR
  JVM[JVM locks] --> MEM[In-process memory]
  DIST[Distributed locks] --> STORE[Redis / ZK / DB]
  DB[DB locks] --> ROWS[Durable rows]`}/>
            </div>
          </Section>

          <Section id="race-condition" title="Race Condition" lead="READ → CALCULATE → WRITE without atomicity.">
            <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">{`balance = balance - amount;

Race condition
  → synchronized / Lock
  → Atomic
  → DB transaction
  → Distributed lock
(pick by sharing scope)`}</pre>
          </Section>

          <Section id="contention-granularity" title="Lock Contention & Granularity">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <h3 className="font-bold">Coarse</h3>
                <pre className="mt-2 text-xs text-slate-600 dark:text-slate-300">{`Entire service → one lock
+ simple
- high contention`}</pre>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <h3 className="font-bold">Fine</h3>
                <pre className="mt-2 text-xs text-slate-600 dark:text-slate-300">{`Account-A → Lock-A
Account-B → Lock-B
+ throughput
- deadlock risk / complexity`}</pre>
              </div>
            </div>
          </Section>

          <Section id="lock-free" title="Lock-Free vs Wait-Free vs Blocking">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-2 text-left">Technique</th>
                    <th className="px-4 py-2 text-left">Blocking</th>
                    <th className="px-4 py-2 text-left">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {LOCK_FREE_TABLE.map((r)=>(
                    <tr key={r.technique} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-4 py-2 font-semibold">{r.technique}</td>
                      <td className="px-4 py-2">{r.blocking}</td>
                      <td className="px-4 py-2">{r.progress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="payment-system" title="Payment Processing System" lead="One end-to-end story — right tool per layer.">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TB
  API[API Request] --> PS[Payment Service]
  PS --> IDEM[Idempotency ConcurrentHashMap / DB unique]
  PS --> BAL[Account balance DB txn / @Version]
  PS --> CONC[In-process orchestration locks if needed]
  PS --> SEM[Semaphore to payment gateway]
  PS --> K[(Kafka event)]`}/>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <li><strong>CHM / DB unique</strong> — idempotency key claim</li>
              <li><strong>DB transaction + optimistic/pessimistic</strong> — money movement</li>
              <li><strong>ReentrantLock</strong> — rare in-process coordination (not a substitute for DB)</li>
              <li><strong>Semaphore</strong> — gateway concurrency bulkhead</li>
              <li><strong>AtomicReference</strong> — in-memory state machine for a single aggregate (demo)</li>
            </ul>
          </Section>

          <Section id="production-problems" title="Production Problems You Will Actually See">
            <div className="space-y-3">
              {PROD_PROBLEMS.map((p)=>(
                <details key={p.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white">{p.title}</summary>
                  <div className="mt-3 space-y-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    <div><strong>Bad:</strong> {p.bad}</div>
                    <div><strong>Execution:</strong> {p.execution}</div>
                    <div><strong>Root cause:</strong> {p.rootCause}</div>
                    <div><strong>Solution:</strong> {p.solution}</div>
                    <div><strong>Why:</strong> {p.why}</div>
                  </div>
                </details>
              ))}
            </div>
          </Section>

          <Section id="wrong-choices" title="Wrong Lock Choices">
            <div className="space-y-3">
              {WRONG_CHOICES.map((w)=>(
                <div key={w.wrong} className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm dark:border-rose-900 dark:bg-rose-950/30">
                  <div className="font-bold text-rose-900 dark:text-rose-100">❌ {w.wrong}</div>
                  <div className="mt-2 text-rose-950 dark:text-rose-100">Looks correct: {w.looksCorrect}</div>
                  <div className="text-rose-950 dark:text-rose-100">Actually wrong: {w.actuallyWrong}</div>
                  <div className="mt-1 font-semibold text-emerald-800 dark:text-emerald-300">✅ {w.correct}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="choose-lock" title="Choose the Lock — Scenarios">
            <div className="space-y-4">
              {SCENARIO_PICKS.map((s)=>(
                <div key={s.id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                  <p className="font-semibold text-slate-900 dark:text-white">{s.scenario}</p>
                  <p className="mt-2 text-sm text-blue-700 dark:text-blue-400">{s.answer}</p>
                  <p className="mt-1 text-sm text-slate-500">{s.why}</p>
                  <div className="mt-3"><CodePanel title="Sketch" code={s.code}/></div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="debugging" title="How to Debug Locking Problems in Production">
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <li><code>jstack &lt;pid&gt;</code> / <code>jcmd &lt;pid&gt; Thread.print</code></li>
              <li>JFR + JMC — lock contention, pinned virtual threads</li>
              <li>async-profiler / VisualVM for CPU vs blocked time</li>
            </ul>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">{`Found one Java-level deadlock:

"Thread-1":
  waiting to lock monitor X
  which is held by "Thread-2"

"Thread-2":
  waiting to lock monitor Y
  which is held by "Thread-1"

Ask: who owns? who waits? where is the cycle?`}</pre>
          </Section>

          <Section id="benchmark" title="Performance Experiment" lead="Do not claim ReentrantLock is always faster. Run and observe.">
            <CodePanel
              title="JMH-style sketch (see java-locking-lab)"
              code={`// Compare increment throughput:
// synchronized vs ReentrantLock vs AtomicInteger vs LongAdder
// Threads: 1 / 4 / 32
// Report: ops/s, p99, contention notes
// Results depend on workload, JVM, hardware.`}
            />
            <p className="mt-3 text-sm text-slate-500">
              Runnable module: <code>java-locking-lab/</code> (JUnit demos + counter benchmarks).
            </p>
          </Section>

          <Section id="lab" title="Concurrency Laboratory">
            <ConcurrencyLab/>
          </Section>

          <Section id="decision-tree" title="Decision Tree — Which Lock Should I Use?">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={`flowchart TD
  A[Shared mutable state?] -->|No| Z[No lock]
  A -->|Yes| B[Naturally atomic single var?]
  B -->|Yes| C[Atomic / CAS / LongAdder]
  B -->|No| D[Single JVM?]
  D -->|No| E[Distributed or DB lock]
  D -->|Yes| F[Mostly reads?]
  F -->|Yes| G[ReadWriteLock / StampedLock]
  F -->|No| H[Need tryLock/timeout?]
  H -->|Yes| I[ReentrantLock]
  H -->|No| J[synchronized]
  D --> K[Limit concurrency?]
  K --> L[Semaphore]
  D --> M[Wait for N events once?]
  M --> N[CountDownLatch]
  D --> O[Repeated phases?]
  O --> P[CyclicBarrier / Phaser]`}/>
            </div>
          </Section>

          <Section id="comparison" title="Master Comparison Table">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-3 py-2 text-left">Mechanism</th>
                    <th className="px-3 py-2 text-left">Exclusion</th>
                    <th className="px-3 py-2 text-left">Visibility</th>
                    <th className="px-3 py-2 text-left">Blocking</th>
                    <th className="px-3 py-2 text-left">Reentrant</th>
                    <th className="px-3 py-2 text-left">Fairness</th>
                    <th className="px-3 py-2 text-left">Best use</th>
                  </tr>
                </thead>
                <tbody>
                  {MASTER_COMPARISON.map((r)=>(
                    <tr key={r.mechanism} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-3 py-2 font-semibold">{r.mechanism}</td>
                      <td className="px-3 py-2">{r.exclusion}</td>
                      <td className="px-3 py-2">{r.visibility}</td>
                      <td className="px-3 py-2">{r.blocking}</td>
                      <td className="px-3 py-2">{r.reentrant}</td>
                      <td className="px-3 py-2">{r.fairness}</td>
                      <td className="px-3 py-2">{r.best}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="best-practices" title="Production Best Practices">
            <ul className="grid gap-2 md:grid-cols-2">
              {BEST_PRACTICES.map((b)=>(
                <li key={b} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">{b}</li>
              ))}
            </ul>
          </Section>

          <Section id="interview-mode" title="Interview Mode">
            <InterviewMode/>
          </Section>

          <Section id="cheat-sheet" title="One Screen Cheat Sheet">
            <div className="grid gap-2 md:grid-cols-2">
              {CHEAT_SHEET.map((c)=>(
                <div key={c.q} className="rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="text-slate-500">{c.q}</div>
                  <div className="font-semibold text-slate-900 dark:text-white">→ {c.a}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="remember" title="Remember It Forever">
            <div className="grid gap-2 md:grid-cols-2">
              {REMEMBER.map((r)=>(
                <div key={r.name} className="rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">
                  <span className="font-bold">{r.name}</span> = {r.analogy}
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
