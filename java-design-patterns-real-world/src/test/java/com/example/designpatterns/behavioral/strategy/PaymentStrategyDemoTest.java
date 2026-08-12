package com.example.designpatterns.behavioral.strategy;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class PaymentStrategyDemoTest {
    @Test void shouldSwapPaymentAlgorithmByMethod() {
        var service = new PaymentStrategyDemo.PaymentService();
        assertThat(service.pay("PAYPAL", 80)).isEqualTo("PAYPAL:80");
    }
}
