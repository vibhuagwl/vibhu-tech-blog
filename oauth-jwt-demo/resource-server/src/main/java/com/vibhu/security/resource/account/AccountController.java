package com.vibhu.security.resource.account;

import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Simulates account-service endpoint called via client_credentials from payment-service. */
@RestController
@RequestMapping("/api/accounts")
public class AccountController {

  @GetMapping("/{id}")
  @PreAuthorize("hasAuthority('SCOPE_account.read')")
  public Map<String, Object> get(@PathVariable String id) {
    return Map.of("accountId", id, "currency", "USD", "status", "ACTIVE");
  }
}
