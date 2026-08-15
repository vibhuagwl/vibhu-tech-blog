package com.vibhu.msp.notification.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.msp.common.MspTopics;
import com.vibhu.msp.common.events.EventTypes;
import com.vibhu.msp.notification.service.InboxService;
import com.vibhu.msp.notification.service.NotificationService;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationEventConsumer {

  private final InboxService inboxService;
  private final NotificationService notificationService;
  private final ObjectMapper objectMapper;

  public NotificationEventConsumer(InboxService inboxService,
                                   NotificationService notificationService,
                                   ObjectMapper objectMapper) {
    this.inboxService = inboxService;
    this.notificationService = notificationService;
    this.objectMapper = objectMapper;
  }

  @KafkaListener(topics = {
      MspTopics.ORDER_EVENTS,
      MspTopics.PAYMENT_EVENTS,
      MspTopics.INVENTORY_EVENTS
  }, groupId = "notification-service")
  public void onEvent(ConsumerRecord<String, Object> record) {
    String messageId = record.topic() + "-" + record.partition() + "-" + record.offset();
    inboxService.processIfNew(messageId, ignored -> {
      try {
        var root = objectMapper.convertValue(record.value(), java.util.Map.class);
        String eventType = (String) root.get("eventType");
        var payload = objectMapper.convertValue(root.get("payload"), java.util.Map.class);
        String orderId = payload.get("orderId") != null ? payload.get("orderId").toString() : "unknown";
        String message = "Event " + eventType + " for order " + orderId;
        if (EventTypes.ORDER_COMPLETED.equals(eventType)) {
          notificationService.send(orderId, "Your order " + orderId + " is confirmed!");
        } else if (EventTypes.ORDER_CANCELLED.equals(eventType)) {
          notificationService.send(orderId, "Your order " + orderId + " was cancelled.");
        } else if (EventTypes.PAYMENT_AUTHORIZED.equals(eventType)) {
          notificationService.send(orderId, "Payment authorized for order " + orderId);
        }
      } catch (Exception ex) {
        throw new IllegalStateException(ex);
      }
    });
  }
}
