package com.vibhu.connectionpool;

import com.vibhu.connectionpool.exception.ConnectionCreationException;
import com.vibhu.connectionpool.exception.ConnectionTimeoutException;
import com.vibhu.connectionpool.exception.InvalidConnectionException;
import com.vibhu.connectionpool.exception.PoolCapacityExceededException;
import com.vibhu.connectionpool.exception.PoolShutdownException;
import com.vibhu.connectionpool.metrics.DefaultPoolMetrics;
import com.vibhu.connectionpool.metrics.PoolMetrics;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Production-oriented connection pool.
 *
 * <h2>Concurrency model</h2>
 * <ul>
 *   <li>{@link ReentrantLock} + {@link Condition} gate borrow waits (no busy-wait).</li>
 *   <li>Idle bag is an {@link ArrayDeque} guarded by the same lock — O(1) take/put.</li>
 *   <li>{@link Semaphore} throttles concurrent creators (prevents connection storms).</li>
 *   <li>Creation / validation / close happen <b>outside</b> the pool lock.</li>
 *   <li>{@link ConcurrentHashMap} tracks all live wrappers for eviction/leak scans.</li>
 * </ul>
 *
 * <h2>Invariants</h2>
 * <ul>
 *   <li>{@code totalConnections <= maxPoolSize}</li>
 *   <li>{@code active + idle == total} (modulo in-flight create accounting)</li>
 *   <li>A connection is never IDLE and BORROWED simultaneously</li>
 *   <li>Double release is idempotent</li>
 * </ul>
 */
public final class DefaultConnectionPool implements ConnectionPool {
  private final ConnectionPoolConfig config;
  private final ConnectionFactory factory;
  private final ConnectionValidator validator;
  private final RetryStrategy retryStrategy;
  private final PoolEventListener events;
  private final DefaultPoolMetrics metrics = new DefaultPoolMetrics();

  private final ReentrantLock lock;
  private final Condition notEmpty;
  private final ArrayDeque<PooledConnection> idle = new ArrayDeque<>();
  private final ConcurrentHashMap<Long, PooledConnection> all = new ConcurrentHashMap<>();
  private final Semaphore createPermits;
  private final AtomicLong idSeq = new AtomicLong();
  private final AtomicReference<PoolState> poolState = new AtomicReference<>(PoolState.RUNNING);

  /** Connections created or reserved against maxPoolSize. Guarded by lock. */
  private int totalConnections;

  /** Waiters currently blocked on notEmpty. Guarded by lock. */
  private int waiters;

  private final ConnectionLeakDetector leakDetector;
  private final ConnectionEvictor evictor;
  private final ConnectionHealthChecker healthChecker;
  private final CreationCircuitBreaker circuitBreaker;

  public DefaultConnectionPool(
      ConnectionPoolConfig config,
      ConnectionFactory factory,
      ConnectionValidator validator) {
    this(config, factory, validator, RetryStrategy.exponentialWithJitter(config.maxCreateRetries() + 1,
            Duration.ofMillis(50), Duration.ofSeconds(2)),
        new PoolEventListener() {});
  }

  public DefaultConnectionPool(
      ConnectionPoolConfig config,
      ConnectionFactory factory,
      ConnectionValidator validator,
      RetryStrategy retryStrategy,
      PoolEventListener events) {
    this.config = Objects.requireNonNull(config);
    this.factory = Objects.requireNonNull(factory);
    this.validator = Objects.requireNonNull(validator);
    this.retryStrategy = Objects.requireNonNull(retryStrategy);
    this.events = Objects.requireNonNull(events);
    this.lock = new ReentrantLock(config.fair());
    this.notEmpty = lock.newCondition();
    this.createPermits = new Semaphore(config.maxConcurrentCreators(), config.fair());
    this.circuitBreaker = new CreationCircuitBreaker(5, Duration.ofSeconds(5));
    this.leakDetector = new ConnectionLeakDetector(this, config, events, metrics);
    this.evictor = new ConnectionEvictor(this, config, events, metrics);
    this.healthChecker = new ConnectionHealthChecker(this, config, validator, events, metrics);
    warmMinSize();
    leakDetector.start();
    evictor.start();
    healthChecker.start();
  }

