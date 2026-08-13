import type {Mechanism} from './types';

export const MECHANISMS_A: Mechanism[] = [
  {
    id: 'synchronized',
    name: 'synchronized',
    since: 'Java 1.0',
    problemTitle: 'Bank Account Withdrawal',
    problem: 'Two threads withdraw from the same account. Without a lock both can pass the balance check.',
    brokenCode: `public class BrokenBank {
  static class Account {
    private int balance = 1000;
    public void withdraw(int amount) {
      if (balance >= amount) {
        // race window: another thread can pass the check here
        balance -= amount;
      }
    }
    public int getBalance() { return balance; }
  }

  public static void main(String[] args) throws Exception {
    Account account = new Account();
    Thread t1 = new Thread(() -> account.withdraw(700), "T1");
    Thread t2 = new Thread(() -> account.withdraw(700), "T2");
    t1.start(); t2.start();
    t1.join(); t2.join();
    System.out.println("Final Balance = " + account.getBalance());
  }
}`,
    bugTrace: `Initial Balance = 1000

T1 read 1000          T2 read 1000
T1 1000>=700          T2 1000>=700
T1 balance=300        T2 balance=300

Final = 300  (both withdrew — money invented)
❌ BUG: Race Condition`,
    bugLabel: '❌ BUG: Race Condition',
    fixedCode: `import java.util.concurrent.*;

public class SynchronizedBankDemo {
  static class Account {
    private int balance = 1000;

    public synchronized void withdraw(int amount) {
      if (balance >= amount) {
        System.out.println(Thread.currentThread().getName()
            + " withdrawing " + amount);
        balance -= amount;
      } else {
        System.out.println(Thread.currentThread().getName()
            + " insufficient balance");
      }
    }

    public synchronized int getBalance() { return balance; }
  }

  public static void main(String[] args) throws Exception {
    Account account = new Account();
    ExecutorService ex = Executors.newFixedThreadPool(2);
    ex.submit(() -> account.withdraw(700));
    ex.submit(() -> account.withdraw(700));
    ex.shutdown();
    ex.awaitTermination(5, TimeUnit.SECONDS);
    System.out.println("Final Balance = " + account.getBalance());
  }
}

// Also know what object is locked:
// synchronized void m()          → lock = this
// synchronized(this) { }         → lock = this (same)
// synchronized(Account.class){}  → lock = Class object (static/shared)
// public static synchronized void s() → lock = Class object`,
    fixTrace: `T1 acquire monitor → withdraw 700 → balance=300 → release
T2 acquire monitor → see 300 → reject → release
✅ FIXED`,
    expectedOutput: `pool-1-thread-1 withdrawing 700
pool-1-thread-2 insufficient balance
Final Balance = 300`,
    outputNote: 'Thread names/order may vary. Invariant: Final Balance = 300.',
    mermaid: `sequenceDiagram
  participant T1 as Thread-1
  participant L as Monitor
  participant T2 as Thread-2
  participant A as Account
  T1->>L: acquire
  L-->>T1: granted
  T1->>A: withdraw(700)
  T2->>L: acquire
  L-->>T2: BLOCKED
  T1->>A: balance = 300
  T1->>L: release
  L-->>T2: granted
  T2->>A: withdraw(700)
  A-->>T2: insufficient
  T2->>L: release`,
    whyFixWorks: 'synchronized gives mutual exclusion + happens-before visibility on the monitor. Check-then-act becomes atomic for that account instance.',
    whenNot: 'Need tryLock/timeout/interruptible lock; multi-JVM; long I/O inside critical section; very read-heavy with rare writes (consider RW/Stamped).',
    alternative: 'ReentrantLock when you need tryLock/Conditions; Atomic* for single-variable updates; DB lock for shared database rows.',
    interview30s: 'synchronized provides mutual exclusion and happens-before for a monitor-protected critical section. Simplest JVM-local lock when you do not need timed/interruptible acquisition.',
    seniorFollowUp: 'Why choose ReentrantLock instead of synchronized?',
    productionFollowUp: 'What happens if the JVM crashes while holding the monitor? (lock dies with the process — no cross-node protection)',
    memoryTrick: 'synchronized = “Only one person gets the room key.”',
    beforeAfter: [
      {without: 'Race / lost update', with: 'Protected critical section'},
      {without: 'Incorrect balance', with: 'Correct balance'},
      {without: 'Unsafe check-then-act', with: 'Atomic under monitor'},
    ],
    tabs: {
      theory: 'Intrinsic lock on object header / monitor. Reentrant. Automatic unlock on exit (including exceptions).',
      production: 'Keep critical sections tiny. Never call remote HTTP inside synchronized. Prefer locking the domain object, not a global class lock, unless you truly need JVM-wide exclusion.',
      internals: 'Monitorenter/monitorexit bytecode. Biased locking is gone on modern JDKs — do not tune ancient flags.',
    },
  },
  {
    id: 'volatile',
    name: 'volatile',
    since: 'Java 1.0 / strengthened JMM',
    problemTitle: 'Application Shutdown Flag vs Counter++',
    problem: 'volatile is perfect for a stop flag — and dangerously wrong for counter++.',
    brokenCode: `public class VolatileCounterBug {
  // looks "thread-safe" — it is NOT for compound ops
  static volatile int counter = 0;

  public static void main(String[] args) throws Exception {
    Thread[] threads = new Thread[10];
    for (int i = 0; i < 10; i++) {
      threads[i] = new Thread(() -> {
        for (int j = 0; j < 1000; j++) counter++; // read-modify-write
      });
      threads[i].start();
    }
    for (Thread t : threads) t.join();
    System.out.println("counter = " + counter + " (expected 10000)");
  }
}`,
    bugTrace: `Thread-1          Thread-2
read 10           read 10
+1                +1
write 11          write 11
Expected 12 → Actual 11
❌ BUG: Visibility yes, atomicity NO`,
    bugLabel: '❌ BUG: volatile ≠ atomic for counter++',
    fixedCode: `import java.util.concurrent.atomic.AtomicInteger;

public class VolatileFlagAndAtomicCounter {
  // ✅ correct use of volatile: publication / flag
  static volatile boolean running = true;

  static final AtomicInteger counter = new AtomicInteger();

  public static void main(String[] args) throws Exception {
    Thread worker = new Thread(() -> {
      while (running) {
        counter.incrementAndGet();
      }
    });
    worker.start();
    Thread.sleep(50);
    running = false; // visible stop signal
    worker.join();
    System.out.println("stopped, counter=" + counter.get());
  }
}`,
    fixTrace: `volatile running → all threads see stop
AtomicInteger → compound increment is CAS-atomic
✅ FIXED roles separated`,
    expectedOutput: `stopped, counter=<some positive number>`,
    outputNote: 'Exact counter value depends on timing. The point: stop is visible; increments are not lost.',
    mermaid: `sequenceDiagram
  participant M as Main
  participant W as Worker
  participant F as volatile running
  participant C as AtomicInteger
  W->>F: read true
  W->>C: incrementAndGet
  M->>F: write false
  W->>F: read false
  W-->>M: exit loop`,
    whyFixWorks: 'volatile establishes happens-before for that variable’s writes/reads. CAS atomics make read-modify-write atomic.',
    whenNot: 'Any check-then-act on multiple fields; counters; invariants spanning more than one variable.',
    alternative: 'AtomicInteger/LongAdder for counters; synchronized/Lock for multi-field invariants.',
    interview30s: 'volatile gives visibility and ordering for a single variable, not atomicity for compound actions like counter++.',
    seniorFollowUp: 'Where does volatile fit with safe publication of an immutable config object?',
    productionFollowUp: 'Have you seen a shutdown hook that never stops workers because the flag was not volatile/AtomicBoolean?',
    memoryTrick: 'volatile = “Public notice board” (everyone sees the latest poster — not a cash register).',
    beforeAfter: [
      {without: 'counter++ lost updates', with: 'AtomicInteger increments'},
      {without: 'Stop flag never seen', with: 'volatile/AtomicBoolean stop'},
    ],
  },
  {
    id: 'wait-notify',
    name: 'wait() / notify() / notifyAll()',
    since: 'Java 1.0',
    problemTitle: 'Producer → Queue → Consumer',
    problem: 'Consumer must wait until an item exists — busy spinning wastes CPU; sleeping is not a lock protocol.',
    brokenCode: `// Broken: sleep-loop "synchronization"
while (queue.isEmpty()) {
  Thread.sleep(10); // still races; may miss signal; burns latency
}
return queue.remove();`,
    bugTrace: `Consumer spins/sleeps
Producer adds item between checks
Missed wakeups / races / wasted CPU
❌ BUG: No monitor wait set`,
    bugLabel: '❌ BUG: Sleep is not a condition variable',
    fixedCode: `import java.util.*;

public class WaitNotifyQueueDemo {
  static class BoundedQueue<T> {
    private final Queue<T> q = new ArrayDeque<>();
    private final int capacity;

    BoundedQueue(int capacity) { this.capacity = capacity; }

    public synchronized void put(T item) throws InterruptedException {
      while (q.size() == capacity) wait(); // always while, not if
      q.add(item);
      notifyAll();
    }

    public synchronized T take() throws InterruptedException {
      while (q.isEmpty()) wait();
      T item = q.remove();
      notifyAll();
      return item;
    }
  }

  public static void main(String[] args) throws Exception {
    BoundedQueue<String> queue = new BoundedQueue<>(1);
    Thread producer = new Thread(() -> {
      try { queue.put("ORDER-42"); } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
      }
    }, "producer");
    Thread consumer = new Thread(() -> {
      try { System.out.println("got " + queue.take()); }
      catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }, "consumer");
    consumer.start();
    Thread.sleep(20);
    producer.start();
    producer.join(); consumer.join();
  }
}

// Modern alternative:
// BlockingQueue<String> q = new ArrayBlockingQueue<>(1);
// q.put(...); q.take();`,
    fixTrace: `Consumer wait() releases monitor → wait set
Producer put → notifyAll
Consumer rechecks while → take
✅ FIXED`,
    expectedOutput: `got ORDER-42`,
    mermaid: `sequenceDiagram
  participant C as Consumer
  participant M as Monitor
  participant P as Producer
  participant Q as Queue
  C->>M: synchronized
  C->>Q: empty?
  C->>M: wait (release + wait set)
  P->>M: synchronized
  P->>Q: put ORDER-42
  P->>M: notifyAll
  P->>M: unlock
  M-->>C: wakeup
  C->>Q: take
  C->>M: unlock`,
    whyFixWorks: 'wait() releases the monitor and parks in the wait set; notifyAll wakes waiters who must re-check the condition under the lock.',
    whenNot: 'Prefer BlockingQueue / Lock+Condition in new code. Avoid notify() unless you prove a single waiter protocol.',
    alternative: 'ArrayBlockingQueue / LinkedBlockingQueue; ReentrantLock + Condition.',
    interview30s: 'wait/notify are monitor condition variables. Always wait in a while loop holding the monitor; prefer BlockingQueue in modern code.',
    seniorFollowUp: 'Why is notifyAll usually safer than notify?',
    productionFollowUp: 'Where do you still see hand-rolled wait/notify in JDK internals vs app code?',
    memoryTrick: 'wait/notify = “Sleep in the lobby until the desk rings the bell.”',
    beforeAfter: [
      {without: 'Spin/sleep races', with: 'Proper condition wait'},
      {without: 'Missed signals', with: 'while + notifyAll'},
    ],
  },
  {
    id: 'reentrant-lock',
    name: 'ReentrantLock',
    since: 'Java 5',
    problemTitle: 'Ticket Booking — tryLock with timeout',
    problem: 'Two users book the last seat. synchronized cannot timeout or try-acquire; a stuck peer can hang you forever.',
    brokenCode: `// synchronized cannot say "give up after 100ms"
public synchronized boolean book(String seat) {
  if (taken.contains(seat)) return false;
  taken.add(seat);
  return true;
}`,
    bugTrace: `Thread holding lock is stuck in slow I/O
Others block indefinitely on synchronized
❌ BUG: No timed acquisition`,
    bugLabel: '❌ BUG: No tryLock / timeout',
    fixedCode: `import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.locks.*;

public class TicketBookingLockDemo {
  static class TicketService {
    private final Set<String> taken = new HashSet<>();
    private final ReentrantLock lock = new ReentrantLock(true); // fair demo

    public boolean book(String seat) {
      try {
        if (!lock.tryLock(100, TimeUnit.MILLISECONDS)) {
          System.out.println(Thread.currentThread().getName() + " timed out");
          return false;
        }
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        return false;
      }
      try {
        if (taken.contains(seat)) {
          System.out.println(Thread.currentThread().getName() + " seat gone");
          return false;
        }
        taken.add(seat);
        System.out.println(Thread.currentThread().getName() + " booked " + seat);
        return true;
      } finally {
        lock.unlock(); // ALWAYS
      }
    }
  }

  public static void main(String[] args) throws Exception {
    TicketService svc = new TicketService();
    ExecutorService ex = Executors.newFixedThreadPool(4);
    for (int i = 0; i < 4; i++) ex.submit(() -> svc.book("A1"));
    ex.shutdown();
    ex.awaitTermination(2, TimeUnit.SECONDS);
  }
}

// Also: lock.lockInterruptibly(); lock.newCondition();`,
    fixTrace: `One thread books A1
Others fail fast (seat gone) or timeout if lock held too long
✅ FIXED with tryLock + finally unlock`,
    expectedOutput: `pool-1-thread-1 booked A1
pool-1-thread-2 seat gone
...`,
    outputNote: 'Exactly one success for seat A1.',
    mermaid: `sequenceDiagram
  participant U1 as User-1
  participant L as ReentrantLock
  participant U2 as User-2
  participant S as Seats
  U1->>L: tryLock(100ms)
  L-->>U1: granted
  U2->>L: tryLock(100ms)
  L-->>U2: waiting
  U1->>S: add A1
  U1->>L: unlock
  L-->>U2: granted
  U2->>S: contains A1
  U2-->>U2: seat gone
  U2->>L: unlock`,
    whyFixWorks: 'ReentrantLock adds timed/interruptible acquisition, fairness option, and Conditions — still JVM-local mutual exclusion.',
    whenNot: 'Simple critical sections (synchronized is clearer); forgetting unlock(); using as distributed lock.',
    alternative: 'synchronized for simple cases; Semaphore for permits; DB/optimistic for shared rows.',
    interview30s: 'ReentrantLock when I need tryLock, timeouts, interruptibility, fairness, or multiple Conditions. Always unlock in finally.',
    seniorFollowUp: 'When is a fair ReentrantLock the wrong default?',
    productionFollowUp: 'How do you find a thread that forgot unlock()?',
    memoryTrick: 'ReentrantLock = “Security guard with advanced controls.”',
    beforeAfter: [
      {without: 'Indefinite block', with: 'tryLock timeout'},
      {without: 'No interrupt', with: 'lockInterruptibly'},
    ],
    tabs: {
      production: 'Fair locks reduce throughput under high contention — measure before enabling fairness.',
    },
  },
];
