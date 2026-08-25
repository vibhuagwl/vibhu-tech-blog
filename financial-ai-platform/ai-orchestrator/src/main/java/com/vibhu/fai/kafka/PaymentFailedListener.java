package com.vibhu.fai.kafka;

import com.vibhu.fai.common.dto.ChatRequest;
import com.vibhu.fai.common.security.AuthContext;
import com.vibhu.fai.orchestrator.FinancialAiOrchestrator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * ============================================================
 * INTERVIEW NOTES — Kafka
 * ============================================================
 * Consumer group = scalable workers.
 * Partition = ordering boundary (key by paymentId when order matters).
 * Delivery is commonly at-least-once ⇒ consumers must be idempotent.
 * ============================================================
 */
@Component
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true")
public class PaymentFailedListener {

  private static final Logger log = LoggerFactory.getLogger(PaymentFailedListener.class);
  private final FinancialAiOrchestrator orchestrator;
  private final Map<String, Boolean> processed = new ConcurrentHashMap<>();

  public PaymentFailedListener(FinancialAiOrchestrator orchestrator) {
    this.orchestrator = orchestrator;
  }

  @KafkaListener(topics = "payment.failed", groupId = "ai-investigation")
  public void onPaymentFailed(String transactionId) {
    // Idempotency: skip if already investigated
    if (processed.putIfAbsent(transactionId, Boolean.TRUE) != null) {
      log.info("skip duplicate investigation {}", transactionId);
      return;
    }
    orchestrator.chat(
        new ChatRequest("kafka-" + transactionId, "Why did payment " + transactionId + " fail?", "TENANT-1", "system"),
        AuthContext.demo());
  }
}