  private void warmMinSize() {
    for (int i = 0; i < config.minPoolSize(); i++) {
      try {
        PooledConnection pc = createNewConnection();
        lock.lock();
        try {
          ensureRunning();
          pc.markIdle();
          idle.addLast(pc);
          publishCounts();
        } finally {
          lock.unlock();
        }
      } catch (RuntimeException ex) {
        // Min-size warm-up is best-effort; pool remains usable with on-demand creation.
        events.onCreationFailed(ex.getMessage());
      }
    }
  }

  @Override
  public PooledConnection borrow() {
    return borrow(config.acquisitionTimeout());
  }

  @Override
  public PooledConnection borrow(Duration timeout) {
    Objects.requireNonNull(timeout);
    long deadline = System.nanoTime() + timeout.toNanos();
    int validationFailures = 0;
    while (true) {
      ensureRunningUnlocked();
      PooledConnection candidate = pollOrWaitOrCreate(deadline);
      if (candidate == null) {
        metrics.incTimedOut();
        events.onTimeout();
        throw new ConnectionTimeoutException(
            "Timed out waiting for connection after " + timeout.toMillis() + "ms");
      }
      if (!config.validateOnBorrow()) {
        metrics.incBorrowed();
        events.onBorrowed(candidate.id());
        return candidate;
      }
      // Validation OUTSIDE lock
      boolean valid = safeValidate(candidate);
      if (valid) {
        metrics.incBorrowed();
        events.onBorrowed(candidate.id());
        return candidate;
      }
      metrics.incValidationFailures();
      events.onValidationFailed(candidate.id());
      destroyConnection(candidate, "validation-failed-on-borrow");
      validationFailures++;
      if (validationFailures > config.maxPoolSize()) {
        throw new InvalidConnectionException("Repeated validation failures while borrowing");
      }
      // Loop: try another idle / create replacement within remaining timeout
    }
  }

  /**
   * Critical section for capacity / idle bag / waiter accounting. Creation happens outside.
   *
   * @return borrowed connection, or null on timeout
   */
  private PooledConnection pollOrWaitOrCreate(long deadlineNanos) {
    lock.lock();
    try {
      while (true) {
        ensureRunning();
        PooledConnection idleConn = idle.pollFirst();
        if (idleConn != null) {
          // Linearization point: removal from idle under lock — only one thread gets this conn.
          if (idleConn.ageExceeded(config.maxLifetime())) {
            // Close outside later — account and destroy
            totalConnections--;
            all.remove(idleConn.id());
            publishCounts();
            lock.unlock();
            try {
              physicalClose(idleConn, "max-lifetime-on-borrow");
            } finally {
              lock.lock();
            }
            continue;
          }
          idleConn.markBorrowed(config.leakDetectionThreshold().toNanos() > 0);
          publishCounts();
          return idleConn;
        }

        if (totalConnections < config.maxPoolSize()) {
          // Reserve a slot before unlocking so we never exceed maxPoolSize.
          totalConnections++;
          publishCounts();
          lock.unlock();
          PooledConnection created = null;
          try {
            created = createNewConnectionReserved();
            lock.lock();
            try {
              ensureRunning();
              created.markBorrowed(config.leakDetectionThreshold().toNanos() > 0);
              publishCounts();
              return created;
            } catch (RuntimeException ex) {
              all.remove(created.id());
              totalConnections--;
              publishCounts();
              notEmpty.signal();
              lock.unlock();
              try {
                created.closeUnderlying();
              } catch (RuntimeException ignored) {
                // retiring failed handoff
              }
              metrics.incClosed();
              throw ex;
            }
          } catch (RuntimeException ex) {
            if (created == null) {
              lock.lock();
              totalConnections--;
              publishCounts();
              notEmpty.signal();
              // hold lock — outer finally unlocks
            }
            throw ex;
          }
        }

        // Pool exhausted — wait with backpressure
        if (waiters >= config.maxWaiters()) {
          throw new PoolCapacityExceededException(
              "Too many waiters: " + waiters + " >= maxWaiters " + config.maxWaiters());
        }
        long remaining = deadlineNanos - System.nanoTime();
        if (remaining <= 0) {
          return null;
        }
        waiters++;
        publishCounts();
        try {
          if (!notEmpty.await(remaining, TimeUnit.NANOSECONDS)) {
            return null;
          }
        } catch (InterruptedException ie) {
          Thread.currentThread().interrupt();
          throw new ConnectionTimeoutException("Interrupted while waiting for connection");
        } finally {
          waiters--;
          publishCounts();
        }
        // Spurious wake / release happened — loop
      }
    } finally {
      if (lock.isHeldByCurrentThread()) {
        lock.unlock();
      }
    }
  }

