package com.vibhu.msp.inventory.repository;

import com.vibhu.msp.inventory.entity.StockEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockRepository extends JpaRepository<StockEntity, String> {}
