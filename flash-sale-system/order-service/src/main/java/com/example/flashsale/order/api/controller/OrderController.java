package com.example.flashsale.order.api.controller;

import com.example.flashsale.order.application.saga.SagaOrchestrator;
import com.example.flashsale.order.domain.repository.CustomerOrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private final CustomerOrderRepository orders;
    private final SagaOrchestrator saga;

    public OrderController(CustomerOrderRepository orders, SagaOrchestrator saga) {
        this.orders = orders;
        this.saga = saga;
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<?> get(@PathVariable String orderId) {
        return orders.findById(orderId)
                .map(o -> Map.of("orderId",
                        o.getOrderId(),
                        "userId",
                        o.getUserId(),
                        "productId",
                        o.getProductId(),
                        "status",
                        o.getStatus()
                                .name()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound()
                        .build());
    }

    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<Void> cancel(@PathVariable String orderId) {
        saga.cancelByUser(orderId);
        return ResponseEntity.accepted()
                .build();
    }
}
