package com.example.flashsale.payment.infrastructure.kafka;

import com.example.flashsale.common.event.JsonEvents;
import com.example.flashsale.common.kafka.Topics;
import com.example.flashsale.payment.application.ProcessPaymentService;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
public class PaymentKafkaListener {
    private final ProcessPaymentService service;

    public PaymentKafkaListener(ProcessPaymentService service) {
        this.service = service;
    }

    @KafkaListener(topics = Topics.PAYMENT_REQUESTED, groupId = "payment-service")
    public void on(String json, Acknowledgment ack) {
        service.handle(JsonEvents.read(json));
        ack.acknowledge();
    }
}
