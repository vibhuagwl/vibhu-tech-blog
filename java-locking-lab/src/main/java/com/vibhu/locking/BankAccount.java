package com.vibhu.locking;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

/** Tiny demo types used by tests and runnable examples. */
public final class BankAccount {
  private int balance;
  private final ReentrantLock lock = new ReentrantLock();

  public BankAccount(int balance) {
    this.balance = balance;
  }

  public void unsafeWithdraw(int amount) {
    if (balance >= amount) {
      balance -= amount;
    }
  }

  public synchronized void safeWithdraw(int amount) {
    if (balance >= amount) {
      balance -= amount;
    }
  }

  public boolean tryBookSeatStyle(int amount, long timeoutMs) throws InterruptedException {
    if (!lock.tryLock(timeoutMs, TimeUnit.MILLISECONDS)) {
      return false;
    }
    try {
      if (balance < amount) {
        return false;
      }
      balance -= amount;
      return true;
    } finally {
      lock.unlock();
    }
  }

  public synchronized int getBalance() {
    return balance;
  }
}
