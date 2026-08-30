package com.example.flashsale.flash.application.service;

import com.example.flashsale.flash.domain.model.FlashSale;
import com.example.flashsale.flash.domain.repository.FlashSaleRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
public class FlashSaleQueryService {

    private final FlashSaleRepository sales;

    public FlashSaleQueryService(FlashSaleRepository sales) {
        this.sales = sales;
    }

    @Cacheable(cacheNames = "flashSales", key = "#saleId")
    public Optional<Map<String, Object>> getSale(String saleId) {
        return sales.findById(saleId)
                .map(FlashSaleQueryService::toView);
    }

    @CacheEvict(cacheNames = "flashSales", key = "#saleId")
    public void evict(String saleId) {
        // admin status change path
    }

    static Map<String, Object> toView(FlashSale sale) {
        return Map.of("saleId",
                sale.getSaleId(),
                "name",
                sale.getName(),
                "status",
                sale.getStatus()
                        .name(),
                "startsAt",
                sale.getStartsAt()
                        .toString(),
                "endsAt",
                sale.getEndsAt()
                        .toString());
    }
}
