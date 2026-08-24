import type {ConceptBlock, ScenarioChoice} from './types';

export const RW_CONCEPT: ConceptBlock = {
  id: 'rw',
  title: 'ReentrantReadWriteLock — the problem it solves',
  why: 'Exclusive locks serialize readers. When reads dominate, concurrent readers boost throughput.',
  analogy: 'Library: many people may read the same book copy rules; only one librarian may rewrite the catalog.',
  flow: `Account Configuration
1000 READ threads · 10 WRITE threads

Exclusive lock → everything serialized
RW lock → readers concurrent; writer exclusive

        Read Lock
     /      |      \\
   R1      R2      R3
     \\      |      /
      concurrent

Write Lock → exclusive`,
  code: `ReentrantReadWriteLock rwl = new ReentrantReadWriteLock();
Lock read = rwl.readLock();
Lock write = rwl.writeLock();

read.lock();
try { return config; }
finally { read.unlock(); }

write.lock();
try { config = updated; }
finally { write.unlock(); }`,
  diagram: `flowchart TB
  R[Readers] -->|shared| RL[ReadLock]
  W[Writer] -->|exclusive| WL[WriteLock]
  RL -.->|blocks| W
  WL -.->|blocks| R`,
  finance: 'FX rate / risk parameter tables: huge read fan-out, rare admin updates.',
  failure: 'Write-heavy workload → RW overhead loses to plain ReentrantLock.',
  debug: 'Reader count high while writer wait time grows → starvation or unfair policy.',
  whenNot: 'Short critical sections; write-heavy; need optimistic path → consider StampedLock or ConcurrentHashMap.',
  interviewQ: 'When does ReadWriteLock hurt more than help?',
  hook: 'ReadWriteLock = many readers OR one writer.',
};

export const RW_MATRIX: string[][] = [
  ['Current holder', 'New reader', 'New writer'],
  ['Reader(s)', 'Allowed (shared)', 'Blocked'],
  ['Writer', 'Blocked', 'Blocked'],
];

export const RW_REENTRANCY = `Read lock reentrancy: same thread may acquire readLock multiple times; unlock matching times.
Write lock reentrancy: same for writeLock; write hold count.
Ownership is per-thread for write; read holds tracked per-thread.
When counts reach zero, lock frees for others.

writeLock.lock(); writeLock.lock(); // hold=2
writeLock.unlock(); // hold=1 still exclusive
writeLock.unlock(); // free`;

export const UPGRADE_CONCEPT: ConceptBlock = {
  id: 'upgrade',
  title: 'Read → write upgrade can deadlock',
  why: 'A reader waiting for write still holds a read lock, blocking writers — including itself and peers.',
  analogy: 'Everyone reading a document refuses to leave until they can edit — so nobody can get exclusive edit.',
  flow: `Thread A: readLock → wants writeLock → WAIT
Thread B: readLock → wants writeLock → WAIT
Both still hold read → writer never proceeds → deadlock`,
  code: `// DANGEROUS — do not upgrade like this
readLock.lock();
try {
  if (needsUpdate()) {
    writeLock.lock(); // may deadlock with other readers
    try { update(); }
    finally { writeLock.unlock(); }
  }
} finally {
  readLock.unlock();
}

// Better: release read, then take write; re-check
readLock.lock();
boolean need;
try { need = needsUpdate(); }
finally { readLock.unlock(); }
if (need) {
  writeLock.lock();
  try {
    if (needsUpdate()) update(); // re-check under write
  } finally {
    writeLock.unlock();
  }
}`,
  diagram: `sequenceDiagram
  participant A as Thread A
  participant B as Thread B
  participant L as RWLock
  A->>L: readLock
  B->>L: readLock
  A->>L: writeLock (wait)
  B->>L: writeLock (wait)
  Note over A,B: deadlock — readers block writers`,
  finance: 'Config refresh under read, then "promote" to write on stale — classic hang under dual refresh.',
  failure: 'Cluster of threads stuck; writer queue never drains.',
  debug: 'jstack: threads holding read, waiting for write; no write owner.',
  whenNot: 'Never treat upgrade as a supported atomic op on RRWL.',
  interviewQ: 'Why can read-to-write upgrade deadlock?',
  hook: 'Upgrade while holding read = invite deadlock.',
};

export const DOWNGRADE_CONCEPT: ConceptBlock = {
  id: 'downgrade',
  title: 'Write → read downgrade is supported',
  why: 'Writer may acquire read while still holding write, then release write — atomically move to shared mode without a gap.',
  analogy: 'Editor finishes editing, keeps a reader badge before dropping editor rights — never leaves the book unlocked in between.',
  flow: `writeLock.lock()
  update()
  readLock.lock()     // reentrant path: allowed while holding write
  writeLock.unlock()  // now shared reader
  ... read ...
  readLock.unlock()`,
  code: `writeLock.lock();
try {
  update();
  readLock.lock();
  try {
    // continue observing consistent state
  } finally {
    readLock.unlock();
  }
} finally {
  writeLock.unlock();
}`,
  diagram: `flowchart LR
  W[Write exclusive] --> Both[Write+Read held]
  Both --> R[Read only after write unlock]`,
  finance: 'After mutating risk limits, stay in read mode to serve subsequent lookups without allowing another writer in the gap.',
  failure: 'Forgetting to unlock write after downgrade → still exclusive.',
  debug: 'getWriteHoldCount / getReadHoldCount while testing.',
  whenNot: 'If you do not need continuity, just unlock write and take read later (gap allows writers).',
  interviewQ: 'Why is downgrade safe but upgrade not?',
  hook: 'Downgrade OK; upgrade not a simple op.',
};

