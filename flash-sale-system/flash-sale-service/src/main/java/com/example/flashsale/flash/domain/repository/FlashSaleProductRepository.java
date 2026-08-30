package com.example.flashsale.flash.domain.repository;

import com.example.flashsale.flash.domain.model.FlashSaleProduct;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FlashSaleProductRepository extends JpaRepository<FlashSaleProduct, FlashSaleProduct.Pk> {
    List<FlashSaleProduct> findBySaleId(String saleId);

    boolean existsBySaleIdAndProductId(String saleId, String productId);
}
