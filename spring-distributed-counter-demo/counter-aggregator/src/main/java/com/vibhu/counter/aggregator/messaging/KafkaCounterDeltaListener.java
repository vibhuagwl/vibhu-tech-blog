package com.vibhu.counter.aggregator.messaging;

import com.vibhu.counter.aggregator.service.CounterDeltaConsumer;
import com.vibhu.counter.common.events.CounterDeltaEvent;
import com.vibhu.counter.common.events.CounterTopics;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Profile("kafka")
public class KafkaCounterDeltaListener {
  private final CounterDeltaConsumer consumer;

  public KafkaCounterDeltaListener(CounterDeltaConsumer consumer) {
    this.consumer = consumer;
  }

  @KafkaListener(topics = CounterTopics.COUNTER_DELTAS, groupId = "counter-aggregator")
  public void onCounterDelta(CounterDeltaEvent event) {
    consumer.onDelta(event);
  }
}
