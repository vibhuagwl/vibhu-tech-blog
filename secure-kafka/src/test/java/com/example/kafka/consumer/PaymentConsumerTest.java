package com.example.kafka.consumer;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.kafka.audit.SecurityAuditLogger;
import com.example.kafka.config.KafkaConsumerConfig;
import com.example.kafka.model.PaymentEvent;
import java.math.BigDecimal;
import org.apache.kafka.common.errors.GroupAuthorizationException;
import org.apache.kafka.common.errors.SaslAuthenticationException;
import org.apache.kafka.common.errors.SslAuthenticationException;
import org.apache.kafka.common.errors.TopicAuthorizationException;
import org.junit.jupiter.api.Test;

class PaymentConsumerTest {

    @Test
    void validEvent_isRecorded() {
        PaymentConsumer consumer = new PaymentConsumer(new SecurityAuditLogger());
        PaymentEvent event = new PaymentEvent("pay-1", "acct-77", new BigDecimal("10.00"), "USD", null);

        consumer.consume(event, "payments", "acct-77:pay-1");

        assertThat(consumer.processedCount()).isEqualTo(1);
        assertThat(consumer.processed()).containsKey("pay-1");
    }

    @Test
    void securityFailures_areNotRetryableOrSentToDlt() {
        assertThat(KafkaConsumerConfig.isSecurityFailure(new TopicAuthorizationException("payments"))).isTrue();
        assertThat(KafkaConsumerConfig.isSecurityFailure(new GroupAuthorizationException("payment-service"))).isTrue();
        assertThat(KafkaConsumerConfig.isSecurityFailure(new SaslAuthenticationException("expired"))).isTrue();
        assertThat(KafkaConsumerConfig.isSecurityFailure(new SslAuthenticationException("bad cert"))).isTrue();
        assertThat(KafkaConsumerConfig.isSecurityFailure(new IllegalStateException("poison"))).isFalse();
    }
}
