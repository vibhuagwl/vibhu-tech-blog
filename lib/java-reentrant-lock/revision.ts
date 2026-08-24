export const DECISION_TREE = `Need mutual exclusion for shared mutable state?
        |
       YES
        |
        v
Scope = multiple JVMs / pods?
      /               \\
    YES                NO
     |                  |
 DB row lock /          Is simple locking enough?
 distributed lease /         /           \\
 Kafka key order           YES            NO
                            |              |
                      synchronized   Need tryLock / timeout /
                                     interrupt / fairness /
                                     multiple Conditions?
                                            |
                                           YES
                                            |
                                      ReentrantLock
                                            |
                                            v
                              Mostly reads + few writes?
                                   /              \\
                                 YES               NO
                                  |                 |
                         Snapshot publish     Stay on ReentrantLock
                         or RRWL                    |
                                  |                 v
                                  v            Heavy compound
                         Need optimistic          invariants
                         reads (measured)?         under lock
                                  |
                                 YES
                                  |
                             StampedLock
                             (no reentrancy!)`;

export const ONE_PAGE = `                    JAVA LOCKS (one JVM)
                        |
       +----------------+----------------+
       |                |                |
 synchronized     ReentrantLock     ReadWriteLock
                                      |
                                +-----+-----+
                                |           |
                              READ         WRITE
                              MANY         ONE
                                |
                                v
                           StampedLock
                                |
                        Optimistic Read

Multi-JVM → DB / lease+fencing / partition ordering`;

export const MUST_UNDERSTAND = [
  'Race = broken check-then-act on shared money/state.',
  'Reentrant = same owner, hold-count, others blocked until zero.',
  'AQS = state + wait queue + park/unpark under Lock APIs.',
  'Always unlock in finally.',
  'tryLock/timeout protect latency SLAs.',
  'lockInterruptibly makes waiting cancelable.',
  'await releases lock, parks, reacquires — use while.',
  'RRWL = many readers OR one writer; upgrade is dangerous.',
  'Downgrade write→read is supported; upgrade read→write is not a safe simple op.',
  'Java lock stops at the JVM — money often needs DB/idempotency.',
];

export const NEVER_DO = [
  'Skip finally unlock.',
  'Hold lock across HTTP/DB/Kafka I/O.',
  'Upgrade read→write on RRWL.',
  'Use Java locks for cross-pod account updates.',
  'Ignore tryLock false / timeouts.',
  'Swallow InterruptedException.',
  'Assume fair lock = absolute FIFO magic.',
  'Use RRWL on write-heavy paths by default.',
  'Reach for StampedLock without measuring / nesting rules.',
  'Grow the thread pool to fix lock contention.',
];

export const DEBUG_QUESTIONS = [
  'Who owns the lock right now?',
  'What is the owner stack doing (I/O under lock)?',
  'How long are hold and wait times (p50/p99)?',
  'Is CPU low while latency is high?',
  'Fair or unfair? Writer waiting behind readers?',
  'Deadlock cycle in jstack / ThreadMXBean?',
  'One JVM or many pods sharing the invariant?',
  'Did unlock run on all paths?',
  'Are we locked on the correct shared object?',
  'Would tryLock + shed load protect the SLO?',
];

export const SENIOR_STATEMENTS = [
  'I default to synchronized unless I need Lock features.',
  'Non-fair is the default for throughput; fair is a measured cure for starvation.',
  'Critical sections must not include remote calls.',
  'Account transfers lock in sorted id order — or use the DB.',
  'ReadWriteLock helps only when readers truly overlap.',
  'StampedLock is powerful and easy to deadlock without reentrancy.',
  'Condition waits always loop on the predicate.',
  'A Java lock never coordinates two pods.',
  'Contention shows up as blocked threads, not high CPU.',
  'Idempotency and DB constraints own money; locks own in-process structure.',
];

export const FINANCE_USE_CASES = [
  'In-process payment buffer: ReentrantLock + Condition (or BlockingQueue).',
  'Per-account in-memory cache mutation: striped ReentrantLock.',
  'FX/config tables: immutable snapshot or RRWL.',
  'Mid-price display cache: StampedLock optimistic read (measured).',
  'Metrics: LongAdder — not a lock.',
  'Cross-pod debit: DB row lock / version + idempotency key.',
  'Matching engine per instrument: single-writer / exclusive lock.',
  'Risk limits: snapshot publish to readers.',
  'Transfer A↔B: ordered locks or single DB transaction.',
  'API timeout path: tryLock / lockInterruptibly + reject.',
];

export const REVISION_30 = [
  {mins: '0–5', topic: 'Lock fundamentals', focus: 'Race on ₹10k withdrawals; mutual exclusion; progression diagram'},
  {mins: '5–10', topic: 'ReentrantLock', focus: 'Reentrancy hold count; sync vs RL table; finally unlock; tryLock; interruptibly'},
  {mins: '10–15', topic: 'AQS', focus: 'state, queue, CAS, park/unpark; fair vs non-fair barging'},
  {mins: '15–20', topic: 'ReadWriteLock', focus: 'Matrix; upgrade deadlock; downgrade; writer starvation'},
  {mins: '20–23', topic: 'StampedLock', focus: 'Optimistic validate; no reentrancy; when not to use'},
  {mins: '23–26', topic: 'Deadlocks', focus: 'Four conditions; ordered account locks; cross-layer Java↔DB'},
  {mins: '26–28', topic: 'Production', focus: 'I/O under lock; pool starvation; multi-JVM myth; incidents 1–5'},
  {mins: '28–30', topic: 'Interview pitch', focus: '2-minute explanation + decision tree'},
];

export const PITCH_2MIN = `In production I treat locks as a progression, not a trivia list.

Start from the race: two threads read the same balance and both withdraw — money is invented. You need mutual exclusion. For simple cases I use synchronized because unlock is automatic and the code stays small.

When I need more control — tryLock with a timeout for an SLA, interruptible waiting so a cancelled payment request can leave the queue, fairness under proven starvation, or multiple Condition wait sets for a bounded payment buffer — I use ReentrantLock. It sits on AQS: an atomic state for the hold count, a wait queue, and park/unpark. I always unlock in finally. Default is non-fair for throughput; fair only when barging hurts a wait SLO.

If the workload is read-mostly — config, FX refs, risk tables — ReentrantReadWriteLock lets readers overlap while writers stay exclusive. I never upgrade read to write while holding the read lock; that deadlocks under concurrent readers. Downgrade write to read is fine. Under a reader flood, unfair mode can starve writers — fair mode or snapshot publish fixes that.

StampedLock’s optimistic read can win when reads dominate and retry is OK, but it is not reentrant and easy to misuse — I only take it when measured.

Most important in finance: a ReentrantLock in a Spring singleton protects one JVM. Twenty pods updating one account need the database, idempotency, or partition ownership — not a Java lock. And I never hold a lock across HTTP or DB calls, or the thread pool starves while CPU looks idle.`;
