package com.example.kafka.producer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.kafka.audit.SecurityAuditLogger;
import com.example.kafka.config.KafkaAppProperties;
import com.example.kafka.model.PaymentEvent;
import java.math.BigDecimal;
import java.util.concurrent.CompletableFuture;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.errors.SaslAuthenticationException;
import org.apache.kafka.common.errors.SslAuthenticationException;
import org.apache.kafka.common.errors.TopicAuthorizationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;

@ExtendWith(MockitoExtension.class)
class PaymentProducerTest {

    @Mock
    KafkaTemplate<String, PaymentEvent> kafkaTemplate;

    @Mock
    SecurityAuditLogger auditLogger;

    KafkaAppProperties properties;
    PaymentProducer producer;

    @BeforeEach
    void setUp() {
        properties = new KafkaAppProperties();
        producer = new PaymentProducer(kafkaTemplate, properties, auditLogger);
    }

    @Test
    void validTokenAndWriteAcl_publishes() {
        PaymentEvent event = payment();
        when(kafkaTemplate.send(eq("payments"), eq("acct-77:pay-1"), eq(event))).thenReturn(ok(event));

        SendResult<String, PaymentEvent> result = producer.send(event).join();

        assertThat(result.getRecordMetadata().topic()).isEqualTo("payments");
        verify(auditLogger).paymentPublished("pay-1", "payments");
    }

    @Test
    void invalidOauthToken_failsAuthentication() {
        PaymentEvent event = payment();
        when(kafkaTemplate.send(eq("payments"), eq("acct-77:pay-1"), eq(event)))
                .thenReturn(CompletableFuture.failedFuture(new SaslAuthenticationException("expired token")));

        assertThat(producer.send(event))
                .failsWithin(java.time.Duration.ofSeconds(1))
                .withThrowableThat()
                .withCauseInstanceOf(SaslAuthenticationException.class);
    }

    @Test
    void expiredToken_sameAsAuthFailureUntilRefresh() {
        PaymentEvent event = payment();
        when(kafkaTemplate.send(eq("payments"), eq("acct-77:pay-1"), eq(event)))
                .thenReturn(CompletableFuture.failedFuture(new SaslAuthenticationException("token expired")));

        assertThat(producer.send(event))
                .failsWithin(java.time.Duration.ofSeconds(1))
                .withThrowableThat()
                .withCauseInstanceOf(SaslAuthenticationException.class);
    }

    @Test
    void missingWriteAcl_failsAuthorization() {
        PaymentEvent event = payment();
        when(kafkaTemplate.send(eq("payments"), eq("acct-77:pay-1"), eq(event)))
                .thenReturn(CompletableFuture.failedFuture(new TopicAuthorizationException("payments")));

        assertThat(producer.send(event))
                .failsWithin(java.time.Duration.ofSeconds(1))
                .withThrowableThat()
                .withCauseInstanceOf(TopicAuthorizationException.class);
    }

    @Test
    void tlsFailure_failsHandshake() {
        PaymentEvent event = payment();
        when(kafkaTemplate.send(eq("payments"), eq("acct-77:pay-1"), eq(event)))
                .thenReturn(CompletableFuture.failedFuture(new SslAuthenticationException("untrusted CA")));

        assertThat(producer.send(event))
                .failsWithin(java.time.Duration.ofSeconds(1))
                .withThrowableThat()
                .withCauseInstanceOf(SslAuthenticationException.class);
    }

    private static PaymentEvent payment() {
        return new PaymentEvent("pay-1", "acct-77", new BigDecimal("10.00"), "USD", "M-1");
    }

    private static CompletableFuture<SendResult<String, PaymentEvent>> ok(PaymentEvent event) {
        ProducerRecord<String, PaymentEvent> record = new ProducerRecord<>("payments", "acct-77:pay-1", event);
        RecordMetadata metadata = new RecordMetadata(new TopicPartition("payments", 0), 0, 0, 0L, 0, 0);
        return CompletableFuture.completedFuture(new SendResult<>(record, metadata));
    }
}
