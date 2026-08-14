package com.vibhu.msp.eip;

import java.util.List;
import java.util.function.BinaryOperator;

/** EIP Aggregator — many messages into one. */
public final class Aggregator<T> {

  private final BinaryOperator<T> reducer;
  private T accumulator;

  public Aggregator(BinaryOperator<T> reducer, T initial) {
    this.reducer = reducer;
    this.accumulator = initial;
  }

  public void add(T item) {
    accumulator = reducer.apply(accumulator, item);
  }

  public void addAll(List<T> items) {
    for (T item : items) {
      add(item);
    }
  }

  public T result() {
    return accumulator;
  }

  public boolean isComplete(int expectedCount, int receivedCount) {
    return receivedCount >= expectedCount;
  }
}
