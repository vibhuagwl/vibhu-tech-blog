package com.vibhu.kafka.settlement;

import com.vibhu.kafka.common.PaymentKeyStrategy;
import com.vibhu.kafka.common.PaymentMessages.FailMode;
import com.vibhu.kafka.common.PaymentMessages.PaymentRequestedEvent;
import com.vibhu.kafka.common.PaymentMessages.PaymentResultEvent;
import com.vibhu.kafka.common.PaymentTopics;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

class SettlementRepository {
  private final JdbcTemplate jdbcTemplate;

  SettlementRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  boolean markProcessed(String paymentId) {
    return jdbcTemplate.update(
            "merge into processed_payments key(payment_id) values (?, current_timestamp)",
            paymentId)
        == 1;
  }

  void recordDlq(String paymentId, String reason) {
    jdbcTemplate.update(
        "merge into dlq_events key(payment_id) values (?, ?, current_timestamp)",
        paymentId,
        reason);
  }

  List<Map<String, Object>> processed() {
    return jdbcTemplate.queryForList(
        "select payment_id, processed_at from processed_payments order by processed_at desc");
  }

  List<Map<String, Object>> dlq() {
    return jdbcTemplate.queryForList(
        "select payment_id, reason, created_at from dlq_events order by created_at desc");
  }
}

class PoisonPaymentException extends RuntimeException {
  PoisonPaymentException(String message) {
    super(message);
  }
}

class TransientSettlementException extends RuntimeException {
  TransientSettlementException(String message) {
    super(message);
  }
}

@org.springframework.stereotype.Service
class SettlementService {
  private final SettlementRepository repository;
  private final KafkaTemplate<String, Object> kafkaTemplate;

  SettlementService(SettlementRepository repository, KafkaTemplate<String, Object> kafkaTemplate) {
    this.repository = repository;
    this.kafkaTemplate = kafkaTemplate;
  }

  void process(PaymentRequestedEvent event) {
    if (!repository.markProcessed(event.paymentId())) {
      return;
    }
    if (event.failMode() == FailMode.POISON) {
      throw new PoisonPaymentException("Broken payload cannot be settled");
    }
    if (event.failMode() == FailMode.TRANSIENT_BANK_TIMEOUT) {
      throw new TransientSettlementException("Bank gateway timed out");
    }
    publishResult(event, "SETTLED", "funds captured");
  }

  void publishResult(PaymentRequestedEvent event, String status, String detail) {
    kafkaTemplate.send(
        PaymentTopics.PAYMENT_RESULTS,
        PaymentKeyStrategy.forPayment(event.accountId(), event.paymentId()),
        new PaymentResultEvent(
            event.paymentId(), event.accountId(), status, detail, Instant.now()));
  }

  void onDlq(PaymentRequestedEvent event, Exception ex) {
    repository.recordDlq(event.paymentId(), ex.getMessage());
    publishResult(event, "FAILED", ex.getMessage());
  }
}

@org.springframework.stereotype.Component
class SettlementListener {
  private final SettlementService settlementService;

  SettlementListener(SettlementService settlementService) {
    this.settlementService = settlementService;
  }

  @KafkaListener(
      topics = PaymentTopics.PAYMENT_REQUESTS,
      groupId = "settlement-worker",
      containerFactory = "kafkaListenerContainerFactory")
  void onPayment(
      PaymentRequestedEvent event,
      @Header(KafkaHeaders.RECEIVED_KEY) String key,
      Acknowledgment acknowledgment) {
    settlementService.process(event);
    acknowledgment.acknowledge();
  }

  @KafkaListener(topics = PaymentTopics.PAYMENT_REQUESTS_DLT, groupId = "settlement-worker-dlt")
  void onDlq(PaymentRequestedEvent event) {
    settlementService.onDlq(event, new PoisonPaymentException("sent to DLT after retries"));
  }
}

@RestController
@RequestMapping("/api/ops")
class SettlementOpsController {
  private final SettlementRepository repository;

  SettlementOpsController(SettlementRepository repository) {
    this.repository = repository;
  }

  @GetMapping("/processed")
  ResponseEntity<List<Map<String, Object>>> processed() {
    return ResponseEntity.ok(repository.processed());
  }

  @GetMapping("/dlq")
  ResponseEntity<List<Map<String, Object>>> dlq() {
    return ResponseEntity.ok(repository.dlq());
  }
}
