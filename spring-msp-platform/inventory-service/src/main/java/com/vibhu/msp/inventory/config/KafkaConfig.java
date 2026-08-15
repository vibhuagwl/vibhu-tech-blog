package com.vibhu.msp.inventory.config;

import com.vibhu.msp.common.MspTopics;
import com.vibhu.msp.inventory.entity.StockEntity;
import com.vibhu.msp.inventory.repository.StockRepository;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.common.TopicPartition;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
public class KafkaConfig {

  @Bean
  NewTopic inventoryEventsTopic() {
    return TopicBuilder.name(MspTopics.INVENTORY_EVENTS).partitions(3).replicas(1).build();
  }

  @Bean
  NewTopic inventoryEventsDltTopic() {
    return TopicBuilder.name(MspTopics.INVENTORY_EVENTS_DLT).partitions(3).replicas(1).build();
  }

  @Bean
  DefaultErrorHandler kafkaErrorHandler(KafkaTemplate<String, Object> kafkaTemplate) {
    DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
        kafkaTemplate,
        (record, ex) -> new TopicPartition(MspTopics.INVENTORY_EVENTS_DLT, record.partition()));
    return new DefaultErrorHandler(recoverer, new FixedBackOff(500L, 2L));
  }

  @Bean
  CommandLineRunner seedStock(StockRepository stockRepository) {
    return args -> {
      if (!stockRepository.existsById("SKU-1")) {
        StockEntity stock = new StockEntity();
        stock.setSku("SKU-1");
        stock.setAvailable(1000);
        stockRepository.save(stock);
      }
    };
  }
}
