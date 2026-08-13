import type {TopicCard} from './types';

export const TOPICS_A: TopicCard[] = [
  {
    id: 'thread',
    title: 'Thread',
    since: 'Java 1.0',
    status: 'FINAL',
    story: 'Bank employee = Thread. start() = clock in and begin work. join() = wait until they finish the shift.',
    whenToUse: 'Rarely create raw Threads in production — prefer executors / virtual threads.',
    whenAvoid: 'Unmanaged Thread per request at scale; forgetting interruption/join.',
    methods: ['start','run','join','interrupt','isInterrupted','sleep','yield','setDaemon','getState','currentThread'],
    internals: 'Platform Thread ≈ OS thread. Virtual Thread (21+) is JVM-scheduled onto carriers.',
    mermaid: `stateDiagram-v2
  [*] --> NEW
  NEW --> RUNNABLE: start()
  RUNNABLE --> BLOCKED: monitor wait
  RUNNABLE --> WAITING: wait/join/park
  RUNNABLE --> TIMED_WAITING: sleep/timed wait
  BLOCKED --> RUNNABLE
  WAITING --> RUNNABLE
  TIMED_WAITING --> RUNNABLE
  RUNNABLE --> TERMINATED: run ends`,
    fixedCode: `public class ThreadLifecycleDemo {
  public static void main(String[] args) throws Exception {
    Thread t = new Thread(() -> {
      System.out.println(Thread.currentThread().getName() + " RUNNING");
      try { Thread.sleep(50); } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
      }
    }, "teller-1");
    System.out.println("state=" + t.getState()); // NEW
    t.start();
    System.out.println("after start=" + t.getState()); // RUNNABLE or TIMED_WAITING
    t.join();
    System.out.println("after join=" + t.getState()); // TERMINATED
  }
}`,
    timeline: `NEW → start → RUNNABLE → sleep → TIMED_WAITING → RUNNABLE → end → TERMINATED`,
    expectedOutput: `state=NEW
after start=RUNNABLE
teller-1 RUNNING
after join=TERMINATED`,
    production: 'Prefer ThreadFactory + pools; use UncaughtExceptionHandler for observability.',
    pros: ['Explicit control','Clear mental model','Daemon for helpers'],
    cons: ['Expensive platform threads','Easy to leak','Hard to size'],
    interview30s: 'Thread is a unit of concurrent execution. Prefer managed executors; know states NEW→RUNNABLE→BLOCKED/WAITING/TIMED_WAITING→TERMINATED.',
    followUp: 'What does interrupt() actually do to a thread in sleep vs a busy loop?',
    memoryTrick: 'Thread = bank employee on a shift.',
    whatHappensInternally: `start()
  → JVM creates/schedules native or virtual execution
  → run() invoked on that thread
  → termination clears resources / notifies joiners`,
  },
  {
    id: 'runnable-callable',
    title: 'Runnable vs Callable',
    since: 'Runnable 1.0 / Callable Java 5',
    status: 'FINAL',
    story: 'Runnable = do chores, bring nothing back. Callable = do chores and return a payment receipt (or throw).',
    whenToUse: 'Callable when you need a result/exception via Future.',
    whenAvoid: 'Runnable when you need typed results — you will invent side channels.',
    methods: ['run()','call()','ExecutorService.submit(Callable)'],
    internals: 'submit(Callable) wraps as FutureTask; exceptions become ExecutionException on get().',
    mermaid: `flowchart LR
  R[Runnable.run] --> V[void]
  C[Callable.call] --> RES[V result]
  C --> EX[checked Exception]`,
    fixedCode: `import java.util.concurrent.*;

public class CallablePaymentDemo {
  public static void main(String[] args) throws Exception {
    ExecutorService ex = Executors.newSingleThreadExecutor();
    Future<String> f = ex.submit(() -> {
      // payment authorization
      return "AUTH-OK";
    });
    System.out.println(f.get(1, TimeUnit.SECONDS));
    ex.shutdown();
    ex.awaitTermination(2, TimeUnit.SECONDS);
  }
}`,
    timeline: `main submit → worker call → Future done → get returns AUTH-OK`,
    expectedOutput: `AUTH-OK`,
    production: 'Prefer Callable for payment/fraud checks that return decisions.',
    pros: ['Typed results','Checked exceptions surface via Future'],
    cons: ['get() blocks','Need timeouts'],
    interview30s: 'Runnable returns void; Callable returns V and may throw. submit wraps into Future.',
    followUp: 'How does execute(Runnable) differ from submit(Runnable) on exceptions?',
    memoryTrick: 'Callable brings the receipt home.',
    whatHappensInternally: `submit(callable) → new FutureTask(callable) → execute → set result/exception`,
  },
  {
    id: 'jmm',
    title: 'Java Memory Model',
    since: 'JSR-133 (Java 5 era formalization)',
    status: 'FINAL',
    story: 'Each teller has a sticky note (CPU cache). Without rules, sticky notes disagree with the vault ledger (main memory).',
    whenToUse: 'Reason about visibility/ordering for every shared mutable field.',
    whenAvoid: 'Assuming sequential consistency without sync/volatile/atomic/final publication.',
    methods: ['happens-before edges: unlock→lock, volatile write→read, start, join'],
    internals: 'JMM defines legal reorderings and visibility. Not a single CPU instruction mapping.',
    mermaid: `flowchart TB
  A[Thread A CPU cache] --- M[Main Memory / Heap]
  B[Thread B CPU cache] --- M`,
    brokenCode: `class BrokenPublish {
  static int data;
  static boolean ready; // NOT volatile
  // A: data=100; ready=true;
  // B: if(ready) print data; // may see 0
}`,
    fixedCode: `public class JmmVolatilePublish {
  static int data;
  static volatile boolean ready;

  public static void main(String[] args) throws Exception {
    Thread b = new Thread(() -> {
      while (!ready) { Thread.onSpinWait(); }
      System.out.println("data=" + data); // must see 100
    });
    b.start();
    data = 100;
    ready = true; // volatile write publishes data write
    b.join();
  }
}`,
    timeline: `A writes data=100 → volatile ready=true  ===HB===  B reads ready → reads data=100`,
    expectedOutput: `data=100`,
    production: 'Prefer immutable DTOs + volatile publication or concurrent collections for safe publish.',
    pros: ['Precise rules','Portable across CPUs'],
    cons: ['Easy to get wrong','Hard to test races'],
    interview30s: 'JMM defines when one thread’s writes become visible and ordered relative to another via happens-before.',
    followUp: 'List five happens-before sources you use in production code.',
    memoryTrick: 'Happens-before = the ledger rules between sticky notes.',
    whatHappensInternally: `volatile write flushes/orders; unlock flushes; lock acquires; join waits for termination writes`,
  },
  {
    id: 'synchronized',
    title: 'synchronized',
    since: 'Java 1.0',
    status: 'FINAL',
    story: 'One physical key for a vault room. Only the key holder enters; unlock hands the key to a waiter.',
    whenToUse: 'Simple critical sections; structured locking; auto unlock.',
    whenAvoid: 'Need tryLock/timeout/multiple Conditions; long I/O under lock.',
    methods: ['synchronized method','synchronized(obj)','wait/notify on same monitor'],
    internals: 'monitorenter/monitorexit; ObjectMonitor owner + entry set + wait set. Reentrant.',
    mermaid: `flowchart TB
  OBJ[Account object] --> MON[Monitor]
  MON --> OWN[Owner ThreadA]
  MON --> ENTRY[Entry contenders B,C]
  MON --> WAIT[Wait set D]`,
    brokenCode: `class Account { int bal=1000; void withdraw(int a){ if(bal>=a) bal-=a; } }`,
    fixedCode: `import java.util.concurrent.*;

public class SynchronizedPaymentDemo {
  static class Account {
    private int balance = 1000;
    public synchronized void withdraw(int amount) {
      if (balance >= amount) {
        System.out.println(Thread.currentThread().getName() + " ok " + amount);
        balance -= amount;
      } else {
        System.out.println(Thread.currentThread().getName() + " reject");
      }
    }
    public synchronized int getBalance() { return balance; }
  }
  public static void main(String[] args) throws Exception {
    Account a = new Account();
    ExecutorService ex = Executors.newFixedThreadPool(2);
    ex.submit(() -> a.withdraw(700));
    ex.submit(() -> a.withdraw(700));
    ex.shutdown();
    ex.awaitTermination(2, TimeUnit.SECONDS);
    System.out.println("balance=" + a.getBalance());
  }
}`,
    timeline: `T1 lock → withdraw 700 → unlock → T2 lock → reject → unlock → balance=300`,
    expectedOutput: `... ok 700
... reject
balance=300`,
    production: 'Keep critical sections tiny. Never call remote HTTP while holding a monitor.',
    pros: ['Simple','Auto unlock','HB guarantees'],
    cons: ['No tryLock','No fairness config','Pinning risk with VT on hot synchronized'],
    interview30s: 'Intrinsic monitor mutual exclusion + happens-before. Prefer for simple JVM-local critical sections.',
    followUp: 'synchronized(this) vs synchronized(Account.class) with two Account instances?',
    memoryTrick: 'synchronized = one room, one key.',
    whatHappensInternally: `monitorenter → contend → own → critical → monitorexit → wake contender`,
  },
  {
    id: 'volatile',
    title: 'volatile',
    since: 'Java 1.0 / JMM strengthened',
    status: 'FINAL',
    story: 'Public notice board: everyone sees the latest poster. It is not a cash register.',
    whenToUse: 'Flags, safe publication of immutable state, status signals.',
    whenAvoid: 'counter++; multi-field invariants.',
    methods: ['volatile read/write happens-before'],
    internals: 'Volatile write–read HB; forbids certain reorderings; not atomic RMW.',
    mermaid: `sequenceDiagram
  participant A as ThreadA
  participant M as Memory
  participant B as ThreadB
  A->>M: running=false (volatile)
  B->>M: read running
  B-->>B: exit loop`,
    brokenCode: `volatile int counter; counter++; // NOT atomic`,
    fixedCode: `import java.util.concurrent.atomic.AtomicInteger;

public class VolatileFlagDemo {
  static volatile boolean running = true;
  static final AtomicInteger hits = new AtomicInteger();

  public static void main(String[] args) throws Exception {
    Thread w = new Thread(() -> {
      while (running) hits.incrementAndGet();
    });
    w.start();
    Thread.sleep(30);
    running = false;
    w.join();
    System.out.println("hits=" + hits.get());
  }
}`,
    timeline: `worker loops while running → main volatile write false → worker exits`,
    expectedOutput: `hits=<positive>`,
    production: 'Shutdown flags, published config references (often with immutable payload).',
    pros: ['Cheap visibility','Clear publication'],
    cons: ['No compound atomicity'],
    interview30s: 'volatile = visibility/ordering for that variable, not atomicity for read-modify-write.',
    followUp: 'Why can final fields + safe publication replace some volatile uses?',
    memoryTrick: 'volatile = notice board, not cash register.',
    whatHappensInternally: `volatile write → release semantics; volatile read → acquire semantics (JMM)`,
  },
];