  private PooledConnection createNewConnection() {
    // Used for warm-up — reserves slot under lock by caller or increments here carefully
    lock.lock();
    try {
      ensureRunning();
      if (totalConnections >= config.maxPoolSize()) {
        throw new PoolCapacityExceededException("Cannot create: at maxPoolSize");
      }
      totalConnections++;
    } finally {
      lock.unlock();
    }
    try {
      return createNewConnectionReserved();
    } catch (RuntimeException ex) {
      lock.lock();
      try {
        totalConnections--;
        publishCounts();
      } finally {
        lock.unlock();
      }
      throw ex;
    }
  }

  /** Slot already reserved in totalConnections. */
  private PooledConnection createNewConnectionReserved() {
    if (!circuitBreaker.allowRequest()) {
      metrics.incCreationFailures();
      events.onCreationFailed("circuit-open");
      throw new ConnectionCreationException("Connection creation circuit is open");
    }
    boolean acquired;
    try {
      acquired = createPermits.tryAcquire(config.acquisitionTimeout().toMillis(), TimeUnit.MILLISECONDS);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new ConnectionCreationException("Interrupted acquiring create permit", e);
    }
    if (!acquired) {
      metrics.incCreationFailures();
      throw new ConnectionCreationException("Timed out acquiring connection-create permit");
    }
    try {
      int attempt = 0;
      while (true) {
        ensureRunningUnlocked();
        try {
          Connection raw = factory.create();
          long id = idSeq.incrementAndGet();
          PooledConnection pc = new PooledConnection(id, raw, this);
          all.put(id, pc);
          metrics.incCreated();
          events.onCreated(id);
          circuitBreaker.recordSuccess();
          return pc;
        } catch (RuntimeException ex) {
          metrics.incCreationFailures();
          events.onCreationFailed(ex.getMessage());
          circuitBreaker.recordFailure();
          Optional<Duration> delay = retryStrategy.nextDelay(attempt, ex);
          if (delay.isEmpty()) {
            throw ex instanceof ConnectionCreationException cce
                ? cce
                : new ConnectionCreationException("Failed to create connection", ex);
          }
          sleep(delay.get());
          attempt++;
        }
      }
    } finally {
      createPermits.release();
    }
  }

  private boolean safeValidate(PooledConnection pc) {
    ConnectionState before = pc.state();
    if (before != ConnectionState.BORROWED && before != ConnectionState.IDLE) {
      // Already being torn down
      return false;
    }
    pc.forceState(ConnectionState.VALIDATING);
    try {
      return validator.isValid(pc.underlying()) && pc.underlying().isOpen();
    } catch (RuntimeException ex) {
      return false;
    } finally {
      // Restored by caller to BORROWED on success, or destroyed on failure
      if (pc.state() == ConnectionState.VALIDATING) {
        pc.forceState(ConnectionState.BORROWED);
      }
    }
  }

