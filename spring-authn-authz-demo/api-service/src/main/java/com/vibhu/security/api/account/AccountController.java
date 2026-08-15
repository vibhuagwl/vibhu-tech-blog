package com.vibhu.security.api.account;

import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

  @GetMapping("/me")
  @PreAuthorize("hasRole('USER')")
  public Map<String, Object> me(@AuthenticationPrincipal UserDetails user) {
    return Map.of(
        "username", user.getUsername(),
        "authorities", user.getAuthorities().stream().map(Object::toString).toList());
  }

  @GetMapping
  @PreAuthorize("hasRole('USER')")
  public List<Map<String, Object>> list() {
    return List.of(
        Map.of("id", "acc-1", "balance", 1250.00), Map.of("id", "acc-2", "balance", 80.50));
  }
}
