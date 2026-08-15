package com.example.designpatterns.creational.abstractfactory;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class RegionalBankingFactoryDemoTest {
  @Test
  void shouldKeepRegionalServicesCompatible() {
    var factory = new RegionalBankingFactoryDemo.IndiaBankingFactory();
    assertThat(factory.paymentService().pay()).contains("UPI");
    assertThat(factory.accountService().account()).contains("India");
  }
}
