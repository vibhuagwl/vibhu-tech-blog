package com.example.designpatterns.realworld.kafka;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

public class KafkaEventFlowDemo {
  public record PaymentCreatedEvent(String paymentId, int amount) {}

  public static final class InMemoryEventPublisher {
    private final List<Consumer<PaymentCreatedEvent>> consumers = new ArrayList<>();

    public void register(Consumer<PaymentCreatedEvent> consumer) {
      consumers.add(consumer);
    }

    public void publish(PaymentCreatedEvent event) {
      consumers.forEach(c -> c.accept(event));
    }
  }

  public static void run() {
    System.out.println("=== Kafka Event Flow — KafkaEventFlowDemo ===");
    System.out.println("STEP 1: Create InMemoryEventPublisher (stand-in for Kafka producer)");
    var publisher = new InMemoryEventPublisher();
    System.out.println("STEP 2: Register consumer that prints payment notifications");
    publisher.register(
        event ->
            System.out.println(
                "  Consumer received paymentId="
                    + event.paymentId()
                    + ", amount="
                    + event.amount()));
    System.out.println("STEP 3: publish PaymentCreatedEvent fans out to all consumers");
    publisher.publish(new PaymentCreatedEvent("pay-kafka-1", 750));
  }

  public static void main(String[] args) {
    run();
  }
}
