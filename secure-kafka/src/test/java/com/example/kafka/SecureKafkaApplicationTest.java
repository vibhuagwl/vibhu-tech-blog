package com.example.kafka;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.kafka.producer.PaymentProducer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class SecureKafkaApplicationTest {

    @Autowired
    PaymentProducer paymentProducer;

    @Test
    void contextLoads() {
        assertThat(paymentProducer).isNotNull();
    }
}
