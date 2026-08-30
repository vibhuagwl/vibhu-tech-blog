package com.example.kafka.controller;

import com.example.kafka.consumer.PaymentConsumer;
import com.example.kafka.model.PaymentEvent;
import com.example.kafka.producer.PaymentProducer;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.support.SendResult;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentProducer paymentProducer;
    private final PaymentConsumer paymentConsumer;

    public PaymentController(PaymentProducer paymentProducer, PaymentConsumer paymentConsumer) {
        this.paymentProducer = paymentProducer;
        this.paymentConsumer = paymentConsumer;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    @PreAuthorize("hasAuthority('SCOPE_payment:write')")
    public CompletableFuture<Map<String, Object>> publish(@Valid @RequestBody PaymentEvent event) {
        return paymentProducer.send(event)
                .thenApply(PaymentController::accepted);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('SCOPE_payment:read', 'SCOPE_payment:write')")
    public Map<String, Object> consumed() {
        return Map.of(
                "count", paymentConsumer.processedCount(),
                "payments", paymentConsumer.processed());
    }

    private static Map<String, Object> accepted(SendResult<String, PaymentEvent> result) {
        return Map.of(
                "status", "ACCEPTED",
                "paymentId", result.getProducerRecord().value().paymentId(),
                "topic", result.getRecordMetadata().topic(),
                "partition", result.getRecordMetadata().partition(),
                "offset", result.getRecordMetadata().offset());
    }
}
