package com.example.designpatterns.behavioral.strategy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;

class PaymentStrategyDemoTest {
    @Test void shouldSwapPaymentAlgorithmByMethod() {
        var service = new PaymentStrategyDemo.PaymentService();
        assertThat(service.pay("PAYPAL", 80)).isEqualTo("PAYPAL:80");
    }

    @Test void shouldRejectRecurringFlowForUnsupportedStrategy() {
        var service = new PaymentStrategyDemo.PaymentService();
        assertThatThrownBy(() -> service.process(
                PaymentStrategyDemo.PaymentMethod.UPI,
                new PaymentStrategyDemo.PaymentRequest("cust-1", 100, "INR", true)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not support recurring");
    }
}
