import type {ProdProblem, ScenarioPick, WrongChoice} from './types';

export const SCENARIO_PICKS: ScenarioPick[] = [
  {
    id: 's1',
    scenario: 'I have a counter. 1000 threads increment it. What should I use?',
    answer: 'AtomicInteger, or LongAdder under high contention for metrics.',
    code: `LongAdder hits = new LongAdder();
hits.increment();
long total = hits.sum();`,
    why: 'Single-variable RMW — CAS/striping beats a mutex for this shape.',
  },
  {
    id: 's2',
    scenario: 'Config object: 1000 readers, rare writer.',
    answer: 'ReadWriteLock or StampedLock (optimistic). Or publish immutable snapshots.',
    code: `rw.readLock().lock();
try { return config; } finally { rw.readLock().unlock(); }`,
    why: 'Avoid serializing readers on an exclusive lock.',
  },
  {
    id: 's3',
    scenario: 'Only 20 calls should access an external API.',
    answer: 'Semaphore(20) bulkhead.',
    code: `Semaphore lim = new Semaphore(20);
lim.acquire();
try { api.call(); } finally { lim.release(); }`,
    why: 'Permit limiting matches gateway concurrency quotas.',
  },
  {
    id: 's4',
    scenario: 'Three Spring Boot instances run the same scheduled job; only one should.',
    answer: 'Distributed lock (lease + ownership + fencing) or leader election — not synchronized.',
    code: `if (distLock.tryAcquire("job", token, ttl)) { try { run(); } finally { distLock.release(...); } }`,
    why: 'Monitors are per-JVM.',
  },
  {
    id: 's5',
    scenario: 'Producer threads generate orders; consumers process them.',
    answer: 'BlockingQueue.',
    code: `BlockingQueue<Order> q = new ArrayBlockingQueue<>(1000);
q.put(order); Order o = q.take();`,
    why: 'Bounded handoff with backpressure beats wait/notify DIY.',
  },
  {
    id: 's6',
    scenario: 'Two users edit the same order row.',
    answer: 'DB optimistic @Version (or pessimistic if conflict rate is extreme).',
    code: `@Version Long version;`,
    why: 'Cross-process durable conflict detection.',
  },
];

export const WRONG_CHOICES: WrongChoice[] = [
  {
    wrong: 'synchronized for distributed locking',
    looksCorrect: 'It prevents concurrent entry in a singleton bean.',
    actuallyWrong: 'Each pod has its own monitor — jobs still duplicate.',
    correct: 'Distributed lock / DB leader / ShedLock + idempotency.',
  },
  {
    wrong: 'volatile for counter++',
    looksCorrect: 'volatile is for multi-threading.',
    actuallyWrong: 'No atomicity for read-modify-write.',
    correct: 'AtomicInteger / LongAdder.',
  },
  {
    wrong: 'ReentrantLock without finally unlock()',
    looksCorrect: 'Happy path unlocks.',
    actuallyWrong: 'Exceptions leave the lock held → outage.',
    correct: 'try/finally or try-with patterns wrapping unlock.',
  },
  {
    wrong: 'ReadWriteLock for extremely short operations',
    looksCorrect: 'More readers = more throughput.',
    actuallyWrong: 'RW overhead can exceed benefit on tiny critical sections.',
    correct: 'Measure; often synchronized/CHM/immutable publish wins.',
  },
  {
    wrong: 'AtomicInteger for multi-variable transaction',
    looksCorrect: 'Atomics are thread-safe.',
    actuallyWrong: 'Cannot atomically update two accounts with one AtomicInteger.',
    correct: 'Lock both (ordered) or DB transaction.',
  },
  {
    wrong: 'Semaphore when ownership locking is required',
    looksCorrect: 'It limits access.',
    actuallyWrong: 'Permits are not tied to a specific resource/owner invariant.',
    correct: 'Lock per resource or keyed locks.',
  },
  {
    wrong: 'Thread.sleep() to solve concurrency',
    looksCorrect: 'Timing seems to reduce races.',
    actuallyWrong: 'Races remain; flaky under load.',
    correct: 'Proper synchronization/coordination primitives.',
  },
  {
    wrong: 'CHM containsKey() + put() for atomic init',
    looksCorrect: 'Map is concurrent.',
    actuallyWrong: 'Compound sequence is not atomic.',
    correct: 'computeIfAbsent / putIfAbsent carefully.',
  },
  {
    wrong: 'Distributed lock without expiration/fencing',
    looksCorrect: 'SET NX exclusive.',
    actuallyWrong: 'Dead holders & split brain writes.',
    correct: 'TTL + ownership token + fencing on mutate path.',
  },
];

