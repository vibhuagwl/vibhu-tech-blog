package com.example.designpatterns.structural.facade;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class PaymentFacadeDemoTest {
    @Test void shouldHideSubsystemComplexityBehindOneCall() {
        assertThat(new PaymentFacadeDemo.PaymentFacade().processPayment("acct-1", 200)).isEqualTo("success");
    }
}
