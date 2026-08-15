package com.vibhu.multitenant.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class TenantMetrics {

  private final MeterRegistry registry;

  public TenantMetrics(MeterRegistry registry) {
    this.registry = registry;
  }

  public void request(String tenantSlug, String endpoint) {
    Counter.builder("tenant.requests")
        .tag("tenant", sanitize(tenantSlug))
        .tag("endpoint", endpoint)
        .register(registry)
        .increment();
  }

  public void error(String tenantSlug) {
    Counter.builder("tenant.errors")
        .tag("tenant", sanitize(tenantSlug))
        .register(registry)
        .increment();
  }

  /**
   * High-cardinality warning: tagging every tenant on Prometheus blows series count at 100k
   * tenants. Prefer sampling, top-N exporters, or logs for rare tenants.
   */
  private String sanitize(String slug) {
    if (slug == null) {
      return "unknown";
    }
    return slug.length() > 64 ? slug.substring(0, 64) : slug;
  }
}
