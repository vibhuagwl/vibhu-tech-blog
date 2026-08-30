package com.example.kafka.config;

import com.example.kafka.audit.SecurityAuditLogger;
import com.example.kafka.model.PaymentEvent;
import java.util.HashMap;
import java.util.Map;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.errors.GroupAuthorizationException;
import org.apache.kafka.common.errors.SaslAuthenticationException;
import org.apache.kafka.common.errors.SerializationException;
import org.apache.kafka.common.errors.SslAuthenticationException;
import org.apache.kafka.common.errors.TopicAuthorizationException;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.boot.autoconfigure.kafka.KafkaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.ConsumerRecordRecoverer;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.util.backoff.ExponentialBackOff;

@Configuration
@EnableKafka
public class KafkaConsumerConfig {

    @Bean
    public ConsumerFactory<String, PaymentEvent> paymentConsumerFactory(
            KafkaProperties kafkaProperties,
            KafkaAppProperties appProperties,
            KafkaSecurityConfig kafkaSecurityConfig) {
        Map<String, Object> props = new HashMap<>(kafkaProperties.buildConsumerProperties(null));
        props.put(ConsumerConfig.GROUP_ID_CONFIG, appProperties.getConsumerGroup());
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        props.put(ErrorHandlingDeserializer.KEY_DESERIALIZER_CLASS, StringDeserializer.class);
        props.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS, JsonDeserializer.class);
        props.put(JsonDeserializer.VALUE_DEFAULT_TYPE, PaymentEvent.class.getName());
        props.put(JsonDeserializer.TRUSTED_PACKAGES, "com.example.kafka.model");
        props.put(JsonDeserializer.USE_TYPE_INFO_HEADERS, false);
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, "read_committed");
        props.put("allow.auto.create.topics", false);
        props.putAll(kafkaSecurityConfig.consumerSecurityProperties());
        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentEvent> kafkaListenerContainerFactory(
            ConsumerFactory<String, PaymentEvent> paymentConsumerFactory,
            CommonErrorHandler kafkaErrorHandler,
            org.springframework.boot.autoconfigure.kafka.KafkaProperties kafkaProperties) {
        ConcurrentKafkaListenerContainerFactory<String, PaymentEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(paymentConsumerFactory);
        factory.setCommonErrorHandler(kafkaErrorHandler);
        factory.setAutoStartup(kafkaProperties.getListener().isAutoStartup());
        factory.getContainerProperties()
                .setObservationEnabled(true);
        return factory;
    }

    /**
     * Transient processing errors retry then go to DLT. Authn/authz/TLS failures are not retryable —
     * they are identity or permission problems, not poison payloads.
     */
    @Bean
    public CommonErrorHandler kafkaErrorHandler(
            KafkaTemplate<String, PaymentEvent> paymentKafkaTemplate,
            KafkaAppProperties appProperties,
            SecurityAuditLogger auditLogger) {
        DeadLetterPublishingRecoverer dlt = new DeadLetterPublishingRecoverer(
                paymentKafkaTemplate,
                (record, ex) -> new TopicPartition(appProperties.getDltTopic(), record.partition()));
        ConsumerRecordRecoverer recoverer = (record, ex) -> {
            if (isSecurityFailure(ex)) {
                auditLogger.kafkaSecurityFailure(ex, record.topic(), record.partition(), record.offset());
                return;
            }
            dlt.accept(record, ex);
            auditLogger.publishedToDlt(record.topic(), appProperties.getDltTopic(), ex);
        };
        ExponentialBackOff backoff = new ExponentialBackOff(200L, 2.0);
        backoff.setMaxElapsedTime(10_000L);
        DefaultErrorHandler handler = new DefaultErrorHandler(recoverer, backoff);
        handler.addNotRetryableExceptions(
                TopicAuthorizationException.class,
                GroupAuthorizationException.class,
                SaslAuthenticationException.class,
                SslAuthenticationException.class,
                SerializationException.class);
        return handler;
    }

    public static boolean isSecurityFailure(Throwable ex) {
        Throwable current = ex;
        while (current != null) {
            if (current instanceof TopicAuthorizationException
                    || current instanceof GroupAuthorizationException
                    || current instanceof SaslAuthenticationException
                    || current instanceof SslAuthenticationException) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }
}
