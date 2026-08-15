package com.vibhu.msp.saga;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

/**
 * Choreography-style saga — each handler reacts to events and publishes the next. Maps to
 * curriculum Part 06 (Choreography vs Orchestration).
 */
public final class ChoreographyHandlers {

  public sealed interface SagaEvent
      permits OrderCreated, PaymentReserved, PaymentFailed, InventoryReserved {
    String orderId();
  }

  public record OrderCreated(String orderId, double amount) implements SagaEvent {}

  public record PaymentReserved(String orderId, String paymentId) implements SagaEvent {}

  public record PaymentFailed(String orderId, String reason) implements SagaEvent {}

  public record InventoryReserved(String orderId, int skuCount) implements SagaEvent {}

  private final List<SagaEvent> eventLog = new ArrayList<>();
  private final Consumer<SagaEvent> publisher;

  public ChoreographyHandlers(Consumer<SagaEvent> publisher) {
    this.publisher = publisher;
  }

  public void onOrderCreated(OrderCreated event) {
    eventLog.add(event);
    if (event.amount() > 0) {
      publisher.accept(new PaymentReserved(event.orderId(), "PAY-" + event.orderId()));
    } else {
      publisher.accept(new PaymentFailed(event.orderId(), "Invalid amount"));
    }
  }

  public void onPaymentReserved(PaymentReserved event) {
    eventLog.add(event);
    publisher.accept(new InventoryReserved(event.orderId(), 1));
  }

  public void onPaymentFailed(PaymentFailed event) {
    eventLog.add(event);
  }

  public List<SagaEvent> eventLog() {
    return List.copyOf(eventLog);
  }
}
