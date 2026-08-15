package com.vibhu.whatsapp.deliveryworker.config;

import com.vibhu.whatsapp.common.events.MessageCreatedEvent;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;

@Configuration
@EnableKafka
@Profile("kafka")
public class KafkaConsumerConfig {
  @Bean
  ConcurrentKafkaListenerContainerFactory<String, MessageCreatedEvent>
      kafkaListenerContainerFactory(ConsumerFactory<String, MessageCreatedEvent> consumerFactory) {
    ConcurrentKafkaListenerContainerFactory<String, MessageCreatedEvent> factory =
        new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(consumerFactory);
    return factory;
  }
}
