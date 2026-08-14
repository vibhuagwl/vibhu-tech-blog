package com.vibhu.multitenant.tenant.service;

import com.vibhu.multitenant.cache.TenantAwareCache;
import com.vibhu.multitenant.exception.TenantExceptions;
import com.vibhu.multitenant.tenant.TenantConfigurationEntity;
import com.vibhu.multitenant.tenant.TenantConfigurationRepository;
import com.vibhu.multitenant.tenant.context.TenantContext;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantConfigService {

  private final TenantConfigurationRepository configs;
  private final TenantAwareCache cache;

  public TenantConfigService(TenantConfigurationRepository configs, TenantAwareCache cache) {
    this.configs = configs;
    this.cache = cache;
  }

  @Transactional(readOnly = true)
  public TenantConfigurationEntity getCurrent() {
    UUID tenantId = TenantContext.requireTenantId();
    String key = "config";
    Optional<TenantConfigurationEntity> cached = cache.get(tenantId, key, TenantConfigurationEntity.class);
    if (cached.isPresent()) {
      return cached.get();
    }
    TenantConfigurationEntity config =
        configs.findById(tenantId).orElseThrow(() -> TenantExceptions.notFound("tenant config"));
    cache.put(tenantId, key, config, Duration.ofMinutes(5));
    return config;
  }

  @Transactional
  public TenantConfigurationEntity update(
      String currency, String timezone, String locale, Integer rateLimit, Integer maxUsers) {
    UUID tenantId = TenantContext.requireTenantId();
    TenantConfigurationEntity config =
        configs.findById(tenantId).orElseThrow(() -> TenantExceptions.notFound("tenant config"));
    if (currency != null) {
      config.setCurrency(currency);
    }
    if (timezone != null) {
      config.setTimezone(timezone);
    }
    if (locale != null) {
      config.setLocale(locale);
    }
    if (rateLimit != null) {
      config.setRateLimitPerMinute(rateLimit);
    }
    if (maxUsers != null) {
      config.setMaxUsers(maxUsers);
    }
    config.setUpdatedAt(Instant.now());
    TenantConfigurationEntity saved = configs.save(config);
    cache.evict(tenantId, "config");
    return saved;
  }
}
