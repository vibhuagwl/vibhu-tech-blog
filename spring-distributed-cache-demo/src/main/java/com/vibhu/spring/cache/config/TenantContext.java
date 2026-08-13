package com.vibhu.spring.cache.config;

public final class TenantContext {
  private static final ThreadLocal<String> TENANT = new ThreadLocal<>();

  private TenantContext() {}

  public static void set(String tenantId) {
    TENANT.set(tenantId);
  }

  public static String get() {
    String t = TENANT.get();
    return t == null ? "default" : t;
  }

  public static void clear() {
    TENANT.remove();
  }
}
