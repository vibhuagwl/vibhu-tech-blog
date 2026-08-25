package com.vibhu.fai.payment;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, String> {
  List<Payment> findByAccountIdOrderByCreatedAtDesc(String accountId);
  List<Payment> findByTenantId(String tenantId);
}
