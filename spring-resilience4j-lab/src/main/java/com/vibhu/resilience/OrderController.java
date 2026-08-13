package com.vibhu.resilience;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class OrderController {
  private final OrderService orders;
  private final PaymentBankStub bank;

  public OrderController(OrderService orders, PaymentBankStub bank) {
    this.orders = orders;
    this.bank = bank;
  }

  @PostMapping("/orders")
  public PaymentResult create(@RequestBody PayRequest request) {
    return orders.placeOrder(request);
  }

  @GetMapping("/payment/simulate")
  public Map<String, Object> simulate(@RequestParam BankMode mode) {
    bank.setMode(mode);
    return Map.of("mode", mode.name(), "calls", bank.callCount());
  }
}
