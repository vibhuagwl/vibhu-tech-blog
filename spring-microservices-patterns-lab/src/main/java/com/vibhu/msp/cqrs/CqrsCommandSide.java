package com.vibhu.msp.cqrs;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** CQRS command side — write model. Maps to curriculum Part 07. */
public final class CqrsCommandSide {

  public record CreateOrderCommand(String orderId, String customerId, double amount) {}

  private final Map<String, OrderWriteModel> orders = new ConcurrentHashMap<>();

  public void handle(CreateOrderCommand command) {
    orders.put(
        command.orderId(),
        new OrderWriteModel(command.orderId(), command.customerId(), command.amount(), "CREATED"));
  }

  public OrderWriteModel get(String orderId) {
    return orders.get(orderId);
  }

  public record OrderWriteModel(String orderId, String customerId, double amount, String status) {}
}
