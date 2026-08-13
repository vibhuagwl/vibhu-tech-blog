package com.vibhu.lb;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

public final class WeightedRoundRobinLoadBalancer implements LoadBalancer {
  private final AtomicInteger cursor = new AtomicInteger();

  @Override
  public Server select(List<Server> servers) {
    List<Server> expanded = new ArrayList<>();
    for (Server s : servers) {
      if (!s.healthy()) {
        continue;
      }
      for (int i = 0; i < s.weight(); i++) {
        expanded.add(s);
      }
    }
    if (expanded.isEmpty()) {
      throw new IllegalStateException("no healthy servers");
    }
    return expanded.get(Math.floorMod(cursor.getAndIncrement(), expanded.size()));
  }
}
