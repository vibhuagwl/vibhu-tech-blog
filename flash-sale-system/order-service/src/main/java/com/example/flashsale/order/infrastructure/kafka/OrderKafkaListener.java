package com.example.flashsale.order.infrastructure.kafka;

import com.example.flashsale.common.error.ErrorCode;
import com.example.flashsale.common.error.PermanentException;
import com.example.flashsale.common.event.EventEnvelope;
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
        saga.onInventoryReserved(read(json));
        ack.acknowledge();
    }

    @KafkaListener(topics = Topics.PAYMENT_SUCCEEDED, groupId = "order-service")
    public void paid(String json, Acknowledgment ack) {
        saga.onPaymentSucceeded(read(json));
        ack.acknowledge();
    }

    @KafkaListener(topics = Topics.PAYMENT_FAILED, groupId = "order-service")
    public void failed(String json, Acknowledgment ack) {
        saga.onPaymentFailed(read(json));
        ack.acknowledge();
    }

    private static EventEnvelope read(String json) {
        try {
            return JsonEvents.read(json);
        } catch (IllegalArgumentException ex) {
            throw new PermanentException(ErrorCode.INVALID_REQUEST, ex.getMessage());
        }
    }
}
