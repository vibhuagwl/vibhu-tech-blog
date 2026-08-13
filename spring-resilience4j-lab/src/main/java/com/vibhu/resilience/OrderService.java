package com.vibhu.resilience;

import org.springframework.stereotype.Service;

@Service
public class OrderService {
  private final PaymentGatewayClient payments;

  public OrderService(PaymentGatewayClient payments) {
    this.payments = payments;
  }

  public PaymentResult placeOrder(PayRequest request) {
    if (request.idempotencyKey() == null || request.idempotencyKey().isBlank()) {
      throw new IllegalArgumentException("idempotencyKey required");
    }
    return payments.charge(request);
  }
}