export const PROD_PROBLEMS: ProdProblem[] = [
  {
    id: 'p1',
    title: 'Two requests update the same account',
    bad: 'Unlocked check-then-act on balance field',
    execution: 'Both read 1000; both withdraw 700; balance=300',
    rootCause: 'Race condition on shared mutable state',
    solution: 'synchronized/Lock in single JVM; DB transaction/@Version across services',
    why: 'Scope of sharing decides the mechanism',
  },
  {
    id: 'p2',
    title: 'Two nodes process the same scheduled job',
    bad: 'synchronized on @Scheduled method',
    execution: 'All pods execute settlement',
    rootCause: 'JVM-local exclusion',
    solution: 'Distributed lock / leader election + idempotent job',
    why: 'Cluster coordination requires shared store',
  },
  {
    id: 'p3',
    title: '1000 threads update a shared counter',
    bad: 'int++ or synchronized around metrics',
    execution: 'Lost updates or mutex hotspot',
    rootCause: 'Wrong primitive for hot RMW',
    solution: 'LongAdder',
    why: 'Striping reduces contention',
  },
  {
    id: 'p4',
    title: '100 readers / 1 writer on configuration',
    bad: 'Exclusive lock for reads',
    execution: 'Read latency rises with traffic',
    rootCause: 'Over-serialization',
    solution: 'RW/StampedLock or immutable snapshot publish',
    why: 'Readers should not exclude each other',
  },
  {
    id: 'p5',
    title: 'Only 10 requests should call payment provider',
    bad: 'Unbounded thread pool calling gateway',
    execution: 'Provider 429; local thread starvation',
    rootCause: 'No bulkhead',
    solution: 'Semaphore(10) or bounded bulkhead',
    why: 'Protect downstream',
  },
  {
    id: 'p6',
    title: 'Multiple workers process the same order',
    bad: 'Read status=NEW then process without row lock',
    execution: 'Double charge risk',
    rootCause: 'Missing claim/idempotency',
    solution: 'Pessimistic row lock or conditional UPDATE status',
    why: 'Durable claim must be in DB',
  },
  {
    id: 'p7',
    title: 'Two services acquire resources in different order',
    bad: 'Lock A then B vs B then A',
    execution: 'Deadlock',
    rootCause: 'Circular wait',
    solution: 'Global ordering + tryLock',
    why: 'Break Coffman circular wait',
  },
  {
    id: 'p8',
    title: 'A thread holds a lock for too long',
    bad: 'HTTP call inside synchronized',
    execution: 'Thread dump shows BLOCKED pileup',
    rootCause: 'Critical section includes I/O',
    solution: 'Compute under lock; I/O outside',
    why: 'Locks should protect memory transitions only',
  },
  {
    id: 'p9',
    title: 'A lock causes CPU spikes',
    bad: 'Hot spin / livelock retries / unfair barging storms',
    execution: 'CPU high, throughput flat',
    rootCause: 'Busy wait or retry amplification',
    solution: 'Park-based locks, backoff, reduce contention',
    why: 'Progress needs blocking or smarter CAS backoff',
  },
  {
    id: 'p10',
    title: 'Service slow from lock contention',
    bad: 'Coarse service-wide lock',
    execution: 'p99 explodes with concurrency',
    rootCause: 'Lock granularity too coarse',
    solution: 'Per-account locks / CHM striping / shard state',
    why: 'Independent accounts should not share one mutex',
  },
];
