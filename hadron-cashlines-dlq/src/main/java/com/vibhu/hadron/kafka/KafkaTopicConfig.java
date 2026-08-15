package com.vibhu.hadron.kafka;

import com.vibhu.hadron.config.HadronProperties;
import com.vibhu.hadron.config.TopicNames;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
@ConditionalOnProperty(name = "hadron.kafka.enabled", havingValue = "true")
public class KafkaTopicConfig {

  @Bean
  public NewTopic cashlineEvents(HadronProperties properties) {
    return topic(TopicNames.CASHLINE_EVENTS, properties);
  }

  @Bean
  public NewTopic retry1(HadronProperties properties) {
    return topic(TopicNames.RETRY_1, properties);
  }

  @Bean
  public NewTopic retry2(HadronProperties properties) {
    return topic(TopicNames.RETRY_2, properties);
  }

  @Bean
  public NewTopic retry3(HadronProperties properties) {
    return topic(TopicNames.RETRY_3, properties);
  }

  @Bean
  public NewTopic dlq(HadronProperties properties) {
    return topic(TopicNames.DLQ, properties);
  }

  private NewTopic topic(String name, HadronProperties properties) {
    return TopicBuilder.name(name)
        .partitions(properties.getKafka().getTopicPartitions())
        .replicas(1)
        .build();
  }
}
