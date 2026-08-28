package com.vibhu.kafka.production;

import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.boot.autoconfigure.kafka.KafkaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;

import java.util.Map;

@Configuration
@Profile("prod")
public class KafkaProducerConfig {

  @Bean
  ProducerFactory<String, String> producerFactory(KafkaProperties props) {
    Map<String, Object> cfg = props.buildProducerProperties(null);
    cfg.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    cfg.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    // acks=all, enable.idempotence=true come from application-prod.yml
    return new DefaultKafkaProducerFactory<>(cfg);
  }

  @Bean
  KafkaTemplate<String, String> kafkaTemplate(ProducerFactory<String, String> pf) {
    return new KafkaTemplate<>(pf);
  }
}
