package com.example.flashsale.flash.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IdempotencyRecordRepository extends JpaRepository<IdempotencyRecord, Long> {
    Optional<IdempotencyRecord> findByUserIdAndOperationAndIdempotencyKey(
            String userId, String operation, String idempotencyKey);
}