export const STARVATION_CONCEPT: ConceptBlock = {
  id: 'starvation',
  title: 'Writer starvation under continuous readers',
  why: 'Unfair RRWL can let new readers barge while a writer waits — writer never runs.',
  analogy: 'A continuous stream of customers entering a shop; the restocker never gets sole access to the aisle.',
  flow: `Continuous readers R1..Rn
Writer W1 waiting
Unfair: new readers keep arriving → writer starves
Fair RRWL(true): readers/writers honor queue → writer progresses`,
  code: `new ReentrantReadWriteLock();      // non-fair default
new ReentrantReadWriteLock(true);  // fair — helps writers under read storms`,
  diagram: `flowchart TB
  R[Reader flood] --> U[Unfair policy]
  U --> S[Writer waits forever]
  F[Fair policy] --> P[Writer eventually runs]`,
  finance: 'Market data: 100k readers, 10 writers — unfair can starve price updates.',
  failure: 'Stale risk parameters forever under read load.',
  debug: 'Writer wait time histograms; fair vs unfair A/B under synthetic readers.',
  whenNot: 'Fairness costs throughput — measure before flipping production.',
  interviewQ: 'Can ReentrantReadWriteLock starve writers?',
  hook: 'Reader flood + unfair = writer starvation risk.',
};

export const STAMPED_CONCEPT: ConceptBlock = {
  id: 'stamped',
  title: 'StampedLock — optimistic reads',
  why: 'When reads dominate and brief inconsistency/retry is OK, avoid reader lock traffic.',
  analogy: 'Glance at the board (optimistic), check the ticket number still matches (validate); if someone rewrote the board, glance again.',
  flow: `Optimistic Read
      |
      v
Read values
      |
      v
validate(stamp)
   /       \\
 valid    invalid
  |          |
 return    retry / convert to read lock`,
  code: `StampedLock sl = new StampedLock();

long stamp = sl.tryOptimisticRead();
double x = this.x, y = this.y;
if (!sl.validate(stamp)) {
  stamp = sl.readLock();
  try {
    x = this.x; y = this.y;
  } finally {
    sl.unlockRead(stamp);
  }
}
return Math.hypot(x, y);`,
  diagram: `flowchart TB
  O[tryOptimisticRead] --> R[read fields]
  R --> V{validate?}
  V -->|yes| OK[use values]
  V -->|no| RL[readLock + retry]`,
  finance: 'In-memory FX mid price for display — rare update, many reads; retry OK.',
  failure: 'No reentrancy — nested stamped acquires deadlock; calling methods that re-lock same StampedLock.',
  debug: 'High retry rates → write too hot; optimistic path loses.',
  whenNot: 'Need reentrancy, Conditions, or simple code — prefer RRWL/ReentrantLock.',
  interviewQ: 'Why might StampedLock beat ReadWriteLock — and when not?',
  hook: 'StampedLock = optimistic read + stamp validate.',
};

export const LOCK_SCENARIOS: ScenarioChoice[] = [
  {
    id: 'a',
    name: 'Scenario A — mostly reads, rare writes',
    situation: 'Config/rate tables, huge read fan-out.',
    choose: 'ReentrantReadWriteLock (or StampedLock if measured)',
    why: 'Shared readers; exclusive rare writers.',
  },
  {
    id: 'b',
    name: 'Scenario B — heavy writes',
    situation: 'Hot account mutations, write-heavy ledger shard.',
    choose: 'ReentrantLock (or synchronized)',
    why: 'RW overhead wastes time when writers dominate.',
  },
  {
    id: 'c',
    name: 'Scenario C — need reentrancy',
    situation: 'Nested service methods on same guard.',
    choose: 'ReentrantLock / RRWL / synchronized — not StampedLock',
    why: 'StampedLock is not reentrant.',
  },
  {
    id: 'd',
    name: 'Scenario D — need optimistic reads',
    situation: 'Ultra-hot read path, rare writers, retry OK.',
    choose: 'StampedLock',
    why: 'Avoid reader lock traffic when validate succeeds.',
  },
  {
    id: 'e',
    name: 'Scenario E — need conditions',
    situation: 'Bounded payment queue, multiple wait predicates.',
    choose: 'ReentrantLock + Condition',
    why: 'StampedLock/RRWL are weak for rich Condition patterns (write lock has one Condition; stamped has none like RL).',
  },
];

export const LOCK_COMPARISON: string[][] = [
  ['Aspect', 'synchronized', 'ReentrantLock', 'RRWL', 'StampedLock'],
  ['Read concurrency', 'No', 'No', 'Yes', 'Yes (+ optimistic)'],
  ['Write concurrency', 'Exclusive', 'Exclusive', 'Exclusive', 'Exclusive'],
  ['Reentrancy', 'Yes', 'Yes', 'Yes', 'No'],
  ['Fairness', 'N/A', 'Optional', 'Optional', 'Limited'],
  ['tryLock', 'No', 'Yes', 'Yes', 'Yes'],
  ['Interruptible', 'Limited', 'Yes', 'Yes', 'Yes'],
  ['Conditions', '1 wait set', 'Many', 'Write Condition', 'No'],
  ['Complexity', 'Low', 'Medium', 'Higher', 'Highest'],
  ['Best for', 'Simple mutex', 'Control APIs', 'Read-heavy', 'Optimistic read'],
];
