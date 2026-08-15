package com.vibhu.msp.payment.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

  @GetMapping("/health")
  public ResponseEntity<String> health() {
    return ResponseEntity.ok("payment-service-ok");
  }
}
