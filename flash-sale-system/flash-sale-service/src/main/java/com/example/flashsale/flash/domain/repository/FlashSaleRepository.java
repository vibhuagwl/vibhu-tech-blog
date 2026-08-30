package com.example.flashsale.flash.domain.repository;

import com.example.flashsale.flash.domain.model.FlashSale;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FlashSaleRepository extends JpaRepository<FlashSale, String> {
}
