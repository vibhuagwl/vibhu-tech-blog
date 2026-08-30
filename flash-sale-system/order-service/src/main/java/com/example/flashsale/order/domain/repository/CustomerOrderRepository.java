package com.example.flashsale.order.domain.repository;

import com.example.flashsale.order.domain.model.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, String> {
}
