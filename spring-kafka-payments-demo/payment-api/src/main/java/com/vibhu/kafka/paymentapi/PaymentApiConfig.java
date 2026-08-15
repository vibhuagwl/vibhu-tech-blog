package com.vibhu.kafka.paymentapi;

import com.vibhu.kafka.common.PaymentTopics;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;

@Configuration
public class PaymentApiConfig {

  @Bean
  NewTopic paymentRequestsTopic() {
    return TopicBuilder.name(PaymentTopics.PAYMENT_REQUESTS).partitions(6).replicas(1).build();
  }

  @Bean
  NewTopic paymentResultsTopic() {
    return TopicBuilder.name(PaymentTopics.PAYMENT_RESULTS).partitions(6).replicas(1).build();
  }

  @Bean
  NewTopic paymentRequestsDltTopic() {
    return TopicBuilder.name(PaymentTopics.PAYMENT_REQUESTS_DLT).partitions(6).replicas(1).build();
  }

  @Bean
  PaymentPublisher paymentPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
    return new PaymentPublisher(kafkaTemplate);
  }

  static final class PaymentPublisher {
    private final KafkaTemplate<String, Object> kafkaTemplate;

    PaymentPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
      this.kafkaTemplate = kafkaTemplate;
    }

    void publish(Message<?> message) {
      kafkaTemplate
          .send(message)
          .whenComplete(
              (result, ex) -> {
                if (ex != null) {
                  throw new IllegalStateException("Kafka publish failed", ex);
                }
              });
    }

    void attachLogging(Message<?> message) {
      kafkaTemplate
          .send(message)
          .whenComplete(
              (SendResult<String, Object> result, Throwable ex) -> {
                if (ex == null) {
                  // no-op demo callback; useful when discussing send acks/interceptor behavior
                }
              });
    }

    Message<Object> buildMessage(String topic, String key, String traceId, Object payload) {
      return MessageBuilder.withPayload(payload)
          .setHeader("kafka_topic", topic)
          .setHeader("kafka_messageKey", key)
          .setHeader("traceId", traceId)
          .setHeader("eventType", payload.getClass().getSimpleName())
          .build();
    }
  }
}
