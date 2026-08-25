package com.vibhu.fai.kafka;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * ============================================================
 * INTERVIEW NOTES — Idempotent notification
 * ============================================================
 * notificationId = paymentId + ":" + notificationType
 * Kafka redelivery ⇒ skip if already sent.
 * Business "exactly once" ≈ idempotent processing, not broker magic.
 * ============================================================
 */
@Component
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true")
public class NotificationConsumer {
  private static final Logger log = LoggerFactory.getLogger(NotificationConsumer.class);
  private final Set<String> sent = ConcurrentHashMap.newKeySet();

  @KafkaListener(topics = "payment.notifications", groupId = "notification-service")
  public void onNotify(String payload) {
    // payload format paymentId:TYPE
    if (!sent.add(payload)) {
      log.info("idempotent skip {}", payload);
      return;
    }
    log.info("notify {}", payload);
  }
}
