package com.example.kafka.consumer;

import com.example.kafka.audit.SecurityAuditLogger;
import com.example.kafka.model.PaymentEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class PaymentConsumer {

    private static final Logger log = LoggerFactory.getLogger(PaymentConsumer.class);

    private final SecurityAuditLogger auditLogger;
    private final ConcurrentMap<String, PaymentEvent> processed = new ConcurrentHashMap<>();
    private final AtomicInteger processedCount = new AtomicInteger();

    public PaymentConsumer(SecurityAuditLogger auditLogger) {
        this.auditLogger = auditLogger;
    }

    @KafkaListener(topics = "${app.kafka.payments-topic}", groupId = "${app.kafka.consumer-group}")
    public void consume(@Payload PaymentEvent event, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_KEY) String key) {
        log.debug("Consumed payment {} key={} topic={}", event.paymentId(), key, topic);
        processed.put(event.paymentId(), event);
        processedCount.incrementAndGet();
        auditLogger.paymentConsumed(event.paymentId(), topic);
    }

    public ConcurrentMap<String, PaymentEvent> processed() {
        return processed;
    }

    public int processedCount() {
        return processedCount.get();
    }
}
