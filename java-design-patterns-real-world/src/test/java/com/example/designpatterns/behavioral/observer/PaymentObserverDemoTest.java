package com.example.designpatterns.behavioral.observer;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PaymentObserverDemoTest {
  @Test
  void shouldNotifyManyListenersFromOneEvent() {
    var bus = new PaymentObserverDemo.PaymentEventBus();
    var audit = new PaymentObserverDemo.CollectingObserver("audit");
    var notify = new PaymentObserverDemo.CollectingObserver("notify");
    bus.register(audit);
    bus.register(notify);
    bus.publish(new PaymentObserverDemo.PaymentCompletedEvent("p1", 100));
    assertThat(audit.received()).contains("audit:p1");
    assertThat(notify.received()).contains("notify:p1");
  }
}
