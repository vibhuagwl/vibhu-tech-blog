package com.vibhu.lock.recovery;

import com.vibhu.lock.common.KafkaTopics;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Idempotent lifecycle event consumer. Failed poison messages are forwarded to DLQ. Kafka is not on
 * the synchronous lock/transfer path.
 */
@Component
public class TransactionLifecycleConsumer {
  private static final Logger log = LoggerFactory.getLogger(TransactionLifecycleConsumer.class);

  private final Map<String, Boolean> processed = new ConcurrentHashMap<>();
  private final KafkaTemplate<String, String> kafkaTemplate;

  public TransactionLifecycleConsumer(KafkaTemplate<String, String> kafkaTemplate) {
    this.kafkaTemplate = kafkaTemplate;
  }

  @KafkaListener(topics = KafkaTopics.TRANSACTION_LIFECYCLE, groupId = "recovery-lifecycle")
  public void onMessage(ConsumerRecord<String, String> record) {
    String eventType = header(record, "event-type");
    String transactionId = header(record, "transaction-id");
    String dedupeKey = record.topic() + ":" + record.partition() + ":" + record.offset();
    try {
      if (processed.putIfAbsent(dedupeKey, Boolean.TRUE) != null) {
        return;
      }
      log.info(
          "Lifecycle event type={} transactionId={} correlationId={} payload={}",
          eventType,
          transactionId,
          header(record, "correlation-id"),
          record.value());
    } catch (RuntimeException ex) {
      log.error("Failed processing lifecycle event, sending to DLQ: {}", ex.getMessage());
      kafkaTemplate.send(KafkaTopics.TRANSACTION_LIFECYCLE_DLQ, transactionId, record.value());
    }
  }

  private static String header(ConsumerRecord<String, String> record, String name) {
    var header = record.headers().lastHeader(name);
    if (header == null) {
      return "";
    }
    return new String(header.value(), StandardCharsets.UTF_8);
  }
}