  @Override
  public void release(PooledConnection connection) {
    Objects.requireNonNull(connection);
    if (connection.pool() != this) {
      throw new InvalidConnectionException("Connection does not belong to this pool");
    }
    // Idempotent double-release: only first claim wins
    if (!connection.claimReturn()) {
      return;
    }

    ConnectionState st = connection.state();
    if (st == ConnectionState.RETIRE_ON_RETURN
        || st == ConnectionState.INVALID
        || connection.ageExceeded(config.maxLifetime())) {
      destroyConnection(connection, "retire-on-return");
      metrics.incReleased();
      events.onReleased(connection.id());
      return;
    }

    if (config.validateOnReturn()) {
      boolean valid = safeValidate(connection);
      if (!valid) {
        metrics.incValidationFailures();
        destroyConnection(connection, "validation-failed-on-return");
        metrics.incReleased();
        events.onReleased(connection.id());
        return;
      }
    }

    lock.lock();
    try {
      if (poolState.get() != PoolState.RUNNING) {
        // Shutting down — close instead of returning to idle
        lock.unlock();
        destroyConnection(connection, "release-during-shutdown");
        metrics.incReleased();
        events.onReleased(connection.id());
        return;
      }
      connection.markIdle();
      idle.addLast(connection);
      notEmpty.signal();
      publishCounts();
    } finally {
      if (lock.isHeldByCurrentThread()) {
        lock.unlock();
      }
    }
    metrics.incReleased();
    events.onReleased(connection.id());
  }

  @Override
  public void invalidate(PooledConnection connection) {
    Objects.requireNonNull(connection);
    if (connection.pool() != this) {
      throw new InvalidConnectionException("Connection does not belong to this pool");
    }
    connection.claimReturn(); // prevent concurrent release from returning to idle
    connection.tryMarkInvalidFrom(ConnectionState.BORROWED);
    connection.tryMarkInvalidFrom(ConnectionState.RETIRE_ON_RETURN);
    connection.tryMarkInvalidFrom(ConnectionState.IDLE);
    connection.tryMarkInvalidFrom(ConnectionState.VALIDATING);
    destroyConnection(connection, "invalidate");
    events.onInvalidated(connection.id(), "invalidate");
  }

  void destroyConnection(PooledConnection connection, String reason) {
    lock.lock();
    boolean removedIdle = idle.remove(connection);
    if (all.remove(connection.id()) != null || removedIdle) {
      totalConnections = Math.max(0, totalConnections - 1);
    }
    notEmpty.signal();
    publishCounts();
    lock.unlock();
    physicalClose(connection, reason);
  }

  private void physicalClose(PooledConnection connection, String reason) {
    try {
      connection.closeUnderlying();
    } catch (RuntimeException ignored) {
      // swallow — already retiring
    } finally {
      metrics.incClosed();
      events.onEvicted(connection.id(), reason);
    }
  }

  @Override
  public void shutdown() {
    if (!poolState.compareAndSet(PoolState.RUNNING, PoolState.SHUTTING_DOWN)
        && poolState.get() == PoolState.CLOSED) {
      return; // idempotent
    }
    if (poolState.get() == PoolState.CLOSED) {
      return;
    }
    poolState.set(PoolState.SHUTTING_DOWN);

    leakDetector.stop();
    evictor.stop();
    healthChecker.stop();

    lock.lock();
    try {
      notEmpty.signalAll(); // wake waiters — they will see SHUTTING_DOWN
      List<PooledConnection> toClose = new ArrayList<>(idle);
      idle.clear();
      lock.unlock();
      for (PooledConnection pc : toClose) {
        physicalClose(pc, "shutdown-idle");
        all.remove(pc.id());
      }

      long deadline = System.nanoTime() + config.shutdownGracePeriod().toNanos();
      while (System.nanoTime() < deadline) {
        if (all.isEmpty()) {
          break;
        }
        sleep(Duration.ofMillis(50));
      }
      // Force-close remaining borrowed connections
      for (PooledConnection pc : new ArrayList<>(all.values())) {
        try {
          pc.claimReturn();
          physicalClose(pc, "shutdown-force");
        } finally {
          all.remove(pc.id());
        }
      }
      lock.lock();
      totalConnections = 0;
      publishCounts();
    } finally {
      if (lock.isHeldByCurrentThread()) {
        lock.unlock();
      }
      poolState.set(PoolState.CLOSED);
      events.onShutdown();
    }
  }

  @Override
  public PoolMetrics metrics() {
    return metrics;
  }

  @Override
  public PoolState state() {
    return poolState.get();
  }

