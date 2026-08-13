package com.vibhu.spring.dlock.web;

import com.vibhu.spring.dlock.domain.Account;
import com.vibhu.spring.dlock.domain.InsufficientFundsException;
import com.vibhu.spring.dlock.domain.LockNotAcquiredException;
import com.vibhu.spring.dlock.repo.AccountRepository;
import com.vibhu.spring.dlock.service.DebitService;
import java.math.BigDecimal;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {
  private final DebitService debits;
  private final AccountRepository accounts;

  public AccountController(DebitService debits, AccountRepository accounts) {
    this.debits = debits;
    this.accounts = accounts;
  }

  @GetMapping("/{id}")
  public Map<String, Object> get(@PathVariable String id) {
    Account a = accounts.findById(id).orElseThrow();
    return Map.of("id", a.id(), "balance", a.balance());
  }

  @PostMapping("/{id}/debit")
  public Map<String, Object> debit(
      @PathVariable String id, @RequestParam BigDecimal amount) {
    Account a = debits.debit(id, amount);
    return Map.of("id", a.id(), "balance", a.balance(), "status", "OK");
  }

  @PostMapping("/{id}/debit-unsafe")
  public Map<String, Object> debitUnsafe(
      @PathVariable String id, @RequestParam BigDecimal amount) {
    Account a = debits.debitUnsafe(id, amount);
    return Map.of("id", a.id(), "balance", a.balance(), "status", "UNSAFE");
  }

  @ExceptionHandler(LockNotAcquiredException.class)
  @ResponseStatus(HttpStatus.CONFLICT)
  public Map<String, String> busy(LockNotAcquiredException e) {
    return Map.of("error", "LOCK_BUSY", "message", e.getMessage());
  }

  @ExceptionHandler(InsufficientFundsException.class)
  @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
  public Map<String, String> funds(InsufficientFundsException e) {
    return Map.of("error", "INSUFFICIENT_FUNDS", "message", e.getMessage());
  }
}
