package com.vibhu.lb;

import java.util.List;
import java.util.Objects;
import java.util.SortedMap;
import java.util.TreeMap;

public final class ConsistentHashLoadBalancer {
  private final SortedMap<Integer, Server> ring = new TreeMap<>();
  private final int virtualNodes;

  public ConsistentHashLoadBalancer(List<Server> servers, int virtualNodes) {
    this.virtualNodes = virtualNodes;
    for (Server s : servers) {
      add(s);
    }
  }

  public void add(Server s) {
    for (int i = 0; i < virtualNodes; i++) {
      ring.put(Objects.hash(s.id(), i), s);
    }
  }

  public void remove(Server s) {
    for (int i = 0; i < virtualNodes; i++) {
      ring.remove(Objects.hash(s.id(), i));
    }
  }

  public Server select(String key) {
    if (ring.isEmpty()) {
      throw new IllegalStateException("empty ring");
    }
    int h = key.hashCode();
    SortedMap<Integer, Server> tail = ring.tailMap(h);
    Integer node = tail.isEmpty() ? ring.firstKey() : tail.firstKey();
    return ring.get(node);
  }
}
