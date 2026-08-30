package com.example.flashsale.order.domain.repository;

import com.example.flashsale.order.domain.model.SagaTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SagaTransactionRepository extends JpaRepository<SagaTransaction, String> {
    Optional<SagaTransaction> findByOrderId(String orderId);
}
