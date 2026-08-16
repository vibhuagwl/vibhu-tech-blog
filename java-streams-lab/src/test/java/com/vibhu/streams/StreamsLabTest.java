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
  void groupAnagrams() {
    var groups = StreamsLabMain.groupAnagrams(List.of("eat", "tea", "tan", "ate", "nat", "bat"));
    assertEquals(3, groups.size());
    assertTrue(groups.stream().anyMatch(g -> g.containsAll(List.of("eat", "tea", "ate"))));
  }

  @Test
  void topNPerDepartment() {
    record E(String d, String n, double s) {}
    // reuse lab Employee via StreamsLabMain helpers with constructed list in main types
    var emps =
        List.of(
            new StreamsLabMain.Employee(1, "A", "ENG", 100, java.time.LocalDate.now(), List.of()),
            new StreamsLabMain.Employee(2, "B", "ENG", 200, java.time.LocalDate.now(), List.of()),
            new StreamsLabMain.Employee(3, "C", "ENG", 150, java.time.LocalDate.now(), List.of()),
            new StreamsLabMain.Employee(4, "D", "HR", 90, java.time.LocalDate.now(), List.of()));
    var top = StreamsLabMain.topNPerDepartment(emps, 2);
    assertEquals(List.of("B", "C"), top.get("ENG"));
    assertEquals(List.of("D"), top.get("HR"));
  }
}
