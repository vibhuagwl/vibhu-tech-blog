package com.vibhu.hadron.kafka;

import com.vibhu.hadron.config.TopicNames;
import com.vibhu.hadron.service.FailurePipeline;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "hadron.kafka.enabled", havingValue = "false", matchIfMissing = true)
public class InMemoryConsumerBindings {

  private final InMemoryEventBroker broker;
  private final FailurePipeline pipeline;

  public InMemoryConsumerBindings(InMemoryEventBroker broker, FailurePipeline pipeline) {
    this.broker = broker;
    this.pipeline = pipeline;
  }

  @PostConstruct
  void bind() {
    broker.subscribe(TopicNames.CASHLINE_EVENTS, pipeline::consume);
    broker.subscribe(TopicNames.RETRY_1, pipeline::consume);
    broker.subscribe(TopicNames.RETRY_2, pipeline::consume);
    broker.subscribe(TopicNames.RETRY_3, pipeline::consume);
    broker.subscribe(TopicNames.DLQ, envelope -> {});
  }
}
