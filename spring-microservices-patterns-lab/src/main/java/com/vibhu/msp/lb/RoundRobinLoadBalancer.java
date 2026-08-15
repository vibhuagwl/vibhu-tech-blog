package com.vibhu.msp.lb;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/** Round-robin load balancer. Maps to curriculum Part 04. */
public final class RoundRobinLoadBalancer<T> implements LoadBalancer<T> {

  private final AtomicInteger counter = new AtomicInteger(0);

  @Override
  public T select(List<T> candidates) {
    if (candidates == null || candidates.isEmpty()) {
      throw new IllegalArgumentException("No candidates");
    }
    int index = Math.floorMod(counter.getAndIncrement(), candidates.size());
    return candidates.get(index);
  }
}
