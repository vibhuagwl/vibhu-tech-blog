package com.vibhu.bloom.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "bloom")
public record BloomProperties(
    long expectedInsertions,
    double falsePositiveRate,
    int seedUsers
) {
  public BloomProperties {
    if (expectedInsertions <= 0) {
      expectedInsertions = 100_000;
    }
    if (falsePositiveRate <= 0 || falsePositiveRate >= 1) {
      falsePositiveRate = 0.01;
    }
    if (seedUsers < 0) {
      seedUsers = 0;
    }
  }
}
