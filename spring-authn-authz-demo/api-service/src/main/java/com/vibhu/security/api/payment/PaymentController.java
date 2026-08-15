package com.vibhu.security.api.payment;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

  private final AtomicLong seq = new AtomicLong(1);
  private final List<Map<String, Object>> store = new ArrayList<>();

  @GetMapping
  @PreAuthorize("hasRole('USER')")
  public List<Map<String, Object>> mine(@AuthenticationPrincipal UserDetails user) {
    return store.stream().filter(p -> user.getUsername().equals(p.get("owner"))).toList();
  }

  @PostMapping
  @PreAuthorize("hasRole('USER')")
  public Map<String, Object> create(
      @AuthenticationPrincipal UserDetails user, @RequestBody CreatePaymentRequest body) {
    Map<String, Object> payment =
        Map.of(
            "id", seq.getAndIncrement(),
            "owner", user.getUsername(),
            "amount", body.amount(),
            "note", body.note() == null ? "" : body.note());
    store.add(payment);
    return payment;
  }

  public record CreatePaymentRequest(BigDecimal amount, String note) {}
}
