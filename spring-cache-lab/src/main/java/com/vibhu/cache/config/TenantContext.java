package com.vibhu.cache.config;

public final class TenantContext {

  private static final ThreadLocal<String> TENANT = ThreadLocal.withInitial(() -> "default");

  private TenantContext() {}

  public static void setTenantId(String tenantId) {
    TENANT.set(tenantId == null || tenantId.isBlank() ? "default" : tenantId);
  }

  public static String getTenantId() {
    return TENANT.get();
  }

  public static void clear() {
    TENANT.remove();
  }
}
