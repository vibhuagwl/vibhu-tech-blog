package com.vibhu.msp.order.config;

import com.vibhu.msp.common.MspTopics;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.common.TopicPartition;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
public class KafkaConfig {

  @Bean
  NewTopic orderEventsTopic() {
    return TopicBuilder.name(MspTopics.ORDER_EVENTS).partitions(3).replicas(1).build();
  }

  @Bean
  NewTopic orderEventsDltTopic() {
    return TopicBuilder.name(MspTopics.ORDER_EVENTS_DLT).partitions(3).replicas(1).build();
  }

  @Bean
  DefaultErrorHandler kafkaErrorHandler(KafkaTemplate<String, Object> kafkaTemplate) {
    DeadLetterPublishingRecoverer recoverer =
        new DeadLetterPublishingRecoverer(
            kafkaTemplate,
            (record, ex) -> new TopicPartition(MspTopics.ORDER_EVENTS_DLT, record.partition()));
    return new DefaultErrorHandler(recoverer, new FixedBackOff(500L, 2L));
  }
}
