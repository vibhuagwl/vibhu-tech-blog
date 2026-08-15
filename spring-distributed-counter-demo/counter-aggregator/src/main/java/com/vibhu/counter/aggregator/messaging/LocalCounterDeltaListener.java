package com.vibhu.counter.aggregator.messaging;

import com.vibhu.counter.aggregator.service.CounterDeltaConsumer;
import com.vibhu.counter.common.events.CounterDeltaEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@Profile("!kafka")
public class LocalCounterDeltaListener {
  private final CounterDeltaConsumer consumer;

  public LocalCounterDeltaListener(CounterDeltaConsumer consumer) {
    this.consumer = consumer;
  }

  @EventListener
  public void onCounterDelta(CounterDeltaEvent event) {
    consumer.onDelta(event);
  }
}
