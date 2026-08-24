import type {ConceptBlock, DecisionRow} from './types';

export const PROGRESSION = `Race Condition
      |
      v
Need Mutual Exclusion
      |
      v
synchronized
      |
      v
Need More Control (tryLock / interrupt / fairness / Condition)
      |
      v
ReentrantLock
      |
      v
Need Multiple Wait Sets
      |
      v
Condition
      |
      v
Reads Dominate Writes
      |
      v
ReentrantReadWriteLock
      |
      v
Need Optimistic Reads (measured)
      |
      v
StampedLock
      |
      v
Multiple JVMs / pods
      |
      v
Java Lock is NOT enough
      |
      v
DB row lock / Distributed lease / Kafka partition ordering`;

export const RACE_CONCEPT: ConceptBlock = {
  id: 'race',
  title: 'Why locking exists — concurrent withdrawals',
  why: 'Shared mutable state + concurrent check-then-act without mutual exclusion invents or loses money.',
  analogy: 'Two tellers both see ₹10,000 in the drawer, both hand out cash, neither updates before the other — the bank is short.',
  flow: `Account Balance = ₹10,000

Thread A                    Thread B
   |                            |
   | withdraw ₹7,000            | withdraw ₹6,000
   |                            |
   +------------+---------------+
                |
                v
          Shared Balance

Without Lock
Read ₹10,000
Read ₹10,000
Write ₹3,000
Write ₹4,000
Final = ₹4,000
Expected = one reject`,
  code: `// Broken check-then-act
if (balance >= amount) {
  balance -= amount; // another thread can pass the check in this window
}`,
  diagram: `sequenceDiagram
  participant A as Thread A
  participant B as Thread B
  participant Acc as Balance
  A->>Acc: read 10000
  B->>Acc: read 10000
  A->>Acc: write 3000
  B->>Acc: write 4000
  Note over Acc: Lost update / invented money`,
  finance: 'Payment auth that "succeeds" twice against one balance is a correctness incident, not a latency bug — audit + reconciliation will fire.',
  failure: 'Negative balances, double settlement, chargebacks, regulatory breaches.',
  debug: 'Reproduce with stress + assert invariants; thread dumps rarely show the race — write race detectors / property tests.',
  whenNot: 'Immutable snapshots, single-writer queues, or DB-owned invariants already serialize the critical path.',
  interviewQ: 'Show a race that passes unit tests but fails under load — what invariant broke?',
  hook: 'Race = two truths written; lock makes check-then-act one truth.',
};

export const MENTAL_MODEL = `                 JAVA LOCKING (one JVM)
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
                        Optimistic Read (+ validate)`;

export const REENTRANCY_CONCEPT: ConceptBlock = {
  id: 'reentrancy',
  title: 'What "reentrant" actually means',
  why: 'Same thread may re-enter a critical section (helper methods, inheritance). Without reentrancy you deadlock yourself.',
  analogy: 'You already hold the vault key. Asking for the same key again must succeed with a hold-count, or you wait forever for yourself.',
  flow: `Thread T1
   |
   +-- lock()          hold count = 1
   |
   +-- methodB()
         |
         +-- lock()    hold count = 2
         +-- unlock()  hold count = 1
   +-- unlock()        hold count = 0 → released

Another thread cannot acquire while hold count > 0.
Only the owner may unlock; wrong unlock → IllegalMonitorStateException.`,
  code: `class AccountService {
  private final ReentrantLock lock = new ReentrantLock();

  void methodA() {
    lock.lock();
    try {
      methodB(); // re-enters same lock
    } finally {
      lock.unlock();
    }
  }

  void methodB() {
    lock.lock();
    try {
      // work
    } finally {
      lock.unlock();
    }
  }
}`,
  diagram: `flowchart TB
  L[lock] --> H1[hold=1 owner=T1]
  H1 --> L2[lock again]
  L2 --> H2[hold=2]
  H2 --> U1[unlock]
  U1 --> H1b[hold=1]
  H1b --> U2[unlock]
  U2 --> Free[hold=0 free]`,
  finance: 'debit() calling validateLimits() that also locks the same account — common in nested payment services.',
  failure: 'Non-reentrant lock (or StampedLock misuse) → self-deadlock under nested calls.',
  debug: 'jstack: same thread waiting on a lock it already owns (rare wording) — more often: hold count mismatch / unlock from wrong thread.',
  whenNot: 'Need non-reentrant semantics intentionally (StampedLock) — then never nest acquisitions of the same stamp/lock.',
  interviewQ: 'Can another thread unlock a ReentrantLock? What happens?',
  hook: 'Reentrant = same owner, hold-count++, unlock until zero.',
};

export const SYNC_VS_RL: DecisionRow[] = [
  {requirement: 'Simple mutual exclusion', choose: 'synchronized', why: 'Auto unlock, JVM-optimized, least foot-guns'},
  {requirement: 'tryLock / timeout', choose: 'ReentrantLock', why: 'API not available on monitors'},
  {requirement: 'Interruptible wait for lock', choose: 'lockInterruptibly()', why: 'Cancel waiting workers cleanly'},
  {requirement: 'Multiple wait sets', choose: 'ReentrantLock + Condition', why: 'Separate notEmpty / notFull queues'},
  {requirement: 'Fairness option', choose: 'ReentrantLock(true)', why: 'Reduce starvation (cost: throughput)'},
  {requirement: 'Many readers, rare writers', choose: 'ReentrantReadWriteLock', why: 'Concurrent readers'},
  {requirement: 'Optimistic read path', choose: 'StampedLock', why: 'Validate stamp; no reentrancy'},
  {requirement: 'Cross-JVM correctness', choose: 'DB / distributed / Kafka', why: 'Java lock is process-local'},
];

export const SYNC_VS_RL_TABLE: string[][] = [
  ['Aspect', 'synchronized', 'ReentrantLock'],
  ['Ownership', 'Monitor (implicit)', 'Explicit Lock owner'],
  ['Unlock', 'Automatic on exit', 'Must unlock in finally'],
  ['Reentrancy', 'Yes', 'Yes (hold count)'],
  ['Fairness', 'Not configurable', 'Fair or non-fair'],
  ['tryLock', 'No', 'Yes (+ timed)'],
  ['Interruptible acquire', 'No (wait is interruptible)', 'lockInterruptibly()'],
  ['Conditions', 'One wait set per monitor', 'Multiple Condition objects'],
  ['Monitoring', 'Limited', 'getQueueLength, isHeldByCurrentThread…'],
  ['Performance', 'Biased/lock coarsening friendly', 'Comparable; depends on contention'],
  ['Error handling', 'Hard to leak', 'Easy to leak if unlock skipped'],
  ['Deadlock risk', 'Same class of bugs', 'Same + more nested APIs'],
  ['Maintainability', 'Simpler', 'More power, more discipline'],
];

export const OVERVIEW_HOOKS = [
  'synchronized = mutual exclusion with automatic unlock.',
  'ReentrantLock = explicit lock + unlock + advanced control.',
  'Condition = wait sets under one Lock (notEmpty / notFull).',
  'ReadWriteLock = many readers OR one writer.',
  'StampedLock = optimistic read when retry is acceptable.',
  'AQS = shared state + CLH-style wait queue + park/unpark.',
  'Java lock ≠ distributed lock.',
];