  ConnectionPoolConfig config() {
    return config;
  }

  ConcurrentHashMap<Long, PooledConnection> allConnections() {
    return all;
  }

  void markRetireIfAged(PooledConnection pc) {
    if (pc.ageExceeded(config.maxLifetime()) && pc.state() == ConnectionState.BORROWED) {
      pc.markRetireOnReturn();
    }
  }

  /** Evict idle connections above minPoolSize whose idle time exceeded. */
  void evictIdle() {
    List<PooledConnection> victims = new ArrayList<>();
    lock.lock();
    try {
      if (poolState.get() != PoolState.RUNNING) {
        return;
      }
      int canEvict = Math.max(0, idle.size() - config.minPoolSize());
      if (canEvict == 0) {
        return;
      }
      List<PooledConnection> snapshot = new ArrayList<>(idle);
      for (PooledConnection pc : snapshot) {
        if (canEvict == 0) {
          break;
        }
        if (pc.idleExceeded(config.idleTimeout()) && idle.remove(pc)) {
          // Removed from idle under lock — cannot be borrowed anymore
          all.remove(pc.id());
          totalConnections--;
          victims.add(pc);
          canEvict--;
          metrics.incEvicted();
        }
      }
      publishCounts();
    } finally {
      lock.unlock();
    }
    for (PooledConnection pc : victims) {
      physicalClose(pc, "idle-timeout");
      events.onEvicted(pc.id(), "idle-timeout");
    }
  }

  /** Validate idle connections; remove invalid. */
  void healthCheckIdle() {
    List<PooledConnection> toCheck;
    lock.lock();
    try {
      if (poolState.get() != PoolState.RUNNING) {
        return;
      }
      toCheck = new ArrayList<>(idle);
    } finally {
      lock.unlock();
    }
    for (PooledConnection pc : toCheck) {
      // Try to claim from idle under lock for exclusive validation
      lock.lock();
      boolean claimed;
      try {
        claimed = idle.remove(pc);
        if (claimed) {
          pc.forceState(ConnectionState.VALIDATING);
        }
      } finally {
        lock.unlock();
      }
      if (!claimed) {
        continue; // borrowed by someone else
      }
      boolean valid;
      try {
        valid = validator.isValid(pc.underlying()) && pc.underlying().isOpen();
      } catch (RuntimeException ex) {
        valid = false;
      }
      if (valid) {
        lock.lock();
        try {
          if (poolState.get() == PoolState.RUNNING) {
            pc.markIdle();
            idle.addLast(pc);
            notEmpty.signal();
          } else {
            all.remove(pc.id());
            totalConnections--;
            lock.unlock();
            physicalClose(pc, "health-during-shutdown");
            continue;
          }
          publishCounts();
        } finally {
          if (lock.isHeldByCurrentThread()) {
            lock.unlock();
          }
        }
      } else {
        metrics.incValidationFailures();
        events.onValidationFailed(pc.id());
        lock.lock();
        try {
          all.remove(pc.id());
          totalConnections--;
          publishCounts();
        } finally {
          lock.unlock();
        }
        physicalClose(pc, "health-check-failed");
      }
    }
  }

  private void ensureRunning() {
    PoolState s = poolState.get();
    if (s != PoolState.RUNNING) {
      throw new PoolShutdownException("Pool is " + s);
    }
  }

  private void ensureRunningUnlocked() {
    PoolState s = poolState.get();
    if (s != PoolState.RUNNING) {
      throw new PoolShutdownException("Pool is " + s);
    }
  }

  private void publishCounts() {
    // Must be called under lock for idle/total/waiters consistency
    metrics.setIdle(idle.size());
    metrics.setTotal(totalConnections);
    metrics.setWaiting(waiters);
    metrics.setActive(Math.max(0, totalConnections - idle.size()));
  }

  private static void sleep(Duration d) {
    try {
      Thread.sleep(d.toMillis());
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new ConnectionCreationException("Interrupted during retry backoff", e);
    }
  }

  // package-visible for PooledConnection ownership check
  DefaultConnectionPool pool() {
    return this;
  }
}
