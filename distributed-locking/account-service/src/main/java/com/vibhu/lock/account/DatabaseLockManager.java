package com.vibhu.lock.account;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * Database-level protection companion to Redis distributed locks.
 * Uses Spring Data {@code @Lock(PESSIMISTIC_WRITE)} → {@code SELECT ... FOR UPDATE}.
 */
@Component
public class DatabaseLockManager {
  private final AccountRepository accountRepository;

  public DatabaseLockManager(AccountRepository accountRepository) {
    this.accountRepository = accountRepository;
  }

  public Map<String, AccountEntity> lockAccountsForUpdate(String... accountIds) {
    Map<String, AccountEntity> locked = new LinkedHashMap<>();
    List.of(accountIds).stream()
        .distinct()
        .sorted(Comparator.naturalOrder())
        .forEach(accountId -> locked.put(
            accountId,
            accountRepository.findByIdForUpdate(accountId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                    "Account not found: " + accountId))
        ));
    return locked;
  }
}
