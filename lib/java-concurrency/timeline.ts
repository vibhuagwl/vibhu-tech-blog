import type {TimelineEra} from './types';

/** Verified against JDK history + OpenJDK JDK 25 project page. */
export const CONCURRENCY_TIMELINE: TimelineEra[] = [
  {
    version: 'Java 1.0',
    year: '1996',
    features: [
      {name: 'Thread / Runnable', status: 'FINAL'},
      {name: 'synchronized / wait / notify', status: 'FINAL'},
      {name: 'volatile (later strengthened by JMM)', status: 'FINAL'},
    ],
  },
  {
    version: 'Java 5',
    year: '2004',
    features: [
      {name: 'java.util.concurrent', status: 'FINAL'},
      {name: 'ExecutorService / ThreadPoolExecutor / Future / Callable', status: 'FINAL'},
      {name: 'ReentrantLock / RWLock / Condition / Semaphore / Latch / Barrier', status: 'FINAL'},
      {name: 'Atomic* / ConcurrentHashMap / BlockingQueue', status: 'FINAL'},
    ],
  },
  {
    version: 'Java 7',
    year: '2011',
    features: [
      {name: 'ForkJoinPool / Phaser / TransferQueue', status: 'FINAL'},
    ],
  },
  {
    version: 'Java 8',
    year: '2014',
    features: [
      {name: 'CompletableFuture', status: 'FINAL'},
      {name: 'StampedLock / LongAdder / LongAccumulator', status: 'FINAL'},
      {name: 'ConcurrentHashMap redesign (bins/CAS)', status: 'FINAL'},
    ],
  },
  {
    version: 'Java 9',
    year: '2017',
    features: [
      {name: 'Flow API (Reactive Streams SPI)', status: 'FINAL'},
      {name: 'VarHandle', status: 'FINAL'},
    ],
  },
  {
    version: 'Java 19–20',
    features: [
      {name: 'Virtual Threads (preview lineage)', status: 'PREVIEW'},
      {name: 'Structured Concurrency / Scoped Values (preview lineage)', status: 'PREVIEW'},
    ],
  },
  {
    version: 'Java 21',
    year: '2023',
    features: [
      {name: 'Virtual Threads', status: 'FINAL', note: 'JEP 444'},
      {name: 'Structured Concurrency', status: 'PREVIEW'},
      {name: 'Scoped Values', status: 'PREVIEW'},
    ],
  },
  {
    version: 'Java 25',
    year: '2025',
    features: [
      {name: 'Scoped Values', status: 'FINAL', note: 'JEP 506 — production-ready'},
      {name: 'Structured Concurrency', status: 'PREVIEW', note: 'JEP 505 — 5th preview; NOT final'},
      {name: 'Virtual Threads ecosystem + pinning observability', status: 'FINAL'},
    ],
  },
];
