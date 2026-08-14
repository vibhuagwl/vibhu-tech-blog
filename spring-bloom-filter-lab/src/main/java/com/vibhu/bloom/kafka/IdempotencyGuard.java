package com.vibhu.bloom.kafka;

import com.vibhu.bloom.core.BloomFilter;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Demonstrates the <strong>wrong</strong> vs <strong>right</strong> use of Bloom filters for
 * Kafka deduplication / idempotency.
 *
 * <p>Bloom alone is NOT a source of truth: a false positive would skip a never-seen event.
 * Correct pattern: Bloom as a cheap negative check, then Redis/DB unique constraint as truth.
 */
public final class IdempotencyGuard {

  private final BloomFilter<String> seenHints;
  private final Set<String> processedTruth = ConcurrentHashMap.newKeySet();

  public IdempotencyGuard(long expectedEvents, double fpp) {
    this.seenHints = new BloomFilter<>(expectedEvents, fpp);
  }

  /**
   * @return true if this is the first successful process of {@code eventId}
   */
  public boolean tryProcess(String eventId, Runnable handler) {
    Objects.requireNonNull(eventId);
    Objects.requireNonNull(handler);

    // Fast path: definitely never seen → process, then record.
    if (!seenHints.mightContain(eventId)) {
      handler.run();
      processedTruth.add(eventId);
      seenHints.add(eventId);
      return true;
    }

    // Maybe seen → must consult source of truth (Redis SET NX / DB UNIQUE).
    if (processedTruth.contains(eventId)) {
      return false; // duplicate
    }
    handler.run();
    processedTruth.add(eventId);
    seenHints.add(eventId);
    return true;
  }

  /** Anti-pattern for demos/tests — DO NOT use in production alone. */
  public boolean bloomOnlyWouldSkip(String eventId) {
    return seenHints.mightContain(eventId);
  }

  public int truthSize() {
    return processedTruth.size();
  }
}
