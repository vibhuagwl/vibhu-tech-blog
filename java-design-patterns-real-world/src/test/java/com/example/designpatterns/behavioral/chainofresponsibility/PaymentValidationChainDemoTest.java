package com.example.designpatterns.behavioral.chainofresponsibility;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PaymentValidationChainDemoTest {
  @Test
  void shouldRejectPaymentWhenFraudCheckFails() {
    var auth = new PaymentValidationChainDemo.AuthenticationValidator();
    auth.linkWith(new PaymentValidationChainDemo.AmountValidator())
        .linkWith(new PaymentValidationChainDemo.FraudValidator())
        .linkWith(new PaymentValidationChainDemo.AccountValidator());
    var result =
        auth.validate(new PaymentValidationChainDemo.PaymentRequest("u1", 100, true, true));
    assertThat(result).isEqualTo("FRAUD");
  }
}
