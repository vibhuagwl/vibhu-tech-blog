package com.vibhu.security.audit.store;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PiiAccessAuditRepository extends JpaRepository<PiiAccessAuditEntity, UUID> {

    List<PiiAccessAuditEntity> findByCustomerIdOrderByOccurredAtDesc(UUID customerId);
}
