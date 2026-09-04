package com.vibhu.connectionpool;

import java.time.Duration;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

/**
 * Immutable pool configuration. Prefer builder; all durations are validated.
 *
 * <p>Safety decision: acquisitionTimeout defaults to 30s (never wait forever unless
 * explicitly set to {@link Duration#ZERO} meaning "no wait" or negative meaning wait forever
 * is rejected — use {@code Duration.ofMillis(Long.MAX_VALUE)} only if you truly want unbounded).
 */
public final class ConnectionPoolConfig {
  private final int minPoolSize;
  private final int maxPoolSize;
  private final Duration acquisitionTimeout;
  private final Duration idleTimeout;
  private final Duration maxLifetime;
  private final Duration validationTimeout;
  private final int maxCreateRetries;
  private final int maxConcurrentCreators;
  private final int maxWaiters;
  private final boolean fair;
  private final Duration leakDetectionThreshold;
  private final Duration healthCheckInterval;
  private final Duration evictionInterval;
  private final Duration shutdownGracePeriod;
  private final boolean validateOnBorrow;
  private final boolean validateOnReturn;

  private ConnectionPoolConfig(Builder b) {
    this.minPoolSize = b.minPoolSize;
    this.maxPoolSize = b.maxPoolSize;
    this.acquisitionTimeout = b.acquisitionTimeout;
    this.idleTimeout = b.idleTimeout;
    this.maxLifetime = b.maxLifetime;
    this.validationTimeout = b.validationTimeout;
    this.maxCreateRetries = b.maxCreateRetries;
    this.maxConcurrentCreators = b.maxConcurrentCreators;
    this.maxWaiters = b.maxWaiters;
    this.fair = b.fair;
    this.leakDetectionThreshold = b.leakDetectionThreshold;
    this.healthCheckInterval = b.healthCheckInterval;
    this.evictionInterval = b.evictionInterval;
    this.shutdownGracePeriod = b.shutdownGracePeriod;
    this.validateOnBorrow = b.validateOnBorrow;
    this.validateOnReturn = b.validateOnReturn;
  }

  public static Builder builder() {
    return new Builder();
  }

  public int minPoolSize() {
    return minPoolSize;
  }

  public int maxPoolSize() {
    return maxPoolSize;
  }

  public Duration acquisitionTimeout() {
    return acquisitionTimeout;
  }

  public Duration idleTimeout() {
    return idleTimeout;
  }

  public Duration maxLifetime() {
    return maxLifetime;
  }

  public Duration validationTimeout() {
    return validationTimeout;
  }

  public int maxCreateRetries() {
    return maxCreateRetries;
  }

  public int maxConcurrentCreators() {
    return maxConcurrentCreators;
  }

  public int maxWaiters() {
    return maxWaiters;
  }

  public boolean fair() {
    return fair;
  }

  public Duration leakDetectionThreshold() {
    return leakDetectionThreshold;
  }

  public Duration healthCheckInterval() {
    return healthCheckInterval;
  }

  public Duration evictionInterval() {
    return evictionInterval;
  }

  public Duration shutdownGracePeriod() {
    return shutdownGracePeriod;
  }

  public boolean validateOnBorrow() {
    return validateOnBorrow;
  }

  public boolean validateOnReturn() {
    return validateOnReturn;
  }

  public long acquisitionTimeoutNanos() {
    return acquisitionTimeout.toNanos();
  }

  public static final class Builder {
    private int minPoolSize = 1;
    private int maxPoolSize = 10;
    private Duration acquisitionTimeout = Duration.ofSeconds(30);
    private Duration idleTimeout = Duration.ofMinutes(5);
    private Duration maxLifetime = Duration.ofMinutes(30);
    private Duration validationTimeout = Duration.ofSeconds(2);
    private int maxCreateRetries = 2;
    private int maxConcurrentCreators = 2;
    private int maxWaiters = 500;
    private boolean fair = false;
    private Duration leakDetectionThreshold = Duration.ZERO; // disabled
    private Duration healthCheckInterval = Duration.ofSeconds(30);
    private Duration evictionInterval = Duration.ofSeconds(30);
    private Duration shutdownGracePeriod = Duration.ofSeconds(10);
    private boolean validateOnBorrow = true;
    private boolean validateOnReturn = false;

    public Builder minPoolSize(int v) {
      this.minPoolSize = v;
      return this;
    }

    public Builder maxPoolSize(int v) {
      this.maxPoolSize = v;
      return this;
    }

    public Builder acquisitionTimeout(Duration v) {
      this.acquisitionTimeout = Objects.requireNonNull(v);
      return this;
    }

    public Builder idleTimeout(Duration v) {
      this.idleTimeout = Objects.requireNonNull(v);
      return this;
    }

    public Builder maxLifetime(Duration v) {
      this.maxLifetime = Objects.requireNonNull(v);
      return this;
    }

    public Builder validationTimeout(Duration v) {
      this.validationTimeout = Objects.requireNonNull(v);
      return this;
    }

    public Builder maxCreateRetries(int v) {
      this.maxCreateRetries = v;
      return this;
    }

    public Builder maxConcurrentCreators(int v) {
      this.maxConcurrentCreators = v;
      return this;
    }

    public Builder maxWaiters(int v) {
      this.maxWaiters = v;
      return this;
    }

    public Builder fair(boolean v) {
      this.fair = v;
      return this;
    }

    public Builder leakDetectionThreshold(Duration v) {
      this.leakDetectionThreshold = Objects.requireNonNull(v);
      return this;
    }

    public Builder healthCheckInterval(Duration v) {
      this.healthCheckInterval = Objects.requireNonNull(v);
      return this;
    }

    public Builder evictionInterval(Duration v) {
      this.evictionInterval = Objects.requireNonNull(v);
      return this;
    }

    public Builder shutdownGracePeriod(Duration v) {
      this.shutdownGracePeriod = Objects.requireNonNull(v);
      return this;
    }

    public Builder validateOnBorrow(boolean v) {
      this.validateOnBorrow = v;
      return this;
    }

    public Builder validateOnReturn(boolean v) {
      this.validateOnReturn = v;
      return this;
    }

    public ConnectionPoolConfig build() {
      if (minPoolSize < 0) {
        throw new IllegalArgumentException("minPoolSize >= 0");
      }
      if (maxPoolSize < 1) {
        throw new IllegalArgumentException("maxPoolSize >= 1");
      }
      if (minPoolSize > maxPoolSize) {
        throw new IllegalArgumentException("minPoolSize <= maxPoolSize");
      }
      if (maxConcurrentCreators < 1) {
        throw new IllegalArgumentException("maxConcurrentCreators >= 1");
      }
      if (maxWaiters < 0) {
        throw new IllegalArgumentException("maxWaiters >= 0");
      }
      if (maxCreateRetries < 0) {
        throw new IllegalArgumentException("maxCreateRetries >= 0");
      }
      if (acquisitionTimeout.isNegative()) {
        throw new IllegalArgumentException("acquisitionTimeout must be non-negative");
      }
      return new ConnectionPoolConfig(this);
    }
  }
}
