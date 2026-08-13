package com.vibhu.multitenant.cache;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "multitenant.redis.enabled", havingValue = "false", matchIfMissing = true)
public class InMemoryTenantAwareCache implements TenantAwareCache {

  private final ConcurrentHashMap<String, Entry> store = new ConcurrentHashMap<>();
  private final ObjectMapper mapper;

  public InMemoryTenantAwareCache(ObjectMapper mapper) {
    this.mapper = mapper;
  }

  @Override
  public <T> Optional<T> get(UUID tenantId, String key, Class<T> type) {
    Entry entry = store.get(TenantAwareCache.namespaced(tenantId, key));
    if (entry == null) {
      return Optional.empty();
    }
    if (entry.expiresAt().isBefore(Instant.now())) {
      store.remove(TenantAwareCache.namespaced(tenantId, key));
      return Optional.empty();
    }
    return Optional.of(mapper.convertValue(entry.value(), type));
  }

  @Override
  public void put(UUID tenantId, String key, Object value, Duration ttl) {
    store.put(
        TenantAwareCache.namespaced(tenantId, key),
        new Entry(mapper.convertValue(value, Map.class), Instant.now().plus(ttl)));
  }

  @Override
  public void evict(UUID tenantId, String key) {
    store.remove(TenantAwareCache.namespaced(tenantId, key));
  }

  @Override
  public void evictTenant(UUID tenantId) {
    String prefix = "tenant:" + tenantId + ":";
    store.keySet().removeIf(k -> k.startsWith(prefix));
  }

  private record Entry(Object value, Instant expiresAt) {}
}
