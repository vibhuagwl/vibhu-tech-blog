export const MASTER_COMPARISON = [
  {mechanism:'synchronized', exclusion:'Yes', visibility:'Yes', blocking:'Yes', reentrant:'Yes', fairness:'JVM-managed', best:'Simple critical section'},
  {mechanism:'ReentrantLock', exclusion:'Yes', visibility:'Yes', blocking:'Yes', reentrant:'Yes', fairness:'Configurable', best:'tryLock / Conditions'},
  {mechanism:'ReadWriteLock', exclusion:'Yes', visibility:'Yes', blocking:'Yes', reentrant:'Yes', fairness:'Configurable', best:'Read-heavy state'},
  {mechanism:'StampedLock', exclusion:'Yes', visibility:'Yes', blocking:'Yes*', reentrant:'No', fairness:'Limited', best:'Optimistic reads'},
  {mechanism:'Atomic/CAS', exclusion:'No mutex', visibility:'Yes', blocking:'No', reentrant:'N/A', fairness:'N/A', best:'Single atomic variable'},
  {mechanism:'LongAdder', exclusion:'No mutex', visibility:'Yes', blocking:'No', reentrant:'N/A', fairness:'N/A', best:'Hot counters'},
  {mechanism:'Semaphore', exclusion:'Permit control', visibility:'Yes', blocking:'Yes', reentrant:'N/A', fairness:'Configurable', best:'Bulkheads / limits'},
  {mechanism:'CountDownLatch', exclusion:'Coordination', visibility:'Yes', blocking:'Yes', reentrant:'N/A', fairness:'N/A', best:'One-time wait'},
  {mechanism:'CyclicBarrier', exclusion:'Coordination', visibility:'Yes', blocking:'Yes', reentrant:'N/A', fairness:'N/A', best:'Repeated phases'},
  {mechanism:'Phaser', exclusion:'Coordination', visibility:'Yes', blocking:'Yes', reentrant:'N/A', fairness:'N/A', best:'Dynamic multi-phase'},
  {mechanism:'volatile', exclusion:'No', visibility:'Yes', blocking:'No', reentrant:'N/A', fairness:'N/A', best:'Flags / publication'},
  {mechanism:'CHM', exclusion:'Per-bin', visibility:'Yes', blocking:'Partial', reentrant:'N/A', fairness:'N/A', best:'Concurrent maps'},
  {mechanism:'DB lock', exclusion:'Row/table', visibility:'Durable', blocking:'Yes', reentrant:'N/A', fairness:'DB', best:'Shared durable rows'},
  {mechanism:'Distributed lock', exclusion:'Cluster', visibility:'Via store', blocking:'Yes', reentrant:'Design-dependent', fairness:'Design', best:'Multi-JVM exclusion'},
];

export const LOCK_FREE_TABLE = [
  {technique:'synchronized', blocking:'Yes', progress:'Blocking'},
  {technique:'ReentrantLock', blocking:'Yes', progress:'Blocking'},
  {technique:'Atomic CAS', blocking:'No traditional lock', progress:'Lock-free (systemwide progress)'},
  {technique:'Wait-free algorithm', blocking:'No', progress:'Every thread progresses'},
  {technique:'Spin lock', blocking:'CPU spinning', progress:'Depends / can waste cores'},
];

export const OPT_VS_PESS = {
  optimistic: ['Read', 'Modify', 'Validate version/stamp', 'Success or retry'],
  pessimistic: ['Acquire lock', 'Read', 'Modify', 'Commit', 'Release'],
};

export const CHEAT_SHEET = [
  {q:'Need simple JVM lock?', a:'synchronized'},
  {q:'Need timeout / tryLock?', a:'ReentrantLock'},
  {q:'Mostly reads?', a:'ReadWriteLock'},
  {q:'Very read-heavy + optimistic?', a:'StampedLock'},
  {q:'Single atomic variable?', a:'Atomic*'},
  {q:'High-contention counter?', a:'LongAdder'},
  {q:'Limit concurrent calls?', a:'Semaphore'},
  {q:'Wait for N tasks?', a:'CountDownLatch'},
  {q:'Repeated phases?', a:'CyclicBarrier'},
  {q:'Dynamic multi-phase?', a:'Phaser'},
  {q:'Producer/consumer?', a:'BlockingQueue'},
  {q:'Multiple JVMs?', a:'Distributed Lock'},
  {q:'Database row protection?', a:'DB Lock / Transaction'},
  {q:'Concurrent update conflict?', a:'Optimistic Lock (@Version)'},
  {q:'Exclusive DB access?', a:'Pessimistic Lock'},
];

export const REMEMBER = [
  {name:'synchronized', analogy:'One room, one key'},
  {name:'ReentrantLock', analogy:'Security guard with advanced controls'},
  {name:'ReadWriteLock', analogy:'Library: many readers, one writer'},
  {name:'StampedLock', analogy:'Read first, verify later'},
  {name:'Atomic/CAS', analogy:'Try the update, retry if someone changed it'},
  {name:'Semaphore', analogy:'Limited number of parking slots'},
  {name:'CountDownLatch', analogy:'Wait until all tasks finish'},
  {name:'CyclicBarrier', analogy:'Everyone waits at the checkpoint'},
  {name:'Phaser', analogy:'Multiple checkpoints/phases'},
  {name:'volatile', analogy:'Public notice board'},
  {name:'Deadlock', analogy:"Two people holding each other's keys"},
  {name:'Livelock', analogy:'Two people continuously stepping aside'},
  {name:'Starvation', analogy:'One person never gets a turn'},
];

export const BEST_PRACTICES = [
  'Keep critical sections tiny — no remote I/O under locks.',
  'Always unlock in finally; prefer synchronized when it fits.',
  'Prefer atomic map APIs over containsKey+put.',
  'Size Semaphores/pools to downstream capacity.',
  'Use lock ordering + tryLock to prevent deadlocks.',
  'Do not use JVM locks for multi-instance jobs.',
  'Measure contention (JFR) before switching lock types.',
  'Separate in-memory concurrency from DB/distributed concurrency.',
  'Virtual threads: watch pinning on synchronized/native.',
  'Fail closed on lock acquisition timeouts for money paths.',
];
