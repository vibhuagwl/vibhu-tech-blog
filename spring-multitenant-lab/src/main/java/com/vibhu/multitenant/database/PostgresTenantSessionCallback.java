package com.vibhu.multitenant.database;

import com.vibhu.multitenant.tenant.context.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.hibernate.Session;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;

/**
 * Sets PostgreSQL session variable used by RLS policies:
 *
 * <pre>SET app.current_tenant = '&lt;uuid&gt;'</pre>
 *
 * Defense in depth: even if a repository forgets tenant_id, the database rejects cross-tenant rows.
 * Enabled only with profile {@code rls} / infra Postgres.
 */
@Component
@ConditionalOnProperty(name = "multitenant.rls.enabled", havingValue = "true")
public class PostgresTenantSessionCallback {

  @PersistenceContext private EntityManager entityManager;

  public void apply() {
    if (RequestContextHolder.getRequestAttributes() == null && TenantContext.get() == null) {
      return;
    }
    if (TenantContext.get() == null) {
      return;
    }
    String tenantId = TenantContext.requireTenantId().toString();
    Session session = entityManager.unwrap(Session.class);
    session.doWork(
        connection -> {
          try (var stmt = connection.createStatement()) {
            stmt.execute("SELECT set_config('app.current_tenant', '" + tenantId + "', true)");
          }
        });
  }
}
