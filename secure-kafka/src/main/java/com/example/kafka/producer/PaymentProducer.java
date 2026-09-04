package com.example.kafka.producer;

import com.example.kafka.audit.SecurityAuditLogger;
import com.example.kafka.config.KafkaAppProperties;
import com.example.kafka.model.PaymentEvent;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class PaymentProducer {

    private final KafkaTemplate<String, PaymentEvent> paymentKafkaTemplate;
    private final KafkaAppProperties properties;
    private final SecurityAuditLogger auditLogger;

    public PaymentProducer(KafkaTemplate<String, PaymentEvent> paymentKafkaTemplate, KafkaAppProperties properties,
            SecurityAuditLogger auditLogger) {
        this.paymentKafkaTemplate = paymentKafkaTemplate;
        this.properties = properties;
        this.auditLogger = auditLogger;
    }

    public CompletableFuture<SendResult<String, PaymentEvent>> send(PaymentEvent event) {
        String key = event.accountId() + ":" + event.paymentId();
        return paymentKafkaTemplate.send(properties.getPaymentsTopic(), key, event)
                .whenComplete((_, error) -> {
                    if (error == null) {
                        auditLogger.paymentPublished(event.paymentId(), properties.getPaymentsTopic());
                    }
                });
    }
}
