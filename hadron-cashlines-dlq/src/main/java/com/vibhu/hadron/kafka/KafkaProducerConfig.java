package com.vibhu.hadron.kafka;

import com.vibhu.hadron.config.HadronProperties;
import com.vibhu.hadron.config.TopicNames;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.header.internals.RecordHeader;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.stereotype.Component;

@Configuration
@ConditionalOnProperty(name = "hadron.kafka.enabled", havingValue = "true")
public class KafkaProducerConfig {

  @Bean
  public ProducerFactory<String, String> producerFactory(HadronProperties properties) {
    Map<String, Object> cfg = new HashMap<>();
    cfg.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, properties.getKafka().getBootstrapServers());
    cfg.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    cfg.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    cfg.put(ProducerConfig.ACKS_CONFIG, "all");
    cfg.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
    cfg.put(ProducerConfig.LINGER_MS_CONFIG, 5);
    cfg.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "lz4");
    return new DefaultKafkaProducerFactory<>(cfg);
  }

  @Bean
  public KafkaTemplate<String, String> kafkaTemplate(ProducerFactory<String, String> factory) {
    return new KafkaTemplate<>(factory);
  }

  @Component
  @ConditionalOnProperty(name = "hadron.kafka.enabled", havingValue = "true")
  public static class KafkaEventPublisher implements EventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public KafkaEventPublisher(KafkaTemplate<String, String> kafkaTemplate) {
      this.kafkaTemplate = kafkaTemplate;
    }

    @Override
    public void publish(String topic, String key, String payload, Map<String, String> headers) {
      ProducerRecord<String, String> record = new ProducerRecord<>(topic, key, payload);
      if (headers != null) {
        headers.forEach((k, v) -> {
          if (v != null) {
            record.headers().add(new RecordHeader(k, v.getBytes()));
          }
        });
      }
      kafkaTemplate.send(record);
    }

    @Override
    public void publishDelayed(
        String topic, String key, String payload, Map<String, String> headers, Duration delay) {
      Map<String, String> next = headers == null ? new HashMap<>() : new HashMap<>(headers);
      next.put(TopicNames.HEADER_RETRY_AT, Long.toString(System.currentTimeMillis() + delay.toMillis()));
      publish(topic, key, payload, next);
    }
  }
}
