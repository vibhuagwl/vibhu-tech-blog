import type {TopicCard} from './types';

/** Compact but practical cards for remaining TOC anchors. */
export const TOPICS_D: TopicCard[] = [
  {
    id:'wait-notify',title:'wait / notify / notifyAll',since:'Java 1.0',status:'FINAL',
    story:'Sleep in the lobby until the desk rings — then re-check the queue.',
    whenToUse:'Learning monitors; prefer BlockingQueue in apps.',whenAvoid:'New production queues.',
    methods:['wait','notify','notifyAll'],internals:'Wait set on monitor; must own monitor; loop on condition.',
    mermaid:`sequenceDiagram
  participant P as Producer
  participant M as Monitor
  participant C as Consumer
  C->>M: wait empty
  P->>M: put + notifyAll
  C->>M: recheck + take`,
    fixedCode:`public class WaitNotifyDemo {
  static final Object LOCK = new Object();
  static String msg;
  public static void main(String[] args) throws Exception {
    Thread c = new Thread(() -> {
      synchronized (LOCK) {
        while (msg == null) {
          try { LOCK.wait(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); return; }
        }
        System.out.println(msg);
      }
    });
    c.start();
    Thread.sleep(20);
    synchronized (LOCK) { msg = "ORDER-READY"; LOCK.notifyAll(); }
    c.join();
  }
}`,
    timeline:`consumer waits → producer notifyAll → consumer prints`,expectedOutput:`ORDER-READY`,
    production:'Prefer ArrayBlockingQueue.put/take.',pros:['Fundamental'],cons:['Easy to get wrong'],
    interview30s:'Always wait in while holding the monitor; prefer BlockingQueue.',followUp:'notify vs notifyAll?',
    memoryTrick:'wait/notify = lobby bell.',whatHappensInternally:`wait → release monitor → wait set → notify → reacquire → loop`,
  },
  {
    id:'varhandle',title:'VarHandle',since:'Java 9',status:'FINAL',
    story:'Low-level memory dials behind Atomic* — acquire/release/volatile/CAS.',
    whenToUse:'Library authors; custom atomics.',whenAvoid:'App business logic — use Atomic*.',
    methods:['getVolatile','setVolatile','getAcquire','setRelease','compareAndSet','compareAndExchange'],
    internals:'JDK atomics delegate to VarHandle → JVM intrinsics → CPU atomics/fences.',
    mermaid:`flowchart TB
  APP[AtomicInteger] --> VH[VarHandle]
  VH --> JVM[JVM intrinsic]
  JVM --> CPU[CPU atomic / fence]`,
    fixedCode:`import java.lang.invoke.*;

public class VarHandleCasDemo {
  static final VarHandle VH;
  int value;
  static {
    try { VH = MethodHandles.lookup().findVarHandle(VarHandleCasDemo.class, "value", int.class); }
    catch (Exception e) { throw new ExceptionInInitializerError(e); }
  }
  public static void main(String[] args) {
    VarHandleCasDemo d = new VarHandleCasDemo();
    System.out.println(VH.compareAndSet(d, 0, 42));
    System.out.println(VH.getVolatile(d));
  }
}`,
    timeline:`CAS 0→42 → volatile get 42`,expectedOutput:`true\n42`,
    production:'Prefer AtomicInteger unless building a concurrent structure.',pros:['Explicit modes'],cons:['Easy to misuse'],
    interview30s:'VarHandle is the modern Unsafe replacement for atomics/ordering.',followUp:'Acquire/release vs volatile?',
    memoryTrick:'VarHandle = atomic dial board.',whatHappensInternally:`compareAndSet → CPU CAS + needed barriers`,
  },
  {
    id:'rwlock',title:'ReentrantReadWriteLock',since:'Java 5',status:'FINAL',
    story:'Library: many readers; writer closes the stacks.',
    whenToUse:'Read-mostly shared state.',whenAvoid:'Tiny critical sections; write-heavy.',
    methods:['readLock','writeLock'],internals:'AQS shared+exclusive; writer exclusive.',
    mermaid:`flowchart LR
  R1 --> RL[ReadLock]
  R2 --> RL
  W1 --> WL[WriteLock]`,
    fixedCode:`import java.util.concurrent.locks.*;

public class ConfigRwDemo {
  final ReentrantReadWriteLock rw = new ReentrantReadWriteLock();
  String config = "v1";
  String get() { rw.readLock().lock(); try { return config; } finally { rw.readLock().unlock(); } }
  void set(String c) { rw.writeLock().lock(); try { config = c; } finally { rw.writeLock().unlock(); } }
  public static void main(String[] args) {
    ConfigRwDemo d = new ConfigRwDemo();
    d.set("v2");
    System.out.println(d.get());
  }
}`,
    timeline:`writers exclusive; readers concurrent`,expectedOutput:`v2`,
    production:'Config/catalog caches — or immutable snapshot publish.',pros:['Reader concurrency'],cons:['Overhead','Starvation risk'],
    interview30s:'Shared reads, exclusive writes — measure before adopting.',followUp:'Can you upgrade read→write?',
    memoryTrick:'RW = library hours.',whatHappensInternally:`read acquire shared → write exclusive wait for zero readers`,
  },
  {
    id:'stamped',title:'StampedLock',since:'Java 8',status:'FINAL',
    story:'Read first, validate ticket later — optimistic.',
    whenToUse:'Read-heavy + measured optimistic success.',whenAvoid:'Need reentrancy.',
    methods:['writeLock','readLock','tryOptimisticRead','validate','unlockWrite','unlockRead'],
    internals:'Stamp encodes mode/version; not reentrant.',
    mermaid:`flowchart TD
  O[tryOptimisticRead] --> V{validate?}
  V -->|yes| U[use]
  V -->|no| R[readLock fallback]`,
    fixedCode:`import java.util.concurrent.locks.StampedLock;

public class GeoStampDemo {
  final StampedLock lock = new StampedLock();
  double x,y;
  void move(double nx,double ny){ long s=lock.writeLock(); try{x=nx;y=ny;} finally{lock.unlockWrite(s);} }
  double[] read(){
    long s=lock.tryOptimisticRead(); double a=x,b=y;
    if(!lock.validate(s)){ s=lock.readLock(); try{a=x;b=y;} finally{lock.unlockRead(s);} }
    return new double[]{a,b};
  }
  public static void main(String[] args){ GeoStampDemo g=new GeoStampDemo(); g.move(1,2); System.out.println(g.read()[0]); }
}`,
    timeline:`optimistic → validate → maybe fallback`,expectedOutput:`1.0`,
    production:'Hot read coordinates/geo.',pros:['Optimistic path'],cons:['Not reentrant'],
    interview30s:'Optimistic stamp validate; not reentrant.',followUp:'Self-deadlock scenario?',
    memoryTrick:'Stamped = read then check ticket.',whatHappensInternally:`stamp version bumps on write → validate fails → pessimistic read`,
  },
  {
    id:'locksupport',title:'LockSupport',since:'Java 5',status:'FINAL',
    story:'Valet ticket for a thread — park/unpark permit.',
    whenToUse:'Building synchronizers; understanding AQS.',whenAvoid:'App business waits — use Latch/Queue.',
    methods:['park','unpark','parkNanos'],internals:'Sticky permit; no monitor required.',
    mermaid:`sequenceDiagram
  participant W as Waiter
  participant LP as LockSupport
  participant M as Main
  W->>LP: park
  M->>LP: unpark(W)`,
    fixedCode:`import java.util.concurrent.locks.LockSupport;

public class ParkDemo {
  public static void main(String[] args) throws Exception {
    Thread w = new Thread(() -> { LockSupport.park(); System.out.println("resumed"); });
    w.start();
    Thread.sleep(30);
    LockSupport.unpark(w);
    w.join();
  }
}`,
    timeline:`park → unpark → print`,expectedOutput:`resumed`,
    production:'Underlying AQS parking.',pros:['Low-level precise'],cons:['Easy to misuse'],
    interview30s:'park/unpark underpin AQS; permit can precede park.',followUp:'vs wait/notify?',
    memoryTrick:'LockSupport = valet ticket.',whatHappensInternally:`park if no permit → unpark sets permit/wakes`,
  },
  {
    id:'condition',title:'Condition',since:'Java 5',status:'FINAL',
    story:'Multiple lobbies for one lock — notEmpty vs notFull.',
    whenToUse:'ReentrantLock multi-condition queues.',whenAvoid:'Single condition — BlockingQueue often enough.',
    methods:['await','signal','signalAll'],internals:'Condition queue ↔ AQS sync queue on signal.',
    mermaid:`flowchart LR
  CQ[Condition queue] -->|signal| SQ[AQS queue] -->|lock| RUN[Running]`,
    fixedCode:`import java.util.concurrent.locks.*;

public class ConditionBoundedDemo {
  final ReentrantLock lock = new ReentrantLock();
  final Condition notEmpty = lock.newCondition();
  String item;
  void put(String v){ lock.lock(); try{ item=v; notEmpty.signal(); } finally{ lock.unlock(); } }
  String take() throws InterruptedException {
    lock.lock();
    try { while(item==null) notEmpty.await(); String v=item; item=null; return v; }
    finally { lock.unlock(); }
  }
  public static void main(String[] args) throws Exception {
    ConditionBoundedDemo q = new ConditionBoundedDemo();
    Thread c = new Thread(() -> { try { System.out.println(q.take()); } catch(Exception e){} });
    c.start(); Thread.sleep(20); q.put("X"); c.join();
  }
}`,
    timeline:`take awaits → put signals → take returns`,expectedOutput:`X`,
    production:'Custom bounded buffers with Lock.',pros:['Multiple conditions'],cons:['More complex than BQ'],
    interview30s:'Condition replaces wait/notify with explicit Lock.',followUp:'signal vs signalAll?',
    memoryTrick:'Condition = named lobby.',whatHappensInternally:`await unlock+park → signal enqueue → re-acquire`,
  },
  {
    id:'latch',title:'CountDownLatch',since:'Java 5',status:'FINAL',
    story:'Rocket waits until countdown hits zero — one shot.',
    whenToUse:'Startup barriers; fan-in once.',whenAvoid:'Need reset — use Barrier/Phaser.',
    methods:['countDown','await','getCount'],internals:'AQS shared; state=count.',
    mermaid:`flowchart LR
  DB --> L[Latch3]
  Cache --> L
  Kafka --> L
  L --> READY[Start]`,
    fixedCode:`import java.util.concurrent.*;

public class StartupLatchDemo {
  public static void main(String[] args) throws Exception {
    CountDownLatch ready = new CountDownLatch(3);
    ExecutorService ex = Executors.newFixedThreadPool(3);
    for (int i=0;i<3;i++) ex.submit(ready::countDown);
    System.out.println(ready.await(2, TimeUnit.SECONDS) ? "READY" : "TIMEOUT");
    ex.shutdown();
  }
}`,
    timeline:`3 countDown → await opens`,expectedOutput:`READY`,
    production:'Service readiness.',pros:['Simple'],cons:['No reset'],
    interview30s:'One-shot N→0 gate.',followUp:'Why no reset?',
    memoryTrick:'Latch = rocket countdown.',whatHappensInternally:`await shared acquire → countDown releaseShared`,
  },
  {
    id:'barrier',title:'CyclicBarrier',since:'Java 5',status:'FINAL',
    story:'Friends meet at checkpoint, then next level — reusable.',
    whenToUse:'Fixed party phased algorithms.',whenAvoid:'Dynamic party size — Phaser.',
    methods:['await','reset','getNumberWaiting'],internals:'Trips when parties arrive; reusable; can break.',
    mermaid:`flowchart TB
  T1 --> B[Barrier]
  T2 --> B
  T3 --> B
  B --> P2[Phase2]`,
    fixedCode:`import java.util.concurrent.*;

public class BarrierDemo {
  public static void main(String[] args) throws Exception {
    CyclicBarrier b = new CyclicBarrier(3, () -> System.out.println("TRIP"));
    ExecutorService ex = Executors.newFixedThreadPool(3);
    for (int i=0;i<3;i++) ex.submit(() -> { try { b.await(); } catch(Exception e){} });
    ex.shutdown(); ex.awaitTermination(2, TimeUnit.SECONDS);
  }
}`,
    timeline:`3 await → trip action`,expectedOutput:`TRIP`,
    production:'Parallel batch phases.',pros:['Reusable'],cons:['Fixed parties'],
    interview30s:'Reusable fixed-party rendezvous vs one-shot latch.',followUp:'BrokenBarrierException?',
    memoryTrick:'Barrier = checkpoint.',whatHappensInternally:`last arrival runs barrier action → releases all`,
  },
  {
    id:'phaser',title:'Phaser',since:'Java 7',status:'FINAL',
    story:'Multi-round game where players can join/leave between rounds.',
    whenToUse:'Dynamic multi-phase workflows.',whenAvoid:'Simple one-shot — latch.',
    methods:['register','arriveAndAwaitAdvance','arriveAndDeregister'],internals:'Phase number + party counts.',
    mermaid:`flowchart TD
  P0[Phase0] --> P1[Phase1] --> P2[Phase2]`,
    fixedCode:`import java.util.concurrent.Phaser;

public class PhaserDemo {
  public static void main(String[] args) {
    Phaser p = new Phaser(1);
    p.register();
    Thread t = new Thread(() -> { System.out.println("A0"); p.arriveAndAwaitAdvance(); System.out.println("A1"); p.arriveAndDeregister(); });
    t.start();
    System.out.println("M0");
    p.arriveAndAwaitAdvance();
    System.out.println("M1");
    p.arriveAndDeregister();
  }
}`,
    timeline:`phase advance together`,expectedOutput:`A0/M0 then A1/M1 (order within phase varies)`,
    production:'ETL stages with varying workers.',pros:['Dynamic'],cons:['Overkill for simple cases'],
    interview30s:'Phaser = flexible multi-phase + dynamic parties.',followUp:'vs CyclicBarrier?',
    memoryTrick:'Phaser = multi-round game.',whatHappensInternally:`arrive advances phase when parties met`,
  },
  {
    id:'exchanger',title:'Exchanger',since:'Java 5',status:'FINAL',
    story:'Two couriers swap packages at a meeting point.',
    whenToUse:'Pipeline buffer swap between 2 threads.',whenAvoid:'N-party coordination.',
    methods:['exchange','exchange(timeout)'],internals:'Slot rendezvous between pairs.',
    mermaid:`flowchart LR
  A[DataA] --> X[Exchanger]
  B[DataB] --> X`,
    fixedCode:`import java.util.concurrent.Exchanger;

public class ExchangerDemo {
  public static void main(String[] args) throws Exception {
    Exchanger<String> ex = new Exchanger<>();
    Thread t = new Thread(() -> { try { System.out.println("T got " + ex.exchange("B")); } catch(Exception e){} });
    t.start();
    System.out.println("M got " + ex.exchange("A"));
    t.join();
  }
}`,
    timeline:`both exchange → swap`,expectedOutput:`M got B\nT got A`,
    production:'Genetic algorithms / pipeline fill-empty buffers.',pros:['Simple pairwise'],cons:['Only 2 parties'],
    interview30s:'Exchanger swaps data between two threads.',followUp:'vs SynchronousQueue?',
    memoryTrick:'Exchanger = package swap.',whatHappensInternally:`first arrives waits → second swaps → both return`,
  },
  {
    id:'executor',title:'Executor Framework',since:'Java 5',status:'FINAL',
    story:'Submit customer tickets to a team instead of hiring a person per ticket yourself.',
    whenToUse:'Managed task execution lifecycle.',whenAvoid:'Raw new Thread storms.',
    methods:['execute','submit','invokeAll','invokeAny','shutdown','awaitTermination'],
    internals:'Executor → ExecutorService → TPE / Scheduled / FJP.',
    mermaid:`flowchart TB
  E[Executor] --> ES[ExecutorService]
  ES --> TPE[ThreadPoolExecutor]
  ES --> SCH[ScheduledThreadPoolExecutor]`,
    fixedCode:`import java.util.concurrent.*;

public class ExecutorSubmitDemo {
  public static void main(String[] args) throws Exception {
    ExecutorService ex = Executors.newFixedThreadPool(2);
    Future<Integer> f = ex.submit(() -> 42);
    System.out.println(f.get());
    ex.shutdown();
    ex.awaitTermination(2, TimeUnit.SECONDS);
  }
}`,
    timeline:`submit → worker → get 42`,expectedOutput:`42`,
    production:'Prefer explicit ThreadPoolExecutor configs.',pros:['Lifecycle'],cons:['Factory pitfalls'],
    interview30s:'Prefer ExecutorService over raw threads; know execute vs submit.',followUp:'Factory unbounded queue risk?',
    memoryTrick:'Executor = ticket window.',whatHappensInternally:`submit → FutureTask → execute → worker`,
  },
  {
    id:'queues',title:'Pool Queues & Rejection',since:'Java 5',status:'FINAL',
    story:'The line type decides whether you hire more tellers or bounce customers.',
    whenToUse:'Tune backpressure.',whenAvoid:'Ignoring rejection metrics.',
    methods:['AbortPolicy','CallerRunsPolicy','DiscardPolicy','DiscardOldestPolicy'],
    internals:'offer fail → reject handler.',
    mermaid:`flowchart TD
  Q[queue full + max workers] --> R[RejectedExecutionHandler]`,
    fixedCode:`import java.util.concurrent.*;

public class RejectDemo {
  public static void main(String[] args) {
    ThreadPoolExecutor ex = new ThreadPoolExecutor(1,1,1,TimeUnit.SECONDS,new ArrayBlockingQueue<>(1), new ThreadPoolExecutor.AbortPolicy());
    ex.execute(() -> { try { Thread.sleep(200); } catch(Exception e){} });
    ex.execute(() -> {});
    try { ex.execute(() -> {}); } catch (RejectedExecutionException e) { System.out.println("REJECTED"); }
    ex.shutdownNow();
  }
}`,
    timeline:`1 running +1 queued → third abort`,expectedOutput:`REJECTED`,
    production:'CallerRuns as shed; Abort with 429 at edge.',pros:['Explicit overload'],cons:['Discard silent loss'],
    interview30s:'Rejection is a feature — choose policy consciously.',followUp:'CallerRuns latency effect?',
    memoryTrick:'Rejection = bouncer.',whatHappensInternally:`execute → offer fail → handler.rejectedExecution`,
  },
  {
    id:'future',title:'Future / FutureTask',since:'Java 5',status:'FINAL',
    story:'Claim ticket for work in progress — get() waits at the counter.',
    whenToUse:'Single async result with cancel.',whenAvoid:'Composition — use CF.',
    methods:['get','get(timeout)','cancel','isDone','isCancelled'],
    internals:'FutureTask state machine NEW→COMPLETING→NORMAL/EXCEPTIONAL/CANCELLED.',
    mermaid:`sequenceDiagram
  participant M as Main
  participant W as Worker
  M->>W: submit
  M->>M: get blocks
  W-->>M: result`,
    fixedCode:`import java.util.concurrent.*;

public class FutureTimeoutDemo {
  public static void main(String[] args) throws Exception {
    ExecutorService ex = Executors.newSingleThreadExecutor();
    Future<String> f = ex.submit(() -> { Thread.sleep(10); return "OK"; });
    System.out.println(f.get(1, TimeUnit.SECONDS));
    ex.shutdown();
  }
}`,
    timeline:`submit → get → OK`,expectedOutput:`OK`,
    production:'Always timeout get(); check cancel.',pros:['Simple'],cons:['Blocking get'],
    interview30s:'Future.get blocks; exceptions wrapped in ExecutionException.',followUp:'cancel(true)?',
    memoryTrick:'Future = claim ticket.',whatHappensInternally:`get waits on state → report result/exception`,
  },
  {
    id:'cow',title:'CopyOnWriteArrayList',since:'Java 5',status:'FINAL',
    story:'Readers keep reading old newspaper; writer prints a new edition.',
    whenToUse:'Read-heavy rare writes (listeners).',whenAvoid:'Write-heavy.',
    methods:['add','get','iterator'],internals:'ReentrantLock on mutate; volatile array publish.',
    mermaid:`flowchart TB
  R[Readers] --> V1[Array V1]
  W[Writer] --> COPY[Copy+mutate] --> V2[Array V2]`,
    fixedCode:`import java.util.concurrent.CopyOnWriteArrayList;

public class CowDemo {
  public static void main(String[] args) {
    CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();
    list.add("L1");
    for (String s : list) System.out.println(s);
  }
}`,
    timeline:`snapshot iteration safe`,expectedOutput:`L1`,
    production:'Listener registries.',pros:['Safe iteration'],cons:['Write copies'],
    interview30s:'COW snapshots reads; writes copy array.',followUp:'vs synchronizedList?',
    memoryTrick:'COW = new newspaper edition.',whatHappensInternally:`lock → copy → mutate → publish array`,
  },
  {
    id:'flow',title:'Flow API',since:'Java 9',status:'FINAL',
    story:'Publisher only ships what subscriber requested — backpressure.',
    whenToUse:'JDK Reactive Streams SPI demos; prefer Reactor/Rx in apps often.',whenAvoid:'Rebuilding full reactive stack.',
    methods:['subscribe','request','onNext','onError','onComplete'],
    internals:'SubmissionPublisher buffers; request(n) pulls.',
    mermaid:`sequenceDiagram
  participant P as Publisher
  participant S as Subscriber
  S->>P: request(3)
  P->>S: onNext x3`,
    fixedCode:`import java.util.concurrent.*;

public class FlowDemo {
  public static void main(String[] args) throws Exception {
    try (SubmissionPublisher<String> pub = new SubmissionPublisher<>()) {
      pub.subscribe(new Flow.Subscriber<>() {
        Flow.Subscription sub;
        public void onSubscribe(Flow.Subscription s){ sub=s; s.request(1); }
        public void onNext(String item){ System.out.println(item); sub.request(1); }
        public void onError(Throwable t){}
        public void onComplete(){}
      });
      pub.submit("EVENT");
      Thread.sleep(50);
    }
  }
}`,
    timeline:`request → onNext`,expectedOutput:`EVENT`,
    production:'Interop with reactive ecosystems.',pros:['Backpressure SPI'],cons:['Limited alone'],
    interview30s:'Flow is JDK Reactive Streams; request(n) is backpressure.',followUp:'vs unbounded queue?',
    memoryTrick:'Flow = pull what you can handle.',whatHappensInternally:`submit → buffer → deliver up to requested`,
  },
];
