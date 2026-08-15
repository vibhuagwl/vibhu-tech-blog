package com.vibhu.bloom.service;

import com.vibhu.bloom.core.BloomFilter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;

public class BloomFilterMetrics {

  public BloomFilterMetrics(MeterRegistry registry, BloomFilter<String> filter) {
    Gauge.builder("bloom.inserted", filter, BloomFilter::insertedCount).register(registry);
    Gauge.builder("bloom.lookups", filter, BloomFilter::lookupCount).register(registry);
    Gauge.builder("bloom.maybe_hits", filter, BloomFilter::maybeHitCount).register(registry);
    Gauge.builder("bloom.definite_misses", filter, BloomFilter::definiteMissCount)
        .register(registry);
    Gauge.builder("bloom.estimated_fpp", filter, BloomFilter::estimatedFalsePositiveRate)
        .register(registry);
    Gauge.builder("bloom.bit_cardinality", filter, f -> f.cardinality()).register(registry);
    Gauge.builder("bloom.memory_bytes", filter, f -> f.config().memoryBytes()).register(registry);
  }
}
