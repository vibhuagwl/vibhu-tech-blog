package com.vibhu.hadron.kafka;

import com.vibhu.hadron.config.HadronProperties;
import com.vibhu.hadron.config.TopicNames;
import com.vibhu.hadron.domain.EventEnvelope;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Consumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "hadron.kafka.enabled", havingValue = "false", matchIfMissing = true)
public class InMemoryEventBroker implements EventPublisher {

  private static final Logger log = LoggerFactory.getLogger(InMemoryEventBroker.class);

  private final HadronProperties properties;
  private final ConcurrentHashMap<String, AtomicLong> offsets = new ConcurrentHashMap<>();
  private final ConcurrentHashMap<String, CopyOnWriteArrayList<Consumer<EventEnvelope>>> listeners =
      new ConcurrentHashMap<>();
  private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

  public InMemoryEventBroker(HadronProperties properties) {
    this.properties = properties;
  }

  public void subscribe(String topic, Consumer<EventEnvelope> listener) {
    listeners.computeIfAbsent(topic, key -> new CopyOnWriteArrayList<>()).add(listener);
  }

  @Override
  public void publish(String topic, String key, String payload, Map<String, String> headers) {
    int partitions = Math.max(1, properties.getKafka().getTopicPartitions());
    int partition = Math.floorMod(key == null ? 0 : key.hashCode(), partitions);
    long offset = offsets.computeIfAbsent(topic, t -> new AtomicLong()).incrementAndGet();
    EventEnvelope envelope = new EventEnvelope(topic, partition, offset, key, payload, headers, retryCount(headers));
    dispatch(envelope);
  }

  @Override
  public void publishDelayed(
      String topic, String key, String payload, Map<String, String> headers, Duration delay) {
    scheduler.schedule(() -> publish(topic, key, payload, headers), delay.toMillis(), TimeUnit.MILLISECONDS);
  }

  private void dispatch(EventEnvelope envelope) {
    List<Consumer<EventEnvelope>> topicListeners = listeners.getOrDefault(envelope.topic(), new CopyOnWriteArrayList<>());
    if (topicListeners.isEmpty()) {
      log.warn("No in-memory listener for topic {}", envelope.topic());
      return;
    }
    for (Consumer<EventEnvelope> listener : topicListeners) {
      listener.accept(envelope);
    }
  }

  private int retryCount(Map<String, String> headers) {
    if (headers == null) {
      return 0;
    }
    String value = headers.get(TopicNames.HEADER_RETRY_COUNT);
    if (value == null) {
      return 0;
    }
    try {
      return Integer.parseInt(value);
    } catch (NumberFormatException e) {
      return 0;
    }
  }
}
