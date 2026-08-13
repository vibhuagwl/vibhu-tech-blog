package com.vibhu.hadron.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class HadronMetrics {

  private final Counter processed;
  private final Counter failed;
  private final Counter retry;
  private final Counter dlq;
  private final Counter replay;
  private final Counter replayFailed;
  private final Counter duplicate;
  private final Counter outOfOrder;

  public HadronMetrics(MeterRegistry registry) {
    this.processed = Counter.builder("cashline.processed").register(registry);
    this.failed = Counter.builder("cashline.failed").register(registry);
    this.retry = Counter.builder("cashline.retry").register(registry);
    this.dlq = Counter.builder("cashline.dlq").register(registry);
    this.replay = Counter.builder("cashline.replay").register(registry);
    this.replayFailed = Counter.builder("cashline.replay.failed").register(registry);
    this.duplicate = Counter.builder("cashline.duplicate").register(registry);
    this.outOfOrder = Counter.builder("cashline.out.of.order").register(registry);
  }

  public void processed() {
    processed.increment();
  }

  public void failed() {
    failed.increment();
  }

  public void retry() {
    retry.increment();
  }

  public void dlq() {
    dlq.increment();
  }

  public void replay() {
    replay.increment();
  }

  public void replayFailed() {
    replayFailed.increment();
  }

  public void duplicate() {
    duplicate.increment();
  }

  public void outOfOrder() {
    outOfOrder.increment();
  }
}
