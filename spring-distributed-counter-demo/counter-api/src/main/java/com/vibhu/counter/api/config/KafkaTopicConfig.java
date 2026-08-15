package com.vibhu.counter.api.config;

import com.vibhu.counter.common.events.CounterTopics;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
@Profile("kafka")
public class KafkaTopicConfig {
  @Bean
  NewTopic counterDeltasTopic() {
    return TopicBuilder.name(CounterTopics.COUNTER_DELTAS).partitions(6).replicas(1).build();
  }
}
