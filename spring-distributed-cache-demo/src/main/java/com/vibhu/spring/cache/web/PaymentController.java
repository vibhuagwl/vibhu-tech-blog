package com.vibhu.spring.cache.web;

import com.vibhu.spring.cache.domain.Payment;
import com.vibhu.spring.cache.repo.PaymentRepository;
import com.vibhu.spring.cache.service.PaymentCacheService;
import com.vibhu.spring.cache.service.PaymentNotFoundException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
  private final PaymentCacheService payments;
  private final PaymentRepository repo;

  public PaymentController(PaymentCacheService payments, PaymentRepository repo) {
    this.payments = payments;
    this.repo = repo;
  }

  @GetMapping("/{id}")
  public Payment get(@PathVariable String id) {
    return payments.getAside(id);
  }

  @GetMapping("/{id}/spring-cache")
  public Payment getSpringCache(@PathVariable String id) {
    return payments.getCached(id);
  }

  @PostMapping("/{id}/status/{status}")
  public Payment updateStatus(@PathVariable String id, @PathVariable String status) {
    return payments.updateStatus(id, status);
  }

  @GetMapping("/_stats")
  public Map<String, Object> stats() {
    return Map.of("dbQueries", repo.queryCount());
  }

  @ExceptionHandler(PaymentNotFoundException.class)
  @ResponseStatus(HttpStatus.NOT_FOUND)
  public Map<String, String> notFound(PaymentNotFoundException e) {
    return Map.of("error", e.getMessage());
  }
}
