package com.vibhu.multitenant.tenant.context;

import java.util.Objects;
import java.util.UUID;

/**
 * Request-scoped tenant identity.
 *
 * <p>ThreadLocal is correct for servlet request threads IF you always clear in a finally block.
 * It is NOT automatically inherited by:
 * <ul>
 *   <li>@Async / Executor thread pools</li>
 *   <li>CompletableFuture.supplyAsync without wrapping</li>
 *   <li>Kafka listener threads (must set from the message)</li>
 *   <li>Reactor/WebFlux (use Reactor Context, not ThreadLocal)</li>
 *   <li>Virtual threads are fine per-task as long as clear() runs</li>
 * </ul>
 * Thread-pool reuse without clear() causes the next request to see the previous tenant — a critical
 * cross-tenant leak.
 */
public final class TenantContext {

  private static final ThreadLocal<TenantSnapshot> CURRENT = new ThreadLocal<>();

  private TenantContext() {}

  public static void set(TenantSnapshot snapshot) {
    CURRENT.set(Objects.requireNonNull(snapshot, "tenant snapshot"));
  }

  public static TenantSnapshot get() {
    return CURRENT.get();
  }

  public static UUID requireTenantId() {
    TenantSnapshot snapshot = CURRENT.get();
    if (snapshot == null || snapshot.tenantId() == null) {
      throw new IllegalStateException("TenantContext is empty");
    }
    return snapshot.tenantId();
  }

  public static String requireTenantSlug() {
    TenantSnapshot snapshot = CURRENT.get();
    if (snapshot == null || snapshot.slug() == null) {
      throw new IllegalStateException("TenantContext is empty");
    }
    return snapshot.slug();
  }

  public static void clear() {
    CURRENT.remove();
  }

  public record TenantSnapshot(
      UUID tenantId, String slug, String status, String databaseStrategy, UUID userId, String roles) {}
}
