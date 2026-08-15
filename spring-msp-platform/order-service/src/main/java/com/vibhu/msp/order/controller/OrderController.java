package com.vibhu.msp.order.controller;

import com.vibhu.msp.common.MspHeaders;
import com.vibhu.msp.order.entity.OrderEntity;
import com.vibhu.msp.order.service.OrderService;
import com.vibhu.msp.order.service.OrderService.CreateOrderLine;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

  private final OrderService orderService;

  public OrderController(OrderService orderService) {
    this.orderService = orderService;
  }

  @GetMapping("/health")
  public ResponseEntity<String> health() {
    return ResponseEntity.ok("order-service-ok");
  }

  @PostMapping
  public ResponseEntity<OrderResponse> createOrder(
      @RequestHeader(value = MspHeaders.IDEMPOTENCY_KEY, required = false) String idempotencyKey,
      @Valid @RequestBody CreateOrderRequest request) {
    List<CreateOrderLine> lines = request.lines().stream()
        .map(l -> new CreateOrderLine(l.sku(), l.quantity(), l.unitPrice()))
        .toList();
    OrderEntity order = orderService.createOrder(idempotencyKey, request.customerId(), lines);
    return ResponseEntity.ok(toResponse(order));
  }

  @GetMapping("/{orderId}")
  public ResponseEntity<OrderResponse> getOrder(@PathVariable String orderId) {
    OrderEntity order = orderService.getOrder(orderId);
    if (order == null) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok(toResponse(order));
  }

  private OrderResponse toResponse(OrderEntity order) {
    return new OrderResponse(
        order.getId(),
        order.getCustomerId(),
        order.getTotalAmount(),
        order.getStatus().name(),
        order.getCorrelationId()
    );
  }

  public record CreateOrderRequest(
      @NotBlank String customerId,
      @NotEmpty List<LineRequest> lines
  ) {
    public record LineRequest(
        @NotBlank String sku,
        @Positive int quantity,
        @NotNull BigDecimal unitPrice
    ) {}
  }

  public record OrderResponse(
      String orderId,
      String customerId,
      BigDecimal totalAmount,
      String status,
      String correlationId
  ) {}
}
