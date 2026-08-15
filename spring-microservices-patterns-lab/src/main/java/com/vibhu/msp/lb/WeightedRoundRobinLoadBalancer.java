package com.vibhu.msp.lb;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/** Weighted round-robin — repeats each candidate proportional to its weight. */
public final class WeightedRoundRobinLoadBalancer<T> implements LoadBalancer<T> {

  private final List<T> weightedRing;
  private final AtomicInteger counter = new AtomicInteger(0);

  public WeightedRoundRobinLoadBalancer(List<T> candidates, List<Integer> weights) {
    if (candidates.size() != weights.size()) {
      throw new IllegalArgumentException("Candidates and weights must match");
    }
    weightedRing = new ArrayList<>();
    for (int i = 0; i < candidates.size(); i++) {
      int weight = weights.get(i);
      if (weight <= 0) {
        throw new IllegalArgumentException("Weight must be positive");
      }
      for (int w = 0; w < weight; w++) {
        weightedRing.add(candidates.get(i));
      }
    }
    if (weightedRing.isEmpty()) {
      throw new IllegalArgumentException("No candidates");
    }
  }

  @Override
  public T select(List<T> candidates) {
    int index = Math.floorMod(counter.getAndIncrement(), weightedRing.size());
    return weightedRing.get(index);
  }
}
