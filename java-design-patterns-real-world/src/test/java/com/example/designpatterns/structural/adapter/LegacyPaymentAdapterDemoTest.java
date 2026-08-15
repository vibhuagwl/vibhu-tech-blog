package com.example.designpatterns.structural.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class LegacyPaymentAdapterDemoTest {
  @Test
  void shouldTranslateModernRequestToLegacyApi() {
    var adapter =
        new LegacyPaymentAdapterDemo.PaymentAdapter(
            new LegacyPaymentAdapterDemo.LegacyPaymentApi());
    assertThat(adapter.pay("acct", 10)).contains("1000");
  }
}
