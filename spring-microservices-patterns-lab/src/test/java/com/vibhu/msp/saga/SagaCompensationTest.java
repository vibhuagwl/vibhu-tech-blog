package com.vibhu.msp.saga;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class SagaCompensationTest {

  @Test
  void orchestrator_compensatesOnFailure() {
    SagaOrchestrator<StringBuilder> saga = new SagaOrchestrator<>();
    List<String> log = new ArrayList<>();

    saga.addStep(
        new SagaStep<>(
            "reserve-inventory", ctx -> log.add("reserved"), ctx -> log.add("un-reserved")));
    saga.addStep(
        new SagaStep<>("charge-payment", ctx -> log.add("charged"), ctx -> log.add("refunded")));
    saga.addStep(
        new SagaStep<>(
            "ship-order",
            ctx -> {
              throw new RuntimeException("shipping failed");
            },
            ctx -> log.add("shipment-cancelled")));

    assertThrows(RuntimeException.class, () -> saga.execute(new StringBuilder()));

    assertTrue(log.contains("reserved"));
    assertTrue(log.contains("charged"));
    assertTrue(log.contains("refunded"));
    assertTrue(log.contains("un-reserved"));
    assertEquals(0, saga.completedStepNames().size());
  }

  @Test
  void choreography_publishesNextEvent() {
    List<ChoreographyHandlers.SagaEvent> published = new ArrayList<>();
    ChoreographyHandlers handlers = new ChoreographyHandlers(published::add);

    ChoreographyHandlers.OrderCreated created =
        new ChoreographyHandlers.OrderCreated("ORD-1", 99.0);
    handlers.onOrderCreated(created);
    handlers.onPaymentReserved((ChoreographyHandlers.PaymentReserved) published.getFirst());

    assertEquals(2, handlers.eventLog().size());
    assertTrue(
        published.stream().anyMatch(e -> e instanceof ChoreographyHandlers.InventoryReserved));
  }
}
