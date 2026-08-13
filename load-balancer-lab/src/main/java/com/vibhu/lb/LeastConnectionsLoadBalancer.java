package com.vibhu.lb;

import java.util.Comparator;
import java.util.List;

public final class LeastConnectionsLoadBalancer implements LoadBalancer {
  @Override
  public Server select(List<Server> servers) {
    return servers.stream()
        .filter(Server::healthy)
        .min(Comparator.comparingInt(Server::activeConnections))
        .orElseThrow(() -> new IllegalStateException("no healthy servers"));
  }
}
