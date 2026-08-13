package com.vibhu.spring.dlock.domain;

import java.math.BigDecimal;

/** In-memory stand-in for a DB row — mutations are not intrinsically atomic. */
public class Account {
  private final String id;
  private BigDecimal balance;

  public Account(String id, BigDecimal balance) {
    this.id = id;
    this.balance = balance;
  }

  public String id() {
    return id;
  }

  public synchronized BigDecimal balance() {
    return balance;
  }

  /** Non-atomic check-then-act used to demonstrate races when called without a lock. */
  public void debitCheckThenAct(BigDecimal amount, long pauseMs) {
    BigDecimal seen = balance;
    sleep(pauseMs);
    if (seen.compareTo(amount) < 0) {
      throw new InsufficientFundsException(id, seen, amount);
    }
    balance = seen.subtract(amount);
  }

  /** Locked path still uses the same RMW — exclusivity comes from DistributedLock. */
  public synchronized void debitUnderMonitor(BigDecimal amount) {
    if (balance.compareTo(amount) < 0) {
      throw new InsufficientFundsException(id, balance, amount);
    }
    balance = balance.subtract(amount);
  }

  public synchronized void reset(BigDecimal amount) {
    this.balance = amount;
  }

  private static void sleep(long ms) {
    try {
      Thread.sleep(ms);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }
  }
}
