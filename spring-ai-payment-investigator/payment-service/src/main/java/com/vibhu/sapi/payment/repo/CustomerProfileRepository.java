package com.vibhu.sapi.payment.repo;

import com.vibhu.sapi.payment.entity.CustomerProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerProfileRepository extends JpaRepository<CustomerProfileEntity, String> {}
