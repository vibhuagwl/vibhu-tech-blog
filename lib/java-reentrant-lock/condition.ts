import type {ConceptBlock} from './types';

export const CONDITION_CONCEPT: ConceptBlock = {
  id: 'condition',
  title: 'ReentrantLock + Condition',
  why: 'One monitor has one wait set. Producers/consumers need separate predicates (notEmpty vs notFull) without notifyAll storms.',
  analogy: 'Two doorbells on the same locked room: "shelf empty" and "shelf full" — wake only the right waiters.',
  flow: `                    Lock
                     |
          +----------+----------+
          |                     |
     notEmpty                notFull
          |                     |
       Consumers             Producers`,
  code: `final ReentrantLock lock = new ReentrantLock();
final Condition notEmpty = lock.newCondition();
final Condition notFull  = lock.newCondition();

void enqueue(Payment p) throws InterruptedException {
  lock.lock();
  try {
    while (queue.isFull()) notFull.await();
    queue.add(p);
    notEmpty.signal();
  } finally {
    lock.unlock();
  }
}

Payment dequeue() throws InterruptedException {
  lock.lock();
  try {
    while (queue.isEmpty()) notEmpty.await();
    Payment p = queue.remove();
    notFull.signal();
    return p;
  } finally {
    lock.unlock();
  }
}`,
  diagram: `flowchart TB
  L[ReentrantLock] --> NE[Condition notEmpty]
  L --> NF[Condition notFull]
  NE --> C[Consumers await]
  NF --> P[Producers await]`,
  finance: 'Inbound payment buffer: acquirers push, settlement workers pull — bounded queue with two conditions.',
  failure: 'signal() without holding lock; using if instead of while; single Condition for two predicates.',
  debug: 'Threads waiting on ConditionObject; queue size metrics stuck at 0 or capacity.',
  whenNot: 'Prefer BlockingQueue unless you need custom multi-condition logic.',
  interviewQ: 'Why prefer Condition over wait/notify for a bounded payment queue?',
  hook: 'Condition = named wait set under an explicit Lock.',
};

export const AWAIT_CONCEPT: ConceptBlock = {
  id: 'await',
  title: 'await() step-by-step',
  why: 'await is not sleep — it drops the lock so others can make the condition true, then reacquires before returning.',
  analogy: 'You leave the meeting room (release lock), wait in the lobby (park), get called back, then must reclaim the room key before speaking.',
  flow: `Thread holds lock
  |
  v
await()
  |
  +---- release lock
  |
  +---- enter condition wait set + park
  |
  +---- signal / interrupt / spurious
  |
  +---- compete to reacquire lock
  |
  v
continue (predicate may still be false → loop)`,
  code: `lock.lock();
try {
  while (!ready) {
    condition.await(); // unlock → wait → relock
  }
  // critical section with invariant true
} finally {
  lock.unlock();
}`,
  diagram: `sequenceDiagram
  participant T as Thread
  participant L as Lock
  participant C as Condition
  T->>L: hold
  T->>C: await
  C->>L: release
  C->>T: park
  Note over C: signal
  C->>T: wake
  T->>L: reacquire
  T->>T: re-check predicate`,
  finance: 'Settlement batch waits until cutoff window opens — must not hold the ledger lock while parked.',
  failure: 'Assuming after await the predicate is true without re-check.',
  debug: 'Dump shows WAITING on Condition; owner of lock is another thread progressing the queue.',
  whenNot: 'Do not await without owning the lock — IllegalMonitorStateException.',
  interviewQ: 'List the steps await() performs regarding the lock.',
  hook: 'await = unlock → wait → relock → re-check.',
};

export const SPURIOUS_CONCEPT: ConceptBlock = {
  id: 'spurious',
  title: 'Spurious wakeups — always while, never if',
  why: 'Threads can wake without a matching signal. Predicate must be revalidated.',
  analogy: 'Doorbell rings, you open the door — nobody there. You do not assume the pizza arrived; you check again.',
  flow: `while (!conditionSatisfied()) {
  condition.await();
}

// NOT
if (!conditionSatisfied()) {
  condition.await();
}`,
  code: `// Correct
while (queue.isEmpty()) {
  notEmpty.await();
}

// Wrong — may proceed on empty queue after spurious/early wake
if (queue.isEmpty()) {
  notEmpty.await();
}`,
  diagram: `flowchart TB
  W[wake] --> Check{predicate true?}
  Check -->|no| Await[await again]
  Check -->|yes| Work[proceed]`,
  finance: 'Empty payment queue → consumer processes null/optional empty → NPE or phantom settle.',
  failure: 'Rare in tests, intermittent in prod under load.',
  debug: 'Add assert predicate after await in debug builds; look for "impossible" empty-queue processing.',
  whenNot: 'N/A — always loop for condition waits.',
  interviewQ: 'Why is while mandatory around await?',
  hook: 'Wake ≠ ready — while rechecks the invariant.',
};
