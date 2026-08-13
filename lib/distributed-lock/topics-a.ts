import type {LockTopic} from './types';

export const TOPICS_A: LockTopic[] = [
  {
    id: 'db-for-update',
    title: 'Database Row Lock — SELECT FOR UPDATE',
    badge: 'DB',
    problem: 'Serialize debit of Account A100 inside one DB transaction.',
    whenToUse: 'Critical section IS the DB row update; short TX; PostgreSQL already SoR.',
    whenAvoid: 'Long external I/O while holding the row lock (connection pool death).',
    mermaid: `sequenceDiagram
  participant A as App-1
  participant DB as PostgreSQL
  participant B as App-2
  A->>DB: BEGIN + SELECT FOR UPDATE
  DB-->>A: row locked
  B->>DB: SELECT FOR UPDATE
  Note over B,DB: WAIT
  A->>DB: UPDATE balance + COMMIT
  DB-->>B: lock granted`,
    code: `@Entity
public class Account {
  @Id String id;
  BigDecimal balance;
  public void debit(BigDecimal amt) {
    if (balance.compareTo(amt) < 0) throw new InsufficientFunds();
    balance = balance.subtract(amt);
  }
}

public interface AccountRepository extends JpaRepository<Account, String> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select a from Account a where a.id = :id")
  Optional<Account> findByIdForUpdate(@Param("id") String id);
}

@Service
public class DebitService {
  @Transactional
  public void debit(String accountId, BigDecimal amount) {
    Account a = repo.findByIdForUpdate(accountId).orElseThrow();
    a.debit(amount);
    // COMMIT releases FOR UPDATE
  }
}`,
    failure: 'Deadlocks on multi-row order; long TX holds connections; lock wait timeouts.',
    production: 'Deterministic lock order (min account id first); short TX; statement_timeout.',
    interview30s: 'Pessimistic row lock ties mutual exclusion to the DB transaction lifetime.',
    followUp: 'FOR UPDATE NOWAIT vs SKIP LOCKED?',
    tradeoff: 'Strong correctness vs DB contention under hot accounts.',
    memoryTrick: 'FOR UPDATE = put a hand on the ledger row until COMMIT.',
  },
  {
    id: 'db-lock-table',
    title: 'Database Lock Table',
    badge: 'DB',
    problem: 'Need coordination without locking the business row itself (or cross-resource).',
    whenToUse: 'Simple systems; no Redis; advisory-style named locks in SQL.',
    whenAvoid: 'High QPS lock churn — table becomes hotspot.',
    mermaid: `flowchart TD
  A1[App-1 INSERT lock_name] -->|OK| OWN[Owner]
  A2[App-2 INSERT same] -->|UK violation| BUSY[Locked]
  OWN --> WORK[Critical section]
  WORK --> DEL[DELETE / expire]`,
    code: `CREATE TABLE distributed_lock (
  lock_name   VARCHAR(128) PRIMARY KEY,
  owner_id    VARCHAR(64) NOT NULL,
  locked_at   TIMESTAMPTZ NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL
);

public boolean tryAcquire(String name, String owner, Duration ttl) {
  try {
    jdbc.update("""
      INSERT INTO distributed_lock(lock_name, owner_id, locked_at, expires_at)
      VALUES (?,?,now(), now() + ?::interval)
      """, name, owner, ttl.getSeconds() + " seconds");
    return true;
  } catch (DuplicateKeyException e) {
    // steal if expired
    return jdbc.update("""
      UPDATE distributed_lock SET owner_id=?, locked_at=now(),
        expires_at=now()+ (?||' seconds')::interval
      WHERE lock_name=? AND expires_at < now()
      """, owner, ttl.getSeconds(), name) == 1;
  }
}

public void release(String name, String owner) {
  jdbc.update("DELETE FROM distributed_lock WHERE lock_name=? AND owner_id=?", name, owner);
}`,
    failure: 'Stale locks if no expiry; clock skew; release without owner check.',
    production: 'Always expires_at; owner token; periodic reaper; index on expires_at.',
    interview30s: 'Unique lock_name row = mutex; INSERT wins, duplicate = busy; TTL cleans crashes.',
    followUp: 'Postgres advisory locks vs lock table?',
    tradeoff: 'No new infra vs DB as lock SPOF/hotspot.',
    memoryTrick: 'Lock table = reservation book with unique titles.',
  },
  {
    id: 'redis-lock',
    title: 'Redis SET NX PX',
    badge: 'Redis',
    problem: 'Fast cross-pod mutex for account:A100 debit coordination.',
    whenToUse: 'Short critical sections; Redis already in stack; fail policy defined.',
    whenAvoid: 'As sole correctness for money without DB invariants / fencing.',
    mermaid: `flowchart LR
  A1[App-1] --> R[(Redis)]
  A2[App-2] --> R
  A3[App-3] --> R
  R --> L[lock:account:A100 = token TTL]`,
    code: `String key = "lock:account:" + accountId;
String token = UUID.randomUUID().toString();

Boolean ok = redis.opsForValue()
    .setIfAbsent(key, token, Duration.ofSeconds(10)); // SET NX PX

if (!Boolean.TRUE.equals(ok)) {
  throw new LockNotAcquiredException(key);
}
try {
  debitInDb(accountId, amount);
} finally {
  safeUnlock(key, token); // Lua — see next section
}`,
    failure: 'TTL < work → two owners; DEL without token → steal; Redis down → policy needed.',
    production: 'NX+PX+token; Lua unlock; metrics; never longer than DB TX needs.',
    interview30s: 'SET key token NX PX = create-only with auto-expiry; token proves ownership.',
    followUp: 'Redlock multi-node controversy?',
    tradeoff: 'Speed/ops simplicity vs not a consensus algorithm.',
    memoryTrick: 'NX = only if empty seat; PX = seat timer.',
  },
  {
    id: 'redis-unlock',
    title: 'Safe Redis Unlock (Token + Lua)',
    badge: 'Redis',
    problem: 'Naive DEL after expiry can delete another instance\'s lock.',
    whenToUse: 'Always for manual Redis locks.',
    whenAvoid: 'N/A — unsafe DEL is a footgun.',
    mermaid: `sequenceDiagram
  participant A as App-1
  participant R as Redis
  participant B as App-2
  A->>R: SET NX PX tokenA
  Note over A: GC / slow path
  R-->>R: TTL expires
  B->>R: SET NX PX tokenB
  A->>R: DEL lock (unsafe)
  Note over B: B's lock stolen`,
    code: `private static final DefaultRedisScript<Long> UNLOCK = new DefaultRedisScript<>(
  """
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  else
    return 0
  end
  """, Long.class);

public void safeUnlock(String key, String token) {
  redis.execute(UNLOCK, List.of(key), token);
}
// GET==mine? DEL : no-op`,
    failure: 'Compare-then-delete in two RTTs without Lua = race.',
    production: 'Always atomic compare-and-del; never unlock others\' tokens.',
    interview30s: 'Only delete if value still equals my token — Lua makes it atomic.',
    followUp: 'Why not GET then DEL in Java?',
    tradeoff: 'One extra script vs correctness.',
    memoryTrick: 'Show your badge before returning the key.',
  },
  {
    id: 'redisson',
    title: 'Redisson RLock',
    badge: 'Redis',
    problem: 'Want production Redis locking without hand-rolled Lua/watchdog.',
    whenToUse: 'Redis stack; need lease renewal / tryLock APIs.',
    whenAvoid: 'Introducing Redis only for locks when DB FOR UPDATE suffices.',
    mermaid: `flowchart TD
  TL[tryLock wait, lease] -->|FAIL| RET[Retry/fail]
  TL -->|OK| CS[Critical section]
  CS --> FIN[finally unlock]
  FIN --> WD[Watchdog stops]`,
    code: `@Bean
RedissonClient redisson() {
  Config cfg = new Config();
  cfg.useSingleServer().setAddress("redis://redis:6379");
  return Redisson.create(cfg);
}

RLock lock = redisson.getLock("account:" + accountId);
boolean acquired = lock.tryLock(5, 30, TimeUnit.SECONDS); // wait, lease
if (!acquired) throw new LockNotAcquiredException(accountId);
try {
  debitInDb(accountId, amount);
} finally {
  if (lock.isHeldByCurrentThread()) lock.unlock();
}
// lock() blocks; tryLock() non-blocking; lease+watchdog renews while held`,
    failure: 'Unlock on non-owner thread; ignoring wait timeout; Redis partition.',
    production: 'tryLock with wait+lease; unlock only if held; monitor acquire failures.',
    interview30s: 'RLock wraps Redis lock with wait/lease and optional watchdog renewal.',
    followUp: 'What if lease expires mid-critical despite watchdog?',
    tradeoff: 'Convenience vs Redis dependency + still not magic consensus.',
    memoryTrick: 'Redisson = Redis lock with a smart assistant.',
  },
];
