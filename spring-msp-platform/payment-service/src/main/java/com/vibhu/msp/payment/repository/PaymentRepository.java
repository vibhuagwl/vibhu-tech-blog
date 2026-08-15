package com.vibhu.msp.payment.repository;

import com.vibhu.msp.payment.entity.PaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<PaymentEntity, String> {}
