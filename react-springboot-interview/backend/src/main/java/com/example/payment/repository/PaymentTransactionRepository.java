package com.example.payment.repository;

import com.example.payment.entity.PaymentTransaction;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    @Query("""
            SELECT t FROM PaymentTransaction t
            WHERE t.payment.id = :paymentId
            ORDER BY t.createdAt ASC
            """)
    List<PaymentTransaction> findByPaymentIdOrderByCreatedAtAsc(@Param("paymentId") Long paymentId);
}
