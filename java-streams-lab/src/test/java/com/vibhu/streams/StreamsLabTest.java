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
  void apiMatrixTakeWhileAndOfNullable() {
    assertEquals(List.of(1, 2, 3), List.of(1, 2, 3, 4, 5).stream().takeWhile(n -> n < 4).toList());
    assertEquals(List.of(), java.util.stream.Stream.ofNullable(null).toList());
    assertEquals(List.of("x"), java.util.stream.Stream.ofNullable("x").toList());
  }

  @Test
  void apiMatrixSummaryStatisticsAndUnmodifiable() {
    var stats = IntStream.rangeClosed(1, 5).summaryStatistics();
    assertEquals(5, stats.getCount());
    assertEquals(15, stats.getSum());
    var set = List.of("a", "a", "b").stream().collect(Collectors.toUnmodifiableSet());
    assertEquals(2, set.size());
    try {
      set.add("c");
      throw new AssertionError("expected unmodifiable");
    } catch (UnsupportedOperationException expected) {
      // ok
    }
  }
}
