package com.vibhu.multitenant.tenant;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantConfigurationRepository extends JpaRepository<TenantConfigurationEntity, UUID> {}
