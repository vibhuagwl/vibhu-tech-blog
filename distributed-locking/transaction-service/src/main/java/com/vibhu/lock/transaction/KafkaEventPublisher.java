package com.vibhu.lock.transaction;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.lock.common.KafkaTopics;
import com.vibhu.lock.common.LockAcquired;
import com.vibhu.lock.common.LockMode;
import com.vibhu.lock.common.LockReleased;
import com.vibhu.lock.common.TransactionCommitted;
import com.vibhu.lock.common.TransactionPrepared;
import com.vibhu.lock.common.TransactionRolledBack;
import com.vibhu.lock.common.TransactionStarted;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class KafkaEventPublisher {
  public static final String TOPIC = KafkaTopics.TRANSACTION_LIFECYCLE;
  private static final Logger log = LoggerFactory.getLogger(KafkaEventPublisher.class);

  private final KafkaTemplate<String, String> kafkaTemplate;
  private final ObjectMapper objectMapper;
  private final TransactionEventRepository eventRepository;

  public KafkaEventPublisher(
      KafkaTemplate<String, String> kafkaTemplate,
      ObjectMapper objectMapper,
      TransactionEventRepository eventRepository) {
    this.kafkaTemplate = kafkaTemplate;
    this.objectMapper = objectMapper;
    this.eventRepository = eventRepository;
  }

  public void publishStarted(TransactionEntity tx) {
    Instant now = Instant.now();
    publishTyped("TransactionStarted", new TransactionStarted(tx.getId(), tx.getId(), now));
  }

  public void publishLockAcquired(TransactionEntity tx) {
    Instant now = Instant.now();
    long fence = tx.getFencingSource() == null ? 0L : tx.getFencingSource();
    publishTyped(
        "LockAcquired",
        new LockAcquired(
            tx.getId(),
            tx.getId(),
            TwoPhaseLockingManager.lockKey(tx.getSourceAccountId()),
            LockMode.EXCLUSIVE,
            fence,
            now));
  }

  public void publishPrepared(TransactionEntity tx) {
    publishTyped(
        "TransactionPrepared", new TransactionPrepared(tx.getId(), tx.getId(), Instant.now()));
  }

  public void publishCommitted(TransactionEntity tx) {
    publishTyped(
        "TransactionCommitted", new TransactionCommitted(tx.getId(), tx.getId(), Instant.now()));
  }

  public void publishRolledBack(TransactionEntity tx, String reason) {
    publishTyped(
        "TransactionRolledBack",
        new TransactionRolledBack(tx.getId(), tx.getId(), reason, Instant.now()));
  }

  public void publishLockReleased(TransactionEntity tx) {
    publishTyped(
        "LockReleased",
        new LockReleased(
            tx.getId(),
            tx.getId(),
            TwoPhaseLockingManager.lockKey(tx.getSourceAccountId()),
            LockMode.EXCLUSIVE,
            Instant.now()));
  }

  public void publishLifecycle(
      TransactionEntity transaction, String type, Map<String, ?> attributes) {
    String payload = jsonPayload(transaction, type, attributes);
    eventRepository.save(new TransactionEventEntity(transaction.getId(), type, payload));
    send(transaction.getId(), type, payload);
  }

  private void publishTyped(String type, Object body) {
    try {
      String transactionId = extractTransactionId(body);
      String payload = objectMapper.writeValueAsString(body);
      eventRepository.save(new TransactionEventEntity(transactionId, type, payload));
      send(transactionId, type, payload);
    } catch (JsonProcessingException ex) {
      throw new IllegalStateException("Failed to serialize " + type, ex);
    }
  }

  private String extractTransactionId(Object body) {
    if (body instanceof TransactionStarted e) {
      return e.transactionId();
    }
    if (body instanceof LockAcquired e) {
      return e.transactionId();
    }
    if (body instanceof TransactionPrepared e) {
      return e.transactionId();
    }
    if (body instanceof TransactionCommitted e) {
      return e.transactionId();
    }
    if (body instanceof TransactionRolledBack e) {
      return e.transactionId();
    }
    if (body instanceof LockReleased e) {
      return e.transactionId();
    }
    throw new IllegalArgumentException("Unsupported event type " + body.getClass());
  }

  private void send(String transactionId, String type, String payload) {
    try {
      ProducerRecord<String, String> record = new ProducerRecord<>(TOPIC, transactionId, payload);
      record.headers().add("transaction-id", transactionId.getBytes(StandardCharsets.UTF_8));
      record.headers().add("correlation-id", transactionId.getBytes(StandardCharsets.UTF_8));
      record.headers().add("event-type", type.getBytes(StandardCharsets.UTF_8));
      kafkaTemplate.send(record);
    } catch (RuntimeException ex) {
      log.warn(
          "Kafka publish failed type={} transactionId={}: {}",
          type,
          transactionId,
          ex.getMessage());
    }
  }

  private String jsonPayload(
      TransactionEntity transaction, String type, Map<String, ?> attributes) {
    try {
      return objectMapper.writeValueAsString(
          Map.of(
              "transactionId", transaction.getId(),
              "type", type,
              "state", transaction.getState().name(),
              "occurredAt", Instant.now().toString(),
              "attributes", attributes));
    } catch (JsonProcessingException ex) {
      throw new IllegalStateException("Failed to serialize transaction event", ex);
    }
  }
}
