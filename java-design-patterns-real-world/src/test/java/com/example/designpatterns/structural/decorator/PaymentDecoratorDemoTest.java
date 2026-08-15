package com.example.designpatterns.structural.decorator;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class PaymentDecoratorDemoTest {
  @Test
  void shouldAddBehaviorWithoutChangingCoreProcessor() {
    var audit = new ArrayList<String>();
    var metrics = new AtomicInteger();
    var processor =
        new PaymentDecoratorDemo.LoggingDecorator(
            new PaymentDecoratorDemo.MetricsDecorator(
                new PaymentDecoratorDemo.BasicPayment(), metrics),
            audit);
    var result = processor.process(100);
    assertThat(audit).contains("log:request:100");
    assertThat(result).contains(":metric");
    assertThat(metrics.get()).isEqualTo(1);
  }

  @Test
  void shouldRetryTransientFailure() {
    var retry = new PaymentDecoratorDemo.RetryDecorator(new PaymentDecoratorDemo.FlakyPayment(), 2);
    assertThat(retry.process(120)).isEqualTo("processed-after-retry:120");
  }
}
