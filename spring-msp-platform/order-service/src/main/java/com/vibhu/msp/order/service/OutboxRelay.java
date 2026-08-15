package com.vibhu.msp.order.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.msp.common.EventEnvelope;
import com.vibhu.msp.common.MspTopics;
import com.vibhu.msp.order.entity.OutboxEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class OutboxRelay {

  private static final Logger log = LoggerFactory.getLogger(OutboxRelay.class);

  private final OutboxService outboxService;
  private final KafkaTemplate<String, Object> kafkaTemplate;
  private final ObjectMapper objectMapper;

  public OutboxRelay(OutboxService outboxService,
                     KafkaTemplate<String, Object> kafkaTemplate,
                     ObjectMapper objectMapper) {
    this.outboxService = outboxService;
    this.kafkaTemplate = kafkaTemplate;
    this.objectMapper = objectMapper;
  }

  @Scheduled(fixedDelayString = "${msp.outbox.relay-interval-ms:2000}")
  public void relayPending() {
    for (OutboxEntity pending : outboxService.findPending()) {
      try {
        Object payload = objectMapper.readValue(pending.getPayload(), Object.class);
        kafkaTemplate.send(MspTopics.ORDER_EVENTS, pending.getAggregateId(), payload);
        outboxService.markPublished(pending.getId());
        log.debug("Outbox published id={} type={}", pending.getId(), pending.getEventType());
      } catch (Exception ex) {
        log.error("Failed to publish outbox id={}: {}", pending.getId(), ex.getMessage());
      }
    }
  }
}
