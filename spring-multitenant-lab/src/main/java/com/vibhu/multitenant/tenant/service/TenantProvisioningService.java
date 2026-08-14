package com.vibhu.multitenant.tenant.service;

import com.vibhu.multitenant.common.DatabaseStrategy;
import com.vibhu.multitenant.common.TenantStatus;
import com.vibhu.multitenant.exception.MultiTenantException;
import com.vibhu.multitenant.tenant.TenantConfigurationEntity;
import com.vibhu.multitenant.tenant.TenantConfigurationRepository;
import com.vibhu.multitenant.tenant.TenantEntity;
import com.vibhu.multitenant.tenant.TenantRepository;
import com.vibhu.multitenant.user.UserEntity;
import com.vibhu.multitenant.user.UserRepository;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Tenant onboarding as a saga-style state machine. External resources (dedicated DB creation) are
 * simulated; failures leave the tenant in PROVISIONING_FAILED for retry.
 */
@Service
public class TenantProvisioningService {

  private final TenantRepository tenants;
  private final TenantConfigurationRepository configs;
  private final UserRepository users;
  private final PasswordEncoder passwordEncoder;

  public TenantProvisioningService(
      TenantRepository tenants,
      TenantConfigurationRepository configs,
      UserRepository users,
      PasswordEncoder passwordEncoder) {
    this.tenants = tenants;
    this.configs = configs;
    this.users = users;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional
  public TenantEntity provision(String name, String plan, String adminEmail, String adminPassword) {
    String slug = slugify(name);
    if (tenants.findBySlug(slug).isPresent()) {
      throw new MultiTenantException("tenant_exists", "Tenant already exists: " + slug, 409);
    }
    TenantEntity tenant = new TenantEntity();
    tenant.setId(UUID.randomUUID());
    tenant.setSlug(slug);
    tenant.setName(name);
    tenant.setPlan(plan == null ? "STANDARD" : plan.toUpperCase(Locale.ROOT));
    tenant.setStatus(TenantStatus.PROVISIONING);
    tenant.setDatabaseStrategy(chooseStrategy(plan));
    tenant.setRegion("us-east-1");
    tenant.setCreatedAt(Instant.now());
    tenant.setUpdatedAt(Instant.now());
    if (tenant.getDatabaseStrategy() == DatabaseStrategy.DEDICATED_DATABASE) {
      tenant.setDatabaseName("tenant_" + slug.replace('-', '_'));
    } else {
      tenant.setSchemaName("public");
    }
    tenants.save(tenant);

    try {
      // Simulate schema/DB provision + Flyway for dedicated tenants.
      if (tenant.getDatabaseStrategy() == DatabaseStrategy.DEDICATED_DATABASE) {
        provisionDedicatedDatabase(tenant);
      }
      TenantConfigurationEntity config = new TenantConfigurationEntity();
      config.setTenantId(tenant.getId());
      config.setUpdatedAt(Instant.now());
      if ("PREMIUM".equals(tenant.getPlan()) || "ENTERPRISE".equals(tenant.getPlan())) {
        config.setRateLimitPerMinute(5000);
        config.setMaxUsers(1000);
      }
      configs.save(config);

      UserEntity admin = new UserEntity();
      admin.setId(UUID.randomUUID());
      admin.setTenantId(tenant.getId());
      admin.setEmail(adminEmail.toLowerCase(Locale.ROOT));
      admin.setDisplayName(name + " Admin");
      admin.setPasswordHash(passwordEncoder.encode(adminPassword));
      admin.setRoles("ADMIN,USER");
      admin.setStatus("ACTIVE");
      admin.setCreatedAt(Instant.now());
      users.save(admin);

      tenant.setStatus(TenantStatus.ACTIVE);
      tenant.setUpdatedAt(Instant.now());
      return tenants.save(tenant);
    } catch (RuntimeException ex) {
      tenant.setStatus(TenantStatus.PROVISIONING_FAILED);
      tenant.setUpdatedAt(Instant.now());
      tenants.save(tenant);
      throw new MultiTenantException(
          "provisioning_failed", "Tenant provisioning failed: " + ex.getMessage(), 500);
    }
  }

  @Transactional
  public TenantEntity retry(UUID tenantId) {
    TenantEntity tenant =
        tenants
            .findById(tenantId)
            .orElseThrow(() -> new MultiTenantException("tenant_unknown", "Unknown tenant", 404));
    if (tenant.getStatus() != TenantStatus.PROVISIONING_FAILED) {
      throw new MultiTenantException("invalid_state", "Tenant is not PROVISIONING_FAILED", 409);
    }
    tenant.setStatus(TenantStatus.PROVISIONING);
    tenants.save(tenant);
    if (tenant.getDatabaseStrategy() == DatabaseStrategy.DEDICATED_DATABASE) {
      provisionDedicatedDatabase(tenant);
    }
    tenant.setStatus(TenantStatus.ACTIVE);
    tenant.setUpdatedAt(Instant.now());
    return tenants.save(tenant);
  }

  private DatabaseStrategy chooseStrategy(String plan) {
    if (plan != null && plan.equalsIgnoreCase("ENTERPRISE")) {
      return DatabaseStrategy.DEDICATED_DATABASE;
    }
    return DatabaseStrategy.SHARED_SCHEMA;
  }

  private void provisionDedicatedDatabase(TenantEntity tenant) {
    // Production: create DB/schema, run Flyway against that datasource, register in routing map.
    // Lab: validate name and keep metadata — shared H2 still stores rows with tenant_id.
    if (tenant.getDatabaseName() == null || tenant.getDatabaseName().isBlank()) {
      throw new IllegalStateException("Missing dedicated database name");
    }
  }

  private String slugify(String name) {
    return name.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
  }
}
