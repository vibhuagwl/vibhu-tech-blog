package com.vibhu.lb;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

public final class RoundRobinLoadBalancer implements LoadBalancer {
  private final AtomicInteger counter = new AtomicInteger();

  @Override
  public Server select(List<Server> servers) {
    List<Server> up = servers.stream().filter(Server::healthy).toList();
    if (up.isEmpty()) {
      throw new IllegalStateException("no healthy servers");
    }
    int index = Math.floorMod(counter.getAndIncrement(), up.size());
    return up.get(index);
  }
}
