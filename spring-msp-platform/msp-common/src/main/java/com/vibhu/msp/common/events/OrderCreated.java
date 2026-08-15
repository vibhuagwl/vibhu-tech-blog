package com.vibhu.msp.common.events;

import java.math.BigDecimal;
import java.util.List;

public record OrderCreated(
    String orderId, String customerId, BigDecimal totalAmount, List<OrderLine> lines) {
  public record OrderLine(String sku, int quantity, BigDecimal unitPrice) {}
}
