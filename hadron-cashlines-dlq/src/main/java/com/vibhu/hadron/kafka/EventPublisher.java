package com.vibhu.hadron.kafka;

import com.vibhu.hadron.domain.EventEnvelope;
import java.time.Duration;
import java.util.Map;

public interface EventPublisher {

  void publish(String topic, String key, String payload, Map<String, String> headers);

  void publishDelayed(
      String topic, String key, String payload, Map<String, String> headers, Duration delay);

  default void publish(EventEnvelope envelope) {
    publish(envelope.topic(), envelope.key(), envelope.payload(), envelope.headers());
  }
}
