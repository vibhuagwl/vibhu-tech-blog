package com.vibhu.multitenant.cache;

import com.vibhu.multitenant.config.MultiTenantProperties;
import com.vibhu.multitenant.exception.TenantExceptions;
import com.vibhu.multitenant.tenant.context.TenantContext;
import com.vibhu.multitenant.tenant.service.TenantConfigService;
import java.time.Duration;
import org.springframework.stereotype.Component;

@Component
public class TenantRateLimiter {

  private final TenantAwareCache cache;
  private final TenantConfigService configs;
  private final MultiTenantProperties properties;

  public TenantRateLimiter(
      TenantAwareCache cache, TenantConfigService configs, MultiTenantProperties properties) {
    this.cache = cache;
    this.configs = configs;
    this.properties = properties;
  }

  public void checkAndIncrement() {
    var tenantId = TenantContext.requireTenantId();
    int limit = properties.getRateLimit().getDefaultPerMinute();
    try {
      limit = configs.getCurrent().getRateLimitPerMinute();
    } catch (Exception ignored) {
      // use default
    }
    String key = "rate-limit:" + (System.currentTimeMillis() / 60_000);
    Counter counter = cache.get(tenantId, key, Counter.class).orElse(new Counter(0));
    if (counter.count() >= limit) {
      throw TenantExceptions.rateLimited();
    }
    cache.put(tenantId, key, new Counter(counter.count() + 1), Duration.ofMinutes(2));
  }

  public record Counter(int count) {}
}
