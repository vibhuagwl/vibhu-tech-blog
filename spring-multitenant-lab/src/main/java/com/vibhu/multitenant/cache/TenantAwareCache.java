package com.vibhu.multitenant.cache;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

/**
 * Cache keys MUST include tenant id to prevent leakage across tenants.
 *
 * <p>Bad: {@code user:123} — Good: {@code tenant:{tenantId}:user:123}
 */
public interface TenantAwareCache {

  <T> Optional<T> get(UUID tenantId, String key, Class<T> type);

  void put(UUID tenantId, String key, Object value, Duration ttl);

  void evict(UUID tenantId, String key);

  void evictTenant(UUID tenantId);

  static String namespaced(UUID tenantId, String key) {
    return "tenant:" + tenantId + ":" + key;
  }
}
