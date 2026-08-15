package com.example.designpatterns.behavioral.memento;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PaymentConfigurationMementoDemoTest {
  @Test
  void shouldRestorePreviousConfiguration() {
    var config = new PaymentConfigurationMementoDemo.PaymentConfiguration("STRIPE", 30);
    var snapshot = config.save();
    config.restore(snapshot);
    assertThat(config.gateway()).isEqualTo("STRIPE");
  }
}
