package com.vibhu.connectionpool;

import static org.junit.jupiter.api.Assertions.*;

import com.vibhu.connectionpool.Fakes.FakeFactory;
import com.vibhu.connectionpool.Fakes.FakeValidator;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

/** Stress / invariant suite for Architect LLD defense. */
class ConnectionPoolStressTest {
  private DefaultConnectionPool pool;

  @AfterEach
  void tearDown() {
    if (pool != null) {
      pool.shutdown();
    }
  }

  @Test
  void stress_1000Threads_max50_noDuplicateOwnership() throws Exception {
    FakeFactory factory = new FakeFactory();
    FakeValidator validator = new FakeValidator();
    ConnectionPoolConfig config =
        ConnectionPoolConfig.builder()
            .minPoolSize(5)
            .maxPoolSize(50)
            .acquisitionTimeout(Duration.ofSeconds(10))
            .maxConcurrentCreators(4)
            .maxWaiters(2000)
            .healthCheckInterval(Duration.ZERO)
            .evictionInterval(Duration.ZERO)
            .leakDetectionThreshold(Duration.ZERO)
            .build();
    pool =
        new DefaultConnectionPool(
            config, factory, validator, RetryStrategy.none(), new PoolEventListener() {});

    int threads = 1000;
    ExecutorService exec = Executors.newFixedThreadPool(100);
    Set<Long> inUse = ConcurrentHashMap.newKeySet();
    AtomicInteger overlaps = new AtomicInteger();
    AtomicInteger failures = new AtomicInteger();
    List<Future<?>> futures = new ArrayList<>();

    for (int i = 0; i < threads; i++) {
      futures.add(
          exec.submit(
              () -> {
                try (PooledConnection c = pool.borrow(Duration.ofSeconds(10))) {
                  long id = c.id();
                  if (!inUse.add(id)) {
                    overlaps.incrementAndGet();
                  }
                  Thread.sleep(2);
                  inUse.remove(id);
                } catch (Exception e) {
                  failures.incrementAndGet();
                }
              }));
    }
    for (Future<?> f : futures) {
      f.get(60, TimeUnit.SECONDS);
    }
    exec.shutdown();
    assertTrue(exec.awaitTermination(10, TimeUnit.SECONDS));

    assertEquals(0, overlaps.get(), "duplicate ownership");
    assertEquals(0, failures.get(), "unexpected borrow failures");
    assertTrue(pool.metrics().totalConnections() <= 50);
    assertTrue(pool.metrics().idleConnections() >= 0);
    assertTrue(pool.metrics().activeConnections() >= 0);
    assertTrue(pool.metrics().totalConnections() >= 0);
  }

  @Test
  void concurrentShutdownWhileBorrowing() throws Exception {
    FakeFactory factory = new FakeFactory();
    FakeValidator validator = new FakeValidator();
    ConnectionPoolConfig config =
        ConnectionPoolConfig.builder()
            .minPoolSize(0)
            .maxPoolSize(10)
            .acquisitionTimeout(Duration.ofSeconds(2))
            .maxConcurrentCreators(2)
            .healthCheckInterval(Duration.ZERO)
            .evictionInterval(Duration.ZERO)
            .build();
    pool =
        new DefaultConnectionPool(
            config, factory, validator, RetryStrategy.none(), new PoolEventListener() {});

    ExecutorService exec = Executors.newFixedThreadPool(32);
    AtomicInteger shutdownExceptions = new AtomicInteger();
    for (int i = 0; i < 64; i++) {
      exec.submit(
          () -> {
            try {
              try (PooledConnection c = pool.borrow(Duration.ofMillis(500))) {
                Thread.sleep(5);
              }
            } catch (Exception e) {
              shutdownExceptions.incrementAndGet();
            }
          });
    }
    Thread.sleep(50);
    pool.shutdown();
    pool.shutdown();
    exec.shutdown();
    assertTrue(exec.awaitTermination(5, TimeUnit.SECONDS));
    assertEquals(PoolState.CLOSED, pool.state());
  }
}
