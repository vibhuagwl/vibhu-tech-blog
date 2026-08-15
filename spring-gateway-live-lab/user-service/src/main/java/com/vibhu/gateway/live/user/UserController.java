package com.vibhu.gateway.live.user;

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
 * Downstream User Service — interview Phase 1.
 * Clients should hit Gateway /api/users/**, not this port directly in production.
 */
@RestController
@RequestMapping("/users")
public class UserController {

  @Value("${INSTANCE_ID:user-service-1}")
  private String instanceId;

  @GetMapping("/{id}")
  public Map<String, Object> getUser(
      @PathVariable long id,
      @RequestHeader(value = "X-Correlation-ID", required = false) String correlationId) {
    if (id <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id must be positive");
    }
    return Map.of(
        "service", "user-service",
        "instance", instanceId,
        "id", id,
        "name", "User-" + id,
        "correlationId", correlationId == null ? "" : correlationId);
  }

  @GetMapping
  public Map<String, Object> list() {
    return Map.of(
        "service", "user-service",
        "instance", instanceId,
        "users", java.util.List.of(
            Map.of("id", 101, "name", "User-101"),
            Map.of("id", 102, "name", "User-102")));
  }
}
