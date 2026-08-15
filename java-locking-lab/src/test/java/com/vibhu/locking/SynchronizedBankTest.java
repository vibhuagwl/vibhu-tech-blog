package com.vibhu.locking;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class SynchronizedBankTest {

  @Test
  void synchronizedWithdrawAllowsOnlyOneSuccessful700From1000() throws Exception {
    BankAccount account = new BankAccount(1000);
    ExecutorService ex = Executors.newFixedThreadPool(8);
    CountDownLatch start = new CountDownLatch(1);
    AtomicInteger started = new AtomicInteger();
    for (int i = 0; i < 8; i++) {
      ex.submit(
          () -> {
            started.incrementAndGet();
            start.await();
            account.safeWithdraw(700);
            return null;
          });
    }
    while (started.get() < 8) {
      Thread.yield();
    }
    start.countDown();
    ex.shutdown();
    assertThat(ex.awaitTermination(3, TimeUnit.SECONDS)).isTrue();
    assertThat(account.getBalance()).isEqualTo(300);
  }

  @Test
  void hundredSmallWithdrawalsNeverGoNegativeWhenSynchronized() throws Exception {
    BankAccount account = new BankAccount(1000);
    ExecutorService ex = Executors.newFixedThreadPool(10);
    for (int i = 0; i < 100; i++) {
      ex.submit(() -> account.safeWithdraw(10));
    }
    ex.shutdown();
    assertThat(ex.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
    assertThat(account.getBalance()).isZero();
  }
}
