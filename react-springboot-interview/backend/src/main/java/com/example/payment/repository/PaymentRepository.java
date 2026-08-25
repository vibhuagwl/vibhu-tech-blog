package com.example.payment.repository;

import com.example.payment.entity.Payment;
import com.example.payment.entity.PaymentStatus;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByIdempotencyKey(String idempotencyKey);

    long countByStatus(PaymentStatus status);

    @EntityGraph(attributePaths = "customer")
    @Query(
            value = """
                    SELECT p FROM Payment p
                    JOIN p.customer c
                    WHERE (:status IS NULL OR p.status = :status)
                      AND (:customerId IS NULL OR c.id = :customerId)
                      AND (
                            :q IS NULL OR :q = '' OR
                            LOWER(p.reference) LIKE LOWER(CONCAT('%', :q, '%')) OR
                            LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%')) OR
                            LOWER(c.email) LIKE LOWER(CONCAT('%', :q, '%'))
                          )
                    """,
            countQuery = """
                    SELECT COUNT(p) FROM Payment p
                    JOIN p.customer c
                    WHERE (:status IS NULL OR p.status = :status)
                      AND (:customerId IS NULL OR c.id = :customerId)
                      AND (
                            :q IS NULL OR :q = '' OR
                            LOWER(p.reference) LIKE LOWER(CONCAT('%', :q, '%')) OR
                            LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%')) OR
                            LOWER(c.email) LIKE LOWER(CONCAT('%', :q, '%'))
                          )
                    """
    )
    Page<Payment> search(
            @Param("status") PaymentStatus status,
            @Param("customerId") Long customerId,
            @Param("q") String q,
            Pageable pageable
    );

    @EntityGraph(attributePaths = "customer")
    @Query("SELECT p FROM Payment p WHERE p.id = :id")
    Optional<Payment> findByIdWithCustomer(@Param("id") Long id);
}
