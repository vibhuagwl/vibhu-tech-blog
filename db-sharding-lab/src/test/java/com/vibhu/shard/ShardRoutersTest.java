package com.vibhu.shard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;

class ShardRoutersTest {

  @Test
  void hashRouter_isDeterministicAndInRange() {
    var router = new HashShardRouter(4);
    int s = router.getShard("customer-1001");
    assertThat(s).isBetween(0, 3);
    assertThat(router.getShard("customer-1001")).isEqualTo(s);
  }

  @Test
  void hashRouter_rejectsBlank() {
    assertThatThrownBy(() -> new HashShardRouter(4).getShard(" "))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void hashRouter_changingN_remapsManyKeys() {
    var r4 = new HashShardRouter(4);
    var r8 = new HashShardRouter(8);
    // Interview point: hash % N remaps most keys when N changes.
    long differ =
        IntStream.range(0, 10_000)
            .mapToObj(i -> "cust-" + i)
            .filter(k -> r4.getShard(k) != r8.getShard(k))
            .count();
    assertThat(differ).isGreaterThan(1000);
  }

  @Test
  void consistentHash_addShard_movesOnlyFraction() {
    var router = new ConsistentHashShardRouter(List.of(0, 1, 2), 100);
    Map<String, Integer> prev = new java.util.HashMap<>();
    for (int i = 0; i < 5_000; i++) {
      String k = "cust-" + i;
      prev.put(k, router.getShard(k));
    }
    router.addShard(3);
    long moved =
        prev.entrySet().stream().filter(e -> router.getShard(e.getKey()) != e.getValue()).count();
    long onNew = prev.keySet().stream().filter(k -> router.getShard(k) == 3).count();
    assertThat(onNew).isGreaterThan(100);
    assertThat(moved).isEqualTo(onNew);
    assertThat(moved).isLessThan(5_000 / 2);
  }

  @Test
  void rangeRouter_bandsCustomers() {
    var router = RangeShardRouter.ofMillionBands(3);
    assertThat(router.getShard("1")).isEqualTo(0);
    assertThat(router.getShard("1000000")).isEqualTo(0);
    assertThat(router.getShard("1000001")).isEqualTo(1);
    assertThat(router.getShard("2500000")).isEqualTo(2);
  }

  @Test
  void directory_supportsMigration() {
    var dir = new DirectoryShardRouter(Map.of("tenant-a", 0, "tenant-b", 1), 0);
    assertThat(dir.getShard("tenant-a")).isEqualTo(0);
    dir.migrate("tenant-a", 2);
    assertThat(dir.getShard("tenant-a")).isEqualTo(2);
    assertThat(dir.getShard("unknown")).isEqualTo(0);
  }

  @Test
  void snowflake_idsUniqueAndEncodeShard() {
    var g0 = new SnowflakeIdGenerator(0);
    var g1 = new SnowflakeIdGenerator(1);
    Set<Long> ids = new HashSet<>();
    for (int i = 0; i < 500; i++) {
      long a = g0.nextId();
      long b = g1.nextId();
      assertThat(SnowflakeIdGenerator.extractShard(a)).isEqualTo(0);
      assertThat(SnowflakeIdGenerator.extractShard(b)).isEqualTo(1);
      assertThat(ids.add(a)).isTrue();
      assertThat(ids.add(b)).isTrue();
    }
  }
}
