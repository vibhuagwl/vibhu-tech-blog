package com.vibhu.gateway.live.payment;

import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Banking-style payment API. SETTLED only after ledger commit — never from a gateway
 * circuit-breaker fallback.
 */
@RestController
@RequestMapping("/payments")
public class PaymentController {

  private final LedgerPaymentService ledger;

  public PaymentController(LedgerPaymentService ledger) {
    this.ledger = ledger;
  }

  @PostMapping
  public ResponseEntity<Map<String, Object>> pay(
      @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
      @Valid @RequestBody PaymentRequest request) {
    PaymentRecord record = ledger.pay(idempotencyKey, request);
    HttpStatus status =
        record.status() == PaymentStatus.SETTLED ? HttpStatus.OK : HttpStatus.UNPROCESSABLE_ENTITY;
    return ResponseEntity.status(status).body(toBody(record));
  }

  @GetMapping("/{paymentId}")
  public Map<String, Object> get(@PathVariable String paymentId) {
    return ledger
        .find(paymentId)
        .map(this::toBody)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "payment not found"));
  }

  @GetMapping("/accounts/balances")
  public Map<String, Object> balances() {
    return Map.of("service", "payment-service", "balances", ledger.balancesSnapshot());
  }

  private Map<String, Object> toBody(PaymentRecord r) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("service", "payment-service");
    body.put("paymentId", r.paymentId());
    body.put("idempotencyKey", r.idempotencyKey());
    body.put("fromAccountId", r.fromAccountId());
    body.put("toAccountId", r.toAccountId());
    body.put("amount", r.amount());
    body.put("status", r.status().name());
    body.put("fromBalanceAfter", r.fromBalanceAfter());
    body.put("message", r.message());
    body.put("createdAt", r.createdAt().toString());
    return body;
  }
}
