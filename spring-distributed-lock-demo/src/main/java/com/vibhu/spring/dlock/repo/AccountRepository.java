package com.vibhu.spring.dlock.repo;

import com.vibhu.spring.dlock.domain.Account;
import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Repository;

@Repository
public class AccountRepository {
  private final Map<String, Account> db = new ConcurrentHashMap<>();

  public AccountRepository() {
    db.put("A100", new Account("A100", new BigDecimal("1000.00")));
  }

  public Optional<Account> findById(String id) {
    return Optional.ofNullable(db.get(id));
  }

  public void reset(String id, BigDecimal balance) {
    Account existing = db.get(id);
    if (existing != null) {
      existing.reset(balance);
    } else {
      db.put(id, new Account(id, balance));
    }
  }
}
