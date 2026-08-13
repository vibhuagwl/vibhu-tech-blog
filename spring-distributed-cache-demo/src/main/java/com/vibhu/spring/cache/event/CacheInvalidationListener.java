package com.vibhu.spring.cache.event;

import com.vibhu.spring.cache.service.PaymentCacheService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.cache.kafka-enabled", havingValue = "true")
public class CacheInvalidationListener {
  private static final Logger log = LoggerFactory.getLogger(CacheInvalidationListener.class);

  private final PaymentCacheService payments;

  public CacheInvalidationListener(PaymentCacheService payments) {
    this.payments = payments;
  }

  @KafkaListener(topics = "cache.invalidate", groupId = "payment-cache")
  public void onInvalidate(String paymentId) {
    payments.evict(paymentId);
    log.info("kafka invalidate applied id={}", paymentId);
  }
}

@Component
@ConditionalOnProperty(name = "app.cache.kafka-enabled", havingValue = "true")
class CacheInvalidationPublisher {
  private final KafkaTemplate<String, String> kafka;

  CacheInvalidationPublisher(KafkaTemplate<String, String> kafka) {
    this.kafka = kafka;
  }

  public void publish(String paymentId) {
    kafka.send("cache.invalidate", paymentId, paymentId);
  }
}
