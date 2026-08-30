package com.example.flashsale.order.infrastructure.kafka;

import com.example.flashsale.common.event.JsonEvents;
import com.example.flashsale.common.kafka.Topics;
import com.example.flashsale.order.application.saga.SagaOrchestrator;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
public class OrderKafkaListener {
    private final SagaOrchestrator saga;

    public OrderKafkaListener(SagaOrchestrator saga) {
        this.saga = saga;
    }

    @KafkaListener(topics = Topics.INVENTORY_RESERVED, groupId = "order-service")
    public void reserved(String json, Acknowledgment ack) {
        saga.onInventoryReserved(JsonEvents.read(json));
        ack.acknowledge();
    }

    @KafkaListener(topics = Topics.PAYMENT_SUCCEEDED, groupId = "order-service")
    public void paid(String json, Acknowledgment ack) {
        saga.onPaymentSucceeded(JsonEvents.read(json));
        ack.acknowledge();
    }

    @KafkaListener(topics = Topics.PAYMENT_FAILED, groupId = "order-service")
    public void failed(String json, Acknowledgment ack) {
        saga.onPaymentFailed(JsonEvents.read(json));
        ack.acknowledge();
    }
}
