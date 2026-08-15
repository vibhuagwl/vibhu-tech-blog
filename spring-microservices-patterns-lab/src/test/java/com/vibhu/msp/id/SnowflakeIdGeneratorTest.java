package com.vibhu.msp.id;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class SnowflakeIdGeneratorTest {

  @Test
  void generatesUniqueIds() {
    SnowflakeIdGenerator gen = new SnowflakeIdGenerator(1, 1);
    Set<Long> ids = new HashSet<>();
    for (int i = 0; i < 10_000; i++) {
      long id = gen.nextId();
      assertTrue(ids.add(id), "Duplicate ID: " + id);
    }
    assertEquals(10_000, ids.size());
  }

  @Test
  void idsAreMonotonicallyIncreasing() {
    SnowflakeIdGenerator gen = new SnowflakeIdGenerator(2, 3);
    long prev = gen.nextId();
    for (int i = 0; i < 100; i++) {
      long next = gen.nextId();
      assertTrue(next > prev);
      prev = next;
    }
  }
}
