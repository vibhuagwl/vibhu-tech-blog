package com.vibhu.counter.aggregator.config;

import com.vibhu.counter.common.events.CounterDeltaEvent;
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
    ConcurrentKafkaListenerContainerFactory<String, CounterDeltaEvent> kafkaListenerContainerFactory(
            ConsumerFactory<String, CounterDeltaEvent> consumerFactory
    ) {
        ConcurrentKafkaListenerContainerFactory<String, CounterDeltaEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        return factory;
    }
}
