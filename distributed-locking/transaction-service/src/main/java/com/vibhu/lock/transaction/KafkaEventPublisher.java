package com.vibhu.lock.transaction;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class KafkaEventPublisher {
  public static final String TOPIC = "transaction.lifecycle";

  private final KafkaTemplate<String, String> kafkaTemplate;
  private final ObjectMapper objectMapper;
  private final TransactionEventRepository eventRepository;

  public KafkaEventPublisher(
      KafkaTemplate<String, String> kafkaTemplate,
      ObjectMapper objectMapper,
      TransactionEventRepository eventRepository
  ) {
    this.kafkaTemplate = kafkaTemplate;
    this.objectMapper = objectMapper;
    this.eventRepository = eventRepository;
  }

  public void publishLifecycle(TransactionEntity transaction, String type, Map<String, ?> attributes) {
    String payload = jsonPayload(transaction, type, attributes);
    eventRepository.save(new TransactionEventEntity(transaction.getId(), type, payload));

    ProducerRecord<String, String> record = new ProducerRecord<>(TOPIC, transaction.getId(), payload);
    record.headers().add("transaction-id", transaction.getId().getBytes(StandardCharsets.UTF_8));
    record.headers().add("correlation-id", transaction.getId().getBytes(StandardCharsets.UTF_8));
    record.headers().add("event-type", type.getBytes(StandardCharsets.UTF_8));
    kafkaTemplate.send(record);
  }

  private String jsonPayload(TransactionEntity transaction, String type, Map<String, ?> attributes) {
    try {
      return objectMapper.writeValueAsString(Map.of(
          "transactionId", transaction.getId(),
          "type", type,
          "state", transaction.getState().name(),
          "occurredAt", Instant.now(),
          "attributes", attributes
      ));
    } catch (JsonProcessingException ex) {
      throw new IllegalStateException("Failed to serialize transaction event", ex);
    }
  }
}
