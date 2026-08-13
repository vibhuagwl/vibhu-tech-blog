package com.vibhu.spring.dlock.service;

import com.vibhu.spring.dlock.domain.Account;
import com.vibhu.spring.dlock.domain.LockNotAcquiredException;
import com.vibhu.spring.dlock.lock.DistributedLock;
import com.vibhu.spring.dlock.repo.AccountRepository;
import io.micrometer.core.instrument.MeterRegistry;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class DebitService {
  private static final Logger log = LoggerFactory.getLogger(DebitService.class);

  private final AccountRepository accounts;
  private final DistributedLock lock;
  private final MeterRegistry metrics;

  public DebitService(AccountRepository accounts, DistributedLock lock, MeterRegistry metrics) {
    this.accounts = accounts;
    this.lock = lock;
    this.metrics = metrics;
  }

  public Account debit(String accountId, BigDecimal amount) {
    String lockName = "account:" + accountId;
    String token = UUID.randomUUID().toString();
    if (!lock.tryLock(lockName, token, Duration.ofSeconds(5))) {
      metrics.counter("lock.acquire.fail", "resource", "account").increment();
      throw new LockNotAcquiredException(lockName);
    }
    metrics.counter("lock.acquire.ok", "resource", "account").increment();
    try {
      Account account =
          accounts.findById(accountId).orElseThrow(() -> new IllegalArgumentException(accountId));
      BigDecimal before = account.balance();
      // Same RMW shape as unsafe path — lock provides exclusion across threads/pods
      account.debitCheckThenAct(amount, 20);
      log.info(
          "LOCKED debit account={} {} - {} = {} token={}",
          accountId,
          before,
          amount,
          account.balance(),
          token.substring(0, 8));
      return account;
    } finally {
      lock.unlock(lockName, token);
    }
  }

  public Account debitUnsafe(String accountId, BigDecimal amount) {
    Account account =
        accounts.findById(accountId).orElseThrow(() -> new IllegalArgumentException(accountId));
    account.debitCheckThenAct(amount, 20);
    return account;
  }
}
