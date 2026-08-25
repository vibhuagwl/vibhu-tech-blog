package com.vibhu.aifp.domain;

import com.vibhu.aifp.common.KafkaMessageRecord;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class KafkaOpsService {

  private final DomainDataSeeder seeder;

  public KafkaOpsService(DomainDataSeeder seeder) {
    this.seeder = seeder;
  }

  public List<KafkaMessageRecord> findFailedMessage(String paymentId) {
    String key = paymentId == null ? "" : paymentId.toUpperCase(Locale.ROOT);
    return seeder.kafkaMessages().values().stream()
        .filter(m -> "FAILED".equalsIgnoreCase(m.status()))
        .filter(m -> key.isBlank() || key.equalsIgnoreCase(m.key()) || m.payload().contains(key))
        .collect(Collectors.toList());
  }

  public KafkaMessageRecord getMessageDetails(String messageId) {
    KafkaMessageRecord message = seeder.kafkaMessages().get(normalize(messageId));
    if (message == null) {
      throw new IllegalArgumentException("Kafka message not found: " + messageId);
    }
    return message;
  }

  public KafkaMessageRecord replayMessage(String messageId, boolean approved) {
    KafkaMessageRecord message = getMessageDetails(messageId);
    if (!approved) {
      return new KafkaMessageRecord(
          message.messageId(),
          message.topic(),
          message.partition(),
          message.offset(),
          message.key(),
          message.payload(),
          "REPLAY_PROPOSED",
          "Awaiting human approval",
          message.timestamp());
    }
    KafkaMessageRecord replayed =
        new KafkaMessageRecord(
            message.messageId(),
            message.topic(),
            message.partition(),
            message.offset(),
            message.key(),
            message.payload(),
            "REPLAYED",
            null,
            message.timestamp());
    seeder.kafkaMessages().put(message.messageId(), replayed);
    return replayed;
  }

  private static String normalize(String id) {
    return id == null ? "" : id.trim().toUpperCase(Locale.ROOT);
  }
}
