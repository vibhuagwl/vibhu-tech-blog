package com.vibhu.multitenant.customer;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<CustomerEntity, UUID> {
  Optional<CustomerEntity> findByIdAndTenantId(UUID id, UUID tenantId);

  Page<CustomerEntity> findAllByTenantId(UUID tenantId, Pageable pageable);

  List<CustomerEntity> findAllByTenantId(UUID tenantId);
}
