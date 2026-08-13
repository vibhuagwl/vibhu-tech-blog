package com.vibhu.lb;

import java.util.concurrent.atomic.AtomicInteger;

public final class Server {
  private final String id;
  private final int weight;
  private final AtomicInteger active = new AtomicInteger();
  private volatile boolean healthy = true;

  public Server(String id, int weight) {
    this.id = id;
    this.weight = Math.max(1, weight);
  }

  public String id() {
    return id;
  }

  public int weight() {
    return weight;
  }

  public boolean healthy() {
    return healthy;
  }

  public void setHealthy(boolean healthy) {
    this.healthy = healthy;
  }

  public int activeConnections() {
    return active.get();
  }

  public void acquire() {
    active.incrementAndGet();
  }

  public void release() {
    active.decrementAndGet();
  }
}
