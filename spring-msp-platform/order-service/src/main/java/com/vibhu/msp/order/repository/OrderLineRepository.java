package com.vibhu.msp.order.repository;

import com.vibhu.msp.order.entity.OrderLineEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderLineRepository extends JpaRepository<OrderLineEntity, String> {
  List<OrderLineEntity> findByOrderId(String orderId);
}
