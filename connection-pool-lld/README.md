# Architect-Level Connection Pool LLD (Java 21)

Production-grade connection pool for Principal / Staff / Distinguished Engineer LLD interviews.

## Build & test

```bash
cd connection-pool-lld
mvn test
```

## Design at a glance

```text
Application Threads
       |
       v
+----------------------+
| DefaultConnectionPool|
+----------------------+
 | idle ArrayDeque (lock)
 | all ConcurrentHashMap
 | create Semaphore
 | Condition notEmpty
 | Evictor / Health / Leak
       |
       v
 ConnectionFactory → external resource
```

### Core concurrency choices

| Decision | Choice | Why |
|---|---|---|
| Waiting | `ReentrantLock` + `Condition` | No busy-wait; timeout + interrupt; optional fairness |
| Idle bag | `ArrayDeque` under lock | O(1) poll/offer; linearization on poll |
| Create throttle | `Semaphore(maxConcurrentCreators)` | Prevents connection storms |
| Metrics | `LongAdder` + `AtomicInteger` | Low contention counters |
| Slow ops | Outside lock | Create / validate / close never hold pool lock |
| Double release | `AtomicBoolean claimReturn` | Idempotent; first closer wins |
| Circuit | Consecutive-failure breaker | Bounds hammering a down backend |

### Invariants

1. `totalConnections <= maxPoolSize`
2. A connection is never IDLE and BORROWED at once
3. Double `close()` does not inflate idle count
4. Borrow after shutdown fails cleanly
5. Create reservation happens under lock before unlock+create

## Interview article

See the companion MDX: `content/lld/lld-connection-pool.mdx` (Architect LLD write-up with walkthroughs + 35 attack questions).
