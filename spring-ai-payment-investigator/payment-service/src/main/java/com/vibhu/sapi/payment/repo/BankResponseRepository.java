package com.vibhu.sapi.payment.repo;

import com.vibhu.sapi.payment.entity.BankResponseEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BankResponseRepository extends JpaRepository<BankResponseEntity, String> {}
