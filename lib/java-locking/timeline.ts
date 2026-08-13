import type {TimelineItem} from './types';

export const LOCKING_TIMELINE: TimelineItem[] = [
  {
    version: 'Java 1.0',
    features: [
      {
        name: 'synchronized + wait/notify',
        why: 'Need mutual exclusion and monitor waiting in the language.',
        solved: 'Critical sections and basic handoff.',
        before: 'Platform-specific threading only.',
        modern: 'Still the default for simple JVM-local locks.',
        stillUsed: true,
      },
      {
        name: 'volatile',
        why: 'Publish flags/references across threads.',
        solved: 'Visibility without full mutual exclusion.',
        before: 'No portable visibility keyword.',
        modern: 'Use for flags/publication; not for compound updates.',
        stillUsed: true,
      },
    ],
  },
  {
    version: 'Java 5',
    features: [
      {
        name: 'java.util.concurrent (Lock, ReentrantLock, Semaphore, Latch, Atomics)',
        why: 'synchronized was rigid; need tryLock, fairness, coordination primitives.',
        solved: 'Advanced locking, pools, atomics, barriers of the era.',
        before: 'Hand-rolled wait/notify and Thread subclasses.',
        modern: 'Still the core toolkit for JVM concurrency.',
        stillUsed: true,
      },
    ],
  },
  {
    version: 'Java 7',
    features: [
      {
        name: 'ForkJoinPool / Phaser maturation',
        why: 'Divide-and-conquer and dynamic multi-phase sync.',
        solved: 'Work-stealing parallelism and flexible barriers.',
        before: 'Fixed thread pools + CyclicBarrier only.',
        modern: 'FJP under parallel streams; Phaser for dynamic phases.',
        stillUsed: true,
      },
    ],
  },
  {
    version: 'Java 8',
    features: [
      {
        name: 'StampedLock + LongAdder',
        why: 'Read-heavy structures and hot counters under contention.',
        solved: 'Optimistic reads; striped counters.',
        before: 'ReadWriteLock / AtomicLong only.',
        modern: 'Prefer LongAdder for metrics; StampedLock when read-heavy + measured.',
        stillUsed: true,
      },
    ],
  },
  {
    version: 'Java 9+',
    features: [
      {
        name: 'VarHandle',
        why: 'Standardize low-level atomic/ordered access beyond sun.misc.Unsafe.',
        solved: 'Portable fences and atomics for library authors.',
        before: 'Unsafe / Atomic* only.',
        modern: 'Library/framework internals more than app code.',
        stillUsed: true,
      },
    ],
  },
  {
    version: 'Java 21+',
    features: [
      {
        name: 'Virtual Threads',
        why: 'Scale blocking I/O without scarce platform threads.',
        solved: 'Thread-per-request under wait.',
        before: 'Pools + reactive for concurrency.',
        modern: 'Watch pinning on synchronized; prefer java.util.concurrent locks in hot VT paths when needed.',
        stillUsed: true,
      },
    ],
  },
];
