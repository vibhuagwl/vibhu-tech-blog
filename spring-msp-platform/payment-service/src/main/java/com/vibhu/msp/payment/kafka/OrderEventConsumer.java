package com.vibhu.msp.payment.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.msp.common.MspTopics;
import com.vibhu.msp.common.events.EventTypes;
import com.vibhu.msp.common.events.OrderCreated;
import com.vibhu.msp.payment.service.InboxService;
import com.vibhu.msp.payment.service.PaymentService;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class OrderEventConsumer {

  private static final Logger log = LoggerFactory.getLogger(OrderEventConsumer.class);

  private final InboxService inboxService;
  private final PaymentService paymentService;
  private final ObjectMapper objectMapper;

  public OrderEventConsumer(
      InboxService inboxService, PaymentService paymentService, ObjectMapper objectMapper) {
    this.inboxService = inboxService;
    this.paymentService = paymentService;
    this.objectMapper = objectMapper;
  }

  @KafkaListener(topics = MspTopics.ORDER_EVENTS, groupId = "payment-service")
  public void onOrderEvent(ConsumerRecord<String, Object> record) {
    String messageId = record.topic() + "-" + record.partition() + "-" + record.offset();
    inboxService.processIfNew(
        messageId,
        ignored -> {
          try {
            var root = objectMapper.convertValue(record.value(), java.util.Map.class);
            String eventType = (String) root.get("eventType");
            if (!EventTypes.ORDER_CREATED.equals(eventType)) {
              return;
            }
            OrderCreated order = objectMapper.convertValue(root.get("payload"), OrderCreated.class);
            String correlationId = (String) root.get("correlationId");
            paymentService.processOrderPayment(
                order.orderId(), order.customerId(), order.totalAmount(), correlationId);
          } catch (Exception ex) {
            log.error("Failed to process order event: {}", ex.getMessage());
            throw new IllegalStateException(ex);
          }
        });
  }
}
