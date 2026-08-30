package com.example.flashsale.flash.api.controller;

import com.example.flashsale.flash.api.dto.PurchaseAccepted;
import com.example.flashsale.flash.api.dto.PurchaseRequest;
import com.example.flashsale.flash.application.service.FlashSaleQueryService;
import com.example.flashsale.flash.application.service.SubmitPurchaseService;
import com.example.flashsale.flash.domain.repository.FlashSaleProductRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/flash-sales")
public class FlashSaleController {

    private final FlashSaleQueryService queryService;
    private final FlashSaleProductRepository products;
    private final SubmitPurchaseService submitPurchaseService;

    public FlashSaleController(FlashSaleQueryService queryService, FlashSaleProductRepository products,
            SubmitPurchaseService submitPurchaseService) {
        this.queryService = queryService;
        this.products = products;
        this.submitPurchaseService = submitPurchaseService;
    }

    @GetMapping("/{saleId}")
    public ResponseEntity<?> get(@PathVariable String saleId) {
        return queryService.getSale(saleId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound()
                        .build());
    }

    @GetMapping("/{saleId}/products")
    public ResponseEntity<?> products(@PathVariable String saleId) {
        return ResponseEntity.ok(products.findBySaleId(saleId)
                .stream()
                .map(p -> Map.of("productId", p.getProductId(), "name", p.getName(), "priceCents", p.getPriceCents()))
                .toList());
    }

    @PostMapping("/{saleId}/orders")
    public ResponseEntity<PurchaseAccepted> purchase(@PathVariable String saleId,
            @Valid @RequestBody PurchaseRequest request,
            @RequestHeader(value = "X-Forwarded-For", defaultValue = "127.0.0.1") String ip,
            Authentication authentication) {
        String userId = authentication != null ? authentication.getName() : "anonymous";
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(submitPurchaseService.submit(userId, saleId, ip, request));
    }
}
