package com.vibhu.msp.cqrs;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** CQRS read projection — eventually consistent view. */
public final class OrderProjection {

  public record OrderSummaryView(String orderId, String customerId, double amount, String status) {}

  private final Map<String, OrderSummaryView> views = new ConcurrentHashMap<>();

  public void onOrderCreated(CqrsCommandSide.OrderWriteModel model) {
    views.put(model.orderId(), new OrderSummaryView(
        model.orderId(), model.customerId(), model.amount(), model.status()
    ));
  }

  public OrderSummaryView findById(String orderId) {
    return views.get(orderId);
  }

  public List<OrderSummaryView> all() {
    return new ArrayList<>(views.values());
  }
}
