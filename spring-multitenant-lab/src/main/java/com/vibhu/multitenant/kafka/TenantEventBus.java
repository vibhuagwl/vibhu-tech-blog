package com.vibhu.multitenant.kafka;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.BiConsumer;
import org.springframework.stereotype.Component;

/** In-memory stand-in for Kafka so the lab runs without a broker. */
@Component
public class TenantEventBus {

  private final Map<String, CopyOnWriteArrayList<BiConsumer<String, String>>> listeners =
      new ConcurrentHashMap<>();

  public void subscribe(String topic, BiConsumer<String, String> listener) {
    listeners.computeIfAbsent(topic, t -> new CopyOnWriteArrayList<>()).add(listener);
  }

  public void publish(String topic, String key, String payload) {
    List<BiConsumer<String, String>> topicListeners =
        listeners.getOrDefault(topic, new CopyOnWriteArrayList<>());
    for (BiConsumer<String, String> listener : topicListeners) {
      listener.accept(key, payload);
    }
  }
}
