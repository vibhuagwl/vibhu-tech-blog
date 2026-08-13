package com.vibhu.multitenant.payment;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<PaymentEntity, UUID> {
  Optional<PaymentEntity> findByIdAndTenantId(UUID id, UUID tenantId);

  List<PaymentEntity> findAllByTenantIdAndOrderId(UUID tenantId, UUID orderId);
}
