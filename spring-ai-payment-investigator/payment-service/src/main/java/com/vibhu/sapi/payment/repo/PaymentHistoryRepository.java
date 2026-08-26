package com.vibhu.sapi.payment.repo;

import com.vibhu.sapi.payment.entity.PaymentHistoryEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentHistoryRepository extends JpaRepository<PaymentHistoryEntity, Long> {
  List<PaymentHistoryEntity> findByPaymentIdOrderByOccurredAtAsc(String paymentId);
}
