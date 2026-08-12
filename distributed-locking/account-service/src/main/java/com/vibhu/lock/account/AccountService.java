package com.vibhu.lock.account;

import com.vibhu.lock.account.AccountDtos.CreateAccountRequest;
import com.vibhu.lock.account.AccountDtos.TransferApplyRequest;
import com.vibhu.lock.account.AccountDtos.TransferApplyResponse;
import com.vibhu.lock.common.AccountView;
import com.vibhu.lock.common.FenceTokenRejectedException;
import com.vibhu.lock.common.InsufficientFundsException;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {
  private final AccountRepository accountRepository;

  public AccountService(AccountRepository accountRepository) {
    this.accountRepository = accountRepository;
  }

  @Transactional
  public AccountView create(CreateAccountRequest request) {
    requirePositiveOrZero(request.initialBalance(), "initialBalance");
    AccountEntity account = new AccountEntity(request.accountId(), request.initialBalance(), "OPEN");
    return toView(accountRepository.save(account));
  }

  @Transactional(readOnly = true)
  public AccountView get(String id) {
    return accountRepository.findById(id)
        .map(this::toView)
        .orElseThrow(() -> new EntityNotFoundException("Account not found: " + id));
  }

  @Transactional
  public TransferApplyResponse applyTransfer(TransferApplyRequest request) {
    requirePositive(request.amount(), "amount");

    /*
     * The transaction-service first obtains Redis-backed distributed locks with
     * monotonically increasing fencing tokens. This method then opens a single
     * PostgreSQL transaction and takes row-level PESSIMISTIC_WRITE locks in a
     * deterministic account-id order. Redis prevents concurrent distributed
     * writers from entering, fencing rejects stale lock holders after lease loss,
     * and the database transaction makes the debit/credit atomic.
     */
    Map<String, AccountEntity> locked = lockAccountsInDeterministicOrder(
        request.sourceAccountId(),
        request.destAccountId()
    );

    AccountEntity source = locked.get(request.sourceAccountId());
    AccountEntity destination = locked.get(request.destAccountId());
    validateFence(source, request.fencingTokenSource(), "source");
    validateFence(destination, request.fencingTokenDest(), "destination");

    if (source == destination) {
      source.setLastAppliedFence(Math.max(source.getLastAppliedFence(), request.fencingTokenSource()));
      return response(request, source, destination);
    }

    if (source.getBalance().compareTo(request.amount()) < 0) {
      throw new InsufficientFundsException("Insufficient funds in account " + source.getId());
    }

    source.setBalance(source.getBalance().subtract(request.amount()));
    destination.setBalance(destination.getBalance().add(request.amount()));
    source.setLastAppliedFence(Math.max(source.getLastAppliedFence(), request.fencingTokenSource()));
    destination.setLastAppliedFence(Math.max(destination.getLastAppliedFence(), request.fencingTokenDest()));

    return response(request, source, destination);
  }

  private Map<String, AccountEntity> lockAccountsInDeterministicOrder(String sourceId, String destinationId) {
    Map<String, AccountEntity> locked = new LinkedHashMap<>();
    List.of(sourceId, destinationId).stream()
        .distinct()
        .sorted(Comparator.naturalOrder())
        .forEach(accountId -> {
          AccountEntity account = accountRepository.findByIdForUpdate(accountId)
              .orElseThrow(() -> new EntityNotFoundException("Account not found: " + accountId));
          locked.put(accountId, account);
        });
    return locked;
  }

  private void validateFence(AccountEntity account, long fencingToken, String role) {
    if (fencingToken < account.getLastAppliedFence()) {
      throw new FenceTokenRejectedException(
          "Rejected stale " + role + " fence " + fencingToken + " for account " + account.getId()
      );
    }
  }

  private TransferApplyResponse response(
      TransferApplyRequest request,
      AccountEntity source,
      AccountEntity destination
  ) {
    return new TransferApplyResponse(
        request.transactionId(),
        source.getId(),
        source.getBalance(),
        source.getVersion(),
        destination.getId(),
        destination.getBalance(),
        destination.getVersion()
    );
  }

  private AccountView toView(AccountEntity entity) {
    return new AccountView(entity.getId(), entity.getBalance(), entity.getVersion(), entity.getStatus());
  }

  private void requirePositive(BigDecimal value, String field) {
    if (value == null || value.signum() <= 0) {
      throw new IllegalArgumentException(field + " must be greater than zero");
    }
  }

  private void requirePositiveOrZero(BigDecimal value, String field) {
    if (value == null || value.signum() < 0) {
      throw new IllegalArgumentException(field + " must be greater than or equal to zero");
    }
  }
}
