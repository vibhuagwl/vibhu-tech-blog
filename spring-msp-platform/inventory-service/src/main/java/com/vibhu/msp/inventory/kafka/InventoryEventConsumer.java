package com.vibhu.msp.inventory.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.msp.common.MspTopics;
import com.vibhu.msp.common.events.EventTypes;
import com.vibhu.msp.common.events.OrderCreated;
import com.vibhu.msp.inventory.service.InboxService;
import com.vibhu.msp.inventory.service.InventoryService;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class InventoryEventConsumer {

  private static final Logger log = LoggerFactory.getLogger(InventoryEventConsumer.class);

  private final InboxService inboxService;
  private final InventoryService inventoryService;
  private final ObjectMapper objectMapper;

  public InventoryEventConsumer(
      InboxService inboxService, InventoryService inventoryService, ObjectMapper objectMapper) {
    this.inboxService = inboxService;
    this.inventoryService = inventoryService;
    this.objectMapper = objectMapper;
  }

  @KafkaListener(topics = MspTopics.ORDER_EVENTS, groupId = "inventory-service")
  public void onOrderEvent(ConsumerRecord<String, Object> record) {
    String messageId = record.topic() + "-" + record.partition() + "-" + record.offset();
    inboxService.processIfNew(messageId, ignored -> handleOrder(record));
  }

  @KafkaListener(topics = MspTopics.ORDER_EVENTS, groupId = "inventory-compensation")
  public void onOrderCancelled(ConsumerRecord<String, Object> record) {
    try {
      var root = objectMapper.convertValue(record.value(), java.util.Map.class);
      String eventType = (String) root.get("eventType");
      if (EventTypes.ORDER_CANCELLED.equals(eventType)) {
        String orderId =
            objectMapper
                .convertValue(root.get("payload"), java.util.Map.class)
                .get("orderId")
                .toString();
        String correlationId = (String) root.get("correlationId");
        String compMessageId = "cancel-" + messageId(record);
        inboxService.processIfNew(
            compMessageId,
            ignored -> inventoryService.releaseForOrder(orderId, "order-cancelled", correlationId));
      }
    } catch (Exception ex) {
      log.error("Compensation handler failed: {}", ex.getMessage());
    }
  }

  private void handleOrder(ConsumerRecord<String, Object> record) {
    try {
      var root = objectMapper.convertValue(record.value(), java.util.Map.class);
      if (!EventTypes.ORDER_CREATED.equals(root.get("eventType"))) {
        return;
      }
      OrderCreated order = objectMapper.convertValue(root.get("payload"), OrderCreated.class);
      inventoryService.reserveForOrder(order, (String) root.get("correlationId"));
    } catch (Exception ex) {
      log.error("Failed to reserve inventory: {}", ex.getMessage());
      throw new IllegalStateException(ex);
    }
  }

  private String messageId(ConsumerRecord<String, Object> record) {
    return record.topic() + "-" + record.partition() + "-" + record.offset();
  }
}
