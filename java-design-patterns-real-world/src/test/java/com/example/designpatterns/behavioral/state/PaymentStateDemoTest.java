package com.example.designpatterns.behavioral.state;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class PaymentStateDemoTest {
  @Test
  void shouldRejectInvalidTransitionsAndAllowValidLifecycle() {
    var payment = new PaymentStateDemo.Payment();
    assertThatThrownBy(payment::capture).isInstanceOf(IllegalStateException.class);
    payment.authorize();
    payment.capture();
    payment.settle();
    payment.complete();
    assertThat(payment.state()).isEqualTo("COMPLETED");
    assertThat(payment.timeline())
        .containsExactly("CREATED", "AUTHORIZED", "CAPTURED", "SETTLED", "COMPLETED");
  }

  @Test
  void shouldAllowFailureBeforeSettlement() {
    var payment = new PaymentStateDemo.Payment();
    payment.authorize();
    payment.fail("gateway-timeout");
    assertThat(payment.state()).contains("FAILED(gateway-timeout)");
  }
}
