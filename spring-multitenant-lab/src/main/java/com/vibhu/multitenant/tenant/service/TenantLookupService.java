package com.vibhu.multitenant.tenant.service;

import com.vibhu.multitenant.common.TenantStatus;
import com.vibhu.multitenant.exception.TenantExceptions;
import com.vibhu.multitenant.tenant.TenantEntity;
import com.vibhu.multitenant.tenant.TenantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantLookupService {

  private final TenantRepository tenants;

  public TenantLookupService(TenantRepository tenants) {
    this.tenants = tenants;
  }

  @Transactional(readOnly = true)
  public TenantEntity requireActive(String slug) {
    TenantEntity tenant =
        tenants.findBySlug(slug.toLowerCase()).orElseThrow(() -> TenantExceptions.unknown(slug));
    if (tenant.getStatus() == TenantStatus.SUSPENDED
        || tenant.getStatus() == TenantStatus.DEACTIVATED
        || tenant.getStatus() == TenantStatus.DELETED) {
      throw TenantExceptions.suspended(slug);
    }
    if (tenant.getStatus() == TenantStatus.PROVISIONING
        || tenant.getStatus() == TenantStatus.PROVISIONING_FAILED) {
      throw new com.vibhu.multitenant.exception.MultiTenantException(
          "tenant_not_ready", "Tenant is not ACTIVE yet: " + slug, 409);
    }
    return tenant;
  }
}
