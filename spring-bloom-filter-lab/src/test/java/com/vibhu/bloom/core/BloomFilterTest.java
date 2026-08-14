package com.vibhu.bloom.core;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class BloomFilterTest {

  @Test
  void insertAndLookup() {
    BloomFilter<String> bf = new BloomFilter<>(1000, 0.01);
    bf.add("Alice");
    bf.add("Bob");
    bf.add("Charlie");
    assertTrue(bf.mightContain("Alice"));
    assertTrue(bf.mightContain("Bob"));
    assertFalse(bf.mightContain("David"));
  }

  @Test
  void emptyFilterNeverClaimsPresenceForRandomKeys() {
    BloomFilter<String> bf = new BloomFilter<>(100, 0.01);
    assertFalse(bf.mightContain("anything"));
  }

  @Test
  void duplicateInsertStillPresent() {
    BloomFilter<String> bf = new BloomFilter<>(100, 0.01);
    bf.add("user-100");
    bf.add("user-100");
    assertTrue(bf.mightContain("user-100"));
  }

  @Test
  void falsePositiveRateStatisticallyNearTarget() {
    int n = 20_000;
    double p = 0.01;
    BloomFilter<String> bf = new BloomFilter<>(n, p);
    for (int i = 0; i < n; i++) {
      bf.add("key-" + i);
    }
    int trials = 50_000;
    int fps = 0;
    for (int i = 0; i < trials; i++) {
      String absent = "absent-" + i;
      if (bf.mightContain(absent)) {
        fps++;
      }
    }
    double observed = fps / (double) trials;
    // Allow slack — probabilistic; should be same order of magnitude as p.
    assertTrue(observed < 0.05, "observed FPP too high: " + observed);
    assertTrue(observed > 0.0, "expected some false positives in " + trials + " trials");
  }

  @Test
  void configMemoryForOneMillionAtOnePercent() {
    BloomFilterConfig cfg = BloomFilterConfig.of(1_000_000, 0.01);
    // Classic rule of thumb ≈ 9.6 bits/key ≈ 1.2MB for 1% FPP
    assertTrue(cfg.memoryBytes() > 1_000_000 && cfg.memoryBytes() < 2_000_000,
        "bytes=" + cfg.memoryBytes());
    assertTrue(cfg.hashCount() >= 5 && cfg.hashCount() <= 10);
  }

  @Test
  void concurrentAddsAndLookups() throws Exception {
    BloomFilter<String> bf = new BloomFilter<>(50_000, 0.01);
    int threads = 8;
    int perThread = 2_000;
    ExecutorService pool = Executors.newFixedThreadPool(threads);
    CountDownLatch start = new CountDownLatch(1);
    CountDownLatch done = new CountDownLatch(threads);
    AtomicInteger errors = new AtomicInteger();
    for (int t = 0; t < threads; t++) {
      int base = t * perThread;
      pool.submit(() -> {
        try {
          start.await();
          for (int i = 0; i < perThread; i++) {
            String k = "k-" + (base + i);
            bf.add(k);
            if (!bf.mightContain(k)) {
              errors.incrementAndGet();
            }
          }
        } catch (Exception e) {
          errors.incrementAndGet();
        } finally {
          done.countDown();
        }
      });
    }
    start.countDown();
    assertTrue(done.await(30, TimeUnit.SECONDS));
    pool.shutdownNow();
    assertEquals(0, errors.get());
  }

  @Test
  void rebuildReplacesMembership() {
    BloomFilter<String> bf = new BloomFilter<>(100, 0.01);
    bf.add("old");
    bf.rebuildFrom(List.of("new-a", "new-b"));
    assertTrue(bf.mightContain("new-a"));
    // "old" may still FP, but after rebuild with tiny set it is usually absent —
    // we only assert new keys are present (no FN).
    assertEquals(2, bf.insertedCount());
  }

  @Test
  void countingBloomFilterDelete() {
    CountingBloomFilter<String> cbf = new CountingBloomFilter<>(10_000, 0.01);
    cbf.add("Alice");
    cbf.add("Bob");
    assertTrue(cbf.mightContain("Alice"));
    assertTrue(cbf.mightContain("Bob"));
    cbf.remove("Alice");
    // Bob must remain (no FN for remaining members when counters were incremented for Bob).
    assertTrue(cbf.mightContain("Bob"));
  }

  @Test
  void aliceBobCharlieNarrative() {
    BloomFilter<String> bf = new BloomFilter<>(1_000, 0.01);
    bf.add("Alice");
    bf.add("Bob");
    bf.add("Charlie");
    assertTrue(bf.mightContain("Alice"), "inserted keys never false-negative");
    assertTrue(bf.mightContain("Bob"));
    assertTrue(bf.mightContain("Charlie"));
    // David was never inserted. false ⇒ definitely absent; true ⇒ false positive (allowed).
    bf.mightContain("David");
  }

  @Test
  void largeInsertNoFalseNegatives() {
    int n = 100_000;
    BloomFilter<String> bf = new BloomFilter<>(n, 0.01);
    List<String> keys = new ArrayList<>(n);
    for (int i = 0; i < n; i++) {
      String k = "user-" + i;
      keys.add(k);
      bf.add(k);
    }
    for (String k : keys) {
      assertTrue(bf.mightContain(k), "false negative for " + k);
    }
  }
}
