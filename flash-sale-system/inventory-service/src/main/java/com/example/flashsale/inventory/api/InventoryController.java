package com.example.flashsale.inventory.api;

import com.example.flashsale.inventory.domain.model.Inventory;
import com.example.flashsale.inventory.domain.repository.InventoryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {

    private final InventoryRepository inventoryRepository;

    public InventoryController(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    @GetMapping("/{productId}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable String productId) {
        return inventoryRepository.findById(productId)
                .map(this::toBody)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound()
                        .build());
    }

    private Map<String, Object> toBody(Inventory i) {
        return Map.of("productId",
                i.getProductId(),
                "available",
                i.getAvailableQuantity(),
                "reserved",
                i.getReservedQuantity(),
                "sold",
                i.getSoldQuantity(),
                "initial",
                i.getInitialQuantity());
    }
}
