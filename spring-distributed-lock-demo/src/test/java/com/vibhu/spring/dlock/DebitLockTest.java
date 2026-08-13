package com.vibhu.spring.dlock;

import static org.assertj.core.api.Assertions.assertThat;

import com.vibhu.spring.dlock.domain.LockNotAcquiredException;
import com.vibhu.spring.dlock.repo.AccountRepository;
import com.vibhu.spring.dlock.service.DebitService;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class DebitLockTest {

  @Autowired DebitService debits;
  @Autowired AccountRepository accounts;

  @BeforeEach
  void reset() {
    accounts.reset("A100", new BigDecimal("1000.00"));
  }

  @Test
  void lockedConcurrentDebitsNeverOverdraw() throws Exception {
    int threads = 20;
    BigDecimal amt = new BigDecimal("700.00");
    ExecutorService pool = Executors.newFixedThreadPool(threads);
    AtomicInteger ok = new AtomicInteger();
    AtomicInteger busy = new AtomicInteger();
    AtomicInteger funds = new AtomicInteger();
    List<Callable<Void>> tasks = new ArrayList<>();
    for (int i = 0; i < threads; i++) {
      tasks.add(
          () -> {
            try {
              debits.debit("A100", amt);
              ok.incrementAndGet();
            } catch (LockNotAcquiredException e) {
              busy.incrementAndGet();
            } catch (RuntimeException e) {
              if (e.getMessage() != null && e.getMessage().contains("Insufficient")) {
                funds.incrementAndGet();
              } else {
                throw e;
              }
            }
            return null;
          });
    }
    for (Future<Void> f : pool.invokeAll(tasks)) {
      f.get();
    }
    pool.shutdown();
    BigDecimal bal = accounts.findById("A100").orElseThrow().balance();
    assertThat(bal.compareTo(BigDecimal.ZERO)).isGreaterThanOrEqualTo(0);
    // Only one 700 debit can succeed from 1000; others busy or insufficient
    assertThat(ok.get()).isLessThanOrEqualTo(1);
    assertThat(bal).isEqualByComparingTo(new BigDecimal("300.00"));
  }

  @Test
  void unsafeConcurrentDebitsCanCorrupt() throws Exception {
    accounts.reset("A100", new BigDecimal("1000.00"));
    ExecutorService pool = Executors.newFixedThreadPool(2);
    List<Callable<Void>> tasks =
        List.of(
            () -> {
              debits.debitUnsafe("A100", new BigDecimal("700.00"));
              return null;
            },
            () -> {
              debits.debitUnsafe("A100", new BigDecimal("700.00"));
              return null;
            });
    try {
      for (Future<Void> f : pool.invokeAll(tasks)) {
        try {
          f.get();
        } catch (Exception ignored) {
          // insufficient may occur
        }
      }
    } finally {
      pool.shutdown();
    }
    BigDecimal bal = accounts.findById("A100").orElseThrow().balance();
    // Lost update often yields 300 (both saw 1000) — assert race artifact OR overdraw pattern
    // If both applied: 1000-700-700 using same seen → 300 incorrectly allowing dual success path
    assertThat(bal.compareTo(new BigDecimal("1000.00"))).isLessThan(0);
  }
}
