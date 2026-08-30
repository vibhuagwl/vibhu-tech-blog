package com.example.kafka.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.kafka.TestSecurityOverrides;
import com.example.kafka.config.SecurityConfig;
import com.example.kafka.consumer.PaymentConsumer;
import com.example.kafka.model.PaymentEvent;
import com.example.kafka.producer.PaymentProducer;
import java.math.BigDecimal;
import java.util.concurrent.CompletableFuture;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.errors.SaslAuthenticationException;
import org.apache.kafka.common.errors.TopicAuthorizationException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.kafka.support.SendResult;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@WebMvcTest(controllers = PaymentController.class)
@Import({SecurityConfig.class, TestSecurityOverrides.class, ApiExceptionHandler.class})
@ActiveProfiles("test")
class PaymentControllerSecurityTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    PaymentProducer paymentProducer;

    @MockitoBean
    PaymentConsumer paymentConsumer;

    @Test
    void missingJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/payments"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void invalidJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/payments").header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void readScope_cannotPublish() throws Exception {
        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json())
                        .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_payment:read"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void writeScope_canPublish() throws Exception {
        when(paymentProducer.send(any(PaymentEvent.class))).thenReturn(acceptedFuture());
        mockMvc.perform(asyncDispatch(asyncPost()))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));
    }

    @Test
    void kafkaAuthFailure_mapsTo401() throws Exception {
        when(paymentProducer.send(any(PaymentEvent.class)))
                .thenReturn(CompletableFuture.failedFuture(new SaslAuthenticationException("invalid token")));
        mockMvc.perform(asyncDispatch(asyncPost()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void missingWriteAcl_mapsTo403() throws Exception {
        when(paymentProducer.send(any(PaymentEvent.class)))
                .thenReturn(CompletableFuture.failedFuture(new TopicAuthorizationException("payments")));
        mockMvc.perform(asyncDispatch(asyncPost()))
                .andExpect(status().isForbidden());
    }

    private MvcResult asyncPost() throws Exception {
        return mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json())
                        .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_payment:write"))))
                .andExpect(request().asyncStarted())
                .andReturn();
    }

    private static String json() {
        return """
                {"paymentId":"pay-1","accountId":"acct-77","amount":10.00,"currency":"USD"}
                """;
    }

    private static CompletableFuture<SendResult<String, PaymentEvent>> acceptedFuture() {
        PaymentEvent event = new PaymentEvent("pay-1", "acct-77", new BigDecimal("10.00"), "USD", null);
        ProducerRecord<String, PaymentEvent> record = new ProducerRecord<>("payments", "acct-77:pay-1", event);
        RecordMetadata metadata = new RecordMetadata(new TopicPartition("payments", 0), 0, 0, 0L, 0, 0);
        return CompletableFuture.completedFuture(new SendResult<>(record, metadata));
    }
}
