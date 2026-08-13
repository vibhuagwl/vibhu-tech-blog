package com.vibhu.resilience;

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class OrderController {
  private final OrderService orders;
  private final PaymentGatewayClient payments;
  private final FxRateService fx;

  public OrderController(OrderService orders, PaymentGatewayClient payments, FxRateService fx) {
    this.orders = orders;
    this.payments = payments;
    this.fx = fx;
  }

  @PostMapping("/orders")
  public PaymentResult create(@RequestBody PayRequest request) {
    return orders.placeOrder(request);
  }

  @PostMapping("/orders/async")
  public CompletableFuture<PaymentResult> createAsync(@RequestBody PayRequest request) {
    return payments.chargeAsync(request);
  }

  @GetMapping("/fx")
  public Map<String, Object> fx() {
    BigDecimal rate = fx.usdInr();
    return Map.of("pair", "USDINR", "rate", rate, "bankHits", fx.bankHits());
  }
}
