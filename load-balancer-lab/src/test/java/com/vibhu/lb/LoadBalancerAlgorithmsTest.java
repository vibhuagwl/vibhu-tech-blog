package com.vibhu.lb;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class LoadBalancerAlgorithmsTest {

  @Test
  void roundRobinCycles() {
    List<Server> servers = List.of(new Server("a", 1), new Server("b", 1), new Server("c", 1));
    RoundRobinLoadBalancer lb = new RoundRobinLoadBalancer();
    assertThat(lb.select(servers).id()).isEqualTo("a");
    assertThat(lb.select(servers).id()).isEqualTo("b");
    assertThat(lb.select(servers).id()).isEqualTo("c");
    assertThat(lb.select(servers).id()).isEqualTo("a");
  }

  @Test
  void roundRobinSkipsUnhealthy() {
    Server a = new Server("a", 1);
    Server b = new Server("b", 1);
    a.setHealthy(false);
    RoundRobinLoadBalancer lb = new RoundRobinLoadBalancer();
    assertThat(lb.select(List.of(a, b)).id()).isEqualTo("b");
    assertThat(lb.select(List.of(a, b)).id()).isEqualTo("b");
  }

  @Test
  void weightedPrefersHeavier() {
    List<Server> servers = List.of(new Server("heavy", 3), new Server("light", 1));
    WeightedRoundRobinLoadBalancer lb = new WeightedRoundRobinLoadBalancer();
    Map<String, Integer> counts = new HashMap<>();
    for (int i = 0; i < 400; i++) {
      counts.merge(lb.select(servers).id(), 1, Integer::sum);
    }
    assertThat(counts.get("heavy")).isGreaterThan(counts.get("light"));
    assertThat(counts.get("heavy")).isEqualTo(300);
    assertThat(counts.get("light")).isEqualTo(100);
  }

  @Test
  void leastConnectionsPicksQuiet() {
    Server busy = new Server("busy", 1);
    Server quiet = new Server("quiet", 1);
    busy.acquire();
    busy.acquire();
    LeastConnectionsLoadBalancer lb = new LeastConnectionsLoadBalancer();
    assertThat(lb.select(List.of(busy, quiet)).id()).isEqualTo("quiet");
  }

  @Test
  void ipHashIsStickyForSameIp() {
    List<Server> servers = List.of(new Server("a", 1), new Server("b", 1), new Server("c", 1));
    IpHashLoadBalancer lb = new IpHashLoadBalancer();
    String first = lb.select(servers, "10.0.0.7").id();
    assertThat(lb.select(servers, "10.0.0.7").id()).isEqualTo(first);
  }

  @Test
  void consistentHashMinimizesRemapOnRemove() {
    Server a = new Server("a", 1);
    Server b = new Server("b", 1);
    Server c = new Server("c", 1);
    ConsistentHashLoadBalancer lb = new ConsistentHashLoadBalancer(List.of(a, b, c), 64);
    Map<String, String> before = new HashMap<>();
    for (int i = 0; i < 1000; i++) {
      String key = "user-" + i;
      before.put(key, lb.select(key).id());
    }
    lb.remove(c);
    int moved = 0;
    for (int i = 0; i < 1000; i++) {
      String key = "user-" + i;
      if (!before.get(key).equals(lb.select(key).id())) {
        moved++;
      }
    }
    // Removing 1 of 3 should move well under ~half the keys with vnodes
    assertThat(moved).isLessThan(500);
  }
}
