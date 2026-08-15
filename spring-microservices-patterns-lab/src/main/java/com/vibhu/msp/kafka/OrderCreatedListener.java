package com.vibhu.msp.kafka;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/** Demo Kafka consumer for integration tests — counts consumed order events. */
@Component
@ConditionalOnProperty(name = "msp.kafka.enabled", havingValue = "true")
public class OrderCreatedListener {

  private final ConcurrentHashMap<String, String> consumed = new ConcurrentHashMap<>();
  private final AtomicInteger count = new AtomicInteger();

  @KafkaListener(topics = "${msp.kafka.order-topic:order-created}", groupId = "msp-lab-it")
  public void onOrderCreated(ConsumerRecord<String, String> record) {
    consumed.put(record.key(), record.value());
    count.incrementAndGet();
  }

  public int consumedCount() {
    return count.get();
  }

  public boolean hasConsumed(String key) {
    return consumed.containsKey(key);
  }

  public void reset() {
    consumed.clear();
    count.set(0);
  }
}
