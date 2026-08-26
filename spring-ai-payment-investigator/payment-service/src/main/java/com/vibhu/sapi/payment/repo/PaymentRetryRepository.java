package com.vibhu.sapi.payment.repo;

import com.vibhu.sapi.payment.entity.PaymentRetryEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRetryRepository extends JpaRepository<PaymentRetryEntity, Long> {
  List<PaymentRetryEntity> findByPaymentIdOrderByAttemptAsc(String paymentId);
}
