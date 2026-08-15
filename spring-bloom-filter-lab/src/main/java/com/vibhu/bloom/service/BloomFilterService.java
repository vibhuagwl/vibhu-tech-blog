package com.vibhu.bloom.service;

import com.vibhu.bloom.core.BloomFilter;
import com.vibhu.bloom.core.BloomFilterConfig;
import com.vibhu.bloom.user.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Owns the user-id Bloom filter lifecycle: startup load, incremental add, full rebuild.
 *
 * <p>Not a source of truth — only a negative cache accelerator.
 */
@Service
public class BloomFilterService {

  private static final Logger log = LoggerFactory.getLogger(BloomFilterService.class);

  private final BloomFilter<String> filter;
  private final BloomFilterConfig config;
  private final UserRepository users;
  private final AtomicReference<Instant> lastRebuild = new AtomicReference<>();

  public BloomFilterService(
      BloomFilter<String> filter, BloomFilterConfig config, UserRepository users) {
    this.filter = filter;
    this.config = config;
    this.users = users;
  }

  @Transactional(readOnly = true)
  public void rebuildFromDatabase() {
    List<String> ids = users.findAllIds();
    filter.rebuildFrom(ids);
    lastRebuild.set(Instant.now());
    log.info(
        "Bloom filter rebuilt: inserted={}, config={}, estimatedFpp={}",
        filter.insertedCount(),
        config,
        filter.estimatedFalsePositiveRate());
  }

  /** Called when a new user is persisted — keep the filter warm without full rebuild. */
  public void addUserId(String userId) {
    filter.add(userId);
  }

  public boolean mightContain(String userId) {
    return filter.mightContain(userId);
  }

  public BloomFilterStats stats() {
    return new BloomFilterStats(
        config.expectedInsertions(),
        config.falsePositiveRate(),
        config.bitSize(),
        config.hashCount(),
        config.memoryBytes(),
        filter.insertedCount(),
        filter.lookupCount(),
        filter.maybeHitCount(),
        filter.definiteMissCount(),
        filter.cardinality(),
        filter.estimatedFalsePositiveRate(),
        lastRebuild.get());
  }

  public record BloomFilterStats(
      long expectedInsertions,
      double configuredFpp,
      int bitSize,
      int hashCount,
      long memoryBytes,
      long inserted,
      long lookups,
      long maybeHits,
      long definiteMisses,
      int bitCardinality,
      double estimatedFpp,
      Instant lastRebuildAt) {}
}
