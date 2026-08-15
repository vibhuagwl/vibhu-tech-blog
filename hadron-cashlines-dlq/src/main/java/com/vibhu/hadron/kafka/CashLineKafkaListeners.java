package com.vibhu.hadron.kafka;

import com.vibhu.hadron.config.TopicNames;
import com.vibhu.hadron.service.CashLineProcessingService;
import com.vibhu.hadron.service.DeadLetterMessageService;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "hadron.kafka.enabled", havingValue = "true")
public class CashLineKafkaListeners {

  private final CashLineProcessingService processing;
  private final DeadLetterMessageService dlq;

  public CashLineKafkaListeners(
      CashLineProcessingService processing, DeadLetterMessageService dlq) {
    this.processing = processing;
    this.dlq = dlq;
  }

  @KafkaListener(topics = TopicNames.CASHLINE_EVENTS, groupId = "${hadron.kafka.group-id}")
  public void onCashLine(ConsumerRecord<String, String> record) {
    processing.process(KafkaConsumerConfig.toEnvelope(record));
  }

  @KafkaListener(topics = TopicNames.RETRY_1, groupId = "${hadron.kafka.group-id}-retry")
  public void onRetry1(ConsumerRecord<String, String> record) {
    waitIfNeeded(record);
    processing.process(KafkaConsumerConfig.toEnvelope(record));
  }

  @KafkaListener(topics = TopicNames.RETRY_2, groupId = "${hadron.kafka.group-id}-retry")
  public void onRetry2(ConsumerRecord<String, String> record) {
    waitIfNeeded(record);
    processing.process(KafkaConsumerConfig.toEnvelope(record));
  }

  @KafkaListener(topics = TopicNames.RETRY_3, groupId = "${hadron.kafka.group-id}-retry")
  public void onRetry3(ConsumerRecord<String, String> record) {
    waitIfNeeded(record);
    processing.process(KafkaConsumerConfig.toEnvelope(record));
  }

  @KafkaListener(topics = TopicNames.DLQ, groupId = "${hadron.kafka.group-id}-dlq")
  public void onDlq(ConsumerRecord<String, String> record) {
    var envelope = KafkaConsumerConfig.toEnvelope(record);
    dlq.persist(envelope, null, new IllegalStateException("Persisted from DLQ topic"));
  }

  /**
   * Lab-grade delay for retry topics using hadron-retry-at header. Production should use a
   * dedicated delay mechanism, not listener Thread.sleep.
   */
  private void waitIfNeeded(ConsumerRecord<String, String> record) {
    var envelope = KafkaConsumerConfig.toEnvelope(record);
    String retryAt = envelope.header(TopicNames.HEADER_RETRY_AT);
    if (retryAt == null) {
      return;
    }
    long sleep = Long.parseLong(retryAt) - System.currentTimeMillis();
    if (sleep > 0 && sleep < 60_000) {
      try {
        Thread.sleep(sleep);
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
      }
    }
  }
}
