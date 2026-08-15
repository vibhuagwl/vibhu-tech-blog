package com.vibhu.msp.inventory.repository;

import com.vibhu.msp.inventory.entity.ReservationEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservationRepository extends JpaRepository<ReservationEntity, String> {
  Optional<ReservationEntity> findByOrderId(String orderId);
}
