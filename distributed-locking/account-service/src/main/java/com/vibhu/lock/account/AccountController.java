package com.vibhu.lock.account;

import com.vibhu.lock.account.AccountDtos.CreateAccountRequest;
import com.vibhu.lock.account.AccountDtos.TransferApplyRequest;
import com.vibhu.lock.account.AccountDtos.TransferApplyResponse;
import com.vibhu.lock.common.AccountView;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AccountController {
  private final AccountService accountService;

  public AccountController(AccountService accountService) {
    this.accountService = accountService;
  }

  @PostMapping("/api/v1/accounts")
  public ResponseEntity<AccountView> create(@RequestBody CreateAccountRequest request) {
    AccountView view = accountService.create(request);
    return ResponseEntity.created(URI.create("/api/v1/accounts/" + view.accountId())).body(view);
  }

  @GetMapping("/api/v1/accounts/{id}")
  public AccountView get(@PathVariable String id) {
    return accountService.get(id);
  }

  @PostMapping("/internal/accounts/transfer-prepare")
  public TransferApplyResponse transferPrepare(@RequestBody TransferApplyRequest request) {
    return accountService.prepareTransfer(request);
  }

  @PostMapping("/internal/accounts/transfer-apply")
  public TransferApplyResponse transferApply(@RequestBody TransferApplyRequest request) {
    return accountService.applyTransfer(request);
  }

  /*
   * Seed note for local demos:
   * POST /api/v1/accounts {"accountId":"A","initialBalance":10000}
   * POST /api/v1/accounts {"accountId":"B","initialBalance":5000}
   * POST /api/v1/accounts {"accountId":"C","initialBalance":2000}
   */
}
