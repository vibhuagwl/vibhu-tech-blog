package com.vibhu.msp.lb;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class LoadBalancerTest {

  @Test
  void roundRobin_cyclesThroughCandidates() {
    RoundRobinLoadBalancer<String> lb = new RoundRobinLoadBalancer<>();
    List<String> nodes = List.of("A", "B", "C");
    assertEquals("A", lb.select(nodes));
    assertEquals("B", lb.select(nodes));
    assertEquals("C", lb.select(nodes));
    assertEquals("A", lb.select(nodes));
  }

  @Test
  void weightedRoundRobin_respectsWeights() {
    WeightedRoundRobinLoadBalancer<String> lb =
        new WeightedRoundRobinLoadBalancer<>(List.of("A", "B"), List.of(3, 1));
    int aCount = 0;
    int bCount = 0;
    for (int i = 0; i < 8; i++) {
      if ("A".equals(lb.select(List.of("A", "B")))) aCount++;
      else bCount++;
    }
    assertEquals(6, aCount);
    assertEquals(2, bCount);
  }

  @Test
  void consistentHash_sameKeyMapsToSameNode() {
    ConsistentHashLoadBalancer<String> lb =
        new ConsistentHashLoadBalancer<>(List.of("N1", "N2", "N3"));
    String first = lb.selectForKey("user-42");
    for (int i = 0; i < 10; i++) {
      assertEquals(first, lb.selectForKey("user-42"));
    }
  }

  @Test
  void leastConnection_picksLowestActive() {
    LeastConnectionLoadBalancer<String> lb = new LeastConnectionLoadBalancer<>();
    List<String> nodes = List.of("A", "B");
    lb.acquire("A");
    lb.acquire("A");
    assertEquals("B", lb.select(nodes));
    lb.release("A");
    assertEquals("B", lb.select(nodes));
  }

  @Test
  void random_returnsValidCandidate() {
    RandomLoadBalancer<String> lb = new RandomLoadBalancer<>();
    List<String> nodes = List.of("X", "Y", "Z");
    for (int i = 0; i < 20; i++) {
      assertTrue(nodes.contains(lb.select(nodes)));
    }
  }
}
