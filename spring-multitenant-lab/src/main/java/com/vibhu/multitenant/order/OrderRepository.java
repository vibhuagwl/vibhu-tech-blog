package com.vibhu.multitenant.order;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {
  Optional<OrderEntity> findByIdAndTenantId(UUID id, UUID tenantId);

  Page<OrderEntity> findAllByTenantId(UUID tenantId, Pageable pageable);

  long countByTenantId(UUID tenantId);
}
