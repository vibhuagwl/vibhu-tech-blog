package com.vibhu.multitenant.exception;

public final class TenantExceptions {

  private TenantExceptions() {}

  public static MultiTenantException missing() {
    return new MultiTenantException("tenant_missing", "Tenant could not be resolved", 400);
  }

  public static MultiTenantException unknown(String slug) {
    return new MultiTenantException("tenant_unknown", "Unknown tenant: " + slug, 404);
  }

  public static MultiTenantException suspended(String slug) {
    return new MultiTenantException("tenant_suspended", "Tenant suspended: " + slug, 403);
  }

  public static MultiTenantException mismatch() {
    return new MultiTenantException(
        "tenant_mismatch", "JWT tenant does not match request tenant header/host", 403);
  }

  public static MultiTenantException forbidden() {
    return new MultiTenantException("tenant_forbidden", "Cross-tenant access denied", 403);
  }

  public static MultiTenantException notFound(String entity) {
    return new MultiTenantException("not_found", entity + " not found for current tenant", 404);
  }

  public static MultiTenantException rateLimited() {
    return new MultiTenantException("rate_limited", "Tenant rate limit exceeded", 429);
  }
}
