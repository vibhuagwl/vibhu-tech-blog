package com.vibhu.lb;

import java.util.List;

public final class IpHashLoadBalancer {
  public Server select(List<Server> servers, String clientIp) {
    List<Server> up = servers.stream().filter(Server::healthy).toList();
    if (up.isEmpty()) {
      throw new IllegalStateException("no healthy servers");
    }
    int idx = Math.floorMod(clientIp.hashCode(), up.size());
    return up.get(idx);
  }
}
