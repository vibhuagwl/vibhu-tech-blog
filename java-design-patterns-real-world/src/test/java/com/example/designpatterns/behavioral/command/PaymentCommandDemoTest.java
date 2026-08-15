package com.example.designpatterns.behavioral.command;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PaymentCommandDemoTest {
  @Test
  void shouldQueueAndExecuteCommands() {
    var invoker = new PaymentCommandDemo.CommandInvoker();
    var receiver = new PaymentCommandDemo.PaymentReceiver();
    invoker.submit(new PaymentCommandDemo.RefundPaymentCommand(receiver, "p1"));
    assertThat(invoker.runNext()).isEqualTo("refunded:p1");
  }
}
