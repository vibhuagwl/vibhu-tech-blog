package com.vibhu.connectionpool;

import static org.junit.jupiter.api.Assertions.*;

import com.vibhu.connectionpool.Fakes.FakeFactory;
import com.vibhu.connectionpool.Fakes.FakeValidator;
import com.vibhu.connectionpool.exception.ConnectionTimeoutException;
import com.vibhu.connectionpool.exception.PoolShutdownException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

class DefaultConnectionPoolTest {
  private DefaultConnectionPool pool;

  @AfterEach
  void tearDown() {
    if (pool != null) {
      pool.shutdown();
    }
  }

  private DefaultConnectionPool newPool(int min, int max) {
    FakeFactory factory = new FakeFactory();
    FakeValidator validator = new FakeValidator();
    ConnectionPoolConfig config =
        ConnectionPoolConfig.builder()
            .minPoolSize(min)
            .maxPoolSize(max)
            .acquisitionTimeout(Duration.ofSeconds(2))
            .idleTimeout(Duration.ofMinutes(5))
            .maxLifetime(Duration.ofMinutes(30))
            .maxConcurrentCreators(2)
            .maxWaiters(200)
            .healthCheckInterval(Duration.ZERO)
            .evictionInterval(Duration.ZERO)
            .leakDetectionThreshold(Duration.ZERO)
            .validateOnBorrow(true)
            .build();
    pool = new DefaultConnectionPool(config, factory, validator, RetryStrategy.none(), new PoolEventListener() {});
    return pool;
  }

  @Test
  void borrowReleaseBasics() {
    pool = newPool(1, 5);
    try (PooledConnection c = pool.borrow()) {
      assertNotNull(c);
      assertEquals(ConnectionState.BORROWED, c.state());
    }
    assertEquals(PoolState.RUNNING, pool.state());
    assertTrue(pool.metrics().totalBorrowed() >= 1);
    assertTrue(pool.metrics().idleConnections() >= 1);
  }

  @Test
  void doubleReleaseIsIdempotent() {
    pool = newPool(0, 2);
    PooledConnection c = pool.borrow();
    c.close();
    c.close();
    c.close();
    assertEquals(1, pool.metrics().idleConnections());
    // Capacity still 1 — not duplicated
    PooledConnection a = pool.borrow();
    PooledConnection b = pool.borrow(Duration.ofMillis(100));
    assertNotNull(a);
    // second may create new
    a.close();
    if (b != null) {
      b.close();
    }
  }

  @Test
  void maxPoolSizeNeverExceeded() throws Exception {
    pool = newPool(0, 5);
    List<PooledConnection> held = new ArrayList<>();
    for (int i = 0; i < 5; i++) {
      held.add(pool.borrow());
    }
    assertEquals(5, pool.metrics().totalConnections());
    assertThrows(ConnectionTimeoutException.class, () -> pool.borrow(Duration.ofMillis(50)));
    held.forEach(PooledConnection::close);
  }

  @Test
  void waiterReceivesReleasedConnection() throws Exception {
    pool = newPool(0, 1);
    PooledConnection held = pool.borrow();
    CountDownLatch started = new CountDownLatch(1);
    CountDownLatch done = new CountDownLatch(1);
    AtomicInteger got = new AtomicInteger();
    Thread t =
        new Thread(
            () -> {
              started.countDown();
              try (PooledConnection c = pool.borrow(Duration.ofSeconds(2))) {
                got.incrementAndGet();
              }
              done.countDown();
            });
    t.start();
    assertTrue(started.await(1, TimeUnit.SECONDS));
    Thread.sleep(100);
    held.close();
    assertTrue(done.await(2, TimeUnit.SECONDS));
    assertEquals(1, got.get());
  }

  @Test
  void concurrentBorrowRelease_1000Threads() throws Exception {
    pool = newPool(2, 50);
    int threads = 1000;
    ExecutorService exec = Executors.newFixedThreadPool(64);
    CyclicBarrier barrier = new CyclicBarrier(64);
    Set<Long> seenIds = ConcurrentHashMap.newKeySet();
    AtomicInteger overlaps = new AtomicInteger();
    Set<Long> inUse = ConcurrentHashMap.newKeySet();
    List<Future<?>> futures = new ArrayList<>();
    for (int i = 0; i < threads; i++) {
      futures.add(
          exec.submit(
              () -> {
                try {
                  // staggered start without requiring all 1000 at barrier
                  try (PooledConnection c = pool.borrow(Duration.ofSeconds(5))) {
                    long id = c.id();
                    if (!inUse.add(id)) {
                      overlaps.incrementAndGet();
                    }
                    seenIds.add(id);
                    Thread.sleep(1);
                    inUse.remove(id);
                  }
                } catch (Exception e) {
                  throw new RuntimeException(e);
                }
              }));
    }
    for (Future<?> f : futures) {
      f.get(30, TimeUnit.SECONDS);
    }
    exec.shutdown();
    assertEquals(0, overlaps.get(), "duplicate ownership detected");
    assertTrue(pool.metrics().totalConnections() <= 50);
    assertTrue(pool.metrics().idleConnections() >= 0);
    assertTrue(pool.metrics().activeConnections() >= 0);
  }

  @Test
  void shutdownRejectsBorrow() {
    pool = newPool(1, 2);
    pool.shutdown();
    assertThrows(PoolShutdownException.class, () -> pool.borrow());
    pool.shutdown(); // idempotent
  }

  @Test
  void invalidateDoesNotReturnToIdle() {
    pool = newPool(0, 3);
    PooledConnection c = pool.borrow();
    long before = pool.metrics().idleConnections();
    c.invalidate();
    assertTrue(pool.metrics().idleConnections() <= before);
    // Can still borrow a fresh one
    try (PooledConnection c2 = pool.borrow()) {
      assertNotNull(c2);
    }
  }

  @Test
  void tryWithResourcesReturnsToPool() {
    pool = newPool(0, 2);
    try (PooledConnection c = pool.borrow()) {
      assertEquals(ConnectionState.BORROWED, c.state());
    }
    assertEquals(1, pool.metrics().idleConnections());
  }

  @Test
  void creationFailureDoesNotCorruptPool() {
    FakeFactory factory = new FakeFactory();
    factory.alwaysFail(() -> new com.vibhu.connectionpool.exception.ConnectionCreationException("down"));
    FakeValidator validator = new FakeValidator();
    ConnectionPoolConfig config =
        ConnectionPoolConfig.builder()
            .minPoolSize(0)
            .maxPoolSize(5)
            .acquisitionTimeout(Duration.ofMillis(200))
            .maxCreateRetries(0)
            .maxConcurrentCreators(1)
            .healthCheckInterval(Duration.ZERO)
            .evictionInterval(Duration.ZERO)
            .build();
    pool =
        new DefaultConnectionPool(
            config, factory, validator, RetryStrategy.none(), new PoolEventListener() {});
    assertThrows(Exception.class, () -> pool.borrow(Duration.ofMillis(300)));
    assertEquals(0, pool.metrics().totalConnections());
    factory.clearFailures();
    try (PooledConnection c = pool.borrow()) {
      assertNotNull(c);
    }
  }
}
