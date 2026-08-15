package com.example.designpatterns.creational.factory;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PaymentGatewayFactoryDemoTest {
  @Test
  void shouldCreateGatewayByProvider() {
    var gateway =
        new PaymentGatewayFactoryDemo.PaymentGatewayFactory()
            .create(PaymentGatewayFactoryDemo.Provider.ADYEN);
    assertThat(gateway.charge(50)).contains("Adyen");
  }
}
