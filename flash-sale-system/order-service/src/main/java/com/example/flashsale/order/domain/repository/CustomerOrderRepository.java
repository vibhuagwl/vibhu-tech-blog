package com.example.flashsale.order.domain.repository;

import com.example.flashsale.order.domain.model.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, String> {
    Optional<CustomerOrder> findByUserIdAndFlashSaleIdAndProductId(String userId, String flashSaleId, String productId);
}
