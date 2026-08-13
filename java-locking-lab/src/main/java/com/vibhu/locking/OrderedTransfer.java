package com.vibhu.locking;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

public final class OrderedTransfer {
  public static final class Account {
    public final String id;
    public int balance;
    public final ReentrantLock lock = new ReentrantLock();

    public Account(String id, int balance) {
      this.id = id;
      this.balance = balance;
    }
  }

  public static boolean transfer(Account a, Account b, int amount) throws InterruptedException {
    Account first = a.id.compareTo(b.id) < 0 ? a : b;
    Account second = first == a ? b : a;
    if (!first.lock.tryLock(200, TimeUnit.MILLISECONDS)) {
      return false;
    }
    try {
      if (!second.lock.tryLock(200, TimeUnit.MILLISECONDS)) {
        return false;
      }
      try {
        if (a.balance < amount) {
          return false;
        }
        a.balance -= amount;
        b.balance += amount;
        return true;
      } finally {
        second.lock.unlock();
      }
    } finally {
      first.lock.unlock();
    }
  }
}
