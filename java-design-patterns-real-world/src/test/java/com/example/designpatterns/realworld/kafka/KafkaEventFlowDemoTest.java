package com.example.designpatterns.realworld.kafka;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import org.junit.jupiter.api.Test;

class KafkaEventFlowDemoTest {
  @Test
  void shouldFanOutEventToInMemoryConsumers() {
    var seen = new ArrayList<String>();
    var publisher = new KafkaEventFlowDemo.InMemoryEventPublisher();
    publisher.register(event -> seen.add("notify:" + event.paymentId()));
    publisher.register(event -> seen.add("audit:" + event.paymentId()));
    publisher.publish(new KafkaEventFlowDemo.PaymentCreatedEvent("pay-1", 100));
    assertThat(seen).containsExactlyInAnyOrder("notify:pay-1", "audit:pay-1");
  }
}
