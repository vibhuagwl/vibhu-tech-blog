package com.vibhu.locking;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import org.junit.jupiter.api.Test;

class DeadlockPreventionTest {

  @Test
  void orderedTryLockTransferDoesNotHang() throws Exception {
    OrderedTransfer.Account a = new OrderedTransfer.Account("A", 1000);
    OrderedTransfer.Account b = new OrderedTransfer.Account("B", 1000);
    CountDownLatch start = new CountDownLatch(1);

    Thread t1 =
        new Thread(
            () -> {
              try {
                start.await();
                OrderedTransfer.transfer(a, b, 100);
              } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
              }
            });
    Thread t2 =
        new Thread(
            () -> {
              try {
                start.await();
                OrderedTransfer.transfer(b, a, 100);
              } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
              }
            });
    t1.start();
    t2.start();
    start.countDown();
    t1.join(2000);
    t2.join(2000);
    assertThat(t1.isAlive()).isFalse();
    assertThat(t2.isAlive()).isFalse();
    assertThat(a.balance + b.balance).isEqualTo(2000);
  }

  @Test
  void tryLockTimesOutInsteadOfBlockingForever() throws Exception {
    ReentrantLock lock = new ReentrantLock();
    Thread holder =
        new Thread(
            () -> {
              lock.lock();
              try {
                Thread.sleep(400);
              } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
              } finally {
                lock.unlock();
              }
            });
    holder.start();
    Thread.sleep(50);
    boolean acquired = lock.tryLock(50, TimeUnit.MILLISECONDS);
    if (acquired) {
      lock.unlock();
    }
    holder.join();
    assertThat(acquired).isFalse();
  }
}
