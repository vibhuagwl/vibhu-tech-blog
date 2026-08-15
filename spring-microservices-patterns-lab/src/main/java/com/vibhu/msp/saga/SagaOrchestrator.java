package com.vibhu.msp.saga;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

/** Saga step with forward action and compensation. Maps to curriculum Part 06. */
record SagaStep<T>(String name, Consumer<T> action, Consumer<T> compensation) {}

/** Orchestrator-style saga with compensation on failure. */
public final class SagaOrchestrator<T> {

  private final List<SagaStep<T>> steps = new ArrayList<>();
  private final List<SagaStep<T>> completed = new ArrayList<>();

  public SagaOrchestrator<T> addStep(SagaStep<T> step) {
    steps.add(step);
    return this;
  }

  public void execute(T context) {
    try {
      for (SagaStep<T> step : steps) {
        step.action().accept(context);
        completed.add(step);
      }
    } catch (RuntimeException ex) {
      compensate(context);
      throw ex;
    }
  }

  public void compensate(T context) {
    List<SagaStep<T>> reversed = new ArrayList<>(completed);
    java.util.Collections.reverse(reversed);
    for (SagaStep<T> step : reversed) {
      try {
        step.compensation().accept(context);
      } catch (RuntimeException ignored) {
        // best-effort compensation
      }
    }
    completed.clear();
  }

  public List<String> completedStepNames() {
    return completed.stream().map(SagaStep::name).toList();
  }
}
