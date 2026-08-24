import type {ConceptBlock} from './types';

export const AQS_CONCEPT: ConceptBlock = {
  id: 'aqs',
  title: 'ReentrantLock internals — AQS mental model',
  why: 'Almost all java.util.concurrent locks/semaphores share one engine: AbstractQueuedSynchronizer.',
  analogy: 'AQS is the ticket counter: state says who owns the booth; the queue is the line; park is sitting until called.',
  flow: `Thread
   |
   v
ReentrantLock
   |
   v
Sync (FairSync / NonfairSync)
   |
   v
AQS
   |-- state (int): 0 free; >0 exclusive hold count
   |-- exclusiveOwnerThread
   |-- CLH-style wait queue (Node linked list)
   |
   v
LockSupport.park / unpark`,
  code: `// Simplified exclusive acquire (mental model, not JDK source)
boolean tryAcquire(int acquires) {
  if (state == 0 && CAS(state, 0, acquires)) {
    setExclusiveOwnerThread(current);
    return true;
  }
  if (current == exclusiveOwnerThread) {
    state += acquires; // reentrancy
    return true;
  }
  return false;
}

void lock() {
  if (!tryAcquire(1)) {
    // enqueue Node, then loop: park until predecessor signals
    acquireQueued(addWaiter());
  }
}

void unlock() {
  if (tryRelease(1) /* hold → 0 */) {
    unparkSuccessor(); // wake next waiter
  }
}`,
  diagram: `flowchart TB
  T[Thread] --> RL[ReentrantLock]
  RL --> S[Sync]
  S --> AQS[AQS]
  AQS --> ST[state]
  AQS --> Q[wait queue]
  Q --> P[LockSupport.park]`,
  finance: 'Under payment spikes, most threads sit in AQS queue parked — CPU looks low, latency looks terrible.',
  failure: 'Misunderstanding park as "sleep" — they wake on unpark/interrupt/spurious, then must re-check state.',
  debug: 'jstack: threads in TIMED_WAITING/WAITING on AbstractQueuedSynchronizer$ConditionObject or park; look for lock owner.',
  whenNot: 'Do not reimplement AQS in app code — use the Lock APIs.',
  interviewQ: 'What happens when lock.lock() cannot acquire immediately?',
  hook: 'AQS = state + queue + park. ReentrantLock is a thin policy over AQS.',
};

export const FAIR_CONCEPT: ConceptBlock = {
  id: 'fair',
  title: 'Fair vs non-fair ReentrantLock',
  why: 'Barging improves throughput; fairness reduces starvation at the cost of context switches.',
  analogy: 'Non-fair: newcomer can cut if the lock frees as they arrive. Fair: honor the queue.',
  flow: `Non-Fair
T1 owns lock
T2 ---- waiting
T3 ---- waiting
T4 arrives → may acquire before T2/T3

Fair (new ReentrantLock(true))
T4 arrives → waits; T2 gets first opportunity

Note: "fair" ≈ hasQueuedPredecessors check — not magical absolute wall-clock FIFO.`,
  code: `ReentrantLock unfair = new ReentrantLock();      // default
ReentrantLock fair   = new ReentrantLock(true);`,
  diagram: `flowchart LR
  NF[Non-fair: barge OK] --> TH[Higher throughput]
  F[Fair: queue first] --> LAT[More fair latency / less starvation]`,
  finance: 'Ledger writers: unfair usually fine. Customer-facing "first request must not wait forever behind bargers" → consider fair or tryLock+queue outside.',
  failure: 'Fair lock under extreme contention → thrashing; unfair under continuous barging → rare starvation of a waiter.',
  debug: 'Measure p99 wait time; ThreadMXBean / async-profiler lock profiles; compare fair vs unfair under load test.',
  whenNot: 'Default to non-fair unless you have a measured starvation problem.',
  interviewQ: 'Does fair ReentrantLock guarantee absolute FIFO?',
  hook: 'Non-fair barges for speed; fair lines up for equity.',
};

