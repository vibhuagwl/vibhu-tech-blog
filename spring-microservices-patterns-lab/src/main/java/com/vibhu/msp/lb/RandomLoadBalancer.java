package com.vibhu.msp.lb;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/** Random load balancer. */
public final class RandomLoadBalancer<T> implements LoadBalancer<T> {

  @Override
  public T select(List<T> candidates) {
    if (candidates == null || candidates.isEmpty()) {
      throw new IllegalArgumentException("No candidates");
    }
    return candidates.get(ThreadLocalRandom.current().nextInt(candidates.size()));
  }
}
