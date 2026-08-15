package com.vibhu.gateway.live.order;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Downstream Order Service — interview Phase 1.
 */
@RestController
@RequestMapping("/orders")
public class OrderController {

  @Value("${INSTANCE_ID:order-service-1}")
  private String instanceId;

  @GetMapping("/{id}")
  public Map<String, Object> getOrder(
      @PathVariable long id,
      @RequestHeader(value = "X-Correlation-ID", required = false) String correlationId) {
    if (id <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id must be positive");
    }
    return Map.of(
        "service", "order-service",
        "instance", instanceId,
        "id", id,
        "userId", 101,
        "status", "CONFIRMED",
        "correlationId", correlationId == null ? "" : correlationId);
  }

  @GetMapping
  public Map<String, Object> list() {
    return Map.of(
        "service", "order-service",
        "instance", instanceId,
        "orders", java.util.List.of(
            Map.of("id", 5001, "userId", 101, "status", "CONFIRMED"),
            Map.of("id", 5002, "userId", 102, "status", "PENDING")));
  }
}
