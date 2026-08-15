package com.vibhu.gateway.live.order;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Downstream Order Service — instance + port for multi-replica demos. */
@RestController
@RequestMapping("/orders")
public class OrderController {

  @Value("${INSTANCE_ID:order-1}")
  private String instanceId;

  @Value("${server.port}")
  private int port;

  @GetMapping("/{id}")
  public Map<String, Object> getOrder(
      @PathVariable long id,
      @RequestHeader(value = "X-Correlation-ID", required = false) String correlationId) {
    if (id <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id must be positive");
    }
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("service", "order-service");
    body.put("instance", instanceId);
    body.put("port", port);
    body.put("id", id);
    body.put("userId", 101);
    body.put("status", "CONFIRMED");
    body.put("correlationId", correlationId == null ? "" : correlationId);
    return body;
  }

  @GetMapping
  public Map<String, Object> list() {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("service", "order-service");
    body.put("instance", instanceId);
    body.put("port", port);
    body.put(
        "orders",
        List.of(
            Map.of("id", 5001, "userId", 101, "status", "CONFIRMED"),
            Map.of("id", 5002, "userId", 102, "status", "PENDING")));
    return body;
  }
}
