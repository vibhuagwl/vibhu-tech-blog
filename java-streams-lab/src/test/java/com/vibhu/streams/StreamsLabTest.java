package com.vibhu.streams;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;

class StreamsLabTest {

  @Test
  void secondHighestDistinct() {
    var salaries = List.of(100.0, 90.0, 90.0, 80.0);
    double second =
        salaries.stream().distinct().sorted(Comparator.reverseOrder()).skip(1).findFirst().orElseThrow();
    assertEquals(90.0, second);
  }

  @Test
  void parallelSumStable() {
    int n = IntStream.rangeClosed(1, 10_000).parallel().sum();
    assertEquals(50_005_000, n);
  }

  @Test
  void racyParallelForEachIsNotReliable() {
    // Demonstrates why shared mutable accumulation is wrong — we only assert the correct API.
    AtomicInteger safe = new AtomicInteger();
    IntStream.rangeClosed(1, 1000).parallel().forEach(safe::addAndGet);
    assertEquals(500_500, safe.get());
  }

  @Test
  void firstNonRepeated() {
    assertEquals('w', StreamsLabMain.firstNonRepeated("swiss").orElseThrow());
  }

  @Test
  void groupingAverage() {
    record E(String d, double s) {}
    var map =
        List.of(new E("ENG", 100), new E("ENG", 200), new E("HR", 50)).stream()
            .collect(Collectors.groupingBy(E::d, Collectors.averagingDouble(E::s)));
    assertEquals(150.0, map.get("ENG"));
    assertTrue(map.containsKey("HR"));
  }
}