export const TRYLOCK_CONCEPT: ConceptBlock = {
  id: 'trylock',
  title: 'tryLock() and timed tryLock',
  why: 'Avoid indefinite blocking; bound wait to an SLA; detect contention; help break deadlock cycles.',
  analogy: 'Knock once (or wait 500ms). If the vault is busy, fail the request or take another path — do not stand forever.',
  flow: `Payment processing
        |
        v
Need account lock
        |
        v
Lock already held
        |
        +---- wait ≤ 500 ms
        |
        +---- acquired → process
        |
        +---- timeout → reject / retry / async`,
  code: `if (lock.tryLock()) {
  try {
    process();
  } finally {
    lock.unlock();
  }
} else {
  // contended path
}

if (lock.tryLock(500, TimeUnit.MILLISECONDS)) {
  try {
    process();
  } finally {
    lock.unlock();
  }
} else {
  throw new LockTimeoutException("account busy");
}`,
  diagram: `flowchart TB
  T[tryLock] -->|true| W[work + unlock]
  T -->|false| F[fail fast]
  TT[tryLock timeout] -->|acquired| W
  TT -->|timeout| F`,
  finance: 'Card auth must answer in <N ms. Blocking forever on a contended account lock violates the SLA even if "correct".',
  failure: 'Ignoring false from tryLock (silent skip) → lost updates; nesting tryLock without unlock discipline → leaks.',
  debug: 'Metrics: tryLock fail rate, timeout rate; correlate with account hot keys.',
  whenNot: 'When waiting is required for correctness (must serialize and complete) — use lock/lockInterruptibly with backpressure elsewhere.',
  interviewQ: 'When is tryLock dangerous in payments?',
  hook: 'tryLock = bound the wait or bail — protects latency SLAs.',
};

export const INTERRUPT_CONCEPT: ConceptBlock = {
  id: 'interrupt',
  title: 'lockInterruptibly() vs lock()',
  why: 'Cancellation, request timeouts, and shutdown must stop waiting for locks — not ignore interrupts.',
  analogy: 'You are in line for the vault. The fire alarm (interrupt) must let you leave the line.',
  flow: `Request
   |
   v
Thread waits for lock
   |
   v
Request timeout / cancel
   |
   v
Interrupt thread
   |
   v
lockInterruptibly → throws InterruptedException
(lock() ignores interrupt while waiting — interrupt status may be set later)`,
  code: `try {
  lock.lockInterruptibly();
  try {
    work();
  } finally {
    lock.unlock();
  }
} catch (InterruptedException e) {
  Thread.currentThread().interrupt();
  // abort request
}`,
  diagram: `sequenceDiagram
  participant R as Request
  participant T as Worker
  participant L as Lock
  R->>T: start
  T->>L: lockInterruptibly (waiting)
  R->>T: interrupt (timeout)
  L-->>T: InterruptedException`,
  finance: 'Payment timeout cancels the worker; stuck lock waits keep pool threads forever → cascading 504s.',
  failure: 'Swallowing InterruptedException without restore → pool never cancels cleanly.',
  debug: 'Thread dump + interrupt status; framework timeout configs (Tomcat/WebFlux) vs lock waits.',
  whenNot: 'Tiny uninterruptible critical sections where cancel is meaningless — still prefer finally unlock.',
  interviewQ: 'Difference between lock() and lockInterruptibly() when waiting?',
  hook: 'lockInterruptibly = waiting is cancelable.',
};

export const UNLOCK_PATTERN: ConceptBlock = {
  id: 'unlock',
  title: 'Correct unlock pattern',
  why: 'Any exception between lock and unlock leaks the lock forever for that owner path.',
  analogy: 'Leaving the vault door locked with the key inside — everyone else queues until the building burns.',
  flow: `Lock never released
       |
       v
Other threads wait
       |
       v
Queue grows
       |
       v
Thread pool blocked
       |
       v
Latency ↑ → outage`,
  code: `// DANGEROUS
lock.lock();
doSomething(); // exception → unlock never runs
lock.unlock();

// CORRECT
lock.lock();
try {
  doSomething();
} finally {
  lock.unlock();
}`,
  diagram: `flowchart TB
  Bad[lock then work then unlock] -->|exception| Leak[hold forever]
  Good[lock try finally unlock] --> Safe[always release]`,
  finance: 'One NPE after lock in settlement path can freeze an account shard and take down the pod\'s pool.',
  failure: 'Unlock without hold; double unlock; unlock on another thread.',
  debug: 'Thread dump: one owner forever; getHoldCount; heap dump rarely needed — look for missing finally.',
  whenNot: 'Prefer synchronized when you do not need Lock features — automatic release.',
  interviewQ: 'What is the production blast radius of skipping unlock?',
  hook: 'Always unlock in finally — no exceptions.',
};
