package com.example.designpatterns.structural.flyweight;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class CurrencyFlyweightDemoTest {
  @Test
  void shouldReuseImmutableCurrencyObjects() {
    var factory = new CurrencyFlyweightDemo.CurrencyFactory();
    assertThat(factory.get("USD")).isSameAs(factory.get("USD"));
    assertThat(factory.size()).isEqualTo(1);
  }
}
