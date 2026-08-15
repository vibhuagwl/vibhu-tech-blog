package com.vibhu.msp.customer.repository;

import com.vibhu.msp.customer.entity.CustomerEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<CustomerEntity, String> {}
