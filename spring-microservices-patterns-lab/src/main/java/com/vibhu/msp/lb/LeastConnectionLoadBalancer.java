package com.vibhu.msp.lb;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/** Least-connection — picks the candidate with fewest active connections. */
public final class LeastConnectionLoadBalancer<T> implements LoadBalancer<T> {

  private final Map<T, AtomicInteger> activeConnections = new ConcurrentHashMap<>();

  @Override
  public T select(List<T> candidates) {
    if (candidates == null || candidates.isEmpty()) {
      throw new IllegalArgumentException("No candidates");
    }
    return candidates.stream()
        .min(
            Comparator.comparingInt(
                c -> activeConnections.computeIfAbsent(c, k -> new AtomicInteger(0)).get()))
        .orElseThrow();
  }

  public void acquire(T candidate) {
    activeConnections.computeIfAbsent(candidate, k -> new AtomicInteger(0)).incrementAndGet();
  }

  public void release(T candidate) {
    AtomicInteger count = activeConnections.get(candidate);
    if (count != null) {
      count.updateAndGet(v -> Math.max(0, v - 1));
    }
  }

  public int activeCount(T candidate) {
    return activeConnections.computeIfAbsent(candidate, k -> new AtomicInteger(0)).get();
  }
}
