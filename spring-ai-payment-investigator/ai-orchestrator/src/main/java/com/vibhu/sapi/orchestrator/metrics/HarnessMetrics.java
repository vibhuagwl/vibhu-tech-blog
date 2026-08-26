package com.vibhu.sapi.orchestrator.metrics;

import com.vibhu.sapi.enums.HarnessState;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class HarnessMetrics {

  private final Counter successCounter;
  private final Counter failureCounter;

  public HarnessMetrics(MeterRegistry registry) {
    this.successCounter = registry.counter("harness.investigation.success");
    this.failureCounter = registry.counter("harness.investigation.failure");
  }

  public void recordSuccess(HarnessState state) {
    successCounter.increment();
  }

  public void recordFailure() {
    failureCounter.increment();
  }
}
