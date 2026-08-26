package com.vibhu.sapi.payment.kafka;

import com.vibhu.sapi.dto.KafkaEventView;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class InMemoryKafkaEventStore {

  private final Map<String, List<KafkaEventView>> eventsByPayment = new ConcurrentHashMap<>();

  public void append(KafkaEventView event) {
    eventsByPayment
        .computeIfAbsent(normalize(event.paymentId()), k -> new ArrayList<>())
        .add(event);
  }

  public List<KafkaEventView> findByPaymentId(String paymentId) {
    return List.copyOf(
        eventsByPayment.getOrDefault(normalize(paymentId), List.of()));
  }

  public void clear() {
    eventsByPayment.clear();
  }

  private static String normalize(String paymentId) {
    return paymentId == null ? "" : paymentId.trim().toUpperCase(Locale.ROOT);
  }
}
