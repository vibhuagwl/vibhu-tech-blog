package com.vibhu.spring.cache;

import static org.assertj.core.api.Assertions.assertThat;

import com.vibhu.spring.cache.repo.PaymentRepository;
import com.vibhu.spring.cache.service.PaymentCacheService;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class PaymentCacheServiceTest {

  @Autowired PaymentCacheService payments;
  @Autowired PaymentRepository repo;

  @BeforeEach
  void reset() {
    repo.resetQueryCount();
    payments.evict("P100");
  }

  @Test
  void secondSpringCacheReadDoesNotHitDbAgain() {
    payments.getCached("P100");
    long afterFirst = repo.queryCount();
    payments.getCached("P100");
    assertThat(repo.queryCount()).isEqualTo(afterFirst);
  }

  @Test
  void stampedeGuardLimitsDbLoadUnderConcurrency() throws Exception {
    payments.evict("P100");
    repo.resetQueryCount();
    int threads = 40;
    ExecutorService pool = Executors.newFixedThreadPool(threads);
    List<Callable<String>> tasks = new ArrayList<>();
    for (int i = 0; i < threads; i++) {
      tasks.add(() -> payments.loadWithStampedeGuard("P100").status());
    }
    List<Future<String>> futures = pool.invokeAll(tasks);
    pool.shutdown();
    pool.awaitTermination(10, TimeUnit.SECONDS);
    for (Future<String> f : futures) {
      assertThat(f.get()).isEqualTo("SETTLED");
    }
    // Without a guard this would be ~40; with guard typically << threads
    assertThat(repo.queryCount()).isLessThan(threads);
  }

  @Test
  void ttlJitterIsWithinExpectedBand() {
    for (int i = 0; i < 20; i++) {
      long seconds = PaymentCacheService.ttlWithJitter().toSeconds();
      assertThat(seconds).isBetween(330L, 419L);
    }
  }

  @Test
  void updateStatusEvictsCache() {
    payments.getCached("P100");
    long before = repo.queryCount();
    payments.updateStatus("P100", "REFUNDED");
    payments.getCached("P100");
    assertThat(repo.queryCount()).isGreaterThan(before);
  }
}
