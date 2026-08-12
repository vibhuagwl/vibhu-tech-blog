package com.example.designpatterns.structural.facade;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class PaymentFacadeDemoTest {
    @Test void shouldHideSubsystemComplexityBehindOneCall() {
        var outcome = new PaymentFacadeDemo.PaymentFacade().processDetailed("acct-1", 200);
        assertThat(outcome.status()).isEqualTo("success");
        assertThat(outcome.reference()).contains("charged:acct-1:200");
        assertThat(outcome.steps()).contains("fraud-check", "account-check", "charge", "notified:acct-1", "audit:acct-1");
    }
}
