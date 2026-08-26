package com.vibhu.sapi.payment.repo;

import com.vibhu.sapi.payment.entity.PaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<PaymentEntity, String> {}
