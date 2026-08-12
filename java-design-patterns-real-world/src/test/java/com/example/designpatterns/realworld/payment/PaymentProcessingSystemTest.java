package com.example.designpatterns.realworld.payment;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class PaymentProcessingSystemTest {
    @Test void shouldRunCombinedInterviewPaymentFlow() {
        var facade = new PaymentProcessingSystem.PaymentFacade();
        var result = facade.process(new PaymentProcessingSystem.PaymentRequest("cust-1", "acct-9", "CARD", 900, "STRIPE"));
        assertThat(result.status()).isEqualTo("SUCCESS");
        assertThat(result.auditTrail()).anyMatch(step -> step.startsWith("notify:"));
        assertThat(PaymentProcessingSystem.interviewAnswer()).contains("PaymentFacade");
    }
}
