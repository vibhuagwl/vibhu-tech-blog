package com.vibhu.msp.order.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.msp.common.EventEnvelope;
import com.vibhu.msp.common.MspTopics;
import com.vibhu.msp.common.events.EventTypes;
import com.vibhu.msp.common.events.InventoryReserved;
import com.vibhu.msp.common.events.PaymentAuthorized;
import com.vibhu.msp.common.events.PaymentFailed;
import com.vibhu.msp.order.service.InboxService;
import com.vibhu.msp.order.service.OrderService;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class SagaEventConsumer {

  private static final Logger log = LoggerFactory.getLogger(SagaEventConsumer.class);

  private final InboxService inboxService;
  private final OrderService orderService;
  private final ObjectMapper objectMapper;

  public SagaEventConsumer(InboxService inboxService, OrderService orderService, ObjectMapper objectMapper) {
    this.inboxService = inboxService;
    this.orderService = orderService;
    this.objectMapper = objectMapper;
  }

  @KafkaListener(topics = MspTopics.PAYMENT_EVENTS, groupId = "order-saga")
  public void onPaymentEvent(ConsumerRecord<String, Object> record) {
    inboxService.processIfNew(record.topic() + "-" + record.offset(), ignored -> {
      try {
        EventEnvelope<?> envelope = objectMapper.convertValue(record.value(), EventEnvelope.class);
        String eventType = envelope.eventType();
        if (EventTypes.PAYMENT_AUTHORIZED.equals(eventType)) {
          PaymentAuthorized payload = objectMapper.convertValue(
              ((java.util.Map<?, ?>) record.value()).get("payload"), PaymentAuthorized.class);
          orderService.markPaymentAuthorized(payload.orderId());
        } else if (EventTypes.PAYMENT_FAILED.equals(eventType)) {
          PaymentFailed payload = objectMapper.convertValue(
              ((java.util.Map<?, ?>) record.value()).get("payload"), PaymentFailed.class);
          orderService.cancelOrder(payload.orderId(), payload.reason());
        }
      } catch (Exception ex) {
        log.error("Failed to process payment event: {}", ex.getMessage());
        throw new IllegalStateException(ex);
      }
    });
  }

  @KafkaListener(topics = MspTopics.INVENTORY_EVENTS, groupId = "order-saga")
  public void onInventoryEvent(ConsumerRecord<String, Object> record) {
    inboxService.processIfNew(record.topic() + "-" + record.offset(), ignored -> {
      try {
        EventEnvelope<?> envelope = objectMapper.convertValue(record.value(), EventEnvelope.class);
        if (EventTypes.INVENTORY_RESERVED.equals(envelope.eventType())) {
          InventoryReserved payload = objectMapper.convertValue(
              ((java.util.Map<?, ?>) record.value()).get("payload"), InventoryReserved.class);
          orderService.markInventoryReserved(payload.orderId());
        }
      } catch (Exception ex) {
        log.error("Failed to process inventory event: {}", ex.getMessage());
        throw new IllegalStateException(ex);
      }
    });
  }
}
