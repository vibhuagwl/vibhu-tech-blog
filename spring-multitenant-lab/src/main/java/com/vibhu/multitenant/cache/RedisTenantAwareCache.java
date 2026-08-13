package com.vibhu.multitenant.cache;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "multitenant.redis.enabled", havingValue = "true")
public class RedisTenantAwareCache implements TenantAwareCache {

  private final StringRedisTemplate redis;
  private final ObjectMapper mapper;

  public RedisTenantAwareCache(StringRedisTemplate redis, ObjectMapper mapper) {
    this.redis = redis;
    this.mapper = mapper;
  }

  @Override
  public <T> Optional<T> get(UUID tenantId, String key, Class<T> type) {
    try {
      String json = redis.opsForValue().get(TenantAwareCache.namespaced(tenantId, key));
      if (json == null) {
        return Optional.empty();
      }
      return Optional.of(mapper.readValue(json, type));
    } catch (Exception e) {
      return Optional.empty();
    }
  }

  @Override
  public void put(UUID tenantId, String key, Object value, Duration ttl) {
    try {
      redis
          .opsForValue()
          .set(
              TenantAwareCache.namespaced(tenantId, key),
              mapper.writeValueAsString(value),
              ttl.toMillis(),
              TimeUnit.MILLISECONDS);
    } catch (Exception ignored) {
      // Cache must not break the request path.
    }
  }

  @Override
  public void evict(UUID tenantId, String key) {
    redis.delete(TenantAwareCache.namespaced(tenantId, key));
  }

  @Override
  public void evictTenant(UUID tenantId) {
    // Production: SCAN tenant:{id}:* — lab uses Redis SCAN via keys for simplicity.
    var keys = redis.keys("tenant:" + tenantId + ":*");
    if (keys != null && !keys.isEmpty()) {
      redis.delete(keys);
    }
  }
}
