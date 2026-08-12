package com.example.designpatterns.realworld.kafka;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

public class KafkaEventFlowDemo {
    public record PaymentCreatedEvent(String paymentId, int amount) {}
    public static final class InMemoryEventPublisher {
        private final List<Consumer<PaymentCreatedEvent>> consumers = new ArrayList<>();
        public void register(Consumer<PaymentCreatedEvent> consumer){ consumers.add(consumer); }
        public void publish(PaymentCreatedEvent event){ consumers.forEach(c -> c.accept(event)); }
    }
}
