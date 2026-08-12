package com.vibhu.lock.transaction;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionEventRepository extends JpaRepository<TransactionEventEntity, Long> {
}
