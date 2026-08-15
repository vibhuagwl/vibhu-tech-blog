package com.vibhu.hadron.kafka;

import com.vibhu.hadron.classify.ExceptionClassifier;
import com.vibhu.hadron.config.HadronProperties;
import com.vibhu.hadron.config.TopicNames;
import com.vibhu.hadron.domain.EventEnvelope;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.ExponentialBackOffWithMaxRetries;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
@EnableKafka
@ConditionalOnProperty(name = "hadron.kafka.enabled", havingValue = "true")
public class KafkaConsumerConfig {

  @Bean
  public ConsumerFactory<String, String> consumerFactory(HadronProperties properties) {
    Map<String, Object> cfg = new HashMap<>();
    cfg.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, properties.getKafka().getBootstrapServers());
    cfg.put(ConsumerConfig.GROUP_ID_CONFIG, properties.getKafka().getGroupId());
    cfg.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
    cfg.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
    cfg.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
    cfg.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
    cfg.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, "read_committed");
    cfg.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 50);
    return new DefaultKafkaConsumerFactory<>(cfg);
  }

  @Bean
  public DeadLetterPublishingRecoverer deadLetterPublishingRecoverer(
      KafkaTemplate<String, String> template, ExceptionClassifier classifier) {
    return new DeadLetterPublishingRecoverer(
        template,
        (record, ex) -> {
          boolean retryable = classifier.retryable(ex);
          String dest = retryable ? nextRetryTopic(record) : TopicNames.DLQ;
          return new TopicPartition(dest, record.partition());
        });
  }

  @Bean
  public DefaultErrorHandler kafkaErrorHandler(
      DeadLetterPublishingRecoverer recoverer, ExceptionClassifier classifier) {
    // No long in-memory backoff: recoverer publishes to retry topics / DLQ.
    DefaultErrorHandler handler = new DefaultErrorHandler(recoverer, new FixedBackOff(0L, 0L));
    handler.setRetryListeners((record, ex, delivery) -> {});
    handler.addNotRetryableExceptions(
        com.vibhu.hadron.exception.PermanentBusinessException.class,
        com.vibhu.hadron.exception.PoisonMessageException.class,
        org.apache.kafka.common.errors.SerializationException.class,
        NullPointerException.class);
    return handler;
  }

  /**
   * Optional in-partition exponential backoff — do not use for long delays. Demonstrates Strategy 1
   * vs Strategy 2 in interviews.
   */
  public static ExponentialBackOffWithMaxRetries dangerousInMemoryBackoff() {
    ExponentialBackOffWithMaxRetries backoff = new ExponentialBackOffWithMaxRetries(3);
    backoff.setInitialInterval(500);
    backoff.setMultiplier(2.0);
    backoff.setMaxInterval(5_000);
    return backoff;
  }

  @Bean
  public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory(
      ConsumerFactory<String, String> consumerFactory, DefaultErrorHandler errorHandler) {
    ConcurrentKafkaListenerContainerFactory<String, String> factory =
        new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(consumerFactory);
    factory.setCommonErrorHandler(errorHandler);
    factory
        .getContainerProperties()
        .setAckMode(org.springframework.kafka.listener.ContainerProperties.AckMode.RECORD);
    factory.setConcurrency(1);
    return factory;
  }

  static EventEnvelope toEnvelope(ConsumerRecord<String, String> record) {
    Map<String, String> headers = new HashMap<>();
    record
        .headers()
        .forEach(h -> headers.put(h.key(), new String(h.value(), StandardCharsets.UTF_8)));
    int retry = 0;
    try {
      retry = Integer.parseInt(headers.getOrDefault(TopicNames.HEADER_RETRY_COUNT, "0"));
    } catch (NumberFormatException ignored) {
      retry = 0;
    }
    return new EventEnvelope(
        record.topic(),
        record.partition(),
        record.offset(),
        record.key(),
        record.value(),
        headers,
        retry);
  }

  private static String nextRetryTopic(ConsumerRecord<?, ?> record) {
    String current = record.topic();
    if (TopicNames.CASHLINE_EVENTS.equals(current)) {
      return TopicNames.RETRY_1;
    }
    if (TopicNames.RETRY_1.equals(current)) {
      return TopicNames.RETRY_2;
    }
    if (TopicNames.RETRY_2.equals(current)) {
      return TopicNames.RETRY_3;
    }
    return TopicNames.DLQ;
  }
}
