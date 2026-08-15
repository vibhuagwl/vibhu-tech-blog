package com.vibhu.kafka.settlement;

import com.vibhu.kafka.common.PaymentMessages.PaymentRequestedEvent;
import com.vibhu.kafka.common.PaymentTopics;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.common.TopicPartition;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
public class SettlementKafkaConfig {

  @Bean
  NewTopic paymentRequestsTopicWorker() {
    return TopicBuilder.name(PaymentTopics.PAYMENT_REQUESTS).partitions(6).replicas(1).build();
  }

  @Bean
  NewTopic paymentResultsTopicWorker() {
    return TopicBuilder.name(PaymentTopics.PAYMENT_RESULTS).partitions(6).replicas(1).build();
  }

  @Bean
  NewTopic paymentRequestsDltTopicWorker() {
    return TopicBuilder.name(PaymentTopics.PAYMENT_REQUESTS_DLT).partitions(6).replicas(1).build();
  }

  @Bean
  ConcurrentKafkaListenerContainerFactory<String, PaymentRequestedEvent>
      kafkaListenerContainerFactory(
          ConsumerFactory<String, PaymentRequestedEvent> consumerFactory,
          KafkaTemplate<String, Object> kafkaTemplate) {
    ConcurrentKafkaListenerContainerFactory<String, PaymentRequestedEvent> factory =
        new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(consumerFactory);
    factory.setConcurrency(3);
    factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
    factory.setCommonErrorHandler(errorHandler(kafkaTemplate));
    return factory;
  }

  @Bean
  DefaultErrorHandler errorHandler(KafkaTemplate<String, Object> kafkaTemplate) {
    DeadLetterPublishingRecoverer recoverer =
        new DeadLetterPublishingRecoverer(
            kafkaTemplate,
            (record, ex) ->
                new TopicPartition(PaymentTopics.PAYMENT_REQUESTS_DLT, record.partition()));
    DefaultErrorHandler handler = new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 2L));
    handler.addRetryableExceptions(TransientSettlementException.class);
    handler.addNotRetryableExceptions(PoisonPaymentException.class, IllegalArgumentException.class);
    return handler;
  }

  @Bean
  SettlementRepository settlementRepository(JdbcTemplate jdbcTemplate) {
    return new SettlementRepository(jdbcTemplate);
  }
}
