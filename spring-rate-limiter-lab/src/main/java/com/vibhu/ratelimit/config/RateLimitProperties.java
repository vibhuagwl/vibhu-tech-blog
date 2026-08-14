package com.vibhu.ratelimit.config;

import com.vibhu.ratelimit.api.FailPolicy;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "rate-limit")
public record RateLimitProperties(
    String store,
    FailPolicy defaultFailPolicy,
    FailPolicy paymentFailPolicy,
    boolean filterEnabled,
    Redis redis
) {
  public RateLimitProperties {
    if (store == null || store.isBlank()) {
      store = "memory";
    }
    if (defaultFailPolicy == null) {
      defaultFailPolicy = FailPolicy.FAIL_OPEN;
    }
    if (paymentFailPolicy == null) {
      paymentFailPolicy = FailPolicy.FAIL_CLOSED;
    }
    if (redis == null) {
      redis = new Redis("localhost", 6379);
    }
  }

  public boolean redisEnabled() {
    return "redis".equalsIgnoreCase(store);
  }

  public record Redis(String host, int port) {
    public Redis {
      if (host == null || host.isBlank()) {
        host = "localhost";
      }
      if (port <= 0) {
        port = 6379;
      }
    }
  }
}
