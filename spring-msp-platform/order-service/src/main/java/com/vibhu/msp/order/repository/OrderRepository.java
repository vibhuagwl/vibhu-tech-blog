package com.vibhu.msp.order.repository;

import com.vibhu.msp.order.entity.OrderEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<OrderEntity, String> {
  Optional<OrderEntity> findByIdempotencyKey(String idempotencyKey);
}
