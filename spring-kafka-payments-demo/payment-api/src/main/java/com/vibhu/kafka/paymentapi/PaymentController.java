package com.vibhu.kafka.paymentapi;

import com.vibhu.kafka.common.PaymentKeyStrategy;
import com.vibhu.kafka.common.PaymentMessages.CreatePaymentRequest;
import com.vibhu.kafka.common.PaymentMessages.PaymentRequestedEvent;
import com.vibhu.kafka.common.PaymentTopics;
import java.net.URI;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

  private final PaymentApiConfig.PaymentPublisher publisher;
  private final KafkaTemplate<String, Object> kafkaTemplate;

  public PaymentController(
      PaymentApiConfig.PaymentPublisher publisher, KafkaTemplate<String, Object> kafkaTemplate) {
    this.publisher = publisher;
    this.kafkaTemplate = kafkaTemplate;
  }

  @PostMapping
  public ResponseEntity<Map<String, String>> create(
      @Validated @RequestBody CreatePaymentRequest request) {
    String key = PaymentKeyStrategy.forPayment(request.accountId(), request.paymentId());
    String traceId = UUID.randomUUID().toString();
    PaymentRequestedEvent event =
        new PaymentRequestedEvent(
            request.paymentId(),
            request.accountId(),
            request.amount(),
            request.currency(),
            request.merchantRef(),
            request.failMode(),
            Instant.now());

    kafkaTemplate.executeInTransaction(
        ops -> {
          var message = publisher.buildMessage(PaymentTopics.PAYMENT_REQUESTS, key, traceId, event);
          publisher.publish(message);
          return null;
        });

    return ResponseEntity.accepted()
        .location(URI.create("/api/payments/" + request.paymentId()))
        .body(
            Map.of(
                "paymentId",
                request.paymentId(),
                "accountId",
                request.accountId(),
                "kafkaKey",
                key,
                "topic",
                PaymentTopics.PAYMENT_REQUESTS,
                "traceId",
                traceId));
  }
}
